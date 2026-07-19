export type NotificationItem = {
  id: number
  code: string
  event_type: string
  title: string
  body: string
  priority: string
  display_mode: string
  group_key?: string | null
  item_count: number
  related_entity_type: string
  related_entity_id: number
  deep_link: string
  is_read: boolean
  read_at?: string | null
  created_at: string
}

export type NotificationListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

export type PageMeta = {
  limit: number
  next_cursor: string | null
  has_more: boolean
}

export type NotificationPage = {
  items: NotificationItem[]
  page: PageMeta
}

export type UnreadCount = {
  unread_count: number
}

export type MarkAllReadResult = {
  marked_count: number
}

export type NotificationRow = {
  id: number
  code: string
  title: string
  body: string
  eventType: string
  priority: string
  displayMode: string
  groupLabel: string
  relatedEntity: string
  deepLink: string
  isRead: boolean
  readAt: string
  createdAt: string
}
