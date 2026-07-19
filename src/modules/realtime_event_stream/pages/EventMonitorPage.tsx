import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { isSystemAdminSession } from '@/shared/api'
import { useAuthStore } from '@/shared/store/authStore'

import { useEventMonitor } from '../hooks/useEventMonitor'

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
  const [subscriptionForm, setSubscriptionForm] = useState({
    session_id: '',
    user_id: '',
    channel_key: '',
  })

  if (!isSystemAdminSession(session)) {
    return (
      <section className="event-admin" aria-labelledby="event-admin-title">
        <header className="event-admin__header">
          <div>
            <p className="event-admin__eyebrow">WEB-NB-06-EVENT-STREAM</p>
            <h2 id="event-admin-title">Realtime Event Monitor</h2>
          </div>
          <Link to="/admin">Về quản trị</Link>
        </header>
        <p className="event-admin__state" role="alert">
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
    <section className="event-admin" aria-labelledby="event-admin-title">
      <header className="event-admin__header">
        <div>
          <p className="event-admin__eyebrow">WEB-NB-06-EVENT-STREAM</p>
          <h2 id="event-admin-title">Realtime Event Monitor</h2>
          <p className="event-admin__lead">
            Theo dõi transactional outbox, delivery health và subscription đang hoạt động.
          </p>
        </div>
        <Link to="/admin">Về quản trị</Link>
      </header>

      <div className="event-admin__tabs" role="tablist" aria-label="Realtime admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'events'}
          onClick={() => setTab('events')}
        >
          Event outbox
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'subscriptions'}
          onClick={() => setTab('subscriptions')}
        >
          Subscriptions
        </button>
      </div>

      {tab === 'events' ? (
        <>
          <form
            className="event-admin__filters"
            onSubmit={(event) => {
              event.preventDefault()
              monitor.applyFilters()
            }}
          >
            <label>
              <span>Event name</span>
              <input
                value={String(monitor.draftFilters.event_type ?? '')}
                onChange={(event) => monitor.setDraftFilter('event_type', event.target.value)}
                placeholder="production_log.posted"
              />
            </label>
            <label>
              <span>Producer module</span>
              <input
                value={String(monitor.draftFilters.source_module ?? '')}
                onChange={(event) => monitor.setDraftFilter('source_module', event.target.value)}
                placeholder="MES-05"
              />
            </label>
            <label>
              <span>Entity type</span>
              <input
                value={String(monitor.draftFilters.entity_type ?? '')}
                onChange={(event) => monitor.setDraftFilter('entity_type', event.target.value)}
                placeholder="production_log"
              />
            </label>
            <label>
              <span>Status</span>
              <select
                value={String(monitor.draftFilters.status ?? '')}
                onChange={(event) => monitor.setDraftFilter('status', event.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="PENDING">PENDING</option>
                <option value="PUBLISHING">PUBLISHING</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="FAILED">FAILED</option>
                <option value="DEAD_LETTER">DEAD_LETTER</option>
              </select>
            </label>
            <label>
              <span>Request ID</span>
              <input
                value={String(monitor.draftFilters.request_id ?? '')}
                onChange={(event) => monitor.setDraftFilter('request_id', event.target.value)}
                placeholder="req-..."
              />
            </label>
            <label>
              <span>Occurred from (RFC3339)</span>
              <input
                value={String(monitor.draftFilters.occurred_from ?? '')}
                onChange={(event) => monitor.setDraftFilter('occurred_from', event.target.value)}
                placeholder="2026-07-18T00:00:00Z"
              />
            </label>
            <label>
              <span>Occurred to (RFC3339)</span>
              <input
                value={String(monitor.draftFilters.occurred_to ?? '')}
                onChange={(event) => monitor.setDraftFilter('occurred_to', event.target.value)}
                placeholder="2026-07-18T23:59:59Z"
              />
            </label>
            <div className="event-admin__actions">
              <button type="submit">Lọc</button>
              <button type="button" onClick={monitor.clearFilters}>
                Xóa lọc
              </button>
              <button type="button" onClick={monitor.refresh}>
                Làm mới
              </button>
            </div>
          </form>

          {banner ? (
            <p className="event-admin__state" role="status">
              {banner}
              {monitor.listError ? ` (${monitor.listError.code})` : ''}
            </p>
          ) : null}

          <div className="event-admin__layout">
            <div className="event-admin__table-wrap">
              <table className="event-admin__table">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Name</th>
                    <th>Producer</th>
                    <th>Entity</th>
                    <th>Status</th>
                    <th>Retry</th>
                    <th>Occurred</th>
                  </tr>
                </thead>
                <tbody>
                  {monitor.rows.map((row) => (
                    <tr
                      key={row.id}
                      className={row.id === monitor.selectedId ? 'event-admin__row--active' : ''}
                    >
                      <td>
                        <button
                          type="button"
                          className="event-admin__link"
                          onClick={() => monitor.setSelectedId(row.id)}
                        >
                          {row.eventId}
                        </button>
                      </td>
                      <td>{row.eventType}</td>
                      <td>{row.sourceModule}</td>
                      <td>{row.entityReference}</td>
                      <td>{row.status}</td>
                      <td>{row.retryCount}</td>
                      <td>{row.occurredAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {monitor.hasMore ? (
                <button type="button" className="event-admin__more" onClick={monitor.loadMore}>
                  Tải thêm
                </button>
              ) : null}
            </div>

            <aside className="event-admin__detail" aria-label="Chi tiết event">
              {monitor.detailRow ? (
                <>
                  <h3>{monitor.detailRow.eventId}</h3>
                  <dl>
                    <div>
                      <dt>Status</dt>
                      <dd>{monitor.detailRow.status}</dd>
                    </div>
                    <div>
                      <dt>Request ID</dt>
                      <dd>{monitor.detailRow.requestId}</dd>
                    </div>
                    <div>
                      <dt>Last error</dt>
                      <dd>{monitor.detailRow.lastError}</dd>
                    </div>
                    <div>
                      <dt>Redacted payload preview</dt>
                      <dd className="event-admin__payload">{monitor.detailRow.payloadPreview}</dd>
                    </div>
                  </dl>
                  {monitor.detailRow.canReplay ? (
                    <button type="button" onClick={() => monitor.setConfirmReplay(true)}>
                      Replay
                    </button>
                  ) : null}
                  {monitor.confirmReplay ? (
                    <div className="event-admin__confirm" role="dialog" aria-label="Xác nhận replay">
                      <p>Replay tạo delivery attempt mới. Event gốc không bị thay đổi.</p>
                      <label>
                        <span>Lý do</span>
                        <input
                          value={monitor.replayReason}
                          onChange={(event) => monitor.setReplayReason(event.target.value)}
                        />
                      </label>
                      <div className="event-admin__actions">
                        <button
                          type="button"
                          disabled={
                            !monitor.replayReason.trim() || monitor.replayState === 'pending'
                          }
                          onClick={monitor.requestReplay}
                        >
                          Xác nhận replay
                        </button>
                        <button type="button" onClick={() => monitor.setConfirmReplay(false)}>
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {monitor.replayError ? (
                    <p className="event-admin__state" role="alert">
                      {monitor.replayError.code}: {monitor.replayError.message}
                    </p>
                  ) : null}
                  {monitor.replayState === 'success' ? (
                    <p className="event-admin__state" role="status">
                      Đã tạo replay delivery attempt.
                    </p>
                  ) : null}
                </>
              ) : (
                <p>Chọn event để xem payload và action.</p>
              )}
            </aside>
          </div>
        </>
      ) : (
        <div className="event-admin__layout">
          <div className="event-admin__table-wrap">
            {monitor.subscriptionsLoading ? (
              <p className="event-admin__state">Đang tải subscriptions...</p>
            ) : null}
            {monitor.subscriptionsError ? (
              <p className="event-admin__state" role="alert">
                {monitor.subscriptionsError.message}
              </p>
            ) : null}
            <table className="event-admin__table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>User</th>
                  <th>Channel</th>
                  <th>Last ping</th>
                  <th>Revoked</th>
                </tr>
              </thead>
              <tbody>
                {monitor.subscriptions.map((subscription) => (
                  <tr key={subscription.code}>
                    <td>
                      <button
                        type="button"
                        className="event-admin__link"
                        onClick={() => monitor.setSelectedSubscriptionCode(subscription.code)}
                      >
                        {subscription.code}
                      </button>
                    </td>
                    <td>{subscription.user_id}</td>
                    <td>{subscription.channel_key}</td>
                    <td>{subscription.last_ping_at}</td>
                    <td>{subscription.revoked_at ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <aside className="event-admin__detail">
            <h3>Tạo subscription</h3>
            <form className="event-admin__stack" onSubmit={submitSubscription}>
              <label>
                <span>Session ID</span>
                <input
                  value={subscriptionForm.session_id}
                  onChange={(event) =>
                    setSubscriptionForm((current) => ({
                      ...current,
                      session_id: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>User ID</span>
                <input
                  value={subscriptionForm.user_id}
                  onChange={(event) =>
                    setSubscriptionForm((current) => ({
                      ...current,
                      user_id: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Channel key</span>
                <input
                  value={subscriptionForm.channel_key}
                  onChange={(event) =>
                    setSubscriptionForm((current) => ({
                      ...current,
                      channel_key: event.target.value,
                    }))
                  }
                />
              </label>
              <button type="submit" disabled={monitor.createPending}>
                Tạo subscription
              </button>
            </form>
            {monitor.createError ? (
              <p className="event-admin__state" role="alert">
                {monitor.createError.message}
              </p>
            ) : null}
            {monitor.selectedSubscriptionCode ? (
              <div className="event-admin__confirm">
                <p>Đã chọn {monitor.selectedSubscriptionCode}</p>
                <button
                  type="button"
                  disabled={monitor.revokePending}
                  onClick={monitor.revokeSubscription}
                >
                  Revoke subscription
                </button>
              </div>
            ) : null}
            {monitor.revokeError ? (
              <p className="event-admin__state" role="alert">
                {monitor.revokeError.message}
              </p>
            ) : null}
          </aside>
        </div>
      )}
    </section>
  )
}
