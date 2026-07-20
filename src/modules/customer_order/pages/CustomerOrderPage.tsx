import { useState } from 'react'
import { Link } from 'react-router'

import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Input, Select, Textarea } from '@/shared/components/ui/Input'
import { Dialog } from '@/shared/components/ui/Dialog'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { useCustomerOrder } from '../hooks/useCustomerOrder'
import { useShipment } from '../hooks/useShipment'
import type { CustomerOrderRecord, CustomerOrderRow, ShipmentRow } from '../types/customerOrder'
import { usePagination } from '@/shared/lib/usePagination'
import { GenericDataTable, ColumnDef } from '@/shared/components/ui/DataTable'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/Table'

import './customerOrderShared.css'

function stateMsg(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải customer orders…'
    case 'empty':
      return 'Chưa có customer order.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem customer orders.'
    case 'error':
      return 'Không tải được customer orders.'
    default:
      return ''
  }
}

function OrderEditor({
  detail,
  admin,
}: {
  detail: CustomerOrderRecord
  admin: ReturnType<typeof useCustomerOrder>
}) {
  const row = admin.detailRow
  const [po, setPo] = useState(detail.customer_po_no)
  const [incoterm, setIncoterm] = useState(detail.incoterm)

  return (
    <aside className="co-admin__detail" aria-label="Chi tiết customer order">
      <h3>{detail.code}</h3>
      <p className="co-admin__muted">
        {row?.customerLabel} · {detail.status} · {row?.createdByLabel}
      </p>
      <dl>
        <div>
          <dt>Received</dt>
          <dd>{row?.receivedDate}</dd>
        </div>
        <div>
          <dt>Requested delivery</dt>
          <dd>{row?.requestedDeliveryDate}</dd>
        </div>
      </dl>

      {detail.lines?.length ? (
        <Table containerClassName="border border-[var(--border-default)] rounded-lg bg-[var(--surface-1)] overflow-hidden my-4">
          <TableHeader>
            <TableRow className="pointer-events-none hover:bg-transparent bg-[var(--surface-2)]">
              <TableHead>Hạng mục</TableHead>
              <TableHead>Mã linh kiện (Khách hàng)</TableHead>
              <TableHead>Mã vật tư (Nội bộ)</TableHead>
              <TableHead>Số lượng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.lines.map((ln) => (
              <TableRow key={ln.code} className="hover:bg-[var(--surface-2)]">
                <TableCell>{ln.code}</TableCell>
                <TableCell>{ln.customer_item_code ?? '-'}</TableCell>
                <TableCell>{ln.item_code ?? '-'}</TableCell>
                <TableCell>{ln.ordered_qty}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      {detail.work_orders?.length ? (
        <p className="co-admin__muted">
          WO:{' '}
          {detail.work_orders.map((wo) => `${wo.code}(${wo.status})`).join(', ')}
        </p>
      ) : null}

      {row?.canUpdate ? (
        <form
          className="flex flex-col gap-4 mt-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!window.confirm('Xác nhận lưu thay đổi thông tin đơn hàng này?')) return
            admin.submitUpdate({ customer_po_no: po, incoterm })
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Customer PO</span>
            <Input value={po} onChange={(e) => setPo(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Incoterm</span>
            <Input value={incoterm} onChange={(e) => setIncoterm(e.target.value)} required />
          </label>
          <Button type="submit" className="w-full justify-center">Lưu thay đổi</Button>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[var(--border-default)]">
        {row?.canConfirm ? (
          <Button type="button" onClick={() => admin.setConfirmConfirm(true)}>
            Confirm
          </Button>
        ) : null}
        {row?.canCancel ? (
          <Button type="button" variant="danger" onClick={() => admin.setShowCancel(true)}>
            Cancel
          </Button>
        ) : null}
        {row?.canClose ? (
          <Button type="button" onClick={() => admin.setConfirmClose(true)}>
            Close
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={admin.confirmConfirm}
        onClose={() => admin.setConfirmConfirm(false)}
        onConfirm={admin.submitConfirm}
        title="Xác nhận Confirm"
        description={`Confirm CO ${detail.code}? (sinh WO DRAFT)`}
        isPending={false}
      />

      <Dialog
        isOpen={admin.showCancel}
        onClose={() => admin.setShowCancel(false)}
        title="Hủy đơn hàng (Cancel CO)"
        maxWidth="max-w-[50%]"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!window.confirm('Xác nhận cancel đơn hàng này? Thao tác không thể hoàn tác.')) return
            admin.submitCancel()
          }}
        >
          <p className="text-sm text-[var(--text-secondary)]">
            Cancel không hoàn tác. Nhập lý do (reason).
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Reason</span>
            <Textarea value={admin.cancelReason} onChange={(e) => admin.setCancelReason(e.target.value)} required />
          </label>
          {admin.cancelErrors.length ? (
            <p className="text-sm text-[var(--color-danger-text)]">Thiếu: {admin.cancelErrors.join(', ')}</p>
          ) : null}
          {admin.cancelError ? (
            <p className="text-sm text-[var(--color-danger-text)]" role="alert">
              {admin.cancelError.code}: {admin.cancelError.message}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => admin.setShowCancel(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="danger">Xác nhận cancel</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        isOpen={admin.confirmClose}
        onClose={() => admin.setConfirmClose(false)}
        onConfirm={admin.submitClose}
        title="Xác nhận Close"
        description={`Close CO ${detail.code}?`}
        isPending={false}
      />
    </aside>
  )
}

export function CustomerOrderPage() {
  const [tab, setTab] = useState<'orders' | 'shipments'>('orders')
  const admin = useCustomerOrder()
  const ship = useShipment()
  
  const orderPagination = usePagination(admin.rows, 10)
  const shipmentPagination = usePagination(ship.rows, 10)

  const orderColumns: ColumnDef<CustomerOrderRow>[] = [
    {
      header: 'Mã đơn hàng (CO)',
      cell: (row) => (
        <button
          type="button"
          className="co-admin__linkish"
          onClick={(e) => {
            e.stopPropagation()
            admin.selectOrder(row.code)
          }}
        >
          {row.code}
        </button>
      ),
    },
    {
      header: 'Khách hàng',
      cell: (row) => row.customerLabel,
    },
    {
      header: 'Mã đơn mua (PO Khách hàng)',
      cell: (row) => row.customerPoNo,
    },
    {
      header: 'Trạng thái',
      cell: (row) => row.status,
    },
  ]

  const shipmentColumns: ColumnDef<ShipmentRow>[] = [
    {
      header: 'Mã lô giao hàng',
      cell: (row) => (
        <button
          type="button"
          className="co-admin__linkish"
          onClick={(e) => {
            e.stopPropagation()
            ship.selectShipment(row.code)
          }}
        >
          {row.code}
        </button>
      ),
    },
    {
      header: 'Trạng thái',
      cell: (row) => row.status,
    },
    {
      header: 'Khách hàng',
      cell: (row) => row.customerLabel,
    },
    {
      header: 'Đơn vị vận chuyển',
      cell: (row) => row.carrier,
    },
  ]

  const banner = stateMsg(admin.listState)
  const shipBanner = stateMsg(ship.listState).replace('customer orders', 'shipments')

  return (
    <section className="co-admin" aria-labelledby="co-title">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'MES' },
          { label: 'Customer Orders' },
        ]}
        title="Đơn hàng khách hàng (Customer Order)"
        subtitle="Quản lý vòng đời đơn hàng bán hàng (Customer Order), theo dõi tiến độ chuẩn bị hàng và xác nhận lệnh xuất xưởng (Shipment)."
        actions={
          <Link to="/web/mes/customers">
            <Button variant="secondary">Danh mục khách hàng</Button>
          </Link>
        }
      />

      <div className="co-admin__actions" role="tablist" aria-label="MES-10 sections">
        <button type="button" role="tab" aria-selected={tab === 'orders'} onClick={() => setTab('orders')}>
          Orders
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'shipments'}
          onClick={() => setTab('shipments')}
        >
          Shipments
        </button>
      </div>

      {tab === 'shipments' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'search',
                type: 'text',
                label: 'Tìm shipment',
                placeholder: 'Tìm kiếm shipment...',
              },
            ]}
            values={{
              search: ship.searchInput,
            }}
            onChange={(name, value) => {
              if (name === 'search') {
                ship.setSearchInput(value)
              }
            }}
            onSubmit={(e) => {
              e.preventDefault()
              ship.applySearch()
            }}
            onReset={() => {
              ship.setSearchInput('')
              ship.applySearch()
            }}
            isResetActive={Boolean(ship.searchInput)}
            expands={
              <Button type="button" className="co-admin__btn shrink-0" onClick={() => ship.setShowCreate(true)}>
                Tạo shipment
              </Button>
            }
          />

          {shipBanner ? (
            <p role={ship.listState === 'error' ? 'alert' : 'status'}>
              {shipBanner}
              {ship.listError ? ` (${ship.listError})` : ''}
            </p>
          ) : null}

          <Dialog
            isOpen={ship.showCreate}
            onClose={() => ship.setShowCreate(false)}
            title="Tạo Shipment mới"
            maxWidth="max-w-[50%]"
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!window.confirm('Xác nhận tạo shipment mới này?')) return
                ship.submitCreate()
              }}
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Code (optional)</span>
                <Input
                  value={ship.createForm.code ?? ''}
                  onChange={(e) => ship.setCreateForm({ ...ship.createForm, code: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Customer</span>
                <Select
                  value={ship.createForm.customer_id || ''}
                  onChange={(e) =>
                    ship.setCreateForm({ ...ship.createForm, customer_id: Number(e.target.value) })
                  }
                  required
                >
                  <option value="">—</option>
                  {ship.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Carrier</span>
                <Input
                  value={ship.createForm.carrier}
                  onChange={(e) => ship.setCreateForm({ ...ship.createForm, carrier: e.target.value })}
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Shipped at</span>
                <Input
                  type="datetime-local"
                  value={ship.createForm.shipped_at.slice(0, 16)}
                  onChange={(e) =>
                    ship.setCreateForm({
                      ...ship.createForm,
                      shipped_at: new Date(e.target.value).toISOString(),
                    })
                  }
                  required
                />
              </label>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" onClick={() => ship.setShowCreate(false)}>
                  Hủy
                </Button>
                <Button type="submit">Tạo</Button>
              </div>
            </form>
          </Dialog>

          {ship.listState === 'ready' ? (
            <div className="co-admin__layout">
              <div className="flex-1 flex flex-col gap-4 min-w-[300px]">
                <GenericDataTable
                  data={shipmentPagination.paginatedItems}
                  columns={shipmentColumns}
                  pagination={shipmentPagination}
                  onRowClick={(row) => ship.selectShipment(row.code)}
                  getRowClassName={(row) =>
                    row.code === ship.selectedCode ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]' : ''
                  }
                />
              </div>

              {ship.detail && ship.detailRow ? (
                <aside className="co-admin__detail" aria-label="Chi tiết shipment">
                  <h3>{ship.detail.code}</h3>
                  <p className="co-admin__muted">
                    {ship.detailRow.customerLabel} · {ship.detailRow.status} · CoC {ship.detailRow.cocLabel}
                  </p>
                  {ship.detailRow.shipDisabledReason ? (
                    <p className="co-admin__error" role="status">
                      Ship blocked: {ship.detailRow.shipDisabledReason}
                    </p>
                  ) : null}

                  {ship.detailRow.canUpdate ? (
                    <form
                      className="flex flex-col gap-4 mt-4"
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!window.confirm('Xác nhận lưu thay đổi shipment này?')) return
                        const fd = new FormData(e.currentTarget)
                        ship.submitUpdate({
                          carrier: String(fd.get('carrier') || ''),
                          tracking_no: String(fd.get('tracking') || '') || null,
                        })
                      }}
                    >
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">Carrier</span>
                        <Input name="carrier" defaultValue={ship.detail.carrier} required />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">Tracking</span>
                        <Input name="tracking" defaultValue={ship.detail.tracking_no ?? ''} />
                      </label>
                      <Button type="submit" className="w-full justify-center">Lưu thay đổi</Button>
                    </form>
                  ) : null}

                  <h4 className="mt-6">Lines</h4>
                  <ul className="flex flex-col gap-2">
                    {(ship.detail.lines ?? []).map((ln) => (
                      <li key={ln.id} className="flex items-center justify-between p-2 rounded bg-[var(--surface-2)] border border-[var(--border-default)]">
                        <span className="text-sm font-medium">
                          {ln.finished_lot_code || `Lot#${ln.finished_lot_id}`} · qty {ln.qty} · {ln.item_code || '-'}
                        </span>
                        {ship.detailRow?.removeLineActions.some((a) => a.href.endsWith(`/lines/${ln.id}`)) ? (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              if (!window.confirm('Xác nhận xóa line này khỏi shipment?')) return
                              ship.submitRemoveLine(`/api/mes/shipments/${ship.detail!.code}/lines/${ln.id}`)
                            }}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>

                  {ship.detailRow.canAddLine ? (
                    <form
                      className="flex flex-col gap-4 mt-6 p-4 border border-[var(--border-default)] rounded-lg bg-[var(--surface-2)]"
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!window.confirm('Xác nhận thêm line này vào shipment?')) return
                        ship.submitAddLine()
                      }}
                    >
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">Add Line</h4>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">Finished lot code</span>
                        <Input
                          value={ship.lineForm.finished_lot_code}
                          onChange={(e) =>
                            ship.setLineForm({ ...ship.lineForm, finished_lot_code: e.target.value })
                          }
                          required
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">Qty</span>
                        <Input
                          type="number"
                          min={0.0001}
                          step="any"
                          value={ship.lineForm.qty}
                          onChange={(e) => ship.setLineForm({ ...ship.lineForm, qty: Number(e.target.value) })}
                          required
                        />
                      </label>
                      <Button type="submit" className="w-full justify-center">Add line</Button>
                    </form>
                  ) : null}

                  <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-[var(--border-default)]">
                    {ship.detailRow.canCocGenerate ? (
                      <Button
                        type="button"
                        onClick={() => {
                          if (!window.confirm('Xác nhận generate CoC cho shipment này?')) return
                          ship.submitCocGenerate()
                        }}
                      >
                        CoC generate
                      </Button>
                    ) : null}
                    {ship.detailRow.canCocSign ? (
                      <Button type="button" onClick={() => ship.setShowSign(true)}>
                        CoC sign
                      </Button>
                    ) : null}
                    {ship.detailRow.canCocDownload ? (
                      <Button
                        type="button"
                        onClick={() => {
                          if (!window.confirm('Xác nhận tải CoC?')) return
                          ship.submitCocDownload()
                        }}
                      >
                        CoC download
                      </Button>
                    ) : null}
                    {ship.detailRow.canShip ? (
                      <Button
                        type="button"
                        onClick={() => {
                          if (!window.confirm('Xác nhận xuất kho (ship) cho shipment này?')) return
                          ship.submitShip()
                        }}
                      >
                        Ship
                      </Button>
                    ) : null}
                    {ship.detailRow.canDeliver ? (
                      <Button
                        type="button"
                        onClick={() => {
                          if (!window.confirm('Xác nhận bàn giao (deliver) shipment này?')) return
                          ship.submitDeliver()
                        }}
                      >
                        Deliver
                      </Button>
                    ) : null}
                    {ship.detailRow.canAccept ? (
                      <Button
                        type="button"
                        onClick={() => {
                          if (!window.confirm('Xác nhận khách hàng đã nhận (accept) shipment này?')) return
                          ship.submitAccept()
                        }}
                      >
                        Accept
                      </Button>
                    ) : null}
                    {ship.detailRow.canFail ? (
                      <Button type="button" variant="danger" onClick={() => ship.setShowFail(true)}>
                        Fail
                      </Button>
                    ) : null}
                    {ship.detailRow.canCancel ? (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => ship.setConfirmCancel(true)}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>

                  {ship.cocJobCode ? (
                    <p className="co-admin__muted mt-2">CoC job queued: {ship.cocJobCode}</p>
                  ) : null}

                  <ConfirmDialog
                    isOpen={ship.confirmCancel}
                    onClose={() => ship.setConfirmCancel(false)}
                    onConfirm={ship.submitCancel}
                    title="Xác nhận Cancel"
                    description={`Cancel shipment ${ship.detail.code}?`}
                    isPending={false}
                  />

                  <Dialog
                    isOpen={ship.showSign}
                    onClose={() => ship.setShowSign(false)}
                    title="Ký xác nhận CoC (CoC Sign)"
                    maxWidth="max-w-[50%]"
                  >
                    <form
                      className="flex flex-col gap-4"
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!window.confirm('Xác nhận ký CoC với file ID này?')) return
                        ship.submitCocSign()
                      }}
                    >
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">Signed PDF file_id (NB-04)</span>
                        <Input
                          type="number"
                          min={1}
                          value={ship.signFileId || ''}
                          onChange={(e) => ship.setSignFileId(Number(e.target.value))}
                          required
                        />
                      </label>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="secondary" onClick={() => ship.setShowSign(false)}>
                          Hủy
                        </Button>
                        <Button type="submit">Sign</Button>
                      </div>
                    </form>
                  </Dialog>

                  <Dialog
                    isOpen={ship.showFail}
                    onClose={() => ship.setShowFail(false)}
                    title="Đánh dấu Fail Shipment"
                    maxWidth="max-w-[50%]"
                  >
                    <form
                      className="flex flex-col gap-4"
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!window.confirm('Xác nhận đánh dấu fail cho shipment này? Thao tác không thể hoàn tác.')) return
                        ship.submitFail()
                      }}
                    >
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">Reason</span>
                        <Textarea value={ship.failReason} onChange={(e) => ship.setFailReason(e.target.value)} required />
                      </label>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="secondary" onClick={() => ship.setShowFail(false)}>
                          Hủy
                        </Button>
                        <Button type="submit" variant="danger">Fail</Button>
                      </div>
                    </form>
                  </Dialog>
                </aside>
              ) : null}
            </div>
          ) : null}
        </>
      ) : (
        <>
      <FilterBar
        fields={[
          {
            name: 'search',
            type: 'text',
            label: 'Tìm',
            placeholder: 'Tìm kiếm CO...',
          },
        ]}
        values={{
          search: admin.searchInput,
        }}
        onChange={(name, value) => {
          if (name === 'search') {
            admin.setSearchInput(value)
          }
        }}
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
        onReset={() => {
          admin.setSearchInput('')
          admin.applySearch()
        }}
        isResetActive={Boolean(admin.searchInput)}
        expands={
          <Button type="button" className="co-admin__btn shrink-0" onClick={() => admin.setShowCreate(true)}>
            Tạo CO
          </Button>
        }
      />

      <Dialog
        isOpen={admin.showCreate}
        onClose={() => admin.setShowCreate(false)}
        title="Tạo Customer Order mới"
        maxWidth="max-w-[75%]"
      >
        <form
          className="grid grid-cols-2 gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!window.confirm('Xác nhận tạo đơn hàng (CO) mới này?')) return
            admin.submitCreate()
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Code</span>
            <Input
              value={admin.createForm.code}
              onChange={(e) => admin.setCreateForm({ ...admin.createForm, code: e.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Customer</span>
            <Select
              value={admin.createForm.customer_id || ''}
              onChange={(e) =>
                admin.setCreateForm({
                  ...admin.createForm,
                  customer_id: Number(e.target.value),
                  lines: [{ code: '', customer_item_id: 0, ordered_qty: 1 }],
                })
              }
            >
              <option value="">—</option>
              {admin.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Customer PO</span>
            <Input
              value={admin.createForm.customer_po_no}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, customer_po_no: e.target.value })
              }
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Received date</span>
            <Input
              type="date"
              value={admin.createForm.received_date}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, received_date: e.target.value })
              }
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Requested delivery</span>
            <Input
              type="date"
              value={admin.createForm.requested_delivery_date}
              onChange={(e) =>
                admin.setCreateForm({
                  ...admin.createForm,
                  requested_delivery_date: e.target.value,
                })
              }
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Incoterm</span>
            <Input
              value={admin.createForm.incoterm}
              onChange={(e) => admin.setCreateForm({ ...admin.createForm, incoterm: e.target.value })}
              required
            />
          </label>
          <div className="col-span-2 border-t border-[var(--border-default)] pt-4 mt-2">
            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">Order Line</h4>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Line code</span>
                <Input
                  value={admin.createForm.lines[0]?.code ?? ''}
                  onChange={(e) =>
                    admin.setCreateForm({
                      ...admin.createForm,
                      lines: [{ ...admin.createForm.lines[0], code: e.target.value }],
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Customer item</span>
                <Select
                  value={admin.createForm.lines[0]?.customer_item_id || ''}
                  onChange={(e) =>
                    admin.setCreateForm({
                      ...admin.createForm,
                      lines: [
                        {
                          ...admin.createForm.lines[0],
                          customer_item_id: Number(e.target.value),
                        },
                      ],
                    })
                  }
                >
                  <option value="">—</option>
                  {admin.customerItems.map((ci) => (
                    <option key={ci.id} value={ci.id}>
                      {ci.code} ({ci.item_code ?? ci.item_id})
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Ordered qty</span>
                <Input
                  type="number"
                  min={0.0001}
                  step="any"
                  value={admin.createForm.lines[0]?.ordered_qty ?? 1}
                  onChange={(e) =>
                    admin.setCreateForm({
                      ...admin.createForm,
                      lines: [
                        {
                          ...admin.createForm.lines[0],
                          ordered_qty: Number(e.target.value),
                        },
                      ],
                    })
                  }
                  required
                />
              </label>
            </div>
          </div>
          <div className="col-span-2 flex justify-end gap-2 mt-4 pt-4 border-t border-[var(--border-default)]">
            <Button type="button" variant="secondary" onClick={() => admin.setShowCreate(false)}>
              Hủy
            </Button>
            <Button type="submit">Tạo CO</Button>
          </div>
          {admin.createErrors.length ? (
            <p className="col-span-2 text-sm text-[var(--color-danger-text)]">Thiếu: {admin.createErrors.join(', ')}</p>
          ) : null}
          {admin.createError ? (
            <p className="col-span-2 text-sm text-[var(--color-danger-text)]" role="alert">
              {admin.createError.code}: {admin.createError.message}
            </p>
          ) : null}
        </form>
      </Dialog>

      {banner ? <p className="co-admin__state">{banner}</p> : null}

      {admin.listState === 'ready' ? (
        <div className="co-admin__layout">
          <div className="co-admin__table-wrap flex flex-col gap-4">
            <GenericDataTable
              data={orderPagination.paginatedItems}
              columns={orderColumns}
              pagination={orderPagination}
              onRowClick={(row) => admin.selectOrder(row.code)}
              getRowClassName={(row) =>
                row.code === admin.selectedCode ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]' : ''
              }
            />
          </div>
          {admin.detail ? (
            <OrderEditor key={admin.detail.code} detail={admin.detail} admin={admin} />
          ) : (
            <p className="co-admin__muted">Chọn customer order.</p>
          )}
        </div>
      ) : null}
        </>
      )}
    </section>
  )
}
