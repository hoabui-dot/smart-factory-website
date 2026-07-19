type SuccessEnvelope<T> = {
  success: true
  data: T
  request_id?: string
}

export function unwrapSuccessData<T>(payload: T | SuccessEnvelope<T>): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    (payload as SuccessEnvelope<T>).success === true &&
    'data' in payload
  ) {
    return (payload as SuccessEnvelope<T>).data
  }
  return payload as T
}

export function isSystemAdminSession(session: { roles: string[] } | null | undefined): boolean {
  return Boolean(session?.roles?.includes('system_admin'))
}

export function newIdempotencyKey(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now()}-${rand}`
}
