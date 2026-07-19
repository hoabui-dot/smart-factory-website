import { Link } from 'react-router'

import { useNotificationSettings } from '../hooks/useNotificationSettings'

import './NotificationSettingsPage.css'

export function NotificationSettingsPage() {
  const settings = useNotificationSettings()

  return (
    <section className="ntf-settings" aria-labelledby="ntf-settings-title">
      <header className="ntf-settings__header">
        <div>
          <p className="ntf-settings__eyebrow">WEB-NB-09-NOTIFICATION-SETTINGS</p>
          <h2 id="ntf-settings-title">Notification Settings</h2>
          <p className="ntf-settings__lead">
            Tự quản lý push subscription và preference kênh realtime/push.
          </p>
        </div>
        <Link to="/home">Về trang chủ</Link>
      </header>

      <div className="ntf-settings__layout">
        <div className="ntf-settings__panel">
          <h3>Preferences</h3>
          {settings.preferencesLoading ? (
            <p className="ntf-settings__state">Đang tải preferences...</p>
          ) : null}
          {settings.preferencesError ? (
            <p className="ntf-settings__state" role="alert">
              {settings.preferencesError.code}: {settings.preferencesError.message}
            </p>
          ) : null}
          <table className="ntf-settings__table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Realtime</th>
                <th>Push</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {settings.preferenceRows.map((row) => (
                <tr key={row.code}>
                  <td>{row.eventType}</td>
                  <td>{row.realtimeEnabled ? 'ON' : 'OFF'}</td>
                  <td>{row.pushEnabled ? 'ON' : 'OFF'}</td>
                  <td>{row.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <form
            className="ntf-settings__form"
            onSubmit={(event) => {
              event.preventDefault()
              settings.savePreference()
            }}
          >
            <label>
              <span>event_type (để trống = default)</span>
              <input
                value={settings.prefDraft.event_type}
                onChange={(event) =>
                  settings.setPrefDraft((current) => ({
                    ...current,
                    event_type: event.target.value,
                  }))
                }
              />
            </label>
            <label className="ntf-settings__check">
              <input
                type="checkbox"
                checked={settings.prefDraft.realtime_enabled}
                onChange={(event) =>
                  settings.setPrefDraft((current) => ({
                    ...current,
                    realtime_enabled: event.target.checked,
                  }))
                }
              />
              <span>Realtime enabled</span>
            </label>
            <label className="ntf-settings__check">
              <input
                type="checkbox"
                checked={settings.prefDraft.push_enabled}
                onChange={(event) =>
                  settings.setPrefDraft((current) => ({
                    ...current,
                    push_enabled: event.target.checked,
                  }))
                }
              />
              <span>Push enabled</span>
            </label>
            <button type="submit" disabled={settings.prefPending}>
              Lưu preference
            </button>
          </form>
          {settings.prefError ? (
            <p className="ntf-settings__state" role="alert">
              {settings.prefError.code}: {settings.prefError.message}
            </p>
          ) : null}
          {settings.prefSuccess ? (
            <p className="ntf-settings__state" role="status">
              Đã lưu preference.
            </p>
          ) : null}
        </div>

        <div className="ntf-settings__panel">
          <h3>Push subscriptions</h3>
          {settings.subscriptionsLoading ? (
            <p className="ntf-settings__state">Đang tải subscriptions...</p>
          ) : null}
          {settings.subscriptionsError ? (
            <p className="ntf-settings__state" role="alert">
              {settings.subscriptionsError.code}: {settings.subscriptionsError.message}
            </p>
          ) : null}
          <table className="ntf-settings__table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Channel</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {settings.subscriptionRows.map((row) => (
                <tr key={row.code}>
                  <td>
                    <button
                      type="button"
                      className="ntf-settings__link"
                      onClick={() => settings.setSelectedCode(row.code)}
                    >
                      {row.code}
                    </button>
                  </td>
                  <td>{row.channel}</td>
                  <td>{row.isActive ? 'ACTIVE' : 'REVOKED'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <form
            className="ntf-settings__form"
            onSubmit={(event) => {
              event.preventDefault()
              settings.createSubscription()
            }}
          >
            <label>
              <span>channel</span>
              <select
                value={settings.form.channel}
                onChange={(event) => settings.setFormField('channel', event.target.value)}
              >
                <option value="WEB_PUSH">WEB_PUSH</option>
                <option value="FCM">FCM</option>
                <option value="APNS">APNS</option>
              </select>
            </label>
            <label>
              <span>endpoint</span>
              <input
                value={settings.form.endpoint}
                onChange={(event) => settings.setFormField('endpoint', event.target.value)}
              />
            </label>
            <label>
              <span>p256dh_key</span>
              <input
                value={settings.form.p256dh_key}
                onChange={(event) => settings.setFormField('p256dh_key', event.target.value)}
              />
            </label>
            <label>
              <span>auth_key</span>
              <input
                value={settings.form.auth_key}
                onChange={(event) => settings.setFormField('auth_key', event.target.value)}
              />
            </label>
            <button type="submit" disabled={settings.createPending}>
              Đăng ký subscription
            </button>
          </form>
          {settings.createError ? (
            <p className="ntf-settings__state" role="alert">
              {settings.createError.code}: {settings.createError.message}
            </p>
          ) : null}
          {settings.selectedCode ? (
            <div className="ntf-settings__confirm">
              <p>Đã chọn {settings.selectedCode}</p>
              <button
                type="button"
                disabled={settings.revokePending}
                onClick={settings.revokeSubscription}
              >
                Revoke subscription
              </button>
            </div>
          ) : null}
          {settings.revokeError ? (
            <p className="ntf-settings__state" role="alert">
              {settings.revokeError.code}: {settings.revokeError.message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
