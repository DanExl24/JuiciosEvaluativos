<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  type ChartOptions,
  type TooltipItem,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
} from 'chart.js'
import { projectPhasesService } from '../services/projectPhases.service'
import type { PhaseLearnerStat, ProjectFicha } from '../types/projectPhases.types'
import type { CurricularPhase, CurricularCompetency } from '../../../types/curriculum.types'
import { formatDate } from '../../../utils/formatters/date'
import { prettyState } from '../../../utils/formatters/number'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler)

const props = defineProps<{
  projectId: number
  projectCode: string
  projectName: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const phases = ref<CurricularPhase[]>([])
const unassignedComps = ref<CurricularCompetency[]>([])
const learnerStats = ref<PhaseLearnerStat[]>([])
const fichas = ref<ProjectFicha[]>([])
const selectedFichaId = ref<number | null>(null)
const isLoading = ref(true)
const error = ref('')

const phaseFilters = ref<Record<number, 'all' | 'approved' | 'pending'>>({})
const globalFilter = ref<'all' | 'approved' | 'pending'>('all')
const activePhaseId = ref<number | 'unassigned' | 'learner-progress' | null>(null)
const expandedCompetencies = ref<Set<number>>(new Set())
const expandedActivities = ref<Set<number | string>>(new Set())

function isActivityExpanded(id: number | string) {
  return !expandedActivities.value.has(`closed_${id}`)
}

function toggleActivityExpanded(id: number | string) {
  const key = `closed_${id}`
  if (expandedActivities.value.has(key)) {
    expandedActivities.value.delete(key)
  } else {
    expandedActivities.value.add(key)
  }
}

const searchQuery = ref('')
const isEditMode = ref(false)
const isAssigning = ref(false)
const selectedCompToAssign = ref<CurricularCompetency | null>(null)
const selectedPhasesForComp = ref<Set<number>>(new Set())

function openAssignModal(comp: CurricularCompetency) {
  selectedCompToAssign.value = comp
  selectedPhasesForComp.value = new Set()
  phases.value.forEach((p) => {
    if (p.competencies.some((c) => c.id_competencia === comp.id_competencia)) {
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
    const [phasesData, unassignedData, learnerStatsData, fichasData] = await Promise.all([
      projectPhasesService.getProjectPhases(props.projectId, selectedFichaId.value),
      projectPhasesService.getUnassignedCompetencies(props.projectId),
      projectPhasesService.getPhaseLearnerStats(props.projectId, selectedFichaId.value),
      projectPhasesService.getProjectFichas(props.projectId),
    ])

    const phaseOrder: Record<string, number> = {
      ANALISIS: 1,
      PLANEACION: 2,
      EJECUCION: 3,
      EVALUACION: 4,
    }

    const sortPhases = (a: { nombre: string }, b: { nombre: string }) => {
      return (phaseOrder[a.nombre] || 99) - (phaseOrder[b.nombre] || 99)
    }

    phases.value = phasesData.sort(sortPhases)
    unassignedComps.value = unassignedData
    learnerStats.value = learnerStatsData.sort(sortPhases)
    fichas.value = fichasData

    phases.value.forEach((p) => {
      if (!phaseFilters.value[p.id_fase]) {
        phaseFilters.value[p.id_fase] = 'all'
      }
    })

    if (activePhaseId.value === null && phases.value.length > 0) {
      activePhaseId.value = phases.value[0]?.id_fase ?? null
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error desconocido al cargar el proyecto'
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

function filterCompetenciesList(competencies: CurricularCompetency[] | undefined, phaseId: number) {
  let filtered = competencies || []

  if (!isEditMode.value) {
    const filter = phaseFilters.value[phaseId] || 'all'
    if (filter === 'approved') filtered = filtered.filter((c) => c.isApproved)
    else if (filter === 'pending') filtered = filtered.filter((c) => !c.isApproved)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(
      (c) =>
        (c.codigo && c.codigo.toLowerCase().includes(q)) ||
        (c.codigo_juicio && c.codigo_juicio.toLowerCase().includes(q)) ||
        (c.codigo_proyecto && c.codigo_proyecto.toLowerCase().includes(q)) ||
        (c.nombre && c.nombre.toLowerCase().includes(q)),
    )
  }

  return filtered
}

function getFilteredCompetencies(phase: CurricularPhase) {
  return filterCompetenciesList(phase.competencies, phase.id_fase)
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
  return phases.value.find((p) => p.id_fase === activePhaseId.value) || null
})

function getActivityNumber(act: string, idx: number): string | number {
  const match = act.match(/^(\d+)/)
  return match ? match[1] ?? (idx + 1) : idx + 1
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
    phases.value.forEach((p) => {
      if (p.competencies.some((c) => c.id_competencia === compId)) {
        originalPhases.add(p.id_fase)
      }
    })

    const toAssign = [...selectedPhasesForComp.value].filter((id) => !originalPhases.has(id))
    const toUnassign = [...originalPhases].filter((id) => !selectedPhasesForComp.value.has(id))

    for (const phaseId of toUnassign) {
      await projectPhasesService.unassignCompetency(compId, phaseId)
    }

    for (const phaseId of toAssign) {
      await projectPhasesService.assignCompetency(compId, phaseId)
    }

    await fetchDetails()
    selectedCompToAssign.value = null
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Error en la operación')
  } finally {
    isAssigning.value = false
  }
}

async function handleDeleteProject() {
  if (!confirm('¿Estás seguro de que deseas eliminar este proyecto formativo? Esta acción no se puede deshacer.')) return

  try {
    await projectPhasesService.deleteProject(props.projectId)
    alert('Proyecto eliminado exitosamente.')
    emit('close')
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Error al eliminar')
  }
}

function formatPhaseName(name: string) {
  const names: Record<string, string> = {
    ANALISIS: 'Análisis',
    PLANEACION: 'Planeación',
    EJECUCION: 'Ejecución',
    EVALUACION: 'Evaluación',
  }
  return names[name] || name
}

const desertionChartData = computed(() => ({
  labels: learnerStats.value.map((s) => formatPhaseName(s.nombre)),
  datasets: [
    {
      label: 'Desertores',
      data: learnerStats.value.map((s) => s.desertedCount),
      borderColor: '#e11d48',
      backgroundColor: 'rgba(225, 29, 72, 0.08)',
      borderWidth: 3,
      tension: 0.3,
      fill: true,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#e11d48',
      pointBorderWidth: 2,
      pointRadius: 5,
    },
  ],
}))

const desertionChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      padding: 10,
      callbacks: {
        title: (items: TooltipItem<'line'>[]) => `Fase: ${items[0]?.label ?? ''}`,
        label: (context: TooltipItem<'line'>) => {
          const stat = learnerStats.value[context.dataIndex]
          if (!stat) return ''
          return `Total: ${stat.desertedCount} · Traslados: ${stat.trasladoCount} · Retiros: ${stat.voluntarioCount}`
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { precision: 0, font: { size: 10 }, color: '#64748b' },
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 10, weight: 'bold' }, color: '#64748b' },
    },
  },
}
</script>

<template>
  <div class="grid gap-6">
    <!-- Header Navigation -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
      <div class="flex items-center gap-3">
        <button
          class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:border-slate-300 hover:bg-slate-50"
          type="button"
          @click="emit('close')"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <div class="flex items-center gap-2">
            <span class="rounded bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold text-slate-700">
              Cód. {{ props.projectCode }}
            </span>
            <h2 class="text-lg font-bold tracking-tight text-slate-900">{{ props.projectName }}</h2>
          </div>
          <p class="text-xs text-slate-500">Estructura de fases, competencias y resultados de aprendizaje</p>
        </div>
      </div>

      <div class="flex items-center gap-2.5">
        <!-- Ficha Selector -->
        <select
          v-model="selectedFichaId"
          class="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs outline-none transition hover:border-slate-300 focus:border-emerald-600 cursor-pointer"
        >
          <option :value="null">Todas las Fichas</option>
          <option v-for="ficha in fichas" :key="ficha.id_formacion" :value="ficha.id_formacion">
            Ficha {{ ficha.ficha_caracterizacion }}
          </option>
        </select>

        <button
          v-if="typeof activePhaseId === 'number'"
          class="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold shadow-xs transition"
          :class="isEditMode ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'"
          type="button"
          @click="isEditMode = !isEditMode"
        >
          <svg class="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {{ isEditMode ? 'Salir del Editor' : 'Modo Asignación' }}
        </button>

        <button
          v-if="isEditMode"
          class="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 shadow-xs transition hover:bg-rose-100"
          title="Eliminar Proyecto"
          type="button"
          @click="handleDeleteProject"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Phase Selector Navigation Bar -->
    <div v-if="!isLoading && !error" class="flex flex-wrap items-center gap-2 rounded-xl bg-slate-100/80 p-1.5">
      <button
        v-for="phase in phases"
        :key="phase.id_fase"
        class="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition"
        :class="
          activePhaseId === phase.id_fase
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        "
        type="button"
        @click="activePhaseId = phase.id_fase"
      >
        <span>{{ formatPhaseName(phase.nombre) }}</span>
        <span class="rounded-full bg-slate-100 px-1.5 py-0.2 text-[0.65rem] font-bold text-slate-600">
          {{ phase.competencies.length }}
        </span>
      </button>

      <button
        class="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition"
        :class="
          activePhaseId === 'unassigned'
            ? 'bg-white text-amber-700 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        "
        type="button"
        @click="activePhaseId = 'unassigned'"
      >
        <span>Sueltas</span>
        <span class="rounded-full bg-amber-50 px-1.5 py-0.2 text-[0.65rem] font-bold text-amber-700 border border-amber-200">
          {{ unassignedComps.length }}
        </span>
      </button>

      <button
        class="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition"
        :class="
          activePhaseId === 'learner-progress'
            ? 'bg-white text-emerald-700 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        "
        type="button"
        @click="activePhaseId = 'learner-progress'"
      >
        <span>Métricas de Aprendices</span>
      </button>
    </div>

    <!-- Filter & Search Toolbar (When in a specific phase) -->
    <div v-if="!isLoading && !error && typeof activePhaseId === 'number'" class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
      <div class="relative flex-1 sm:max-w-md">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por código de norma o nombre de competencia..."
          class="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white"
        />
      </div>

      <div class="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
        <button
          class="rounded px-2.5 py-1 text-xs font-semibold transition"
          :class="globalFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'"
          type="button"
          @click="setGlobalFilter('all')"
        >
          Todas
        </button>
        <button
          class="rounded px-2.5 py-1 text-xs font-semibold transition"
          :class="globalFilter === 'approved' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'"
          type="button"
          @click="setGlobalFilter('approved')"
        >
          Aprobadas
        </button>
        <button
          class="rounded px-2.5 py-1 text-xs font-semibold transition"
          :class="globalFilter === 'pending' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'"
          type="button"
          @click="setGlobalFilter('pending')"
        >
          Pendientes
        </button>
      </div>
    </div>

    <!-- Loading / Error States -->
    <div v-if="isLoading" class="flex min-h-[30vh] items-center justify-center">
      <div class="flex flex-col items-center gap-2 text-slate-400">
        <svg class="h-6 w-6 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-xs font-medium">Cargando desglose curricular...</p>
      </div>
    </div>

    <div v-else-if="error" class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-xs font-medium text-rose-700">
      {{ error }}
    </div>

    <!-- Active Phase View -->
    <div v-else-if="currentPhase" class="grid gap-5">
      <!-- Activities List -->
      <div v-if="currentPhase.actividades && currentPhase.actividades.length > 0" class="space-y-4">
        <div
          v-for="(act, aIdx) in currentPhase.actividades"
          :key="act.id_actividad || aIdx"
          class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
        >
          <!-- Activity Header -->
          <div
            class="flex cursor-pointer items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3 transition hover:bg-slate-50"
            @click="toggleActivityExpanded(act.id_actividad || aIdx)"
          >
            <div class="flex items-center gap-3">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-emerald-600 text-xs font-bold text-white">
                {{ getActivityNumber(act.descripcion, aIdx) }}
              </span>
              <div>
                <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">
                  Actividad de Proyecto {{ getActivityNumber(act.descripcion, aIdx) }}
                </span>
                <h4 class="text-xs font-bold text-slate-900 leading-snug">
                  {{ cleanActivityText(act.descripcion) }}
                </h4>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span class="rounded bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-slate-600 border border-slate-200">
                {{ filterCompetenciesList(act.competencies && act.competencies.length > 0 ? act.competencies : (currentPhase.actividades.length === 1 ? currentPhase.competencies : []), currentPhase.id_fase).length }} Competencias
              </span>
              <svg
                class="h-4 w-4 text-slate-400 transition-transform duration-150"
                :class="isActivityExpanded(act.id_actividad || aIdx) ? 'rotate-180' : ''"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <!-- Competencies Accordion inside Activity -->
          <div v-show="isActivityExpanded(act.id_actividad || aIdx)" class="divide-y divide-slate-100 bg-white">
            <template v-if="filterCompetenciesList(act.competencies && act.competencies.length > 0 ? act.competencies : (currentPhase.actividades.length === 1 ? currentPhase.competencies : []), currentPhase.id_fase).length > 0">
              <div
                v-for="comp in filterCompetenciesList(act.competencies && act.competencies.length > 0 ? act.competencies : (currentPhase.actividades.length === 1 ? currentPhase.competencies : []), currentPhase.id_fase)"
                :key="comp.id_competencia"
                class="p-4 transition hover:bg-slate-50/50"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-start gap-3 flex-1">
                    <button
                      class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
                      type="button"
                      @click="toggleCompetency(comp.id_competencia)"
                    >
                      <svg
                        class="h-3.5 w-3.5 transition-transform"
                        :class="expandedCompetencies.has(comp.id_competencia) ? 'rotate-90' : ''"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    <div>
                      <div class="flex items-center gap-2 flex-wrap mb-1">
                        <span class="rounded bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold text-slate-700">
                          Cód: {{ comp.codigo_juicio || comp.codigo }}
                        </span>
                        <span v-if="comp.codigo_proyecto" class="rounded bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700 border border-emerald-200/60">
                          Proyecto: {{ comp.codigo_proyecto }}
                        </span>
                        <span
                          v-if="comp.isApproved"
                          class="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-700 border border-emerald-200"
                        >
                          Aprobada
                        </span>
                        <span
                          v-else
                          class="rounded-full bg-amber-50 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-700 border border-amber-200"
                        >
                          {{ comp.approvedResults }}/{{ comp.totalResults }} RAPs
                        </span>
                      </div>
                      <p class="text-xs font-bold text-slate-900">{{ comp.nombre }}</p>
                    </div>
                  </div>

                  <button
                    v-if="isEditMode"
                    class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 shadow-2xs shrink-0"
                    type="button"
                    @click="openAssignModal(comp)"
                  >
                    Vincular Fase
                  </button>
                </div>

                <!-- Expanded Outcomes List -->
                <div v-show="expandedCompetencies.has(comp.id_competencia)" class="mt-3 pl-9">
                  <div class="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <div
                      v-for="res in comp.learningOutcomes"
                      :key="res.id_resultado"
                      class="flex items-start gap-2 text-xs"
                    >
                      <div class="mt-0.5">
                        <span
                          v-if="res.isApproved"
                          class="inline-block h-2 w-2 rounded-full bg-emerald-500"
                        ></span>
                        <span
                          v-else
                          class="inline-block h-2 w-2 rounded-full bg-amber-400"
                        ></span>
                      </div>
                      <div class="flex-1">
                        <span class="font-bold text-slate-700">{{ res.codigo_juicio || res.codigo }}:</span>
                        <span class="text-slate-600 ml-1">{{ res.detalle }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="p-6 text-center text-xs text-slate-400">
              No hay competencias asociadas a esta actividad que coincidan con el filtro.
            </div>
          </div>
        </div>
      </div>

      <!-- Fallback Flat List -->
      <div v-else class="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 shadow-xs">
        <div
          v-for="comp in getFilteredCompetencies(currentPhase)"
          :key="comp.id_competencia"
          class="p-4"
        >
          <div class="flex items-center justify-between">
            <div>
              <span class="rounded bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold text-slate-700">
                Cód: {{ comp.codigo_juicio || comp.codigo }}
              </span>
              <p class="mt-1 text-xs font-bold text-slate-900">{{ comp.nombre }}</p>
            </div>
            <button
              v-if="isEditMode"
              class="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
              type="button"
              @click="openAssignModal(comp)"
            >
              Vincular
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Unassigned View -->
    <div v-else-if="activePhaseId === 'unassigned'" class="rounded-xl border border-amber-200 bg-white shadow-xs">
      <div class="border-b border-amber-100 bg-amber-50/40 px-5 py-3">
        <h3 class="text-xs font-bold uppercase tracking-wider text-amber-800">Competencias Sueltas</h3>
        <p class="text-xs text-amber-600">Competencias formativas sin fase asignada en el proyecto.</p>
      </div>
      <div class="divide-y divide-slate-100">
        <div
          v-for="comp in unassignedComps"
          :key="comp.id_competencia"
          class="flex items-center justify-between p-4"
        >
          <div>
            <span class="text-[0.65rem] font-bold uppercase text-slate-400">{{ comp.codigo }}</span>
            <p class="text-xs font-bold text-slate-900">{{ comp.nombre }}</p>
          </div>
          <button
            class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700"
            type="button"
            @click="openAssignModal(comp)"
          >
            Asignar a Fase
          </button>
        </div>
      </div>
    </div>

    <!-- Learner Progress & Desertion Dashboard -->
    <div v-else-if="activePhaseId === 'learner-progress'" class="grid gap-6">
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div class="mb-4">
          <span class="text-[0.65rem] font-bold uppercase tracking-wider text-rose-600">Analítica de Retención</span>
          <h3 class="text-base font-bold text-slate-900">Tendencia de Deserción por Fases</h3>
        </div>
        <div class="h-56 w-full">
          <Line :data="desertionChartData" :options="desertionChartOptions" />
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="stat in learnerStats"
          :key="stat.id_fase"
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
        >
          <span class="text-xs font-bold text-slate-900">{{ formatPhaseName(stat.nombre) }}</span>
          <div class="mt-3 flex items-baseline justify-between">
            <span class="text-2xl font-black text-emerald-600">{{ Math.round(stat.progressPercentage) }}%</span>
            <span class="text-xs text-slate-500">{{ stat.approvedResults }}/{{ stat.expectedResults }} juicios</span>
          </div>
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div class="h-full bg-emerald-500 transition-all duration-500" :style="{ width: `${stat.progressPercentage}%` }"></div>
          </div>
        </div>
      </div>

      <!-- Desertion / Dropout Detailed Breakdown by Phase -->
      <div class="space-y-6">
        <div class="border-b border-slate-200/80 pb-2">
          <span class="text-[0.65rem] font-bold uppercase tracking-wider text-rose-600">Histórico de Novedades Académicas</span>
          <h3 class="text-sm font-bold text-slate-900">Aprendices Retirados o Trasladados por Fase</h3>
          <p class="text-xs text-slate-500">Última actividad evaluativa registrada antes de la deserción o traslado.</p>
        </div>

        <div
          v-for="stat in learnerStats"
          :key="`desertion-${stat.id_fase}`"
          class="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
        >
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
            <div class="flex items-center gap-2.5">
              <span class="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
              <h4 class="text-sm font-bold text-slate-900">Fase de {{ formatPhaseName(stat.nombre) }}</h4>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                {{ stat.voluntarioCount }} Retiro(s) Voluntario(s)
              </span>
              <span class="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-700 border border-sky-200">
                {{ stat.trasladoCount }} Traslado(s)
              </span>
              <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                Total Novedades: {{ stat.desertedCount }}
              </span>
            </div>
          </div>

          <!-- Learners Cards Grid -->
          <div v-if="stat.desertedLearners && stat.desertedLearners.length > 0" class="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="learner in stat.desertedLearners"
              :key="learner.documento"
              class="flex flex-col justify-between rounded-xl border border-rose-100 bg-rose-50/20 p-4 shadow-2xs transition hover:bg-rose-50/40"
            >
              <div>
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h5 class="text-xs font-bold text-slate-900 leading-snug">{{ learner.nombre }}</h5>
                    <p class="text-[0.7rem] text-slate-500 font-medium">Doc: {{ learner.documento }}</p>
                  </div>
                  <span
                    class="shrink-0 rounded px-2 py-0.5 text-[0.65rem] font-bold uppercase"
                    :class="learner.estado?.toLowerCase().includes('traslado') ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'"
                  >
                    {{ prettyState(learner.estado) }}
                  </span>
                </div>

                <div class="mt-3 space-y-1.5 border-t border-rose-100/80 pt-2.5 text-xs">
                  <div class="flex items-center justify-between text-[0.7rem] text-slate-500">
                    <span class="font-semibold text-slate-600">Último Juicio Registrado:</span>
                    <span class="font-bold text-slate-700">{{ formatDate(learner.ultima_fecha) }}</span>
                  </div>

                  <div class="rounded-lg bg-white p-2.5 border border-slate-200/60 shadow-2xs space-y-1">
                    <div class="flex items-center justify-between gap-2">
                      <span class="rounded bg-slate-100 px-1.5 py-0.2 text-[0.65rem] font-bold text-slate-700">
                        Cód: {{ learner.competencia_codigo }}
                      </span>
                      <span
                        class="rounded px-1.5 py-0.2 text-[0.65rem] font-bold"
                        :class="learner.juicio_estado?.toLowerCase() === 'aprobado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'"
                      >
                        {{ prettyState(learner.juicio_estado) }}
                      </span>
                    </div>
                    <p class="text-[0.7rem] font-semibold text-slate-800 line-clamp-1" :title="learner.competencia_nombre">
                      {{ learner.competencia_nombre }}
                    </p>
                    <p class="text-[0.65rem] text-slate-500 line-clamp-2" :title="learner.resultado_detalle">
                      <b class="text-slate-600">RAP {{ learner.resultado_codigo }}:</b> {{ learner.resultado_detalle }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="p-6 text-center text-xs text-slate-400">
            No se registraron deserciones ni traslados durante la fase de {{ formatPhaseName(stat.nombre) }}.
          </div>
        </div>
      </div>
    </div>

    <!-- Phase Assignment Modal -->
    <Teleport to="body">
      <div v-if="selectedCompToAssign" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4" @click.self="selectedCompToAssign = null">
        <div class="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in zoom-in-95 duration-150">
          <div class="border-b border-slate-200/80 px-6 py-4">
            <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Mapeo Pedagógico</span>
            <h3 class="text-base font-bold text-slate-900">Asignar Fases a Competencia</h3>
            <p class="mt-1 text-xs text-slate-500">{{ selectedCompToAssign.nombre }}</p>
          </div>

          <div class="p-6 space-y-4">
            <p class="text-xs font-semibold text-slate-700">Selecciona las fases a las cuales vincular esta norma:</p>
            <div class="grid grid-cols-2 gap-2.5">
              <button
                v-for="phase in phases"
                :key="phase.id_fase"
                class="flex flex-col items-center justify-center rounded-xl border p-3.5 text-center transition shadow-2xs"
                :class="
                  selectedPhasesForComp.has(phase.id_fase)
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                "
                type="button"
                @click="togglePhaseSelection(phase.id_fase)"
              >
                <span class="text-xs font-bold">{{ formatPhaseName(phase.nombre) }}</span>
              </button>
            </div>

            <div class="pt-2">
              <button
                class="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
                :disabled="isAssigning"
                type="button"
                @click="saveAssignChanges"
              >
                {{ isAssigning ? 'Guardando...' : 'Confirmar Asignación' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
