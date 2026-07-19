import type { WO360Response } from '../api/wo360Api'

const UNAVAILABLE = '-'

export function projectWO360Header(data: WO360Response) {
  const wo = data.work_order
  return {
    code: wo.code || UNAVAILABLE,
    itemLabel: wo.item_code || UNAVAILABLE,
    itemName: wo.item_name || UNAVAILABLE,
    status: wo.status || UNAVAILABLE,
    plannedQty: wo.planned_qty,
    producedQty: wo.produced_qty,
    scrapQty: wo.scrap_qty,
    bomLabel: wo.bom_code || UNAVAILABLE,
    routingLabel: wo.routing_code || UNAVAILABLE,
    sectionCounts: {
      bom: data.bom_snapshot?.length ?? 0,
      mr: data.material_requests?.length ?? 0,
      logs: data.production_logs?.length ?? 0,
      lots: data.lot_bindings?.length ?? 0,
      qc: data.inspection_results?.length ?? 0,
      grn: data.goods_receipts?.length ?? 0,
      timeline: data.timeline?.length ?? 0,
    },
  }
}

export function resolveWO360State(input: {
  status: 'loading' | 'success' | 'error'
  errorCode: string | null
}): 'loading' | 'permission-denied' | 'not-found' | 'error' | 'ready' {
  if (input.status === 'loading') return 'loading'
  if (input.status === 'error') {
    if (input.errorCode === 'PERMISSION_DENIED') return 'permission-denied'
    if (input.errorCode === 'RESOURCE_NOT_FOUND' || input.errorCode === 'NOT_FOUND') {
      return 'not-found'
    }
    return 'error'
  }
  return 'ready'
}
