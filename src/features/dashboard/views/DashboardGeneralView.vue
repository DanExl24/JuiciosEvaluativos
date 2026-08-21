<script setup lang="ts">
import { Bar, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, Legend, LinearScale, Tooltip } from 'chart.js'
import type { TooltipItem } from 'chart.js'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboard } from '../composables/useDashboard'
import { useAcademicContextStore } from '../../../stores/academicContext.store'
import { formatPercent, prettyState } from '../../../utils/formatters/number'

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, Tooltip)

const router = useRouter()
const academicStore = useAcademicContextStore()
const {
  dashboard,
  dashboardError,
  learnerSearch,
  allLearnerOptions,
  fichaOptions,
  visiblePendingLearners,
  visibleCompetenciesByApproval,
  getFilteredCompetencies,
  getFilteredLearners,
  getFilteredResults,
  fetchDashboard,
} = useDashboard()

const isSyncingLearnerContext = ref(false)

const filters = ref({
  estado: academicStore.filters.estado || '',
  ficha: academicStore.filters.ficha || '',
  competencia: academicStore.filters.competencia || '',
  resultado: academicStore.filters.resultado || '',
  aprendiz: academicStore.filters.aprendiz || '',
})

const filteredCompetencyOptions = computed(() => getFilteredCompetencies(filters.value.ficha))
const filteredLearnerOptions = computed(() => getFilteredLearners(filters.value.ficha))
const filteredResultOptions = computed(() => getFilteredResults(filters.value.ficha, filters.value.competencia))

const statusChartData = computed(() => ({
  labels: ['En formación', 'Retirados', 'Trasladados'],
  datasets: [
    {
      data: [
        dashboard.value?.overview.inTrainingCount ?? 0,
        dashboard.value?.overview.retiredCount ?? 0,
        dashboard.value?.overview.transferredCount ?? 0,
      ],
      backgroundColor: ['#047857', '#f97316', '#0f766e'],
      borderWidth: 0,
    },
  ],
}))

const judgementChartData = computed(() => ({
  labels: ['Aprobados', 'Desaprobados', 'Por evaluar'],
  datasets: [
    {
      data: [
        dashboard.value?.overview.approvedJudgements ?? 0,
        dashboard.value?.overview.disapprovedJudgements ?? 0,
        dashboard.value?.overview.pendingJudgements ?? 0,
      ],
      backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
      borderRadius: 12,
    },
  ],
}))

const competencyChartData = computed(() => {
  const topCompetencies = visibleCompetenciesByApproval.value
  return {
    labels: topCompetencies.map((item) => `${item.code} · ${item.ficha}`),
    datasets: [
      {
        label: 'Aprobación %',
        data: topCompetencies.map((item) => item.approvalRate),
        backgroundColor: ['#022c22', '#14532d', '#166534', '#15803d', '#16a34a', '#4ade80', '#65a30d', '#84cc16'],
        borderRadius: 12,
      },
    ],
  }
})

const pendingLearnersChartData = computed(() => ({
  labels: visiblePendingLearners.value.map((learner) => learner.fullName),
  datasets: [
    {
      label: 'Pendientes',
      data: visiblePendingLearners.value.map((learner) => learner.pendingResults),
      backgroundColor: '#f59e0b',
      borderRadius: 10,
    },
  ],
}))

function wrapTooltipText(text: string, maxLineLength = 32) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''
  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word
    if (nextLine.length <= maxLineLength) {
      currentLine = nextLine
      continue
    }
    if (currentLine) lines.push(currentLine)
    currentLine = word
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

function buildCompetencyTooltipTitle(competencies: typeof visibleCompetenciesByApproval.value, tooltipItems: TooltipItem<'bar'>[]) {
  const hoveredItem = tooltipItems[0]
  if (!hoveredItem) return ''
  const competency = competencies[hoveredItem.dataIndex]
  if (!competency) return hoveredItem.label
  return wrapTooltipText(`${competency.code}: ${competency.name}`)
}

const percentHorizontalBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      beginAtZero: true,
      max: 100,
      ticks: { callback: (value: string | number) => `${value}%` },
    },
  },
}

const competencyApprovalChartOptions = computed(() => ({
  ...percentHorizontalBarOptions,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (tooltipItems: TooltipItem<'bar'>[]) =>
          buildCompetencyTooltipTitle(visibleCompetenciesByApproval.value, tooltipItems),
      },
    },
  },
}))

const horizontalBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      beginAtZero: true,
      ticks: { precision: 0 },
    },
  },
}

function applyLearnerSelection(learnerId: string) {
  const learner = allLearnerOptions.value.find((item) => String(item.id) === learnerId)
  if (!learner) return

  isSyncingLearnerContext.value = true
  filters.value = {
    ...filters.value,
    aprendiz: learnerId,
    ficha: learner.ficha,
    estado: learner.estado,
  }
  isSyncingLearnerContext.value = false
}

function resetFilters() {
  filters.value = {
    estado: '',
    ficha: '',
    competencia: '',
    resultado: '',
    aprendiz: '',
  }
  learnerSearch.value = ''
  academicStore.resetFilters()
}

function navigateToCompetencies(learnerId: number, ficha: string) {
  academicStore.setLearner(learnerId, ficha)
  router.push('/tracking')
}

watch(
  () => ({ ...filters.value }),
  () => {
    academicStore.setFilters(filters.value)
    void fetchDashboard(filters.value)
  },
  { deep: true },
)

watch(
  () => filters.value.ficha,
  () => {
    if (
      filters.value.competencia &&
      !filteredCompetencyOptions.value.some((competency) => competency.codigo === filters.value.competencia)
    ) {
      filters.value.competencia = ''
    }

    if (filters.value.aprendiz && !filteredLearnerOptions.value.some((learner) => String(learner.id) === filters.value.aprendiz)) {
      filters.value.aprendiz = ''
    }

    if (filters.value.resultado && !filteredResultOptions.value.some((result) => result.codigo === filters.value.resultado)) {
      filters.value.resultado = ''
    }
  },
)

watch(
  () => academicStore.lastRefreshTimestamp,
  () => {
    void fetchDashboard(filters.value)
  },
)

onMounted(() => {
  void fetchDashboard(filters.value)
})
</script>

