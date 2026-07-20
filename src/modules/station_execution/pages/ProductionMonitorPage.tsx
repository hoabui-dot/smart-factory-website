import { Link } from 'react-router'

import { PageHeader } from '@/shared/components/layout/PageHeader'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { useProductionMonitor } from '../hooks/useProductionMonitor'
import type { ProductionLogRow } from '../types/productionLog'
import { usePagination } from '@/shared/lib/usePagination'
import { GenericDataTable, ColumnDef } from '@/shared/components/ui/DataTable'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/Table'
import { Button } from '@/shared/components/ui/Button'

import './ProductionMonitorPage.css'

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải…'
    case 'empty':
      return 'Chưa có production log.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem.'
    case 'error':
      return 'Không tải được dữ liệu. Thử lại sau.'
    default:
      return ''
  }
}

export function ProductionMonitorPage() {
  const mon = useProductionMonitor()
  const pagination = usePagination(mon.rows, 10)

  const columns: ColumnDef<ProductionLogRow>[] = [
    {
      header: 'Mã nhật ký',
      cell: (row) => (
        <button
          type="button"
          className="pl-admin__linkish"
          onClick={(e) => {
            e.stopPropagation()
            mon.selectLog(row.code)
          }}
        >
          {row.code}
        </button>
      ),
    },
    {
      header: 'Lệnh sản xuất',
      cell: (row) => row.workOrderLabel,
    },
    {
      header: 'Công đoạn (Operation)',
      cell: (row) => row.operationLabel,
    },
    {
      header: 'Trạng thái',
      cell: (row) => row.status,
    },
    {
      header: 'Đạt chất lượng',
      cell: (row) => row.goodQty,
    },
    {
      header: 'Phế phẩm (Scrap)',
      cell: (row) => row.scrapQty,
    },
    {
      header: 'Bắt đầu lúc',
      cell: (row) => row.startedAt,
    },
  ]

  const banner = listStateMessage(mon.listState)

  return (
    <section className="pl-admin" aria-labelledby="pl-admin-title">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'MES' },
          { label: 'Production Logs' },
        ]}
        title="Nhật ký sản xuất (Production Logs)"
        subtitle="Giám sát nhật ký hoạt động sản xuất thời gian thực tại các trạm máy, ghi nhận dữ liệu 4M+T và phê duyệt hủy nhật ký lỗi."
      />

      <FilterBar
        fields={[
          {
            name: 'search',
            type: 'text',
            label: 'Tìm (code / WO)',
            placeholder: 'Nhập mã nhật ký hoặc lệnh sản xuất...',
          },
        ]}
        values={{
          search: mon.searchInput,
        }}
        onChange={(name, value) => {
          if (name === 'search') {
            mon.setSearchInput(value)
          }
        }}
        onSubmit={(e) => {
          e.preventDefault()
          mon.applySearch()
        }}
        onReset={() => {
          mon.setSearchInput('')
          mon.applySearch()
        }}
        isResetActive={Boolean(mon.searchInput)}
      />

      {banner ? (
        <p className="pl-admin__state" role={mon.listState === 'error' ? 'alert' : 'status'}>
          {banner}
          {mon.listError ? ` (${mon.listError.code})` : ''}
        </p>
      ) : null}

      {mon.listState === 'ready' ? (
        <div className="pl-admin__layout">
          <div className="pl-admin__table-wrap flex flex-col gap-4">
            <GenericDataTable
              data={pagination.paginatedItems}
              columns={columns}
              pagination={pagination}
              onRowClick={(row) => mon.selectLog(row.code)}
              getRowClassName={(row) =>
                row.code === mon.selectedCode
                  ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]'
                  : ''
              }
            />
            {mon.hasMore ? (
              <Button
                type="button"
                variant="secondary"
                className="self-center"
                onClick={mon.loadMore}
              >
                Tải thêm từ máy chủ
              </Button>
            ) : null}
          </div>

          {mon.detailLoading ? (
            <div className="pl-admin__state">Đang tải chi tiết…</div>
          ) : mon.detail && mon.detailRow ? (
            <aside className="pl-admin__detail" aria-label="Chi tiết production log">
              <h3>{mon.detail.code}</h3>
              <p className="pl-admin__muted">
                {mon.detailRow.workOrderLabel} · {mon.detailRow.operationLabel} ·{' '}
                {mon.detailRow.status}
              </p>
              <dl className="pl-admin__meta">
                <div>
                  <dt>Operator</dt>
                  <dd>{mon.detailRow.operatorLabel}</dd>
                </div>
                <div>
                  <dt>Shift</dt>
                  <dd>{mon.detailRow.shiftLabel}</dd>
                </div>
                <div>
                  <dt>Started / Ended</dt>
                  <dd>
                    {mon.detailRow.startedAt} / {mon.detailRow.endedAt}
                  </dd>
                </div>
                <div>
                  <dt>Recorded at</dt>
                  <dd>{mon.detailRow.recordedAt}</dd>
                </div>
                <div>
                  <dt>Good / Scrap / Rework / Loss</dt>
                  <dd>
                    {mon.detailRow.goodQty} / {mon.detailRow.scrapQty} / {mon.detailRow.reworkQty}{' '}
                    / {mon.detailRow.lossQty}
                  </dd>
                </div>
                <div>
                  <dt>Input qty</dt>
                  <dd>{mon.detailRow.inputQty ?? '-'}</dd>
                </div>
                {mon.detailRow.voidReason ? (
                  <div>
                    <dt>Void reason</dt>
                    <dd>{mon.detailRow.voidReason}</dd>
                  </div>
                ) : null}
              </dl>

              {mon.detail.materials && mon.detail.materials.length > 0 ? (
                <>
                  <h4>Materials</h4>
                  <Table containerClassName="border border-[var(--border-default)] rounded-lg bg-[var(--surface-1)] overflow-hidden">
                    <TableHeader>
                      <TableRow className="pointer-events-none hover:bg-transparent bg-[var(--surface-2)]">
                        <TableHead>Số lô</TableHead>
                        <TableHead>Vật tư</TableHead>
                        <TableHead>Số lượng</TableHead>
                        <TableHead>ĐVT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mon.detail.materials.map((m) => (
                        <TableRow key={m.code} className="hover:bg-[var(--surface-2)]">
                          <TableCell>{m.input_lot_code ?? '-'}</TableCell>
                          <TableCell>{m.input_item_code ?? '-'}</TableCell>
                          <TableCell>{m.consumed_qty}</TableCell>
                          <TableCell>{m.uom_code ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : null}

              {mon.detail.machines && mon.detail.machines.length > 0 ? (
                <>
                  <h4>Machines</h4>
                  <Table containerClassName="border border-[var(--border-default)] rounded-lg bg-[var(--surface-1)] overflow-hidden">
                    <TableHeader>
                      <TableRow className="pointer-events-none hover:bg-transparent bg-[var(--surface-2)]">
                        <TableHead>Thiết bị</TableHead>
                        <TableHead>Vai trò</TableHead>
                        <TableHead>Thời gian chạy (phút)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mon.detail.machines.map((m) => (
                        <TableRow key={m.code} className="hover:bg-[var(--surface-2)]">
                          <TableCell>{m.machine_code ?? '-'}</TableCell>
                          <TableCell>{m.role}</TableCell>
                          <TableCell>{m.run_minutes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : null}

              {mon.detail.defects && mon.detail.defects.length > 0 ? (
                <>
                  <h4>Defects</h4>
                  <Table containerClassName="border border-[var(--border-default)] rounded-lg bg-[var(--surface-1)] overflow-hidden">
                    <TableHeader>
                      <TableRow className="pointer-events-none hover:bg-transparent bg-[var(--surface-2)]">
                        <TableHead>Mã lỗi</TableHead>
                        <TableHead>Phế phẩm</TableHead>
                        <TableHead>Làm lại</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mon.detail.defects.map((d) => (
                        <TableRow key={d.code} className="hover:bg-[var(--surface-2)]">
                          <TableCell>{d.defect_code ?? '-'}</TableCell>
                          <TableCell>{d.scrap_qty}</TableCell>
                          <TableCell>{d.rework_qty}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : null}

              <h4>Void (audited)</h4>
              <button
                type="button"
                className="pl-admin__btn pl-admin__btn--danger"
                disabled={!mon.detailRow.canVoid}
                title={mon.detailRow.voidDisabledReason ?? undefined}
                onClick={() => mon.setConfirmVoid(true)}
              >
                Void production log
              </button>
              {!mon.detailRow.canVoid ? (
                <p className="pl-admin__muted">
                  Void không khả dụng
                  {mon.detailRow.voidDisabledReason
                    ? ` (${mon.detailRow.voidDisabledReason})`
                    : ''}
                  .
                </p>
              ) : null}

              {mon.confirmVoid ? (
                <div className="pl-admin__confirm" role="dialog" aria-label="Xác nhận void">
                  <p>
                    Xác nhận void <strong>{mon.detail.code}</strong>? Hành động không hoàn tác;
                    lý do audit tối thiểu 10 ký tự.
                  </p>
                  <label className="pl-admin__field">
                    <span>void_reason</span>
                    <textarea
                      value={mon.voidReason}
                      onChange={(e) => mon.setVoidReason(e.target.value)}
                      rows={3}
                    />
                  </label>
                  <div className="pl-admin__actions">
                    <button
                      type="button"
                      className="pl-admin__btn pl-admin__btn--danger"
                      disabled={mon.voidErrors.length > 0 || mon.voidState === 'pending'}
                      onClick={mon.void}
                    >
                      Xác nhận void
                    </button>
                    <button type="button" onClick={() => mon.setConfirmVoid(false)}>
                      Hủy
                    </button>
                  </div>
                </div>
              ) : null}
              {mon.voidError ? (
                <p className="pl-admin__error" role="alert">
                  {mon.voidError.code}: {mon.voidError.message}
                </p>
              ) : null}
              {mon.voidState === 'success' ? (
                <p className="pl-admin__banner" role="status">
                  Đã void production log.
                </p>
              ) : null}
            </aside>
          ) : (
            <div className="pl-admin__state">Chọn một production log để xem chi tiết.</div>
          )}
        </div>
      ) : null}
    </section>
  )
}
