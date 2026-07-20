import { useState } from 'react'
import { Link } from 'react-router'

import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { Dialog } from '@/shared/components/ui/Dialog'
import { Input } from '@/shared/components/ui/Input'
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
            <th>Hạng mục</th>
            <th>Vật tư</th>
            <th>SL đặt hàng</th>
            <th>SL đã nhận</th>
            <th>Còn lại</th>
            <th>ĐVT</th>
            <th>Trạng thái</th>
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
            <th>Hạng mục</th>
            <th>Vật tư</th>
            <th>Số lô NCC</th>
            <th>SL giao (Shipped)</th>
            <th>ĐVT</th>
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
            <th>Hạng mục</th>
            <th>Vật tư</th>
            <th>Số lô</th>
            <th>Số lượng</th>
            <th>ĐVT</th>
            <th>Vị trí nhận</th>
            <th>Kiểm định QC</th>
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
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'WMS' },
          { label: 'Goods Receipts' },
        ]}
        title="Nhập kho (Goods Receipt)"
        subtitle="Đối soát nhà cung cấp, kiểm tra chất lượng ASN (Advanced Shipping Notice) và lập phiếu nhập kho thành phẩm."
        actions={
          <Link to="/web/wms/suppliers">
            <Button variant="secondary">Danh mục nhà cung cấp</Button>
          </Link>
        }
      />

      <div className="flex border-b border-[var(--border-default)] mb-4 gap-2" role="tablist" aria-label="Goods receipt sections">
        <button
          type="button"
          role="tab"
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            admin.tab === 'purchase_orders'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          aria-selected={admin.tab === 'purchase_orders'}
          onClick={() => admin.setTab('purchase_orders')}
        >
          Purchase Orders
        </button>
        <button
          type="button"
          role="tab"
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            admin.tab === 'asns'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          aria-selected={admin.tab === 'asns'}
          onClick={() => admin.setTab('asns')}
        >
          ASN Tracking
        </button>
        <button
          type="button"
          role="tab"
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            admin.tab === 'goods_receipts'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          aria-selected={admin.tab === 'goods_receipts'}
          onClick={() => admin.setTab('goods_receipts')}
        >
          Goods Receipts
        </button>
      </div>

      {admin.tab === 'purchase_orders' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'poSearchInput',
                type: 'text',
                placeholder: 'Tìm theo mã PO (Ví dụ: PO-...)...',
              }
            ]}
            values={{
              poSearchInput: admin.poSearchInput,
            }}
            onChange={(_, val) => admin.setPoSearchInput(val)}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyPoSearch()
            }}
            onReset={() => {
              admin.setPoSearchInput('')
              admin.applyPoSearch()
            }}
            isResetActive={Boolean(admin.poSearchInput)}
          >
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" onClick={admin.openPoCreate} size="sm" className="h-9">
                Tạo purchase order
              </Button>
            </div>
          </FilterBar>

          <Dialog
            isOpen={admin.showPoCreate}
            onClose={admin.closePoCreate}
            title="Tạo purchase order mới"
            maxWidth="max-w-[75%]"
          >
            <div className="flex flex-col gap-4 font-sans text-sm text-[var(--text-primary)]">
              <p className="text-xs text-[var(--text-secondary)]">
                Form luôn hiển thị — server enforce quyền tạo (WMS03-003). Status khởi tạo OPEN,
                server derive.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span>Code</span>
                  <Input
                    value={admin.poCreateForm.code}
                    onChange={(e) => admin.setPoCreateForm({ ...admin.poCreateForm, code: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Supplier code</span>
                  <Input
                    value={admin.poCreateForm.supplier_code}
                    onChange={(e) =>
                      admin.setPoCreateForm({ ...admin.poCreateForm, supplier_code: e.target.value })
                    }
                    list="grn-supplier-options"
                    placeholder="SUP-…"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Ngày đặt hàng</span>
                  <Input
                    type="date"
                    value={admin.poCreateForm.order_date}
                    onChange={(e) => admin.setPoCreateForm({ ...admin.poCreateForm, order_date: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Ngày giao dự kiến</span>
                  <Input
                    type="date"
                    value={admin.poCreateForm.expected_delivery_date}
                    onChange={(e) =>
                      admin.setPoCreateForm({ ...admin.poCreateForm, expected_delivery_date: e.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 col-span-2">
                  <span>Ghi chú</span>
                  <Input
                    value={admin.poCreateForm.notes ?? ''}
                    onChange={(e) => admin.setPoCreateForm({ ...admin.poCreateForm, notes: e.target.value || null })}
                  />
                </label>
              </div>

              <div className="border-t border-[var(--border-default)] pt-4 mt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-[var(--text-secondary)]">Lines</h4>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {admin.poCreateForm.lines.map((line, idx) => (
                    <div className="flex items-center gap-2" key={idx}>
                      <Input
                        placeholder="Line code"
                        value={line.code}
                        onChange={(e) => {
                          const lines = [...admin.poCreateForm.lines]
                          lines[idx] = { ...lines[idx], code: e.target.value }
                          admin.setPoCreateForm({ ...admin.poCreateForm, lines })
                        }}
                      />
                      <Input
                        placeholder="Item code"
                        value={line.item_code}
                        list="grn-item-options"
                        onChange={(e) => {
                          const lines = [...admin.poCreateForm.lines]
                          lines[idx] = { ...lines[idx], item_code: e.target.value }
                          admin.setPoCreateForm({ ...admin.poCreateForm, lines })
                        }}
                      />
                      <Input
                        placeholder="Ordered qty"
                        inputMode="decimal"
                        value={line.ordered_qty || ''}
                        onChange={(e) => {
                          const lines = [...admin.poCreateForm.lines]
                          lines[idx] = { ...lines[idx], ordered_qty: Number(e.target.value) || 0 }
                          admin.setPoCreateForm({ ...admin.poCreateForm, lines })
                        }}
                      />
                      <Input
                        placeholder="UoM code"
                        value={line.uom_code}
                        list="grn-uom-options"
                        onChange={(e) => {
                          const lines = [...admin.poCreateForm.lines]
                          lines[idx] = { ...lines[idx], uom_code: e.target.value }
                          admin.setPoCreateForm({ ...admin.poCreateForm, lines })
                        }}
                      />
                      <Input
                        type="date"
                        value={line.requested_delivery_date}
                        onChange={(e) => {
                          const lines = [...admin.poCreateForm.lines]
                          lines[idx] = { ...lines[idx], requested_delivery_date: e.target.value }
                          admin.setPoCreateForm({ ...admin.poCreateForm, lines })
                        }}
                      />
                      <Button type="button" variant="danger" className="h-9 px-3 shrink-0" onClick={() => admin.removePoLine(idx)}>Xóa</Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="secondary" size="sm" className="mt-3 animate-none" onClick={admin.addPoLine}>+ Thêm line</Button>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={admin.closePoCreate}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  disabled={admin.poCreateErrors.length > 0 || admin.createPoPending}
                  onClick={() => admin.createPo()}
                >
                  {admin.createPoPending ? 'Đang tạo…' : 'Tạo'}
                </Button>
              </div>
              {admin.createPoError ? (
                <p className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] text-xs" role="alert">
                  {admin.createPoError.code}: {admin.createPoError.message}
                </p>
              ) : null}
            </div>
          </Dialog>

          {admin.poListState === 'empty' || admin.poListState === 'no-result' ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-[var(--surface-1)] rounded-xl border border-[var(--border-default)] my-4">
              <svg className="w-12 h-12 text-[var(--text-muted)] opacity-60 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {admin.poListState === 'empty' ? 'Chưa có đơn mua hàng (PO)' : 'Không tìm thấy đơn mua hàng nào'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1">
                {admin.poListState === 'empty'
                  ? 'Hệ thống chưa ghi nhận đơn mua hàng nào.'
                  : 'Thử điều chỉnh từ khóa tìm kiếm hoặc xóa bộ lọc để tìm lại.'}
              </p>
            </div>
          ) : (() => {
            const banner = listStateMessage(admin.poListState, 'purchase order')
            return banner && admin.poListState !== 'ready' && admin.poListState !== 'loading' ? (
              <p className="grn-admin__state" role={admin.poListState === 'error' ? 'alert' : 'status'}>
                {banner}
                {admin.poListError ? ` (${admin.poListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.poListState === 'ready' ? (
            <div className="grn-admin__table-wrap">
              <table className="grn-admin__table">
                <thead>
                  <tr>
                    <th>Mã đơn mua (PO)</th>
                    <th>Nhà cung cấp</th>
                    <th>Ngày giao</th>
                    <th>Trạng thái</th>
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
                      <td>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-info-bg)] text-[var(--color-info-text)]">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {admin.poHasMore ? (
                <button type="button" className="grn-admin__more" onClick={admin.poLoadMore}>Tải thêm</button>
              ) : null}
            </div>
          ) : null}

          <Dialog
            isOpen={Boolean(admin.selectedPoCode)}
            onClose={() => admin.selectPo(null)}
            title={`Chi tiết đơn mua hàng (PO): ${admin.selectedPoCode || ''}`}
          >
            {admin.poDetailLoading ? (
              <div className="p-8 text-center text-[var(--text-secondary)]">Đang tải chi tiết…</div>
            ) : admin.poDetail ? (
              <PoDetail key={admin.poDetail.code} detail={admin.poDetail} admin={admin} />
            ) : null}
          </Dialog>
        </>
      ) : null}

      {admin.tab === 'asns' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'asnSearchInput',
                type: 'text',
                placeholder: 'Tìm theo mã ASN (Ví dụ: ASN-...)...',
              }
            ]}
            values={{
              asnSearchInput: admin.asnSearchInput,
            }}
            onChange={(_, val) => admin.setAsnSearchInput(val)}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyAsnSearch()
            }}
            onReset={() => {
              admin.setAsnSearchInput('')
              admin.applyAsnSearch()
            }}
            isResetActive={Boolean(admin.asnSearchInput)}
          >
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" onClick={admin.openAsnCreate} size="sm" className="h-9">
                Tạo ASN
              </Button>
            </div>
          </FilterBar>

          <Dialog
            isOpen={admin.showAsnCreate}
            onClose={admin.closeAsnCreate}
            title="Tạo ASN mới"
            maxWidth="max-w-[75%]"
          >
            <div className="flex flex-col gap-4 font-sans text-sm text-[var(--text-primary)]">
              <p className="text-xs text-[var(--text-secondary)]">Form luôn hiển thị — server enforce quyền tạo (WMS03-008).</p>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span>Code</span>
                  <Input
                    value={admin.asnCreateForm.code}
                    onChange={(e) => admin.setAsnCreateForm({ ...admin.asnCreateForm, code: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>PO code (tùy chọn)</span>
                  <Input
                    value={admin.asnCreateForm.purchase_order_code ?? ''}
                    onChange={(e) =>
                      admin.setAsnCreateForm({ ...admin.asnCreateForm, purchase_order_code: e.target.value || null })
                    }
                    placeholder="PO-…"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Supplier code</span>
                  <Input
                    value={admin.asnCreateForm.supplier_code}
                    onChange={(e) => admin.setAsnCreateForm({ ...admin.asnCreateForm, supplier_code: e.target.value })}
                    list="grn-supplier-options"
                    placeholder="SUP-…"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Ngày giờ dự kiến đến</span>
                  <Input
                    type="datetime-local"
                    value={admin.asnCreateForm.expected_arrival_at}
                    onChange={(e) =>
                      admin.setAsnCreateForm({ ...admin.asnCreateForm, expected_arrival_at: e.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 col-span-2">
                  <span>Số xe</span>
                  <Input
                    value={admin.asnCreateForm.vehicle_no ?? ''}
                    onChange={(e) => admin.setAsnCreateForm({ ...admin.asnCreateForm, vehicle_no: e.target.value || null })}
                  />
                </label>
              </div>

              <div className="border-t border-[var(--border-default)] pt-4 mt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-[var(--text-secondary)]">Lines</h4>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {admin.asnCreateForm.lines.map((line, idx) => (
                    <div className="flex items-center gap-2" key={idx}>
                      <Input
                        placeholder="Line code"
                        value={line.code}
                        onChange={(e) => {
                          const lines = [...admin.asnCreateForm.lines]
                          lines[idx] = { ...lines[idx], code: e.target.value }
                          admin.setAsnCreateForm({ ...admin.asnCreateForm, lines })
                        }}
                      />
                      <Input
                        placeholder="Item code"
                        value={line.item_code}
                        list="grn-item-options"
                        onChange={(e) => {
                          const lines = [...admin.asnCreateForm.lines]
                          lines[idx] = { ...lines[idx], item_code: e.target.value }
                          admin.setAsnCreateForm({ ...admin.asnCreateForm, lines })
                        }}
                      />
                      <Input
                        placeholder="Supplier lot"
                        value={line.supplier_lot}
                        onChange={(e) => {
                          const lines = [...admin.asnCreateForm.lines]
                          lines[idx] = { ...lines[idx], supplier_lot: e.target.value }
                          admin.setAsnCreateForm({ ...admin.asnCreateForm, lines })
                        }}
                      />
                      <Input
                        placeholder="Shipped qty"
                        inputMode="decimal"
                        value={line.shipped_qty || ''}
                        onChange={(e) => {
                          const lines = [...admin.asnCreateForm.lines]
                          lines[idx] = { ...lines[idx], shipped_qty: Number(e.target.value) || 0 }
                          admin.setAsnCreateForm({ ...admin.asnCreateForm, lines })
                        }}
                      />
                      <Input
                        placeholder="UoM code"
                        value={line.uom_code}
                        list="grn-uom-options"
                        onChange={(e) => {
                          const lines = [...admin.asnCreateForm.lines]
                          lines[idx] = { ...lines[idx], uom_code: e.target.value }
                          admin.setAsnCreateForm({ ...admin.asnCreateForm, lines })
                        }}
                      />
                      <Button type="button" variant="danger" className="h-9 px-3 shrink-0" onClick={() => admin.removeAsnLine(idx)}>Xóa</Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="secondary" size="sm" className="mt-3 animate-none" onClick={admin.addAsnLine}>+ Thêm line</Button>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={admin.closeAsnCreate}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  disabled={admin.asnCreateErrors.length > 0 || admin.createAsnPending}
                  onClick={() => admin.createAsn()}
                >
                  {admin.createAsnPending ? 'Đang tạo…' : 'Tạo'}
                </Button>
              </div>
              {admin.createAsnError ? (
                <p className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] text-xs" role="alert">
                  {admin.createAsnError.code}: {admin.createAsnError.message}
                </p>
              ) : null}
            </div>
          </Dialog>

          {admin.asnListState === 'empty' || admin.asnListState === 'no-result' ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-[var(--surface-1)] rounded-xl border border-[var(--border-default)] my-4">
              <svg className="w-12 h-12 text-[var(--text-muted)] opacity-60 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {admin.asnListState === 'empty' ? 'Chưa có thông báo giao hàng (ASN)' : 'Không tìm thấy thông báo giao hàng nào'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1">
                {admin.asnListState === 'empty'
                  ? 'Hệ thống chưa ghi nhận thông báo giao hàng (ASN) nào.'
                  : 'Thử điều chỉnh từ khóa tìm kiếm hoặc xóa bộ lọc để tìm lại.'}
              </p>
            </div>
          ) : (() => {
            const banner = listStateMessage(admin.asnListState, 'ASN')
            return banner && admin.asnListState !== 'ready' && admin.asnListState !== 'loading' ? (
              <p className="grn-admin__state" role={admin.asnListState === 'error' ? 'alert' : 'status'}>
                {banner}
                {admin.asnListError ? ` (${admin.asnListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.asnListState === 'ready' ? (
            <div className="grn-admin__table-wrap">
              <table className="grn-admin__table">
                <thead>
                  <tr>
                    <th>Mã ASN</th>
                    <th>Nhà cung cấp</th>
                    <th>Đến dự kiến</th>
                    <th>Trạng thái</th>
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
                      <td>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-info-bg)] text-[var(--color-info-text)]">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {admin.asnHasMore ? (
                <button type="button" className="grn-admin__more" onClick={admin.asnLoadMore}>Tải thêm</button>
              ) : null}
            </div>
          ) : null}

          <Dialog
            isOpen={Boolean(admin.selectedAsnCode)}
            onClose={() => admin.selectAsn(null)}
            title={`Chi tiết ASN: ${admin.selectedAsnCode || ''}`}
          >
            {admin.asnDetailLoading ? (
              <div className="p-8 text-center text-[var(--text-secondary)]">Đang tải chi tiết…</div>
            ) : admin.asnDetail ? (
              <AsnDetail key={admin.asnDetail.code} detail={admin.asnDetail} admin={admin} />
            ) : null}
          </Dialog>
        </>
      ) : null}

      {admin.tab === 'goods_receipts' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'grnSearchInput',
                type: 'text',
                placeholder: 'Tìm theo mã goods receipt (Ví dụ: GRN-...)...',
              }
            ]}
            values={{
              grnSearchInput: admin.grnSearchInput,
            }}
            onChange={(_, val) => admin.setGrnSearchInput(val)}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyGrnSearch()
            }}
            onReset={() => {
              admin.setGrnSearchInput('')
              admin.applyGrnSearch()
            }}
            isResetActive={Boolean(admin.grnSearchInput)}
          />
          <p className="grn-admin__muted">Create/Confirm goods receipt là PDA-only — không có form Web.</p>

          {admin.grnListState === 'empty' || admin.grnListState === 'no-result' ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-[var(--surface-1)] rounded-xl border border-[var(--border-default)] my-4">
              <svg className="w-12 h-12 text-[var(--text-muted)] opacity-60 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {admin.grnListState === 'empty' ? 'Chưa có phiếu nhập kho (GRN)' : 'Không tìm thấy phiếu nhập kho nào'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1">
                {admin.grnListState === 'empty'
                  ? 'Hệ thống chưa ghi nhận phiếu nhập kho nào.'
                  : 'Thử điều chỉnh từ khóa tìm kiếm hoặc xóa bộ lọc để tìm lại.'}
              </p>
            </div>
          ) : (() => {
            const banner = listStateMessage(admin.grnListState, 'goods receipt')
            return banner && admin.grnListState !== 'ready' && admin.grnListState !== 'loading' ? (
              <p className="grn-admin__state" role={admin.grnListState === 'error' ? 'alert' : 'status'}>
                {banner}
                {admin.grnListError ? ` (${admin.grnListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.grnListState === 'ready' ? (
            <div className="grn-admin__table-wrap">
              <table className="grn-admin__table">
                <thead>
                  <tr>
                    <th>Mã phiếu nhận (GRN)</th>
                    <th>Nguồn</th>
                    <th>Nhà cung cấp</th>
                    <th>Thời điểm nhận</th>
                    <th>Trạng thái</th>
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
                      <td>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-info-bg)] text-[var(--color-info-text)]">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {admin.grnHasMore ? (
                <button type="button" className="grn-admin__more" onClick={admin.grnLoadMore}>Tải thêm</button>
              ) : null}
            </div>
          ) : null}

          <Dialog
            isOpen={Boolean(admin.selectedGrnCode)}
            onClose={() => admin.selectGrn(null)}
            title={`Chi tiết phiếu nhập kho (GRN): ${admin.selectedGrnCode || ''}`}
          >
            {admin.grnDetailLoading ? (
              <div className="p-8 text-center text-[var(--text-secondary)]">Đang tải chi tiết…</div>
            ) : admin.grnDetail ? (
              <GrnDetail key={admin.grnDetail.code} detail={admin.grnDetail} admin={admin} />
            ) : null}
          </Dialog>
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
