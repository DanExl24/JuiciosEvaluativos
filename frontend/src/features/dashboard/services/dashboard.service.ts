import { apiClient } from '../../../services/api/client'
import type { DashboardPayload } from '../types/dashboard.types'

export interface DashboardFilterParams {
  estado?: string
  ficha?: string
  competencia?: string
  resultado?: string
  aprendiz?: string
}

export const dashboardService = {
  async getDashboard(params?: DashboardFilterParams): Promise<DashboardPayload> {
    return apiClient.get<DashboardPayload>('/api/dashboard', params)
  },
}
