import { Link } from 'react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'

import { useInspectionResult } from '../hooks/useInspectionResult'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { usePagination } from '@/shared/lib/usePagination'
import { TablePagination } from '@/shared/components/ui/TablePagination'
import { Dialog } from '@/shared/components/ui/Dialog'
import { Button } from '@/shared/components/ui/Button'

import './InspectionResultPage.css'

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải…'
    case 'empty':
      return 'Chưa có dữ liệu.'
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

export function InspectionResultPage() {
  const admin = useInspectionResult()
  const banner = listStateMessage(admin.listState)
  const spcBanner = listStateMessage(admin.spcState)

  const resultPagination = usePagination(admin.rows, 10)
  const spcPagination = usePagination(admin.spcItems, 10)

  return (
    <section className="ir-admin">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'QMS' },
          { label: 'Inspection Result Review' },
        ]}
        title="Inspection Result Review"
        subtitle="Review kết quả kiểm tra IQC/IPQC/FQC/OQC/FAI / SPC do Tablet ghi nhận; Web chỉ void có audit reason (không nhập measurement)."
      />

      <div className="ir-admin__tabs" role="tablist" aria-label="Inspection review sections">
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'results'}
          onClick={() => admin.setTab('results')}
        >
          Results
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'spc'}
          onClick={() => admin.setTab('spc')}
        >
          SPC data
        </button>
      </div>

      {admin.tab === 'results' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'search',
                type: 'text',
                label: 'Tìm (code / lot / plan)',
                placeholder: 'Nhập mã phiếu, số lô hoặc checksheet...',
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
            <p
              className="ir-admin__state"
              role={admin.listState === 'error' ? 'alert' : 'status'}
            >
              {banner}
              {admin.listError ? ` (${admin.listError.code})` : ''}
            </p>
          ) : null}

          {admin.listState === 'ready' ? (
            <>
              <div className="ir-admin__table-wrap">
                <table className="ir-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Stage</th>
                      <th>Plan</th>
                      <th>Lot</th>
                      <th>Finished lot</th>
                      <th>WO</th>
                      <th>Status</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultPagination.paginatedItems.map((row) => (
                      <tr
                        key={row.code}
                        className={
                          row.code === admin.selectedCode ? 'ir-admin__row--active' : ''
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="ir-admin__linkish"
                            onClick={() => admin.selectResult(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.stageLabel}</td>
                        <td>{row.planLabel}</td>
                        <td>{row.lotLabel}</td>
                        <td>{row.finishedLotLabel}</td>
                        <td>{row.workOrderLabel}</td>
                        <td>{row.status}</td>
                        <td>{row.overallResult}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <TablePagination
                  {...resultPagination}
                  hasMore={admin.hasMore}
                  onLoadMore={admin.loadMore}
                />
              </div>

              <Dialog
                isOpen={!!admin.selectedCode}
                onClose={() => admin.selectResult('')}
                title={`Chi tiết Inspection Result ${admin.selectedCode || ''}`}
                maxWidth="max-w-[75%]"
              >
                {admin.detailLoading ? (
                  <div className="p-8 text-center text-sm text-[var(--text-secondary)]">Đang tải chi tiết…</div>
                ) : admin.detail && admin.detailRow ? (
                  <div className="flex flex-col gap-6 text-sm font-sans text-[var(--text-primary)]">
                    <div className="pb-4 border-b border-[var(--border-default)]">
                      <p className="text-xs text-[var(--text-muted)]">
                        {admin.detailRow.stageLabel} · {admin.detailRow.status} · {admin.detailRow.overallResult}
                      </p>
                    </div>
                    <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <dt className="text-xs text-[var(--text-secondary)] font-medium">Plan</dt>
                        <dd className="mt-0.5 font-semibold">{admin.detailRow.planLabel}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--text-secondary)] font-medium">Lot</dt>
                        <dd className="mt-0.5 font-semibold">{admin.detailRow.lotLabel}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--text-secondary)] font-medium">Finished lot</dt>
                        <dd className="mt-0.5 font-semibold">{admin.detailRow.finishedLotLabel}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--text-secondary)] font-medium">Work order</dt>
                        <dd className="mt-0.5 font-semibold">{admin.detailRow.workOrderLabel}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--text-secondary)] font-medium">Sample size</dt>
                        <dd className="mt-0.5 font-semibold">{admin.detailRow.sampleSize}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--text-secondary)] font-medium">Inspected at</dt>
                        <dd className="mt-0.5 font-semibold">{admin.detailRow.inspectedAt}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--text-secondary)] font-medium">Retest</dt>
                        <dd className="mt-0.5 font-semibold">{admin.detailRow.isRetest ? 'yes' : 'no'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--text-secondary)] font-medium">Linked NCR</dt>
                        <dd className="mt-0.5 font-semibold">{admin.detailRow.ncrLabel}</dd>
                      </div>
                    </dl>

                    {admin.detail.details && admin.detail.details.length > 0 ? (
                      <div className="flex flex-col gap-2 pt-4 border-t border-[var(--border-default)]">
                        <h4 className="text-sm font-semibold">Details (read-only)</h4>
                        <div className="overflow-auto border border-[var(--border-default)] rounded-lg">
                          <table className="w-full border-collapse text-left text-xs">
                            <thead>
                              <tr className="bg-[var(--surface-2)]">
                                <th className="p-2 border-b border-[var(--border-default)]">Sample</th>
                                <th className="p-2 border-b border-[var(--border-default)]">Char</th>
                                <th className="p-2 border-b border-[var(--border-default)]">Value</th>
                                <th className="p-2 border-b border-[var(--border-default)]">Judgment</th>
                              </tr>
                            </thead>
                            <tbody>
                              {admin.detail.details.map((d) => (
                                <tr key={d.code} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--surface-2)]">
                                  <td className="p-2">{d.sample_no}</td>
                                  <td className="p-2">{d.characteristic_code ?? '-'}</td>
                                  <td className="p-2">{d.measured_value ?? '-'}</td>
                                  <td className="p-2">{d.judgment}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}

                    <div className="pt-4 border-t border-[var(--border-default)] flex flex-col gap-3">
                      <h4 className="text-sm font-semibold">Void (audited)</h4>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={!admin.detailRow.canVoid}
                        title={admin.detailRow.voidDisabledReason ?? undefined}
                        onClick={() => admin.setConfirmVoid(true)}
                      >
                        Void inspection
                      </Button>
                      {!admin.detailRow.canVoid ? (
                        <p className="text-xs text-[var(--text-muted)]">
                          Void không khả dụng
                          {admin.detailRow.voidDisabledReason
                            ? ` (${admin.detailRow.voidDisabledReason})`
                            : ''}
                          .
                        </p>
                      ) : null}

                      {admin.confirmVoid ? (
                        <div className="p-4 border border-[var(--border-default)] bg-[var(--surface-2)] rounded-lg flex flex-col gap-3 mt-2">
                          <p className="text-sm">
                            Xác nhận void <strong>{admin.detail.code}</strong>? Bắt buộc nhập lý do audit.
                          </p>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs text-[var(--text-secondary)] font-medium">Lý do void</span>
                            <textarea
                              className="w-full p-2 border border-[var(--border-default)] rounded bg-[var(--surface-3)] text-sm"
                              value={admin.voidReason}
                              onChange={(e) => admin.setVoidReason(e.target.value)}
                              rows={3}
                            />
                          </label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="danger"
                              disabled={
                                admin.voidErrors.length > 0 || admin.voidState === 'pending'
                              }
                              onClick={admin.void}
                            >
                              Xác nhận void
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => admin.setConfirmVoid(false)}>
                              Hủy
                            </Button>
                          </div>
                        </div>
                      ) : null}
                      {admin.voidError ? (
                        <p className="text-xs text-[var(--color-danger-text)] font-semibold" role="alert">
                          {admin.voidError.code}: {admin.voidError.message}
                        </p>
                      ) : null}
                      {admin.voidState === 'success' ? (
                        <p className="p-3 bg-[var(--color-success-bg)] text-[var(--color-success-text)] rounded text-xs" role="status">
                          Đã void inspection.
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </Dialog>
            </>
          ) : null}
        </>
      ) : (
        <>
          {spcBanner ? (
            <p className="ir-admin__state" role={admin.spcState === 'error' ? 'alert' : 'status'}>
              {spcBanner}
              {admin.spcError ? ` (${admin.spcError.code})` : ''}
            </p>
          ) : null}
          {admin.spcState === 'ready' ? (
            <div className="ir-admin__table-wrap">
              <table className="ir-admin__table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Characteristic</th>
                    <th>Subgroup</th>
                    <th>Value</th>
                    <th>Measured at</th>
                  </tr>
                </thead>
                <tbody>
                  {spcPagination.paginatedItems.map((row) => (
                    <tr key={row.id}>
                      <td>{row.code ?? '-'}</td>
                      <td>{row.characteristic_code ?? '-'}</td>
                      <td>{row.subgroup_no ?? '-'}</td>
                      <td>{row.measured_value ?? '-'}</td>
                      <td>{row.measured_at ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination
                {...spcPagination}
                hasMore={admin.spcHasMore}
                onLoadMore={admin.loadMoreSpc}
              />
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
