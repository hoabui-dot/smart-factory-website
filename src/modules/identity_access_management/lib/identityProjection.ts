import type { AllowedAction, ResetPasswordResult, StationDevice, UserSummary } from '../types/userAdmin'

export type UserRow = {
  code: string
  fullName: string
  emailLabel: string
  activeLabel: string
}

export function projectUserRow(user: UserSummary): UserRow {
  return {
    code: user.code,
    fullName: user.full_name,
    emailLabel: user.email?.trim() ? user.email : '—',
    activeLabel: user.is_active ? 'Active' : 'Disabled',
  }
}

export type IdentityListUiState =
  | 'loading'
  | 'empty'
  | 'no-result'
  | 'ready'
  | 'permission-denied'
  | 'error'

export function resolveIdentityListState(input: {
  status: 'loading' | 'success' | 'error'
  itemCount: number
  hasQuery: boolean
  errorCode?: string | null
}): IdentityListUiState {
  if (input.status === 'loading') return 'loading'
  if (input.status === 'error') {
    return input.errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  }
  if (input.itemCount === 0) return input.hasQuery ? 'no-result' : 'empty'
  return 'ready'
}

export type ResetPasswordUiState =
  | 'idle'
  | 'pending'
  | 'queued'
  | 'temporary-pin'
  | 'retryable-partial'
  | 'error'

export function resolveResetPasswordUi(input: {
  status: 'idle' | 'pending' | 'success' | 'error'
  result?: ResetPasswordResult | null
  errorCode?: string | null
}): ResetPasswordUiState {
  if (input.status === 'idle') return 'idle'
  if (input.status === 'pending') return 'pending'
  if (input.status === 'error') {
    return input.errorCode === 'CREDENTIAL_RESET_PARTIAL_FAILURE' ? 'retryable-partial' : 'error'
  }
  if (input.result?.temporary_pin) return 'temporary-pin'
  if (input.result?.job_code || input.result?.status === 'QUEUED') return 'queued'
  return 'error'
}

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

export type StationDeviceRow = {
  code: string
  deviceType: string
  locationLabel: string
  hardwareId: string
  isActive: boolean
  registeredAt: string
  canUpdate: boolean
  canDeactivate: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
  updateDisabledReason: string | null
  deactivateDisabledReason: string | null
}

/** NB01-014..018 row projection — location_code is the resolved business code (no raw FK id). */
export function projectStationDeviceRow(d: StationDevice): StationDeviceRow {
  const updateAction = findAllowedAction(d.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(d.allowed_actions, 'deactivate')
  return {
    code: d.code || UNAVAILABLE,
    deviceType: d.device_type || UNAVAILABLE,
    locationLabel: d.location_code ?? UNAVAILABLE,
    hardwareId: d.hardware_id || UNAVAILABLE,
    isActive: Boolean(d.is_active),
    registeredAt: d.registered_at || UNAVAILABLE,
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

export function resolveStationDeviceMutationUi(input: {
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

export function validateStationDeviceCreateForm(input: {
  code: string
  deviceType: string
  hardwareId: string
  locationCode: string
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!input.deviceType.trim()) errors.push('device_type')
  if (!input.hardwareId.trim()) errors.push('hardware_id')
  if (input.deviceType.trim() !== 'WORKSTATION' && !input.locationCode.trim()) {
    errors.push('location_code')
  }
  return errors
}
