<script setup lang="ts">
import { Bar, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, Legend, LinearScale, Tooltip } from 'chart.js'
import type { TooltipItem } from 'chart.js'
import { computed, onMounted, ref, watch } from 'vue'

import type { DashboardPayload } from '../types/dashboard'

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, Tooltip)

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

const props = defineProps<{
  refreshToken: number
}>()

const emit = defineEmits<{
  (event: 'open-competencies', payload: { learnerId: number; ficha: string }): void
}>()

const dashboard = ref<DashboardPayload | null>(null)
const dashboardError = ref('')
const isLoading = ref(false)
const learnerSearch = ref('')
const isSyncingLearnerContext = ref(false)
const filters = ref({
  estado: '',
  ficha: '',
  competencia: '',
  resultado: '',
  aprendiz: '',
})

const allLearnerOptions = computed(() => dashboard.value?.options.aprendices ?? [])
const filteredCompetencyOptions = computed(() => {
  const selectedFicha = filters.value.ficha
  const competencyOptions = dashboard.value?.options.competencias ?? []

  if (!selectedFicha) {
    return competencyOptions
  }

  return competencyOptions.filter((competency) => competency.ficha === selectedFicha)
})

const filteredLearnerOptions = computed(() => {
  const selectedFicha = filters.value.ficha
  const learnerOptions = allLearnerOptions.value

  if (!selectedFicha) {
    return learnerOptions
  }

  return learnerOptions.filter((learner) => learner.ficha === selectedFicha)
})

const searchedLearnerOptions = computed(() => {
  const search = normalizeSearchValue(learnerSearch.value)
  const sourceOptions = search ? allLearnerOptions.value : filteredLearnerOptions.value

  if (!search) {
    return sourceOptions
  }

  return sourceOptions.filter((learner) =>
    [learner.nombre, learner.documento].some((value) => normalizeSearchValue(value).includes(search)),
  )
})

const selectedLearnerOption = computed(
  () => allLearnerOptions.value.find((learner) => String(learner.id) === filters.value.aprendiz) ?? null,
)

const filteredResultOptions = computed(() => {
  const selectedFicha = filters.value.ficha
  const selectedCompetencia = filters.value.competencia
  const resultOptions = dashboard.value?.options.resultados ?? []

  const fichaScopedOptions = selectedFicha
    ? resultOptions.filter((result) => result.ficha === selectedFicha)
    : resultOptions

  if (!selectedCompetencia) {
    return fichaScopedOptions
  }

  return fichaScopedOptions.filter((result) => result.competencia_codigo === selectedCompetencia)
})

const fichaOptions = computed(() => dashboard.value?.options.fichasDetalle ?? [])
const learnerMatchSummary = computed(() => {
  const totalMatches = searchedLearnerOptions.value.length

  if (!learnerSearch.value.trim()) {
    return ''
  }

  if (totalMatches === 0) {
    return 'No se encontraron aprendices con esa busqueda.'
  }

  if (totalMatches === 1) {
    return 'Se encontro 1 aprendiz y se selecciona automaticamente.'
  }

  return `Se encontraron ${totalMatches} aprendices. Refina la busqueda o elige uno del selector.`
})
const visiblePendingLearners = computed(() => (dashboard.value?.pendingLearners ?? []).slice(0, 8))
const visibleCompetenciesByApproval = computed(() => (dashboard.value?.competencies ?? []).slice(0, 8))
const visibleCompetenciesByPending = computed(() =>
  [...(dashboard.value?.competencies ?? [])]
    .sort((a, b) => b.pending - a.pending || a.name.localeCompare(b.name, 'es'))
    .filter((competency) => competency.pending > 0)
    .slice(0, 8),
)
const visibleLearnersByProgress = computed(() =>
  [...(dashboard.value?.learners ?? [])]
    .sort((a, b) => b.progress - a.progress || a.fullName.localeCompare(b.fullName, 'es'))
    .slice(0, 8),
)

