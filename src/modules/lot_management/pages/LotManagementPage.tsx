import { useState } from 'react'
import { Link } from 'react-router'

import { PageHeader } from '@/shared/components/layout/PageHeader'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { Dialog } from '@/shared/components/ui/Dialog'
import { QC_STATUSES } from '../types/lot'
import type { LotRecord } from '../types/lot'
import { useLotManagement } from '../hooks/useLotManagement'

import './LotManagementPage.css'

type Api = ReturnType<typeof useLotManagement>

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải danh mục lô…'
    case 'empty':
      return 'Chưa có lô nào.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem danh mục lô.'
    case 'error':
      return 'Không tải được danh mục lô. Thử lại sau.'
    default:
      return ''
  }
}

function PrintPanel({ admin }: { admin: Api }) {
  return (
    <div className="lot-master__print" role="dialog" aria-label="In tem lô">
      <h4>In / In lại tem lô</h4>
      <p className="lot-master__muted">
        Printer được server tự resolve theo vị trí thiết bị đang active (giống PDA) — không chọn
        printer thủ công trên Web.
      </p>
      <label className="lot-master__field">
        <span>Số lượng bản in</span>
        <input
          type="number"
          min={1}
          value={admin.printForm.copies}
          onChange={(e) =>
            admin.setPrintForm({ ...admin.printForm, copies: Number(e.target.value) })
          }
        />
      </label>
      <label className="lot-master__field">
        <span>Lý do (bắt buộc nếu là in lại tem đã in trước đó)</span>
        <input
          value={admin.printForm.reason ?? ''}
          onChange={(e) => admin.setPrintForm({ ...admin.printForm, reason: e.target.value })}
          placeholder="Lý do in lại…"
        />
      </label>
      <div className="lot-master__actions">
        <button
          type="button"
          className="lot-master__btn"
          disabled={admin.printErrors.length > 0 || admin.printState === 'pending'}
          onClick={admin.submitPrint}
        >
          {admin.printState === 'pending' ? 'Đang gửi…' : 'In tem'}
        </button>
        <button type="button" onClick={admin.closePrint}>
          Hủy
        </button>
      </div>
      {admin.printError ? (
        <p className="lot-master__error" role="alert">
          {admin.printError.code}: {admin.printError.message}
        </p>
      ) : null}
      {admin.printState === 'success' && admin.printResult ? (
        <p className="lot-master__banner" role="status">
          Đã gửi lệnh in — mã print job <strong>{admin.printResult.print_job_code}</strong>
          {admin.printResult.is_reprint ? ' (in lại)' : ''}.
        </p>
      ) : null}
    </div>
  )
}

