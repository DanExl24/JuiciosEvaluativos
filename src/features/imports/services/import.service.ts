import { apiClient } from '../../../services/api/client'
import type { LogPayload } from '../types/import.types'

export interface CsvImportResult {
  ficha: string
  learners: number
  results: number
  judgements: number
}

export const importService = {
  async importCsv(payload: LogPayload): Promise<CsvImportResult> {
    return apiClient.post<CsvImportResult>('/api/import/csv', payload)
  },

  async deleteFicha(ficha: string): Promise<{ ok: boolean; message?: string }> {
    return apiClient.delete<{ ok: boolean; message?: string }>(`/api/formations/${ficha}`)
  },

  async getAvailableFichas(): Promise<string[]> {
    const data = await apiClient.get<{ options?: { fichas?: string[] } }>('/api/dashboard')
    return data.options?.fichas ?? []
  },
}
