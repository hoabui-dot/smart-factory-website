import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  createOperatorSkill,
  createShift,
  createShiftAssignment,
  createSkillMaster,
  createTrainingRecord,
  deactivateOperatorSkillViaAction,
  deactivateShiftAssignmentViaAction,
  deactivateShiftViaAction,
  deactivateSkillMasterViaAction,
  getOperatorSkill,
  getShift,
  getShiftAssignment,
  getSkillMaster,
  listOperatorSkills,
  listShiftAssignments,
  listShifts,
  listSkillMasters,
  listTrainingRecords,
  updateOperatorSkillViaAction,
  updateShiftAssignmentViaAction,
  updateShiftViaAction,
  updateSkillMasterViaAction,
} from '../api/shiftSkillApi'
import {
  buildShiftSkillLookups,
  projectOperatorSkillRow,
  projectShiftAssignmentRow,
  projectShiftRow,
  projectSkillMasterRow,
  projectTrainingRecordRow,
  resolveMutationUiState,
  resolveShiftSkillListState,
  validateOperatorSkillCreateForm,
  validateShiftAssignmentCreateForm,
  validateShiftCreateForm,
  validateSkillMasterCreateForm,
  validateTrainingRecordCreateForm,
} from '../lib/shiftSkillProjection'
import type {
  OperatorSkillCreateRequest,
  OperatorSkillUpdateRequest,
  ShiftAssignmentCreateRequest,
  ShiftAssignmentUpdateRequest,
  ShiftCreateRequest,
  ShiftUpdateRequest,
  SkillMasterCreateRequest,
  SkillMasterUpdateRequest,
  TrainingRecordCreateRequest,
} from '../types/shiftSkill'

export type ShiftSkillTab =
  | 'shifts'
  | 'shift_assignments'
  | 'skills'
  | 'operator_skills'
  | 'training_records'

const SHIFTS_KEY = ['mes09', 'shifts'] as const
const SHIFT_DETAIL_KEY = ['mes09', 'shift'] as const
const ASSIGNMENTS_KEY = ['mes09', 'shift-assignments'] as const
const ASSIGNMENT_DETAIL_KEY = ['mes09', 'shift-assignment'] as const
const SKILLS_KEY = ['mes09', 'skills'] as const
const SKILL_DETAIL_KEY = ['mes09', 'skill'] as const
const OPERATOR_SKILLS_KEY = ['mes09', 'operator-skills'] as const
const OPERATOR_SKILL_DETAIL_KEY = ['mes09', 'operator-skill'] as const
const TRAINING_RECORDS_KEY = ['mes09', 'training-records'] as const

const EMPTY_SHIFT_FORM: ShiftCreateRequest = { code: '', start_time: '06:00', end_time: '14:00' }

const EMPTY_ASSIGNMENT_FORM: ShiftAssignmentCreateRequest = {
  code: '',
  work_date: '',
  shift_id: 0,
  operator_id: 0,
  work_center_id: 0,
  role_on_line: 'OPERATOR',
}

const EMPTY_SKILL_FORM: SkillMasterCreateRequest = {
  code: '',
  skill_name: '',
  skill_category: 'OPERATION',
  validity_months: null,
  issuer: '',
  is_active: true,
}

const EMPTY_OPERATOR_SKILL_FORM: OperatorSkillCreateRequest = {
  code: '',
  operator_id: 0,
  skill_id: 0,
  level: 'TRAINEE',
  issued_date: '',
  expiry_date: null,
  certificate_file_id: null,
  status: 'ACTIVE',
}

const EMPTY_TRAINING_RECORD_FORM: TrainingRecordCreateRequest = {
  code: '',
  operator_id: 0,
  skill_id: 0,
  training_date: '',
  duration_hours: 0,
  instructor_id: 0,
  exam_score: null,
  pass_threshold: null,
  result: 'IN_PROGRESS',
  notes: null,
}

function mutationStatus(mutation: {
  isPending: boolean
  isSuccess: boolean
  isError: boolean
}): 'idle' | 'pending' | 'success' | 'error' {
  if (mutation.isPending) return 'pending'
  if (mutation.isSuccess) return 'success'
  if (mutation.isError) return 'error'
  return 'idle'
}

