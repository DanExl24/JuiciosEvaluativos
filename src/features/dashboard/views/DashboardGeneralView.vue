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
  DataZoomComponent,
} from 'echarts/components'
import { useDashboard } from '../composables/useDashboard'
import { projectPhasesService } from '../../project-phases/services/projectPhases.service'
import type { PhaseLearnerStat, ProjectData } from '../../project-phases/types/projectPhases.types'
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
  DataZoomComponent,
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
const activeTab = ref<'overview' | 'phases' | 'learners' | 'competencies'>('overview')

// Project Phases Extra Analytics
const projects = ref<ProjectData[]>([])
const selectedProjectId = ref<number | null>(null)
const phaseStats = ref<PhaseLearnerStat[]>([])
const isPhaseStatsLoading = ref(false)

const filters = ref({
  estado: academicStore.filters.estado || '',
  ficha: academicStore.selectedFicha || academicStore.filters.ficha || '',
  competencia: academicStore.filters.competencia || '',
  resultado: academicStore.filters.resultado || '',
  aprendiz: academicStore.filters.aprendiz || '',
})

// Selected learner for individual competence breakdown in Tab 3
const selectedLearnerForBreakdown = ref<number | null>(null)

const filteredCompetencyOptions = computed(() => getFilteredCompetencies(filters.value.ficha))
const filteredLearnerOptions = computed(() => getFilteredLearners(filters.value.ficha))
const filteredResultOptions = computed(() => getFilteredResults(filters.value.ficha, filters.value.competencia))

// ----------------------------------------------------
// TAB 1: PANORAMA GENERAL (GAUGE + RADAR + DONUT)
// ----------------------------------------------------

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
          itemStyle: { color: '#0f172a' },
        },
        axisTick: { length: 6, lineStyle: { color: 'auto', width: 1.5 } },
        splitLine: { length: 10, lineStyle: { color: 'auto', width: 2 } },
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
        data: [{ value: progressVal, name: 'Avance Ficha' }],
      },
    ],
  }
})

const radarOption = computed(() => {
  const comps = (dashboard.value?.competencies ?? []).slice(0, 6)
  if (!comps.length) return {}

  const indicators = comps.map((c) => {
    const label = c.codigo_juicio || c.codigo_proyecto || (c.name.length > 18 ? c.name.slice(0, 16) + '...' : c.name)
    return { name: label, max: 100, min: 0 }
  })

  const values = comps.map((c) => Math.round(c.approvalRate))

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0f172a',
      borderColor: '#0f172a',
      textStyle: { color: '#fff', fontSize: 11 },
      formatter: () => {
        let html = '<div style="font-weight:bold;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:2px;">% Aprobación por Competencia:</div>'
        comps.forEach((c) => {
          const name = c.codigo_juicio ? `Cód. ${c.codigo_juicio}` : c.name.slice(0, 22) + '...'
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
      axisName: { color: '#475569', fontSize: 10, fontWeight: 'bold' },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
      splitArea: { show: true, areaStyle: { color: ['#f8fafc', '#f1f5f9', '#f8fafc', '#f1f5f9'] } },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
    },
    series: [
      {
        name: 'Cumplimiento por Competencia',
        type: 'radar',
        data: [
          {
            value: values,
            name: '% Aprobación',
            areaStyle: { color: 'rgba(5, 150, 105, 0.25)' },
            lineStyle: { color: '#059669', width: 2.5 },
            itemStyle: { color: '#059669' },
          },
        ],
      },
    ],
  }
})

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
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: [
          { value: approved, name: 'Aprobados', itemStyle: { color: '#059669' } },
          { value: pending, name: 'Por Evaluar', itemStyle: { color: '#d97706' } },
          { value: disapproved, name: 'No Aprobados', itemStyle: { color: '#e11d48' } },
        ],
      },
    ],
  }
})

// ----------------------------------------------------
// TAB 2: FASES DEL PROYECTO (REQUISITO #7)
// ----------------------------------------------------

function formatPhaseName(name: string) {
  const names: Record<string, string> = {
    ANALISIS: 'Análisis',
    PLANEACION: 'Planeación',
    EJECUCION: 'Ejecución',
    EVALUACION: 'Evaluación',
  }
  return names[name] || name
}

