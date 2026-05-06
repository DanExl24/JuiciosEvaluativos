<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'

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
  isApproved: boolean
}

interface Competency {
  id_competencia: number
  codigo: string
  nombre: string
  isApproved: boolean
  learningOutcomes: LearningOutcome[]
}

interface PhaseDetail {
  id_fase: number
  nombre: string
  actividad: string
  competencies: Competency[]
}

const phases = ref<PhaseDetail[]>([])
const isLoading = ref(true)
const error = ref('')

// Filter states per phase: 'all' | 'approved' | 'pending'
const phaseFilters = ref<Record<number, 'all' | 'approved' | 'pending'>>({})
const globalFilter = ref<'all' | 'approved' | 'pending'>('all')

async function fetchDetails() {
  isLoading.value = true
  error.value = ''
  try {
    const response = await fetch(`${apiBaseUrl}/api/projects/${props.projectId}/phases`)
    if (!response.ok) throw new Error('Error al cargar las fases del proyecto.')
    phases.value = await response.json()
    // Initialize filters
    phases.value.forEach(p => {
      phaseFilters.value[p.id_fase] = 'all'
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error desconocido'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void fetchDetails()
})

function setGlobalFilter(filter: 'all' | 'approved' | 'pending') {
  globalFilter.value = filter
  for (const id in phaseFilters.value) {
    phaseFilters.value[id] = filter
  }
}

function getPhaseStats(phase: PhaseDetail) {
  const total = phase.competencies.length
  const approved = phase.competencies.filter(c => c.isApproved).length
  const pending = total - approved
  return { total, approved, pending }
}

function getFilteredCompetencies(phase: PhaseDetail) {
  const filter = phaseFilters.value[phase.id_fase] || 'all'
  if (filter === 'all') return phase.competencies
  if (filter === 'approved') return phase.competencies.filter(c => c.isApproved)
  return phase.competencies.filter(c => !c.isApproved)
}
</script>

<template>
  <div class="grid gap-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <button 
        @click="emit('close')"
        class="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>
      </button>
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">{{ props.projectName }}</h2>
        <p class="text-sm font-medium text-slate-500">Proyecto Formativo • Cod: {{ props.projectCode }}</p>
      </div>
    </div>

    <!-- Global Filters -->
    <div v-if="!isLoading && !error" class="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
      <div class="mb-3 sm:mb-0">
        <h3 class="text-sm font-bold text-slate-800">Filtro Global</h3>
        <p class="text-xs text-slate-500">Aplica a todas las fases del proyecto</p>
      </div>
      <div class="flex space-x-2">
        <button 
          @click="setGlobalFilter('all')"
          class="rounded-lg px-4 py-2 text-xs font-semibold transition"
          :class="globalFilter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        >
          Todas
        </button>
        <button 
          @click="setGlobalFilter('approved')"
          class="rounded-lg px-4 py-2 text-xs font-semibold transition"
          :class="globalFilter === 'approved' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        >
          Aprobadas
        </button>
        <button 
          @click="setGlobalFilter('pending')"
          class="rounded-lg px-4 py-2 text-xs font-semibold transition"
          :class="globalFilter === 'pending' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        >
          Por Evaluar
        </button>
      </div>
    </div>

    <!-- Loading / Error -->
    <div v-if="isLoading" class="flex min-h-[40vh] items-center justify-center">
      <div class="flex flex-col items-center gap-3 text-slate-400">
        <svg class="h-8 w-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p class="text-sm font-medium">Cargando detalles...</p>
      </div>
    </div>
    
    <div v-else-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
      {{ error }}
    </div>

    <!-- Content -->
    <div v-else class="grid gap-6">
      <div v-for="phase in phases" :key="phase.id_fase" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm xl:p-8">
        <!-- Phase Header & Stats -->
        <div class="mb-6 flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div class="space-y-2">
            <span class="inline-flex rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700">
              {{ phase.nombre }}
            </span>
            <p class="max-w-2xl text-sm font-medium leading-relaxed text-slate-700">{{ phase.actividad }}</p>
          </div>

          <!-- Small Stats -->
          <div class="flex gap-3 shrink-0">
            <div class="flex flex-col items-center rounded-xl bg-slate-50 px-4 py-2 text-center">
              <span class="text-xl font-bold text-slate-900">{{ getPhaseStats(phase).total }}</span>
              <span class="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">Total</span>
            </div>
            <div class="flex flex-col items-center rounded-xl bg-emerald-50 px-4 py-2 text-center">
              <span class="text-xl font-bold text-emerald-700">{{ getPhaseStats(phase).approved }}</span>
              <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-600">Aprobadas</span>
            </div>
            <div class="flex flex-col items-center rounded-xl bg-amber-50 px-4 py-2 text-center">
              <span class="text-xl font-bold text-amber-700">{{ getPhaseStats(phase).pending }}</span>
              <span class="text-[0.65rem] font-bold uppercase tracking-wider text-amber-600">Por Evaluar</span>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="mb-6 flex space-x-2">
          <button 
            @click="phaseFilters[phase.id_fase] = 'all'"
            class="rounded-lg px-4 py-2 text-xs font-semibold transition"
            :class="phaseFilters[phase.id_fase] === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            Todas
          </button>
          <button 
            @click="phaseFilters[phase.id_fase] = 'approved'"
            class="rounded-lg px-4 py-2 text-xs font-semibold transition"
            :class="phaseFilters[phase.id_fase] === 'approved' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            Aprobadas
          </button>
          <button 
            @click="phaseFilters[phase.id_fase] = 'pending'"
            class="rounded-lg px-4 py-2 text-xs font-semibold transition"
            :class="phaseFilters[phase.id_fase] === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            Por Evaluar
          </button>
        </div>

        <!-- Competencies List -->
        <div class="space-y-4 pl-2 border-l-2 border-indigo-100/50">
          <div v-for="comp in getFilteredCompetencies(phase)" :key="comp.id_competencia" class="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            
            <!-- Status Badge -->
            <div class="absolute right-5 top-5">
              <span v-if="comp.isApproved" class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <div class="h-1.5 w-1.5 rounded-full bg-emerald-500"></div> Aprobada
              </span>
              <span v-else class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                <div class="h-1.5 w-1.5 rounded-full bg-amber-500"></div> Por evaluar
              </span>
            </div>

            <div class="flex items-start gap-4 pr-32">
              <div class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 border border-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div class="space-y-1">
                <p class="text-xs font-bold tracking-wider text-slate-400">{{ comp.codigo }}</p>
                <p class="text-sm font-semibold leading-relaxed text-slate-900">{{ comp.nombre }}</p>
              </div>
            </div>

            <div class="mt-5 pl-14">
              <p class="mb-3 text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">Resultados de aprendizaje</p>
              <ul class="grid gap-2.5">
                <li v-for="res in comp.learningOutcomes" :key="res.id_resultado" class="flex items-start gap-3 rounded-lg bg-slate-50/50 p-2.5">
                  <div class="mt-0.5 shrink-0">
                    <svg v-if="res.isApproved" class="h-4 w-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                    </svg>
                    <svg v-else class="h-4 w-4 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="text-xs leading-5 text-slate-600">
                    <span class="font-bold text-slate-700">{{ res.codigo }}</span> <span class="mx-1 text-slate-300">|</span> {{ res.detalle }}
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          <div v-if="getFilteredCompetencies(phase).length === 0" class="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm font-medium text-slate-500">
            No hay competencias que coincidan con el filtro seleccionado.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
