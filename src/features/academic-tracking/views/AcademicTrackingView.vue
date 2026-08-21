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

const visibleLearnerCompetencies = computed(() => {
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
    .filter((comp): comp is NonNullable<typeof comp> => comp !== null)
})

function selectLearner(id: number | null) {
  selectedLearnerId.value = id
  academicStore.setLearner(id)
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
  () => academicStore.selectedLearnerId,
  (newId) => {
    if (newId !== selectedLearnerId.value) {
      selectedLearnerId.value = newId
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
      <!-- Master Panel (Left): Learners Selector List -->
      <div class="space-y-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
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

        <!-- Learners List Container -->
        <div class="max-h-[65vh] space-y-1.5 overflow-y-auto pr-1">
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

          <!-- Competencies List with Outcomes -->
          <div class="space-y-3">
            <div
              v-for="comp in visibleLearnerCompetencies"
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
                    <span class="rounded bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold text-slate-700">Norma: {{ comp.code }}</span>
                    <span v-if="comp.codigo_proyecto" class="rounded bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700 border border-emerald-200/60">
                      Proyecto: {{ comp.codigo_proyecto }}
                    </span>
                  </div>
                  <h4 class="mt-1 text-xs font-bold text-slate-900">{{ comp.name }}</h4>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span class="text-xs text-slate-500 font-medium">{{ comp.approvedResults }}/{{ comp.totalResults }}</span>
                  <span class="text-xs font-bold text-emerald-600">{{ formatPercent(comp.progress) }}</span>
                </div>
              </button>

              <!-- Outcomes Table inside Accordion -->
              <div v-if="expandedCompetencies.includes(comp.code)" class="border-t border-slate-100 p-3 bg-slate-50/40">
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
                    <tr v-for="res in comp.results" :key="res.code" class="hover:bg-white/80">
                      <td class="py-2.5 font-bold text-slate-900">{{ res.code }}</td>
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
                  <span class="rounded bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold text-slate-700">Norma: {{ comp.code }}</span>
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
                      <span class="text-xs font-bold text-slate-800">{{ res.code }}</span>
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
