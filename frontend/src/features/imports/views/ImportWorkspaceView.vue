<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useFileParser } from '../composables/useFileParser'
import { importService } from '../services/import.service'
import { createImportFingerprint, useImportHistoryStore } from '../stores/importHistory.store'
import { useAcademicContextStore } from '../../../stores/academicContext.store'
import { formatBytes } from '../../../utils/formatters/number'

import { ApiError } from '../../../services/api/errors'
import type { ReportInconsistencyDetails } from '../types/import.types'

const emit = defineEmits<{
  (event: 'imported', ficha: string): void
  (event: 'open-imports'): void
  (event: 'deleted-ficha', ficha: string): void
}>()

const {
  columns,
  rows,
  isParsing,
  parseError,
  summary,
  parseFile,
  buildPayload,
  resetParser,
} = useFileParser()

const historyStore = useImportHistoryStore()
const academicStore = useAcademicContextStore()

const isImporting = ref(false)
const isDragActive = ref(false)
const importMessage = ref('')
const importError = ref('')
const deleteError = ref('')
const deleteMessage = ref('')
const isDeleting = ref(false)
const availableFichas = ref<string[]>([])
const selectedFichaToDelete = ref('')
const showManageFichas = ref(false)
const inconsistencyDetails = ref<ReportInconsistencyDetails | null>(null)
const showInconsistencyList = ref(false)

async function fetchAvailableFichas() {
  try {
    availableFichas.value = await importService.getAvailableFichas()
  } catch {
    availableFichas.value = []
  }
}

async function handleFileDrop(event: DragEvent) {
  isDragActive.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    await processSelectedFile(file)
  }
}

async function handleFileSelection(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    await processSelectedFile(file)
    input.value = ''
  }
}

async function processSelectedFile(file: File) {
  importMessage.value = ''
  importError.value = ''
  inconsistencyDetails.value = null
  showInconsistencyList.value = false
  try {
    await parseFile(file)
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Error al procesar el archivo seleccionado.'
  }
}

async function importToDatabase() {
  const payload = buildPayload()
  if (!payload) return

  isImporting.value = true
  importError.value = ''
  importMessage.value = ''
  inconsistencyDetails.value = null
  showInconsistencyList.value = false

  try {
    const fingerprint = await createImportFingerprint(payload)
    if (historyStore.wasAlreadyImported(fingerprint)) {
      throw new Error('Este mismo archivo ya fue importado anteriormente en el sistema.')
    }

    const result = await importService.importCsv(payload)

    historyStore.saveEntry(payload, result.ficha, fingerprint)
    academicStore.setFicha(result.ficha)
    academicStore.notifyRefresh()

    importMessage.value = `¡Importación exitosa! Ficha ${result.ficha} registrada con ${result.learners} aprendices, ${result.results} resultados y ${result.judgements} juicios.`
    await fetchAvailableFichas()
    emit('imported', result.ficha)
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.details &&
      typeof error.details === 'object' &&
      (error.details as ReportInconsistencyDetails).code === 'REPORT_INCONSISTENCY'
    ) {
      inconsistencyDetails.value = error.details as ReportInconsistencyDetails
      importError.value = ''
    } else {
      importError.value =
        error instanceof Error ? error.message : 'Ocurrió un error inesperado al importar el archivo.'
    }
  } finally {
    isImporting.value = false
  }
}

async function deleteSelectedFicha() {
  if (!selectedFichaToDelete.value) {
    deleteError.value = 'Debes seleccionar una ficha para eliminar.'
    return
  }

  const ficha = selectedFichaToDelete.value
  const confirmed = window.confirm(
    `¿Estás seguro de eliminar completamente la ficha ${ficha}? Esta acción borrará todos sus aprendices, juicios evaluativos y resultados asociados.`,
  )

  if (!confirmed) return

  isDeleting.value = true
  deleteError.value = ''
  deleteMessage.value = ''

  try {
    await importService.deleteFicha(ficha)
    historyStore.removeByFicha(ficha)
    academicStore.notifyRefresh()

    deleteMessage.value = `La ficha ${ficha} y todos sus datos asociados fueron eliminados correctamente.`
    selectedFichaToDelete.value = ''
    await fetchAvailableFichas()
    emit('deleted-ficha', ficha)
  } catch (error) {
    deleteError.value =
      error instanceof Error ? error.message : 'Ocurrió un error inesperado al eliminar la ficha.'
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  void fetchAvailableFichas()
})
</script>

