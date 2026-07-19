import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildQcMasterLookups,
  findAllowedAction,
  filterItemsForStage,
  isActionEnabled,
  isProductionStageGroup,
  projectCharacteristicCategoryLookups,
  projectCharacteristicMasterRow,
  projectDefectCodeRow,
  projectInspectionPlanRow,
  resolveMutationUiState,
  resolveQcListState,
  validateCharacteristicMasterCreateForm,
  validateDefectCodeCreateForm,
  validateInspectionPlanCreateForm,
} from './qcMasterProjection.ts'
import type {
  CharacteristicMasterRecord,
  DefectCodeRecord,
  InspectionFrequencyRecord,
  InspectionPlanRecord,
  InspectionStageRecord,
  ItemLookupRecord,
  ItemRevisionLookupRecord,
  SamplingMethodRecord,
} from '../types/qcMaster.ts'

const stages: InspectionStageRecord[] = [
  { id: 1, code: 'IQC', name_vi: 'Kiểm tra đầu vào', name_en: 'Incoming QC', stage_group: 'IQC' },
]
const samplingMethods: SamplingMethodRecord[] = [
  { id: 2, code: 'AQL-1.0', name_vi: 'AQL 1.0', name_en: 'AQL 1.0', standard_ref: 'ISO 2859-1' },
]
const frequencies: InspectionFrequencyRecord[] = [
  { id: 3, code: 'EVERY_LOT', name_vi: 'Mỗi lô', name_en: 'Every lot', requires_interval: false },
]
const items: ItemLookupRecord[] = [
  { id: 10, code: 'RAW-001', item_name: 'Nguyên liệu A', item_type: 'RAW', is_active: true },
]
const revisions: ItemRevisionLookupRecord[] = [{ id: 20, code: 'REV-A', item_id: 10, status: 'ACTIVE' }]
const charMasters: CharacteristicMasterRecord[] = [
  {
    id: 30,
    code: 'CM-001',
    name_vi: 'Đường kính',
    name_en: 'Diameter',
    characteristic_category_id: 1,
    default_char_type: 'NUMERIC',
    default_uom: 'mm',
    is_active: true,
  },
]

