import { Link } from 'react-router'

import { useTraceability } from '../hooks/useTraceability'
import type { TraceRootRef } from '../types/traceability'

import './TraceabilityPage.css'

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tìm kiếm…'
    case 'empty':
      return 'Nhập QR / lot / serial / WO rồi tìm kiếm.'
    case 'no-result':
      return 'Không có kết quả khớp.'
    case 'permission-denied':
      return 'Bạn không có quyền xem traceability.'
    case 'error':
      return 'Không tải được kết quả tìm kiếm.'
    default:
      return ''
  }
}

function graphStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải 4M+T graph…'
    case 'permission-denied':
      return 'Không có quyền xem graph.'
    case 'not-found':
      return 'Không tìm thấy root.'
    case 'error':
      return 'Không tải được graph.'
    default:
      return ''
  }
}

function exportStateMessage(state: string, jobCode: string | null): string {
  switch (state) {
    case 'async-processing':
      return 'Đang gửi yêu cầu export…'
    case 'queued':
      return jobCode
        ? `Đã xếp hàng TRACEABILITY_FILE: ${jobCode} — tải về tại Import/Export Center.`
        : 'Đã xếp hàng export.'
    case 'permission-denied':
      return 'Không có quyền export (cần MES-07.view.ALL).'
    case 'error':
      return 'Export thất bại.'
    default:
      return ''
  }
}

