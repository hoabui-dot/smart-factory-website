import type {
  AllowedAction,
  CustomerItemRecord,
  CustomerItemRow,
  CustomerOrderRecord,
  CustomerOrderRow,
  CustomerRecord,
  CustomerRow,
  ShipmentRecord,
  ShipmentRow,
} from '../types/customerOrder'

const UNAVAILABLE = '-'

export function findAllowedAction(
  actions: AllowedAction[] | undefined,
  action: string,
): AllowedAction | null {
  return actions?.find((item) => item.action === action) ?? null
}

export function projectCustomerRow(row: CustomerRecord): CustomerRow {
  const updateAction = findAllowedAction(row.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(row.allowed_actions, 'deactivate')
  return {
    code: row.code || UNAVAILABLE,
    customerName: row.customer_name || UNAVAILABLE,
    countryCode: row.country_code || UNAVAILABLE,
    ppapLevel: row.ppap_level_default || UNAVAILABLE,
    targetPpm: row.target_ppm,
    contactEmail: row.contact_email || UNAVAILABLE,
    isActive: row.is_active,
    canUpdate: updateAction?.enabled === true,
    canDeactivate: deactivateAction?.enabled === true,
    updateAction,
    deactivateAction,
  }
}

export function projectCustomerItemRow(row: CustomerItemRecord): CustomerItemRow {
  const updateAction = findAllowedAction(row.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(row.allowed_actions, 'deactivate')
  return {
    code: row.code || UNAVAILABLE,
    customerLabel: row.customer_code || UNAVAILABLE,
    itemLabel: row.item_code || UNAVAILABLE,
    customerPartName: row.customer_part_name || UNAVAILABLE,
    characteristicClass: row.characteristic_class || UNAVAILABLE,
    isActive: row.is_active,
    canUpdate: updateAction?.enabled === true,
    canDeactivate: deactivateAction?.enabled === true,
    updateAction,
    deactivateAction,
  }
}

export function projectCustomerOrderRow(row: CustomerOrderRecord): CustomerOrderRow {
  const updateAction = findAllowedAction(row.allowed_actions, 'update')
  const confirmAction = findAllowedAction(row.allowed_actions, 'confirm')
  const cancelAction = findAllowedAction(row.allowed_actions, 'cancel')
  const closeAction = findAllowedAction(row.allowed_actions, 'close')
  return {
    code: row.code || UNAVAILABLE,
    customerLabel: row.customer_code || UNAVAILABLE,
    customerPoNo: row.customer_po_no || UNAVAILABLE,
    status: row.status || UNAVAILABLE,
    receivedDate: row.received_date || UNAVAILABLE,
    requestedDeliveryDate: row.requested_delivery_date || UNAVAILABLE,
    incoterm: row.incoterm || UNAVAILABLE,
    createdByLabel: row.created_by ? `User #${row.created_by}` : UNAVAILABLE,
    canUpdate: updateAction?.enabled === true,
    canConfirm: confirmAction?.enabled === true,
    canCancel: cancelAction?.enabled === true,
    canClose: closeAction?.enabled === true,
    updateAction,
    confirmAction,
    cancelAction,
    closeAction,
  }
}

/** Never infer ship availability from status — use allowed_actions (ERR_COC_REQUIRED). */
export function projectShipmentRow(row: ShipmentRecord): ShipmentRow {
  const updateAction = findAllowedAction(row.allowed_actions, 'update')
  const addLineAction = findAllowedAction(row.allowed_actions, 'add-line')
  const cancelAction = findAllowedAction(row.allowed_actions, 'cancel')
  const shipAction = findAllowedAction(row.allowed_actions, 'ship')
  const deliverAction = findAllowedAction(row.allowed_actions, 'deliver')
  const acceptAction = findAllowedAction(row.allowed_actions, 'accept')
  const failAction = findAllowedAction(row.allowed_actions, 'fail')
  const cocGenerateAction = findAllowedAction(row.allowed_actions, 'coc-generate')
  const cocSignAction = findAllowedAction(row.allowed_actions, 'coc-sign')
  const cocDownloadAction = findAllowedAction(row.allowed_actions, 'coc-download')
  const removeLineActions = (row.allowed_actions ?? []).filter(
    (a) => a.action === 'remove-line' && a.enabled,
  )
  return {
    code: row.code || UNAVAILABLE,
    status: row.status || UNAVAILABLE,
    customerLabel: row.customer_code || UNAVAILABLE,
    carrier: row.carrier || UNAVAILABLE,
    trackingNo: row.tracking_no || UNAVAILABLE,
    shippedAt: row.shipped_at || UNAVAILABLE,
    cocLabel: row.coc?.code || (row.coc_id ? `CoC #${row.coc_id}` : UNAVAILABLE),
    canUpdate: updateAction?.enabled === true,
    canAddLine: addLineAction?.enabled === true,
    canCancel: cancelAction?.enabled === true,
    canShip: shipAction?.enabled === true,
    canDeliver: deliverAction?.enabled === true,
    canAccept: acceptAction?.enabled === true,
    canFail: failAction?.enabled === true,
    canCocGenerate: cocGenerateAction?.enabled === true,
    canCocSign: cocSignAction?.enabled === true,
    canCocDownload: cocDownloadAction?.enabled === true,
    shipDisabledReason: shipAction && !shipAction.enabled ? shipAction.disabled_reason_code ?? null : null,
    updateAction,
    addLineAction,
    cancelAction,
    shipAction,
    deliverAction,
    acceptAction,
    failAction,
    cocGenerateAction,
    cocSignAction,
    cocDownloadAction,
    removeLineActions,
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

export function validateCustomerCreate(input: {
  code: string
  customer_name: string
  country_code: string
  contact_email: string
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!input.customer_name.trim()) errors.push('customer_name')
  if (!input.country_code.trim()) errors.push('country_code')
  if (!input.contact_email.trim()) errors.push('contact_email')
  return errors
}

export function validateCustomerItemCreate(input: {
  code: string
  customer_id: number
  item_id: number
  customer_part_name: string
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!(input.customer_id > 0)) errors.push('customer_id')
  if (!(input.item_id > 0)) errors.push('item_id')
  if (!input.customer_part_name.trim()) errors.push('customer_part_name')
  return errors
}

export function validateCustomerOrderCreate(input: {
  code: string
  customer_id: number
  customer_po_no: string
  received_date: string
  requested_delivery_date: string
  incoterm: string
  lines: { code: string; customer_item_id: number; ordered_qty: number }[]
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!(input.customer_id > 0)) errors.push('customer_id')
  if (!input.customer_po_no.trim()) errors.push('customer_po_no')
  if (!input.received_date.trim()) errors.push('received_date')
  if (!input.requested_delivery_date.trim()) errors.push('requested_delivery_date')
  if (!input.incoterm.trim()) errors.push('incoterm')
  if (!input.lines.length) errors.push('lines')
  return errors
}

export function validateCancelReason(reason: string): string[] {
  return reason.trim() ? [] : ['reason']
}
