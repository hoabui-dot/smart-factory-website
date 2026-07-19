import { useState } from 'react'
import { Link } from 'react-router'

import { useBinLocation } from '../hooks/useBinLocation'
import type { LocationRecord } from '../types/binLocation'

import './LocationMasterPage.css'

type Api = ReturnType<typeof useBinLocation>

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải danh mục location…'
    case 'empty':
      return 'Chưa có location nào.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem danh mục location.'
    case 'error':
      return 'Không tải được danh mục location. Thử lại sau.'
    default:
      return ''
  }
}

function LocationEditor({ detail, admin }: { detail: LocationRecord; admin: Api }) {
  const [locationName, setLocationName] = useState(detail.location_name)
  const [locationTypeId, setLocationTypeId] = useState(detail.location_type_id)
  const [parentLocationId, setParentLocationId] = useState<number | null>(
    detail.parent_location_id ?? null,
  )
  const [warehouseCategoryId, setWarehouseCategoryId] = useState<number | null>(
    detail.warehouse_category_id ?? null,
  )
  const [barcode, setBarcode] = useState(detail.barcode ?? '')
  const [capacityQty, setCapacityQty] = useState(
    detail.capacity_qty == null ? '' : String(detail.capacity_qty),
  )
  const [capacityUomId, setCapacityUomId] = useState<number | null>(
    detail.capacity_uom_id ?? null,
  )

  const row = admin.detailRow
  const typeCode =
    admin.locationTypes.find((t) => t.id === detail.location_type_id)?.code ?? '-'

  return (
    <aside className="location-master__detail" aria-label="Chi tiết location">
      <h3>{detail.code}</h3>
      <p className="location-master__muted">
        {detail.location_name} · {detail.is_active ? 'Active' : 'Inactive'} · {typeCode}
      </p>
      <dl className="location-master__meta">
        <div>
          <dt>Level</dt>
          <dd>{detail.level}</dd>
        </div>
        <div>
          <dt>Path</dt>
          <dd>{detail.path}</dd>
        </div>
        <div>
          <dt>Parent</dt>
          <dd>{row?.parentLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Warehouse category</dt>
          <dd>{row?.warehouseCategoryLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Manager</dt>
          <dd>{detail.manager_user_id == null ? '-' : 'Assigned'}</dd>
        </div>
      </dl>

      <label className="location-master__field">
        <span>Tên location</span>
        <input value={locationName} onChange={(e) => setLocationName(e.target.value)} />
      </label>
      <label className="location-master__field">
        <span>Location type</span>
        <select
          value={locationTypeId}
          onChange={(e) => setLocationTypeId(Number(e.target.value))}
        >
          {admin.locationTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.code} — {t.name_vi}
            </option>
          ))}
        </select>
      </label>
      <label className="location-master__field">
        <span>Parent location</span>
        <select
          value={parentLocationId ?? 0}
          onChange={(e) => {
            const v = Number(e.target.value)
            setParentLocationId(v > 0 ? v : null)
          }}
        >
          <option value={0}>— Root (không có parent) —</option>
          {admin.parentOptions
            .filter((p) => p.code !== detail.code)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.location_name}
              </option>
            ))}
        </select>
      </label>
      <label className="location-master__field">
        <span>Warehouse category</span>
        <select
          value={warehouseCategoryId ?? 0}
          onChange={(e) => {
            const v = Number(e.target.value)
            setWarehouseCategoryId(v > 0 ? v : null)
          }}
        >
          <option value={0}>— Không —</option>
          {admin.warehouseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name_vi}
            </option>
          ))}
        </select>
      </label>
      <label className="location-master__field">
        <span>Barcode</span>
        <input value={barcode} onChange={(e) => setBarcode(e.target.value)} />
      </label>
      <label className="location-master__field">
        <span>Capacity qty</span>
        <input
          inputMode="decimal"
          value={capacityQty}
          onChange={(e) => setCapacityQty(e.target.value)}
        />
      </label>
      <label className="location-master__field">
        <span>Capacity UoM</span>
        <select
          value={capacityUomId ?? 0}
          onChange={(e) => {
            const v = Number(e.target.value)
            setCapacityUomId(v > 0 ? v : null)
          }}
        >
          <option value={0}>— Không —</option>
          {admin.capacityUoms.map((u) => (
            <option key={u.id} value={u.id}>
              {u.code} — {u.uom_name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="location-master__btn"
        disabled={!row?.canUpdate || admin.updatePending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() =>
          admin.saveEdit({
            location_name: locationName.trim(),
            location_type_id: locationTypeId,
            parent_location_id: parentLocationId,
            warehouse_category_id: warehouseCategoryId,
            barcode: barcode.trim() === '' ? null : barcode.trim(),
            capacity_qty: capacityQty.trim() === '' ? null : Number(capacityQty),
            capacity_uom_id: capacityUomId,
          })
        }
      >
        {admin.updatePending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="location-master__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateError ? (
        <p className="location-master__error" role="alert">
          {admin.updateError.code}: {admin.updateError.message}
        </p>
      ) : null}
      {admin.updateSuccess ? (
        <p className="location-master__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>Deactivate</h4>
      <button
        type="button"
        className="location-master__btn location-master__btn--danger"
        disabled={!row?.canDeactivate}
        title={row?.deactivateDisabledReason ?? undefined}
        onClick={() => admin.setConfirmDeactivate(true)}
      >
        Deactivate location
      </button>
      {!row?.canDeactivate ? (
        <p className="location-master__muted">
          Deactivate không khả dụng
          {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
        </p>
      ) : null}

      {admin.confirmDeactivate ? (
        <div className="location-master__confirm" role="dialog" aria-label="Xác nhận deactivate">
          <p>
            Xác nhận deactivate <strong>{detail.code}</strong>? Location sẽ chuyển is_active=false
            (chỉ khi không còn child active).
          </p>
          <div className="location-master__actions">
            <button
              type="button"
              className="location-master__btn location-master__btn--danger"
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
        <p className="location-master__error" role="alert">
          {admin.deactivateError.code}: {admin.deactivateError.message}
        </p>
      ) : null}
      {admin.deactivateState === 'success' ? (
        <p className="location-master__banner" role="status">
          Đã deactivate location.
        </p>
      ) : null}
    </aside>
  )
}

export function LocationMasterPage() {
  const admin = useBinLocation()
  const banner = listStateMessage(admin.listState)

  return (
    <section className="location-master" aria-labelledby="location-master-title">
      <header className="location-master__header">
        <div>
          <p className="location-master__eyebrow">WEB-WMS-01-LOCATION · `/web/wms/locations`</p>
          <h2 id="location-master-title">Location Master</h2>
          <p className="location-master__lead">
            Quản lý cây vị trí kho/shopfloor (WMS01-001..008). Mutation gated bởi server{' '}
            <code>allowed_actions</code>.
          </p>
        </div>
        <div className="location-master__actions">
          <Link to="/home">Về trang chủ</Link>
          <button type="button" className="location-master__btn" onClick={admin.openCreate}>
            Tạo location
          </button>
        </div>
      </header>

      {admin.treeRoots.length > 0 ? (
        <div className="location-master__tree" aria-label="Location tree roots">
          <h3>Tree roots</h3>
          <ul>
            {admin.treeRoots.map((root) => (
              <li key={root.code}>
                <button
                  type="button"
                  className="location-master__linkish"
                  onClick={() => admin.selectLocation(root.code)}
                >
                  {root.code}
                </button>
                <span className="location-master__muted"> — {root.location_name}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form
        className="location-master__filters"
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
      >
        <label className="location-master__field">
          <span>Tìm location (code / tên)</span>
          <input
            value={admin.searchInput}
            onChange={(e) => admin.setSearchInput(e.target.value)}
            placeholder="WH-… / BIN-… / tên"
          />
        </label>
        <button type="submit" className="location-master__btn">
          Lọc
        </button>
      </form>

      {admin.showCreate ? (
        <div className="location-master__create">
          <h3>Tạo location mới</h3>
          <p className="location-master__muted">
            Form luôn hiển thị — server enforce quyền tạo (WMS01-003). Manager assignment bỏ trống
            (nullable; không có user-id lookup trên surface này).
          </p>
          <label className="location-master__field">
            <span>Code</span>
            <input
              value={admin.createForm.code}
              onChange={(e) => admin.setCreateForm({ ...admin.createForm, code: e.target.value })}
            />
          </label>
          <label className="location-master__field">
            <span>Tên location</span>
            <input
              value={admin.createForm.location_name}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, location_name: e.target.value })
              }
            />
          </label>
          <label className="location-master__field">
            <span>Location type</span>
            <select
              value={admin.createForm.location_type_id}
              onChange={(e) =>
                admin.setCreateForm({
                  ...admin.createForm,
                  location_type_id: Number(e.target.value),
                })
              }
            >
              <option value={0}>Chọn location type</option>
              {admin.locationTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} — {t.name_vi}
                </option>
              ))}
            </select>
          </label>
          <label className="location-master__field">
            <span>Parent location</span>
            <select
              value={admin.createForm.parent_location_id ?? 0}
              onChange={(e) => {
                const v = Number(e.target.value)
                admin.setCreateForm({
                  ...admin.createForm,
                  parent_location_id: v > 0 ? v : null,
                })
              }}
            >
              <option value={0}>— Root —</option>
              {admin.parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.location_name}
                </option>
              ))}
            </select>
          </label>
          <label className="location-master__field">
            <span>Warehouse category</span>
            <select
              value={admin.createForm.warehouse_category_id ?? 0}
              onChange={(e) => {
                const v = Number(e.target.value)
                admin.setCreateForm({
                  ...admin.createForm,
                  warehouse_category_id: v > 0 ? v : null,
                })
              }}
            >
              <option value={0}>— Không —</option>
              {admin.warehouseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name_vi}
                </option>
              ))}
            </select>
          </label>
          <label className="location-master__field">
            <span>Barcode</span>
            <input
              value={admin.createForm.barcode ?? ''}
              onChange={(e) =>
                admin.setCreateForm({
                  ...admin.createForm,
                  barcode: e.target.value,
                })
              }
            />
          </label>
          <label className="location-master__field">
            <span>Capacity qty</span>
            <input
              inputMode="decimal"
              value={
                admin.createForm.capacity_qty == null ? '' : String(admin.createForm.capacity_qty)
              }
              onChange={(e) =>
                admin.setCreateForm({
                  ...admin.createForm,
                  capacity_qty: e.target.value.trim() === '' ? null : Number(e.target.value),
                })
              }
            />
          </label>
          <label className="location-master__field">
            <span>Capacity UoM</span>
            <select
              value={admin.createForm.capacity_uom_id ?? 0}
              onChange={(e) => {
                const v = Number(e.target.value)
                admin.setCreateForm({
                  ...admin.createForm,
                  capacity_uom_id: v > 0 ? v : null,
                })
              }}
            >
              <option value={0}>— Không —</option>
              {admin.capacityUoms.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code} — {u.uom_name}
                </option>
              ))}
            </select>
          </label>
          <label className="location-master__checkbox">
            <input
              type="checkbox"
              checked={admin.createForm.is_active}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, is_active: e.target.checked })
              }
            />
            <span>Active</span>
          </label>
          <div className="location-master__actions">
            <button
              type="button"
              className="location-master__btn"
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
            <p className="location-master__error" role="alert">
              {admin.createError.code}: {admin.createError.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {banner ? (
        <p
          className="location-master__state"
          role={admin.listState === 'error' ? 'alert' : 'status'}
        >
          {banner}
          {admin.listError ? ` (${admin.listError.code})` : ''}
        </p>
      ) : null}

      {admin.listState === 'ready' ? (
        <div className="location-master__layout">
          <div className="location-master__table-wrap">
            <table className="location-master__table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Tên</th>
                  <th>Type</th>
                  <th>Parent</th>
                  <th>Category</th>
                  <th>Level</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {admin.rows.map((row) => (
                  <tr
                    key={row.code}
                    className={
                      row.code === admin.selectedCode ? 'location-master__row--active' : ''
                    }
                  >
                    <td>
                      <button
                        type="button"
                        className="location-master__linkish"
                        onClick={() => admin.selectLocation(row.code)}
                      >
                        {row.code}
                      </button>
                    </td>
                    <td>{row.locationName}</td>
                    <td>{row.locationTypeLabel}</td>
                    <td>{row.parentLabel}</td>
                    <td>{row.warehouseCategoryLabel}</td>
                    <td>{row.level}</td>
                    <td>{row.isActive ? 'yes' : 'no'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {admin.hasMore ? (
              <button type="button" className="location-master__more" onClick={admin.loadMore}>
                Tải thêm
              </button>
            ) : null}
          </div>

          {admin.detailLoading ? (
            <div className="location-master__state">Đang tải chi tiết…</div>
          ) : admin.detail ? (
            <LocationEditor key={admin.detail.code} detail={admin.detail} admin={admin} />
          ) : (
            <div className="location-master__state">Chọn location để xem chi tiết.</div>
          )}
        </div>
      ) : null}
    </section>
  )
}
