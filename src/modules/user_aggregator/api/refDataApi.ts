import { httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

export type RefDataRegistryEntry = {
  table_key: string
  source_module: string
  label_field: string
  editable_fields: string[]
  required_fields: string[]
  active_field: string
  capabilities: string[]
}

export type RefDataRow = {
  code: string
  label: string
  is_active: boolean
  fields: Record<string, unknown>
  reference_count?: number
  row_version: string
}

export type RefDataUsageSummary = {
  code: string
  table_key: string
  total_count: number
  usage_groups: { group_label: string; reference_count: number }[]
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

export async function listRefDataRegistry(): Promise<RefDataRegistryEntry[]> {
  const { data } = await httpClient.get('/api/shared/reference-data/registry')
  const payload = unwrapSuccessData<{ items?: RefDataRegistryEntry[] }>(data)
  return Array.isArray(payload.items) ? payload.items : []
}

export async function listRefDataRows(
  tableKey: string,
  query: { q?: string; cursor?: string; limit?: number; include_inactive?: boolean; code?: string } = {},
): Promise<CursorPage<RefDataRow>> {
  const { data } = await httpClient.get(`/api/shared/reference-data/${encodeURIComponent(tableKey)}`, {
    params: {
      q: query.q,
      cursor: query.cursor,
      limit: query.limit,
      include_inactive: query.include_inactive ? 'true' : undefined,
      code: query.code,
    },
  })
  return parsePage<RefDataRow>(unwrapSuccessData<Record<string, unknown>>(data))
}

export async function createRefDataRow(
  tableKey: string,
  body: { code: string; fields: Record<string, unknown>; updated_reason: string },
  idempotencyKey = newIdempotencyKey('shared01e-create'),
): Promise<RefDataRow> {
  const { data } = await httpClient.post(
    `/api/shared/reference-data/${encodeURIComponent(tableKey)}`,
    body,
    { headers: { 'Idempotency-Key': idempotencyKey } },
  )
  const payload = unwrapSuccessData<{ row: RefDataRow }>(data)
  return payload.row
}

export async function updateRefDataRow(
  tableKey: string,
  code: string,
  body: { fields: Record<string, unknown>; updated_reason: string; row_version: string },
  idempotencyKey = newIdempotencyKey('shared01e-update'),
): Promise<RefDataRow> {
  const { data } = await httpClient.patch(
    `/api/shared/reference-data/${encodeURIComponent(tableKey)}/${encodeURIComponent(code)}`,
    body,
    { headers: { 'Idempotency-Key': idempotencyKey } },
  )
  const payload = unwrapSuccessData<{ row: RefDataRow }>(data)
  return payload.row
}

export async function retireRefDataRow(
  tableKey: string,
  code: string,
  body: { updated_reason: string },
  idempotencyKey = newIdempotencyKey('shared01e-retire'),
): Promise<RefDataRow> {
  const { data } = await httpClient.post(
    `/api/shared/reference-data/${encodeURIComponent(tableKey)}/${encodeURIComponent(code)}:retire`,
    body,
    { headers: { 'Idempotency-Key': idempotencyKey } },
  )
  const payload = unwrapSuccessData<{ row: RefDataRow }>(data)
  return payload.row
}

export async function getRefDataUsage(tableKey: string, code: string): Promise<RefDataUsageSummary> {
  const { data } = await httpClient.get(
    `/api/shared/reference-data/${encodeURIComponent(tableKey)}/${encodeURIComponent(code)}/usage`,
  )
  return unwrapSuccessData<RefDataUsageSummary>(data)
}
