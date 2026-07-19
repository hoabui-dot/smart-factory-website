export type AllowedAction = {
  action: string
  method: string
  href: string
  enabled: boolean
  disabled_reason_code?: string | null
}

export type PageMeta = {
  limit: number
  next_cursor: string | null
  has_more: boolean
}

export type ReferenceListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

/** MES09-001..005 shift record. */
export type ShiftRecord = {
  id: number
  code: string
  start_time: string
  end_time: string
  is_overnight: boolean
  allowed_actions?: AllowedAction[]
}

export type ShiftListPage = {
  items: ShiftRecord[]
  page: PageMeta
}

export type ShiftListQuery = ReferenceListQuery

/** MES09-003 body. */
export type ShiftCreateRequest = {
  code: string
  start_time: string
  end_time: string
}

/** MES09-004 sparse PATCH body. */
export type ShiftUpdateRequest = {
  code?: string
  start_time?: string
  end_time?: string
}

export const ROLE_ON_LINE_VALUES = ['OPERATOR', 'LEADER', 'HELPER'] as const
export type RoleOnLine = (typeof ROLE_ON_LINE_VALUES)[number]

/** MES09-006..010 shift_assignment record — shift_code/operator_code/work_center_code projected. */
export type ShiftAssignmentRecord = {
  id: number
  code: string
  work_date: string
  shift_id: number
  operator_id: number
  work_center_id: number
  role_on_line: RoleOnLine | string
  shift_code?: string
  operator_code?: string
  work_center_code?: string
  allowed_actions?: AllowedAction[]
}

export type ShiftAssignmentListPage = {
  items: ShiftAssignmentRecord[]
  page: PageMeta
}

export type ShiftAssignmentListQuery = ReferenceListQuery

/** MES09-008 body. */
export type ShiftAssignmentCreateRequest = {
  code: string
  work_date: string
  shift_id: number
  operator_id: number
  work_center_id: number
  role_on_line: string
}

/** MES09-009 sparse PATCH body. */
export type ShiftAssignmentUpdateRequest = {
  code?: string
  work_date?: string
  shift_id?: number
  operator_id?: number
  work_center_id?: number
  role_on_line?: string
}

export const SKILL_CATEGORY_VALUES = [
  'OPERATION',
  'INSPECTION',
  'MAINTENANCE',
  'FORKLIFT',
  'SAFETY',
] as const
export type SkillCategory = (typeof SKILL_CATEGORY_VALUES)[number]

/** MES09-011..015 skill_master record. */
export type SkillMasterRecord = {
  id: number
  code: string
  skill_name: string
  skill_category: SkillCategory | string
  validity_months?: number | null
  issuer: string
  is_active: boolean
  allowed_actions?: AllowedAction[]
}

export type SkillMasterListPage = {
  items: SkillMasterRecord[]
  page: PageMeta
}

export type SkillMasterListQuery = ReferenceListQuery

/** MES09-013 body. */
export type SkillMasterCreateRequest = {
  code: string
  skill_name: string
  skill_category: string
  validity_months?: number | null
  issuer: string
  is_active: boolean
}

/** MES09-014 sparse PATCH body. */
export type SkillMasterUpdateRequest = {
  code?: string
  skill_name?: string
  skill_category?: string
  validity_months?: number | null
  issuer?: string
  is_active?: boolean
}

export const OPERATOR_SKILL_LEVEL_VALUES = ['TRAINEE', 'QUALIFIED', 'EXPERT'] as const
export type OperatorSkillLevel = (typeof OPERATOR_SKILL_LEVEL_VALUES)[number]

export const OPERATOR_SKILL_STATUS_VALUES = ['ACTIVE', 'SUSPENDED', 'EXPIRED'] as const
export type OperatorSkillStatus = (typeof OPERATOR_SKILL_STATUS_VALUES)[number]

/** MES09-016..020 operator_skill record — operator_code/skill_code projected. */
export type OperatorSkillRecord = {
  id: number
  code: string
  operator_id: number
  skill_id: number
  level: OperatorSkillLevel | string
  issued_date: string
  expiry_date?: string | null
  certificate_file_id?: number | null
  status: OperatorSkillStatus | string
  operator_code?: string
  skill_code?: string
  allowed_actions?: AllowedAction[]
}

export type OperatorSkillListPage = {
  items: OperatorSkillRecord[]
  page: PageMeta
}

export type OperatorSkillListQuery = ReferenceListQuery

/** MES09-018 body. */
export type OperatorSkillCreateRequest = {
  code: string
  operator_id: number
  skill_id: number
  level: string
  issued_date: string
  expiry_date?: string | null
  certificate_file_id?: number | null
  status: string
}

/** MES09-019 sparse PATCH body. */
export type OperatorSkillUpdateRequest = {
  code?: string
  operator_id?: number
  skill_id?: number
  level?: string
  issued_date?: string
  expiry_date?: string | null
  certificate_file_id?: number | null
  status?: string
}

export const TRAINING_RESULT_VALUES = ['PASS', 'FAIL', 'IN_PROGRESS'] as const
export type TrainingResult = (typeof TRAINING_RESULT_VALUES)[number]

/** MES09-021..023 training_record record — operator_code/skill_code/instructor_code projected;
 * no update/deactivate endpoint exists for this entity (list/get/create only). */
export type TrainingRecordRecord = {
  id: number
  code: string
  operator_id: number
  skill_id: number
  training_date: string
  duration_hours: number
  instructor_id: number
  exam_score?: number | null
  pass_threshold?: number | null
  result: TrainingResult | string
  notes?: string | null
  operator_code?: string
  skill_code?: string
  instructor_code?: string
}

export type TrainingRecordListPage = {
  items: TrainingRecordRecord[]
  page: PageMeta
}

export type TrainingRecordListQuery = ReferenceListQuery

/** MES09-023 body. */
export type TrainingRecordCreateRequest = {
  code: string
  operator_id: number
  skill_id: number
  training_date: string
  duration_hours: number
  instructor_id: number
  exam_score?: number | null
  pass_threshold?: number | null
  result: string
  notes?: string | null
}

export type ShiftRow = {
  code: string
  startTime: string
  endTime: string
  isOvernight: boolean
  canUpdate: boolean
  canDeactivate: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
  updateDisabledReason: string | null
  deactivateDisabledReason: string | null
}

export type ShiftAssignmentRow = {
  code: string
  workDate: string
  shiftLabel: string
  operatorLabel: string
  workCenterLabel: string
  roleOnLine: string
  canUpdate: boolean
  canDeactivate: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
  updateDisabledReason: string | null
  deactivateDisabledReason: string | null
}

export type SkillMasterRow = {
  code: string
  skillName: string
  skillCategory: string
  validityMonths: string
  issuer: string
  isActive: boolean
  canUpdate: boolean
  canDeactivate: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
  updateDisabledReason: string | null
  deactivateDisabledReason: string | null
}

export type OperatorSkillRow = {
  code: string
  operatorLabel: string
  skillLabel: string
  level: string
  issuedDate: string
  expiryDate: string
  status: string
  canUpdate: boolean
  canDeactivate: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
  updateDisabledReason: string | null
  deactivateDisabledReason: string | null
}

export type TrainingRecordRow = {
  code: string
  operatorLabel: string
  skillLabel: string
  trainingDate: string
  durationHours: number
  instructorLabel: string
  result: string
}
