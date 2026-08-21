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
  ficha: academicStore.selectedFicha || academicStore.filters.ficha || '',
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
      backgroundColor: ['#059669', '#e11d48', '#0284c7'],
      borderWidth: 0,
    },
  ],
}))

const judgementChartData = computed(() => ({
  labels: ['Aprobados', 'Por evaluar', 'Desaprobados'],
  datasets: [
    {
      data: [
        dashboard.value?.overview.approvedJudgements ?? 0,
        dashboard.value?.overview.pendingJudgements ?? 0,
        dashboard.value?.overview.disapprovedJudgements ?? 0,
      ],
      backgroundColor: ['#059669', '#d97706', '#e11d48'],
      borderRadius: 6,
    },
  ],
}))

const competencyChartData = computed(() => {
  const topCompetencies = visibleCompetenciesByApproval.value
  return {
    labels: topCompetencies.map((item) => `${item.code}`),
    datasets: [
      {
        label: '% Aprobación',
        data: topCompetencies.map((item) => item.approvalRate),
        backgroundColor: '#059669',
        borderRadius: 6,
      },
    ],
  }
})

function buildCompetencyTooltipTitle(competencies: typeof visibleCompetenciesByApproval.value, tooltipItems: TooltipItem<'bar'>[]) {
  const hoveredItem = tooltipItems[0]
  if (!hoveredItem) return ''
  const competency = competencies[hoveredItem.dataIndex]
  if (!competency) return hoveredItem.label
  return `${competency.code}: ${competency.name}`
}

const competencyApprovalChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (tooltipItems: TooltipItem<'bar'>[]) =>
          buildCompetencyTooltipTitle(visibleCompetenciesByApproval.value, tooltipItems),
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      max: 100,
      grid: { color: '#f1f5f9' },
      ticks: { callback: (value: string | number) => `${value}%`, font: { size: 10 } },
    },
    y: {
      grid: { display: false },
      ticks: { font: { size: 10, weight: 'bold' as const }, color: '#475569' },
    },
  },
}))

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
  if (academicStore.selectedFicha) {
    filters.value.ficha = academicStore.selectedFicha
  }
  void fetchDashboard(filters.value)
})
</script>

