import { useState } from 'react'

import { isSystemAdminSession } from '@/shared/api'
import { useAuthStore } from '@/shared/store/authStore'
import { useNotificationDeliveryAdmin } from '../hooks/useNotificationDeliveryAdmin'

import { usePagination } from '@/shared/lib/usePagination'
import { DataTablePagination } from '@/shared/components/DataTablePagination'

// Import Shadcn & Layout components
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Search } from 'lucide-react'
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

import './NotificationDeliveryAdminPage.css'

function stateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải delivery logs...'
    case 'empty':
      return 'Chưa có delivery log.'
    case 'no-result':
      return 'Không có log khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem Notification Delivery Admin (system_admin_only).'
    case 'error':
      return 'Không tải được delivery logs.'
    default:
      return ''
  }
}

export function NotificationDeliveryAdminPage() {
  const session = useAuthStore((state) => state.session)
  const admin = useNotificationDeliveryAdmin()
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const pagination = usePagination(admin.rows, 10)

  if (!isSystemAdminSession(session)) {
    return (
      <section className="flex flex-col gap-6 font-sans">
        <PageHeader
          breadcrumbs={[
            { label: 'Trang chủ', href: '/home' },
            { label: 'Quản trị', href: '/admin' },
            { label: 'Notification Delivery' },
          ]}
          title="Notification Delivery"
        />
        <p className="p-4 rounded bg-red-50 dark:bg-red-950/20 text-sm text-red-650 border border-red-200 dark:border-red-900" role="alert">
          Bạn không có quyền xem Notification Delivery Admin (system_admin_only).
        </p>
      </section>
    )
  }

  const banner = stateMessage(admin.listState)

  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Quản trị', href: '/admin' },
          { label: 'Notification Delivery' },
        ]}
        title="Notification Delivery"
        subtitle="Theo dõi lịch sử gửi thông báo và gửi lại các lượt thất bại."
        actions={
          <Button variant="secondary" onClick={admin.refresh}>
            Làm mới
          </Button>
        }
      />

      <form
        className="flex items-center gap-2 max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg"
        onSubmit={(event) => {
          event.preventDefault()
          admin.applyFilters()
        }}
      >
        <div className="flex-1">
          <Input
            value={admin.draftQ}
            onChange={(event) => admin.setDraftQ(event.target.value)}
            placeholder="Tìm kiếm theo code / channel / status..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-9 px-2"
          />
        </div>
        <Button type="submit" size="sm" className="h-9 w-9 px-0" aria-label="Lọc">
          <Search size={16} />
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={admin.clearFilters}>
          Xóa lọc
        </Button>
      </form>

      {banner ? (
        <p className="p-4 rounded bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300" role="status">
          {banner}
          {admin.listError ? ` (${admin.listError.code})` : ''}
        </p>
      ) : null}

      <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
        <Table containerClassName="relative w-full overflow-auto">
          <TableHeader>
            <TableRow className="pointer-events-none hover:bg-transparent">
              <TableHead>Code</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attempted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.paginatedItems.map((row) => (
              <TableRow
                key={row.id}
                className={row.id === admin.selectedId ? 'bg-blue-50/50 dark:bg-slate-800/80' : ''}
                onClick={() => {
                  admin.setSelectedId(row.id)
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
                      admin.setSelectedId(row.id)
                      setIsDetailOpen(true)
                    }}
                  >
                    {row.code}
                  </Button>
                </TableCell>
                <TableCell className="font-medium text-slate-800 dark:text-slate-200">{row.channel}</TableCell>
                <TableCell>
                  <Badge variant={row.status === 'SUCCESS' || row.status === 'SENT' ? 'active' : 'inactive'}>
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell>{row.attemptedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex flex-col sm:flex-row items-center justify-between w-full bg-white dark:bg-transparent">
          <div className="flex-1">
            <DataTablePagination {...pagination} />
          </div>
          {admin.hasMore && (
            <div className="pr-5 pb-3 sm:pb-0">
              <Button variant="secondary" size="sm" onClick={admin.loadMore}>
                Tải thêm từ Server
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Dialog Modal Overlay */}
      <Dialog
        isOpen={isDetailOpen && !!admin.selected}
        onClose={() => setIsDetailOpen(false)}
        title={admin.selected ? `Chi tiết log: ${admin.selected.code}` : 'Chi tiết log'}
      >
        {admin.selected && (
          <div className="flex flex-col gap-5 font-sans">
            <dl className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg text-sm">
              <div className="flex flex-col gap-0.5 col-span-2">
                <dt className="text-xs text-slate-400 font-medium">Notification ID</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">{admin.selected.notificationId}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-slate-400 font-medium">Channel</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">{admin.selected.channel}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-slate-400 font-medium">Status</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">
                  <Badge variant={admin.selected.status === 'SUCCESS' || admin.selected.status === 'SENT' ? 'active' : 'inactive'}>
                    {admin.selected.status}
                  </Badge>
                </dd>
              </div>
              {admin.selected.errorMessage && (
                <div className="flex flex-col gap-0.5 col-span-2 border-t border-slate-200 dark:border-slate-800 pt-2 mt-2">
                  <dt className="text-xs text-slate-400 font-medium">Error Message</dt>
                  <dd className="font-semibold text-red-600 dark:text-red-400 break-all">{admin.selected.errorMessage}</dd>
                </div>
              )}
            </dl>

            {admin.selected.canRetry && (
              <Button
                type="button"
                className="w-full"
                disabled={admin.retryPending}
                onClick={admin.retry}
              >
                {admin.retryPending ? 'Đang thực hiện...' : 'Retry delivery'}
              </Button>
            )}

            {admin.retryError && (
              <p className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-600 border border-red-200 dark:border-red-900" role="alert">
                {admin.retryError.code}: {admin.retryError.message}
              </p>
            )}

            {admin.retrySuccess && (
              <p className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/20 text-xs text-emerald-600 border border-emerald-200 dark:border-emerald-900" role="status">
                Đã enqueue retry thành công.
              </p>
            )}
          </div>
        )}
      </Dialog>
    </section>
  )
}
