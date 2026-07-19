import { httpClient, unwrapSuccessData } from '@/shared/api'

export type WO360Response = {
  work_order: {
    id: number
    code: string
    item_code: string
    item_name?: string
    status: string
    planned_qty: number
    produced_qty: number
    scrap_qty: number
    planned_start: string
    bom_code?: string
    routing_code?: string
  }
  bom_snapshot: { line_no: number; item_code: string; qty_per_unit: number; uom_code: string }[]
  material_requests: { code: string; item_code: string; status: string; required_qty: number }[]
  production_logs: { code: string; status: string; good_qty: number; scrap_qty: number }[]
  lot_bindings: { production_log_code: string; lot_code: string; item_code: string; consumed_qty: number }[]
  inspection_results: { code: string; stage_code: string; status: string; overall_result?: string | null }[]
  goods_receipts: { code: string; status: string; source_type: string }[]
  timeline: { event_type?: string; occurred_at?: string; action?: string }[]
}

export async function getWorkOrder360(workOrderId: number): Promise<WO360Response> {
  const { data } = await httpClient.get(`/api/shared/work-orders/${workOrderId}/360`)
  return unwrapSuccessData<WO360Response>(data)
}
