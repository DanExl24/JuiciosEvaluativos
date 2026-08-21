<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { Line } from 'vue-chartjs'
import { 
  Chart as ChartJS, 
  type ChartOptions,
  Title, 
  Tooltip, 
  Legend, 
  LineElement, 
  CategoryScale, 
  LinearScale, 
  PointElement,
  Filler
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler)

const props = defineProps<{
  projectId: number
  projectCode: string
  projectName: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

interface LearningOutcome {
  id_resultado: number
  codigo: string
  detalle: string
  approvedCount: number
  totalCount: number
  isApproved: boolean
}

interface Competency {
  id_competencia: number
  codigo: string
  nombre: string
  approvedResults: number
  totalResults: number
  isApproved: boolean
  learningOutcomes: LearningOutcome[]
}

interface ActivityDetail {
  id_actividad?: number
  numero?: number | null
  descripcion: string
}

interface PhaseDetail {
  id_fase: number
  nombre: string
  actividad: string
  actividades?: ActivityDetail[]
  competencies: Competency[]
}

interface UnassignedCompetency {
  id_competencia: number
  codigo: string
  nombre: string
}

interface DesertedLearner {
  nombre: string
  documento: string
  estado: string
  ultima_fecha: string | null
  juicio_estado: string
  competencia_codigo: string
  competencia_nombre: string
  resultado_codigo: string
  resultado_detalle: string
}

interface PhaseLearnerStat {
  id_fase: number
  nombre: string
  approvedResults: number
  pendingResults: number
  expectedResults: number
  desertedCount: number
  trasladoCount: number
  voluntarioCount: number
  desertedLearners: DesertedLearner[]
  progressPercentage: number
}

interface Ficha {
  id_formacion: number
  ficha_caracterizacion: string
}

const phases = ref<PhaseDetail[]>([])
const unassignedComps = ref<UnassignedCompetency[]>([])
const learnerStats = ref<PhaseLearnerStat[]>([])
const fichas = ref<Ficha[]>([])
const selectedFichaId = ref<number | null>(null)
const isLoading = ref(true)
const error = ref('')

const phaseFilters = ref<Record<number, 'all' | 'approved' | 'pending'>>({})
const globalFilter = ref<'all' | 'approved' | 'pending'>('all')
const activePhaseId = ref<number | 'unassigned' | 'learner-progress' | null>(null)
const expandedCompetencies = ref<Set<number>>(new Set())

const searchQuery = ref('')

const isEditMode = ref(false)
const isAssigning = ref(false)
const selectedCompToAssign = ref<UnassignedCompetency | Competency | null>(null)
const selectedPhasesForComp = ref<Set<number>>(new Set())

const isSelectedCompUnassigned = computed(() => {
  if (!selectedCompToAssign.value) return false
  return unassignedComps.value.some(c => c.id_competencia === selectedCompToAssign.value?.id_competencia)
})

function openAssignModal(comp: UnassignedCompetency | Competency) {
  selectedCompToAssign.value = comp
  selectedPhasesForComp.value = new Set()
  phases.value.forEach(p => {
    if (p.competencies.some(c => c.id_competencia === comp.id_competencia)) {
      selectedPhasesForComp.value.add(p.id_fase)
    }
  })
}

function togglePhaseSelection(phaseId: number) {
  if (selectedPhasesForComp.value.has(phaseId)) {
    selectedPhasesForComp.value.delete(phaseId)
  } else {
    selectedPhasesForComp.value.add(phaseId)
  }
}

async function fetchDetails() {
  isLoading.value = true
  error.value = ''
  try {
    const fichaQuery = selectedFichaId.value ? `?fichaId=${selectedFichaId.value}` : ''
    
    const [phasesRes, unassignedRes, learnerStatsRes, fichasRes] = await Promise.all([
      fetch(`${apiBaseUrl}/api/projects/${props.projectId}/phases${fichaQuery}`),
      fetch(`${apiBaseUrl}/api/projects/${props.projectId}/unassigned`),
      fetch(`${apiBaseUrl}/api/projects/${props.projectId}/phase-learner-stats${fichaQuery}`),
      fetch(`${apiBaseUrl}/api/projects/${props.projectId}/fichas`)
    ])

    if (!phasesRes.ok || !unassignedRes.ok || !learnerStatsRes.ok || !fichasRes.ok) throw new Error('Error al cargar datos del proyecto.')

    const phaseOrder: Record<string, number> = {
      'ANALISIS': 1,
      'PLANEACION': 2,
      'EJECUCION': 3,
      'EVALUACION': 4
    }

    const sortPhases = (a: { nombre: string }, b: { nombre: string }) => {
      return (phaseOrder[a.nombre] || 99) - (phaseOrder[b.nombre] || 99)
    }

    phases.value = (await phasesRes.json()).sort(sortPhases)
    unassignedComps.value = await unassignedRes.json()
    learnerStats.value = (await learnerStatsRes.json()).sort(sortPhases)
    fichas.value = await fichasRes.json()

    phases.value.forEach(p => {
      if (!phaseFilters.value[p.id_fase]) {
        phaseFilters.value[p.id_fase] = 'all'
      }
    })

    if (activePhaseId.value === null && phases.value.length > 0) {
      activePhaseId.value = phases.value[0].id_fase
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error desconocido'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void fetchDetails()
})

watch(selectedFichaId, () => {
  void fetchDetails()
})

function setGlobalFilter(filter: 'all' | 'approved' | 'pending') {
  globalFilter.value = filter
  for (const id in phaseFilters.value) {
    phaseFilters.value[id] = filter
  }
}

function getFilteredCompetencies(phase: PhaseDetail) {
  let filtered = phase.competencies

  if (!isEditMode.value) {
    const filter = phaseFilters.value[phase.id_fase] || 'all'
    if (filter === 'approved') filtered = filtered.filter(c => c.isApproved)
    else if (filter === 'pending') filtered = filtered.filter(c => !c.isApproved)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(c => c.codigo.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q))
  }

  return filtered
}

function toggleCompetency(id: number) {
  if (expandedCompetencies.value.has(id)) {
    expandedCompetencies.value.delete(id)
  } else {
    expandedCompetencies.value.add(id)
  }
}

const currentPhase = computed(() => {
  if (typeof activePhaseId.value !== 'number') return null
  return phases.value.find(p => p.id_fase === activePhaseId.value) || null
})

const currentPhaseActivities = computed(() => {
  if (!currentPhase.value) return []
  if (currentPhase.value.actividades && currentPhase.value.actividades.length > 0) {
    return currentPhase.value.actividades.map(a => a.descripcion)
  }
  if (!currentPhase.value.actividad) return []
  // Fallback: split by newline or " / " if legacy data
  if (currentPhase.value.actividad.includes('\n')) {
    return currentPhase.value.actividad.split('\n').map(s => s.trim()).filter(Boolean)
  }
  if (currentPhase.value.actividad.includes(' / ')) {
    return currentPhase.value.actividad.split(' / ').map(s => s.trim()).filter(Boolean)
  }
  return [currentPhase.value.actividad]
})

function getActivityNumber(act: string, idx: number): string | number {
  const match = act.match(/^(\d+)/)
  return match ? match[1] : (idx + 1)
}

function cleanActivityText(act: string): string {
  return act.replace(/^\d+[\.\-\)]\s*/, '').trim()
}

