<script setup lang="ts">
import { ref, watch } from 'vue'

import type { ImportHistoryEntry } from '../types/csv'
import { readImportHistory } from '../utils/importHistory'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const isLoading = ref(false)
const error = ref('')
const importHistory = ref<ImportHistoryEntry[]>([])
const selectedImport = ref<ImportHistoryEntry | null>(null)
const isDetailsModalOpen = ref(false)

function openImportDetails(entry: ImportHistoryEntry) {
  selectedImport.value = entry
  isDetailsModalOpen.value = true
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Sin fecha'
  }

  const normalizedValue = value.includes('T') ? value : `${value}-05:00`
  const parsedDate = new Date(normalizedValue)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Sin fecha valida'
  }

  return parsedDate.toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

async function fetchImportHistory() {
  isLoading.value = true
  error.value = ''

  try {
    importHistory.value = readImportHistory() as ImportHistoryEntry[]
    selectedImport.value = null
  } catch (fetchError) {
    error.value =
      fetchError instanceof Error ? fetchError.message : 'Ocurrio un error inesperado al consultar importaciones.'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      void fetchImportHistory()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
    <div class="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.35)]">
      <div class="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <div>
          <p class="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-emerald-700">Control de carga</p>
          <h3 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">Archivos importados</h3>
        </div>
        <button
          class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          type="button"
          @click="emit('close')"
        >
          Cerrar
        </button>
      </div>

      <div class="max-h-[calc(92vh-6rem)] overflow-y-auto p-5">
        <div class="grid gap-3">
          <p v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {{ error }}
          </p>

          <article
            v-for="entry in importHistory"
            :key="entry.id"
            class="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4"
          >
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p class="truncate text-sm font-semibold text-slate-950">{{ entry.fileName }}</p>
                <p class="mt-1 text-xs text-slate-500">Ficha {{ entry.ficha }}</p>
                <p class="mt-2 text-xs text-slate-500">{{ formatDate(entry.importedAt) }}</p>
              </div>

              <button
                class="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                type="button"
                @click="openImportDetails(entry)"
              >
                Ver detalles de archivo
              </button>
            </div>
          </article>

          <p v-if="!importHistory.length && !isLoading" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            Aun no hay archivos importados registrados.
          </p>
        </div>
      </div>
    </div>
  </div>

  <div v-if="isDetailsModalOpen && selectedImport" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 px-4 py-6">
    <div class="max-h-[94vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.35)]">
      <div class="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <div>
          <p class="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-emerald-700">Detalle de importacion</p>
          <h3 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">{{ selectedImport.fileName }}</h3>
        </div>
        <button
          class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          type="button"
          @click="isDetailsModalOpen = false"
        >
          Cerrar detalle
        </button>
      </div>

      <div class="max-h-[calc(94vh-6rem)] overflow-y-auto p-6">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-2xl bg-slate-950 px-4 py-4 text-white">
            <p class="text-[0.7rem] uppercase tracking-[0.2em] text-emerald-300">Archivo</p>
            <p class="mt-2 text-sm font-semibold">{{ selectedImport.fileName }}</p>
          </div>
          <div class="rounded-2xl border border-emerald-950/10 bg-white px-4 py-4">
            <p class="text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">Filas</p>
            <p class="mt-2 text-2xl font-black text-slate-950">{{ selectedImport.summary?.rowCount ?? selectedImport.rowCount }}</p>
          </div>
          <div class="rounded-2xl border border-emerald-950/10 bg-white px-4 py-4">
            <p class="text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">Columnas</p>
            <p class="mt-2 text-2xl font-black text-slate-950">{{ selectedImport.summary?.columnCount ?? 0 }}</p>
          </div>
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr] xl:items-stretch">
          <div class="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
            <article
              v-for="[key, value] in Object.entries(selectedImport.metadata ?? {})"
              :key="key"
              class="rounded-2xl border border-emerald-950/10 bg-white px-4 py-3"
            >
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ key }}</p>
              <p class="mt-2 text-sm text-slate-700">{{ value || 'Sin valor' }}</p>
            </article>
          </div>

          <div class="max-h-[32rem] overflow-auto rounded-[1.6rem] border border-emerald-950/10">
            <table class="min-w-[760px] w-full border-separate border-spacing-0">
              <thead class="sticky top-0 z-10">
                <tr class="bg-emerald-50/95">
                  <th
                    v-for="column in selectedImport.summary?.columns ?? []"
                    :key="column"
                    class="border-b border-slate-200 px-4 py-4 text-left text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-600"
                  >
                    {{ column }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in selectedImport.previewRows ?? []"
                  :key="`${selectedImport.id}-${index}`"
                  class="odd:bg-white even:bg-slate-50/70"
                >
                  <td
                    v-for="column in selectedImport.summary?.columns ?? []"
                    :key="column"
                    class="max-w-[18rem] border-b border-slate-100 px-4 py-4 align-top text-sm leading-6 text-slate-700"
                  >
                    {{ row[column] || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
