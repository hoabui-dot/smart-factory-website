import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import { projectDocumentTypeLookups } from '../lib/documentProjection'
import type {
  AllowedAction,
  CustomerLookupRecord,
  DocumentCreateRequest,
  DocumentListPage,
  DocumentListQuery,
  DocumentRecord,
  DocumentRevisionCreateRequest,
  DocumentRevisionListPage,
  DocumentRevisionRecord,
  DocumentTypeLookup,
  DocumentUpdateRequest,
  ItemLookupRecord,
  PpapCreateRequest,
  PpapListPage,
  PpapListQuery,
  PpapSubmissionRecord,
  PpapUpdateRequest,
  ReasonRequest,
  ReferenceListQuery,
  ReleaseRevisionRequest,
} from '../types/document'

function normalizePage<T>(raw: unknown): { items: T[]; page: DocumentListPage['page'] } {
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

/** QMS04-001 */
export async function listDocuments(query: DocumentListQuery = {}): Promise<DocumentListPage> {
  const { data } = await httpClient.get('/api/qms/documents', { params: query })
  return normalizePage<DocumentRecord>(data)
}

/** QMS04-002 */
export async function getDocument(code: string): Promise<DocumentRecord> {
  const c = code.trim()
  if (!c) throw new ApiError('VALIDATION_ERROR', 'document_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/qms/documents/${encodeURIComponent(c)}`)
  return unwrapSuccessData<DocumentRecord>(data)
}

/** QMS04-003 — create always shown; server enforces permission. */
export async function createDocument(body: DocumentCreateRequest): Promise<DocumentRecord> {
  const { data } = await httpClient.post('/api/qms/documents', body, {
    headers: { 'Idempotency-Key': newIdempotencyKey('qms04-doc-create') },
  })
  return unwrapSuccessData<DocumentRecord>(data)
}

/** QMS04-004 — only via server-issued allowed_actions[].href */
export async function updateDocumentViaAction(
  action: AllowedAction,
  body: DocumentUpdateRequest,
): Promise<DocumentRecord> {
  return callAction(action, 'update', body as Record<string, unknown>, 'qms04-doc-update')
}

/** QMS04-005 */
export async function deactivateDocumentViaAction(action: AllowedAction): Promise<DocumentRecord> {
  return callAction(action, 'deactivate', undefined, 'qms04-doc-deactivate')
}

/** QMS04-006 */
export async function listDocumentRevisions(
  documentCode: string,
  query: ReferenceListQuery = {},
): Promise<DocumentRevisionListPage> {
  const c = documentCode.trim()
  if (!c) throw new ApiError('VALIDATION_ERROR', 'document_code không hợp lệ.', 400)
  const { data } = await httpClient.get(
    `/api/qms/documents/${encodeURIComponent(c)}/revisions`,
    { params: query },
  )
  return normalizePage<DocumentRevisionRecord>(data)
}

/** QMS04-007 */
export async function getDocumentRevision(
  documentCode: string,
  revisionCode: string,
): Promise<DocumentRevisionRecord> {
  const d = documentCode.trim()
  const r = revisionCode.trim()
  if (!d || !r) throw new ApiError('VALIDATION_ERROR', 'revision path không hợp lệ.', 400)
  const { data } = await httpClient.get(
    `/api/qms/documents/${encodeURIComponent(d)}/revisions/${encodeURIComponent(r)}`,
  )
  return unwrapSuccessData<DocumentRevisionRecord>(data)
}

/** QMS04-008 */
export async function createDocumentRevision(
  documentCode: string,
  body: DocumentRevisionCreateRequest,
): Promise<DocumentRevisionRecord> {
  const c = documentCode.trim()
  if (!c) throw new ApiError('VALIDATION_ERROR', 'document_code không hợp lệ.', 400)
  const { data } = await httpClient.post(
    `/api/qms/documents/${encodeURIComponent(c)}/revisions`,
    body,
    { headers: { 'Idempotency-Key': newIdempotencyKey('qms04-rev-create') } },
  )
  return unwrapSuccessData<DocumentRevisionRecord>(data)
}

export async function submitRevisionViaAction(action: AllowedAction): Promise<DocumentRevisionRecord> {
  return callAction(action, 'submit', undefined, 'qms04-rev-submit')
}

export async function releaseRevisionViaAction(
  action: AllowedAction,
  body: ReleaseRevisionRequest,
): Promise<DocumentRevisionRecord> {
  return callAction(action, 'release', body as unknown as Record<string, unknown>, 'qms04-rev-release')
}

export async function rejectRevisionViaAction(
  action: AllowedAction,
  body: ReasonRequest,
): Promise<DocumentRevisionRecord> {
  return callAction(action, 'reject', body as unknown as Record<string, unknown>, 'qms04-rev-reject')
}

export async function obsoleteRevisionViaAction(
  action: AllowedAction,
  body: ReasonRequest,
): Promise<DocumentRevisionRecord> {
  return callAction(action, 'obsolete', body as unknown as Record<string, unknown>, 'qms04-rev-obsolete')
}

/** QMS04-013 */
export async function listPpapSubmissions(query: PpapListQuery = {}): Promise<PpapListPage> {
  const { data } = await httpClient.get('/api/qms/ppap-submissions', { params: query })
  return normalizePage<PpapSubmissionRecord>(data)
}

/** QMS04-014 */
export async function getPpapSubmission(code: string): Promise<PpapSubmissionRecord> {
  const c = code.trim()
  if (!c) throw new ApiError('VALIDATION_ERROR', 'ppap_submission_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/qms/ppap-submissions/${encodeURIComponent(c)}`)
  return unwrapSuccessData<PpapSubmissionRecord>(data)
}

/** QMS04-015 */
export async function createPpapSubmission(body: PpapCreateRequest): Promise<PpapSubmissionRecord> {
  const { data } = await httpClient.post('/api/qms/ppap-submissions', body, {
    headers: { 'Idempotency-Key': newIdempotencyKey('qms04-ppap-create') },
  })
  return unwrapSuccessData<PpapSubmissionRecord>(data)
}

/** QMS04-016 — only via server-issued allowed_actions[].href */
export async function updatePpapViaAction(
  action: AllowedAction,
  body: PpapUpdateRequest,
): Promise<PpapSubmissionRecord> {
  return callAction(action, 'update', body as Record<string, unknown>, 'qms04-ppap-update')
}

export async function preparePpapViaAction(action: AllowedAction): Promise<PpapSubmissionRecord> {
  return callAction(action, 'prepare', undefined, 'qms04-ppap-prepare')
}

export async function submitPpapViaAction(action: AllowedAction): Promise<PpapSubmissionRecord> {
  return callAction(action, 'submit', undefined, 'qms04-ppap-submit')
}

export async function customerReviewPpapViaAction(
  action: AllowedAction,
): Promise<PpapSubmissionRecord> {
  return callAction(action, 'customer-review', undefined, 'qms04-ppap-review')
}

export async function approvePpapViaAction(action: AllowedAction): Promise<PpapSubmissionRecord> {
  return callAction(action, 'approve', undefined, 'qms04-ppap-approve')
}

export async function interimApprovePpapViaAction(
  action: AllowedAction,
): Promise<PpapSubmissionRecord> {
  return callAction(action, 'interim-approve', undefined, 'qms04-ppap-interim')
}

export async function rejectPpapViaAction(action: AllowedAction): Promise<PpapSubmissionRecord> {
  return callAction(action, 'reject', undefined, 'qms04-ppap-reject')
}

/** SHARED01-009 document_type REFDATA — id encoded in row_version. */
export async function listDocumentTypes(
  query: ReferenceListQuery = {},
): Promise<DocumentTypeLookup[]> {
  const { data } = await httpClient.get('/api/shared/reference-data/document_type', {
    params: { limit: 200, ...query },
  })
  const rows = unwrapItems<{ code: string; label: string; is_active: boolean; row_version: string }>(
    data,
  )
  return projectDocumentTypeLookups(rows)
}

export async function listItemOptions(query: ReferenceListQuery = {}): Promise<ItemLookupRecord[]> {
  const { data } = await httpClient.get('/api/mes/items', { params: { limit: 200, ...query } })
  return unwrapItems<ItemLookupRecord>(data)
}

export async function listCustomerOptions(
  query: ReferenceListQuery = {},
): Promise<CustomerLookupRecord[]> {
  const { data } = await httpClient.get('/api/mes/customers', { params: { limit: 200, ...query } })
  return unwrapItems<CustomerLookupRecord>(data)
}
