import { useState } from 'react'

import { isSystemAdminSession } from '@/shared/api'
import { CANONICAL_ROLE_CODES } from '@/shared/constants/roles'
import { useAuthStore } from '@/shared/store/authStore'

import { useIdentityAdmin } from '../hooks/useIdentityAdmin'
import { DEVICE_TYPE_VALUES } from '../types/userAdmin'
import type { StationDevice, UserDetail } from '../types/userAdmin'

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
import { Search } from 'lucide-react'

import './IdentityAdminPage.css'

type AdminApi = ReturnType<typeof useIdentityAdmin>

function stationDeviceListStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải danh sách station device…'
    case 'empty':
      return 'Chưa có station device nào.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem station device.'
    case 'error':
      return 'Không tải được station device. Thử lại sau.'
    default:
      return ''
  }
}

function StationDeviceEditor({ detail, admin, onClose }: { detail: StationDevice; admin: AdminApi; onClose: () => void }) {
  const [deviceType, setDeviceType] = useState(detail.device_type)
  const [locationCode, setLocationCode] = useState(detail.location_code ?? '')
  const [hardwareId, setHardwareId] = useState(detail.hardware_id)
  const row = admin.stationDeviceDetailRow

  return (
    <div className="flex flex-col gap-5 font-sans text-sm">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{detail.code}</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          {detail.is_active ? 'Active' : 'Disabled'} · {detail.device_type} · đăng ký{' '}
          {detail.registered_at}
        </p>
      </div>

      <div className="flex flex-col gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Device type</span>
          <Select value={deviceType} onChange={(e) => setDeviceType(e.target.value)}>
            {DEVICE_TYPE_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Location code (bỏ trống nếu WORKSTATION)</span>
          <Input value={locationCode} onChange={(e) => setLocationCode(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Hardware ID</span>
          <Input value={hardwareId} onChange={(e) => setHardwareId(e.target.value)} />
        </div>

        <Button
          type="button"
          disabled={!row?.canUpdate || admin.updateStationDevicePending}
          title={row?.updateDisabledReason ?? undefined}
          onClick={() =>
            admin.saveStationDeviceEdit({
              device_type: deviceType,
              location_code: locationCode.trim() ? locationCode.trim() : null,
              hardware_id: hardwareId.trim(),
            })
          }
        >
          {admin.updateStationDevicePending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>

        {!row?.canUpdate && (
          <p className="text-xs text-slate-400 text-center">
            Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
          </p>
        )}

        {admin.updateStationDeviceError && (
          <p className="p-2.5 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-600 border border-red-200 dark:border-red-900" role="alert">
            {admin.updateStationDeviceError.code}: {admin.updateStationDeviceError.message}
          </p>
        )}
        {admin.updateStationDeviceSuccess && (
          <p className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-xs text-emerald-650 border border-emerald-200" role="status">
            Đã lưu thay đổi.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
        <h4 className="font-semibold text-slate-800 dark:text-slate-200">Deactivate</h4>
        <Button
          type="button"
          variant="danger"
          disabled={!row?.canDeactivate}
          title={row?.deactivateDisabledReason ?? undefined}
          onClick={() => admin.setConfirmStationDeviceDeactivate(true)}
        >
          Deactivate device
        </Button>
        
        {!row?.canDeactivate && (
          <p className="text-xs text-slate-400">
            Deactivate không khả dụng
            {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
          </p>
        )}

        {admin.confirmStationDeviceDeactivate && (
          <div className="p-3 border border-red-150 dark:border-red-950 bg-red-50/10 rounded-lg flex flex-col gap-2">
            <p className="text-xs text-slate-600 dark:text-slate-350">
              Xác nhận deactivate <strong>{detail.code}</strong>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={admin.deactivateStationDeviceState === 'pending'}
                onClick={admin.deactivateStationDevice}
              >
                Xác nhận
              </Button>
              <Button variant="secondary" size="sm" type="button" onClick={() => admin.setConfirmStationDeviceDeactivate(false)}>
                Hủy
              </Button>
            </div>
          </div>
        )}

        {admin.deactivateStationDeviceError && (
          <p className="p-2.5 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-650 border border-red-200" role="alert">
            {admin.deactivateStationDeviceError.code}: {admin.deactivateStationDeviceError.message}
          </p>
        )}
        {admin.deactivateStationDeviceState === 'success' && (
          <p className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-xs text-emerald-650 border border-emerald-200" role="status">
            Đã deactivate device.
          </p>
        )}
      </div>
    </div>
  )
}

function UserDetailEditor({ detail, admin, onClose }: { detail: UserDetail; admin: AdminApi; onClose: () => void }) {
  const [fullName, setFullName] = useState(detail.full_name)
  const [email, setEmail] = useState(detail.email ?? '')
  const [phone, setPhone] = useState(detail.phone_number ?? '')
  const [roles, setRoles] = useState<string[]>([...detail.roles])
  const [locations, setLocations] = useState(detail.locations.join(', '))

  return (
    <div className="flex flex-col gap-5 font-sans text-sm max-h-[75vh] overflow-y-auto pr-1">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{detail.code}</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          {detail.is_active ? 'Active' : 'Disabled'} · {detail.updated_at}
        </p>
      </div>

      <div className="flex flex-col gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg">
        <h4 className="font-semibold text-slate-800 dark:text-slate-200">Thông tin cơ bản</h4>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Họ tên</span>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Email</span>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Phone</span>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <Button
          type="button"
          disabled={admin.updatePending}
          onClick={() =>
            admin.saveEdit({
              full_name: fullName.trim(),
              email: email.trim() ? email.trim() : null,
              phone_number: phone.trim() ? phone.trim() : null,
            })
          }
        >
          {admin.updatePending ? 'Đang lưu...' : 'Lưu thông tin'}
        </Button>
        {admin.updateError && (
          <p className="p-2 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-600 border border-red-200" role="alert">
            Lưu lỗi: {admin.updateError.code}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg">
        <h4 className="font-semibold text-slate-800 dark:text-slate-200">Vai trò (Roles)</h4>
        <div className="grid grid-cols-2 gap-2 p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">
          {CANONICAL_ROLE_CODES.map((code) => (
            <label key={code} className="flex items-center gap-2 text-xs font-medium cursor-pointer p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-850">
              <input
                type="checkbox"
                className="rounded border-slate-300 dark:border-slate-800"
                checked={roles.includes(code)}
                onChange={() =>
                  setRoles((prev) =>
                    prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
                  )
                }
              />
              {code}
            </label>
          ))}
        </div>
        <Button
          type="button"
          disabled={admin.rolesPending || roles.length === 0}
          onClick={() => {
            if (window.confirm(`Thay thế roles của ${detail.code}?`)) {
              admin.saveRoles(roles)
            }
          }}
        >
          Lưu roles
        </Button>
        {admin.rolesError && (
          <p className="p-2 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-650 border border-red-200" role="alert">
            Lỗi vai trò: {admin.rolesError.code}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg">
        <h4 className="font-semibold text-slate-800 dark:text-slate-200">Vị trí (Locations)</h4>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">location_codes (CSV)</span>
          <Input value={locations} onChange={(e) => setLocations(e.target.value)} />
        </div>
        <Button
          type="button"
          disabled={admin.locationsPending}
          onClick={() => {
            if (window.confirm(`Thay thế locations của ${detail.code}?`)) {
              const codes = locations
                .split(/[\s,]+/)
                .map((c) => c.trim())
                .filter(Boolean)
              admin.saveLocations(codes)
            }
          }}
        >
          Lưu locations
        </Button>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
        <h4 className="font-semibold text-slate-800 dark:text-slate-200">Tác vụ khẩn cấp</h4>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Lý do vô hiệu hóa</span>
          <Input
            value={admin.disableReason}
            onChange={(e) => admin.setDisableReason(e.target.value)}
            placeholder="Nhập lý do trước khi block..."
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="danger"
            disabled={!admin.disableReason.trim() || admin.disablePending}
            onClick={() => {
              if (window.confirm(`Vô hiệu hóa ${detail.code}?`)) {
                admin.disable()
              }
            }}
          >
            Disable user
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={admin.resetUi === 'pending'}
            onClick={() => {
              if (window.confirm(`Reset password cho ${detail.code}?`)) {
                admin.resetPassword()
              }
            }}
          >
            Reset password
          </Button>
        </div>

        {admin.resetUi === 'queued' && (
          <p className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-xs text-emerald-650 border border-emerald-200" role="status">
            Reset queued: {admin.resetResult?.job_code}
          </p>
        )}
        {admin.resetUi === 'temporary-pin' && (
          <p className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-xs text-emerald-650 border border-emerald-250" role="status">
            Temporary PIN (one-time): <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-base">{admin.resetResult?.temporary_pin}</strong>
          </p>
        )}
        {(admin.resetUi === 'retryable-partial' || admin.resetError) && (
          <p className="p-2.5 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-650 border border-red-200" role="alert">
            {admin.resetError?.code ?? 'CREDENTIAL_RESET_PARTIAL_FAILURE'}
          </p>
        )}
        <p className="text-[11px] text-slate-400 text-center mt-1">
          Station-device admin (NB01-014..018) deferred to NB-01d-STATION-ACCESS.
        </p>
      </div>
    </div>
  )
}

export function IdentityAdminPage() {
  const session = useAuthStore((s) => s.session)
  const admin = useIdentityAdmin()

  // Detail Modal Overlays Visibility
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false)
  const [isDeviceDetailOpen, setIsDeviceDetailOpen] = useState(false)
  const usersPagination = usePagination(admin.rows, 10)
  const devicesPagination = usePagination(admin.stationDeviceRows, 10)

  if (!isSystemAdminSession(session)) {
    return (
      <section className="flex flex-col gap-6 font-sans">
        <PageHeader
          breadcrumbs={[
            { label: 'Trang chủ', href: '/home' },
            { label: 'Quản trị', href: '/admin' },
            { label: 'Users' },
          ]}
          title="Identity & User Admin"
        />
        <p className="p-4 rounded bg-red-50 dark:bg-red-950/20 text-sm text-red-650 border border-red-200 dark:border-red-900" role="alert">
          Bạn không có quyền quản trị identity (system_admin_only).
        </p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Quản trị', href: '/admin' },
          { label: 'Users' },
        ]}
        title="Identity & User Admin"
        subtitle="Quản lý danh sách người dùng, phân quyền vai trò và các thiết bị trạm (Station Device)."
        actions={
          admin.tab === 'users' ? (
            <Button onClick={admin.openCreate}>Tạo user</Button>
          ) : (
            <Button onClick={admin.openStationDeviceCreate}>Tạo station device</Button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'users'}
          className={`pb-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            admin.tab === 'users'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
          }`}
          onClick={() => admin.setTab('users')}
        >
          Users
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'station_devices'}
          className={`pb-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            admin.tab === 'station_devices'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-355'
          }`}
          onClick={() => admin.setTab('station_devices')}
        >
          Station Devices
        </button>
      </div>

      {admin.tab === 'users' ? (
        <>
          {/* Filters */}
          <form
            className="flex items-center gap-2 max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applySearch()
            }}
          >
            <div className="flex-1">
              <Input
                value={admin.searchInput}
                onChange={(e) => admin.setSearchInput(e.target.value)}
                placeholder="Tìm user (mã EMP-… / họ tên)..."
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-9 px-2"
              />
            </div>
            <Button type="submit" size="sm" className="h-9 w-9 px-0" aria-label="Lọc">
              <Search size={16} />
            </Button>
          </form>

          {/* User Create Dialog Modal */}
          <Dialog
            isOpen={admin.showCreate}
            onClose={admin.closeCreate}
            title="Tạo user mới"
          >
            <div className="flex flex-col gap-4 font-sans text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Code</span>
                <Input
                  value={admin.createForm.code}
                  onChange={(e) => admin.setCreateForm({ ...admin.createForm, code: e.target.value })}
                  placeholder="EMP-..."
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Họ tên</span>
                <Input
                  value={admin.createForm.full_name}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, full_name: e.target.value })
                  }
                  placeholder="Nhập họ tên đầy đủ..."
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Email (tùy chọn)</span>
                <Input
                  value={admin.createForm.email ?? ''}
                  onChange={(e) => admin.setCreateForm({ ...admin.createForm, email: e.target.value })}
                  placeholder="example@factory.com"
                />
              </div>
              <Button
                type="button"
                className="w-full mt-2"
                disabled={admin.createPending}
                onClick={() => admin.create()}
              >
                {admin.createPending ? 'Đang tạo…' : 'Tạo'}
              </Button>
              {admin.createError && (
                <p className="p-2.5 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-650 border border-red-200" role="alert">
                  {admin.createError.code}: {admin.createError.message}
                </p>
              )}
            </div>
          </Dialog>

          {admin.listState === 'loading' && (
            <div className="text-sm text-slate-400">Đang tải users…</div>
          )}
          {(admin.listState === 'empty' || admin.listState === 'no-result') && (
            <div className="p-4 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm text-slate-500">
              {admin.listState === 'no-result' ? 'Không có kết quả khớp tìm kiếm.' : 'Chưa có user nào.'}
            </div>
          )}
          {(admin.listState === 'permission-denied' || admin.listState === 'error') && (
            <div className="p-4 rounded bg-red-50 dark:bg-red-950/20 text-sm text-red-650 border border-red-200" role="alert">
              {admin.listError?.code ?? admin.listState}
            </div>
          )}

          {admin.listState === 'ready' && (
            <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
              <Table containerClassName="relative w-full overflow-auto">
                <TableHeader>
                  <TableRow className="pointer-events-none hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersPagination.paginatedItems.map((row) => (
                    <TableRow
                      key={row.code}
                      className={row.code === admin.detail?.code ? 'bg-blue-50/50 dark:bg-slate-800/80' : ''}
                      onClick={() => {
                        admin.selectUser(row.code)
                        setIsUserDetailOpen(true)
                      }}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-0 py-0 h-auto font-semibold hover:underline"
                          onClick={(e) => {
                            e.stopPropagation()
                            admin.selectUser(row.code)
                            setIsUserDetailOpen(true)
                          }}
                        >
                          {row.code}
                        </Button>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-855 dark:text-slate-100">{row.fullName}</TableCell>
                      <TableCell>{row.emailLabel}</TableCell>
                      <TableCell>
                        <Badge variant={row.activeLabel === 'Active' ? 'active' : 'inactive'}>
                          {row.activeLabel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <DataTablePagination {...usersPagination} />
            </div>
          )}

          {/* User Details Modal */}
          <Dialog
            isOpen={isUserDetailOpen && !!admin.detail && !admin.detailLoading}
            onClose={() => setIsUserDetailOpen(false)}
            title="Chi tiết người dùng"
          >
            {admin.detail && (
              <UserDetailEditor
                key={admin.detail.code}
                detail={admin.detail}
                admin={admin}
                onClose={() => setIsUserDetailOpen(false)}
              />
            )}
          </Dialog>
        </>
      ) : null}

      {admin.tab === 'station_devices' ? (
        <>
          {/* Station device filters */}
          <form
            className="flex items-center gap-2 max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyStationDeviceSearch()
            }}
          >
            <div className="flex-1">
              <Input
                value={admin.sdSearchInput}
                onChange={(e) => admin.setSdSearchInput(e.target.value)}
                placeholder="Tìm station device (code STN-…)..."
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-9 px-2"
              />
            </div>
            <Button type="submit" size="sm" className="h-9 w-9 px-0" aria-label="Lọc">
              <Search size={16} />
            </Button>
          </form>

          {/* Station Device Create Dialog */}
          <Dialog
            isOpen={admin.showStationDeviceCreate}
            onClose={admin.closeStationDeviceCreate}
            title="Tạo station device mới"
          >
            <div className="flex flex-col gap-4 font-sans text-sm">
              <p className="text-xs text-slate-400">
                Form luôn hiển thị — server enforce quyền tạo (NB01-016).
              </p>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Code</span>
                <Input
                  value={admin.stationDeviceCreateForm.code}
                  onChange={(e) =>
                    admin.setStationDeviceCreateForm({
                      ...admin.stationDeviceCreateForm,
                      code: e.target.value,
                    })
                  }
                  placeholder="STN-..."
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Device type</span>
                <Select
                  value={admin.stationDeviceCreateForm.device_type}
                  onChange={(e) =>
                    admin.setStationDeviceCreateForm({
                      ...admin.stationDeviceCreateForm,
                      device_type: e.target.value,
                    })
                  }
                >
                  {DEVICE_TYPE_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Location code (bỏ trống nếu WORKSTATION)</span>
                <Input
                  value={admin.stationDeviceCreateForm.location_code ?? ''}
                  onChange={(e) =>
                    admin.setStationDeviceCreateForm({
                      ...admin.stationDeviceCreateForm,
                      location_code: e.target.value,
                    })
                  }
                  placeholder="WH-..."
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Hardware ID</span>
                <Input
                  value={admin.stationDeviceCreateForm.hardware_id}
                  onChange={(e) =>
                    admin.setStationDeviceCreateForm({
                      ...admin.stationDeviceCreateForm,
                      hardware_id: e.target.value,
                    })
                  }
                  placeholder="Ví dụ: MAC-address..."
                />
              </div>
              
              <div className="flex gap-2 justify-end mt-2">
                <Button
                  type="button"
                  disabled={
                    admin.stationDeviceCreateErrors.length > 0 || admin.createStationDevicePending
                  }
                  onClick={() => admin.createStationDevice()}
                >
                  {admin.createStationDevicePending ? 'Đang tạo…' : 'Tạo'}
                </Button>
                <Button variant="secondary" type="button" onClick={admin.closeStationDeviceCreate}>
                  Hủy
                </Button>
              </div>

              {admin.createStationDeviceError && (
                <p className="p-2.5 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-650 border border-red-200" role="alert">
                  {admin.createStationDeviceError.code}: {admin.createStationDeviceError.message}
                </p>
              )}
            </div>
          </Dialog>

          {(() => {
            const bannerText = stationDeviceListStateMessage(admin.stationDeviceListState)
            return bannerText ? (
              <p
                className="p-4 rounded bg-blue-50 dark:bg-slate-900 text-sm text-slate-500 dark:text-slate-350 border border-blue-100 dark:border-slate-800"
                role={admin.stationDeviceListState === 'error' ? 'alert' : 'status'}
              >
                {bannerText}
                {admin.stationDeviceListError ? ` (${admin.stationDeviceListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.stationDeviceListState === 'ready' && (
            <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
              <Table containerClassName="relative w-full overflow-auto">
                <TableHeader>
                  <TableRow className="pointer-events-none hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Device type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Hardware ID</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devicesPagination.paginatedItems.map((row) => (
                    <TableRow
                      key={row.code}
                      className={
                        row.code === admin.selectedStationDeviceCode
                          ? 'bg-blue-50/50 dark:bg-slate-800/80'
                          : ''
                      }
                      onClick={() => {
                        admin.selectStationDevice(row.code)
                        setIsDeviceDetailOpen(true)
                      }}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-0 py-0 h-auto font-semibold hover:underline"
                          onClick={(e) => {
                            e.stopPropagation()
                            admin.selectStationDevice(row.code)
                            setIsDeviceDetailOpen(true)
                          }}
                        >
                          {row.code}
                        </Button>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-850 dark:text-slate-100">{row.deviceType}</TableCell>
                      <TableCell>{row.locationLabel}</TableCell>
                      <TableCell className="font-mono text-xs">{row.hardwareId}</TableCell>
                      <TableCell>
                        <Badge variant={row.isActive ? 'active' : 'inactive'}>
                          {row.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex flex-col sm:flex-row items-center justify-between w-full bg-white dark:bg-transparent">
                <div className="flex-1">
                  <DataTablePagination {...devicesPagination} />
                </div>
                {admin.stationDeviceHasMore && (
                  <div className="pr-5 pb-3 sm:pb-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={admin.stationDeviceLoadMore}
                    >
                      Tải thêm từ Server
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Station Device Details Modal */}
          <Dialog
            isOpen={isDeviceDetailOpen && !!admin.stationDeviceDetail && !admin.stationDeviceDetailLoading}
            onClose={() => setIsDeviceDetailOpen(false)}
            title="Chi tiết Station Device"
          >
            {admin.stationDeviceDetail && (
              <StationDeviceEditor
                key={admin.stationDeviceDetail.code}
                detail={admin.stationDeviceDetail}
                admin={admin}
                onClose={() => setIsDeviceDetailOpen(false)}
              />
            )}
          </Dialog>
        </>
      ) : null}
    </section>
  )
}
