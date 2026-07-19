import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  findAllowedAction,
  mapRootTypeForExport,
  projectGraphView,
  projectSearchHit,
  resolveExportUiState,
  resolveListState,
} from './traceProjection.ts'
import type { TraceGraphRecord, TraceRootRef } from '../types/traceability.ts'

const hit: TraceRootRef = {
  root_type: 'LOT',
  root_code: 'LOT-1',
  label: 'Steel lot',
  route: '/api/mes/traceability/lots/LOT-1',
}

const graph: TraceGraphRecord = {
  root: { entity_type: 'finished_lot', code: 'FL-1', label: 'FG lot' },
  nodes: [
    {
      node_key: 'finished_lot:FL-1',
      entity_type: 'finished_lot',
      code: 'FL-1',
      label: 'FG lot',
      node_role: 'ROOT',
    },
    {
      node_key: 'work_order:WO-1',
      entity_type: 'work_order',
      code: 'WO-1',
      label: 'WO-1',
      node_role: 'WORK_ORDER',
    },
  ],
  edges: [
    {
      from_node_key: 'finished_lot:FL-1',
      to_node_key: 'work_order:WO-1',
      relation_type: 'PRODUCED_BY',
    },
  ],
  allowed_actions: [
    {
      action: 'export',
      method: 'POST',
      href: '/api/mes/traceability/exports',
      enabled: true,
    },
    {
      action: 'forward_impact',
      method: 'GET',
      href: '/api/mes/traceability/lots/FL-1/forward-impact',
      enabled: true,
    },
  ],
}

describe('traceProjection', () => {
  it('projectSearchHit keeps business codes', () => {
    const row = projectSearchHit(hit)
    assert.equal(row.rootType, 'LOT')
    assert.equal(row.rootCode, 'LOT-1')
    assert.equal(row.label, 'Steel lot')
  })

  it('projectGraphView gates export/forward from allowed_actions only', () => {
    const view = projectGraphView(graph)
    assert.equal(view.rootCode, 'FL-1')
    assert.equal(view.nodeCount, 2)
    assert.equal(view.edgeCount, 1)
    assert.equal(view.canExport, true)
    assert.equal(view.canForwardImpact, true)
    assert.equal(view.exportRootType, 'LOT')
  })

  it('mapRootTypeForExport maps entity types', () => {
    assert.equal(mapRootTypeForExport('finished_lot'), 'LOT')
    assert.equal(mapRootTypeForExport('serial_unit'), 'SERIAL')
    assert.equal(mapRootTypeForExport('work_order'), 'WORK_ORDER')
    assert.equal(mapRootTypeForExport('unknown'), null)
  })

  it('findAllowedAction and list/export states', () => {
    assert.equal(findAllowedAction(graph.allowed_actions, 'export')?.enabled, true)
    assert.equal(
      resolveListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
      'no-result',
    )
    assert.equal(resolveExportUiState({ status: 'pending' }), 'async-processing')
    assert.equal(
      resolveExportUiState({ status: 'success', jobCode: 'JOB-1' }),
      'queued',
    )
  })
})
