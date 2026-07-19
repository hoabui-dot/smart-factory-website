import { Link } from 'react-router'

import { isSystemAdminSession } from '@/shared/api'
import { useAuthStore } from '@/shared/store/authStore'

import { useWorkerJobConsole } from '../hooks/useWorkerJobConsole'

import './WorkerJobConsolePage.css'

function stateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải worker jobs...'
    case 'empty':
      return 'Chưa có worker job.'
    case 'no-result':
      return 'Không có job khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem Worker Job Console (system_admin_only).'
    case 'error':
      return 'Không tải được worker jobs.'
    default:
      return ''
  }
}

export function WorkerJobConsolePage() {
  const session = useAuthStore((state) => state.session)
  const jobs = useWorkerJobConsole()

  if (!isSystemAdminSession(session)) {
    return (
      <section className="wj-console" aria-labelledby="wj-console-title">
        <header className="wj-console__header">
          <div>
            <p className="wj-console__eyebrow">WEB-NB-10-WORKER-JOB-CONSOLE</p>
            <h2 id="wj-console-title">Worker Job Console</h2>
          </div>
          <Link to="/admin">Về quản trị</Link>
        </header>
        <p className="wj-console__state" role="alert">
          Bạn không có quyền xem Worker Job Console (system_admin_only).
        </p>
      </section>
    )
  }

  const banner = stateMessage(jobs.listState)

  return (
    <section className="wj-console" aria-labelledby="wj-console-title">
      <header className="wj-console__header">
        <div>
          <p className="wj-console__eyebrow">WEB-NB-10-WORKER-JOB-CONSOLE</p>
          <h2 id="wj-console-title">Worker Job Console</h2>
          <p className="wj-console__lead">Quản trị lịch chạy, toggle, run-now và run history.</p>
        </div>
        <Link to="/admin">Về quản trị</Link>
      </header>

      <form
        className="wj-console__filters"
        onSubmit={(event) => {
          event.preventDefault()
          jobs.applyFilters()
        }}
      >
        <label>
          <span>q</span>
          <input
            value={jobs.draftFilters.q}
            onChange={(event) => jobs.setDraftFilter('q', event.target.value)}
          />
        </label>
        <label>
          <span>job_category</span>
          <input
            value={jobs.draftFilters.job_category}
            onChange={(event) => jobs.setDraftFilter('job_category', event.target.value)}
          />
        </label>
        <label>
          <span>module_scope</span>
          <input
            value={jobs.draftFilters.module_scope}
            onChange={(event) => jobs.setDraftFilter('module_scope', event.target.value)}
          />
        </label>
        <label>
          <span>enabled</span>
          <select
            value={jobs.draftFilters.enabled}
            onChange={(event) => jobs.setDraftFilter('enabled', event.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </label>
        <div className="wj-console__actions">
          <button type="submit">Lọc</button>
          <button type="button" onClick={jobs.clearFilters}>
            Xóa lọc
          </button>
          <button type="button" onClick={jobs.refresh}>
            Làm mới
          </button>
        </div>
      </form>

      {banner ? (
        <p className="wj-console__state" role="status">
          {banner}
          {jobs.listError ? ` (${jobs.listError.code})` : ''}
        </p>
      ) : null}

      <div className="wj-console__layout">
        <div className="wj-console__table-wrap">
          <table className="wj-console__table">
            <thead>
              <tr>
                <th>Job key</th>
                <th>Name</th>
                <th>Enabled</th>
                <th>Last status</th>
                <th>Next run</th>
              </tr>
            </thead>
            <tbody>
              {jobs.rows.map((row) => (
                <tr
                  key={row.jobKey}
                  className={row.jobKey === jobs.selectedKey ? 'wj-console__row--active' : ''}
                >
                  <td>
                    <button
                      type="button"
                      className="wj-console__link"
                      onClick={() => jobs.setSelectedKey(row.jobKey)}
                    >
                      {row.jobKey}
                    </button>
                  </td>
                  <td>{row.displayName}</td>
                  <td>{row.enabled ? 'ON' : 'OFF'}</td>
                  <td>{row.lastStatus}</td>
                  <td>{row.nextRunAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.hasMore ? (
            <button type="button" onClick={jobs.loadMore}>
              Tải thêm
            </button>
          ) : null}
        </div>

        <aside className="wj-console__detail">
          {jobs.detailRow && jobs.selectedJob ? (
            <>
              <h3>{jobs.detailRow.jobKey}</h3>
              <dl>
                <div>
                  <dt>Category / module</dt>
                  <dd>
                    {jobs.detailRow.category} / {jobs.detailRow.moduleScope}
                  </dd>
                </div>
                <div>
                  <dt>Queue</dt>
                  <dd>{jobs.detailRow.queueName}</dd>
                </div>
                <div>
                  <dt>Description</dt>
                  <dd>{jobs.selectedJob.description_vi}</dd>
                </div>
              </dl>
              <label>
                <span>updated_reason (bắt buộc cho toggle/update)</span>
                <input value={jobs.reason} onChange={(event) => jobs.setReason(event.target.value)} />
              </label>
              <label>
                <span>cron_expr</span>
                <input
                  value={jobs.cronDraft}
                  onChange={(event) => jobs.setCronDraft(event.target.value)}
                />
              </label>
              <div className="wj-console__actions">
                <button
                  type="button"
                  disabled={!jobs.reason.trim() || jobs.actionPending}
                  onClick={jobs.toggle}
                >
                  Toggle enabled
                </button>
                <button
                  type="button"
                  disabled={!jobs.reason.trim() || jobs.actionPending}
                  onClick={jobs.saveCron}
                >
                  Lưu cron
                </button>
                <button type="button" disabled={jobs.actionPending} onClick={jobs.runNow}>
                  Run now
                </button>
              </div>
              {jobs.actionError ? (
                <p className="wj-console__state" role="alert">
                  {jobs.actionError.code}: {jobs.actionError.message}
                </p>
              ) : null}
              <h4>Recent runs</h4>
              {jobs.runsLoading ? <p className="wj-console__state">Đang tải runs...</p> : null}
              {jobs.runsError ? (
                <p className="wj-console__state" role="alert">
                  {jobs.runsError.code}: {jobs.runsError.message}
                </p>
              ) : null}
              <table className="wj-console__table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.runs.map((run) => (
                    <tr key={run.id}>
                      <td>{run.id}</td>
                      <td>{run.status}</td>
                      <td>{run.started_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p>Chọn worker job để thao tác.</p>
          )}
        </aside>
      </div>
    </section>
  )
}
