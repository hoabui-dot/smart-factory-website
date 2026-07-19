import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import { getWorkOrder360 } from '../api/wo360Api'
import { projectWO360Header, resolveWO360State } from '../lib/wo360Projection'

import './SharedAggregatePages.css'

function stateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải WO 360…'
    case 'permission-denied':
      return 'Bạn không có quyền xem WO 360 này.'
    case 'not-found':
      return 'Không tìm thấy Work Order.'
    case 'error':
      return 'Không tải được WO 360. Vui lòng thử lại.'
    default:
      return ''
  }
}

export function WO360Page() {
  const { workOrderId } = useParams()
  const id = Number(workOrderId)
  const query = useQuery({
    queryKey: ['shared01c', 'wo360', id],
    queryFn: () => getWorkOrder360(id),
    enabled: Number.isInteger(id) && id > 0,
  })
  const err = query.error instanceof ApiError ? query.error : null
  const state = resolveWO360State({
    status: query.isLoading ? 'loading' : query.isError ? 'error' : 'success',
    errorCode: err?.code ?? null,
  })
  const view = query.data ? projectWO360Header(query.data) : null

  return (
    <section className="shared-agg" aria-labelledby="wo360-title">
      <header className="shared-agg__header">
        <div>
          <p className="shared-agg__eyebrow">WEB-SHARED-01C-WO-360 · `/web/shared/wo-360/:work_order_id`</p>
          <h2 id="wo360-title">WO 360</h2>
          <p className="shared-agg__lead">
            Aggregate read-only — hiển thị business code, không render physical ID như label.
          </p>
        </div>
        <Link to="/web/mes/work-orders">Về Work Orders</Link>
      </header>

      {!Number.isInteger(id) || id <= 0 ? (
        <p className="shared-agg__state" role="alert">
          Cần work_order_id hợp lệ trên route.
        </p>
      ) : state === 'loading' ? (
        <p className="shared-agg__state" role="status">
          {stateMessage(state)}
        </p>
      ) : state !== 'ready' || !view || !query.data ? (
        <p className="shared-agg__state" role="alert">
          {stateMessage(state)}
          {err ? ` (${err.code}: ${err.message})` : ''}
        </p>
      ) : (
        <>
          <dl className="shared-agg__meta">
            <div>
              <dt>WO</dt>
              <dd>{view.code}</dd>
            </div>
            <div>
              <dt>Item</dt>
              <dd>
                {view.itemLabel}
                {view.itemName !== '-' ? ` · ${view.itemName}` : ''}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{view.status}</dd>
            </div>
            <div>
              <dt>Planned / Produced / Scrap</dt>
              <dd>
                {view.plannedQty} / {view.producedQty} / {view.scrapQty}
              </dd>
            </div>
            <div>
              <dt>BOM / Routing</dt>
              <dd>
                {view.bomLabel} / {view.routingLabel}
              </dd>
            </div>
          </dl>
          <div className="shared-agg__grid">
            <Section title={`BOM snapshot (${view.sectionCounts.bom})`}>
              {query.data.bom_snapshot.length === 0 ? (
                <p className="shared-agg__muted">Không có dòng BOM trong scope.</p>
              ) : (
                <table>
                  <tbody>
                    {query.data.bom_snapshot.map((r) => (
                      <tr key={`${r.line_no}-${r.item_code}`}>
                        <td>{r.line_no}</td>
                        <td>{r.item_code}</td>
                        <td>
                          {r.qty_per_unit} {r.uom_code}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
            <Section title={`Material requests (${view.sectionCounts.mr})`}>
              {query.data.material_requests.length === 0 ? (
                <p className="shared-agg__muted">Không có material request.</p>
              ) : (
                <table>
                  <tbody>
                    {query.data.material_requests.map((r) => (
                      <tr key={r.code}>
                        <td>{r.code}</td>
                        <td>{r.item_code}</td>
                        <td>{r.status}</td>
                        <td>{r.required_qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
            <Section title={`Production logs (${view.sectionCounts.logs})`}>
              {query.data.production_logs.length === 0 ? (
                <p className="shared-agg__muted">Không có production log.</p>
              ) : (
                <table>
                  <tbody>
                    {query.data.production_logs.map((r) => (
                      <tr key={r.code}>
                        <td>{r.code}</td>
                        <td>{r.status}</td>
                        <td>{r.good_qty}</td>
                        <td>{r.scrap_qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
            <Section title={`Lot bindings (${view.sectionCounts.lots})`}>
              {query.data.lot_bindings.length === 0 ? (
                <p className="shared-agg__muted">Không có lot binding.</p>
              ) : (
                <table>
                  <tbody>
                    {query.data.lot_bindings.map((r) => (
                      <tr key={`${r.production_log_code}-${r.lot_code}`}>
                        <td>{r.lot_code}</td>
                        <td>{r.item_code}</td>
                        <td>{r.consumed_qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
            <Section title={`QC (${view.sectionCounts.qc})`}>
              {query.data.inspection_results.length === 0 ? (
                <p className="shared-agg__muted">Không có inspection result.</p>
              ) : (
                <table>
                  <tbody>
                    {query.data.inspection_results.map((r) => (
                      <tr key={r.code}>
                        <td>{r.code}</td>
                        <td>{r.stage_code}</td>
                        <td>{r.status}</td>
                        <td>{r.overall_result ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
            <Section title={`Goods receipts (${view.sectionCounts.grn})`}>
              {query.data.goods_receipts.length === 0 ? (
                <p className="shared-agg__muted">Không có goods receipt.</p>
              ) : (
                <table>
                  <tbody>
                    {query.data.goods_receipts.map((r) => (
                      <tr key={r.code}>
                        <td>{r.code}</td>
                        <td>{r.status}</td>
                        <td>{r.source_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
            <Section title={`Timeline (${view.sectionCounts.timeline})`}>
              {query.data.timeline.length === 0 ? (
                <p className="shared-agg__muted">Chưa có activity.</p>
              ) : (
                <table>
                  <tbody>
                    {query.data.timeline.map((ev, idx) => (
                      <tr key={`${ev.occurred_at ?? 't'}-${idx}`}>
                        <td>{ev.occurred_at ?? '-'}</td>
                        <td>{ev.event_type ?? ev.action ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
          </div>
        </>
      )}
    </section>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="shared-agg__card">
      <h3>{title}</h3>
      {children}
    </section>
  )
}
