import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  EventListQuery,
  EventOutboxListItem,
  EventPage,
  ReplayEventResult,
  RealtimeSubscription,
  SubscriptionCreateRequest,
  SubscriptionPage,
} from '../types/realtimeEvent'

function normalizePage<T>(raw: unknown): { items: T[]; page: EventPage['page'] } {
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

/** NB06-004 GET /api/admin/events */
export async function listEvents(query: EventListQuery = {}): Promise<EventPage> {
  const { data } = await httpClient.get('/api/admin/events', { params: query })
  return normalizePage<EventOutboxListItem>(data)
}

/** NB06-005 POST /api/admin/events/{event_id}/replay */
export async function replayEvent(
  eventId: number,
  reason: string,
  idempotencyKey?: string,
): Promise<ReplayEventResult> {
  if (!Number.isInteger(eventId) || eventId <= 0) {
    throw new ApiError('VALIDATION_ERROR', 'event_id không hợp lệ.', 400)
  }
  const { data } = await httpClient.post(
    `/api/admin/events/${eventId}/replay`,
    { reason },
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb06-replay'),
      },
    },
  )
  return unwrapSuccessData<ReplayEventResult>(data)
}

/** NB06-001 GET /api/realtime/subscriptions */
export async function listSubscriptions(): Promise<SubscriptionPage> {
  const { data } = await httpClient.get('/api/realtime/subscriptions', {
    params: { limit: 200, sort: 'subscribed_at_desc' },
  })
  return normalizePage<RealtimeSubscription>(data)
}

/** NB06-002 POST /api/realtime/subscriptions */
export async function createSubscription(
  body: SubscriptionCreateRequest,
  idempotencyKey?: string,
): Promise<RealtimeSubscription> {
  const { data } = await httpClient.post('/api/realtime/subscriptions', body, {
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb06-subscribe'),
    },
  })
  return unwrapSuccessData<RealtimeSubscription>(data)
}

/** NB06-003 DELETE /api/realtime/subscriptions/{code} */
export async function revokeSubscription(
  code: string,
  idempotencyKey?: string,
): Promise<RealtimeSubscription> {
  const value = code.trim()
  if (!value) throw new ApiError('VALIDATION_ERROR', 'subscription code không hợp lệ.', 400)
  const { data } = await httpClient.delete(
    `/api/realtime/subscriptions/${encodeURIComponent(value)}`,
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb06-unsubscribe'),
      },
    },
  )
  return unwrapSuccessData<RealtimeSubscription>(data)
}
