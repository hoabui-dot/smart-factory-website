import { useState } from 'react'
import { Link } from 'react-router'

import { useNotificationCenter } from '../hooks/useNotificationCenter'
import { usePagination } from '@/shared/lib/usePagination'
import { TablePagination } from '@/shared/components/ui/TablePagination'

// Import Tailwind Shadcn UI & Layout components
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
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
import { Search, RotateCw, CheckCheck, ExternalLink, Calendar, AlertCircle } from 'lucide-react'
import { FilterBar } from '@/shared/components/ui/FilterBar'

import './NotificationCenterPage.css'

function stateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải hộp thư thông báo...'
    case 'empty':
      return 'Chưa có thông báo.'
    case 'no-result':
      return 'Không có thông báo khớp bộ lọc.'
    case 'permission-denied':
      return 'Không có quyền xem hộp thư thông báo.'
    case 'error':
      return 'Không tải được thông báo.'
    default:
      return ''
  }
}

export function NotificationCenterPage() {
  const center = useNotificationCenter()
  const banner = stateMessage(center.listState)
  const pagination = usePagination(center.rows, 10)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Thông báo' },
        ]}
        title="Notification Center"
        subtitle="Hộp thư cá nhân — quản lý thông báo, Deep-link và cập nhật trạng thái đã đọc."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={center.unreadCount > 0 ? 'active' : 'inactive'} className="py-1.5 px-2.5 h-9 flex items-center text-xs font-semibold">
              Chưa đọc: {center.unreadCount}
            </Badge>
            <Button
              variant="secondary"
              onClick={center.refresh}
              title="Làm mới hộp thư"
            >
              <RotateCw size={14} className="mr-1.5" />
              Làm mới
            </Button>
            <Button
              disabled={center.markState === 'pending' || center.unreadCount === 0}
              onClick={center.markAllRead}
            >
              <CheckCheck size={14} className="mr-1.5" />
              Đánh dấu tất cả đã đọc
            </Button>
          </div>
        }
      />

      <FilterBar
        fields={[
          {
            name: 'draftQ',
            type: 'text',
            placeholder: 'Tìm theo tiêu đề / loại sự kiện...'
          }
        ]}
        values={{ draftQ: center.draftQ }}
        onChange={(_, val) => center.setDraftQ(val)}
        onSubmit={(event) => {
          event.preventDefault()
          center.applyFilters()
        }}
        onReset={center.clearFilters}
        isResetActive={!!center.draftQ}
        className="max-w-md"
      />

      {banner && (
        <p
          className={`p-4 rounded text-sm border ${
            center.listState === 'error' || center.listState === 'permission-denied'
              ? 'bg-red-50 dark:bg-red-950/20 text-red-650 border-red-200'
              : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-250 dark:border-slate-800'
          }`}
          role={center.listState === 'error' ? 'alert' : 'status'}
        >
          {banner}
          {center.listError ? ` (${center.listError.code})` : ''}
        </p>
      )}

      {center.listState === 'ready' && (
        <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
          <Table containerClassName="relative w-full overflow-auto">
            <TableHeader>
              <TableRow className="pointer-events-none hover:bg-transparent">
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Read</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedItems.map((row) => (
                <TableRow
                  key={row.code}
                  className={row.code === center.selectedCode ? 'bg-blue-50/50 dark:bg-slate-800/80' : ''}
                  onClick={() => {
                    center.setSelectedCode(row.code)
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
                        center.setSelectedCode(row.code)
                        setIsDetailOpen(true)
                      }}
                    >
                      {row.code}
                    </Button>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-850 dark:text-slate-100 max-w-sm truncate" title={row.title}>
                    {row.title}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.priority === 'HIGH' ? 'active' : 'inactive'}
                      className="px-2 py-0.5 text-xs font-medium"
                    >
                      {row.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">{row.createdAt}</TableCell>
                  <TableCell>
                    <Badge variant={row.isRead ? 'inactive' : 'active'}>
                      {row.isRead ? 'Đã đọc' : 'Chưa đọc'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            {...pagination}
            hasMore={center.hasMore}
            onLoadMore={center.loadMore}
          />
        </div>
      )}

      {/* Notification Details Dialog Modal Overlay */}
      <Dialog
        isOpen={isDetailOpen && !!center.detailRow}
        onClose={() => setIsDetailOpen(false)}
        title={center.detailRow ? `Thông báo: ${center.detailRow.code}` : 'Chi tiết thông báo'}
      >
        {center.detailRow && (
          <div className="flex flex-col gap-5 font-sans text-sm">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tiêu đề</span>
              <p className="font-semibold text-base text-slate-900 dark:text-slate-100">{center.detailRow.title}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nội dung chi tiết</span>
              <div className="p-3.5 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 leading-relaxed font-sans break-words whitespace-pre-wrap">
                {center.detailRow.body}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Loại sự kiện</span>
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 w-fit text-slate-700 dark:text-slate-350">
                  {center.detailRow.eventType}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Độ ưu tiên</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{center.detailRow.priority}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Hiển thị</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{center.detailRow.displayMode}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Nhãn nhóm</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{center.detailRow.groupLabel}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Thực thể liên quan</span>
              <span className="font-mono text-xs">{center.detailRow.relatedEntity || '-'}</span>
            </div>

            {center.detailRow.readAt && (
              <div className="flex items-center gap-1.5 text-xs text-slate-450 mt-1">
                <Calendar size={13} />
                <span>Đã đọc lúc: {center.detailRow.readAt}</span>
              </div>
            )}

            {center.markError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200" role="alert">
                <AlertCircle size={15} />
                <span className="text-xs">{center.markError.code}: {center.markError.message}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Đóng
              </Button>
              {!center.detailRow.isRead && (
                <Button
                  disabled={center.markState === 'pending'}
                  onClick={() => {
                    center.markRead()
                  }}
                >
                  <CheckCheck size={14} className="mr-1.5" />
                  Đánh dấu đã đọc
                </Button>
              )}
              {center.detailRow.deepLink && (
                <Link to={center.detailRow.deepLink} className="inline-flex">
                  <Button variant="primary">
                    <ExternalLink size={14} className="mr-1.5" />
                    Mở Deep Link
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </section>
  )
}
