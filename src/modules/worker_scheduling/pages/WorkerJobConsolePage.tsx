import { useState } from 'react'
import { Link } from 'react-router'

import { isSystemAdminSession } from '@/shared/api'
import { useAuthStore } from '@/shared/store/authStore'

import { useWorkerJobConsole } from '../hooks/useWorkerJobConsole'

import { usePagination } from '@/shared/lib/usePagination'
import { GenericDataTable, ColumnDef } from '@/shared/components/ui/DataTable'
import type { WorkerJobRow } from '../types/workerJob'

// Import Tailwind Shadcn UI & Layout components
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Input, Select } from '@/shared/components/ui/Input'
import { Badge } from '@/shared/components/ui/Badge'
import { Dialog } from '@/shared/components/ui/Dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/shared/components/ui/Table'
import {
  Cpu,
  Search,
  RotateCw,
  XCircle,
  AlertCircle,
  Play,
  Save,
  CheckCircle2,
  Clock,
  Briefcase,
  History,
  Terminal,
} from 'lucide-react'
import { FilterBar } from '@/shared/components/ui/FilterBar'

import './WorkerJobConsolePage.css'

function stateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải worker jobs...'
    case 'empty':
      return 'Chưa có worker job.'
    case 'no-result':
      return 'Không có job khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem Worker Job Console (system_admin_only).'
    case 'error':
      return 'Không tải được danh sách worker jobs.'
    default:
      return ''
  }
}

