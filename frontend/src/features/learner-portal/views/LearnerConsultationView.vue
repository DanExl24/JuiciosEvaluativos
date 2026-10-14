<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { trackingService } from '../../academic-tracking/services/tracking.service'
import type {
  LearnerByDocumentDetail,
  LearnerByDocumentMultipleFichas,
  LearnerByDocumentResponse,
} from '../../academic-tracking/types/tracking.types'
import { formatPercent, prettyState } from '../../../utils/formatters/number'
import { formatDate } from '../../../utils/formatters/date'
import { exportLearnerDetailToPdf } from '../../../utils/exporters/learnerPdfReport'

const router = useRouter()

// Search input
const searchDocument = ref('')
const isSearching = ref(false)
const searchError = ref('')

// State
const learnerData = ref<LearnerByDocumentDetail | null>(null)
const multipleFichasData = ref<LearnerByDocumentMultipleFichas | null>(null)
const isExportingPdf = ref(false)

// Local filter & accordion in results
const filterStatus = ref<'all' | 'aprobado' | 'por evaluar' | 'desaprobado'>('all')
const outcomeSearch = ref('')
const expandedCompetencies = ref<Record<string, boolean>>({})

// Kiosk Inactivity Timer (Reset after 90 seconds of no interaction to protect privacy)
const INACTIVITY_TIMEOUT_SECONDS = 90
const remainingSeconds = ref(INACTIVITY_TIMEOUT_SECONDS)
let timerInterval: ReturnType<typeof setInterval> | null = null

function resetInactivityTimer() {
  remainingSeconds.value = INACTIVITY_TIMEOUT_SECONDS
}

function handleUserActivity() {
  if (learnerData.value || multipleFichasData.value) {
    resetInactivityTimer()
  }
}

onMounted(() => {
  window.addEventListener('mousemove', handleUserActivity, { passive: true })
  window.addEventListener('keydown', handleUserActivity, { passive: true })
  window.addEventListener('touchstart', handleUserActivity, { passive: true })

  timerInterval = setInterval(() => {
    if (learnerData.value || multipleFichasData.value) {
      if (remainingSeconds.value > 1) {
        remainingSeconds.value -= 1
      } else {
        clearConsultation()
      }
    }
  }, 1000)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleUserActivity)
  window.removeEventListener('keydown', handleUserActivity)
  window.removeEventListener('touchstart', handleUserActivity)
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})

// Search Handler
async function performSearch(ficha?: string) {
  const doc = searchDocument.value.trim()
  if (!doc) {
    searchError.value = 'Por favor ingresa tu número de documento.'
    return
  }

  isSearching.value = true
  searchError.value = ''
  learnerData.value = null
  multipleFichasData.value = null

  try {
    const res: LearnerByDocumentResponse = await trackingService.getLearnerByDocument(doc, ficha)

    if (res.multipleFichas) {
      multipleFichasData.value = res
    } else {
      learnerData.value = res
      // Expand all competencies by default for immediate clear overview
      const expanded: Record<string, boolean> = {}
      res.competencies.forEach((c) => {
        expanded[c.code] = true
      })
      expandedCompetencies.value = expanded
      resetInactivityTimer()
    }
  } catch (err: unknown) {
    const errorMsg =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'No se encontraron registros para el documento ingresado.'
    searchError.value = errorMsg
  } finally {
    isSearching.value = false
  }
}

function selectFicha(ficha: string) {
  performSearch(ficha)
}

function clearConsultation() {
  learnerData.value = null
  multipleFichasData.value = null
  searchDocument.value = ''
  searchError.value = ''
  filterStatus.value = 'all'
  outcomeSearch.value = ''
  resetInactivityTimer()
}

function toggleCompetency(code: string) {
  expandedCompetencies.value[code] = !expandedCompetencies.value[code]
}

