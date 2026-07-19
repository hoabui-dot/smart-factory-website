import { useState } from 'react'
import { Link } from 'react-router'

import { useAuthStore } from '@/shared/store/authStore'
import { isSystemAdminSession } from '@/shared/api'

import { useAuditViewer } from '../hooks/useAuditViewer'

// Import Tailwind Shadcn UI & Layout components
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
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
  RefreshCw,
  FileDown,
  Search,
  AlertTriangle,
  Clock,
  User,
  Activity,
  Layers,
  Database,
  Globe,
  Terminal,
} from 'lucide-react'

import './AuditViewerPage.css'

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải nhật ký audit…'
    case 'empty':
      return 'Chưa có sự kiện audit.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem Audit Viewer (system_admin_only).'
    case 'error':
      return 'Không tải được danh sách audit. Thử lại sau.'
    case 'not-found':
      return 'Không tìm thấy sự kiện.'
    default:
      return ''
  }
}

function exportStateMessage(state: string, jobCode: string | null, message: string | null): string {
  switch (state) {
    case 'async-processing':
      return 'Đang gửi yêu cầu xuất…'
    case 'queued':
      return jobCode
        ? `Đã xếp hàng xuất audit: ${jobCode}`
        : 'Đã xếp hàng xuất audit.'
    case 'blocked-feature':
      return message ?? 'Xuất audit chưa sẵn sàng (NB03-003 deferred trên backend).'
    case 'permission-denied':
      return 'Không có quyền xuất audit.'
    case 'error':
      return message ?? 'Xuất audit thất bại.'
    default:
      return ''
  }
}

