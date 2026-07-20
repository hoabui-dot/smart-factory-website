import type {
  LookupMaps,
  PrintJobAction,
  PrintJobRecord,
  PrintJobRow,
} from '../types/labelPrinting'
import { formatDateTime } from '../../../shared/lib/formatDate.ts'

const UNAVAILABLE = '—'

export function resolveJobActions(status: string): PrintJobAction[] {
  switch (status) {
    case 'FAILED':
      return ['retry']
    case 'QUEUED':
    case 'SENDING':
      return ['cancel']
    case 'PRINTED':
      return ['request_reprint']
    case 'REPRINT_REQUESTED':
      return ['approve_reprint']
    default:
      return []
  }
}

function payloadPreview(payload: Record<string, unknown> | null | undefined): string {
  if (!payload || typeof payload !== 'object') {
    return UNAVAILABLE
  }
  const keys = Object.keys(payload)
  if (keys.length === 0) {
    return '{}'
  }
  try {
    const raw = JSON.stringify(payload)
    return raw.length > 80 ? `${raw.slice(0, 77)}…` : raw
  } catch {
    return UNAVAILABLE
  }
}

export function projectPrintJobRow(job: PrintJobRecord, lookups: LookupMaps): PrintJobRow {
  return {
    code: job.code || UNAVAILABLE,
    status: job.status || UNAVAILABLE,
    requestedAt: job.requested_at ? formatDateTime(job.requested_at) : UNAVAILABLE,
    printedAt: job.printed_at ? formatDateTime(job.printed_at) : UNAVAILABLE,
    labelType: job.label_type || UNAVAILABLE,
    parentType: job.parent_type || UNAVAILABLE,
    copies: Number.isFinite(job.copies) ? job.copies : 0,
    payloadPreview: payloadPreview(job.payload),
    requestedBy: job.requested_by == null ? UNAVAILABLE : String(job.requested_by),
    errorMessage: job.error_message || UNAVAILABLE,
    printerLabel: lookups.printersById.get(job.printer_id) ?? UNAVAILABLE,
    templateLabel: lookups.templatesById.get(job.template_id) ?? UNAVAILABLE,
    actions: resolveJobActions(job.status),
  }
}

export function resolvePrintListState(input: {
  status: 'loading' | 'success' | 'error'
  itemCount: number
  hasQuery: boolean
  errorCode: string | null
}): 'loading' | 'empty' | 'no-result' | 'permission-denied' | 'error' | 'ready' {
  if (input.status === 'loading') {
    return 'loading'
  }
  if (input.status === 'error') {
    return input.errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  }
  if (input.itemCount === 0) {
    return input.hasQuery ? 'no-result' : 'empty'
  }
  return 'ready'
}

export function resolveActionUiState(input: {
  confirmOpen: boolean
  status: 'idle' | 'pending' | 'success' | 'error'
  errorCode: string | null
}): 'idle' | 'confirm' | 'pending' | 'success' | 'permission-denied' | 'error' {
  if (input.status === 'pending') {
    return 'pending'
  }
  if (input.status === 'success') {
    return 'success'
  }
  if (input.status === 'error') {
    return input.errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  }
  return input.confirmOpen ? 'confirm' : 'idle'
}
