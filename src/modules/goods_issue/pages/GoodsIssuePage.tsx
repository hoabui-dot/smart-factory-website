import { Link } from 'react-router'

import { useGoodsIssue } from '../hooks/useGoodsIssue'

import './GoodsIssuePage.css'

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

export function GoodsIssuePage() {
  const admin = useGoodsIssue()
  const mrBanner = listStateMessage(admin.mrListState)
  const giBanner = listStateMessage(admin.giListState)

  return (
    <section className="gi-admin" aria-labelledby="gi-admin-title">
      <header className="gi-admin__header">
        <div>
          <p className="gi-admin__eyebrow">WEB-WMS-04-GOODS-ISSUE · `/web/wms/goods-issues`</p>
          <h2 id="gi-admin-title">Goods Issue Monitor</h2>
          <p className="gi-admin__lead">
            Theo dõi Material Request → PDA FEFO pick/issue → Goods Issue approve/reject. Web không
            thực hiện start-pick / FEFO / issue post (PDA-only).
          </p>
        </div>
        <div className="gi-admin__actions">
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

      <p className="gi-admin__note">
        PDA handoff: start-pick, FEFO suggestion, pick-attempt và issue posting thuộc{' '}
        <code>WMS04-003..006</code> (PDA). Web chỉ monitor + cancel MR + approve/reject GI.
      </p>

      <div className="gi-admin__tabs" role="tablist" aria-label="Goods issue sections">
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'material-requests'}
          onClick={() => admin.setTab('material-requests')}
        >
          Material Requests
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'goods-issues'}
          onClick={() => admin.setTab('goods-issues')}
        >
          Goods Issues
        </button>
      </div>

      <form
        className="gi-admin__filters"
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
      >
        <label className="gi-admin__field">
          <span>Tìm (code)</span>
          <input
            value={admin.searchInput}
            onChange={(e) => admin.setSearchInput(e.target.value)}
          />
        </label>
        <button type="submit" className="gi-admin__btn">
          Lọc
        </button>
      </form>

      {admin.tab === 'material-requests' ? (
        <>
          {mrBanner ? (
            <p
              className="gi-admin__state"
              role={admin.mrListState === 'error' ? 'alert' : 'status'}
            >
              {mrBanner}
              {admin.mrListError ? ` (${admin.mrListError.code})` : ''}
            </p>
          ) : null}

          {admin.mrListState === 'ready' ? (
            <div className="gi-admin__layout">
              <div className="gi-admin__table-wrap">
                <table className="gi-admin__table">
                  <thead>
                    <tr>
                      <th>MR code</th>
                      <th>WO</th>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.mrRows.map((row) => (
                      <tr
                        key={row.code}
                        className={
                          row.code === admin.selectedMrCode ? 'gi-admin__row--active' : ''
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="gi-admin__linkish"
                            onClick={() => admin.selectMr(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.workOrderLabel}</td>
                        <td>{row.itemLabel}</td>
                        <td>
                          {row.requiredQty} {row.uomLabel}
                        </td>
                        <td>{row.targetLocationLabel}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.mrHasMore ? (
                  <button type="button" className="gi-admin__more" onClick={admin.loadMoreMr}>
                    Tải thêm
                  </button>
                ) : null}
              </div>

              {admin.mrDetailLoading ? (
                <div className="gi-admin__state">Đang tải chi tiết…</div>
              ) : admin.mrDetail && admin.mrDetailRow ? (
                <aside className="gi-admin__detail" aria-label="Chi tiết material request">
                  <h3>{admin.mrDetail.code}</h3>
                  <p className="gi-admin__muted">{admin.mrDetailRow.status}</p>
                  <dl className="gi-admin__meta">
                    <div>
                      <dt>Work order</dt>
                      <dd>
                        <Link to="/web/mes/work-orders">{admin.mrDetailRow.workOrderLabel}</Link>
                      </dd>
                    </div>
                    <div>
                      <dt>Item</dt>
                      <dd>{admin.mrDetailRow.itemLabel}</dd>
                    </div>
                    <div>
                      <dt>Required qty</dt>
                      <dd>
                        {admin.mrDetailRow.requiredQty} {admin.mrDetailRow.uomLabel}
                      </dd>
                    </div>
                    <div>
                      <dt>Target location</dt>
                      <dd>{admin.mrDetailRow.targetLocationLabel}</dd>
                    </div>
                    <div>
                      <dt>PDA progress</dt>
                      <dd>Read-only — FEFO pick/issue on PDA</dd>
                    </div>
                  </dl>

                  <h4>Cancel request</h4>
                  <button
                    type="button"
                    className="gi-admin__btn gi-admin__btn--danger"
                    disabled={!admin.mrDetailRow.canCancel}
                    title={admin.mrDetailRow.cancelDisabledReason ?? undefined}
                    onClick={() => admin.setConfirmCancel(true)}
                  >
                    Cancel material request
                  </button>
                  {!admin.mrDetailRow.canCancel ? (
                    <p className="gi-admin__muted">
                      Cancel không khả dụng
                      {admin.mrDetailRow.cancelDisabledReason
                        ? ` (${admin.mrDetailRow.cancelDisabledReason})`
                        : ''}
                      .
                    </p>
                  ) : null}

                  {admin.confirmCancel ? (
                    <div className="gi-admin__confirm" role="dialog" aria-label="Xác nhận cancel">
                      <p>
                        Xác nhận hủy <strong>{admin.mrDetail.code}</strong>? Backend yêu cầu{' '}
                        <code>reason</code> (validation bắt buộc).
                      </p>
                      <label className="gi-admin__field">
                        <span>reason</span>
                        <textarea
                          value={admin.cancelReason}
                          onChange={(e) => admin.setCancelReason(e.target.value)}
                          rows={3}
                        />
                      </label>
                      <div className="gi-admin__actions">
                        <button
                          type="button"
                          className="gi-admin__btn gi-admin__btn--danger"
                          disabled={
                            admin.cancelErrors.length > 0 || admin.cancelState === 'pending'
                          }
                          onClick={admin.cancel}
                        >
                          Xác nhận cancel
                        </button>
                        <button type="button" onClick={() => admin.setConfirmCancel(false)}>
                          Đóng
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {admin.cancelError ? (
                    <p className="gi-admin__error" role="alert">
                      {admin.cancelError.code}: {admin.cancelError.message}
                    </p>
                  ) : null}
                  {admin.cancelState === 'success' ? (
                    <p className="gi-admin__banner" role="status">
                      Đã hủy material request.
                    </p>
                  ) : null}
                </aside>
              ) : (
                <div className="gi-admin__state">Chọn material request để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : (
        <>
          {giBanner ? (
            <p
              className="gi-admin__state"
              role={admin.giListState === 'error' ? 'alert' : 'status'}
            >
              {giBanner}
              {admin.giListError ? ` (${admin.giListError.code})` : ''}
            </p>
          ) : null}

          {admin.giListState === 'ready' ? (
            <div className="gi-admin__layout">
              <div className="gi-admin__table-wrap">
                <table className="gi-admin__table">
                  <thead>
                    <tr>
                      <th>GI code</th>
                      <th>Type</th>
                      <th>Reference</th>
                      <th>Status</th>
                      <th>Performed at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.giRows.map((row) => (
                      <tr
                        key={row.code}
                        className={
                          row.code === admin.selectedGiCode ? 'gi-admin__row--active' : ''
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="gi-admin__linkish"
                            onClick={() => admin.selectGi(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.transactionTypeLabel}</td>
                        <td>{row.referenceLabel}</td>
                        <td>{row.status}</td>
                        <td>{row.performedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.giHasMore ? (
                  <button type="button" className="gi-admin__more" onClick={admin.loadMoreGi}>
                    Tải thêm
                  </button>
                ) : null}
              </div>

              {admin.giDetailLoading ? (
                <div className="gi-admin__state">Đang tải chi tiết…</div>
              ) : admin.giDetail && admin.giDetailRow ? (
                <aside className="gi-admin__detail" aria-label="Chi tiết goods issue">
                  <h3>{admin.giDetail.code}</h3>
                  <p className="gi-admin__muted">
                    {admin.giDetailRow.transactionTypeLabel} · {admin.giDetailRow.status}
                  </p>
                  <dl className="gi-admin__meta">
                    <div>
                      <dt>Reference</dt>
                      <dd>{admin.giDetailRow.referenceLabel}</dd>
                    </div>
                    <div>
                      <dt>Performed by</dt>
                      <dd>{admin.giDetailRow.performedByLabel}</dd>
                    </div>
                    <div>
                      <dt>Performed at</dt>
                      <dd>{admin.giDetailRow.performedAt}</dd>
                    </div>
                    <div>
                      <dt>Approved by</dt>
                      <dd>{admin.giDetailRow.approvedByLabel}</dd>
                    </div>
                    <div>
                      <dt>Device</dt>
                      <dd>{admin.giDetailRow.deviceSnapshot}</dd>
                    </div>
                  </dl>

                  {admin.giDetailRow.lineRows.length > 0 ? (
                    <>
                      <h4>Lines</h4>
                      <table className="gi-admin__table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Lot</th>
                            <th>From</th>
                            <th>To</th>
                            <th>Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {admin.giDetailRow.lineRows.map((line) => (
                            <tr key={line.code}>
                              <td>{line.itemLabel}</td>
                              <td>{line.lotLabel}</td>
                              <td>{line.fromLocationLabel}</td>
                              <td>{line.toLocationLabel}</td>
                              <td>
                                {line.qty} {line.uomLabel}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  ) : null}

                  <h4>Approval</h4>
                  <div className="gi-admin__actions">
                    <button
                      type="button"
                      className="gi-admin__btn"
                      disabled={!admin.giDetailRow.canApprove}
                      title={admin.giDetailRow.approveDisabledReason ?? undefined}
                      onClick={() => {
                        admin.setConfirmReject(false)
                        admin.setConfirmApprove(true)
                      }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="gi-admin__btn gi-admin__btn--danger"
                      disabled={!admin.giDetailRow.canReject}
                      title={admin.giDetailRow.rejectDisabledReason ?? undefined}
                      onClick={() => {
                        admin.setConfirmApprove(false)
                        admin.setConfirmReject(true)
                      }}
                    >
                      Reject
                    </button>
                  </div>

                  {admin.confirmApprove ? (
                    <div className="gi-admin__confirm" role="dialog" aria-label="Xác nhận approve">
                      <p>
                        Xác nhận approve <strong>{admin.giDetail.code}</strong>?
                      </p>
                      <div className="gi-admin__actions">
                        <button
                          type="button"
                          className="gi-admin__btn"
                          disabled={admin.approveState === 'pending'}
                          onClick={admin.approve}
                        >
                          Xác nhận approve
                        </button>
                        <button type="button" onClick={() => admin.setConfirmApprove(false)}>
                          Đóng
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {admin.confirmReject ? (
                    <div className="gi-admin__confirm" role="dialog" aria-label="Xác nhận reject">
                      <p>
                        Xác nhận reject <strong>{admin.giDetail.code}</strong>? Backend yêu cầu{' '}
                        <code>reason</code>.
                      </p>
                      <label className="gi-admin__field">
                        <span>reason</span>
                        <textarea
                          value={admin.rejectReason}
                          onChange={(e) => admin.setRejectReason(e.target.value)}
                          rows={3}
                        />
                      </label>
                      <div className="gi-admin__actions">
                        <button
                          type="button"
                          className="gi-admin__btn gi-admin__btn--danger"
                          disabled={
                            admin.rejectErrors.length > 0 || admin.rejectState === 'pending'
                          }
                          onClick={admin.reject}
                        >
                          Xác nhận reject
                        </button>
                        <button type="button" onClick={() => admin.setConfirmReject(false)}>
                          Đóng
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {admin.approveError ? (
                    <p className="gi-admin__error" role="alert">
                      {admin.approveError.code}: {admin.approveError.message}
                    </p>
                  ) : null}
                  {admin.rejectError ? (
                    <p className="gi-admin__error" role="alert">
                      {admin.rejectError.code}: {admin.rejectError.message}
                    </p>
                  ) : null}
                  {admin.approveState === 'success' ? (
                    <p className="gi-admin__banner" role="status">
                      Đã approve goods issue.
                    </p>
                  ) : null}
                  {admin.rejectState === 'success' ? (
                    <p className="gi-admin__banner" role="status">
                      Đã reject goods issue.
                    </p>
                  ) : null}
                </aside>
              ) : (
                <div className="gi-admin__state">Chọn goods issue để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
