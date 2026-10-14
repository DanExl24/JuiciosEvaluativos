import { apiClient } from '../../../services/api/client'
import type { DashboardPayload } from '../../dashboard/types/dashboard.types'
import type { FormationCatalogCompetency, LearnerDetail, LearnerByDocumentResponse } from '../types/tracking.types'

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

  async getLearnerByDocument(documento: string, ficha?: string): Promise<LearnerByDocumentResponse> {
    const params = ficha ? { ficha } : undefined
    return apiClient.get<LearnerByDocumentResponse>(`/api/learners/by-document/${encodeURIComponent(documento)}`, params)
  },
}

