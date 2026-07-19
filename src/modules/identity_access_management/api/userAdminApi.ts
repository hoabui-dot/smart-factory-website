import { httpClient, newIdempotencyKey, unwrapSuccessData, ApiError } from '@/shared/api'

import type {
  AllowedAction,
  ResetPasswordResult,
  StationDevice,
  StationDeviceCreateRequest,
  StationDeviceListPage,
  StationDeviceListQuery,
  UserCreateRequest,
  UserDetail,
  UserListPage,
  UserListQuery,
  UserUpdateRequest,
} from '../types/userAdmin'

function normalizeListPage<T>(raw: unknown): { items: T[]; page: UserListPage['page'] } {
  const data = unwrapSuccessData<Record<string, unknown>>(raw as Record<string, unknown>)
  const items = Array.isArray(data.items) ? data.items : []
  const pageRaw = (data.page ?? {}) as Record<string, unknown>
  return {
    items: items as T[],
    page: {
      limit: typeof pageRaw.limit === 'number' ? pageRaw.limit : 50,
      next_cursor: typeof pageRaw.next_cursor === 'string' ? pageRaw.next_cursor : null,
      has_more: Boolean(pageRaw.has_more),
    },
  }
}

function assertActionHref(action: AllowedAction, kind: string): void {
  if (!action.href.startsWith('/api/')) {
    throw new ApiError('VALIDATION_ERROR', `${kind} href không hợp lệ.`, 400)
  }
}

/** NB01-006 */
export async function listUsers(query: UserListQuery = {}): Promise<UserListPage> {
  const { data } = await httpClient.get('/api/admin/users', {
    params: {
      limit: query.limit,
      cursor: query.cursor,
      sort: query.sort,
      q: query.q,
    },
  })
  return normalizeListPage<UserListPage['items'][number]>(data)
}

/** NB01-007 */
export async function getUser(userCode: string): Promise<UserDetail> {
  const { data } = await httpClient.get(`/api/admin/users/${encodeURIComponent(userCode)}`)
  return unwrapSuccessData<UserDetail>(data)
}

/** NB01-008 */
export async function createUser(body: UserCreateRequest): Promise<UserDetail> {
  const { data } = await httpClient.post('/api/admin/users', body, {
    headers: { 'Idempotency-Key': newIdempotencyKey('nb01-create-user') },
  })
  return unwrapSuccessData<UserDetail>(data)
}

/** NB01-009 */
export async function updateUser(userCode: string, body: UserUpdateRequest): Promise<UserDetail> {
  const { data } = await httpClient.patch(
    `/api/admin/users/${encodeURIComponent(userCode)}`,
    body,
  )
  return unwrapSuccessData<UserDetail>(data)
}

/** NB01-010 */
export async function disableUser(userCode: string, reason: string): Promise<UserDetail> {
  const { data } = await httpClient.post(
    `/api/admin/users/${encodeURIComponent(userCode)}/disable`,
    { reason },
    { headers: { 'Idempotency-Key': newIdempotencyKey('nb01-disable') } },
  )
  return unwrapSuccessData<UserDetail>(data)
}

/** NB01-011 — 200 PIN or 202 QUEUED */
export async function resetUserPassword(userCode: string): Promise<ResetPasswordResult> {
  const response = await httpClient.post(
    `/api/admin/users/${encodeURIComponent(userCode)}/reset-password`,
    {},
    {
      headers: { 'Idempotency-Key': newIdempotencyKey('nb01-reset') },
      validateStatus: (status) => status === 200 || status === 202,
    },
  )
  return unwrapSuccessData<ResetPasswordResult>(response.data)
}

/** NB01-012 */
export async function replaceUserRoles(userCode: string, roleCodes: string[]): Promise<UserDetail> {
  const { data } = await httpClient.put(
    `/api/admin/users/${encodeURIComponent(userCode)}/roles`,
    { role_codes: roleCodes },
    { headers: { 'Idempotency-Key': newIdempotencyKey('nb01-roles') } },
  )
  return unwrapSuccessData<UserDetail>(data)
}

/** NB01-013 */
export async function replaceUserLocations(
  userCode: string,
  locationCodes: string[],
): Promise<UserDetail> {
  const { data } = await httpClient.put(
    `/api/admin/users/${encodeURIComponent(userCode)}/locations`,
    { location_codes: locationCodes },
    { headers: { 'Idempotency-Key': newIdempotencyKey('nb01-locations') } },
  )
  return unwrapSuccessData<UserDetail>(data)
}

/** NB01-005 */
export async function revokeCurrentSession(): Promise<void> {
  await httpClient.post(
    '/api/auth/session/revoke',
    {},
    { headers: { 'Idempotency-Key': newIdempotencyKey('nb01-revoke') } },
  )
}

export function toApiError(error: unknown): ApiError | null {
  return error instanceof ApiError ? error : null
}

/** NB01-014 GET /api/admin/station-devices */
export async function listStationDevices(
  query: StationDeviceListQuery = {},
): Promise<StationDeviceListPage> {
  const { data } = await httpClient.get('/api/admin/station-devices', {
    params: {
      limit: query.limit,
      cursor: query.cursor,
      sort: query.sort,
      q: query.q,
    },
  })
  return normalizeListPage<StationDevice>(data)
}

/** NB01-015 GET /api/admin/station-devices/{station_device_code} */
export async function getStationDevice(code: string): Promise<StationDevice> {
  const trimmed = code.trim()
  if (!trimmed) throw new ApiError('VALIDATION_ERROR', 'station_device_code không hợp lệ.', 400)
  const { data } = await httpClient.get(
    `/api/admin/station-devices/${encodeURIComponent(trimmed)}`,
  )
  return unwrapSuccessData<StationDevice>(data)
}

/** NB01-016 POST /api/admin/station-devices — always shown; server enforces create permission. */
export async function createStationDevice(
  body: StationDeviceCreateRequest,
): Promise<StationDevice> {
  const { data } = await httpClient.post('/api/admin/station-devices', body, {
    headers: { 'Idempotency-Key': newIdempotencyKey('nb01d-station-device-create') },
  })
  return unwrapSuccessData<StationDevice>(data)
}

/** NB01-017 PATCH — invoked only via server-issued `allowed_actions[].href`. */
export async function updateStationDeviceViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
): Promise<StationDevice> {
  assertActionHref(action, 'update')
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': newIdempotencyKey('nb01d-station-device-update') },
  })
  return unwrapSuccessData<StationDevice>(data)
}

/** NB01-018 DELETE — invoked only via server-issued `allowed_actions[].href`; caller must confirm. */
export async function deactivateStationDeviceViaAction(
  action: AllowedAction,
): Promise<StationDevice> {
  assertActionHref(action, 'deactivate')
  const { data } = await httpClient.request({
    method: action.method || 'DELETE',
    url: action.href,
    headers: { 'Idempotency-Key': newIdempotencyKey('nb01d-station-device-deactivate') },
  })
  return unwrapSuccessData<StationDevice>(data)
}