export function useShiftSkill() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<ShiftSkillTab>('shifts')

  // Operator/instructor selection has a known lookup gap: `/api/admin/users` is system_admin_only
  // and its UserSummary DTO carries no numeric `id`, so there is no safe client-side code->id
  // resolver (same class of gap as WMS-01b's manager_user_id note). Create/edit forms therefore
  // collect a raw numeric user id directly, while list/detail always render the server-projected
  // `*_code` business field (operator_code/instructor_code) — never a raw id.

  // ---- Shifts ----
  const [shiftSearchInput, setShiftSearchInput] = useState('')
  const [shiftAppliedQuery, setShiftAppliedQuery] = useState('')
  const [shiftCursor, setShiftCursor] = useState<string | undefined>()
  const [selectedShiftCode, setSelectedShiftCode] = useState<string | null>(null)
  const [showShiftCreate, setShowShiftCreate] = useState(false)
  const [shiftCreateForm, setShiftCreateForm] = useState<ShiftCreateRequest>(EMPTY_SHIFT_FORM)
  const [confirmShiftDeactivate, setConfirmShiftDeactivate] = useState(false)

  const shiftsQuery = useQuery({
    queryKey: [...SHIFTS_KEY, { q: shiftAppliedQuery, cursor: shiftCursor }],
    queryFn: () => listShifts({ q: shiftAppliedQuery || undefined, cursor: shiftCursor, limit: 50 }),
    enabled: tab === 'shifts' || tab === 'shift_assignments',
  })

  const shiftDetailQuery = useQuery({
    queryKey: [...SHIFT_DETAIL_KEY, selectedShiftCode],
    queryFn: () => getShift(selectedShiftCode as string),
    enabled: Boolean(selectedShiftCode),
  })

  // ---- Shift assignments ----
  const [saSearchInput, setSaSearchInput] = useState('')
  const [saAppliedQuery, setSaAppliedQuery] = useState('')
  const [saCursor, setSaCursor] = useState<string | undefined>()
  const [selectedAssignmentCode, setSelectedAssignmentCode] = useState<string | null>(null)
  const [showAssignmentCreate, setShowAssignmentCreate] = useState(false)
  const [assignmentCreateForm, setAssignmentCreateForm] =
    useState<ShiftAssignmentCreateRequest>(EMPTY_ASSIGNMENT_FORM)
  const [confirmAssignmentDeactivate, setConfirmAssignmentDeactivate] = useState(false)

  const assignmentsQuery = useQuery({
    queryKey: [...ASSIGNMENTS_KEY, { q: saAppliedQuery, cursor: saCursor }],
    queryFn: () =>
      listShiftAssignments({ q: saAppliedQuery || undefined, cursor: saCursor, limit: 50 }),
    enabled: tab === 'shift_assignments',
  })

  const assignmentDetailQuery = useQuery({
    queryKey: [...ASSIGNMENT_DETAIL_KEY, selectedAssignmentCode],
    queryFn: () => getShiftAssignment(selectedAssignmentCode as string),
    enabled: Boolean(selectedAssignmentCode),
  })

  // ---- Skills ----
  const [skillSearchInput, setSkillSearchInput] = useState('')
  const [skillAppliedQuery, setSkillAppliedQuery] = useState('')
  const [skillCursor, setSkillCursor] = useState<string | undefined>()
  const [selectedSkillCode, setSelectedSkillCode] = useState<string | null>(null)
  const [showSkillCreate, setShowSkillCreate] = useState(false)
  const [skillCreateForm, setSkillCreateForm] = useState<SkillMasterCreateRequest>(EMPTY_SKILL_FORM)
  const [confirmSkillDeactivate, setConfirmSkillDeactivate] = useState(false)

  const skillsQuery = useQuery({
    queryKey: [...SKILLS_KEY, { q: skillAppliedQuery, cursor: skillCursor }],
    queryFn: () =>
      listSkillMasters({ q: skillAppliedQuery || undefined, cursor: skillCursor, limit: 50 }),
    enabled:
      tab === 'skills' || tab === 'operator_skills' || tab === 'training_records',
  })

  const skillDetailQuery = useQuery({
    queryKey: [...SKILL_DETAIL_KEY, selectedSkillCode],
    queryFn: () => getSkillMaster(selectedSkillCode as string),
    enabled: Boolean(selectedSkillCode),
  })

  // ---- Operator skills ----
  const [osSearchInput, setOsSearchInput] = useState('')
  const [osAppliedQuery, setOsAppliedQuery] = useState('')
  const [osCursor, setOsCursor] = useState<string | undefined>()
  const [selectedOperatorSkillCode, setSelectedOperatorSkillCode] = useState<string | null>(null)
  const [showOperatorSkillCreate, setShowOperatorSkillCreate] = useState(false)
  const [operatorSkillCreateForm, setOperatorSkillCreateForm] =
    useState<OperatorSkillCreateRequest>(EMPTY_OPERATOR_SKILL_FORM)
  const [confirmOperatorSkillDeactivate, setConfirmOperatorSkillDeactivate] = useState(false)

  const operatorSkillsQuery = useQuery({
    queryKey: [...OPERATOR_SKILLS_KEY, { q: osAppliedQuery, cursor: osCursor }],
    queryFn: () =>
      listOperatorSkills({ q: osAppliedQuery || undefined, cursor: osCursor, limit: 50 }),
    enabled: tab === 'operator_skills',
  })

  const operatorSkillDetailQuery = useQuery({
    queryKey: [...OPERATOR_SKILL_DETAIL_KEY, selectedOperatorSkillCode],
    queryFn: () => getOperatorSkill(selectedOperatorSkillCode as string),
    enabled: Boolean(selectedOperatorSkillCode),
  })

  // ---- Training records ----
  const [trSearchInput, setTrSearchInput] = useState('')
  const [trAppliedQuery, setTrAppliedQuery] = useState('')
  const [trCursor, setTrCursor] = useState<string | undefined>()
  const [showTrainingRecordCreate, setShowTrainingRecordCreate] = useState(false)
  const [trainingRecordCreateForm, setTrainingRecordCreateForm] =
    useState<TrainingRecordCreateRequest>(EMPTY_TRAINING_RECORD_FORM)

  const trainingRecordsQuery = useQuery({
    queryKey: [...TRAINING_RECORDS_KEY, { q: trAppliedQuery, cursor: trCursor }],
    queryFn: () =>
      listTrainingRecords({ q: trAppliedQuery || undefined, cursor: trCursor, limit: 50 }),
    enabled: tab === 'training_records',
  })

  const lookups = useMemo(
    () =>
      buildShiftSkillLookups({
        shifts: shiftsQuery.data?.items ?? [],
        skills: skillsQuery.data?.items ?? [],
      }),
    [shiftsQuery.data?.items, skillsQuery.data?.items],
  )

  const shiftRows = useMemo(
    () => (shiftsQuery.data?.items ?? []).map((s) => projectShiftRow(s)),
    [shiftsQuery.data?.items],
  )
  const assignmentRows = useMemo(
    () => (assignmentsQuery.data?.items ?? []).map((sa) => projectShiftAssignmentRow(sa, lookups)),
    [assignmentsQuery.data?.items, lookups],
  )
  const skillRows = useMemo(
    () => (skillsQuery.data?.items ?? []).map((sm) => projectSkillMasterRow(sm)),
    [skillsQuery.data?.items],
  )
  const operatorSkillRows = useMemo(
    () => (operatorSkillsQuery.data?.items ?? []).map((os) => projectOperatorSkillRow(os, lookups)),
    [operatorSkillsQuery.data?.items, lookups],
  )
  const trainingRecordRows = useMemo(
    () => (trainingRecordsQuery.data?.items ?? []).map((tr) => projectTrainingRecordRow(tr, lookups)),
    [trainingRecordsQuery.data?.items, lookups],
  )

  const shiftDetailRow = shiftDetailQuery.data ? projectShiftRow(shiftDetailQuery.data) : null
  const assignmentDetailRow = assignmentDetailQuery.data
    ? projectShiftAssignmentRow(assignmentDetailQuery.data, lookups)
    : null
  const skillDetailRow = skillDetailQuery.data ? projectSkillMasterRow(skillDetailQuery.data) : null
  const operatorSkillDetailRow = operatorSkillDetailQuery.data
    ? projectOperatorSkillRow(operatorSkillDetailQuery.data, lookups)
    : null

  const shiftListState = resolveShiftSkillListState({
    status: shiftsQuery.isLoading || shiftsQuery.isFetching ? 'loading' : shiftsQuery.isError ? 'error' : 'success',
    itemCount: shiftRows.length,
    hasQuery: shiftAppliedQuery.trim().length > 0,
    errorCode: shiftsQuery.error instanceof ApiError ? shiftsQuery.error.code : null,
  })

  const assignmentListState = resolveShiftSkillListState({
    status:
      assignmentsQuery.isLoading || assignmentsQuery.isFetching
        ? 'loading'
        : assignmentsQuery.isError
          ? 'error'
          : 'success',
    itemCount: assignmentRows.length,
    hasQuery: saAppliedQuery.trim().length > 0,
    errorCode: assignmentsQuery.error instanceof ApiError ? assignmentsQuery.error.code : null,
  })

  const skillListState = resolveShiftSkillListState({
    status: skillsQuery.isLoading || skillsQuery.isFetching ? 'loading' : skillsQuery.isError ? 'error' : 'success',
    itemCount: skillRows.length,
    hasQuery: skillAppliedQuery.trim().length > 0,
    errorCode: skillsQuery.error instanceof ApiError ? skillsQuery.error.code : null,
  })

  const operatorSkillListState = resolveShiftSkillListState({
    status:
      operatorSkillsQuery.isLoading || operatorSkillsQuery.isFetching
        ? 'loading'
        : operatorSkillsQuery.isError
          ? 'error'
          : 'success',
    itemCount: operatorSkillRows.length,
    hasQuery: osAppliedQuery.trim().length > 0,
    errorCode: operatorSkillsQuery.error instanceof ApiError ? operatorSkillsQuery.error.code : null,
  })

  const trainingRecordListState = resolveShiftSkillListState({
    status:
      trainingRecordsQuery.isLoading || trainingRecordsQuery.isFetching
        ? 'loading'
        : trainingRecordsQuery.isError
          ? 'error'
          : 'success',
    itemCount: trainingRecordRows.length,
    hasQuery: trAppliedQuery.trim().length > 0,
    errorCode: trainingRecordsQuery.error instanceof ApiError ? trainingRecordsQuery.error.code : null,
  })

  const invalidateShifts = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: SHIFTS_KEY })
    void queryClient.invalidateQueries({ queryKey: SHIFT_DETAIL_KEY })
  }, [queryClient])

  const invalidateAssignments = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_KEY })
    void queryClient.invalidateQueries({ queryKey: ASSIGNMENT_DETAIL_KEY })
  }, [queryClient])

  const invalidateSkills = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: SKILLS_KEY })
    void queryClient.invalidateQueries({ queryKey: SKILL_DETAIL_KEY })
  }, [queryClient])

  const invalidateOperatorSkills = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: OPERATOR_SKILLS_KEY })
    void queryClient.invalidateQueries({ queryKey: OPERATOR_SKILL_DETAIL_KEY })
  }, [queryClient])

  const invalidateTrainingRecords = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: TRAINING_RECORDS_KEY })
  }, [queryClient])

  // ---- Shift mutations ----
  const createShiftMutation = useMutation({
    mutationFn: () => createShift({ ...shiftCreateForm, code: shiftCreateForm.code.trim() }),
    onSuccess: (s) => {
      setShowShiftCreate(false)
      setShiftCreateForm(EMPTY_SHIFT_FORM)
      invalidateShifts()
      setSelectedShiftCode(s.code)
    },
  })

  const updateShiftMutation = useMutation({
    mutationFn: (body: ShiftUpdateRequest) => {
      const action = shiftDetailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateShiftViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidateShifts(),
  })

  const deactivateShiftMutation = useMutation({
    mutationFn: () => {
      const action = shiftDetailRow?.deactivateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Deactivate không được server cho phép.', 403)
      return deactivateShiftViaAction(action)
    },
    onSuccess: () => {
      setConfirmShiftDeactivate(false)
      invalidateShifts()
    },
  })

  // ---- Shift assignment mutations ----
  const createAssignmentMutation = useMutation({
    mutationFn: () =>
      createShiftAssignment({ ...assignmentCreateForm, code: assignmentCreateForm.code.trim() }),
    onSuccess: (sa) => {
      setShowAssignmentCreate(false)
      setAssignmentCreateForm(EMPTY_ASSIGNMENT_FORM)
      invalidateAssignments()
      setSelectedAssignmentCode(sa.code)
    },
  })

  const updateAssignmentMutation = useMutation({
    mutationFn: (body: ShiftAssignmentUpdateRequest) => {
      const action = assignmentDetailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateShiftAssignmentViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidateAssignments(),
  })

  const deactivateAssignmentMutation = useMutation({
    mutationFn: () => {
      const action = assignmentDetailRow?.deactivateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Deactivate không được server cho phép.', 403)
      return deactivateShiftAssignmentViaAction(action)
    },
    onSuccess: () => {
      setConfirmAssignmentDeactivate(false)
      invalidateAssignments()
    },
  })

  // ---- Skill master mutations ----
  const createSkillMutation = useMutation({
    mutationFn: () => createSkillMaster({ ...skillCreateForm, code: skillCreateForm.code.trim() }),
    onSuccess: (sm) => {
      setShowSkillCreate(false)
      setSkillCreateForm(EMPTY_SKILL_FORM)
      invalidateSkills()
      setSelectedSkillCode(sm.code)
    },
  })

  const updateSkillMutation = useMutation({
    mutationFn: (body: SkillMasterUpdateRequest) => {
      const action = skillDetailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateSkillMasterViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidateSkills(),
  })

  const deactivateSkillMutation = useMutation({
    mutationFn: () => {
      const action = skillDetailRow?.deactivateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Deactivate không được server cho phép.', 403)
      return deactivateSkillMasterViaAction(action)
    },
    onSuccess: () => {
      setConfirmSkillDeactivate(false)
      invalidateSkills()
    },
  })

  // ---- Operator skill mutations ----
  const createOperatorSkillMutation = useMutation({
    mutationFn: () =>
      createOperatorSkill({ ...operatorSkillCreateForm, code: operatorSkillCreateForm.code.trim() }),
    onSuccess: (os) => {
      setShowOperatorSkillCreate(false)
      setOperatorSkillCreateForm(EMPTY_OPERATOR_SKILL_FORM)
      invalidateOperatorSkills()
      setSelectedOperatorSkillCode(os.code)
    },
  })

  const updateOperatorSkillMutation = useMutation({
    mutationFn: (body: OperatorSkillUpdateRequest) => {
      const action = operatorSkillDetailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateOperatorSkillViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidateOperatorSkills(),
  })

  const deactivateOperatorSkillMutation = useMutation({
    mutationFn: () => {
      const action = operatorSkillDetailRow?.deactivateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Deactivate không được server cho phép.', 403)
      return deactivateOperatorSkillViaAction(action)
    },
    onSuccess: () => {
      setConfirmOperatorSkillDeactivate(false)
      invalidateOperatorSkills()
    },
  })

  // ---- Training record mutation (create-only per screen contract) ----
  const createTrainingRecordMutation = useMutation({
    mutationFn: () =>
      createTrainingRecord({
        ...trainingRecordCreateForm,
        code: trainingRecordCreateForm.code.trim(),
      }),
    onSuccess: () => {
      setShowTrainingRecordCreate(false)
      setTrainingRecordCreateForm(EMPTY_TRAINING_RECORD_FORM)
      invalidateTrainingRecords()
      invalidateOperatorSkills()
    },
  })

  const shiftCreateErrors = validateShiftCreateForm({
    code: shiftCreateForm.code,
    startTime: shiftCreateForm.start_time,
    endTime: shiftCreateForm.end_time,
  })

  const assignmentCreateErrors = validateShiftAssignmentCreateForm({
    code: assignmentCreateForm.code,
    workDate: assignmentCreateForm.work_date,
    shiftId: assignmentCreateForm.shift_id,
    operatorId: assignmentCreateForm.operator_id,
    workCenterId: assignmentCreateForm.work_center_id,
    roleOnLine: assignmentCreateForm.role_on_line,
  })

  const skillCreateErrors = validateSkillMasterCreateForm({
    code: skillCreateForm.code,
    skillName: skillCreateForm.skill_name,
    skillCategory: skillCreateForm.skill_category,
    issuer: skillCreateForm.issuer,
  })

  const operatorSkillCreateErrors = validateOperatorSkillCreateForm({
    code: operatorSkillCreateForm.code,
    operatorId: operatorSkillCreateForm.operator_id,
    skillId: operatorSkillCreateForm.skill_id,
    level: operatorSkillCreateForm.level,
    issuedDate: operatorSkillCreateForm.issued_date,
    status: operatorSkillCreateForm.status,
  })

  const trainingRecordCreateErrors = validateTrainingRecordCreateForm({
    code: trainingRecordCreateForm.code,
    operatorId: trainingRecordCreateForm.operator_id,
    skillId: trainingRecordCreateForm.skill_id,
    trainingDate: trainingRecordCreateForm.training_date,
    durationHours: trainingRecordCreateForm.duration_hours,
    instructorId: trainingRecordCreateForm.instructor_id,
    result: trainingRecordCreateForm.result,
  })

  return {
    tab,
    setTab,

    shiftOptions: shiftsQuery.data?.items ?? [],
    skillOptions: skillsQuery.data?.items ?? [],

    // Shifts
    shiftSearchInput,
    setShiftSearchInput,
    applyShiftSearch: () => {
      setShiftCursor(undefined)
      setShiftAppliedQuery(shiftSearchInput.trim())
    },
    shiftListState,
    shiftListError: shiftsQuery.error instanceof ApiError ? shiftsQuery.error : null,
    shiftRows,
    shiftHasMore: Boolean(shiftsQuery.data?.page.has_more),
    shiftLoadMore: () => {
      const next = shiftsQuery.data?.page.next_cursor
      if (next) setShiftCursor(next)
    },
    selectedShiftCode,
    selectShift: (code: string) => {
      setSelectedShiftCode(code)
      setShowShiftCreate(false)
      setConfirmShiftDeactivate(false)
      updateShiftMutation.reset()
      deactivateShiftMutation.reset()
    },
    shiftDetail: shiftDetailQuery.data ?? null,
    shiftDetailRow,
    shiftDetailLoading: shiftDetailQuery.isLoading,
    showShiftCreate,
    openShiftCreate: () => {
      setSelectedShiftCode(null)
      setShowShiftCreate(true)
    },
    closeShiftCreate: () => setShowShiftCreate(false),
    shiftCreateForm,
    setShiftCreateForm,
    shiftCreateErrors,
    createShift: () => createShiftMutation.mutate(),
    createShiftPending: createShiftMutation.isPending,
    createShiftError: createShiftMutation.error instanceof ApiError ? createShiftMutation.error : null,
    saveShiftEdit: (body: ShiftUpdateRequest) => updateShiftMutation.mutate(body),
    updateShiftPending: updateShiftMutation.isPending,
    updateShiftError: updateShiftMutation.error instanceof ApiError ? updateShiftMutation.error : null,
    updateShiftSuccess: updateShiftMutation.isSuccess,
    confirmShiftDeactivate,
    setConfirmShiftDeactivate,
    deactivateShift: () => deactivateShiftMutation.mutate(),
    deactivateShiftState: resolveMutationUiState({
      confirmOpen: confirmShiftDeactivate,
      status: mutationStatus(deactivateShiftMutation),
      errorCode: deactivateShiftMutation.error instanceof ApiError ? deactivateShiftMutation.error.code : null,
    }),
    deactivateShiftError:
      deactivateShiftMutation.error instanceof ApiError ? deactivateShiftMutation.error : null,

    // Shift assignments
    saSearchInput,
    setSaSearchInput,
    applyAssignmentSearch: () => {
      setSaCursor(undefined)
      setSaAppliedQuery(saSearchInput.trim())
    },
    assignmentListState,
    assignmentListError: assignmentsQuery.error instanceof ApiError ? assignmentsQuery.error : null,
    assignmentRows,
    assignmentHasMore: Boolean(assignmentsQuery.data?.page.has_more),
    assignmentLoadMore: () => {
      const next = assignmentsQuery.data?.page.next_cursor
      if (next) setSaCursor(next)
    },
    selectedAssignmentCode,
    selectAssignment: (code: string) => {
      setSelectedAssignmentCode(code)
      setShowAssignmentCreate(false)
      setConfirmAssignmentDeactivate(false)
      updateAssignmentMutation.reset()
      deactivateAssignmentMutation.reset()
    },
    assignmentDetail: assignmentDetailQuery.data ?? null,
    assignmentDetailRow,
    assignmentDetailLoading: assignmentDetailQuery.isLoading,
    showAssignmentCreate,
    openAssignmentCreate: () => {
      setSelectedAssignmentCode(null)
      setShowAssignmentCreate(true)
    },
    closeAssignmentCreate: () => setShowAssignmentCreate(false),
    assignmentCreateForm,
    setAssignmentCreateForm,
    assignmentCreateErrors,
    createAssignment: () => createAssignmentMutation.mutate(),
    createAssignmentPending: createAssignmentMutation.isPending,
    createAssignmentError:
      createAssignmentMutation.error instanceof ApiError ? createAssignmentMutation.error : null,
    saveAssignmentEdit: (body: ShiftAssignmentUpdateRequest) => updateAssignmentMutation.mutate(body),
    updateAssignmentPending: updateAssignmentMutation.isPending,
    updateAssignmentError:
      updateAssignmentMutation.error instanceof ApiError ? updateAssignmentMutation.error : null,
    updateAssignmentSuccess: updateAssignmentMutation.isSuccess,
    confirmAssignmentDeactivate,
    setConfirmAssignmentDeactivate,
    deactivateAssignment: () => deactivateAssignmentMutation.mutate(),
    deactivateAssignmentState: resolveMutationUiState({
      confirmOpen: confirmAssignmentDeactivate,
      status: mutationStatus(deactivateAssignmentMutation),
      errorCode:
        deactivateAssignmentMutation.error instanceof ApiError
          ? deactivateAssignmentMutation.error.code
          : null,
    }),
    deactivateAssignmentError:
      deactivateAssignmentMutation.error instanceof ApiError ? deactivateAssignmentMutation.error : null,

    // Skills
    skillSearchInput,
    setSkillSearchInput,
    applySkillSearch: () => {
      setSkillCursor(undefined)
      setSkillAppliedQuery(skillSearchInput.trim())
    },
    skillListState,
    skillListError: skillsQuery.error instanceof ApiError ? skillsQuery.error : null,
    skillRows,
    skillHasMore: Boolean(skillsQuery.data?.page.has_more),
    skillLoadMore: () => {
      const next = skillsQuery.data?.page.next_cursor
      if (next) setSkillCursor(next)
    },
    selectedSkillCode,
    selectSkill: (code: string) => {
      setSelectedSkillCode(code)
      setShowSkillCreate(false)
      setConfirmSkillDeactivate(false)
      updateSkillMutation.reset()
      deactivateSkillMutation.reset()
    },
    skillDetail: skillDetailQuery.data ?? null,
    skillDetailRow,
    skillDetailLoading: skillDetailQuery.isLoading,
    showSkillCreate,
    openSkillCreate: () => {
      setSelectedSkillCode(null)
      setShowSkillCreate(true)
    },
    closeSkillCreate: () => setShowSkillCreate(false),
    skillCreateForm,
    setSkillCreateForm,
    skillCreateErrors,
    createSkill: () => createSkillMutation.mutate(),
    createSkillPending: createSkillMutation.isPending,
    createSkillError: createSkillMutation.error instanceof ApiError ? createSkillMutation.error : null,
    saveSkillEdit: (body: SkillMasterUpdateRequest) => updateSkillMutation.mutate(body),
    updateSkillPending: updateSkillMutation.isPending,
    updateSkillError: updateSkillMutation.error instanceof ApiError ? updateSkillMutation.error : null,
    updateSkillSuccess: updateSkillMutation.isSuccess,
    confirmSkillDeactivate,
    setConfirmSkillDeactivate,
    deactivateSkill: () => deactivateSkillMutation.mutate(),
    deactivateSkillState: resolveMutationUiState({
      confirmOpen: confirmSkillDeactivate,
      status: mutationStatus(deactivateSkillMutation),
      errorCode: deactivateSkillMutation.error instanceof ApiError ? deactivateSkillMutation.error.code : null,
    }),
    deactivateSkillError:
      deactivateSkillMutation.error instanceof ApiError ? deactivateSkillMutation.error : null,

    // Operator skills
    osSearchInput,
    setOsSearchInput,
    applyOperatorSkillSearch: () => {
      setOsCursor(undefined)
      setOsAppliedQuery(osSearchInput.trim())
    },
    operatorSkillListState,
    operatorSkillListError:
      operatorSkillsQuery.error instanceof ApiError ? operatorSkillsQuery.error : null,
    operatorSkillRows,
    operatorSkillHasMore: Boolean(operatorSkillsQuery.data?.page.has_more),
    operatorSkillLoadMore: () => {
      const next = operatorSkillsQuery.data?.page.next_cursor
      if (next) setOsCursor(next)
    },
    selectedOperatorSkillCode,
    selectOperatorSkill: (code: string) => {
      setSelectedOperatorSkillCode(code)
      setShowOperatorSkillCreate(false)
      setConfirmOperatorSkillDeactivate(false)
      updateOperatorSkillMutation.reset()
      deactivateOperatorSkillMutation.reset()
    },
    operatorSkillDetail: operatorSkillDetailQuery.data ?? null,
    operatorSkillDetailRow,
    operatorSkillDetailLoading: operatorSkillDetailQuery.isLoading,
    showOperatorSkillCreate,
    openOperatorSkillCreate: () => {
      setSelectedOperatorSkillCode(null)
      setShowOperatorSkillCreate(true)
    },
    closeOperatorSkillCreate: () => setShowOperatorSkillCreate(false),
    operatorSkillCreateForm,
    setOperatorSkillCreateForm,
    operatorSkillCreateErrors,
    createOperatorSkill: () => createOperatorSkillMutation.mutate(),
    createOperatorSkillPending: createOperatorSkillMutation.isPending,
    createOperatorSkillError:
      createOperatorSkillMutation.error instanceof ApiError ? createOperatorSkillMutation.error : null,
    saveOperatorSkillEdit: (body: OperatorSkillUpdateRequest) =>
      updateOperatorSkillMutation.mutate(body),
    updateOperatorSkillPending: updateOperatorSkillMutation.isPending,
    updateOperatorSkillError:
      updateOperatorSkillMutation.error instanceof ApiError ? updateOperatorSkillMutation.error : null,
    updateOperatorSkillSuccess: updateOperatorSkillMutation.isSuccess,
    confirmOperatorSkillDeactivate,
    setConfirmOperatorSkillDeactivate,
    deactivateOperatorSkill: () => deactivateOperatorSkillMutation.mutate(),
    deactivateOperatorSkillState: resolveMutationUiState({
      confirmOpen: confirmOperatorSkillDeactivate,
      status: mutationStatus(deactivateOperatorSkillMutation),
      errorCode:
        deactivateOperatorSkillMutation.error instanceof ApiError
          ? deactivateOperatorSkillMutation.error.code
          : null,
    }),
    deactivateOperatorSkillError:
      deactivateOperatorSkillMutation.error instanceof ApiError
        ? deactivateOperatorSkillMutation.error
        : null,

    // Training records (create-only per contract)
    trSearchInput,
    setTrSearchInput,
    applyTrainingRecordSearch: () => {
      setTrCursor(undefined)
      setTrAppliedQuery(trSearchInput.trim())
    },
    trainingRecordListState,
    trainingRecordListError:
      trainingRecordsQuery.error instanceof ApiError ? trainingRecordsQuery.error : null,
    trainingRecordRows,
    trainingRecordHasMore: Boolean(trainingRecordsQuery.data?.page.has_more),
    trainingRecordLoadMore: () => {
      const next = trainingRecordsQuery.data?.page.next_cursor
      if (next) setTrCursor(next)
    },
    showTrainingRecordCreate,
    openTrainingRecordCreate: () => setShowTrainingRecordCreate(true),
    closeTrainingRecordCreate: () => setShowTrainingRecordCreate(false),
    trainingRecordCreateForm,
    setTrainingRecordCreateForm,
    trainingRecordCreateErrors,
    createTrainingRecord: () => createTrainingRecordMutation.mutate(),
    createTrainingRecordPending: createTrainingRecordMutation.isPending,
    createTrainingRecordError:
      createTrainingRecordMutation.error instanceof ApiError
        ? createTrainingRecordMutation.error
        : null,
  }
}
