import { httpClient, ApiError, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  ActivityEvent,
  AsyncJobReference,
  AuditListPage,
  AuditListQuery,
} from '../types/activityEvent'

function normalizeListPage(raw: unknown): AuditListPage {
  const data = unwrapSuccessData<Record<string, unknown>>(raw as Record<string, unknown>)
  const items = Array.isArray(data.items) ? (data.items as ActivityEvent[]) : []
  const pageRaw = (data.page ?? {}) as Record<string, unknown>
  return {
    items,
    page: {
      limit: typeof pageRaw.limit === 'number' ? pageRaw.limit : 50,
      next_cursor: typeof pageRaw.next_cursor === 'string' ? pageRaw.next_cursor : null,
      has_more: Boolean(pageRaw.has_more),
    },
  }
}

/** NB03-001 GET /api/admin/audit-events */
export async function listAuditEvents(query: AuditListQuery = {}): Promise<AuditListPage> {
  const { data } = await httpClient.get('/api/admin/audit-events', {
    params: {
      limit: query.limit,
      cursor: query.cursor,
      sort: query.sort,
      q: query.q,
    },
  })
  return normalizeListPage(data)
}

/** NB03-002 GET /api/admin/audit-events/{event_id} */
export async function getAuditEvent(eventId: number): Promise<ActivityEvent> {
  if (!Number.isInteger(eventId) || eventId <= 0) {
    throw new ApiError('VALIDATION_ERROR', 'event_id không hợp lệ.', 400)
  }
  const { data } = await httpClient.get(`/api/admin/audit-events/${eventId}`)
  return unwrapSuccessData<ActivityEvent>(data)
}

/** NB03-003 POST /api/admin/audit-events/exports */
export async function requestAuditExport(idempotencyKey?: string): Promise<AsyncJobReference> {
  const { data } = await httpClient.post(
    '/api/admin/audit-events/exports',
    {},
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb03-export'),
      },
    },
  )
  return unwrapSuccessData<AsyncJobReference>(data)
}

export { newIdempotencyKey }

export function mapExportFailure(error: unknown): ApiError {
  if (error instanceof ApiError) {
    if (error.httpStatus === 404) {
      return new ApiError(
        'DEPENDENCY_UNAVAILABLE',
        error.message || 'Xuất audit chưa sẵn sàng trên server (NB03-003 deferred).',
        404,
      )
    }
    return error
  }
  return new ApiError('DEPENDENCY_UNAVAILABLE', 'Không thể yêu cầu xuất audit.', 503)
}
