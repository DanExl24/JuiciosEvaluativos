import { ref, computed } from 'vue'
import { dashboardService, type DashboardFilterParams } from '../services/dashboard.service'
import type { DashboardPayload } from '../types/dashboard.types'

export function useDashboard() {
  const dashboard = ref<DashboardPayload | null>(null)
  const dashboardError = ref('')
  const isLoading = ref(false)
  const learnerSearch = ref('')

  const allLearnerOptions = computed(() => dashboard.value?.options.aprendices ?? [])
  const fichaOptions = computed(() => dashboard.value?.options.fichasDetalle ?? [])

  function getFilteredCompetencies(selectedFicha: string) {
    const competencyOptions = dashboard.value?.options.competencias ?? []
    if (!selectedFicha) return competencyOptions
    return competencyOptions.filter((c) => c.ficha === selectedFicha)
  }

  function getFilteredLearners(selectedFicha: string) {
    const learnerOptions = allLearnerOptions.value
    if (!selectedFicha) return learnerOptions
    return learnerOptions.filter((l) => l.ficha === selectedFicha)
  }

  function getFilteredResults(selectedFicha: string, selectedCompetencia: string) {
    const resultOptions = dashboard.value?.options.resultados ?? []
    const fichaScoped = selectedFicha ? resultOptions.filter((r) => r.ficha === selectedFicha) : resultOptions
    if (!selectedCompetencia) return fichaScoped
    return fichaScoped.filter((r) => r.competencia_codigo === selectedCompetencia)
  }

  const visiblePendingLearners = computed(() => (dashboard.value?.pendingLearners ?? []).slice(0, 8))
  const visibleCompetenciesByApproval = computed(() => (dashboard.value?.competencies ?? []).slice(0, 8))
  const visibleCompetenciesByPending = computed(() =>
    [...(dashboard.value?.competencies ?? [])]
      .sort((a, b) => b.pending - a.pending || a.name.localeCompare(b.name, 'es'))
      .filter((c) => c.pending > 0)
      .slice(0, 8),
  )
  const visibleLearnersByProgress = computed(() =>
    [...(dashboard.value?.learners ?? [])]
      .sort((a, b) => b.progress - a.progress || a.fullName.localeCompare(b.fullName, 'es'))
      .slice(0, 8),
  )

  async function fetchDashboard(filters: DashboardFilterParams) {
    isLoading.value = true
    dashboardError.value = ''
    try {
      dashboard.value = await dashboardService.getDashboard(filters)
    } catch (err) {
      dashboardError.value = err instanceof Error ? err.message : 'Error al consultar el dashboard.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    dashboard,
    dashboardError,
    isLoading,
    learnerSearch,
    allLearnerOptions,
    fichaOptions,
    visiblePendingLearners,
    visibleCompetenciesByApproval,
    visibleCompetenciesByPending,
    visibleLearnersByProgress,
    getFilteredCompetencies,
    getFilteredLearners,
    getFilteredResults,
    fetchDashboard,
  }
}
