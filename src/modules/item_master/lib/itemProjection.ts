import type { AllowedAction, ItemRecord, ItemRow } from '../types/itemMaster'

const UNAVAILABLE = '-'

/** Never infer mutation availability from is_active — server allowed_actions is authoritative. */
export function findAllowedAction(
  actions: AllowedAction[] | undefined,
  action: string,
): AllowedAction | null {
  return actions?.find((item) => item.action === action) ?? null
}

export function isActionEnabled(actions: AllowedAction[] | undefined, action: string): boolean {
  return findAllowedAction(actions, action)?.enabled === true
}

export function projectItemRow(item: ItemRecord): ItemRow {
  const updateAction = findAllowedAction(item.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(item.allowed_actions, 'deactivate')
  return {
    code: item.code || UNAVAILABLE,
    itemName: item.item_name || UNAVAILABLE,
    itemTypeLabel: item.item_type_code || UNAVAILABLE,
    categoryLabel: item.category_code || UNAVAILABLE,
    baseUomLabel: item.base_uom_code || UNAVAILABLE,
    isActive: item.is_active,
    isLotTracked: item.is_lot_tracked,
    isSerialTracked: item.is_serial_tracked,
    isPhantom: item.is_phantom,
    shelfLifeDays:
      item.shelf_life_days == null ? UNAVAILABLE : String(item.shelf_life_days),
    currentRevisionLabel: item.current_revision_code || UNAVAILABLE,
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

export function resolveItemListState(input: {
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

export function validateItemCreateForm(input: {
  code: string
  itemName: string
  itemTypeId: number
  categoryId: number
  baseUomId: number
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!input.itemName.trim()) errors.push('item_name')
  if (!Number.isInteger(input.itemTypeId) || input.itemTypeId <= 0) errors.push('item_type_id')
  if (!Number.isInteger(input.categoryId) || input.categoryId <= 0) errors.push('category_id')
  if (!Number.isInteger(input.baseUomId) || input.baseUomId <= 0) errors.push('base_uom_id')
  return errors
}