function expandAll() {
  if (!learnerData.value) return
  const expanded: Record<string, boolean> = {}
  learnerData.value.competencies.forEach((c) => {
    expanded[c.code] = true
  })
  expandedCompetencies.value = expanded
}

function collapseAll() {
  expandedCompetencies.value = {}
}

async function handleDownloadPdf() {
  if (!learnerData.value) return
  isExportingPdf.value = true
  try {
    await exportLearnerDetailToPdf(learnerData.value)
  } catch (error) {
    console.error('Error generando PDF:', error)
  } finally {
    isExportingPdf.value = false
  }
}

// Fullscreen toggle for Kiosk mode
const isFullscreen = ref(false)
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      isFullscreen.value = true
    }).catch(() => {})
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false
    }).catch(() => {})
  }
}

// Filtered competencies based on active filter and text search
const filteredCompetencies = computed(() => {
  if (!learnerData.value) return []
  const query = outcomeSearch.value.trim().toLowerCase()
  const status = filterStatus.value

  return learnerData.value.competencies
    .map((comp) => {
      const matchCompText =
        !query ||
        comp.name.toLowerCase().includes(query) ||
        comp.code.toLowerCase().includes(query)

      const filteredResults = comp.results.filter((r) => {
        const matchStatus = status === 'all' || r.judgement.toLowerCase() === status
        const matchResultText =
          !query ||
          matchCompText ||
          r.code.toLowerCase().includes(query) ||
          r.detail.toLowerCase().includes(query) ||
          r.funcionario.toLowerCase().includes(query)

        return matchStatus && matchResultText
      })

      return {
        ...comp,
        visibleResults: filteredResults,
      }
    })
    .filter((comp) => comp.visibleResults.length > 0)
})

