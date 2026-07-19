import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  CustomerCreateRequest,
  CustomerItemCreateRequest,
  CustomerItemListPage,
  CustomerItemRecord,
  CustomerItemUpdateRequest,
  CustomerListPage,
  CustomerListQuery,
  CustomerOrderCreateRequest,
  CustomerOrderListPage,
  CustomerOrderRecord,
  CustomerOrderUpdateRequest,
  CustomerRecord,
  CustomerUpdateRequest,
  ItemLookupRecord,
  ReferenceListQuery,
  AsyncJobReference,
  CocDownloadResponse,
  ShipmentCreateRequest,
  ShipmentLineCreateRequest,
  ShipmentListPage,
  ShipmentRecord,
  ShipmentUpdateRequest,
} from '../types/customerOrder'

function normalizePage<T>(raw: unknown): { items: T[]; page: CustomerListPage['page'] } {
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

async function callAction<T>(
  action: AllowedAction,
  kind: string,
  body: Record<string, unknown> | undefined,
  prefix: string,
): Promise<T> {
  assertActionHref(action, kind)
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': newIdempotencyKey(prefix) },
  })
  return unwrapSuccessData<T>(data)
}

export async function listCustomers(query: CustomerListQuery = {}): Promise<CustomerListPage> {
  const { data } = await httpClient.get('/api/mes/customers', { params: query })
  return normalizePage<CustomerRecord>(data)
}

