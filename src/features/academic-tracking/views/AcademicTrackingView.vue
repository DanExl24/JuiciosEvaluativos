<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAcademicTracking } from '../composables/useAcademicTracking'
import { useAcademicContextStore } from '../../../stores/academicContext.store'
import ResultDetailModal from '../components/ResultDetailModal.vue'
import type { FormationCatalogCompetency, FormationCatalogResult } from '../types/tracking.types'
import { formatPercent, prettyState } from '../../../utils/formatters/number'
import { formatDate } from '../../../utils/formatters/date'
import { normalizeSearchValue } from '../../../utils/search/textNormalizer'

const academicStore = useAcademicContextStore()

const {
  dashboard,
  learnerDetail,
  isCatalogLoading,
  isLearnerLoading,
  trackingError,
  learnerError,
  expandedCompetencies,
  loadDashboard,
  loadFormationCatalog,
  loadLearnerDetail,
  toggleCompetencyAccordion,
  filterCatalog,
} = useAcademicTracking()

const fichaLearnerSearch = ref('')
const catalogSearch = ref('')
const selectedModalResult = ref<{
  competencyCode: string
  competencyName: string
  ficha: string
  result: FormationCatalogResult
} | null>(null)

// Competency filter status on the right: 'all' | 'pending' | 'completed'
const competencyStatusFilter = ref<'all' | 'pending' | 'completed'>('all')

// Pagination for competencies on the right
const currentPage = ref(1)
const itemsPerPage = ref(5)

const filters = ref({
  estado: academicStore.filters.estado || '',
  ficha: academicStore.selectedFicha || academicStore.filters.ficha || '',
  juicio: academicStore.filters.juicio || '',
})

const selectedLearnerId = ref<number | null>(academicStore.selectedLearnerId)

const fichaLearners = computed(() => {
  const search = normalizeSearchValue(fichaLearnerSearch.value)
  const learners = dashboard.value?.learners ?? []
  if (!search) return learners
  return learners.filter((learner) =>
    [learner.fullName, learner.document, learner.ficha, learner.program].some((v) =>
      normalizeSearchValue(v).includes(search),
    ),
  )
})

const selectedLearnerSummary = computed(
  () => dashboard.value?.learners.find((l) => l.id === selectedLearnerId.value) ?? null,
)

const visibleFormationCompetencies = computed(() =>
  filterCatalog(catalogSearch.value, filters.value.juicio),
)

// Filtered list of learner competencies with search and status filter
const allFilteredLearnerCompetencies = computed(() => {
  if (!learnerDetail.value) return []
  const query = normalizeSearchValue(catalogSearch.value)
  const judgement = filters.value.juicio.toLowerCase()

  return learnerDetail.value.competencies
    .map((comp) => {
      const compMatch =
        !query ||
        normalizeSearchValue(comp.name).includes(query) ||
        normalizeSearchValue(comp.code).includes(query) ||
        (comp.codigo_juicio && normalizeSearchValue(comp.codigo_juicio).includes(query)) ||
        (comp.codigo_proyecto && normalizeSearchValue(comp.codigo_proyecto).includes(query))

      const filteredResults = comp.results.filter((r) => {
        const resultMatch =
          !query ||
          compMatch ||
          normalizeSearchValue(r.code).includes(query) ||
          (r.codigo_juicio && normalizeSearchValue(r.codigo_juicio).includes(query)) ||
          (r.codigo_proyecto && normalizeSearchValue(r.codigo_proyecto).includes(query)) ||
          normalizeSearchValue(r.detail).includes(query) ||
          normalizeSearchValue(r.funcionario).includes(query)

        const judgementMatch = !judgement || r.judgement.toLowerCase() === judgement
        return resultMatch && judgementMatch
      })

      if (!compMatch && !filteredResults.length) return null
      if (compMatch && !filteredResults.length && judgement) return null

      return {
        ...comp,
        results: filteredResults,
      }
    })
    .filter((comp): comp is NonNullable<typeof comp> => {
      if (!comp) return false
      if (competencyStatusFilter.value === 'pending') {
        return comp.approvedResults < comp.totalResults
      }
      if (competencyStatusFilter.value === 'completed') {
        return comp.approvedResults === comp.totalResults && comp.totalResults > 0
      }
      return true
    })
})