export function TraceabilityPage() {
  const admin = useTraceability()
  const banner = listStateMessage(admin.listState)
  const graphBanner = graphStateMessage(admin.graphState)
  const exportBanner = exportStateMessage(admin.exportState, admin.exportJobCode)

  return (
    <section className="trace-admin" aria-labelledby="trace-admin-title">
      <header className="trace-admin__header">
        <div>
          <p className="trace-admin__eyebrow">WEB-MES-07-TRACEABILITY · `/web/mes/traceability`</p>
          <h2 id="trace-admin-title">Traceability Search</h2>
          <p className="trace-admin__lead">
            Tìm root theo lot / serial / WO, xem 4M+T graph, forward-impact và export bằng server{' '}
            <code>allowed_actions</code>.
          </p>
        </div>
        <div className="trace-admin__actions">
          <Link to="/web/import-export">Import/Export Center</Link>
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

      <form
        className="trace-admin__filters"
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
      >
        <label className="trace-admin__field">
          <span>QR / lot / serial / WO</span>
          <input
            value={admin.searchInput}
            onChange={(e) => admin.setSearchInput(e.target.value)}
            placeholder="LOT-… / SN-… / WO-…"
          />
        </label>
        <button type="submit" className="trace-admin__btn">
          Tìm
        </button>
      </form>

      {banner ? (
        <p className="trace-admin__state" role={admin.listState === 'error' ? 'alert' : 'status'}>
          {banner}
          {admin.listError ? ` (${admin.listError})` : ''}
        </p>
      ) : null}

      {admin.listState === 'ready' ? (
        <div className="trace-admin__layout">
          <div>
            <div className="trace-admin__table-wrap">
              <table className="trace-admin__table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Code</th>
                    <th>Label</th>
                  </tr>
                </thead>
                <tbody>
                  {admin.hits.map((hit) => {
                    const raw: TraceRootRef = {
                      root_type: hit.rootType,
                      root_code: hit.rootCode,
                      label: hit.label,
                      route: hit.route,
                    }
                    return (
                      <tr
                        key={`${hit.rootType}:${hit.rootCode}`}
                        className={
                          admin.selectedHit?.root_code === hit.rootCode &&
                          admin.selectedHit?.root_type === hit.rootType
                            ? 'trace-admin__row--active'
                            : undefined
                        }
                      >
                        <td>{hit.rootType}</td>
                        <td>
                          <button
                            type="button"
                            className="trace-admin__linkish"
                            onClick={() => admin.selectHit(raw)}
                          >
                            {hit.rootCode}
                          </button>
                        </td>
                        <td>{hit.label}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {admin.hasMore && admin.nextCursor ? (
              <button
                type="button"
                className="trace-admin__more"
                onClick={() => admin.setCursor(admin.nextCursor as string)}
              >
                Trang tiếp
              </button>
            ) : null}
          </div>

          <aside className="trace-admin__detail" aria-label="4M+T graph">
            {!admin.selectedHit ? (
              <p className="trace-admin__muted">Chọn một root để xem graph.</p>
            ) : (
              <>
                {graphBanner ? (
                  <p role={admin.graphState === 'error' ? 'alert' : 'status'}>
                    {graphBanner}
                    {admin.graphError ? ` (${admin.graphError})` : ''}
                  </p>
                ) : null}

                {admin.graphState === 'ready' && admin.graphView ? (
                  <>
                    <h3>
                      {admin.graphView.rootCode}{' '}
                      <span className="trace-admin__muted">({admin.graphView.rootType})</span>
                    </h3>
                    <p className="trace-admin__muted">
                      {admin.graphView.nodeCount} nodes · {admin.graphView.edgeCount} edges
                    </p>

                    <div className="trace-admin__actions">
                      {admin.graphView.canExport ? (
                        <button
                          type="button"
                          onClick={() => admin.requestExport()}
                          disabled={admin.exportState === 'async-processing'}
                        >
                          Export XLSX
                        </button>
                      ) : null}
                      {admin.graphView.canForwardImpact ? (
                        <button type="button" onClick={() => admin.setShowImpact(true)}>
                          Forward impact
                        </button>
                      ) : null}
                      {admin.selectedHit.root_type.toUpperCase() === 'LOT' ||
                      admin.graphView.rootType === 'lot' ||
                      admin.graphView.rootType === 'finished_lot' ? (
                        <button type="button" onClick={() => admin.setShowGenealogy(true)}>
                          Genealogy (MES-06)
                        </button>
                      ) : null}
                    </div>

                    {exportBanner ? (
                      <p className="trace-admin__banner" role="status">
                        {exportBanner}
                        {admin.exportError ? ` (${admin.exportError})` : ''}
                      </p>
                    ) : null}

                    <h4>Nodes</h4>
                    <div className="trace-admin__table-wrap">
                      <table className="trace-admin__table">
                        <thead>
                          <tr>
                            <th>Role</th>
                            <th>Type</th>
                            <th>Code</th>
                            <th>Label</th>
                          </tr>
                        </thead>
                        <tbody>
                          {admin.graphView.nodes.map((n) => (
                            <tr key={n.node_key}>
                              <td>{n.node_role}</td>
                              <td>{n.entity_type}</td>
                              <td>{n.code}</td>
                              <td>{n.label}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <h4>Edges</h4>
                    <ul>
                      {admin.graphView.edges.map((e, idx) => (
                        <li key={`${e.from_node_key}-${e.to_node_key}-${idx}`}>
                          {e.from_node_key} —{e.relation_type}→ {e.to_node_key}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                {admin.showImpact ? (
                  <div className="trace-admin__confirm">
                    <h4>Forward impact</h4>
                    {admin.impactState === 'loading' ? <p>Đang tải…</p> : null}
                    {admin.impactState === 'ready' && admin.impactView ? (
                      <p>
                        {admin.impactView.nodeCount} impact nodes · {admin.impactView.edgeCount}{' '}
                        edges
                      </p>
                    ) : null}
                    {admin.impactState === 'error' || admin.impactState === 'permission-denied' ? (
                      <p className="trace-admin__error" role="alert">
                        Không tải được forward-impact.
                      </p>
                    ) : null}
                    <button type="button" onClick={() => admin.setShowImpact(false)}>
                      Đóng
                    </button>
                  </div>
                ) : null}

                {admin.showGenealogy ? (
                  <div className="trace-admin__confirm">
                    <h4>Genealogy</h4>
                    {admin.genealogyState === 'loading' ? <p>Đang tải…</p> : null}
                    {admin.genealogyState === 'ready' ? (
                      <pre className="trace-admin__pre">
                        {JSON.stringify(admin.genealogy, null, 2)}
                      </pre>
                    ) : null}
                    {admin.genealogyState === 'error' ||
                    admin.genealogyState === 'permission-denied' ? (
                      <p className="trace-admin__error" role="alert">
                        Không tải được genealogy (MES-06.view).
                      </p>
                    ) : null}
                    <button type="button" onClick={() => admin.setShowGenealogy(false)}>
                      Đóng
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </aside>
        </div>
      ) : null}
    </section>
  )
}
