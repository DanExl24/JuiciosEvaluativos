<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { projectPhasesService } from '../services/projectPhases.service'
import type { ProjectData } from '../types/projectPhases.types'
import ProjectPhasesDetailView from './ProjectPhasesDetailView.vue'

const isParsing = ref(false)
const isImporting = ref(false)
const isDragActive = ref(false)
const isModalOpen = ref(false)
const importMessage = ref('')
const importError = ref('')
const projects = ref<ProjectData[]>([])
const activeProject = ref<ProjectData | null>(null)

async function fetchProjects() {
  try {
    projects.value = await projectPhasesService.getProjects()
  } catch (error) {
    console.error('Error fetching projects:', error)
  }
}

function openProject(project: ProjectData) {
  activeProject.value = project
}

async function handleFileDrop(event: DragEvent) {
  isDragActive.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) void processFile(file)
}

function handleFileSelection(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    void processFile(file)
    input.value = ''
  }
}

async function processFile(file: File) {
  if (file.type !== 'application/pdf') {
    importError.value = 'Solo se permiten archivos en formato PDF.'
    return
  }

  isParsing.value = true
  importError.value = ''
  importMessage.value = ''

  try {
    const payload = await projectPhasesService.extractPdf(file)
    isParsing.value = false
    isImporting.value = true

    const result = await projectPhasesService.importProject(payload)
    importMessage.value = `¡Proyecto importado exitosamente! ${result.phasesInserted} fases estructuradas y ${result.competenciesUpdated} competencias mapeadas.`
    await fetchProjects()
    setTimeout(() => {
      isModalOpen.value = false
    }, 2000)
  } catch (error) {
    importError.value = error instanceof Error ? error.message : 'Error inesperado al procesar el proyecto formativo.'
  } finally {
    isParsing.value = false
    isImporting.value = false
  }
}

onMounted(() => {
  void fetchProjects()
})
</script>

<template>
  <div v-if="activeProject">
    <ProjectPhasesDetailView
      :project-id="activeProject.id_proyecto"
      :project-code="activeProject.codigo_proyecto"
      :project-name="activeProject.proyecto_nombre"
      @close="activeProject = null; fetchProjects()"
    />
  </div>

  <div v-else class="grid gap-6">
    <!-- Header Section -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
      <div>
        <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
          <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
          Estructura Curricular
        </span>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Fases del Proyecto Formativo
        </h1>
        <p class="mt-1 text-xs text-slate-500">
          Mapeo de actividades de proyecto, competencias y resultados de aprendizaje extraídos de la planeación pedagógica.
        </p>
      </div>

      <button
        class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 self-start sm:self-auto"
        type="button"
        @click="isModalOpen = true"
      >
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Cargar Nuevo PDF de Proyecto
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="projects.length === 0" class="flex min-h-[45vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs">
      <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 class="text-sm font-bold text-slate-900">No hay proyectos formativos importados</h3>
      <p class="mt-1 max-w-sm text-xs text-slate-500">Sube el PDF del proyecto formativo para extraer automáticamente sus fases, competencias y actividades asociadas.</p>
    </div>

    <!-- Projects Grid -->
    <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="project in projects"
        :key="project.id_proyecto"
        class="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm"
      >
        <div>
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <span class="rounded bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold text-slate-700">
              Cód. {{ project.codigo_proyecto }}
            </span>
            <span class="text-[0.7rem] font-semibold text-emerald-700">{{ project.regional || 'SENA' }}</span>
          </div>

          <h3 class="mt-3 text-sm font-bold leading-snug text-slate-900 line-clamp-2">
            {{ project.proyecto_nombre }}
          </h3>

          <p class="mt-2 text-xs text-slate-500">
            Programa: <span class="font-semibold text-slate-700">{{ project.programa_codigo }}</span>
          </p>

          <div class="mt-4 flex items-center gap-4 text-xs text-slate-500">
            <div>
              <span class="block text-[0.65rem] font-bold uppercase text-slate-400">Duración</span>
              <span class="font-semibold text-slate-800">{{ project.tiempo_ejecucion }} meses</span>
            </div>
            <div>
              <span class="block text-[0.65rem] font-bold uppercase text-slate-400">Regional</span>
              <span class="font-semibold text-slate-800">{{ project.regional || 'Nacional' }}</span>
            </div>
          </div>
        </div>

        <div class="mt-5 border-t border-slate-100 pt-3">
          <button
            class="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-600 hover:bg-emerald-50/50 hover:text-emerald-700 shadow-2xs"
            type="button"
            @click="openProject(project)"
          >
            Explorar Fases y RAPs
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- PDF Upload Modal -->
  <Teleport to="body">
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4" @click.self="isModalOpen = false">
      <div class="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between border-b border-slate-200/80 px-6 py-4">
          <div>
            <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">Extractor Inteligente</span>
            <h3 class="text-base font-bold text-slate-900">Importar Proyecto Formativo (PDF)</h3>
          </div>
          <button class="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" type="button" @click="isModalOpen = false">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-6">
          <p class="text-xs text-slate-500 leading-relaxed">
            Sube el archivo PDF del proyecto formativo para extraer automáticamente su estructura pedagógica, fases y actividades.
          </p>

          <div
            class="mt-4 relative flex min-h-[12rem] flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition"
            :class="isDragActive ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 bg-slate-50/50 hover:border-emerald-500/60'"
            @dragenter.prevent="isDragActive = true"
            @dragover.prevent="isDragActive = true"
            @dragleave.prevent="isDragActive = false"
            @drop.prevent="handleFileDrop"
          >
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-2xs mb-2">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 class="text-xs font-bold text-slate-900">Arrastra tu archivo PDF del proyecto formativo</h4>
            <p class="mt-0.5 text-[0.7rem] text-slate-400">o selecciónalo desde tu computadora</p>
            <label class="mt-3 inline-flex cursor-pointer items-center justify-center rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-slate-800">
              Seleccionar PDF
              <input accept=".pdf,application/pdf" type="file" class="sr-only" @change="handleFileSelection" />
            </label>
          </div>

          <div class="mt-4 space-y-2">
            <div v-if="isParsing || isImporting" class="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-800">
              <svg class="h-4 w-4 animate-spin text-sky-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="text-xs font-semibold">{{ isParsing ? 'Extrayendo datos curriculares con motor Python...' : 'Indexando fases y competencias en la base de datos...' }}</p>
            </div>

            <p v-if="importMessage" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
              {{ importMessage }}
            </p>
            <p v-if="importError" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
              {{ importError }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
