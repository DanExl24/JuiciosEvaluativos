import { apiClient } from '../../../services/api/client'
import type { LogPayload } from '../types/import.types'

export interface CsvImportResult {
  ficha: string
  learners: number
  results: number
  judgements: number
  programa?: string
  competencies?: number
}

interface CsvImportBackendResponse {
  ok: boolean
  result?: CsvImportResult
  ficha?: string
  learners?: number
  results?: number
  judgements?: number
  programa?: string
  competencies?: number
  logFileName?: string
}

export const importService = {
  async importCsv(payload: LogPayload): Promise<CsvImportResult> {
    const data = await apiClient.post<CsvImportBackendResponse>('/api/import/csv', payload)
    if (data.result) {
      return data.result
    }
    return {
      ficha: data.ficha || '',
      learners: data.learners || 0,
      results: data.results || 0,
      judgements: data.judgements || 0,
      programa: data.programa,
      competencies: data.competencies,
    }
  },

  async deleteFicha(ficha: string): Promise<{ ok: boolean; message?: string }> {
    return apiClient.delete<{ ok: boolean; message?: string }>(`/api/formations/${ficha}`)
  },

  async getAvailableFichas(): Promise<string[]> {
    const data = await apiClient.get<{ options?: { fichas?: string[] } }>('/api/dashboard')
    return data.options?.fichas ?? []
  },
}
