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
  if (norm === 'aprobado') return 'bg-emerald-100 text-emerald-800'
  if (norm === 'por evaluar') return 'bg-amber-100 text-amber-800'
  return 'bg-rose-100 text-rose-800'
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
      void loadLearnerDetail(newId)
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
  <div class="grid w-full gap-6 xl:grid-cols-[1fr_300px] items-start">
    <!-- Main Content (Col 1) -->
    <div class="space-y-6">
      <!-- Top Title & Search -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span class="inline-flex w-fit rounded-full border border-emerald-700/15 bg-emerald-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-emerald-700">
            Seguimiento Curricular
          </span>
          <h2 class="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            {{ selectedLearnerSummary ? selectedLearnerSummary.fullName : 'Catálogo de Competencias y Resultados' }}
          </h2>
          <p v-if="selectedLearnerSummary" class="text-xs text-slate-500 mt-1">
            {{ selectedLearnerSummary.documentType }} {{ selectedLearnerSummary.document }} · Ficha {{ selectedLearnerSummary.ficha }} · {{ selectedLearnerSummary.program }}
          </p>
        </div>

        <div v-if="selectedLearnerSummary">
          <button
            class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            type="button"
            @click="selectLearner(null)"
          >
            ← Volver al Catálogo General
          </button>
        </div>
      </div>

      <!-- Quick Search in Catalog -->
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="relative">
          <input
            v-model="catalogSearch"
            type="text"
            placeholder="Buscar por código de competencia, nombre, resultado o funcionario..."
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      <!-- Loading / Errors -->
      <p v-if="trackingError || learnerError" class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {{ trackingError || learnerError }}
      </p>

      <div v-if="isCatalogLoading || isLearnerLoading" class="flex items-center justify-center p-12">
        <svg class="h-8 w-8 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- MODE A: Individual Learner Details View -->
      <div v-else-if="selectedLearnerSummary && learnerDetail" class="space-y-4">
        <!-- Learner Stats Overview -->
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <span class="text-xs text-slate-400 font-bold uppercase">Total Resultados</span>
            <p class="text-2xl font-black text-slate-900">{{ learnerDetail.learner.totalResults }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <span class="text-xs text-emerald-600 font-bold uppercase">Aprobados</span>
            <p class="text-2xl font-black text-emerald-600">{{ learnerDetail.learner.approvedResults }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <span class="text-xs text-amber-600 font-bold uppercase">Pendientes</span>
            <p class="text-2xl font-black text-amber-500">{{ learnerDetail.learner.pendingResults }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <span class="text-xs text-slate-600 font-bold uppercase">Avance</span>
            <p class="text-2xl font-black text-slate-900">{{ formatPercent(learnerDetail.learner.progress) }}</p>
          </div>
        </div>

        <!-- Competency Accordions for Learner -->
        <div class="space-y-3">
          <div
            v-for="comp in visibleLearnerCompetencies"
            :key="comp.code"
            class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <button
              class="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50/50"
              type="button"
              @click="toggleCompetencyAccordion(comp.code)"
            >
              <div>
                <div class="flex items-center gap-2">
                  <span class="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{{ comp.code }}</span>
                  <span v-if="comp.codigo_juicio" class="rounded-md bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700">J: {{ comp.codigo_juicio }}</span>
                  <span v-if="comp.codigo_proyecto" class="rounded-md bg-blue-50 px-2 py-0.5 text-[0.65rem] font-bold text-blue-700">P: {{ comp.codigo_proyecto }}</span>
                </div>
                <h4 class="mt-1 text-sm font-bold text-slate-900">{{ comp.name }}</h4>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-xs text-slate-500">{{ comp.approvedResults }}/{{ comp.totalResults }} aprobados</span>
                <span class="text-sm font-bold text-slate-700">{{ formatPercent(comp.progress) }}</span>
              </div>
            </button>

            <!-- Results Table inside Accordion -->
            <div v-if="expandedCompetencies.includes(comp.code)" class="border-t border-slate-100 p-4">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="text-slate-500 border-b border-slate-100">
                    <th class="pb-2 font-bold uppercase">Resultado</th>
                    <th class="pb-2 font-bold uppercase">Detalle</th>
                    <th class="pb-2 font-bold uppercase">Funcionario</th>
                    <th class="pb-2 font-bold uppercase">Fecha</th>
                    <th class="pb-2 font-bold uppercase text-right">Juicio</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50 text-slate-700">
                  <tr v-for="res in comp.results" :key="res.code" class="hover:bg-slate-50/40">
                    <td class="py-2.5 font-bold">{{ res.code }}</td>
                    <td class="py-2.5 max-w-xs truncate">{{ res.detail }}</td>
                    <td class="py-2.5 text-slate-500">{{ res.funcionario || '-' }}</td>
                    <td class="py-2.5 text-slate-400">{{ formatDate(res.registeredAt) }}</td>
                    <td class="py-2.5 text-right">
                      <span class="rounded-full px-2 py-0.5 text-[0.65rem] font-bold" :class="judgementBadgeClass(res.judgement)">
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
      <div v-else class="space-y-3">
        <div
          v-for="comp in visibleFormationCompetencies"
          :key="comp.code"
          class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <button
            class="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50/50"
            type="button"
            @click="toggleCompetencyAccordion(comp.code)"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{{ comp.code }}</span>
                <span v-if="comp.codigo_juicio" class="rounded-md bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700">J: {{ comp.codigo_juicio }}</span>
                <span v-if="comp.codigo_proyecto" class="rounded-md bg-blue-50 px-2 py-0.5 text-[0.65rem] font-bold text-blue-700">P: {{ comp.codigo_proyecto }}</span>
              </div>
              <h4 class="mt-1 text-sm font-bold text-slate-900">{{ comp.name }}</h4>
              <p class="text-xs text-slate-400">Ficha {{ comp.ficha }} · {{ comp.program }}</p>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-xs text-slate-500">{{ comp.results.length }} resultados</span>
              <span class="text-sm font-bold text-emerald-600">{{ formatPercent(comp.progress) }}</span>
            </div>
          </button>

          <!-- Results List inside Accordion -->
          <div v-if="expandedCompetencies.includes(comp.code)" class="border-t border-slate-100 p-4">
            <div class="grid gap-3 sm:grid-cols-2">
              <div
                v-for="res in comp.results"
                :key="res.code"
                class="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:border-slate-300 hover:bg-white"
              >
                <div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-800">{{ res.code }}</span>
                    <span class="text-xs font-bold text-emerald-600">{{ formatPercent(res.progress) }}</span>
                  </div>
                  <p class="mt-1 text-xs text-slate-600 line-clamp-2">{{ res.detail }}</p>
                </div>
                <div class="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[0.7rem] text-slate-500">
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

    <!-- Sidebar Filters & Learners Navigation (Col 2) -->
    <aside class="sticky top-[5rem] space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <span class="text-xs font-bold uppercase tracking-wider text-emerald-700">Filtros Académicos</span>
        <button class="text-xs font-semibold text-slate-500 hover:text-slate-800" type="button" @click="resetAllFilters">
          Limpiar
        </button>
      </div>

      <div class="space-y-3">
        <label class="grid gap-1">
          <span class="text-xs font-semibold text-slate-600">Ficha</span>
          <select
            v-model="filters.ficha"
            class="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
          >
            <option value="">Todas las fichas</option>
            <option v-for="f in dashboard?.options.fichas ?? []" :key="f" :value="f">Ficha {{ f }}</option>
          </select>
        </label>

        <label class="grid gap-1">
          <span class="text-xs font-semibold text-slate-600">Estado de Formación</span>
          <select
            v-model="filters.estado"
            class="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
          >
            <option value="">Todos los estados</option>
            <option v-for="e in dashboard?.options.estados ?? []" :key="e" :value="e">{{ prettyState(e) }}</option>
          </select>
        </label>

        <label class="grid gap-1">
          <span class="text-xs font-semibold text-slate-600">Filtro de Juicio</span>
          <select
            v-model="filters.juicio"
            class="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
          >
            <option value="">Todos los juicios</option>
            <option value="aprobado">Aprobados</option>
            <option value="por evaluar">Por evaluar</option>
            <option value="no aprobado">No aprobados</option>
          </select>
        </label>
      </div>

      <!-- Quick Learner Search List in Sidebar -->
      <div class="border-t border-slate-100 pt-3">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Buscar Aprendiz</span>
        <input
          v-model="fichaLearnerSearch"
          type="text"
          placeholder="Nombre o documento..."
          class="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
        />

        <div class="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1">
          <button
            v-for="l in fichaLearners.slice(0, 20)"
            :key="l.id"
            class="flex w-full flex-col rounded-lg p-2 text-left text-xs transition"
            :class="selectedLearnerId === l.id ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-700'"
            type="button"
            @click="selectLearner(l.id)"
          >
            <span class="truncate">{{ l.fullName }}</span>
            <span class="text-[0.65rem] text-slate-400">{{ l.document }} · {{ l.ficha }}</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Modal de Resultado -->
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
