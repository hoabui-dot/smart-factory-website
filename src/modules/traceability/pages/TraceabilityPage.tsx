import { Link } from 'react-router'

import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { useTraceability } from '../hooks/useTraceability'
import type { TraceRootRef, TraceSearchHitView } from '../types/traceability'
import { usePagination } from '@/shared/lib/usePagination'
import { GenericDataTable, ColumnDef } from '@/shared/components/ui/DataTable'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/Table'

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
  const pagination = usePagination(admin.hits, 10)

  const columns: ColumnDef<TraceSearchHitView>[] = [
    {
      header: 'Loại đối tượng',
      cell: (row) => row.rootType,
    },
    {
      header: 'Mã đối tượng',
      cell: (row) => (
        <button
          type="button"
          className="trace-admin__linkish"
          onClick={(e) => {
            e.stopPropagation()
            admin.selectHit({
              root_type: row.rootType,
              root_code: row.rootCode,
              label: row.label,
              route: row.route,
            })
          }}
        >
          {row.rootCode}
        </button>
      ),
    },
    {
      header: 'Nhãn hiển thị',
      cell: (row) => row.label,
    },
  ]

  const banner = listStateMessage(admin.listState)
  const graphBanner = graphStateMessage(admin.graphState)
  const exportBanner = exportStateMessage(admin.exportState, admin.exportJobCode)

  return (
    <section className="trace-admin" aria-labelledby="trace-admin-title">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'MES' },
          { label: 'Traceability' },
        ]}
        title="Truy xuất nguồn gốc (Traceability)"
        subtitle="Tìm kiếm cây gia phả sản phẩm (Genealogy), truy xuất theo số lô/serial/lệnh sản xuất và phân tích ảnh hưởng 4M+T."
        actions={
          <Link to="/web/import-export">
            <Button variant="secondary">Nhập/Xuất Dữ liệu (Excel)</Button>
          </Link>
        }
      />

      <FilterBar
        fields={[
          {
            name: 'search',
            type: 'text',
            label: 'QR / lot / serial / WO',
            placeholder: 'LOT-… / SN-… / WO-…',
          },
        ]}
        values={{
          search: admin.searchInput,
        }}
        onChange={(name, value) => {
          if (name === 'search') {
            admin.setSearchInput(value)
          }
        }}
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
        onReset={() => {
          admin.setSearchInput('')
          admin.applySearch()
        }}
        isResetActive={Boolean(admin.searchInput)}
      />

      {banner ? (
        <p className="trace-admin__state" role={admin.listState === 'error' ? 'alert' : 'status'}>
          {banner}
          {admin.listError ? ` (${admin.listError})` : ''}
        </p>
      ) : null}

      {admin.listState === 'ready' ? (
        <div className="trace-admin__layout">
          <div>
            <div className="trace-admin__table-wrap flex flex-col gap-4">
              <GenericDataTable
                data={pagination.paginatedItems}
                columns={columns}
                pagination={pagination}
                onRowClick={(row) =>
                  admin.selectHit({
                    root_type: row.rootType,
                    root_code: row.rootCode,
                    label: row.label,
                    route: row.route,
                  })
                }
                getRowClassName={(row) =>
                  admin.selectedHit?.root_code === row.rootCode &&
                  admin.selectedHit?.root_type === row.rootType
                    ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]'
                    : ''
                }
              />
              {admin.hasMore && admin.nextCursor ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="self-center"
                  onClick={() => admin.setCursor(admin.nextCursor as string)}
                >
                  Trang tiếp từ máy chủ
                </Button>
              ) : null}
            </div>
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
                    <Table containerClassName="border border-[var(--border-default)] rounded-lg bg-[var(--surface-1)] overflow-hidden">
                      <TableHeader>
                        <TableRow className="pointer-events-none hover:bg-transparent bg-[var(--surface-2)]">
                          <TableHead>Vai trò quan hệ</TableHead>
                          <TableHead>Loại liên kết</TableHead>
                          <TableHead>Mã liên kết</TableHead>
                          <TableHead>Nhãn hiển thị</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {admin.graphView.nodes.map((n) => (
                          <TableRow key={n.node_key} className="hover:bg-[var(--surface-2)]">
                            <TableCell>{n.node_role}</TableCell>
                            <TableCell>{n.entity_type}</TableCell>
                            <TableCell>{n.code}</TableCell>
                            <TableCell>{n.label}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

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
