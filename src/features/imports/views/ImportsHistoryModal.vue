<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ImportHistoryEntry } from '../types/import.types'
import { useImportHistoryStore } from '../stores/importHistory.store'
import { formatDate } from '../../../utils/formatters/date'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const historyStore = useImportHistoryStore()

const isLoading = ref(false)
const error = ref('')
const selectedImport = ref<ImportHistoryEntry | null>(null)
const isDetailsModalOpen = ref(false)

function openImportDetails(entry: ImportHistoryEntry) {
  selectedImport.value = entry
  isDetailsModalOpen.value = true
}

function fetchImportHistory() {
  isLoading.value = true
  error.value = ''
  try {
    historyStore.loadHistory()
    selectedImport.value = null
  } catch (fetchError) {
    error.value =
      fetchError instanceof Error ? fetchError.message : 'Ocurrió un error inesperado al consultar importaciones.'
  } finally {
    isLoading.value = false
  }
}

function handleClearHistory() {
  if (confirm('¿Estás seguro de que deseas limpiar todo el historial de importaciones locales? Esta acción no se puede deshacer.')) {
    historyStore.clearAll()
    fetchImportHistory()
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      fetchImportHistory()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs px-4 py-6">
    <div class="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in zoom-in-95 duration-150">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-slate-200/80 px-6 py-4">
        <div>
          <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Registro de Ingesta</span>
          <h3 class="text-lg font-bold text-slate-900">Historial de Archivos Importados</h3>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="historyStore.entries.length"
            class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:border-rose-200"
            type="button"
            @click="handleClearHistory"
          >
            Limpiar
          </button>
          <button
            class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            type="button"
            @click="emit('close')"
          >
            Cerrar
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="max-h-[calc(90vh-5rem)] overflow-y-auto p-5">
        <div class="grid gap-3">
          <p v-if="error" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
            {{ error }}
          </p>

          <article
            v-for="entry in historyStore.entries"
            :key="entry.id"
            class="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:bg-white hover:border-slate-300 shadow-2xs"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="rounded bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-800 border border-emerald-200/60">
                    Ficha {{ entry.ficha }}
                  </span>
                  <p class="truncate text-xs font-bold text-slate-900">{{ entry.fileName }}</p>
                </div>
                <p class="mt-1 text-[0.7rem] text-slate-400">{{ formatDate(entry.importedAt) }}</p>
              </div>

              <button
                class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 shadow-2xs self-start sm:self-center"
                type="button"
                @click="openImportDetails(entry)"
              >
                Ver Detalle
              </button>
            </div>
          </article>

          <div v-if="!historyStore.entries.length && !isLoading" class="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <p class="text-xs text-slate-500">Aún no hay archivos importados registrados localmente.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Detailed File Preview Modal -->
  <div v-if="isDetailsModalOpen && selectedImport" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4 py-6">
    <div class="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between border-b border-slate-200/80 px-6 py-4">
        <div>
          <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Detalle de Archivo</span>
          <h3 class="text-lg font-bold text-slate-900">{{ selectedImport.fileName }}</h3>
        </div>
        <button
          class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          type="button"
          @click="isDetailsModalOpen = false"
        >
          Volver
        </button>
      </div>

      <div class="max-h-[calc(92vh-5rem)] overflow-y-auto p-6 space-y-5">
        <!-- Summary Counters -->
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
            <span class="text-[0.65rem] font-bold uppercase text-slate-400">Ficha</span>
            <p class="text-base font-bold text-slate-900">{{ selectedImport.ficha }}</p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
            <span class="text-[0.65rem] font-bold uppercase text-slate-400">Filas / Aprendices</span>
            <p class="text-base font-bold text-slate-900">{{ selectedImport.summary?.rowCount ?? selectedImport.rowCount }}</p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
            <span class="text-[0.65rem] font-bold uppercase text-slate-400">Columnas</span>
            <p class="text-base font-bold text-slate-900">{{ selectedImport.summary?.columnCount ?? 0 }}</p>
          </div>
        </div>

        <!-- Table Preview -->
        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-left text-xs">
            <thead class="sticky top-0 bg-slate-50 text-slate-600">
              <tr>
                <th
                  v-for="col in selectedImport.summary?.columns ?? []"
                  :key="col"
                  class="border-b border-slate-200 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-wider"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr
                v-for="(row, idx) in selectedImport.previewRows ?? []"
                :key="idx"
                class="hover:bg-slate-50/50"
              >
                <td
                  v-for="col in selectedImport.summary?.columns ?? []"
                  :key="col"
                  class="max-w-xs truncate px-3 py-2 text-xs"
                >
                  {{ row[col] || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
