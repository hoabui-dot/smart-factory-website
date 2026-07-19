import type { ApprovalItem, SearchResultItem } from '../api/approvalInboxApi'

const UNAVAILABLE = '-'

function safeWebDeepLink(value: string): string | null {
  if (!value.startsWith('/web/') || value.startsWith('//') || value.includes('://') || value.includes('\\')) {
    return null
  }
  return value
}

export type ApprovalRow = {
  approvalKey: string
  title: string
  sourceLabel: string
  requestedAt: string
  sourceVersion: string
  canApprove: boolean
  canReject: boolean
}

export type SearchRow = {
  key: string
  resultType: string
  sourceModule: string
  businessCode: string
  label: string
  deepLink: string | null
}

export function projectApprovalItem(item: ApprovalItem): ApprovalRow {
  const actions = new Set((item.allowed_actions ?? []).map((a) => a.toUpperCase()))
  return {
    approvalKey: item.approval_key,
    title: item.title || UNAVAILABLE,
    sourceLabel: `${item.source_module || UNAVAILABLE} · ${item.source_entity_type || UNAVAILABLE} · ${item.source_entity_code || UNAVAILABLE}`,
    requestedAt: item.requested_at || UNAVAILABLE,
    sourceVersion: item.source_version || '',
    canApprove: actions.has('APPROVE'),
    canReject: actions.has('REJECT'),
  }
}

export function projectSearchHit(item: SearchResultItem): SearchRow {
  return {
    key: `${item.result_type}:${item.source_module}:${item.business_code}`,
    resultType: item.result_type || UNAVAILABLE,
    sourceModule: item.source_module || UNAVAILABLE,
    businessCode: item.business_code || UNAVAILABLE,
    label: item.label || UNAVAILABLE,
    deepLink: safeWebDeepLink(item.route ?? ''),
  }
}

export function resolveApprovalListState(
  status: 'loading' | 'success' | 'error',
  itemCount: number,
  hasQuery: boolean,
  errorCode: string | null,
): 'loading' | 'empty' | 'no-result' | 'permission-denied' | 'error' | 'ready' {
  if (status === 'loading') return 'loading'
  if (status === 'error') return errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  if (itemCount === 0) return hasQuery ? 'no-result' : 'empty'
  return 'ready'
}
