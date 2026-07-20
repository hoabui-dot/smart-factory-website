import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router'

import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { useProductionDashboard } from '../hooks/useProductionDashboard'
import { formatKpiValue } from '../lib/dashboardProjection'
import type { DowntimeRowView } from '../types/dashboard'
import { usePagination } from '@/shared/lib/usePagination'
import { GenericDataTable, ColumnDef } from '@/shared/components/ui/DataTable'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/Table'

import { Input, Select } from '@/shared/components/ui/Input'
import { Dialog } from '@/shared/components/ui/Dialog'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { FileSpreadsheet, Download, AlertCircle } from 'lucide-react'
import { useImportExportCenter } from '@/modules/excel_import_export/hooks/useImportExportCenter'

import './ProductionDashboardPage.css'

const KPI_OPTIONS = [
  'YIELD_RATE',
  'SCRAP_RATE',
  'REWORK_RATE',
  'LOSS_RATE',
  'OEE',
  'INVENTORY_ACCURACY',
  'FEFO_COMPLIANCE',
  'NCR_INSPECTION_RATE',
  'NCR_PRODUCTION_RATE',
]

function stateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải…'
    case 'empty':
      return 'Chưa có downtime log.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem.'
    case 'error':
      return 'Không tải được dữ liệu.'
    default:
      return ''
  }
}

function exportMessage(state: string, jobCode: string | null): string {
  switch (state) {
    case 'async-processing':
      return 'Đang gửi yêu cầu export…'
    case 'queued':
      return jobCode
        ? `Đã xếp hàng PRODUCTION_REPORT_EXPORT: ${jobCode} — tải về tại Import/Export Center.`
        : 'Đã xếp hàng export.'
    case 'permission-denied':
      return 'Không có quyền export.'
    case 'error':
      return 'Export thất bại.'
    default:
      return ''
  }
}