function LotEditor({ detail, admin }: { detail: LotRecord; admin: Api }) {
  const [code, setCode] = useState(detail.code)
  const [itemId, setItemId] = useState(detail.item_id)
  const [itemRevisionId, setItemRevisionId] = useState<number | null>(
    detail.item_revision_id ?? null,
  )
  const [supplierId, setSupplierId] = useState<number | null>(detail.supplier_id ?? null)
  const [supplierLot, setSupplierLot] = useState(detail.supplier_lot)
  const [millCertificateNo, setMillCertificateNo] = useState(detail.mill_certificate_no)
  const [receivedDate, setReceivedDate] = useState(detail.received_date?.slice(0, 10) ?? '')
  const [expiryDate, setExpiryDate] = useState(detail.expiry_date?.slice(0, 10) ?? '')
  const [qcStatus, setQcStatus] = useState(detail.qc_status)
  const [receivedQty, setReceivedQty] = useState(String(detail.received_qty))

  const row = admin.detailRow
  const [tab, setTab] = useState<'overview' | 'edit'>('overview')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex border-b border-[var(--border-default)] gap-2">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            tab === 'overview'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => setTab('overview')}
        >
          Tổng quan
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            tab === 'edit'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => setTab('edit')}
        >
          Chỉnh sửa & Cấu hình
        </button>
      </div>

      {tab === 'overview' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Thông tin lô hàng</h4>
            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
              <span className="text-[var(--text-secondary)]">Mã lô (Code):</span>
              <span className="font-semibold text-[var(--text-primary)]">{detail.code}</span>
              <span className="text-[var(--text-secondary)]">Mặt hàng:</span>
              <span className="font-semibold text-[var(--text-primary)]">{row?.itemLabel ?? '-'}</span>
              <span className="text-[var(--text-secondary)]">Phiên bản (Revision):</span>
              <span className="font-semibold text-[var(--text-primary)]">{row?.revisionLabel ?? '-'}</span>
              <span className="text-[var(--text-secondary)]">Số lượng nhận:</span>
              <span className="font-semibold text-[var(--text-primary)]">{detail.received_qty}</span>
            </div>
          </div>

          <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">QC & Truy xuất nguồn gốc</h4>
            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
              <span className="text-[var(--text-secondary)]">Trạng thái QC:</span>
              <span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-info-bg)] text-[var(--color-info-text)]">
                  {row?.qcStatus ?? '-'}
                </span>
              </span>
              <span className="text-[var(--text-secondary)]">Nhà cung cấp:</span>
              <span className="font-medium text-[var(--text-primary)]">{row?.supplierLabel ?? '-'}</span>
              <span className="text-[var(--text-secondary)]">Lô nhà cung cấp:</span>
              <span className="font-medium text-[var(--text-primary)]">{detail.supplier_lot || '-'}</span>
              <span className="text-[var(--text-secondary)]">Mill Certificate No.:</span>
              <span className="font-medium text-[var(--text-primary)]">{detail.mill_certificate_no || '-'}</span>
              <span className="text-[var(--text-secondary)]">Ngày hết hạn:</span>
              <span className="font-medium text-[var(--text-primary)]">{row?.expiryDate ?? '-'}</span>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Thông tin tem nhãn & Thao tác nhanh</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col gap-1 text-sm">
                <span className="text-[var(--text-secondary)]">QR Code Payload:</span>
                <code className="text-xs break-all bg-[var(--surface-3)] p-2.5 rounded border border-[var(--border-default)] text-[var(--text-primary)] mt-0.5">
                  {detail.qr_payload ?? '-'}
                </code>
              </div>
              <div className="flex flex-col gap-3 justify-center">
                <div>
                  <button
                    type="button"
                    className="lot-master__btn h-9 w-full flex items-center justify-center font-semibold bg-[var(--color-action-primary)] text-white hover:bg-[var(--color-action-primary-hover)] transition-colors rounded-lg text-sm"
                    disabled={!row?.canPrint}
                    title={row?.printDisabledReason ?? undefined}
                    onClick={admin.openPrint}
                  >
                    In tem lô
                  </button>
                  {!row?.canPrint && (
                    <p className="text-xs text-[var(--text-muted)] mt-1.5 text-center">
                      Print không khả dụng{row?.printDisabledReason ? ` (${row.printDisabledReason})` : ''}.
                    </p>
                  )}
                </div>
                <Link
                  className="inline-flex items-center justify-center border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors rounded-lg text-sm font-semibold h-9 text-center w-full"
                  to={`/web/shared/entities/lot/${detail.id}/content`}
                >
                  Xem bình luận / đính kèm (SHARED-02)
                </Link>
              </div>
            </div>
            {admin.showPrint && (
              <div className="mt-4 border-t border-[var(--border-default)] pt-4">
                <PrintPanel admin={admin} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            admin.saveEdit({
              code: code.trim(),
              item_id: itemId,
              item_revision_id: itemRevisionId,
              supplier_id: supplierId,
              supplier_lot: supplierLot.trim(),
              mill_certificate_no: millCertificateNo.trim(),
              received_date: receivedDate || undefined,
              expiry_date: expiryDate || undefined,
              qc_status: qcStatus,
              received_qty: receivedQty.trim() === '' ? undefined : Number(receivedQty),
            })
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="lot-master__field">
              <span>Mã lô (code)</span>
              <input value={code} onChange={(e) => setCode(e.target.value)} />
            </label>
            <label className="lot-master__field">
              <span>Item</span>
              <select value={itemId} onChange={(e) => setItemId(Number(e.target.value))}>
                {admin.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} — {item.item_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="lot-master__field">
              <span>Item revision</span>
              <select
                value={itemRevisionId ?? 0}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setItemRevisionId(v > 0 ? v : null)
                }}
              >
                <option value={0}>— Không có —</option>
                {admin.revisions.map((rev) => (
                  <option key={rev.id} value={rev.id}>
                    {rev.code} — {rev.status}
                  </option>
                ))}
              </select>
            </label>
            <label className="lot-master__field">
              <span>Supplier</span>
              <select
                value={supplierId ?? 0}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setSupplierId(v > 0 ? v : null)
                }}
              >
                <option value={0}>— Không có —</option>
                {admin.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.supplier_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="lot-master__field">
              <span>Supplier lot</span>
              <input value={supplierLot} onChange={(e) => setSupplierLot(e.target.value)} />
            </label>
            <label className="lot-master__field">
              <span>Mill certificate no.</span>
              <input value={millCertificateNo} onChange={(e) => setMillCertificateNo(e.target.value)} />
            </label>
            <label className="lot-master__field">
              <span>Ngày nhận/sản xuất</span>
              <input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
            </label>
            <label className="lot-master__field">
              <span>Ngày hết hạn</span>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </label>
            <label className="lot-master__field">
              <span>QC status</span>
              <select value={qcStatus} onChange={(e) => setQcStatus(e.target.value)}>
                {QC_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="lot-master__field">
              <span>Số lượng nhận</span>
              <input inputMode="decimal" value={receivedQty} onChange={(e) => setReceivedQty(e.target.value)} />
            </label>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button
              type="submit"
              className="lot-master__btn"
              disabled={!row?.canUpdate || admin.updatePending}
              title={row?.updateDisabledReason ?? undefined}
            >
              {admin.updatePending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
            {!row?.canUpdate && (
              <p className="text-xs text-[var(--text-muted)]">
                Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
              </p>
            )}
          </div>

          {admin.updateError && (
            <p className="lot-master__error" role="alert">
              {admin.updateError.code}: {admin.updateError.message}
            </p>
          )}
          {admin.updateSuccess && (
            <p className="lot-master__banner" role="status">
              Đã lưu thay đổi.
            </p>
          )}
        </form>
      )}
    </div>
  )
}

