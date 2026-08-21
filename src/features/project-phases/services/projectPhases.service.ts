import { apiClient } from '../../../services/api/client'
import type { CurricularPhase, CurricularCompetency } from '../../../types/curriculum.types'
import type { ProjectData, PhaseLearnerStat, ProjectFicha } from '../types/projectPhases.types'

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
    await apiClient.post(`/api/projects/phases/${phaseId}/competencies/${competencyId}`)
  },

  async unassignCompetency(competencyId: number, phaseId: number): Promise<void> {
    await apiClient.delete(`/api/projects/phases/${phaseId}/competencies/${competencyId}`)
  },

  async deleteProject(projectId: number): Promise<void> {
    await apiClient.delete(`/api/projects/${projectId}`)
  },
}
