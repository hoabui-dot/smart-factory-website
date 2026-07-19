import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  ListQuery,
  ProductionLogListPage,
  ProductionLogRecord,
  ProductionVoidRequest,
} from '../types/productionLog'

function normalizePage<T>(raw: unknown): { items: T[]; page: ProductionLogListPage['page'] } {
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

/** MES05-001 */
export async function listProductionLogs(query: ListQuery = {}): Promise<ProductionLogListPage> {
  const { data } = await httpClient.get('/api/mes/production-logs', { params: query })
  return normalizePage<ProductionLogRecord>(data)
}

/** MES05-002 */
export async function getProductionLog(code: string): Promise<ProductionLogRecord> {
  const trimmed = code.trim()
  if (!trimmed) throw new ApiError('VALIDATION_ERROR', 'production_log_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/production-logs/${encodeURIComponent(trimmed)}`)
  return unwrapSuccessData<ProductionLogRecord>(data)
}

/** MES05-008 — only via server-issued allowed_actions href; requires void_reason >= 10. */
export async function voidProductionLogViaAction(
  action: AllowedAction,
  body: ProductionVoidRequest,
  idempotencyKey?: string,
): Promise<ProductionLogRecord> {
  if (!action.href.startsWith('/api/')) {
    throw new ApiError('VALIDATION_ERROR', 'void href không hợp lệ.', 400)
  }
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    data: body,
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes05-void'),
    },
  })
  return unwrapSuccessData<ProductionLogRecord>(data)
}
