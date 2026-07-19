import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  findAllowedAction,
  formatKpiValue,
  projectDashboard,
  projectDowntimeRow,
  resolveDashboardState,
  resolveExportUiState,
} from './dashboardProjection.ts'
import type { DowntimeLogRecord, ProductionDashboard } from '../types/dashboard.ts'

const summary: ProductionDashboard = {
  filters_applied: {},
  kpis: [{ kpi_code: 'YIELD_RATE', value: 90, unit: '%', status: 'ok' }],
  production_output: {
    good_output: 900,
    total_processed_input: 1000,
    finished_goods_output: 850,
  },
  work_orders: [{ work_order_code: 'WO-1', status: 'IN_PROGRESS', planned_qty: 100, good_qty: 40 }],
  machines: [{ machine_code: 'PRESS-03', open_downtime: false, last_good_qty: 10 }],
  open_downtime_count: 2,
  allowed_actions: [
    {
      action: 'export',
      method: 'POST',
      href: '/api/mes/reports/production/exports',
      enabled: true,
    },
  ],
}

const downtime: DowntimeLogRecord = {
  id: 1,
  code: 'DT-1',
  status: 'OPEN',
  source: 'TABLET',
  started_at: '2026-07-18T01:00:00Z',
  machine_code: 'PRESS-03',
  work_order_code: 'WO-1',
  shift_code: 'A',
  allowed_actions: [
    {
      action: 'update',
      method: 'PATCH',
      href: '/api/mes/downtime-logs/DT-1',
      enabled: true,
    },
  ],
}

describe('projectDashboard', () => {
  it('gates export from allowed_actions only', () => {
    const view = projectDashboard(summary)
    assert.equal(view.canExport, true)
    assert.equal(view.exportAction?.href, '/api/mes/reports/production/exports')
    assert.equal(view.openDowntimes, 2)
    assert.equal(view.kpis[0]?.kpi_code, 'YIELD_RATE')
  })

  it('does not invent export when allowed_actions omitted', () => {
    const view = projectDashboard({ ...summary, allowed_actions: undefined })
    assert.equal(view.canExport, false)
  })
})

describe('projectDowntimeRow', () => {
  it('projects business codes and gates update from server', () => {
    const row = projectDowntimeRow(downtime)
    assert.equal(row.machineLabel, 'PRESS-03')
    assert.equal(row.canUpdate, true)
    assert.equal(findAllowedAction(downtime.allowed_actions, 'update_metadata'), null)
  })

  it('does not infer update from OPEN status alone', () => {
    const row = projectDowntimeRow({ ...downtime, allowed_actions: [] })
    assert.equal(row.canUpdate, false)
  })
})

describe('resolveDashboardState / export / format', () => {
  it('maps permission and formats kpi', () => {
    assert.equal(
      resolveDashboardState({ status: 'error', errorCode: 'PERMISSION_DENIED' }),
      'permission-denied',
    )
    assert.equal(
      resolveExportUiState({ status: 'success', jobCode: 'EXP-1' }),
      'queued',
    )
    assert.equal(formatKpiValue(90.123, '%'), '90.12 %')
  })
})
