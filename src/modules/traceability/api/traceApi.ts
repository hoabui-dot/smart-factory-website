import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  AsyncJobReference,
  GenealogyRecord,
  TraceExportRequest,
  TraceGraphRecord,
  TraceRootRef,
  TraceSearchPage,
} from '../types/traceability'

function normalizePage(raw: unknown): TraceSearchPage {
  const data = unwrapSuccessData<Record<string, unknown>>(raw as Record<string, unknown>)
  const page = (data.page ?? {}) as Record<string, unknown>
  return {
    items: Array.isArray(data.items) ? (data.items as TraceRootRef[]) : [],
    page: {
      limit: typeof page.limit === 'number' ? page.limit : 20,
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

/** MES07-001 */
export async function searchTraceRoots(query: {
  q?: string
  cursor?: string
  limit?: number
}): Promise<TraceSearchPage> {
  const { data } = await httpClient.get('/api/mes/traceability/search', { params: query })
  return normalizePage(data)
}

/** MES07-002 */
export async function getLotTraceGraph(lotCode: string): Promise<TraceGraphRecord> {
  const c = lotCode.trim()
  if (!c) throw new ApiError('VALIDATION_ERROR', 'lot_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/traceability/lots/${encodeURIComponent(c)}`)
  return unwrapSuccessData<TraceGraphRecord>(data)
}

/** MES07-003 */
export async function getSerialTraceGraph(serialCode: string): Promise<TraceGraphRecord> {
  const c = serialCode.trim()
  if (!c) throw new ApiError('VALIDATION_ERROR', 'serial_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/traceability/serials/${encodeURIComponent(c)}`)
  return unwrapSuccessData<TraceGraphRecord>(data)
}

/** MES07-004 */
export async function getWorkOrderTraceGraph(workOrderCode: string): Promise<TraceGraphRecord> {
  const c = workOrderCode.trim()
  if (!c) throw new ApiError('VALIDATION_ERROR', 'work_order_code không hợp lệ.', 400)
  const { data } = await httpClient.get(
    `/api/mes/traceability/work-orders/${encodeURIComponent(c)}`,
  )
  return unwrapSuccessData<TraceGraphRecord>(data)
}

/** MES07-005 — only via server-issued allowed_actions[].href */
export async function getForwardImpactViaAction(action: AllowedAction): Promise<TraceGraphRecord> {
  assertActionHref(action, 'forward_impact')
  const { data } = await httpClient.request({
    method: action.method || 'GET',
    url: action.href,
  })
  return unwrapSuccessData<TraceGraphRecord>(data)
}

/** MES07-006 — only via server-issued allowed_actions[].href */
export async function requestTraceExportViaAction(
  action: AllowedAction,
  body: TraceExportRequest,
): Promise<AsyncJobReference> {
  assertActionHref(action, 'export')
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': newIdempotencyKey('mes07-trace-export') },
  })
  return unwrapSuccessData<AsyncJobReference>(data)
}

/** MES06-004 supporting genealogy presentation */
export async function getLotGenealogy(lotCode: string): Promise<GenealogyRecord> {
  const c = lotCode.trim()
  if (!c) throw new ApiError('VALIDATION_ERROR', 'lot_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/lots/${encodeURIComponent(c)}/genealogy`)
  return unwrapSuccessData<GenealogyRecord>(data)
}

export function loadGraphForSearchHit(hit: TraceRootRef): Promise<TraceGraphRecord> {
  switch (hit.root_type.toUpperCase()) {
    case 'LOT':
      return getLotTraceGraph(hit.root_code)
    case 'SERIAL':
      return getSerialTraceGraph(hit.root_code)
    case 'WORK_ORDER':
      return getWorkOrderTraceGraph(hit.root_code)
    default:
      throw new ApiError('VALIDATION_ERROR', `root_type ${hit.root_type} không hỗ trợ.`, 400)
  }
}
