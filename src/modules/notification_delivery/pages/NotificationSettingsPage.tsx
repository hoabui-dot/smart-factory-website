import { useState } from 'react'
import { Link } from 'react-router'

import { useNotificationSettings } from '../hooks/useNotificationSettings'
import { usePagination } from '@/shared/lib/usePagination'
import { DataTablePagination } from '@/shared/components/DataTablePagination'

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
import { Settings, Wifi, Bell, Shield, Key, AlertCircle, Trash2 } from 'lucide-react'

import './NotificationSettingsPage.css'

export function NotificationSettingsPage() {
  const settings = useNotificationSettings()
  const [tab, setTab] = useState<'preferences' | 'subscriptions'>('preferences')

  const preferencePagination = usePagination(settings.preferenceRows, 5)
  const subscriptionPagination = usePagination(settings.subscriptionRows, 5)

  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Cài đặt', href: '/admin' },
          { label: 'Cấu hình thông báo' },
        ]}
        title="Notification Settings"
        subtitle="Quản lý tùy chọn nhận thông báo Realtime/Push và đăng ký/revoke các thiết bị nhận tin."
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'preferences'}
          className={`pb-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tab === 'preferences'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
          }`}
          onClick={() => setTab('preferences')}
        >
          Preferences
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'subscriptions'}
          className={`pb-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tab === 'subscriptions'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-355'
          }`}
          onClick={() => setTab('subscriptions')}
        >
          Push Subscriptions
        </button>
      </div>

      <div className="w-full">
        {tab === 'preferences' ? (
          /* Preferences Tab Content */
          <div className="flex flex-col gap-5 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
                <Settings size={16} className="text-blue-600 dark:text-blue-500" />
                Tùy chọn nhận tin (Preferences)
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Cấu hình bật/tắt nhận tin Realtime hoặc Push Notifications đối với từng loại sự kiện.
              </p>
            </div>

            {settings.preferencesLoading && <div className="text-xs text-slate-400">Đang tải cấu hình tùy chọn…</div>}
            {settings.preferencesError && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs flex items-center gap-2" role="alert">
                <AlertCircle size={14} />
                <span>{settings.preferencesError.code}: {settings.preferencesError.message}</span>
              </div>
            )}

            {/* Preferences Table */}
            <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              <Table containerClassName="relative w-full overflow-auto">
                <TableHeader>
                  <TableRow className="pointer-events-none hover:bg-transparent">
                    <TableHead>Event Type</TableHead>
                    <TableHead>Realtime</TableHead>
                    <TableHead>Push</TableHead>
                    <TableHead>Updated At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preferencePagination.paginatedItems.map((row) => (
                    <TableRow key={row.code} className="hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-100">{row.eventType}</TableCell>
                      <TableCell>
                        <Badge variant={row.realtimeEnabled ? 'active' : 'inactive'}>
                          {row.realtimeEnabled ? 'ON' : 'OFF'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.pushEnabled ? 'active' : 'inactive'}>
                          {row.pushEnabled ? 'ON' : 'OFF'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">{row.updatedAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {settings.preferenceRows.length === 0 && !settings.preferencesLoading && (
                <div className="p-8 text-center text-xs text-slate-400">Chưa cấu hình tùy chọn nào.</div>
              )}
              <DataTablePagination {...preferencePagination} />
            </div>

            {/* Add Preference Form */}
            <form
              className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 mt-1"
              onSubmit={(event) => {
                event.preventDefault()
                settings.savePreference()
              }}
            >
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Cập nhật tùy chọn
              </h4>
              
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Loại sự kiện (Event Type)</span>
                <Input
                  value={settings.prefDraft.event_type}
                  onChange={(event) =>
                    settings.setPrefDraft((current) => ({
                      ...current,
                      event_type: event.target.value,
                    }))
                  }
                  placeholder="Để trống để áp dụng cấu hình mặc định (default)..."
                  className="h-9"
                />
              </div>

              <div className="flex flex-row items-center gap-6 mt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-655 dark:text-slate-300">
                  <input
                    type="checkbox"
                    className="rounded border-slate-350 dark:border-slate-800 cursor-pointer"
                    checked={settings.prefDraft.realtime_enabled}
                    onChange={(event) =>
                      settings.setPrefDraft((current) => ({
                        ...current,
                        realtime_enabled: event.target.checked,
                      }))
                    }
                  />
                  <span>Kênh Realtime</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-655 dark:text-slate-300">
                  <input
                    type="checkbox"
                    className="rounded border-slate-350 dark:border-slate-800 cursor-pointer"
                    checked={settings.prefDraft.push_enabled}
                    onChange={(event) =>
                      settings.setPrefDraft((current) => ({
                        ...current,
                        push_enabled: event.target.checked,
                      }))
                    }
                  />
                  <span>Kênh Push Notification</span>
                </label>
              </div>

              <Button type="submit" size="sm" disabled={settings.prefPending} className="h-9 mt-2">
                Lưu preference
              </Button>
            </form>

            {settings.prefError && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs flex items-center gap-2" role="alert">
                <AlertCircle size={14} />
                <span>{settings.prefError.code}: {settings.prefError.message}</span>
              </div>
            )}
            {settings.prefSuccess && (
              <div className="p-3 rounded bg-green-50/40 dark:bg-green-950/10 text-green-650 border border-green-200 text-xs" role="status">
                Đã lưu tùy chọn nhận tin thành công.
              </div>
            )}
          </div>
        ) : (
          /* Push Subscriptions Tab Content */
          <div className="flex flex-col gap-5 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
                <Wifi size={16} className="text-green-600 dark:text-green-500" />
                Đăng ký nhận tin (Push Subscriptions)
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Đăng ký các trình duyệt (Web Push), FCM hoặc APNS để đẩy tin trực tiếp tới thiết bị.
              </p>
            </div>

            {settings.subscriptionsLoading && <div className="text-xs text-slate-400">Đang tải danh sách đăng ký…</div>}
            {settings.subscriptionsError && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs flex items-center gap-2" role="alert">
                <AlertCircle size={14} />
                <span>{settings.subscriptionsError.code}: {settings.subscriptionsError.message}</span>
              </div>
            )}

            {/* Subscriptions Table */}
            <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              <Table containerClassName="relative w-full overflow-auto">
                <TableHeader>
                  <TableRow className="pointer-events-none hover:bg-transparent">
                    <TableHead>Mã</TableHead>
                    <TableHead>Kênh (Channel)</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionPagination.paginatedItems.map((row) => (
                    <TableRow
                      key={row.code}
                      className={row.code === settings.selectedCode ? 'bg-blue-50/50 dark:bg-slate-800/80' : ''}
                      onClick={() => settings.setSelectedCode(row.code)}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-0 py-0 h-auto font-semibold hover:underline"
                          onClick={(e) => {
                            e.stopPropagation()
                            settings.setSelectedCode(row.code)
                          }}
                        >
                          {row.code}
                        </Button>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-100">{row.channel}</TableCell>
                      <TableCell>
                        <Badge variant={row.isActive ? 'active' : 'inactive'}>
                          {row.isActive ? 'ACTIVE' : 'REVOKED'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {settings.subscriptionRows.length === 0 && !settings.subscriptionsLoading && (
                <div className="p-8 text-center text-xs text-slate-400">Chưa có thiết bị đăng ký nhận tin.</div>
              )}
              <DataTablePagination {...subscriptionPagination} />
            </div>

            {/* Add Subscription Form */}
            <form
              className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 mt-1"
              onSubmit={(event) => {
                event.preventDefault()
                settings.createSubscription()
              }}
            >
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Đăng ký thiết bị mới
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Bell size={12} /> Kênh đẩy tin
                  </span>
                  <Select
                    value={settings.form.channel}
                    onChange={(event) => settings.setFormField('channel', event.target.value)}
                    className="h-9"
                  >
                    <option value="WEB_PUSH">WEB_PUSH</option>
                    <option value="FCM">FCM</option>
                    <option value="APNS">APNS</option>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400">Endpoint</span>
                  <Input
                    value={settings.form.endpoint}
                    onChange={(event) => settings.setFormField('endpoint', event.target.value)}
                    placeholder="https://..."
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Shield size={12} /> p256dh Key
                  </span>
                  <Input
                    value={settings.form.p256dh_key}
                    onChange={(event) => settings.setFormField('p256dh_key', event.target.value)}
                    placeholder="Khóa mã hóa p256dh..."
                    className="h-9"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Key size={12} /> Auth Key
                  </span>
                  <Input
                    value={settings.form.auth_key}
                    onChange={(event) => settings.setFormField('auth_key', event.target.value)}
                    placeholder="Khóa bảo mật auth..."
                    className="h-9"
                  />
                </div>
              </div>

              <Button type="submit" size="sm" disabled={settings.createPending} className="h-9 mt-2">
                Đăng ký subscription
              </Button>
            </form>

            {settings.createError && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs flex items-center gap-2" role="alert">
                <AlertCircle size={14} />
                <span>{settings.createError.code}: {settings.createError.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Revoke Confirmation Dialog Modal Overlay */}
      <Dialog
        isOpen={!!settings.selectedCode}
        onClose={() => settings.setSelectedCode(null)}
        title="Quản lý subscription"
      >
        {settings.selectedCode && (
          <div className="flex flex-col gap-4 font-sans text-sm">
            <p className="text-slate-650 dark:text-slate-350">
              Bạn có chắc chắn muốn thu hồi (Revoke) khóa đăng ký nhận tin của thiết bị{' '}
              <strong className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                {settings.selectedCode}
              </strong>
              ? Thiết bị này sẽ không thể nhận thêm tin nhắn push cho tới khi được đăng ký lại.
            </p>

            {settings.revokeError && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs flex items-center gap-2" role="alert">
                <AlertCircle size={14} />
                <span>{settings.revokeError.code}: {settings.revokeError.message}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
              <Button variant="secondary" onClick={() => settings.setSelectedCode(null)}>
                Đóng
              </Button>
              <Button
                variant="danger"
                disabled={settings.revokePending}
                onClick={settings.revokeSubscription}
                className="gap-1.5"
              >
                <Trash2 size={14} />
                Thu hồi Subscription
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </section>
  )
}