async function saveAssignChanges() {
  if (!selectedCompToAssign.value) return
  isAssigning.value = true
  try {
    const compId = selectedCompToAssign.value.id_competencia
    
    const originalPhases = new Set<number>()
    phases.value.forEach(p => {
      if (p.competencies.some(c => c.id_competencia === compId)) {
        originalPhases.add(p.id_fase)
      }
    })
    
    const toAssign = [...selectedPhasesForComp.value].filter(id => !originalPhases.has(id))
    const toUnassign = [...originalPhases].filter(id => !selectedPhasesForComp.value.has(id))
    
    for (const phaseId of toUnassign) {
      const res = await fetch(`${apiBaseUrl}/api/competencies/${compId}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseId })
      })
      if (!res.ok) throw new Error('No se pudo desasignar la competencia de la fase.')
    }
    
    for (const phaseId of toAssign) {
      const res = await fetch(`${apiBaseUrl}/api/competencies/${compId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseId })
      })
      if (!res.ok) throw new Error('No se pudo asignar la competencia a la fase.')
    }
    
    await fetchDetails()
    selectedCompToAssign.value = null
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Error en la operación')
  } finally {
    isAssigning.value = false
  }
}

const phasesWithIssues = computed(() =>
  phases.value.filter(p => !p.actividad || !(p.competencies && p.competencies.length > 0))
)

