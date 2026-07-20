import type {
  AllowedAction,
  OperatorSkillRecord,
  OperatorSkillRow,
  ShiftAssignmentRecord,
  ShiftAssignmentRow,
  ShiftRecord,
  ShiftRow,
  SkillMasterRecord,
  SkillMasterRow,
  TrainingRecordRecord,
  TrainingRecordRow,
} from '../types/shiftSkill'
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

/** Builds id->code lookup maps for shift/user/work_center/skill so raw FK ids never render. */
export function buildShiftSkillLookups(input: {
  shifts?: ShiftRecord[]
  workCenters?: { id: number; code: string }[]
  skills?: SkillMasterRecord[]
  users?: { id: number; code: string }[]
}): {
  shiftCodeById: Map<number, string>
  workCenterCodeById: Map<number, string>
  skillCodeById: Map<number, string>
  userCodeById: Map<number, string>
} {
  const shiftCodeById = new Map<number, string>()
  for (const s of input.shifts ?? []) shiftCodeById.set(s.id, s.code)

  const workCenterCodeById = new Map<number, string>()
  for (const wc of input.workCenters ?? []) workCenterCodeById.set(wc.id, wc.code)

  const skillCodeById = new Map<number, string>()
  for (const sk of input.skills ?? []) skillCodeById.set(sk.id, sk.code)

  const userCodeById = new Map<number, string>()
  for (const u of input.users ?? []) userCodeById.set(u.id, u.code)

  return { shiftCodeById, workCenterCodeById, skillCodeById, userCodeById }
}

export function projectShiftRow(s: ShiftRecord): ShiftRow {
  const updateAction = findAllowedAction(s.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(s.allowed_actions, 'deactivate')
  return {
    code: s.code || UNAVAILABLE,
    startTime: s.start_time || UNAVAILABLE,
    endTime: s.end_time || UNAVAILABLE,
    isOvernight: Boolean(s.is_overnight),
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

export function projectShiftAssignmentRow(
  sa: ShiftAssignmentRecord,
  lookups: { shiftCodeById: Map<number, string>; workCenterCodeById: Map<number, string>; userCodeById: Map<number, string> },
): ShiftAssignmentRow {
  const updateAction = findAllowedAction(sa.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(sa.allowed_actions, 'deactivate')
  return {
    code: sa.code || UNAVAILABLE,
    workDate: sa.work_date ? formatDate(sa.work_date) : UNAVAILABLE,
    shiftLabel: sa.shift_code || lookups.shiftCodeById.get(sa.shift_id) || UNAVAILABLE,
    operatorLabel: sa.operator_code || lookups.userCodeById.get(sa.operator_id) || UNAVAILABLE,
    workCenterLabel:
      sa.work_center_code || lookups.workCenterCodeById.get(sa.work_center_id) || UNAVAILABLE,
    roleOnLine: sa.role_on_line || UNAVAILABLE,
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

export function projectSkillMasterRow(sm: SkillMasterRecord): SkillMasterRow {
  const updateAction = findAllowedAction(sm.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(sm.allowed_actions, 'deactivate')
  return {
    code: sm.code || UNAVAILABLE,
    skillName: sm.skill_name || UNAVAILABLE,
    skillCategory: sm.skill_category || UNAVAILABLE,
    validityMonths: sm.validity_months == null ? UNAVAILABLE : String(sm.validity_months),
    issuer: sm.issuer || UNAVAILABLE,
    isActive: Boolean(sm.is_active),
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

export function projectOperatorSkillRow(
  os: OperatorSkillRecord,
  lookups: { skillCodeById: Map<number, string>; userCodeById: Map<number, string> },
): OperatorSkillRow {
  const updateAction = findAllowedAction(os.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(os.allowed_actions, 'deactivate')
  return {
    code: os.code || UNAVAILABLE,
    operatorLabel: os.operator_code || lookups.userCodeById.get(os.operator_id) || UNAVAILABLE,
    skillLabel: os.skill_code || lookups.skillCodeById.get(os.skill_id) || UNAVAILABLE,
    level: os.level || UNAVAILABLE,
    issuedDate: os.issued_date ? formatDate(os.issued_date) : UNAVAILABLE,
    expiryDate: os.expiry_date ? formatDate(os.expiry_date) : UNAVAILABLE,
    status: os.status || UNAVAILABLE,
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

export function projectTrainingRecordRow(
  tr: TrainingRecordRecord,
  lookups: { skillCodeById: Map<number, string>; userCodeById: Map<number, string> },
): TrainingRecordRow {
  return {
    code: tr.code || UNAVAILABLE,
    operatorLabel: tr.operator_code || lookups.userCodeById.get(tr.operator_id) || UNAVAILABLE,
    skillLabel: tr.skill_code || lookups.skillCodeById.get(tr.skill_id) || UNAVAILABLE,
    trainingDate: tr.training_date ? formatDate(tr.training_date) : UNAVAILABLE,
    durationHours: tr.duration_hours,
    instructorLabel:
      tr.instructor_code || lookups.userCodeById.get(tr.instructor_id) || UNAVAILABLE,
    result: tr.result || UNAVAILABLE,
  }
}

export function resolveShiftSkillListState(input: {
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

export function validateShiftCreateForm(input: { code: string; startTime: string; endTime: string }): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!input.startTime.trim()) errors.push('start_time')
  if (!input.endTime.trim()) errors.push('end_time')
  return errors
}

export function validateShiftAssignmentCreateForm(input: {
  code: string
  workDate: string
  shiftId: number
  operatorId: number
  workCenterId: number
  roleOnLine: string
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!input.workDate.trim()) errors.push('work_date')
  if (!Number.isInteger(input.shiftId) || input.shiftId <= 0) errors.push('shift_id')
  if (!Number.isInteger(input.operatorId) || input.operatorId <= 0) errors.push('operator_id')
  if (!Number.isInteger(input.workCenterId) || input.workCenterId <= 0) errors.push('work_center_id')
  if (!input.roleOnLine.trim()) errors.push('role_on_line')
  return errors
}

export function validateSkillMasterCreateForm(input: {
  code: string
  skillName: string
  skillCategory: string
  issuer: string
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!input.skillName.trim()) errors.push('skill_name')
  if (!input.skillCategory.trim()) errors.push('skill_category')
  if (!input.issuer.trim()) errors.push('issuer')
  return errors
}

export function validateOperatorSkillCreateForm(input: {
  code: string
  operatorId: number
  skillId: number
  level: string
  issuedDate: string
  status: string
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!Number.isInteger(input.operatorId) || input.operatorId <= 0) errors.push('operator_id')
  if (!Number.isInteger(input.skillId) || input.skillId <= 0) errors.push('skill_id')
  if (!input.level.trim()) errors.push('level')
  if (!input.issuedDate.trim()) errors.push('issued_date')
  if (!input.status.trim()) errors.push('status')
  return errors
}

export function validateTrainingRecordCreateForm(input: {
  code: string
  operatorId: number
  skillId: number
  trainingDate: string
  durationHours: number
  instructorId: number
  result: string
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!Number.isInteger(input.operatorId) || input.operatorId <= 0) errors.push('operator_id')
  if (!Number.isInteger(input.skillId) || input.skillId <= 0) errors.push('skill_id')
  if (!input.trainingDate.trim()) errors.push('training_date')
  if (!Number.isFinite(input.durationHours) || input.durationHours <= 0) {
    errors.push('duration_hours')
  }
  if (!Number.isInteger(input.instructorId) || input.instructorId <= 0) errors.push('instructor_id')
  if (!input.result.trim()) errors.push('result')
  return errors
}