export function ProductionDashboardPage() {
  const d = useProductionDashboard()
  const pagination = usePagination(d.rows, 10)

  const [isExcelOpen, setIsExcelOpen] = useState(false)
  const ie = useImportExportCenter()

  const downtimeColumns: ColumnDef<DowntimeRowView>[] = [
    {
      header: 'Mã downtime',
      cell: (row) => (
        <button
          type="button"
          className="mes08-admin__linkish"
          onClick={(e) => {
            e.stopPropagation()
            d.selectDowntime(row.code)
          }}
        >
          {row.code}
        </button>
      ),
    },
    {
      header: 'Thiết bị',
      cell: (row) => row.machineLabel,
    },
    {
      header: 'Lệnh sản xuất',
      cell: (row) => row.workOrderLabel,
    },
    {
      header: 'Trạng thái',
      cell: (row) => row.status,
    },
    {
      header: 'Bắt đầu lúc',
      cell: (row) => row.startedAt,
    },
  ]

  const dashBanner = stateMessage(d.dashState === 'ready' ? '' : d.dashState)
  const listBanner = stateMessage(d.listState)
  const exportBanner = exportMessage(d.exportState, d.exportJobCode)

  return (
    <section className="mes08-admin" aria-labelledby="mes08-title">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'MES' },
          { label: 'Dashboards' },
        ]}
        title="Bảng điều hành sản xuất (Production Dashboard)"
        subtitle="Theo dõi chỉ số hiệu suất OEE, tỷ lệ lỗi hỏng, năng suất ca trạm và thống kê downtime thời gian thực."
        actions={
          <Button variant="secondary" onClick={() => setIsExcelOpen(true)}>Nhập/Xuất Dữ liệu (Excel)</Button>
        }
      />

      <div className="mes08-admin__tabs" role="tablist" aria-label="Dashboard sections">
        <button
          type="button"
          role="tab"
          aria-selected={d.tab === 'kpis'}
          onClick={() => d.setTab('kpis')}
        >
          KPIs &amp; Report
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={d.tab === 'downtime'}
          onClick={() => d.setTab('downtime')}
        >
          Downtime
        </button>
      </div>

      {d.tab === 'kpis' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'from',
                type: 'text',
                label: 'from (ISO)',
                placeholder: 'YYYY-MM-DD...',
              },
              {
                name: 'to',
                type: 'text',
                label: 'to (ISO)',
                placeholder: 'YYYY-MM-DD...',
              },
            ]}
            values={{
              from: d.from,
              to: d.to,
            }}
            onChange={(name, value) => {
              if (name === 'from') {
                d.setFrom(value)
              } else if (name === 'to') {
                d.setTo(value)
              }
            }}
            onSubmit={(e) => {
              e.preventDefault()
              d.applyFilter()
            }}
            onReset={() => {
              d.setFrom('')
              d.setTo('')
              d.applyFilter()
            }}
            isResetActive={Boolean(d.from || d.to)}
            expands={
              <Button
                type="button"
                className="mes08-admin__btn shrink-0"
                disabled={!d.dashView?.canExport}
                onClick={d.export}
              >
                Export report
              </Button>
            }
          />

          {dashBanner ? (
            <p className="mes08-admin__state" role="status">
              {dashBanner}
              {d.dashError ? ` (${d.dashError.code})` : ''}
            </p>
          ) : null}
          {exportBanner ? (
            <p className="mes08-admin__banner" role="status">
              {exportBanner}
            </p>
          ) : null}
          {d.exportError ? (
            <p className="mes08-admin__error" role="alert">
              {d.exportError.code}: {d.exportError.message}
            </p>
          ) : null}

          {d.dashState === 'ready' && d.dashView ? (
            <>
              <div className="mes08-admin__kpi-grid">
                {d.dashView.kpis.map((kpi) => (
                  <article key={kpi.kpi_code} className="mes08-admin__kpi-card">
                    <h3>{kpi.kpi_code}</h3>
                    <p>{formatKpiValue(kpi.value, kpi.unit)}</p>
                  </article>
                ))}
              </div>
              <dl className="mes08-admin__meta">
                <div>
                  <dt>Good / Processed / FG</dt>
                  <dd>
                    {d.dashView.goodOutput} / {d.dashView.totalProcessed} /{' '}
                    {d.dashView.finishedGoods}
                  </dd>
                </div>
                <div>
                  <dt>Open downtimes</dt>
                  <dd>{d.dashView.openDowntimes}</dd>
                </div>
              </dl>

              <div className="mes08-admin__layout">
                <div className="mes08-admin__table-wrap">
                  <h3>Work orders</h3>
                  <Table containerClassName="border border-[var(--border-default)] rounded-lg bg-[var(--surface-1)] overflow-hidden">
                    <TableHeader>
                      <TableRow className="pointer-events-none hover:bg-transparent bg-[var(--surface-2)]">
                        <TableHead>Lệnh sản xuất</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Kế hoạch</TableHead>
                        <TableHead>Đạt chất lượng</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.dashView.workOrders.map((wo) => (
                        <TableRow key={wo.work_order_code} className="hover:bg-[var(--surface-2)]">
                          <TableCell>{wo.work_order_code}</TableCell>
                          <TableCell>{wo.status}</TableCell>
                          <TableCell>{wo.planned_qty}</TableCell>
                          <TableCell>{wo.good_qty}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mes08-admin__table-wrap">
                  <h3>Machines</h3>
                  <Table containerClassName="border border-[var(--border-default)] rounded-lg bg-[var(--surface-1)] overflow-hidden">
                    <TableHeader>
                      <TableRow className="pointer-events-none hover:bg-transparent bg-[var(--surface-2)]">
                        <TableHead>Thiết bị</TableHead>
                        <TableHead>Downtime hiện tại</TableHead>
                        <TableHead>Sản phẩm đạt cuối</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.dashView.machines.map((m) => (
                        <TableRow key={m.machine_code} className="hover:bg-[var(--surface-2)]">
                          <TableCell>{m.machine_code}</TableCell>
                          <TableCell>{m.open_downtime ? 'yes' : 'no'}</TableCell>
                          <TableCell>{m.last_good_qty}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <label className="mes08-admin__field">
                <span>KPI series</span>
                <select value={d.kpiCode} onChange={(e) => d.setKpiCode(e.target.value)}>
                  {KPI_OPTIONS.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </label>
              {d.kpiLoading ? (
                <p className="mes08-admin__state">Đang tải series…</p>
              ) : (
                <div className="mes08-admin__table-wrap">
                  <Table containerClassName="border border-[var(--border-default)] rounded-lg bg-[var(--surface-1)] overflow-hidden">
                    <TableHeader>
                      <TableRow className="pointer-events-none hover:bg-transparent bg-[var(--surface-2)]">
                        <TableHead>Chiều phân tích</TableHead>
                        <TableHead>Nhãn phân tích</TableHead>
                        <TableHead>Giá trị</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.kpiSeries.map((pt) => (
                        <TableRow key={pt.dimension_key} className="hover:bg-[var(--surface-2)]">
                          <TableCell>{pt.dimension_key}</TableCell>
                          <TableCell>{pt.dimension_label}</TableCell>
                          <TableCell>{pt.value ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          ) : null}
        </>
      ) : (
        <>
          <FilterBar
            fields={[
              {
                name: 'search',
                type: 'text',
                label: 'Tìm downtime',
                placeholder: 'Nhập thông tin downtime...',
              },
            ]}
            values={{
              search: d.searchInput,
            }}
            onChange={(name, value) => {
              if (name === 'search') {
                d.setSearchInput(value)
              }
            }}
            onSubmit={(e) => {
              e.preventDefault()
              d.applySearch()
            }}
            onReset={() => {
              d.setSearchInput('')
              d.applySearch()
            }}
            isResetActive={Boolean(d.searchInput)}
          />

          {listBanner ? (
            <p className="mes08-admin__state" role="status">
              {listBanner}
              {d.listError ? ` (${d.listError.code})` : ''}
            </p>
          ) : null}

          {d.listState === 'ready' ? (
            <div className="mes08-admin__layout">
              <div className="mes08-admin__table-wrap flex flex-col gap-4">
                <GenericDataTable
                  data={pagination.paginatedItems}
                  columns={downtimeColumns}
                  pagination={pagination}
                  onRowClick={(row) => d.selectDowntime(row.code)}
                  getRowClassName={(row) =>
                    row.code === d.selectedCode
                      ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]'
                      : ''
                  }
                />
                {d.hasMore ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="self-center"
                    onClick={d.loadMore}
                  >
                    Tải thêm từ máy chủ
                  </Button>
                ) : null}
              </div>

              {d.detailLoading ? (
                <div className="mes08-admin__state">Đang tải chi tiết…</div>
              ) : d.detail && d.detailRow ? (
                <aside className="mes08-admin__detail" aria-label="Chi tiết downtime">
                  <h3>{d.detail.code}</h3>
                  <p className="mes08-admin__muted">
                    {d.detailRow.machineLabel} · {d.detailRow.status}
                  </p>
                  <dl className="mes08-admin__meta">
                    <div>
                      <dt>WO / Shift</dt>
                      <dd>
                        {d.detailRow.workOrderLabel} / {d.detailRow.shiftLabel}
                      </dd>
                    </div>
                    <div>
                      <dt>Started / Ended</dt>
                      <dd>
                        {d.detailRow.startedAt} / {d.detailRow.endedAt}
                      </dd>
                    </div>
                    <div>
                      <dt>Duration (min)</dt>
                      <dd>{d.detailRow.durationMin}</dd>
                    </div>
                  </dl>

                  <h4>Update metadata (MES08-006)</h4>
                  {!d.detailRow.canUpdate ? (
                    <p className="mes08-admin__muted">
                      Update không khả dụng
                      {d.detailRow.updateDisabledReason
                        ? ` (${d.detailRow.updateDisabledReason})`
                        : ''}
                      .
                    </p>
                  ) : (
                    <form
                      className="mes08-admin__edit"
                      onSubmit={(e) => {
                        e.preventDefault()
                        d.saveUpdate()
                      }}
                    >
                      <label className="mes08-admin__field">
                        <span>reason_code</span>
                        <input
                          value={d.editForm.reason_code ?? d.detail.reason_code ?? ''}
                          onChange={(e) =>
                            d.setEditForm({ ...d.editForm, reason_code: e.target.value })
                          }
                        />
                      </label>
                      <label className="mes08-admin__field">
                        <span>category</span>
                        <input
                          value={d.editForm.category ?? d.detail.category ?? ''}
                          onChange={(e) =>
                            d.setEditForm({ ...d.editForm, category: e.target.value })
                          }
                        />
                      </label>
                      <label className="mes08-admin__field">
                        <span>description</span>
                        <textarea
                          rows={3}
                          value={d.editForm.description ?? d.detail.description ?? ''}
                          onChange={(e) =>
                            d.setEditForm({ ...d.editForm, description: e.target.value })
                          }
                        />
                      </label>
                      <label className="mes08-admin__field">
                        <span>maintenance_note</span>
                        <textarea
                          rows={2}
                          value={
                            d.editForm.maintenance_note ?? d.detail.maintenance_note ?? ''
                          }
                          onChange={(e) =>
                            d.setEditForm({
                              ...d.editForm,
                              maintenance_note: e.target.value,
                            })
                          }
                        />
                      </label>
                      <button
                        type="submit"
                        className="mes08-admin__btn"
                        disabled={d.updatePending}
                      >
                        Lưu phân loại
                      </button>
                    </form>
                  )}
                  {d.updateError ? (
                    <p className="mes08-admin__error" role="alert">
                      {d.updateError.code}: {d.updateError.message}
                    </p>
                  ) : null}
                  {d.updateSuccess ? (
                    <p className="mes08-admin__banner" role="status">
                      Đã cập nhật downtime.
                    </p>
                  ) : null}
                </aside>
              ) : (
                <div className="mes08-admin__state">Chọn một downtime log để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      )}
      {/* Excel Import/Export Dialog Modal */}
      <Dialog
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        title="Nhập / Xuất dữ liệu Excel"
        maxWidth="max-w-[75%]"
      >
        <div className="flex flex-col gap-6 font-sans text-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Import segment */}
            <div className="flex flex-col gap-4 bg-[var(--surface-1)] p-5 rounded-xl border border-[var(--border-default)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-[var(--color-action-primary)]" />
                Khởi tạo Batch Nhập dữ liệu mới
              </h3>
              <form
                className="flex flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!window.confirm('Xác nhận tạo lô nạp dữ liệu (Import Batch) mới từ file nguồn?')) return
                  ie.createBatch()
                }}
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Mẫu nhập (Import Template)</span>
                  <Select
                    value={ie.templateCode}
                    onChange={(event) => ie.setTemplateCode(event.target.value)}
                  >
                    {ie.templates.map((item) => (
                      <option key={item.templateCode} value={item.templateCode}>
                        {item.label} ({item.templateCode})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">ID File nguồn</span>
                  <Input
                    value={ie.sourceFileId}
                    onChange={(event) => ie.setSourceFileId(event.target.value)}
                    placeholder="Nhập ID file dữ liệu nguồn..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Chế độ ghi nhận (Commit Mode)</span>
                    <Select
                      value={ie.mode}
                      onChange={(event) => ie.setMode(event.target.value)}
                    >
                      <option value="ALL_OR_NOTHING">Lưu tất cả hoặc hủy (ALL_OR_NOTHING)</option>
                      <option value="PARTIAL">Lưu một phần (PARTIAL)</option>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Chế độ nhập (Import Mode)</span>
                    <Select
                      value={ie.importMode}
                      onChange={(event) => ie.setImportMode(event.target.value)}
                    >
                      <option value="UPSERT">Cập nhật hoặc thêm mới (UPSERT)</option>
                      <option value="CREATE_ONLY">Chỉ thêm mới (CREATE_ONLY)</option>
                      <option value="UPDATE_ONLY">Chỉ cập nhật (UPDATE_ONLY)</option>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-between items-center gap-2 mt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={ie.downloadTemplate}
                    disabled={ie.downloadPending}
                  >
                    <Download size={14} className="mr-1.5" />
                    Tải template
                  </Button>
                  <Button type="submit" disabled={ie.createPending}>
                    Tạo import batch
                  </Button>
                </div>
              </form>
              {ie.createError && (
                <div className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] text-xs flex items-center gap-2" role="alert">
                  <AlertCircle size={14} />
                  <span>{ie.createError.code}: {ie.createError.message}</span>
                </div>
              )}
            </div>

            {/* Active Batch details if available */}
            <div className="flex flex-col gap-4 bg-[var(--surface-1)] p-5 rounded-xl border border-[var(--border-default)]">
              {ie.detailRow ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">Lô đang hoạt động: {ie.detailRow.code}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ie.detailRow.status === 'COMMITTED' ? 'bg-green-100 text-green-800' : ie.detailRow.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      {ie.detailRow.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Tổng số bản ghi</span>
                      <p className="font-semibold text-sm text-[var(--text-primary)] mt-0.5">{ie.detailRow.totalRows}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Số dòng lỗi</span>
                      <p className="font-semibold text-sm text-[var(--color-danger-text)] mt-0.5">{ie.detailRow.failedRows}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Nạp thành công</span>
                      <p className="font-semibold text-sm text-[var(--color-success-text)] mt-0.5">{ie.detailRow.successRows}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Người khởi tạo</span>
                      <p className="font-semibold text-sm mt-0.5 text-[var(--text-primary)]">{ie.detailRow.startedBy}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    {ie.detailRow.canValidate && (
                      <Button
                        type="button"
                        onClick={() => {
                          if (!window.confirm('Xác nhận kiểm tra tính hợp lệ của lô nạp dữ liệu này?')) return
                          ie.runValidate()
                        }}
                      >
                        Kiểm tra (Validate)
                      </Button>
                    )}
                    {ie.detailRow.canCommit && (
                      <Button
                        type="button"
                        onClick={() => {
                          ie.setConfirmAction('commit')
                        }}
                      >
                        Ghi nhận vào DB (Commit)
                      </Button>
                    )}
                    {ie.detailRow.canCancel && (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => {
                          ie.setConfirmAction('cancel')
                        }}
                      >
                        Hủy bỏ lô (Cancel)
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] py-12">
                  <AlertCircle size={24} className="opacity-40 mb-2" />
                  <p className="text-xs">Chưa có lô nạp dữ liệu nào được khởi tạo hoặc chọn.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Action Dialog inside Modal */}
        <ConfirmDialog
          isOpen={ie.confirmAction !== null}
          onClose={() => ie.setConfirmAction(null)}
          onConfirm={ie.runConfirmedAction}
          title={ie.confirmAction === 'commit' ? 'Xác nhận Commit' : 'Xác nhận Hủy'}
          description={
            ie.confirmAction === 'commit'
              ? 'Xác nhận ghi nhận tất cả dữ liệu hợp lệ trong lô nạp này vào cơ sở dữ liệu hệ thống?'
              : 'Xác nhận hủy bỏ hoàn toàn lô nạp dữ liệu này?'
          }
          isPending={ie.mutationState === 'pending'}
        />
      </Dialog>
    </section>
  )
}

/** Director landing `/dashboard` → canonical MES-08 route. */
export function DirectorDashboardRedirect() {
  return <Navigate to="/web/mes/dashboards" replace />
}
