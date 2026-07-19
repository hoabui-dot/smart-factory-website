import type {
  AllowedAction,
  GoodsIssueLineRecord,
  GoodsIssueLineRow,
  GoodsIssueRecord,
  GoodsIssueRow,
  MaterialRequestRecord,
  MaterialRequestRow,
} from '../types/goodsIssue'

const UNAVAILABLE = '-'

/** Never infer mutation availability from status — server allowed_actions is authoritative. */
export function findAllowedAction(
  actions: AllowedAction[] | undefined,
  action: string,
): AllowedAction | null {
  return actions?.find((item) => item.action === action) ?? null
}

export function isActionEnabled(actions: AllowedAction[] | undefined, action: string): boolean {
  return findAllowedAction(actions, action)?.enabled === true
}

export function projectMaterialRequestRow(row: MaterialRequestRecord): MaterialRequestRow {
  const cancelAction = findAllowedAction(row.allowed_actions, 'cancel')
  const itemLabel =
    row.item_code && row.item_name
      ? `${row.item_code} · ${row.item_name}`
      : row.item_code || UNAVAILABLE
  return {
    code: row.code || UNAVAILABLE,
    workOrderLabel: row.work_order_code || UNAVAILABLE,
    workOrderId: row.work_order_id,
    itemLabel,
    requiredQty: String(row.required_qty),
    uomLabel: row.uom_code || UNAVAILABLE,
    targetLocationLabel: row.target_location_code || UNAVAILABLE,
    status: row.status || UNAVAILABLE,
    canCancel: cancelAction?.enabled === true,
    cancelAction,
    cancelDisabledReason: cancelAction?.enabled
      ? null
      : (cancelAction?.disabled_reason_code ?? null),
  }
}

function projectGoodsIssueLineRow(line: GoodsIssueLineRecord): GoodsIssueLineRow {
  return {
    code: line.code || UNAVAILABLE,
    itemLabel: line.item_code || UNAVAILABLE,
    lotLabel: line.lot_code || UNAVAILABLE,
    fromLocationLabel: line.from_location_code || UNAVAILABLE,
    toLocationLabel: line.to_location_code || UNAVAILABLE,
    qty: String(line.qty),
    uomLabel: line.uom_code || UNAVAILABLE,
  }
}

/** Hide raw user ids as business codes — known NB-01 admin-users-lookup gap. */
function userLabel(userId: number | null | undefined): string {
  if (userId == null || userId <= 0) return UNAVAILABLE
  return `User #${userId}`
}

export function projectGoodsIssueRow(row: GoodsIssueRecord): GoodsIssueRow {
  const approveAction = findAllowedAction(row.allowed_actions, 'approve')
  const rejectAction = findAllowedAction(row.allowed_actions, 'reject')
  // Do not render raw reference_id as a business code (WEB-WMS-04-GOODS-ISSUE §C/F).
  const referenceLabel = row.reference_type || UNAVAILABLE
  return {
    code: row.code || UNAVAILABLE,
    transactionTypeLabel: row.transaction_type_code || UNAVAILABLE,
    referenceLabel,
    status: row.status || UNAVAILABLE,
    performedAt: row.performed_at || UNAVAILABLE,
    performedByLabel: userLabel(row.performed_by),
    approvedByLabel: userLabel(row.approved_by),
    deviceSnapshot: row.device_code_snapshot || UNAVAILABLE,
    lineRows: (row.lines ?? []).map(projectGoodsIssueLineRow),
    canApprove: approveAction?.enabled === true,
    canReject: rejectAction?.enabled === true,
    approveAction,
    rejectAction,
    approveDisabledReason: approveAction?.enabled
      ? null
      : (approveAction?.disabled_reason_code ?? null),
    rejectDisabledReason: rejectAction?.enabled
      ? null
      : (rejectAction?.disabled_reason_code ?? null),
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

export function resolveMutationUiState(input: {
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

export function validateReason(reason: string): string[] {
  return reason.trim() ? [] : ['reason']
}
