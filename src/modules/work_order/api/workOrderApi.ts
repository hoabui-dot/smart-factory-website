import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  ItemLookupRecord,
  ItemRevisionLookupRecord,
  MaterialRequestListPage,
  MaterialRequestRecord,
  ReasonRequest,
  ReferenceListQuery,
  WorkOrderCreateRequest,
  WorkOrderListPage,
  WorkOrderListQuery,
  WorkOrderRecord,
  WorkOrderUpdateRequest,
} from '../types/workOrder'

function normalizePage<T>(raw: unknown): { items: T[]; page: WorkOrderListPage['page'] } {
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

async function callAction<TResult>(
  action: AllowedAction,
  kind: string,
  body: Record<string, unknown> | undefined,
  idempotencyPrefix: string,
  idempotencyKey?: string,
): Promise<TResult> {
  assertActionHref(action, kind)
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey(idempotencyPrefix) },
  })
  return unwrapSuccessData<TResult>(data)
}

/** MES04-001 GET /api/mes/work-orders */
export async function listWorkOrders(query: WorkOrderListQuery = {}): Promise<WorkOrderListPage> {
  const { data } = await httpClient.get('/api/mes/work-orders', { params: query })
  return normalizePage<WorkOrderRecord>(data)
}

/** MES04-002 GET /api/mes/work-orders/{work_order_id} — explicit Phase 1 physical-id route key. */
export async function getWorkOrder(workOrderId: number): Promise<WorkOrderRecord> {
  if (!Number.isInteger(workOrderId) || workOrderId <= 0) {
    throw new ApiError('VALIDATION_ERROR', 'work_order_id không hợp lệ.', 400)
  }
  const { data } = await httpClient.get(`/api/mes/work-orders/${workOrderId}`)
  return unwrapSuccessData<WorkOrderRecord>(data)
}

/** MES04-003 POST /api/mes/work-orders — always shown; server enforces create permission. */
export async function createWorkOrder(
  body: WorkOrderCreateRequest,
  idempotencyKey?: string,
): Promise<WorkOrderRecord> {
  const { data } = await httpClient.post('/api/mes/work-orders', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes04-wo-create') },
  })
  return unwrapSuccessData<WorkOrderRecord>(data)
}

/** MES04-004 PATCH — invoked only via server-issued `allowed_actions[].href`; DRAFT|PLANNED-only. */
export async function updateWorkOrderViaAction(
  action: AllowedAction,
  body: WorkOrderUpdateRequest,
  idempotencyKey?: string,
): Promise<WorkOrderRecord> {
  return callAction(action, 'update', body as Record<string, unknown>, 'mes04-wo-update', idempotencyKey)
}

/** MES04-006 POST .../plan — invoked only via server-issued `allowed_actions[].href`; no body. */
export async function planWorkOrderViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<WorkOrderRecord> {
  return callAction(action, 'plan', undefined, 'mes04-wo-plan', idempotencyKey)
}

/**
 * MES04-007 POST .../release — invoked only via server-issued `allowed_actions[].href`; no body.
 * Server drives the RELEASED → MATERIAL_PREPARING/MATERIAL_READY transient transition internally.
 */
export async function releaseWorkOrderViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<WorkOrderRecord> {
  return callAction(action, 'release', undefined, 'mes04-wo-release', idempotencyKey)
}

/** MES04-009 POST .../pause — invoked only via server-issued `allowed_actions[].href`; reason required. */
export async function pauseWorkOrderViaAction(
  action: AllowedAction,
  body: ReasonRequest,
  idempotencyKey?: string,
): Promise<WorkOrderRecord> {
  return callAction(action, 'pause', body as Record<string, unknown>, 'mes04-wo-pause', idempotencyKey)
}

/** MES04-010 POST .../resume — invoked only via server-issued `allowed_actions[].href`; no body. */
export async function resumeWorkOrderViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<WorkOrderRecord> {
  return callAction(action, 'resume', undefined, 'mes04-wo-resume', idempotencyKey)
}

/** MES04-011 POST .../close — invoked only via server-issued `allowed_actions[].href`; no body. */
export async function closeWorkOrderViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<WorkOrderRecord> {
  return callAction(action, 'close', undefined, 'mes04-wo-close', idempotencyKey)
}

/** MES04-012 POST .../cancel — invoked only via server-issued `allowed_actions[].href`; reason required. */
export async function cancelWorkOrderViaAction(
  action: AllowedAction,
  body: ReasonRequest,
  idempotencyKey?: string,
): Promise<WorkOrderRecord> {
  return callAction(action, 'cancel', body as Record<string, unknown>, 'mes04-wo-cancel', idempotencyKey)
}

/** MES04-013 GET /api/mes/work-orders/{work_order_id}/material-requests */
export async function listMaterialRequests(
  workOrderId: number,
  query: ReferenceListQuery = {},
): Promise<MaterialRequestListPage> {
  const { data } = await httpClient.get(`/api/mes/work-orders/${workOrderId}/material-requests`, {
    params: query,
  })
  return normalizePage<MaterialRequestRecord>(data)
}

/** MES-01 item lookup for the WO item_id selector (server enforces SEMI_FINISHED/FINISHED). */
export async function listItemOptions(query: ReferenceListQuery = {}): Promise<ItemLookupRecord[]> {
  const { data } = await httpClient.get('/api/mes/items', { params: { limit: 200, ...query } })
  return unwrapItems<ItemLookupRecord>(data)
}

/** MES01-006 item_revision lookup for the WO item_revision_id selector, scoped to one item. */
export async function listItemRevisionOptions(
  itemCode: string,
  query: ReferenceListQuery = {},
): Promise<ItemRevisionLookupRecord[]> {
  const code = itemCode.trim()
  if (!code) return []
  const { data } = await httpClient.get(`/api/mes/items/${encodeURIComponent(code)}/revisions`, {
    params: { limit: 200, ...query },
  })
  return unwrapItems<ItemRevisionLookupRecord>(data)
}
