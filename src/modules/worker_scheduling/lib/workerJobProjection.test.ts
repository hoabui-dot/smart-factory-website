import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { projectWorkerJobRow, resolveWorkerListState } from './workerJobProjection.ts'
import type { WorkerJob } from '../types/workerJob.ts'

const sample: WorkerJob = {
  id: 1,
  job_key: 'nb08.notification_fanout',
  display_name_vi: 'Notification fanout',
  job_category: 'SCHEDULED',
  module_scope: 'NB-08',
  cron_expr: '*/5 * * * *',
  enabled: true,
  timeout_seconds: 60,
  max_retry: 3,
  queue_name: 'default',
  concurrency: 1,
  description_vi: 'Fan-out notifications',
  last_status: 'SUCCESS',
  last_run_at: '2026-07-18T04:00:00Z',
  next_run_at: '2026-07-18T04:05:00Z',
  updated_at: '2026-07-18T04:00:00Z',
}

describe('projectWorkerJobRow', () => {
  it('projects admin console fields without inventing codes', () => {
    const row = projectWorkerJobRow(sample)
    assert.equal(row.jobKey, 'nb08.notification_fanout')
    assert.equal(row.enabled, true)
    assert.equal(row.cronExpr, '*/5 * * * *')
    assert.equal(row.lastStatus, 'SUCCESS')
  })
})

describe('resolveWorkerListState', () => {
  it('maps permission-denied for system_admin_only failures', () => {
    assert.equal(
      resolveWorkerListState({
        status: 'error',
        itemCount: 0,
        hasFilters: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
  })
})
