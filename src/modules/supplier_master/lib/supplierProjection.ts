import type {
  AllowedAction,
  ItemLookupRecord,
  SupplierEvaluationRecord,
  SupplierEvaluationRow,
  SupplierItemRecord,
  SupplierItemRow,
  SupplierLookups,
  SupplierRecord,
  SupplierRow,
} from '../types/supplier'

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

/** Builds id->code lookup maps so raw FK ids are never rendered on the supplier screens. */
export function buildSupplierLookups(input: {
  suppliers: SupplierRecord[]
  items: ItemLookupRecord[]
}): SupplierLookups {
  const supplierCodeById = new Map<number, string>()
  for (const s of input.suppliers) supplierCodeById.set(s.id, s.code)

  const itemCodeById = new Map<number, string>()
  for (const item of input.items) itemCodeById.set(item.id, item.code)

  return { supplierCodeById, itemCodeById }
}

export function projectSupplierRow(row: SupplierRecord): SupplierRow {
  const updateAction = findAllowedAction(row.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(row.allowed_actions, 'deactivate')
  return {
    code: row.code || UNAVAILABLE,
    supplierName: row.supplier_name || UNAVAILABLE,
    countryCode: row.country_code || UNAVAILABLE,
    supplierTier: row.supplier_tier || UNAVAILABLE,
    approvalStatus: row.approval_status || UNAVAILABLE,
    iatfCertified: row.iatf_certified,
    iso9001Certified: row.iso9001_certified,
    contactEmail: row.contact_email || UNAVAILABLE,
    isActive: row.is_active,
    canUpdate: updateAction?.enabled === true,
    canDeactivate: deactivateAction?.enabled === true,
    updateAction,
    deactivateAction,
    updateDisabledReason: updateAction?.enabled ? null : updateAction?.disabled_reason_code ?? null,
    deactivateDisabledReason: deactivateAction?.enabled
      ? null
      : deactivateAction?.disabled_reason_code ?? null,
  }
}

export function projectSupplierItemRow(
  row: SupplierItemRecord,
  lookups: SupplierLookups,
): SupplierItemRow {
  const updateAction = findAllowedAction(row.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(row.allowed_actions, 'deactivate')
  const supplierLabel =
    row.supplier_code || lookups.supplierCodeById.get(row.supplier_id) || UNAVAILABLE
  const itemLabel = row.item_code || lookups.itemCodeById.get(row.item_id) || UNAVAILABLE
  return {
    code: row.code || UNAVAILABLE,
    supplierLabel,
    itemLabel,
    leadTimeDays: row.lead_time_days,
    unitPrice: row.unit_price == null ? UNAVAILABLE : String(row.unit_price),
    moq: row.moq == null ? UNAVAILABLE : String(row.moq),
    isDefault: row.is_default,
    isActive: row.is_active,
    canUpdate: updateAction?.enabled === true,
    canDeactivate: deactivateAction?.enabled === true,
    updateAction,
    deactivateAction,
    updateDisabledReason: updateAction?.enabled ? null : updateAction?.disabled_reason_code ?? null,
    deactivateDisabledReason: deactivateAction?.enabled
      ? null
      : deactivateAction?.disabled_reason_code ?? null,
  }
}

export function projectSupplierEvaluationRow(
  row: SupplierEvaluationRecord,
  lookups: SupplierLookups,
): SupplierEvaluationRow {
  const supplierLabel =
    row.supplier_code || lookups.supplierCodeById.get(row.supplier_id) || UNAVAILABLE
  return {
    code: row.code || UNAVAILABLE,
    supplierLabel,
    evaluationPeriod: row.evaluation_period || UNAVAILABLE,
    qualityScore: row.quality_score,
    deliveryScore: row.delivery_score,
    serviceScore: row.service_score,
    totalScore: row.total_score,
    grade: row.grade || UNAVAILABLE,
    evaluatedByLabel: row.evaluated_by ? `user #${row.evaluated_by}` : UNAVAILABLE,
    evaluatedAt: row.evaluated_at || UNAVAILABLE,
    actionRequired: row.action_required || UNAVAILABLE,
  }
}

export function resolveSupplierListState(input: {
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

export function validateSupplierCreateForm(input: {
  code: string
  supplierName: string
  countryCode: string
  supplierTier: string
  contactEmail: string
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!input.supplierName.trim()) errors.push('supplier_name')
  if (!input.countryCode.trim()) errors.push('country_code')
  if (!['TIER1', 'TIER2', 'TIER3'].includes(input.supplierTier)) errors.push('supplier_tier')
  if (!input.contactEmail.trim()) errors.push('contact_email')
  return errors
}

export function validateSupplierItemCreateForm(input: {
  code: string
  supplierId: number
  itemId: number
  leadTimeDays: number
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!Number.isInteger(input.supplierId) || input.supplierId <= 0) errors.push('supplier_id')
  if (!Number.isInteger(input.itemId) || input.itemId <= 0) errors.push('item_id')
  if (!Number.isFinite(input.leadTimeDays) || input.leadTimeDays < 0) {
    errors.push('lead_time_days')
  }
  return errors
}

export function validateSupplierEvaluationCreateForm(input: {
  code: string
  supplierId: number
  evaluationPeriod: string
  qualityScore: number
  deliveryScore: number
  serviceScore: number
  evaluatedAt: string
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!Number.isInteger(input.supplierId) || input.supplierId <= 0) errors.push('supplier_id')
  if (!input.evaluationPeriod.trim()) errors.push('evaluation_period')
  for (const [field, value] of [
    ['quality_score', input.qualityScore],
    ['delivery_score', input.deliveryScore],
    ['service_score', input.serviceScore],
  ] as const) {
    if (!Number.isFinite(value) || value < 0 || value > 100) errors.push(field)
  }
  if (!input.evaluatedAt.trim()) errors.push('evaluated_at')
  return errors
}