const draftPlan: InspectionPlanRecord = {
  id: 100,
  code: 'IP-001',
  inspection_stage_id: 1,
  item_id: 10,
  item_revision_id: null,
  sampling_method_id: 2,
  inspection_frequency_id: 3,
  sampling_param: 'n=5,c=0',
  status: 'DRAFT',
  is_active: true,
  inspection_stage_code: 'IQC',
  item_code: 'RAW-001',
  sampling_method_code: 'AQL-1.0',
  inspection_frequency_code: 'EVERY_LOT',
  allowed_actions: [
    { action: 'update', method: 'PATCH', href: '/api/qms/checksheets/IP-001', enabled: true },
    { action: 'deactivate', method: 'DELETE', href: '/api/qms/checksheets/IP-001', enabled: true },
    { action: 'release', method: 'POST', href: '/api/qms/checksheets/IP-001/release', enabled: true },
    {
      action: 'obsolete',
      method: 'POST',
      href: '/api/qms/checksheets/IP-001/obsolete',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
  ],
}

describe('findAllowedAction / isActionEnabled', () => {
  it('finds action by name and reports enabled state', () => {
    const action = findAllowedAction(draftPlan.allowed_actions, 'release')
    assert.equal(action?.enabled, true)
    assert.equal(isActionEnabled(draftPlan.allowed_actions, 'release'), true)
    assert.equal(isActionEnabled(draftPlan.allowed_actions, 'obsolete'), false)
    assert.equal(findAllowedAction(draftPlan.allowed_actions, 'missing'), null)
  })
})

describe('projectInspectionPlanRow', () => {
  it('projects labels from projected codes without touching lookups when present', () => {
    const lookups = buildQcMasterLookups({ stages, samplingMethods, frequencies, items, revisions, charMasters })
    const row = projectInspectionPlanRow(draftPlan, lookups)
    assert.equal(row.stageLabel, 'IQC')
    assert.equal(row.itemLabel, 'RAW-001')
    assert.equal(row.revisionLabel, '-')
    assert.equal(row.samplingMethodLabel, 'AQL-1.0')
    assert.equal(row.frequencyLabel, 'EVERY_LOT')
    assert.equal(row.canUpdate, true)
    assert.equal(row.canDeactivate, true)
    assert.equal(row.canRelease, true)
    assert.equal(row.canObsolete, false)
    assert.equal(row.obsoleteDisabledReason, 'NOT_ALLOWED_BY_STATUS')
  })

  it('falls back to id lookups when projected codes are absent', () => {
    const lookups = buildQcMasterLookups({ stages, samplingMethods, frequencies, items, revisions, charMasters })
    const bare: InspectionPlanRecord = {
      ...draftPlan,
      item_revision_id: 20,
      inspection_stage_code: undefined,
      item_code: undefined,
      sampling_method_code: undefined,
      inspection_frequency_code: undefined,
    }
    const row = projectInspectionPlanRow(bare, lookups)
    assert.equal(row.stageLabel, 'IQC')
    assert.equal(row.itemLabel, 'RAW-001')
    assert.equal(row.revisionLabel, 'REV-A')
    assert.equal(row.samplingMethodLabel, 'AQL-1.0')
    assert.equal(row.frequencyLabel, 'EVERY_LOT')
  })

  it('renders unavailable placeholder for missing lookups', () => {
    const emptyLookups = buildQcMasterLookups({
      stages: [],
      samplingMethods: [],
      frequencies: [],
      items: [],
      revisions: [],
      charMasters: [],
    })
    const bare: InspectionPlanRecord = {
      ...draftPlan,
      inspection_stage_code: undefined,
      item_code: undefined,
      sampling_method_code: undefined,
      inspection_frequency_code: undefined,
    }
    const row = projectInspectionPlanRow(bare, emptyLookups)
    assert.equal(row.stageLabel, '-')
    assert.equal(row.itemLabel, '-')
    assert.equal(row.samplingMethodLabel, '-')
    assert.equal(row.frequencyLabel, '-')
  })
})

describe('projectCharacteristicMasterRow / projectDefectCodeRow', () => {
  const cm: CharacteristicMasterRecord = {
    id: 30,
    code: 'CM-001',
    name_vi: 'Đường kính',
    name_en: 'Diameter',
    characteristic_category_id: 1,
    default_char_type: 'NUMERIC',
    default_uom: 'mm',
    is_active: true,
    characteristic_category_code: 'DIMENSIONAL',
    allowed_actions: [
      { action: 'update', method: 'PATCH', href: '/api/qms/characteristics/CM-001', enabled: true },
      {
        action: 'deactivate',
        method: 'DELETE',
        href: '/api/qms/characteristics/CM-001',
        enabled: false,
        disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
      },
    ],
  }

  it('projects characteristic master row with category label and gated deactivate', () => {
    const row = projectCharacteristicMasterRow(cm)
    assert.equal(row.categoryLabel, 'DIMENSIONAL')
    assert.equal(row.canUpdate, true)
    assert.equal(row.canDeactivate, false)
    assert.equal(row.deactivateDisabledReason, 'NOT_ALLOWED_BY_STATUS')
  })

  it('falls back to numeric category id when code is absent', () => {
    const row = projectCharacteristicMasterRow({ ...cm, characteristic_category_code: undefined })
    assert.equal(row.categoryLabel, '1')
  })

  const dc: DefectCodeRecord = {
    id: 40,
    code: 'DC-001',
    name_vi: 'Trầy xước',
    name_en: 'Scratch',
    characteristic_category_id: 1,
    default_severity: 'MINOR',
    is_active: false,
    characteristic_category_code: 'APPEARANCE',
    allowed_actions: [
      { action: 'update', method: 'PATCH', href: '/api/qms/defect-codes/DC-001', enabled: true },
      {
        action: 'deactivate',
        method: 'DELETE',
        href: '/api/qms/defect-codes/DC-001',
        enabled: false,
        disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
      },
    ],
  }

  it('projects defect code row and reflects inactive gating', () => {
    const row = projectDefectCodeRow(dc)
    assert.equal(row.categoryLabel, 'APPEARANCE')
    assert.equal(row.isActive, false)
    assert.equal(row.canDeactivate, false)
  })
})

describe('resolveQcListState', () => {
  it('resolves loading/empty/no-result/permission-denied/error/ready', () => {
    assert.equal(
      resolveQcListState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolveQcListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveQcListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
      'no-result',
    )
    assert.equal(
      resolveQcListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'PERMISSION_DENIED' }),
      'permission-denied',
    )
    assert.equal(
      resolveQcListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'SOME_ERROR' }),
      'error',
    )
    assert.equal(
      resolveQcListState({ status: 'success', itemCount: 3, hasQuery: false, errorCode: null }),
      'ready',
    )
  })
})

describe('resolveMutationUiState', () => {
  it('resolves pending/success/permission-denied/not-allowed/error/confirm/idle', () => {
    assert.equal(resolveMutationUiState({ confirmOpen: false, status: 'pending', errorCode: null }), 'pending')
    assert.equal(resolveMutationUiState({ confirmOpen: false, status: 'success', errorCode: null }), 'success')
    assert.equal(
      resolveMutationUiState({ confirmOpen: false, status: 'error', errorCode: 'PERMISSION_DENIED' }),
      'permission-denied',
    )
    assert.equal(
      resolveMutationUiState({ confirmOpen: false, status: 'error', errorCode: 'NOT_ALLOWED_BY_STATUS' }),
      'not-allowed',
    )
    assert.equal(
      resolveMutationUiState({ confirmOpen: false, status: 'error', errorCode: 'OTHER' }),
      'error',
    )
    assert.equal(resolveMutationUiState({ confirmOpen: true, status: 'idle', errorCode: null }), 'confirm')
    assert.equal(resolveMutationUiState({ confirmOpen: false, status: 'idle', errorCode: null }), 'idle')
  })
})