<template>
  <div class="grid gap-6">
    <!-- Header & Filter Bar -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
      <div>
        <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
          <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
          Panorama Ejecutivo
        </span>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Dashboard de Juicios Evaluativos
        </h1>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          type="button"
          @click="resetFilters"
        >
          Restablecer Filtros
        </button>
      </div>
    </div>

    <!-- Unified Filters Toolbar -->
    <div class="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label class="block text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">Ficha</label>
          <select
            v-model="filters.ficha"
            class="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white"
          >
            <option value="">Todas las Fichas</option>
            <option v-for="f in fichaOptions" :key="f.codigo" :value="f.codigo">{{ f.codigo }} - {{ f.nombre }}</option>
          </select>
        </div>

        <div>
          <label class="block text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">Estado Formación</label>
          <select
            v-model="filters.estado"
            class="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white"
          >
            <option value="">Todos los Estados</option>
            <option v-for="e in dashboard?.options.estados ?? []" :key="e" :value="e">{{ prettyState(e) }}</option>
          </select>
        </div>

        <div>
          <label class="block text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">Competencia</label>
          <select
            v-model="filters.competencia"
            class="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white"
          >
            <option value="">Todas las Competencias</option>
            <option v-for="c in filteredCompetencyOptions" :key="c.codigo" :value="c.codigo">{{ c.codigo }} - {{ c.nombre }}</option>
          </select>
        </div>

        <div>
          <label class="block text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">Resultado (RAP)</label>
          <select
            v-model="filters.resultado"
            class="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white"
          >
            <option value="">Todos los Resultados</option>
            <option v-for="r in filteredResultOptions" :key="r.codigo" :value="r.codigo">{{ r.codigo }} - {{ r.detalle }}</option>
          </select>
        </div>

        <div>
          <label class="block text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">Aprendiz</label>
          <select
            :value="filters.aprendiz"
            class="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white"
            @change="applyLearnerSelection(($event.target as HTMLSelectElement).value)"
          >
            <option value="">Todos los Aprendices</option>
            <option v-for="a in filteredLearnerOptions" :key="a.id" :value="String(a.id)">{{ a.nombre }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <p v-if="dashboardError" class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
      {{ dashboardError }}
    </p>

    <!-- Top KPI Cards -->
    <div v-if="dashboard" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <span class="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">Población de Aprendices</span>
        <p class="mt-1 text-2xl font-black text-slate-900">{{ dashboard.overview.learnerCount }}</p>
        <span class="mt-1 block text-xs font-semibold text-emerald-600">{{ dashboard.overview.inTrainingCount }} en formación activa</span>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Juicios Aprobados</span>
        <p class="mt-1 text-2xl font-black text-emerald-600">{{ dashboard.overview.approvedJudgements }}</p>
        <span class="mt-1 block text-xs font-medium text-slate-500">Avance curricular: {{ formatPercent(dashboard.overview.averageProgress) }}</span>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <span class="text-[0.65rem] font-bold uppercase tracking-wider text-amber-700">Juicios Pendientes</span>
        <p class="mt-1 text-2xl font-black text-amber-600">{{ dashboard.overview.pendingJudgements }}</p>
        <span class="mt-1 block text-xs font-medium text-amber-700">Por evaluar por instructores</span>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <span class="text-[0.65rem] font-bold uppercase tracking-wider text-rose-600">No Aprobados</span>
        <p class="mt-1 text-2xl font-black text-rose-600">{{ dashboard.overview.disapprovedJudgements }}</p>
        <span class="mt-1 block text-xs font-medium text-rose-600">Requieren plan de mejoramiento</span>
      </div>
    </div>

    <!-- Action Center: Priority Pending Learners Table -->
    <div v-if="dashboard" class="rounded-xl border border-slate-200 bg-white shadow-xs">
      <div class="flex items-center justify-between border-b border-slate-100 p-4">
        <div>
          <span class="text-[0.65rem] font-bold uppercase tracking-wider text-amber-700">Atención Prioritaria</span>
          <h3 class="text-sm font-bold text-slate-900">Aprendices con Juicios Pendientes de Evaluación</h3>
        </div>
        <span class="text-xs text-slate-400 font-medium">Haz clic en una fila para abrir su expediente</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-slate-50/80 text-slate-600">
              <th class="px-4 py-2.5 font-bold uppercase tracking-wider text-[0.65rem]">Aprendiz</th>
              <th class="px-4 py-2.5 font-bold uppercase tracking-wider text-[0.65rem]">Documento</th>
              <th class="px-4 py-2.5 font-bold uppercase tracking-wider text-[0.65rem]">Ficha</th>
              <th class="px-4 py-2.5 font-bold uppercase tracking-wider text-[0.65rem]">Estado</th>
              <th class="px-4 py-2.5 font-bold uppercase tracking-wider text-[0.65rem]">Pendientes</th>
              <th class="px-4 py-2.5 font-bold uppercase tracking-wider text-[0.65rem]">Avance</th>
              <th class="px-4 py-2.5 text-right font-bold uppercase tracking-wider text-[0.65rem]">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr
              v-for="learner in visiblePendingLearners"
              :key="learner.id"
              class="hover:bg-emerald-50/40 transition cursor-pointer"
              @click="navigateToCompetencies(learner.id, learner.ficha)"
            >
              <td class="px-4 py-3 font-bold text-slate-900">{{ learner.fullName }}</td>
              <td class="px-4 py-3 text-slate-500">{{ learner.documentType }} {{ learner.document }}</td>
              <td class="px-4 py-3 font-medium">{{ learner.ficha }}</td>
              <td class="px-4 py-3">
                <span class="rounded bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-700">
                  {{ prettyState(learner.state) }}
                </span>
              </td>
              <td class="px-4 py-3 font-bold text-amber-600">{{ learner.pendingResults }}</td>
              <td class="px-4 py-3 font-semibold">{{ formatPercent(learner.progress) }}</td>
              <td class="px-4 py-3 text-right">
                <span class="text-xs font-semibold text-emerald-700 hover:underline">
                  Ver Seguimiento →
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Analytical Charts Section -->
    <div v-if="dashboard" class="grid gap-5 lg:grid-cols-3">
      <!-- Status Donut -->
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Distribución de Aprendices</h3>
        <div class="mt-3 h-52">
          <Doughnut :data="statusChartData" :options="{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } } }" />
        </div>
      </div>

      <!-- Judgements Bar -->
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Balance de Juicios</h3>
        <div class="mt-3 h-52">
          <Bar :data="judgementChartData" :options="{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } } } }" />
        </div>
      </div>

      <!-- Top Competencies -->
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Aprobación por Norma</h3>
        <div class="mt-3 h-52">
          <Bar :data="competencyChartData" :options="competencyApprovalChartOptions" />
        </div>
      </div>
    </div>
  </div>
</template>
