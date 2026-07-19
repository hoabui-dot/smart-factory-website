import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildShiftSkillLookups,
  findAllowedAction,
  isActionEnabled,
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
} from './shiftSkillProjection.ts'
import type {
  OperatorSkillRecord,
  ShiftAssignmentRecord,
  ShiftRecord,
  SkillMasterRecord,
  TrainingRecordRecord,
} from '../types/shiftSkill.ts'

const shiftActive: ShiftRecord = {
  id: 1,
  code: 'SHIFT-A',
  start_time: '06:00:00',
  end_time: '14:00:00',
  is_overnight: false,
  allowed_actions: [
    { action: 'update', method: 'PATCH', href: '/api/mes/shifts/SHIFT-A', enabled: true },
    { action: 'deactivate', method: 'DELETE', href: '/api/mes/shifts/SHIFT-A', enabled: true },
  ],
}

const shiftBlocked: ShiftRecord = {
  id: 2,
  code: 'SHIFT-B',
  start_time: '22:00:00',
  end_time: '06:00:00',
  is_overnight: true,
  allowed_actions: [
    {
      action: 'update',
      method: 'PATCH',
      href: '/api/mes/shifts/SHIFT-B',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    { action: 'deactivate', method: 'DELETE', href: '/api/mes/shifts/SHIFT-B', enabled: true },
  ],
}

describe('findAllowedAction / isActionEnabled', () => {
  it('resolves action envelope by action name', () => {
    const action = findAllowedAction(shiftActive.allowed_actions, 'update')
    assert.equal(action?.href, '/api/mes/shifts/SHIFT-A')
    assert.equal(isActionEnabled(shiftActive.allowed_actions, 'update'), true)
    assert.equal(isActionEnabled(undefined, 'update'), false)
  })
})

describe('projectShiftRow', () => {
  it('projects overnight/allowed_actions and never infers gating from omission', () => {
    const row = projectShiftRow(shiftActive)
    assert.equal(row.isOvernight, false)
    assert.equal(row.canUpdate, true)
    assert.equal(row.canDeactivate, true)

    const noActions = projectShiftRow({ ...shiftActive, allowed_actions: undefined })
    assert.equal(noActions.canUpdate, false)
    assert.equal(noActions.canDeactivate, false)
  })

  it('surfaces disabled_reason_code when server blocks the action', () => {
    const row = projectShiftRow(shiftBlocked)
    assert.equal(row.isOvernight, true)
    assert.equal(row.canUpdate, false)
    assert.equal(row.updateDisabledReason, 'NOT_ALLOWED_BY_STATUS')
    assert.equal(row.canDeactivate, true)
  })
})

describe('projectShiftAssignmentRow', () => {
  const sa: ShiftAssignmentRecord = {
    id: 10,
    code: 'SA-001',
    work_date: '2026-07-18',
    shift_id: 1,
    operator_id: 100,
    work_center_id: 200,
    role_on_line: 'OPERATOR',
    allowed_actions: [
      { action: 'update', method: 'PATCH', href: '/api/mes/shift-assignments/SA-001', enabled: true },
      { action: 'deactivate', method: 'DELETE', href: '/api/mes/shift-assignments/SA-001', enabled: true },
    ],
  }

  it('projects business codes from payload when present', () => {
    const withCodes: ShiftAssignmentRecord = {
      ...sa,
      shift_code: 'SHIFT-A',
      operator_code: 'EMP-0001',
      work_center_code: 'WC-001',
    }
    const lookups = buildShiftSkillLookups({})
    const row = projectShiftAssignmentRow(withCodes, lookups)
    assert.equal(row.shiftLabel, 'SHIFT-A')
    assert.equal(row.operatorLabel, 'EMP-0001')
    assert.equal(row.workCenterLabel, 'WC-001')
    assert.equal(row.canUpdate, true)
  })

  it('falls back to lookup maps when codes are absent from the payload', () => {
    const lookups = buildShiftSkillLookups({
      shifts: [shiftActive],
      workCenters: [{ id: 200, code: 'WC-001' }],
      users: [{ id: 100, code: 'EMP-0001' }],
    })
    const row = projectShiftAssignmentRow(sa, lookups)
    assert.equal(row.shiftLabel, 'SHIFT-A')
    assert.equal(row.operatorLabel, 'EMP-0001')
    assert.equal(row.workCenterLabel, 'WC-001')
  })

  it('renders unavailable placeholder when neither code nor lookup resolves', () => {
    const lookups = buildShiftSkillLookups({})
    const row = projectShiftAssignmentRow(sa, lookups)
    assert.equal(row.shiftLabel, '-')
    assert.equal(row.operatorLabel, '-')
    assert.equal(row.workCenterLabel, '-')
  })
})

describe('projectSkillMasterRow', () => {
  const active: SkillMasterRecord = {
    id: 1,
    code: 'SK-001',
    skill_name: 'Vận hành máy dập',
    skill_category: 'OPERATION',
    validity_months: 12,
    issuer: 'QA',
    is_active: true,
    allowed_actions: [
      { action: 'update', method: 'PATCH', href: '/api/mes/skills/SK-001', enabled: true },
      { action: 'deactivate', method: 'DELETE', href: '/api/mes/skills/SK-001', enabled: true },
    ],
  }

  it('allows deactivate while is_active is true', () => {
    const row = projectSkillMasterRow(active)
    assert.equal(row.canDeactivate, true)
    assert.equal(row.validityMonths, '12')
  })

  it('blocks deactivate once already inactive per server allowed_actions', () => {
    const inactive: SkillMasterRecord = {
      ...active,
      code: 'SK-002',
      is_active: false,
      allowed_actions: [
        { action: 'update', method: 'PATCH', href: '/api/mes/skills/SK-002', enabled: true },
        {
          action: 'deactivate',
          method: 'DELETE',
          href: '/api/mes/skills/SK-002',
          enabled: false,
          disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
        },
      ],
    }
    const row = projectSkillMasterRow(inactive)
    assert.equal(row.canDeactivate, false)
    assert.equal(row.deactivateDisabledReason, 'NOT_ALLOWED_BY_STATUS')
  })
})

describe('projectOperatorSkillRow', () => {
  const os: OperatorSkillRecord = {
    id: 1,
    code: 'OS-001',
    operator_id: 100,
    skill_id: 1,
    level: 'QUALIFIED',
    issued_date: '2026-01-01',
    expiry_date: '2027-01-01',
    status: 'ACTIVE',
    operator_code: 'EMP-0001',
    skill_code: 'SK-001',
    allowed_actions: [
      { action: 'update', method: 'PATCH', href: '/api/mes/operator-skills/OS-001', enabled: true },
      { action: 'deactivate', method: 'DELETE', href: '/api/mes/operator-skills/OS-001', enabled: true },
    ],
  }

  it('projects operator/skill labels and allows deactivate while ACTIVE', () => {
    const lookups = buildShiftSkillLookups({})
    const row = projectOperatorSkillRow(os, lookups)
    assert.equal(row.operatorLabel, 'EMP-0001')
    assert.equal(row.skillLabel, 'SK-001')
    assert.equal(row.canDeactivate, true)
  })

  it('blocks deactivate once already SUSPENDED per server allowed_actions', () => {
    const suspended: OperatorSkillRecord = {
      ...os,
      code: 'OS-002',
      status: 'SUSPENDED',
      allowed_actions: [
        { action: 'update', method: 'PATCH', href: '/api/mes/operator-skills/OS-002', enabled: true },
        {
          action: 'deactivate',
          method: 'DELETE',
          href: '/api/mes/operator-skills/OS-002',
          enabled: false,
          disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
        },
      ],
    }
    const lookups = buildShiftSkillLookups({})
    const row = projectOperatorSkillRow(suspended, lookups)
    assert.equal(row.canDeactivate, false)
    assert.equal(row.deactivateDisabledReason, 'NOT_ALLOWED_BY_STATUS')
  })
})

describe('projectTrainingRecordRow', () => {
  it('projects operator/skill/instructor labels with lookup fallback', () => {
    const tr: TrainingRecordRecord = {
      id: 1,
      code: 'TR-001',
      operator_id: 100,
      skill_id: 1,
      training_date: '2026-07-01',
      duration_hours: 4,
      instructor_id: 200,
      result: 'PASS',
    }
    const lookups = buildShiftSkillLookups({
      skills: [
        {
          id: 1,
          code: 'SK-001',
          skill_name: 'Vận hành',
          skill_category: 'OPERATION',
          issuer: 'QA',
          is_active: true,
        },
      ],
      users: [
        { id: 100, code: 'EMP-0001' },
        { id: 200, code: 'EMP-0099' },
      ],
    })
    const row = projectTrainingRecordRow(tr, lookups)
    assert.equal(row.operatorLabel, 'EMP-0001')
    assert.equal(row.skillLabel, 'SK-001')
    assert.equal(row.instructorLabel, 'EMP-0099')
    assert.equal(row.durationHours, 4)
  })
})

describe('resolveShiftSkillListState', () => {
  it('maps loading, empty, no-result, permission and error states', () => {
    assert.equal(
      resolveShiftSkillListState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolveShiftSkillListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveShiftSkillListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
      'no-result',
    )
    assert.equal(
      resolveShiftSkillListState({ status: 'success', itemCount: 3, hasQuery: false, errorCode: null }),
      'ready',
    )
    assert.equal(
      resolveShiftSkillListState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
    assert.equal(
      resolveShiftSkillListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'X' }),
      'error',
    )
  })
})

