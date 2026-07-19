import type {
  AllowedAction,
  CapaRecord,
  CapaRow,
  NcrRecord,
  NcrRow,
  ParetoReportRecord,
  ParetoRowView,
} from '../types/ncr'

const UNAVAILABLE = '-'

/** Never infer mutation availability from status — server allowed_actions is authoritative. */
export function findAllowedAction(
  actions: AllowedAction[] | undefined,
  action: string,
): AllowedAction | null {
  return actions?.find((item) => item.action === action) ?? null
}

export function projectParetoRows(report: ParetoReportRecord | null | undefined): ParetoRowView[] {
  return (report?.rows ?? []).map((row) => ({
    groupKey: row.group_key || UNAVAILABLE,
    groupLabel: row.group_label || UNAVAILABLE,
    qty: String(row.qty ?? 0),
    pct: `${Number(row.pct ?? 0).toFixed(2)}%`,
    cumPct: `${Number(row.cum_pct ?? 0).toFixed(2)}%`,
  }))
}

export function resolveParetoState(input: {
  status: 'loading' | 'success' | 'error'
  rowCount: number
  errorCode: string | null
}): 'loading' | 'empty' | 'permission-denied' | 'error' | 'ready' {
  if (input.status === 'loading') return 'loading'
  if (input.status === 'error') {
    return input.errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  }
  if (input.rowCount === 0) return 'empty'
  return 'ready'
}

export function projectNcrRow(row: NcrRecord): NcrRow {
  const updateAction = findAllowedAction(row.allowed_actions, 'update')
  const startInvestigationAction = findAllowedAction(row.allowed_actions, 'start_investigation')
  const containAction = findAllowedAction(row.allowed_actions, 'contain')
  const startCapaAction = findAllowedAction(row.allowed_actions, 'start_capa')
  const closeAction = findAllowedAction(row.allowed_actions, 'close')
  const voidAction = findAllowedAction(row.allowed_actions, 'void')

  return {
    code: row.code || UNAVAILABLE,
    status: row.status || UNAVAILABLE,
    source: row.source || UNAVAILABLE,
    itemLabel: row.item_code || UNAVAILABLE,
    lotLabel: row.lot_code || UNAVAILABLE,
    defectLabel: row.defect_code || UNAVAILABLE,
    workOrderLabel: row.work_order_code || UNAVAILABLE,
    qtyAffected: row.qty_affected,
    severity: row.severity || UNAVAILABLE,
    disposition: row.disposition || UNAVAILABLE,
    openedAt: row.opened_at || UNAVAILABLE,
    openedByLabel: row.opened_by ? `User #${row.opened_by}` : UNAVAILABLE,
    canUpdate: updateAction?.enabled === true,
    canStartInvestigation: startInvestigationAction?.enabled === true,
    canContain: containAction?.enabled === true,
    canStartCapa: startCapaAction?.enabled === true,
    canClose: closeAction?.enabled === true,
    canVoid: voidAction?.enabled === true,
    updateAction,
    startInvestigationAction,
    containAction,
    startCapaAction,
    closeAction,
    voidAction,
  }
}

export function projectCapaRow(row: CapaRecord): CapaRow {
  const updateAction = findAllowedAction(row.allowed_actions, 'update')
  return {
    code: row.code || UNAVAILABLE,
    ncrLabel: row.ncr_code || UNAVAILABLE,
    rootCause: row.root_cause || UNAVAILABLE,
    correctiveAction: row.corrective_action || UNAVAILABLE,
    preventiveAction: row.preventive_action || UNAVAILABLE,
    ownerLabel: row.owner_id ? `User #${row.owner_id}` : UNAVAILABLE,
    dueDate: row.due_date || UNAVAILABLE,
    effectiveness: row.effectiveness || UNAVAILABLE,
    canUpdate: updateAction?.enabled === true,
    updateAction,
  }
}

export function resolveNcrListState(input: {
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

export function validateNcrCreateForm(input: {
  source: string
  item_code: string
  defect_code: string
  qty_affected: number
}): string[] {
  const errors: string[] = []
  if (!input.source.trim()) errors.push('source')
  if (!input.item_code.trim()) errors.push('item_code')
  if (!input.defect_code.trim()) errors.push('defect_code')
  if (!Number.isInteger(input.qty_affected) || input.qty_affected <= 0) errors.push('qty_affected')
  return errors
}

export function validateVoidReason(reason: string): string[] {
  return reason.trim() ? [] : ['reason']
}

export function validateContainForm(input: {
  disposition: string
  lot_code: string
  qty: number
}): string[] {
  const errors: string[] = []
  if (!input.disposition.trim()) errors.push('disposition')
  if (!input.lot_code.trim()) errors.push('lot_code')
  if (!(input.qty > 0)) errors.push('qty')
  return errors
}

export function validateCloseEvidence(ids: number[]): string[] {
  return ids.length > 0 ? [] : ['evidence_file_ids']
}

export function validateCapaCreateForm(input: {
  ncr_id: number
  root_cause: string
  corrective_action: string
  preventive_action: string
  owner_id: number
  due_date: string
}): string[] {
  const errors: string[] = []
  if (!Number.isInteger(input.ncr_id) || input.ncr_id <= 0) errors.push('ncr_id')
  if (!input.root_cause.trim()) errors.push('root_cause')
  if (!input.corrective_action.trim()) errors.push('corrective_action')
  if (!input.preventive_action.trim()) errors.push('preventive_action')
  if (!Number.isInteger(input.owner_id) || input.owner_id <= 0) errors.push('owner_id')
  if (!input.due_date.trim()) errors.push('due_date')
  return errors
}

export function parseEvidenceFileIds(raw: string): number[] {
  return raw
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part))
    .filter((n) => Number.isInteger(n) && n > 0)
}
