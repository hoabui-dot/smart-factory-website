import type {
  AllowedAction,
  ItemLookupRecord,
  MachineRecord,
  MachineRow,
  RoutingHeaderRecord,
  RoutingLookups,
  RoutingRow,
  UomLookupRecord,
  WorkCenterRecord,
  WorkCenterRow,
} from '../types/routing'
import { formatDate } from '../../../shared/lib/formatDate.ts'

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

/** Builds id->code lookup maps so raw FK ids are never rendered on the routing screens. */
export function buildRoutingLookups(input: {
  uoms: UomLookupRecord[]
  workCenters: WorkCenterRecord[]
  items: ItemLookupRecord[]
}): RoutingLookups {
  const uomCodeById = new Map<number, string>()
  for (const u of input.uoms) uomCodeById.set(u.id, u.code)

  const workCenterCodeById = new Map<number, string>()
  for (const wc of input.workCenters) workCenterCodeById.set(wc.id, wc.code)

  const itemCodeById = new Map<number, string>()
  for (const item of input.items) itemCodeById.set(item.id, item.code)

  return { uomCodeById, workCenterCodeById, itemCodeById }
}

export function projectWorkCenterRow(wc: WorkCenterRecord, lookups: RoutingLookups): WorkCenterRow {
  const updateAction = findAllowedAction(wc.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(wc.allowed_actions, 'deactivate')
  const uomLabel = wc.capacity_uom_code || lookups.uomCodeById.get(wc.capacity_uom_id) || UNAVAILABLE
  return {
    code: wc.code || UNAVAILABLE,
    name: wc.name || UNAVAILABLE,
    capacityPerHour: wc.capacity_per_hour,
    capacityUomLabel: uomLabel,
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

export function projectMachineRow(m: MachineRecord, lookups: RoutingLookups): MachineRow {
  const updateAction = findAllowedAction(m.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(m.allowed_actions, 'deactivate')
  const workCenterLabel =
    m.work_center_code || lookups.workCenterCodeById.get(m.work_center_id) || UNAVAILABLE
  return {
    code: m.code || UNAVAILABLE,
    workCenterLabel,
    lastPmDate: m.last_pm_date ? formatDate(m.last_pm_date) : UNAVAILABLE,
    nextPmDue: m.next_pm_due ? formatDate(m.next_pm_due) : UNAVAILABLE,
    status: m.status || UNAVAILABLE,
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

export function projectRoutingRow(rh: RoutingHeaderRecord, lookups: RoutingLookups): RoutingRow {
  const updateAction = findAllowedAction(rh.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(rh.allowed_actions, 'deactivate')
  const releaseAction = findAllowedAction(rh.allowed_actions, 'release')
  const obsoleteAction = findAllowedAction(rh.allowed_actions, 'obsolete')
  const productItemLabel =
    rh.product_item_code || lookups.itemCodeById.get(rh.product_item_id) || UNAVAILABLE
  return {
    code: rh.code || UNAVAILABLE,
    productItemLabel,
    version: rh.version || UNAVAILABLE,
    status: rh.status || UNAVAILABLE,
    effectiveFrom: formatDate(rh.effective_from),
    effectiveTo: rh.effective_to ? formatDate(rh.effective_to) : UNAVAILABLE,
    canUpdate: updateAction?.enabled === true,
    canDeactivate: deactivateAction?.enabled === true,
    canRelease: releaseAction?.enabled === true,
    canObsolete: obsoleteAction?.enabled === true,
    updateAction,
    deactivateAction,
    releaseAction,
    obsoleteAction,
    updateDisabledReason: updateAction?.enabled ? null : updateAction?.disabled_reason_code ?? null,
    deactivateDisabledReason: deactivateAction?.enabled
      ? null
      : deactivateAction?.disabled_reason_code ?? null,
    releaseDisabledReason: releaseAction?.enabled ? null : releaseAction?.disabled_reason_code ?? null,
    obsoleteDisabledReason: obsoleteAction?.enabled
      ? null
      : obsoleteAction?.disabled_reason_code ?? null,
  }
}

export function resolveRoutingListState(input: {
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

export function validateWorkCenterCreateForm(input: {
  code: string
  name: string
  capacityPerHour: number
  capacityUomId: number
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!input.name.trim()) errors.push('name')
  if (!Number.isFinite(input.capacityPerHour) || input.capacityPerHour <= 0) {
    errors.push('capacity_per_hour')
  }
  if (!Number.isInteger(input.capacityUomId) || input.capacityUomId <= 0) {
    errors.push('capacity_uom_id')
  }
  return errors
}

export function validateMachineCreateForm(input: {
  code: string
  workCenterId: number
  lastPmDate: string
  nextPmDue: string
  status: string
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!Number.isInteger(input.workCenterId) || input.workCenterId <= 0) errors.push('work_center_id')
  if (!input.lastPmDate.trim()) errors.push('last_pm_date')
  if (!input.nextPmDue.trim()) errors.push('next_pm_due')
  if (!input.status.trim()) errors.push('status')
  return errors
}

export function validateRoutingCreateForm(input: {
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