function getJudgementBadge(judgement: string) {
  const norm = judgement.toLowerCase()
  if (norm === 'aprobado') {
    return {
      text: 'Aprobado',
      class: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      iconClass: 'text-emerald-500',
    }
  }
  if (norm === 'desaprobado') {
    return {
      text: 'Desaprobado',
      class: 'bg-rose-50 text-rose-700 border-rose-200/80',
      iconClass: 'text-rose-500',
    }
  }
  return {
    text: 'Por evaluar',
    class: 'bg-amber-50 text-amber-700 border-amber-200/80',
    iconClass: 'text-amber-500',
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
    <!-- Header Bar (Kiosk Mode) -->
    <header class="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 py-3 sm:px-6">
      <div class="mx-auto flex max-w-6xl items-center justify-between">
        <!-- Logo & Branding -->
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 text-white font-black text-sm">
            SENA
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-sm font-bold text-white sm:text-base">Portal de Consulta del Aprendiz</h1>
              <span class="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-400 border border-emerald-500/20">
                Autoservicio
              </span>
            </div>
            <p class="text-[0.7rem] text-slate-400">Verifica tus juicios evaluativos y avance curricular en tiempo real</p>
          </div>
        </div>

        <!-- Controls (Fullscreen & Back to Home) -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
            title="Pantalla Completa"
            @click="toggleFullscreen"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>{{ isFullscreen ? 'Salir' : 'Pantalla Completa' }}</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            @click="router.push('/')"
          >
            <svg class="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Inicio</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 px-4 py-6 sm:px-6 sm:py-8 mx-auto w-full max-w-5xl">
      <!-- 1. Search Box (Visible when no data is loaded) -->
      <section v-if="!learnerData && !multipleFichasData" class="flex flex-col items-center justify-center min-h-[60vh] max-w-xl mx-auto text-center space-y-6">
        <!-- Hero Icon -->
        <div class="relative">
          <div class="h-20 w-20 rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-emerald-500/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/20">
            <svg class="h-10 w-10" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
            </svg>
          </div>
          <span class="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-xs">
            ✓
          </span>
        </div>

        <div class="space-y-2">
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Consulta tus Juicios Evaluativos
          </h2>
          <p class="text-sm text-slate-400 max-w-md mx-auto">
            Ingresa tu número de documento de identidad para conocer de forma inmediata tu avance, resultados aprobados y pendientes.
          </p>
        </div>

        <!-- Form Card -->
        <div class="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md space-y-4">
          <form @submit.prevent="performSearch()" class="space-y-3">
            <div class="relative">
              <input
                id="doc-input"
                v-model="searchDocument"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                placeholder="Digita tu número de documento..."
                class="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3.5 text-center sm:text-left text-base sm:text-lg font-semibold text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                :disabled="isSearching"
                autofocus
              />
              <span v-if="searchDocument" class="absolute right-3 top-3.5 text-xs text-slate-400">
                Presiona Enter ↵
              </span>
            </div>

            <button
              type="submit"
              class="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              :disabled="isSearching"
            >
              <svg v-if="isSearching" class="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span v-if="isSearching">Consultando registros...</span>
              <template v-else>
                <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <span>Consultar mis Juicios</span>
              </template>
            </button>
          </form>

          <!-- Error Alert -->
          <div v-if="searchError" class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2 text-left animate-in fade-in">
            <svg class="h-4 w-4 shrink-0 text-rose-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{{ searchError }}</span>
          </div>

          <!-- Privacy Tag -->
          <div class="pt-2 border-t border-slate-800 text-center">
            <p class="text-[0.72rem] text-slate-500 flex items-center justify-center gap-1.5">
              <svg class="h-3.5 w-3.5 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span>Consulta privada y protegida. Solo se mostrará tu propio expediente.</span>
            </p>
          </div>
        </div>
      </section>

      <!-- 2. Multiple Fichas Selection Screen -->
      <section v-else-if="multipleFichasData" class="max-w-2xl mx-auto space-y-6 animate-in fade-in">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl text-center space-y-4">
          <div class="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-white">{{ multipleFichasData.learnerName }}</h3>
            <p class="text-xs text-slate-400 mt-1">
              Documento: {{ multipleFichasData.documentType }} {{ multipleFichasData.document }}
            </p>
            <p class="text-sm text-amber-300 font-medium mt-2">
              Se encontraron múltiples fichas asociadas a tu documento. Selecciona la que deseas consultar:
            </p>
          </div>

          <div class="grid gap-3 text-left pt-2">
            <button
              v-for="item in multipleFichasData.fichas"
              :key="item.ficha"
              type="button"
              class="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950 hover:border-emerald-500/60 hover:bg-slate-900 transition-all group"
              @click="selectFicha(item.ficha)"
            >
              <div>
                <span class="text-xs font-bold text-emerald-400">Ficha {{ item.ficha }}</span>
                <h4 class="text-sm font-semibold text-white group-hover:text-emerald-300 transition">
                  {{ item.program }}
                </h4>
                <span class="text-[0.65rem] text-slate-400 font-medium capitalize mt-0.5 block">
                  Estado: {{ prettyState(item.state) }}
                </span>
              </div>
              <div class="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
                &rarr;
              </div>
            </button>
          </div>

          <button
            type="button"
            class="text-xs font-semibold text-slate-400 hover:text-white underline pt-2"
            @click="clearConsultation"
          >
            Realizar otra consulta
          </button>
        </div>
      </section>

      <!-- 3. Learner Results Detail Screen -->
      <section v-else-if="learnerData" class="space-y-6 animate-in fade-in duration-200">
        <!-- Security & Inactivity Banner -->
        <div class="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400">
          <div class="flex items-center gap-2">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Consulta activa para: <strong class="text-white">{{ learnerData.learner.fullName }}</strong></span>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-[0.7rem] text-slate-500 hidden sm:inline">
              Cierre automático en: <strong class="text-emerald-400 font-mono">{{ remainingSeconds }}s</strong>
            </span>
            <button
              type="button"
              class="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 font-semibold text-xs transition"
              @click="clearConsultation"
            >
              Cerrar Consulta
            </button>
          </div>
        </div>

        <!-- Apprentice Profile Card -->
        <div class="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl backdrop-blur-md">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-start gap-4">
              <!-- Avatar Initials -->
              <div class="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                {{ learnerData.learner.fullName.slice(0, 2).toUpperCase() }}
              </div>

              <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-lg sm:text-xl font-black text-white">
                    {{ learnerData.learner.fullName }}
                  </h2>
                  <span class="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[0.68rem] font-bold text-emerald-400 border border-emerald-500/20 capitalize">
                    {{ prettyState(learnerData.learner.state) }}
                  </span>
                </div>

                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>Doc: <strong class="text-slate-200">{{ learnerData.learner.documentType }} {{ learnerData.learner.document }}</strong></span>
                  <span>Ficha: <strong class="text-slate-200">{{ learnerData.learner.ficha }}</strong></span>
                </div>

                <p class="text-xs text-slate-300 font-medium line-clamp-1">
                  {{ learnerData.learner.program }}
                </p>
              </div>
            </div>

            <!-- PDF Download Button -->
            <div class="shrink-0 flex items-center gap-2">
              <button
                type="button"
                class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition cursor-pointer"
                :disabled="isExportingPdf"
                @click="handleDownloadPdf"
              >
                <svg v-if="isExportingPdf" class="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span>Descargar Reporte PDF</span>
              </button>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mt-5 space-y-1.5 pt-4 border-t border-slate-800">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400 font-medium">Progreso General del Programa</span>
              <span class="font-black text-emerald-400 text-sm">
                {{ formatPercent(learnerData.learner.progress) }}
              </span>
            </div>
            <div class="h-3 w-full overflow-hidden rounded-full bg-slate-950 border border-slate-800 p-0.5">
              <div
                class="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all duration-500"
                :style="{ width: `${learnerData.learner.progress}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Metrics Strip -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-center">
            <span class="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">Total RAPs</span>
            <p class="text-2xl font-black text-white mt-1">{{ learnerData.learner.totalResults }}</p>
          </div>
          <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-400">Aprobados</span>
            <p class="text-2xl font-black text-emerald-400 mt-1">{{ learnerData.learner.approvedResults }}</p>
          </div>
          <div class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
            <span class="text-[0.65rem] font-bold uppercase tracking-wider text-amber-400">Por Evaluar</span>
            <p class="text-2xl font-black text-amber-400 mt-1">{{ learnerData.learner.pendingResults }}</p>
          </div>
          <div class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-center">
            <span class="text-[0.65rem] font-bold uppercase tracking-wider text-rose-400">Desaprobados</span>
            <p class="text-2xl font-black text-rose-400 mt-1">{{ learnerData.learner.disapprovedResults }}</p>
          </div>
        </div>

        <!-- Controls: Filters + Expand/Collapse -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <!-- Status Filter Tabs -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              class="rounded-lg px-2.5 py-1 text-xs font-semibold transition"
              :class="filterStatus === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
              @click="filterStatus = 'all'"
            >
              Todos ({{ learnerData.learner.totalResults }})
            </button>
            <button
              type="button"
              class="rounded-lg px-2.5 py-1 text-xs font-semibold transition"
              :class="filterStatus === 'aprobado' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
              @click="filterStatus = 'aprobado'"
            >
              Aprobados ({{ learnerData.learner.approvedResults }})
            </button>
            <button
              type="button"
              class="rounded-lg px-2.5 py-1 text-xs font-semibold transition"
              :class="filterStatus === 'por evaluar' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
              @click="filterStatus = 'por evaluar'"
            >
              Por Evaluar ({{ learnerData.learner.pendingResults }})
            </button>
            <button
              v-if="learnerData.learner.disapprovedResults > 0"
              type="button"
              class="rounded-lg px-2.5 py-1 text-xs font-semibold transition"
              :class="filterStatus === 'desaprobado' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
              @click="filterStatus = 'desaprobado'"
            >
              Desaprobados ({{ learnerData.learner.disapprovedResults }})
            </button>
          </div>

          <!-- Expand/Collapse Buttons -->
          <div class="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              class="text-[0.7rem] font-semibold text-slate-400 hover:text-white"
              @click="expandAll"
            >
              Expandir todo
            </button>
            <span class="text-slate-600">|</span>
            <button
              type="button"
              class="text-[0.7rem] font-semibold text-slate-400 hover:text-white"
              @click="collapseAll"
            >
              Colapsar todo
            </button>
          </div>
        </div>

        <!-- Competencies Accordion List -->
        <div class="space-y-3">
          <div
            v-for="comp in filteredCompetencies"
            :key="comp.code"
            class="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-md transition"
          >
            <!-- Accordion Header -->
            <button
              type="button"
              class="w-full p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left hover:bg-slate-800/50 transition cursor-pointer"
              @click="toggleCompetency(comp.code)"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-400">
                    Norma / Competencia: {{ comp.code }}
                  </span>
                  <span class="rounded-full bg-slate-800 px-2 py-0.5 text-[0.65rem] text-slate-300">
                    {{ comp.approvedResults }}/{{ comp.totalResults }} Aprobados
                  </span>
                </div>
                <h3 class="text-sm font-bold text-white">
                  {{ comp.name }}
                </h3>
              </div>

              <div class="flex items-center gap-3 shrink-0">
                <!-- Competency Progress Badge -->
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-slate-300">
                    {{ formatPercent(comp.progress) }}
                  </span>
                  <div class="w-16 h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      class="h-full bg-emerald-500 rounded-full"
                      :style="{ width: `${comp.progress}%` }"
                    ></div>
                  </div>
                </div>

                <!-- Chevron -->
                <div class="h-6 w-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                  <svg
                    class="h-4 w-4 transition-transform duration-200"
                    :class="{ 'rotate-180': expandedCompetencies[comp.code] }"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            <!-- Accordion Content: Learning Outcomes -->
            <div
              v-show="expandedCompetencies[comp.code]"
              class="border-t border-slate-800/80 bg-slate-950/60 p-3 sm:p-4 space-y-2.5"
            >
              <div
                v-for="result in comp.visibleResults"
                :key="result.code"
                class="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 sm:p-4 space-y-2 transition hover:border-slate-700"
              >
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="rounded bg-slate-800 px-2 py-0.5 font-mono text-[0.68rem] font-bold text-slate-300">
                      RAP {{ result.code }}
                    </span>
                    <span
                      class="rounded-md border px-2 py-0.5 text-[0.68rem] font-bold"
                      :class="getJudgementBadge(result.judgement).class"
                    >
                      {{ getJudgementBadge(result.judgement).text }}
                    </span>
                  </div>

                  <span v-if="result.registeredAt" class="text-[0.65rem] text-slate-500">
                    Evaluado: {{ formatDate(result.registeredAt) }}
                  </span>
                </div>

                <p class="text-xs text-slate-300 leading-relaxed">
                  {{ result.detail }}
                </p>

                <div v-if="result.funcionario && result.funcionario !== 'Sin funcionario'" class="pt-1 text-[0.7rem] text-slate-400 flex items-center gap-1.5">
                  <svg class="h-3 w-3 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <span>Evaluador: {{ result.funcionario }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky Bottom Actions -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            class="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
            @click="clearConsultation"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Realizar otra consulta</span>
          </button>

          <button
            type="button"
            class="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            @click="handleDownloadPdf"
          >
            <svg class="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span>Descargar PDF</span>
          </button>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="mt-auto border-t border-slate-800/80 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
      <div class="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Juicios Evaluativos SENA &copy; {{ new Date().getFullYear() }}</span>
        <span>Módulo de Exposición e Interacción Pública</span>
      </div>
    </footer>
  </div>
</template>
