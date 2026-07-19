import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  findImportTemplate,
  isActionEnabled,
  projectImportBatch,
  resolveActionHref,
  resolveBatchUiState,
  resolveMutationUiState,
} from './importExportProjection.ts'
import type { ImportBatch } from '../types/importExport.ts'

const sample: ImportBatch = {
  id: 11,
  code: 'IMP-000011',
  target_entity: 'ITEM',
  source_file_id: 90,
  mode: 'ALL_OR_NOTHING',
  import_mode: 'UPSERT',
  total_rows: 10,
  success_rows: 8,
  failed_rows: 2,
  skipped_rows: 0,
  status: 'PREVIEW_READY',
  started_by: 3,
  started_at: '2026-07-18T01:00:00Z',
  completed_at: null,
  allowed_actions: [
    {
      action: 'validate',
      method: 'POST',
      href: '/api/mes/items/imports/IMP-000011/validate',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    {
      action: 'commit',
      method: 'POST',
      href: '/api/mes/items/imports/IMP-000011/commit',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    {
      action: 'cancel',
      method: 'POST',
      href: '/api/mes/items/imports/IMP-000011/cancel',
      enabled: true,
    },
  ],
}

describe('projectImportBatch', () => {
  it('projects display fields and gates actions from server allowed_actions only', () => {
    const row = projectImportBatch(sample)
    assert.equal(row.code, 'IMP-000011')
    assert.equal(row.status, 'PREVIEW_READY')
    assert.equal(row.targetEntity, 'ITEM')
    assert.equal(row.mode, 'ALL_OR_NOTHING')
    assert.equal(row.importMode, 'UPSERT')
    assert.equal(row.totalRows, 10)
    assert.equal(row.failedRows, 2)
    assert.equal(row.canValidate, false)
    assert.equal(row.canCommit, false)
    assert.equal(row.canCancel, true)
    assert.equal(row.validateHref, '/api/mes/items/imports/IMP-000011/validate')
    assert.equal(row.commitHref, '/api/mes/items/imports/IMP-000011/commit')
    assert.equal(row.cancelHref, '/api/mes/items/imports/IMP-000011/cancel')
  })

  it('does not infer commit from PREVIEW_READY when server omits enabled action', () => {
    const row = projectImportBatch({
      ...sample,
      status: 'PREVIEW_READY',
      failed_rows: 0,
      allowed_actions: [],
    })
    assert.equal(row.canValidate, false)
    assert.equal(row.canCommit, false)
    assert.equal(row.canCancel, false)
  })
})

describe('isActionEnabled / resolveActionHref', () => {
  it('reads enabled flag and href from §6.4 action objects', () => {
    assert.equal(isActionEnabled(sample.allowed_actions, 'cancel'), true)
    assert.equal(isActionEnabled(sample.allowed_actions, 'commit'), false)
    assert.equal(
      resolveActionHref(sample.allowed_actions, 'cancel'),
      '/api/mes/items/imports/IMP-000011/cancel',
    )
    assert.equal(resolveActionHref(sample.allowed_actions, 'missing'), null)
  })
})

describe('findImportTemplate', () => {
  it('resolves ownership map prefixes without inventing nb07 namespace', () => {
    const item = findImportTemplate('ITEM_MASTER_IMPORT')
    assert.ok(item)
    assert.equal(item.endpointPrefix, '/api/mes/items')
    assert.equal(item.targetEntity, 'ITEM')
    assert.equal(findImportTemplate('UNKNOWN'), null)
  })
})

describe('resolveBatchUiState', () => {
  it('maps loading, empty, permission and error states', () => {
    assert.equal(
      resolveBatchUiState({ status: 'loading', hasBatch: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolveBatchUiState({ status: 'success', hasBatch: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveBatchUiState({ status: 'success', hasBatch: true, errorCode: null }),
      'ready',
    )
    assert.equal(
      resolveBatchUiState({
        status: 'error',
        hasBatch: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
    assert.equal(
      resolveBatchUiState({ status: 'error', hasBatch: false, errorCode: 'NOT_FOUND' }),
      'not-found',
    )
  })
})

describe('resolveMutationUiState', () => {
  it('requires confirmation and preserves canonical error codes', () => {
    assert.equal(
      resolveMutationUiState({ confirmOpen: true, status: 'idle', errorCode: null }),
      'confirm',
    )
    assert.equal(
      resolveMutationUiState({ confirmOpen: true, status: 'pending', errorCode: null }),
      'pending',
    )
    assert.equal(
      resolveMutationUiState({
        confirmOpen: false,
        status: 'error',
        errorCode: 'NOT_ALLOWED_BY_STATUS',
      }),
      'not-allowed',
    )
  })
})