export async function getCustomer(code: string): Promise<CustomerRecord> {
  const c = code.trim()
  if (!c) throw new ApiError('VALIDATION_ERROR', 'customer_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/customers/${encodeURIComponent(c)}`)
  return unwrapSuccessData<CustomerRecord>(data)
}

export async function createCustomer(body: CustomerCreateRequest): Promise<CustomerRecord> {
  const { data } = await httpClient.post('/api/mes/customers', body, {
    headers: { 'Idempotency-Key': newIdempotencyKey('mes10-customer-create') },
  })
  return unwrapSuccessData<CustomerRecord>(data)
}

export async function updateCustomerViaAction(
  action: AllowedAction,
  body: CustomerUpdateRequest,
): Promise<CustomerRecord> {
  return callAction(action, 'update', body as Record<string, unknown>, 'mes10-customer-update')
}

export async function deactivateCustomerViaAction(action: AllowedAction): Promise<CustomerRecord> {
  return callAction(action, 'deactivate', undefined, 'mes10-customer-deactivate')
}

export async function listCustomerItems(
  query: ReferenceListQuery & { customer_id?: number } = {},
): Promise<CustomerItemListPage> {
  const { data } = await httpClient.get('/api/mes/customer-items', { params: query })
  return normalizePage<CustomerItemRecord>(data)
}

export async function getCustomerItem(code: string): Promise<CustomerItemRecord> {
  const c = code.trim()
  if (!c) throw new ApiError('VALIDATION_ERROR', 'customer_item_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/customer-items/${encodeURIComponent(c)}`)
  return unwrapSuccessData<CustomerItemRecord>(data)
}

export async function createCustomerItem(
  body: CustomerItemCreateRequest,
): Promise<CustomerItemRecord> {
  const { data } = await httpClient.post('/api/mes/customer-items', body, {
    headers: { 'Idempotency-Key': newIdempotencyKey('mes10-ci-create') },
  })
  return unwrapSuccessData<CustomerItemRecord>(data)
}

export async function updateCustomerItemViaAction(
  action: AllowedAction,
  body: CustomerItemUpdateRequest,
): Promise<CustomerItemRecord> {
  return callAction(action, 'update', body as Record<string, unknown>, 'mes10-ci-update')
}

export async function deactivateCustomerItemViaAction(
  action: AllowedAction,
): Promise<CustomerItemRecord> {
  return callAction(action, 'deactivate', undefined, 'mes10-ci-deactivate')
}

export async function listCustomerOrders(
  query: ReferenceListQuery = {},
): Promise<CustomerOrderListPage> {
  const { data } = await httpClient.get('/api/mes/customer-orders', { params: query })
  return normalizePage<CustomerOrderRecord>(data)
}

export async function getCustomerOrder(code: string): Promise<CustomerOrderRecord> {
  const c = code.trim()
  if (!c) throw new ApiError('VALIDATION_ERROR', 'customer_order_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/customer-orders/${encodeURIComponent(c)}`)
  return unwrapSuccessData<CustomerOrderRecord>(data)
}

export async function createCustomerOrder(
  body: CustomerOrderCreateRequest,
): Promise<CustomerOrderRecord> {
  const { data } = await httpClient.post('/api/mes/customer-orders', body, {
    headers: { 'Idempotency-Key': newIdempotencyKey('mes10-co-create') },
  })
  return unwrapSuccessData<CustomerOrderRecord>(data)
}

export async function updateCustomerOrderViaAction(
  action: AllowedAction,
  body: CustomerOrderUpdateRequest,
): Promise<CustomerOrderRecord> {
  return callAction(action, 'update', body as Record<string, unknown>, 'mes10-co-update')
}

export async function confirmCustomerOrderViaAction(
  action: AllowedAction,
): Promise<CustomerOrderRecord> {
  return callAction(action, 'confirm', undefined, 'mes10-co-confirm')
}

export async function cancelCustomerOrderViaAction(
  action: AllowedAction,
  reason: string,
): Promise<CustomerOrderRecord> {
  return callAction(action, 'cancel', { reason }, 'mes10-co-cancel')
}

export async function closeCustomerOrderViaAction(
  action: AllowedAction,
): Promise<CustomerOrderRecord> {
  return callAction(action, 'close', undefined, 'mes10-co-close')
}

export async function listItemOptions(query: ReferenceListQuery = {}): Promise<ItemLookupRecord[]> {
  const { data } = await httpClient.get('/api/mes/items', { params: { limit: 200, ...query } })
  return unwrapItems<ItemLookupRecord>(data)
}

/** MES10-018 */
export async function listShipments(query: ReferenceListQuery = {}): Promise<ShipmentListPage> {
  const { data } = await httpClient.get('/api/mes/shipments', { params: query })
  return normalizePage<ShipmentRecord>(data)
}

/** MES10-019 */
export async function getShipment(code: string): Promise<ShipmentRecord> {
  const c = code.trim()
  if (!c) throw new ApiError('VALIDATION_ERROR', 'shipment_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/shipments/${encodeURIComponent(c)}`)
  return unwrapSuccessData<ShipmentRecord>(data)
}

/** MES10-020 */
export async function createShipment(body: ShipmentCreateRequest): Promise<ShipmentRecord> {
  const { data } = await httpClient.post('/api/mes/shipments', body, {
    headers: { 'Idempotency-Key': newIdempotencyKey('mes10-shipment-create') },
  })
  return unwrapSuccessData<ShipmentRecord>(data)
}

export async function updateShipmentViaAction(
  action: AllowedAction,
  body: ShipmentUpdateRequest,
): Promise<ShipmentRecord> {
  return callAction(action, 'update', body as Record<string, unknown>, 'mes10-shipment-update')
}

export async function addShipmentLineViaAction(
  action: AllowedAction,
  body: ShipmentLineCreateRequest,
): Promise<ShipmentRecord> {
  return callAction(action, 'add-line', body as unknown as Record<string, unknown>, 'mes10-ship-line-add')
}

export async function removeShipmentLineViaAction(action: AllowedAction): Promise<ShipmentRecord> {
  return callAction(action, 'remove-line', undefined, 'mes10-ship-line-remove')
}

export async function cancelShipmentViaAction(action: AllowedAction): Promise<ShipmentRecord> {
  return callAction(action, 'cancel', undefined, 'mes10-shipment-cancel')
}

export async function shipShipmentViaAction(action: AllowedAction): Promise<ShipmentRecord> {
  return callAction(action, 'ship', undefined, 'mes10-shipment-ship')
}

export async function deliverShipmentViaAction(
  action: AllowedAction,
  deliveredAt: string,
): Promise<ShipmentRecord> {
  return callAction(action, 'deliver', { delivered_at: deliveredAt }, 'mes10-shipment-deliver')
}

export async function acceptShipmentViaAction(
  action: AllowedAction,
  acknowledgedAt: string,
): Promise<ShipmentRecord> {
  return callAction(action, 'accept', { acknowledged_at: acknowledgedAt }, 'mes10-shipment-accept')
}

export async function failShipmentViaAction(
  action: AllowedAction,
  reason: string,
): Promise<ShipmentRecord> {
  return callAction(action, 'fail', { reason }, 'mes10-shipment-fail')
}

export async function generateCocViaAction(action: AllowedAction): Promise<AsyncJobReference> {
  return callAction(action, 'coc-generate', undefined, 'mes10-coc-generate')
}

export async function signCocViaAction(
  action: AllowedAction,
  fileId: number,
): Promise<ShipmentRecord> {
  return callAction(action, 'coc-sign', { file_id: fileId }, 'mes10-coc-sign')
}

export async function downloadCocViaAction(action: AllowedAction): Promise<CocDownloadResponse> {
  assertActionHref(action, 'coc-download')
  const { data } = await httpClient.request({
    method: action.method || 'GET',
    url: action.href,
  })
  return unwrapSuccessData<CocDownloadResponse>(data)
}
