import { Link } from 'react-router'

import { useInspectionResult } from '../hooks/useInspectionResult'

import './InspectionResultPage.css'

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải…'
    case 'empty':
      return 'Chưa có dữ liệu.'
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

export function InspectionResultPage() {
  const admin = useInspectionResult()
  const banner = listStateMessage(admin.listState)
  const spcBanner = listStateMessage(admin.spcState)

  return (
    <section className="ir-admin" aria-labelledby="ir-admin-title">
      <header className="ir-admin__header">
        <div>
          <p className="ir-admin__eyebrow">
            WEB-QMS-02-INSPECTION-RESULT · `/web/qms/inspection-results`
          </p>
          <h2 id="ir-admin-title">Inspection Result Review</h2>
          <p className="ir-admin__lead">
            Review kết quả kiểm tra IQC/IPQC/FQC/OQC/FAI / SPC do Tablet ghi nhận; Web chỉ void
            có audit reason (không nhập measurement).
          </p>
        </div>
        <div className="ir-admin__actions">
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

      <div className="ir-admin__tabs" role="tablist" aria-label="Inspection review sections">
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'results'}
          onClick={() => admin.setTab('results')}
        >
          Results
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'spc'}
          onClick={() => admin.setTab('spc')}
        >
          SPC data
        </button>
      </div>

      {admin.tab === 'results' ? (
        <>
          <form
            className="ir-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applySearch()
            }}
          >
            <label className="ir-admin__field">
              <span>Tìm (code / lot / plan)</span>
              <input
                value={admin.searchInput}
                onChange={(e) => admin.setSearchInput(e.target.value)}
              />
            </label>
            <button type="submit" className="ir-admin__btn">
              Lọc
            </button>
          </form>

          {banner ? (
            <p
              className="ir-admin__state"
              role={admin.listState === 'error' ? 'alert' : 'status'}
            >
              {banner}
              {admin.listError ? ` (${admin.listError.code})` : ''}
            </p>
          ) : null}

          {admin.listState === 'ready' ? (
            <div className="ir-admin__layout">
              <div className="ir-admin__table-wrap">
                <table className="ir-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Stage</th>
                      <th>Plan</th>
                      <th>Lot</th>
                      <th>Finished lot</th>
                      <th>WO</th>
                      <th>Status</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.rows.map((row) => (
                      <tr
                        key={row.code}
                        className={
                          row.code === admin.selectedCode ? 'ir-admin__row--active' : ''
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="ir-admin__linkish"
                            onClick={() => admin.selectResult(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.stageLabel}</td>
                        <td>{row.planLabel}</td>
                        <td>{row.lotLabel}</td>
                        <td>{row.finishedLotLabel}</td>
                        <td>{row.workOrderLabel}</td>
                        <td>{row.status}</td>
                        <td>{row.overallResult}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.hasMore ? (
                  <button type="button" className="ir-admin__more" onClick={admin.loadMore}>
                    Tải thêm
                  </button>
                ) : null}
              </div>

              {admin.detailLoading ? (
                <div className="ir-admin__state">Đang tải chi tiết…</div>
              ) : admin.detail && admin.detailRow ? (
                <aside className="ir-admin__detail" aria-label="Chi tiết inspection result">
                  <h3>{admin.detail.code}</h3>
                  <p className="ir-admin__muted">
                    {admin.detailRow.stageLabel} · {admin.detailRow.status} ·{' '}
                    {admin.detailRow.overallResult}
                  </p>
                  <dl className="ir-admin__meta">
                    <div>
                      <dt>Plan</dt>
                      <dd>{admin.detailRow.planLabel}</dd>
                    </div>
                    <div>
                      <dt>Lot</dt>
                      <dd>{admin.detailRow.lotLabel}</dd>
                    </div>
                    <div>
                      <dt>Finished lot</dt>
                      <dd>{admin.detailRow.finishedLotLabel}</dd>
                    </div>
                    <div>
                      <dt>Work order</dt>
                      <dd>{admin.detailRow.workOrderLabel}</dd>
                    </div>
                    <div>
                      <dt>Sample size</dt>
                      <dd>{admin.detailRow.sampleSize}</dd>
                    </div>
                    <div>
                      <dt>Inspected at</dt>
                      <dd>{admin.detailRow.inspectedAt}</dd>
                    </div>
                    <div>
                      <dt>Retest</dt>
                      <dd>{admin.detailRow.isRetest ? 'yes' : 'no'}</dd>
                    </div>
                    <div>
                      <dt>Linked NCR</dt>
                      <dd>{admin.detailRow.ncrLabel}</dd>
                    </div>
                  </dl>

                  {admin.detail.details && admin.detail.details.length > 0 ? (
                    <>
                      <h4>Details (read-only)</h4>
                      <table className="ir-admin__table">
                        <thead>
                          <tr>
                            <th>Sample</th>
                            <th>Char</th>
                            <th>Value</th>
                            <th>Judgment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {admin.detail.details.map((d) => (
                            <tr key={d.code}>
                              <td>{d.sample_no}</td>
                              <td>{d.characteristic_code ?? '-'}</td>
                              <td>{d.measured_value ?? '-'}</td>
                              <td>{d.judgment}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  ) : null}

                  <h4>Void (audited)</h4>
                  <button
                    type="button"
                    className="ir-admin__btn ir-admin__btn--danger"
                    disabled={!admin.detailRow.canVoid}
                    title={admin.detailRow.voidDisabledReason ?? undefined}
                    onClick={() => admin.setConfirmVoid(true)}
                  >
                    Void inspection
                  </button>
                  {!admin.detailRow.canVoid ? (
                    <p className="ir-admin__muted">
                      Void không khả dụng
                      {admin.detailRow.voidDisabledReason
                        ? ` (${admin.detailRow.voidDisabledReason})`
                        : ''}
                      .
                    </p>
                  ) : null}

                  {admin.confirmVoid ? (
                    <div className="ir-admin__confirm" role="dialog" aria-label="Xác nhận void">
                      <p>
                        Xác nhận void <strong>{admin.detail.code}</strong>? Bắt buộc nhập lý do
                        audit.
                      </p>
                      <label className="ir-admin__field">
                        <span>void_reason</span>
                        <textarea
                          value={admin.voidReason}
                          onChange={(e) => admin.setVoidReason(e.target.value)}
                          rows={3}
                        />
                      </label>
                      <div className="ir-admin__actions">
                        <button
                          type="button"
                          className="ir-admin__btn ir-admin__btn--danger"
                          disabled={
                            admin.voidErrors.length > 0 || admin.voidState === 'pending'
                          }
                          onClick={admin.void}
                        >
                          Xác nhận void
                        </button>
                        <button type="button" onClick={() => admin.setConfirmVoid(false)}>
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {admin.voidError ? (
                    <p className="ir-admin__error" role="alert">
                      {admin.voidError.code}: {admin.voidError.message}
                    </p>
                  ) : null}
                  {admin.voidState === 'success' ? (
                    <p className="ir-admin__banner" role="status">
                      Đã void inspection.
                    </p>
                  ) : null}
                </aside>
              ) : (
                <div className="ir-admin__state">Chọn phiếu để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : (
        <>
          {spcBanner ? (
            <p className="ir-admin__state" role={admin.spcState === 'error' ? 'alert' : 'status'}>
              {spcBanner}
              {admin.spcError ? ` (${admin.spcError.code})` : ''}
            </p>
          ) : null}
          {admin.spcState === 'ready' ? (
            <div className="ir-admin__table-wrap">
              <table className="ir-admin__table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Characteristic</th>
                    <th>Subgroup</th>
                    <th>Value</th>
                    <th>Measured at</th>
                  </tr>
                </thead>
                <tbody>
                  {admin.spcItems.map((row) => (
                    <tr key={row.id}>
                      <td>{row.code ?? '-'}</td>
                      <td>{row.characteristic_code ?? '-'}</td>
                      <td>{row.subgroup_no ?? '-'}</td>
                      <td>{row.measured_value ?? '-'}</td>
                      <td>{row.measured_at ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {admin.spcHasMore ? (
                <button type="button" className="ir-admin__more" onClick={admin.loadMoreSpc}>
                  Tải thêm
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
