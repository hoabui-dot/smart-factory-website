import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { groupTasksByModule, projectTask, resolveMyWorkState } from './myWorkProjection.ts'

const task = {
  task_key: 'stocktake:WMS-05:ST-001', task_type: 'stocktake_adjustment_pending',
  source_module: 'WMS-05', source_entity_type: 'stocktake', source_entity_code: 'ST-001',
  title: 'Kiểm kê ST-001 chờ duyệt', occurred_at: '2026-07-18T01:00:00Z',
  location: { code: 'ZONE-A', name: 'Zone A' }, work_order: { code: 'WO-001' },
  deep_link: '/web/wms/stocktakes/ST-001',
}

describe('My Work projection', () => {
  it('projects business references and accepts an internal web deep link', () => {
    const row = projectTask(task)
    assert.equal(row.targetLabel, 'stocktake · ST-001')
    assert.equal(row.locationLabel, 'ZONE-A · Zone A')
    assert.equal(row.workOrderLabel, 'WO-001')
    assert.equal(row.deepLink, '/web/wms/stocktakes/ST-001')
  })

  it('blocks arbitrary external or cross-app deep links', () => {
    assert.equal(projectTask({ ...task, deep_link: 'https://evil.example' }).deepLink, null)
    assert.equal(projectTask({ ...task, deep_link: '/pda/stocktakes/ST-001' }).deepLink, null)
  })

  it('groups tasks by source module without changing server order', () => {
    const groups = groupTasksByModule([task, { ...task, task_key: 'ncr', source_module: 'QMS-03' }])
    assert.deepEqual(groups.map((group) => group.sourceModule), ['WMS-05', 'QMS-03'])
  })

  it('maps deterministic list states', () => {
    assert.equal(resolveMyWorkState('success', 0, false, null), 'empty')
    assert.equal(resolveMyWorkState('success', 0, true, null), 'no-result')
    assert.equal(resolveMyWorkState('error', 0, false, 'PERMISSION_DENIED'), 'permission-denied')
  })
})
