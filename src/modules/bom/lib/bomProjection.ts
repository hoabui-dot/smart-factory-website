import type {
  AllowedAction,
  BomHeaderRecord,
  BomLineRecord,
  BomLineRow,
  BomLookups,
  BomRow,
  ItemLookupRecord,
  UomLookupRecord,
} from '../types/bom'

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

/** Builds id->code lookup maps so raw FK ids are never rendered on the BOM screens. */
export function buildBomLookups(input: {
  uoms: UomLookupRecord[]
  items: ItemLookupRecord[]
}): BomLookups {
  const uomCodeById = new Map<number, string>()
  for (const u of input.uoms) uomCodeById.set(u.id, u.code)

  const itemCodeById = new Map<number, string>()
  for (const item of input.items) itemCodeById.set(item.id, item.code)

  return { uomCodeById, itemCodeById }
}

export function projectBomRow(bh: BomHeaderRecord, lookups: BomLookups): BomRow {
  const updateAction = findAllowedAction(bh.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(bh.allowed_actions, 'deactivate')
  const copyAction = findAllowedAction(bh.allowed_actions, 'copy')
  const releaseAction = findAllowedAction(bh.allowed_actions, 'release')
  const obsoleteAction = findAllowedAction(bh.allowed_actions, 'obsolete')
  const productItemLabel =
    bh.product_item_code || lookups.itemCodeById.get(bh.product_item_id) || UNAVAILABLE
  return {
    code: bh.code || UNAVAILABLE,
    productItemLabel,
    version: bh.version || UNAVAILABLE,
    status: bh.status || UNAVAILABLE,
    effectiveFrom: bh.effective_from || UNAVAILABLE,
    effectiveTo: bh.effective_to || UNAVAILABLE,
    canUpdate: updateAction?.enabled === true,
    canDeactivate: deactivateAction?.enabled === true,
    canCopy: copyAction?.enabled === true,
    canRelease: releaseAction?.enabled === true,
    canObsolete: obsoleteAction?.enabled === true,
    updateAction,
    deactivateAction,
    copyAction,
    releaseAction,
    obsoleteAction,
    updateDisabledReason: updateAction?.enabled ? null : updateAction?.disabled_reason_code ?? null,
    deactivateDisabledReason: deactivateAction?.enabled
      ? null
      : deactivateAction?.disabled_reason_code ?? null,
    copyDisabledReason: copyAction?.enabled ? null : copyAction?.disabled_reason_code ?? null,
    releaseDisabledReason: releaseAction?.enabled ? null : releaseAction?.disabled_reason_code ?? null,
    obsoleteDisabledReason: obsoleteAction?.enabled
      ? null
      : obsoleteAction?.disabled_reason_code ?? null,
  }
}

/** BOM lines are read-only on this screen (import-managed via BOM_IMPORT) — no allowed_actions gate needed. */
export function projectBomLineRow(line: BomLineRecord, lookups: BomLookups): BomLineRow {
  const materialItemLabel =
    line.material_item_code || lookups.itemCodeById.get(line.material_item_id) || UNAVAILABLE
  const uomLabel = line.uom_code || lookups.uomCodeById.get(line.uom_id) || UNAVAILABLE
  return {
    code: line.code || UNAVAILABLE,
    materialItemLabel,
    qtyPerUnit: line.qty_per_unit,
    scrapRate: line.scrap_rate,
    uomLabel,
  }
}

export function resolveBomListState(input: {
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

export function validateBomCreateForm(input: {
  code: string
  productItemId: number
  version: string
  status: string
  effectiveFrom: string
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!Number.isInteger(input.productItemId) || input.productItemId <= 0) errors.push('product_item_id')
  if (!input.version.trim()) errors.push('version')
  if (!input.status.trim()) errors.push('status')
  if (!input.effectiveFrom.trim()) errors.push('effective_from')
  return errors
}

export function validateBomCopyForm(input: {
  newCode: string
  newVersion: string
  effectiveFrom: string
}): string[] {
  const errors: string[] = []
  if (!input.newCode.trim()) errors.push('new_code')
  if (!input.newVersion.trim()) errors.push('new_version')
  if (!input.effectiveFrom.trim()) errors.push('effective_from')
  return errors
}

export function validateBomObsoleteForm(input: { effectiveTo: string }): string[] {
  const errors: string[] = []
  if (!input.effectiveTo.trim()) errors.push('effective_to')
  return errors
}
