import type {
  AllowedAction,
  LocationLookups,
  LocationRecord,
  LocationRow,
  LocationTypeRecord,
  WarehouseCategoryRecord,
} from '../types/binLocation'

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

/** Builds id->code/label maps so raw FK ids are never rendered (WEB-WMS-01-LOCATION §C). */
export function buildLocationLookups(input: {
  locations: LocationRecord[]
  locationTypes: LocationTypeRecord[]
  warehouseCategories: WarehouseCategoryRecord[]
}): LocationLookups {
  const locationTypeById = new Map<number, LocationTypeRecord>()
  for (const t of input.locationTypes) locationTypeById.set(t.id, t)

  const warehouseCategoryById = new Map<number, WarehouseCategoryRecord>()
  for (const c of input.warehouseCategories) warehouseCategoryById.set(c.id, c)

  const locationCodeById = new Map<number, string>()
  for (const loc of input.locations) locationCodeById.set(loc.id, loc.code)

  return { locationTypeById, warehouseCategoryById, locationCodeById }
}

export function projectLocationRow(loc: LocationRecord, lookups: LocationLookups): LocationRow {
  const updateAction = findAllowedAction(loc.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(loc.allowed_actions, 'deactivate')
  const locationType = lookups.locationTypeById.get(loc.location_type_id)
  const warehouseCategory =
    loc.warehouse_category_id != null
      ? lookups.warehouseCategoryById.get(loc.warehouse_category_id)
      : undefined
  const parentCode =
    loc.parent_location_id != null ? lookups.locationCodeById.get(loc.parent_location_id) : undefined

  return {
    code: loc.code || UNAVAILABLE,
    locationName: loc.location_name || UNAVAILABLE,
    locationTypeLabel: locationType?.code || UNAVAILABLE,
    warehouseCategoryLabel: warehouseCategory?.code || UNAVAILABLE,
    parentLabel: parentCode || UNAVAILABLE,
    level: loc.level,
    path: loc.path || UNAVAILABLE,
    barcode: loc.barcode || UNAVAILABLE,
    capacityQty: loc.capacity_qty == null ? UNAVAILABLE : String(loc.capacity_qty),
    isActive: loc.is_active,
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

export function resolveLocationListState(input: {
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

export function validateLocationCreateForm(input: {
  code: string
  locationName: string
  locationTypeId: number
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!input.locationName.trim()) errors.push('location_name')
  if (!Number.isInteger(input.locationTypeId) || input.locationTypeId <= 0) {
    errors.push('location_type_id')
  }
  return errors
}
