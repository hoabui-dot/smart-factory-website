import type {
  NotificationDeliveryLog,
  DeliveryLogRow,
  PreferenceRow,
  PushSubscription,
  SubscriptionRow,
  UserNotificationPreference,
} from '../types/notificationDelivery'

const UNAVAILABLE = '-'

export function projectDeliveryLogRow(log: NotificationDeliveryLog): DeliveryLogRow {
  const status = log.status || UNAVAILABLE
  return {
    id: log.id,
    code: log.code || UNAVAILABLE,
    notificationId: Number.isFinite(log.notification_id) ? log.notification_id : 0,
    channel: log.channel || UNAVAILABLE,
    status,
    errorMessage: log.error_message || UNAVAILABLE,
    attemptedAt: log.attempted_at || UNAVAILABLE,
    // Retry only FAILED — mirrors server RetryDelivery validation (no allowed_actions on this DTO).
    canRetry: status === 'FAILED',
  }
}

export function projectSubscriptionRow(item: PushSubscription): SubscriptionRow {
  return {
    code: item.code || UNAVAILABLE,
    channel: item.channel || UNAVAILABLE,
    endpoint: item.endpoint || UNAVAILABLE,
    subscribedAt: item.subscribed_at || UNAVAILABLE,
    revokedAt: item.revoked_at || UNAVAILABLE,
    isActive: !item.revoked_at,
  }
}

export function projectPreferenceRow(item: UserNotificationPreference): PreferenceRow {
  return {
    code: item.code || UNAVAILABLE,
    eventType: item.event_type || '(default)',
    realtimeEnabled: Boolean(item.realtime_enabled),
    pushEnabled: Boolean(item.push_enabled),
    updatedAt: item.updated_at || UNAVAILABLE,
  }
}

export function resolveDeliveryListState(input: {
  status: 'loading' | 'success' | 'error'
  itemCount: number
  hasFilters: boolean
  errorCode: string | null
}): 'loading' | 'empty' | 'no-result' | 'permission-denied' | 'error' | 'ready' {
  if (input.status === 'loading') return 'loading'
  if (input.status === 'error') {
    return input.errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  }
  if (input.itemCount === 0) return input.hasFilters ? 'no-result' : 'empty'
  return 'ready'
}