describe('resolveMutationUiState', () => {
  it('requires confirmation and preserves canonical error codes', () => {
    assert.equal(resolveMutationUiState({ confirmOpen: true, status: 'idle', errorCode: null }), 'confirm')
    assert.equal(resolveMutationUiState({ confirmOpen: false, status: 'idle', errorCode: null }), 'idle')
    assert.equal(
      resolveMutationUiState({ confirmOpen: false, status: 'pending', errorCode: null }),
      'pending',
    )
    assert.equal(
      resolveMutationUiState({ confirmOpen: false, status: 'success', errorCode: null }),
      'success',
    )
    assert.equal(
      resolveMutationUiState({ confirmOpen: false, status: 'error', errorCode: 'PERMISSION_DENIED' }),
      'permission-denied',
    )
    assert.equal(
      resolveMutationUiState({
        confirmOpen: false,
        status: 'error',
        errorCode: 'NOT_ALLOWED_BY_STATUS',
      }),
      'not-allowed',
    )
    assert.equal(resolveMutationUiState({ confirmOpen: false, status: 'error', errorCode: 'X' }), 'error')
  })
})

describe('validateShiftCreateForm', () => {
  it('requires code, start_time, end_time', () => {
    assert.deepEqual(validateShiftCreateForm({ code: '', startTime: '', endTime: '' }), [
      'code',
      'start_time',
      'end_time',
    ])
    assert.deepEqual(
      validateShiftCreateForm({ code: 'SHIFT-D', startTime: '06:00', endTime: '14:00' }),
      [],
    )
  })
})

