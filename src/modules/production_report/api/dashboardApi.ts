import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  DashboardFilter,
  DowntimeListPage,
  DowntimeLogRecord,
  DowntimeUpdateRequest,
  ExportJobRef,
  KpiSeriesResponse,
  ListQuery,
  ProductionDashboard,
} from '../types/dashboard'

function normalizePage<T>(raw: unknown): { items: T[]; page: DowntimeListPage['page'] } {
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

function cleanParams(filter: DashboardFilter): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(filter)) {
    if (v != null && String(v).trim() !== '') out[k] = String(v)
  }
  return out
}

/** MES08-001 */
export async function getProductionDashboard(
  filter: DashboardFilter = {},
): Promise<ProductionDashboard> {
  const { data } = await httpClient.get('/api/mes/dashboards/production', {
    params: cleanParams(filter),
  })
  return unwrapSuccessData<ProductionDashboard>(data)
}

/** MES08-002 */
export async function getKpiSeries(
  kpiCode: string,
  filter: DashboardFilter = {},
): Promise<KpiSeriesResponse> {
  const code = kpiCode.trim()
  if (!code) throw new ApiError('VALIDATION_ERROR', 'kpi_code không hợp lệ.', 400)
  const { data } = await httpClient.get(
    `/api/mes/dashboards/kpis/${encodeURIComponent(code)}`,
    { params: cleanParams(filter) },
  )
  return unwrapSuccessData<KpiSeriesResponse>(data)
}

/** MES08-003 */
export async function listDowntimeLogs(query: ListQuery = {}): Promise<DowntimeListPage> {
  const { data } = await httpClient.get('/api/mes/downtime-logs', { params: query })
  return normalizePage<DowntimeLogRecord>(data)
}

/** MES08-004 */
export async function getDowntimeLog(code: string): Promise<DowntimeLogRecord> {
  const trimmed = code.trim()
  if (!trimmed) throw new ApiError('VALIDATION_ERROR', 'downtime_log_code không hợp lệ.', 400)
  const { data } = await httpClient.get(
    `/api/mes/downtime-logs/${encodeURIComponent(trimmed)}`,
  )
  return unwrapSuccessData<DowntimeLogRecord>(data)
}

/** MES08-006 — only via server-issued allowed_actions href. */
export async function updateDowntimeViaAction(
  action: AllowedAction,
  body: DowntimeUpdateRequest,
): Promise<DowntimeLogRecord> {
  if (!action.href.startsWith('/api/')) {
    throw new ApiError('VALIDATION_ERROR', 'update href không hợp lệ.', 400)
  }
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
  })
  return unwrapSuccessData<DowntimeLogRecord>(data)
}

/** MES08-007 — only via server-issued allowed_actions href. */
export async function requestProductionExportViaAction(
  action: AllowedAction,
  params: Record<string, unknown> = {},
  idempotencyKey?: string,
): Promise<ExportJobRef> {
  if (!action.href.startsWith('/api/')) {
    throw new ApiError('VALIDATION_ERROR', 'export href không hợp lệ.', 400)
  }
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    data: { params },
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes08-export'),
    },
  })
  const payload = unwrapSuccessData<Record<string, unknown>>(data)
  const job = (payload.job ?? payload) as ExportJobRef
  if (!job?.code) {
    throw new ApiError('VALIDATION_ERROR', 'export job thiếu code.', 500)
  }
  return job
}
