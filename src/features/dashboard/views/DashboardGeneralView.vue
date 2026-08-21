<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  GaugeChart,
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent,
} from 'echarts/components'
import { useDashboard } from '../composables/useDashboard'
import { useAcademicContextStore } from '../../../stores/academicContext.store'
import { formatPercent, prettyState } from '../../../utils/formatters/number'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  GaugeChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent,
])

const router = useRouter()
const academicStore = useAcademicContextStore()
const {
  dashboard,
  dashboardError,
  isLoading,
  learnerSearch,
  allLearnerOptions,
  fichaOptions,
  visiblePendingLearners,
  visibleCompetenciesByPending,
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

// 1. GAUGE DE SALUD Y AVANCE CURRICULAR
const gaugeOption = computed(() => {
  const rawProgress = dashboard.value?.overview.averageProgress ?? 0
  const progressVal = rawProgress > 1 ? Number(rawProgress.toFixed(1)) : Number((rawProgress * 100).toFixed(1))

  return {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '75%'],
        radius: '110%',
        min: 0,
        max: 100,
        splitNumber: 5,
        axisLine: {
          lineStyle: {
            width: 14,
            color: [
              [0.4, '#e11d48'],
              [0.75, '#d97706'],
              [1, '#059669'],
            ],
          },
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '12%',
          width: 8,
          offsetCenter: [0, '-55%'],
          itemStyle: {
            color: '#0f172a',
          },
        },
        axisTick: {
          length: 6,
          lineStyle: { color: 'auto', width: 1.5 },
        },
        splitLine: {
          length: 10,
          lineStyle: { color: 'auto', width: 2 },
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
          distance: -35,
          formatter: (value: number) => `${value}%`,
        },
        title: {
          offsetCenter: [0, '-18%'],
          fontSize: 11,
          fontWeight: 'bold',
          color: '#64748b',
        },
        detail: {
          fontSize: 24,
          offsetCenter: [0, '10%'],
          valueAnimation: true,
          formatter: (value: number) => `${value.toFixed(1)}%`,
          color: '#0f172a',
          fontWeight: '900',
        },
        data: [
          {
            value: progressVal,
            name: 'Avance Ficha',
          },
        ],
      },
    ],
  }
})

// 2. RADAR CURRICULAR 360°
const radarOption = computed(() => {
  const comps = (dashboard.value?.competencies ?? []).slice(0, 6)
  if (!comps.length) return {}

  const indicators = comps.map((c) => {
    const label = c.codigo_juicio || c.codigo_proyecto || (c.name.length > 18 ? c.name.slice(0, 16) + '...' : c.name)
    return {
      name: label,
      max: 100,
      min: 0,
    }
  })

  const values = comps.map((c) => Math.round(c.approvalRate))

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0f172a',
      borderColor: '#0f172a',
      textStyle: { color: '#fff', fontSize: 11 },
      formatter: () => {
        let html = '<div style="font-weight:bold;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:2px;">% Aprobación por Norma:</div>'
        comps.forEach((c) => {
          const name = c.codigo_juicio ? `Norma ${c.codigo_juicio}` : c.name.slice(0, 22) + '...'
          html += `<div style="display:flex;justify-content:space-between;gap:12px;margin-top:2px;"><span>${name}:</span><b>${Math.round(c.approvalRate)}%</b></div>`
        })
        return html
      },
    },
    radar: {
      indicator: indicators,
      radius: '62%',
      center: ['50%', '52%'],
      splitNumber: 4,
      axisName: {
        color: '#475569',
        fontSize: 10,
        fontWeight: 'bold',
      },
      splitLine: {
        lineStyle: {
          color: '#e2e8f0',
        },
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['#f8fafc', '#f1f5f9', '#f8fafc', '#f1f5f9'],
        },
      },
      axisLine: {
        lineStyle: { color: '#cbd5e1' },
      },
    },
    series: [
      {
        name: 'Cumplimiento por Norma',
        type: 'radar',
        data: [
          {
            value: values,
            name: '% Aprobación',
            areaStyle: {
              color: 'rgba(5, 150, 105, 0.25)',
            },
            lineStyle: {
              color: '#059669',
              width: 2.5,
            },
            itemStyle: {
              color: '#059669',
            },
          },
        ],
      },
    ],
  }
})

