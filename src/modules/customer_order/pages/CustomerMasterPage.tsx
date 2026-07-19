import { useState } from 'react'
import { Link } from 'react-router'

import { useCustomerMaster } from '../hooks/useCustomerMaster'
import type { CustomerItemRecord, CustomerRecord } from '../types/customerOrder'

import './customerOrderShared.css'

function stateMsg(state: string, entity: string): string {
  switch (state) {
    case 'loading':
      return `Đang tải ${entity}…`
    case 'empty':
      return `Chưa có ${entity}.`
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return `Bạn không có quyền xem ${entity}.`
    case 'error':
      return `Không tải được ${entity}.`
    default:
      return ''
  }
}

function CustomerEditor({
  detail,
  admin,
}: {
  detail: CustomerRecord
  admin: ReturnType<typeof useCustomerMaster>
}) {
  const row = admin.detailRow
  const [name, setName] = useState(detail.customer_name)
  const [email, setEmail] = useState(detail.contact_email)
  const [ppm, setPpm] = useState(detail.target_ppm)

  return (
    <aside className="co-admin__detail" aria-label="Chi tiết customer">
      <h3>{detail.code}</h3>
      <p className="co-admin__muted">
        {detail.country_code} · PPAP {detail.ppap_level_default} ·{' '}
        {detail.is_active ? 'ACTIVE' : 'INACTIVE'}
      </p>
      {row?.canUpdate ? (
        <form
          className="co-admin__form"
          onSubmit={(e) => {
            e.preventDefault()
            admin.submitUpdate({ customer_name: name, contact_email: email, target_ppm: ppm })
          }}
        >
          <label>
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            <span>Target PPM</span>
            <input type="number" value={ppm} onChange={(e) => setPpm(Number(e.target.value))} />
          </label>
          <button type="submit">Lưu</button>
        </form>
      ) : null}
      {row?.canDeactivate ? (
        <button type="button" className="co-admin__btn--danger" onClick={() => admin.setConfirmDeactivate(true)}>
          Deactivate
        </button>
      ) : null}
      {admin.confirmDeactivate ? (
        <div className="co-admin__dialog" role="dialog">
          <p>Deactivate customer {detail.code}?</p>
          <div className="co-admin__actions">
            <button type="button" className="co-admin__btn--danger" onClick={() => admin.submitDeactivate()}>
              Xác nhận
            </button>
            <button type="button" className="co-admin__btn--ghost" onClick={() => admin.setConfirmDeactivate(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.updateError ? (
        <p className="co-admin__error" role="alert">
          {admin.updateError.code}: {admin.updateError.message}
        </p>
      ) : null}
    </aside>
  )
}

function ItemEditor({
  detail,
  admin,
}: {
  detail: CustomerItemRecord
  admin: ReturnType<typeof useCustomerMaster>
}) {
  const row = admin.itemDetailRow
  const [partName, setPartName] = useState(detail.customer_part_name)
  const [packaging, setPackaging] = useState(detail.packaging_spec)

  return (
    <aside className="co-admin__detail" aria-label="Chi tiết customer item">
      <h3>{detail.code}</h3>
      <p className="co-admin__muted">
        {row?.customerLabel} · {row?.itemLabel} · {detail.characteristic_class}
      </p>
      {row?.canUpdate ? (
        <form
          className="co-admin__form"
          onSubmit={(e) => {
            e.preventDefault()
            admin.submitItemUpdate({ customer_part_name: partName, packaging_spec: packaging })
          }}
        >
          <label>
            <span>Customer part name</span>
            <input value={partName} onChange={(e) => setPartName(e.target.value)} />
          </label>
          <label>
            <span>Packaging</span>
            <textarea value={packaging} onChange={(e) => setPackaging(e.target.value)} />
          </label>
          <button type="submit">Lưu</button>
        </form>
      ) : null}
      {row?.canDeactivate ? (
        <button
          type="button"
          className="co-admin__btn--danger"
          onClick={() => admin.setConfirmItemDeactivate(true)}
        >
          Deactivate
        </button>
      ) : null}
      {admin.confirmItemDeactivate ? (
        <div className="co-admin__dialog" role="dialog">
          <p>Deactivate customer item {detail.code}?</p>
          <div className="co-admin__actions">
            <button type="button" className="co-admin__btn--danger" onClick={() => admin.submitItemDeactivate()}>
              Xác nhận
            </button>
            <button
              type="button"
              className="co-admin__btn--ghost"
              onClick={() => admin.setConfirmItemDeactivate(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  )
}

export function CustomerMasterPage() {
  const admin = useCustomerMaster()
  const banner = stateMsg(admin.listState, 'customer')
  const itemBanner = stateMsg(admin.itemListState, 'customer item')

  return (
    <section className="co-admin" aria-labelledby="customer-master-title">
      <header className="co-admin__header">
        <div>
          <p className="co-admin__eyebrow">WEB-MES-10-CUSTOMER · `/web/mes/customers`</p>
          <h2 id="customer-master-title">Customer Master</h2>
          <p className="co-admin__lead">
            Customer + customer-item mapping; import qua `/web/import-export`.
          </p>
        </div>
        <div className="co-admin__actions">
          <Link to="/web/mes/customer-orders">Customer Orders</Link>
          <Link to="/web/import-export">Import / Export</Link>
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

      <div className="co-admin__tabs" role="tablist">
        <button type="button" role="tab" aria-selected={admin.tab === 'customers'} onClick={() => admin.setTab('customers')}>
          Customers
        </button>
        <button type="button" role="tab" aria-selected={admin.tab === 'items'} onClick={() => admin.setTab('items')}>
          Customer items
        </button>
      </div>

      {admin.tab === 'customers' ? (
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
              Tạo customer
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
                <span>Name</span>
                <input
                  value={admin.createForm.customer_name}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, customer_name: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Country</span>
                <input
                  value={admin.createForm.country_code}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, country_code: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  value={admin.createForm.contact_email}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, contact_email: e.target.value })
                  }
                />
              </label>
              <label>
                <span>PPAP level</span>
                <input
                  value={admin.createForm.ppap_level_default}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, ppap_level_default: e.target.value })
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
                <button type="submit">Lưu</button>
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
                      <th>Name</th>
                      <th>Country</th>
                      <th>Active</th>
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
                            onClick={() => admin.selectCustomer(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.customerName}</td>
                        <td>{row.countryCode}</td>
                        <td>{row.isActive ? 'Y' : 'N'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {admin.detail ? (
                <CustomerEditor key={admin.detail.code} detail={admin.detail} admin={admin} />
              ) : (
                <p className="co-admin__muted">Chọn customer.</p>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'items' ? (
        <>
          <form
            className="co-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyItemSearch()
            }}
          >
            <label>
              <span>Tìm</span>
              <input value={admin.itemSearch} onChange={(e) => admin.setItemSearch(e.target.value)} />
            </label>
            <button type="submit">Lọc</button>
            <button type="button" onClick={() => admin.setShowItemCreate(true)}>
              Tạo customer item
            </button>
          </form>

          {admin.showItemCreate ? (
            <form
              className="co-admin__form"
              onSubmit={(e) => {
                e.preventDefault()
                admin.submitItemCreate()
              }}
            >
              <label>
                <span>Code</span>
                <input
                  value={admin.itemForm.code}
                  onChange={(e) => admin.setItemForm({ ...admin.itemForm, code: e.target.value })}
                />
              </label>
              <label>
                <span>Customer</span>
                <select
                  value={admin.itemForm.customer_id || ''}
                  onChange={(e) =>
                    admin.setItemForm({ ...admin.itemForm, customer_id: Number(e.target.value) })
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
                <span>Item</span>
                <select
                  value={admin.itemForm.item_id || ''}
                  onChange={(e) =>
                    admin.setItemForm({ ...admin.itemForm, item_id: Number(e.target.value) })
                  }
                >
                  <option value="">—</option>
                  {admin.mesItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.code}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Part name</span>
                <input
                  value={admin.itemForm.customer_part_name}
                  onChange={(e) =>
                    admin.setItemForm({ ...admin.itemForm, customer_part_name: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Class</span>
                <select
                  value={admin.itemForm.characteristic_class}
                  onChange={(e) =>
                    admin.setItemForm({ ...admin.itemForm, characteristic_class: e.target.value })
                  }
                >
                  <option value="STANDARD">STANDARD</option>
                  <option value="SC">SC</option>
                  <option value="CC">CC</option>
                </select>
              </label>
              <label>
                <span>Packaging</span>
                <input
                  value={admin.itemForm.packaging_spec}
                  onChange={(e) =>
                    admin.setItemForm({ ...admin.itemForm, packaging_spec: e.target.value })
                  }
                />
              </label>
              {admin.itemErrors.length ? (
                <p className="co-admin__error">Thiếu: {admin.itemErrors.join(', ')}</p>
              ) : null}
              <div className="co-admin__actions">
                <button type="submit">Lưu</button>
                <button
                  type="button"
                  className="co-admin__btn--ghost"
                  onClick={() => admin.setShowItemCreate(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : null}

          {itemBanner ? <p className="co-admin__state">{itemBanner}</p> : null}

          {admin.itemListState === 'ready' ? (
            <div className="co-admin__layout">
              <div className="co-admin__table-wrap">
                <table className="co-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Customer</th>
                      <th>Item</th>
                      <th>Part</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.itemRows.map((row) => (
                      <tr
                        key={row.code}
                        className={
                          admin.selectedItemCode === row.code ? 'co-admin__row--active' : undefined
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="co-admin__linkish"
                            onClick={() => admin.selectItem(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.customerLabel}</td>
                        <td>{row.itemLabel}</td>
                        <td>{row.customerPartName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {admin.itemDetail ? (
                <ItemEditor key={admin.itemDetail.code} detail={admin.itemDetail} admin={admin} />
              ) : (
                <p className="co-admin__muted">Chọn customer item.</p>
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
