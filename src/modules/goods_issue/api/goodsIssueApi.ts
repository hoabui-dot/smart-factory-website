import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  GoodsIssueListPage,
  GoodsIssueRecord,
  ListQuery,
  MaterialRequestListPage,
  MaterialRequestRecord,
  ReasonRequest,
} from '../types/goodsIssue'

function normalizePage<T>(raw: unknown): { items: T[]; page: MaterialRequestListPage['page'] } {
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

/** WMS04-001 */
export async function listMaterialRequests(
  query: ListQuery = {},
): Promise<MaterialRequestListPage> {
  const { data } = await httpClient.get('/api/wms/material-requests', { params: query })
  return normalizePage<MaterialRequestRecord>(data)
}

/** WMS04-002 */
export async function getMaterialRequest(code: string): Promise<MaterialRequestRecord> {
  const trimmed = code.trim()
  if (!trimmed) throw new ApiError('VALIDATION_ERROR', 'material_request_code không hợp lệ.', 400)
  const { data } = await httpClient.get(
    `/api/wms/material-requests/${encodeURIComponent(trimmed)}`,
  )
  return unwrapSuccessData<MaterialRequestRecord>(data)
}

/** WMS04-007 — only via server-issued allowed_actions href; reason required by BE. */
export async function cancelMaterialRequestViaAction(
  action: AllowedAction,
  body: ReasonRequest,
): Promise<MaterialRequestRecord> {
  return callAction<MaterialRequestRecord>(
    action,
    'cancel',
    { reason: body.reason },
    'wms04-mr-cancel',
  )
}

/** WMS04-008 */
export async function listGoodsIssues(query: ListQuery = {}): Promise<GoodsIssueListPage> {
  const { data } = await httpClient.get('/api/wms/goods-issues', { params: query })
  return normalizePage<GoodsIssueRecord>(data)
}

/** WMS04-009 */
export async function getGoodsIssue(code: string): Promise<GoodsIssueRecord> {
  const trimmed = code.trim()
  if (!trimmed) {
    throw new ApiError('VALIDATION_ERROR', 'stock_transaction_header_code không hợp lệ.', 400)
  }
  const { data } = await httpClient.get(`/api/wms/goods-issues/${encodeURIComponent(trimmed)}`)
  return unwrapSuccessData<GoodsIssueRecord>(data)
}

/** WMS04-010 — only via server-issued allowed_actions href. */
export async function approveGoodsIssueViaAction(
  action: AllowedAction,
): Promise<GoodsIssueRecord> {
  return callAction<GoodsIssueRecord>(action, 'approve', undefined, 'wms04-gi-approve')
}

/** WMS04-011 — only via server-issued allowed_actions href; reason required by BE. */
export async function rejectGoodsIssueViaAction(
  action: AllowedAction,
  body: ReasonRequest,
): Promise<GoodsIssueRecord> {
  return callAction<GoodsIssueRecord>(
    action,
    'reject',
    { reason: body.reason },
    'wms04-gi-reject',
  )
}
