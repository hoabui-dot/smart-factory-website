import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  CapaCreateRequest,
  CapaListPage,
  CapaListQuery,
  CapaRecord,
  CapaUpdateRequest,
  CloseRequest,
  ContainRequest,
  DefectLookupRecord,
  ItemLookupRecord,
  NcrCreateRequest,
  NcrListPage,
  NcrListQuery,
  NcrRecord,
  NcrUpdateRequest,
  ReferenceListQuery,
  VoidRequest,
} from '../types/ncr'

function normalizePage<T>(raw: unknown): { items: T[]; page: NcrListPage['page'] } {
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

async function callAction<TResult>(
  action: AllowedAction,
  kind: string,
  body: Record<string, unknown> | undefined,
  idempotencyPrefix: string,
  idempotencyKey?: string,
): Promise<TResult> {
  assertActionHref(action, kind)
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey(idempotencyPrefix) },
  })
  return unwrapSuccessData<TResult>(data)
}

/** QMS03-001 GET /api/qms/ncr */
export async function listNcrs(query: NcrListQuery = {}): Promise<NcrListPage> {
  const { data } = await httpClient.get('/api/qms/ncr', { params: query })
  return normalizePage<NcrRecord>(data)
}

/** QMS03-002 GET /api/qms/ncr/{code} */
export async function getNcr(code: string): Promise<NcrRecord> {
  const c = code.trim()
  if (!c) throw new ApiError('VALIDATION_ERROR', 'non_conformance_report_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/qms/ncr/${encodeURIComponent(c)}`)
  return unwrapSuccessData<NcrRecord>(data)
}

/** QMS03-003 POST /api/qms/ncr — create form always shown; server enforces permission. */
export async function createNcr(
  body: NcrCreateRequest,
  idempotencyKey?: string,
): Promise<NcrRecord> {
  const { data } = await httpClient.post('/api/qms/ncr', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('qms03-ncr-create') },
  })
  return unwrapSuccessData<NcrRecord>(data)
}

/** QMS03-004 PATCH — only via server-issued allowed_actions[].href */
export async function updateNcrViaAction(
  action: AllowedAction,
  body: NcrUpdateRequest,
  idempotencyKey?: string,
): Promise<NcrRecord> {
  return callAction(action, 'update', body as Record<string, unknown>, 'qms03-ncr-update', idempotencyKey)
}

export async function startInvestigationViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<NcrRecord> {
  return callAction(action, 'start_investigation', undefined, 'qms03-ncr-start-inv', idempotencyKey)
}

export async function containNcrViaAction(
  action: AllowedAction,
  body: ContainRequest,
  idempotencyKey?: string,
): Promise<NcrRecord> {
  return callAction(action, 'contain', body as unknown as Record<string, unknown>, 'qms03-ncr-contain', idempotencyKey)
}

export async function startCapaViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<NcrRecord> {
  return callAction(action, 'start_capa', undefined, 'qms03-ncr-start-capa', idempotencyKey)
}

export async function closeNcrViaAction(
  action: AllowedAction,
  body: CloseRequest,
  idempotencyKey?: string,
): Promise<NcrRecord> {
  return callAction(action, 'close', body as unknown as Record<string, unknown>, 'qms03-ncr-close', idempotencyKey)
}

export async function voidNcrViaAction(
  action: AllowedAction,
  body: VoidRequest,
  idempotencyKey?: string,
): Promise<NcrRecord> {
  return callAction(action, 'void', body as unknown as Record<string, unknown>, 'qms03-ncr-void', idempotencyKey)
}

/** QMS03-010 GET /api/qms/capas */
export async function listCapas(query: CapaListQuery = {}): Promise<CapaListPage> {
  const { data } = await httpClient.get('/api/qms/capas', { params: query })
  return normalizePage<CapaRecord>(data)
}

/** QMS03-011 GET /api/qms/capas/{code} */
export async function getCapa(code: string): Promise<CapaRecord> {
  const c = code.trim()
  if (!c) throw new ApiError('VALIDATION_ERROR', 'corrective_preventive_action_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/qms/capas/${encodeURIComponent(c)}`)
  return unwrapSuccessData<CapaRecord>(data)
}

/** QMS03-012 POST /api/qms/capas */
export async function createCapa(
  body: CapaCreateRequest,
  idempotencyKey?: string,
): Promise<CapaRecord> {
  const { data } = await httpClient.post('/api/qms/capas', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('qms03-capa-create') },
  })
  return unwrapSuccessData<CapaRecord>(data)
}

/** QMS03-013 PATCH — only via server-issued allowed_actions[].href */
export async function updateCapaViaAction(
  action: AllowedAction,
  body: CapaUpdateRequest,
  idempotencyKey?: string,
): Promise<CapaRecord> {
  return callAction(action, 'update', body as Record<string, unknown>, 'qms03-capa-update', idempotencyKey)
}

/** MES-01 item lookup for create item_code selector. */
export async function listItemOptions(query: ReferenceListQuery = {}): Promise<ItemLookupRecord[]> {
  const { data } = await httpClient.get('/api/mes/items', { params: { limit: 200, ...query } })
  return unwrapItems<ItemLookupRecord>(data)
}

/** QMS01-013 defect_code lookup for create defect_code selector. */
export async function listDefectOptions(
  query: ReferenceListQuery = {},
): Promise<DefectLookupRecord[]> {
  const { data } = await httpClient.get('/api/qms/defect-codes', { params: { limit: 200, ...query } })
  return unwrapItems<DefectLookupRecord>(data)
}

/** GET /api/qms/reports/pareto — QMS-03b reporting. */
export async function getParetoReport(query: {
  from?: string
  to?: string
  group_by?: string
  source?: string
}): Promise<import('../types/ncr').ParetoReportRecord> {
  const { data } = await httpClient.get('/api/qms/reports/pareto', { params: query })
  return unwrapSuccessData(data)
}

async function createExport(
  url: string,
  prefix: string,
  params: Record<string, unknown> = {},
): Promise<void> {
  await httpClient.post(
    url,
    { params },
    { headers: { 'Idempotency-Key': newIdempotencyKey(prefix) } },
  )
}

/** POST /api/qms/ncr/exports/NCR_EXPORT */
export async function exportNcrs(): Promise<void> {
  return createExport('/api/qms/ncr/exports/NCR_EXPORT', 'qms03-ncr-export')
}

/** POST /api/qms/reports/pareto/exports/NCR_PARETO */
export async function exportPareto(params: Record<string, unknown>): Promise<void> {
  return createExport('/api/qms/reports/pareto/exports/NCR_PARETO', 'qms03-pareto-export', params)
}
