import type {
  AllowedAction,
  DocumentRecord,
  DocumentRevisionRecord,
  DocumentRow,
  DocumentTypeLookup,
  PpapRow,
  PpapSubmissionRecord,
  RevisionRow,
} from '../types/document'

const UNAVAILABLE = '-'

/** Never infer mutation availability from status — server allowed_actions is authoritative. */
export function findAllowedAction(
  actions: AllowedAction[] | undefined,
  action: string,
): AllowedAction | null {
  return actions?.find((item) => item.action === action) ?? null
}

export function projectDocumentTypeLookups(
  rows: { code: string; label: string; is_active: boolean; row_version: string }[],
): DocumentTypeLookup[] {
  return rows
    .map((row) => ({
      id: Number.parseInt(row.row_version, 10),
      code: row.code,
      name_vi: row.label,
      is_active: row.is_active,
    }))
    .filter((row) => Number.isInteger(row.id) && row.id > 0)
}

export function projectDocumentRow(row: DocumentRecord): DocumentRow {
  const updateAction = findAllowedAction(row.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(row.allowed_actions, 'deactivate')
  return {
    code: row.code || UNAVAILABLE,
    title: row.doc_title || UNAVAILABLE,
    docTypeLabel: row.doc_type_code || UNAVAILABLE,
    ownerLabel: row.owner_code || UNAVAILABLE,
    itemLabel: row.related_item_code || UNAVAILABLE,
    customerLabel: row.related_customer_code || UNAVAILABLE,
    currentRevisionLabel: row.current_revision_code || UNAVAILABLE,
    isActive: row.is_active,
    canUpdate: updateAction?.enabled === true,
    canDeactivate: deactivateAction?.enabled === true,
    updateAction,
    deactivateAction,
  }
}

export function projectRevisionRow(row: DocumentRevisionRecord): RevisionRow {
  const submitAction = findAllowedAction(row.allowed_actions, 'submit')
  const releaseAction = findAllowedAction(row.allowed_actions, 'release')
  const rejectAction = findAllowedAction(row.allowed_actions, 'reject')
  const obsoleteAction = findAllowedAction(row.allowed_actions, 'obsolete')
  return {
    code: row.code || UNAVAILABLE,
    status: row.status || UNAVAILABLE,
    effectiveFrom: row.effective_from || UNAVAILABLE,
    effectiveTo: row.effective_to || UNAVAILABLE,
    fileLabel: row.file_id != null && row.file_id > 0 ? `File #${row.file_id}` : UNAVAILABLE,
    canSubmit: submitAction?.enabled === true,
    canRelease: releaseAction?.enabled === true,
    canReject: rejectAction?.enabled === true,
    canObsolete: obsoleteAction?.enabled === true,
    submitAction,
    releaseAction,
    rejectAction,
    obsoleteAction,
  }
}

export function projectPpapRow(row: PpapSubmissionRecord): PpapRow {
  const updateAction = findAllowedAction(row.allowed_actions, 'update')
  const prepareAction = findAllowedAction(row.allowed_actions, 'prepare')
  const submitAction = findAllowedAction(row.allowed_actions, 'submit')
  const customerReviewAction = findAllowedAction(row.allowed_actions, 'customer-review')
  const approveAction = findAllowedAction(row.allowed_actions, 'approve')
  const interimApproveAction = findAllowedAction(row.allowed_actions, 'interim-approve')
  const rejectAction = findAllowedAction(row.allowed_actions, 'reject')
  return {
    code: row.code || UNAVAILABLE,
    status: row.status || UNAVAILABLE,
    ppapLevel: row.ppap_level || UNAVAILABLE,
    submissionType: row.submission_type || UNAVAILABLE,
    customerLabel: row.customer_code || UNAVAILABLE,
    itemLabel: row.item_code || UNAVAILABLE,
    notes: row.notes || UNAVAILABLE,
    canUpdate: updateAction?.enabled === true,
    canPrepare: prepareAction?.enabled === true,
    canSubmit: submitAction?.enabled === true,
    canCustomerReview: customerReviewAction?.enabled === true,
    canApprove: approveAction?.enabled === true,
    canInterimApprove: interimApproveAction?.enabled === true,
    canReject: rejectAction?.enabled === true,
    updateAction,
    prepareAction,
    submitAction,
    customerReviewAction,
    approveAction,
    interimApproveAction,
    rejectAction,
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

export function validateDocumentCreateForm(input: {
  code: string
  doc_title: string
  doc_type_id: number
  owner_id: number
  is_active: boolean
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!input.doc_title.trim()) errors.push('doc_title')
  if (!Number.isInteger(input.doc_type_id) || input.doc_type_id <= 0) errors.push('doc_type_id')
  if (!Number.isInteger(input.owner_id) || input.owner_id <= 0) errors.push('owner_id')
  return errors
}

export function validateRevisionCreateForm(input: {
  code: string
  effective_from: string
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!input.effective_from.trim()) errors.push('effective_from')
  return errors
}

export function validateReleaseFileId(fileId: number): string[] {
  return Number.isInteger(fileId) && fileId > 0 ? [] : ['file_id']
}

export function validateReason(reason: string): string[] {
  return reason.trim() ? [] : ['reason']
}

export function validatePpapCreateForm(input: {
  code: string
  customer_id: number
  item_id: number
  ppap_level: string
  submission_type: string
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!Number.isInteger(input.customer_id) || input.customer_id <= 0) errors.push('customer_id')
  if (!Number.isInteger(input.item_id) || input.item_id <= 0) errors.push('item_id')
  if (!input.ppap_level.trim()) errors.push('ppap_level')
  if (!input.submission_type.trim()) errors.push('submission_type')
  return errors
}