watch(phasesWithIssues, (issues) => {
  if (issues.length > 0) {
    console.warn('Algunas fases tienen datos incompletos:', issues.map(i => i.nombre).join(', '))
  }
}, { immediate: true })

async function handleDeleteProject() {
  if (!confirm('¿Estás seguro de que deseas eliminar este proyecto formativo? Esta acción no se puede deshacer.')) return
  
  try {
    const res = await fetch(`${apiBaseUrl}/api/projects/${props.projectId}`, {
      method: 'DELETE'
    })
    if (!res.ok) throw new Error('No se pudo eliminar el proyecto.')
    
    alert('Proyecto eliminado exitosamente.')
    emit('close')
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Error al eliminar')
  }
}

function formatDate(value: string | null) {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleDateString('es-CO', { dateStyle: 'medium' })
}

function formatPhaseName(name: string) {
  const names: Record<string, string> = {
    'ANALISIS': 'ANÁLISIS',
    'PLANEACION': 'PLANEACIÓN',
    'EJECUCION': 'EJECUCIÓN',
    'EVALUACION': 'EVALUACIÓN'
  }
  return names[name] || name
}

const desertionChartData = computed(() => ({
  labels: learnerStats.value.map(s => formatPhaseName(s.nombre)),
  datasets: [{
    label: 'Desertores',
    data: learnerStats.value.map(s => s.desertedCount),
    borderColor: '#e11d48',
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    borderWidth: 4,
    tension: 0.4,
    fill: true,
    pointBackgroundColor: '#fff',
    pointBorderColor: '#e11d48',
    pointBorderWidth: 2,
    pointRadius: 6,
    pointHoverRadius: 8
  }]
}))

const desertionChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index',
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: true,
      backgroundColor: '#0f172a',
      titleFont: { size: 12, weight: 'bold' },
      bodyFont: { size: 12 },
      padding: 12,
      displayColors: false,
      callbacks: {
        title: (items: any) => `Fase: ${items[0].label}`,
        label: (context: any) => {
          const stat = learnerStats.value[context.dataIndex]
          if (!stat) return ''
          return `Total: ${stat.desertedCount} • Traslados: ${stat.trasladoCount} • Retiros: ${stat.voluntarioCount}`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { display: true, color: '#f1f5f9' },
      ticks: { 
        precision: 0,
        stepSize: 1,
        font: { size: 10, weight: 600 }, 
        color: '#64748b' 
      }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 10, weight: 700 }, color: '#94a3b8' }
    }
  }
}
</script>

