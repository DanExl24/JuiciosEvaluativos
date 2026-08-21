import { apiClient } from '../../../services/api/client'
import type { CurricularPhase, CurricularCompetency } from '../../../types/curriculum'

export interface ProjectData {
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

export interface DesertedLearner {
  nombre: string
  documento: string
  estado: string
  ultima_fecha: string | null
  juicio_estado: string
  competencia_codigo: string
  competencia_nombre: string
  resultado_codigo: string
  resultado_detalle: string
}

export interface PhaseLearnerStat {
  id_fase: number
  nombre: string
  approvedResults: number
  pendingResults: number
  expectedResults: number
  desertedCount: number
  trasladoCount: number
  voluntarioCount: number
  desertedLearners: DesertedLearner[]
  progressPercentage: number
}

export interface ProjectFicha {
  id_formacion: number
  ficha_caracterizacion: string
}

export const projectPhasesService = {
  async getProjects(): Promise<ProjectData[]> {
    return apiClient.get<ProjectData[]>('/api/projects')
  },

  async extractPdf(file: File): Promise<unknown> {
    const formData = new FormData()
    formData.append('pdf', file)
    return apiClient.post('/api/extract/project', formData)
  },

  async importProject(payload: unknown): Promise<{ phasesInserted: number; competenciesUpdated: number }> {
    return apiClient.post('/api/import/project', payload)
  },

  async getProjectPhases(projectId: number, fichaId?: number | null): Promise<CurricularPhase[]> {
    return apiClient.get<CurricularPhase[]>(`/api/projects/${projectId}/phases`, { fichaId })
  },

  async getUnassignedCompetencies(projectId: number): Promise<CurricularCompetency[]> {
    return apiClient.get<CurricularCompetency[]>(`/api/projects/${projectId}/unassigned`)
  },

  async getPhaseLearnerStats(projectId: number, fichaId?: number | null): Promise<PhaseLearnerStat[]> {
    return apiClient.get<PhaseLearnerStat[]>(`/api/projects/${projectId}/phase-learner-stats`, { fichaId })
  },

  async getProjectFichas(projectId: number): Promise<ProjectFicha[]> {
    return apiClient.get<ProjectFicha[]>(`/api/projects/${projectId}/fichas`)
  },

  async assignCompetency(competencyId: number, phaseId: number): Promise<void> {
    await apiClient.post(`/api/competencies/${competencyId}/assign`, { phaseId })
  },

  async unassignCompetency(competencyId: number, phaseId: number): Promise<void> {
    await apiClient.post(`/api/competencies/${competencyId}/unassign`, { phaseId })
  },

  async deleteProject(projectId: number): Promise<void> {
    await apiClient.delete(`/api/projects/${projectId}`)
  },
}
