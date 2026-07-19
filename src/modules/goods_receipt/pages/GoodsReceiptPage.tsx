import { useState } from 'react'
import { Link } from 'react-router'

import { useGoodsReceipt } from '../hooks/useGoodsReceipt'
import type { PurchaseOrderRecord, AsnRecord, GoodsReceiptRecord } from '../types/goodsReceipt'

import './GoodsReceiptPage.css'

type Api = ReturnType<typeof useGoodsReceipt>

function listStateMessage(state: string, noun: string): string {
  switch (state) {
    case 'loading':
      return `Đang tải danh mục ${noun}…`
    case 'empty':
      return `Chưa có ${noun} nào.`
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return `Bạn không có quyền xem danh mục ${noun}.`
    case 'error':
      return `Không tải được danh mục ${noun}. Thử lại sau.`
    default:
      return ''
  }
}

function PoDetail({ detail, admin }: { detail: PurchaseOrderRecord; admin: Api }) {
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(detail.expected_delivery_date)
  const [notes, setNotes] = useState(detail.notes ?? '')
  const row = admin.poDetailRow

  return (
    <aside className="grn-admin__detail" aria-label="Chi tiết purchase order">
      <h3>{detail.code}</h3>
      <p className="grn-admin__muted">
        {row?.supplierLabel} · {row?.status}
      </p>

      <label className="grn-admin__field">
        <span>Ngày giao dự kiến</span>
        <input
          type="date"
          value={expectedDeliveryDate?.slice(0, 10) ?? ''}
          onChange={(e) => setExpectedDeliveryDate(e.target.value)}
        />
      </label>
      <label className="grn-admin__field">
        <span>Ghi chú</span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <button
        type="button"
        className="grn-admin__btn"
        disabled={!row?.canUpdate || admin.updatePoPending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() =>
          admin.savePoEdit({ expected_delivery_date: expectedDeliveryDate, notes: notes || null })
        }
      >
        {admin.updatePoPending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="grn-admin__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updatePoError ? (
        <p className="grn-admin__error" role="alert">
          {admin.updatePoError.code}: {admin.updatePoError.message}
        </p>
      ) : null}
      {admin.updatePoSuccess ? <p className="grn-admin__banner" role="status">Đã lưu thay đổi.</p> : null}

      <h4>Đối soát ordered vs received</h4>
      <table className="grn-admin__lines">
        <thead>
          <tr>
            <th>Line</th>
            <th>Item</th>
            <th>Ordered</th>
            <th>Received</th>
            <th>Còn lại</th>
            <th>UoM</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {(row?.lineRows ?? []).map((line) => (
            <tr key={line.code}>
              <td>{line.code}</td>
              <td>{line.itemLabel}</td>
              <td>{line.orderedQty}</td>
              <td>{line.receivedQty}</td>
              <td>{line.remainingQty}</td>
              <td>{line.uomLabel}</td>
              <td>{line.lineStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Trạng thái</h4>
      <div className="grn-admin__actions">
        <button
          type="button"
          className="grn-admin__btn grn-admin__btn--danger"
          disabled={!row?.canCancel}
          title={row?.cancelDisabledReason ?? undefined}
          onClick={() => admin.setPoConfirmAction('cancel')}
        >
          Cancel PO
        </button>
        <button
          type="button"
          className="grn-admin__btn"
          disabled={!row?.canClose}
          title={row?.closeDisabledReason ?? undefined}
          onClick={() => admin.setPoConfirmAction('close')}
        >
          Close PO
        </button>
      </div>

      {admin.poConfirmAction === 'cancel' ? (
        <div className="grn-admin__confirm" role="dialog" aria-label="Xác nhận cancel PO">
          <p>Hủy PO <strong>{detail.code}</strong>? Cần lý do hủy.</p>
          <label className="grn-admin__field">
            <span>Lý do</span>
            <input
              value={admin.poCancelReason}
              onChange={(e) => admin.setPoCancelReason(e.target.value)}
              placeholder="Lý do hủy PO"
            />
          </label>
          <div className="grn-admin__actions">
            <button
              type="button"
              className="grn-admin__btn grn-admin__btn--danger"
              disabled={admin.poCancelErrors.length > 0 || admin.cancelPoState === 'pending'}
              onClick={admin.confirmCancelPo}
            >
              Xác nhận hủy
            </button>
            <button type="button" onClick={() => admin.setPoConfirmAction(null)}>
              Đóng
            </button>
          </div>
        </div>
      ) : null}
      {admin.poConfirmAction === 'close' ? (
        <div className="grn-admin__confirm" role="dialog" aria-label="Xác nhận close PO">
          <p>Xác nhận đối soát đã hoàn tất và đóng PO <strong>{detail.code}</strong>?</p>
          <div className="grn-admin__actions">
            <button
              type="button"
              className="grn-admin__btn"
              disabled={admin.closePoState === 'pending'}
              onClick={admin.confirmClosePo}
            >
              Xác nhận close
            </button>
            <button type="button" onClick={() => admin.setPoConfirmAction(null)}>
              Đóng
            </button>
          </div>
        </div>
      ) : null}
      {admin.cancelPoError ? (
        <p className="grn-admin__error" role="alert">
          {admin.cancelPoError.code}: {admin.cancelPoError.message}
        </p>
      ) : null}
      {admin.closePoError ? (
        <p className="grn-admin__error" role="alert">
          {admin.closePoError.code}: {admin.closePoError.message}
        </p>
      ) : null}
    </aside>
  )
}

function AsnDetail({ detail, admin }: { detail: AsnRecord; admin: Api }) {
  const [expectedArrivalAt, setExpectedArrivalAt] = useState(detail.expected_arrival_at)
  const [vehicleNo, setVehicleNo] = useState(detail.vehicle_no ?? '')
  const row = admin.asnDetailRow

  return (
    <aside className="grn-admin__detail" aria-label="Chi tiết ASN">
      <h3>{detail.code}</h3>
      <p className="grn-admin__muted">
        {row?.supplierLabel} · {row?.status} · PO: {row?.purchaseOrderLabel}
      </p>

      <label className="grn-admin__field">
        <span>Ngày giờ dự kiến đến</span>
        <input
          type="datetime-local"
          value={expectedArrivalAt?.slice(0, 16) ?? ''}
          onChange={(e) => setExpectedArrivalAt(e.target.value)}
        />
      </label>
      <label className="grn-admin__field">
        <span>Số xe</span>
        <input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} />
      </label>
      <button
        type="button"
        className="grn-admin__btn"
        disabled={!row?.canUpdate || admin.updateAsnPending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() =>
          admin.saveAsnEdit({ expected_arrival_at: expectedArrivalAt, vehicle_no: vehicleNo || null })
        }
      >
        {admin.updateAsnPending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {admin.updateAsnError ? (
        <p className="grn-admin__error" role="alert">
          {admin.updateAsnError.code}: {admin.updateAsnError.message}
        </p>
      ) : null}
      {admin.updateAsnSuccess ? <p className="grn-admin__banner" role="status">Đã lưu thay đổi.</p> : null}

      <h4>ASN lines</h4>
      <table className="grn-admin__lines">
        <thead>
          <tr>
            <th>Line</th>
            <th>Item</th>
            <th>Supplier lot</th>
            <th>Shipped qty</th>
            <th>UoM</th>
          </tr>
        </thead>
        <tbody>
          {(row?.lineRows ?? []).map((line) => (
            <tr key={line.code}>
              <td>{line.code}</td>
              <td>{line.itemLabel}</td>
              <td>{line.supplierLot}</td>
              <td>{line.shippedQty}</td>
              <td>{line.uomLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Trạng thái</h4>
      <div className="grn-admin__actions">
        <button
          type="button"
          className="grn-admin__btn"
          disabled={!row?.canArrive}
          title={row?.arriveDisabledReason ?? undefined}
          onClick={() => admin.setAsnConfirmAction('arrive')}
        >
          Arrive
        </button>
        <button
          type="button"
          className="grn-admin__btn"
          disabled={!row?.canStartReceiving}
          title={row?.startReceivingDisabledReason ?? undefined}
          onClick={() => admin.setAsnConfirmAction('start_receiving')}
        >
          Start receiving
        </button>
        <button
          type="button"
          className="grn-admin__btn grn-admin__btn--danger"
          disabled={!row?.canCancel}
          title={row?.cancelDisabledReason ?? undefined}
          onClick={() => admin.setAsnConfirmAction('cancel')}
        >
          Cancel ASN
        </button>
      </div>

      {admin.asnConfirmAction ? (
        <div className="grn-admin__confirm" role="dialog" aria-label="Xác nhận thao tác ASN">
          <p>
            {admin.asnConfirmAction === 'arrive'
              ? `Xác nhận ASN ${detail.code} đã đến?`
              : admin.asnConfirmAction === 'start_receiving'
                ? `Xác nhận bắt đầu nhận hàng cho ASN ${detail.code}? (không xác nhận goods receipt)`
                : `Xác nhận hủy ASN ${detail.code}?`}
          </p>
          <div className="grn-admin__actions">
            <button
              type="button"
              className={
                admin.asnConfirmAction === 'cancel'
                  ? 'grn-admin__btn grn-admin__btn--danger'
                  : 'grn-admin__btn'
              }
              disabled={admin.asnActionState(admin.asnConfirmAction) === 'pending'}
              onClick={() => admin.asnConfirmAction && admin.confirmAsnAction(admin.asnConfirmAction)}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setAsnConfirmAction(null)}>
              Đóng
            </button>
          </div>
        </div>
      ) : null}
      {admin.asnActionError ? (
        <p className="grn-admin__error" role="alert">
          {admin.asnActionError.code}: {admin.asnActionError.message}
        </p>
      ) : null}
    </aside>
  )
}

function GrnDetail({ detail, admin }: { detail: GoodsReceiptRecord; admin: Api }) {
  const [receivedAt, setReceivedAt] = useState(detail.received_at)
  const row = admin.grnDetailRow

  return (
    <aside className="grn-admin__detail" aria-label="Chi tiết goods receipt">
      <h3>{detail.code}</h3>
      <p className="grn-admin__muted">
        {row?.sourceLabel} · {row?.supplierLabel} · {row?.status}
      </p>
      <p className="grn-admin__muted">
        WMS03-017 confirm là PDA-only — Web chỉ review, update draft, cancel draft và attach mill
        certificate.
      </p>

      <label className="grn-admin__field">
        <span>Received at</span>
        <input
          type="datetime-local"
          value={receivedAt?.slice(0, 16) ?? ''}
          onChange={(e) => setReceivedAt(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="grn-admin__btn"
        disabled={!row?.canUpdate || admin.updateGrnPending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() => admin.saveGrnEdit({ received_at: receivedAt })}
      >
        {admin.updateGrnPending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="grn-admin__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateGrnError ? (
        <p className="grn-admin__error" role="alert">
          {admin.updateGrnError.code}: {admin.updateGrnError.message}
        </p>
      ) : null}
      {admin.updateGrnSuccess ? <p className="grn-admin__banner" role="status">Đã lưu thay đổi.</p> : null}

      <h4>Receipt lines &amp; mill certificates</h4>
      <table className="grn-admin__lines">
        <thead>
          <tr>
            <th>Line</th>
            <th>Item</th>
            <th>Lot</th>
            <th>Qty</th>
            <th>UoM</th>
            <th>Location</th>
            <th>QC initial</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(row?.lineRows ?? []).map((line) => (
            <tr key={line.code}>
              <td>{line.code}</td>
              <td>{line.itemLabel}</td>
              <td>{line.lotLabel}</td>
              <td>{line.receivedQty}</td>
              <td>{line.uomLabel}</td>
              <td>{line.receivedLocationLabel}</td>
              <td>{line.qcStatusInitial}</td>
              <td>
                <button
                  type="button"
                  className="grn-admin__linkish"
                  disabled={!row?.canAttachMillCertificate}
                  title={undefined}
                  onClick={() => admin.openAttachCert(line.lotLabel, line.lotId)}
                >
                  Attach cert
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Trạng thái</h4>
      <button
        type="button"
        className="grn-admin__btn grn-admin__btn--danger"
        disabled={!row?.canCancel}
        title={row?.cancelDisabledReason ?? undefined}
        onClick={() => admin.setConfirmGrnCancel(true)}
      >
        Cancel draft GR
      </button>
      {admin.confirmGrnCancel ? (
        <div className="grn-admin__confirm" role="dialog" aria-label="Xác nhận cancel GR">
          <p>Hủy goods receipt <strong>{detail.code}</strong>? Cần lý do hủy.</p>
          <label className="grn-admin__field">
            <span>Lý do</span>
            <input
              value={admin.grnCancelReason}
              onChange={(e) => admin.setGrnCancelReason(e.target.value)}
              placeholder="Lý do hủy goods receipt"
            />
          </label>
          <div className="grn-admin__actions">
            <button
              type="button"
              className="grn-admin__btn grn-admin__btn--danger"
              disabled={admin.grnCancelErrors.length > 0 || admin.cancelGrnState === 'pending'}
              onClick={admin.confirmCancelGrn}
            >
              Xác nhận hủy
            </button>
            <button type="button" onClick={() => admin.setConfirmGrnCancel(false)}>
              Đóng
            </button>
          </div>
        </div>
      ) : null}
      {admin.cancelGrnError ? (
        <p className="grn-admin__error" role="alert">
          {admin.cancelGrnError.code}: {admin.cancelGrnError.message}
        </p>
      ) : null}

      {admin.showAttachCert ? (
        <div className="grn-admin__create" role="dialog" aria-label="Attach mill certificate">
          <h4>Attach mill certificate — lot {admin.attachCertLotCode}</h4>
          <p className="grn-admin__muted">
            Upload dùng canonical NB-04 authorize/finalize policy; chỉ file AVAILABLE mới được
            attach (WMS03-019).
          </p>
          <label className="grn-admin__field">
            <span>File chứng chỉ (PDF)</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => admin.setAttachCertFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {(() => {
            const existing = admin.lotAttachmentRows
            if (admin.lotAttachmentsLoading) return <p className="grn-admin__muted">Đang tải chứng chỉ hiện có…</p>
            if (existing.length === 0) return <p className="grn-admin__muted">Chưa có chứng chỉ nào cho lot này.</p>
            return (
              <ul className="grn-admin__cert-list">
                {existing.map((a) => (
                  <li key={a.id}>
                    #{a.fileId} · {a.attachmentType} · {a.uploadedAtLabel}
                  </li>
                ))}
              </ul>
            )
          })()}
          <div className="grn-admin__actions">
            <button
              type="button"
              className="grn-admin__btn"
              disabled={admin.attachCertErrors.length > 0 || admin.attachCertPending}
              onClick={admin.submitAttachCert}
            >
              {admin.attachCertPending ? `Đang xử lý (${admin.uploadStage})…` : 'Xác nhận attach'}
            </button>
            <button type="button" onClick={admin.closeAttachCert}>
              Đóng
            </button>
          </div>
          {admin.attachCertError ? (
            <p className="grn-admin__error" role="alert">
              {admin.attachCertError.code}: {admin.attachCertError.message}
            </p>
          ) : null}
          {admin.attachCertSuccess ? (
            <p className="grn-admin__banner" role="status">Đã attach mill certificate.</p>
          ) : null}
        </div>
      ) : null}
    </aside>
  )
}

export function GoodsReceiptPage() {
  const admin = useGoodsReceipt()

  return (
    <section className="grn-admin" aria-labelledby="grn-admin-title">
      <header className="grn-admin__header">
        <div>
          <p className="grn-admin__eyebrow">WEB-WMS-03-GOODS-RECEIPT · `/web/wms/goods-receipts`</p>
          <h2 id="grn-admin-title">Goods Receipt Review</h2>
          <p className="grn-admin__lead">
            PO → ASN → Goods Receipt review/reconcile (WMS03-001..020). Mutation gated bởi server{' '}
            <code>allowed_actions</code>. GR create/confirm là PDA-only; Web review, đối soát, cập
            nhật draft và attach mill certificate.
          </p>
        </div>
        <div className="grn-admin__actions">
          <Link to="/web/wms/suppliers">Supplier Master</Link>
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

      <div className="grn-admin__tabs" role="tablist" aria-label="Goods receipt sections">
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'purchase_orders'}
          onClick={() => admin.setTab('purchase_orders')}
        >
          Purchase Orders
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'asns'}
          onClick={() => admin.setTab('asns')}
        >
          ASN Tracking
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'goods_receipts'}
          onClick={() => admin.setTab('goods_receipts')}
        >
          Goods Receipts
        </button>
      </div>

      {admin.tab === 'purchase_orders' ? (
        <>
          <form
            className="grn-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyPoSearch()
            }}
          >
            <label className="grn-admin__field">
              <span>Tìm PO (code)</span>
              <input
                value={admin.poSearchInput}
                onChange={(e) => admin.setPoSearchInput(e.target.value)}
                placeholder="PO-…"
              />
            </label>
            <button type="submit" className="grn-admin__btn">Lọc</button>
            <button type="button" className="grn-admin__btn" onClick={admin.openPoCreate}>
              Tạo purchase order
            </button>
          </form>

          {admin.showPoCreate ? (
            <div className="grn-admin__create">
              <h3>Tạo purchase order mới</h3>
              <p className="grn-admin__muted">
                Form luôn hiển thị — server enforce quyền tạo (WMS03-003). Status khởi tạo OPEN,
                server derive.
              </p>
              <label className="grn-admin__field">
                <span>Code</span>
                <input
                  value={admin.poCreateForm.code}
                  onChange={(e) => admin.setPoCreateForm({ ...admin.poCreateForm, code: e.target.value })}
                />
              </label>
              <label className="grn-admin__field">
                <span>Supplier code</span>
                <input
                  value={admin.poCreateForm.supplier_code}
                  onChange={(e) =>
                    admin.setPoCreateForm({ ...admin.poCreateForm, supplier_code: e.target.value })
                  }
                  list="grn-supplier-options"
                  placeholder="SUP-…"
                />
              </label>
              <label className="grn-admin__field">
                <span>Ngày đặt hàng</span>
                <input
                  type="date"
                  value={admin.poCreateForm.order_date}
                  onChange={(e) => admin.setPoCreateForm({ ...admin.poCreateForm, order_date: e.target.value })}
                />
              </label>
              <label className="grn-admin__field">
                <span>Ngày giao dự kiến</span>
                <input
                  type="date"
                  value={admin.poCreateForm.expected_delivery_date}
                  onChange={(e) =>
                    admin.setPoCreateForm({ ...admin.poCreateForm, expected_delivery_date: e.target.value })
                  }
                />
              </label>
              <label className="grn-admin__field">
                <span>Ghi chú</span>
                <input
                  value={admin.poCreateForm.notes ?? ''}
                  onChange={(e) => admin.setPoCreateForm({ ...admin.poCreateForm, notes: e.target.value || null })}
                />
              </label>

              <h4>Lines</h4>
              {admin.poCreateForm.lines.map((line, idx) => (
                <div className="grn-admin__line-row" key={idx}>
                  <input
                    placeholder="Line code"
                    value={line.code}
                    onChange={(e) => {
                      const lines = [...admin.poCreateForm.lines]
                      lines[idx] = { ...lines[idx], code: e.target.value }
                      admin.setPoCreateForm({ ...admin.poCreateForm, lines })
                    }}
                  />
                  <input
                    placeholder="Item code"
                    value={line.item_code}
                    list="grn-item-options"
                    onChange={(e) => {
                      const lines = [...admin.poCreateForm.lines]
                      lines[idx] = { ...lines[idx], item_code: e.target.value }
                      admin.setPoCreateForm({ ...admin.poCreateForm, lines })
                    }}
                  />
                  <input
                    placeholder="Ordered qty"
                    inputMode="decimal"
                    value={line.ordered_qty || ''}
                    onChange={(e) => {
                      const lines = [...admin.poCreateForm.lines]
                      lines[idx] = { ...lines[idx], ordered_qty: Number(e.target.value) || 0 }
                      admin.setPoCreateForm({ ...admin.poCreateForm, lines })
                    }}
                  />
                  <input
                    placeholder="UoM code"
                    value={line.uom_code}
                    list="grn-uom-options"
                    onChange={(e) => {
                      const lines = [...admin.poCreateForm.lines]
                      lines[idx] = { ...lines[idx], uom_code: e.target.value }
                      admin.setPoCreateForm({ ...admin.poCreateForm, lines })
                    }}
                  />
                  <input
                    type="date"
                    value={line.requested_delivery_date}
                    onChange={(e) => {
                      const lines = [...admin.poCreateForm.lines]
                      lines[idx] = { ...lines[idx], requested_delivery_date: e.target.value }
                      admin.setPoCreateForm({ ...admin.poCreateForm, lines })
                    }}
                  />
                  <button type="button" onClick={() => admin.removePoLine(idx)}>Xóa</button>
                </div>
              ))}
              <button type="button" onClick={admin.addPoLine}>+ Thêm line</button>

              <div className="grn-admin__actions">
                <button
                  type="button"
                  className="grn-admin__btn"
                  disabled={admin.poCreateErrors.length > 0 || admin.createPoPending}
                  onClick={() => admin.createPo()}
                >
                  {admin.createPoPending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closePoCreate}>Hủy</button>
              </div>
              {admin.createPoError ? (
                <p className="grn-admin__error" role="alert">
                  {admin.createPoError.code}: {admin.createPoError.message}
                </p>
              ) : null}
            </div>
          ) : null}

          {(() => {
            const banner = listStateMessage(admin.poListState, 'purchase order')
            return banner ? (
              <p className="grn-admin__state" role={admin.poListState === 'error' ? 'alert' : 'status'}>
                {banner}
                {admin.poListError ? ` (${admin.poListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.poListState === 'ready' ? (
            <div className="grn-admin__layout">
              <div className="grn-admin__table-wrap">
                <table className="grn-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Supplier</th>
                      <th>Ngày giao</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.poRows.map((row) => (
                      <tr key={row.code} className={row.code === admin.selectedPoCode ? 'grn-admin__row--active' : ''}>
                        <td>
                          <button type="button" className="grn-admin__linkish" onClick={() => admin.selectPo(row.code)}>
                            {row.code}
                          </button>
                        </td>
                        <td>{row.supplierLabel}</td>
                        <td>{row.expectedDeliveryDate}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.poHasMore ? (
                  <button type="button" className="grn-admin__more" onClick={admin.poLoadMore}>Tải thêm</button>
                ) : null}
              </div>
              {admin.poDetailLoading ? (
                <div className="grn-admin__state">Đang tải chi tiết…</div>
              ) : admin.poDetail ? (
                <PoDetail key={admin.poDetail.code} detail={admin.poDetail} admin={admin} />
              ) : (
                <div className="grn-admin__state">Chọn purchase order để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'asns' ? (
        <>
          <form
            className="grn-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyAsnSearch()
            }}
          >
            <label className="grn-admin__field">
              <span>Tìm ASN (code)</span>
              <input
                value={admin.asnSearchInput}
                onChange={(e) => admin.setAsnSearchInput(e.target.value)}
                placeholder="ASN-…"
              />
            </label>
            <button type="submit" className="grn-admin__btn">Lọc</button>
            <button type="button" className="grn-admin__btn" onClick={admin.openAsnCreate}>
              Tạo ASN
            </button>
          </form>

          {admin.showAsnCreate ? (
            <div className="grn-admin__create">
              <h3>Tạo ASN mới</h3>
              <p className="grn-admin__muted">Form luôn hiển thị — server enforce quyền tạo (WMS03-008).</p>
              <label className="grn-admin__field">
                <span>Code</span>
                <input
                  value={admin.asnCreateForm.code}
                  onChange={(e) => admin.setAsnCreateForm({ ...admin.asnCreateForm, code: e.target.value })}
                />
              </label>
              <label className="grn-admin__field">
                <span>PO code (tùy chọn)</span>
                <input
                  value={admin.asnCreateForm.purchase_order_code ?? ''}
                  onChange={(e) =>
                    admin.setAsnCreateForm({ ...admin.asnCreateForm, purchase_order_code: e.target.value || null })
                  }
                  placeholder="PO-…"
                />
              </label>
              <label className="grn-admin__field">
                <span>Supplier code</span>
                <input
                  value={admin.asnCreateForm.supplier_code}
                  onChange={(e) => admin.setAsnCreateForm({ ...admin.asnCreateForm, supplier_code: e.target.value })}
                  list="grn-supplier-options"
                  placeholder="SUP-…"
                />
              </label>
              <label className="grn-admin__field">
                <span>Ngày giờ dự kiến đến</span>
                <input
                  type="datetime-local"
                  value={admin.asnCreateForm.expected_arrival_at}
                  onChange={(e) =>
                    admin.setAsnCreateForm({ ...admin.asnCreateForm, expected_arrival_at: e.target.value })
                  }
                />
              </label>
              <label className="grn-admin__field">
                <span>Số xe</span>
                <input
                  value={admin.asnCreateForm.vehicle_no ?? ''}
                  onChange={(e) => admin.setAsnCreateForm({ ...admin.asnCreateForm, vehicle_no: e.target.value || null })}
                />
              </label>

              <h4>Lines</h4>
              {admin.asnCreateForm.lines.map((line, idx) => (
                <div className="grn-admin__line-row" key={idx}>
                  <input
                    placeholder="Line code"
                    value={line.code}
                    onChange={(e) => {
                      const lines = [...admin.asnCreateForm.lines]
                      lines[idx] = { ...lines[idx], code: e.target.value }
                      admin.setAsnCreateForm({ ...admin.asnCreateForm, lines })
                    }}
                  />
                  <input
                    placeholder="Item code"
                    value={line.item_code}
                    list="grn-item-options"
                    onChange={(e) => {
                      const lines = [...admin.asnCreateForm.lines]
                      lines[idx] = { ...lines[idx], item_code: e.target.value }
                      admin.setAsnCreateForm({ ...admin.asnCreateForm, lines })
                    }}
                  />
                  <input
                    placeholder="Supplier lot"
                    value={line.supplier_lot}
                    onChange={(e) => {
                      const lines = [...admin.asnCreateForm.lines]
                      lines[idx] = { ...lines[idx], supplier_lot: e.target.value }
                      admin.setAsnCreateForm({ ...admin.asnCreateForm, lines })
                    }}
                  />
                  <input
                    placeholder="Shipped qty"
                    inputMode="decimal"
                    value={line.shipped_qty || ''}
                    onChange={(e) => {
                      const lines = [...admin.asnCreateForm.lines]
                      lines[idx] = { ...lines[idx], shipped_qty: Number(e.target.value) || 0 }
                      admin.setAsnCreateForm({ ...admin.asnCreateForm, lines })
                    }}
                  />
                  <input
                    placeholder="UoM code"
                    value={line.uom_code}
                    list="grn-uom-options"
                    onChange={(e) => {
                      const lines = [...admin.asnCreateForm.lines]
                      lines[idx] = { ...lines[idx], uom_code: e.target.value }
                      admin.setAsnCreateForm({ ...admin.asnCreateForm, lines })
                    }}
                  />
                  <button type="button" onClick={() => admin.removeAsnLine(idx)}>Xóa</button>
                </div>
              ))}
              <button type="button" onClick={admin.addAsnLine}>+ Thêm line</button>

              <div className="grn-admin__actions">
                <button
                  type="button"
                  className="grn-admin__btn"
                  disabled={admin.asnCreateErrors.length > 0 || admin.createAsnPending}
                  onClick={() => admin.createAsn()}
                >
                  {admin.createAsnPending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closeAsnCreate}>Hủy</button>
              </div>
              {admin.createAsnError ? (
                <p className="grn-admin__error" role="alert">
                  {admin.createAsnError.code}: {admin.createAsnError.message}
                </p>
              ) : null}
            </div>
          ) : null}

          {(() => {
            const banner = listStateMessage(admin.asnListState, 'ASN')
            return banner ? (
              <p className="grn-admin__state" role={admin.asnListState === 'error' ? 'alert' : 'status'}>
                {banner}
                {admin.asnListError ? ` (${admin.asnListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.asnListState === 'ready' ? (
            <div className="grn-admin__layout">
              <div className="grn-admin__table-wrap">
                <table className="grn-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Supplier</th>
                      <th>Đến dự kiến</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.asnRows.map((row) => (
                      <tr key={row.code} className={row.code === admin.selectedAsnCode ? 'grn-admin__row--active' : ''}>
                        <td>
                          <button type="button" className="grn-admin__linkish" onClick={() => admin.selectAsn(row.code)}>
                            {row.code}
                          </button>
                        </td>
                        <td>{row.supplierLabel}</td>
                        <td>{row.expectedArrivalAt}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.asnHasMore ? (
                  <button type="button" className="grn-admin__more" onClick={admin.asnLoadMore}>Tải thêm</button>
                ) : null}
              </div>
              {admin.asnDetailLoading ? (
                <div className="grn-admin__state">Đang tải chi tiết…</div>
              ) : admin.asnDetail ? (
                <AsnDetail key={admin.asnDetail.code} detail={admin.asnDetail} admin={admin} />
              ) : (
                <div className="grn-admin__state">Chọn ASN để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'goods_receipts' ? (
        <>
          <form
            className="grn-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyGrnSearch()
            }}
          >
            <label className="grn-admin__field">
              <span>Tìm goods receipt (code)</span>
              <input
                value={admin.grnSearchInput}
                onChange={(e) => admin.setGrnSearchInput(e.target.value)}
                placeholder="GRN-…"
              />
            </label>
            <button type="submit" className="grn-admin__btn">Lọc</button>
          </form>
          <p className="grn-admin__muted">Create/Confirm goods receipt là PDA-only — không có form Web.</p>

          {(() => {
            const banner = listStateMessage(admin.grnListState, 'goods receipt')
            return banner ? (
              <p className="grn-admin__state" role={admin.grnListState === 'error' ? 'alert' : 'status'}>
                {banner}
                {admin.grnListError ? ` (${admin.grnListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.grnListState === 'ready' ? (
            <div className="grn-admin__layout">
              <div className="grn-admin__table-wrap">
                <table className="grn-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Nguồn</th>
                      <th>Supplier</th>
                      <th>Received at</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.grnRows.map((row) => (
                      <tr key={row.code} className={row.code === admin.selectedGrnCode ? 'grn-admin__row--active' : ''}>
                        <td>
                          <button type="button" className="grn-admin__linkish" onClick={() => admin.selectGrn(row.code)}>
                            {row.code}
                          </button>
                        </td>
                        <td>{row.sourceLabel}</td>
                        <td>{row.supplierLabel}</td>
                        <td>{row.receivedAt}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.grnHasMore ? (
                  <button type="button" className="grn-admin__more" onClick={admin.grnLoadMore}>Tải thêm</button>
                ) : null}
              </div>
              {admin.grnDetailLoading ? (
                <div className="grn-admin__state">Đang tải chi tiết…</div>
              ) : admin.grnDetail ? (
                <GrnDetail key={admin.grnDetail.code} detail={admin.grnDetail} admin={admin} />
              ) : (
                <div className="grn-admin__state">Chọn goods receipt để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      <datalist id="grn-supplier-options">
        {admin.supplierOptions.map((s) => (
          <option key={s.id} value={s.code}>{s.supplier_name}</option>
        ))}
      </datalist>
      <datalist id="grn-item-options">
        {admin.itemOptions.map((i) => (
          <option key={i.id} value={i.code}>{i.item_name}</option>
        ))}
      </datalist>
      <datalist id="grn-uom-options">
        {admin.uomOptions.map((u) => (
          <option key={u.id} value={u.code}>{u.uom_name}</option>
        ))}
      </datalist>
    </section>
  )
}