<template>
  <div class="grid gap-6">

    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <button
          @click="emit('close')"
          class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-slate-900">{{ props.projectName }}</h2>
          <p class="text-sm font-medium text-slate-500">Proyecto Formativo · Cód. {{ props.projectCode }}</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- Ficha Filter -->
        <div class="relative group">
          <label class="absolute -top-2 left-3 bg-white px-1 text-[0.6rem] font-black uppercase tracking-widest text-slate-400 z-10 transition-colors group-focus-within:text-slate-950">Filtrar por Ficha</label>
          <div class="relative">
            <select 
              v-model="selectedFichaId"
              class="h-11 w-48 appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-xs font-bold text-slate-900 shadow-sm outline-none transition-all hover:border-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 cursor-pointer"
            >
              <option :value="null">Todas las fichas</option>
              <option v-for="ficha in fichas" :key="ficha.id_formacion" :value="ficha.id_formacion">
                Ficha {{ ficha.ficha_caracterizacion }}
              </option>
            </select>
            <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-950 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        <button 
          v-if="typeof activePhaseId === 'number'"
          @click="isEditMode = !isEditMode"
          class="flex h-11 items-center gap-2 rounded-xl border px-5 py-2 text-xs font-bold transition-all shadow-sm"
          :class="isEditMode 
            ? 'bg-rose-600 border-rose-600 text-white hover:bg-rose-700' 
            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-950 hover:text-slate-950'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          {{ isEditMode ? 'Salir' : 'Modo Editor' }}
        </button>

        <button 
          v-if="isEditMode"
          @click="handleDeleteProject"
          class="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 shadow-sm transition hover:border-rose-600 hover:bg-rose-600 hover:text-white"
          title="Eliminar Proyecto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- General Stats Row -->
    <div v-if="!isLoading && !error" class="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-3">
      <div v-for="phase in phases" :key="phase.id_fase" 
        class="flex flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-400 cursor-pointer"
        @click="activePhaseId = phase.id_fase"
        :class="activePhaseId === phase.id_fase ? 'ring-2 ring-slate-950 ring-offset-2' : ''"
      >
        <span class="text-[0.6rem] font-bold uppercase tracking-widest text-slate-400">{{ formatPhaseName(phase.nombre) }}</span>
        <div class="mt-1 flex items-baseline gap-1">
          <span class="text-lg font-black text-slate-900">{{ phase.competencies.length }}</span>
          <span class="text-[0.65rem] font-medium text-slate-500">comps</span>
        </div>
      </div>
      <div 
        class="flex flex-col rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-3 shadow-sm transition hover:border-amber-400 cursor-pointer"
        @click="activePhaseId = 'unassigned'"
        :class="activePhaseId === 'unassigned' ? 'ring-2 ring-amber-500 ring-offset-2' : ''"
      >
        <span class="text-[0.6rem] font-bold uppercase tracking-widest text-amber-600">Sueltas</span>
        <div class="mt-1 flex items-baseline gap-1">
          <span class="text-lg font-black text-amber-700">{{ unassignedComps.length }}</span>
        </div>
      </div>
      <div 
        class="flex flex-col rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3 shadow-sm transition hover:border-indigo-400 cursor-pointer"
        @click="activePhaseId = 'learner-progress'"
        :class="activePhaseId === 'learner-progress' ? 'ring-2 ring-indigo-500 ring-offset-2' : ''"
      >
        <span class="text-[0.6rem] font-bold uppercase tracking-widest text-indigo-600">Aprendices</span>
        <div class="mt-1 flex items-baseline gap-1">
          <span class="text-lg font-black text-indigo-700">Stats</span>
        </div>
      </div>
    </div>

    <!-- Global Filters & Navigation -->
    <div v-if="!isLoading && !error" class="space-y-4">
      <div v-if="typeof activePhaseId === 'number'" class="space-y-3">
        <!-- Filter Competencies -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-slate-950 px-5 py-4 shadow-lg animate-in fade-in zoom-in-95 duration-200">
          <div class="hidden md:block">
            <p class="text-[0.6rem] font-black uppercase tracking-widest text-slate-500">Filtro Global</p>
            <p class="text-xs font-medium text-white">Búsqueda y estado</p>
          </div>
          <div class="flex-1 w-full sm:max-w-md relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
            <input v-model="searchQuery" type="text" placeholder="Buscar competencia por nombre o código..." class="w-full rounded-xl bg-slate-900 border border-slate-800 py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all" />
            <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>
          </div>
          <div class="flex gap-2">
            <button @click="setGlobalFilter('all')" class="rounded-lg px-4 py-2 text-xs font-semibold transition" :class="globalFilter === 'all' ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'">Todas</button>
            <button @click="setGlobalFilter('approved')" class="rounded-lg px-4 py-2 text-xs font-semibold transition" :class="globalFilter === 'approved' ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'">Aprobadas</button>
            <button @click="setGlobalFilter('pending')" class="rounded-lg px-4 py-2 text-xs font-semibold transition" :class="globalFilter === 'pending' ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'">Por Evaluar</button>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1">
        <button v-for="phase in phases" :key="phase.id_fase" @click="activePhaseId = phase.id_fase" class="relative px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all" :class="activePhaseId === phase.id_fase ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'">
          {{ formatPhaseName(phase.nombre) }}
          <div v-if="activePhaseId === phase.id_fase" class="absolute bottom-0 left-0 h-0.5 w-full bg-slate-900 rounded-full"></div>
        </button>
        <button @click="activePhaseId = 'unassigned'" class="relative px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all" :class="activePhaseId === 'unassigned' ? 'text-amber-600' : 'text-slate-400 hover:text-amber-500'">
          Sueltas
          <div v-if="activePhaseId === 'unassigned'" class="absolute bottom-0 left-0 h-0.5 w-full bg-amber-500 rounded-full"></div>
        </button>
        <button @click="activePhaseId = 'learner-progress'" class="relative px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all" :class="activePhaseId === 'learner-progress' ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-500'">
          Estado Aprendices
          <div v-if="activePhaseId === 'learner-progress'" class="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-500 rounded-full"></div>
        </button>
      </div>
    </div>

    <!-- Loading / Error states -->
    <div v-if="isLoading" class="flex min-h-[40vh] items-center justify-center">
      <div class="flex flex-col items-center gap-3 text-slate-400">
        <svg class="h-8 w-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p class="text-sm font-medium">Cargando...</p>
      </div>
    </div>
    <div v-else-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">{{ error }}</div>

    <!-- Content -->
    <div v-else class="grid gap-6">
      <!-- Active Phase View (Competencies) -->
      <div v-if="currentPhase" class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div class="border-b border-slate-100 bg-slate-50 px-6 py-5">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="space-y-2.5 min-w-0 max-w-3xl">
                <div class="flex items-center gap-2">
                  <span class="inline-block rounded-md bg-slate-950 px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest text-white">{{ formatPhaseName(currentPhase.nombre) }}</span>
                  <span v-if="currentPhaseActivities.length > 1" class="text-[0.65rem] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                    {{ currentPhaseActivities.length }} Actividades del proyecto
                  </span>
                </div>
                
                <div v-if="currentPhaseActivities.length > 0" class="space-y-2">
                  <div 
                    v-for="(act, idx) in currentPhaseActivities" 
                    :key="idx"
                    class="flex items-start gap-3 rounded-xl border border-slate-200/90 bg-white p-3 text-xs shadow-xs transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-[0.7rem] font-bold text-emerald-700 border border-emerald-200">
                      {{ getActivityNumber(act, idx) }}
                    </span>
                    <p class="leading-relaxed font-medium text-slate-800 text-xs">
                      {{ cleanActivityText(act) }}
                    </p>
                  </div>
                </div>
                <p v-else class="text-sm leading-relaxed text-slate-600">{{ currentPhase.actividad }}</p>
              </div>
              <div class="flex shrink-0 gap-2">
                <div class="flex min-w-[3.5rem] flex-col items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-center">
                  <span class="text-lg font-black text-slate-900">{{ currentPhase.competencies.reduce((acc, c) => acc + c.totalResults, 0) }}</span>
                  <span class="text-[0.55rem] font-bold uppercase tracking-wider text-slate-400">Carga Esperada</span>
                </div>
                <div class="flex min-w-[3.5rem] flex-col items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center">
                  <span class="text-lg font-black text-emerald-700">{{ currentPhase.competencies.reduce((acc, c) => acc + c.approvedResults, 0) }}</span>
                  <span class="text-[0.55rem] font-bold uppercase tracking-wider text-emerald-600">Aprobados</span>
                </div>
                <div class="flex min-w-[3.5rem] flex-col items-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center">
                  <span class="text-lg font-black text-amber-700">{{ currentPhase.competencies.reduce((acc, c) => acc + (c.totalResults - c.approvedResults), 0) }}</span>
                  <span class="text-[0.55rem] font-bold uppercase tracking-wider text-amber-500">Pendientes</span>
                </div>
              </div>
            </div>
            <p class="mt-3 max-w-3xl text-[0.7rem] text-slate-500">
              Esta vista resume la carga estructural de la fase usando solo los resultados ligados a esta fase en <span class="font-semibold text-slate-700">fase_resultado</span>, no todos los resultados de la competencia.
            </p>
          </div>
          <div class="divide-y divide-slate-100">
            <div v-for="comp in getFilteredCompetencies(currentPhase)" :key="comp.id_competencia" class="transition hover:bg-slate-50/70 relative">
            <div v-if="isEditMode" class="absolute right-6 top-4 z-10 flex gap-2">
              <button @click.stop="openAssignModal(comp)" class="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[0.65rem] font-bold text-white transition shadow-md hover:bg-slate-800"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4L7 20H3v-4L16 3z"></path></svg>Gestionar</button>
            </div>
            <button @click="toggleCompetency(comp.id_competencia)" class="flex w-full items-start gap-3 px-6 py-4 text-left transition" :class="isEditMode ? 'pr-32' : ''">
              <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition"><svg class="h-4 w-4 transition-transform duration-200" :class="expandedCompetencies.has(comp.id_competencia) ? 'rotate-90' : ''" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">{{ comp.codigo }}</span>
                  <span v-if="comp.isApproved" class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    <div class="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>Aprobada
                  </span>
                  <span v-else class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                    <div class="h-1.5 w-1.5 rounded-full bg-amber-400"></div>
                    {{ comp.approvedResults }}/{{ comp.totalResults }} Resultados
                  </span>
                </div>
                <p class="mt-0.5 text-sm font-semibold leading-snug text-slate-900">{{ comp.nombre }}</p>
              </div>
            </button>
            <div v-show="expandedCompetencies.has(comp.id_competencia)" class="pb-6 pl-16 pr-6 animate-in fade-in slide-in-from-top-1 duration-200">
              <ul class="grid gap-1.5">
                <li v-for="res in comp.learningOutcomes" :key="res.id_resultado" class="flex items-start gap-2.5 rounded-lg border px-3 py-2 transition hover:border-slate-300" :class="res.isApproved ? 'border-emerald-100 bg-emerald-50/60' : 'border-slate-200 bg-slate-50/50'">
                  <div class="mt-0.5 h-4 w-4 shrink-0 flex items-center justify-center">
                    <svg v-if="res.isApproved" class="h-3.5 w-3.5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" /></svg>
                    <div v-else class="text-[0.6rem] font-black text-amber-500">{{ Math.round((res.approvedCount / (res.totalCount || 1)) * 100) }}%</div>
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-[0.6rem] font-bold text-slate-400">{{ res.codigo }}</span>
                      <span v-if="!res.isApproved && res.approvedCount > 0" class="text-[0.55rem] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">{{ res.approvedCount }}/{{ res.totalCount }}</span>
                    </div>
                    <p class="text-xs leading-5 text-slate-700">{{ res.detalle }}</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Unassigned View -->
      <div v-else-if="activePhaseId === 'unassigned'" class="overflow-hidden rounded-2xl border border-dashed border-amber-200 bg-white shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div class="border-b border-amber-100 bg-amber-50/30 px-6 py-5"><h3 class="text-sm font-bold text-amber-800 uppercase tracking-widest">Competencias Sueltas</h3><p class="mt-1 text-xs text-amber-600">Sin fase asignada.</p></div>
        <div class="divide-y divide-slate-100">
          <div v-for="comp in unassignedComps.filter(c => !searchQuery || c.codigo.toLowerCase().includes(searchQuery.toLowerCase().trim()) || c.nombre.toLowerCase().includes(searchQuery.toLowerCase().trim()))" :key="comp.id_competencia" class="flex items-center justify-between p-5 transition hover:bg-amber-50/20"><div class="min-w-0 flex-1"><span class="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">{{ comp.codigo }}</span><p class="mt-0.5 text-sm font-semibold text-slate-900">{{ comp.nombre }}</p></div><button @click="openAssignModal(comp)" class="shrink-0 ml-4 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition">Asignar a fase</button></div>
        </div>
      </div>

      <!-- Learner Progress Dashboard -->
      <div v-else-if="activePhaseId === 'learner-progress'" class="grid gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <!-- Desertion Chart -->
        <div class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div class="mb-8">
            <p class="text-[0.6rem] font-black uppercase tracking-widest text-rose-500">Tendencia de Deserción</p>
            <h3 class="mt-1 text-2xl font-black text-slate-900">Histórico de Retiros/Traslados</h3>
            <p class="text-xs text-slate-500">Visualización por fases del proyecto</p>
          </div>
          
          <div class="relative h-64 w-full">
            <Line 
              :data="desertionChartData"
              :options="desertionChartOptions"
            />
          </div>
          
          <div class="mt-8 flex items-center gap-4 border-t border-slate-50 pt-6">
            <div class="flex items-center gap-2">
              <div class="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
              <span class="text-[0.6rem] font-bold text-slate-600">Línea de deserción (Aprendices por fase)</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-8">
          <div class="rounded-2xl border border-indigo-200 bg-indigo-50/70 px-5 py-4 text-sm text-indigo-900 shadow-sm">
            Estas tarjetas muestran progreso de aprendices, no la estructura curricular de la fase. El total se calcula desde <span class="font-bold">fase_resultado</span>; los aprendices retirados o trasladados solo cuentan en la fase donde tuvieron actividad registrada.
          </div>
          <div v-for="stat in learnerStats" :key="stat.id_fase" class="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <span class="inline-block rounded-lg bg-slate-950 px-3 py-1 text-[0.6rem] font-black uppercase tracking-widest text-white">{{ formatPhaseName(stat.nombre) }}</span>
                <h4 class="mt-2 text-2xl font-black text-slate-900">Estado de Aprendices</h4>
              </div>
              <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div class="flex flex-col rounded-2xl bg-slate-50 p-3 text-center">
                  <p class="text-2xl font-black text-slate-700">{{ stat.expectedResults }}</p>
                  <p class="text-[0.6rem] font-bold uppercase text-slate-500">Esperados en Aprendices</p>
                </div>
                <div class="flex flex-col rounded-2xl bg-emerald-50 p-3 text-center">
                  <p class="text-2xl font-black text-emerald-700">{{ stat.approvedResults }}</p>
                  <p class="text-[0.6rem] font-bold uppercase text-emerald-600">Aprobados</p>
                </div>
                <div class="flex flex-col rounded-2xl bg-amber-50 p-3 text-center">
                  <p class="text-2xl font-black text-amber-600">{{ stat.pendingResults }}</p>
                  <p class="text-[0.6rem] font-bold uppercase text-amber-600">Pendientes</p>
                </div>
                <div class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center">
                  <p class="text-2xl font-black text-rose-700">{{ stat.desertedCount }}</p>
                  <p class="text-[0.6rem] font-bold uppercase text-rose-600">Desertores</p>
                  <div class="mt-1 flex justify-center gap-2 border-t border-rose-200 pt-1 text-[0.55rem] font-bold text-rose-500">
                    <span>{{ stat.trasladoCount }} Tras.</span>
                    <span>•</span>
                    <span>{{ stat.voluntarioCount }} Ret.</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Desertion List -->
            <div v-if="stat.desertedLearners.length > 0" class="mb-8">
              <p class="mb-3 text-[0.65rem] font-black uppercase tracking-widest text-rose-500">Listado de Desertores (Retirados/Trasladados en esta fase)</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div v-for="learner in stat.desertedLearners" :key="learner.documento" class="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/30 p-3">
                  <div class="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="17" y1="8" x2="22" y2="13"></line><line x1="22" y1="8" x2="17" y2="13"></line></svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-black text-slate-900 truncate">{{ learner.nombre }}</p>
                    <p class="text-[0.65rem] text-rose-600 font-bold uppercase tracking-tighter">{{ learner.estado }} · {{ formatDate(learner.ultima_fecha) }}</p>
                    <p class="mt-1 text-[0.65rem] font-semibold text-slate-600 truncate">{{ learner.competencia_codigo }} · {{ learner.competencia_nombre }}</p>
                    <p class="text-[0.65rem] text-slate-500 truncate">{{ learner.resultado_codigo }} · {{ learner.juicio_estado }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="space-y-2">
              <div class="flex justify-between items-end">
                <p class="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">Progreso de Aprobación</p>
                <p class="text-sm font-black text-emerald-600">{{ Math.round(stat.progressPercentage) }}%</p>
              </div>
              <div class="relative h-4 w-full overflow-hidden rounded-full bg-slate-100">
                <div class="absolute left-0 h-full bg-emerald-500 transition-all duration-1000" :style="{ width: `${stat.progressPercentage}%` }"></div>
              </div>
              <p class="text-[0.6rem] text-slate-400 italic">
                * El progreso se calcula promediando los resultados aprobados frente al total esperado. Los aprendices retirados solo cuentan en las fases donde tuvieron actividad registrada.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Management Modal -->
    <Teleport to="body">
      <div v-if="selectedCompToAssign" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md transition-all" @click.self="selectedCompToAssign = null">
        <div class="w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
          <div class="bg-slate-950 p-8 text-white">
            <h3 class="text-xl font-bold tracking-tight">Gestionar Asignación de Fases</h3>
            <p class="mt-2 text-xs text-slate-400 uppercase tracking-widest font-bold">Competencia seleccionada:</p>
            <p class="mt-1 text-sm font-medium leading-relaxed text-slate-200">{{ selectedCompToAssign.nombre }}</p>
          </div>
          <div class="p-8 space-y-6">
            <div>
              <p class="mb-4 text-[0.65rem] font-black uppercase tracking-widest text-slate-400">Selecciona las fases a vincular:</p>
              <div class="grid grid-cols-2 gap-3">
                <button v-for="phase in phases" :key="phase.id_fase" @click="togglePhaseSelection(phase.id_fase)" :disabled="isAssigning" class="flex flex-col items-center justify-center rounded-2xl border-2 p-5 text-center transition group" :class="selectedPhasesForComp.has(phase.id_fase) ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50'">
                  <span class="text-[0.65rem] font-black uppercase tracking-tighter" :class="selectedPhasesForComp.has(phase.id_fase) ? 'text-indigo-500' : 'text-slate-400'">Fase</span>
                  <span class="mt-1 text-xs font-bold" :class="selectedPhasesForComp.has(phase.id_fase) ? 'text-indigo-900' : 'text-slate-900'">{{ formatPhaseName(phase.nombre) }}</span>
                  <div class="mt-3 flex h-5 w-5 items-center justify-center rounded border transition-colors duration-200" :class="selectedPhasesForComp.has(phase.id_fase) ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 bg-white'">
                    <svg v-if="selectedPhasesForComp.has(phase.id_fase)" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                </button>
              </div>
            </div>
            <div v-if="!isSelectedCompUnassigned" class="pt-4 border-t border-slate-100">
              <p class="mb-3 text-[0.65rem] font-black uppercase tracking-widest text-rose-400">Opciones Críticas:</p>
              <button @click="selectedPhasesForComp.clear(); saveAssignChanges()" :disabled="isAssigning" class="flex w-full items-center justify-between rounded-2xl border-2 border-rose-50 bg-rose-50/30 p-4 text-left transition hover:border-rose-500 hover:bg-rose-50 disabled:opacity-50 group">
                <div>
                  <p class="text-sm font-bold text-rose-600">Desvincular de todas las fases</p>
                  <p class="text-[0.65rem] text-rose-400">La competencia pasará a estado de 'Suelta'</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-rose-500 group-hover:scale-110 transition-transform"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
              </button>
            </div>
            <div class="pt-2">
              <button @click="saveAssignChanges" :disabled="isAssigning" class="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 p-4 font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">
                <span v-if="isAssigning">Guardando...</span>
                <span v-else>Guardar Cambios</span>
              </button>
            </div>
          </div>
          <div class="bg-slate-50 px-8 py-4 flex justify-center"><button @click="selectedCompToAssign = null" :disabled="isAssigning" class="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-950 transition disabled:opacity-50">Cancelar</button></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
