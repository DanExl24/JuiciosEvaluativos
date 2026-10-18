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

// Theme State (Dark / Light Mode)
const isDarkMode = ref(true)

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  if (typeof window !== 'undefined') {
    localStorage.setItem('juicios_portal_theme', isDarkMode.value ? 'dark' : 'light')
  }
}

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
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('juicios_portal_theme')
    if (savedTheme) {
      isDarkMode.value = savedTheme === 'dark'
    } else {
      isDarkMode.value = true
    }
  }

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
      class: isDarkMode.value
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconClass: 'text-emerald-500',
    }
  }
  if (norm === 'desaprobado') {
    return {
      text: 'Desaprobado',
      class: isDarkMode.value
        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        : 'bg-rose-50 text-rose-700 border-rose-200',
      iconClass: 'text-rose-500',
    }
  }
  return {
    text: 'Por evaluar',
    class: isDarkMode.value
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      : 'bg-amber-50 text-amber-700 border-amber-200',
    iconClass: 'text-amber-500',
  }
}

// ==========================================
// Advanced Learner Analytics & Key Indicators
// ==========================================

// 1. Academic Paz y Salvo / Trajectory Diagnosis
const academicDiagnosis = computed(() => {
  if (!learnerData.value) return null
  const { disapprovedResults, progress, pendingResults } = learnerData.value.learner

  if (disapprovedResults > 0) {
    return {
      status: 'warning',
      badgeText: 'Alerta Académica',
      title: 'Plan de Mejoramiento Requerido',
      description: `Presentas ${disapprovedResults} ${disapprovedResults === 1 ? 'resultado desaprobado' : 'resultados desaprobados'}.`,
      actionHint: 'Acércate a tu instructor para concertar actividades de recuperación.',
      badgeClass: isDarkMode.value
        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        : 'bg-rose-50 text-rose-700 border-rose-200',
      dotClass: 'bg-rose-500',
    }
  }

  if (progress >= 100) {
    return {
      status: 'success',
      badgeText: 'Paz y Salvo Académico',
      title: '¡Plan Formativo 100% Culminado!',
      description: 'Todos los resultados de aprendizaje han sido evaluados y aprobados con éxito.',
      actionHint: 'Cumples con los requisitos académicos para etapa productiva y certificación.',
      badgeClass: isDarkMode.value
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500',
    }
  }

  return {
    status: 'good',
    badgeText: 'Al Día',
    title: 'Trayectoria Académica Favorable',
    description: `Sin juicios desaprobados. Tienes ${pendingResults} ${pendingResults === 1 ? 'resultado pendiente' : 'resultados pendientes'}.`,
    actionHint: 'Continúa con la entrega oportuna de tus evidencias de aprendizaje.',
    badgeClass: isDarkMode.value
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  }
})

// 2. Competencies Breakdown Statistics
const competenciesBreakdown = computed(() => {
  if (!learnerData.value) return { total: 0, completed: 0, inProgress: 0, notStarted: 0, completedPercent: 0 }
  const total = learnerData.value.competencies.length
  let completed = 0
  let inProgress = 0
  let notStarted = 0

  for (const comp of learnerData.value.competencies) {
    if (comp.progress >= 100) {
      completed++
    } else if (comp.approvedResults > 0 || comp.disapprovedResults > 0) {
      inProgress++
    } else {
      notStarted++
    }
  }

  const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0
  return { total, completed, inProgress, notStarted, completedPercent }
})

// 3. Recent Evaluations Timeline (Top 4 most recent evaluations)
const recentEvaluations = computed(() => {
  if (!learnerData.value) return []
  const list: Array<{
    code: string
    detail: string
    judgement: string
    registeredAt: string
    funcionario: string
    compCode: string
    compName: string
  }> = []

  for (const comp of learnerData.value.competencies) {
    for (const res of comp.results) {
      if (res.registeredAt) {
        list.push({
          code: res.code,
          detail: res.detail,
          judgement: res.judgement,
          registeredAt: res.registeredAt,
          funcionario: res.funcionario,
          compCode: comp.code,
          compName: comp.name,
        })
      }
    }
  }

  return list
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    .slice(0, 4)
})

