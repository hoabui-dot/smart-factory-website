import { useState } from 'react'
import { Link } from 'react-router'

import { useSupplierMaster } from '../hooks/useSupplierMaster'
import { SUPPLIER_TIERS } from '../types/supplier'
import type { SupplierItemRecord, SupplierRecord } from '../types/supplier'

import './SupplierMasterPage.css'

type Api = ReturnType<typeof useSupplierMaster>

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

function SupplierEditor({ detail, admin }: { detail: SupplierRecord; admin: Api }) {
  const [supplierName, setSupplierName] = useState(detail.supplier_name)
  const [countryCode, setCountryCode] = useState(detail.country_code)
  const [supplierTier, setSupplierTier] = useState(detail.supplier_tier)
  const [iatfCertified, setIatfCertified] = useState(detail.iatf_certified)
  const [iso9001Certified, setIso9001Certified] = useState(detail.iso9001_certified)
  const [contactEmail, setContactEmail] = useState(detail.contact_email)
  const row = admin.supplierDetailRow

  return (
    <aside className="supplier-admin__detail" aria-label="Chi tiết supplier">
      <h3>{detail.code}</h3>
      <p className="supplier-admin__muted">
        {detail.approval_status} · {detail.supplier_tier}
      </p>

      <label className="supplier-admin__field">
        <span>Tên nhà cung cấp</span>
        <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
      </label>
      <label className="supplier-admin__field">
        <span>Mã quốc gia</span>
        <input value={countryCode} onChange={(e) => setCountryCode(e.target.value.toUpperCase())} />
      </label>
      <label className="supplier-admin__field">
        <span>Tier</span>
        <select value={supplierTier} onChange={(e) => setSupplierTier(e.target.value)}>
          {SUPPLIER_TIERS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="supplier-admin__field supplier-admin__field--checkbox">
        <input
          type="checkbox"
          checked={iatfCertified}
          onChange={(e) => setIatfCertified(e.target.checked)}
        />
        <span>IATF 16949 certified</span>
      </label>
      <label className="supplier-admin__field supplier-admin__field--checkbox">
        <input
          type="checkbox"
          checked={iso9001Certified}
          onChange={(e) => setIso9001Certified(e.target.checked)}
        />
        <span>ISO 9001 certified</span>
      </label>
      <label className="supplier-admin__field">
        <span>Email QA contact</span>
        <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
      </label>

      <button
        type="button"
        className="supplier-admin__btn"
        disabled={!row?.canUpdate || admin.updateSupplierPending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() =>
          admin.saveSupplierEdit({
            supplier_name: supplierName.trim(),
            country_code: countryCode.trim(),
            supplier_tier: supplierTier,
            iatf_certified: iatfCertified,
            iso9001_certified: iso9001Certified,
            contact_email: contactEmail.trim(),
          })
        }
      >
        {admin.updateSupplierPending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="supplier-admin__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateSupplierError ? (
        <p className="supplier-admin__error" role="alert">
          {admin.updateSupplierError.code}: {admin.updateSupplierError.message}
        </p>
      ) : null}
      {admin.updateSupplierSuccess ? (
        <p className="supplier-admin__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>Deactivate</h4>
      <button
        type="button"
        className="supplier-admin__btn supplier-admin__btn--danger"
        disabled={!row?.canDeactivate}
        title={row?.deactivateDisabledReason ?? undefined}
        onClick={() => admin.setConfirmSupplierDeactivate(true)}
      >
        Deactivate supplier
      </button>
      {!row?.canDeactivate ? (
        <p className="supplier-admin__muted">
          Deactivate không khả dụng
          {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.confirmSupplierDeactivate ? (
        <div className="supplier-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
          <p>
            Xác nhận deactivate <strong>{detail.code}</strong>? Nhà cung cấp sẽ không còn dùng cho
            phiếu nhập mới.
          </p>
          <div className="supplier-admin__actions">
            <button
              type="button"
              className="supplier-admin__btn supplier-admin__btn--danger"
              disabled={admin.deactivateSupplierState === 'pending'}
              onClick={admin.deactivateSupplier}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmSupplierDeactivate(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.deactivateSupplierError ? (
        <p className="supplier-admin__error" role="alert">
          {admin.deactivateSupplierError.code}: {admin.deactivateSupplierError.message}
        </p>
      ) : null}
      {admin.deactivateSupplierState === 'success' ? (
        <p className="supplier-admin__banner" role="status">
          Đã deactivate supplier.
        </p>
      ) : null}
    </aside>
  )
}

function SupplierItemEditor({ detail, admin }: { detail: SupplierItemRecord; admin: Api }) {
  const [leadTimeDays, setLeadTimeDays] = useState(String(detail.lead_time_days))
  const [isDefault, setIsDefault] = useState(detail.is_default)
  const row = admin.supplierItemDetailRow

  return (
    <aside className="supplier-admin__detail" aria-label="Chi tiết supplier item">
      <h3>{detail.code}</h3>
      <p className="supplier-admin__muted">
        {row?.supplierLabel ?? '-'} · {row?.itemLabel ?? '-'}
      </p>

      <label className="supplier-admin__field">
        <span>Lead time (ngày)</span>
        <input inputMode="numeric" value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} />
      </label>
      <label className="supplier-admin__field supplier-admin__field--checkbox">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
        <span>Nhà cung cấp mặc định cho item này</span>
      </label>

      <button
        type="button"
        className="supplier-admin__btn"
        disabled={!row?.canUpdate || admin.updateSupplierItemPending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() =>
          admin.saveSupplierItemEdit({
            lead_time_days: Number(leadTimeDays) || 0,
            is_default: isDefault,
          })
        }
      >
        {admin.updateSupplierItemPending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="supplier-admin__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateSupplierItemError ? (
        <p className="supplier-admin__error" role="alert">
          {admin.updateSupplierItemError.code}: {admin.updateSupplierItemError.message}
        </p>
      ) : null}
      {admin.updateSupplierItemSuccess ? (
        <p className="supplier-admin__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>Deactivate</h4>
      <button
        type="button"
        className="supplier-admin__btn supplier-admin__btn--danger"
        disabled={!row?.canDeactivate}
        title={row?.deactivateDisabledReason ?? undefined}
        onClick={() => admin.setConfirmSupplierItemDeactivate(true)}
      >
        Deactivate supplier item
      </button>
      {!row?.canDeactivate ? (
        <p className="supplier-admin__muted">
          Deactivate không khả dụng
          {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.confirmSupplierItemDeactivate ? (
        <div className="supplier-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
          <p>
            Xác nhận deactivate <strong>{detail.code}</strong>?
          </p>
          <div className="supplier-admin__actions">
            <button
              type="button"
              className="supplier-admin__btn supplier-admin__btn--danger"
              disabled={admin.deactivateSupplierItemState === 'pending'}
              onClick={admin.deactivateSupplierItem}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmSupplierItemDeactivate(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.deactivateSupplierItemError ? (
        <p className="supplier-admin__error" role="alert">
          {admin.deactivateSupplierItemError.code}: {admin.deactivateSupplierItemError.message}
        </p>
      ) : null}
      {admin.deactivateSupplierItemState === 'success' ? (
        <p className="supplier-admin__banner" role="status">
          Đã deactivate supplier item.
        </p>
      ) : null}
    </aside>
  )
}

export function SupplierMasterPage() {
  const admin = useSupplierMaster()

  return (
    <section className="supplier-admin" aria-labelledby="supplier-admin-title">
      <header className="supplier-admin__header">
        <div>
          <p className="supplier-admin__eyebrow">WEB-WMS-06-SUPPLIER · `/web/wms/suppliers`</p>
          <h2 id="supplier-admin-title">Supplier Master &amp; Mill Certificate</h2>
          <p className="supplier-admin__lead">
            Quản lý supplier, supplier item và supplier evaluation (WMS06-001..013). Mutation gated
            bởi server <code>allowed_actions</code>. Import lô supplier dùng Import/Export Center.
          </p>
        </div>
        <div className="supplier-admin__actions">
          <Link to="/web/import-export">Import / Export Center</Link>
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

      <div className="supplier-admin__tabs" role="tablist" aria-label="Supplier admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'suppliers'}
          onClick={() => admin.setTab('suppliers')}
        >
          Suppliers
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'supplier_items'}
          onClick={() => admin.setTab('supplier_items')}
        >
          Supplier Items
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'supplier_evaluations'}
          onClick={() => admin.setTab('supplier_evaluations')}
        >
          Supplier Evaluations
        </button>
      </div>

      {admin.tab === 'suppliers' ? (
        <>
          <form
            className="supplier-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applySupplierSearch()
            }}
          >
            <label className="supplier-admin__field">
              <span>Tìm supplier (code / tên)</span>
              <input
                value={admin.supSearchInput}
                onChange={(e) => admin.setSupSearchInput(e.target.value)}
                placeholder="SUP-… / tên"
              />
            </label>
            <button type="submit" className="supplier-admin__btn">
              Lọc
            </button>
            <button type="button" className="supplier-admin__btn" onClick={admin.openSupplierCreate}>
              Tạo supplier
            </button>
          </form>

          {admin.showSupplierCreate ? (
            <div className="supplier-admin__create">
              <h3>Tạo supplier mới</h3>
              <p className="supplier-admin__muted">
                Form luôn hiển thị — server enforce quyền tạo (WMS06-003). approval_status khởi tạo
                CONDITIONAL, server derive.
              </p>
              <label className="supplier-admin__field">
                <span>Code</span>
                <input
                  value={admin.supplierCreateForm.code}
                  onChange={(e) =>
                    admin.setSupplierCreateForm({ ...admin.supplierCreateForm, code: e.target.value })
                  }
                />
              </label>
              <label className="supplier-admin__field">
                <span>Tên nhà cung cấp</span>
                <input
                  value={admin.supplierCreateForm.supplier_name}
                  onChange={(e) =>
                    admin.setSupplierCreateForm({
                      ...admin.supplierCreateForm,
                      supplier_name: e.target.value,
                    })
                  }
                />
              </label>
              <label className="supplier-admin__field">
                <span>Mã quốc gia</span>
                <input
                  value={admin.supplierCreateForm.country_code}
                  onChange={(e) =>
                    admin.setSupplierCreateForm({
                      ...admin.supplierCreateForm,
                      country_code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="VN"
                />
              </label>
              <label className="supplier-admin__field">
                <span>Tier</span>
                <select
                  value={admin.supplierCreateForm.supplier_tier}
                  onChange={(e) =>
                    admin.setSupplierCreateForm({
                      ...admin.supplierCreateForm,
                      supplier_tier: e.target.value,
                    })
                  }
                >
                  {SUPPLIER_TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="supplier-admin__field supplier-admin__field--checkbox">
                <input
                  type="checkbox"
                  checked={admin.supplierCreateForm.iatf_certified}
                  onChange={(e) =>
                    admin.setSupplierCreateForm({
                      ...admin.supplierCreateForm,
                      iatf_certified: e.target.checked,
                    })
                  }
                />
                <span>IATF 16949 certified</span>
              </label>
              <label className="supplier-admin__field supplier-admin__field--checkbox">
                <input
                  type="checkbox"
                  checked={admin.supplierCreateForm.iso9001_certified}
                  onChange={(e) =>
                    admin.setSupplierCreateForm({
                      ...admin.supplierCreateForm,
                      iso9001_certified: e.target.checked,
                    })
                  }
                />
                <span>ISO 9001 certified</span>
              </label>
              <label className="supplier-admin__field">
                <span>Email QA contact</span>
                <input
                  value={admin.supplierCreateForm.contact_email}
                  onChange={(e) =>
                    admin.setSupplierCreateForm({
                      ...admin.supplierCreateForm,
                      contact_email: e.target.value,
                    })
                  }
                />
              </label>
              <div className="supplier-admin__actions">
                <button
                  type="button"
                  className="supplier-admin__btn"
                  disabled={admin.supplierCreateErrors.length > 0 || admin.createSupplierPending}
                  onClick={() => admin.createSupplier()}
                >
                  {admin.createSupplierPending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closeSupplierCreate}>
                  Hủy
                </button>
              </div>
              {admin.createSupplierError ? (
                <p className="supplier-admin__error" role="alert">
                  {admin.createSupplierError.code}: {admin.createSupplierError.message}
                </p>
              ) : null}
            </div>
          ) : null}

          {(() => {
            const banner = listStateMessage(admin.supplierListState, 'supplier')
            return banner ? (
              <p
                className="supplier-admin__state"
                role={admin.supplierListState === 'error' ? 'alert' : 'status'}
              >
                {banner}
                {admin.supplierListError ? ` (${admin.supplierListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.supplierListState === 'ready' ? (
            <div className="supplier-admin__layout">
              <div className="supplier-admin__table-wrap">
                <table className="supplier-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Tên</th>
                      <th>Tier</th>
                      <th>Approval</th>
                      <th>Quốc gia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.supplierRows.map((row) => (
                      <tr
                        key={row.code}
                        className={
                          row.code === admin.selectedSupplierCode ? 'supplier-admin__row--active' : ''
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="supplier-admin__linkish"
                            onClick={() => admin.selectSupplier(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.supplierName}</td>
                        <td>{row.supplierTier}</td>
                        <td>{row.approvalStatus}</td>
                        <td>{row.countryCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.supplierHasMore ? (
                  <button
                    type="button"
                    className="supplier-admin__more"
                    onClick={admin.supplierLoadMore}
                  >
                    Tải thêm
                  </button>
                ) : null}
              </div>

              {admin.supplierDetailLoading ? (
                <div className="supplier-admin__state">Đang tải chi tiết…</div>
              ) : admin.supplierDetail ? (
                <SupplierEditor key={admin.supplierDetail.code} detail={admin.supplierDetail} admin={admin} />
              ) : (
                <div className="supplier-admin__state">Chọn supplier để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'supplier_items' ? (
        <>
          <form
            className="supplier-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applySupplierItemSearch()
            }}
          >
            <label className="supplier-admin__field">
              <span>Tìm supplier item (code)</span>
              <input
                value={admin.siSearchInput}
                onChange={(e) => admin.setSiSearchInput(e.target.value)}
                placeholder="SI-…"
              />
            </label>
            <button type="submit" className="supplier-admin__btn">
              Lọc
            </button>
            <button
              type="button"
              className="supplier-admin__btn"
              onClick={admin.openSupplierItemCreate}
            >
              Tạo supplier item
            </button>
          </form>

          {admin.showSupplierItemCreate ? (
            <div className="supplier-admin__create">
              <h3>Tạo supplier item mới</h3>
              <p className="supplier-admin__muted">
                Form luôn hiển thị — server enforce quyền tạo (WMS06-008).
              </p>
              <label className="supplier-admin__field">
                <span>Code</span>
                <input
                  value={admin.supplierItemCreateForm.code}
                  onChange={(e) =>
                    admin.setSupplierItemCreateForm({
                      ...admin.supplierItemCreateForm,
                      code: e.target.value,
                    })
                  }
                />
              </label>
              <label className="supplier-admin__field">
                <span>Supplier</span>
                <select
                  value={admin.supplierItemCreateForm.supplier_id}
                  onChange={(e) =>
                    admin.setSupplierItemCreateForm({
                      ...admin.supplierItemCreateForm,
                      supplier_id: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>Chọn supplier</option>
                  {admin.supplierOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.supplier_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="supplier-admin__field">
                <span>Item</span>
                <select
                  value={admin.supplierItemCreateForm.item_id}
                  onChange={(e) =>
                    admin.setSupplierItemCreateForm({
                      ...admin.supplierItemCreateForm,
                      item_id: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>Chọn item</option>
                  {admin.itemOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} — {item.item_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="supplier-admin__field">
                <span>Lead time (ngày)</span>
                <input
                  inputMode="numeric"
                  value={admin.supplierItemCreateForm.lead_time_days || ''}
                  onChange={(e) =>
                    admin.setSupplierItemCreateForm({
                      ...admin.supplierItemCreateForm,
                      lead_time_days: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="supplier-admin__field supplier-admin__field--checkbox">
                <input
                  type="checkbox"
                  checked={admin.supplierItemCreateForm.is_default}
                  onChange={(e) =>
                    admin.setSupplierItemCreateForm({
                      ...admin.supplierItemCreateForm,
                      is_default: e.target.checked,
                    })
                  }
                />
                <span>Nhà cung cấp mặc định cho item này</span>
              </label>
              <div className="supplier-admin__actions">
                <button
                  type="button"
                  className="supplier-admin__btn"
                  disabled={
                    admin.supplierItemCreateErrors.length > 0 || admin.createSupplierItemPending
                  }
                  onClick={() => admin.createSupplierItem()}
                >
                  {admin.createSupplierItemPending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closeSupplierItemCreate}>
                  Hủy
                </button>
              </div>
              {admin.createSupplierItemError ? (
                <p className="supplier-admin__error" role="alert">
                  {admin.createSupplierItemError.code}: {admin.createSupplierItemError.message}
                </p>
              ) : null}
            </div>
          ) : null}

          {(() => {
            const banner = listStateMessage(admin.supplierItemListState, 'supplier item')
            return banner ? (
              <p
                className="supplier-admin__state"
                role={admin.supplierItemListState === 'error' ? 'alert' : 'status'}
              >
                {banner}
                {admin.supplierItemListError ? ` (${admin.supplierItemListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.supplierItemListState === 'ready' ? (
            <div className="supplier-admin__layout">
              <div className="supplier-admin__table-wrap">
                <table className="supplier-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Supplier</th>
                      <th>Item</th>
                      <th>Lead time</th>
                      <th>Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.supplierItemRows.map((row) => (
                      <tr
                        key={row.code}
                        className={
                          row.code === admin.selectedSupplierItemCode
                            ? 'supplier-admin__row--active'
                            : ''
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="supplier-admin__linkish"
                            onClick={() => admin.selectSupplierItem(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.supplierLabel}</td>
                        <td>{row.itemLabel}</td>
                        <td>{row.leadTimeDays} ngày</td>
                        <td>{row.isDefault ? 'Có' : 'Không'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.supplierItemHasMore ? (
                  <button
                    type="button"
                    className="supplier-admin__more"
                    onClick={admin.supplierItemLoadMore}
                  >
                    Tải thêm
                  </button>
                ) : null}
              </div>

              {admin.supplierItemDetailLoading ? (
                <div className="supplier-admin__state">Đang tải chi tiết…</div>
              ) : admin.supplierItemDetail ? (
                <SupplierItemEditor
                  key={admin.supplierItemDetail.code}
                  detail={admin.supplierItemDetail}
                  admin={admin}
                />
              ) : (
                <div className="supplier-admin__state">Chọn supplier item để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'supplier_evaluations' ? (
        <>
          <form
            className="supplier-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyEvaluationSearch()
            }}
          >
            <label className="supplier-admin__field">
              <span>Tìm evaluation (code / kỳ đánh giá)</span>
              <input
                value={admin.evSearchInput}
                onChange={(e) => admin.setEvSearchInput(e.target.value)}
                placeholder="EVAL-… / 2026-Q2"
              />
            </label>
            <button type="submit" className="supplier-admin__btn">
              Lọc
            </button>
            <button type="button" className="supplier-admin__btn" onClick={admin.openEvaluationCreate}>
              Tạo evaluation
            </button>
          </form>

          <p className="supplier-admin__muted">
            Supplier evaluation là append-only trong Phase 1 — không có Edit/Delete.
          </p>

          {admin.showEvaluationCreate ? (
            <div className="supplier-admin__create">
              <h3>Tạo supplier evaluation mới</h3>
              <p className="supplier-admin__muted">
                Form luôn hiển thị — server enforce quyền (WMS06-013). total_score/grade server
                derive; approval_status của supplier cập nhật atomic theo evaluation hiệu lực gần
                nhất.
              </p>
              <label className="supplier-admin__field">
                <span>Code</span>
                <input
                  value={admin.evaluationCreateForm.code}
                  onChange={(e) =>
                    admin.setEvaluationCreateForm({
                      ...admin.evaluationCreateForm,
                      code: e.target.value,
                    })
                  }
                />
              </label>
              <label className="supplier-admin__field">
                <span>Supplier</span>
                <select
                  value={admin.evaluationCreateForm.supplier_id}
                  onChange={(e) =>
                    admin.setEvaluationCreateForm({
                      ...admin.evaluationCreateForm,
                      supplier_id: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>Chọn supplier</option>
                  {admin.supplierOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.supplier_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="supplier-admin__field">
                <span>Kỳ đánh giá</span>
                <input
                  value={admin.evaluationCreateForm.evaluation_period}
                  onChange={(e) =>
                    admin.setEvaluationCreateForm({
                      ...admin.evaluationCreateForm,
                      evaluation_period: e.target.value,
                    })
                  }
                  placeholder="2026-Q2"
                />
              </label>
              <label className="supplier-admin__field">
                <span>Quality score (0-100)</span>
                <input
                  inputMode="decimal"
                  value={admin.evaluationCreateForm.quality_score || ''}
                  onChange={(e) =>
                    admin.setEvaluationCreateForm({
                      ...admin.evaluationCreateForm,
                      quality_score: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="supplier-admin__field">
                <span>Delivery score (0-100)</span>
                <input
                  inputMode="decimal"
                  value={admin.evaluationCreateForm.delivery_score || ''}
                  onChange={(e) =>
                    admin.setEvaluationCreateForm({
                      ...admin.evaluationCreateForm,
                      delivery_score: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="supplier-admin__field">
                <span>Service score (0-100)</span>
                <input
                  inputMode="decimal"
                  value={admin.evaluationCreateForm.service_score || ''}
                  onChange={(e) =>
                    admin.setEvaluationCreateForm({
                      ...admin.evaluationCreateForm,
                      service_score: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="supplier-admin__field">
                <span>Ngày đánh giá</span>
                <input
                  type="date"
                  value={admin.evaluationCreateForm.evaluated_at}
                  onChange={(e) =>
                    admin.setEvaluationCreateForm({
                      ...admin.evaluationCreateForm,
                      evaluated_at: e.target.value,
                    })
                  }
                />
              </label>
              <label className="supplier-admin__field">
                <span>Action required (grade C/D)</span>
                <input
                  value={admin.evaluationCreateForm.action_required ?? ''}
                  onChange={(e) =>
                    admin.setEvaluationCreateForm({
                      ...admin.evaluationCreateForm,
                      action_required: e.target.value || null,
                    })
                  }
                />
              </label>
              <div className="supplier-admin__actions">
                <button
                  type="button"
                  className="supplier-admin__btn"
                  disabled={admin.evaluationCreateErrors.length > 0 || admin.createEvaluationPending}
                  onClick={() => admin.createEvaluation()}
                >
                  {admin.createEvaluationPending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closeEvaluationCreate}>
                  Hủy
                </button>
              </div>
              {admin.createEvaluationError ? (
                <p className="supplier-admin__error" role="alert">
                  {admin.createEvaluationError.code}: {admin.createEvaluationError.message}
                </p>
              ) : null}
            </div>
          ) : null}

          {(() => {
            const banner = listStateMessage(admin.evaluationListState, 'evaluation')
            return banner ? (
              <p
                className="supplier-admin__state"
                role={admin.evaluationListState === 'error' ? 'alert' : 'status'}
              >
                {banner}
                {admin.evaluationListError ? ` (${admin.evaluationListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.evaluationListState === 'ready' ? (
            <div className="supplier-admin__layout">
              <div className="supplier-admin__table-wrap">
                <table className="supplier-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Supplier</th>
                      <th>Kỳ</th>
                      <th>Total score</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.evaluationRows.map((row) => (
                      <tr
                        key={row.code}
                        className={
                          row.code === admin.selectedEvaluationCode
                            ? 'supplier-admin__row--active'
                            : ''
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="supplier-admin__linkish"
                            onClick={() => admin.selectEvaluation(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.supplierLabel}</td>
                        <td>{row.evaluationPeriod}</td>
                        <td>{row.totalScore}</td>
                        <td>{row.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.evaluationHasMore ? (
                  <button
                    type="button"
                    className="supplier-admin__more"
                    onClick={admin.evaluationLoadMore}
                  >
                    Tải thêm
                  </button>
                ) : null}
              </div>

              {admin.evaluationDetailLoading ? (
                <div className="supplier-admin__state">Đang tải chi tiết…</div>
              ) : admin.evaluationDetailRow ? (
                <aside className="supplier-admin__detail" aria-label="Chi tiết evaluation">
                  <h3>{admin.evaluationDetailRow.code}</h3>
                  <p className="supplier-admin__muted">
                    {admin.evaluationDetailRow.supplierLabel} · {admin.evaluationDetailRow.evaluationPeriod}
                  </p>
                  <dl className="supplier-admin__meta">
                    <div>
                      <dt>Quality score</dt>
                      <dd>{admin.evaluationDetailRow.qualityScore}</dd>
                    </div>
                    <div>
                      <dt>Delivery score</dt>
                      <dd>{admin.evaluationDetailRow.deliveryScore}</dd>
                    </div>
                    <div>
                      <dt>Service score</dt>
                      <dd>{admin.evaluationDetailRow.serviceScore}</dd>
                    </div>
                    <div>
                      <dt>Total score</dt>
                      <dd>{admin.evaluationDetailRow.totalScore}</dd>
                    </div>
                    <div>
                      <dt>Grade</dt>
                      <dd>{admin.evaluationDetailRow.grade}</dd>
                    </div>
                    <div>
                      <dt>Evaluated by</dt>
                      <dd>{admin.evaluationDetailRow.evaluatedByLabel}</dd>
                    </div>
                    <div>
                      <dt>Evaluated at</dt>
                      <dd>{admin.evaluationDetailRow.evaluatedAt}</dd>
                    </div>
                    <div>
                      <dt>Action required</dt>
                      <dd>{admin.evaluationDetailRow.actionRequired}</dd>
                    </div>
                  </dl>
                  <p className="supplier-admin__muted">
                    Append-only — không có Edit/Delete cho supplier evaluation trong Phase 1.
                  </p>
                </aside>
              ) : (
                <div className="supplier-admin__state">Chọn evaluation để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
