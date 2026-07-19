import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  formatPayloadPreview,
  projectAuditEventRow,
  resolveAuditListState,
  resolveExportUiState,
} from './auditProjection.ts'
import type { ActivityEvent } from '../types/activityEvent.ts'

const sampleEvent: ActivityEvent = {
  id: 4289701,
  code: 'ACTIVITY-EVENTS-0001',
  event_type: 'production.batch_started',
  entity_type: 'production_log',
  entity_id: 61001,
  actor_user_id: 77051,
  actor_role_id: 2,
  action: 'execute',
  from_state: null,
  to_state: 'started',
  payload: {
    work_order_code: 'WO-0140',
    machine_code: 'PRESS-05',
  },
  machine_id: 101,
  lot_id: null,
  work_order_id: 13001,
  location_id: 9001,
  device_id: null,
  ip_address: '10.10.5.42',
  occurred_at: '2026-06-27T10:00:00Z',
  correlation_id: 55,
  location_code: 'SHOP-CS',
  work_order_code: 'WO-0140',
  lot_code: null,
}

describe('projectAuditEventRow', () => {
  it('shows business codes and hides raw physical IDs from display fields', () => {
    const row = projectAuditEventRow(sampleEvent)
    assert.equal(row.code, 'ACTIVITY-EVENTS-0001')
    assert.equal(row.locationLabel, 'SHOP-CS')
    assert.equal(row.workOrderLabel, 'WO-0140')
    assert.equal(row.lotLabel, '—')
    assert.equal(row.eventType, 'production.batch_started')
    assert.doesNotMatch(JSON.stringify(row), /"location_id"/)
    assert.doesNotMatch(JSON.stringify(row), /"work_order_id"/)
    assert.doesNotMatch(JSON.stringify(row), /"lot_id"/)
  })

  it('falls back to unavailable label when projection codes are missing', () => {
    const row = projectAuditEventRow({
      ...sampleEvent,
      location_code: undefined,
      work_order_code: undefined,
      location_id: 1,
      work_order_id: 2,
      lot_id: 3,
    })
    assert.equal(row.locationLabel, '—')
    assert.equal(row.workOrderLabel, '—')
    assert.equal(row.lotLabel, '—')
  })
})

describe('formatPayloadPreview', () => {
  it('renders safe JSON preview without inventing fields', () => {
    assert.match(formatPayloadPreview(sampleEvent.payload), /WO-0140/)
    assert.equal(formatPayloadPreview(null), '—')
  })
})

describe('resolveAuditListState', () => {
  it('maps loading/empty/no-result/permission/error states', () => {
    assert.equal(resolveAuditListState({ status: 'loading', itemCount: 0, hasQuery: false }), 'loading')
    assert.equal(resolveAuditListState({ status: 'success', itemCount: 0, hasQuery: false }), 'empty')
    assert.equal(resolveAuditListState({ status: 'success', itemCount: 0, hasQuery: true }), 'no-result')
    assert.equal(
      resolveAuditListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'PERMISSION_DENIED' }),
      'permission-denied',
    )
    assert.equal(
      resolveAuditListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'DEPENDENCY_UNAVAILABLE' }),
      'error',
    )
  })
})

describe('resolveExportUiState', () => {
  it('treats deferred/unavailable export as blocked feature', () => {
    assert.equal(resolveExportUiState({ status: 'idle' }), 'idle')
    assert.equal(resolveExportUiState({ status: 'pending' }), 'async-processing')
    assert.equal(resolveExportUiState({ status: 'success', jobCode: 'JOB-1' }), 'queued')
    assert.equal(
      resolveExportUiState({ status: 'error', errorCode: 'DEPENDENCY_UNAVAILABLE' }),
      'blocked-feature',
    )
    assert.equal(resolveExportUiState({ status: 'error', errorCode: 'PERMISSION_DENIED' }), 'permission-denied')
  })
})
