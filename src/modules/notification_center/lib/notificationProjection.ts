import type { NotificationItem, NotificationRow } from '../types/notification'
import { formatDateTime } from '../../../shared/lib/formatDate.ts'

const UNAVAILABLE = '-'

export function projectNotificationRow(item: NotificationItem): NotificationRow {
  const count = Number.isFinite(item.item_count) ? item.item_count : 1
  const groupLabel =
    count > 1
      ? `${item.group_key || 'group'} ×${count}`
      : item.group_key || UNAVAILABLE

  return {
    id: item.id,
    code: item.code || UNAVAILABLE,
    title: item.title || UNAVAILABLE,
    body: item.body || UNAVAILABLE,
    eventType: item.event_type || UNAVAILABLE,
    priority: item.priority || UNAVAILABLE,
    displayMode: item.display_mode || UNAVAILABLE,
    groupLabel,
    relatedEntity: item.related_entity_type
      ? `${item.related_entity_type}${item.related_entity_id ? ` #${item.related_entity_id}` : ''}`
      : UNAVAILABLE,
    deepLink: item.deep_link || '',
    isRead: Boolean(item.is_read),
    readAt: item.read_at ? formatDateTime(item.read_at) : UNAVAILABLE,
    createdAt: item.created_at ? formatDateTime(item.created_at) : UNAVAILABLE,
  }
}

export function resolveNotificationListState(input: {
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

export function resolveMarkReadUiState(input: {
  status: 'idle' | 'pending' | 'success' | 'error'
  errorCode: string | null
}): 'idle' | 'pending' | 'success' | 'permission-denied' | 'not-found' | 'error' {
  if (input.status === 'pending') return 'pending'
  if (input.status === 'success') return 'success'
  if (input.status === 'error') {
    if (input.errorCode === 'PERMISSION_DENIED') return 'permission-denied'
    if (input.errorCode === 'NOT_FOUND' || input.errorCode === 'RESOURCE_NOT_FOUND') return 'not-found'
    return 'error'
  }
  return 'idle'
}
