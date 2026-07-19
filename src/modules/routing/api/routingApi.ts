import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  ItemLookupRecord,
  MachineCreateRequest,
  MachineListPage,
  MachineListQuery,
  MachineRecord,
  ReferenceListQuery,
  RoutingCreateRequest,
  RoutingHeaderRecord,
  RoutingListPage,
  RoutingListQuery,
  RoutingOperationRecord,
  UomLookupRecord,
  WorkCenterCreateRequest,
  WorkCenterListPage,
  WorkCenterListQuery,
  WorkCenterRecord,
} from '../types/routing'

function normalizePage<T>(raw: unknown): { items: T[]; page: WorkCenterListPage['page'] } {
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

function assertActionHref(action: AllowedAction, kind: string): void {
  if (!action.href.startsWith('/api/')) {
    throw new ApiError('VALIDATION_ERROR', `${kind} href không hợp lệ.`, 400)
  }
}

/** MES03-001 GET /api/mes/work-centers */
export async function listWorkCenters(query: WorkCenterListQuery = {}): Promise<WorkCenterListPage> {
  const { data } = await httpClient.get('/api/mes/work-centers', { params: query })
  return normalizePage<WorkCenterRecord>(data)
}

/** MES03-002 GET /api/mes/work-centers/{work_center_code} */
export async function getWorkCenter(workCenterCode: string): Promise<WorkCenterRecord> {
  const code = workCenterCode.trim()
  if (!code) throw new ApiError('VALIDATION_ERROR', 'work_center_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/work-centers/${encodeURIComponent(code)}`)
  return unwrapSuccessData<WorkCenterRecord>(data)
}

/** MES03-003 POST /api/mes/work-centers — always shown; server enforces create permission. */
export async function createWorkCenter(
  body: WorkCenterCreateRequest,
  idempotencyKey?: string,
): Promise<WorkCenterRecord> {
  const { data } = await httpClient.post('/api/mes/work-centers', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes03-work-center-create') },
  })
  return unwrapSuccessData<WorkCenterRecord>(data)
}

/** MES03-004 PATCH — invoked only via server-issued `allowed_actions[].href`. */
export async function updateWorkCenterViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<WorkCenterRecord> {
  assertActionHref(action, 'update')
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes03-work-center-update') },
  })
  return unwrapSuccessData<WorkCenterRecord>(data)
}

/** MES03-005 DELETE — invoked only via server-issued `allowed_actions[].href`; caller must confirm. */
export async function deactivateWorkCenterViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<WorkCenterRecord> {
  assertActionHref(action, 'deactivate')
  const { data } = await httpClient.request({
    method: action.method || 'DELETE',
    url: action.href,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes03-work-center-deactivate') },
  })
  return unwrapSuccessData<WorkCenterRecord>(data)
}

/** MES03-006 GET /api/mes/machines */
export async function listMachines(query: MachineListQuery = {}): Promise<MachineListPage> {
  const { data } = await httpClient.get('/api/mes/machines', { params: query })
  return normalizePage<MachineRecord>(data)
}

/** MES03-007 GET /api/mes/machines/{machine_code} */
export async function getMachine(machineCode: string): Promise<MachineRecord> {
  const code = machineCode.trim()
  if (!code) throw new ApiError('VALIDATION_ERROR', 'machine_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/machines/${encodeURIComponent(code)}`)
  return unwrapSuccessData<MachineRecord>(data)
}

/** MES03-008 POST /api/mes/machines — always shown; server enforces create permission. */
export async function createMachine(
  body: MachineCreateRequest,
  idempotencyKey?: string,
): Promise<MachineRecord> {
  const { data } = await httpClient.post('/api/mes/machines', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes03-machine-create') },
  })
  return unwrapSuccessData<MachineRecord>(data)
}

/** MES03-009 PATCH — invoked only via server-issued `allowed_actions[].href`. */
export async function updateMachineViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<MachineRecord> {
  assertActionHref(action, 'update')
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes03-machine-update') },
  })
  return unwrapSuccessData<MachineRecord>(data)
}

/** MES03-010 DELETE — invoked only via server-issued `allowed_actions[].href`; caller must confirm. */
export async function deactivateMachineViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<MachineRecord> {
  assertActionHref(action, 'deactivate')
  const { data } = await httpClient.request({
    method: action.method || 'DELETE',
    url: action.href,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes03-machine-deactivate') },
  })
  return unwrapSuccessData<MachineRecord>(data)
}

