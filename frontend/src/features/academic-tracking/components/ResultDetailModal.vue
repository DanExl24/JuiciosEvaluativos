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
  if (normalized === 'aprobado') return 'bg-emerald-50 text-emerald-800 border border-emerald-200'
  if (normalized === 'por evaluar') return 'bg-amber-50 text-amber-800 border border-amber-200'
  return 'bg-rose-50 text-rose-800 border border-rose-200'
}
</script>

<template>
  <div v-if="open && result" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4" @click.self="emit('close')">
    <div class="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in zoom-in-95 duration-150">
      <!-- Header -->
      <div class="flex flex-col gap-4 border-b border-slate-200/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Resultado de Aprendizaje</span>
          <h3 class="text-base font-bold text-slate-900">{{ result.code }}</h3>
          <p class="mt-0.5 text-xs text-slate-500 line-clamp-1">{{ result.detail }}</p>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            type="button"
            @click="handleExportExcel"
          >
            <svg class="h-3.5 w-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
          </button>
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            type="button"
            @click="handleExportPdf"
          >
            <svg class="h-3.5 w-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </button>
          <button
            class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            type="button"
            @click="emit('close')"
          >
            Cerrar
          </button>
        </div>
      </div>

      <!-- Quick Stats Strip -->
      <div class="grid grid-cols-4 gap-2 border-b border-slate-100 bg-slate-50/60 p-3 text-center text-xs">
        <div>
          <span class="text-[0.65rem] font-bold uppercase text-slate-400">Total Aprendices</span>
          <p class="text-sm font-bold text-slate-800">{{ result.totalLearners }}</p>
        </div>
        <div>
          <span class="text-[0.65rem] font-bold uppercase text-emerald-700">Aprobados</span>
          <p class="text-sm font-bold text-emerald-600">{{ result.approvedLearners }}</p>
        </div>
        <div>
          <span class="text-[0.65rem] font-bold uppercase text-amber-700">Pendientes</span>
          <p class="text-sm font-bold text-amber-600">{{ result.pendingLearners }}</p>
        </div>
        <div>
          <span class="text-[0.65rem] font-bold uppercase text-slate-500">Cumplimiento</span>
          <p class="text-sm font-bold text-slate-900">{{ formatPercent(result.progress) }}</p>
        </div>
      </div>

      <!-- Learners Table -->
      <div class="max-h-[50vh] overflow-y-auto p-4">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-200 text-slate-600 bg-slate-50/50">
              <th class="px-3 py-2 font-bold uppercase text-[0.65rem]">Aprendiz</th>
              <th class="px-3 py-2 font-bold uppercase text-[0.65rem]">Documento</th>
              <th class="px-3 py-2 font-bold uppercase text-[0.65rem]">Estado</th>
              <th class="px-3 py-2 font-bold uppercase text-[0.65rem] text-right">Juicio Evaluativo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr v-for="l in filteredLearners" :key="l.id" class="hover:bg-slate-50/60 transition">
              <td class="px-3 py-2 font-semibold text-slate-900">{{ l.fullName }}</td>
              <td class="px-3 py-2 text-slate-500">{{ l.documentType }} {{ l.document }}</td>
              <td class="px-3 py-2">{{ prettyState(l.state) }}</td>
              <td class="px-3 py-2 text-right">
                <span class="inline-block rounded px-2 py-0.5 text-[0.65rem] font-bold" :class="getJudgementBadgeClass(l.judgement)">
                  {{ prettyState(l.judgement) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!filteredLearners.length" class="p-6 text-center text-xs text-slate-400">
          No hay aprendices que coincidan con el filtro seleccionado.
        </p>
      </div>
    </div>
  </div>
</template>