// 3. BALANCE DE JUICIOS EVALUATIVOS (DONUT MODERNO)
const donutJudgementsOption = computed(() => {
  const approved = dashboard.value?.overview.approvedJudgements ?? 0
  const pending = dashboard.value?.overview.pendingJudgements ?? 0
  const disapproved = dashboard.value?.overview.disapprovedJudgements ?? 0

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: <b>{c}</b> ({d}%)',
      backgroundColor: '#0f172a',
      textStyle: { color: '#fff', fontSize: 11 },
    },
    legend: {
      bottom: '0%',
      left: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 11, color: '#475569', fontWeight: '500' },
    },
    series: [
      {
        name: 'Estado de Juicios',
        type: 'pie',
        radius: ['52%', '78%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        data: [
          { value: approved, name: 'Aprobados', itemStyle: { color: '#059669' } },
          { value: pending, name: 'Por Evaluar', itemStyle: { color: '#d97706' } },
          { value: disapproved, name: 'No Aprobados', itemStyle: { color: '#e11d48' } },
        ],
      },
    ],
  }
})

// 4. TOP COMPETENCIAS CON MAYOR NÚMERO DE PENDIENTES
const pendingCompetenciesBarOption = computed(() => {
  const topPending = visibleCompetenciesByPending.value
  const labels = topPending.map((c) => c.code)
  const data = topPending.map((c) => c.pending)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#0f172a',
      textStyle: { color: '#fff', fontSize: 11 },
      formatter: (params: any) => {
        const item = params[0]
        const comp = topPending[item.dataIndex]
        return `<b>${comp?.code}</b><br/>${comp?.name}<br/>Pendientes: <b>${item.value}</b> juicios`
      },
    },
    grid: {
      top: '8%',
      left: '3%',
      right: '8%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { fontSize: 10, color: '#64748b' },
    },
    yAxis: {
      type: 'category',
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 10, fontWeight: 'bold', color: '#475569' },
    },
    series: [
      {
        name: 'Juicios Pendientes',
        type: 'bar',
        data: data,
        itemStyle: {
          color: '#d97706',
          borderRadius: [0, 6, 6, 0],
        },
        barWidth: 14,
      },
    ],
  }
})

