import { useState } from 'react'
import { Link } from 'react-router'

import { isSystemAdminSession } from '@/shared/api'
import { useAuthStore } from '@/shared/store/authStore'

import { useWorkerJobConsole } from '../hooks/useWorkerJobConsole'

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
        }
      />

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <form
          className="grid grid-cols-1 md:grid-cols-4 gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            jobs.applyFilters()
          }}
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400">Từ khóa (q)</span>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={jobs.draftFilters.q}
                onChange={(event) => jobs.setDraftFilter('q', event.target.value)}
                placeholder="Job key, display name..."
                className="pl-8 h-9"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400">Category</span>
            <Input
              value={jobs.draftFilters.job_category}
              onChange={(event) => jobs.setDraftFilter('job_category', event.target.value)}
              placeholder="e.g. system, calculation..."
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400">Module Scope</span>
            <Input
              value={jobs.draftFilters.module_scope}
              onChange={(event) => jobs.setDraftFilter('module_scope', event.target.value)}
              placeholder="e.g. MES, WMS..."
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400">Trạng thái</span>
            <Select
              value={jobs.draftFilters.enabled}
              onChange={(event) => jobs.setDraftFilter('enabled', event.target.value)}
              className="h-9"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang kích hoạt (ON)</option>
              <option value="false">Đang tắt (OFF)</option>
            </Select>
          </div>
          
          <div className="md:col-span-4 flex justify-end gap-2 mt-1">
            <Button type="button" variant="ghost" size="sm" onClick={jobs.clearFilters}>
              Xóa bộ lọc
            </Button>
            <Button type="submit" size="sm" className="px-5">
              Áp dụng lọc
            </Button>
          </div>
        </form>
      </div>

      {banner && (
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-500 text-sm">
          {banner}
          {jobs.listError ? ` (${jobs.listError.code})` : ''}
        </div>
      )}

      {/* Worker Jobs List Table */}
      {(jobs.rows.length > 0) && (
        <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <Table containerClassName="relative w-full overflow-auto">
            <TableHeader>
              <TableRow className="pointer-events-none hover:bg-transparent">
                <TableHead>Mã tác vụ (Job key)</TableHead>
                <TableHead>Tên hiển thị (Display Name)</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Kết quả lần cuối</TableHead>
                <TableHead>Lần chạy tiếp theo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.rows.map((row) => (
                <TableRow
                  key={row.jobKey}
                  className={`hover:bg-slate-50/50 cursor-pointer ${
                    row.jobKey === jobs.selectedKey ? 'bg-blue-50/50 dark:bg-slate-800/80' : ''
                  }`}
                  onClick={() => {
                    jobs.setSelectedKey(row.jobKey)
                    setIsDetailOpen(true)
                  }}
                >
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="font-semibold text-slate-850 dark:text-slate-100">{row.displayName}</TableCell>
                  <TableCell>
                    <Badge variant={row.enabled ? 'active' : 'inactive'}>
                      {row.enabled ? 'ON' : 'OFF'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.lastStatus === 'SUCCESS' ? 'active' : row.lastStatus === 'FAILED' ? 'inactive' : 'default'}>
                      {row.lastStatus || 'NONE'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-450 text-xs whitespace-nowrap">{row.nextRunAt || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {jobs.hasMore && (
            <div className="flex justify-center p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 px-6"
                onClick={jobs.loadMore}
              >
                Tải thêm worker jobs
              </Button>
            </div>
          )}
        </div>
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
