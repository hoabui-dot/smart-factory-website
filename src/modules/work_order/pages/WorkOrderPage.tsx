import { useState } from 'react'
import { Link } from 'react-router'

import { useWorkOrder } from '../hooks/useWorkOrder'
import type { WorkOrderRecord } from '../types/workOrder'

import './WorkOrderPage.css'

type Api = ReturnType<typeof useWorkOrder>

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải danh sách Work Order…'
    case 'empty':
      return 'Chưa có Work Order nào.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem danh sách Work Order.'
    case 'error':
      return 'Không tải được danh sách Work Order. Thử lại sau.'
    default:
      return ''
  }
}

function WorkOrderEditor({ detail, admin }: { detail: WorkOrderRecord; admin: Api }) {
  const [itemId, setItemId] = useState(detail.item_id)
  const [itemRevisionId, setItemRevisionId] = useState<number | null>(detail.item_revision_id ?? null)
  const [plannedQty, setPlannedQty] = useState(detail.planned_qty)
  const [plannedStart, setPlannedStart] = useState(detail.planned_start.slice(0, 16))
  const row = admin.detailRow

  return (
    <aside className="wo-admin__detail" aria-label="Chi tiết Work Order">
      <h3>{detail.code}</h3>
      <p className="wo-admin__muted">
        {row?.itemLabel ?? '-'} · rev {row?.itemRevisionLabel ?? '-'} · {detail.status}
      </p>
      <p>
        <Link to={`/web/shared/wo-360/${detail.id}`}>Mở WO 360</Link>
      </p>
      <dl className="wo-admin__meta">
        <div>
          <dt>BOM</dt>
          <dd>{row?.bomLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Routing</dt>
          <dd>{row?.routingLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Planned qty</dt>
          <dd>{detail.planned_qty}</dd>
        </div>
        <div>
          <dt>Produced / Scrap</dt>
          <dd>
            {detail.produced_qty} / {detail.scrap_qty}
          </dd>
        </div>
        <div>
          <dt>Planned start</dt>
          <dd>{detail.planned_start}</dd>
        </div>
        <div>
          <dt>Actual start</dt>
          <dd>{detail.actual_start ?? '-'}</dd>
        </div>
        <div>
          <dt>Actual end</dt>
          <dd>{detail.actual_end ?? '-'}</dd>
        </div>
        <div>
          <dt>Released at</dt>
          <dd>{detail.released_at ?? '-'}</dd>
        </div>
        <div>
          <dt>Material ready at</dt>
          <dd>{detail.material_ready_at ?? '-'}</dd>
        </div>
      </dl>

      <h4>Yêu cầu cấp vật tư ({admin.materialRequestRows.length})</h4>
      {admin.materialRequestsLoading ? (
        <p className="wo-admin__muted">Đang tải…</p>
      ) : admin.materialRequestRows.length === 0 ? (
        <p className="wo-admin__muted">
          Chưa có yêu cầu cấp vật tư (sinh tự động khi release nếu WO cần vật tư).
        </p>
      ) : (
        <table className="wo-admin__table wo-admin__table--compact">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Vật tư</th>
              <th>SL cần</th>
              <th>UoM</th>
              <th>Vị trí đích</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {admin.materialRequestRows.map((mr) => (
              <tr key={mr.code}>
                <td>{mr.code}</td>
                <td>{mr.itemLabel}</td>
                <td>{mr.requiredQty}</td>
                <td>{mr.uomLabel}</td>
                <td>{mr.targetLocationLabel}</td>
                <td>{mr.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h4>Sửa (chỉ khi DRAFT/PLANNED)</h4>
      <label className="wo-admin__field">
        <span>Sản phẩm (item)</span>
        <select
          value={itemId}
          onChange={(e) => {
            const id = Number(e.target.value)
            setItemId(id)
            setItemRevisionId(null)
          }}
        >
          {admin.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} — {item.item_name}
            </option>
          ))}
        </select>
      </label>
      <label className="wo-admin__field">
        <span>Item revision</span>
        <select
          value={itemRevisionId ?? 0}
          onChange={(e) => setItemRevisionId(Number(e.target.value) || null)}
        >
          <option value={0}>(giữ hiện tại)</option>
          {admin.detailRevisions.map((rev) => (
            <option key={rev.id} value={rev.id}>
              {rev.code}
            </option>
          ))}
        </select>
      </label>
      <label className="wo-admin__field">
        <span>Planned qty</span>
        <input
          type="number"
          min={1}
          value={plannedQty}
          onChange={(e) => setPlannedQty(Number(e.target.value))}
        />
      </label>
      <label className="wo-admin__field">
        <span>Planned start</span>
        <input
          type="datetime-local"
          value={plannedStart}
          onChange={(e) => setPlannedStart(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="wo-admin__btn"
        disabled={!row?.canUpdate || admin.updatePending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() =>
          admin.saveEdit({
            item_id: itemId,
            item_revision_id: itemRevisionId,
            planned_qty: plannedQty,
            planned_start: plannedStart,
          })
        }
      >
        {admin.updatePending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="wo-admin__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateError ? (
        <p className="wo-admin__error" role="alert">
          {admin.updateError.code}: {admin.updateError.message}
        </p>
      ) : null}
      {admin.updateSuccess ? (
        <p className="wo-admin__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>State transitions (state machine — không PATCH status)</h4>
      <div className="wo-admin__actions">
        <button
          type="button"
          className="wo-admin__btn"
          disabled={!row?.canPlan}
          title={row?.planDisabledReason ?? undefined}
          onClick={() => admin.setConfirmPlan(true)}
        >
          Plan
        </button>
        <button
          type="button"
          className="wo-admin__btn"
          disabled={!row?.canRelease}
          title={row?.releaseDisabledReason ?? undefined}
          onClick={() => admin.setConfirmRelease(true)}
        >
          Release
        </button>
        <button
          type="button"
          className="wo-admin__btn"
          disabled={!row?.canPause}
          title={row?.pauseDisabledReason ?? undefined}
          onClick={admin.openPause}
        >
          Pause
        </button>
        <button
          type="button"
          className="wo-admin__btn"
          disabled={!row?.canResume}
          title={row?.resumeDisabledReason ?? undefined}
          onClick={() => admin.setConfirmResume(true)}
        >
          Resume
        </button>
        <button
          type="button"
          className="wo-admin__btn"
          disabled={!row?.canClose}
          title={row?.closeDisabledReason ?? undefined}
          onClick={() => admin.setConfirmClose(true)}
        >
          Close
        </button>
        <button
          type="button"
          className="wo-admin__btn wo-admin__btn--danger"
          disabled={!row?.canCancel}
          title={row?.cancelDisabledReason ?? undefined}
          onClick={admin.openCancel}
        >
          Cancel
        </button>
      </div>

      {admin.confirmPlan ? (
        <div className="wo-admin__confirm" role="dialog" aria-label="Xác nhận plan">
          <p>
            Xác nhận plan <strong>{detail.code}</strong>? WO sẽ chuyển DRAFT → PLANNED.
          </p>
          <div className="wo-admin__actions">
            <button type="button" disabled={admin.planState === 'pending'} onClick={admin.plan}>
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmPlan(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.planError ? (
        <p className="wo-admin__error" role="alert">
          {admin.planError.code}: {admin.planError.message}
        </p>
      ) : null}

      {admin.confirmRelease ? (
        <div className="wo-admin__confirm" role="dialog" aria-label="Xác nhận release">
          <p>
            Xác nhận release <strong>{detail.code}</strong>? Hệ thống sẽ sinh yêu cầu cấp vật tư (nếu
            cần) và WO chuyển MATERIAL_PREPARING/MATERIAL_READY. Không thể hoàn tác qua UI này.
          </p>
          <div className="wo-admin__actions">
            <button type="button" disabled={admin.releaseState === 'pending'} onClick={admin.release}>
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmRelease(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.releaseError ? (
        <p className="wo-admin__error" role="alert">
          {admin.releaseError.code}: {admin.releaseError.message}
        </p>
      ) : null}

      {admin.showPause ? (
        <div className="wo-admin__confirm" role="dialog" aria-label="Xác nhận pause">
          <p>
            Pause <strong>{detail.code}</strong>? IN_PROGRESS → PAUSED.
          </p>
          <label className="wo-admin__field">
            <span>Lý do (bắt buộc)</span>
            <input
              value={admin.pauseForm.reason}
              onChange={(e) => admin.setPauseForm({ reason: e.target.value })}
            />
          </label>
          <div className="wo-admin__actions">
            <button
              type="button"
              disabled={admin.pauseErrors.length > 0 || admin.pauseState === 'pending'}
              onClick={admin.pause}
            >
              {admin.pauseState === 'pending' ? 'Đang xử lý…' : 'Xác nhận'}
            </button>
            <button type="button" onClick={admin.closePause}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.pauseError ? (
        <p className="wo-admin__error" role="alert">
          {admin.pauseError.code}: {admin.pauseError.message}
        </p>
      ) : null}

      {admin.confirmResume ? (
        <div className="wo-admin__confirm" role="dialog" aria-label="Xác nhận resume">
          <p>
            Xác nhận resume <strong>{detail.code}</strong>? PAUSED → IN_PROGRESS.
          </p>
          <div className="wo-admin__actions">
            <button type="button" disabled={admin.resumeState === 'pending'} onClick={admin.resume}>
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmResume(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.resumeError ? (
        <p className="wo-admin__error" role="alert">
          {admin.resumeError.code}: {admin.resumeError.message}
        </p>
      ) : null}

      {admin.confirmClose ? (
        <div className="wo-admin__confirm" role="dialog" aria-label="Xác nhận close">
          <p>
            Xác nhận close <strong>{detail.code}</strong>? COMPLETED → CLOSED. Không thể hoàn tác.
          </p>
          <div className="wo-admin__actions">
            <button type="button" disabled={admin.closeState === 'pending'} onClick={admin.close}>
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmClose(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.closeError ? (
        <p className="wo-admin__error" role="alert">
          {admin.closeError.code}: {admin.closeError.message}
        </p>
      ) : null}

      {admin.showCancel ? (
        <div className="wo-admin__confirm" role="dialog" aria-label="Xác nhận cancel">
          <p>
            Cancel <strong>{detail.code}</strong>? Hành động phá huỷ, không thể hoàn tác.
          </p>
          <label className="wo-admin__field">
            <span>Lý do (bắt buộc)</span>
            <input
              value={admin.cancelForm.reason}
              onChange={(e) => admin.setCancelForm({ reason: e.target.value })}
            />
          </label>
          <div className="wo-admin__actions">
            <button
              type="button"
              className="wo-admin__btn--danger"
              disabled={admin.cancelErrors.length > 0 || admin.cancelState === 'pending'}
              onClick={admin.cancel}
            >
              {admin.cancelState === 'pending' ? 'Đang xử lý…' : 'Xác nhận'}
            </button>
            <button type="button" onClick={admin.closeCancel}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.cancelError ? (
        <p className="wo-admin__error" role="alert">
          {admin.cancelError.code}: {admin.cancelError.message}
        </p>
      ) : null}
    </aside>
  )
}

export function WorkOrderPage() {
  const admin = useWorkOrder()
  const banner = listStateMessage(admin.listState)

  return (
    <section className="wo-admin" aria-labelledby="wo-admin-title">
      <header className="wo-admin__header">
        <div>
          <p className="wo-admin__eyebrow">WEB-MES-04-WORK-ORDER · `/web/mes/work-orders`</p>
          <h2 id="wo-admin-title">Lệnh Sản xuất (Work Order)</h2>
          <p className="wo-admin__lead">
            Lập, theo dõi và điều khiển vòng đời Work Order theo state machine (MES04-001..013).
            Mutation gated bởi server <code>allowed_actions</code>; không sửa status bằng PATCH.
          </p>
        </div>
        <div className="wo-admin__actions">
          <Link to="/web/mes/boms">BOM</Link>
          <Link to="/web/mes/routings">Routing</Link>
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

      <form
        className="wo-admin__filters"
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
      >
        <label className="wo-admin__field">
          <span>Tìm Work Order (code)</span>
          <input
            value={admin.searchInput}
            onChange={(e) => admin.setSearchInput(e.target.value)}
            placeholder="WO-…"
          />
        </label>
        <button type="submit" className="wo-admin__btn">
          Lọc
        </button>
        <button type="button" className="wo-admin__btn" onClick={admin.openCreate}>
          Tạo Work Order
        </button>
      </form>

      {admin.showCreate ? (
        <div className="wo-admin__create">
          <h3>Tạo Work Order mới</h3>
          <p className="wo-admin__muted">
            Form luôn hiển thị — server enforce quyền tạo (MES04-003). Hệ thống tự động bung BOM +
            snapshot BOM/Routing hiện tại khi tạo.
          </p>
          <label className="wo-admin__field">
            <span>Code</span>
            <input
              value={admin.createForm.code}
              onChange={(e) => admin.setCreateForm({ ...admin.createForm, code: e.target.value })}
            />
          </label>
          <label className="wo-admin__field">
            <span>Sản phẩm (item — FG/SF)</span>
            <select
              value={admin.createForm.item_id}
              onChange={(e) => {
                const id = Number(e.target.value)
                const item = admin.items.find((i) => i.id === id)
                admin.setCreateForm({ ...admin.createForm, item_id: id, item_revision_id: null })
                admin.setCreateItemCode(item?.code ?? null)
              }}
            >
              <option value={0}>Chọn sản phẩm</option>
              {admin.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} — {item.item_name}
                </option>
              ))}
            </select>
          </label>
          <label className="wo-admin__field">
            <span>Item revision (tùy chọn — mặc định dùng revision hiện hành)</span>
            <select
              value={admin.createForm.item_revision_id ?? 0}
              onChange={(e) =>
                admin.setCreateForm({
                  ...admin.createForm,
                  item_revision_id: Number(e.target.value) || null,
                })
              }
            >
              <option value={0}>(mặc định — revision hiện hành)</option>
              {admin.createRevisions.map((rev) => (
                <option key={rev.id} value={rev.id}>
                  {rev.code}
                </option>
              ))}
            </select>
          </label>
          <label className="wo-admin__field">
            <span>Planned qty</span>
            <input
              type="number"
              min={1}
              value={admin.createForm.planned_qty}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, planned_qty: Number(e.target.value) })
              }
            />
          </label>
          <label className="wo-admin__field">
            <span>Planned start</span>
            <input
              type="datetime-local"
              value={admin.createForm.planned_start}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, planned_start: e.target.value })
              }
            />
          </label>
          <div className="wo-admin__actions">
            <button
              type="button"
              className="wo-admin__btn"
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
            <p className="wo-admin__error" role="alert">
              {admin.createError.code}: {admin.createError.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {banner ? (
        <p className="wo-admin__state" role={admin.listState === 'error' ? 'alert' : 'status'}>
          {banner}
          {admin.listError ? ` (${admin.listError.code})` : ''}
        </p>
      ) : null}

      {admin.listState === 'ready' ? (
        <div className="wo-admin__layout">
          <div className="wo-admin__table-wrap">
            <table className="wo-admin__table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Sản phẩm</th>
                  <th>Status</th>
                  <th>Planned</th>
                  <th>Produced / Scrap</th>
                  <th>Planned start</th>
                </tr>
              </thead>
              <tbody>
                {admin.rows.map((row) => (
                  <tr
                    key={row.id}
                    className={row.id === admin.selectedId ? 'wo-admin__row--active' : ''}
                  >
                    <td>
                      <button
                        type="button"
                        className="wo-admin__linkish"
                        onClick={() => admin.selectWorkOrder(row.id)}
                      >
                        {row.code}
                      </button>
                    </td>
                    <td>{row.itemLabel}</td>
                    <td>{row.status}</td>
                    <td>{row.plannedQty}</td>
                    <td>
                      {row.producedQty} / {row.scrapQty}
                    </td>
                    <td>{row.plannedStart}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {admin.hasMore ? (
              <button type="button" className="wo-admin__more" onClick={admin.loadMore}>
                Tải thêm
              </button>
            ) : null}
          </div>

          {admin.detailLoading ? (
            <div className="wo-admin__state">Đang tải chi tiết…</div>
          ) : admin.detail ? (
            <WorkOrderEditor key={admin.detail.id} detail={admin.detail} admin={admin} />
          ) : (
            <div className="wo-admin__state">Chọn Work Order để xem chi tiết.</div>
          )}
        </div>
      ) : null}
    </section>
  )
}
