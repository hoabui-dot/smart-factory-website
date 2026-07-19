import { useState } from 'react'
import { Link } from 'react-router'

import { useItemMaster } from '../hooks/useItemMaster'
import type { ItemRecord } from '../types/itemMaster'

import './ItemMasterPage.css'

type Api = ReturnType<typeof useItemMaster>

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải danh mục item…'
    case 'empty':
      return 'Chưa có item nào.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem danh mục item.'
    case 'error':
      return 'Không tải được danh mục item. Thử lại sau.'
    default:
      return ''
  }
}

function ItemEditor({ detail, admin }: { detail: ItemRecord; admin: Api }) {
  const [itemName, setItemName] = useState(detail.item_name)
  const [itemTypeId, setItemTypeId] = useState(detail.item_type_id)
  const [categoryId, setCategoryId] = useState(detail.category_id)
  const [isLotTracked, setIsLotTracked] = useState(detail.is_lot_tracked)
  const [isSerialTracked, setIsSerialTracked] = useState(detail.is_serial_tracked)
  const [isPhantom, setIsPhantom] = useState(detail.is_phantom)
  const [shelfLifeDays, setShelfLifeDays] = useState(
    detail.shelf_life_days == null ? '' : String(detail.shelf_life_days),
  )

  const row = admin.detailRow

  return (
    <aside className="item-master__detail" aria-label="Chi tiết item">
      <h3>{detail.code}</h3>
      <p className="item-master__muted">
        {detail.item_name} · {detail.is_active ? 'Active' : 'Inactive'}
      </p>
      <dl className="item-master__meta">
        <div>
          <dt>Item type</dt>
          <dd>{detail.item_type_code ?? '-'}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{detail.category_code ?? '-'}</dd>
        </div>
        <div>
          <dt>Base UOM</dt>
          <dd>{detail.base_uom_code ?? '-'}</dd>
        </div>
        <div>
          <dt>Current revision</dt>
          <dd>{detail.current_revision_code ?? '-'}</dd>
        </div>
      </dl>

      <label className="item-master__field">
        <span>Tên item</span>
        <input value={itemName} onChange={(e) => setItemName(e.target.value)} />
      </label>
      <label className="item-master__field">
        <span>Item type</span>
        <select value={itemTypeId} onChange={(e) => setItemTypeId(Number(e.target.value))}>
          {admin.itemTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.code} — {t.name_vi}
            </option>
          ))}
        </select>
      </label>
      <label className="item-master__field">
        <span>Category</span>
        <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
          {admin.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.category_name}
            </option>
          ))}
        </select>
      </label>
      <label className="item-master__checkbox">
        <input
          type="checkbox"
          checked={isLotTracked}
          onChange={(e) => setIsLotTracked(e.target.checked)}
        />
        <span>Lot tracked</span>
      </label>
      <label className="item-master__checkbox">
        <input
          type="checkbox"
          checked={isSerialTracked}
          onChange={(e) => setIsSerialTracked(e.target.checked)}
        />
        <span>Serial tracked</span>
      </label>
      <label className="item-master__checkbox">
        <input type="checkbox" checked={isPhantom} onChange={(e) => setIsPhantom(e.target.checked)} />
        <span>Phantom (BOM only)</span>
      </label>
      <label className="item-master__field">
        <span>Shelf life (days)</span>
        <input
          inputMode="numeric"
          value={shelfLifeDays}
          onChange={(e) => setShelfLifeDays(e.target.value)}
          placeholder="Bỏ trống nếu không giới hạn"
        />
      </label>

      <button
        type="button"
        className="item-master__btn"
        disabled={!row?.canUpdate || admin.updatePending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() =>
          admin.saveEdit({
            item_name: itemName.trim(),
            item_type_id: itemTypeId,
            category_id: categoryId,
            is_lot_tracked: isLotTracked,
            is_serial_tracked: isSerialTracked,
            is_phantom: isPhantom,
            shelf_life_days: shelfLifeDays.trim() === '' ? null : Number(shelfLifeDays),
          })
        }
      >
        {admin.updatePending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="item-master__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateError ? (
        <p className="item-master__error" role="alert">
          {admin.updateError.code}: {admin.updateError.message}
        </p>
      ) : null}
      {admin.updateSuccess ? (
        <p className="item-master__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>Deactivate</h4>
      <button
        type="button"
        className="item-master__btn item-master__btn--danger"
        disabled={!row?.canDeactivate}
        title={row?.deactivateDisabledReason ?? undefined}
        onClick={() => admin.setConfirmDeactivate(true)}
      >
        Deactivate item
      </button>
      {!row?.canDeactivate ? (
        <p className="item-master__muted">
          Deactivate không khả dụng
          {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
        </p>
      ) : null}

      {admin.confirmDeactivate ? (
        <div className="item-master__confirm" role="dialog" aria-label="Xác nhận deactivate">
          <p>
            Xác nhận deactivate <strong>{detail.code}</strong>? Item sẽ chuyển is_active=false.
          </p>
          <div className="item-master__actions">
            <button
              type="button"
              className="item-master__btn item-master__btn--danger"
              disabled={admin.deactivateState === 'pending'}
              onClick={admin.deactivate}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmDeactivate(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.deactivateError ? (
        <p className="item-master__error" role="alert">
          {admin.deactivateError.code}: {admin.deactivateError.message}
        </p>
      ) : null}
      {admin.deactivateState === 'success' ? (
        <p className="item-master__banner" role="status">
          Đã deactivate item.
        </p>
      ) : null}
    </aside>
  )
}

export function ItemMasterPage() {
  const admin = useItemMaster()
  const banner = listStateMessage(admin.listState)

  return (
    <section className="item-master" aria-labelledby="item-master-title">
      <header className="item-master__header">
        <div>
          <p className="item-master__eyebrow">WEB-MES-01-ITEM-MASTER · `/web/mes/items`</p>
          <h2 id="item-master-title">Danh mục Vật tư &amp; Sản phẩm</h2>
          <p className="item-master__lead">
            Quản lý item master (MES01-001..005). Import/export theo lô dùng Import/Export Center.
          </p>
        </div>
        <div className="item-master__actions">
          <Link to="/web/import-export">Import / Export Center</Link>
          <Link to="/home">Về trang chủ</Link>
          <button type="button" className="item-master__btn" onClick={admin.openCreate}>
            Tạo item
          </button>
        </div>
      </header>

      <form
        className="item-master__filters"
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
      >
        <label className="item-master__field">
          <span>Tìm item (code / tên)</span>
          <input
            value={admin.searchInput}
            onChange={(e) => admin.setSearchInput(e.target.value)}
            placeholder="ITM-… / tên item"
          />
        </label>
        <button type="submit" className="item-master__btn">
          Lọc
        </button>
      </form>

      {admin.showCreate ? (
        <div className="item-master__create">
          <h3>Tạo item mới</h3>
          <p className="item-master__muted">
            Form luôn hiển thị — server enforce quyền tạo (MES01-003).
          </p>
          <label className="item-master__field">
            <span>Code</span>
            <input
              value={admin.createForm.code}
              onChange={(e) => admin.setCreateForm({ ...admin.createForm, code: e.target.value })}
            />
          </label>
          <label className="item-master__field">
            <span>Tên item</span>
            <input
              value={admin.createForm.item_name}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, item_name: e.target.value })
              }
            />
          </label>
          <label className="item-master__field">
            <span>Item type</span>
            <select
              value={admin.createForm.item_type_id}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, item_type_id: Number(e.target.value) })
              }
            >
              <option value={0}>Chọn item type</option>
              {admin.itemTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} — {t.name_vi}
                </option>
              ))}
            </select>
          </label>
          <label className="item-master__field">
            <span>Category</span>
            <select
              value={admin.createForm.category_id}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, category_id: Number(e.target.value) })
              }
            >
              <option value={0}>Chọn category</option>
              {admin.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.category_name}
                </option>
              ))}
            </select>
          </label>
          <label className="item-master__field">
            <span>Base UOM</span>
            <select
              value={admin.createForm.base_uom_id}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, base_uom_id: Number(e.target.value) })
              }
            >
              <option value={0}>Chọn UOM</option>
              {admin.uoms.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code} — {u.uom_name}
                </option>
              ))}
            </select>
          </label>
          <label className="item-master__checkbox">
            <input
              type="checkbox"
              checked={admin.createForm.is_lot_tracked}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, is_lot_tracked: e.target.checked })
              }
            />
            <span>Lot tracked</span>
          </label>
          <label className="item-master__checkbox">
            <input
              type="checkbox"
              checked={admin.createForm.is_serial_tracked}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, is_serial_tracked: e.target.checked })
              }
            />
            <span>Serial tracked</span>
          </label>
          <label className="item-master__checkbox">
            <input
              type="checkbox"
              checked={admin.createForm.is_phantom}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, is_phantom: e.target.checked })
              }
            />
            <span>Phantom (BOM only)</span>
          </label>
          <label className="item-master__checkbox">
            <input
              type="checkbox"
              checked={admin.createForm.is_active}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, is_active: e.target.checked })
              }
            />
            <span>Active</span>
          </label>
          <div className="item-master__actions">
            <button
              type="button"
              className="item-master__btn"
              disabled={admin.createErrors.length > 0 || admin.createPending}
              onClick={() => admin.create()}
            >
              {admin.createPending ? 'Đang tạo…' : 'Tạo'}
            </button>
            <button type="button" onClick={admin.closeCreate}>
              Hủy
            </button>
          </div>
          {admin.createError ? (
            <p className="item-master__error" role="alert">
              {admin.createError.code}: {admin.createError.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {banner ? (
        <p className="item-master__state" role={admin.listState === 'error' ? 'alert' : 'status'}>
          {banner}
          {admin.listError ? ` (${admin.listError.code})` : ''}
        </p>
      ) : null}

      {admin.listState === 'ready' ? (
        <div className="item-master__layout">
          <div className="item-master__table-wrap">
            <table className="item-master__table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Tên item</th>
                  <th>Item type</th>
                  <th>Category</th>
                  <th>Base UOM</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {admin.rows.map((row) => (
                  <tr
                    key={row.code}
                    className={row.code === admin.selectedCode ? 'item-master__row--active' : ''}
                  >
                    <td>
                      <button
                        type="button"
                        className="item-master__linkish"
                        onClick={() => admin.selectItem(row.code)}
                      >
                        {row.code}
                      </button>
                    </td>
                    <td>{row.itemName}</td>
                    <td>{row.itemTypeLabel}</td>
                    <td>{row.categoryLabel}</td>
                    <td>{row.baseUomLabel}</td>
                    <td>{row.isActive ? 'yes' : 'no'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {admin.hasMore ? (
              <button type="button" className="item-master__more" onClick={admin.loadMore}>
                Tải thêm
              </button>
            ) : null}
          </div>

          {admin.detailLoading ? (
            <div className="item-master__state">Đang tải chi tiết…</div>
          ) : admin.detail ? (
            <ItemEditor key={admin.detail.code} detail={admin.detail} admin={admin} />
          ) : (
            <div className="item-master__state">Chọn item để xem chi tiết.</div>
          )}
        </div>
      ) : null}
    </section>
  )
}
