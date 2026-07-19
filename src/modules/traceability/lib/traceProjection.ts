import type {
  AllowedAction,
  TraceGraphRecord,
  TraceGraphView,
  TraceRootRef,
  TraceSearchHitView,
} from '../types/traceability'

const UNAVAILABLE = '-'

export function findAllowedAction(
  actions: AllowedAction[] | undefined,
  action: string,
): AllowedAction | null {
  return actions?.find((item) => item.action === action) ?? null
}

/** Map graph root entity_type → MES07-006 root_type. */
export function mapRootTypeForExport(entityType: string): string | null {
  switch (entityType) {
    case 'lot':
    case 'finished_lot':
      return 'LOT'
    case 'serial_unit':
      return 'SERIAL'
    case 'work_order':
      return 'WORK_ORDER'
    default:
      return null
  }
}

export function projectSearchHit(hit: TraceRootRef): TraceSearchHitView {
  return {
    rootType: hit.root_type || UNAVAILABLE,
    rootCode: hit.root_code || UNAVAILABLE,
    label: hit.label || UNAVAILABLE,
    route: hit.route || '',
  }
}

export function projectGraphView(graph: TraceGraphRecord): TraceGraphView {
  const exportAction = findAllowedAction(graph.allowed_actions, 'export')
  const forwardImpactAction = findAllowedAction(graph.allowed_actions, 'forward_impact')
  return {
    rootType: graph.root.entity_type || UNAVAILABLE,
    rootCode: graph.root.code || UNAVAILABLE,
    rootLabel: graph.root.label || UNAVAILABLE,
    nodeCount: graph.nodes?.length ?? 0,
    edgeCount: graph.edges?.length ?? 0,
    nodes: graph.nodes ?? [],
    edges: graph.edges ?? [],
    canExport: exportAction?.enabled === true,
    canForwardImpact: forwardImpactAction?.enabled === true,
    exportAction,
    forwardImpactAction,
    exportRootType: mapRootTypeForExport(graph.root.entity_type),
  }
}

export function resolveListState(input: {
  status: 'loading' | 'success' | 'error'
  itemCount: number
  hasQuery: boolean
  errorCode: string | null
}): 'loading' | 'empty' | 'no-result' | 'permission-denied' | 'error' | 'ready' {
  if (input.status === 'loading') return 'loading'
  if (input.status === 'error') {
    return input.errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  }
  if (input.itemCount === 0) return input.hasQuery ? 'no-result' : 'empty'
  return 'ready'
}

export function resolveExportUiState(input: {
  status: 'idle' | 'pending' | 'success' | 'error'
  jobCode?: string | null
  errorCode?: string | null
}): 'idle' | 'async-processing' | 'queued' | 'permission-denied' | 'error' {
  if (input.status === 'pending') return 'async-processing'
  if (input.status === 'success') return 'queued'
  if (input.status === 'error') {
    return input.errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  }
  return 'idle'
}

export function resolveGraphState(input: {
  status: 'idle' | 'loading' | 'success' | 'error'
  errorCode: string | null
}): 'idle' | 'loading' | 'ready' | 'permission-denied' | 'not-found' | 'error' {
  if (input.status === 'idle') return 'idle'
  if (input.status === 'loading') return 'loading'
  if (input.status === 'error') {
    if (input.errorCode === 'PERMISSION_DENIED') return 'permission-denied'
    if (input.errorCode === 'NOT_FOUND') return 'not-found'
    return 'error'
  }
  return 'ready'
}