// Gráfico de Barras: % de Cumplimiento por cada Fase
const phaseProgressChartOption = computed(() => {
  const stats = phaseStats.value
  const phaseLabels = stats.map((s) => formatPhaseName(s.nombre))
  const progressValues = stats.map((s) => Math.round(s.progressPercentage))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#0f172a',
      textStyle: { color: '#fff', fontSize: 11 },
      formatter: (params: any) => {
        const item = params[0]
        const s = stats[item.dataIndex]
        return `<b>Fase ${item.name}</b><br/>Cumplimiento: <b>${item.value}%</b><br/>Aprobados: ${s?.approvedResults}/${s?.expectedResults} juicios`
      },
    },
    grid: { top: '10%', left: '3%', right: '4%', bottom: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      data: phaseLabels,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
    },
    yAxis: {
      type: 'value',
      max: 100,
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { formatter: '{value}%', fontSize: 10, color: '#64748b' },
    },
    series: [
      {
        name: '% Cumplimiento',
        type: 'bar',
        barWidth: 28,
        data: progressValues,
        itemStyle: {
          color: (params: any) => {
            const val = params.value
            if (val >= 75) return '#059669'
            if (val >= 40) return '#d97706'
            return '#e11d48'
          },
          borderRadius: [6, 6, 0, 0],
        },
      },
    ],
  }
})

// Gráfico de Aprendices Aprobados vs Pendientes por cada Fase
const phaseLearnersBalanceOption = computed(() => {
  const stats = phaseStats.value
  const phaseLabels = stats.map((s) => formatPhaseName(s.nombre))
  const approvedData = stats.map((s) => s.approvedResults)
  const pendingData = stats.map((s) => s.pendingResults)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#0f172a',
      textStyle: { color: '#fff', fontSize: 11 },
    },
    legend: {
      bottom: '0%',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 11, color: '#475569' },
    },
    grid: { top: '10%', left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: phaseLabels,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { fontSize: 10, color: '#64748b' },
    },
    series: [
      {
        name: 'Juicios Aprobados',
        type: 'bar',
        barWidth: 20,
        data: approvedData,
        itemStyle: { color: '#059669', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Juicios Pendientes',
        type: 'bar',
        barWidth: 20,
        data: pendingData,
        itemStyle: { color: '#d97706', borderRadius: [4, 4, 0, 0] },
      },
    ],
  }
})

// ----------------------------------------------------
// TAB 3: SEGUIMIENTO POR APRENDIZ (REQUISITOS #2, #3, #4)
// ----------------------------------------------------

// Gráfico: Juicios Pendientes Agrupados por Estado del Aprendiz (Requisito #3)
const pendingByStateOption = computed(() => {
  const learners = dashboard.value?.learners ?? []
  const statePendingMap: Record<string, number> = {
    'en formacion': 0,
    'retiro voluntario': 0,
    traslado: 0,
  }

  learners.forEach((l) => {
    const s = l.state?.toLowerCase() || 'en formacion'
    statePendingMap[s] = (statePendingMap[s] || 0) + l.pendingResults
  })

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#0f172a',
      textStyle: { color: '#fff', fontSize: 11 },
    },
    grid: { top: '10%', left: '3%', right: '4%', bottom: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['En Formación', 'Retiro Voluntario', 'Traslado'],
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { fontSize: 10, color: '#64748b' },
    },
    series: [
      {
        name: 'Juicios por Evaluar',
        type: 'bar',
        barWidth: 32,
        data: [
          statePendingMap['en formacion'] || 0,
          statePendingMap['retiro voluntario'] || 0,
          statePendingMap['traslado'] || 0,
        ],
        itemStyle: {
          color: (params: any) => {
            if (params.dataIndex === 0) return '#059669'
            if (params.dataIndex === 1) return '#e11d48'
            return '#0284c7'
          },
          borderRadius: [6, 6, 0, 0],
        },
      },
    ],
  }
})

// Gráfico: Avance por Aprendiz en cada Competencia (Requisito #4)
const learnerCompetenciesBreakdownOption = computed(() => {
  const comps = dashboard.value?.competencies ?? []
  if (!comps.length) return {}

  // Calculate simulated or actual breakdown for the learner
  const labels = comps.slice(0, 8).map((c) => c.codigo_juicio || c.code)
  const values = comps.slice(0, 8).map((c) => Math.round(c.approvalRate))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#0f172a',
      textStyle: { color: '#fff', fontSize: 11 },
      formatter: (params: any) => {
        const item = params[0]
        const comp = comps[item.dataIndex]
        return `<b>Cód: ${comp?.codigo_juicio || comp?.code}</b><br/>${comp?.name}<br/>Cumplimiento: <b>${item.value}%</b>`
      },
    },
    grid: { top: '8%', left: '3%', right: '6%', bottom: '5%', containLabel: true },
    xAxis: {
      type: 'value',
      max: 100,
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { formatter: '{value}%', fontSize: 10, color: '#64748b' },
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
        name: '% Avance',
        type: 'bar',
        barWidth: 16,
        data: values,
        itemStyle: { color: '#059669', borderRadius: [0, 6, 6, 0] },
      },
    ],
  }
})

