import { Link } from 'react-router'

import { useAuthStore } from '@/shared/store/authStore'
import { isSystemAdminSession } from '@/shared/api'

import { useAuditViewer } from '../hooks/useAuditViewer'

import './AuditViewerPage.css'

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải nhật ký audit…'
    case 'empty':
      return 'Chưa có sự kiện audit.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem Audit Viewer (system_admin_only).'
    case 'error':
      return 'Không tải được danh sách audit. Thử lại sau.'
    case 'not-found':
      return 'Không tìm thấy sự kiện.'
    default:
      return ''
  }
}

function exportStateMessage(state: string, jobCode: string | null, message: string | null): string {
  switch (state) {
    case 'async-processing':
      return 'Đang gửi yêu cầu xuất…'
    case 'queued':
      return jobCode
        ? `Đã xếp hàng xuất audit: ${jobCode}`
        : 'Đã xếp hàng xuất audit.'
    case 'blocked-feature':
      return message ?? 'Xuất audit chưa sẵn sàng (NB03-003 deferred trên backend).'
    case 'permission-denied':
      return 'Không có quyền xuất audit.'
    case 'error':
      return message ?? 'Xuất audit thất bại.'
    default:
      return ''
  }
}

export function AuditViewerPage() {
  const session = useAuthStore((s) => s.session)
  const viewer = useAuditViewer()

  if (!isSystemAdminSession(session)) {
    return (
      <section className="audit-viewer" aria-labelledby="audit-title">
        <header className="audit-viewer__header">
          <div>
            <p className="audit-viewer__eyebrow">WEB-NB-03-AUDIT-VIEWER</p>
            <h2 id="audit-title">Audit Viewer</h2>
          </div>
          <Link className="audit-viewer__back" to="/admin">
            Về quản trị
          </Link>
        </header>
        <div className="audit-viewer__state" role="alert">
          Bạn không có quyền xem Audit Viewer (system_admin_only).
        </div>
      </section>
    )
  }

  const exportJobCode =
    viewer.exportResult?.job?.code ?? viewer.exportResult?.job_code ?? null
  const banner = listStateMessage(viewer.listState)
  const exportBanner = exportStateMessage(
    viewer.exportState,
    exportJobCode,
    viewer.exportError?.message ?? null,
  )

  return (
    <section className="audit-viewer" aria-labelledby="audit-title">
      <header className="audit-viewer__header">
        <div>
          <p className="audit-viewer__eyebrow">WEB-NB-03-AUDIT-VIEWER · `/web/admin/audit-logs`</p>
          <h2 id="audit-title">Audit Viewer</h2>
          <p className="audit-viewer__lead">
            Nhật ký append-only <code>activity_events</code> — xem, lọc và xuất bằng chứng kiểm toán.
          </p>
        </div>
        <div className="audit-viewer__actions">
          <Link className="audit-viewer__back" to="/admin">
            Về quản trị
          </Link>
          <button
            type="button"
            className="audit-viewer__btn audit-viewer__btn--secondary"
            onClick={viewer.refresh}
            disabled={viewer.listState === 'loading'}
          >
            Làm mới
          </button>
          <button
            type="button"
            className="audit-viewer__btn"
            onClick={() => viewer.requestExport()}
            disabled={viewer.exportState === 'async-processing'}
          >
            Xuất audit
          </button>
        </div>
      </header>

      <form
        className="audit-viewer__filters"
        onSubmit={(event) => {
          event.preventDefault()
          viewer.applySearch()
        }}
      >
        <label className="audit-viewer__field">
          <span>Tìm kiếm (q)</span>
          <input
            value={viewer.searchInput}
            onChange={(event) => viewer.setSearchInput(event.target.value)}
            placeholder="event_type, entity, code…"
            autoComplete="off"
          />
        </label>
        <button type="submit" className="audit-viewer__btn">
          Lọc
        </button>
      </form>

      {exportBanner ? (
        <p
          className={
            viewer.exportState === 'blocked-feature' || viewer.exportState === 'error'
              ? 'audit-viewer__banner audit-viewer__banner--warn'
              : 'audit-viewer__banner'
          }
          role="status"
        >
          {exportBanner}
        </p>
      ) : null}

      {banner && viewer.listState !== 'ready' ? (
        <div className="audit-viewer__state" role="status">
          {banner}
          {viewer.listError ? (
            <p className="audit-viewer__error-code">{viewer.listError.code}</p>
          ) : null}
        </div>
      ) : null}

      {viewer.listState === 'ready' || viewer.isRefreshing ? (
        <div className="audit-viewer__layout">
          <div className="audit-viewer__table-wrap">
            <table className="audit-viewer__table">
              <thead>
                <tr>
                  <th scope="col">Code</th>
                  <th scope="col">Occurred</th>
                  <th scope="col">Event</th>
                  <th scope="col">Entity</th>
                  <th scope="col">Action</th>
                  <th scope="col">Location</th>
                  <th scope="col">WO</th>
                  <th scope="col">Lot</th>
                </tr>
              </thead>
              <tbody>
                {viewer.rows.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      viewer.selectedId === row.id
                        ? 'audit-viewer__row audit-viewer__row--active'
                        : 'audit-viewer__row'
                    }
                  >
                    <td>
                      <button
                        type="button"
                        className="audit-viewer__linkish"
                        onClick={() => viewer.setSelectedId(row.id)}
                      >
                        {row.code}
                      </button>
                    </td>
                    <td>{row.occurredAt}</td>
                    <td>{row.eventType}</td>
                    <td>{row.entityType}</td>
                    <td>{row.action}</td>
                    <td>{row.locationLabel}</td>
                    <td>{row.workOrderLabel}</td>
                    <td>{row.lotLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {viewer.page?.has_more ? (
              <button type="button" className="audit-viewer__btn audit-viewer__btn--secondary" onClick={viewer.loadMore}>
                Tải thêm
              </button>
            ) : null}
          </div>

          <aside className="audit-viewer__detail" aria-label="Chi tiết sự kiện">
            <h3>Chi tiết</h3>
            {!viewer.selectedId ? (
              <p className="audit-viewer__muted">Chọn một sự kiện để xem chi tiết.</p>
            ) : viewer.detailLoading ? (
              <p className="audit-viewer__muted">Đang tải chi tiết…</p>
            ) : viewer.detailError ? (
              <p role="alert">
                {viewer.detailError.code}: {viewer.detailError.message}
              </p>
            ) : viewer.detailRow ? (
              <dl className="audit-viewer__dl">
                <div>
                  <dt>Code</dt>
                  <dd>{viewer.detailRow.code}</dd>
                </div>
                <div>
                  <dt>Occurred</dt>
                  <dd>{viewer.detailRow.occurredAt}</dd>
                </div>
                <div>
                  <dt>Event type</dt>
                  <dd>{viewer.detailRow.eventType}</dd>
                </div>
                <div>
                  <dt>Entity type</dt>
                  <dd>{viewer.detailRow.entityType}</dd>
                </div>
                <div>
                  <dt>Action</dt>
                  <dd>{viewer.detailRow.action}</dd>
                </div>
                <div>
                  <dt>From → To</dt>
                  <dd>
                    {viewer.detailRow.fromState} → {viewer.detailRow.toState}
                  </dd>
                </div>
                <div>
                  <dt>Actor</dt>
                  <dd>{viewer.detailRow.actorLabel}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{viewer.detailRow.locationLabel}</dd>
                </div>
                <div>
                  <dt>Work order</dt>
                  <dd>{viewer.detailRow.workOrderLabel}</dd>
                </div>
                <div>
                  <dt>Lot</dt>
                  <dd>{viewer.detailRow.lotLabel}</dd>
                </div>
                <div>
                  <dt>IP</dt>
                  <dd>{viewer.detailRow.ipAddress}</dd>
                </div>
                <div>
                  <dt>Payload</dt>
                  <dd>
                    <pre className="audit-viewer__payload">{viewer.detailRow.payloadPreview}</pre>
                  </dd>
                </div>
              </dl>
            ) : null}
          </aside>
        </div>
      ) : null}
    </section>
  )
}