describe('validateShiftAssignmentCreateForm', () => {
  it('requires code, work_date, shift_id, operator_id, work_center_id, role_on_line', () => {
    assert.deepEqual(
      validateShiftAssignmentCreateForm({
        code: '',
        workDate: '',
        shiftId: 0,
        operatorId: 0,
        workCenterId: 0,
        roleOnLine: '',
      }),
      ['code', 'work_date', 'shift_id', 'operator_id', 'work_center_id', 'role_on_line'],
    )
    assert.deepEqual(
      validateShiftAssignmentCreateForm({
        code: 'SA-002',
        workDate: '2026-07-18',
        shiftId: 1,
        operatorId: 100,
        workCenterId: 200,
        roleOnLine: 'OPERATOR',
      }),
      [],
    )
  })
})

describe('validateSkillMasterCreateForm', () => {
  it('requires code, skill_name, skill_category, issuer', () => {
    assert.deepEqual(
      validateSkillMasterCreateForm({ code: '', skillName: '', skillCategory: '', issuer: '' }),
      ['code', 'skill_name', 'skill_category', 'issuer'],
    )
    assert.deepEqual(
      validateSkillMasterCreateForm({
        code: 'SK-010',
        skillName: 'Kiểm tra kích thước',
        skillCategory: 'INSPECTION',
        issuer: 'QA',
      }),
      [],
    )
  })
})

describe('validateOperatorSkillCreateForm', () => {
  it('requires code, operator_id, skill_id, level, issued_date, status', () => {
    assert.deepEqual(
      validateOperatorSkillCreateForm({
        code: '',
        operatorId: 0,
        skillId: 0,
        level: '',
        issuedDate: '',
        status: '',
      }),
      ['code', 'operator_id', 'skill_id', 'level', 'issued_date', 'status'],
    )
    assert.deepEqual(
      validateOperatorSkillCreateForm({
        code: 'OS-010',
        operatorId: 100,
        skillId: 1,
        level: 'TRAINEE',
        issuedDate: '2026-07-18',
        status: 'ACTIVE',
      }),
      [],
    )
  })
})

describe('validateTrainingRecordCreateForm', () => {
  it('requires code, operator_id, skill_id, training_date, duration_hours, instructor_id, result', () => {
    assert.deepEqual(
      validateTrainingRecordCreateForm({
        code: '',
        operatorId: 0,
        skillId: 0,
        trainingDate: '',
        durationHours: 0,
        instructorId: 0,
        result: '',
      }),
      [
        'code',
        'operator_id',
        'skill_id',
        'training_date',
        'duration_hours',
        'instructor_id',
        'result',
      ],
    )
    assert.deepEqual(
      validateTrainingRecordCreateForm({
        code: 'TR-010',
        operatorId: 100,
        skillId: 1,
        trainingDate: '2026-07-18',
        durationHours: 4,
        instructorId: 200,
        result: 'PASS',
      }),
      [],
    )
  })
})
