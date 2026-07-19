import { useState } from 'react'
import { Link } from 'react-router'

import { useImportExportCenter } from '../hooks/useImportExportCenter'

import './ImportExportCenterPage.css'

function batchStateMessage(state: string): string {
  switch (state) {
    case 'idle':
      return 'Chọn template và tải batch theo mã, hoặc tạo batch mới từ source_file_id.'
    case 'loading':
      return 'Đang tải import batch...'
    case 'empty':
      return 'Không có batch đang mở.'
    case 'permission-denied':
      return 'Bạn không có quyền trên owning module của template này.'
    case 'not-found':
      return 'Không tìm thấy import batch.'
    case 'error':
      return 'Không tải được import batch.'
    default:
      return ''
  }
}

export function ImportExportCenterPage() {
  const center = useImportExportCenter()
  const [tab, setTab] = useState<'import' | 'export'>('import')

  const banner = batchStateMessage(center.batchState)

  return (
    <section className="ie-center" aria-labelledby="ie-center-title">
      <header className="ie-center__header">
        <div>
          <p className="ie-center__eyebrow">WEB-NB-07-IMPORT-EXPORT</p>
          <h2 id="ie-center-title">Import / Export Center</h2>
          <p className="ie-center__lead">
            Hub gọi public endpoint của owning MES/WMS/QMS — không gọi internal NB-07.
          </p>
        </div>
        <Link to="/home">Về trang chủ</Link>
      </header>

      <div className="ie-center__tabs" role="tablist" aria-label="Import export sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'import'}
          onClick={() => setTab('import')}
        >
          Import
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'export'}
          onClick={() => setTab('export')}
        >
          Export
        </button>
      </div>

      {tab === 'import' ? (
        <>
          <form
            className="ie-center__filters"
            onSubmit={(event) => {
              event.preventDefault()
              center.loadBatch()
            }}
          >
            <label>
              <span>Template (Ownership Map)</span>
              <select
                value={center.templateCode}
                onChange={(event) => center.setTemplateCode(event.target.value)}
              >
                {center.templates.map((item) => (
                  <option key={item.templateCode} value={item.templateCode}>
                    {item.label} — {item.templateCode}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Batch code</span>
              <input
                value={center.batchCodeInput}
                onChange={(event) => center.setBatchCodeInput(event.target.value)}
                placeholder="IMP-000001"
              />
            </label>
            <div className="ie-center__actions">
              <button type="submit">Tải batch</button>
              <button type="button" onClick={center.refresh} disabled={!center.detailRow}>
                Làm mới
              </button>
              <button
                type="button"
                onClick={center.downloadTemplate}
                disabled={center.downloadPending}
              >
                Tải template
              </button>
            </div>
          </form>

          {center.downloadError ? (
            <p className="ie-center__state" role="alert">
              {center.downloadError.code}: {center.downloadError.message}
            </p>
          ) : null}

          <form
            className="ie-center__filters"
            onSubmit={(event) => {
              event.preventDefault()
              center.createBatch()
            }}
          >
            <label>
              <span>source_file_id (NB-04)</span>
              <input
                value={center.sourceFileId}
                onChange={(event) => center.setSourceFileId(event.target.value)}
                placeholder="123"
              />
            </label>
            <label>
              <span>mode</span>
              <select value={center.mode} onChange={(event) => center.setMode(event.target.value)}>
                {(center.template?.commitModes ?? ['ALL_OR_NOTHING', 'PARTIAL']).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>import_mode</span>
              <select
                value={center.importMode}
                onChange={(event) => center.setImportMode(event.target.value)}
              >
                {(center.template?.importModes ?? ['UPSERT']).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <div className="ie-center__actions">
              <button type="submit" disabled={center.createPending}>
                Tạo import batch
              </button>
            </div>
          </form>

          {center.createError ? (
            <p className="ie-center__state" role="alert">
              {center.createError.code}: {center.createError.message}
            </p>
          ) : null}

          {banner ? (
            <p className="ie-center__state" role="status">
              {banner}
              {center.batchError ? ` (${center.batchError.code})` : ''}
            </p>
          ) : null}

          <div className="ie-center__layout">
            <div className="ie-center__table-wrap">
              <h3>Session batches</h3>
              <table className="ie-center__table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Template</th>
                  </tr>
                </thead>
                <tbody>
                  {center.sessionBatches.map((code) => (
                    <tr key={code}>
                      <td>
                        <button
                          type="button"
                          className="ie-center__link"
                          onClick={() => center.selectSessionBatch(code)}
                        >
                          {code}
                        </button>
                      </td>
                      <td>{center.templateCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {center.sessionBatches.length === 0 ? (
                <p className="ie-center__state">Chưa có batch trong phiên làm việc.</p>
              ) : null}
            </div>

            <aside className="ie-center__detail" aria-label="Chi tiết import batch">
              {center.detailRow ? (
                <>
                  <h3>{center.detailRow.code}</h3>
                  <dl>
                    <div>
                      <dt>Status</dt>
                      <dd>{center.detailRow.status}</dd>
                    </div>
                    <div>
                      <dt>Target</dt>
                      <dd>{center.detailRow.targetEntity}</dd>
                    </div>
                    <div>
                      <dt>Mode / import_mode</dt>
                      <dd>
                        {center.detailRow.mode} / {center.detailRow.importMode}
                      </dd>
                    </div>
                    <div>
                      <dt>Rows</dt>
                      <dd>
                        total {center.detailRow.totalRows} · ok {center.detailRow.successRows} · fail{' '}
                        {center.detailRow.failedRows} · skip {center.detailRow.skippedRows}
                      </dd>
                    </div>
                    <div>
                      <dt>Started</dt>
                      <dd>
                        {center.detailRow.startedAt} (by #{center.detailRow.startedBy})
                      </dd>
                    </div>
                    <div>
                      <dt>Completed</dt>
                      <dd>{center.detailRow.completedAt}</dd>
                    </div>
                  </dl>

                  <div className="ie-center__actions">
                    <button
                      type="button"
                      disabled={!center.detailRow.canValidate || center.mutationState === 'pending'}
                      onClick={center.runValidate}
                    >
                      Validate
                    </button>
                    <button
                      type="button"
                      disabled={!center.detailRow.canCommit}
                      onClick={() => center.setConfirmAction('commit')}
                    >
                      Commit
                    </button>
                    <button
                      type="button"
                      disabled={!center.detailRow.canCancel}
                      onClick={() => center.setConfirmAction('cancel')}
                    >
                      Cancel
                    </button>
                  </div>

                  {center.confirmAction ? (
                    <div className="ie-center__confirm" role="dialog" aria-label="Xác nhận action">
                      <p>
                        Xác nhận {center.confirmAction}? Availability lấy từ server{' '}
                        <code>allowed_actions</code>.
                      </p>
                      <div className="ie-center__actions">
                        <button
                          type="button"
                          disabled={center.mutationState === 'pending'}
                          onClick={center.runConfirmedAction}
                        >
                          Xác nhận
                        </button>
                        <button type="button" onClick={() => center.setConfirmAction(null)}>
                          Đóng
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {center.actionError ? (
                    <p className="ie-center__state" role="alert">
                      {center.actionError.code}: {center.actionError.message}
                    </p>
                  ) : null}

                  <h4>Error rows</h4>
                  {center.errorsLoading ? (
                    <p className="ie-center__state">Đang tải lỗi...</p>
                  ) : null}
                  {center.errorsError ? (
                    <p className="ie-center__state" role="alert">
                      {center.errorsError.code}: {center.errorsError.message}
                    </p>
                  ) : null}
                  <table className="ie-center__table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Column</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {center.errors.map((row) => (
                        <tr key={row.code}>
                          <td>{row.code}</td>
                          <td>{row.column_name ?? '-'}</td>
                          <td>
                            {row.error_code}: {row.error_message_vi}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p>Chưa chọn batch.</p>
              )}
            </aside>
          </div>
        </>
      ) : (
        <div className="ie-center__layout">
          <form
            className="ie-center__filters"
            onSubmit={(event) => {
              event.preventDefault()
              center.createExport()
            }}
          >
            <label>
              <span>Export template</span>
              <select
                value={center.exportTemplateCode}
                onChange={(event) => center.setExportTemplateCode(event.target.value)}
              >
                {center.exportTemplates.map((item) => (
                  <option key={item.templateCode} value={item.templateCode}>
                    {item.label} — {item.templateCode}
                  </option>
                ))}
              </select>
            </label>
            <div className="ie-center__actions">
              <button type="submit" disabled={center.exportPending}>
                Tạo export job
              </button>
            </div>
          </form>
          <aside className="ie-center__detail">
            <p>
              Status/download/retry public facades chưa đủ trên mọi owner — center chỉ enqueue
              create qua owning prefix.
            </p>
            {center.exportError ? (
              <p className="ie-center__state" role="alert">
                {center.exportError.code}: {center.exportError.message}
              </p>
            ) : null}
            {center.exportResult ? (
              <dl>
                <div>
                  <dt>Job code</dt>
                  <dd>{center.exportResult.code}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{center.exportResult.status}</dd>
                </div>
                <div>
                  <dt>Report type</dt>
                  <dd>{center.exportResult.report_type}</dd>
                </div>
              </dl>
            ) : null}
          </aside>
        </div>
      )}
    </section>
  )
}