describe('validateInspectionPlanCreateForm', () => {
  it('flags missing required fields', () => {
    const errors = validateInspectionPlanCreateForm({
      code: '',
      inspectionStageId: 0,
      itemId: 0,
      samplingMethodId: 0,
      inspectionFrequencyId: 0,
      samplingParam: '',
    })
    assert.deepEqual(errors, [
      'code',
      'inspection_stage_id',
      'item_id',
      'sampling_method_id',
      'inspection_frequency_id',
      'sampling_param',
    ])
  })

  it('passes with all fields valid', () => {
    const errors = validateInspectionPlanCreateForm({
      code: 'IP-002',
      inspectionStageId: 1,
      itemId: 10,
      samplingMethodId: 2,
      inspectionFrequencyId: 3,
      samplingParam: 'n=5,c=0',
    })
    assert.deepEqual(errors, [])
  })

  it('requires item_revision_id for production FG/SF plans (QMS-01b)', () => {
    const errors = validateInspectionPlanCreateForm({
      code: 'FQC-V12',
      inspectionStageId: 2,
      itemId: 20,
      samplingMethodId: 2,
      inspectionFrequencyId: 3,
      samplingParam: '100%',
      stageGroup: 'OQC',
      itemTypeCode: 'FINISHED',
      itemRevisionId: null,
    })
    assert.ok(errors.includes('item_revision_id'))
  })

  it('rejects RAW item on production stage group', () => {
    const errors = validateInspectionPlanCreateForm({
      code: 'IPQC-BAD',
      inspectionStageId: 2,
      itemId: 10,
      samplingMethodId: 2,
      inspectionFrequencyId: 3,
      samplingParam: 'n=5',
      stageGroup: 'IPQC',
      itemTypeCode: 'RAW',
      itemRevisionId: 1,
    })
    assert.ok(errors.includes('item_id'))
  })

  it('allows IQC RAW without revision', () => {
    const errors = validateInspectionPlanCreateForm({
      code: 'IQC-001',
      inspectionStageId: 1,
      itemId: 10,
      samplingMethodId: 2,
      inspectionFrequencyId: 3,
      samplingParam: 'n=5',
      stageGroup: 'IQC',
      itemTypeCode: 'RAW',
      itemRevisionId: null,
    })
    assert.deepEqual(errors, [])
  })
})

describe('filterItemsForStage / isProductionStageGroup', () => {
  it('filters IQC vs production item types when codes are present', () => {
    const items = [
      { id: 1, code: 'RAW-1', item_name: 'Raw', item_type_code: 'RAW', is_active: true },
      { id: 2, code: 'FG-1', item_name: 'FG', item_type_code: 'FINISHED', is_active: true },
    ]
    assert.deepEqual(
      filterItemsForStage(items, 'IQC').map((i) => i.code),
      ['RAW-1'],
    )
    assert.deepEqual(
      filterItemsForStage(items, 'OQC').map((i) => i.code),
      ['FG-1'],
    )
    assert.equal(isProductionStageGroup('SPECIAL'), true)
    assert.equal(isProductionStageGroup('IQC'), false)
  })
})

describe('validateCharacteristicMasterCreateForm', () => {
  it('flags missing required fields', () => {
    const errors = validateCharacteristicMasterCreateForm({
      code: '',
      nameVi: '',
      nameEn: '',
      characteristicCategoryId: 0,
      defaultCharType: '',
      defaultUom: '',
    })
    assert.deepEqual(errors, [
      'code',
      'name_vi',
      'name_en',
      'characteristic_category_id',
      'default_char_type',
      'default_uom',
    ])
  })
})

describe('projectCharacteristicCategoryLookups', () => {
  it('maps REFDATA rows into id/code/name lookups keyed off row_version', () => {
    const rows = projectCharacteristicCategoryLookups([
      { code: 'DIMENSIONAL', label: 'Kích thước', is_active: true, row_version: '2' },
      { code: 'APPEARANCE', label: 'Ngoại quan', is_active: true, row_version: '1' },
    ])
    assert.deepEqual(rows, [
      { id: 2, code: 'DIMENSIONAL', name_vi: 'Kích thước', is_active: true },
      { id: 1, code: 'APPEARANCE', name_vi: 'Ngoại quan', is_active: true },
    ])
  })

  it('drops rows with a missing or non-positive row_version', () => {
    const rows = projectCharacteristicCategoryLookups([
      { code: 'BAD', label: 'Bad', is_active: true, row_version: '' },
      { code: 'ZERO', label: 'Zero', is_active: true, row_version: '0' },
      { code: 'OK', label: 'Ok', is_active: true, row_version: '5' },
    ])
    assert.deepEqual(rows, [{ id: 5, code: 'OK', name_vi: 'Ok', is_active: true }])
  })
})

describe('validateDefectCodeCreateForm', () => {
  it('flags missing required fields', () => {
    const errors = validateDefectCodeCreateForm({
      code: '',
      nameVi: '',
      nameEn: '',
      characteristicCategoryId: 0,
      defaultSeverity: '',
    })
    assert.deepEqual(errors, ['code', 'name_vi', 'name_en', 'characteristic_category_id', 'default_severity'])
  })
})
