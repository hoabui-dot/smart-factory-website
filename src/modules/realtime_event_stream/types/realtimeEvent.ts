export type EventOutboxStatus =
  | 'PENDING'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'DEAD_LETTER'

export type EventOutboxListItem = {
  id: number
  event_id: string
  event_type: string
  entity_type: string
  entity_id: number
  source_module: string
  status: EventOutboxStatus | string
  retry_count: number
  last_error?: string | null
  request_id: string
  occurred_at: string
  payload_preview: Record<string, unknown>
  allowed_actions: string[]
}

export type EventListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
  event_type?: string
  source_module?: string
  entity_type?: string
  entity_id?: number
  status?: string
  request_id?: string
  occurred_from?: string
  occurred_to?: string
}

export type PageMeta = {
  limit: number
  next_cursor: string | null
  has_more: boolean
}

export type EventPage = {
  items: EventOutboxListItem[]
  page: PageMeta
}

export type EventDeliveryLog = {
  id: number
  event_outbox_id: number
  delivery_type: string
  status: string
  reason?: string | null
  actor_user_id?: number | null
  error_message?: string | null
  created_at: string
}

export type ReplayEventResult = {
  event: EventOutboxListItem
  delivery_log: EventDeliveryLog
}

export type RealtimeSubscription = {
  id: number
  code: string
  session_id: number
  user_id: number
  channel_key: string
  subscribed_at: string
  last_ping_at: string
  revoked_at?: string | null
}

export type SubscriptionPage = {
  items: RealtimeSubscription[]
  page: PageMeta
}

export type SubscriptionCreateRequest = {
  session_id: number
  user_id: number
  channel_key: string
}

export type EventRow = {
  id: number
  eventId: string
  eventType: string
  entityReference: string
  sourceModule: string
  status: string
  retryCount: number
  lastError: string
  requestId: string
  occurredAt: string
  payloadPreview: string
  canReplay: boolean
}
