import type { ActivityEvent } from '../types/activityEvent.ts'
import { formatDateTime } from '../../../shared/lib/formatDate.ts'

export type AuditEventRow = {
  id: number
  code: string
  eventType: string
  entityType: string
  action: string
  fromState: string
  toState: string
  occurredAt: string
  ipAddress: string
  locationLabel: string
  workOrderLabel: string
  lotLabel: string
  actorLabel: string
  payloadPreview: string
}

const UNAVAILABLE = '—'

function projectionOrDash(value: string | null | undefined): string {
  if (typeof value === 'string' && value.trim() !== '') {
    return value
  }
  return UNAVAILABLE
}

export function formatPayloadPreview(payload: unknown): string {
  if (payload == null) {
    return UNAVAILABLE
  }
  if (typeof payload === 'string') {
    return payload.trim() === '' ? UNAVAILABLE : payload
  }
  try {
    return JSON.stringify(payload)
  } catch {
    return UNAVAILABLE
  }
}

export function projectAuditEventRow(event: ActivityEvent): AuditEventRow {
  const actorLabel =
    projectionOrDash(event.actor_display_name) !== UNAVAILABLE
      ? projectionOrDash(event.actor_display_name)
      : projectionOrDash(event.actor_user_code)

  return {
    id: event.id,
    code: event.code,
    eventType: event.event_type,
    entityType: event.entity_type,
    action: event.action,
    fromState: event.from_state ?? UNAVAILABLE,
    toState: event.to_state ?? UNAVAILABLE,
    occurredAt: formatDateTime(event.occurred_at),
    ipAddress: event.ip_address,
    locationLabel: projectionOrDash(event.location_code),
    workOrderLabel: projectionOrDash(event.work_order_code),
    lotLabel: projectionOrDash(event.lot_code),
    actorLabel,
    payloadPreview: formatPayloadPreview(event.payload),
  }
}

export type AuditListUiState =
  | 'loading'
  | 'empty'
  | 'no-result'
  | 'ready'
  | 'permission-denied'
  | 'error'
  | 'not-found'

export function resolveAuditListState(input: {
  status: 'loading' | 'success' | 'error'
  itemCount: number
  hasQuery: boolean
  errorCode?: string | null
}): AuditListUiState {
  if (input.status === 'loading') {
    return 'loading'
  }
  if (input.status === 'error') {
    if (input.errorCode === 'PERMISSION_DENIED') {
      return 'permission-denied'
    }
    if (input.errorCode === 'RESOURCE_NOT_FOUND') {
      return 'not-found'
    }
    return 'error'
  }
  if (input.itemCount === 0) {
    return input.hasQuery ? 'no-result' : 'empty'
  }
  return 'ready'
}

export type ExportUiState =
  | 'idle'
  | 'async-processing'
  | 'queued'
  | 'blocked-feature'
  | 'permission-denied'
  | 'error'

export function resolveExportUiState(input: {
  status: 'idle' | 'pending' | 'success' | 'error'
  jobCode?: string | null
  errorCode?: string | null
}): ExportUiState {
  if (input.status === 'idle') {
    return 'idle'
  }
  if (input.status === 'pending') {
    return 'async-processing'
  }
  if (input.status === 'success') {
    return 'queued'
  }
  if (input.errorCode === 'PERMISSION_DENIED') {
    return 'permission-denied'
  }
  if (
    input.errorCode === 'DEPENDENCY_UNAVAILABLE' ||
    input.errorCode === 'FEATURE_UNAVAILABLE' ||
    input.errorCode === 'NOT_IMPLEMENTED'
  ) {
    return 'blocked-feature'
  }
  return 'error'
}