export function AuditViewerPage() {
  const session = useAuthStore((s) => s.session)
  const viewer = useAuditViewer()
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  if (!isSystemAdminSession(session)) {
    return (
      <section className="flex flex-col gap-6 font-sans">
        <PageHeader
          breadcrumbs={[
            { label: 'Trang chủ', href: '/home' },
            { label: 'Quản trị hệ thống', href: '/admin' },
            { label: 'Audit Logs' },
          ]}
          title="Audit Viewer"
          subtitle="Nhật ký append-only activity_events — bảo mật và phân quyền hệ thống."
        />
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-sm flex items-center gap-2" role="alert">
          <AlertTriangle size={16} />
          <span>Bạn không có quyền xem Audit Viewer (chỉ dành cho system_admin).</span>
        </div>
      </section>
    )
  }

  const exportJobCode =
    viewer.exportResult?.job?.code ?? viewer.exportResult?.job_code ?? null
  const banner = listStateMessage(viewer.listState)
  const exportBanner = exportStateMessage(
    viewer.exportState,
    exportJobCode,
    viewer.exportError?.message ?? null,
  )

  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Quản trị', href: '/admin' },
          { label: 'Audit Logs' },
        ]}
        title="Audit Viewer"
        subtitle="Nhật ký append-only activity_events — truy xuất, lọc và xuất bằng chứng kiểm toán."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 h-9"
              onClick={viewer.refresh}
              disabled={viewer.listState === 'loading'}
            >
              <RefreshCw size={14} className={viewer.listState === 'loading' ? 'animate-spin' : ''} />
              Làm mới
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5 h-9"
              onClick={() => viewer.requestExport()}
              disabled={viewer.exportState === 'async-processing'}
            >
              <FileDown size={14} />
              Xuất audit
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <form
          className="flex-1 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            viewer.applySearch()
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={viewer.searchInput}
              onChange={(event) => viewer.setSearchInput(event.target.value)}
              placeholder="Tìm kiếm theo event_type, entity, code hoặc action..."
              className="pl-9 h-9"
              autoComplete="off"
            />
          </div>
          <Button type="submit" size="sm" className="h-9">
            Tìm kiếm
          </Button>
        </form>
      </div>

      {exportBanner && (
        <div
          className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${
            viewer.exportState === 'blocked-feature' || viewer.exportState === 'error'
              ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 border-yellow-200 dark:border-yellow-900/50'
              : 'bg-green-50 dark:bg-green-950/20 text-green-700 border-green-200 dark:border-green-900/50'
          }`}
          role="status"
        >
          <AlertTriangle size={15} className="flex-shrink-0" />
          <span>{exportBanner}</span>
        </div>
      )}

      {banner && viewer.listState !== 'ready' && (
        <div className="p-6 text-center text-sm text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-lg" role="status">
          <p>{banner}</p>
          {viewer.listError && (
            <p className="mt-2 text-xs font-mono text-red-650 bg-red-50 dark:bg-red-950/20 py-1 px-2 rounded inline-block">
              {viewer.listError.code}
            </p>
          )}
        </div>
      )}

      {(viewer.listState === 'ready' || viewer.isRefreshing) && (
        <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <Table containerClassName="relative w-full overflow-auto">
            <TableHeader>
              <TableRow className="pointer-events-none hover:bg-transparent">
                <TableHead>Mã sự kiện</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Vị trí</TableHead>
                <TableHead>Lệnh SX</TableHead>
                <TableHead>Mã Lô</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewer.rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`hover:bg-slate-50/50 cursor-pointer ${
                    viewer.selectedId === row.id ? 'bg-blue-50/50 dark:bg-slate-800/80' : ''
                  }`}
                  onClick={() => {
                    viewer.setSelectedId(row.id)
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
                        viewer.setSelectedId(row.id)
                        setIsDetailOpen(true)
                      }}
                    >
                      {row.code}
                    </Button>
                  </TableCell>
                  <TableCell className="text-slate-500 whitespace-nowrap">{row.occurredAt}</TableCell>
                  <TableCell className="font-semibold text-slate-800 dark:text-slate-100">{row.eventType}</TableCell>
                  <TableCell className="text-slate-655 font-mono text-xs">{row.entityType}</TableCell>
                  <TableCell className="font-semibold text-slate-700 dark:text-slate-300">{row.action}</TableCell>
                  <TableCell className="text-slate-500">{row.locationLabel || '-'}</TableCell>
                  <TableCell className="text-slate-500">{row.workOrderLabel || '-'}</TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs">{row.lotLabel || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {viewer.page?.has_more && (
            <div className="flex justify-center p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 px-6"
                onClick={viewer.loadMore}
                disabled={viewer.listState === 'loading'}
              >
                Tải thêm sự kiện
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Details Dialog Modal Overlay */}
      <Dialog
        isOpen={isDetailOpen && !!viewer.selectedId}
        onClose={() => setIsDetailOpen(false)}
        title={viewer.detailRow ? `Audit Detail: ${viewer.detailRow.code}` : 'Chi tiết sự kiện'}
      >
        {!viewer.selectedId ? (
          <p className="text-sm text-slate-400">Chọn một sự kiện để xem chi tiết.</p>
        ) : viewer.detailLoading ? (
          <p className="text-sm text-slate-400">Đang tải chi tiết…</p>
        ) : viewer.detailError ? (
          <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs">
            {viewer.detailError.code}: {viewer.detailError.message}
          </div>
        ) : viewer.detailRow ? (
          <div className="flex flex-col gap-4 font-sans text-sm">
            {/* Metadata Metadata fields */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Thời gian</span>
                <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Clock size={13} className="text-slate-400" />
                  <span>{viewer.detailRow.occurredAt}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Event Type</span>
                <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Activity size={13} className="text-blue-500" />
                  <span className="truncate" title={viewer.detailRow.eventType}>{viewer.detailRow.eventType}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Entity / Action</span>
                <div className="mt-1 font-semibold text-slate-850 dark:text-slate-200 flex items-center gap-1 truncate">
                  <Layers size={13} className="text-slate-400" />
                  <span className="truncate">{viewer.detailRow.entityType} ({viewer.detailRow.action})</span>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Actor (Tác nhân)</span>
                <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <User size={13} className="text-green-500" />
                  <span>{viewer.detailRow.actorLabel}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Vị trí kiểm toán</span>
                <div className="mt-1 font-semibold text-slate-850 dark:text-slate-200 truncate">
                  {viewer.detailRow.locationLabel || '-'}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">IP Client</span>
                <div className="mt-1 font-semibold text-slate-700 dark:text-slate-300 font-mono text-xs flex items-center gap-1">
                  <Globe size={13} className="text-slate-400" />
                  <span>{viewer.detailRow.ipAddress}</span>
                </div>
              </div>
            </div>

            {/* State Transition Block */}
            <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-400 uppercase">Trạng thái chuyển đổi (State transition)</span>
              <div className="flex items-center gap-2 mt-1 text-slate-750 dark:text-slate-200 font-mono text-xs">
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">{viewer.detailRow.fromState || 'NULL'}</span>
                <span className="text-slate-400">→</span>
                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-750 dark:text-blue-305 font-bold">
                  {viewer.detailRow.toState || 'NULL'}
                </span>
              </div>
            </div>

            {/* Linked Business Entities */}
            <div className="flex flex-col gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
                <Database size={13} />
                Đối tượng nghiệp vụ liên kết
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Lệnh sản xuất:</span>{' '}
                  <strong className="font-semibold text-slate-700 dark:text-slate-300">{viewer.detailRow.workOrderLabel || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Mã Lô (Lot code):</span>{' '}
                  <strong className="font-semibold text-slate-700 dark:text-slate-300">{viewer.detailRow.lotLabel || '-'}</strong>
                </div>
              </div>
            </div>

            {/* Payload preview */}
            <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
              <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                <Terminal size={13} />
                Payload Preview (JSON)
              </span>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-48 leading-relaxed">
                {viewer.detailRow.payloadPreview}
              </pre>
            </div>

            <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Đóng chi tiết
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </section>
  )
}
