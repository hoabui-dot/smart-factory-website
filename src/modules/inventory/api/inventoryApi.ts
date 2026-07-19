import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  CreateStocktakeRequest,
  ListPage,
  ListQuery,
  StockBalanceRecord,
  StockTransactionRecord,
  StocktakeRecord,
  TransferLineRequest,
  VarianceReviewRequest,
} from '../types/inventory'

function normalizePage<T>(raw: unknown): ListPage<T> {
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

function assertAction(action: AllowedAction, expected: string): void {
  if (action.action !== expected || !action.enabled || !action.href.startsWith('/api/')) {
    throw new ApiError('PERMISSION_DENIED', `${expected} không được server cho phép.`, 403)
  }
}

async function callAction(
  action: AllowedAction,
  expected: string,
  body?: Record<string, unknown>,
): Promise<StocktakeRecord> {
  assertAction(action, expected)
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': newIdempotencyKey(`wms05-${expected}`) },
  })
  return unwrapSuccessData<StocktakeRecord>(data)
}

export async function listBalances(query: ListQuery = {}): Promise<ListPage<StockBalanceRecord>> {
  const { data } = await httpClient.get('/api/wms/inventory/balances', { params: query })
  return normalizePage<StockBalanceRecord>(data)
}

export async function listInventoryLots(query: ListQuery = {}): Promise<ListPage<StockBalanceRecord>> {
  const { data } = await httpClient.get('/api/wms/inventory/lots', { params: query })
  return normalizePage<StockBalanceRecord>(data)
}

export async function listStockTransactions(query: ListQuery = {}): Promise<ListPage<StockTransactionRecord>> {
  const { data } = await httpClient.get('/api/wms/stock-transactions', { params: query })
  return normalizePage<StockTransactionRecord>(data)
}

export async function getStockTransaction(code: string): Promise<StockTransactionRecord> {
  const trimmed = code.trim()
  if (!trimmed) throw new ApiError('VALIDATION_ERROR', 'Mã giao dịch không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/wms/stock-transactions/${encodeURIComponent(trimmed)}`)
  return unwrapSuccessData<StockTransactionRecord>(data)
}

export async function createTransfer(lines: TransferLineRequest[]): Promise<StockTransactionRecord> {
  const { data } = await httpClient.post('/api/wms/transfers', { lines }, {
    headers: { 'Idempotency-Key': newIdempotencyKey('wms05-transfer') },
  })
  return unwrapSuccessData<StockTransactionRecord>(data)
}

export async function listStocktakes(query: ListQuery = {}): Promise<ListPage<StocktakeRecord>> {
  const { data } = await httpClient.get('/api/wms/stocktakes', { params: query })
  return normalizePage<StocktakeRecord>(data)
}

export async function getStocktake(code: string): Promise<StocktakeRecord> {
  const trimmed = code.trim()
  if (!trimmed) throw new ApiError('VALIDATION_ERROR', 'Mã stocktake không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/wms/stocktakes/${encodeURIComponent(trimmed)}`)
  return unwrapSuccessData<StocktakeRecord>(data)
}

export async function createStocktake(body: CreateStocktakeRequest): Promise<StocktakeRecord> {
  const { data } = await httpClient.post('/api/wms/stocktakes', body, {
    headers: { 'Idempotency-Key': newIdempotencyKey('wms05-stocktake-create') },
  })
  return unwrapSuccessData<StocktakeRecord>(data)
}

export const startStocktake = (action: AllowedAction) => callAction(action, 'start')
export const retryStocktakeAdjustment = (action: AllowedAction) => callAction(action, 'retry_adjustment')
export const cancelStocktake = (action: AllowedAction, reason: string) =>
  callAction(action, 'cancel', { reason })
export const requestStocktakeAdjustment = (action: AllowedAction, reviews: VarianceReviewRequest[]) =>
  callAction(action, 'request_adjustment', { reviews })

async function createExport(url: string, prefix: string, params: Record<string, unknown> = {}): Promise<void> {
  await httpClient.post(url, { params }, {
    headers: { 'Idempotency-Key': newIdempotencyKey(prefix) },
  })
}

export const exportInventoryByLot = () =>
  createExport('/api/wms/inventory/lots/exports/INVENTORY_BY_LOT_EXPORT', 'wms05-inventory-export')
export const exportStocktakes = (params: Record<string, unknown>) =>
  createExport('/api/wms/stocktakes/exports/STOCKTAKE_EXPORT', 'wms05-stocktake-export', params)
