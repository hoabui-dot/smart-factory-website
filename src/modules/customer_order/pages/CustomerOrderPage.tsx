import { useState } from 'react'
import { Link } from 'react-router'

import { useCustomerOrder } from '../hooks/useCustomerOrder'
import { useShipment } from '../hooks/useShipment'
import type { CustomerOrderRecord } from '../types/customerOrder'

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
        <table className="co-admin__table">
          <thead>
            <tr>
              <th>Line</th>
              <th>Customer item</th>
              <th>Item</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {detail.lines.map((ln) => (
              <tr key={ln.code}>
                <td>{ln.code}</td>
                <td>{ln.customer_item_code ?? '-'}</td>
                <td>{ln.item_code ?? '-'}</td>
                <td>{ln.ordered_qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {detail.work_orders?.length ? (
        <p className="co-admin__muted">
          WO:{' '}
          {detail.work_orders.map((wo) => `${wo.code}(${wo.status})`).join(', ')}
        </p>
      ) : null}

      {row?.canUpdate ? (
        <form
          className="co-admin__form"
          onSubmit={(e) => {
            e.preventDefault()
            admin.submitUpdate({ customer_po_no: po, incoterm })
          }}
        >
          <label>
            <span>Customer PO</span>
            <input value={po} onChange={(e) => setPo(e.target.value)} />
          </label>
          <label>
            <span>Incoterm</span>
            <input value={incoterm} onChange={(e) => setIncoterm(e.target.value)} />
          </label>
          <button type="submit">Lưu</button>
        </form>
      ) : null}

      <div className="co-admin__actions">
        {row?.canConfirm ? (
          <button type="button" onClick={() => admin.setConfirmConfirm(true)}>
            Confirm
          </button>
        ) : null}
        {row?.canCancel ? (
          <button type="button" className="co-admin__btn--danger" onClick={() => admin.setShowCancel(true)}>
            Cancel
          </button>
        ) : null}
        {row?.canClose ? (
          <button type="button" onClick={() => admin.setConfirmClose(true)}>
            Close
          </button>
        ) : null}
      </div>

      {admin.confirmConfirm ? (
        <div className="co-admin__dialog" role="dialog">
          <p>Confirm CO {detail.code}? (sinh WO DRAFT)</p>
          <div className="co-admin__actions">
            <button type="button" onClick={() => admin.submitConfirm()}>
              Xác nhận
            </button>
            <button type="button" className="co-admin__btn--ghost" onClick={() => admin.setConfirmConfirm(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}

      {admin.showCancel ? (
        <div className="co-admin__dialog" role="dialog">
          <p>Cancel không hoàn tác. Nhập reason.</p>
          <label>
            <span>Reason</span>
            <textarea value={admin.cancelReason} onChange={(e) => admin.setCancelReason(e.target.value)} />
          </label>
          {admin.cancelErrors.length ? (
            <p className="co-admin__error">Thiếu: {admin.cancelErrors.join(', ')}</p>
          ) : null}
          {admin.cancelError ? (
            <p className="co-admin__error" role="alert">
              {admin.cancelError.code}: {admin.cancelError.message}
            </p>
          ) : null}
          <div className="co-admin__actions">
            <button type="button" className="co-admin__btn--danger" onClick={() => admin.submitCancel()}>
              Xác nhận cancel
            </button>
            <button type="button" className="co-admin__btn--ghost" onClick={() => admin.setShowCancel(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}

      {admin.confirmClose ? (
        <div className="co-admin__dialog" role="dialog">
          <p>Close CO {detail.code}?</p>
          <div className="co-admin__actions">
            <button type="button" onClick={() => admin.submitClose()}>
              Xác nhận
            </button>
            <button type="button" className="co-admin__btn--ghost" onClick={() => admin.setConfirmClose(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  )
}

export function CustomerOrderPage() {
  const [tab, setTab] = useState<'orders' | 'shipments'>('orders')
  const admin = useCustomerOrder()
  const ship = useShipment()
  const banner = stateMsg(admin.listState)
  const shipBanner = stateMsg(ship.listState).replace('customer orders', 'shipments')

  return (
    <section className="co-admin" aria-labelledby="co-title">
      <header className="co-admin__header">
        <div>
          <p className="co-admin__eyebrow">WEB-MES-10-CUSTOMER-ORDER · `/web/mes/customer-orders`</p>
          <h2 id="co-title">Customer Order &amp; Shipment</h2>
          <p className="co-admin__lead">
            CO lifecycle + shipment/CoC (MES-10b). Confirm-pick là PDA-only. Customer master tại{' '}
            <Link to="/web/mes/customers">/web/mes/customers</Link>.
          </p>
        </div>
        <div className="co-admin__actions">
          <Link to="/web/mes/customers">Customer Master</Link>
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

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
          <form
            className="co-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              ship.applySearch()
            }}
          >
            <label>
              <span>Tìm shipment</span>
              <input value={ship.searchInput} onChange={(e) => ship.setSearchInput(e.target.value)} />
            </label>
            <button type="submit">Lọc</button>
            <button type="button" onClick={() => ship.setShowCreate(true)}>
              Tạo shipment
            </button>
          </form>

          {shipBanner ? (
            <p role={ship.listState === 'error' ? 'alert' : 'status'}>
              {shipBanner}
              {ship.listError ? ` (${ship.listError})` : ''}
            </p>
          ) : null}

          {ship.showCreate ? (
            <form
              className="co-admin__form"
              onSubmit={(e) => {
                e.preventDefault()
                ship.submitCreate()
              }}
            >
              <label>
                <span>Code (optional)</span>
                <input
                  value={ship.createForm.code ?? ''}
                  onChange={(e) => ship.setCreateForm({ ...ship.createForm, code: e.target.value })}
                />
              </label>
              <label>
                <span>Customer</span>
                <select
                  value={ship.createForm.customer_id || ''}
                  onChange={(e) =>
                    ship.setCreateForm({ ...ship.createForm, customer_id: Number(e.target.value) })
                  }
                >
                  <option value="">—</option>
                  {ship.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Carrier</span>
                <input
                  value={ship.createForm.carrier}
                  onChange={(e) => ship.setCreateForm({ ...ship.createForm, carrier: e.target.value })}
                />
              </label>
              <label>
                <span>Shipped at</span>
                <input
                  type="datetime-local"
                  value={ship.createForm.shipped_at.slice(0, 16)}
                  onChange={(e) =>
                    ship.setCreateForm({
                      ...ship.createForm,
                      shipped_at: new Date(e.target.value).toISOString(),
                    })
                  }
                />
              </label>
              <div className="co-admin__actions">
                <button type="submit">Tạo</button>
                <button type="button" className="co-admin__btn--ghost" onClick={() => ship.setShowCreate(false)}>
                  Hủy
                </button>
              </div>
            </form>
          ) : null}

          {ship.listState === 'ready' ? (
            <div className="co-admin__layout">
              <table className="co-admin__table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Status</th>
                    <th>Customer</th>
                    <th>Carrier</th>
                  </tr>
                </thead>
                <tbody>
                  {ship.rows.map((row) => (
                    <tr key={row.code} className={row.code === ship.selectedCode ? 'co-admin__row--active' : undefined}>
                      <td>
                        <button type="button" className="co-admin__linkish" onClick={() => ship.selectShipment(row.code)}>
                          {row.code}
                        </button>
                      </td>
                      <td>{row.status}</td>
                      <td>{row.customerLabel}</td>
                      <td>{row.carrier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
                      className="co-admin__form"
                      onSubmit={(e) => {
                        e.preventDefault()
                        const fd = new FormData(e.currentTarget)
                        ship.submitUpdate({
                          carrier: String(fd.get('carrier') || ''),
                          tracking_no: String(fd.get('tracking') || '') || null,
                        })
                      }}
                    >
                      <label>
                        <span>Carrier</span>
                        <input name="carrier" defaultValue={ship.detail.carrier} />
                      </label>
                      <label>
                        <span>Tracking</span>
                        <input name="tracking" defaultValue={ship.detail.tracking_no ?? ''} />
                      </label>
                      <button type="submit">Lưu</button>
                    </form>
                  ) : null}

                  <h4>Lines</h4>
                  <ul>
                    {(ship.detail.lines ?? []).map((ln) => (
                      <li key={ln.id}>
                        {ln.finished_lot_code || `Lot#${ln.finished_lot_id}`} · qty {ln.qty} · {ln.item_code || '-'}
                        {ship.detailRow?.removeLineActions.some((a) => a.href.endsWith(`/lines/${ln.id}`)) ? (
                          <button
                            type="button"
                            className="co-admin__btn--danger"
                            onClick={() =>
                              ship.submitRemoveLine(`/api/mes/shipments/${ship.detail!.code}/lines/${ln.id}`)
                            }
                          >
                            Remove
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>

                  {ship.detailRow.canAddLine ? (
                    <form
                      className="co-admin__form"
                      onSubmit={(e) => {
                        e.preventDefault()
                        ship.submitAddLine()
                      }}
                    >
                      <label>
                        <span>Finished lot code</span>
                        <input
                          value={ship.lineForm.finished_lot_code}
                          onChange={(e) =>
                            ship.setLineForm({ ...ship.lineForm, finished_lot_code: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        <span>Qty</span>
                        <input
                          type="number"
                          min={0.0001}
                          step="any"
                          value={ship.lineForm.qty}
                          onChange={(e) => ship.setLineForm({ ...ship.lineForm, qty: Number(e.target.value) })}
                        />
                      </label>
                      <button type="submit">Add line</button>
                    </form>
                  ) : null}

                  <div className="co-admin__actions">
                    {ship.detailRow.canCocGenerate ? (
                      <button type="button" onClick={() => ship.submitCocGenerate()}>
                        CoC generate
                      </button>
                    ) : null}
                    {ship.detailRow.canCocSign ? (
                      <button type="button" onClick={() => ship.setShowSign(true)}>
                        CoC sign
                      </button>
                    ) : null}
                    {ship.detailRow.canCocDownload ? (
                      <button type="button" onClick={() => ship.submitCocDownload()}>
                        CoC download
                      </button>
                    ) : null}
                    {ship.detailRow.canShip ? (
                      <button type="button" onClick={() => ship.submitShip()}>
                        Ship
                      </button>
                    ) : null}
                    {ship.detailRow.canDeliver ? (
                      <button type="button" onClick={() => ship.submitDeliver()}>
                        Deliver
                      </button>
                    ) : null}
                    {ship.detailRow.canAccept ? (
                      <button type="button" onClick={() => ship.submitAccept()}>
                        Accept
                      </button>
                    ) : null}
                    {ship.detailRow.canFail ? (
                      <button type="button" className="co-admin__btn--danger" onClick={() => ship.setShowFail(true)}>
                        Fail
                      </button>
                    ) : null}
                    {ship.detailRow.canCancel ? (
                      <button
                        type="button"
                        className="co-admin__btn--danger"
                        onClick={() => ship.setConfirmCancel(true)}
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>

                  {ship.cocJobCode ? (
                    <p className="co-admin__muted">CoC job queued: {ship.cocJobCode}</p>
                  ) : null}

                  {ship.confirmCancel ? (
                    <div className="co-admin__dialog" role="dialog">
                      <p>Cancel shipment {ship.detail.code}?</p>
                      <div className="co-admin__actions">
                        <button type="button" className="co-admin__btn--danger" onClick={() => ship.submitCancel()}>
                          Xác nhận
                        </button>
                        <button type="button" className="co-admin__btn--ghost" onClick={() => ship.setConfirmCancel(false)}>
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {ship.showSign ? (
                    <div className="co-admin__dialog" role="dialog">
                      <label>
                        <span>Signed PDF file_id (NB-04)</span>
                        <input
                          type="number"
                          min={1}
                          value={ship.signFileId || ''}
                          onChange={(e) => ship.setSignFileId(Number(e.target.value))}
                        />
                      </label>
                      <div className="co-admin__actions">
                        <button type="button" onClick={() => ship.submitCocSign()}>
                          Sign
                        </button>
                        <button type="button" className="co-admin__btn--ghost" onClick={() => ship.setShowSign(false)}>
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {ship.showFail ? (
                    <div className="co-admin__dialog" role="dialog">
                      <label>
                        <span>Reason</span>
                        <textarea value={ship.failReason} onChange={(e) => ship.setFailReason(e.target.value)} />
                      </label>
                      <div className="co-admin__actions">
                        <button type="button" className="co-admin__btn--danger" onClick={() => ship.submitFail()}>
                          Fail
                        </button>
                        <button type="button" className="co-admin__btn--ghost" onClick={() => ship.setShowFail(false)}>
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : null}
                </aside>
              ) : null}
            </div>
          ) : null}
        </>
      ) : (
        <>
      <form
        className="co-admin__filters"
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
      >
        <label>
          <span>Tìm</span>
          <input value={admin.searchInput} onChange={(e) => admin.setSearchInput(e.target.value)} />
        </label>
        <button type="submit">Lọc</button>
        <button type="button" onClick={() => admin.setShowCreate(true)}>
          Tạo CO
        </button>
      </form>

      {admin.showCreate ? (
        <form
          className="co-admin__form"
          onSubmit={(e) => {
            e.preventDefault()
            admin.submitCreate()
          }}
        >
          <label>
            <span>Code</span>
            <input
              value={admin.createForm.code}
              onChange={(e) => admin.setCreateForm({ ...admin.createForm, code: e.target.value })}
            />
          </label>
          <label>
            <span>Customer</span>
            <select
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
            </select>
          </label>
          <label>
            <span>Customer PO</span>
            <input
              value={admin.createForm.customer_po_no}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, customer_po_no: e.target.value })
              }
            />
          </label>
          <label>
            <span>Received date</span>
            <input
              type="date"
              value={admin.createForm.received_date}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, received_date: e.target.value })
              }
            />
          </label>
          <label>
            <span>Requested delivery</span>
            <input
              type="date"
              value={admin.createForm.requested_delivery_date}
              onChange={(e) =>
                admin.setCreateForm({
                  ...admin.createForm,
                  requested_delivery_date: e.target.value,
                })
              }
            />
          </label>
          <label>
            <span>Incoterm</span>
            <input
              value={admin.createForm.incoterm}
              onChange={(e) => admin.setCreateForm({ ...admin.createForm, incoterm: e.target.value })}
            />
          </label>
          <label>
            <span>Line code</span>
            <input
              value={admin.createForm.lines[0]?.code ?? ''}
              onChange={(e) =>
                admin.setCreateForm({
                  ...admin.createForm,
                  lines: [{ ...admin.createForm.lines[0], code: e.target.value }],
                })
              }
            />
          </label>
          <label>
            <span>Customer item</span>
            <select
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
            </select>
          </label>
          <label>
            <span>Ordered qty</span>
            <input
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
            />
          </label>
          {admin.createErrors.length ? (
            <p className="co-admin__error">Thiếu: {admin.createErrors.join(', ')}</p>
          ) : null}
          {admin.createError ? (
            <p className="co-admin__error" role="alert">
              {admin.createError.code}: {admin.createError.message}
            </p>
          ) : null}
          <div className="co-admin__actions">
            <button type="submit">Lưu CO</button>
            <button type="button" className="co-admin__btn--ghost" onClick={() => admin.setShowCreate(false)}>
              Hủy
            </button>
          </div>
        </form>
      ) : null}

      {banner ? <p className="co-admin__state">{banner}</p> : null}

      {admin.listState === 'ready' ? (
        <div className="co-admin__layout">
          <div className="co-admin__table-wrap">
            <table className="co-admin__table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Customer</th>
                  <th>PO</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {admin.rows.map((row) => (
                  <tr
                    key={row.code}
                    className={admin.selectedCode === row.code ? 'co-admin__row--active' : undefined}
                  >
                    <td>
                      <button
                        type="button"
                        className="co-admin__linkish"
                        onClick={() => admin.selectOrder(row.code)}
                      >
                        {row.code}
                      </button>
                    </td>
                    <td>{row.customerLabel}</td>
                    <td>{row.customerPoNo}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
