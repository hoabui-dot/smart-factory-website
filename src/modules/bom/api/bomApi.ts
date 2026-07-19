import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  BomCopyRequest,
  BomCreateRequest,
  BomHeaderDetailRecord,
  BomHeaderRecord,
  BomListPage,
  BomListQuery,
  BomObsoleteRequest,
  BomTreeNode,
  ItemLookupRecord,
  ReferenceListQuery,
  UomLookupRecord,
} from '../types/bom'

function normalizePage<T>(raw: unknown): { items: T[]; page: BomListPage['page'] } {
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

/** MES02-001 GET /api/mes/boms */
export async function listBoms(query: BomListQuery = {}): Promise<BomListPage> {
  const { data } = await httpClient.get('/api/mes/boms', { params: query })
  return normalizePage<BomHeaderRecord>(data)
}

/** MES02-002 GET /api/mes/boms/{bom_header_code} */
export async function getBom(bomHeaderCode: string): Promise<BomHeaderDetailRecord> {
  const code = bomHeaderCode.trim()
  if (!code) throw new ApiError('VALIDATION_ERROR', 'bom_header_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/boms/${encodeURIComponent(code)}`)
  return unwrapSuccessData<BomHeaderDetailRecord>(data)
}

/** MES02-003 POST /api/mes/boms — always shown; server enforces create permission. */
export async function createBom(
  body: BomCreateRequest,
  idempotencyKey?: string,
): Promise<BomHeaderRecord> {
  const { data } = await httpClient.post('/api/mes/boms', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes02-bom-create') },
  })
  return unwrapSuccessData<BomHeaderRecord>(data)
}

/**
 * MES02-004 PATCH — invoked only via server-issued `allowed_actions[].href`; server rejects PATCH
 * unless bom is DRAFT (NOT_ALLOWED_BY_STATUS), so this is gated client-side by `allowed_actions`.
 */
export async function updateBomViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<BomHeaderRecord> {
  assertActionHref(action, 'update')
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes02-bom-update') },
  })
  return unwrapSuccessData<BomHeaderRecord>(data)
}

/** MES02-005 DELETE — invoked only via server-issued `allowed_actions[].href`; caller must confirm. */
export async function deactivateBomViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<BomHeaderRecord> {
  assertActionHref(action, 'deactivate')
  const { data } = await httpClient.request({
    method: action.method || 'DELETE',
    url: action.href,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes02-bom-deactivate') },
  })
  return unwrapSuccessData<BomHeaderRecord>(data)
}

/** MES02-006 GET /api/mes/boms/{bom_code}/tree */
export async function getBomTree(bomCode: string): Promise<BomTreeNode> {
  const code = bomCode.trim()
  if (!code) throw new ApiError('VALIDATION_ERROR', 'bom_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/boms/${encodeURIComponent(code)}/tree`)
  return unwrapSuccessData<BomTreeNode>(data)
}

/**
 * MES02-007 POST .../copy — invoked only via server-issued `allowed_actions[].href`; screen does
 * not require destructive confirm (creates a new DRAFT resource, same as Create).
 */
export async function copyBomViaAction(
  action: AllowedAction,
  body: BomCopyRequest,
  idempotencyKey?: string,
): Promise<BomHeaderDetailRecord> {
  assertActionHref(action, 'copy')
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes02-bom-copy') },
  })
  return unwrapSuccessData<BomHeaderDetailRecord>(data)
}

/**
 * MES02-008 POST .../release — invoked only via server-issued `allowed_actions[].href`;
 * caller must confirm before calling (obsoletes previously released BOMs for the same product).
 */
export async function releaseBomViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<BomHeaderRecord> {
  assertActionHref(action, 'release')
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes02-bom-release') },
  })
  return unwrapSuccessData<BomHeaderRecord>(data)
}

/**
 * MES02-009 POST .../obsolete — invoked only via server-issued `allowed_actions[].href`;
 * caller must confirm before calling; requires `effective_to` in the body.
 */
export async function obsoleteBomViaAction(
  action: AllowedAction,
  body: BomObsoleteRequest,
  idempotencyKey?: string,
): Promise<BomHeaderRecord> {
  assertActionHref(action, 'obsolete')
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes02-bom-obsolete') },
  })
  return unwrapSuccessData<BomHeaderRecord>(data)
}

/** UoM lookup via MES-01 reference (uom_id FK on bom_line, read-only projection). */
export async function listUoms(query: ReferenceListQuery = {}): Promise<UomLookupRecord[]> {
  const { data } = await httpClient.get('/api/mes/reference/uoms', {
    params: { limit: 200, ...query },
  })
  return unwrapItems<UomLookupRecord>(data)
}

/** MES-01 item lookup for the bom product_item_id selector (server enforces SEMI_FINISHED/FINISHED/PHANTOM). */
export async function listItemOptions(query: ReferenceListQuery = {}): Promise<ItemLookupRecord[]> {
  const { data } = await httpClient.get('/api/mes/items', {
    params: { limit: 200, ...query },
  })
  const unwrapped = unwrapSuccessData<Record<string, unknown>>(data as Record<string, unknown>)
  return Array.isArray(unwrapped.items) ? (unwrapped.items as ItemLookupRecord[]) : []
}
