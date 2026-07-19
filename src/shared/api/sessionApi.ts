import { httpClient } from './httpClient'
import type { AppSessionContext } from './types'

/**
 * GET /api/auth/session — accepts either bare DTO or success envelope.
 */
export async function fetchAppSession(): Promise<AppSessionContext> {
  const { data } = await httpClient.get<AppSessionContext | { success: true; data: AppSessionContext }>(
    '/api/auth/session',
  )
  if (data && typeof data === 'object' && 'success' in data && data.success === true) {
    return data.data
  }
  return data as AppSessionContext
}
