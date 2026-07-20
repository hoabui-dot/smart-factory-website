import { useState } from 'react'
import { Link } from 'react-router'

import { useWorkOrder } from '../hooks/useWorkOrder'
import type { WorkOrderRecord, WorkOrderRow, MaterialRequestRow } from '../types/workOrder'
import { usePagination } from '@/shared/lib/usePagination'
import { GenericDataTable, ColumnDef } from '@/shared/components/ui/DataTable'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/Table'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Input, Select } from '@/shared/components/ui/Input'
import { Dialog } from '@/shared/components/ui/Dialog'
import { Search } from 'lucide-react'
import { FilterBar } from '@/shared/components/ui/FilterBar'

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
        <Table containerClassName="border border-[var(--border-default)] rounded-lg bg-[var(--surface-1)] overflow-hidden">
          <TableHeader>
            <TableRow className="pointer-events-none hover:bg-transparent bg-[var(--surface-2)]">
              <TableHead>Mã</TableHead>
              <TableHead>Vật tư</TableHead>
              <TableHead>SL cần</TableHead>
              <TableHead>ĐVT</TableHead>
              <TableHead>Vị trí đích</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admin.materialRequestRows.map((mr) => (
              <TableRow key={mr.code} className="hover:bg-[var(--surface-2)]">
                <TableCell>{mr.code}</TableCell>
                <TableCell>{mr.itemLabel}</TableCell>
                <TableCell>{mr.requiredQty}</TableCell>
                <TableCell>{mr.uomLabel}</TableCell>
                <TableCell>{mr.targetLocationLabel}</TableCell>
                <TableCell>{mr.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

  const columns: ColumnDef<WorkOrderRow>[] = [
    {
      header: 'Mã lệnh SX',
      cell: (row) => (
        <button
          type="button"
          className="wo-admin__linkish"
          onClick={(e) => {
            e.stopPropagation()
            admin.selectWorkOrder(row.id)
          }}
        >
          {row.code}
        </button>
      ),
    },
    {
      header: 'Sản phẩm',
      cell: (row) => row.itemLabel,
    },
    {
      header: 'Trạng thái',
      cell: (row) => row.status,
    },
    {
      header: 'Số lượng kế hoạch',
      cell: (row) => row.plannedQty,
    },
    {
      header: 'Đã sản xuất / Hao hụt',
      cell: (row) => `${row.producedQty} / ${row.scrapQty}`,
    },
    {
      header: 'Bắt đầu dự kiến',
      cell: (row) => row.plannedStart,
    },
  ]

  // Local creation confirm
  const [isConfirmCreateOpen, setIsConfirmCreateOpen] = useState(false)

  return (
    <section className="wo-admin flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'MES' },
          { label: 'Lệnh sản xuất' },
        ]}
        title="Lệnh sản xuất (Work Order)"
        subtitle="Lập kế hoạch, điều độ và kiểm soát tiến độ thực hiện các lệnh sản xuất trong nhà máy."
        actions={<Button onClick={admin.openCreate}>Tạo Work Order</Button>}
      />

      <FilterBar
        fields={[
          {
            name: 'searchInput',
            type: 'text',
            placeholder: 'Tìm theo mã lệnh...'
          }
        ]}
        values={{ searchInput: admin.searchInput }}
        onChange={(_, val) => admin.setSearchInput(val)}
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
        onReset={admin.clearSearch}
        isResetActive={!!admin.appliedQuery}
        className="w-full flex-nowrap"
      >
        <div className="ml-auto flex items-center">
          <Button type="button" variant="secondary" size="sm" onClick={admin.openCreate} className="mr-3">
            Tạo lệnh sản xuất
          </Button>
        </div>
      </FilterBar>

      <Dialog
        isOpen={admin.showCreate}
        onClose={admin.closeCreate}
        title="Tạo Work Order mới"
        maxWidth="max-w-[50%]"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            setIsConfirmCreateOpen(true)
          }}
        >
          <p className="text-xs text-[var(--text-muted)]">
            Form luôn hiển thị — server enforce quyền tạo (MES04-003). Hệ thống tự động bung BOM +
            snapshot BOM/Routing hiện tại khi tạo.
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Code</span>
            <Input
              value={admin.createForm.code}
              onChange={(e) => admin.setCreateForm({ ...admin.createForm, code: e.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Sản phẩm (item — FG/SF)</span>
            <Select
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
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Item revision (tùy chọn)</span>
            <Select
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
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Planned qty</span>
            <Input
              type="number"
              min={1}
              value={admin.createForm.planned_qty}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, planned_qty: Number(e.target.value) })
              }
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Planned start</span>
            <Input
              type="datetime-local"
              value={admin.createForm.planned_start}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, planned_start: e.target.value })
              }
              required
            />
          </label>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={admin.closeCreate}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={admin.createErrors.length > 0 || admin.createPending}
            >
              Tạo
            </Button>
          </div>
          {admin.createError ? (
            <p className="text-sm text-[var(--color-danger-text)] mt-2" role="alert">
              {admin.createError.code}: {admin.createError.message}
            </p>
          ) : null}
        </form>
      </Dialog>

      {banner ? (
        <p className="wo-admin__state" role={admin.listState === 'error' ? 'alert' : 'status'}>
          {banner}
          {admin.listError ? ` (${admin.listError.code})` : ''}
        </p>
      ) : null}

      {admin.listState === 'ready' ? (
        <div className="wo-admin__layout">
          <div className="wo-admin__table-wrap flex flex-col gap-4">
            <GenericDataTable
              data={pagination.paginatedItems}
              columns={columns}
              pagination={pagination}
              onRowClick={(row) => admin.selectWorkOrder(row.id)}
              getRowClassName={(row) =>
                row.id === admin.selectedId
                  ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]'
                  : ''
              }
            />
            {admin.hasMore && (
              <Button
                type="button"
                variant="secondary"
                className="self-center"
                onClick={admin.loadMore}
              >
                Nạp thêm từ Server
              </Button>
            )}
          </div>

          {admin.detailLoading ? (
            <div className="wo-admin__state">Đang tải chi tiết…</div>
          ) : admin.detail ? (
            <WorkOrderEditor key={admin.detail.id} detail={admin.detail} admin={admin} />
          ) : (
            <div className="wo-admin__detail flex flex-col items-center justify-center text-center p-8 gap-2 min-h-[300px]">
              <Search size={32} className="text-[var(--text-muted)] opacity-60" />
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Chưa chọn lệnh sản xuất</h4>
              <p className="text-xs text-[var(--text-secondary)]">Chọn một lệnh sản xuất từ danh sách bên trái để xem chi tiết và cập nhật tiến độ.</p>
            </div>
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
