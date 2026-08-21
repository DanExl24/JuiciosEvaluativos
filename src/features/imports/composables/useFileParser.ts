import { ref, computed } from 'vue'
import Papa, { type ParseError, type ParseMeta } from 'papaparse'
import * as XLSX from 'xlsx'
import type { CsvMetadata, CsvRow, CsvSummary, LogPayload } from '../../../types/csv'

export function useFileParser() {
  const selectedFile = ref<File | null>(null)
  const metadata = ref<CsvMetadata>({})
  const columns = ref<string[]>([])
  const rows = ref<CsvRow[]>([])
  const parseErrors = ref<ParseError[]>([])
  const parseMeta = ref<ParseMeta | null>(null)
  const isParsing = ref(false)
  const parseError = ref('')

  const supportedFileExtensions = ['.csv', '.xlsx', '.xls']

  const summary = computed<CsvSummary | null>(() => {
    if (!selectedFile.value) return null
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
    const normalized = fileName.trim().toLowerCase()
    const index = normalized.lastIndexOf('.')
    return index >= 0 ? normalized.slice(index) : ''
  }

  function isSupportedFile(file: File) {
    return supportedFileExtensions.includes(getFileExtension(file.name))
  }

  function sanitizeRow(row: CsvRow): CsvRow {
    return Object.entries(row).reduce<CsvRow>((accumulator, [key, value]) => {
      const normalizedKey = key.trim()
      if (!normalizedKey) return accumulator
      accumulator[normalizedKey] = typeof value === 'string' ? value.trim() : ''
      return accumulator
    }, {})
  }

  function trimTrailingEmptyCells(cells: string[]) {
    let lastIndex = cells.length - 1
    while (lastIndex >= 0 && !normalizeCell(cells[lastIndex])) {
      lastIndex -= 1
    }
    return cells.slice(0, lastIndex + 1)
  }

  function normalizeColumns(headerRow: string[]) {
    const seen = new Map<string, number>()
    const trimmed = trimTrailingEmptyCells(headerRow)

    return trimmed.reduce<string[]>((acc, cell, index) => {
      const baseName = normalizeCell(cell) || `columna_${index + 1}`
      const reps = seen.get(baseName) ?? 0
      const colName = reps === 0 ? baseName : `${baseName}_${reps + 1}`
      seen.set(baseName, reps + 1)
      acc.push(colName)
      return acc
    }, [])
  }

  function findHeaderRowIndex(rawRows: string[][]) {
    const preferredIndex = rawRows.findIndex((row) =>
      row.some((cell) => normalizeCell(cell).toLowerCase() === 'tipo de documento'),
    )
    if (preferredIndex >= 0) return preferredIndex
    return rawRows.findIndex((row) => row.filter((cell) => normalizeCell(cell)).length >= 5)
  }

  function extractMetadata(rawRows: string[][]) {
    return rawRows.reduce<CsvMetadata>((accumulator, row) => {
      const key = normalizeCell(row[0])
      if (!key) return accumulator
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
      throw new Error('No se encontró una fila de encabezados válida dentro del archivo.')
    }

    const headerColumns = normalizeColumns(normalizedRows[headerRowIndex] ?? [])

    metadata.value = extractMetadata(normalizedRows.slice(0, headerRowIndex))
    columns.value = headerColumns
    rows.value = buildRows(normalizedRows.slice(headerRowIndex + 1), headerColumns)
    parseErrors.value = errors
    parseMeta.value = meta
    selectedFile.value = file
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
      if (!sheet) continue
      const rawRows = normalizeRawRows(buildExcelSheetRows(sheet))
      if (findHeaderRowIndex(rawRows) >= 0) return rawRows
    }
    return [] as string[][]
  }

  async function parseCsvFile(file: File) {
    const csvText = await file.text()
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
    applyParsedRows(file, data, errors, meta)
  }

  async function parseExcelFile(file: File) {
    const fileBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(fileBuffer, {
      type: 'array',
      cellDates: false,
      cellFormula: false,
    })
    const rawRows = findBestWorksheet(workbook)
    if (!rawRows.length) {
      throw new Error('No se encontró una hoja válida con encabezados reconocibles dentro del libro Excel.')
    }
    applyParsedRows(file, rawRows)
  }

  async function parseFile(file: File) {
    isParsing.value = true
    parseError.value = ''
    try {
      if (!isSupportedFile(file)) {
        throw new Error('Formato no compatible. Por favor sube un archivo CSV (.csv) o Excel (.xlsx, .xls).')
      }
      const extension = getFileExtension(file.name)
      if (extension === '.csv') {
        await parseCsvFile(file)
      } else {
        await parseExcelFile(file)
      }
    } catch (err) {
      parseError.value = err instanceof Error ? err.message : 'Error al procesar el archivo'
      selectedFile.value = null
      rows.value = []
      columns.value = []
      metadata.value = {}
      throw err
    } finally {
      isParsing.value = false
    }
  }

  function buildPayload(): LogPayload | null {
    if (!summary.value) return null
    return {
      fileName: summary.value.fileName,
      metadata: metadata.value,
      rows: rows.value,
      summary: summary.value,
      generatedAt: new Date().toISOString(),
    }
  }

  function resetParser() {
    selectedFile.value = null
    metadata.value = {}
    columns.value = []
    rows.value = []
    parseErrors.value = []
    parseMeta.value = null
    parseError.value = ''
  }

  return {
    selectedFile,
    metadata,
    columns,
    rows,
    parseErrors,
    parseMeta,
    isParsing,
    parseError,
    summary,
    parseFile,
    buildPayload,
    resetParser,
  }
}
