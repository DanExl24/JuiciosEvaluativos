<script setup lang="ts">
import Papa, { type ParseError, type ParseMeta } from 'papaparse'
import { computed, onMounted, ref } from 'vue'
import * as XLSX from 'xlsx'

import type { CsvMetadata, CsvRow, CsvSummary, LogPayload } from '../types/csv'
import { createImportFingerprint, saveImportedFile, wasFileAlreadyImported } from '../utils/importHistory'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

const emit = defineEmits<{
  (event: 'imported', ficha: string): void
  (event: 'open-imports'): void
  (event: 'deleted-ficha', ficha: string): void
}>()

const selectedFile = ref<File | null>(null)
const metadata = ref<CsvMetadata>({})
const columns = ref<string[]>([])
const rows = ref<CsvRow[]>([])
const parseErrors = ref<ParseError[]>([])
const parseMeta = ref<ParseMeta | null>(null)
const isParsing = ref(false)
const isImporting = ref(false)
const isDragActive = ref(false)
const importMessage = ref('')
const importError = ref('')
const deleteError = ref('')
const deleteMessage = ref('')
const isDeleting = ref(false)
const availableFichas = ref<string[]>([])
const selectedFichaToDelete = ref('')
const supportedFileExtensions = ['.csv', '.xlsx', '.xls']

const summary = computed<CsvSummary | null>(() => {
  if (!selectedFile.value) {
    return null
  }

  return {
    fileName: selectedFile.value.name,
    fileSize: selectedFile.value.size,
    rowCount: rows.value.length,
    columnCount: columns.value.length,
    metadataCount: Object.keys(metadata.value).length,
    columns: columns.value,
  }
})

function normalizeCell(value: string | undefined) {
  return (value ?? '').replace(/\uFEFF/g, '').trim()
}

function getFileExtension(fileName: string) {
  const normalizedFileName = fileName.trim().toLowerCase()
  const extensionIndex = normalizedFileName.lastIndexOf('.')
  return extensionIndex >= 0 ? normalizedFileName.slice(extensionIndex) : ''
}

function isSupportedFile(file: File) {
  return supportedFileExtensions.includes(getFileExtension(file.name))
}

function sanitizeRow(row: CsvRow): CsvRow {
  return Object.entries(row).reduce<CsvRow>((accumulator, [key, value]) => {
    const normalizedKey = key.trim()
    if (!normalizedKey) {
      return accumulator
    }

    accumulator[normalizedKey] = typeof value === 'string' ? value.trim() : ''
    return accumulator
  }, {})
}

function trimTrailingEmptyCells(cells: string[]) {
  let lastValueIndex = cells.length - 1

  while (lastValueIndex >= 0 && !normalizeCell(cells[lastValueIndex])) {
    lastValueIndex -= 1
  }

  return cells.slice(0, lastValueIndex + 1)
}

function normalizeColumns(headerRow: string[]) {
  const seen = new Map<string, number>()
  const trimmedHeaderRow = trimTrailingEmptyCells(headerRow)

  return trimmedHeaderRow.reduce<string[]>((accumulator, cell, index) => {
    const baseName = normalizeCell(cell) || `columna_${index + 1}`
    const repetitions = seen.get(baseName) ?? 0
    const columnName = repetitions === 0 ? baseName : `${baseName}_${repetitions + 1}`

    seen.set(baseName, repetitions + 1)
    accumulator.push(columnName)
    return accumulator
  }, [])
}

function findHeaderRowIndex(rawRows: string[][]) {
  const preferredIndex = rawRows.findIndex((row) =>
    row.some((cell) => normalizeCell(cell).toLowerCase() === 'tipo de documento'),
  )

  if (preferredIndex >= 0) {
    return preferredIndex
  }

  return rawRows.findIndex((row) => row.filter((cell) => normalizeCell(cell)).length >= 5)
}

