import { apiClient } from '../../../services/api/client'
import type { DashboardPayload, FormationCatalogCompetency, LearnerDetail } from '../../../types/dashboard'

export interface TrackingFilterParams {
  ficha?: string
  estado?: string
}

export const trackingService = {
  async getDashboard(params?: TrackingFilterParams): Promise<DashboardPayload> {
    return apiClient.get<DashboardPayload>('/api/dashboard', params)
  },

  async getFormationCatalog(params?: TrackingFilterParams): Promise<FormationCatalogCompetency[]> {
    return apiClient.get<FormationCatalogCompetency[]>('/api/formations/competencies', params)
  },

  async getLearnerDetail(learnerId: number): Promise<LearnerDetail> {
    return apiClient.get<LearnerDetail>(`/api/learners/${learnerId}`)
  },
}
