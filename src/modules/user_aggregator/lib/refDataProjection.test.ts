import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  projectRefDataRow,
  projectRegistryEntry,
  resolveRefDataState,
} from './refDataProjection.ts'

describe('refDataProjection', () => {
  it('maps capabilities string array to create/update/retire gates', () => {
    const view = projectRegistryEntry({
      table_key: 'item_type',
      source_module: 'MES-01',
      label_field: 'name',
      editable_fields: ['name'],
      required_fields: ['name'],
      active_field: 'is_active',
      capabilities: ['view', 'create', 'update'],
    })
    assert.equal(view.canCreate, true)
    assert.equal(view.canUpdate, true)
    assert.equal(view.canRetire, false)
  })

  it('projects row label without inventing fields', () => {
    const row = projectRefDataRow({
      code: 'RAW',
      label: 'Raw',
      is_active: true,
      fields: { name: 'Raw material' },
      row_version: '1',
    })
    assert.equal(row.code, 'RAW')
    assert.equal(row.label, 'Raw')
    assert.match(row.fieldSummary, /name=Raw material/)
  })

  it('maps list states', () => {
    assert.equal(resolveRefDataState('success', 0, false, null), 'empty')
    assert.equal(resolveRefDataState('error', 0, false, 'PERMISSION_DENIED'), 'permission-denied')
  })
})
