import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  projectNotificationRow,
  resolveMarkReadUiState,
  resolveNotificationListState,
} from './notificationProjection.ts'
import type { NotificationItem } from '../types/notification.ts'

const sample: NotificationItem = {
  id: 7,
  code: 'NTF-000007',
  event_type: 'work_order.delayed',
  title: 'WO trễ hạn',
  body: 'WO-0142 vượt kế hoạch 2 giờ.',
  priority: 'HIGH',
  display_mode: 'BANNER',
  group_key: 'wo-delayed',
  item_count: 3,
  related_entity_type: 'work_order',
  related_entity_id: 142,
  deep_link: '/web/mes/work-orders/142',
  is_read: false,
  read_at: null,
  created_at: '2026-07-18T02:00:00Z',
}

describe('projectNotificationRow', () => {
  it('projects inbox fields and aggregate group label', () => {
    const row = projectNotificationRow(sample)
    assert.equal(row.code, 'NTF-000007')
    assert.equal(row.priority, 'HIGH')
    assert.equal(row.groupLabel, 'wo-delayed ×3')
    assert.equal(row.relatedEntity, 'work_order #142')
    assert.equal(row.isRead, false)
    assert.equal(row.deepLink, '/web/mes/work-orders/142')
  })

  it('does not invent deep link when empty', () => {
    const row = projectNotificationRow({ ...sample, deep_link: '', item_count: 1, group_key: null })
    assert.equal(row.deepLink, '')
    assert.equal(row.groupLabel, '-')
  })
})

describe('resolveNotificationListState', () => {
  it('maps loading empty no-result permission and error', () => {
    assert.equal(
      resolveNotificationListState({
        status: 'loading',
        itemCount: 0,
        hasFilters: false,
        errorCode: null,
      }),
      'loading',
    )
    assert.equal(
      resolveNotificationListState({
        status: 'success',
        itemCount: 0,
        hasFilters: false,
        errorCode: null,
      }),
      'empty',
    )
    assert.equal(
      resolveNotificationListState({
        status: 'success',
        itemCount: 0,
        hasFilters: true,
        errorCode: null,
      }),
      'no-result',
    )
    assert.equal(
      resolveNotificationListState({
        status: 'error',
        itemCount: 0,
        hasFilters: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
  })
})

describe('resolveMarkReadUiState', () => {
  it('preserves canonical error codes', () => {
    assert.equal(resolveMarkReadUiState({ status: 'pending', errorCode: null }), 'pending')
    assert.equal(
      resolveMarkReadUiState({ status: 'error', errorCode: 'NOT_FOUND' }),
      'not-found',
    )
  })
})
