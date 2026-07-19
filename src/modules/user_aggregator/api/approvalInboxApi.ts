import { httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

export type ApprovalItem = {
  approval_key: string
  source_module: string
  source_entity_type: string
  source_entity_code: string
  source_version: string
  title: string
  requested_at: string
  allowed_actions: string[]
}

export type SearchResultItem = {
  result_type: string
  source_module: string
  business_code: string
  label: string
  route: string
}

export type CursorPage<T> = {
  items: T[]
  page: { limit: number; has_more: boolean; next_cursor: string | null }
}

function parsePage<T>(payload: Record<string, unknown>): CursorPage<T> {
  const page = (payload.page ?? {}) as Record<string, unknown>
  return {
    items: Array.isArray(payload.items) ? (payload.items as T[]) : [],
    page: {
      limit: typeof page.limit === 'number' ? page.limit : 50,
      has_more: Boolean(page.has_more),
      next_cursor: typeof page.next_cursor === 'string' ? page.next_cursor : null,
    },
  }
}

export async function listApprovalInbox(
  query: { q?: string; cursor?: string; limit?: number; sort?: string } = {},
): Promise<CursorPage<ApprovalItem>> {
  const { data } = await httpClient.get('/api/shared/approval-inbox', { params: query })
  return parsePage<ApprovalItem>(unwrapSuccessData<Record<string, unknown>>(data))
}

export async function decideApproval(
  approvalKey: string,
  body: { decision: 'APPROVE' | 'REJECT'; reason: string; source_version: string },
  idempotencyKey = newIdempotencyKey('shared01d-decide'),
): Promise<ApprovalItem | null> {
  const trimmed = approvalKey.trim()
  const { data } = await httpClient.post(
    `/api/shared/approval-inbox/${encodeURIComponent(trimmed)}:decide`,
    body,
    { headers: { 'Idempotency-Key': idempotencyKey } },
  )
  const payload = unwrapSuccessData<{ item?: ApprovalItem | null }>(data)
  return payload.item ?? null
}

export async function globalSearch(
  query: { q: string; cursor?: string; limit?: number; sort?: string },
): Promise<CursorPage<SearchResultItem>> {
  const { data } = await httpClient.get('/api/shared/search', { params: query })
  return parsePage<SearchResultItem>(unwrapSuccessData<Record<string, unknown>>(data))
}