function extractMetadata(rawRows: string[][]) {
  return rawRows.reduce<CsvMetadata>((accumulator, row) => {
    const key = normalizeCell(row[0])
    if (!key) {
      return accumulator
    }

    const value = row.map(normalizeCell).find((cell, index) => index > 0 && cell) ?? ''
    accumulator[key] = value
    return accumulator
  }, {})
}

function buildRows(rawRows: string[][], headerColumns: string[]) {
  return rawRows
    .map((rawRow) =>
      sanitizeRow(
        headerColumns.reduce<CsvRow>((accumulator, column, index) => {
          accumulator[column] = normalizeCell(trimTrailingEmptyCells(rawRow)[index])
          return accumulator
        }, {}),
      ),
    )
    .filter((row) => Object.values(row).some((value) => value !== ''))
}

function normalizeRawRows(rawRows: string[][]) {
  return rawRows
    .map((row) => row.map(normalizeCell))
    .filter((row) => row.some((cell) => cell !== ''))
}

function applyParsedRows(
  file: File,
  rawRows: string[][],
  errors: ParseError[] = [],
  meta: ParseMeta | null = null,
) {
  const normalizedRows = normalizeRawRows(rawRows)
  const headerRowIndex = findHeaderRowIndex(normalizedRows)

  if (headerRowIndex < 0) {
    throw new Error('No se encontro una fila de encabezados valida dentro del archivo.')
  }

  const headerColumns = normalizeColumns(normalizedRows[headerRowIndex] ?? [])

  metadata.value = extractMetadata(normalizedRows.slice(0, headerRowIndex))
  columns.value = headerColumns
  rows.value = buildRows(normalizedRows.slice(headerRowIndex + 1), headerColumns)
  parseErrors.value = errors
  parseMeta.value = meta
  selectedFile.value = file

  console.log('[IMPORT] Archivo convertido a estructura intermedia', {
    fileName: file.name,
    headerRowIndex,
    detectedColumns: headerColumns,
    metadata: metadata.value,
    totalNormalizedRows: normalizedRows.length,
    totalDataRows: rows.value.length,
    firstNormalizedRows: normalizedRows.slice(0, 5),
    firstJsonRows: rows.value.slice(0, 5),
    parseErrors: errors,
    parseMeta: meta,
  })
}

function buildExcelSheetRows(sheet: XLSX.WorkSheet) {
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  })

  return matrix.map((row) => row.map((cell) => normalizeCell(String(cell ?? ''))))
}

function findBestWorksheet(workbook: XLSX.WorkBook) {
  const workbookSheets = workbook.Workbook?.Sheets ?? []
  const visibleSheetNames = workbookSheets
    .filter((sheet) => !sheet.Hidden)
    .map((sheet) => sheet.name)
    .filter((sheetName): sheetName is string => typeof sheetName === 'string' && Boolean(workbook.Sheets[sheetName]))
  const candidateSheetNames =
    visibleSheetNames.length > 0
      ? visibleSheetNames
      : workbook.SheetNames.filter(
          (sheetName): sheetName is string =>
            typeof sheetName === 'string' && Boolean(workbook.Sheets[sheetName]),
        )

  for (const sheetName of candidateSheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      continue
    }

    const rawRows = normalizeRawRows(buildExcelSheetRows(sheet))
    if (findHeaderRowIndex(rawRows) >= 0) {
      return rawRows
    }
  }

  return [] as string[][]
}

