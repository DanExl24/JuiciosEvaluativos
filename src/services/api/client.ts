import { config } from '../../app/config/env'
import { ApiError } from './errors'

interface RequestOptions extends RequestInit {
  params?: Record<string, unknown> | object
}

class HttpClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  private buildUrl(endpoint: string, params?: Record<string, unknown> | object): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`)

    if (params) {
      Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value))
        }
      })
    }

    return url.toString()
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...customConfig } = options
    const url = this.buildUrl(endpoint, params)

    const defaultHeaders: Record<string, string> = {
      Accept: 'application/json',
    }

    if (!(customConfig.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json'
    }

    try {
      const response = await fetch(url, {
        ...customConfig,
        headers: {
          ...defaultHeaders,
          ...headers,
        },
      })

      if (!response.ok) {
        let errorData: { error?: string; message?: string } | null = null
        try {
          errorData = await response.json()
        } catch {
          errorData = null
        }

        const errorMessage =
          errorData?.error || errorData?.message || `Error HTTP ${response.status}: ${response.statusText}`
        throw new ApiError(errorMessage, response.status, errorData)
      }

      if (response.status === 204) {
        return {} as T
      }

      return (await response.json()) as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Error inesperado de red',
        0,
        error,
      )
    }
  }

  get<T>(endpoint: string, params?: Record<string, unknown> | object, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET', params })
  }

  post<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  }

  put<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  }

  delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

export const apiClient = new HttpClient(config.apiUrl)
