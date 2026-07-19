import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

import { authClient } from '@/shared/auth'

import { shouldAttemptTokenRefresh } from './tokenRefreshPolicy'
import { ApiError, type ApiErrorEnvelope } from './types'

const APP_TYPE = 'web'

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

function extractErrorCode(error: AxiosError): string {
  const data = error.response?.data as ApiErrorEnvelope | undefined
  if (data?.success === false && data.error?.code) {
    return data.error.code
  }
  if (error.response?.status === 401) {
    return 'AUTHENTICATION_REQUIRED'
  }
  return 'DEPENDENCY_UNAVAILABLE'
}

function toApiError(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0
  const data = error.response?.data as ApiErrorEnvelope | undefined
  if (data?.success === false && data.error?.code) {
    return new ApiError(
      data.error.code,
      data.error.message,
      status,
      data.error.context,
      data.request_id,
    )
  }
  return new ApiError(
    status === 401 ? 'AUTHENTICATION_REQUIRED' : 'DEPENDENCY_UNAVAILABLE',
    error.message,
    status || 503,
  )
}

let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessTokenOnce(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const session = await authClient.refreshSession()
      return session?.accessToken ?? null
    })().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

function createHttpClient(): AxiosInstance {
  const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
  const client = axios.create({
    baseURL,
    timeout: 30_000,
    headers: {
      'X-App-Type': APP_TYPE,
    },
  })

  client.interceptors.request.use(async (config) => {
    const token = await authClient.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.headers['X-App-Type'] = APP_TYPE
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error) || !error.config) {
        return Promise.reject(error)
      }

      const config = error.config as RetriableConfig
      const code = extractErrorCode(error)

      if (shouldAttemptTokenRefresh(code, Boolean(config._retry))) {
        config._retry = true
        try {
          const token = await refreshAccessTokenOnce()
          if (!token) {
            try {
              await authClient.signOut()
            } catch {
              /* ignore */
            }
            return Promise.reject(toApiError(error))
          }
          config.headers.Authorization = `Bearer ${token}`
          return client.request(config)
        } catch {
          try {
            await authClient.signOut()
          } catch {
            /* ignore */
          }
          return Promise.reject(
            new ApiError('ACCESS_TOKEN_EXPIRED', 'Phiên đăng nhập đã hết hạn.', 401),
          )
        }
      }

      if (code === 'INVALID_ACCESS_TOKEN' || code === 'AUTHENTICATION_REQUIRED') {
        try {
          await authClient.signOut()
        } catch {
          /* ignore */
        }
      }

      return Promise.reject(toApiError(error))
    },
  )

  return client
}

export const httpClient = createHttpClient()
