import { useState } from 'react'
import { Link } from 'react-router'

import { useWorkOrder } from '../hooks/useWorkOrder'
import type { WorkOrderRecord } from '../types/workOrder'
import { usePagination } from '@/shared/lib/usePagination'
import { DataTablePagination } from '@/shared/components/DataTablePagination'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Search } from 'lucide-react'

import './WorkOrderPage.css'

type Api = ReturnType<typeof useWorkOrder>

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải danh sách Work Order…'
    case 'empty':
      return 'Chưa có Work Order nào. Nhấp vào "Tạo Work Order" để lập lệnh.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc. Thử từ khóa khác.'
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

  // Confirmation modal states
  const [isConfirmEditOpen, setIsConfirmEditOpen] = useState(false)
  const [isConfirmPlanOpen, setIsConfirmPlanOpen] = useState(false)
  const [isConfirmReleaseOpen, setIsConfirmReleaseOpen] = useState(false)
  const [isConfirmPauseOpen, setIsConfirmPauseOpen] = useState(false)
  const [isConfirmResumeOpen, setIsConfirmResumeOpen] = useState(false)
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false)
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false)

  const row = admin.detailRow

  return (
    <aside className="wo-admin__detail" aria-label="Chi tiết Work Order">
      <h3>{detail.code}</h3>
      <p className="wo-admin__muted">
        {row?.itemLabel ?? '-'} · rev {row?.itemRevisionLabel ?? '-'} · {detail.status}
      </p>
      <p>
        <Link className="wo-admin__link-wo360" to={`/web/shared/wo-360/${detail.id}`}>Mở WO 360 ↗</Link>
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
          disabled={!row?.canUpdate}
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
          disabled={!row?.canUpdate}
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
          disabled={!row?.canUpdate}
          value={plannedQty}
          onChange={(e) => setPlannedQty(Number(e.target.value))}
        />
      </label>
      <label className="wo-admin__field">
        <span>Planned start</span>
        <input
          type="datetime-local"
          disabled={!row?.canUpdate}
          value={plannedStart}
          onChange={(e) => setPlannedStart(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="wo-admin__btn"
        disabled={!row?.canUpdate || admin.updatePending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() => setIsConfirmEditOpen(true)}
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

      <h4>Điều khiển trạng thái (State Machine)</h4>
      <div className="wo-admin__actions">
        <button
          type="button"
          className="wo-admin__btn"
          disabled={!row?.canPlan}
          title={row?.planDisabledReason ?? undefined}
          onClick={() => setIsConfirmPlanOpen(true)}
        >
          Plan
        </button>
        <button
          type="button"
          className="wo-admin__btn"
          disabled={!row?.canRelease}
          title={row?.releaseDisabledReason ?? undefined}
          onClick={() => setIsConfirmReleaseOpen(true)}
        >
          Release
        </button>
        <button
          type="button"
          className="wo-admin__btn"
          disabled={!row?.canPause}
          title={row?.pauseDisabledReason ?? undefined}
          onClick={() => setIsConfirmPauseOpen(true)}
        >
          Pause
        </button>
        <button
          type="button"
          className="wo-admin__btn"
          disabled={!row?.canResume}
          title={row?.resumeDisabledReason ?? undefined}
          onClick={() => setIsConfirmResumeOpen(true)}
        >
          Resume
        </button>
        <button
          type="button"
          className="wo-admin__btn"
          disabled={!row?.canClose}
          title={row?.closeDisabledReason ?? undefined}
          onClick={() => setIsConfirmCloseOpen(true)}
        >
          Close
        </button>
        <button
          type="button"
          className="wo-admin__btn wo-admin__btn--danger"
          disabled={!row?.canCancel}
          title={row?.cancelDisabledReason ?? undefined}
          onClick={() => setIsConfirmCancelOpen(true)}
        >
          Cancel
        </button>
      </div>

      {admin.planError ? (
        <p className="wo-admin__error" role="alert">
          {admin.planError.code}: {admin.planError.message}
        </p>
      ) : null}
      {admin.releaseError ? (
        <p className="wo-admin__error" role="alert">
          {admin.releaseError.code}: {admin.releaseError.message}
        </p>
      ) : null}
      {admin.pauseError ? (
        <p className="wo-admin__error" role="alert">
          {admin.pauseError.code}: {admin.pauseError.message}
        </p>
      ) : null}
      {admin.resumeError ? (
        <p className="wo-admin__error" role="alert">
          {admin.resumeError.code}: {admin.resumeError.message}
        </p>
      ) : null}
      {admin.closeError ? (
        <p className="wo-admin__error" role="alert">
          {admin.closeError.code}: {admin.closeError.message}
        </p>
      ) : null}
      {admin.cancelError ? (
        <p className="wo-admin__error" role="alert">
          {admin.cancelError.code}: {admin.cancelError.message}
        </p>
      ) : null}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={isConfirmEditOpen}
        onClose={() => setIsConfirmEditOpen(false)}
        title="Xác nhận lưu thay đổi WO"
        description={`Bạn đang cập nhật kế hoạch cho lệnh sản xuất ${detail.code}.`}
        summary={{
          'Sản phẩm': admin.items.find((i) => i.id === itemId)?.code ?? itemId,
          'Revision': admin.detailRevisions.find((r) => r.id === itemRevisionId)?.code ?? 'Giữ nguyên',
          'Số lượng': plannedQty,
          'Bắt đầu dự kiến': plannedStart.replace('T', ' '),
        }}
        onConfirm={() => {
          setIsConfirmEditOpen(false)
          admin.saveEdit({
            item_id: itemId,
            item_revision_id: itemRevisionId,
            planned_qty: plannedQty,
            planned_start: plannedStart,
          })
        }}
      />

      <ConfirmDialog
        isOpen={isConfirmPlanOpen}
        onClose={() => setIsConfirmPlanOpen(false)}
        title="Xác nhận Lập kế hoạch (Plan)"
        description={`Bạn muốn chuyển trạng thái Lệnh ${detail.code} từ DRAFT sang PLANNED?`}
        confirmText="Xác nhận Plan"
        isPending={admin.planState === 'pending'}
        onConfirm={() => {
          setIsConfirmPlanOpen(false)
          admin.plan()
        }}
      />

      <ConfirmDialog
        isOpen={isConfirmReleaseOpen}
        onClose={() => setIsConfirmReleaseOpen(false)}
        title="Xác nhận Phát hành lệnh (Release)"
        description={`Bạn muốn phát hành lệnh ${detail.code}? Lệnh sẽ chuyển sang trạng thái MATERIAL_PREPARING. Yêu cầu cung cấp vật tư sẽ tự động được tạo.`}
        confirmText="Phát hành lệnh"
        isPending={admin.releaseState === 'pending'}
        onConfirm={() => {
          setIsConfirmReleaseOpen(false)
          admin.release()
        }}
      />

      <ConfirmDialog
        isOpen={isConfirmPauseOpen}
        onClose={() => setIsConfirmPauseOpen(false)}
        title="Xác nhận Tạm dừng (Pause)"
        description={`Bạn muốn tạm dừng Lệnh ${detail.code}? Lệnh sẽ chuyển sang trạng thái PAUSED.`}
        type="reason-required"
        confirmText="Tạm dừng"
        isPending={admin.pauseState === 'pending'}
        onConfirm={(reason) => {
          setIsConfirmPauseOpen(false)
          admin.setPauseForm({ reason: reason || '' })
          admin.pause()
        }}
      />

      <ConfirmDialog
        isOpen={isConfirmResumeOpen}
        onClose={() => setIsConfirmResumeOpen(false)}
        title="Xác nhận Tiếp tục (Resume)"
        description={`Tiếp tục thực hiện lệnh sản xuất ${detail.code}? Trạng thái sẽ đổi từ PAUSED sang IN_PROGRESS.`}
        confirmText="Tiếp tục"
        isPending={admin.resumeState === 'pending'}
        onConfirm={() => {
          setIsConfirmResumeOpen(false)
          admin.resume()
        }}
      />

      <ConfirmDialog
        isOpen={isConfirmCloseOpen}
        onClose={() => setIsConfirmCloseOpen(false)}
        title="Xác nhận Đóng Lệnh (Close)"
        description={`Bạn muốn đóng lệnh ${detail.code}? Hành động đổi trạng thái từ COMPLETED sang CLOSED và không thể hoàn tác.`}
        confirmText="Đóng Lệnh"
        isPending={admin.closeState === 'pending'}
        onConfirm={() => {
          setIsConfirmCloseOpen(false)
          admin.close()
        }}
      />

      <ConfirmDialog
        isOpen={isConfirmCancelOpen}
        onClose={() => setIsConfirmCancelOpen(false)}
        title="Xác nhận Hủy Lệnh (Cancel)"
        description={`Hủy lệnh sản xuất ${detail.code}? Đây là thao tác hủy vĩnh viễn và không thể khôi phục.`}
        type="reason-required"
        confirmText="Hủy lệnh"
        isPending={admin.cancelState === 'pending'}
        onConfirm={(reason) => {
          setIsConfirmCancelOpen(false)
          admin.setCancelForm({ reason: reason || '' })
          admin.cancel()
        }}
      />
    </aside>
  )
}

export function WorkOrderPage() {
  const admin = useWorkOrder()
  const banner = listStateMessage(admin.listState)

  const pagination = usePagination(admin.rows, 10)

  // Local creation confirm
  const [isConfirmCreateOpen, setIsConfirmCreateOpen] = useState(false)

  return (
    <section className="wo-admin flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'MES' },
          { label: 'Production Orders' },
        ]}
        title="Production Orders"
        subtitle="Lập và điều phối vòng đời của các lệnh sản xuất."
        actions={<Button onClick={admin.openCreate}>Tạo Work Order</Button>}
      />

      <form
        className="flex items-center gap-2 max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg"
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
      >
        <div className="flex-1">
          <input
            className="w-full bg-transparent border-0 focus:outline-none text-sm text-slate-800 dark:text-slate-200 px-2"
            value={admin.searchInput}
            onChange={(e) => admin.setSearchInput(e.target.value)}
            placeholder="Tìm Work Order (code)..."
          />
        </div>
        <Button type="submit" size="sm" className="h-9 w-9 px-0" aria-label="Lọc">
          <Search size={16} />
        </Button>
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
              onClick={() => setIsConfirmCreateOpen(true)}
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
                {pagination.paginatedItems.map((row) => (
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
            
            <div className="wo-admin__paging-row">
              {admin.hasMore ? (
                <button type="button" className="wo-admin__more" onClick={admin.loadMore}>
                  Nạp thêm từ Server
                </button>
              ) : (
                <span className="wo-admin__all-loaded">Đã tải hết dữ liệu từ Server</span>
              )}
              
              <DataTablePagination
                currentPage={pagination.currentPage}
                pageSize={pagination.pageSize}
                totalItems={pagination.totalItems}
                totalPages={pagination.totalPages}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                setPage={pagination.setPage}
                setPageSize={pagination.setPageSize}
              />
            </div>
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

      <ConfirmDialog
        isOpen={isConfirmCreateOpen}
        onClose={() => setIsConfirmCreateOpen(false)}
        title="Xác nhận lập Lệnh sản xuất"
        description="Vui lòng xác nhận thông tin chi tiết lệnh sản xuất dưới đây."
        summary={{
          'Mã lệnh (Code)': admin.createForm.code,
          'Sản phẩm': admin.items.find((i) => i.id === admin.createForm.item_id)?.code ?? admin.createForm.item_id,
          'Revision': admin.createRevisions.find((r) => r.id === admin.createForm.item_revision_id)?.code ?? 'Mặc định',
          'Số lượng lập': admin.createForm.planned_qty,
          'Dự kiến bắt đầu': admin.createForm.planned_start.replace('T', ' '),
        }}
        onConfirm={() => {
          setIsConfirmCreateOpen(false)
          admin.create()
        }}
      />
    </section>
  )
}
