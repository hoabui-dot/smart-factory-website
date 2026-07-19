import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  LocationCreateRequest,
  LocationListPage,
  LocationListQuery,
  LocationRecord,
  LocationTypeRecord,
  ReferenceListQuery,
  WarehouseCategoryRecord,
} from '../types/binLocation'

export type UomLookupRecord = {
  id: number
  code: string
  uom_name: string
  is_active: boolean
}

function normalizePage<T>(raw: unknown): { items: T[]; page: LocationListPage['page'] } {
  const data = unwrapSuccessData<Record<string, unknown>>(raw as Record<string, unknown>)
  const page = (data.page ?? {}) as Record<string, unknown>
  return {
    items: Array.isArray(data.items) ? (data.items as T[]) : [],
    page: {
      limit: typeof page.limit === 'number' ? page.limit : 50,
      next_cursor: typeof page.next_cursor === 'string' ? page.next_cursor : null,
      has_more: Boolean(page.has_more),
    },
  }
}

function unwrapItems<T>(raw: unknown): T[] {
  const data = unwrapSuccessData<Record<string, unknown>>(raw as Record<string, unknown>)
  return Array.isArray(data.items) ? (data.items as T[]) : []
}

/** WMS01-001 GET /api/wms/locations */
export async function listLocations(query: LocationListQuery = {}): Promise<LocationListPage> {
  const { data } = await httpClient.get('/api/wms/locations', { params: query })
  return normalizePage<LocationRecord>(data)
}

/** WMS01-002 GET /api/wms/locations/{location_code} */
export async function getLocation(locationCode: string): Promise<LocationRecord> {
  const code = locationCode.trim()
  if (!code) throw new ApiError('VALIDATION_ERROR', 'location_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/wms/locations/${encodeURIComponent(code)}`)
  return unwrapSuccessData<LocationRecord>(data)
}

/** WMS01-003 POST /api/wms/locations — always shown; server enforces create permission. */
export async function createLocation(
  body: LocationCreateRequest,
  idempotencyKey?: string,
): Promise<LocationRecord> {
  const { data } = await httpClient.post('/api/wms/locations', body, {
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('wms01-location-create'),
    },
  })
  return unwrapSuccessData<LocationRecord>(data)
}

/**
 * WMS01-004 PATCH — invoked only via server-issued `allowed_actions[].href`.
 * Never build this URL from location_code directly; enabling is server-gated.
 */
export async function updateLocationViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<LocationRecord> {
  if (!action.href.startsWith('/api/')) {
    throw new ApiError('VALIDATION_ERROR', 'update href không hợp lệ.', 400)
  }
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('wms01-location-update'),
    },
  })
  return unwrapSuccessData<LocationRecord>(data)
}

/**
 * WMS01-005 DELETE (soft-deactivate) — invoked only via server-issued
 * `allowed_actions[].href`; caller must confirm before calling.
 */
export async function deactivateLocationViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<LocationRecord> {
  if (!action.href.startsWith('/api/')) {
    throw new ApiError('VALIDATION_ERROR', 'deactivate href không hợp lệ.', 400)
  }
  const { data } = await httpClient.request({
    method: action.method || 'DELETE',
    url: action.href,
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('wms01-location-deactivate'),
    },
  })
  return unwrapSuccessData<LocationRecord>(data)
}

/** WMS01-006 GET /api/wms/locations/tree */
export async function listLocationTree(): Promise<LocationRecord[]> {
  const { data } = await httpClient.get('/api/wms/locations/tree')
  return unwrapItems<LocationRecord>(data)
}

/** WMS01-007 GET /api/wms/reference/location-types */
export async function listLocationTypes(
  query: ReferenceListQuery = {},
): Promise<LocationTypeRecord[]> {
  const { data } = await httpClient.get('/api/wms/reference/location-types', {
    params: { limit: 200, ...query },
  })
  return unwrapItems<LocationTypeRecord>(data)
}

/** WMS01-008 GET /api/wms/reference/warehouse-categories */
export async function listWarehouseCategories(
  query: ReferenceListQuery = {},
): Promise<WarehouseCategoryRecord[]> {
  const { data } = await httpClient.get('/api/wms/reference/warehouse-categories', {
    params: { limit: 200, ...query },
  })
  return unwrapItems<WarehouseCategoryRecord>(data)
}

/** Capacity UoM lookup via MES-01 reference (capacity_uom_id FK). */
export async function listCapacityUoms(query: ReferenceListQuery = {}): Promise<UomLookupRecord[]> {
  const { data } = await httpClient.get('/api/mes/reference/uoms', {
    params: { limit: 200, ...query },
  })
  return unwrapItems<UomLookupRecord>(data)
}
