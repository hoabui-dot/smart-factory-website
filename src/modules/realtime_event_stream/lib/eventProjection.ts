import type { EventOutboxListItem, EventRow } from '../types/realtimeEvent'

import { formatDateTime } from '../../../shared/lib/formatDate.ts'

const UNAVAILABLE = '-'

function formatPayloadPreview(payload: Record<string, unknown>): string {
  try {
    const value = JSON.stringify(payload)
    return value.length > 160 ? `${value.slice(0, 157)}...` : value
  } catch {
    return UNAVAILABLE
  }
}

export function projectEventRow(event: EventOutboxListItem): EventRow {
  return {
    id: event.id,
    eventId: event.event_id || UNAVAILABLE,
    eventType: event.event_type || UNAVAILABLE,
    entityReference:
      event.entity_type && Number.isInteger(event.entity_id)
        ? `${event.entity_type} #${event.entity_id}`
        : UNAVAILABLE,
    sourceModule: event.source_module || UNAVAILABLE,
    status: event.status || UNAVAILABLE,
    retryCount: Number.isFinite(event.retry_count) ? event.retry_count : 0,
    lastError: event.last_error || UNAVAILABLE,
    requestId: event.request_id || UNAVAILABLE,
    occurredAt: event.occurred_at ? formatDateTime(event.occurred_at) : UNAVAILABLE,
    payloadPreview: formatPayloadPreview(event.payload_preview ?? {}),
    canReplay: event.allowed_actions?.includes('replay') ?? false,
  }
}

export function resolveEventListState(input: {
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

export function resolveReplayUiState(input: {
  confirmOpen: boolean
  status: 'idle' | 'pending' | 'success' | 'error'
  errorCode: string | null
}): 'idle' | 'confirm' | 'pending' | 'success' | 'permission-denied' | 'not-allowed' | 'error' {
  if (input.status === 'pending') return 'pending'
  if (input.status === 'success') return 'success'
  if (input.status === 'error') {
    if (input.errorCode === 'PERMISSION_DENIED') return 'permission-denied'
    if (input.errorCode === 'NOT_ALLOWED_BY_STATUS') return 'not-allowed'
    return 'error'
  }
  return input.confirmOpen ? 'confirm' : 'idle'
}
