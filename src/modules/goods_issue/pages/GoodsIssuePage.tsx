import { Link } from 'react-router'

import { PageHeader } from '@/shared/components/layout/PageHeader'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { Dialog } from '@/shared/components/ui/Dialog'
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
      return 'Không có quyền truy cập.'
    case 'error':
      return 'Lỗi tải dữ liệu.'
    default:
      return ''
  }
}

export function GoodsIssuePage() {
  const admin = useGoodsIssue()
  const mrBanner = listStateMessage(admin.mrListState)
  const giBanner = listStateMessage(admin.giListState)

  return (
    <section className="gi-admin">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'WMS' },
          { label: 'Goods Issues' },
        ]}
        title="Phiếu xuất kho (Goods Issues)"
        subtitle="Quản lý các yêu cầu cấp phát vật tư (Material Request) và thực xuất linh kiện cho sản xuất."
      />

      <div className="flex border-b border-[var(--border-default)] mb-4 gap-2" role="tablist" aria-label="Goods issue sections">
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'material-requests'}
          onClick={() => admin.setTab('material-requests')}
        >
          Yêu cầu cấp phát (Material Requests)
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

      <FilterBar
        fields={[
          {
            name: 'searchInput',
            type: 'text',
            placeholder: 'Tìm theo mã phiếu...',
          }
        ]}
        values={{
          searchInput: admin.searchInput,
        }}
        onChange={(_, val) => admin.setSearchInput(val)}
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
        onReset={() => {
          admin.setSearchInput('')
          admin.applySearch()
        }}
        isResetActive={Boolean(admin.searchInput)}
      />

      {admin.tab === 'material-requests' ? (
        <>
          {admin.mrListState === 'empty' || admin.mrListState === 'no-result' ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-[var(--surface-1)] rounded-xl border border-[var(--border-default)] my-4">
              <svg className="w-12 h-12 text-[var(--text-muted)] opacity-60 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {admin.mrListState === 'empty' ? 'Chưa có yêu cầu cấp phát' : 'Không tìm thấy yêu cầu cấp phát nào'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1">
                {admin.mrListState === 'empty'
                  ? 'Hệ thống chưa ghi nhận yêu cầu cấp phát vật tư nào.'
                  : 'Thử điều chỉnh từ khóa tìm kiếm hoặc xóa bộ lọc để tìm lại.'}
              </p>
            </div>
          ) : mrBanner && admin.mrListState !== 'ready' && admin.mrListState !== 'loading' ? (
            <p
              className="gi-admin__state"
              role={admin.mrListState === 'error' ? 'alert' : 'status'}
            >
              {mrBanner}
              {admin.mrListError ? ` (${admin.mrListError.code})` : ''}
            </p>
          ) : null}

          {admin.mrListState === 'ready' ? (
            <div className="gi-admin__table-wrap">
              <table className="gi-admin__table">
                <thead>
                  <tr>
                    <th>Mã yêu cầu cấp phát (MR)</th>
                    <th>Lệnh sản xuất</th>
                    <th>Vật tư</th>
                    <th>Số lượng</th>
                    <th>Vị trí nhận</th>
                    <th>Trạng thái</th>
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
                      <td>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-info-bg)] text-[var(--color-info-text)]">
                          {row.status}
                        </span>
                      </td>
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
          ) : null}

          <Dialog
            isOpen={Boolean(admin.selectedMrCode)}
            onClose={() => admin.selectMr(null)}
            title={`Yêu cầu cấp phát: ${admin.selectedMrCode || ''}`}
          >
            {admin.mrDetailLoading ? (
              <div className="p-8 text-center text-[var(--text-secondary)]">Đang tải chi tiết…</div>
            ) : admin.mrDetail && admin.mrDetailRow ? (
              <div className="flex flex-col gap-4">
                <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
                  <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Thông tin yêu cầu</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                    <span className="text-[var(--text-secondary)]">Trạng thái:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{admin.mrDetailRow.status}</span>
                    <span className="text-[var(--text-secondary)]">Lệnh sản xuất:</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      <Link to="/web/mes/work-orders" className="text-[var(--color-action-primary)] hover:underline">
                        {admin.mrDetailRow.workOrderLabel}
                      </Link>
                    </span>
                    <span className="text-[var(--text-secondary)]">Vật tư:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{admin.mrDetailRow.itemLabel}</span>
                    <span className="text-[var(--text-secondary)]">Số lượng yêu cầu:</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {admin.mrDetailRow.requiredQty} {admin.mrDetailRow.uomLabel}
                    </span>
                    <span className="text-[var(--text-secondary)]">Vị trí đích (Target Location):</span>
                    <span className="font-semibold text-[var(--text-primary)]">{admin.mrDetailRow.targetLocationLabel}</span>
                    <span className="text-[var(--text-secondary)]">PDA Progress:</span>
                    <span className="text-[var(--text-muted)]">Read-only — FEFO pick/issue on PDA</span>
                  </div>
                </div>

                <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-3">
                  <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Hủy yêu cầu cấp phát</h4>
                  <div>
                    <button
                      type="button"
                      className="gi-admin__btn gi-admin__btn--danger h-9 flex items-center justify-center px-4 font-semibold text-white bg-[var(--color-danger-text)] rounded-lg text-sm"
                      disabled={!admin.mrDetailRow.canCancel}
                      title={admin.mrDetailRow.cancelDisabledReason ?? undefined}
                      onClick={() => admin.setConfirmCancel(true)}
                    >
                      Hủy yêu cầu cấp phát
                    </button>
                    {!admin.mrDetailRow.canCancel && (
                      <p className="text-xs text-[var(--text-muted)] mt-1.5">
                        Hủy không khả dụng{admin.mrDetailRow.cancelDisabledReason ? ` (${admin.mrDetailRow.cancelDisabledReason})` : ''}.
                      </p>
                    )}
                  </div>

                  {admin.confirmCancel && (
                    <div className="mt-2 border-t border-[var(--border-default)] pt-3 flex flex-col gap-3" role="dialog" aria-label="Xác nhận cancel">
                      <p className="text-sm text-[var(--text-primary)]">
                        Xác nhận hủy <strong>{admin.mrDetail.code}</strong>? Bạn cần cung cấp lý do hủy.
                      </p>
                      <label className="gi-admin__field">
                        <span>Lý do hủy</span>
                        <textarea
                          value={admin.cancelReason}
                          onChange={(e) => admin.setCancelReason(e.target.value)}
                          rows={3}
                          className="w-full p-2.5 border border-[var(--border-default)] rounded-lg bg-[var(--surface-3)] text-[var(--text-primary)] text-sm focus:outline-none"
                        />
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="gi-admin__btn gi-admin__btn--danger h-9 text-sm font-semibold px-4 rounded-lg text-white bg-[var(--color-danger-text)]"
                          disabled={admin.cancelErrors.length > 0 || admin.cancelState === 'pending'}
                          onClick={admin.cancel}
                        >
                          Xác nhận hủy
                        </button>
                        <button
                          type="button"
                          className="h-9 text-sm font-semibold px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)]"
                          onClick={() => admin.setConfirmCancel(false)}
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  )}

                  {admin.cancelError && (
                    <p className="text-sm text-[var(--color-danger-text)] mt-2 font-medium" role="alert">
                      {admin.cancelError.code}: {admin.cancelError.message}
                    </p>
                  )}
                  {admin.cancelState === 'success' && (
                    <p className="text-sm text-[var(--color-success-text)] mt-2 font-medium" role="status">
                      Đã hủy material request thành công.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </Dialog>
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

          {admin.giListState === 'empty' || admin.giListState === 'no-result' ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-[var(--surface-1)] rounded-xl border border-[var(--border-default)] my-4">
              <svg className="w-12 h-12 text-[var(--text-muted)] opacity-60 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {admin.giListState === 'empty' ? 'Chưa có phiếu xuất kho' : 'Không tìm thấy phiếu xuất kho nào'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1">
                {admin.giListState === 'empty'
                  ? 'Hệ thống chưa ghi nhận phiếu xuất kho (Goods Issue) nào.'
                  : 'Thử điều chỉnh từ khóa tìm kiếm hoặc xóa bộ lọc để tìm lại.'}
              </p>
            </div>
          ) : null}

          {admin.giListState === 'ready' ? (
            <div className="gi-admin__table-wrap">
              <table className="gi-admin__table">
                <thead>
                  <tr>
                    <th>Mã phiếu xuất (GI)</th>
                    <th>Loại xuất</th>
                    <th>Tham chiếu</th>
                    <th>Trạng thái</th>
                    <th>Thời điểm thực hiện</th>
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
                      <td>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-info-bg)] text-[var(--color-info-text)]">
                          {row.status}
                        </span>
                      </td>
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
          ) : null}

          <Dialog
            isOpen={Boolean(admin.selectedGiCode)}
            onClose={() => admin.selectGi(null)}
            title={`Phiếu xuất kho: ${admin.selectedGiCode || ''}`}
          >
            {admin.giDetailLoading ? (
              <div className="p-8 text-center text-[var(--text-secondary)]">Đang tải chi tiết…</div>
            ) : admin.giDetail && admin.giDetailRow ? (
              <div className="flex flex-col gap-4">
                <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
                  <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Thông tin chung</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                    <span className="text-[var(--text-secondary)]">Loại giao dịch:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{admin.giDetailRow.transactionTypeLabel}</span>
                    <span className="text-[var(--text-secondary)]">Trạng thái:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{admin.giDetailRow.status}</span>
                    <span className="text-[var(--text-secondary)]">Tham chiếu (Reference):</span>
                    <span className="font-semibold text-[var(--text-primary)]">{admin.giDetailRow.referenceLabel}</span>
                    <span className="text-[var(--text-secondary)]">Người thực hiện:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{admin.giDetailRow.performedByLabel}</span>
                    <span className="text-[var(--text-secondary)]">Thời điểm:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{admin.giDetailRow.performedAt}</span>
                    <span className="text-[var(--text-secondary)]">Người phê duyệt:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{admin.giDetailRow.approvedByLabel}</span>
                    <span className="text-[var(--text-secondary)]">Thiết bị ghi nhận:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{admin.giDetailRow.deviceSnapshot}</span>
                  </div>
                </div>

                {admin.giDetailRow.lineRows.length > 0 && (
                  <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
                    <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Chi tiết danh mục cấp phát (Lines)</h4>
                    <div className="overflow-x-auto border border-[var(--border-default)] rounded-lg">
                      <table className="gi-admin__table w-full">
                        <thead>
                          <tr>
                            <th>Vật tư</th>
                            <th>Số lô</th>
                            <th>Từ vị trí</th>
                            <th>Đến vị trí</th>
                            <th>Số lượng</th>
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
                    </div>
                  </div>
                )}

                <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-3">
                  <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Phê duyệt phiếu xuất</h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="gi-admin__btn h-9 px-4 font-semibold text-white bg-[var(--color-action-primary)] hover:bg-[var(--color-action-primary-hover)] transition-colors rounded-lg text-sm"
                      disabled={!admin.giDetailRow.canApprove}
                      title={admin.giDetailRow.approveDisabledReason ?? undefined}
                      onClick={() => {
                        admin.setConfirmReject(false)
                        admin.setConfirmApprove(true)
                      }}
                    >
                      Phê duyệt (Approve)
                    </button>
                    <button
                      type="button"
                      className="gi-admin__btn gi-admin__btn--danger h-9 px-4 font-semibold text-white bg-[var(--color-danger-text)] rounded-lg text-sm"
                      disabled={!admin.giDetailRow.canReject}
                      title={admin.giDetailRow.rejectDisabledReason ?? undefined}
                      onClick={() => {
                        admin.setConfirmApprove(false)
                        admin.setConfirmReject(true)
                      }}
                    >
                      Từ chối (Reject)
                    </button>
                  </div>

                  {admin.confirmApprove && (
                    <div className="mt-2 border-t border-[var(--border-default)] pt-3 flex flex-col gap-2" role="dialog" aria-label="Xác nhận approve">
                      <p className="text-sm text-[var(--text-primary)]">
                        Xác nhận phê duyệt phiếu xuất kho <strong>{admin.giDetail.code}</strong>?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="h-9 px-4 font-semibold text-white bg-[var(--color-action-primary)] rounded-lg text-sm"
                          disabled={admin.approveState === 'pending'}
                          onClick={admin.approve}
                        >
                          Xác nhận phê duyệt
                        </button>
                        <button
                          type="button"
                          className="h-9 px-4 font-semibold border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] rounded-lg text-sm"
                          onClick={() => admin.setConfirmApprove(false)}
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  )}

                  {admin.confirmReject && (
                    <div className="mt-2 border-t border-[var(--border-default)] pt-3 flex flex-col gap-3" role="dialog" aria-label="Xác nhận reject">
                      <p className="text-sm text-[var(--text-primary)]">
                        Xác nhận từ chối phiếu xuất kho <strong>{admin.giDetail.code}</strong>? Bạn cần cung cấp lý do từ chối.
                      </p>
                      <label className="gi-admin__field">
                        <span>Lý do từ chối</span>
                        <textarea
                          value={admin.rejectReason}
                          onChange={(e) => admin.setRejectReason(e.target.value)}
                          rows={3}
                          className="w-full p-2.5 border border-[var(--border-default)] rounded-lg bg-[var(--surface-3)] text-[var(--text-primary)] text-sm focus:outline-none"
                        />
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="gi-admin__btn gi-admin__btn--danger h-9 px-4 font-semibold text-white bg-[var(--color-danger-text)] rounded-lg text-sm"
                          disabled={
                            admin.rejectErrors.length > 0 || admin.rejectState === 'pending'
                          }
                          onClick={admin.reject}
                        >
                          Xác nhận từ chối
                        </button>
                        <button
                          type="button"
                          className="h-9 px-4 font-semibold border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] rounded-lg text-sm"
                          onClick={() => admin.setConfirmReject(false)}
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  )}

                  {admin.approveError && (
                    <p className="text-sm text-[var(--color-danger-text)] mt-2 font-medium" role="alert">
                      {admin.approveError.code}: {admin.approveError.message}
                    </p>
                  )}
                  {admin.rejectError && (
                    <p className="text-sm text-[var(--color-danger-text)] mt-2 font-medium" role="alert">
                      {admin.rejectError.code}: {admin.rejectError.message}
                    </p>
                  )}
                  {admin.approveState === 'success' && (
                    <p className="text-sm text-[var(--color-success-text)] mt-2 font-medium" role="status">
                      Đã phê duyệt phiếu xuất kho thành công.
                    </p>
                  )}
                  {admin.rejectState === 'success' && (
                    <p className="text-sm text-[var(--color-success-text)] mt-2 font-medium" role="status">
                      Đã từ chối phiếu xuất kho thành công.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </Dialog>
        </>
      )}
    </section>
  )
}
