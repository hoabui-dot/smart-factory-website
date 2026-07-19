import { Link, Navigate } from 'react-router'

import { useProductionDashboard } from '../hooks/useProductionDashboard'
import { formatKpiValue } from '../lib/dashboardProjection'

import './ProductionDashboardPage.css'

const KPI_OPTIONS = [
  'YIELD_RATE',
  'SCRAP_RATE',
  'REWORK_RATE',
  'LOSS_RATE',
  'OEE',
  'INVENTORY_ACCURACY',
  'FEFO_COMPLIANCE',
  'NCR_INSPECTION_RATE',
  'NCR_PRODUCTION_RATE',
]

function stateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải…'
    case 'empty':
      return 'Chưa có downtime log.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem.'
    case 'error':
      return 'Không tải được dữ liệu.'
    default:
      return ''
  }
}

function exportMessage(state: string, jobCode: string | null): string {
  switch (state) {
    case 'async-processing':
      return 'Đang gửi yêu cầu export…'
    case 'queued':
      return jobCode
        ? `Đã xếp hàng PRODUCTION_REPORT_EXPORT: ${jobCode} — tải về tại Import/Export Center.`
        : 'Đã xếp hàng export.'
    case 'permission-denied':
      return 'Không có quyền export.'
    case 'error':
      return 'Export thất bại.'
    default:
      return ''
  }
}

