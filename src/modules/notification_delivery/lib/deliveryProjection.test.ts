import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  projectDeliveryLogRow,
  projectPreferenceRow,
  projectSubscriptionRow,
  resolveDeliveryListState,
} from './deliveryProjection.ts'
import type { NotificationDeliveryLog } from '../types/notificationDelivery.ts'

describe('projectDeliveryLogRow', () => {
  it('enables retry only for FAILED status matching server rule', () => {
    const failed: NotificationDeliveryLog = {
      id: 9,
      code: 'NDL-9',
      notification_id: 3,
      channel: 'PUSH_WEB',
      status: 'FAILED',
      error_message: 'provider timeout',
      attempted_at: '2026-07-18T03:00:00Z',
    }
    assert.equal(projectDeliveryLogRow(failed).canRetry, true)
    assert.equal(projectDeliveryLogRow({ ...failed, status: 'SENT' }).canRetry, false)
  })
})

describe('projectSubscriptionRow / projectPreferenceRow', () => {
  it('projects active subscription and preference toggles', () => {
    const sub = projectSubscriptionRow({
      id: 1,
      code: 'PS-1',
      user_id: 2,
      channel: 'WEB_PUSH',
      endpoint: 'https://push.example/abc',
      user_agent: 'Chrome',
      subscribed_at: '2026-07-18T01:00:00Z',
      revoked_at: null,
    })
    assert.equal(sub.isActive, true)
    const pref = projectPreferenceRow({
      id: 1,
      code: 'UNP-1',
      user_id: 2,
      event_type: null,
      realtime_enabled: true,
      push_enabled: false,
      updated_at: '2026-07-18T01:00:00Z',
    })
    assert.equal(pref.eventType, '(default)')
    assert.equal(pref.pushEnabled, false)
  })
})

describe('resolveDeliveryListState', () => {
  it('maps permission-denied', () => {
    assert.equal(
      resolveDeliveryListState({
        status: 'error',
        itemCount: 0,
        hasFilters: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
  })
})