<template>
  <div class="grid w-full min-w-0 max-w-full gap-6">
    <!-- Header Section -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4 min-w-0">
      <div>
        <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
          <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
          Control de Ingesta
        </span>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Importación de Juicios Evaluativos
        </h1>
        <p class="mt-1 text-xs text-slate-500">
          Carga reportes descargados directamente de SofiaPlus en formato .csv, .xlsx o .xls.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300"
          type="button"
          @click="showManageFichas = !showManageFichas"
        >
          <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {{ showManageFichas ? 'Ocultar Gestión' : 'Administrar Fichas' }}
        </button>
      </div>
    </div>

    <!-- Collapsible Ficha Management Drawer -->
    <div v-if="showManageFichas" class="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition animate-in fade-in duration-150 min-w-0">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Eliminación y Depuración de Fichas</h3>
          <p class="text-xs text-slate-500">Elimina fichas para limpiar la base de datos o reemplazar datos corruptos.</p>
        </div>
      </div>

      <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="relative flex-1 sm:max-w-xs">
          <select
            v-model="selectedFichaToDelete"
            class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-rose-500 focus:bg-white"
          >
            <option value="">Selecciona una ficha para borrar...</option>
            <option v-for="f in availableFichas" :key="f" :value="f">Ficha {{ f }}</option>
          </select>
        </div>

        <button
          :disabled="!selectedFichaToDelete || isDeleting"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-700 disabled:opacity-50"
          type="button"
          @click="deleteSelectedFicha"
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {{ isDeleting ? 'Eliminando...' : 'Eliminar Ficha Seleccionada' }}
        </button>
      </div>

      <p v-if="deleteMessage" class="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
        {{ deleteMessage }}
      </p>
      <p v-if="deleteError" class="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
        {{ deleteError }}
      </p>
    </div>

    <!-- Main Workspace Container -->
    <div class="grid w-full min-w-0 max-w-full gap-6">
      <!-- Upload Dropzone -->
      <div
        class="relative flex min-h-[16rem] w-full min-w-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition duration-150"
        :class="isDragActive ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 bg-white hover:border-emerald-500/60 shadow-xs'"
        @dragenter.prevent="isDragActive = true"
        @dragover.prevent="isDragActive = true"
        @dragleave.prevent="isDragActive = false"
        @drop.prevent="handleFileDrop"
      >
        <div class="flex max-w-md flex-col items-center gap-3">
          <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-xs">
            <svg class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          <div>
            <h3 class="text-base font-bold text-slate-900">Arrastra tu archivo CSV o Excel aquí</h3>
            <p class="mt-1 text-xs text-slate-500">Compatible con reportes oficiales generados por SofiaPlus (.csv, .xlsx, .xls)</p>
          </div>

          <label class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700">
            Explorar en mi equipo
            <input accept=".csv, .xlsx, .xls" type="file" class="sr-only" @change="handleFileSelection" />
          </label>
        </div>
      </div>

      <!-- Parsing Status Indicator -->
      <div v-if="isParsing" class="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-800">
        <svg class="h-4 w-4 animate-spin text-sky-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-xs font-semibold">Analizando estructura del archivo y metadatos...</p>
      </div>

      <!-- Alerts -->
      <p v-if="importMessage" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
        {{ importMessage }}
      </p>
      <p v-if="importError || parseError" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
        {{ importError || parseError }}
      </p>

      <!-- Security / Inconsistency Blocked Alert -->
      <div
        v-if="inconsistencyDetails"
        class="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/90 to-amber-50/60 p-5 shadow-xs transition animate-in fade-in duration-200"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex items-start gap-3.5">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 border border-rose-200 shadow-2xs">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-bold text-rose-900">
                  Importación Bloqueada: Reporte Inconsistente o Desactualizado
                </h4>
                <span class="rounded-full bg-rose-200/80 px-2 py-0.5 text-[0.65rem] font-bold text-rose-900 uppercase">
                  Ficha {{ inconsistencyDetails.ficha }}
                </span>
              </div>
              <p class="text-xs text-rose-800 leading-relaxed">
                El archivo intentó registrar como <strong class="underline decoration-rose-400">Por evaluar</strong>
                o modificar <strong>{{ inconsistencyDetails.totalInconsistencies }} juicio(s)</strong> que ya habían sido previamente
                <strong class="text-emerald-700 font-bold">APROBADOS</strong> en el sistema legítimo.
              </p>
              <p class="text-[0.7rem] text-rose-700/90 font-medium">
                🛡️ <strong>Protección de Integridad:</strong> Para evitar que un reporte desactualizado o con fechas alteradas destruya el progreso de los aprendices, la importación se canceló por completo y los datos legítimos se mantienen intactos.
              </p>
            </div>
          </div>

          <button
            class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-300 bg-white/80 px-3 py-1.5 text-xs font-semibold text-rose-800 shadow-2xs transition hover:bg-white"
            type="button"
            @click="showInconsistencyList = !showInconsistencyList"
          >
            <span>{{ showInconsistencyList ? 'Ocultar Casos' : 'Ver Inconsistencias (' + inconsistencyDetails.totalInconsistencies + ')' }}</span>
            <svg
              class="h-3.5 w-3.5 transition-transform"
              :class="{ 'rotate-180': showInconsistencyList }"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <!-- Inconsistencies Table -->
        <div v-if="showInconsistencyList" class="mt-4 overflow-x-auto rounded-xl border border-rose-200 bg-white shadow-2xs">
          <table class="w-full min-w-max border-collapse text-left text-xs">
            <thead>
              <tr class="bg-rose-50/70 text-rose-900">
                <th class="border-b border-rose-200 px-3.5 py-2 font-bold uppercase text-[0.65rem]">Aprendiz</th>
                <th class="border-b border-rose-200 px-3.5 py-2 font-bold uppercase text-[0.65rem]">Documento</th>
                <th class="border-b border-rose-200 px-3.5 py-2 font-bold uppercase text-[0.65rem]">Resultado</th>
                <th class="border-b border-rose-200 px-3.5 py-2 font-bold uppercase text-[0.65rem] text-emerald-800">Estado en BD (Legítimo)</th>
                <th class="border-b border-rose-200 px-3.5 py-2 font-bold uppercase text-[0.65rem] text-rose-800">Estado en Reporte</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-rose-100 text-slate-700">
              <tr v-for="(inc, idx) in inconsistencyDetails.inconsistencies" :key="idx" class="hover:bg-rose-50/30">
                <td class="px-3.5 py-2 font-medium text-slate-900 whitespace-nowrap">{{ inc.aprendiz }}</td>
                <td class="px-3.5 py-2 font-mono text-[0.7rem] text-slate-600 whitespace-nowrap">{{ inc.documento }}</td>
                <td class="max-w-xs truncate px-3.5 py-2 text-slate-600" :title="inc.resultadoCodigo + ' - ' + inc.resultadoDetalle">
                  <span class="font-semibold text-slate-800">{{ inc.resultadoCodigo }}</span> - {{ inc.resultadoDetalle }}
                </td>
                <td class="px-3.5 py-2 whitespace-nowrap">
                  <span class="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-800 uppercase">
                    {{ inc.estadoActual }}
                  </span>
                </td>
                <td class="px-3.5 py-2 whitespace-nowrap">
                  <span class="inline-flex items-center rounded-md bg-rose-100 px-2 py-0.5 text-[0.65rem] font-bold text-rose-800 uppercase">
                    {{ inc.estadoReporte }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Summary & Preview Section -->
      <div v-if="summary" class="w-full min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs animate-in fade-in duration-200 overflow-hidden">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 min-w-0">
          <div class="space-y-1 min-w-0">
            <span class="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700 border border-emerald-200">
              Listo para Importar
            </span>
            <h3 class="text-lg font-bold text-slate-900 truncate">{{ summary.fileName }}</h3>
            <div class="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
              <span>{{ summary.rowCount }} aprendices</span>
              <span>·</span>
              <span>{{ summary.columnCount }} columnas</span>
              <span>·</span>
              <span>{{ formatBytes(summary.fileSize) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2.5 shrink-0">
            <button
              class="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              type="button"
              @click="resetParser"
            >
              Descartar
            </button>
            <button
              :disabled="isImporting"
              class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
              type="button"
              @click="importToDatabase"
            >
              <svg v-if="isImporting" class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isImporting ? 'Guardando en BD...' : 'Confirmar e Importar' }}
            </button>
          </div>
        </div>

        <!-- Preview Table with Horizontal Scroll Containment -->
        <div class="mt-5 w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full min-w-max border-collapse text-left text-xs">
            <thead>
              <tr class="bg-slate-50/80 text-slate-700">
                <th v-for="col in columns.slice(0, 10)" :key="col" class="border-b border-slate-200 px-3.5 py-2.5 font-bold uppercase tracking-wider text-[0.65rem] text-slate-500 whitespace-nowrap">
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-600">
              <tr v-for="(row, idx) in rows.slice(0, 6)" :key="idx" class="hover:bg-slate-50/60 transition">
                <td v-for="col in columns.slice(0, 10)" :key="col" class="max-w-xs truncate px-3.5 py-2.5 whitespace-nowrap">
                  {{ row[col] || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-2 text-right text-[0.7rem] text-slate-400">Previsualizando primeras 6 filas de {{ rows.length }}</p>
      </div>
    </div>
  </div>
</template>