export function ProductionDashboardPage() {
  const d = useProductionDashboard()
  const dashBanner = stateMessage(d.dashState === 'ready' ? '' : d.dashState)
  const listBanner = stateMessage(d.listState)
  const exportBanner = exportMessage(d.exportState, d.exportJobCode)

  return (
    <section className="mes08-admin" aria-labelledby="mes08-title">
      <header className="mes08-admin__header">
        <div>
          <p className="mes08-admin__eyebrow">WEB-MES-08-DASHBOARD · `/web/mes/dashboards`</p>
          <h2 id="mes08-title">Production Dashboard</h2>
          <p className="mes08-admin__lead">
            KPI canonical, filter thời gian, export báo cáo và phân loại downtime (MES08-006) theo
            server <code>allowed_actions</code>.
          </p>
        </div>
        <div className="mes08-admin__actions">
          <Link to="/web/import-export">Import/Export Center</Link>
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

      <div className="mes08-admin__tabs" role="tablist" aria-label="Dashboard sections">
        <button
          type="button"
          role="tab"
          aria-selected={d.tab === 'kpis'}
          onClick={() => d.setTab('kpis')}
        >
          KPIs &amp; Report
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={d.tab === 'downtime'}
          onClick={() => d.setTab('downtime')}
        >
          Downtime
        </button>
      </div>

      {d.tab === 'kpis' ? (
        <>
          <form
            className="mes08-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              d.applyFilter()
            }}
          >
            <label className="mes08-admin__field">
              <span>from (ISO)</span>
              <input value={d.from} onChange={(e) => d.setFrom(e.target.value)} />
            </label>
            <label className="mes08-admin__field">
              <span>to (ISO)</span>
              <input value={d.to} onChange={(e) => d.setTo(e.target.value)} />
            </label>
            <button type="submit" className="mes08-admin__btn">
              Áp dụng filter
            </button>
            <button
              type="button"
              className="mes08-admin__btn"
              disabled={!d.dashView?.canExport}
              onClick={d.export}
            >
              Export report
            </button>
          </form>

          {dashBanner ? (
            <p className="mes08-admin__state" role="status">
              {dashBanner}
              {d.dashError ? ` (${d.dashError.code})` : ''}
            </p>
          ) : null}
          {exportBanner ? (
            <p className="mes08-admin__banner" role="status">
              {exportBanner}
            </p>
          ) : null}
          {d.exportError ? (
            <p className="mes08-admin__error" role="alert">
              {d.exportError.code}: {d.exportError.message}
            </p>
          ) : null}

          {d.dashState === 'ready' && d.dashView ? (
            <>
              <div className="mes08-admin__kpi-grid">
                {d.dashView.kpis.map((kpi) => (
                  <article key={kpi.kpi_code} className="mes08-admin__kpi-card">
                    <h3>{kpi.kpi_code}</h3>
                    <p>{formatKpiValue(kpi.value, kpi.unit)}</p>
                  </article>
                ))}
              </div>
              <dl className="mes08-admin__meta">
                <div>
                  <dt>Good / Processed / FG</dt>
                  <dd>
                    {d.dashView.goodOutput} / {d.dashView.totalProcessed} /{' '}
                    {d.dashView.finishedGoods}
                  </dd>
                </div>
                <div>
                  <dt>Open downtimes</dt>
                  <dd>{d.dashView.openDowntimes}</dd>
                </div>
              </dl>

              <div className="mes08-admin__layout">
                <div className="mes08-admin__table-wrap">
                  <h3>Work orders</h3>
                  <table className="mes08-admin__table">
                    <thead>
                      <tr>
                        <th>WO</th>
                        <th>Status</th>
                        <th>Planned</th>
                        <th>Good</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.dashView.workOrders.map((wo) => (
                        <tr key={wo.work_order_code}>
                          <td>{wo.work_order_code}</td>
                          <td>{wo.status}</td>
                          <td>{wo.planned_qty}</td>
                          <td>{wo.good_qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mes08-admin__table-wrap">
                  <h3>Machines</h3>
                  <table className="mes08-admin__table">
                    <thead>
                      <tr>
                        <th>Machine</th>
                        <th>Open DT</th>
                        <th>Last good</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.dashView.machines.map((m) => (
                        <tr key={m.machine_code}>
                          <td>{m.machine_code}</td>
                          <td>{m.open_downtime ? 'yes' : 'no'}</td>
                          <td>{m.last_good_qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <label className="mes08-admin__field">
                <span>KPI series</span>
                <select value={d.kpiCode} onChange={(e) => d.setKpiCode(e.target.value)}>
                  {KPI_OPTIONS.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </label>
              {d.kpiLoading ? (
                <p className="mes08-admin__state">Đang tải series…</p>
              ) : (
                <div className="mes08-admin__table-wrap">
                  <table className="mes08-admin__table">
                    <thead>
                      <tr>
                        <th>Dimension</th>
                        <th>Label</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.kpiSeries.map((pt) => (
                        <tr key={pt.dimension_key}>
                          <td>{pt.dimension_key}</td>
                          <td>{pt.dimension_label}</td>
                          <td>{pt.value ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </>
      ) : (
        <>
          <form
            className="mes08-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              d.applySearch()
            }}
          >
            <label className="mes08-admin__field">
              <span>Tìm downtime</span>
              <input
                value={d.searchInput}
                onChange={(e) => d.setSearchInput(e.target.value)}
              />
            </label>
            <button type="submit" className="mes08-admin__btn">
              Lọc
            </button>
          </form>

          {listBanner ? (
            <p className="mes08-admin__state" role="status">
              {listBanner}
              {d.listError ? ` (${d.listError.code})` : ''}
            </p>
          ) : null}

          {d.listState === 'ready' ? (
            <div className="mes08-admin__layout">
              <div className="mes08-admin__table-wrap">
                <table className="mes08-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Machine</th>
                      <th>WO</th>
                      <th>Status</th>
                      <th>Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.rows.map((row) => (
                      <tr
                        key={row.code}
                        className={
                          row.code === d.selectedCode ? 'mes08-admin__row--active' : ''
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="mes08-admin__linkish"
                            onClick={() => d.selectDowntime(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.machineLabel}</td>
                        <td>{row.workOrderLabel}</td>
                        <td>{row.status}</td>
                        <td>{row.startedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {d.hasMore ? (
                  <button type="button" className="mes08-admin__more" onClick={d.loadMore}>
                    Tải thêm
                  </button>
                ) : null}
              </div>

              {d.detailLoading ? (
                <div className="mes08-admin__state">Đang tải chi tiết…</div>
              ) : d.detail && d.detailRow ? (
                <aside className="mes08-admin__detail" aria-label="Chi tiết downtime">
                  <h3>{d.detail.code}</h3>
                  <p className="mes08-admin__muted">
                    {d.detailRow.machineLabel} · {d.detailRow.status}
                  </p>
                  <dl className="mes08-admin__meta">
                    <div>
                      <dt>WO / Shift</dt>
                      <dd>
                        {d.detailRow.workOrderLabel} / {d.detailRow.shiftLabel}
                      </dd>
                    </div>
                    <div>
                      <dt>Started / Ended</dt>
                      <dd>
                        {d.detailRow.startedAt} / {d.detailRow.endedAt}
                      </dd>
                    </div>
                    <div>
                      <dt>Duration (min)</dt>
                      <dd>{d.detailRow.durationMin}</dd>
                    </div>
                  </dl>

                  <h4>Update metadata (MES08-006)</h4>
                  {!d.detailRow.canUpdate ? (
                    <p className="mes08-admin__muted">
                      Update không khả dụng
                      {d.detailRow.updateDisabledReason
                        ? ` (${d.detailRow.updateDisabledReason})`
                        : ''}
                      .
                    </p>
                  ) : (
                    <form
                      className="mes08-admin__edit"
                      onSubmit={(e) => {
                        e.preventDefault()
                        d.saveUpdate()
                      }}
                    >
                      <label className="mes08-admin__field">
                        <span>reason_code</span>
                        <input
                          value={d.editForm.reason_code ?? d.detail.reason_code ?? ''}
                          onChange={(e) =>
                            d.setEditForm({ ...d.editForm, reason_code: e.target.value })
                          }
                        />
                      </label>
                      <label className="mes08-admin__field">
                        <span>category</span>
                        <input
                          value={d.editForm.category ?? d.detail.category ?? ''}
                          onChange={(e) =>
                            d.setEditForm({ ...d.editForm, category: e.target.value })
                          }
                        />
                      </label>
                      <label className="mes08-admin__field">
                        <span>description</span>
                        <textarea
                          rows={3}
                          value={d.editForm.description ?? d.detail.description ?? ''}
                          onChange={(e) =>
                            d.setEditForm({ ...d.editForm, description: e.target.value })
                          }
                        />
                      </label>
                      <label className="mes08-admin__field">
                        <span>maintenance_note</span>
                        <textarea
                          rows={2}
                          value={
                            d.editForm.maintenance_note ?? d.detail.maintenance_note ?? ''
                          }
                          onChange={(e) =>
                            d.setEditForm({
                              ...d.editForm,
                              maintenance_note: e.target.value,
                            })
                          }
                        />
                      </label>
                      <button
                        type="submit"
                        className="mes08-admin__btn"
                        disabled={d.updatePending}
                      >
                        Lưu phân loại
                      </button>
                    </form>
                  )}
                  {d.updateError ? (
                    <p className="mes08-admin__error" role="alert">
                      {d.updateError.code}: {d.updateError.message}
                    </p>
                  ) : null}
                  {d.updateSuccess ? (
                    <p className="mes08-admin__banner" role="status">
                      Đã cập nhật downtime.
                    </p>
                  ) : null}
                </aside>
              ) : (
                <div className="mes08-admin__state">Chọn một downtime log để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}

/** Director landing `/dashboard` → canonical MES-08 route. */
export function DirectorDashboardRedirect() {
  return <Navigate to="/web/mes/dashboards" replace />
}