// Paginated Competencies for current page
const paginatedLearnerCompetencies = computed(() => {
  if (itemsPerPage.value === 0) return allFilteredLearnerCompetencies.value
  const start = (currentPage.value - 1) * itemsPerPage.value
  return allFilteredLearnerCompetencies.value.slice(start, start + itemsPerPage.value)
})

const totalPages = computed(() => {
  if (itemsPerPage.value === 0 || !allFilteredLearnerCompetencies.value.length) return 1
  return Math.ceil(allFilteredLearnerCompetencies.value.length / itemsPerPage.value)
})

function expandAllCompetencies() {
  allFilteredLearnerCompetencies.value.forEach((comp) => {
    if (!expandedCompetencies.value.includes(comp.code)) {
      expandedCompetencies.value.push(comp.code)
    }
  })
}

function collapseAllCompetencies() {
  expandedCompetencies.value = []
}

function selectLearner(id: number | null) {
  selectedLearnerId.value = id
  academicStore.setLearner(id)
  currentPage.value = 1
  if (id) {
    void loadLearnerDetail(id)
  } else {
    learnerDetail.value = null
  }
}

function openResultModal(competency: FormationCatalogCompetency, result: FormationCatalogResult) {
  selectedModalResult.value = {
    competencyCode: competency.code,
    competencyName: competency.name,
    ficha: competency.ficha,
    result,
  }
}

function resetAllFilters() {
  filters.value = { estado: '', ficha: '', juicio: '' }
  selectedLearnerId.value = null
  fichaLearnerSearch.value = ''
  catalogSearch.value = ''
  competencyStatusFilter.value = 'all'
  currentPage.value = 1
  academicStore.resetFilters()
  void refreshData()
}

async function refreshData() {
  await Promise.all([
    loadDashboard({ ficha: filters.value.ficha, estado: filters.value.estado }),
    loadFormationCatalog({ ficha: filters.value.ficha, estado: filters.value.estado }),
  ])
  if (selectedLearnerId.value) {
    await loadLearnerDetail(selectedLearnerId.value)
  }
}

function judgementBadgeClass(judgement: string) {
  const norm = judgement.toLowerCase()
  if (norm === 'aprobado') return 'bg-emerald-50 text-emerald-800 border border-emerald-200'
  if (norm === 'por evaluar') return 'bg-amber-50 text-amber-800 border border-amber-200'
  return 'bg-rose-50 text-rose-800 border border-rose-200'
}

