import { useState, useEffect } from 'react'
import { Link } from 'react-router'

import { useRouting } from '../hooks/useRouting'
import { MACHINE_STATUSES } from '../types/routing'
import type { MachineRecord, RoutingHeaderRecord, WorkCenterRecord, RoutingRow, WorkCenterRow, MachineRow } from '../types/routing'

import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Input, Select, Textarea } from '@/shared/components/ui/Input'
import { Dialog } from '@/shared/components/ui/Dialog'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { Search, FileSpreadsheet, Download, AlertCircle } from 'lucide-react'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { usePagination } from '@/shared/lib/usePagination'
import { GenericDataTable, ColumnDef } from '@/shared/components/ui/DataTable'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/Table'
import { useImportExportCenter } from '@/modules/excel_import_export/hooks/useImportExportCenter'

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

function WorkCenterEditor({ detail, admin, onClose }: { detail: WorkCenterRecord; admin: Api; onClose: () => void }) {
  const [name, setName] = useState(detail.name)
  const [capacityPerHour, setCapacityPerHour] = useState(String(detail.capacity_per_hour))
  const [capacityUomId, setCapacityUomId] = useState(detail.capacity_uom_id)
  const row = admin.wcDetailRow

  return (
    <div className="flex flex-col gap-4 font-sans text-sm">
      <h3>{detail.code}</h3>
      <p className="routing-admin__muted">
        {detail.name} · {row?.capacityUomLabel ?? '-'}
      </p>

      <label className="flex flex-col gap-1.5 mb-3">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Tên work center</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1.5 mb-3">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Capacity / giờ</span>
        <Input
          inputMode="decimal"
          value={capacityPerHour}
          onChange={(e) => setCapacityPerHour(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1.5 mb-4">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Capacity UoM</span>
        <Select value={capacityUomId} onChange={(e) => setCapacityUomId(Number(e.target.value))}>
          {admin.uoms.map((u) => (
            <option key={u.id} value={u.id}>
              {u.code} — {u.uom_name}
            </option>
          ))}
        </Select>
      </label>

      <div className="flex justify-end gap-2 mt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Đóng
        </Button>
        <Button
          type="button"
          disabled={!row?.canUpdate || admin.updateWcPending}
          title={row?.updateDisabledReason ?? undefined}
          onClick={() => {
            if (!window.confirm('Xác nhận lưu thay đổi work center này?')) return
            admin.saveWcEdit({
              name: name.trim(),
              capacity_per_hour: Number(capacityPerHour),
              capacity_uom_id: capacityUomId,
            })
          }}
        >
          {admin.updateWcPending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
      </div>
      {!row?.canUpdate ? (
        <p className="routing-admin__muted mt-1 text-right">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateWcError ? (
        <p className="routing-admin__error mt-2" role="alert">
          {admin.updateWcError.code}: {admin.updateWcError.message}
        </p>
      ) : null}
      {admin.updateWcSuccess ? (
        <p className="routing-admin__banner mt-2" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4 className="mt-6 border-t border-[var(--border-default)] pt-4">Deactivate</h4>
      <Button
        type="button"
        variant="danger"
        disabled={!row?.canDeactivate}
        title={row?.deactivateDisabledReason ?? undefined}
        onClick={() => admin.setConfirmWcDeactivate(true)}
        className="w-full justify-center"
      >
        Deactivate work center
      </Button>
      {!row?.canDeactivate ? (
        <p className="routing-admin__muted mt-2">
          Deactivate không khả dụng
          {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
        </p>
      ) : null}

      <ConfirmDialog
        isOpen={admin.confirmWcDeactivate}
        onClose={() => admin.setConfirmWcDeactivate(false)}
        onConfirm={admin.deactivateWorkCenter}
        title="Xác nhận deactivate"
        description={`Xác nhận deactivate ${detail.code}? Work center sẽ bị xoá (chỉ khi không còn máy/routing operation gắn).`}
        isPending={admin.deactivateWcState === 'pending'}
      />

      {admin.deactivateWcError ? (
        <p className="routing-admin__error mt-2" role="alert">
          {admin.deactivateWcError.code}: {admin.deactivateWcError.message}
        </p>
      ) : null}
      {admin.deactivateWcState === 'success' ? (
        <p className="routing-admin__banner mt-2" role="status">
          Đã deactivate work center.
        </p>
      ) : null}
    </div>
  )
}

function MachineEditor({ detail, admin, onClose }: { detail: MachineRecord; admin: Api; onClose: () => void }) {
  const [workCenterId, setWorkCenterId] = useState(detail.work_center_id)
  const [lastPmDate, setLastPmDate] = useState(detail.last_pm_date.slice(0, 10))
  const [nextPmDue, setNextPmDue] = useState(detail.next_pm_due.slice(0, 10))
  const [status, setStatus] = useState(detail.status)
  const row = admin.machineDetailRow

  return (
    <div className="flex flex-col gap-4 font-sans text-sm">
      <h3>{detail.code}</h3>
      <p className="routing-admin__muted">
        {row?.workCenterLabel ?? '-'} · {detail.status}
      </p>

      <label className="flex flex-col gap-1.5 mb-3">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Work center</span>
        <Select value={workCenterId} onChange={(e) => setWorkCenterId(Number(e.target.value))}>
          {admin.workCenterOptions.map((wc) => (
            <option key={wc.id} value={wc.id}>
              {wc.code} — {wc.name}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1.5 mb-3">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Last PM date</span>
        <Input type="date" value={lastPmDate} onChange={(e) => setLastPmDate(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1.5 mb-3">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Next PM due</span>
        <Input type="date" value={nextPmDue} onChange={(e) => setNextPmDue(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1.5 mb-4">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Status</span>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          {MACHINE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </label>

      <div className="flex justify-end gap-2 mt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Đóng
        </Button>
        <Button
          type="button"
          disabled={!row?.canUpdate || admin.updateMachinePending}
          title={row?.updateDisabledReason ?? undefined}
          onClick={() => {
            if (!window.confirm('Xác nhận lưu thay đổi máy này?')) return
            admin.saveMachineEdit({
              work_center_id: workCenterId,
              last_pm_date: lastPmDate,
              next_pm_due: nextPmDue,
              status,
            })
          }}
        >
          {admin.updateMachinePending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
      </div>
      {!row?.canUpdate ? (
        <p className="routing-admin__muted mt-1 text-right">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateMachineError ? (
        <p className="routing-admin__error mt-2" role="alert">
          {admin.updateMachineError.code}: {admin.updateMachineError.message}
        </p>
      ) : null}
      {admin.updateMachineSuccess ? (
        <p className="routing-admin__banner mt-2" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4 className="mt-6 border-t border-[var(--border-default)] pt-4">Deactivate</h4>
      <Button
        type="button"
        variant="danger"
        disabled={!row?.canDeactivate}
        title={row?.deactivateDisabledReason ?? undefined}
        onClick={() => admin.setConfirmMachineDeactivate(true)}
        className="w-full justify-center"
      >
        Deactivate máy
      </Button>
      {!row?.canDeactivate ? (
        <p className="routing-admin__muted mt-2">
          Deactivate không khả dụng
          {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
        </p>
      ) : null}

      <ConfirmDialog
        isOpen={admin.confirmMachineDeactivate}
        onClose={() => admin.setConfirmMachineDeactivate(false)}
        onConfirm={admin.deactivateMachine}
        title="Xác nhận deactivate"
        description={`Xác nhận deactivate ${detail.code}?`}
        isPending={admin.deactivateMachineState === 'pending'}
      />

      {admin.deactivateMachineError ? (
        <p className="routing-admin__error mt-2" role="alert">
          {admin.deactivateMachineError.code}: {admin.deactivateMachineError.message}
        </p>
      ) : null}
      {admin.deactivateMachineState === 'success' ? (
        <p className="routing-admin__banner mt-2" role="status">
          Đã deactivate máy.
        </p>
      ) : null}
    </div>
  )
}

function RoutingEditor({ detail, admin, onClose }: { detail: RoutingHeaderRecord; admin: Api; onClose: () => void }) {
  const [version, setVersion] = useState(detail.version)
  const [effectiveFrom, setEffectiveFrom] = useState(detail.effective_from.slice(0, 10))
  const row = admin.routingDetailRow

  return (
    <div className="flex flex-col gap-4 font-sans text-sm">
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
        <Table containerClassName="border border-[var(--border-default)] rounded-lg bg-[var(--surface-1)] overflow-hidden">
          <TableHeader>
            <TableRow className="pointer-events-none hover:bg-transparent bg-[var(--surface-2)]">
              <TableHead>Operation Code</TableHead>
              <TableHead>Operation Name</TableHead>
              <TableHead>Work Center</TableHead>
              <TableHead>Cycle time</TableHead>
              <TableHead>Setup time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admin.routingOperations.map((op) => (
              <TableRow key={op.code} className="hover:bg-[var(--surface-2)]">
                <TableCell>{op.operation_code}</TableCell>
                <TableCell>{op.operation_name}</TableCell>
                <TableCell>{op.work_center_code ?? '-'}</TableCell>
                <TableCell>
                  {op.standard_cycle_time} {op.standard_cycle_time_uom_code ?? ''}
                </TableCell>
                <TableCell>
                  {op.setup_time} {op.setup_time_uom_code ?? ''}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <h4>Sửa (chỉ khi DRAFT)</h4>
      <label className="flex flex-col gap-1.5 mb-3">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Version</span>
        <Input value={version} onChange={(e) => setVersion(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1.5 mb-4">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Effective from</span>
        <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
      </label>

      <div className="flex justify-end gap-2 mt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Đóng
        </Button>
        <Button
          type="button"
          disabled={!row?.canUpdate || admin.updateRoutingPending}
          title={row?.updateDisabledReason ?? undefined}
          onClick={() => {
            if (!window.confirm('Xác nhận lưu thay đổi định tuyến này?')) return
            admin.saveRoutingEdit({
              version: version.trim(),
              effective_from: effectiveFrom,
            })
          }}
        >
          {admin.updateRoutingPending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
      </div>
      {!row?.canUpdate ? (
        <p className="routing-admin__muted mt-1 text-right">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateRoutingError ? (
        <p className="routing-admin__error mt-2" role="alert">
          {admin.updateRoutingError.code}: {admin.updateRoutingError.message}
        </p>
      ) : null}
      {admin.updateRoutingSuccess ? (
        <p className="routing-admin__banner mt-2" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4 className="mt-6 border-t border-[var(--border-default)] pt-4">State transitions</h4>
      <div className="flex flex-wrap gap-2 mt-2">
        <Button
          type="button"
          disabled={!row?.canRelease}
          title={row?.releaseDisabledReason ?? undefined}
          onClick={() => admin.setConfirmRoutingRelease(true)}
        >
          Release
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={!row?.canObsolete}
          title={row?.obsoleteDisabledReason ?? undefined}
          onClick={() => admin.setConfirmRoutingObsolete(true)}
        >
          Obsolete
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={!row?.canDeactivate}
          title={row?.deactivateDisabledReason ?? undefined}
          onClick={() => admin.setConfirmRoutingDeactivate(true)}
        >
          Deactivate
        </Button>
      </div>

      <ConfirmDialog
        isOpen={admin.confirmRoutingRelease}
        onClose={() => admin.setConfirmRoutingRelease(false)}
        onConfirm={admin.releaseRouting}
        title="Xác nhận release"
        description={`Xác nhận release ${detail.code}? Routing RELEASED trước đó của cùng sản phẩm sẽ chuyển sang OBSOLETE.`}
        isPending={admin.releaseRoutingState === 'pending'}
      />

      <ConfirmDialog
        isOpen={admin.confirmRoutingObsolete}
        onClose={() => admin.setConfirmRoutingObsolete(false)}
        onConfirm={admin.obsoleteRouting}
        title="Xác nhận obsolete"
        description={`Xác nhận obsolete ${detail.code}? Routing sẽ không còn dùng cho lệnh sản xuất mới.`}
        isPending={admin.obsoleteRoutingState === 'pending'}
      />

      <ConfirmDialog
        isOpen={admin.confirmRoutingDeactivate}
        onClose={() => admin.setConfirmRoutingDeactivate(false)}
        onConfirm={admin.deactivateRouting}
        title="Xác nhận deactivate"
        description={`Xác nhận deactivate ${detail.code}? Routing sẽ chuyển sang OBSOLETE.`}
        isPending={admin.deactivateRoutingState === 'pending'}
      />

      {admin.releaseRoutingError ? (
        <p className="routing-admin__error mt-2" role="alert">
          {admin.releaseRoutingError.code}: {admin.releaseRoutingError.message}
        </p>
      ) : null}
      {admin.obsoleteRoutingError ? (
        <p className="routing-admin__error mt-2" role="alert">
          {admin.obsoleteRoutingError.code}: {admin.obsoleteRoutingError.message}
        </p>
      ) : null}
      {admin.deactivateRoutingError ? (
        <p className="routing-admin__error mt-2" role="alert">
          {admin.deactivateRoutingError.code}: {admin.deactivateRoutingError.message}
        </p>
      ) : null}

      {(admin.releaseRoutingState === 'success' ||
        admin.obsoleteRoutingState === 'success' ||
        admin.deactivateRoutingState === 'success') ? (
        <p className="routing-admin__banner mt-2" role="status">
          Đã cập nhật trạng thái routing.
        </p>
      ) : null}
    </div>
  )
}

export function RoutingPage() {
  const admin = useRouting()
  const routingPagination = usePagination(admin.routingRows, 10)
  const wcPagination = usePagination(admin.wcRows, 10)
  const machinePagination = usePagination(admin.machineRows, 10)

  const [isExcelOpen, setIsExcelOpen] = useState(false)
  const [isRoutingDetailOpen, setIsRoutingDetailOpen] = useState(false)
  const [isWcDetailOpen, setIsWcDetailOpen] = useState(false)
  const [isMachineDetailOpen, setIsMachineDetailOpen] = useState(false)

  const ie = useImportExportCenter()

  useEffect(() => {
    if (isExcelOpen) {
      ie.setTemplateCode('ROUTING_IMPORT')
    }
  }, [isExcelOpen])

  const routingColumns: ColumnDef<RoutingRow>[] = [
    {
      header: 'Code',
      cell: (row) => (
        <button
          type="button"
          className="routing-admin__linkish"
          onClick={(e) => {
            e.stopPropagation()
            admin.selectRouting(row.code)
            setIsRoutingDetailOpen(true)
          }}
        >
          {row.code}
        </button>
      ),
    },
    {
      header: 'Sản phẩm',
      cell: (row) => row.productItemLabel,
    },
    {
      header: 'Version',
      cell: (row) => row.version,
    },
    {
      header: 'Status',
      cell: (row) => row.status,
    },
    {
      header: 'Effective from',
      cell: (row) => row.effectiveFrom,
    },
  ]

  const wcColumns: ColumnDef<WorkCenterRow>[] = [
    {
      header: 'Code',
      cell: (row) => (
        <button
          type="button"
          className="routing-admin__linkish"
          onClick={(e) => {
            e.stopPropagation()
            admin.selectWorkCenter(row.code)
            setIsWcDetailOpen(true)
          }}
        >
          {row.code}
        </button>
      ),
    },
    {
      header: 'Tên',
      cell: (row) => row.name,
    },
    {
      header: 'Capacity/giờ',
      cell: (row) => row.capacityPerHour,
    },
    {
      header: 'UOM',
      cell: (row) => row.capacityUomLabel,
    },
  ]

  const machineColumns: ColumnDef<MachineRow>[] = [
    {
      header: 'Code',
      cell: (row) => (
        <button
          type="button"
          className="routing-admin__linkish"
          onClick={(e) => {
            e.stopPropagation()
            admin.selectMachine(row.code)
            setIsMachineDetailOpen(true)
          }}
        >
          {row.code}
        </button>
      ),
    },
    {
      header: 'Work center',
      cell: (row) => row.workCenterLabel,
    },
    {
      header: 'Status',
      cell: (row) => row.status,
    },
    {
      header: 'Next PM due',
      cell: (row) => row.nextPmDue,
    },
  ]

  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Sản xuất', href: '/web/mes/dashboards' },
          { label: 'Định tuyến (Routing)' },
        ]}
        title="Giai đoạn (GĐ), Trạm máy & Routing"
        subtitle="Quản lý khu công đoạn (Work Center), máy móc thiết bị và quy trình định tuyến sản xuất."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsExcelOpen(true)}>Trung tâm Xuất/Nhập</Button>
          </div>
        }
      />

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
          <FilterBar
            fields={[
              {
                name: 'rtSearchInput',
                type: 'text',
                placeholder: 'Tìm theo mã / phiên bản định tuyến...'
              }
            ]}
            values={{ rtSearchInput: admin.rtSearchInput }}
            onChange={(_, val) => admin.setRtSearchInput(val)}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyRoutingSearch()
            }}
            onReset={admin.clearRoutingSearch}
            isResetActive={!!admin.rtSearchInput}
            className="w-full flex-nowrap"
          >
            <div className="ml-auto flex items-center">
              <Button type="button" variant="secondary" size="sm" onClick={admin.openRoutingCreate} className="mr-3">
                Tạo định tuyến mới
              </Button>
            </div>
          </FilterBar>

          <Dialog
            isOpen={admin.showRoutingCreate}
            onClose={admin.closeRoutingCreate}
            title="Tạo routing mới"
            maxWidth="max-w-[50%]"
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!window.confirm('Xác nhận tạo định tuyến này?')) return
                admin.createRouting()
              }}
            >
              <p className="text-xs text-[var(--text-muted)]">
                Form luôn hiển thị — server enforce quyền tạo (MES03-013).
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Code</span>
                <Input
                  value={admin.routingCreateForm.code}
                  onChange={(e) =>
                    admin.setRoutingCreateForm({ ...admin.routingCreateForm, code: e.target.value })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Sản phẩm (item)</span>
                <Select
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
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Version</span>
                <Input
                  value={admin.routingCreateForm.version}
                  onChange={(e) =>
                    admin.setRoutingCreateForm({ ...admin.routingCreateForm, version: e.target.value })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Status khởi tạo</span>
                <Select
                  value={admin.routingCreateForm.status}
                  onChange={(e) =>
                    admin.setRoutingCreateForm({ ...admin.routingCreateForm, status: e.target.value })
                  }
                >
                  <option value="DRAFT">DRAFT</option>
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Effective from</span>
                <Input
                  type="date"
                  value={admin.routingCreateForm.effective_from}
                  onChange={(e) =>
                    admin.setRoutingCreateForm({
                      ...admin.routingCreateForm,
                      effective_from: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={admin.closeRoutingCreate}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={admin.routingCreateErrors.length > 0 || admin.createRoutingPending}
                >
                  {admin.createRoutingPending ? 'Đang tạo…' : 'Tạo'}
                </Button>
              </div>
              {admin.createRoutingError ? (
                <p className="text-sm text-[var(--color-danger-text)] mt-2" role="alert">
                  {admin.createRoutingError.code}: {admin.createRoutingError.message}
                </p>
              ) : null}
            </form>
          </Dialog>

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
            <div className="flex flex-col gap-4">
              <GenericDataTable
                data={routingPagination.paginatedItems}
                columns={routingColumns}
                pagination={routingPagination}
                hasMore={admin.routingHasMore}
                onLoadMore={admin.routingLoadMore}
                onRowClick={(row) => {
                  admin.selectRouting(row.code)
                  setIsRoutingDetailOpen(true)
                }}
                getRowClassName={(row) =>
                  row.code === admin.selectedRoutingCode
                    ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]'
                    : ''
                }
              />
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'work_centers' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'wcSearchInput',
                type: 'text',
                placeholder: 'Tìm theo mã / tên khu công đoạn...'
              }
            ]}
            values={{ wcSearchInput: admin.wcSearchInput }}
            onChange={(_, val) => admin.setWcSearchInput(val)}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyWcSearch()
            }}
            onReset={admin.clearWcSearch}
            isResetActive={!!admin.wcSearchInput}
            className="w-full flex-nowrap"
          >
            <div className="ml-auto flex items-center">
              <Button type="button" variant="secondary" size="sm" onClick={admin.openWcCreate} className="mr-3">
                Tạo khu công đoạn
              </Button>
            </div>
          </FilterBar>

          <Dialog
            isOpen={admin.showWcCreate}
            onClose={admin.closeWcCreate}
            title="Tạo work center mới"
            maxWidth="max-w-[50%]"
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!window.confirm('Xác nhận tạo work center này?')) return
                admin.createWorkCenter()
              }}
            >
              <p className="text-xs text-[var(--text-muted)]">
                Form luôn hiển thị — server enforce quyền tạo (MES03-003).
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Code</span>
                <Input
                  value={admin.wcCreateForm.code}
                  onChange={(e) =>
                    admin.setWcCreateForm({ ...admin.wcCreateForm, code: e.target.value })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Tên work center</span>
                <Input
                  value={admin.wcCreateForm.name}
                  onChange={(e) => admin.setWcCreateForm({ ...admin.wcCreateForm, name: e.target.value })}
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Capacity / giờ</span>
                <Input
                  inputMode="decimal"
                  value={admin.wcCreateForm.capacity_per_hour || ''}
                  onChange={(e) =>
                    admin.setWcCreateForm({
                      ...admin.wcCreateForm,
                      capacity_per_hour: Number(e.target.value) || 0,
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Capacity UoM</span>
                <Select
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
                </Select>
              </label>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={admin.closeWcCreate}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={admin.wcCreateErrors.length > 0 || admin.createWcPending}
                >
                  {admin.createWcPending ? 'Đang tạo…' : 'Tạo'}
                </Button>
              </div>
              {admin.createWcError ? (
                <p className="text-sm text-[var(--color-danger-text)] mt-2" role="alert">
                  {admin.createWcError.code}: {admin.createWcError.message}
                </p>
              ) : null}
            </form>
          </Dialog>

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
            <div className="flex flex-col gap-4">
              <GenericDataTable
                data={wcPagination.paginatedItems}
                columns={wcColumns}
                pagination={wcPagination}
                hasMore={admin.wcHasMore}
                onLoadMore={admin.wcLoadMore}
                onRowClick={(row) => {
                  admin.selectWorkCenter(row.code)
                  setIsWcDetailOpen(true)
                }}
                getRowClassName={(row) =>
                  row.code === admin.selectedWcCode
                    ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]'
                    : ''
                }
              />
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'machines' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'mSearchInput',
                type: 'text',
                placeholder: 'Tìm theo mã thiết bị...'
              }
            ]}
            values={{ mSearchInput: admin.mSearchInput }}
            onChange={(_, val) => admin.setMSearchInput(val)}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyMachineSearch()
            }}
            onReset={admin.clearMachineSearch}
            isResetActive={!!admin.mSearchInput}
            className="w-full flex-nowrap"
          >
            <div className="ml-auto flex items-center">
              <Button type="button" variant="secondary" size="sm" onClick={admin.openMachineCreate} className="mr-3">
                Tạo thiết bị mới
              </Button>
            </div>
          </FilterBar>

          <Dialog
            isOpen={admin.showMachineCreate}
            onClose={admin.closeMachineCreate}
            title="Tạo máy mới"
            maxWidth="max-w-[50%]"
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!window.confirm('Xác nhận tạo máy này?')) return
                admin.createMachine()
              }}
            >
              <p className="text-xs text-[var(--text-muted)]">
                Form luôn hiển thị — server enforce quyền tạo (MES03-008).
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Code</span>
                <Input
                  value={admin.machineCreateForm.code}
                  onChange={(e) =>
                    admin.setMachineCreateForm({ ...admin.machineCreateForm, code: e.target.value })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Work center</span>
                <Select
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
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Last PM date</span>
                <Input
                  type="date"
                  value={admin.machineCreateForm.last_pm_date}
                  onChange={(e) =>
                    admin.setMachineCreateForm({
                      ...admin.machineCreateForm,
                      last_pm_date: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Next PM due</span>
                <Input
                  type="date"
                  value={admin.machineCreateForm.next_pm_due}
                  onChange={(e) =>
                    admin.setMachineCreateForm({
                      ...admin.machineCreateForm,
                      next_pm_due: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Status</span>
                <Select
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
                </Select>
              </label>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={admin.closeMachineCreate}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={admin.machineCreateErrors.length > 0 || admin.createMachinePending}
                >
                  {admin.createMachinePending ? 'Đang tạo…' : 'Tạo'}
                </Button>
              </div>
              {admin.createMachineError ? (
                <p className="text-sm text-[var(--color-danger-text)] mt-2" role="alert">
                  {admin.createMachineError.code}: {admin.createMachineError.message}
                </p>
              ) : null}
            </form>
          </Dialog>

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
            <div className="flex flex-col gap-4">
              <GenericDataTable
                data={machinePagination.paginatedItems}
                columns={machineColumns}
                pagination={machinePagination}
                hasMore={admin.machineHasMore}
                onLoadMore={admin.machineLoadMore}
                onRowClick={(row) => {
                  admin.selectMachine(row.code)
                  setIsMachineDetailOpen(true)
                }}
                getRowClassName={(row) =>
                  row.code === admin.selectedMachineCode
                    ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]'
                    : ''
                }
              />
            </div>
          ) : null}
        </>
      ) : null}

      {/* Excel Import/Export Dialog Modal */}
      <Dialog
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        title="Nhập / Xuất dữ liệu Excel (Routing)"
        maxWidth="max-w-[75%]"
      >
        <div className="flex flex-col gap-6 font-sans text-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Import segment */}
            <div className="flex flex-col gap-4 bg-[var(--surface-1)] p-5 rounded-xl border border-[var(--border-default)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-[var(--color-action-primary)]" />
                Khởi tạo Batch Nhập dữ liệu mới
              </h3>
              <form
                className="flex flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!window.confirm('Xác nhận tạo lô nạp dữ liệu (Import Batch) mới từ file nguồn?')) return
                  ie.createBatch()
                }}
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">ID File nguồn</span>
                  <Input
                    value={ie.sourceFileId}
                    onChange={(event) => ie.setSourceFileId(event.target.value)}
                    placeholder="Nhập ID file dữ liệu nguồn..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Chế độ ghi nhận (Commit Mode)</span>
                    <Select
                      value={ie.mode}
                      onChange={(event) => ie.setMode(event.target.value)}
                    >
                      <option value="ALL_OR_NOTHING">Lưu tất cả hoặc hủy (ALL_OR_NOTHING)</option>
                      <option value="PARTIAL">Lưu một phần (PARTIAL)</option>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Chế độ nhập (Import Mode)</span>
                    <Select
                      value={ie.importMode}
                      onChange={(event) => ie.setImportMode(event.target.value)}
                    >
                      <option value="UPSERT">Cập nhật hoặc thêm mới (UPSERT)</option>
                      <option value="CREATE_ONLY">Chỉ thêm mới (CREATE_ONLY)</option>
                      <option value="UPDATE_ONLY">Chỉ cập nhật (UPDATE_ONLY)</option>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-between items-center gap-2 mt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={ie.downloadTemplate}
                    disabled={ie.downloadPending}
                  >
                    <Download size={14} className="mr-1.5" />
                    Tải template
                  </Button>
                  <Button type="submit" disabled={ie.createPending}>
                    Tạo import batch
                  </Button>
                </div>
              </form>
              {ie.createError && (
                <div className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] text-xs flex items-center gap-2" role="alert">
                  <AlertCircle size={14} />
                  <span>{ie.createError.code}: {ie.createError.message}</span>
                </div>
              )}
            </div>

            {/* Active Batch details if available */}
            <div className="flex flex-col gap-4 bg-[var(--surface-1)] p-5 rounded-xl border border-[var(--border-default)]">
              {ie.detailRow ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">Lô đang hoạt động: {ie.detailRow.code}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ie.detailRow.status === 'COMMITTED' ? 'bg-green-100 text-green-800' : ie.detailRow.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      {ie.detailRow.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Tổng số bản ghi</span>
                      <p className="font-semibold text-sm text-[var(--text-primary)] mt-0.5">{ie.detailRow.totalRows}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Số dòng lỗi</span>
                      <p className="font-semibold text-sm text-[var(--color-danger-text)] mt-0.5">{ie.detailRow.failedRows}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Nạp thành công</span>
                      <p className="font-semibold text-sm text-[var(--color-success-text)] mt-0.5">{ie.detailRow.successRows}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Người khởi tạo</span>
                      <p className="font-semibold text-sm mt-0.5 text-[var(--text-primary)]">{ie.detailRow.startedBy}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    {ie.detailRow.canValidate && (
                      <Button
                        type="button"
                        onClick={() => {
                          if (!window.confirm('Xác nhận kiểm tra tính hợp lệ của lô nạp dữ liệu này?')) return
                          ie.runValidate()
                        }}
                      >
                        Kiểm tra (Validate)
                      </Button>
                    )}
                    {ie.detailRow.canCommit && (
                      <Button
                        type="button"
                        onClick={() => {
                          ie.setConfirmAction('commit')
                        }}
                      >
                        Ghi nhận vào DB (Commit)
                      </Button>
                    )}
                    {ie.detailRow.canCancel && (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => {
                          ie.setConfirmAction('cancel')
                        }}
                      >
                        Hủy bỏ lô (Cancel)
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] py-12">
                  <AlertCircle size={24} className="opacity-40 mb-2" />
                  <p className="text-xs">Chưa có lô nạp dữ liệu nào được khởi tạo hoặc chọn.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Action Dialog inside Modal */}
        <ConfirmDialog
          isOpen={ie.confirmAction !== null}
          onClose={() => ie.setConfirmAction(null)}
          onConfirm={ie.runConfirmedAction}
          title={ie.confirmAction === 'commit' ? 'Xác nhận Commit' : 'Xác nhận Hủy'}
          description={
            ie.confirmAction === 'commit'
              ? 'Xác nhận ghi nhận tất cả dữ liệu hợp lệ trong lô nạp này vào cơ sở dữ liệu hệ thống?'
              : 'Xác nhận hủy bỏ hoàn toàn lô nạp dữ liệu này?'
          }
          isPending={ie.mutationState === 'pending'}
        />
      </Dialog>

      {/* Routing Detail Dialog */}
      <Dialog
        isOpen={isRoutingDetailOpen && (!!admin.routingDetail || admin.routingDetailLoading)}
        onClose={() => setIsRoutingDetailOpen(false)}
        title={admin.routingDetail ? `Chi tiết Routing: ${admin.routingDetail.code}` : 'Chi tiết Routing'}
        maxWidth="max-w-[75%]"
      >
        {admin.routingDetailLoading ? (
          <div className="p-6 text-center text-slate-500">Đang tải chi tiết...</div>
        ) : admin.routingDetail ? (
          <div className="max-h-[75vh] overflow-y-auto pr-2">
            <RoutingEditor detail={admin.routingDetail} admin={admin} onClose={() => setIsRoutingDetailOpen(false)} />
          </div>
        ) : null}
      </Dialog>

      {/* Work Center Detail Dialog */}
      <Dialog
        isOpen={isWcDetailOpen && (!!admin.wcDetail || admin.wcDetailLoading)}
        onClose={() => setIsWcDetailOpen(false)}
        title={admin.wcDetail ? `Chi tiết Work Center: ${admin.wcDetail.code}` : 'Chi tiết Work Center'}
        maxWidth="max-w-[50%]"
      >
        {admin.wcDetailLoading ? (
          <div className="p-6 text-center text-slate-500">Đang tải chi tiết...</div>
        ) : admin.wcDetail ? (
          <div className="max-h-[75vh] overflow-y-auto pr-2">
            <WorkCenterEditor detail={admin.wcDetail} admin={admin} onClose={() => setIsWcDetailOpen(false)} />
          </div>
        ) : null}
      </Dialog>

      {/* Machine Detail Dialog */}
      <Dialog
        isOpen={isMachineDetailOpen && (!!admin.machineDetail || admin.machineDetailLoading)}
        onClose={() => setIsMachineDetailOpen(false)}
        title={admin.machineDetail ? `Chi tiết Machine: ${admin.machineDetail.code}` : 'Chi tiết Machine'}
        maxWidth="max-w-[50%]"
      >
        {admin.machineDetailLoading ? (
          <div className="p-6 text-center text-slate-500">Đang tải chi tiết...</div>
        ) : admin.machineDetail ? (
          <div className="max-h-[75vh] overflow-y-auto pr-2">
            <MachineEditor detail={admin.machineDetail} admin={admin} onClose={() => setIsMachineDetailOpen(false)} />
          </div>
        ) : null}
      </Dialog>
    </section>
  )
}
