import { Link } from 'react-router'

import { useProductionMonitor } from '../hooks/useProductionMonitor'

import './ProductionMonitorPage.css'

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải…'
    case 'empty':
      return 'Chưa có production log.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem.'
    case 'error':
      return 'Không tải được dữ liệu. Thử lại sau.'
    default:
      return ''
  }
}

export function ProductionMonitorPage() {
  const mon = useProductionMonitor()
  const banner = listStateMessage(mon.listState)

  return (
    <section className="pl-admin" aria-labelledby="pl-admin-title">
      <header className="pl-admin__header">
        <div>
          <p className="pl-admin__eyebrow">
            WEB-MES-05-PRODUCTION-MONITOR · `/web/mes/production-logs`
          </p>
          <h2 id="pl-admin-title">Production Monitor</h2>
          <p className="pl-admin__lead">
            Giám sát production log do Tablet tạo; Web chỉ review 4M+T và audited void khi
            server `allowed_actions` cho phép.
          </p>
        </div>
        <div className="pl-admin__actions">
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

      <form
        className="pl-admin__filters"
        onSubmit={(e) => {
          e.preventDefault()
          mon.applySearch()
        }}
      >
        <label className="pl-admin__field">
          <span>Tìm (code / WO)</span>
          <input
            value={mon.searchInput}
            onChange={(e) => mon.setSearchInput(e.target.value)}
          />
        </label>
        <button type="submit" className="pl-admin__btn">
          Lọc
        </button>
      </form>

      {banner ? (
        <p className="pl-admin__state" role={mon.listState === 'error' ? 'alert' : 'status'}>
          {banner}
          {mon.listError ? ` (${mon.listError.code})` : ''}
        </p>
      ) : null}

      {mon.listState === 'ready' ? (
        <div className="pl-admin__layout">
          <div className="pl-admin__table-wrap">
            <table className="pl-admin__table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Work order</th>
                  <th>Operation</th>
                  <th>Status</th>
                  <th>Good</th>
                  <th>Scrap</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {mon.rows.map((row) => (
                  <tr
                    key={row.code}
                    className={row.code === mon.selectedCode ? 'pl-admin__row--active' : ''}
                  >
                    <td>
                      <button
                        type="button"
                        className="pl-admin__linkish"
                        onClick={() => mon.selectLog(row.code)}
                      >
                        {row.code}
                      </button>
                    </td>
                    <td>{row.workOrderLabel}</td>
                    <td>{row.operationLabel}</td>
                    <td>{row.status}</td>
                    <td>{row.goodQty}</td>
                    <td>{row.scrapQty}</td>
                    <td>{row.startedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mon.hasMore ? (
              <button type="button" className="pl-admin__more" onClick={mon.loadMore}>
                Tải thêm
              </button>
            ) : null}
          </div>

          {mon.detailLoading ? (
            <div className="pl-admin__state">Đang tải chi tiết…</div>
          ) : mon.detail && mon.detailRow ? (
            <aside className="pl-admin__detail" aria-label="Chi tiết production log">
              <h3>{mon.detail.code}</h3>
              <p className="pl-admin__muted">
                {mon.detailRow.workOrderLabel} · {mon.detailRow.operationLabel} ·{' '}
                {mon.detailRow.status}
              </p>
              <dl className="pl-admin__meta">
                <div>
                  <dt>Operator</dt>
                  <dd>{mon.detailRow.operatorLabel}</dd>
                </div>
                <div>
                  <dt>Shift</dt>
                  <dd>{mon.detailRow.shiftLabel}</dd>
                </div>
                <div>
                  <dt>Started / Ended</dt>
                  <dd>
                    {mon.detailRow.startedAt} / {mon.detailRow.endedAt}
                  </dd>
                </div>
                <div>
                  <dt>Recorded at</dt>
                  <dd>{mon.detailRow.recordedAt}</dd>
                </div>
                <div>
                  <dt>Good / Scrap / Rework / Loss</dt>
                  <dd>
                    {mon.detailRow.goodQty} / {mon.detailRow.scrapQty} / {mon.detailRow.reworkQty}{' '}
                    / {mon.detailRow.lossQty}
                  </dd>
                </div>
                <div>
                  <dt>Input qty</dt>
                  <dd>{mon.detailRow.inputQty ?? '-'}</dd>
                </div>
                {mon.detailRow.voidReason ? (
                  <div>
                    <dt>Void reason</dt>
                    <dd>{mon.detailRow.voidReason}</dd>
                  </div>
                ) : null}
              </dl>

              {mon.detail.materials && mon.detail.materials.length > 0 ? (
                <>
                  <h4>Materials</h4>
                  <table className="pl-admin__table">
                    <thead>
                      <tr>
                        <th>Lot</th>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>UoM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mon.detail.materials.map((m) => (
                        <tr key={m.code}>
                          <td>{m.input_lot_code ?? '-'}</td>
                          <td>{m.input_item_code ?? '-'}</td>
                          <td>{m.consumed_qty}</td>
                          <td>{m.uom_code ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : null}

              {mon.detail.machines && mon.detail.machines.length > 0 ? (
                <>
                  <h4>Machines</h4>
                  <table className="pl-admin__table">
                    <thead>
                      <tr>
                        <th>Machine</th>
                        <th>Role</th>
                        <th>Run min</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mon.detail.machines.map((m) => (
                        <tr key={m.code}>
                          <td>{m.machine_code ?? '-'}</td>
                          <td>{m.role}</td>
                          <td>{m.run_minutes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : null}

              {mon.detail.defects && mon.detail.defects.length > 0 ? (
                <>
                  <h4>Defects</h4>
                  <table className="pl-admin__table">
                    <thead>
                      <tr>
                        <th>Defect</th>
                        <th>Scrap</th>
                        <th>Rework</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mon.detail.defects.map((d) => (
                        <tr key={d.code}>
                          <td>{d.defect_code ?? '-'}</td>
                          <td>{d.scrap_qty}</td>
                          <td>{d.rework_qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : null}

              <h4>Void (audited)</h4>
              <button
                type="button"
                className="pl-admin__btn pl-admin__btn--danger"
                disabled={!mon.detailRow.canVoid}
                title={mon.detailRow.voidDisabledReason ?? undefined}
                onClick={() => mon.setConfirmVoid(true)}
              >
                Void production log
              </button>
              {!mon.detailRow.canVoid ? (
                <p className="pl-admin__muted">
                  Void không khả dụng
                  {mon.detailRow.voidDisabledReason
                    ? ` (${mon.detailRow.voidDisabledReason})`
                    : ''}
                  .
                </p>
              ) : null}

              {mon.confirmVoid ? (
                <div className="pl-admin__confirm" role="dialog" aria-label="Xác nhận void">
                  <p>
                    Xác nhận void <strong>{mon.detail.code}</strong>? Hành động không hoàn tác;
                    lý do audit tối thiểu 10 ký tự.
                  </p>
                  <label className="pl-admin__field">
                    <span>void_reason</span>
                    <textarea
                      value={mon.voidReason}
                      onChange={(e) => mon.setVoidReason(e.target.value)}
                      rows={3}
                    />
                  </label>
                  <div className="pl-admin__actions">
                    <button
                      type="button"
                      className="pl-admin__btn pl-admin__btn--danger"
                      disabled={mon.voidErrors.length > 0 || mon.voidState === 'pending'}
                      onClick={mon.void}
                    >
                      Xác nhận void
                    </button>
                    <button type="button" onClick={() => mon.setConfirmVoid(false)}>
                      Hủy
                    </button>
                  </div>
                </div>
              ) : null}
              {mon.voidError ? (
                <p className="pl-admin__error" role="alert">
                  {mon.voidError.code}: {mon.voidError.message}
                </p>
              ) : null}
              {mon.voidState === 'success' ? (
                <p className="pl-admin__banner" role="status">
                  Đã void production log.
                </p>
              ) : null}
            </aside>
          ) : (
            <div className="pl-admin__state">Chọn một production log để xem chi tiết.</div>
          )}
        </div>
      ) : null}
    </section>
  )
}
