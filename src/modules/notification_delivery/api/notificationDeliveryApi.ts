import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  NotificationDeliveryLog,
  PreferenceUpdateBody,
  PushSubscription,
  SubscriptionCreateBody,
  UserNotificationPreference,
} from '../types/notificationDelivery'

function normalizePage<T>(raw: unknown): {
  items: T[]
  page: { limit: number; next_cursor: string | null; has_more: boolean }
} {
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

/** NB09-006 GET /api/admin/notification-delivery/logs */
export async function listDeliveryLogs(query: {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
} = {}) {
  const { data } = await httpClient.get('/api/admin/notification-delivery/logs', { params: query })
  return normalizePage<NotificationDeliveryLog>(data)
}

/** NB09-007 POST /api/admin/notification-delivery/logs/{delivery_id}/retry */
export async function retryDelivery(deliveryId: number, idempotencyKey?: string) {
  if (!Number.isInteger(deliveryId) || deliveryId <= 0) {
    throw new ApiError('VALIDATION_ERROR', 'delivery_id không hợp lệ.', 400)
  }
  const { data } = await httpClient.post(
    `/api/admin/notification-delivery/logs/${deliveryId}/retry`,
    {},
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb09-retry'),
      },
    },
  )
  return unwrapSuccessData(data)
}

/** NB09-001 GET /api/notification-delivery/subscriptions */
export async function listSubscriptions(query: { limit?: number; cursor?: string } = {}) {
  const { data } = await httpClient.get('/api/notification-delivery/subscriptions', {
    params: query,
  })
  return normalizePage<PushSubscription>(data)
}

/** NB09-002 POST /api/notification-delivery/subscriptions */
export async function createSubscription(
  body: SubscriptionCreateBody,
  idempotencyKey?: string,
): Promise<PushSubscription> {
  const { data } = await httpClient.post('/api/notification-delivery/subscriptions', body, {
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb09-subscribe'),
    },
  })
  return unwrapSuccessData<PushSubscription>(data)
}

/** NB09-003 DELETE /api/notification-delivery/subscriptions/{code} */
export async function revokeSubscription(code: string, idempotencyKey?: string) {
  const value = code.trim()
  if (!value) throw new ApiError('VALIDATION_ERROR', 'push_subscription_code không hợp lệ.', 400)
  const { data } = await httpClient.delete(
    `/api/notification-delivery/subscriptions/${encodeURIComponent(value)}`,
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb09-unsubscribe'),
      },
    },
  )
  return unwrapSuccessData<PushSubscription>(data)
}

/** NB09-004 GET /api/notification-delivery/preferences */
export async function listPreferences(): Promise<UserNotificationPreference[]> {
  const { data } = await httpClient.get('/api/notification-delivery/preferences')
  const payload = unwrapSuccessData<Record<string, unknown>>(data)
  return Array.isArray(payload.items) ? (payload.items as UserNotificationPreference[]) : []
}

/** NB09-005 PUT /api/notification-delivery/preferences */
export async function updatePreference(
  body: PreferenceUpdateBody,
  idempotencyKey?: string,
): Promise<UserNotificationPreference> {
  const { data } = await httpClient.put('/api/notification-delivery/preferences', body, {
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb09-pref'),
    },
  })
  return unwrapSuccessData<UserNotificationPreference>(data)
}