function buildPayload(): LogPayload | null {
  if (!summary.value) {
    return null
  }

  return {
    fileName: summary.value.fileName,
    metadata: metadata.value,
    rows: rows.value,
    summary: summary.value,
    generatedAt: new Date().toISOString(),
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function fetchAvailableFichas() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/dashboard`)
    if (!response.ok) {
      throw new Error('No se pudo consultar las fichas disponibles.')
    }

    const data = (await response.json()) as { options?: { fichas?: string[] } }
    availableFichas.value = data.options?.fichas ?? []
  } catch {
    availableFichas.value = []
  }
}

async function importToDatabase() {
  const payload = buildPayload()
  if (!payload) {
    return
  }

  isImporting.value = true
  importError.value = ''
  importMessage.value = ''

  try {
    const fingerprint = await createImportFingerprint(payload)
    if (wasFileAlreadyImported(fingerprint)) {
      throw new Error('Este mismo archivo ya fue importado anteriormente.')
    }
    console.log('[IMPORT] Payload final antes de enviar al backend', payload)
    console.log('[IMPORT] Campos detectados que se envian al backend', {
      payloadKeys: Object.keys(payload),
      metadataKeys: Object.keys(payload.metadata),
      summaryKeys: Object.keys(payload.summary),
      rowKeys: Object.keys(payload.rows[0] ?? {}),
      firstRow: payload.rows[0] ?? null,
      totalRows: payload.rows.length,
    })
    const response = await fetch(`${apiBaseUrl}/api/import/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    console.log('[IMPORT] Respuesta HTTP cruda de la importacion', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    })

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as { error?: string } | null
      console.log('[IMPORT] Error devuelto por el backend durante la importacion', errorBody)
      throw new Error(errorBody?.error ?? 'No se pudo importar el archivo a la base de datos.')
    }

    const result = (await response.json()) as {
      ficha: string
      learners: number
      results: number
      judgements: number
    }

    console.log('[IMPORT] Respuesta JSON de la importacion', result)

    saveImportedFile(payload, result.ficha, fingerprint)
    importMessage.value = `Importacion completada para la ficha ${result.ficha}. Aprendices: ${result.learners}, resultados: ${result.results}, juicios: ${result.judgements}.`
    await fetchAvailableFichas()
    emit('imported', result.ficha)
  } catch (error) {
    importError.value =
      error instanceof Error ? error.message : 'Ocurrio un error inesperado al importar el archivo.'
  } finally {
    isImporting.value = false
  }
}

async function parseCsvFile(file: File) {
  const csvText = await file.text()
  console.log('[IMPORT] Archivo CSV recibido', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    preview: csvText.slice(0, 500),
  })
  const { data, errors, meta } = await new Promise<{
    data: string[][]
    errors: ParseError[]
    meta: ParseMeta
  }>((resolve, reject) => {
    Papa.parse<string[]>(csvText, {
      skipEmptyLines: false,
      complete: ({ data: parsedData, errors: parsedErrors, meta: parsedMeta }) => {
        resolve({ data: parsedData, errors: parsedErrors, meta: parsedMeta })
      },
      error: reject,
    })
  })

  console.log('[IMPORT] CSV parseado a matriz', {
    totalRows: data.length,
    firstRows: data.slice(0, 5),
    errors,
    meta,
  })

  applyParsedRows(file, data, errors, meta)
}

async function parseExcelFile(file: File) {
  console.log('[IMPORT] Archivo Excel recibido', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    extension: getFileExtension(file.name),
  })

  const fileBuffer = await file.arrayBuffer()
  console.log('[IMPORT] Buffer del Excel cargado', {
    byteLength: fileBuffer.byteLength,
  })

  const workbook = XLSX.read(fileBuffer, {
    type: 'array',
    cellDates: false,
    cellFormula: false,
  })
  console.log('[IMPORT] Respuesta de lectura del Excel con xlsx', {
    sheetNames: workbook.SheetNames,
    workbookSheets: workbook.Workbook?.Sheets ?? [],
  })
  const rawRows = findBestWorksheet(workbook)

  console.log('[IMPORT] Excel convertido a matriz antes de JSON', {
    totalRows: rawRows.length,
    firstRows: rawRows.slice(0, 5),
  })

  if (!rawRows.length) {
    throw new Error('No se encontro una hoja valida con encabezados reconocibles dentro del libro Excel.')
  }

  applyParsedRows(file, rawRows)
}

