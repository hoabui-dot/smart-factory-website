import { useState } from 'react'
import { Link } from 'react-router'

import { useBom } from '../hooks/useBom'
import type { BomHeaderDetailRecord, BomTreeNode } from '../types/bom'

import './BomPage.css'

type Api = ReturnType<typeof useBom>

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải danh mục BOM…'
    case 'empty':
      return 'Chưa có BOM nào.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem danh mục BOM.'
    case 'error':
      return 'Không tải được danh mục BOM. Thử lại sau.'
    default:
      return ''
  }
}

function BomTreeView({ node }: { node: BomTreeNode }) {
  return (
    <div className="bom-admin__tree-node">
      <strong>{node.code}</strong>{' '}
      <span className="bom-admin__muted">
        ({node.product_item_code ?? node.product_item_id} · {node.status})
      </span>
      {node.lines.length > 0 ? (
        <ul className="bom-admin__tree">
          {node.lines.map((line) => (
            <li key={line.code}>
              {line.material_item_code ?? line.material_item_id} × {line.qty_per_unit}{' '}
              {line.uom_code ?? ''}
              {line.children ? <BomTreeView node={line.children} /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function BomEditor({ detail, admin }: { detail: BomHeaderDetailRecord; admin: Api }) {
  const [version, setVersion] = useState(detail.version)
  const [effectiveFrom, setEffectiveFrom] = useState(detail.effective_from.slice(0, 10))
  const row = admin.detailRow

  return (
    <aside className="bom-admin__detail" aria-label="Chi tiết BOM">
      <h3>{detail.code}</h3>
      <p className="bom-admin__muted">
        {row?.productItemLabel ?? '-'} · {detail.status} · v{detail.version}
      </p>
      <dl className="bom-admin__meta">
        <div>
          <dt>Effective from</dt>
          <dd>{detail.effective_from}</dd>
        </div>
        <div>
          <dt>Effective to</dt>
          <dd>{detail.effective_to ?? '-'}</dd>
        </div>
        <div>
          <dt>Approved by</dt>
          <dd>{detail.approved_by == null ? '-' : `user #${detail.approved_by}`}</dd>
        </div>
      </dl>

      <h4>Lines ({admin.lineRows.length})</h4>
      {admin.lineRows.length === 0 ? (
        <p className="bom-admin__muted">
          Chưa có dòng vật tư. Thêm/sửa lô dòng qua BOM_IMPORT tại Import/Export Center.
        </p>
      ) : (
        <table className="bom-admin__table bom-admin__table--compact">
          <thead>
            <tr>
              <th>Line</th>
              <th>Vật tư</th>
              <th>Qty/unit</th>
              <th>Scrap %</th>
              <th>UoM</th>
            </tr>
          </thead>
          <tbody>
            {admin.lineRows.map((line) => (
              <tr key={line.code}>
                <td>{line.code}</td>
                <td>{line.materialItemLabel}</td>
                <td>{line.qtyPerUnit}</td>
                <td>{line.scrapRate}</td>
                <td>{line.uomLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button type="button" className="bom-admin__btn" onClick={admin.toggleTree}>
        {admin.showTree ? 'Ẩn cây BOM' : 'Xem cây BOM'}
      </button>
      {admin.showTree ? (
        admin.treeLoading ? (
          <p className="bom-admin__muted">Đang tải cây BOM…</p>
        ) : admin.tree ? (
          <BomTreeView node={admin.tree} />
        ) : null
      ) : null}

      <h4>Sửa (chỉ khi DRAFT)</h4>
      <label className="bom-admin__field">
        <span>Version</span>
        <input value={version} onChange={(e) => setVersion(e.target.value)} />
      </label>
      <label className="bom-admin__field">
        <span>Effective from</span>
        <input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
      </label>
      <button
        type="button"
        className="bom-admin__btn"
        disabled={!row?.canUpdate || admin.updatePending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() =>
          admin.saveEdit({
            version: version.trim(),
            effective_from: effectiveFrom,
          })
        }
      >
        {admin.updatePending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="bom-admin__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateError ? (
        <p className="bom-admin__error" role="alert">
          {admin.updateError.code}: {admin.updateError.message}
        </p>
      ) : null}
      {admin.updateSuccess ? (
        <p className="bom-admin__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>State transitions</h4>
      <div className="bom-admin__actions">
        <button
          type="button"
          className="bom-admin__btn"
          disabled={!row?.canRelease}
          title={row?.releaseDisabledReason ?? undefined}
          onClick={() => admin.setConfirmRelease(true)}
        >
          Release
        </button>
        <button
          type="button"
          className="bom-admin__btn"
          disabled={!row?.canCopy}
          title={row?.copyDisabledReason ?? undefined}
          onClick={admin.openCopy}
        >
          Copy
        </button>
        <button
          type="button"
          className="bom-admin__btn bom-admin__btn--danger"
          disabled={!row?.canObsolete}
          title={row?.obsoleteDisabledReason ?? undefined}
          onClick={admin.openObsolete}
        >
          Obsolete
        </button>
        <button
          type="button"
          className="bom-admin__btn bom-admin__btn--danger"
          disabled={!row?.canDeactivate}
          title={row?.deactivateDisabledReason ?? undefined}
          onClick={() => admin.setConfirmDeactivate(true)}
        >
          Deactivate
        </button>
      </div>

      {admin.confirmRelease ? (
        <div className="bom-admin__confirm" role="dialog" aria-label="Xác nhận release">
          <p>
            Xác nhận release <strong>{detail.code}</strong>? BOM RELEASED trước đó của cùng sản phẩm
            sẽ chuyển sang OBSOLETE.
          </p>
          <div className="bom-admin__actions">
            <button
              type="button"
              disabled={admin.releaseState === 'pending'}
              onClick={admin.releaseBom}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmRelease(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.releaseError ? (
        <p className="bom-admin__error" role="alert">
          {admin.releaseError.code}: {admin.releaseError.message}
        </p>
      ) : null}

      {admin.showCopy ? (
        <div className="bom-admin__create">
          <h4>Copy BOM sang version mới</h4>
          <label className="bom-admin__field">
            <span>New code</span>
            <input
              value={admin.copyForm.new_code}
              onChange={(e) => admin.setCopyForm({ ...admin.copyForm, new_code: e.target.value })}
            />
          </label>
          <label className="bom-admin__field">
            <span>New version</span>
            <input
              value={admin.copyForm.new_version}
              onChange={(e) => admin.setCopyForm({ ...admin.copyForm, new_version: e.target.value })}
            />
          </label>
          <label className="bom-admin__field">
            <span>Effective from</span>
            <input
              type="date"
              value={admin.copyForm.effective_from}
              onChange={(e) =>
                admin.setCopyForm({ ...admin.copyForm, effective_from: e.target.value })
              }
            />
          </label>
          <div className="bom-admin__actions">
            <button
              type="button"
              disabled={admin.copyErrors.length > 0 || admin.copyPending}
              onClick={admin.copyBom}
            >
              {admin.copyPending ? 'Đang copy…' : 'Copy'}
            </button>
            <button type="button" onClick={admin.closeCopy}>
              Hủy
            </button>
          </div>
          {admin.copyError ? (
            <p className="bom-admin__error" role="alert">
              {admin.copyError.code}: {admin.copyError.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {admin.showObsolete ? (
        <div className="bom-admin__confirm" role="dialog" aria-label="Xác nhận obsolete">
          <p>
            Xác nhận obsolete <strong>{detail.code}</strong>? BOM sẽ không còn dùng cho lệnh sản xuất
            mới.
          </p>
          <label className="bom-admin__field">
            <span>Effective to</span>
            <input
              type="date"
              value={admin.obsoleteEffectiveTo}
              onChange={(e) => admin.setObsoleteEffectiveTo(e.target.value)}
            />
          </label>
          <div className="bom-admin__actions">
            <button
              type="button"
              className="bom-admin__btn--danger"
              disabled={admin.obsoleteErrors.length > 0 || admin.obsoletePending}
              onClick={admin.obsoleteBom}
            >
              {admin.obsoletePending ? 'Đang xử lý…' : 'Xác nhận'}
            </button>
            <button type="button" onClick={admin.closeObsolete}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.obsoleteError ? (
        <p className="bom-admin__error" role="alert">
          {admin.obsoleteError.code}: {admin.obsoleteError.message}
        </p>
      ) : null}
      {admin.obsoleteSuccess ? (
        <p className="bom-admin__banner" role="status">
          Đã obsolete BOM.
        </p>
      ) : null}

      {admin.confirmDeactivate ? (
        <div className="bom-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
          <p>
            Xác nhận deactivate <strong>{detail.code}</strong>? BOM sẽ chuyển sang OBSOLETE.
          </p>
          <div className="bom-admin__actions">
            <button
              type="button"
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
        <p className="bom-admin__error" role="alert">
          {admin.deactivateError.code}: {admin.deactivateError.message}
        </p>
      ) : null}
      {admin.deactivateState === 'success' ? (
        <p className="bom-admin__banner" role="status">
          Đã deactivate BOM.
        </p>
      ) : null}
    </aside>
  )
}

export function BomPage() {
  const admin = useBom()
  const banner = listStateMessage(admin.listState)

  return (
    <section className="bom-admin" aria-labelledby="bom-admin-title">
      <header className="bom-admin__header">
        <div>
          <p className="bom-admin__eyebrow">WEB-MES-02-BOM · `/web/mes/boms`</p>
          <h2 id="bom-admin-title">BOM Đa cấp</h2>
          <p className="bom-admin__lead">
            Quản lý BOM đa cấp, version và line vật tư (MES02-001..009). Mutation gated bởi server{' '}
            <code>allowed_actions</code>. Line vật tư quản lý qua BOM_IMPORT tại Import/Export Center.
          </p>
        </div>
        <div className="bom-admin__actions">
          <Link to="/web/import-export">Import / Export Center</Link>
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

      <form
        className="bom-admin__filters"
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
      >
        <label className="bom-admin__field">
          <span>Tìm BOM (code / sản phẩm)</span>
          <input
            value={admin.searchInput}
            onChange={(e) => admin.setSearchInput(e.target.value)}
            placeholder="BOM-… / FG-…"
          />
        </label>
        <button type="submit" className="bom-admin__btn">
          Lọc
        </button>
        <button type="button" className="bom-admin__btn" onClick={admin.openCreate}>
          Tạo BOM
        </button>
      </form>

      {admin.showCreate ? (
        <div className="bom-admin__create">
          <h3>Tạo BOM mới</h3>
          <p className="bom-admin__muted">Form luôn hiển thị — server enforce quyền tạo (MES02-003).</p>
          <label className="bom-admin__field">
            <span>Code</span>
            <input
              value={admin.createForm.code}
              onChange={(e) => admin.setCreateForm({ ...admin.createForm, code: e.target.value })}
            />
          </label>
          <label className="bom-admin__field">
            <span>Sản phẩm (item)</span>
            <select
              value={admin.createForm.product_item_id}
              onChange={(e) =>
                admin.setCreateForm({
                  ...admin.createForm,
                  product_item_id: Number(e.target.value),
                })
              }
            >
              <option value={0}>Chọn sản phẩm</option>
              {admin.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} — {item.item_name}
                </option>
              ))}
            </select>
          </label>
          <label className="bom-admin__field">
            <span>Version</span>
            <input
              value={admin.createForm.version}
              onChange={(e) => admin.setCreateForm({ ...admin.createForm, version: e.target.value })}
            />
          </label>
          <label className="bom-admin__field">
            <span>Status khởi tạo</span>
            <select
              value={admin.createForm.status}
              onChange={(e) => admin.setCreateForm({ ...admin.createForm, status: e.target.value })}
            >
              <option value="DRAFT">DRAFT</option>
            </select>
          </label>
          <label className="bom-admin__field">
            <span>Effective from</span>
            <input
              type="date"
              value={admin.createForm.effective_from}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, effective_from: e.target.value })
              }
            />
          </label>
          <div className="bom-admin__actions">
            <button
              type="button"
              className="bom-admin__btn"
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
            <p className="bom-admin__error" role="alert">
              {admin.createError.code}: {admin.createError.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {banner ? (
        <p className="bom-admin__state" role={admin.listState === 'error' ? 'alert' : 'status'}>
          {banner}
          {admin.listError ? ` (${admin.listError.code})` : ''}
        </p>
      ) : null}

      {admin.listState === 'ready' ? (
        <div className="bom-admin__layout">
          <div className="bom-admin__table-wrap">
            <table className="bom-admin__table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Sản phẩm</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Effective from</th>
                </tr>
              </thead>
              <tbody>
                {admin.rows.map((row) => (
                  <tr
                    key={row.code}
                    className={row.code === admin.selectedCode ? 'bom-admin__row--active' : ''}
                  >
                    <td>
                      <button
                        type="button"
                        className="bom-admin__linkish"
                        onClick={() => admin.selectBom(row.code)}
                      >
                        {row.code}
                      </button>
                    </td>
                    <td>{row.productItemLabel}</td>
                    <td>{row.version}</td>
                    <td>{row.status}</td>
                    <td>{row.effectiveFrom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {admin.hasMore ? (
              <button type="button" className="bom-admin__more" onClick={admin.loadMore}>
                Tải thêm
              </button>
            ) : null}
          </div>

          {admin.detailLoading ? (
            <div className="bom-admin__state">Đang tải chi tiết…</div>
          ) : admin.detail ? (
            <BomEditor key={admin.detail.code} detail={admin.detail} admin={admin} />
          ) : (
            <div className="bom-admin__state">Chọn BOM để xem chi tiết.</div>
          )}
        </div>
      ) : null}
    </section>
  )
}
