<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ProjectPhasesDetailView from './ProjectPhasesDetailView.vue'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

interface ProjectData {
  id_proyecto: number
  codigo_proyecto: string
  proyecto_nombre: string
  tiempo_ejecucion: string
  regional: string
  centro_formacion: string
  id_programa: number
  programa_codigo: string
  programa_nombre: string
}

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
    const response = await fetch(`${apiBaseUrl}/api/projects`)
    if (response.ok) {
      projects.value = await response.json()
    }
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
    importError.value = 'Solo se permiten archivos PDF.'
    return
  }

  isParsing.value = true
  importError.value = ''
  importMessage.value = ''

  try {
    // 1. Send PDF to backend for extraction (using Python)
    const formData = new FormData()
    formData.append('pdf', file)

    const extractResponse = await fetch(`${apiBaseUrl}/api/extract/project`, {
      method: 'POST',
      body: formData
    })

    if (!extractResponse.ok) {
      const errorBody = await extractResponse.json().catch(() => null)
      throw new Error(errorBody?.error ?? 'Error al extraer información del PDF.')
    }

    const payload = await extractResponse.json()
    isParsing.value = false
    isImporting.value = true

    // 2. Import the extracted payload to the database
    const importResponse = await fetch(`${apiBaseUrl}/api/import/project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!importResponse.ok) {
      const errorBody = await importResponse.json().catch(() => null)
      throw new Error(errorBody?.error ?? 'Error al importar el proyecto a la base de datos.')
    }

    const result = await importResponse.json()
    importMessage.value = `¡Proyecto importado exitosamente! Fases creadas/actualizadas: ${result.phasesInserted}, Competencias mapeadas: ${result.competenciesUpdated}.`
    await fetchProjects()
    setTimeout(() => {
      isModalOpen.value = false
    }, 2500)

  } catch (error) {
    importError.value = error instanceof Error ? error.message : 'Error inesperado.'
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
    <!-- Header Controls -->
    <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div class="space-y-1">
        <span class="inline-flex w-fit rounded-full border border-blue-700/15 bg-blue-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-blue-700">
          Proyectos Formativos
        </span>
        <h2 class="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Fases y Competencias
        </h2>
      </div>
      
      <button 
        @click="isModalOpen = true"
        class="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Cargar Nuevo PDF
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="projects.length === 0" class="flex min-h-[50vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <svg class="h-8 w-8 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
      </div>
      <h3 class="text-lg font-bold text-slate-900">No hay proyectos importados</h3>
      <p class="mt-2 max-w-md text-sm text-slate-500">Comienza cargando el PDF del proyecto formativo para mapear sus fases y competencias de forma automática.</p>
    </div>

    <!-- Cards Grid -->
    <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="project in projects" :key="project.id_proyecto" class="flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50">
        <div class="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/50 p-6">
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center rounded-full bg-blue-100/50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-blue-700">
              Proyecto
            </span>
            <span class="text-[0.7rem] font-bold text-slate-400"># {{ project.codigo_proyecto }}</span>
          </div>
          <h3 class="mt-4 text-lg font-black leading-tight tracking-tight text-slate-900">
            {{ project.proyecto_nombre }}
          </h3>
          <p class="mt-4 text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 leading-relaxed">
            Programa: <span class="text-slate-800">{{ project.programa_codigo }}</span>
          </p>
        </div>
        
        <div class="flex flex-wrap gap-x-6 gap-y-4 p-6 text-sm text-slate-600">
          <div class="flex flex-col">
            <span class="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">Duración</span>
            <span class="mt-0.5 font-semibold text-slate-800">{{ project.tiempo_ejecucion }} meses</span>
          </div>
          <div class="flex flex-col">
            <span class="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">Regional</span>
            <span class="mt-0.5 font-semibold text-slate-800">{{ project.regional }}</span>
          </div>
        </div>

        <div class="mt-auto border-t border-slate-100 p-4">
          <button 
            @click="openProject(project)"
            class="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
          >
            Abrir fases y competencias
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Upload Modal -->
  <Teleport to="body">
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" @click.self="isModalOpen = false">
      <div class="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl">
        <div class="flex items-center justify-between border-b border-slate-100 p-6">
          <h3 class="text-xl font-bold tracking-tight text-slate-900">Importar Proyecto Formativo</h3>
          <button @click="isModalOpen = false" class="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="p-6">
          <div class="mb-6 space-y-2">
            <p class="text-sm leading-relaxed text-slate-600">
              Sube el archivo PDF del proyecto formativo para extraer su información básica, generar sus fases y asignar las competencias automáticamente (Procesado con Python).
            </p>
          </div>

          <div
            class="relative overflow-hidden rounded-[1.75rem] border-2 border-dashed p-1 transition duration-200"
            :class="isDragActive ? 'border-slate-500 bg-slate-100' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'"
            @dragenter.prevent="isDragActive = true"
            @dragover.prevent="isDragActive = true"
            @dragleave.prevent="isDragActive = false"
            @drop.prevent="handleFileDrop"
          >
            <div class="flex min-h-[16rem] flex-col items-center justify-center px-6 py-8">
              <div class="space-y-4 text-center">
                <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-950 text-base font-black text-white shadow-lg shadow-slate-950/20">
                  PDF
                </div>
                <div class="space-y-1">
                  <h4 class="text-lg font-bold tracking-tight text-slate-900">Arrastra tu archivo aquí</h4>
                  <p class="text-sm text-slate-500">o selecciónalo manualmente</p>
                </div>

                <label class="inline-flex cursor-pointer items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800">
                  Seleccionar PDF
                  <input accept=".pdf,application/pdf" type="file" class="sr-only" @change="handleFileSelection" />
                </label>
              </div>
            </div>
          </div>

          <!-- Status / Error Messages inside Modal -->
          <div class="mt-6 space-y-3">
            <div v-if="isParsing || isImporting" class="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-800">
              <svg class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p class="text-sm font-semibold">{{ isParsing ? 'Extrayendo información con Python...' : 'Guardando en la base de datos...' }}</p>
            </div>
            
            <p v-if="importMessage" class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              {{ importMessage }}
            </p>
            <p v-if="importError" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {{ importError }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
