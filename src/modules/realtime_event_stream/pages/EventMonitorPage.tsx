import { useState, type FormEvent } from 'react'

import { isSystemAdminSession } from '@/shared/api'
import { useAuthStore } from '@/shared/store/authStore'
import { useEventMonitor } from '../hooks/useEventMonitor'

import { usePagination } from '@/shared/lib/usePagination'
import { GenericDataTable, ColumnDef } from '@/shared/components/ui/DataTable'
import type { EventRow, RealtimeSubscription } from '../types/realtimeEvent'

// Import Shadcn & Layout components
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Input, Select } from '@/shared/components/ui/Input'
import { Badge } from '@/shared/components/ui/Badge'
import { Dialog } from '@/shared/components/ui/Dialog'
import { Search } from 'lucide-react'
import { FilterBar } from '@/shared/components/ui/FilterBar'

import './EventMonitorPage.css'

function stateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải event outbox...'
    case 'empty':
      return 'Chưa có event trong outbox.'
    case 'no-result':
      return 'Không có event khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem Event Monitor (system_admin_only).'
    case 'error':
      return 'Không tải được event outbox.'
    default:
      return ''
  }
}

export function EventMonitorPage() {
  const session = useAuthStore((state) => state.session)
  const monitor = useEventMonitor()
  const [tab, setTab] = useState<'events' | 'subscriptions'>('events')
  const eventsPagination = usePagination(monitor.rows, 10)
  const subscriptionsPagination = usePagination(monitor.subscriptions, 10)
  
  const eventColumns: ColumnDef<EventRow>[] = [
    {
      header: 'Mã sự kiện',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="px-0 py-0 h-auto font-semibold hover:underline"
          onClick={(e) => {
            e.stopPropagation()
            monitor.setSelectedId(row.id)
            setIsDetailOpen(true)
          }}
        >
          {row.eventId}
        </Button>
      ),
    },
    {
      header: 'Tên sự kiện',
      cell: (row) => <span className="font-semibold text-slate-850 dark:text-slate-100">{row.eventType}</span>,
    },
    {
      header: 'Nguồn phát',
      cell: (row) => row.sourceModule,
    },
    {
      header: 'Tham chiếu',
      cell: (row) => row.entityReference,
    },
    {
      header: 'Trạng thái',
      cell: (row) => (
        <Badge
          variant={
            row.status === 'PUBLISHED'
              ? 'active'
              : row.status === 'FAILED' || row.status === 'DEAD_LETTER'
              ? 'inactive'
              : 'default'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Số lần thử lại',
      cell: (row) => <span className="font-semibold">{row.retryCount}</span>,
    },
    {
      header: 'Thời gian xảy ra',
      cell: (row) => <span className="text-xs text-slate-400">{row.occurredAt}</span>,
    },
  ]

  const subscriptionColumns: ColumnDef<RealtimeSubscription>[] = [
    {
      header: 'Mã đăng ký',
      cell: (subscription) => (
        <Button
          variant="ghost"
          size="sm"
          className="px-0 py-0 h-auto font-semibold hover:underline"
          onClick={(e) => {
            e.stopPropagation()
            monitor.setSelectedSubscriptionCode(subscription.code)
            setIsSubDetailOpen(true)
          }}
        >
          {subscription.code}
        </Button>
      ),
    },
    {
      header: 'Người dùng',
      cell: (subscription) => <span className="font-medium text-slate-800 dark:text-slate-200">{subscription.user_id}</span>,
    },
    {
      header: 'Kênh thông tin',
      cell: (subscription) => subscription.channel_key,
    },
    {
      header: 'Kết nối cuối (Ping)',
      cell: (subscription) => <span className="text-xs text-slate-400">{subscription.last_ping_at}</span>,
    },
    {
      header: 'Thu hồi lúc',
      cell: (subscription) => subscription.revoked_at ? (
        <Badge variant="inactive">{subscription.revoked_at}</Badge>
      ) : (
        <span className="text-slate-400">-</span>
      ),
    },
  ]

  // Modals visibility
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateSubOpen, setIsCreateSubOpen] = useState(false)
  const [isSubDetailOpen, setIsSubDetailOpen] = useState(false)

  const [subscriptionForm, setSubscriptionForm] = useState({
    session_id: '',
    user_id: '',
    channel_key: '',
  })

  if (!isSystemAdminSession(session)) {
    return (
      <section className="flex flex-col gap-6 font-sans">
        <PageHeader
          breadcrumbs={[
            { label: 'Trang chủ', href: '/home' },
            { label: 'Quản trị', href: '/admin' },
            { label: 'Event Monitor' },
          ]}
          title="Event Monitor"
        />
        <p className="p-4 rounded bg-red-50 dark:bg-red-950/20 text-sm text-red-650 border border-red-200 dark:border-red-900" role="alert">
          Bạn không có quyền xem Event Monitor (system_admin_only).
        </p>
      </section>
    )
  }

  const submitSubscription = (event: FormEvent) => {
    event.preventDefault()
    const sessionId = Number(subscriptionForm.session_id)
    const userId = Number(subscriptionForm.user_id)
    if (
      !Number.isInteger(sessionId) ||
      sessionId <= 0 ||
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !subscriptionForm.channel_key.trim()
    ) {
      return
    }
    monitor.createSubscription({
      session_id: sessionId,
      user_id: userId,
      channel_key: subscriptionForm.channel_key.trim(),
    })
  }

  const banner = stateMessage(monitor.listState)

  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Quản trị', href: '/admin' },
          { label: 'Event Monitor' },
        ]}
        title="Event Monitor"
        subtitle="Theo dõi transactional outbox, delivery health và subscription đang hoạt động."
        actions={
          <div className="flex gap-2">
            {tab === 'events' ? (
              <>
                {monitor.hasMore && (
                  <Button variant="secondary" size="sm" onClick={monitor.loadMore}>
                    Tải thêm từ Server
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={monitor.refresh}>
                  Làm mới
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setIsCreateSubOpen(true)}>Tạo Subscription</Button>
            )}
          </div>
        }
      />

      {/* Modern tab bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'events'}
          className={`pb-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tab === 'events'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-355'
          }`}
          onClick={() => setTab('events')}
        >
          Event outbox
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'subscriptions'}
          className={`pb-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tab === 'subscriptions'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-355'
          }`}
          onClick={() => setTab('subscriptions')}
        >
          Subscriptions
        </button>
      </div>

      {tab === 'events' ? (
        <>
          {/* Advanced filter form */}
          <FilterBar
            fields={[
              {
                name: 'event_type',
                type: 'text',
                label: 'Tên sự kiện',
                placeholder: 'Ví dụ: production_log.posted'
              },
              {
                name: 'source_module',
                type: 'text',
                label: 'Module phát sinh',
                placeholder: 'Ví dụ: MES-05'
              },
              {
                name: 'entity_type',
                type: 'text',
                label: 'Loại thực thể',
                placeholder: 'Ví dụ: production_log'
              },
              {
                name: 'status',
                type: 'select',
                label: 'Trạng thái',
                options: [
                  { value: '', label: 'Tất cả' },
                  { value: 'PENDING', label: 'Chờ xử lý (PENDING)' },
                  { value: 'PUBLISHING', label: 'Đang gửi (PUBLISHING)' },
                  { value: 'PUBLISHED', label: 'Đã gửi (PUBLISHED)' },
                  { value: 'FAILED', label: 'Thất bại (FAILED)' },
                  { value: 'DEAD_LETTER', label: 'Lỗi vĩnh viễn (DEAD_LETTER)' }
                ]
              },
              {
                name: 'request_id',
                type: 'text',
                label: 'Mã yêu cầu (Request ID)',
                placeholder: 'Ví dụ: req-...'
              },
              {
                name: 'occurred_from',
                type: 'text',
                label: 'Thời gian bắt đầu',
                placeholder: 'Ví dụ: 2026-07-18T00:00:00Z'
              },
              {
                name: 'occurred_to',
                type: 'text',
                label: 'Thời gian kết thúc',
                placeholder: 'Ví dụ: 2026-07-18T23:59:59Z'
              }
            ]}
            values={monitor.draftFilters}
            onChange={(name, value) => monitor.setDraftFilter(name as any, value)}
            onSubmit={(event) => {
              event.preventDefault()
              monitor.applyFilters()
            }}
            onReset={monitor.clearFilters}
            isResetActive={Object.values(monitor.draftFilters).some(Boolean)}
          />

          {banner && monitor.listState !== 'loading' ? (
            <p className="p-4 rounded bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-350" role="status">
              {banner}
              {monitor.listError ? ` (${monitor.listError.code})` : ''}
            </p>
          ) : null}

          <GenericDataTable
            data={eventsPagination.paginatedItems}
            columns={eventColumns}
            pagination={eventsPagination}
            isLoading={monitor.listState === 'loading'}
            onRowClick={(row) => {
              monitor.setSelectedId(row.id)
              setIsDetailOpen(true)
            }}
            getRowClassName={(row) => row.id === monitor.selectedId ? 'bg-blue-50/50 dark:bg-slate-800/80' : ''}
          />
        </>
      ) : (
        <div className="w-full flex flex-col gap-4">
          {monitor.subscriptionsError ? (
            <p className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-sm text-red-650 border border-red-200" role="alert">
              {monitor.subscriptionsError.message}
            </p>
          ) : null}

          <GenericDataTable
            data={subscriptionsPagination.paginatedItems}
            columns={subscriptionColumns}
            pagination={subscriptionsPagination}
            isLoading={monitor.subscriptionsLoading}
            onRowClick={(subscription) => {
              monitor.setSelectedSubscriptionCode(subscription.code)
              setIsSubDetailOpen(true)
            }}
            getRowClassName={(subscription) => subscription.code === monitor.selectedSubscriptionCode ? 'bg-blue-50/50 dark:bg-slate-800/80' : ''}
          />
        </div>
      )}

      {/* Event Details Dialog Modal Overlay */}
      <Dialog
        isOpen={isDetailOpen && !!monitor.detailRow}
        onClose={() => {
          setIsDetailOpen(false)
          monitor.setConfirmReplay(false)
        }}
        title={monitor.detailRow ? `Event Log: ${monitor.detailRow.eventId}` : 'Event Detail'}
      >
        {monitor.detailRow && (
          <div className="flex flex-col gap-5 font-sans text-sm">
            <dl className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg">
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-slate-400 font-medium">Status</dt>
                <dd>
                  <Badge
                    variant={
                      monitor.detailRow.status === 'PUBLISHED'
                        ? 'active'
                        : monitor.detailRow.status === 'FAILED' || monitor.detailRow.status === 'DEAD_LETTER'
                        ? 'inactive'
                        : 'default'
                    }
                  >
                    {monitor.detailRow.status}
                  </Badge>
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-slate-400 font-medium">Request ID</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">
                  {monitor.detailRow.requestId || '-'}
                </dd>
              </div>
              {monitor.detailRow.lastError && (
                <div className="flex flex-col gap-0.5 col-span-2 border-t border-slate-200 dark:border-slate-800 pt-2">
                  <dt className="text-xs text-slate-400 font-medium text-red-500">Last Error</dt>
                  <dd className="font-mono text-xs text-red-650 dark:text-red-400 break-all bg-red-50/50 dark:bg-red-950/10 p-2.5 rounded">
                    {monitor.detailRow.lastError}
                  </dd>
                </div>
              )}
              <div className="flex flex-col gap-0.5 col-span-2 border-t border-slate-200 dark:border-slate-800 pt-2">
                <dt className="text-xs text-slate-400 font-medium">Redacted Payload Preview</dt>
                <dd className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 p-2.5 rounded overflow-x-auto whitespace-pre-wrap max-h-48">
                  {monitor.detailRow.payloadPreview}
                </dd>
              </div>
            </dl>

            {monitor.detailRow.canReplay && !monitor.confirmReplay && (
              <Button type="button" className="w-full" onClick={() => monitor.setConfirmReplay(true)}>
                Replay Event
              </Button>
            )}

            {monitor.confirmReplay && (
              <div className="flex flex-col gap-3 p-3 border border-blue-150 dark:border-slate-800 bg-blue-50/20 dark:bg-slate-900 rounded-lg">
                <p className="text-xs text-slate-500">
                  Replay tạo delivery attempt mới. Event gốc không bị thay đổi.
                </p>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Lý do Replay</span>
                  <Input
                    value={monitor.replayReason}
                    onChange={(event) => monitor.setReplayReason(event.target.value)}
                    placeholder="Nhập lý do replay..."
                  />
                </div>
                <div className="flex gap-2 justify-end mt-1">
                  <Button type="button" variant="secondary" size="sm" onClick={() => monitor.setConfirmReplay(false)}>
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!monitor.replayReason.trim() || monitor.replayState === 'pending'}
                    onClick={monitor.requestReplay}
                  >
                    Xác nhận
                  </Button>
                </div>
              </div>
            )}

            {monitor.replayError && (
              <p className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-650 border border-red-200" role="alert">
                {monitor.replayError.code}: {monitor.replayError.message}
              </p>
            )}
            {monitor.replayState === 'success' && (
              <p className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/20 text-xs text-emerald-650 border border-emerald-250" role="status">
                Đã tạo replay delivery attempt.
              </p>
            )}
          </div>
        )}
      </Dialog>

      {/* Create Subscription Dialog */}
      <Dialog
        isOpen={isCreateSubOpen}
        onClose={() => setIsCreateSubOpen(false)}
        title="Tạo Subscription"
      >
        <form className="flex flex-col gap-4 font-sans text-sm" onSubmit={(e) => {
          submitSubscription(e)
        }}>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">Session ID</span>
            <Input
              value={subscriptionForm.session_id}
              onChange={(event) =>
                setSubscriptionForm((current) => ({
                  ...current,
                  session_id: event.target.value,
                }))
              }
              placeholder="Nhập Session ID..."
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">User ID</span>
            <Input
              value={subscriptionForm.user_id}
              onChange={(event) =>
                setSubscriptionForm((current) => ({
                  ...current,
                  user_id: event.target.value,
                }))
              }
              placeholder="Nhập User ID..."
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">Channel key</span>
            <Input
              value={subscriptionForm.channel_key}
              onChange={(event) =>
                setSubscriptionForm((current) => ({
                  ...current,
                  channel_key: event.target.value,
                }))
              }
              placeholder="Nhập Channel Key..."
              required
            />
          </div>

          <Button type="submit" disabled={monitor.createPending} className="w-full mt-2">
            {monitor.createPending ? 'Đang tạo...' : 'Tạo subscription'}
          </Button>

          {monitor.createError && (
            <p className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-655 border border-red-200" role="alert">
              {monitor.createError.message}
            </p>
          )}
        </form>
      </Dialog>

      {/* Subscription Detail Dialog */}
      <Dialog
        isOpen={isSubDetailOpen && !!monitor.selectedSubscriptionCode}
        onClose={() => setIsSubDetailOpen(false)}
        title={`Chi tiết Subscription: ${monitor.selectedSubscriptionCode}`}
      >
        {monitor.selectedSubscriptionCode && (
          <div className="flex flex-col gap-4 font-sans text-sm">
            <p className="text-slate-600 dark:text-slate-300">
              Đang quản trị subscription:{' '}
              <strong className="text-slate-800 dark:text-slate-100">{monitor.selectedSubscriptionCode}</strong>
            </p>
            <Button
              type="button"
              variant="danger"
              className="w-full bg-red-600 text-white hover:bg-red-700"
              disabled={monitor.revokePending}
              onClick={monitor.revokeSubscription}
            >
              {monitor.revokePending ? 'Đang thu hồi...' : 'Revoke subscription'}
            </Button>
            {monitor.revokeError && (
              <p className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-650 border border-red-200" role="alert">
                {monitor.revokeError.message}
              </p>
            )}
          </div>
        )}
      </Dialog>
    </section>
  )
}