// 5. RITMO HISTÓRICO DE EVALUACIONES (TIMELINE)
const timelineOption = computed(() => {
  const judgements = dashboard.value?.recentJudgements ?? []
  const dateCounts: Record<string, number> = {}

  judgements.forEach((j) => {
    if (j.registeredAt) {
      const d = j.registeredAt.split('T')[0] || 'Reciente'
      dateCounts[d] = (dateCounts[d] || 0) + 1
    }
  })

  const sortedDates = Object.keys(dateCounts).sort()
  const dateLabels = sortedDates.length > 0 ? sortedDates : ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4']
  const counts = sortedDates.length > 0 ? sortedDates.map((d) => dateCounts[d] ?? 0) : [12, 28, 45, 30]

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      textStyle: { color: '#fff', fontSize: 11 },
    },
    grid: {
      top: '12%',
      left: '3%',
      right: '4%',
      bottom: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dateLabels,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { fontSize: 10, color: '#64748b' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { fontSize: 10, color: '#64748b' },
    },
    series: [
      {
        name: 'Juicios Registrados',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#059669' },
        lineStyle: { width: 2.5, color: '#059669' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(5, 150, 105, 0.3)' },
              { offset: 1, color: 'rgba(5, 150, 105, 0.01)' },
            ],
          },
        },
        data: counts,
      },
    ],
  }
})

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
    <!-- Header Section -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
      <div>
        <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
          <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
          Centro de Analítica Académica
        </span>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Dashboard de Juicios Evaluativos
        </h1>
        <p class="mt-0.5 text-xs text-slate-500">
          Supervisión integral de avance formativo, balance curricular y aprendices con juicios pendientes.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300"
          type="button"
          @click="resetFilters"
        >
          Restablecer Filtros
        </button>
      </div>
    </div>

    <!-- Filters Toolbar -->
    <div class="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label class="block text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">Ficha</label>
          <select
            v-model="filters.ficha"
            class="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white cursor-pointer"
          >
            <option value="">Todas las Fichas</option>
            <option v-for="f in fichaOptions" :key="f.codigo" :value="f.codigo">{{ f.codigo }} - {{ f.nombre }}</option>
          </select>
        </div>

        <div>
          <label class="block text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">Estado Formación</label>
          <select
            v-model="filters.estado"
            class="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white cursor-pointer"
          >
            <option value="">Todos los Estados</option>
            <option v-for="e in dashboard?.options.estados ?? []" :key="e" :value="e">{{ prettyState(e) }}</option>
          </select>
        </div>

        <div>
          <label class="block text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">Competencia</label>
          <select
            v-model="filters.competencia"
            class="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white cursor-pointer"
          >
            <option value="">Todas las Competencias</option>
            <option v-for="c in filteredCompetencyOptions" :key="c.codigo" :value="c.codigo">{{ c.codigo }} - {{ c.nombre }}</option>
          </select>
        </div>

        <div>
          <label class="block text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">Resultado (RAP)</label>
          <select
            v-model="filters.resultado"
            class="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white cursor-pointer"
          >
            <option value="">Todos los Resultados</option>
            <option v-for="r in filteredResultOptions" :key="r.codigo" :value="r.codigo">{{ r.codigo }} - {{ r.detalle }}</option>
          </select>
        </div>

        <div>
          <label class="block text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 mb-1">Aprendiz</label>
          <select
            :value="filters.aprendiz"
            class="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white cursor-pointer"
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

    <!-- Loading State -->
    <div v-if="isLoading" class="flex min-h-[35vh] items-center justify-center">
      <div class="flex flex-col items-center gap-2 text-slate-400">
        <svg class="h-6 w-6 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-xs font-medium">Cargando métricas analíticas...</p>
      </div>
    </div>

    <!-- Top KPI Cards -->
    <div v-else-if="dashboard" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <span class="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">Población Estudiantil</span>
        <p class="mt-1 text-2xl font-black text-slate-900">{{ dashboard.overview.learnerCount }}</p>
        <span class="mt-1 block text-xs font-semibold text-emerald-600">{{ dashboard.overview.inTrainingCount }} en formación activa</span>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Juicios Aprobados</span>
        <p class="mt-1 text-2xl font-black text-emerald-600">{{ dashboard.overview.approvedJudgements }}</p>
        <span class="mt-1 block text-xs font-medium text-slate-500">Avance promedio: {{ formatPercent(dashboard.overview.averageProgress) }}</span>
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

    <!-- Analytics Dashboard Tier 1 (Gauge + Radar + Donut) -->
    <div v-if="dashboard" class="grid gap-5 lg:grid-cols-3">
      <!-- Semicircular Gauge: Salud de la Ficha -->
      <div class="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div class="border-b border-slate-100 pb-2">
          <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Cumplimiento Global</span>
          <h3 class="text-xs font-bold text-slate-900">Salud y Avance Curricular</h3>
        </div>
        <div class="h-48 w-full">
          <VChart :option="gaugeOption" autoresize />
        </div>
      </div>

      <!-- Radar 360° de Competencias -->
      <div class="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div class="border-b border-slate-100 pb-2">
          <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Equilibrio Curricular</span>
          <h3 class="text-xs font-bold text-slate-900">Radar de Competencias 360°</h3>
        </div>
        <div class="h-48 w-full">
          <VChart :option="radarOption" autoresize />
        </div>
      </div>

      <!-- Donut de Balance de Juicios -->
      <div class="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div class="border-b border-slate-100 pb-2">
          <span class="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">Distribución</span>
          <h3 class="text-xs font-bold text-slate-900">Balance de Juicios Evaluativos</h3>
        </div>
        <div class="h-48 w-full">
          <VChart :option="donutJudgementsOption" autoresize />
        </div>
      </div>
    </div>

    <!-- Analytics Dashboard Tier 2 (Top Pending Competencies + Evaluation Timeline) -->
    <div v-if="dashboard" class="grid gap-5 lg:grid-cols-2">
      <!-- Bar: Competencias con más pendientes -->
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div class="border-b border-slate-100 pb-2 mb-3">
          <span class="text-[0.65rem] font-bold uppercase tracking-wider text-amber-700">Cuello de Botella</span>
          <h3 class="text-xs font-bold text-slate-900">Normas con Mayor Volumen de Juicios Pendientes</h3>
        </div>
        <div class="h-56 w-full">
          <VChart :option="pendingCompetenciesBarOption" autoresize />
        </div>
      </div>

      <!-- Timeline: Ritmo de Evaluaciones -->
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div class="border-b border-slate-100 pb-2 mb-3">
          <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Actividad Docente</span>
          <h3 class="text-xs font-bold text-slate-900">Ritmo Histórico de Juicios Registrados</h3>
        </div>
        <div class="h-56 w-full">
          <VChart :option="timelineOption" autoresize />
        </div>
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
                  Ver Expediente →
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
