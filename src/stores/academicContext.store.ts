import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAcademicContextStore = defineStore('academicContext', () => {
  const selectedFicha = ref<string>('')
  const selectedLearnerId = ref<number | null>(null)
  const lastRefreshTimestamp = ref<number>(Date.now())

  const filters = ref({
    estado: '',
    ficha: '',
    competencia: '',
    resultado: '',
    aprendiz: '',
    juicio: '',
  })

  function setFicha(ficha: string) {
    selectedFicha.value = ficha
    filters.value.ficha = ficha
  }

  function setLearner(learnerId: number | null, ficha?: string) {
    selectedLearnerId.value = learnerId
    filters.value.aprendiz = learnerId ? String(learnerId) : ''
    if (ficha) {
      setFicha(ficha)
    }
  }

  function setFilters(newFilters: Partial<typeof filters.value>) {
    filters.value = {
      ...filters.value,
      ...newFilters,
    }
    if (newFilters.ficha !== undefined) {
      selectedFicha.value = newFilters.ficha
    }
    if (newFilters.aprendiz !== undefined) {
      selectedLearnerId.value = newFilters.aprendiz ? Number(newFilters.aprendiz) : null
    }
  }

  function resetFilters() {
    filters.value = {
      estado: '',
      ficha: '',
      competencia: '',
      resultado: '',
      aprendiz: '',
      juicio: '',
    }
    selectedFicha.value = ''
    selectedLearnerId.value = null
  }

  function notifyRefresh() {
    lastRefreshTimestamp.value = Date.now()
  }

  return {
    selectedFicha,
    selectedLearnerId,
    lastRefreshTimestamp,
    filters,
    setFicha,
    setLearner,
    setFilters,
    resetFilters,
    notifyRefresh,
  }
})