export function LotManagementPage() {
  const admin = useLotManagement()
  const banner = listStateMessage(admin.listState)

  return (
    <section className="lot-master" aria-labelledby="lot-master-title">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'WMS' },
          { label: 'Lot Management' },
        ]}
        title="Quản lý Số lô (Lot Management)"
        subtitle="Quản lý vòng đời số lô sản phẩm, nhãn QR-code, trạng thái kiểm định QC và theo dõi hạn sử dụng."
      />

      <div className="flex border-b border-[var(--border-default)] mb-4 gap-2" role="tablist" aria-label="Chọn danh sách lô">
        <button
          type="button"
          role="tab"
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            admin.view === 'all'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          aria-selected={admin.view === 'all'}
          onClick={() => admin.setView('all')}
        >
          Tất cả lô
        </button>
        <button
          type="button"
          role="tab"
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            admin.view === 'expiring'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          aria-selected={admin.view === 'expiring'}
          onClick={() => admin.setView('expiring')}
        >
          Sắp hết hạn / hết hạn
        </button>
      </div>

      <FilterBar
        fields={[
          {
            name: 'searchInput',
            type: 'text',
            placeholder: 'Tìm theo mã lô (Ví dụ: LOT-...)...',
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

      {admin.listState === 'empty' || admin.listState === 'no-result' ? (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-[var(--surface-1)] rounded-xl border border-[var(--border-default)] my-4">
          <svg className="w-12 h-12 text-[var(--text-muted)] opacity-60 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {admin.listState === 'empty' ? 'Chưa có dữ liệu lô hàng' : 'Không tìm thấy lô hàng nào'}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1">
            {admin.listState === 'empty'
              ? 'Hệ thống chưa ghi nhận lô hàng nào. Hãy tạo hoặc nhập lô hàng để bắt đầu.'
              : 'Thử điều chỉnh từ khóa tìm kiếm hoặc xóa bộ lọc để tìm lại.'}
          </p>
        </div>
      ) : banner && admin.listState !== 'ready' && admin.listState !== 'loading' ? (
        <p className="lot-master__state" role={admin.listState === 'error' ? 'alert' : 'status'}>
          {banner}
          {admin.listError ? ` (${admin.listError.code})` : ''}
        </p>
      ) : null}

      {admin.listState === 'ready' ? (
        <div className="lot-master__table-wrap">
          <table className="lot-master__table">
            <thead>
              <tr>
                <th>Mã lô</th>
                <th>Vật tư</th>
                <th>Nhà cung cấp</th>
                <th>Kiểm định QC</th>
                <th>Ngày nhận</th>
                <th>Hạn dùng</th>
                <th>Số lượng</th>
              </tr>
            </thead>
            <tbody>
              {admin.rows.map((row) => (
                <tr
                  key={row.code}
                  className={row.code === admin.selectedCode ? 'lot-master__row--active' : ''}
                >
                  <td>
                    <button
                      type="button"
                      className="lot-master__linkish"
                      onClick={() => admin.selectLot(row.code)}
                    >
                      {row.code}
                    </button>
                  </td>
                  <td>{row.itemLabel}</td>
                  <td>{row.supplierLabel}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-info-bg)] text-[var(--color-info-text)]">
                      {row.qcStatus}
                    </span>
                  </td>
                  <td>{row.receivedDate}</td>
                  <td>{row.expiryDate}</td>
                  <td>{row.receivedQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {admin.hasMore ? (
            <button type="button" className="lot-master__more" onClick={admin.loadMore}>
              Tải thêm
            </button>
          ) : null}
        </div>
      ) : null}

      <Dialog
        isOpen={Boolean(admin.selectedCode)}
        onClose={() => admin.selectLot(null)}
        title={`Chi tiết Số lô: ${admin.selectedCode || ''}`}
      >
        {admin.detailLoading ? (
          <div className="p-8 text-center text-[var(--text-secondary)]">Đang tải chi tiết…</div>
        ) : admin.detail ? (
          <LotEditor key={admin.detail.code} detail={admin.detail} admin={admin} />
        ) : null}
      </Dialog>
    </section>
  )
}
