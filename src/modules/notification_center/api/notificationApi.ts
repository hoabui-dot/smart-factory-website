import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  MarkAllReadResult,
  NotificationItem,
  NotificationListQuery,
  NotificationPage,
  UnreadCount,
} from '../types/notification'

function normalizePage(raw: unknown): NotificationPage {
  const data = unwrapSuccessData<Record<string, unknown>>(raw as Record<string, unknown>)
  const page = (data.page ?? {}) as Record<string, unknown>
  return {
    items: Array.isArray(data.items) ? (data.items as NotificationItem[]) : [],
    page: {
      limit: typeof page.limit === 'number' ? page.limit : 50,
      next_cursor: typeof page.next_cursor === 'string' ? page.next_cursor : null,
      has_more: Boolean(page.has_more),
    },
  }
}

/** NB08-001 GET /api/v1/notifications */
export async function listNotifications(
  query: NotificationListQuery = {},
): Promise<NotificationPage> {
  const { data } = await httpClient.get('/api/v1/notifications', { params: query })
  return normalizePage(data)
}

/** NB08-002 GET /api/v1/notifications/{notification_code} */
export async function getNotification(code: string): Promise<NotificationItem> {
  const value = code.trim()
  if (!value) throw new ApiError('VALIDATION_ERROR', 'notification_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/v1/notifications/${encodeURIComponent(value)}`)
  return unwrapSuccessData<NotificationItem>(data)
}

/** NB08-003 GET /api/v1/notifications/unread-count */
export async function getUnreadCount(): Promise<UnreadCount> {
  const { data } = await httpClient.get('/api/v1/notifications/unread-count')
  return unwrapSuccessData<UnreadCount>(data)
}

/** NB08-004 POST /api/v1/notifications/{notification_code}/read */
export async function markNotificationRead(
  code: string,
  idempotencyKey?: string,
): Promise<NotificationItem> {
  const value = code.trim()
  if (!value) throw new ApiError('VALIDATION_ERROR', 'notification_code không hợp lệ.', 400)
  const { data } = await httpClient.post(
    `/api/v1/notifications/${encodeURIComponent(value)}/read`,
    {},
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb08-read'),
      },
    },
  )
  return unwrapSuccessData<NotificationItem>(data)
}

/** NB08-005 POST /api/v1/notifications/read-all */
export async function markAllNotificationsRead(
  idempotencyKey?: string,
): Promise<MarkAllReadResult> {
  const { data } = await httpClient.post(
    '/api/v1/notifications/read-all',
    {},
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb08-read-all'),
      },
    },
  )
  return unwrapSuccessData<MarkAllReadResult>(data)
}
