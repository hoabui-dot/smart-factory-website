import { Link } from 'react-router'

import { isSystemAdminSession } from '@/shared/api'
import { useAuthStore } from '@/shared/store/authStore'

import { useNotificationDeliveryAdmin } from '../hooks/useNotificationDeliveryAdmin'

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

  if (!isSystemAdminSession(session)) {
    return (
      <section className="ndl-admin" aria-labelledby="ndl-admin-title">
        <header className="ndl-admin__header">
          <div>
            <p className="ndl-admin__eyebrow">WEB-NB-09-NOTIFICATION-DELIVERY</p>
            <h2 id="ndl-admin-title">Notification Delivery Admin</h2>
          </div>
          <Link to="/admin">Về quản trị</Link>
        </header>
        <p className="ndl-admin__state" role="alert">
          Bạn không có quyền xem Notification Delivery Admin (system_admin_only).
        </p>
      </section>
    )
  }

  const banner = stateMessage(admin.listState)

  return (
    <section className="ndl-admin" aria-labelledby="ndl-admin-title">
      <header className="ndl-admin__header">
        <div>
          <p className="ndl-admin__eyebrow">WEB-NB-09-NOTIFICATION-DELIVERY</p>
          <h2 id="ndl-admin-title">Notification Delivery Admin</h2>
          <p className="ndl-admin__lead">Theo dõi delivery log và retry các lần FAILED.</p>
        </div>
        <Link to="/admin">Về quản trị</Link>
      </header>

      <form
        className="ndl-admin__filters"
        onSubmit={(event) => {
          event.preventDefault()
          admin.applyFilters()
        }}
      >
        <label>
          <span>Tìm kiếm</span>
          <input
            value={admin.draftQ}
            onChange={(event) => admin.setDraftQ(event.target.value)}
            placeholder="code / channel / status"
          />
        </label>
        <div className="ndl-admin__actions">
          <button type="submit">Lọc</button>
          <button type="button" onClick={admin.clearFilters}>
            Xóa lọc
          </button>
          <button type="button" onClick={admin.refresh}>
            Làm mới
          </button>
        </div>
      </form>

      {banner ? (
        <p className="ndl-admin__state" role="status">
          {banner}
          {admin.listError ? ` (${admin.listError.code})` : ''}
        </p>
      ) : null}

      <div className="ndl-admin__layout">
        <div className="ndl-admin__table-wrap">
          <table className="ndl-admin__table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Attempted</th>
              </tr>
            </thead>
            <tbody>
              {admin.rows.map((row) => (
                <tr
                  key={row.id}
                  className={row.id === admin.selectedId ? 'ndl-admin__row--active' : ''}
                >
                  <td>
                    <button
                      type="button"
                      className="ndl-admin__link"
                      onClick={() => admin.setSelectedId(row.id)}
                    >
                      {row.code}
                    </button>
                  </td>
                  <td>{row.channel}</td>
                  <td>{row.status}</td>
                  <td>{row.attemptedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {admin.hasMore ? (
            <button type="button" onClick={admin.loadMore}>
              Tải thêm
            </button>
          ) : null}
        </div>
        <aside className="ndl-admin__detail">
          {admin.selected ? (
            <>
              <h3>{admin.selected.code}</h3>
              <dl>
                <div>
                  <dt>Notification ID</dt>
                  <dd>{admin.selected.notificationId}</dd>
                </div>
                <div>
                  <dt>Error</dt>
                  <dd>{admin.selected.errorMessage}</dd>
                </div>
              </dl>
              {admin.selected.canRetry ? (
                <button type="button" disabled={admin.retryPending} onClick={admin.retry}>
                  Retry delivery
                </button>
              ) : null}
              {admin.retryError ? (
                <p className="ndl-admin__state" role="alert">
                  {admin.retryError.code}: {admin.retryError.message}
                </p>
              ) : null}
              {admin.retrySuccess ? (
                <p className="ndl-admin__state" role="status">
                  Đã enqueue retry.
                </p>
              ) : null}
            </>
          ) : (
            <p>Chọn log để xem chi tiết.</p>
          )}
        </aside>
      </div>
    </section>
  )
}
