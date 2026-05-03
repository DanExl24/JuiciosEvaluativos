<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import type {
  DashboardPayload,
  FormationCatalogCompetency,
  FormationCatalogResult,
  LearnerDetail,
} from '../types/dashboard'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

const props = defineProps<{
  refreshToken: number
  focusLearnerId: number | null
  focusFicha: string
  focusNonce: number
}>()

const dashboard = ref<DashboardPayload | null>(null)
const dashboardError = ref('')
const learnerError = ref('')
const isDashboardLoading = ref(false)
const isLearnerLoading = ref(false)
const isCatalogLoading = ref(false)
const learnerDetail = ref<LearnerDetail | null>(null)
const formationCatalog = ref<FormationCatalogCompetency[]>([])
const selectedLearnerId = ref<number | null>(null)
const fichaLearnerSearch = ref('')
const learnerSearch = ref('')
const expandedCompetencies = ref<string[]>([])
const selectedCatalogResult = ref<{
  competencyCode: string
  competencyName: string
  ficha: string
  result: FormationCatalogResult
} | null>(null)
const isApplyingExternalFocus = ref(false)
const isSyncingLearnerFilters = ref(false)
const filters = ref({
  estado: '',
  ficha: '',
  juicio: '',
})

const fichaLearners = computed(() => {
  const search = fichaLearnerSearch.value.trim().toLowerCase()
  const learners = dashboard.value?.learners ?? []

  return learners.filter((learner) => {
    if (!search) {
      return true
    }

    return [learner.fullName, learner.document, learner.ficha, learner.program].some((value) =>
      value.toLowerCase().includes(search),
    )
  })
})
const fichaLearnerMatchSummary = computed(() => {
  const totalMatches = fichaLearners.value.length

  if (!fichaLearnerSearch.value.trim()) {
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

const selectedLearnerSummary = computed(
  () => dashboard.value?.learners.find((learner) => String(learner.id) === String(selectedLearnerId.value ?? '')) ?? null,
)
const currentFichaLabel = computed(() => filters.value.ficha || learnerDetail.value?.learner.ficha || '')
const isLearnerSelected = computed(() => selectedLearnerSummary.value !== null)
const formationStats = computed(() => ({
  competencies: formationCatalog.value.length,
  results: formationCatalog.value.reduce((total, competency) => total + competency.results.length, 0),
}))
const formationOverviewCards = computed(() => {
  const totals = formationCatalog.value.reduce(
    (accumulator, competency) => {
      accumulator.totalLearners += competency.totalLearners
      accumulator.approvedLearners += competency.approvedLearners
      accumulator.pendingLearners += competency.pendingLearners
      accumulator.disapprovedLearners += competency.disapprovedLearners
      return accumulator
    },
    {
      totalLearners: 0,
      approvedLearners: 0,
      pendingLearners: 0,
      disapprovedLearners: 0,
    },
  )

  if (!totals.totalLearners) {
    return []
  }

  return [
    { label: 'Registros visibles', value: totals.totalLearners, tone: 'slate' },
    { label: 'Aprobados', value: totals.approvedLearners, tone: 'emerald' },
    { label: 'Pendientes', value: totals.pendingLearners, tone: 'amber' },
    { label: 'Avance general', value: formatPercent((totals.approvedLearners / totals.totalLearners) * 100), tone: 'sky' },
  ]
})

const learnerOverviewCards = computed(() => {
  if (!learnerDetail.value) {
    return []
  }

  return [
    { label: 'Resultados', value: learnerDetail.value.learner.totalResults, tone: 'slate' },
    { label: 'Aprobados', value: learnerDetail.value.learner.approvedResults, tone: 'emerald' },
    { label: 'Pendientes', value: learnerDetail.value.learner.pendingResults, tone: 'amber' },
    { label: 'Avance general', value: formatPercent(learnerDetail.value.learner.progress), tone: 'sky' },
  ]
})

const visibleFormationCompetencies = computed(() => {
  const query = learnerSearch.value.trim().toLowerCase()
  const judgement = filters.value.juicio

  return formationCatalog.value
    .map((competency) => {
      const competencyMatch =
        !query ||
        competency.name.toLowerCase().includes(query) ||
        competency.code.toLowerCase().includes(query)

      const filteredResults = competency.results.filter((result) => {
        const judgementMatch =
          !judgement || result.learners.some((learner) => learner.judgement === judgement)

        return (
          judgementMatch &&
          (
            !query ||
            competencyMatch ||
            result.code.toLowerCase().includes(query) ||
            result.detail.toLowerCase().includes(query)
          )
        )
      })

      if (!competencyMatch && !filteredResults.length) {
        return null
      }

      if (judgement && !filteredResults.length) {
        return null
      }

      return {
        ...competency,
        totalResults: filteredResults.length || competency.totalResults,
        results: filteredResults,
      }
    })
    .filter((competency): competency is NonNullable<typeof competency> => competency !== null)
})

const selectedCatalogResultLearners = computed(() => {
  if (!selectedCatalogResult.value) {
    return []
  }

  const judgement = filters.value.juicio

  return selectedCatalogResult.value.result.learners.filter((learner) => !judgement || learner.judgement === judgement)
})

const visibleLearnerCompetencies = computed(() => {
  if (!learnerDetail.value) {
    return []
  }

  const query = learnerSearch.value.trim().toLowerCase()
  const judgement = filters.value.juicio

  return learnerDetail.value.competencies
    .map((competency) => {
      const competencyMatch =
        !query ||
        competency.name.toLowerCase().includes(query) ||
        competency.code.toLowerCase().includes(query)

      const filteredResults = competency.results.filter((result) => {
        const resultMatch =
          !query ||
          competencyMatch ||
          result.code.toLowerCase().includes(query) ||
          result.detail.toLowerCase().includes(query) ||
          result.funcionario.toLowerCase().includes(query)

        const judgementMatch = !filters.value.juicio || result.judgement === judgement
        return resultMatch && judgementMatch
      })

      if (!competencyMatch && !filteredResults.length) {
        return null
      }

      if (competencyMatch && !filteredResults.length && judgement) {
        return null
      }

      return {
        ...competency,
        results: filteredResults,
      }
    })
    .filter((competency): competency is NonNullable<typeof competency> => competency !== null)
})

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Sin fecha'
  }

  return new Date(`${value}-05:00`).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
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

function resetFilters() {
  filters.value = {
    estado: '',
    ficha: props.focusFicha || '',
    juicio: '',
  }
  selectedLearnerId.value = null
  fichaLearnerSearch.value = ''
  learnerSearch.value = ''
  learnerDetail.value = null
  expandedCompetencies.value = []
  selectedCatalogResult.value = null
}

function toggleCompetency(code: string) {
  if (expandedCompetencies.value.includes(code)) {
    expandedCompetencies.value = expandedCompetencies.value.filter((item) => item !== code)
    return
  }

  expandedCompetencies.value = [...expandedCompetencies.value, code]
}

function openCatalogResultModal(competency: FormationCatalogCompetency, result: FormationCatalogResult) {
  selectedCatalogResult.value = {
    competencyCode: competency.code,
    competencyName: competency.name,
    ficha: competency.ficha,
    result,
  }
}

function closeCatalogResultModal() {
  selectedCatalogResult.value = null
}

function judgementBadgeClass(judgement: string) {
  if (judgement === 'aprobado') {
    return 'bg-emerald-100 text-emerald-800'
  }

  if (judgement === 'por evaluar') {
    return 'bg-amber-100 text-amber-800'
  }

  return 'bg-rose-100 text-rose-800'
}

async function fetchDashboard() {
  isDashboardLoading.value = true
  dashboardError.value = ''

  try {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries({
      estado: filters.value.estado,
      ficha: filters.value.ficha,
    })) {
      if (value) {
        params.set(key, value)
      }
    }

    const response = await fetch(`${apiBaseUrl}/api/dashboard${params.toString() ? `?${params.toString()}` : ''}`)
    if (!response.ok) {
      throw new Error('No se pudo cargar la vista de competencias y resultados.')
    }

    dashboard.value = (await response.json()) as DashboardPayload
  } catch (error) {
    dashboardError.value =
      error instanceof Error ? error.message : 'Ocurrio un error inesperado al consultar la vista.'
  } finally {
    isDashboardLoading.value = false
  }
}

async function fetchFormationCatalog() {
  isCatalogLoading.value = true

  try {
    const params = new URLSearchParams()
    if (filters.value.ficha) {
      params.set('ficha', filters.value.ficha)
    }
    if (filters.value.estado) {
      params.set('estado', filters.value.estado)
    }

    const response = await fetch(
      `${apiBaseUrl}/api/formations/competencies${params.toString() ? `?${params.toString()}` : ''}`,
    )
    if (!response.ok) {
      throw new Error('No se pudo cargar el catalogo de competencias y resultados.')
    }

    formationCatalog.value = (await response.json()) as FormationCatalogCompetency[]
  } catch (error) {
    formationCatalog.value = []
    dashboardError.value =
      error instanceof Error ? error.message : 'Ocurrio un error inesperado al consultar el catalogo.'
  } finally {
    isCatalogLoading.value = false
  }
}

async function syncFiltersWithSelectedLearner() {
  if (!selectedLearnerSummary.value) {
    return
  }

  isSyncingLearnerFilters.value = true
  filters.value = {
    ...filters.value,
    ficha: selectedLearnerSummary.value.ficha,
    estado: selectedLearnerSummary.value.state,
  }
  await nextTick()
  isSyncingLearnerFilters.value = false
}

async function fetchLearnerDetail() {
  if (!selectedLearnerId.value) {
    learnerDetail.value = null
    learnerError.value = ''
    return
  }

  isLearnerLoading.value = true
  learnerError.value = ''

  try {
    const response = await fetch(`${apiBaseUrl}/api/learners/${selectedLearnerId.value}`)
    if (!response.ok) {
      throw new Error('No se pudo cargar el detalle del aprendiz.')
    }

    learnerDetail.value = (await response.json()) as LearnerDetail
    expandedCompetencies.value = learnerDetail.value.competencies.slice(0, 2).map((item) => item.code)
  } catch (error) {
    learnerDetail.value = null
    learnerError.value =
      error instanceof Error ? error.message : 'Ocurrio un error inesperado al consultar el aprendiz.'
  } finally {
    isLearnerLoading.value = false
  }
}

watch(
  () => ({ ...filters.value }),
  () => {
    void fetchDashboard()
    void fetchFormationCatalog()
  },
  { deep: true },
)

watch(
  () => filters.value.ficha,
  (currentFicha, previousFicha) => {
    if (currentFicha === previousFicha) {
      return
    }

    if (isApplyingExternalFocus.value || isSyncingLearnerFilters.value) {
      return
    }

    selectedLearnerId.value = null
    fichaLearnerSearch.value = ''
    learnerDetail.value = null
    learnerError.value = ''
    expandedCompetencies.value = []
    selectedCatalogResult.value = null
  },
)

watch(
  () => filters.value.juicio,
  () => {
    selectedCatalogResult.value = null
  },
)

watch(
  () => fichaLearnerSearch.value,
  (searchTerm) => {
    if (isApplyingExternalFocus.value) {
      return
    }

    const normalizedSearch = normalizeSearchValue(searchTerm)
    if (!normalizedSearch) {
      return
    }

    const exactMatch = fichaLearners.value.find((learner) =>
      [learner.fullName, learner.document, `${learner.documentType} ${learner.document}`].some(
        (value) => normalizeSearchValue(value) === normalizedSearch,
      ),
    )

    if (exactMatch) {
      selectedLearnerId.value = exactMatch.id
      return
    }

    if (fichaLearners.value.length === 1) {
      selectedLearnerId.value = fichaLearners.value[0]!.id
    }
  },
)

watch(
  () => props.refreshToken,
  () => {
    void fetchDashboard()
    void fetchFormationCatalog()
  },
)

watch(
  () => props.focusNonce,
  () => {
    isApplyingExternalFocus.value = true
    filters.value.ficha = props.focusFicha || filters.value.ficha
    selectedLearnerId.value = props.focusLearnerId
    fichaLearnerSearch.value = ''
    learnerSearch.value = ''
    learnerDetail.value = null
    expandedCompetencies.value = []

    void Promise.all([fetchDashboard(), fetchFormationCatalog()]).finally(() => {
      isApplyingExternalFocus.value = false
      if (selectedLearnerId.value) {
        void fetchLearnerDetail()
      }
    })
  },
)

watch(selectedLearnerId, async () => {
  if (selectedLearnerId.value) {
    await syncFiltersWithSelectedLearner()
  } else if (filters.value.estado && !selectedLearnerId.value) {
    filters.value = {
      ...filters.value,
      estado: '',
    }
    fichaLearnerSearch.value = ''
  }

  void fetchLearnerDetail()
})

onMounted(() => {
  isApplyingExternalFocus.value = true
  filters.value.ficha = props.focusFicha || ''
  selectedLearnerId.value = props.focusLearnerId
  void Promise.all([fetchDashboard(), fetchFormationCatalog()]).finally(() => {
    isApplyingExternalFocus.value = false
  })
})
</script>

<template>
  <main class="grid gap-6">
    <section class="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <article class="rounded-[2rem] border border-emerald-950/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:p-7">
        <div class="flex flex-col gap-4 border-b border-slate-200/80 pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span class="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-700">Competencias y resultados</span>
            <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">Filtros academicos de la formacion</h2>
          </div>
          <button
            class="rounded-2xl border border-emerald-950/10 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
            type="button"
            @click="resetFilters"
          >
            Limpiar
          </button>
        </div>

        <div class="mt-6 grid gap-4">
          <label class="grid min-w-0 gap-2">
            <span class="text-sm font-medium text-slate-700">Ficha</span>
            <select
              v-model="filters.ficha"
              class="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
            >
              <option value="">Todas</option>
              <option v-for="ficha in dashboard?.options.fichas ?? []" :key="ficha" :value="ficha">
                {{ ficha }}
              </option>
            </select>
          </label>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="grid min-w-0 gap-2">
              <span class="text-sm font-medium text-slate-700">Estado del aprendiz</span>
              <select
                v-model="filters.estado"
                class="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                :disabled="isLearnerSelected"
              >
                <option value="">Todos</option>
                <option v-for="estado in dashboard?.options.estados ?? []" :key="estado" :value="estado">
                  {{ prettyState(estado) }}
                </option>
              </select>
            </label>

            <label class="grid min-w-0 gap-2">
              <span class="text-sm font-medium text-slate-700">Juicio evaluativo</span>
              <select
                v-model="filters.juicio"
                class="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
              >
                <option value="">Todos</option>
                <option v-for="juicio in dashboard?.options.juicios ?? []" :key="juicio" :value="juicio">
                  {{ prettyState(juicio) }}
                </option>
              </select>
            </label>
          </div>

          <label class="grid gap-2">
            <span class="text-sm font-medium text-slate-700">Buscar competencia</span>
            <input
              v-model="learnerSearch"
              type="text"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
              placeholder="Codigo, nombre, resultado o funcionario"
            />
          </label>

          <p class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Sin un aprendiz seleccionado, esta vista muestra el avance general por competencia y resultado. Si aplicas un juicio, podras abrir cada resultado y ver solo los aprendices asociados a ese estado.
          </p>

          <p v-if="isLearnerSelected" class="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Al seleccionar un aprendiz, el estado se sincroniza con sus datos reales y queda bloqueado. La ficha sigue disponible para navegar hacia otros grupos de aprendices.
          </p>
        </div>

        <p v-if="dashboardError" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {{ dashboardError }}
        </p>
      </article>

      <article class="rounded-[2rem] border border-emerald-950/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:p-7">
        <div class="border-b border-slate-200/80 pb-5">
          <span class="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-700">Aprendiz de la formacion</span>
          <h3 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {{ currentFichaLabel ? `Ficha ${currentFichaLabel}` : 'Selecciona una ficha' }}
          </h3>
          <p class="mt-3 text-sm leading-7 text-slate-600">
            Esta tarjeta concentra solo la busqueda y seleccion de aprendices correspondientes a la ficha filtrada.
          </p>
        </div>

        <div class="mt-6 grid gap-4">
          <label class="grid gap-2">
            <span class="text-sm font-medium text-slate-700">Buscar aprendiz de la formacion</span>
            <input
              v-model="fichaLearnerSearch"
              type="text"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
              placeholder="Nombre, documento o programa"
            />
          </label>

          <p v-if="fichaLearnerMatchSummary" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {{ fichaLearnerMatchSummary }}
          </p>

          <label class="grid gap-2">
            <span class="text-sm font-medium text-slate-700">Selector de aprendices</span>
            <select
              v-model="selectedLearnerId"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
            >
              <option :value="null">Selecciona un aprendiz</option>
              <option v-for="learner in fichaLearners" :key="learner.id" :value="learner.id">
                {{ learner.fullName }} - {{ learner.document }}
              </option>
            </select>
          </label>

          <div v-if="selectedLearnerSummary" class="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/70 px-4 py-4">
            <p class="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-emerald-700">Aprendiz seleccionado</p>
            <p class="mt-2 text-sm font-semibold text-slate-950">{{ selectedLearnerSummary.fullName }}</p>
            <p class="mt-1 text-xs text-slate-600">
              {{ selectedLearnerSummary.documentType }} {{ selectedLearnerSummary.document }} · Estado {{ prettyState(selectedLearnerSummary.state) }}
            </p>
          </div>
        </div>
      </article>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-[1.75rem] border border-emerald-950/10 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <p class="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500">Competencias de la ficha</p>
        <p class="mt-3 text-4xl font-black tracking-tight text-slate-950">{{ formationStats.competencies }}</p>
        <p class="mt-2 text-sm text-slate-600">
          {{ currentFichaLabel ? `Totales para la ficha ${currentFichaLabel}.` : 'Totales para todas las formaciones visibles.' }}
        </p>
      </article>

      <article class="rounded-[1.75rem] border border-emerald-950/10 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <p class="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500">Resultados de la ficha</p>
        <p class="mt-3 text-4xl font-black tracking-tight text-slate-950">{{ formationStats.results }}</p>
        <p class="mt-2 text-sm text-slate-600">Suma de resultados asociados a las competencias catalogadas.</p>
      </article>

      <article
        v-for="card in learnerDetail ? learnerOverviewCards : formationOverviewCards"
        :key="card.label"
        class="rounded-[1.75rem] border p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
        :class="
          card.tone === 'slate'
            ? 'border-slate-200 bg-white/85'
            : card.tone === 'emerald'
              ? 'border-emerald-200 bg-emerald-50'
              : card.tone === 'amber'
                ? 'border-amber-200 bg-amber-50'
                : 'border-sky-200 bg-sky-50'
        "
      >
        <p class="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500">{{ card.label }}</p>
        <p class="mt-3 text-4xl font-black tracking-tight text-slate-950">{{ card.value }}</p>
      </article>
    </section>

    <p v-if="learnerError" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
      {{ learnerError }}
    </p>

    <section v-if="learnerDetail" class="rounded-[2rem] border border-emerald-950/10 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <div class="grid gap-4 border-b border-slate-200/80 px-6 py-5 xl:grid-cols-[1fr_auto] xl:px-7">
        <div>
          <span class="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-700">Detalle del aprendiz</span>
          <h3 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">{{ learnerDetail.learner.fullName }}</h3>
        </div>
        <div class="flex flex-wrap gap-3 text-sm text-slate-600">
          <span class="rounded-full bg-slate-100 px-3 py-1">{{ learnerDetail.learner.documentType }} {{ learnerDetail.learner.document }}</span>
          <span class="rounded-full bg-slate-100 px-3 py-1">Ficha {{ learnerDetail.learner.ficha }}</span>
          <span class="rounded-full bg-slate-100 px-3 py-1">{{ prettyState(learnerDetail.learner.state) }}</span>
          <span class="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">Avance {{ formatPercent(learnerDetail.learner.progress) }}</span>
        </div>
      </div>

      <div class="grid gap-4 p-6 xl:p-7">
        <article
          v-for="competency in visibleLearnerCompetencies"
          :key="competency.code"
          class="overflow-hidden rounded-[1.6rem] border border-emerald-950/10 bg-white"
        >
          <button
            class="flex w-full flex-col gap-4 bg-[linear-gradient(135deg,rgba(236,253,245,0.92),rgba(255,255,255,0.98))] px-5 py-5 text-left sm:flex-row sm:items-center sm:justify-between"
            type="button"
            @click="toggleCompetency(competency.code)"
          >
            <div>
              <p class="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-emerald-700">{{ competency.code }}</p>
              <h4 class="mt-2 text-lg font-semibold text-slate-950">{{ competency.name }}</h4>
            </div>
            <div class="grid gap-2 text-sm text-slate-600 sm:text-right">
              <p>{{ competency.approvedResults }}/{{ competency.totalResults }} aprobados</p>
              <p class="font-semibold text-slate-950">Avance de la competencia: {{ formatPercent(competency.progress) }}</p>
            </div>
          </button>

          <div v-if="expandedCompetencies.includes(competency.code)" class="border-t border-slate-100 px-5 py-5">
            <div class="mb-4 grid gap-3 md:grid-cols-4">
              <div class="rounded-2xl bg-slate-50 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-500">Resultados</p>
                <p class="mt-2 text-xl font-bold text-slate-950">{{ competency.totalResults }}</p>
              </div>
              <div class="rounded-2xl bg-emerald-50 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.18em] text-emerald-700">Aprobados</p>
                <p class="mt-2 text-xl font-bold text-slate-950">{{ competency.approvedResults }}</p>
              </div>
              <div class="rounded-2xl bg-amber-50 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.18em] text-amber-700">Pendientes</p>
                <p class="mt-2 text-xl font-bold text-slate-950">{{ competency.pendingResults }}</p>
              </div>
              <div class="rounded-2xl bg-rose-50 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.18em] text-rose-700">Desaprobados</p>
                <p class="mt-2 text-xl font-bold text-slate-950">{{ competency.disapprovedResults }}</p>
              </div>
            </div>

            <div class="overflow-x-auto rounded-[1.35rem] border border-slate-200">
              <table class="min-w-[860px] w-full border-separate border-spacing-0">
                <thead>
                  <tr class="bg-emerald-50/80">
                    <th class="border-b border-slate-200 px-4 py-4 text-left text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-600">Resultado</th>
                    <th class="border-b border-slate-200 px-4 py-4 text-left text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-600">Juicio</th>
                    <th class="border-b border-slate-200 px-4 py-4 text-left text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-600">Funcionario</th>
                    <th class="border-b border-slate-200 px-4 py-4 text-left text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-600">Fecha y hora</th>
                    <th class="border-b border-slate-200 px-4 py-4 text-left text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-600">Avance del resultado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="result in competency.results" :key="`${competency.code}-${result.code}`" class="odd:bg-white even:bg-slate-50/70">
                    <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">
                      <p class="font-semibold text-slate-950">{{ result.code }}</p>
                      <p class="mt-1 text-xs leading-6 text-slate-500">{{ result.detail }}</p>
                    </td>
                    <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">
                      <span
                        class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                        :class="
                          result.judgement === 'aprobado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : result.judgement === 'por evaluar'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                        "
                      >
                        {{ prettyState(result.judgement) }}
                      </span>
                    </td>
                    <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">{{ result.funcionario }}</td>
                    <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">{{ formatDate(result.registeredAt) }}</td>
                    <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">
                      <div class="w-36">
                        <div class="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div class="h-full rounded-full bg-slate-950" :style="{ width: `${result.statusProgress}%` }"></div>
                        </div>
                        <p class="mt-2 text-xs font-semibold text-slate-600">{{ formatPercent(result.statusProgress) }}</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <p v-if="!visibleLearnerCompetencies.length && !isLearnerLoading" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
          No se encontraron competencias o resultados con los filtros aplicados.
        </p>
      </div>
    </section>

    <section v-else class="rounded-[2rem] border border-emerald-950/10 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <div class="border-b border-slate-200/80 px-6 py-5 xl:px-7">
        <span class="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-700">Catalogo de la ficha</span>
        <h3 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          {{ currentFichaLabel ? `Competencias y resultados de la ficha ${currentFichaLabel}` : 'Competencias y resultados de todas las formaciones' }}
        </h3>
      </div>

      <div class="grid gap-4 p-6 xl:p-7">
        <article
          v-for="competency in visibleFormationCompetencies"
          :key="`${competency.ficha}-${competency.code}`"
          class="overflow-hidden rounded-[1.6rem] border border-emerald-950/10 bg-white"
        >
          <button
            class="flex w-full flex-col gap-4 bg-[linear-gradient(135deg,rgba(236,253,245,0.92),rgba(255,255,255,0.98))] px-5 py-5 text-left sm:flex-row sm:items-center sm:justify-between"
            type="button"
            @click="toggleCompetency(`${competency.ficha}-${competency.code}`)"
          >
            <div>
              <p class="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                {{ competency.code }} · Ficha {{ competency.ficha }}
              </p>
              <h4 class="mt-2 text-lg font-semibold text-slate-950">{{ competency.name }}</h4>
            </div>
            <div class="grid gap-2 text-sm text-slate-600 sm:text-right">
              <p>{{ competency.program }}</p>
              <p class="font-semibold text-slate-950">{{ competency.approvedLearners }}/{{ competency.totalLearners }} aprobados</p>
              <p class="font-semibold text-slate-950">Avance general: {{ formatPercent(competency.progress) }}</p>
            </div>
          </button>

          <div v-if="expandedCompetencies.includes(`${competency.ficha}-${competency.code}`)" class="border-t border-slate-100 px-5 py-5">
            <div class="mb-4 grid gap-3 md:grid-cols-4">
              <div class="rounded-2xl bg-slate-50 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-500">Resultados visibles</p>
                <p class="mt-2 text-xl font-bold text-slate-950">{{ competency.results.length }}</p>
              </div>
              <div class="rounded-2xl bg-emerald-50 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.18em] text-emerald-700">Aprobados</p>
                <p class="mt-2 text-xl font-bold text-slate-950">{{ competency.approvedLearners }}</p>
              </div>
              <div class="rounded-2xl bg-amber-50 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.18em] text-amber-700">Pendientes</p>
                <p class="mt-2 text-xl font-bold text-slate-950">{{ competency.pendingLearners }}</p>
              </div>
              <div class="rounded-2xl bg-rose-50 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.18em] text-rose-700">Desaprobados</p>
                <p class="mt-2 text-xl font-bold text-slate-950">{{ competency.disapprovedLearners }}</p>
              </div>
            </div>

            <div class="overflow-x-auto rounded-[1.35rem] border border-slate-200">
              <table class="min-w-[980px] w-full border-separate border-spacing-0">
                <thead>
                  <tr class="bg-emerald-50/80">
                    <th class="border-b border-slate-200 px-4 py-4 text-left text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-600">Resultado</th>
                    <th class="border-b border-slate-200 px-4 py-4 text-left text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-600">Detalle</th>
                    <th class="border-b border-slate-200 px-4 py-4 text-left text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-600">Avance</th>
                    <th class="border-b border-slate-200 px-4 py-4 text-left text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-600">Aprendices</th>
                    <th class="border-b border-slate-200 px-4 py-4 text-left text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-600">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="result in competency.results" :key="`${competency.ficha}-${competency.code}-${result.code}`" class="odd:bg-white even:bg-slate-50/70">
                    <td class="border-b border-slate-100 px-4 py-4 align-top text-sm font-semibold text-slate-950">{{ result.code }}</td>
                    <td class="border-b border-slate-100 px-4 py-4 align-top text-sm leading-6 text-slate-700">{{ result.detail }}</td>
                    <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">
                      <div class="w-36">
                        <div class="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div class="h-full rounded-full bg-slate-950" :style="{ width: `${result.progress}%` }"></div>
                        </div>
                        <p class="mt-2 text-xs font-semibold text-slate-600">{{ formatPercent(result.progress) }}</p>
                      </div>
                    </td>
                    <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">
                      <p class="font-semibold text-slate-950">{{ result.approvedLearners }}/{{ result.totalLearners }} aprobados</p>
                      <p class="mt-1 text-xs text-slate-500">
                        Pendientes {{ result.pendingLearners }} · Desaprobados {{ result.disapprovedLearners }}
                      </p>
                    </td>
                    <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">
                      <button
                        class="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        type="button"
                        @click="openCatalogResultModal(competency, result)"
                      >
                        Ver aprendices
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <p
          v-if="!visibleFormationCompetencies.length && !isCatalogLoading && !isLearnerLoading"
          class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600"
        >
          No se encontraron competencias o resultados para la ficha y busqueda actuales.
        </p>
      </div>
    </section>

    <div
      v-if="selectedCatalogResult"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6"
      @click.self="closeCatalogResultModal"
    >
      <article class="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-[0_32px_120px_rgba(15,23,42,0.35)]">
        <div class="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span class="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              {{ selectedCatalogResult.competencyCode }} · {{ selectedCatalogResult.result.code }} · Ficha {{ selectedCatalogResult.ficha }}
            </span>
            <h3 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">{{ selectedCatalogResult.result.detail }}</h3>
            <p class="mt-2 text-sm text-slate-600">{{ selectedCatalogResult.competencyName }}</p>
          </div>
          <button
            class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            type="button"
            @click="closeCatalogResultModal"
          >
            Cerrar
          </button>
        </div>

        <div class="grid gap-3 border-b border-slate-200 px-6 py-5 md:grid-cols-4">
          <div class="rounded-2xl bg-slate-50 px-4 py-3">
            <p class="text-xs uppercase tracking-[0.18em] text-slate-500">Aprendices en el modal</p>
            <p class="mt-2 text-xl font-bold text-slate-950">{{ selectedCatalogResultLearners.length }}</p>
          </div>
          <div class="rounded-2xl bg-emerald-50 px-4 py-3">
            <p class="text-xs uppercase tracking-[0.18em] text-emerald-700">Aprobados</p>
            <p class="mt-2 text-xl font-bold text-slate-950">{{ selectedCatalogResult.result.approvedLearners }}</p>
          </div>
          <div class="rounded-2xl bg-amber-50 px-4 py-3">
            <p class="text-xs uppercase tracking-[0.18em] text-amber-700">Pendientes</p>
            <p class="mt-2 text-xl font-bold text-slate-950">{{ selectedCatalogResult.result.pendingLearners }}</p>
          </div>
          <div class="rounded-2xl bg-sky-50 px-4 py-3">
            <p class="text-xs uppercase tracking-[0.18em] text-sky-700">Avance</p>
            <p class="mt-2 text-xl font-bold text-slate-950">{{ formatPercent(selectedCatalogResult.result.progress) }}</p>
          </div>
        </div>

        <div class="px-6 py-5">
          <p class="mb-4 text-sm text-slate-600">
            {{ filters.juicio ? `Mostrando aprendices con juicio ${prettyState(filters.juicio)}.` : 'Mostrando todos los aprendices asociados a este resultado.' }}
          </p>

          <div class="max-h-[52vh] overflow-auto rounded-[1.35rem] border border-slate-200">
            <table class="min-w-[760px] w-full border-separate border-spacing-0">
              <thead>
                <tr class="bg-emerald-50/80">
                  <th class="border-b border-slate-200 px-4 py-4 text-left text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-600">Aprendiz</th>
                  <th class="border-b border-slate-200 px-4 py-4 text-left text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-600">Documento</th>
                  <th class="border-b border-slate-200 px-4 py-4 text-left text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-600">Estado</th>
                  <th class="border-b border-slate-200 px-4 py-4 text-left text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-600">Juicio</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="learner in selectedCatalogResultLearners" :key="`${selectedCatalogResult.result.code}-${learner.id}`" class="odd:bg-white even:bg-slate-50/70">
                  <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">
                    <p class="font-semibold text-slate-950">{{ learner.fullName }}</p>
                  </td>
                  <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">
                    {{ learner.documentType }} {{ learner.document }}
                  </td>
                  <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">{{ prettyState(learner.state) }}</td>
                  <td class="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-700">
                    <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold" :class="judgementBadgeClass(learner.judgement)">
                      {{ prettyState(learner.judgement) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p
            v-if="!selectedCatalogResultLearners.length"
            class="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600"
          >
            No hay aprendices para el juicio seleccionado en este resultado.
          </p>
        </div>
      </article>
    </div>
  </main>
</template>
