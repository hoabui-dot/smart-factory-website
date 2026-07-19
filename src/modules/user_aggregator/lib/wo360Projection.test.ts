import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { projectWO360Header, resolveWO360State } from './wo360Projection.ts'
import type { WO360Response } from '../api/wo360Api.ts'

const sample: WO360Response = {
  work_order: {
    id: 10,
    code: 'WO-1',
    item_code: 'ITM-1',
    status: 'IN_PROGRESS',
    planned_qty: 100,
    produced_qty: 40,
    scrap_qty: 2,
    planned_start: '2026-07-18T01:00:00Z',
    bom_code: 'BOM-1',
  },
  bom_snapshot: [{ line_no: 1, item_code: 'RAW-1', qty_per_unit: 1, uom_code: 'PCS' }],
  material_requests: [],
  production_logs: [],
  lot_bindings: [],
  inspection_results: [],
  goods_receipts: [],
  timeline: [],
}

describe('wo360Projection', () => {
  it('projects business codes and section counts', () => {
    const view = projectWO360Header(sample)
    assert.equal(view.code, 'WO-1')
    assert.equal(view.itemLabel, 'ITM-1')
    assert.equal(view.sectionCounts.bom, 1)
  })

  it('maps not-found and permission', () => {
    assert.equal(
      resolveWO360State({ status: 'error', errorCode: 'RESOURCE_NOT_FOUND' }),
      'not-found',
    )
    assert.equal(
      resolveWO360State({ status: 'error', errorCode: 'PERMISSION_DENIED' }),
      'permission-denied',
    )
  })
})
