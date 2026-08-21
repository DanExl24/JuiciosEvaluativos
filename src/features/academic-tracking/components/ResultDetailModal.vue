<script setup lang="ts">
import { computed } from 'vue'
import type { FormationCatalogResult, FormationCatalogResultLearner } from '../types/tracking.types'
import { formatPercent, prettyState } from '../../../utils/formatters/number'
import { exportResultToExcel } from '../../../utils/exporters/excelReport'
import { exportResultToPdf } from '../../../utils/exporters/pdfReport'

const props = defineProps<{
  open: boolean
  ficha: string
  competencyCode: string
  competencyName: string
  result: FormationCatalogResult | null
  judgementFilter?: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const filteredLearners = computed<FormationCatalogResultLearner[]>(() => {
  if (!props.result) return []
  if (!props.judgementFilter) return props.result.learners
  return props.result.learners.filter((l) => l.judgement.toLowerCase() === props.judgementFilter?.toLowerCase())
})

function handleExportExcel() {
  if (!props.result) return
  exportResultToExcel({
    ficha: props.ficha,
    competencyCode: props.competencyCode,
    competencyName: props.competencyName,
    resultCode: props.result.code,
    resultDetail: props.result.detail,
    learners: filteredLearners.value,
  })
}

function handleExportPdf() {
  if (!props.result) return
  exportResultToPdf({
    ficha: props.ficha,
    competencyCode: props.competencyCode,
    competencyName: props.competencyName,
    resultCode: props.result.code,
    resultDetail: props.result.detail,
    totalLearners: filteredLearners.value.length,
    approvedLearners: props.result.approvedLearners,
    pendingLearners: props.result.pendingLearners,
    progress: props.result.progress,
    learners: filteredLearners.value,
  })
}

function getJudgementBadgeClass(judgement: string) {
  const normalized = judgement.toLowerCase()
  if (normalized === 'aprobado') return 'bg-emerald-100 text-emerald-800'
  if (normalized === 'por evaluar') return 'bg-amber-100 text-amber-800'
  return 'bg-rose-100 text-rose-800'
}
</script>

<template>
  <div v-if="open && result" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <div class="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
      <!-- Header -->
      <div class="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-600">Resultado de Aprendizaje</span>
          <h3 class="text-xl font-black text-slate-900">{{ result.code }}</h3>
          <p class="mt-1 text-xs text-slate-500 uppercase">{{ result.detail }}</p>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            type="button"
            @click="handleExportExcel"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
          </button>
          <button
            class="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
            type="button"
            @click="handleExportPdf"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </button>
          <button
            class="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            type="button"
            @click="emit('close')"
          >
            Cerrar
          </button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-4 gap-2 border-b border-slate-100 bg-slate-50/50 p-4 text-center text-xs">
        <div>
          <span class="text-slate-400 font-semibold">Total</span>
          <p class="text-base font-bold text-slate-800">{{ result.totalLearners }}</p>
        </div>
        <div>
          <span class="text-emerald-600 font-semibold">Aprobados</span>
          <p class="text-base font-bold text-emerald-600">{{ result.approvedLearners }}</p>
        </div>
        <div>
          <span class="text-amber-600 font-semibold">Pendientes</span>
          <p class="text-base font-bold text-amber-600">{{ result.pendingLearners }}</p>
        </div>
        <div>
          <span class="text-slate-600 font-semibold">Avance</span>
          <p class="text-base font-bold text-slate-900">{{ formatPercent(result.progress) }}</p>
        </div>
      </div>

      <!-- Learners Table -->
      <div class="max-h-[50vh] overflow-y-auto p-4">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-200 text-slate-700">
              <th class="px-3 py-2 font-bold uppercase">Aprendiz</th>
              <th class="px-3 py-2 font-bold uppercase">Documento</th>
              <th class="px-3 py-2 font-bold uppercase">Estado</th>
              <th class="px-3 py-2 font-bold uppercase text-right">Juicio Evaluativo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-600">
            <tr v-for="l in filteredLearners" :key="l.id" class="hover:bg-slate-50">
              <td class="px-3 py-2 font-semibold text-slate-900">{{ l.fullName }}</td>
              <td class="px-3 py-2">{{ l.documentType }} {{ l.document }}</td>
              <td class="px-3 py-2">{{ prettyState(l.state) }}</td>
              <td class="px-3 py-2 text-right">
                <span class="inline-block rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold" :class="getJudgementBadgeClass(l.judgement)">
                  {{ prettyState(l.judgement) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!filteredLearners.length" class="p-6 text-center text-sm text-slate-500">
          No hay aprendices que coincidan con el filtro seleccionado.
        </p>
      </div>
    </div>
  </div>
</template>
