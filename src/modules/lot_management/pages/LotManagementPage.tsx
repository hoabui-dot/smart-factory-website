import { useState } from 'react'
import { Link } from 'react-router'

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

  return (
    <aside className="lot-master__detail" aria-label="Chi tiết lô">
      <h3>{detail.code}</h3>
      <p className="lot-master__muted">
        {row?.itemLabel ?? '-'} · QC: {row?.qcStatus ?? '-'} · HSD: {row?.expiryDate ?? '-'}
      </p>
      <dl className="lot-master__meta">
        <div>
          <dt>QR payload</dt>
          <dd>{detail.qr_payload ?? '-'}</dd>
        </div>
        <div>
          <dt>Revision</dt>
          <dd>{row?.revisionLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Supplier</dt>
          <dd>{row?.supplierLabel ?? '-'}</dd>
        </div>
      </dl>

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

      <button
        type="button"
        className="lot-master__btn"
        disabled={!row?.canUpdate || admin.updatePending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() =>
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
        }
      >
        {admin.updatePending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="lot-master__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateError ? (
        <p className="lot-master__error" role="alert">
          {admin.updateError.code}: {admin.updateError.message}
        </p>
      ) : null}
      {admin.updateSuccess ? (
        <p className="lot-master__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>Print / Reprint</h4>
      <button
        type="button"
        className="lot-master__btn"
        disabled={!row?.canPrint}
        title={row?.printDisabledReason ?? undefined}
        onClick={admin.openPrint}
      >
        In tem lô
      </button>
      {!row?.canPrint ? (
        <p className="lot-master__muted">
          Print không khả dụng{row?.printDisabledReason ? ` (${row.printDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.showPrint ? <PrintPanel admin={admin} /> : null}

      <h4>Bình luận & tệp đính kèm</h4>
      <Link className="lot-master__btn" to={`/web/shared/entities/lot/${detail.id}/content`}>
        Xem bình luận / đính kèm (SHARED-02)
      </Link>
    </aside>
  )
}

export function LotManagementPage() {
  const admin = useLotManagement()
  const banner = listStateMessage(admin.listState)

  return (
    <section className="lot-master" aria-labelledby="lot-master-title">
      <header className="lot-master__header">
        <div>
          <p className="lot-master__eyebrow">WEB-WMS-02-LOT · `/web/wms/lots`</p>
          <h2 id="lot-master-title">Lot Management</h2>
          <p className="lot-master__lead">
            Quản lý lô/QR (WMS02-001..006). Mutation gated bởi server{' '}
            <code>allowed_actions</code>.
          </p>
        </div>
        <div className="lot-master__actions">
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

      <div className="lot-master__tabs" role="tablist" aria-label="Chọn danh sách lô">
        <button
          type="button"
          className={admin.view === 'all' ? 'lot-master__tab--active' : 'lot-master__tab'}
          onClick={() => admin.setView('all')}
        >
          Tất cả lô
        </button>
        <button
          type="button"
          className={admin.view === 'expiring' ? 'lot-master__tab--active' : 'lot-master__tab'}
          onClick={() => admin.setView('expiring')}
        >
          Sắp hết hạn / hết hạn
        </button>
      </div>

      <form
        className="lot-master__filters"
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
      >
        <label className="lot-master__field">
          <span>Tìm lô (code)</span>
          <input
            value={admin.searchInput}
            onChange={(e) => admin.setSearchInput(e.target.value)}
            placeholder="LOT-…"
          />
        </label>
        <button type="submit" className="lot-master__btn">
          Lọc
        </button>
      </form>

      {banner ? (
        <p className="lot-master__state" role={admin.listState === 'error' ? 'alert' : 'status'}>
          {banner}
          {admin.listError ? ` (${admin.listError.code})` : ''}
        </p>
      ) : null}

      {admin.listState === 'ready' ? (
        <div className="lot-master__layout">
          <div className="lot-master__table-wrap">
            <table className="lot-master__table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Item</th>
                  <th>Supplier</th>
                  <th>QC status</th>
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
                    <td>{row.qcStatus}</td>
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

          {admin.detailLoading ? (
            <div className="lot-master__state">Đang tải chi tiết…</div>
          ) : admin.detail ? (
            <LotEditor key={admin.detail.code} detail={admin.detail} admin={admin} />
          ) : (
            <div className="lot-master__state">Chọn lô để xem chi tiết.</div>
          )}
        </div>
      ) : null}
    </section>
  )
}