<template>
  <div class="grid gap-6">
    <!-- Header -->
    <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div class="space-y-1">
        <span class="inline-flex w-fit rounded-full border border-emerald-700/15 bg-emerald-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-emerald-700">
          Panorama General
        </span>
        <h2 class="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Dashboard de Juicios Evaluativos
        </h2>
      </div>
      <button
        class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        type="button"
        @click="resetFilters"
      >
        Limpiar Filtros
      </button>
    </div>

    <!-- Filtros Bar -->
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label class="grid gap-1">
          <span class="text-xs font-semibold text-slate-600">Ficha</span>
          <select
            v-model="filters.ficha"
            class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
          >
            <option value="">Todas las fichas</option>
            <option v-for="f in fichaOptions" :key="f.codigo" :value="f.codigo">{{ f.codigo }} - {{ f.nombre }}</option>
          </select>
        </label>

        <label class="grid gap-1">
          <span class="text-xs font-semibold text-slate-600">Estado</span>
          <select
            v-model="filters.estado"
            class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
          >
            <option value="">Todos los estados</option>
            <option v-for="e in dashboard?.options.estados ?? []" :key="e" :value="e">{{ prettyState(e) }}</option>
          </select>
        </label>

        <label class="grid gap-1">
          <span class="text-xs font-semibold text-slate-600">Competencia</span>
          <select
            v-model="filters.competencia"
            class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
          >
            <option value="">Todas las competencias</option>
            <option v-for="c in filteredCompetencyOptions" :key="c.codigo" :value="c.codigo">{{ c.codigo }} - {{ c.nombre }}</option>
          </select>
        </label>

        <label class="grid gap-1">
          <span class="text-xs font-semibold text-slate-600">Resultado</span>
          <select
            v-model="filters.resultado"
            class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
          >
            <option value="">Todos los resultados</option>
            <option v-for="r in filteredResultOptions" :key="r.codigo" :value="r.codigo">{{ r.codigo }} - {{ r.detalle }}</option>
          </select>
        </label>

        <label class="grid gap-1">
          <span class="text-xs font-semibold text-slate-600">Aprendiz</span>
          <select
            :value="filters.aprendiz"
            class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
            @change="applyLearnerSelection(($event.target as HTMLSelectElement).value)"
          >
            <option value="">Todos los aprendices</option>
            <option v-for="a in filteredLearnerOptions" :key="a.id" :value="String(a.id)">{{ a.nombre }}</option>
          </select>
        </label>
      </div>
    </div>

    <!-- Error / Loading -->
    <p v-if="dashboardError" class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      {{ dashboardError }}
    </p>

    <!-- Overview Stats Cards -->
    <div v-if="dashboard" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Aprendices</span>
        <p class="mt-2 text-3xl font-black text-slate-900">{{ dashboard.overview.learnerCount }}</p>
        <span class="mt-1 block text-xs text-emerald-600 font-semibold">{{ dashboard.overview.inTrainingCount }} en formación</span>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Juicios Aprobados</span>
        <p class="mt-2 text-3xl font-black text-emerald-600">{{ dashboard.overview.approvedJudgements }}</p>
        <span class="mt-1 block text-xs text-slate-500">Promedio avance: {{ formatPercent(dashboard.overview.averageProgress) }}</span>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Juicios Pendientes</span>
        <p class="mt-2 text-3xl font-black text-amber-500">{{ dashboard.overview.pendingJudgements }}</p>
        <span class="mt-1 block text-xs text-amber-700">Por evaluar</span>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Desaprobados</span>
        <p class="mt-2 text-3xl font-black text-rose-600">{{ dashboard.overview.disapprovedJudgements }}</p>
        <span class="mt-1 block text-xs text-rose-700">No aprobados</span>
      </div>
    </div>

    <!-- Charts Grid -->
    <div v-if="dashboard" class="grid gap-6 lg:grid-cols-2">
      <!-- Status Donut -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 class="text-base font-bold text-slate-900">Distribución de Estados de Aprendices</h3>
        <div class="mt-4 h-64">
          <Doughnut :data="statusChartData" :options="{ responsive: true, maintainAspectRatio: false }" />
        </div>
      </div>

      <!-- Judgements Bar -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 class="text-base font-bold text-slate-900">Estado de Juicios Evaluativos</h3>
        <div class="mt-4 h-64">
          <Bar :data="judgementChartData" :options="{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }" />
        </div>
      </div>

      <!-- Top Approval Competencies -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 class="text-base font-bold text-slate-900">Competencias con Mayor % de Aprobación</h3>
        <div class="mt-4 h-64">
          <Bar :data="competencyChartData" :options="competencyApprovalChartOptions" />
        </div>
      </div>

      <!-- Top Pending Learners -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 class="text-base font-bold text-slate-900">Aprendices con Más Juicios Pendientes</h3>
        <div class="mt-4 h-64">
          <Bar :data="pendingLearnersChartData" :options="horizontalBarOptions" />
        </div>
      </div>
    </div>

    <!-- Pending Learners Table -->
    <div v-if="dashboard" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 class="text-base font-bold text-slate-900">Aprendices con Juicios Pendientes de Evaluación</h3>
        <span class="text-xs text-slate-400">Haz clic en un aprendiz para ver su detalle</span>
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-700">
              <th class="px-4 py-3 font-bold uppercase">Aprendiz</th>
              <th class="px-4 py-3 font-bold uppercase">Documento</th>
              <th class="px-4 py-3 font-bold uppercase">Ficha</th>
              <th class="px-4 py-3 font-bold uppercase">Estado</th>
              <th class="px-4 py-3 font-bold uppercase">Pendientes</th>
              <th class="px-4 py-3 font-bold uppercase">Avance</th>
              <th class="px-4 py-3 font-bold uppercase text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-600">
            <tr
              v-for="learner in visiblePendingLearners"
              :key="learner.id"
              class="hover:bg-emerald-50/40 transition cursor-pointer"
              @click="navigateToCompetencies(learner.id, learner.ficha)"
            >
              <td class="px-4 py-3 font-bold text-slate-900">{{ learner.fullName }}</td>
              <td class="px-4 py-3">{{ learner.documentType }} {{ learner.document }}</td>
              <td class="px-4 py-3">{{ learner.ficha }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-800">
                  {{ prettyState(learner.state) }}
                </span>
              </td>
              <td class="px-4 py-3 font-bold text-amber-600">{{ learner.pendingResults }}</td>
              <td class="px-4 py-3">{{ formatPercent(learner.progress) }}</td>
              <td class="px-4 py-3 text-right">
                <button
                  class="rounded-lg bg-slate-950 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  type="button"
                >
                  Ver Detalle
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
