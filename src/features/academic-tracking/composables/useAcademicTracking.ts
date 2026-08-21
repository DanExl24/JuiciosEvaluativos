import { ref } from 'vue'
import { trackingService, type TrackingFilterParams } from '../services/tracking.service'
import type { DashboardPayload, FormationCatalogCompetency, LearnerDetail } from '../../../types/dashboard'
import { normalizeSearchValue } from '../../../utils/search/textNormalizer'

export function useAcademicTracking() {
  const dashboard = ref<DashboardPayload | null>(null)
  const formationCatalog = ref<FormationCatalogCompetency[]>([])
  const learnerDetail = ref<LearnerDetail | null>(null)
  const isDashboardLoading = ref(false)
  const isCatalogLoading = ref(false)
  const isLearnerLoading = ref(false)
  const trackingError = ref('')
  const learnerError = ref('')

  const expandedCompetencies = ref<string[]>([])

  async function loadDashboard(params?: TrackingFilterParams) {
    isDashboardLoading.value = true
    trackingError.value = ''
    try {
      dashboard.value = await trackingService.getDashboard(params)
    } catch (err) {
      trackingError.value = err instanceof Error ? err.message : 'Error al cargar datos generales.'
    } finally {
      isDashboardLoading.value = false
    }
  }

  async function loadFormationCatalog(params?: TrackingFilterParams) {
    isCatalogLoading.value = true
    try {
      formationCatalog.value = await trackingService.getFormationCatalog(params)
    } catch (err) {
      formationCatalog.value = []
      trackingError.value = err instanceof Error ? err.message : 'Error al cargar catálogo de formación.'
    } finally {
      isCatalogLoading.value = false
    }
  }

  async function loadLearnerDetail(learnerId: number | null) {
    if (!learnerId) {
      learnerDetail.value = null
      learnerError.value = ''
      return
    }
    isLearnerLoading.value = true
    learnerError.value = ''
    try {
      learnerDetail.value = await trackingService.getLearnerDetail(learnerId)
      expandedCompetencies.value = learnerDetail.value.competencies.slice(0, 2).map((c) => c.code)
    } catch (err) {
      learnerDetail.value = null
      learnerError.value = err instanceof Error ? err.message : 'Error al consultar el detalle del aprendiz.'
    } finally {
      isLearnerLoading.value = false
    }
  }

  function toggleCompetencyAccordion(code: string) {
    if (expandedCompetencies.value.includes(code)) {
      expandedCompetencies.value = expandedCompetencies.value.filter((c) => c !== code)
    } else {
      expandedCompetencies.value = [...expandedCompetencies.value, code]
    }
  }

  function filterCatalog(query: string, judgement: string) {
    const q = normalizeSearchValue(query)
    return formationCatalog.value
      .map((competency) => {
        const competencyMatch =
          !q ||
          normalizeSearchValue(competency.name).includes(q) ||
          normalizeSearchValue(competency.code).includes(q) ||
          (competency.codigo_juicio && normalizeSearchValue(competency.codigo_juicio).includes(q)) ||
          (competency.codigo_proyecto && normalizeSearchValue(competency.codigo_proyecto).includes(q))

        const filteredResults = competency.results.filter((result) => {
          const judgementMatch =
            !judgement || result.learners.some((l) => l.judgement.toLowerCase() === judgement.toLowerCase())

          const resultMatch =
            !q ||
            competencyMatch ||
            normalizeSearchValue(result.code).includes(q) ||
            (result.codigo_juicio && normalizeSearchValue(result.codigo_juicio).includes(q)) ||
            (result.codigo_proyecto && normalizeSearchValue(result.codigo_proyecto).includes(q)) ||
            normalizeSearchValue(result.detail).includes(q)

          return judgementMatch && resultMatch
        })

        if (!competencyMatch && !filteredResults.length) return null
        if (judgement && !filteredResults.length) return null

        return {
          ...competency,
          totalResults: filteredResults.length || competency.totalResults,
          results: filteredResults,
        }
      })
      .filter((c): c is FormationCatalogCompetency => c !== null)
  }

  return {
    dashboard,
    formationCatalog,
    learnerDetail,
    isDashboardLoading,
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
  }
}