watch(
  () => ({ ...filters.value }),
  () => {
    academicStore.setFilters(filters.value)
    void refreshData()
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
  () => academicStore.selectedLearnerId,
  (newId) => {
    if (newId !== selectedLearnerId.value) {
      selectedLearnerId.value = newId
      currentPage.value = 1
      if (newId) {
        void loadLearnerDetail(newId)
      } else {
        learnerDetail.value = null
      }
    }
  },
)

watch(
  () => academicStore.lastRefreshTimestamp,
  () => {
    void refreshData()
  },
)

onMounted(() => {
  if (academicStore.selectedFicha) {
    filters.value.ficha = academicStore.selectedFicha
  }
  void refreshData()
})
</script>

<template>
  <div class="grid gap-6">
    <!-- Header Section -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
      <div>
        <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
          <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
          Seguimiento Curricular
        </span>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {{ selectedLearnerSummary ? selectedLearnerSummary.fullName : 'Expediente y Catálogo de Juicios' }}
        </h1>
        <p v-if="selectedLearnerSummary" class="text-xs text-slate-500 mt-0.5">
          {{ selectedLearnerSummary.documentType }} {{ selectedLearnerSummary.document }} · Ficha {{ selectedLearnerSummary.ficha }} · {{ selectedLearnerSummary.program }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="selectedLearnerSummary"
          class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          type="button"
          @click="selectLearner(null)"
        >
          ← Ver Catálogo General
        </button>
        <button
          class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          type="button"
          @click="resetAllFilters"
        >
          Limpiar Filtros
        </button>
      </div>
    </div>

    <!-- Master-Detail Split Grid -->
    <div class="grid w-full gap-6 lg:grid-cols-[300px_1fr] items-start">
      <!-- Master Panel (Left): Sticky Learners Selector List -->
      <div class="lg:sticky lg:top-20 flex flex-col max-h-[calc(100vh-6.5rem)] space-y-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2">
          <span class="text-xs font-bold text-slate-900">Población Estudiantil</span>
          <span class="text-[0.65rem] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {{ fichaLearners.length }} Aprendices
          </span>
        </div>

        <!-- Quick Search -->
        <div class="relative">
          <input
            v-model="fichaLearnerSearch"
            type="text"
            placeholder="Buscar por nombre o doc..."
            class="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-3 pr-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white"
          />
        </div>

        <!-- Juicio Filter -->
        <div class="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 text-[0.65rem] font-semibold text-center">
          <button
            class="rounded py-1 transition"
            :class="!filters.juicio ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'"
            type="button"
            @click="filters.juicio = ''"
          >
            Todos
          </button>
          <button
            class="rounded py-1 transition"
            :class="filters.juicio === 'aprobado' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'"
            type="button"
            @click="filters.juicio = 'aprobado'"
          >
            Aprobados
          </button>
          <button
            class="rounded py-1 transition"
            :class="filters.juicio === 'por evaluar' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'"
            type="button"
            @click="filters.juicio = 'por evaluar'"
          >
            Pendientes
          </button>
        </div>

        <!-- Learners List Container with Independent Internal Scroll -->
        <div class="flex-1 space-y-1.5 overflow-y-auto pr-1">
          <button
            v-for="l in fichaLearners"
            :key="l.id"
            class="flex w-full flex-col rounded-lg p-2.5 text-left text-xs transition"
            :class="
              selectedLearnerId === l.id
                ? 'bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 font-bold'
                : 'hover:bg-slate-50/80 text-slate-700 border border-transparent'
            "
            type="button"
            @click="selectLearner(l.id)"
          >
            <div class="flex items-center justify-between w-full">
              <span class="truncate font-semibold">{{ l.fullName }}</span>
              <span class="text-[0.65rem] font-bold text-slate-400 shrink-0 ml-2">{{ l.ficha }}</span>
            </div>
            <div class="mt-1 flex items-center justify-between text-[0.65rem] text-slate-500">
              <span>{{ l.document }}</span>
              <span class="font-medium text-emerald-700">{{ prettyState(l.state) }}</span>
            </div>
          </button>

          <div v-if="!fichaLearners.length" class="p-4 text-center text-xs text-slate-400">
            No se encontraron aprendices con el filtro actual.
          </div>
        </div>
      </div>

      <!-- Detail Panel (Right): Content Area -->
      <div class="space-y-4">
        <!-- Search within outcomes/catalog -->
        <div class="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <input
            v-model="catalogSearch"
            type="text"
            placeholder="Filtrar competencias por nombre, norma, funcionario o descripción de RAP..."
            class="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white"
          />
        </div>

        <!-- Loading / Errors -->
        <p v-if="trackingError || learnerError" class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          {{ trackingError || learnerError }}
        </p>

        <div v-if="isCatalogLoading || isLearnerLoading" class="flex min-h-[30vh] items-center justify-center">
          <div class="flex flex-col items-center gap-2 text-slate-400">
            <svg class="h-6 w-6 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-xs font-medium">Cargando expediente formativo...</p>
          </div>
        </div>

        <!-- MODE A: Individual Learner Details View -->
        <div v-else-if="selectedLearnerSummary && learnerDetail" class="space-y-4 animate-in fade-in duration-150">
          <!-- Learner Metrics Strip -->
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div class="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-xs">
              <span class="text-[0.65rem] text-slate-400 font-bold uppercase">Total Resultados</span>
              <p class="text-xl font-black text-slate-900">{{ learnerDetail.learner.totalResults }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-xs">
              <span class="text-[0.65rem] text-emerald-700 font-bold uppercase">Aprobados</span>
              <p class="text-xl font-black text-emerald-600">{{ learnerDetail.learner.approvedResults }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-xs">
              <span class="text-[0.65rem] text-amber-700 font-bold uppercase">Pendientes</span>
              <p class="text-xl font-black text-amber-600">{{ learnerDetail.learner.pendingResults }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-xs">
              <span class="text-[0.65rem] text-slate-500 font-bold uppercase">Avance General</span>
              <p class="text-xl font-black text-slate-900">{{ formatPercent(learnerDetail.learner.progress) }}</p>
            </div>
          </div>

          <!-- Controls Bar: Status Filter + Expand/Collapse All + Page Indexing -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <!-- Filter by Status -->
            <div class="flex items-center gap-1.5">
              <span class="text-[0.65rem] font-bold uppercase text-slate-400 mr-1">Filtrar:</span>
              <button
                class="rounded-lg px-2.5 py-1 text-xs font-semibold transition"
                :class="competencyStatusFilter === 'all' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                type="button"
                @click="competencyStatusFilter = 'all'; currentPage = 1"
              >
                Todas ({{ learnerDetail.competencies.length }})
              </button>
              <button
                class="rounded-lg px-2.5 py-1 text-xs font-semibold transition"
                :class="competencyStatusFilter === 'pending' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'"
                type="button"
                @click="competencyStatusFilter = 'pending'; currentPage = 1"
              >
                Con Pendientes
              </button>
              <button
                class="rounded-lg px-2.5 py-1 text-xs font-semibold transition"
                :class="competencyStatusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'"
                type="button"
                @click="competencyStatusFilter = 'completed'; currentPage = 1"
              >
                100% Completas
              </button>
            </div>

            <!-- Quick Expand/Collapse and Items per page -->
            <div class="flex items-center gap-2 self-end sm:self-auto">
              <button
                class="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[0.7rem] font-semibold text-slate-600 hover:bg-white"
                type="button"
                @click="expandAllCompetencies"
              >
                Expandir Todas
              </button>
              <button
                class="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[0.7rem] font-semibold text-slate-600 hover:bg-white"
                type="button"
                @click="collapseAllCompetencies"
              >
                Colapsar Todas
              </button>
            </div>
          </div>

          <!-- Paginated Competencies List with Outcomes -->
          <div class="space-y-3">
            <div
              v-for="comp in paginatedLearnerCompetencies"
              :key="comp.code"
              class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
            >
              <button
                class="flex w-full items-center justify-between p-3.5 text-left transition hover:bg-slate-50/60"
                type="button"
                @click="toggleCompetencyAccordion(comp.code)"
              >
                <div class="pr-2">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="rounded bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold text-slate-700">Cód: {{ comp.codigo_juicio || comp.code }}</span>
                    <span v-if="comp.codigo_proyecto" class="rounded bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700 border border-emerald-200/60">
                      Proyecto: {{ comp.codigo_proyecto }}
                    </span>
                    <span
                      v-if="comp.approvedResults === comp.totalResults && comp.totalResults > 0"
                      class="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700 border border-emerald-200"
                    >
                      Aprobada
                    </span>
                  </div>
                  <h4 class="mt-1 text-xs font-bold text-slate-900 leading-snug">{{ comp.name }}</h4>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span class="text-xs text-slate-500 font-medium">{{ comp.approvedResults }}/{{ comp.totalResults }} RAPs</span>
                  <span class="text-xs font-bold text-emerald-600">{{ formatPercent(comp.progress) }}</span>
                  <svg
                    class="h-4 w-4 text-slate-400 transition-transform"
                    :class="expandedCompetencies.includes(comp.code) ? 'rotate-180' : ''"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              <!-- Outcomes Table inside Accordion -->
              <div v-if="expandedCompetencies.includes(comp.code)" class="border-t border-slate-100 p-3 bg-slate-50/40">
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="text-slate-500 border-b border-slate-200/80 text-[0.65rem]">
                        <th class="pb-2 font-bold uppercase">Resultado</th>
                        <th class="pb-2 font-bold uppercase">Detalle del RAP</th>
                        <th class="pb-2 font-bold uppercase">Instructor</th>
                        <th class="pb-2 font-bold uppercase">Fecha</th>
                        <th class="pb-2 font-bold uppercase text-right">Juicio</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-slate-700">
                      <tr v-for="res in comp.results" :key="res.code" class="hover:bg-white/80 transition">
                        <td class="py-2.5 font-bold text-slate-900">{{ res.codigo_juicio || res.code }}</td>
                        <td class="py-2.5 max-w-xs truncate text-slate-600">{{ res.detail }}</td>
                        <td class="py-2.5 text-slate-500">{{ res.funcionario || '-' }}</td>
                        <td class="py-2.5 text-slate-400">{{ formatDate(res.registeredAt) }}</td>
                        <td class="py-2.5 text-right">
                          <span class="inline-block rounded px-2 py-0.5 text-[0.65rem] font-bold" :class="judgementBadgeClass(res.judgement)">
                            {{ prettyState(res.judgement) }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div v-if="!allFilteredLearnerCompetencies.length" class="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
              No se encontraron competencias con el filtro seleccionado.
            </div>
          </div>

          <!-- Pagination Bar -->
          <div v-if="totalPages > 1" class="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
            <span class="text-xs text-slate-500 font-medium">
              Mostrando página <b class="text-slate-900">{{ currentPage }}</b> de <b class="text-slate-900">{{ totalPages }}</b> ({{ allFilteredLearnerCompetencies.length }} competencias)
            </span>

            <div class="flex items-center gap-1.5">
              <button
                :disabled="currentPage <= 1"
                class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                type="button"
                @click="currentPage--"
              >
                ← Anterior
              </button>

              <button
                v-for="page in totalPages"
                :key="page"
                class="hidden sm:inline-block rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                :class="currentPage === page ? 'bg-emerald-600 text-white shadow-2xs' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'"
                type="button"
                @click="currentPage = page"
              >
                {{ page }}
              </button>

              <button
                :disabled="currentPage >= totalPages"
                class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                type="button"
                @click="currentPage++"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>

        <!-- MODE B: General Formation Catalog View -->
        <div v-else class="space-y-3 animate-in fade-in duration-150">
          <div
            v-for="comp in visibleFormationCompetencies"
            :key="comp.code"
            class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
          >
            <button
              class="flex w-full items-center justify-between p-3.5 text-left transition hover:bg-slate-50/60"
              type="button"
              @click="toggleCompetencyAccordion(comp.code)"
            >
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="rounded bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold text-slate-700">Cód: {{ comp.codigo_juicio || comp.code }}</span>
                  <span v-if="comp.codigo_proyecto" class="rounded bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700 border border-emerald-200/60">
                    Proyecto: {{ comp.codigo_proyecto }}
                  </span>
                </div>
                <h4 class="mt-1 text-xs font-bold text-slate-900">{{ comp.name }}</h4>
                <p class="text-[0.7rem] text-slate-400 mt-0.5">Ficha {{ comp.ficha }} · {{ comp.program }}</p>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <span class="text-xs text-slate-500">{{ comp.results.length }} RAPs</span>
                <span class="text-xs font-bold text-emerald-600">{{ formatPercent(comp.progress) }}</span>
              </div>
            </button>

            <!-- Results Grid inside Accordion -->
            <div v-if="expandedCompetencies.includes(comp.code)" class="border-t border-slate-100 p-3 bg-slate-50/40">
              <div class="grid gap-2.5 sm:grid-cols-2">
                <div
                  v-for="res in comp.results"
                  :key="res.code"
                  class="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-2xs"
                >
                  <div>
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-slate-800">{{ res.codigo_juicio || res.code }}</span>
                      <span class="text-xs font-bold text-emerald-600">{{ formatPercent(res.progress) }}</span>
                    </div>
                    <p class="mt-1 text-xs text-slate-600 line-clamp-2">{{ res.detail }}</p>
                  </div>
                  <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[0.7rem] text-slate-500">
                    <span>{{ res.approvedLearners }}/{{ res.totalLearners }} aprobados</span>
                    <button
                      class="font-semibold text-emerald-700 hover:underline"
                      type="button"
                      @click="openResultModal(comp, res)"
                    >
                      Ver aprendices →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Result Detail Modal -->
    <ResultDetailModal
      :open="selectedModalResult !== null"
      :ficha="selectedModalResult?.ficha || ''"
      :competency-code="selectedModalResult?.competencyCode || ''"
      :competency-name="selectedModalResult?.competencyName || ''"
      :result="selectedModalResult?.result || null"
      :judgement-filter="filters.juicio"
      @close="selectedModalResult = null"
    />
  </div>
</template>