/** MES03-011 GET /api/mes/routings */
export async function listRoutings(query: RoutingListQuery = {}): Promise<RoutingListPage> {
  const { data } = await httpClient.get('/api/mes/routings', { params: query })
  return normalizePage<RoutingHeaderRecord>(data)
}

/** MES03-012 GET /api/mes/routings/{routing_header_code} */
export async function getRouting(routingCode: string): Promise<RoutingHeaderRecord> {
  const code = routingCode.trim()
  if (!code) throw new ApiError('VALIDATION_ERROR', 'routing_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/routings/${encodeURIComponent(code)}`)
  return unwrapSuccessData<RoutingHeaderRecord>(data)
}

/** MES03-013 POST /api/mes/routings — always shown; server enforces create permission. */
export async function createRouting(
  body: RoutingCreateRequest,
  idempotencyKey?: string,
): Promise<RoutingHeaderRecord> {
  const { data } = await httpClient.post('/api/mes/routings', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes03-routing-create') },
  })
  return unwrapSuccessData<RoutingHeaderRecord>(data)
}

/**
 * MES03-014 PATCH — invoked only via server-issued `allowed_actions[].href`; server rejects PATCH
 * unless routing is DRAFT (NOT_ALLOWED_BY_STATUS), so this is gated client-side by `allowed_actions`.
 */
export async function updateRoutingViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<RoutingHeaderRecord> {
  assertActionHref(action, 'update')
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes03-routing-update') },
  })
  return unwrapSuccessData<RoutingHeaderRecord>(data)
}

/**
 * MES03-015 DELETE (soft-archive to OBSOLETE) — invoked only via server-issued
 * `allowed_actions[].href`; caller must confirm before calling.
 */
export async function deactivateRoutingViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<RoutingHeaderRecord> {
  assertActionHref(action, 'deactivate')
  const { data } = await httpClient.request({
    method: action.method || 'DELETE',
    url: action.href,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes03-routing-deactivate') },
  })
  return unwrapSuccessData<RoutingHeaderRecord>(data)
}

/**
 * MES03-016 POST .../release — invoked only via server-issued `allowed_actions[].href`;
 * caller must confirm before calling (screen requires confirm for impact of obsoleting
 * previously released routings for the same product).
 */
export async function releaseRoutingViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<RoutingHeaderRecord> {
  assertActionHref(action, 'release')
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes03-routing-release') },
  })
  return unwrapSuccessData<RoutingHeaderRecord>(data)
}

/**
 * MES03-018 POST .../obsolete — invoked only via server-issued `allowed_actions[].href`;
 * caller must confirm before calling.
 */
export async function obsoleteRoutingViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<RoutingHeaderRecord> {
  assertActionHref(action, 'obsolete')
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes03-routing-obsolete') },
  })
  return unwrapSuccessData<RoutingHeaderRecord>(data)
}

/** MES03-017 GET /api/mes/routings/{routing_code}/operations */
export async function listRoutingOperations(routingCode: string): Promise<RoutingOperationRecord[]> {
  const code = routingCode.trim()
  if (!code) throw new ApiError('VALIDATION_ERROR', 'routing_code không hợp lệ.', 400)
  const { data } = await httpClient.get(
    `/api/mes/routings/${encodeURIComponent(code)}/operations`,
  )
  return unwrapItems<RoutingOperationRecord>(data)
}

/** UoM lookup via MES-01 reference (capacity_uom_id / standard_cycle_time_uom_id FK). */
export async function listUoms(query: ReferenceListQuery = {}): Promise<UomLookupRecord[]> {
  const { data } = await httpClient.get('/api/mes/reference/uoms', {
    params: { limit: 200, ...query },
  })
  return unwrapItems<UomLookupRecord>(data)
}

/** MES-01 item lookup for the routing product_item_id selector. */
export async function listItemOptions(query: ReferenceListQuery = {}): Promise<ItemLookupRecord[]> {
  const { data } = await httpClient.get('/api/mes/items', {
    params: { limit: 200, ...query },
  })
  const unwrapped = unwrapSuccessData<Record<string, unknown>>(data as Record<string, unknown>)
  return Array.isArray(unwrapped.items) ? (unwrapped.items as ItemLookupRecord[]) : []
}
