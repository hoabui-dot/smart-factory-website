import { Link } from 'react-router'

import { useNotificationCenter } from '../hooks/useNotificationCenter'

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

  return (
    <section className="ntf-center" aria-labelledby="ntf-center-title">
      <header className="ntf-center__header">
        <div>
          <p className="ntf-center__eyebrow">WEB-NB-08-NOTIFICATION-CENTER</p>
          <h2 id="ntf-center-title">Notification Center</h2>
          <p className="ntf-center__lead">
            Hộp thư cá nhân — mark read / deep-link. Không gọi fanout hoặc broadcast.
          </p>
        </div>
        <div className="ntf-center__actions">
          <span className="ntf-center__badge" aria-label="Unread count">
            Unread: {center.unreadCount}
          </span>
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

      <form
        className="ntf-center__filters"
        onSubmit={(event) => {
          event.preventDefault()
          center.applyFilters()
        }}
      >
        <label>
          <span>Tìm kiếm</span>
          <input
            value={center.draftQ}
            onChange={(event) => center.setDraftQ(event.target.value)}
            placeholder="title / event_type"
          />
        </label>
        <div className="ntf-center__actions">
          <button type="submit">Lọc</button>
          <button type="button" onClick={center.clearFilters}>
            Xóa lọc
          </button>
          <button type="button" onClick={center.refresh}>
            Làm mới
          </button>
          <button
            type="button"
            disabled={center.markState === 'pending'}
            onClick={center.markAllRead}
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </form>

      {banner ? (
        <p className="ntf-center__state" role="status">
          {banner}
          {center.listError ? ` (${center.listError.code})` : ''}
        </p>
      ) : null}

      <div className="ntf-center__layout">
        <div className="ntf-center__table-wrap">
          <table className="ntf-center__table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Created</th>
                <th>Read</th>
              </tr>
            </thead>
            <tbody>
              {center.rows.map((row) => (
                <tr
                  key={row.code}
                  className={row.code === center.selectedCode ? 'ntf-center__row--active' : ''}
                >
                  <td>
                    <button
                      type="button"
                      className="ntf-center__link"
                      onClick={() => center.setSelectedCode(row.code)}
                    >
                      {row.code}
                    </button>
                  </td>
                  <td>{row.title}</td>
                  <td>{row.priority}</td>
                  <td>{row.createdAt}</td>
                  <td>{row.isRead ? 'READ' : 'UNREAD'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {center.hasMore ? (
            <button type="button" className="ntf-center__more" onClick={center.loadMore}>
              Tải thêm
            </button>
          ) : null}
        </div>

        <aside className="ntf-center__detail" aria-label="Chi tiết thông báo">
          {center.detailRow ? (
            <>
              <h3>{center.detailRow.code}</h3>
              <dl>
                <div>
                  <dt>Title</dt>
                  <dd>{center.detailRow.title}</dd>
                </div>
                <div>
                  <dt>Body</dt>
                  <dd>{center.detailRow.body}</dd>
                </div>
                <div>
                  <dt>Event / priority / mode</dt>
                  <dd>
                    {center.detailRow.eventType} · {center.detailRow.priority} ·{' '}
                    {center.detailRow.displayMode}
                  </dd>
                </div>
                <div>
                  <dt>Group</dt>
                  <dd>{center.detailRow.groupLabel}</dd>
                </div>
                <div>
                  <dt>Related</dt>
                  <dd>{center.detailRow.relatedEntity}</dd>
                </div>
                <div>
                  <dt>Read at</dt>
                  <dd>{center.detailRow.readAt}</dd>
                </div>
              </dl>
              <div className="ntf-center__actions">
                {!center.detailRow.isRead ? (
                  <button
                    type="button"
                    disabled={center.markState === 'pending'}
                    onClick={center.markRead}
                  >
                    Đánh dấu đã đọc
                  </button>
                ) : null}
                {center.detailRow.deepLink ? (
                  <Link to={center.detailRow.deepLink}>Mở deep link</Link>
                ) : null}
              </div>
              {center.markError ? (
                <p className="ntf-center__state" role="alert">
                  {center.markError.code}: {center.markError.message}
                </p>
              ) : null}
            </>
          ) : (
            <p>Chọn thông báo để xem chi tiết.</p>
          )}
        </aside>
      </div>
    </section>
  )
}
