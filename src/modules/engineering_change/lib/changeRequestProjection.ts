import type {
  AllowedAction,
  ChangeRequestRecord,
  ChangeRequestRow,
} from '../types/changeRequest'

const UNAVAILABLE = '-'

export function findAllowedAction(
  actions: AllowedAction[] | undefined,
  action: string,
): AllowedAction | null {
  return actions?.find((item) => item.action === action) ?? null
}

export function projectChangeRequestRow(row: ChangeRequestRecord): ChangeRequestRow {
  const updateAction = findAllowedAction(row.allowed_actions, 'update')
  const submitAction = findAllowedAction(row.allowed_actions, 'submit')
  const startReviewAction = findAllowedAction(row.allowed_actions, 'start_review')
  const approveAction = findAllowedAction(row.allowed_actions, 'approve')
  const rejectAction = findAllowedAction(row.allowed_actions, 'reject')
  const implementAction = findAllowedAction(row.allowed_actions, 'implement')
  const closeAction = findAllowedAction(row.allowed_actions, 'close')
  return {
    code: row.code || UNAVAILABLE,
    status: row.status || UNAVAILABLE,
    changeType: row.change_type || UNAVAILABLE,
    itemLabel: row.target_item_code || UNAVAILABLE,
    reason: row.reason || UNAVAILABLE,
    requestedAt: row.requested_at || UNAVAILABLE,
    canUpdate: updateAction?.enabled === true,
    canSubmit: submitAction?.enabled === true,
    canStartReview: startReviewAction?.enabled === true,
    canApprove: approveAction?.enabled === true,
    canReject: rejectAction?.enabled === true,
    canImplement: implementAction?.enabled === true,
    canClose: closeAction?.enabled === true,
    updateAction,
    submitAction,
    startReviewAction,
    approveAction,
    rejectAction,
    implementAction,
    closeAction,
  }
}

export function resolveListState(input: {
  status: 'loading' | 'success' | 'error'
  itemCount: number
  hasQuery: boolean
  errorCode: string | null
}): 'loading' | 'empty' | 'no-result' | 'permission-denied' | 'error' | 'ready' {
  if (input.status === 'loading') return 'loading'
  if (input.status === 'error') {
    return input.errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  }
  if (input.itemCount === 0) return input.hasQuery ? 'no-result' : 'empty'
  return 'ready'
}