export function WorkerJobConsolePage() {
  const session = useAuthStore((state) => state.session)
  const jobs = useWorkerJobConsole()
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const pagination = usePagination(jobs.rows, 10)

  const columns: ColumnDef<WorkerJobRow>[] = [
    {
      header: 'Mã tác vụ (Job key)',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="px-0 py-0 h-auto font-semibold hover:underline"
          onClick={(e) => {
            e.stopPropagation()
            jobs.setSelectedKey(row.jobKey)
            setIsDetailOpen(true)
          }}
        >
          {row.jobKey}
        </Button>
      ),
    },
    {
      header: 'Tên hiển thị (Display Name)',
      cell: (row) => <span className="font-semibold text-slate-850 dark:text-slate-100">{row.displayName}</span>,
    },
    {
      header: 'Trạng thái',
      cell: (row) => (
        <Badge variant={row.enabled ? 'active' : 'inactive'}>
          {row.enabled ? 'ON' : 'OFF'}
        </Badge>
      ),
    },
    {
      header: 'Kết quả lần cuối',
      cell: (row) => (
        <Badge variant={row.lastStatus === 'SUCCESS' ? 'active' : row.lastStatus === 'FAILED' ? 'inactive' : 'default'}>
          {row.lastStatus || 'NONE'}
        </Badge>
      ),
    },
    {
      header: 'Lần chạy tiếp theo',
      cell: (row) => <span className="text-slate-450 text-xs whitespace-nowrap">{row.nextRunAt || '-'}</span>,
    },
  ]

  if (!isSystemAdminSession(session)) {
    return (
      <section className="flex flex-col gap-6 font-sans">
        <PageHeader
          breadcrumbs={[
            { label: 'Trang chủ', href: '/home' },
            { label: 'Quản trị hệ thống', href: '/admin' },
            { label: 'Worker Jobs' },
          ]}
          title="Worker Job Console"
          subtitle="Quản trị tác vụ ngầm (worker jobs) trong hệ thống."
        />
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-sm flex items-center gap-2" role="alert">
          <AlertCircle size={16} />
          <span>Bạn không có quyền xem Worker Job Console (chỉ dành cho system_admin).</span>
        </div>
      </section>
    )
  }

  const banner = stateMessage(jobs.listState)

  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Quản trị', href: '/admin' },
          { label: 'Worker Jobs' },
        ]}
        title="Worker Job Console"
        subtitle="Quản trị danh sách tác vụ ngầm, thay đổi tần suất (cron), kích hoạt/vô hiệu hóa và xem lịch sử chạy."
        actions={
          <div className="flex gap-2">
            {jobs.hasMore && (
              <Button
                variant="secondary"
                size="sm"
                className="h-9"
                onClick={jobs.loadMore}
              >
                Tải thêm worker jobs
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 h-9"
              onClick={jobs.refresh}
              disabled={jobs.listState === 'loading'}
            >
              <RotateCw size={14} className={jobs.listState === 'loading' ? 'animate-spin' : ''} />
              Làm mới
            </Button>
          </div>
        }
      />

      <FilterBar
        fields={[
          {
            name: 'q',
            type: 'text',
            label: 'Từ khóa tìm kiếm',
            placeholder: 'Nhập mã job, tên hiển thị...'
          },
          {
            name: 'job_category',
            type: 'text',
            label: 'Phân loại (Category)',
            placeholder: 'Ví dụ: system, calculation...'
          },
          {
            name: 'module_scope',
            type: 'text',
            label: 'Phạm vi module',
            placeholder: 'Ví dụ: MES, WMS...'
          },
          {
            name: 'enabled',
            type: 'select',
            label: 'Trạng thái hoạt động',
            options: [
              { value: '', label: 'Tất cả trạng thái' },
              { value: 'true', label: 'Đang hoạt động (Kích hoạt)' },
              { value: 'false', label: 'Tạm ngưng (Tắt)' }
            ]
          }
        ]}
        values={jobs.draftFilters}
        onChange={(name, value) => jobs.setDraftFilter(name as any, value)}
        onSubmit={(event) => {
          event.preventDefault()
          jobs.applyFilters()
        }}
        onReset={jobs.clearFilters}
        isResetActive={Object.values(jobs.draftFilters).some(Boolean)}
      />

      {banner && jobs.listState !== 'loading' && (
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-500 text-sm">
          {banner}
          {jobs.listError ? ` (${jobs.listError.code})` : ''}
        </div>
      )}

      {/* Worker Jobs List Table */}
      {(jobs.rows.length > 0 || jobs.listState === 'loading') && (
        <GenericDataTable
          data={pagination.paginatedItems}
          columns={columns}
          pagination={pagination}
          isLoading={jobs.listState === 'loading'}
          onRowClick={(row) => {
            jobs.setSelectedKey(row.jobKey)
            setIsDetailOpen(true)
          }}
          getRowClassName={(row) => row.jobKey === jobs.selectedKey ? 'bg-blue-50/50 dark:bg-slate-800/80' : ''}
        />
      )}

      {/* Details Dialog Modal Overlay */}
      <Dialog
        isOpen={isDetailOpen && !!jobs.selectedKey && !!jobs.detailRow}
        onClose={() => setIsDetailOpen(false)}
        title={jobs.detailRow ? `Worker: ${jobs.detailRow.jobKey}` : 'Chi tiết tác vụ'}
      >
        {jobs.detailRow && jobs.selectedJob ? (
          <div className="flex flex-col gap-4 font-sans text-sm">
            {/* Metadata Fields */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Phân hệ / Category</span>
                <div className="mt-1 font-semibold text-slate-850 dark:text-slate-200 flex items-center gap-1.5 truncate">
                  <Briefcase size={13} className="text-slate-400" />
                  <span className="truncate">{jobs.detailRow.category} / {jobs.detailRow.moduleScope}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Hàng đợi (Queue)</span>
                <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200 font-mono text-xs truncate" title={jobs.detailRow.queueName}>
                  {jobs.detailRow.queueName}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Kích hoạt</span>
                <div className="mt-1">
                  <Badge variant={jobs.detailRow.enabled ? 'active' : 'inactive'}>
                    {jobs.detailRow.enabled ? 'ON' : 'OFF'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description Text */}
            <div className="flex flex-col gap-1 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <span className="text-xs font-semibold text-slate-400 uppercase">Mô tả tác vụ</span>
              <span className="font-semibold text-slate-750 dark:text-slate-200">
                {jobs.selectedJob.description_vi || 'Không có mô tả bằng tiếng Việt.'}
              </span>
            </div>

            {/* Configuration Inputs form */}
            <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Lý do cập nhật (updated_reason) <strong className="text-red-500">*</strong></span>
                <Input
                  value={jobs.reason}
                  onChange={(event) => jobs.setReason(event.target.value)}
                  placeholder="Ghi nhận lý do bắt buộc để thay đổi cấu hình..."
                  className="h-9"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Biểu thức chu kỳ chạy (cron_expr)</span>
                <Input
                  value={jobs.cronDraft}
                  onChange={(event) => jobs.setCronDraft(event.target.value)}
                  placeholder="Ví dụ: */5 * * * *"
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-1">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 gap-1"
                disabled={!jobs.reason.trim() || jobs.actionPending}
                onClick={jobs.toggle}
              >
                <Cpu size={14} />
                Toggle Enabled
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 gap-1"
                disabled={!jobs.reason.trim() || jobs.actionPending}
                onClick={jobs.saveCron}
              >
                <Save size={14} />
                Lưu Cron
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 gap-1"
                disabled={jobs.actionPending}
                onClick={jobs.runNow}
              >
                <Play size={14} />
                Run Now
              </Button>
            </div>

            {jobs.actionError && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs flex items-center gap-1.5 mt-2" role="alert">
                <AlertCircle size={14} />
                <span>{jobs.actionError.code}: {jobs.actionError.message}</span>
              </div>
            )}

            {/* Recent runs nested table */}
            <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
              <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                <History size={13} />
                Lịch sử chạy gần đây (Recent runs)
              </span>
              
              {jobs.runsLoading && <div className="text-xs text-slate-450">Đang tải lịch sử...</div>}
              {jobs.runsError && (
                <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs">
                  {jobs.runsError.code}: {jobs.runsError.message}
                </div>
              )}

              <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-36 overflow-y-auto">
                <Table containerClassName="relative w-full overflow-auto">
                  <TableHeader>
                    <TableRow className="pointer-events-none hover:bg-transparent">
                      <TableHead>Run ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Thời gian bắt đầu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.runs.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-mono text-xs text-slate-800 dark:text-slate-200">{run.id}</TableCell>
                        <TableCell>
                          <Badge variant={run.status === 'SUCCESS' ? 'active' : run.status === 'FAILED' ? 'inactive' : 'default'}>
                            {run.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-450 whitespace-nowrap">{run.started_at}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {jobs.runs.length === 0 && !jobs.runsLoading && (
                  <div className="p-4 text-center text-xs text-slate-400">Không có lịch sử chạy.</div>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Đóng chi tiết
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Chọn worker job để thao tác.</p>
        )}
      </Dialog>
    </section>
  )
}