async function parseSelectedFile(file: File) {
  isParsing.value = true
  importMessage.value = ''
  importError.value = ''

  console.log('[IMPORT] Inicio de procesamiento del archivo seleccionado', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    extension: getFileExtension(file.name),
  })

  try {
    if (!isSupportedFile(file)) {
      throw new Error('Formato no soportado. Selecciona un archivo .csv, .xlsx o .xls.')
    }

    const extension = getFileExtension(file.name)

    if (extension === '.csv') {
      await parseCsvFile(file)
    } else {
      await parseExcelFile(file)
    }

    await importToDatabase()
  } catch (error) {
    metadata.value = {}
    columns.value = []
    rows.value = []
    parseErrors.value = []
    parseMeta.value = null
    selectedFile.value = file
    importError.value =
      error instanceof Error ? error.message : 'Ocurrio un error inesperado al leer el archivo.'
  } finally {
    isParsing.value = false
  }
}

function handleFileSelection(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  void parseSelectedFile(file)
  input.value = ''
}

function handleFileDrop(event: DragEvent) {
  isDragActive.value = false

  const file = event.dataTransfer?.files?.[0]
  if (!file) {
    return
  }

  void parseSelectedFile(file)
}

async function deleteFichaData() {
  if (!selectedFichaToDelete.value) {
    deleteError.value = 'Selecciona una ficha para eliminar sus datos.'
    deleteMessage.value = ''
    return
  }

  isDeleting.value = true
  deleteError.value = ''
  deleteMessage.value = ''

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/formations/${encodeURIComponent(selectedFichaToDelete.value)}`,
      { method: 'DELETE' },
    )

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as { error?: string } | null
      throw new Error(errorBody?.error ?? 'No se pudo eliminar la ficha seleccionada.')
    }

    deleteMessage.value = `Se eliminaron los datos asociados a la ficha ${selectedFichaToDelete.value}.`
    emit('deleted-ficha', selectedFichaToDelete.value)
    selectedFichaToDelete.value = ''
    await fetchAvailableFichas()
  } catch (error) {
    deleteError.value =
      error instanceof Error ? error.message : 'Ocurrio un error inesperado al eliminar la ficha.'
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  void fetchAvailableFichas()
})
</script>

<template>
  <main class="grid gap-6">
    <section class="relative overflow-hidden rounded-[2rem] border border-emerald-950/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(6,78,59,0.12)] backdrop-blur xl:p-8">
      <div class="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2),transparent_60%)]"></div>

      <div class="relative grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div class="space-y-5">
          <span class="inline-flex w-fit rounded-full border border-emerald-700/15 bg-emerald-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-emerald-700">
            Carga de archivo
          </span>
          <div class="space-y-3">
            <h2 class="max-w-[15ch] text-4xl font-black leading-none tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
              Importa una ficha y valida sus detalles antes de seguir.
            </h2>
            <p class="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              La importacion es incremental. Si el archivo coincide exactamente con una carga previa, el sistema lo bloquea por huella de contenido.
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-2xl border border-emerald-950/10 bg-white px-4 py-4">
              <p class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">Estado</p>
              <p class="mt-2 text-sm font-semibold text-slate-950">
                {{
                  isParsing
                    ? 'Parseando archivo'
                    : isImporting
                      ? 'Importando a la base de datos'
                      : 'Esperando un archivo'
                }}
              </p>
            </div>
            <div class="rounded-2xl border border-emerald-950/10 bg-white px-4 py-4">
              <p class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">Modalidad</p>
              <p class="mt-2 text-sm font-semibold text-slate-950">Upsert incremental por ficha</p>
            </div>
            <div class="rounded-2xl border border-emerald-950/10 bg-white px-4 py-4">
              <p class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">Historial</p>
              <button
                class="mt-2 inline-flex rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                type="button"
                @click="emit('open-imports')"
              >
                Ver importaciones
              </button>
            </div>
          </div>

          <p v-if="importMessage" class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {{ importMessage }}
          </p>
          <p v-if="importError" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {{ importError }}
          </p>
        </div>

        <div
          class="relative overflow-hidden rounded-[1.75rem] border border-dashed p-1 transition duration-200"
          :class="
            isDragActive
              ? 'border-emerald-500 bg-emerald-100/70 shadow-[0_0_0_1px_rgba(16,185,129,0.22)]'
              : 'border-emerald-800/20 bg-white/70'
          "
          @dragenter.prevent="isDragActive = true"
          @dragover.prevent="isDragActive = true"
          @dragleave.prevent="isDragActive = false"
          @drop.prevent="handleFileDrop"
        >
          <div class="relative flex min-h-[24rem] flex-col justify-between rounded-[1.45rem] border border-white/70 bg-[radial-gradient(circle_at_top,rgba(167,243,208,0.55),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(236,253,245,0.88))] px-6 py-6">
            <div class="space-y-5 text-center">
              <div class="mx-auto grid h-20 w-20 place-items-center rounded-[1.5rem] bg-gradient-to-br from-emerald-700 via-emerald-600 to-lime-500 text-lg font-black text-white shadow-[0_20px_40px_rgba(5,150,105,0.35)]">
                XLS
              </div>
              <div class="space-y-2">
                <h3 class="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Importar una ficha</h3>
                <p class="mx-auto max-w-md text-sm leading-7 text-slate-600">
                  Arrastra el archivo o seleccionalo manualmente. El sistema acepta .csv, .xlsx y .xls, detecta metadatos, encabezados y filas antes de insertar.
                </p>
              </div>

              <label class="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-emerald-700">
                Seleccionar archivo
                <input
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  type="file"
                  class="sr-only"
                  @change="handleFileSelection"
                />
              </label>
            </div>

            <div class="grid gap-3">
              <div v-if="summary" class="grid gap-3 sm:grid-cols-3">
                <div class="rounded-2xl bg-slate-950 px-4 py-3 text-white">
                  <p class="text-[0.7rem] uppercase tracking-[0.2em] text-emerald-300">Archivo</p>
                  <p class="mt-2 truncate text-sm font-semibold">{{ summary.fileName }}</p>
                  <p class="mt-1 text-xs text-slate-300">{{ formatBytes(summary.fileSize) }}</p>
                </div>
                <div class="rounded-2xl border border-emerald-950/10 bg-white px-4 py-3">
                  <p class="text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">Filas</p>
                  <p class="mt-2 text-2xl font-black text-slate-950">{{ summary.rowCount }}</p>
                </div>
                <div class="rounded-2xl border border-emerald-950/10 bg-white px-4 py-3">
                  <p class="text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">Columnas</p>
                  <p class="mt-2 text-2xl font-black text-slate-950">{{ summary.columnCount }}</p>
                </div>
              </div>

              <div v-if="parseErrors.length" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                El archivo presenta {{ parseErrors.length }} observaciones de parseo. Revisa el historial o el origen si notas inconsistencias.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-[2rem] border border-rose-200 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:p-7">
      <div class="flex flex-col gap-4 border-b border-rose-200/70 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span class="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-rose-700">Pruebas de carga</span>
          <h3 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">Borrar datos de una ficha</h3>
          <p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Elimina de la base de datos todos los registros asociados a una ficha de caracterizacion para repetir pruebas de importacion.
          </p>
        </div>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
        <label class="grid gap-2">
          <span class="text-sm font-medium text-slate-700">Ficha a eliminar</span>
          <select
            v-model="selectedFichaToDelete"
            class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-500"
          >
            <option value="">Selecciona una ficha</option>
            <option v-for="ficha in availableFichas" :key="ficha" :value="ficha">
              {{ ficha }}
            </option>
          </select>
        </label>

        <button
          class="self-end rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          type="button"
          :disabled="!selectedFichaToDelete || isDeleting"
          @click="deleteFichaData"
        >
          {{ isDeleting ? 'Eliminando...' : 'Borrar datos de la ficha' }}
        </button>
      </div>

      <p v-if="deleteMessage" class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        {{ deleteMessage }}
      </p>
      <p v-if="deleteError" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
        {{ deleteError }}
      </p>
    </section>
  </main>
</template>
