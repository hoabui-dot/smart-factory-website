import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  ItemLookupRecord,
  ReferenceListQuery,
  SupplierCreateRequest,
  SupplierEvaluationCreateRequest,
  SupplierEvaluationListPage,
  SupplierEvaluationListQuery,
  SupplierEvaluationRecord,
  SupplierItemCreateRequest,
  SupplierItemListPage,
  SupplierItemListQuery,
  SupplierItemRecord,
  SupplierListPage,
  SupplierListQuery,
  SupplierRecord,
} from '../types/supplier'

function normalizePage<T>(raw: unknown): { items: T[]; page: SupplierListPage['page'] } {
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

/** WMS06-001 GET /api/wms/suppliers */
export async function listSuppliers(query: SupplierListQuery = {}): Promise<SupplierListPage> {
  const { data } = await httpClient.get('/api/wms/suppliers', { params: query })
  return normalizePage<SupplierRecord>(data)
}

/** WMS06-002 GET /api/wms/suppliers/{supplier_code} */
export async function getSupplier(supplierCode: string): Promise<SupplierRecord> {
  const code = supplierCode.trim()
  if (!code) throw new ApiError('VALIDATION_ERROR', 'supplier_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/wms/suppliers/${encodeURIComponent(code)}`)
  return unwrapSuccessData<SupplierRecord>(data)
}

/** WMS06-003 POST /api/wms/suppliers — always shown; server enforces create permission. */
export async function createSupplier(
  body: SupplierCreateRequest,
  idempotencyKey?: string,
): Promise<SupplierRecord> {
  const { data } = await httpClient.post('/api/wms/suppliers', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('wms06-supplier-create') },
  })
  return unwrapSuccessData<SupplierRecord>(data)
}

/** WMS06-004 PATCH — invoked only via server-issued `allowed_actions[].href`. */
export async function updateSupplierViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<SupplierRecord> {
  assertActionHref(action, 'update')
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('wms06-supplier-update') },
  })
  return unwrapSuccessData<SupplierRecord>(data)
}

/** WMS06-005 DELETE — invoked only via server-issued `allowed_actions[].href`; caller must confirm. */
export async function deactivateSupplierViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<SupplierRecord> {
  assertActionHref(action, 'deactivate')
  const { data } = await httpClient.request({
    method: action.method || 'DELETE',
    url: action.href,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('wms06-supplier-deactivate') },
  })
  return unwrapSuccessData<SupplierRecord>(data)
}

/** WMS06-006 GET /api/wms/supplier-items */
export async function listSupplierItems(
  query: SupplierItemListQuery = {},
): Promise<SupplierItemListPage> {
  const { data } = await httpClient.get('/api/wms/supplier-items', { params: query })
  return normalizePage<SupplierItemRecord>(data)
}

/** WMS06-007 GET /api/wms/supplier-items/{supplier_item_code} */
export async function getSupplierItem(supplierItemCode: string): Promise<SupplierItemRecord> {
  const code = supplierItemCode.trim()
  if (!code) throw new ApiError('VALIDATION_ERROR', 'supplier_item_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/wms/supplier-items/${encodeURIComponent(code)}`)
  return unwrapSuccessData<SupplierItemRecord>(data)
}

/** WMS06-008 POST /api/wms/supplier-items — always shown; server enforces create permission. */
export async function createSupplierItem(
  body: SupplierItemCreateRequest,
  idempotencyKey?: string,
): Promise<SupplierItemRecord> {
  const { data } = await httpClient.post('/api/wms/supplier-items', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('wms06-supplier-item-create') },
  })
  return unwrapSuccessData<SupplierItemRecord>(data)
}

/** WMS06-009 PATCH — invoked only via server-issued `allowed_actions[].href`. */
export async function updateSupplierItemViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<SupplierItemRecord> {
  assertActionHref(action, 'update')
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('wms06-supplier-item-update') },
  })
  return unwrapSuccessData<SupplierItemRecord>(data)
}

/** WMS06-010 DELETE — invoked only via server-issued `allowed_actions[].href`; caller must confirm. */
export async function deactivateSupplierItemViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<SupplierItemRecord> {
  assertActionHref(action, 'deactivate')
  const { data } = await httpClient.request({
    method: action.method || 'DELETE',
    url: action.href,
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('wms06-supplier-item-deactivate'),
    },
  })
  return unwrapSuccessData<SupplierItemRecord>(data)
}

/** WMS06-011 GET /api/wms/supplier-evaluations */
export async function listSupplierEvaluations(
  query: SupplierEvaluationListQuery = {},
): Promise<SupplierEvaluationListPage> {
  const { data } = await httpClient.get('/api/wms/supplier-evaluations', { params: query })
  return normalizePage<SupplierEvaluationRecord>(data)
}

/** WMS06-012 GET /api/wms/supplier-evaluations/{supplier_evaluation_code} */
export async function getSupplierEvaluation(
  supplierEvaluationCode: string,
): Promise<SupplierEvaluationRecord> {
  const code = supplierEvaluationCode.trim()
  if (!code) throw new ApiError('VALIDATION_ERROR', 'supplier_evaluation_code không hợp lệ.', 400)
  const { data } = await httpClient.get(
    `/api/wms/supplier-evaluations/${encodeURIComponent(code)}`,
  )
  return unwrapSuccessData<SupplierEvaluationRecord>(data)
}

/**
 * WMS06-013 POST /api/wms/supplier-evaluations — always shown; server enforces permission.
 * Append-only in Phase 1: no update/delete facade exists for supplier_evaluation.
 */
export async function createSupplierEvaluation(
  body: SupplierEvaluationCreateRequest,
  idempotencyKey?: string,
): Promise<SupplierEvaluationRecord> {
  const { data } = await httpClient.post('/api/wms/supplier-evaluations', body, {
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('wms06-supplier-evaluation-create'),
    },
  })
  return unwrapSuccessData<SupplierEvaluationRecord>(data)
}

/** MES-01 item lookup for the supplier_item item_id selector. */
export async function listItemOptions(query: ReferenceListQuery = {}): Promise<ItemLookupRecord[]> {
  const { data } = await httpClient.get('/api/mes/items', {
    params: { limit: 200, ...query },
  })
  const unwrapped = unwrapSuccessData<Record<string, unknown>>(data as Record<string, unknown>)
  return Array.isArray(unwrapped.items) ? (unwrapped.items as ItemLookupRecord[]) : []
}

/** Supplier lookup for the supplier_item/supplier_evaluation supplier_id selector. */
export async function listSupplierOptions(query: ReferenceListQuery = {}): Promise<SupplierRecord[]> {
  const { data } = await httpClient.get('/api/wms/suppliers', {
    params: { limit: 200, ...query },
  })
  return unwrapItems<SupplierRecord>(data)
}
