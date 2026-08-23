export interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiErrorResponse {
  ok?: boolean
  error: string
  details?: unknown
}
