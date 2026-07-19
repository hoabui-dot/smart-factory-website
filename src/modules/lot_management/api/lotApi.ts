import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  EnqueueLabelRequest,
  EnqueueLabelResult,
  ItemLookupRecord,
  ItemRevisionLookupRecord,
  LotListPage,
  LotListQuery,
  LotRecord,
  ReferenceListQuery,
  SupplierLookupRecord,
} from '../types/lot'

function normalizePage<T>(raw: unknown): { items: T[]; page: LotListPage['page'] } {
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

/** WMS02-001 GET /api/wms/lots */
export async function listLots(query: LotListQuery = {}): Promise<LotListPage> {
  const { data } = await httpClient.get('/api/wms/lots', { params: query })
  return normalizePage<LotRecord>(data)
}

/** WMS02-002 GET /api/wms/lots/{lot_code} */
export async function getLot(lotCode: string): Promise<LotRecord> {
  const code = lotCode.trim()
  if (!code) throw new ApiError('VALIDATION_ERROR', 'lot_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/wms/lots/${encodeURIComponent(code)}`)
  return unwrapSuccessData<LotRecord>(data)
}

/** WMS02-006 GET /api/wms/lots/expiring */
export async function listExpiringLots(query: LotListQuery = {}): Promise<LotListPage> {
  const { data } = await httpClient.get('/api/wms/lots/expiring', { params: query })
  return normalizePage<LotRecord>(data)
}

/**
 * WMS02-003 PATCH — invoked only via server-issued `allowed_actions[].href`.
 * Never build this URL from lot_code directly; enabling is server-gated.
 */
export async function updateLotViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<LotRecord> {
  assertActionHref(action, 'update')
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('wms02-lot-update') },
  })
  return unwrapSuccessData<LotRecord>(data)
}

/**
 * WMS02-005 POST — invoked only via server-issued `allowed_actions[].href`. printer_code is
 * intentionally omitted: the server auto-resolves the printer from the caller's active device
 * location (same behavior as PDA) since printer listing/selection is system_admin_only (NB-05).
 */
export async function printLotViaAction(
  action: AllowedAction,
  body: EnqueueLabelRequest,
  idempotencyKey?: string,
): Promise<EnqueueLabelResult> {
  assertActionHref(action, 'print')
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('wms02-lot-print') },
  })
  return unwrapSuccessData<EnqueueLabelResult>(data)
}

/** MES-01 item lookup for the lot item_id selector. */
export async function listItemOptions(query: ReferenceListQuery = {}): Promise<ItemLookupRecord[]> {
  const { data } = await httpClient.get('/api/mes/items', { params: { limit: 200, ...query } })
  return unwrapItems<ItemLookupRecord>(data)
}

/** WMS-06 supplier lookup for the lot supplier_id selector. */
export async function listSupplierOptions(
  query: ReferenceListQuery = {},
): Promise<SupplierLookupRecord[]> {
  const { data } = await httpClient.get('/api/wms/suppliers', { params: { limit: 200, ...query } })
  return unwrapItems<SupplierLookupRecord>(data)
}

/** MES01-006 item_revision lookup for the lot item_revision_id selector, scoped to one item. */
export async function listItemRevisionOptions(
  itemCode: string,
  query: ReferenceListQuery = {},
): Promise<ItemRevisionLookupRecord[]> {
  const code = itemCode.trim()
  if (!code) return []
  const { data } = await httpClient.get(
    `/api/mes/items/${encodeURIComponent(code)}/revisions`,
    { params: { limit: 200, ...query } },
  )
  return unwrapItems<ItemRevisionLookupRecord>(data)
}
