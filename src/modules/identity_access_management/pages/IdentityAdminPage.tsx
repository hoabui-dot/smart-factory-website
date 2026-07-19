import { useState } from 'react'
import { Link } from 'react-router'

import { isSystemAdminSession } from '@/shared/api'
import { CANONICAL_ROLE_CODES } from '@/shared/constants/roles'
import { useAuthStore } from '@/shared/store/authStore'

import { useIdentityAdmin } from '../hooks/useIdentityAdmin'
import { DEVICE_TYPE_VALUES } from '../types/userAdmin'
import type { StationDevice, UserDetail } from '../types/userAdmin'

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

function StationDeviceEditor({ detail, admin }: { detail: StationDevice; admin: AdminApi }) {
  const [deviceType, setDeviceType] = useState(detail.device_type)
  const [locationCode, setLocationCode] = useState(detail.location_code ?? '')
  const [hardwareId, setHardwareId] = useState(detail.hardware_id)
  const row = admin.stationDeviceDetailRow

  return (
    <aside className="identity-admin__detail" aria-label="Chi tiết station device">
      <h3>{detail.code}</h3>
      <p className="identity-admin__muted">
        {detail.is_active ? 'Active' : 'Disabled'} · {detail.device_type} · đăng ký{' '}
        {detail.registered_at}
      </p>

      <label className="identity-admin__field">
        <span>Device type</span>
        <select value={deviceType} onChange={(e) => setDeviceType(e.target.value)}>
          {DEVICE_TYPE_VALUES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="identity-admin__field">
        <span>Location code (bỏ trống nếu WORKSTATION)</span>
        <input value={locationCode} onChange={(e) => setLocationCode(e.target.value)} />
      </label>
      <label className="identity-admin__field">
        <span>Hardware ID</span>
        <input value={hardwareId} onChange={(e) => setHardwareId(e.target.value)} />
      </label>

      <button
        type="button"
        className="identity-admin__btn"
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
      </button>
      {!row?.canUpdate ? (
        <p className="identity-admin__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateStationDeviceError ? (
        <p className="identity-admin__error" role="alert">
          {admin.updateStationDeviceError.code}: {admin.updateStationDeviceError.message}
        </p>
      ) : null}
      {admin.updateStationDeviceSuccess ? (
        <p className="identity-admin__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>Deactivate</h4>
      <button
        type="button"
        className="identity-admin__btn identity-admin__btn--danger"
        disabled={!row?.canDeactivate}
        title={row?.deactivateDisabledReason ?? undefined}
        onClick={() => admin.setConfirmStationDeviceDeactivate(true)}
      >
        Deactivate device
      </button>
      {!row?.canDeactivate ? (
        <p className="identity-admin__muted">
          Deactivate không khả dụng
          {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.confirmStationDeviceDeactivate ? (
        <div className="identity-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
          <p>
            Xác nhận deactivate <strong>{detail.code}</strong>? Hành động này không thể hoàn tác.
          </p>
          <div className="identity-admin__row-actions">
            <button
              type="button"
              className="identity-admin__btn identity-admin__btn--danger"
              disabled={admin.deactivateStationDeviceState === 'pending'}
              onClick={admin.deactivateStationDevice}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmStationDeviceDeactivate(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.deactivateStationDeviceError ? (
        <p className="identity-admin__error" role="alert">
          {admin.deactivateStationDeviceError.code}: {admin.deactivateStationDeviceError.message}
        </p>
      ) : null}
      {admin.deactivateStationDeviceState === 'success' ? (
        <p className="identity-admin__banner" role="status">
          Đã deactivate device.
        </p>
      ) : null}
    </aside>
  )
}

function UserDetailEditor({ detail, admin }: { detail: UserDetail; admin: AdminApi }) {
  const [fullName, setFullName] = useState(detail.full_name)
  const [email, setEmail] = useState(detail.email ?? '')
  const [phone, setPhone] = useState(detail.phone_number ?? '')
  const [roles, setRoles] = useState<string[]>([...detail.roles])
  const [locations, setLocations] = useState(detail.locations.join(', '))

  return (
    <aside className="identity-admin__detail" aria-label="Chi tiết user">
      <h3>{detail.code}</h3>
      <p className="identity-admin__muted">
        {detail.is_active ? 'Active' : 'Disabled'} · {detail.updated_at}
      </p>

      <label className="identity-admin__field">
        <span>Họ tên</span>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </label>
      <label className="identity-admin__field">
        <span>Email</span>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="identity-admin__field">
        <span>Phone</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <button
        type="button"
        className="identity-admin__btn"
        disabled={admin.updatePending}
        onClick={() =>
          admin.saveEdit({
            full_name: fullName.trim(),
            email: email.trim() ? email.trim() : null,
            phone_number: phone.trim() ? phone.trim() : null,
          })
        }
      >
        Lưu thông tin
      </button>
      {admin.updateError ? (
        <p className="identity-admin__error" role="alert">
          {admin.updateError.code}
        </p>
      ) : null}

      <h4>Roles</h4>
      <div className="identity-admin__chips">
        {CANONICAL_ROLE_CODES.map((code) => (
          <label key={code} className="identity-admin__chip">
            <input
              type="checkbox"
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
      <button
        type="button"
        className="identity-admin__btn"
        disabled={admin.rolesPending || roles.length === 0}
        onClick={() => {
          if (window.confirm(`Thay thế roles của ${detail.code}?`)) {
            admin.saveRoles(roles)
          }
        }}
      >
        Lưu roles
      </button>
      {admin.rolesError ? (
        <p className="identity-admin__error" role="alert">
          {admin.rolesError.code}
        </p>
      ) : null}

      <h4>Locations</h4>
      <label className="identity-admin__field">
        <span>location_codes (CSV)</span>
        <input value={locations} onChange={(e) => setLocations(e.target.value)} />
      </label>
      <button
        type="button"
        className="identity-admin__btn"
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
      </button>

      <h4>Actions</h4>
      <label className="identity-admin__field">
        <span>Disable reason</span>
        <input
          value={admin.disableReason}
          onChange={(e) => admin.setDisableReason(e.target.value)}
        />
      </label>
      <div className="identity-admin__row-actions">
        <button
          type="button"
          className="identity-admin__btn identity-admin__btn--danger"
          disabled={!admin.disableReason.trim() || admin.disablePending}
          onClick={() => {
            if (window.confirm(`Vô hiệu hóa ${detail.code}?`)) {
              admin.disable()
            }
          }}
        >
          Disable user
        </button>
        <button
          type="button"
          className="identity-admin__btn identity-admin__btn--secondary"
          disabled={admin.resetUi === 'pending'}
          onClick={() => {
            if (window.confirm(`Reset password cho ${detail.code}?`)) {
              admin.resetPassword()
            }
          }}
        >
          Reset password
        </button>
      </div>
      {admin.resetUi === 'queued' ? (
        <p className="identity-admin__banner" role="status">
          Reset queued: {admin.resetResult?.job_code}
        </p>
      ) : null}
      {admin.resetUi === 'temporary-pin' ? (
        <p className="identity-admin__banner" role="status">
          Temporary PIN (one-time): <strong>{admin.resetResult?.temporary_pin}</strong>
        </p>
      ) : null}
      {admin.resetUi === 'retryable-partial' || admin.resetError ? (
        <p className="identity-admin__error" role="alert">
          {admin.resetError?.code ?? 'CREDENTIAL_RESET_PARTIAL_FAILURE'}
        </p>
      ) : null}
      <p className="identity-admin__muted">
        Station-device admin (NB01-014..018) deferred to NB-01d-STATION-ACCESS.
      </p>
    </aside>
  )
}

export function IdentityAdminPage() {
  const session = useAuthStore((s) => s.session)
  const admin = useIdentityAdmin()

  if (!isSystemAdminSession(session)) {
    return (
      <section className="identity-admin" aria-labelledby="identity-title">
        <header className="identity-admin__header">
          <div>
            <p className="identity-admin__eyebrow">WEB-NB-01-IDENTITY</p>
            <h2 id="identity-title">Identity &amp; User Admin</h2>
          </div>
          <Link to="/admin">Về quản trị</Link>
        </header>
        <div className="identity-admin__state" role="alert">
          Bạn không có quyền quản trị identity (system_admin_only).
        </div>
      </section>
    )
  }

  return (
    <section className="identity-admin" aria-labelledby="identity-title">
      <header className="identity-admin__header">
        <div>
          <p className="identity-admin__eyebrow">WEB-NB-01-IDENTITY · `/web/admin/users` · NB-01c/NB-01d</p>
          <h2 id="identity-title">Identity &amp; User Admin</h2>
          <p className="identity-admin__lead">
            Quản lý user / role / location (NB01-006..013) và station device (NB01-014..018).
            Mutation gated bởi server <code>allowed_actions</code>.
          </p>
        </div>
        <div className="identity-admin__actions">
          <Link to="/admin">Về quản trị</Link>
        </div>
      </header>

      <div className="identity-admin__tabs" role="tablist" aria-label="Identity admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'users'}
          onClick={() => admin.setTab('users')}
        >
          Users
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'station_devices'}
          onClick={() => admin.setTab('station_devices')}
        >
          Station Devices
        </button>
      </div>

      {admin.tab === 'users' ? (
        <>
          <form
            className="identity-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applySearch()
            }}
          >
            <label className="identity-admin__field">
              <span>Tìm user (q)</span>
              <input
                value={admin.searchInput}
                onChange={(e) => admin.setSearchInput(e.target.value)}
                placeholder="EMP-… / tên"
              />
            </label>
            <button type="submit" className="identity-admin__btn">
              Lọc
            </button>
            <button type="button" className="identity-admin__btn" onClick={admin.openCreate}>
              Tạo user
            </button>
          </form>

          {admin.showCreate ? (
            <div className="identity-admin__create">
              <h3>Tạo user mới</h3>
              <label className="identity-admin__field">
                <span>Code</span>
                <input
                  value={admin.createForm.code}
                  onChange={(e) => admin.setCreateForm({ ...admin.createForm, code: e.target.value })}
                />
              </label>
              <label className="identity-admin__field">
                <span>Họ tên</span>
                <input
                  value={admin.createForm.full_name}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, full_name: e.target.value })
                  }
                />
              </label>
              <label className="identity-admin__field">
                <span>Email (optional)</span>
                <input
                  value={admin.createForm.email ?? ''}
                  onChange={(e) => admin.setCreateForm({ ...admin.createForm, email: e.target.value })}
                />
              </label>
              <button
                type="button"
                className="identity-admin__btn"
                disabled={admin.createPending}
                onClick={() => admin.create()}
              >
                {admin.createPending ? 'Đang tạo…' : 'Tạo'}
              </button>
              {admin.createError ? (
                <p className="identity-admin__error" role="alert">
                  {admin.createError.code}: {admin.createError.message}
                </p>
              ) : null}
            </div>
          ) : null}

          {admin.listState === 'loading' ? (
            <div className="identity-admin__state" role="status">
              Đang tải users…
            </div>
          ) : null}
          {admin.listState === 'empty' || admin.listState === 'no-result' ? (
            <div className="identity-admin__state" role="status">
              {admin.listState === 'no-result' ? 'Không có kết quả.' : 'Chưa có user.'}
            </div>
          ) : null}
          {admin.listState === 'permission-denied' || admin.listState === 'error' ? (
            <div className="identity-admin__state" role="alert">
              {admin.listError?.code ?? admin.listState}
            </div>
          ) : null}

          {admin.listState === 'ready' ? (
            <div className="identity-admin__layout">
              <div className="identity-admin__table-wrap">
                <table className="identity-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.rows.map((row) => (
                      <tr key={row.code}>
                        <td>
                          <button
                            type="button"
                            className="identity-admin__linkish"
                            onClick={() => admin.selectUser(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.fullName}</td>
                        <td>{row.emailLabel}</td>
                        <td>{row.activeLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {admin.detailLoading ? (
                <div className="identity-admin__state">Đang tải chi tiết…</div>
              ) : admin.detail ? (
                <UserDetailEditor key={admin.detail.code} detail={admin.detail} admin={admin} />
              ) : (
                <div className="identity-admin__state">Chọn user để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'station_devices' ? (
        <>
          <form
            className="identity-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyStationDeviceSearch()
            }}
          >
            <label className="identity-admin__field">
              <span>Tìm station device (code)</span>
              <input
                value={admin.sdSearchInput}
                onChange={(e) => admin.setSdSearchInput(e.target.value)}
                placeholder="STN-…"
              />
            </label>
            <button type="submit" className="identity-admin__btn">
              Lọc
            </button>
            <button
              type="button"
              className="identity-admin__btn"
              onClick={admin.openStationDeviceCreate}
            >
              Tạo station device
            </button>
          </form>

          {admin.showStationDeviceCreate ? (
            <div className="identity-admin__create">
              <h3>Tạo station device mới</h3>
              <p className="identity-admin__muted">
                Form luôn hiển thị — server enforce quyền tạo (NB01-016).
              </p>
              <label className="identity-admin__field">
                <span>Code</span>
                <input
                  value={admin.stationDeviceCreateForm.code}
                  onChange={(e) =>
                    admin.setStationDeviceCreateForm({
                      ...admin.stationDeviceCreateForm,
                      code: e.target.value,
                    })
                  }
                />
              </label>
              <label className="identity-admin__field">
                <span>Device type</span>
                <select
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
                </select>
              </label>
              <label className="identity-admin__field">
                <span>Location code (bỏ trống nếu WORKSTATION)</span>
                <input
                  value={admin.stationDeviceCreateForm.location_code ?? ''}
                  onChange={(e) =>
                    admin.setStationDeviceCreateForm({
                      ...admin.stationDeviceCreateForm,
                      location_code: e.target.value,
                    })
                  }
                />
              </label>
              <label className="identity-admin__field">
                <span>Hardware ID</span>
                <input
                  value={admin.stationDeviceCreateForm.hardware_id}
                  onChange={(e) =>
                    admin.setStationDeviceCreateForm({
                      ...admin.stationDeviceCreateForm,
                      hardware_id: e.target.value,
                    })
                  }
                />
              </label>
              <div className="identity-admin__row-actions">
                <button
                  type="button"
                  className="identity-admin__btn"
                  disabled={
                    admin.stationDeviceCreateErrors.length > 0 || admin.createStationDevicePending
                  }
                  onClick={() => admin.createStationDevice()}
                >
                  {admin.createStationDevicePending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closeStationDeviceCreate}>
                  Hủy
                </button>
              </div>
              {admin.createStationDeviceError ? (
                <p className="identity-admin__error" role="alert">
                  {admin.createStationDeviceError.code}: {admin.createStationDeviceError.message}
                </p>
              ) : null}
            </div>
          ) : null}

          {(() => {
            const banner = stationDeviceListStateMessage(admin.stationDeviceListState)
            return banner ? (
              <p
                className="identity-admin__state"
                role={admin.stationDeviceListState === 'error' ? 'alert' : 'status'}
              >
                {banner}
                {admin.stationDeviceListError ? ` (${admin.stationDeviceListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.stationDeviceListState === 'ready' ? (
            <div className="identity-admin__layout">
              <div className="identity-admin__table-wrap">
                <table className="identity-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Device type</th>
                      <th>Location</th>
                      <th>Hardware ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.stationDeviceRows.map((row) => (
                      <tr
                        key={row.code}
                        className={
                          row.code === admin.selectedStationDeviceCode
                            ? 'identity-admin__row--active'
                            : ''
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="identity-admin__linkish"
                            onClick={() => admin.selectStationDevice(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.deviceType}</td>
                        <td>{row.locationLabel}</td>
                        <td>{row.hardwareId}</td>
                        <td>{row.isActive ? 'Active' : 'Disabled'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.stationDeviceHasMore ? (
                  <button
                    type="button"
                    className="identity-admin__more"
                    onClick={admin.stationDeviceLoadMore}
                  >
                    Tải thêm
                  </button>
                ) : null}
              </div>
              {admin.stationDeviceDetailLoading ? (
                <div className="identity-admin__state">Đang tải chi tiết…</div>
              ) : admin.stationDeviceDetail ? (
                <StationDeviceEditor
                  key={admin.stationDeviceDetail.code}
                  detail={admin.stationDeviceDetail}
                  admin={admin}
                />
              ) : (
                <div className="identity-admin__state">Chọn station device để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
