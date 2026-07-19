import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  projectEventRow,
  resolveEventListState,
  resolveReplayUiState,
} from './eventProjection.ts'
import type { EventOutboxListItem } from '../types/realtimeEvent.ts'

const sample: EventOutboxListItem = {
  id: 42,
  event_id: 'evt-01JZ',
  event_type: 'production_log.posted',
  entity_type: 'production_log',
  entity_id: 901,
  source_module: 'MES-05',
  status: 'FAILED',
  retry_count: 3,
  last_error: 'realtime gateway unavailable',
  request_id: 'req-01JZ',
  occurred_at: '2026-07-18T01:00:00Z',
  payload_preview: { work_order_code: 'WO-0142', secret: '[REDACTED]' },
  allowed_actions: ['replay'],
}

describe('projectEventRow', () => {
  it('projects immutable event metadata and server-authorized actions', () => {
    const row = projectEventRow(sample)
    assert.equal(row.id, 42)
    assert.equal(row.eventId, 'evt-01JZ')
    assert.equal(row.entityReference, 'production_log #901')
    assert.equal(row.status, 'FAILED')
    assert.equal(row.retryCount, 3)
    assert.equal(row.canReplay, true)
    assert.match(row.payloadPreview, /REDACTED/)
  })

  it('does not infer replay from status when server omits the action', () => {
    const row = projectEventRow({ ...sample, status: 'DEAD_LETTER', allowed_actions: [] })
    assert.equal(row.canReplay, false)
  })
})

describe('resolveEventListState', () => {
  it('maps loading, empty, no-result, permission and error states', () => {
    assert.equal(
      resolveEventListState({ status: 'loading', itemCount: 0, hasFilters: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolveEventListState({ status: 'success', itemCount: 0, hasFilters: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveEventListState({ status: 'success', itemCount: 0, hasFilters: true, errorCode: null }),
      'no-result',
    )
    assert.equal(
      resolveEventListState({
        status: 'error',
        itemCount: 0,
        hasFilters: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
    assert.equal(
      resolveEventListState({ status: 'error', itemCount: 0, hasFilters: false, errorCode: 'X' }),
      'error',
    )
  })
})

describe('resolveReplayUiState', () => {
  it('requires confirmation and preserves canonical errors', () => {
    assert.equal(resolveReplayUiState({ confirmOpen: true, status: 'idle', errorCode: null }), 'confirm')
    assert.equal(resolveReplayUiState({ confirmOpen: true, status: 'pending', errorCode: null }), 'pending')
    assert.equal(resolveReplayUiState({ confirmOpen: false, status: 'success', errorCode: null }), 'success')
    assert.equal(
      resolveReplayUiState({ confirmOpen: false, status: 'error', errorCode: 'PERMISSION_DENIED' }),
      'permission-denied',
    )
    assert.equal(
      resolveReplayUiState({ confirmOpen: false, status: 'error', errorCode: 'NOT_ALLOWED_BY_STATUS' }),
      'not-allowed',
    )
  })
})