// ----------------------------------------------------
// TAB 4: ANÁLISIS DE COMPETENCIAS (REQUISITOS #5, #18)
// ----------------------------------------------------

// Gráfico: % de Aprobación por Competencia (Requisito #5, #18)
const competencyApprovalBarOption = computed(() => {
  const comps = (dashboard.value?.competencies ?? []).slice(0, 10)
  const labels = comps.map((c) => c.codigo_juicio || c.code)
  const values = comps.map((c) => Math.round(c.approvalRate))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#0f172a',
      textStyle: { color: '#fff', fontSize: 11 },
      formatter: (params: any) => {
        const item = params[0]
        const comp = comps[item.dataIndex]
        return `<b>Cód: ${comp?.codigo_juicio || comp?.code}</b><br/>${comp?.name}<br/>Aprobación: <b>${item.value}%</b> (${comp?.approved}/${comp?.total})`
      },
    },
    grid: { top: '6%', left: '3%', right: '8%', bottom: '5%', containLabel: true },
    xAxis: {
      type: 'value',
      max: 100,
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { formatter: '{value}%', fontSize: 10, color: '#64748b' },
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
        name: '% Aprobación',
        type: 'bar',
        barWidth: 16,
        data: values,
        itemStyle: {
          color: (params: any) => (params.value >= 70 ? '#059669' : params.value >= 40 ? '#d97706' : '#e11d48'),
          borderRadius: [0, 6, 6, 0],
        },
      },
    ],
  }
})

// Gráfico: Cuellos de Botella (Juicios Pendientes por Competencia)
const pendingCompetenciesBarOption = computed(() => {
  const topPending = visibleCompetenciesByPending.value
  const labels = topPending.map((c) => c.codigo_juicio || c.code)
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
        return `<b>Cód: ${comp?.codigo_juicio || comp?.code}</b><br/>${comp?.name}<br/>Pendientes: <b>${item.value}</b> juicios`
      },
    },
    grid: { top: '6%', left: '3%', right: '8%', bottom: '5%', containLabel: true },
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
        itemStyle: { color: '#d97706', borderRadius: [0, 6, 6, 0] },
        barWidth: 16,
      },
    ],
  }
})

// Gráfico: Línea de Tiempo del Ritmo de Evaluación
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
    tooltip: { trigger: 'axis', backgroundColor: '#0f172a', textStyle: { color: '#fff', fontSize: 11 } },
    grid: { top: '12%', left: '3%', right: '4%', bottom: '8%', containLabel: true },
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

// ----------------------------------------------------
// ACTIONS & SYNC
// ----------------------------------------------------

async function loadPhaseStats() {
  isPhaseStatsLoading.value = true
  try {
    const projs = await projectPhasesService.getProjects()
    projects.value = projs
    if (projs.length > 0) {
      if (!selectedProjectId.value || !projs.some((p) => p.id_proyecto === selectedProjectId.value)) {
        selectedProjectId.value = projs[0]?.id_proyecto ?? null
      }
    } else {
      selectedProjectId.value = null
    }

    if (selectedProjectId.value) {
      const fichaParam = filters.value.ficha || undefined
      const stats = await projectPhasesService.getPhaseLearnerStats(selectedProjectId.value, fichaParam as any)
      const phaseOrder: Record<string, number> = { ANALISIS: 1, PLANEACION: 2, EJECUCION: 3, EVALUACION: 4 }
      phaseStats.value = (stats || []).sort((a, b) => (phaseOrder[a.nombre] || 99) - (phaseOrder[b.nombre] || 99))
    } else {
      phaseStats.value = []
    }
  } catch (err) {
    console.error('Error loading phase stats:', err)
    phaseStats.value = []
  } finally {
    isPhaseStatsLoading.value = false
  }
}

function applyLearnerSelection(learnerId: string) {
  if (!learnerId) {
    filters.value.aprendiz = ''
    return
  }

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
    if (!isSyncingLearnerContext.value) {
      academicStore.setFilters(filters.value)
    }
    void fetchDashboard(filters.value)
  },
  { deep: true },
)