// 4. Evaluator Instructors List (Unique instructors and count of approved outcomes)
const evaluatorsList = computed(() => {
  if (!learnerData.value) return []
  const counts = new Map<string, number>()

  for (const comp of learnerData.value.competencies) {
    for (const res of comp.results) {
      if (res.funcionario && res.funcionario !== 'Sin funcionario' && res.judgement.toLowerCase() === 'aprobado') {
        counts.set(res.funcionario, (counts.get(res.funcionario) || 0) + 1)
      }
    }
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})
</script>

<template>
  <div
    class="min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-emerald-500 selection:text-white"
    :class="
      isDarkMode
        ? 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100'
        : 'bg-slate-50 text-slate-800'
    "
  >
    <!-- Header Bar (Kiosk Mode) -->
    <header
      class="sticky top-0 z-40 border-b backdrop-blur-xl px-4 py-3 sm:px-6 transition-colors duration-200"
      :class="
        isDarkMode
          ? 'border-slate-800/80 bg-slate-950/80 text-white'
          : 'border-slate-200 bg-white/90 text-slate-900 shadow-2xs'
      "
    >
      <div class="mx-auto flex max-w-[1536px] items-center justify-between">
        <!-- Logo & Branding -->
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 text-white font-black text-sm">
            SENA
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-sm font-bold sm:text-base" :class="isDarkMode ? 'text-white' : 'text-slate-900'">
                Portal de Consulta del Aprendiz
              </h1>
              <span
                class="rounded-full px-2 py-0.5 text-[0.65rem] font-semibold border"
                :class="
                  isDarkMode
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                "
              >
                Autoservicio
              </span>
            </div>
            <p class="text-[0.7rem]" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
              Verifica tus juicios evaluativos y avance curricular en tiempo real
            </p>
          </div>
        </div>

        <!-- Controls: Theme Toggle, Fullscreen & Back to Home -->
        <div class="flex items-center gap-2">
          <!-- Theme Toggle Button -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer"
            :class="
              isDarkMode
                ? 'border-slate-800 bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs'
            "
            :title="isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'"
            @click="toggleTheme"
          >
            <span v-if="isDarkMode" class="flex items-center gap-1">
              <svg class="h-3.5 w-3.5 text-amber-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
              <span class="hidden sm:inline">Modo Claro</span>
            </span>
            <span v-else class="flex items-center gap-1">
              <svg class="h-3.5 w-3.5 text-slate-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
              <span class="hidden sm:inline">Modo Oscuro</span>
            </span>
          </button>

          <!-- Fullscreen Toggle -->
          <button
            type="button"
            class="hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition cursor-pointer"
            :class="
              isDarkMode
                ? 'border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs'
            "
            title="Pantalla Completa"
            @click="toggleFullscreen"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>{{ isFullscreen ? 'Salir' : 'Pantalla Completa' }}</span>
          </button>

          <!-- Back to Landing / Home -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
            :class="
              isDarkMode
                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
            "
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
    <main class="flex-1 px-4 py-5 sm:px-6 sm:py-6 mx-auto w-full max-w-[1536px]">
      <!-- 1. Search Box (Visible when no data is loaded) -->
      <section v-if="!learnerData && !multipleFichasData" class="flex flex-col items-center justify-center min-h-[65vh] max-w-xl mx-auto text-center space-y-6">
        <!-- Hero Icon -->
        <div class="relative">
          <div
            class="h-20 w-20 rounded-3xl flex items-center justify-center shadow-2xl transition-colors duration-200"
            :class="
              isDarkMode
                ? 'bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-emerald-500/30 border border-emerald-500/30 text-emerald-400 shadow-emerald-500/20'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-emerald-500/10'
            "
          >
            <svg class="h-10 w-10" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
            </svg>
          </div>
          <span class="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xs shadow-md">
            ✓
          </span>
        </div>

        <div class="space-y-2">
          <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight" :class="isDarkMode ? 'text-white' : 'text-slate-900'">
            Consulta tus Juicios Evaluativos
          </h2>
          <p class="text-sm max-w-md mx-auto" :class="isDarkMode ? 'text-slate-400' : 'text-slate-600'">
            Ingresa tu número de documento de identidad para conocer de forma inmediata tu avance curricular, competencias y resultados evaluados.
          </p>
        </div>

        <!-- Form Card -->
        <div
          class="w-full rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md space-y-4 border transition-colors duration-200"
          :class="
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white border-slate-200 shadow-slate-200/50'
          "
        >
          <form @submit.prevent="performSearch()" class="space-y-3">
            <div class="relative">
              <input
                id="doc-input"
                v-model="searchDocument"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                placeholder="Digita tu número de documento..."
                class="w-full rounded-xl border px-4 py-3.5 text-center sm:text-left text-base sm:text-lg font-semibold outline-none transition focus:ring-2 focus:ring-emerald-500/20"
                :class="
                  isDarkMode
                    ? 'border-slate-700 bg-slate-950/80 text-white placeholder-slate-500 focus:border-emerald-500'
                    : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white'
                "
                :disabled="isSearching"
                autofocus
              />
              <span v-if="searchDocument" class="absolute right-3 top-3.5 text-xs" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
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
          <div
            v-if="searchError"
            class="rounded-xl border p-3 text-xs flex items-center gap-2 text-left animate-in fade-in"
            :class="
              isDarkMode
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            "
          >
            <svg class="h-4 w-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{{ searchError }}</span>
          </div>

          <!-- Privacy Tag -->
          <div class="pt-2 border-t text-center" :class="isDarkMode ? 'border-slate-800' : 'border-slate-100'">
            <p class="text-[0.72rem] flex items-center justify-center gap-1.5" :class="isDarkMode ? 'text-slate-500' : 'text-slate-600'">
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
        <div
          class="rounded-2xl border p-6 shadow-xl text-center space-y-4 transition-colors"
          :class="
            isDarkMode
              ? 'border-slate-800 bg-slate-900/90'
              : 'border-slate-200 bg-white shadow-slate-200/50'
          "
        >
          <div
            class="h-12 w-12 rounded-2xl mx-auto flex items-center justify-center border"
            :class="
              isDarkMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-amber-50 border-amber-200 text-amber-600'
            "
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold" :class="isDarkMode ? 'text-white' : 'text-slate-900'">
              {{ multipleFichasData.learnerName }}
            </h3>
            <p class="text-xs mt-1" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
              Documento: {{ multipleFichasData.documentType }} {{ multipleFichasData.document }}
            </p>
            <p class="text-sm font-semibold mt-2 text-amber-600 dark:text-amber-300">
              Se encontraron múltiples fichas asociadas a tu documento. Selecciona la que deseas consultar:
            </p>
          </div>

          <div class="grid gap-3 text-left pt-2">
            <button
              v-for="item in multipleFichasData.fichas"
              :key="item.ficha"
              type="button"
              class="flex items-center justify-between p-4 rounded-xl border transition-all group cursor-pointer"
              :class="
                isDarkMode
                  ? 'border-slate-800 bg-slate-950 hover:border-emerald-500/60 hover:bg-slate-900'
                  : 'border-slate-200 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50/50 shadow-2xs'
              "
              @click="selectFicha(item.ficha)"
            >
              <div>
                <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">Ficha {{ item.ficha }}</span>
                <h4 class="text-sm font-semibold transition" :class="isDarkMode ? 'text-white group-hover:text-emerald-300' : 'text-slate-900 group-hover:text-emerald-800'">
                  {{ item.program }}
                </h4>
                <span class="text-[0.65rem] font-medium capitalize mt-0.5 block" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
                  Estado: {{ prettyState(item.state) }}
                </span>
              </div>
              <div
                class="h-8 w-8 rounded-lg flex items-center justify-center transition"
                :class="
                  isDarkMode
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950'
                    : 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                "
              >
                &rarr;
              </div>
            </button>
          </div>

          <button
            type="button"
            class="text-xs font-semibold underline pt-2 cursor-pointer"
            :class="isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'"
            @click="clearConsultation"
          >
            Realizar otra consulta
          </button>
        </div>
      </section>

      <!-- 3. Learner Results Detail Screen (Wide Responsive Layout) -->
      <section v-else-if="learnerData" class="space-y-5 animate-in fade-in duration-200">
        <!-- Security & Inactivity Banner -->
        <div
          class="flex items-center justify-between rounded-xl px-4 py-2.5 text-xs border transition-colors"
          :class="
            isDarkMode
              ? 'bg-slate-900/90 border-slate-800 text-slate-400'
              : 'bg-white border-slate-200 text-slate-600 shadow-2xs'
          "
        >
          <div class="flex items-center gap-2">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Consulta activa para: <strong :class="isDarkMode ? 'text-white' : 'text-slate-900'">{{ learnerData.learner.fullName }}</strong></span>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-[0.7rem] hidden sm:inline" :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'">
              Cierre automático en: <strong class="text-emerald-500 dark:text-emerald-400 font-mono">{{ remainingSeconds }}s</strong>
            </span>
            <button
              type="button"
              class="rounded-lg px-3 py-1 font-semibold text-xs transition cursor-pointer"
              :class="
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              "
              @click="clearConsultation"
            >
              Cerrar Consulta
            </button>
          </div>
        </div>

        <!-- 2-Column Responsive Dashboard Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <!-- ============================================== -->
          <!-- LEFT SIDEBAR: Key Indicators, Progress & Stats -->
          <!-- ============================================== -->
          <aside class="lg:col-span-4 xl:col-span-4 space-y-4">
            <!-- 1. Academic Paz y Salvo / Status Diagnostic -->
            <div
              v-if="academicDiagnosis"
              class="rounded-2xl border p-4 sm:p-5 shadow-lg transition-colors relative overflow-hidden"
              :class="
                isDarkMode
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-white border-slate-200 shadow-slate-200/50'
              "
            >
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="relative flex h-2 w-2">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :class="academicDiagnosis.dotClass"></span>
                      <span class="relative inline-flex rounded-full h-2 w-2" :class="academicDiagnosis.dotClass"></span>
                    </span>
                    <span
                      class="rounded-full px-2 py-0.5 text-[0.65rem] font-bold border"
                      :class="academicDiagnosis.badgeClass"
                    >
                      {{ academicDiagnosis.badgeText }}
                    </span>
                  </div>
                  <h3 class="text-sm font-black mt-2" :class="isDarkMode ? 'text-white' : 'text-slate-900'">
                    {{ academicDiagnosis.title }}
                  </h3>
                </div>

                <div
                  class="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border"
                  :class="
                    academicDiagnosis.status === 'warning'
                      ? (isDarkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600')
                      : (isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600')
                  "
                >
                  <svg v-if="academicDiagnosis.status === 'warning'" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
              </div>

              <p class="text-xs mt-2 leading-relaxed" :class="isDarkMode ? 'text-slate-300' : 'text-slate-600'">
                {{ academicDiagnosis.description }}
              </p>

              <div
                class="mt-3 rounded-xl p-2.5 text-[0.72rem] border leading-normal"
                :class="
                  academicDiagnosis.status === 'warning'
                    ? (isDarkMode ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' : 'bg-rose-50/70 border-rose-200 text-rose-800')
                    : (isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50/70 border-emerald-200 text-emerald-800')
                "
              >
                <span class="font-bold">Orientación:</span> {{ academicDiagnosis.actionHint }}
              </div>
            </div>

            <!-- 2. Circular Gauge & Competencies Completion Breakdown -->
            <div
              class="rounded-2xl border p-4 sm:p-5 shadow-lg transition-colors"
              :class="
                isDarkMode
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-white border-slate-200 shadow-slate-200/50'
              "
            >
              <div class="flex items-center justify-between border-b pb-3" :class="isDarkMode ? 'border-slate-800' : 'border-slate-100'">
                <h3 class="text-xs font-bold uppercase tracking-wider" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
                  Avance Curricular del Programa
                </h3>
                <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {{ formatPercent(learnerData.learner.progress) }}
                </span>
              </div>

              <!-- Radial Gauge and High-level Breakdown -->
              <div class="flex items-center justify-center py-4">
                <div class="relative flex items-center justify-center">
                  <!-- SVG Circle Progress Ring -->
                  <svg class="h-28 w-28 -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      class="stroke-current"
                      :class="isDarkMode ? 'text-slate-800' : 'text-slate-200'"
                      stroke-width="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      class="stroke-current text-emerald-500 transition-all duration-1000 ease-out"
                      stroke-width="8"
                      stroke-linecap="round"
                      fill="transparent"
                      :stroke-dasharray="251.32"
                      :stroke-dashoffset="251.32 - (251.32 * Math.min(learnerData.learner.progress, 100)) / 100"
                    />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span class="text-xl font-black" :class="isDarkMode ? 'text-white' : 'text-slate-900'">
                      {{ Math.round(learnerData.learner.progress) }}%
                    </span>
                    <span class="text-[0.62rem] font-bold uppercase tracking-wider" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
                      Aprobado
                    </span>
                  </div>
                </div>
              </div>

              <!-- Competencies Breakdown list -->
              <div class="space-y-2 pt-2 border-t" :class="isDarkMode ? 'border-slate-800' : 'border-slate-100'">
                <div class="text-[0.7rem] font-bold" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
                  Estado de Competencias ({{ competenciesBreakdown.total }} en total):
                </div>

                <!-- 100% Completed Competencies -->
                <div class="flex items-center justify-between text-xs p-2 rounded-xl" :class="isDarkMode ? 'bg-slate-950/60' : 'bg-slate-50'">
                  <div class="flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span :class="isDarkMode ? 'text-slate-300' : 'text-slate-700'">Competencias Culminadas (100%)</span>
                  </div>
                  <span class="font-bold text-emerald-600 dark:text-emerald-400">
                    {{ competenciesBreakdown.completed }} / {{ competenciesBreakdown.total }}
                  </span>
                </div>

                <!-- In Progress Competencies -->
                <div class="flex items-center justify-between text-xs p-2 rounded-xl" :class="isDarkMode ? 'bg-slate-950/60' : 'bg-slate-50'">
                  <div class="flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full bg-amber-500"></span>
                    <span :class="isDarkMode ? 'text-slate-300' : 'text-slate-700'">En Desarrollo</span>
                  </div>
                  <span class="font-bold text-amber-600 dark:text-amber-400">
                    {{ competenciesBreakdown.inProgress }} / {{ competenciesBreakdown.total }}
                  </span>
                </div>

                <!-- Not Started Competencies -->
                <div class="flex items-center justify-between text-xs p-2 rounded-xl" :class="isDarkMode ? 'bg-slate-950/60' : 'bg-slate-50'">
                  <div class="flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full" :class="isDarkMode ? 'bg-slate-700' : 'bg-slate-300'"></span>
                    <span :class="isDarkMode ? 'text-slate-400' : 'text-slate-600'">Por Iniciar (0%)</span>
                  </div>
                  <span class="font-bold" :class="isDarkMode ? 'text-slate-400' : 'text-slate-600'">
                    {{ competenciesBreakdown.notStarted }} / {{ competenciesBreakdown.total }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 3. Recent Evaluations Timeline -->
            <div
              v-if="recentEvaluations.length > 0"
              class="rounded-2xl border p-4 sm:p-5 shadow-lg transition-colors"
              :class="
                isDarkMode
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-white border-slate-200 shadow-slate-200/50'
              "
            >
              <div class="flex items-center justify-between border-b pb-3" :class="isDarkMode ? 'border-slate-800' : 'border-slate-100'">
                <div class="flex items-center gap-2">
                  <svg class="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 class="text-xs font-bold uppercase tracking-wider" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
                    Últimas Calificaciones
                  </h3>
                </div>
                <span class="text-[0.65rem] font-medium" :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'">
                  Recientes
                </span>
              </div>

              <div class="space-y-3 pt-3">
                <div
                  v-for="(item, idx) in recentEvaluations"
                  :key="idx"
                  class="relative pl-4 border-l-2 text-xs space-y-1 transition-colors"
                  :class="isDarkMode ? 'border-slate-800' : 'border-slate-200'"
                >
                  <span class="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-emerald-500"></span>
                  <div class="flex items-center justify-between text-[0.68rem]">
                    <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">RAP {{ item.code }}</span>
                    <span :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'">{{ formatDate(item.registeredAt) }}</span>
                  </div>
                  <p class="text-xs line-clamp-1 font-medium" :class="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
                    {{ item.detail }}
                  </p>
                  <span v-if="item.funcionario && item.funcionario !== 'Sin funcionario'" class="text-[0.65rem] block truncate" :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'">
                    Por: {{ item.funcionario }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 4. Instructors / Evaluators Team -->
            <div
              v-if="evaluatorsList.length > 0"
              class="rounded-2xl border p-4 sm:p-5 shadow-lg transition-colors"
              :class="
                isDarkMode
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-white border-slate-200 shadow-slate-200/50'
              "
            >
              <div class="flex items-center justify-between border-b pb-3" :class="isDarkMode ? 'border-slate-800' : 'border-slate-100'">
                <div class="flex items-center gap-2">
                  <svg class="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  <h3 class="text-xs font-bold uppercase tracking-wider" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
                    Instructores Evaluadores
                  </h3>
                </div>
                <span class="text-[0.65rem] font-medium" :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'">
                  Docentes
                </span>
              </div>

              <div class="space-y-2 pt-3">
                <div
                  v-for="(instructor, idx) in evaluatorsList"
                  :key="idx"
                  class="flex items-center justify-between text-xs p-2 rounded-xl transition"
                  :class="isDarkMode ? 'bg-slate-950/60' : 'bg-slate-50'"
                >
                  <div class="flex items-center gap-2 min-w-0 pr-2">
                    <div class="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 font-bold text-[0.65rem]">
                      {{ instructor.name.slice(0, 1).toUpperCase() }}
                    </div>
                    <span class="truncate font-medium" :class="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
                      {{ instructor.name }}
                    </span>
                  </div>
                  <span
                    class="rounded-md px-1.5 py-0.5 text-[0.62rem] font-bold shrink-0"
                    :class="
                      isDarkMode
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-white text-slate-700 border border-slate-200'
                    "
                  >
                    {{ instructor.count }} {{ instructor.count === 1 ? 'RAP' : 'RAPs' }}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <!-- ============================================== -->
          <!-- RIGHT MAIN: Profile, Filters & Outcomes List   -->
          <!-- ============================================== -->
          <div class="lg:col-span-8 xl:col-span-8 space-y-4">
            <!-- Apprentice Profile Card -->
            <div
              class="relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-xl backdrop-blur-md transition-colors"
              :class="
                isDarkMode
                  ? 'bg-slate-900/90 border-slate-800 shadow-black/40'
                  : 'bg-white border-slate-200 shadow-slate-200/60'
              "
            >
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div class="flex items-start gap-4">
                  <!-- Avatar Initials -->
                  <div class="h-13 w-13 shrink-0 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    {{ learnerData.learner.fullName.slice(0, 2).toUpperCase() }}
                  </div>

                  <div class="space-y-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <h2 class="text-lg sm:text-xl font-black" :class="isDarkMode ? 'text-white' : 'text-slate-900'">
                        {{ learnerData.learner.fullName }}
                      </h2>
                      <span
                        class="rounded-md px-2 py-0.5 text-[0.68rem] font-bold border capitalize"
                        :class="
                          isDarkMode
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        "
                      >
                        {{ prettyState(learnerData.learner.state) }}
                      </span>
                    </div>

                    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
                      <span>Doc: <strong :class="isDarkMode ? 'text-slate-200' : 'text-slate-800'">{{ learnerData.learner.documentType }} {{ learnerData.learner.document }}</strong></span>
                      <span>Ficha: <strong :class="isDarkMode ? 'text-slate-200' : 'text-slate-800'">{{ learnerData.learner.ficha }}</strong></span>
                    </div>

                    <p class="text-xs font-medium line-clamp-1" :class="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
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

              <!-- General Progress Bar -->
              <div class="mt-4 space-y-1.5 pt-3 border-t" :class="isDarkMode ? 'border-slate-800' : 'border-slate-100'">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-medium" :class="isDarkMode ? 'text-slate-400' : 'text-slate-600'">Progreso General del Programa</span>
                  <span class="font-black text-sm text-emerald-600 dark:text-emerald-400">
                    {{ formatPercent(learnerData.learner.progress) }}
                  </span>
                </div>
                <div
                  class="h-2.5 w-full overflow-hidden rounded-full p-0.5 border"
                  :class="isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'"
                >
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all duration-500"
                    :style="{ width: `${learnerData.learner.progress}%` }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- 4 Interactive KPI Filter Cards -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between px-1">
                <span class="text-[0.68rem] font-bold uppercase tracking-wider" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
                  Indicadores de Aprendizaje (Haz clic en una tarjeta para filtrar)
                </span>
                <span v-if="filterStatus !== 'all'" class="text-[0.68rem] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>● Filtro aplicado</span>
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <!-- 1. Total RAPs KPI Button -->
                <button
                  type="button"
                  class="rounded-xl border p-3.5 text-center transition-all duration-200 cursor-pointer relative text-left group hover:-translate-y-0.5 active:translate-y-0"
                  :class="[
                    isDarkMode
                      ? (filterStatus === 'all'
                          ? 'border-slate-500 bg-slate-800/90 ring-2 ring-slate-400 shadow-lg'
                          : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-800/50')
                      : (filterStatus === 'all'
                          ? 'border-slate-700 bg-slate-100 ring-2 ring-slate-800 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-2xs')
                  ]"
                  @click="filterStatus = 'all'"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-[0.65rem] font-bold uppercase tracking-wider" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
                      Total RAPs
                    </span>
                    <span
                      v-if="filterStatus === 'all'"
                      class="h-2 w-2 rounded-full bg-slate-400 dark:bg-white animate-pulse"
                    ></span>
                  </div>
                  <p class="text-2xl font-black mt-1" :class="isDarkMode ? 'text-white' : 'text-slate-900'">
                    {{ learnerData.learner.totalResults }}
                  </p>
                  <span class="text-[0.62rem] font-medium block mt-0.5" :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'">
                    Ver todo el programa
                  </span>
                </button>

                <!-- 2. Aprobados KPI Button -->
                <button
                  type="button"
                  class="rounded-xl border p-3.5 text-center transition-all duration-200 cursor-pointer relative text-left group hover:-translate-y-0.5 active:translate-y-0"
                  :class="[
                    isDarkMode
                      ? (filterStatus === 'aprobado'
                          ? 'border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20'
                          : 'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/60 hover:bg-emerald-500/15')
                      : (filterStatus === 'aprobado'
                          ? 'border-emerald-500 bg-emerald-100 ring-2 ring-emerald-600 shadow-md text-emerald-950'
                          : 'border-emerald-200 bg-emerald-50/80 hover:border-emerald-300 hover:bg-emerald-100/60 shadow-2xs')
                  ]"
                  @click="filterStatus = 'aprobado'"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Aprobados
                    </span>
                    <span
                      v-if="filterStatus === 'aprobado'"
                      class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                    ></span>
                  </div>
                  <p class="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {{ learnerData.learner.approvedResults }}
                  </p>
                  <span class="text-[0.62rem] font-medium block mt-0.5 text-emerald-700/80 dark:text-emerald-400/70">
                    Juicios aprobados
                  </span>
                </button>

                <!-- 3. Por Evaluar KPI Button -->
                <button
                  type="button"
                  class="rounded-xl border p-3.5 text-center transition-all duration-200 cursor-pointer relative text-left group hover:-translate-y-0.5 active:translate-y-0"
                  :class="[
                    isDarkMode
                      ? (filterStatus === 'por evaluar'
                          ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400 shadow-lg shadow-amber-500/20'
                          : 'border-amber-500/30 bg-amber-500/10 hover:border-amber-500/60 hover:bg-amber-500/15')
                      : (filterStatus === 'por evaluar'
                          ? 'border-amber-500 bg-amber-100 ring-2 ring-amber-600 shadow-md text-amber-950'
                          : 'border-amber-200 bg-amber-50/80 hover:border-amber-300 hover:bg-amber-100/60 shadow-2xs')
                  ]"
                  @click="filterStatus = 'por evaluar'"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-[0.65rem] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Por Evaluar
                    </span>
                    <span
                      v-if="filterStatus === 'por evaluar'"
                      class="h-2 w-2 rounded-full bg-amber-500 animate-pulse"
                    ></span>
                  </div>
                  <p class="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    {{ learnerData.learner.pendingResults }}
                  </p>
                  <span class="text-[0.62rem] font-medium block mt-0.5 text-amber-700/80 dark:text-amber-400/70">
                    Pendientes por nota
                  </span>
                </button>

                <!-- 4. Desaprobados KPI Button -->
                <button
                  type="button"
                  class="rounded-xl border p-3.5 text-center transition-all duration-200 cursor-pointer relative text-left group hover:-translate-y-0.5 active:translate-y-0"
                  :class="[
                    isDarkMode
                      ? (filterStatus === 'desaprobado'
                          ? 'border-rose-400 bg-rose-500/20 ring-2 ring-rose-400 shadow-lg shadow-rose-500/20'
                          : 'border-rose-500/30 bg-rose-500/10 hover:border-rose-500/60 hover:bg-rose-500/15')
                      : (filterStatus === 'desaprobado'
                          ? 'border-rose-500 bg-rose-100 ring-2 ring-rose-600 shadow-md text-rose-950'
                          : 'border-rose-200 bg-rose-50/80 hover:border-rose-300 hover:bg-rose-100/60 shadow-2xs')
                  ]"
                  @click="filterStatus = 'desaprobado'"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-[0.65rem] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      Desaprobados
                    </span>
                    <span
                      v-if="filterStatus === 'desaprobado'"
                      class="h-2 w-2 rounded-full bg-rose-500 animate-pulse"
                    ></span>
                  </div>
                  <p class="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                    {{ learnerData.learner.disapprovedResults }}
                  </p>
                  <span class="text-[0.62rem] font-medium block mt-0.5 text-rose-700/80 dark:text-rose-400/70">
                    Plan de mejora
                  </span>
                </button>
              </div>
            </div>

            <!-- Search Bar, Filter Tabs & Expand/Collapse Controls -->
            <div
              class="rounded-2xl p-3 border transition-colors space-y-3"
              :class="
                isDarkMode
                  ? 'bg-slate-900/80 border-slate-800'
                  : 'bg-white border-slate-200 shadow-2xs'
              "
            >
              <!-- Live Text Search Input -->
              <div class="relative">
                <svg class="absolute left-3.5 top-3 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  v-model="outcomeSearch"
                  type="text"
                  placeholder="Buscar por código de RAP, nombre de competencia o instructor..."
                  class="w-full rounded-xl border pl-9.5 pr-8 py-2 text-xs outline-none transition focus:ring-2 focus:ring-emerald-500/20"
                  :class="
                    isDarkMode
                      ? 'border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:border-emerald-500'
                      : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white'
                  "
                />
                <button
                  v-if="outcomeSearch"
                  type="button"
                  class="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Limpiar búsqueda"
                  @click="outcomeSearch = ''"
                >
                  ✕
                </button>
              </div>

              <!-- Filter Tabs and Expand Actions -->
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 border-t" :class="isDarkMode ? 'border-slate-800/80' : 'border-slate-100'">
                <!-- Status Filter Tabs -->
                <div class="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    class="rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer"
                    :class="
                      filterStatus === 'all'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isDarkMode
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    "
                    @click="filterStatus = 'all'"
                  >
                    Todos ({{ learnerData.learner.totalResults }})
                  </button>
                  <button
                    type="button"
                    class="rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer"
                    :class="
                      filterStatus === 'aprobado'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isDarkMode
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    "
                    @click="filterStatus = 'aprobado'"
                  >
                    Aprobados ({{ learnerData.learner.approvedResults }})
                  </button>
                  <button
                    type="button"
                    class="rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer"
                    :class="
                      filterStatus === 'por evaluar'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : isDarkMode
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    "
                    @click="filterStatus = 'por evaluar'"
                  >
                    Por Evaluar ({{ learnerData.learner.pendingResults }})
                  </button>
                  <button
                    v-if="learnerData.learner.disapprovedResults > 0"
                    type="button"
                    class="rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer"
                    :class="
                      filterStatus === 'desaprobado'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : isDarkMode
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    "
                    @click="filterStatus = 'desaprobado'"
                  >
                    Desaprobados ({{ learnerData.learner.disapprovedResults }})
                  </button>
                </div>

                <!-- Expand/Collapse Buttons -->
                <div class="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    class="text-[0.7rem] font-semibold transition cursor-pointer"
                    :class="isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'"
                    @click="expandAll"
                  >
                    Expandir todo
                  </button>
                  <span :class="isDarkMode ? 'text-slate-700' : 'text-slate-300'">|</span>
                  <button
                    type="button"
                    class="text-[0.7rem] font-semibold transition cursor-pointer"
                    :class="isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'"
                    @click="collapseAll"
                  >
                    Colapsar todo
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State if Search/Filter yields no results -->
            <div
              v-if="filteredCompetencies.length === 0"
              class="rounded-2xl border p-8 text-center space-y-3 transition-colors"
              :class="
                isDarkMode
                  ? 'border-slate-800 bg-slate-900/60'
                  : 'border-slate-200 bg-white shadow-2xs'
              "
            >
              <div class="h-10 w-10 mx-auto rounded-xl flex items-center justify-center bg-slate-500/10 text-slate-400">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h4 class="text-sm font-bold" :class="isDarkMode ? 'text-white' : 'text-slate-900'">
                No se encontraron resultados
              </h4>
              <p class="text-xs max-w-sm mx-auto" :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'">
                No hay resultados de aprendizaje que coincidan con el filtro actual o la búsqueda ingresada.
              </p>
              <button
                type="button"
                class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
                :class="
                  isDarkMode
                    ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                "
                @click="filterStatus = 'all'; outcomeSearch = ''"
              >
                Restablecer búsqueda y filtros
              </button>
            </div>

            <!-- Competencies Accordion List -->
            <div v-else class="space-y-3">
              <div
                v-for="comp in filteredCompetencies"
                :key="comp.code"
                class="rounded-2xl border overflow-hidden shadow-xs transition-colors"
                :class="
                  isDarkMode
                    ? 'border-slate-800 bg-slate-900/90'
                    : 'border-slate-200 bg-white shadow-slate-200/40'
                "
              >
                <!-- Accordion Header -->
                <button
                  type="button"
                  class="w-full p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left transition cursor-pointer"
                  :class="isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'"
                  @click="toggleCompetency(comp.code)"
                >
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Norma / Competencia: {{ comp.code }}
                      </span>
                      <span
                        class="rounded-full px-2 py-0.5 text-[0.65rem]"
                        :class="
                          isDarkMode
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        "
                      >
                        {{ comp.approvedResults }}/{{ comp.totalResults }} Aprobados
                      </span>
                    </div>
                    <h3 class="text-sm font-bold" :class="isDarkMode ? 'text-white' : 'text-slate-900'">
                      {{ comp.name }}
                    </h3>
                  </div>

                  <div class="flex items-center gap-3 shrink-0">
                    <!-- Competency Progress Badge -->
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold" :class="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
                        {{ formatPercent(comp.progress) }}
                      </span>
                      <div
                        class="w-16 h-2 rounded-full overflow-hidden"
                        :class="isDarkMode ? 'bg-slate-950' : 'bg-slate-200'"
                      >
                        <div
                          class="h-full bg-emerald-500 rounded-full"
                          :style="{ width: `${comp.progress}%` }"
                        ></div>
                      </div>
                    </div>

                    <!-- Chevron -->
                    <div
                      class="h-6 w-6 rounded-lg flex items-center justify-center transition"
                      :class="
                        isDarkMode
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-slate-100 text-slate-600'
                      "
                    >
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
                  class="border-t p-3 sm:p-4 space-y-2.5 transition-colors"
                  :class="
                    isDarkMode
                      ? 'border-slate-800/80 bg-slate-950/60'
                      : 'border-slate-100 bg-slate-50/70'
                  "
                >
                  <div
                    v-for="result in comp.visibleResults"
                    :key="result.code"
                    class="rounded-xl border p-3 sm:p-4 space-y-2 transition-all"
                    :class="
                      isDarkMode
                        ? 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
                        : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                    "
                  >
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <span
                          class="rounded px-2 py-0.5 font-mono text-[0.68rem] font-bold"
                          :class="
                            isDarkMode
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          "
                        >
                          RAP {{ result.code }}
                        </span>
                        <span
                          class="rounded-md border px-2 py-0.5 text-[0.68rem] font-bold"
                          :class="getJudgementBadge(result.judgement).class"
                        >
                          {{ getJudgementBadge(result.judgement).text }}
                        </span>
                      </div>

                      <span v-if="result.registeredAt" class="text-[0.65rem]" :class="isDarkMode ? 'text-slate-500' : 'text-slate-400'">
                        Evaluado: {{ formatDate(result.registeredAt) }}
                      </span>
                    </div>

                    <p class="text-xs leading-relaxed" :class="isDarkMode ? 'text-slate-300' : 'text-slate-700'">
                      {{ result.detail }}
                    </p>

                    <div
                      v-if="result.funcionario && result.funcionario !== 'Sin funcionario'"
                      class="pt-1 text-[0.7rem] flex items-center gap-1.5"
                      :class="isDarkMode ? 'text-slate-400' : 'text-slate-500'"
                    >
                      <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <span>Evaluador: {{ result.funcionario }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sticky Bottom Actions -->
            <div class="flex items-center justify-between pt-4 border-t" :class="isDarkMode ? 'border-slate-800' : 'border-slate-200'">
              <button
                type="button"
                class="text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                :class="isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'"
                @click="clearConsultation"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                <span>Realizar otra consulta</span>
              </button>

              <button
                type="button"
                class="rounded-xl border px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                :class="
                  isDarkMode
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-2xs'
                "
                @click="handleDownloadPdf"
              >
                <svg class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer
      class="mt-auto border-t py-4 text-center text-xs transition-colors"
      :class="
        isDarkMode
          ? 'border-slate-800/80 bg-slate-950/80 text-slate-500'
          : 'border-slate-200 bg-white/80 text-slate-500 shadow-2xs'
      "
    >
      <div class="mx-auto max-w-[1536px] px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Juicios Evaluativos SENA &copy; {{ new Date().getFullYear() }}</span>
        <span>Módulo de Exposición e Interacción Pública</span>
      </div>
    </footer>
  </div>
</template>
