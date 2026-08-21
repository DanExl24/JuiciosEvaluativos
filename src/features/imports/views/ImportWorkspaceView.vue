<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useFileParser } from '../composables/useFileParser'
import { importService } from '../services/import.service'
import { createImportFingerprint, useImportHistoryStore } from '../stores/importHistory.store'
import { useAcademicContextStore } from '../../../stores/academicContext.store'
import { formatBytes } from '../../../utils/formatters/number'

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

  try {
    const fingerprint = await createImportFingerprint(payload)
    if (historyStore.wasAlreadyImported(fingerprint)) {
      throw new Error('Este mismo archivo ya fue importado anteriormente.')
    }

    const result = await importService.importCsv(payload)

    historyStore.saveEntry(payload, result.ficha, fingerprint)
    academicStore.setFicha(result.ficha)
    academicStore.notifyRefresh()

    importMessage.value = `Importación completada para la ficha ${result.ficha}. Aprendices: ${result.learners}, resultados: ${result.results}, juicios: ${result.judgements}.`
    await fetchAvailableFichas()
    emit('imported', result.ficha)
  } catch (error) {
    importError.value =
      error instanceof Error ? error.message : 'Ocurrió un error inesperado al importar el archivo.'
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
    `¿Estás seguro de eliminar completamente la ficha ${ficha}? Esta acción borrará todos sus aprendices, juicios evaluativos y resultados asociados en la base de datos.`,
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
  <div class="grid gap-8">
    <!-- Header Section -->
    <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div class="space-y-1">
        <span class="inline-flex w-fit rounded-full border border-emerald-700/15 bg-emerald-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-emerald-700">
          Carga de Datos
        </span>
        <h2 class="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Importación de Juicios Evaluativos
        </h2>
      </div>

      <div class="flex items-center gap-3">
        <button
          class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          type="button"
          @click="emit('open-imports')"
        >
          <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Historial de Cargas
        </button>
      </div>
    </div>

    <!-- Upload & Delete Grid -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Upload Dropzone (2 cols) -->
      <div class="lg:col-span-2">
        <div
          class="relative flex min-h-[18rem] flex-col items-center justify-center rounded-[2rem] border-2 border-dashed p-8 text-center transition duration-200"
          :class="isDragActive ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 bg-slate-50/50 hover:border-emerald-400'"
          @dragenter.prevent="isDragActive = true"
          @dragover.prevent="isDragActive = true"
          @dragleave.prevent="isDragActive = false"
          @drop.prevent="handleFileDrop"
        >
          <div class="space-y-4">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-950 text-white shadow-lg shadow-emerald-950/20">
              <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900">Arrastra tu archivo CSV o Excel aquí</h3>
              <p class="mt-1 text-sm text-slate-500">Soporta formatos .csv, .xlsx y .xls descargados de SofiaPlus</p>
            </div>
            <label class="inline-flex cursor-pointer items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700">
              Seleccionar archivo
              <input accept=".csv, .xlsx, .xls" type="file" class="sr-only" @change="handleFileSelection" />
            </label>
          </div>
        </div>

        <div v-if="isParsing" class="mt-4 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-800">
          <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-sm font-semibold">Procesando estructura del archivo...</p>
        </div>

        <p v-if="importMessage" class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {{ importMessage }}
        </p>
        <p v-if="importError || parseError" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {{ importError || parseError }}
        </p>
      </div>

      <!-- Delete Ficha Card (1 col) -->
      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="space-y-2 border-b border-slate-100 pb-4">
          <span class="text-[0.65rem] font-bold uppercase tracking-wider text-rose-600">Zona de Peligro</span>
          <h3 class="text-lg font-bold text-slate-900">Eliminar Ficha</h3>
          <p class="text-xs text-slate-500 leading-relaxed">
            Elimina por completo una ficha de la base de datos para volver a importarla limpia.
          </p>
        </div>

        <div class="mt-4 space-y-4">
          <label class="grid gap-1.5">
            <span class="text-xs font-semibold text-slate-700">Selecciona la ficha:</span>
            <select
              v-model="selectedFichaToDelete"
              class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-rose-500 focus:bg-white"
            >
              <option value="">Selecciona una ficha...</option>
              <option v-for="f in availableFichas" :key="f" :value="f">Ficha {{ f }}</option>
            </select>
          </label>

          <button
            :disabled="!selectedFichaToDelete || isDeleting"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
            type="button"
            @click="deleteSelectedFicha"
          >
            {{ isDeleting ? 'Eliminando...' : 'Eliminar Ficha y Datos' }}
          </button>

          <p v-if="deleteMessage" class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            {{ deleteMessage }}
          </p>
          <p v-if="deleteError" class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {{ deleteError }}
          </p>
        </div>
      </div>
    </div>

    <!-- Summary & Preview Section -->
    <div v-if="summary" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-6">
        <div>
          <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-600">Archivo Listo</span>
          <h3 class="text-xl font-bold text-slate-900">{{ summary.fileName }}</h3>
          <p class="mt-1 text-xs text-slate-500">
            {{ summary.rowCount }} filas de aprendices · {{ summary.columnCount }} columnas · {{ formatBytes(summary.fileSize) }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            type="button"
            @click="resetParser"
          >
            Descartar
          </button>
          <button
            :disabled="isImporting"
            class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
            type="button"
            @click="importToDatabase"
          >
            <svg v-if="isImporting" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isImporting ? 'Guardando en BD...' : 'Importar a Base de Datos' }}
          </button>
        </div>
      </div>

      <!-- Preview Table -->
      <div class="mt-6 overflow-x-auto rounded-xl border border-slate-100">
        <table class="w-full border-collapse text-left text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-700">
              <th v-for="col in columns.slice(0, 8)" :key="col" class="border-b border-slate-200 px-3 py-3 font-bold uppercase tracking-wider">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-600">
            <tr v-for="(row, idx) in rows.slice(0, 5)" :key="idx" class="hover:bg-slate-50/50">
              <td v-for="col in columns.slice(0, 8)" :key="col" class="max-w-xs truncate px-3 py-2.5">
                {{ row[col] || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-2 text-right text-[0.7rem] text-slate-400">Mostrando primeras 5 filas de {{ rows.length }}</p>
    </div>
  </div>
</template>