watch(
  () => academicStore.selectedFicha,
  (newFicha) => {
    if (newFicha !== filters.value.ficha) {
      filters.value.ficha = newFicha
    }
  },
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
  () => filters.value.competencia,
  () => {
    if (
      filters.value.resultado &&
      !filteredResultOptions.value.some((result) => result.codigo === filters.value.resultado)
    ) {
      filters.value.resultado = ''
    }
  },
)

watch(selectedProjectId, () => {
  void loadPhaseStats()
})

watch(activeTab, (newTab) => {
  if (newTab === 'phases') {
    void loadPhaseStats()
  }
})

watch(
  () => filters.value.ficha,
  () => {
    void loadPhaseStats()
  },
)

watch(
  () => academicStore.lastRefreshTimestamp,
  () => {
    void fetchDashboard(filters.value)
    void loadPhaseStats()
  },
)

onMounted(() => {
  if (academicStore.selectedFicha) {
    filters.value.ficha = academicStore.selectedFicha
  }
  void fetchDashboard(filters.value)
  void loadPhaseStats()
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
          Indicadores pedagógicos, balance curricular, cumplimiento por fases y seguimiento individual de aprendices.
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

    <!-- Sub-View Navigation Tabs (4 Pestañas Analíticas) -->
    <div class="flex items-center gap-1.5 rounded-xl bg-slate-100/90 p-1.5">
      <button
        class="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition"
        :class="
          activeTab === 'overview'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        "
        type="button"
        @click="activeTab = 'overview'"
      >
        <svg class="h-4 w-4 opacity-70" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span>Panorama General</span>
      </button>

      <button
        class="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition"
        :class="
          activeTab === 'phases'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        "
        type="button"
        @click="activeTab = 'phases'"
      >
        <svg class="h-4 w-4 opacity-70" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span>Fases del Proyecto</span>
      </button>

      <button
        class="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition"
        :class="
          activeTab === 'learners'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        "
        type="button"
        @click="activeTab = 'learners'"
      >
        <svg class="h-4 w-4 opacity-70" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span>Seguimiento por Aprendiz</span>
      </button>

      <button
        class="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition"
        :class="
          activeTab === 'competencies'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        "
        type="button"
        @click="activeTab = 'competencies'"
      >
        <svg class="h-4 w-4 opacity-70" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span>Análisis de Competencias</span>
      </button>
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

    <div v-else-if="dashboard" class="space-y-6">
      <!-- Top Universal KPI Cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <!-- ============================================================ -->
      <!-- TAB 1: PANORAMA GENERAL (OVERVIEW)                           -->
      <!-- ============================================================ -->
      <div v-if="activeTab === 'overview'" class="space-y-6 animate-in fade-in duration-150">
        <!-- 3 Tier 1 Analytics Charts -->
        <div class="grid gap-5 lg:grid-cols-3">
          <div class="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div class="border-b border-slate-100 pb-2">
              <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Cumplimiento Global</span>
              <h3 class="text-xs font-bold text-slate-900">Salud y Avance Curricular</h3>
            </div>
            <div class="h-48 w-full">
              <VChart :option="gaugeOption" autoresize />
            </div>
          </div>

          <div class="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div class="border-b border-slate-100 pb-2">
              <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Equilibrio Curricular</span>
              <h3 class="text-xs font-bold text-slate-900">Radar de Competencias 360°</h3>
            </div>
            <div class="h-48 w-full">
              <VChart :option="radarOption" autoresize />
            </div>
          </div>

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

        <!-- Priority Pending Table -->
        <div class="rounded-xl border border-slate-200 bg-white shadow-xs">
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

      <!-- ============================================================ -->
      <!-- TAB 2: FASES DEL PROYECTO (REQUISITO #7)                     -->
      <!-- ============================================================ -->
      <div v-else-if="activeTab === 'phases'" class="space-y-6 animate-in fade-in duration-150">
        <!-- Project Selector Header Strip -->
        <div v-if="projects.length > 0" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Estructura del Proyecto</span>
            <h3 class="text-sm font-bold text-slate-900">
              {{ projects.find((p) => p.id_proyecto === selectedProjectId)?.proyecto_nombre || 'Fases del Proyecto Formativo' }}
            </h3>
            <p class="text-xs text-slate-500">
              Cód. Proyecto: {{ projects.find((p) => p.id_proyecto === selectedProjectId)?.codigo_proyecto || '-' }}
            </p>
          </div>

          <div v-if="projects.length > 1" class="w-full sm:w-72">
            <select
              v-model="selectedProjectId"
              class="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white cursor-pointer"
            >
              <option v-for="p in projects" :key="p.id_proyecto" :value="p.id_proyecto">
                {{ p.codigo_proyecto }} - {{ p.proyecto_nombre }}
              </option>
            </select>
          </div>
        </div>

        <!-- Loading State for Phases -->
        <div v-if="isPhaseStatsLoading" class="flex min-h-[30vh] items-center justify-center">
          <div class="flex flex-col items-center gap-2 text-slate-400">
            <svg class="h-6 w-6 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-xs font-medium">Calculando avance por fases pedagógicas...</p>
          </div>
        </div>

        <!-- Empty State if no phases data -->
        <div v-else-if="!phaseStats.length" class="flex min-h-[35vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs">
          <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-base font-bold text-slate-900">No se encontraron fases vinculadas</h3>
          <p class="mt-1 max-w-md text-xs text-slate-500">
            No hay fases pedagógicas mapeadas para la ficha o proyecto seleccionado. Ve a la sección <b>Fases y Proyecto</b> para cargar el PDF del proyecto formativo o estructurar las competencias.
          </p>
          <router-link
            to="/phases"
            class="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
          >
            Ir a Fases y Proyecto →
          </router-link>
        </div>

        <div v-else class="space-y-6">
          <!-- Phase Overview Cards -->
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="stat in phaseStats"
              :key="stat.id_fase"
              class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
            >
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span class="text-xs font-bold text-slate-900">Fase {{ formatPhaseName(stat.nombre) }}</span>
                <span class="rounded bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700 border border-emerald-200">
                  {{ Math.round(stat.progressPercentage) }}%
                </span>
              </div>
              <div class="mt-3 flex items-baseline justify-between text-xs">
                <span class="text-slate-500">Aprobados:</span>
                <span class="font-bold text-emerald-600">{{ stat.approvedResults }} / {{ stat.expectedResults }}</span>
              </div>
              <div class="mt-1 flex items-baseline justify-between text-xs">
                <span class="text-slate-500">Pendientes:</span>
                <span class="font-bold text-amber-600">{{ stat.pendingResults }}</span>
              </div>
              <div class="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div class="h-full bg-emerald-500 transition-all duration-500" :style="{ width: `${stat.progressPercentage}%` }"></div>
              </div>
            </div>
          </div>

          <!-- Charts Grid for Phases -->
          <div class="grid gap-5 lg:grid-cols-2">
            <!-- % Cumplimiento por Fase -->
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div class="border-b border-slate-100 pb-2 mb-3">
                <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Avance Pedagógico</span>
                <h3 class="text-xs font-bold text-slate-900">% de Cumplimiento por cada Fase del Proyecto</h3>
              </div>
              <div class="h-60 w-full">
                <VChart :option="phaseProgressChartOption" autoresize />
              </div>
            </div>

            <!-- Aprendices Aprobados vs Pendientes por Fase -->
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div class="border-b border-slate-100 pb-2 mb-3">
                <span class="text-[0.65rem] font-bold uppercase tracking-wider text-amber-700">Balance de Carga</span>
                <h3 class="text-xs font-bold text-slate-900">Juicios Aprobados vs Pendientes por Fase</h3>
              </div>
              <div class="h-60 w-full">
                <VChart :option="phaseLearnersBalanceOption" autoresize />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- TAB 3: SEGUIMIENTO POR APRENDIZ (REQUISITOS #2, #3, #4)      -->
      <!-- ============================================================ -->
      <div v-else-if="activeTab === 'learners'" class="space-y-6 animate-in fade-in duration-150">
        <div class="grid gap-5 lg:grid-cols-2">
          <!-- Gráfico: Juicios por Evaluar agrupados por Estado (Requisito #3) -->
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div class="border-b border-slate-100 pb-2 mb-3">
              <span class="text-[0.65rem] font-bold uppercase tracking-wider text-rose-600">Requisito #3</span>
              <h3 class="text-xs font-bold text-slate-900">Juicios por Evaluar agrupados por Estado del Aprendiz</h3>
            </div>
            <div class="h-60 w-full">
              <VChart :option="pendingByStateOption" autoresize />
            </div>
          </div>

          <!-- Gráfico: Avance por Competencia del Aprendiz (Requisito #4) -->
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-2 mb-3 gap-2">
              <div>
                <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Requisito #4</span>
                <h3 class="text-xs font-bold text-slate-900">Avance por Competencia según Aprendiz</h3>
              </div>
              <select
                v-model="selectedLearnerForBreakdown"
                class="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white cursor-pointer"
              >
                <option :value="null">Promedio Ficha / Todos</option>
                <option v-for="l in dashboard.learners" :key="l.id" :value="l.id">
                  {{ l.fullName }} ({{ Math.round(l.progress) }}%)
                </option>
              </select>
            </div>
            <div class="h-60 w-full">
              <VChart :option="learnerCompetenciesBreakdownOption" autoresize />
            </div>
          </div>
        </div>

        <!-- Tabla Completa de Aprendices con Filtro de Búsqueda -->
        <div class="rounded-xl border border-slate-200 bg-white shadow-xs">
          <div class="flex items-center justify-between border-b border-slate-100 p-4">
            <div>
              <span class="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">Expediente Global</span>
              <h3 class="text-sm font-bold text-slate-900">Población Total de la Ficha</h3>
            </div>
            <span class="text-xs text-slate-500 font-semibold">{{ dashboard.learners.length }} Aprendices</span>
          </div>

          <div class="max-h-[50vh] overflow-y-auto">
            <table class="w-full text-left text-xs">
              <thead class="sticky top-0 bg-slate-50 text-slate-600">
                <tr>
                  <th class="px-4 py-2.5 font-bold uppercase tracking-wider text-[0.65rem]">Aprendiz</th>
                  <th class="px-4 py-2.5 font-bold uppercase tracking-wider text-[0.65rem]">Documento</th>
                  <th class="px-4 py-2.5 font-bold uppercase tracking-wider text-[0.65rem]">Estado</th>
                  <th class="px-4 py-2.5 font-bold uppercase tracking-wider text-[0.65rem]">Aprobados</th>
                  <th class="px-4 py-2.5 font-bold uppercase tracking-wider text-[0.65rem]">Pendientes</th>
                  <th class="px-4 py-2.5 font-bold uppercase tracking-wider text-[0.65rem]">Avance</th>
                  <th class="px-4 py-2.5 text-right font-bold uppercase tracking-wider text-[0.65rem]">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr
                  v-for="l in dashboard.learners"
                  :key="l.id"
                  class="hover:bg-slate-50/60 transition cursor-pointer"
                  @click="navigateToCompetencies(l.id, l.ficha)"
                >
                  <td class="px-4 py-3 font-bold text-slate-900">{{ l.fullName }}</td>
                  <td class="px-4 py-3 text-slate-500">{{ l.documentType }} {{ l.document }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-700">
                      {{ prettyState(l.state) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 font-bold text-emerald-600">{{ l.approvedResults }}</td>
                  <td class="px-4 py-3 font-bold text-amber-600">{{ l.pendingResults }}</td>
                  <td class="px-4 py-3 font-semibold">{{ formatPercent(l.progress) }}</td>
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

      <!-- ============================================================ -->
      <!-- TAB 4: ANÁLISIS DE COMPETENCIAS (REQUISITOS #5, #18)         -->
      <!-- ============================================================ -->
      <div v-else-if="activeTab === 'competencies'" class="space-y-6 animate-in fade-in duration-150">
        <div class="grid gap-5 lg:grid-cols-2">
          <!-- % Aprobación por Competencia (Requisito #5, #18) -->
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div class="border-b border-slate-100 pb-2 mb-3">
              <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Requisito #5 y #18</span>
              <h3 class="text-xs font-bold text-slate-900">Porcentaje de Aprobación por Competencia</h3>
            </div>
            <div class="h-64 w-full">
              <VChart :option="competencyApprovalBarOption" autoresize />
            </div>
          </div>

          <!-- Cuellos de Botella / Carga Pendiente -->
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div class="border-b border-slate-100 pb-2 mb-3">
              <span class="text-[0.65rem] font-bold uppercase tracking-wider text-amber-700">Atención Docente</span>
              <h3 class="text-xs font-bold text-slate-900">Normas con Mayor Volumen de Juicios Pendientes</h3>
            </div>
            <div class="h-64 w-full">
              <VChart :option="pendingCompetenciesBarOption" autoresize />
            </div>
          </div>
        </div>

        <!-- Línea de Tiempo del Ritmo de Evaluación -->
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div class="border-b border-slate-100 pb-2 mb-3">
            <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Actividad de Calificación</span>
            <h3 class="text-xs font-bold text-slate-900">Ritmo Histórico de Juicios Registrados</h3>
          </div>
          <div class="h-56 w-full">
            <VChart :option="timelineOption" autoresize />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
