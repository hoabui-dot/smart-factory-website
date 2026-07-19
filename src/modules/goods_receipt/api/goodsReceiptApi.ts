import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  AsnCreateRequest,
  AsnListPage,
  AsnListQuery,
  AsnRecord,
  AttachMillCertificateRequest,
  AttachmentListPage,
  AuthorizeUploadRequest,
  AuthorizeUploadResult,
  CancelRequest,
  FileStorageRecord,
  FinalizeUploadRequest,
  GoodsReceiptListPage,
  GoodsReceiptListQuery,
  GoodsReceiptRecord,
  ItemLookupRecord,
  LocationLookupRecord,
  PurchaseOrderCreateRequest,
  PurchaseOrderListPage,
  PurchaseOrderListQuery,
  PurchaseOrderRecord,
  ReferenceListQuery,
  SupplierLookupRecord,
  UomLookupRecord,
} from '../types/goodsReceipt'

const OWNER_MODULE = 'WMS-03'

function normalizePage<T>(raw: unknown): { items: T[]; page: PurchaseOrderListPage['page'] } {
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

/** WMS03-001 GET /api/wms/purchase-orders */
export async function listPurchaseOrders(
  query: PurchaseOrderListQuery = {},
): Promise<PurchaseOrderListPage> {
  const { data } = await httpClient.get('/api/wms/purchase-orders', { params: query })
  return normalizePage<PurchaseOrderRecord>(data)
}

/** WMS03-002 GET /api/wms/purchase-orders/{purchase_order_header_code} */
export async function getPurchaseOrder(code: string): Promise<PurchaseOrderRecord> {
  const trimmed = code.trim()
  if (!trimmed) throw new ApiError('VALIDATION_ERROR', 'purchase_order_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/wms/purchase-orders/${encodeURIComponent(trimmed)}`)
  return unwrapSuccessData<PurchaseOrderRecord>(data)
}

/** WMS03-003 POST /api/wms/purchase-orders — always shown; server enforces create permission. */
export async function createPurchaseOrder(
  body: PurchaseOrderCreateRequest,
  idempotencyKey?: string,
): Promise<PurchaseOrderRecord> {
  const { data } = await httpClient.post('/api/wms/purchase-orders', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('wms03-po-create') },
  })
  return unwrapSuccessData<PurchaseOrderRecord>(data)
}

/** WMS03-004 PATCH — invoked only via server-issued `allowed_actions[].href`. */
export async function updatePurchaseOrderViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<PurchaseOrderRecord> {
  return callAction(action, 'update', body, 'wms03-po-update', idempotencyKey)
}

/** WMS03-005 POST — invoked only via server-issued `allowed_actions[].href`; reason required. */
export async function cancelPurchaseOrderViaAction(
  action: AllowedAction,
  body: CancelRequest,
  idempotencyKey?: string,
): Promise<PurchaseOrderRecord> {
  return callAction(action, 'cancel', body, 'wms03-po-cancel', idempotencyKey)
}

/** WMS03-020 POST — invoked only via server-issued `allowed_actions[].href`. */
export async function closePurchaseOrderViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<PurchaseOrderRecord> {
  return callAction(action, 'close', undefined, 'wms03-po-close', idempotencyKey)
}

/** WMS03-006 GET /api/wms/asns */
export async function listAsns(query: AsnListQuery = {}): Promise<AsnListPage> {
  const { data } = await httpClient.get('/api/wms/asns', { params: query })
  return normalizePage<AsnRecord>(data)
}

/** WMS03-007 GET /api/wms/asns/{asn_header_code} */
export async function getAsn(code: string): Promise<AsnRecord> {
  const trimmed = code.trim()
  if (!trimmed) throw new ApiError('VALIDATION_ERROR', 'asn_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/wms/asns/${encodeURIComponent(trimmed)}`)
  return unwrapSuccessData<AsnRecord>(data)
}

/** WMS03-008 POST /api/wms/asns — always shown; server enforces create permission. */
export async function createAsn(
  body: AsnCreateRequest,
  idempotencyKey?: string,
): Promise<AsnRecord> {
  const { data } = await httpClient.post('/api/wms/asns', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('wms03-asn-create') },
  })
  return unwrapSuccessData<AsnRecord>(data)
}

/** WMS03-009 PATCH — invoked only via server-issued `allowed_actions[].href`. */
export async function updateAsnViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<AsnRecord> {
  return callAction(action, 'update', body, 'wms03-asn-update', idempotencyKey)
}

/** WMS03-010 POST — invoked only via server-issued `allowed_actions[].href`; no body. */
export async function arriveAsnViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<AsnRecord> {
  return callAction(action, 'arrive', undefined, 'wms03-asn-arrive', idempotencyKey)
}

/** WMS03-011 POST — invoked only via server-issued `allowed_actions[].href`; no body. */
export async function startReceivingAsnViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<AsnRecord> {
  return callAction(action, 'start_receiving', undefined, 'wms03-asn-start-receiving', idempotencyKey)
}

/** WMS03-012 POST — invoked only via server-issued `allowed_actions[].href`; no reason field. */
export async function cancelAsnViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<AsnRecord> {
  return callAction(action, 'cancel', undefined, 'wms03-asn-cancel', idempotencyKey)
}

