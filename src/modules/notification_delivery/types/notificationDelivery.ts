export type PushSubscription = {
  id: number
  code: string
  user_id: number
  channel: string
  endpoint: string
  user_agent: string
  subscribed_at: string
  last_used_at?: string | null
  revoked_at?: string | null
}

export type UserNotificationPreference = {
  id: number
  code: string
  user_id: number
  event_type?: string | null
  realtime_enabled: boolean
  push_enabled: boolean
  quiet_hours_start?: string | null
  quiet_hours_end?: string | null
  updated_at: string
}

export type NotificationDeliveryLog = {
  id: number
  code: string
  notification_id: number
  channel: string
  subscription_id?: number | null
  status: string
  error_message?: string | null
  attempted_at: string
  opened_at?: string | null
}

export type PageMeta = {
  limit: number
  next_cursor: string | null
  has_more: boolean
}

export type DeliveryLogRow = {
  id: number
  code: string
  notificationId: number
  channel: string
  status: string
  errorMessage: string
  attemptedAt: string
  canRetry: boolean
}

export type SubscriptionRow = {
  code: string
  channel: string
  endpoint: string
  subscribedAt: string
  revokedAt: string
  isActive: boolean
}

export type PreferenceRow = {
  code: string
  eventType: string
  realtimeEnabled: boolean
  pushEnabled: boolean
  updatedAt: string
}

export type PreferenceUpdateBody = {
  event_type?: string | null
  realtime_enabled: boolean
  push_enabled: boolean
}

export type SubscriptionCreateBody = {
  channel: string
  endpoint: string
  p256dh_key?: string
  auth_key?: string
  user_agent: string
}