const statusChartData = computed(() => ({
  labels: ['En formacion', 'Retirados', 'Trasladados'],
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
        label: 'Aprobacion %',
        data: topCompetencies.map((item) => item.approvalRate),
        backgroundColor: ['#022c22', '#14532d', '#166534', '#15803d', '#16a34a', '#4ade80', '#65a30d', '#84cc16'],
        borderRadius: 12,
      },
    ],
  }
})

const learnerProgressChartData = computed(() => {
  const topLearners = visibleLearnersByProgress.value

  return {
    labels: topLearners.map((learner) => learner.fullName),
    datasets: [
      {
        label: 'Avance %',
        data: topLearners.map((learner) => learner.progress),
        backgroundColor: '#0f172a',
        borderRadius: 10,
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

const pendingCompetenciesChartData = computed(() => ({
  labels: visibleCompetenciesByPending.value.map((competency) => `${competency.code} · ${competency.ficha}`),
  datasets: [
    {
      label: 'Juicios pendientes',
      data: visibleCompetenciesByPending.value.map((competency) => competency.pending),
      backgroundColor: '#b45309',
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

    if (currentLine) {
      lines.push(currentLine)
    }

    currentLine = word
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function buildCompetencyTooltipTitle(competencies: typeof visibleCompetenciesByApproval.value, tooltipItems: TooltipItem<'bar'>[]) {
  const hoveredItem = tooltipItems[0]

  if (!hoveredItem) {
    return ''
  }

  const competency = competencies[hoveredItem.dataIndex]

  if (!competency) {
    return hoveredItem.label
  }

  return wrapTooltipText(`${competency.code}: ${competency.name}`)
}

const horizontalBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        precision: 0,
      },
    },
  },
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
      ticks: {
        callback: (value: string | number) => `${value}%`,
      },
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

const pendingCompetenciesChartOptions = computed(() => ({
  ...horizontalBarOptions,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (tooltipItems: TooltipItem<'bar'>[]) =>
          buildCompetencyTooltipTitle(visibleCompetenciesByPending.value, tooltipItems),
      },
    },
  },
}))

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function prettyState(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function normalizeSearchValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function applyLearnerSelection(learnerId: string) {
  const learner = allLearnerOptions.value.find((item) => String(item.id) === learnerId)

  if (!learner) {
    return
  }

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
}

async function fetchDashboard() {
  isLoading.value = true
  dashboardError.value = ''

  try {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filters.value)) {
      if (value) {
        params.set(key, value)
      }
    }

    const response = await fetch(`${apiBaseUrl}/api/dashboard${params.toString() ? `?${params.toString()}` : ''}`)
    if (!response.ok) {
      throw new Error('No se pudo cargar el dashboard desde la base de datos.')
    }

    dashboard.value = (await response.json()) as DashboardPayload
  } catch (error) {
    dashboardError.value =
      error instanceof Error ? error.message : 'Ocurrio un error inesperado al consultar el dashboard.'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => ({ ...filters.value }),
  () => {
    void fetchDashboard()
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

    if (filters.value.aprendiz && !allLearnerOptions.value.some((learner) => String(learner.id) === filters.value.aprendiz)) {
      filters.value.aprendiz = ''
    }
  },
)

watch(
  () => filters.value.competencia,
  (competencia) => {
    if (
      filters.value.resultado &&
      !filteredResultOptions.value.some((result) => result.codigo === filters.value.resultado)
    ) {
      filters.value.resultado = ''
    }

    if (!competencia && filters.value.resultado) {
      filters.value.resultado = ''
    }
  },
)

watch(
  () => learnerSearch.value,
  (searchTerm, previousSearchTerm) => {
    if (!searchTerm.trim() && previousSearchTerm?.trim()) {
      resetFilters()
      return
    }

    if (
      filters.value.aprendiz &&
      selectedLearnerOption.value &&
      ![selectedLearnerOption.value.nombre, selectedLearnerOption.value.documento].some(
        (value) => normalizeSearchValue(value) === normalizeSearchValue(searchTerm),
      )
    ) {
      filters.value.aprendiz = ''
    }

    const normalizedSearch = normalizeSearchValue(searchTerm)

    if (!normalizedSearch) {
      return
    }

    const exactMatch = searchedLearnerOptions.value.find((learner) =>
      [learner.nombre, learner.documento].some((value) => normalizeSearchValue(value) === normalizedSearch),
    )

    if (exactMatch) {
      applyLearnerSelection(String(exactMatch.id))
      return
    }

    if (searchedLearnerOptions.value.length === 1) {
      applyLearnerSelection(String(searchedLearnerOptions.value[0]!.id))
    }
  },
)

watch(
  () => filters.value.aprendiz,
  (aprendiz) => {
    if (isSyncingLearnerContext.value || !aprendiz) {
      return
    }

    applyLearnerSelection(aprendiz)
  },
)

watch(
  () => props.refreshToken,
  () => {
    void fetchDashboard()
  },
)

onMounted(() => {
  void fetchDashboard()
})
</script>

<template>
  <main class="grid gap-6">
    <section class="rounded-[2rem] border border-emerald-950/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:p-7">
      <div class="flex flex-col gap-4 border-b border-slate-200/80 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span class="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-700">Dashboard general</span>
          <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">Lectura general por ficha, estado, competencia y aprendiz</h2>
        </div>
        <button
          class="rounded-xl border border-emerald-950/10 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
          type="button"
          @click="resetFilters"
        >
          Limpiar
        </button>
      </div>

      <div class="mt-6 grid gap-3 xl:grid-cols-3">
        <label class="grid min-w-0 gap-1.5">
          <span class="text-xs font-medium text-slate-700">Estado del aprendiz</span>
          <select v-model="filters.estado" class="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500">
            <option value="">Todos</option>
            <option v-for="estado in dashboard?.options.estados ?? []" :key="estado" :value="estado">
              {{ prettyState(estado) }}
            </option>
          </select>
        </label>

        <label class="grid min-w-0 gap-1.5">
          <span class="text-xs font-medium text-slate-700">Ficha</span>
          <select v-model="filters.ficha" class="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500">
            <option value="">Todas</option>
            <option v-for="ficha in fichaOptions" :key="ficha.codigo" :value="ficha.codigo">
              {{ ficha.codigo }} · {{ ficha.nombre }}
            </option>
          </select>
        </label>

        <label class="grid min-w-0 gap-1.5">
          <span class="text-xs font-medium text-slate-700">Competencia</span>
          <select
            v-model="filters.competencia"
            class="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
          >
            <option value="">Todas</option>
            <option v-for="competencia in filteredCompetencyOptions" :key="`${competencia.ficha}-${competencia.codigo}`" :value="competencia.codigo">
              {{ competencia.codigo }} · {{ competencia.nombre }}
            </option>
          </select>
        </label>
      </div>

      <div class="mt-3 grid items-start gap-3 xl:grid-cols-3">
        <label class="grid min-w-0 gap-1.5">
          <span class="text-xs font-medium text-slate-700">Resultado de aprendizaje</span>
          <select
            v-model="filters.resultado"
            class="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
          >
            <option value="">Todos</option>
            <option v-for="resultado in filteredResultOptions" :key="`${resultado.ficha}-${resultado.competencia_codigo}-${resultado.codigo}`" :value="resultado.codigo">
              {{ resultado.codigo }} · {{ resultado.detalle }}
            </option>
          </select>
        </label>

        <div class="grid min-w-0 gap-1.5 self-start">
          <span class="text-xs font-medium text-slate-700">Buscar aprendiz</span>
          <input
            v-model="learnerSearch"
            type="text"
            class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
            placeholder="Nombre, apellido o documento"
          />
          <span class="min-h-[1.25rem] px-1 text-[0.65rem] text-slate-500">
            {{ learnerMatchSummary }}
          </span>
        </div>

        <label class="grid min-w-0 gap-1.5">
          <span class="text-xs font-medium text-slate-700">Aprendiz</span>
          <select
            v-model="filters.aprendiz"
            class="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
          >
            <option value="">Todos</option>
            <option v-for="aprendiz in searchedLearnerOptions" :key="aprendiz.id" :value="String(aprendiz.id)">
              {{ aprendiz.nombre }} · {{ aprendiz.documento }} · {{ aprendiz.ficha }}
            </option>
          </select>
        </label>
      </div>

      <p v-if="dashboardError" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
        {{ dashboardError }}
      </p>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <article class="rounded-[1.75rem] border border-emerald-950/10 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <p class="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500">Aprendices</p>
        <p class="mt-3 text-4xl font-black tracking-tight text-slate-950">{{ dashboard?.overview.learnerCount ?? 0 }}</p>
        <p class="mt-2 text-sm text-slate-600">Visibles con los filtros aplicados.</p>
      </article>
      <article class="rounded-[1.75rem] border border-emerald-950/10 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <p class="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500">Juicios aprobados</p>
        <p class="mt-3 text-4xl font-black tracking-tight text-slate-950">{{ dashboard?.overview.approvedJudgements ?? 0 }}</p>
        <p class="mt-2 text-sm text-slate-600">Desaprobados: {{ dashboard?.overview.disapprovedJudgements ?? 0 }}</p>
      </article>
      <article class="rounded-[1.75rem] border border-emerald-950/10 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <p class="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500">Juicios por evaluar</p>
        <p class="mt-3 text-4xl font-black tracking-tight text-slate-950">{{ dashboard?.overview.pendingJudgements ?? 0 }}</p>
        <p class="mt-2 text-sm text-slate-600">Carga pendiente visible.</p>
      </article>
      <article class="rounded-[1.75rem] border border-emerald-950/10 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <p class="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500">Competencias visibles</p>
        <p class="mt-3 text-4xl font-black tracking-tight text-slate-950">{{ dashboard?.competencies.length ?? 0 }}</p>
        <p class="mt-2 text-sm text-slate-600">Fichas: {{ dashboard?.overview.fichaCount ?? 0 }} · Programas: {{ dashboard?.overview.programCount ?? 0 }}</p>
      </article>
      <article class="rounded-[1.75rem] border border-emerald-950/10 bg-slate-950 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
        <p class="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-emerald-300">Avance promedio</p>
        <p class="mt-3 text-4xl font-black tracking-tight">{{ formatPercent(dashboard?.overview.averageProgress ?? 0) }}</p>
        <p class="mt-2 text-sm text-slate-300">En formacion: {{ dashboard?.overview.inTrainingCount ?? 0 }} · Retirados: {{ dashboard?.overview.retiredCount ?? 0 }}</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <article class="rounded-[2rem] border border-emerald-950/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:p-7">
        <div>
          <span class="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-700">Distribucion</span>
          <h3 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">Estado de aprendices</h3>
        </div>
        <div class="mt-6 h-56">
          <Doughnut :data="statusChartData" />
        </div>
      </article>

      <article class="rounded-[2rem] border border-emerald-950/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:p-7">
        <div>
          <span class="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-700">Juicios</span>
          <h3 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">Comportamiento general</h3>
        </div>
        <div class="mt-6 h-56">
          <Bar :data="judgementChartData" :options="horizontalBarOptions" />
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <article class="rounded-[2rem] border border-emerald-950/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:p-7">
        <div>
          <span class="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-700">Competencias</span>
          <h3 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">Aprobacion por competencia</h3>
        </div>
        <div class="mt-6 h-56">
          <Bar :data="competencyChartData" :options="competencyApprovalChartOptions" />
        </div>
      </article>

      <article class="rounded-[2rem] border border-emerald-950/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:p-7">
        <div>
          <span class="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-amber-700">Cuello de botella</span>
          <h3 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">Pendientes por competencia</h3>
        </div>
        <div class="mt-6 h-56">
          <Bar :data="pendingCompetenciesChartData" :options="pendingCompetenciesChartOptions" />
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <article class="rounded-[2rem] border border-amber-200 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:p-7">
        <div>
          <span class="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-amber-700">Alertas</span>
          <h3 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">Aprendices con mas pendientes</h3>
        </div>
        <div class="mt-6 h-56">
          <Bar :data="pendingLearnersChartData" :options="horizontalBarOptions" />
        </div>
      </article>

      <article class="rounded-[2rem] border border-emerald-950/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:p-7">
        <div>
          <span class="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-700">Ranking</span>
          <h3 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">Avance por aprendiz</h3>
        </div>
        <div class="mt-6 h-56">
          <Bar :data="learnerProgressChartData" :options="percentHorizontalBarOptions" />
        </div>
      </article>
    </section>

    <section class="overflow-hidden rounded-[2rem] border border-emerald-950/10 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <div class="flex flex-col gap-4 border-b border-slate-200/80 px-6 py-5 sm:flex-row sm:items-end sm:justify-between xl:px-7">
        <div>
          <span class="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-700">Aprendices</span>
          <h3 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">Vista general por aprendiz</h3>
        </div>
        <p class="text-sm text-slate-500">La tabla refleja los mismos filtros analiticos del panel superior.</p>
      </div>

      <div v-if="dashboard?.learners.length" class="overflow-x-auto max-h-[400px] overflow-y-auto no-scrollbar">
        <table class="min-w-[1080px] w-full border-separate border-spacing-0">
          <thead class="sticky top-0 z-10">
            <tr class="bg-emerald-50/95 backdrop-blur shadow-sm">
              <th class="border-b border-slate-200 px-4 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-600">Aprendiz</th>
              <th class="border-b border-slate-200 px-4 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-600">Ficha</th>
              <th class="border-b border-slate-200 px-4 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-600">Estado</th>
              <th class="border-b border-slate-200 px-4 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-600">Resultados</th>
              <th class="border-b border-slate-200 px-4 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-600">Aprobados</th>
              <th class="border-b border-slate-200 px-4 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-600">Pendientes</th>
              <th class="border-b border-slate-200 px-4 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-600">Avance</th>
              <th class="border-b border-slate-200 px-4 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-600">Detalle</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="learner in dashboard.learners" :key="learner.id" class="odd:bg-white even:bg-slate-50/70">
              <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">
                <p class="font-semibold text-slate-950">{{ learner.fullName }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ learner.documentType }} {{ learner.document }}</p>
              </td>
              <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">
                <p>{{ learner.ficha }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ learner.program }}</p>
              </td>
              <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">{{ prettyState(learner.state) }}</td>
              <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">{{ learner.totalResults }}</td>
              <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">{{ learner.approvedResults }}</td>
              <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">{{ learner.pendingResults }}</td>
              <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">
                <div class="w-40">
                  <div class="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div class="h-full rounded-full bg-emerald-500" :style="{ width: `${learner.progress}%` }"></div>
                  </div>
                  <p class="mt-2 text-xs font-semibold text-slate-600">{{ formatPercent(learner.progress) }}</p>
                </div>
              </td>
              <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">
                <button
                  class="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  type="button"
                  @click="emit('open-competencies', { learnerId: learner.id, ficha: learner.ficha })"
                >
                  Abrir detalle
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else-if="!isLoading" class="px-6 py-8 text-sm text-slate-600 xl:px-7">
        No hay datos para el dashboard con los filtros actuales.
      </p>
    </section>
  </main>
</template>