/** WMS03-013 GET /api/wms/goods-receipts */
export async function listGoodsReceipts(
  query: GoodsReceiptListQuery = {},
): Promise<GoodsReceiptListPage> {
  const { data } = await httpClient.get('/api/wms/goods-receipts', { params: query })
  return normalizePage<GoodsReceiptRecord>(data)
}

/** WMS03-014 GET /api/wms/goods-receipts/{goods_receipt_header_code} */
export async function getGoodsReceipt(code: string): Promise<GoodsReceiptRecord> {
  const trimmed = code.trim()
  if (!trimmed) throw new ApiError('VALIDATION_ERROR', 'goods_receipt_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/wms/goods-receipts/${encodeURIComponent(trimmed)}`)
  return unwrapSuccessData<GoodsReceiptRecord>(data)
}

/** WMS03-016 PATCH — invoked only via server-issued `allowed_actions[].href`. */
export async function updateGoodsReceiptViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<GoodsReceiptRecord> {
  return callAction(action, 'update', body, 'wms03-grn-update', idempotencyKey)
}

/** WMS03-018 POST — invoked only via server-issued `allowed_actions[].href`; reason required. */
export async function cancelGoodsReceiptViaAction(
  action: AllowedAction,
  body: CancelRequest,
  idempotencyKey?: string,
): Promise<GoodsReceiptRecord> {
  return callAction(action, 'cancel', body, 'wms03-grn-cancel', idempotencyKey)
}

/**
 * WMS03-019 POST — invoked only via server-issued `allowed_actions[].href`; attaches only an
 * AVAILABLE finalized NB-04 file (canonical authorize/finalize policy runs ahead of this call).
 */
export async function attachMillCertificateViaAction(
  action: AllowedAction,
  body: AttachMillCertificateRequest,
  idempotencyKey?: string,
): Promise<GoodsReceiptRecord> {
  return callAction(
    action,
    'mill_certificate',
    body as unknown as Record<string, unknown>,
    'wms03-grn-mill-cert',
    idempotencyKey,
  )
}

/** MES-01 item lookup for line item_code entry. */
export async function listItemOptions(query: ReferenceListQuery = {}): Promise<ItemLookupRecord[]> {
  const { data } = await httpClient.get('/api/mes/items', { params: { limit: 200, ...query } })
  return unwrapItems<ItemLookupRecord>(data)
}

/** WMS-06 supplier lookup for PO/ASN supplier_code entry. */
export async function listSupplierOptions(
  query: ReferenceListQuery = {},
): Promise<SupplierLookupRecord[]> {
  const { data } = await httpClient.get('/api/wms/suppliers', { params: { limit: 200, ...query } })
  return unwrapItems<SupplierLookupRecord>(data)
}

/** MES-01 UoM reference lookup for line uom_code entry. */
export async function listUomOptions(query: ReferenceListQuery = {}): Promise<UomLookupRecord[]> {
  const { data } = await httpClient.get('/api/mes/reference/uoms', {
    params: { limit: 200, ...query },
  })
  return unwrapItems<UomLookupRecord>(data)
}

/** WMS-01b location lookup for GR received_location_code display resolution. */
export async function listLocationOptions(
  query: ReferenceListQuery = {},
): Promise<LocationLookupRecord[]> {
  const { data } = await httpClient.get('/api/wms/locations', { params: { limit: 200, ...query } })
  return unwrapItems<LocationLookupRecord>(data)
}

/** NB04-005 GET /api/entities/lot/{lot_id}/attachments — read-only mill certificate evidence. */
export async function listLotAttachments(lotId: number): Promise<AttachmentListPage> {
  const { data } = await httpClient.get(`/api/entities/lot/${lotId}/attachments`, {
    params: { limit: 50 },
  })
  return normalizePage(data) as AttachmentListPage
}

/** NB04-001 POST /api/files/uploads:authorize — used ahead of WMS03-019 attach. */
export async function authorizeUpload(
  body: AuthorizeUploadRequest,
  idempotencyKey?: string,
): Promise<AuthorizeUploadResult> {
  const { data } = await httpClient.post('/api/files/uploads:authorize', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('wms03-mill-cert-authorize') },
  })
  return unwrapSuccessData<AuthorizeUploadResult>(data)
}

/**
 * Uploads the raw file bytes to the NB-04 signed quarantine target. Runs outside `httpClient`
 * (different origin/base URL, no auth/App-Type headers).
 */
export async function uploadFileToSignedTarget(
  authorized: AuthorizeUploadResult,
  file: File,
): Promise<string | null> {
  const res = await fetch(authorized.upload_url, {
    method: authorized.upload_method || 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      ...(authorized.upload_headers ?? {}),
    },
    body: file,
  })
  if (!res.ok) {
    throw new ApiError('DEPENDENCY_UNAVAILABLE', 'Tải file lên storage thất bại.', res.status)
  }
  return res.headers.get('ETag')
}

/** NB04-002 POST /api/files/{file_id}/finalize */
export async function finalizeUpload(
  fileId: number,
  body: FinalizeUploadRequest,
  idempotencyKey?: string,
): Promise<FileStorageRecord> {
  const { data } = await httpClient.post(`/api/files/${fileId}/finalize`, body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('wms03-mill-cert-finalize') },
  })
  return unwrapSuccessData<FileStorageRecord>(data)
}

/** Computes the hex SHA-256 checksum NB04-001/002 requires, using the browser Web Crypto API. */
export async function computeSha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export { OWNER_MODULE }
