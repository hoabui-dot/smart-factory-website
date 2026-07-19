import { useState } from 'react'
import { Link } from 'react-router'

import { useRouting } from '../hooks/useRouting'
import { MACHINE_STATUSES } from '../types/routing'
import type { MachineRecord, RoutingHeaderRecord, WorkCenterRecord } from '../types/routing'

import './RoutingPage.css'

type Api = ReturnType<typeof useRouting>

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

function WorkCenterEditor({ detail, admin }: { detail: WorkCenterRecord; admin: Api }) {
  const [name, setName] = useState(detail.name)
  const [capacityPerHour, setCapacityPerHour] = useState(String(detail.capacity_per_hour))
  const [capacityUomId, setCapacityUomId] = useState(detail.capacity_uom_id)
  const row = admin.wcDetailRow

  return (
    <aside className="routing-admin__detail" aria-label="Chi tiết work center">
      <h3>{detail.code}</h3>
      <p className="routing-admin__muted">
        {detail.name} · {row?.capacityUomLabel ?? '-'}
      </p>

      <label className="routing-admin__field">
        <span>Tên work center</span>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="routing-admin__field">
        <span>Capacity / giờ</span>
        <input
          inputMode="decimal"
          value={capacityPerHour}
          onChange={(e) => setCapacityPerHour(e.target.value)}
        />
      </label>
      <label className="routing-admin__field">
        <span>Capacity UoM</span>
        <select value={capacityUomId} onChange={(e) => setCapacityUomId(Number(e.target.value))}>
          {admin.uoms.map((u) => (
            <option key={u.id} value={u.id}>
              {u.code} — {u.uom_name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="routing-admin__btn"
        disabled={!row?.canUpdate || admin.updateWcPending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() =>
          admin.saveWcEdit({
            name: name.trim(),
            capacity_per_hour: Number(capacityPerHour),
            capacity_uom_id: capacityUomId,
          })
        }
      >
        {admin.updateWcPending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="routing-admin__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateWcError ? (
        <p className="routing-admin__error" role="alert">
          {admin.updateWcError.code}: {admin.updateWcError.message}
        </p>
      ) : null}
      {admin.updateWcSuccess ? (
        <p className="routing-admin__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>Deactivate</h4>
      <button
        type="button"
        className="routing-admin__btn routing-admin__btn--danger"
        disabled={!row?.canDeactivate}
        title={row?.deactivateDisabledReason ?? undefined}
        onClick={() => admin.setConfirmWcDeactivate(true)}
      >
        Deactivate work center
      </button>
      {!row?.canDeactivate ? (
        <p className="routing-admin__muted">
          Deactivate không khả dụng
          {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.confirmWcDeactivate ? (
        <div className="routing-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
          <p>
            Xác nhận deactivate <strong>{detail.code}</strong>? Work center sẽ bị xoá (chỉ khi
            không còn máy/routing operation gắn).
          </p>
          <div className="routing-admin__actions">
            <button
              type="button"
              className="routing-admin__btn routing-admin__btn--danger"
              disabled={admin.deactivateWcState === 'pending'}
              onClick={admin.deactivateWorkCenter}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmWcDeactivate(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.deactivateWcError ? (
        <p className="routing-admin__error" role="alert">
          {admin.deactivateWcError.code}: {admin.deactivateWcError.message}
        </p>
      ) : null}
      {admin.deactivateWcState === 'success' ? (
        <p className="routing-admin__banner" role="status">
          Đã deactivate work center.
        </p>
      ) : null}
    </aside>
  )
}

function MachineEditor({ detail, admin }: { detail: MachineRecord; admin: Api }) {
  const [workCenterId, setWorkCenterId] = useState(detail.work_center_id)
  const [lastPmDate, setLastPmDate] = useState(detail.last_pm_date.slice(0, 10))
  const [nextPmDue, setNextPmDue] = useState(detail.next_pm_due.slice(0, 10))
  const [status, setStatus] = useState(detail.status)
  const row = admin.machineDetailRow

  return (
    <aside className="routing-admin__detail" aria-label="Chi tiết máy">
      <h3>{detail.code}</h3>
      <p className="routing-admin__muted">
        {row?.workCenterLabel ?? '-'} · {detail.status}
      </p>

      <label className="routing-admin__field">
        <span>Work center</span>
        <select value={workCenterId} onChange={(e) => setWorkCenterId(Number(e.target.value))}>
          {admin.workCenterOptions.map((wc) => (
            <option key={wc.id} value={wc.id}>
              {wc.code} — {wc.name}
            </option>
          ))}
        </select>
      </label>
      <label className="routing-admin__field">
        <span>Last PM date</span>
        <input type="date" value={lastPmDate} onChange={(e) => setLastPmDate(e.target.value)} />
      </label>
      <label className="routing-admin__field">
        <span>Next PM due</span>
        <input type="date" value={nextPmDue} onChange={(e) => setNextPmDue(e.target.value)} />
      </label>
      <label className="routing-admin__field">
        <span>Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {MACHINE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="routing-admin__btn"
        disabled={!row?.canUpdate || admin.updateMachinePending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() =>
          admin.saveMachineEdit({
            work_center_id: workCenterId,
            last_pm_date: lastPmDate,
            next_pm_due: nextPmDue,
            status,
          })
        }
      >
        {admin.updateMachinePending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="routing-admin__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateMachineError ? (
        <p className="routing-admin__error" role="alert">
          {admin.updateMachineError.code}: {admin.updateMachineError.message}
        </p>
      ) : null}
      {admin.updateMachineSuccess ? (
        <p className="routing-admin__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>Deactivate</h4>
      <button
        type="button"
        className="routing-admin__btn routing-admin__btn--danger"
        disabled={!row?.canDeactivate}
        title={row?.deactivateDisabledReason ?? undefined}
        onClick={() => admin.setConfirmMachineDeactivate(true)}
      >
        Deactivate máy
      </button>
      {!row?.canDeactivate ? (
        <p className="routing-admin__muted">
          Deactivate không khả dụng
          {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.confirmMachineDeactivate ? (
        <div className="routing-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
          <p>
            Xác nhận deactivate <strong>{detail.code}</strong>?
          </p>
          <div className="routing-admin__actions">
            <button
              type="button"
              className="routing-admin__btn routing-admin__btn--danger"
              disabled={admin.deactivateMachineState === 'pending'}
              onClick={admin.deactivateMachine}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmMachineDeactivate(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.deactivateMachineError ? (
        <p className="routing-admin__error" role="alert">
          {admin.deactivateMachineError.code}: {admin.deactivateMachineError.message}
        </p>
      ) : null}
      {admin.deactivateMachineState === 'success' ? (
        <p className="routing-admin__banner" role="status">
          Đã deactivate máy.
        </p>
      ) : null}
    </aside>
  )
}

function RoutingEditor({ detail, admin }: { detail: RoutingHeaderRecord; admin: Api }) {
  const [version, setVersion] = useState(detail.version)
  const [effectiveFrom, setEffectiveFrom] = useState(detail.effective_from.slice(0, 10))
  const row = admin.routingDetailRow

  return (
    <aside className="routing-admin__detail" aria-label="Chi tiết routing">
      <h3>{detail.code}</h3>
      <p className="routing-admin__muted">
        {row?.productItemLabel ?? '-'} · {detail.status} · v{detail.version}
      </p>
      <dl className="routing-admin__meta">
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

      <h4>Operations ({admin.routingOperations.length})</h4>
      {admin.routingOperationsLoading ? (
        <p className="routing-admin__muted">Đang tải operations…</p>
      ) : admin.routingOperations.length === 0 ? (
        <p className="routing-admin__muted">
          Chưa có operation. Thêm operation qua ROUTING_IMPORT tại Import/Export Center.
        </p>
      ) : (
        <table className="routing-admin__table routing-admin__table--compact">
          <thead>
            <tr>
              <th>Op code</th>
              <th>Tên</th>
              <th>Work center</th>
              <th>Cycle time</th>
              <th>Setup time</th>
            </tr>
          </thead>
          <tbody>
            {admin.routingOperations.map((op) => (
              <tr key={op.code}>
                <td>{op.operation_code}</td>
                <td>{op.operation_name}</td>
                <td>{op.work_center_code ?? '-'}</td>
                <td>
                  {op.standard_cycle_time} {op.standard_cycle_time_uom_code ?? ''}
                </td>
                <td>
                  {op.setup_time} {op.setup_time_uom_code ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h4>Sửa (chỉ khi DRAFT)</h4>
      <label className="routing-admin__field">
        <span>Version</span>
        <input value={version} onChange={(e) => setVersion(e.target.value)} />
      </label>
      <label className="routing-admin__field">
        <span>Effective from</span>
        <input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
      </label>
      <button
        type="button"
        className="routing-admin__btn"
        disabled={!row?.canUpdate || admin.updateRoutingPending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() =>
          admin.saveRoutingEdit({
            version: version.trim(),
            effective_from: effectiveFrom,
          })
        }
      >
        {admin.updateRoutingPending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="routing-admin__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateRoutingError ? (
        <p className="routing-admin__error" role="alert">
          {admin.updateRoutingError.code}: {admin.updateRoutingError.message}
        </p>
      ) : null}
      {admin.updateRoutingSuccess ? (
        <p className="routing-admin__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>State transitions</h4>
      <div className="routing-admin__actions">
        <button
          type="button"
          className="routing-admin__btn"
          disabled={!row?.canRelease}
          title={row?.releaseDisabledReason ?? undefined}
          onClick={() => admin.setConfirmRoutingRelease(true)}
        >
          Release
        </button>
        <button
          type="button"
          className="routing-admin__btn routing-admin__btn--danger"
          disabled={!row?.canObsolete}
          title={row?.obsoleteDisabledReason ?? undefined}
          onClick={() => admin.setConfirmRoutingObsolete(true)}
        >
          Obsolete
        </button>
        <button
          type="button"
          className="routing-admin__btn routing-admin__btn--danger"
          disabled={!row?.canDeactivate}
          title={row?.deactivateDisabledReason ?? undefined}
          onClick={() => admin.setConfirmRoutingDeactivate(true)}
        >
          Deactivate
        </button>
      </div>

      {admin.confirmRoutingRelease ? (
        <div className="routing-admin__confirm" role="dialog" aria-label="Xác nhận release">
          <p>
            Xác nhận release <strong>{detail.code}</strong>? Routing RELEASED trước đó của cùng
            sản phẩm sẽ chuyển sang OBSOLETE.
          </p>
          <div className="routing-admin__actions">
            <button
              type="button"
              disabled={admin.releaseRoutingState === 'pending'}
              onClick={admin.releaseRouting}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmRoutingRelease(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.releaseRoutingError ? (
        <p className="routing-admin__error" role="alert">
          {admin.releaseRoutingError.code}: {admin.releaseRoutingError.message}
        </p>
      ) : null}

      {admin.confirmRoutingObsolete ? (
        <div className="routing-admin__confirm" role="dialog" aria-label="Xác nhận obsolete">
          <p>
            Xác nhận obsolete <strong>{detail.code}</strong>? Routing sẽ không còn dùng cho lệnh sản
            xuất mới.
          </p>
          <div className="routing-admin__actions">
            <button
              type="button"
              disabled={admin.obsoleteRoutingState === 'pending'}
              onClick={admin.obsoleteRouting}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmRoutingObsolete(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.obsoleteRoutingError ? (
        <p className="routing-admin__error" role="alert">
          {admin.obsoleteRoutingError.code}: {admin.obsoleteRoutingError.message}
        </p>
      ) : null}

      {admin.confirmRoutingDeactivate ? (
        <div className="routing-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
          <p>
            Xác nhận deactivate <strong>{detail.code}</strong>? Routing sẽ chuyển sang OBSOLETE.
          </p>
          <div className="routing-admin__actions">
            <button
              type="button"
              disabled={admin.deactivateRoutingState === 'pending'}
              onClick={admin.deactivateRouting}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmRoutingDeactivate(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.deactivateRoutingError ? (
        <p className="routing-admin__error" role="alert">
          {admin.deactivateRoutingError.code}: {admin.deactivateRoutingError.message}
        </p>
      ) : null}
      {(admin.releaseRoutingState === 'success' ||
        admin.obsoleteRoutingState === 'success' ||
        admin.deactivateRoutingState === 'success') ? (
        <p className="routing-admin__banner" role="status">
          Đã cập nhật trạng thái routing.
        </p>
      ) : null}
    </aside>
  )
}

export function RoutingPage() {
  const admin = useRouting()

  return (
    <section className="routing-admin" aria-labelledby="routing-admin-title">
      <header className="routing-admin__header">
        <div>
          <p className="routing-admin__eyebrow">WEB-MES-03-ROUTING · `/web/mes/routings`</p>
          <h2 id="routing-admin-title">Giai đoạn (GĐ), Trạm máy &amp; Routing</h2>
          <p className="routing-admin__lead">
            Quản lý work center, máy và routing (MES03-001..018). Mutation gated bởi server{' '}
            <code>allowed_actions</code>. Import lô operation dùng Import/Export Center.
          </p>
        </div>
        <div className="routing-admin__actions">
          <Link to="/web/import-export">Import / Export Center</Link>
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

      <div className="routing-admin__tabs" role="tablist" aria-label="Routing admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'routings'}
          onClick={() => admin.setTab('routings')}
        >
          Routings
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'work_centers'}
          onClick={() => admin.setTab('work_centers')}
        >
          Work Centers
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'machines'}
          onClick={() => admin.setTab('machines')}
        >
          Machines
        </button>
      </div>

      {admin.tab === 'routings' ? (
        <>
          <form
            className="routing-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyRoutingSearch()
            }}
          >
            <label className="routing-admin__field">
              <span>Tìm routing (code / version)</span>
              <input
                value={admin.rtSearchInput}
                onChange={(e) => admin.setRtSearchInput(e.target.value)}
                placeholder="RT-… / v1.0"
              />
            </label>
            <button type="submit" className="routing-admin__btn">
              Lọc
            </button>
            <button type="button" className="routing-admin__btn" onClick={admin.openRoutingCreate}>
              Tạo routing
            </button>
          </form>

          {admin.showRoutingCreate ? (
            <div className="routing-admin__create">
              <h3>Tạo routing mới</h3>
              <p className="routing-admin__muted">
                Form luôn hiển thị — server enforce quyền tạo (MES03-013).
              </p>
              <label className="routing-admin__field">
                <span>Code</span>
                <input
                  value={admin.routingCreateForm.code}
                  onChange={(e) =>
                    admin.setRoutingCreateForm({ ...admin.routingCreateForm, code: e.target.value })
                  }
                />
              </label>
              <label className="routing-admin__field">
                <span>Sản phẩm (item)</span>
                <select
                  value={admin.routingCreateForm.product_item_id}
                  onChange={(e) =>
                    admin.setRoutingCreateForm({
                      ...admin.routingCreateForm,
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
              <label className="routing-admin__field">
                <span>Version</span>
                <input
                  value={admin.routingCreateForm.version}
                  onChange={(e) =>
                    admin.setRoutingCreateForm({ ...admin.routingCreateForm, version: e.target.value })
                  }
                />
              </label>
              <label className="routing-admin__field">
                <span>Status khởi tạo</span>
                <select
                  value={admin.routingCreateForm.status}
                  onChange={(e) =>
                    admin.setRoutingCreateForm({ ...admin.routingCreateForm, status: e.target.value })
                  }
                >
                  <option value="DRAFT">DRAFT</option>
                </select>
              </label>
              <label className="routing-admin__field">
                <span>Effective from</span>
                <input
                  type="date"
                  value={admin.routingCreateForm.effective_from}
                  onChange={(e) =>
                    admin.setRoutingCreateForm({
                      ...admin.routingCreateForm,
                      effective_from: e.target.value,
                    })
                  }
                />
              </label>
              <div className="routing-admin__actions">
                <button
                  type="button"
                  className="routing-admin__btn"
                  disabled={admin.routingCreateErrors.length > 0 || admin.createRoutingPending}
                  onClick={() => admin.createRouting()}
                >
                  {admin.createRoutingPending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closeRoutingCreate}>
                  Hủy
                </button>
              </div>
              {admin.createRoutingError ? (
                <p className="routing-admin__error" role="alert">
                  {admin.createRoutingError.code}: {admin.createRoutingError.message}
                </p>
              ) : null}
            </div>
          ) : null}

          {(() => {
            const banner = listStateMessage(admin.routingListState, 'routing')
            return banner ? (
              <p
                className="routing-admin__state"
                role={admin.routingListState === 'error' ? 'alert' : 'status'}
              >
                {banner}
                {admin.routingListError ? ` (${admin.routingListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.routingListState === 'ready' ? (
            <div className="routing-admin__layout">
              <div className="routing-admin__table-wrap">
                <table className="routing-admin__table">
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
                    {admin.routingRows.map((row) => (
                      <tr
                        key={row.code}
                        className={
                          row.code === admin.selectedRoutingCode ? 'routing-admin__row--active' : ''
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="routing-admin__linkish"
                            onClick={() => admin.selectRouting(row.code)}
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
                {admin.routingHasMore ? (
                  <button type="button" className="routing-admin__more" onClick={admin.routingLoadMore}>
                    Tải thêm
                  </button>
                ) : null}
              </div>

              {admin.routingDetailLoading ? (
                <div className="routing-admin__state">Đang tải chi tiết…</div>
              ) : admin.routingDetail ? (
                <RoutingEditor key={admin.routingDetail.code} detail={admin.routingDetail} admin={admin} />
              ) : (
                <div className="routing-admin__state">Chọn routing để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'work_centers' ? (
        <>
          <form
            className="routing-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyWcSearch()
            }}
          >
            <label className="routing-admin__field">
              <span>Tìm work center (code / tên)</span>
              <input
                value={admin.wcSearchInput}
                onChange={(e) => admin.setWcSearchInput(e.target.value)}
                placeholder="WC-… / tên"
              />
            </label>
            <button type="submit" className="routing-admin__btn">
              Lọc
            </button>
            <button type="button" className="routing-admin__btn" onClick={admin.openWcCreate}>
              Tạo work center
            </button>
          </form>

          {admin.showWcCreate ? (
            <div className="routing-admin__create">
              <h3>Tạo work center mới</h3>
              <p className="routing-admin__muted">
                Form luôn hiển thị — server enforce quyền tạo (MES03-003).
              </p>
              <label className="routing-admin__field">
                <span>Code</span>
                <input
                  value={admin.wcCreateForm.code}
                  onChange={(e) =>
                    admin.setWcCreateForm({ ...admin.wcCreateForm, code: e.target.value })
                  }
                />
              </label>
              <label className="routing-admin__field">
                <span>Tên work center</span>
                <input
                  value={admin.wcCreateForm.name}
                  onChange={(e) => admin.setWcCreateForm({ ...admin.wcCreateForm, name: e.target.value })}
                />
              </label>
              <label className="routing-admin__field">
                <span>Capacity / giờ</span>
                <input
                  inputMode="decimal"
                  value={admin.wcCreateForm.capacity_per_hour || ''}
                  onChange={(e) =>
                    admin.setWcCreateForm({
                      ...admin.wcCreateForm,
                      capacity_per_hour: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="routing-admin__field">
                <span>Capacity UoM</span>
                <select
                  value={admin.wcCreateForm.capacity_uom_id}
                  onChange={(e) =>
                    admin.setWcCreateForm({
                      ...admin.wcCreateForm,
                      capacity_uom_id: Number(e.target.value),
                    })
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
              <div className="routing-admin__actions">
                <button
                  type="button"
                  className="routing-admin__btn"
                  disabled={admin.wcCreateErrors.length > 0 || admin.createWcPending}
                  onClick={() => admin.createWorkCenter()}
                >
                  {admin.createWcPending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closeWcCreate}>
                  Hủy
                </button>
              </div>
              {admin.createWcError ? (
                <p className="routing-admin__error" role="alert">
                  {admin.createWcError.code}: {admin.createWcError.message}
                </p>
              ) : null}
            </div>
          ) : null}

          {(() => {
            const banner = listStateMessage(admin.wcListState, 'work center')
            return banner ? (
              <p className="routing-admin__state" role={admin.wcListState === 'error' ? 'alert' : 'status'}>
                {banner}
                {admin.wcListError ? ` (${admin.wcListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.wcListState === 'ready' ? (
            <div className="routing-admin__layout">
              <div className="routing-admin__table-wrap">
                <table className="routing-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Tên</th>
                      <th>Capacity/giờ</th>
                      <th>UOM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.wcRows.map((row) => (
                      <tr
                        key={row.code}
                        className={row.code === admin.selectedWcCode ? 'routing-admin__row--active' : ''}
                      >
                        <td>
                          <button
                            type="button"
                            className="routing-admin__linkish"
                            onClick={() => admin.selectWorkCenter(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.name}</td>
                        <td>{row.capacityPerHour}</td>
                        <td>{row.capacityUomLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.wcHasMore ? (
                  <button type="button" className="routing-admin__more" onClick={admin.wcLoadMore}>
                    Tải thêm
                  </button>
                ) : null}
              </div>

              {admin.wcDetailLoading ? (
                <div className="routing-admin__state">Đang tải chi tiết…</div>
              ) : admin.wcDetail ? (
                <WorkCenterEditor key={admin.wcDetail.code} detail={admin.wcDetail} admin={admin} />
              ) : (
                <div className="routing-admin__state">Chọn work center để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'machines' ? (
        <>
          <form
            className="routing-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyMachineSearch()
            }}
          >
            <label className="routing-admin__field">
              <span>Tìm máy (code)</span>
              <input
                value={admin.mSearchInput}
                onChange={(e) => admin.setMSearchInput(e.target.value)}
                placeholder="M-…"
              />
            </label>
            <button type="submit" className="routing-admin__btn">
              Lọc
            </button>
            <button type="button" className="routing-admin__btn" onClick={admin.openMachineCreate}>
              Tạo máy
            </button>
          </form>

          {admin.showMachineCreate ? (
            <div className="routing-admin__create">
              <h3>Tạo máy mới</h3>
              <p className="routing-admin__muted">
                Form luôn hiển thị — server enforce quyền tạo (MES03-008).
              </p>
              <label className="routing-admin__field">
                <span>Code</span>
                <input
                  value={admin.machineCreateForm.code}
                  onChange={(e) =>
                    admin.setMachineCreateForm({ ...admin.machineCreateForm, code: e.target.value })
                  }
                />
              </label>
              <label className="routing-admin__field">
                <span>Work center</span>
                <select
                  value={admin.machineCreateForm.work_center_id}
                  onChange={(e) =>
                    admin.setMachineCreateForm({
                      ...admin.machineCreateForm,
                      work_center_id: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>Chọn work center</option>
                  {admin.workCenterOptions.map((wc) => (
                    <option key={wc.id} value={wc.id}>
                      {wc.code} — {wc.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="routing-admin__field">
                <span>Last PM date</span>
                <input
                  type="date"
                  value={admin.machineCreateForm.last_pm_date}
                  onChange={(e) =>
                    admin.setMachineCreateForm({
                      ...admin.machineCreateForm,
                      last_pm_date: e.target.value,
                    })
                  }
                />
              </label>
              <label className="routing-admin__field">
                <span>Next PM due</span>
                <input
                  type="date"
                  value={admin.machineCreateForm.next_pm_due}
                  onChange={(e) =>
                    admin.setMachineCreateForm({
                      ...admin.machineCreateForm,
                      next_pm_due: e.target.value,
                    })
                  }
                />
              </label>
              <label className="routing-admin__field">
                <span>Status</span>
                <select
                  value={admin.machineCreateForm.status}
                  onChange={(e) =>
                    admin.setMachineCreateForm({ ...admin.machineCreateForm, status: e.target.value })
                  }
                >
                  {MACHINE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="routing-admin__actions">
                <button
                  type="button"
                  className="routing-admin__btn"
                  disabled={admin.machineCreateErrors.length > 0 || admin.createMachinePending}
                  onClick={() => admin.createMachine()}
                >
                  {admin.createMachinePending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closeMachineCreate}>
                  Hủy
                </button>
              </div>
              {admin.createMachineError ? (
                <p className="routing-admin__error" role="alert">
                  {admin.createMachineError.code}: {admin.createMachineError.message}
                </p>
              ) : null}
            </div>
          ) : null}

          {(() => {
            const banner = listStateMessage(admin.machineListState, 'máy')
            return banner ? (
              <p
                className="routing-admin__state"
                role={admin.machineListState === 'error' ? 'alert' : 'status'}
              >
                {banner}
                {admin.machineListError ? ` (${admin.machineListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.machineListState === 'ready' ? (
            <div className="routing-admin__layout">
              <div className="routing-admin__table-wrap">
                <table className="routing-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Work center</th>
                      <th>Status</th>
                      <th>Next PM due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.machineRows.map((row) => (
                      <tr
                        key={row.code}
                        className={
                          row.code === admin.selectedMachineCode ? 'routing-admin__row--active' : ''
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="routing-admin__linkish"
                            onClick={() => admin.selectMachine(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.workCenterLabel}</td>
                        <td>{row.status}</td>
                        <td>{row.nextPmDue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.machineHasMore ? (
                  <button type="button" className="routing-admin__more" onClick={admin.machineLoadMore}>
                    Tải thêm
                  </button>
                ) : null}
              </div>

              {admin.machineDetailLoading ? (
                <div className="routing-admin__state">Đang tải chi tiết…</div>
              ) : admin.machineDetail ? (
                <MachineEditor key={admin.machineDetail.code} detail={admin.machineDetail} admin={admin} />
              ) : (
                <div className="routing-admin__state">Chọn máy để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
