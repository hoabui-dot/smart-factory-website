import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  ChangeApprovalRecord,
  ChangeRequestCreateRequest,
  ChangeRequestListPage,
  ChangeRequestRecord,
  ChangeRequestUpdateRequest,
  ImplementLinkInput,
  ListQuery,
} from '../types/changeRequest'

function normalizePage<T>(raw: unknown): { items: T[]; page: ChangeRequestListPage['page'] } {
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

async function callAction(
  action: AllowedAction,
  body?: unknown,
  idempotencyPrefix = 'mes11',
): Promise<ChangeRequestRecord> {
  if (!action.href.startsWith('/api/')) {
    throw new ApiError('VALIDATION_ERROR', 'href không hợp lệ.', 400)
  }
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    data: body,
    headers:
      action.method === 'POST'
        ? { 'Idempotency-Key': newIdempotencyKey(idempotencyPrefix) }
        : undefined,
  })
  return unwrapSuccessData<ChangeRequestRecord>(data)
}

export async function listChangeRequests(query: ListQuery = {}): Promise<ChangeRequestListPage> {
  const { data } = await httpClient.get('/api/mes/change-requests', { params: query })
  return normalizePage<ChangeRequestRecord>(data)
}

export async function getChangeRequest(code: string): Promise<ChangeRequestRecord> {
  const trimmed = code.trim()
  if (!trimmed) throw new ApiError('VALIDATION_ERROR', 'change_request_code không hợp lệ.', 400)
  const { data } = await httpClient.get(
    `/api/mes/change-requests/${encodeURIComponent(trimmed)}`,
  )
  return unwrapSuccessData<ChangeRequestRecord>(data)
}

export async function createChangeRequest(
  body: ChangeRequestCreateRequest,
): Promise<ChangeRequestRecord> {
  const { data } = await httpClient.post('/api/mes/change-requests', body, {
    headers: { 'Idempotency-Key': newIdempotencyKey('mes11-create') },
  })
  return unwrapSuccessData<ChangeRequestRecord>(data)
}

export async function updateChangeRequestViaAction(
  action: AllowedAction,
  body: ChangeRequestUpdateRequest,
): Promise<ChangeRequestRecord> {
  return callAction(action, body, 'mes11-update')
}

export async function lifecycleViaAction(
  action: AllowedAction,
  body?: unknown,
): Promise<ChangeRequestRecord> {
  return callAction(action, body, 'mes11-lifecycle')
}

export async function listApprovals(code: string): Promise<ChangeApprovalRecord[]> {
  const trimmed = code.trim()
  const { data } = await httpClient.get(
    `/api/mes/change-requests/${encodeURIComponent(trimmed)}/approvals`,
  )
  const payload = unwrapSuccessData<Record<string, unknown>>(data)
  return Array.isArray(payload.items) ? (payload.items as ChangeApprovalRecord[]) : []
}

export type { ImplementLinkInput }
