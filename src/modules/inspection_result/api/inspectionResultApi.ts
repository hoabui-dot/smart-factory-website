import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  InspectionListPage,
  InspectionResultRecord,
  InspectionVoidRequest,
  ListQuery,
  SpcDataRecord,
  SpcListPage,
} from '../types/inspectionResult'

function normalizePage<T>(raw: unknown): { items: T[]; page: InspectionListPage['page'] } {
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

/** QMS02-001 */
export async function listInspectionResults(query: ListQuery = {}): Promise<InspectionListPage> {
  const { data } = await httpClient.get('/api/qms/inspection-results', { params: query })
  return normalizePage<InspectionResultRecord>(data)
}

/** QMS02-002 */
export async function getInspectionResult(code: string): Promise<InspectionResultRecord> {
  const trimmed = code.trim()
  if (!trimmed) throw new ApiError('VALIDATION_ERROR', 'inspection_result_code không hợp lệ.', 400)
  const { data } = await httpClient.get(
    `/api/qms/inspection-results/${encodeURIComponent(trimmed)}`,
  )
  return unwrapSuccessData<InspectionResultRecord>(data)
}

/** QMS02-009 — only via server-issued allowed_actions href; requires void_reason. */
export async function voidInspectionViaAction(
  action: AllowedAction,
  body: InspectionVoidRequest,
  idempotencyKey?: string,
): Promise<InspectionResultRecord> {
  if (!action.href.startsWith('/api/')) {
    throw new ApiError('VALIDATION_ERROR', 'void href không hợp lệ.', 400)
  }
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    data: body,
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('qms02-void'),
    },
  })
  return unwrapSuccessData<InspectionResultRecord>(data)
}

/** QMS02-010 */
export async function listSpcData(query: ListQuery = {}): Promise<SpcListPage> {
  const { data } = await httpClient.get('/api/qms/spc-data', { params: query })
  return normalizePage<SpcDataRecord>(data)
}
