import { useMemo, useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'

import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { Dialog } from '@/shared/components/ui/Dialog'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { Input, Select } from '@/shared/components/ui/Input'
import { FileSpreadsheet, Download, AlertCircle } from 'lucide-react'
import { useImportExportCenter } from '@/modules/excel_import_export/hooks/useImportExportCenter'

import { ApiError } from '@/shared/api'

import {
  cancelStocktake,
  createStocktake,
  exportStocktakes,
  getStocktake,
  listStocktakes,
  requestStocktakeAdjustment,
  retryStocktakeAdjustment,
  startStocktake,
} from '../api/inventoryApi'
import {
  buildVarianceReviews,
  projectStocktakeRow,
  resolveListState,
  validateStocktakeCreate,
} from '../lib/inventoryProjection'
import type { AllowedAction, CreateStocktakeRequest } from '../types/inventory'

import './inventory.css'

type PendingAction = 'start' | 'request_adjustment' | 'retry_adjustment' | 'cancel' | null

function stateMessage(state: string): string {
  return { loading: 'Đang tải stocktakes…', empty: 'Chưa có stocktake.', 'no-result': 'Không có stocktake phù hợp.', 'permission-denied': 'Bạn không có quyền xem stocktake.', error: 'Không thể tải stocktake.' }[state] ?? ''
}

export function StocktakePage() {
  const queryClient = useQueryClient()
  const [isExcelOpen, setIsExcelOpen] = useState(false)
  const ie = useImportExportCenter()

  useEffect(() => {
    if (isExcelOpen) {
      ie.setTemplateCode('STOCKTAKE_IMPORT_EXPORT')
    }
  }, [isExcelOpen])
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [scopeType, setScopeType] = useState('FULL')
  const [scopeFilterText, setScopeFilterText] = useState('')
  const [cutoffAt, setCutoffAt] = useState('')
  const [note, setNote] = useState('')
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [reason, setReason] = useState('')
  const [actionNote, setActionNote] = useState('')

  const listQuery = useQuery({
    queryKey: ['wms05', 'stocktakes', query, status],
    queryFn: () => listStocktakes({ q: query || undefined, status: status || undefined, limit: 50 }),
  })
  const detailQuery = useQuery({
    queryKey: ['wms05', 'stocktake', selectedCode],
    queryFn: () => getStocktake(selectedCode as string),
    enabled: Boolean(selectedCode),
  })
  const refresh = async () => { await queryClient.invalidateQueries({ queryKey: ['wms05', 'stocktake'] }); await queryClient.invalidateQueries({ queryKey: ['wms05', 'stocktakes'] }) }
  const createMutation = useMutation({
    mutationFn: () => {
      let scopeFilter: Record<string, unknown> | null = null
      if (scopeFilterText.trim()) scopeFilter = JSON.parse(scopeFilterText) as Record<string, unknown>
      const body: CreateStocktakeRequest = { scope_type: scopeType, scope_filter: scopeFilter, cutoff_at: new Date(cutoffAt).toISOString(), note: note.trim() || null }
      return createStocktake(body)
    },
    onSuccess: async (created) => { setCreateOpen(false); setSelectedCode(created.code); await refresh() },
  })
  const actionMutation = useMutation({
    mutationFn: async () => {
      const row = detailQuery.data ? projectStocktakeRow(detailQuery.data) : null
      if (!row || !pendingAction) throw new ApiError('VALIDATION_ERROR', 'Chưa chọn action.', 400)
      const actions: Record<Exclude<PendingAction, null>, AllowedAction | null> = {
        start: row.startAction, request_adjustment: row.requestAdjustmentAction,
        retry_adjustment: row.retryAdjustmentAction, cancel: row.cancelAction,
      }
      const action = actions[pendingAction]
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Action không được server cấp.', 403)
      if (pendingAction === 'start') return startStocktake(action)
      if (pendingAction === 'retry_adjustment') return retryStocktakeAdjustment(action)
      if (pendingAction === 'cancel') return cancelStocktake(action, reason.trim())
      const reviews = buildVarianceReviews(detailQuery.data?.counts ?? [], reason, actionNote)
      return requestStocktakeAdjustment(action, reviews)
    },
    onSuccess: async () => { setPendingAction(null); setReason(''); setActionNote(''); await refresh() },
  })
  const exportMutation = useMutation({ mutationFn: () => exportStocktakes({ q: query, status }) })

  const rows = useMemo(() => (listQuery.data?.items ?? []).map(projectStocktakeRow), [listQuery.data?.items])
  const detailRow = detailQuery.data ? projectStocktakeRow(detailQuery.data) : null
  const listError = listQuery.error instanceof ApiError ? listQuery.error : null
  const listState = resolveListState(listQuery.isLoading || listQuery.isFetching ? 'loading' : listQuery.isError ? 'error' : 'success', rows.length, Boolean(query || status), listError?.code ?? null)
  const createErrors = validateStocktakeCreate({ scope_type: scopeType, scope_filter_text: scopeFilterText, cutoff_at: cutoffAt })
  let invalidFilter = false
  if (scopeFilterText.trim()) { try { JSON.parse(scopeFilterText) } catch { invalidFilter = true } }
  const actionNeedsReason = pendingAction === 'cancel' || pendingAction === 'request_adjustment'
  const adjustmentReviews = detailQuery.data ? buildVarianceReviews(detailQuery.data.counts ?? [], reason, actionNote) : []
  const actionDisabled = actionMutation.isPending || (actionNeedsReason && !reason.trim()) || (pendingAction === 'request_adjustment' && adjustmentReviews.length === 0)
  const mutationError = (createMutation.error instanceof ApiError ? createMutation.error : actionMutation.error instanceof ApiError ? actionMutation.error : null)

  return (
    <section className="inventory" aria-labelledby="stocktake-title">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'WMS' },
          { label: 'Stocktake & Reconciliation' },
        ]}
        title="Kiểm kê & Đối chiếu (Stocktake & Reconciliation)"
        subtitle="Lập kỳ kiểm kê kho hàng định kỳ, đối soát số liệu thực tế so với sổ sách và phê duyệt điều chỉnh số dư."
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setCreateOpen(true)}>Tạo stocktake</Button>
            <Link to="/web/wms/inventory">
              <Button variant="secondary">Danh mục tồn kho</Button>
            </Link>
          </div>
        }
      />
      <p className="inventory__handoff">Count capture và submit-counts là luồng PDA-only. Web chỉ quản trị kỳ, review variance và action từ <code>allowed_actions</code> của server.</p>
      
      <FilterBar
        fields={[
          {
            name: 'searchInput',
            type: 'text',
            label: 'Mã kiểm kê',
            placeholder: 'Tìm theo mã kiểm kê...',
          },
          {
            name: 'status',
            type: 'select',
            label: 'Trạng thái',
            options: [
              { value: '', label: 'Tất cả trạng thái' },
              { value: 'DRAFT', label: 'Nháp (DRAFT)' },
              { value: 'OPEN', label: 'Đang mở (OPEN)' },
              { value: 'COUNTING', label: 'Đang đếm (COUNTING)' },
              { value: 'RECONCILED', label: 'Đã đối chiếu (RECONCILED)' },
              { value: 'ADJUSTMENT_FAILED', label: 'Lỗi điều chỉnh (ADJUSTMENT_FAILED)' },
              { value: 'CANCELLED', label: 'Đã hủy (CANCELLED)' },
              { value: 'CLOSED', label: 'Đã đóng (CLOSED)' },
            ],
          },
        ]}
        values={{
          searchInput,
          status,
        }}
        onChange={(name, val) => {
          if (name === 'searchInput') setSearchInput(val)
          if (name === 'status') setStatus(val)
        }}
        onSubmit={(e) => {
          e.preventDefault()
          setQuery(searchInput.trim())
        }}
        onReset={() => {
          setSearchInput('')
          setStatus('')
          setQuery('')
        }}
        isResetActive={Boolean(searchInput || status || query)}
      >
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="h-9 gap-1.5"
          >
            Xuất stocktake
          </Button>
          <Button type="button" variant="secondary" size="sm" className="h-9" onClick={() => setIsExcelOpen(true)}>
            Import counts
          </Button>
        </div>
      </FilterBar>

      {exportMutation.isSuccess ? <p className="inventory__success" role="status">Đã tạo stocktake export job.</p> : null}
      
      {listState === 'empty' || listState === 'no-result' ? (
        <div className="p-12 flex flex-col items-center justify-center gap-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl text-center mt-4">
          <svg className="w-10 h-10 text-[var(--text-muted)] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
            {listState === 'empty' ? 'Chưa có kỳ kiểm kê nào' : 'Không tìm thấy kỳ kiểm kê'}
          </h4>
          <p className="text-xs text-[var(--text-secondary)]">
            {listState === 'empty' 
              ? 'Nhấp vào "Tạo stocktake" để bắt đầu thiết lập kỳ kiểm kê mới.' 
              : 'Thử điều chỉnh từ khóa tìm kiếm hoặc trạng thái lọc.'}
          </p>
        </div>
      ) : listState === 'loading' ? (
        <div className="p-12 text-center text-sm text-[var(--text-secondary)] mt-4">Đang tải danh sách kỳ kiểm kê…</div>
      ) : listState === 'error' || listState === 'permission-denied' ? (
        <p className="p-4 rounded border border-[var(--color-danger)]/20 bg-[var(--color-danger-bg)] text-sm text-[var(--color-danger-text)] mt-4" role="alert">
          {stateMessage(listState)}{listError ? ` (${listError.code})` : ''}
        </p>
      ) : listState === 'ready' ? (
        <div className="inventory__workspace mt-4">
          <div className="inventory__table-wrap">
            <table className="inventory__table">
              <thead>
                <tr className="bg-[var(--surface-2)] border-b border-[var(--border-default)]">
                  <th>Mã kiểm kê</th>
                  <th>Phạm vi</th>
                  <th>Điểm chốt (Cutoff)</th>
                  <th>Trạng thái</th>
                  <th>Số vị trí (Bins)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.code}
                    className={`transition-colors hover:bg-[var(--surface-2)] border-b border-[var(--border-default)] cursor-pointer ${
                      row.code === selectedCode ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]' : ''
                    }`}
                    onClick={() => { setSelectedCode(row.code); setPendingAction(null) }}
                  >
                    <td>
                      <button
                        type="button"
                        className="inventory__link-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCode(row.code)
                          setPendingAction(null)
                        }}
                      >
                        {row.code}
                      </button>
                    </td>
                    <td>{row.scopeType}<small>{row.scopeFilterLabel}</small></td>
                    <td>{row.cutoffAt}</td>
                    <td><span className="inventory__status">{row.status}</span></td>
                    <td>{row.totalBins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <aside className="inventory__panel" aria-label="Chi tiết stocktake">
            {detailQuery.isLoading ? (
              <p>Đang tải chi tiết…</p>
            ) : detailRow ? (
              <>
                <div className="inventory__panel-heading">
                  <div>
                    <h3>{detailRow.code}</h3>
                    <p className="inventory__muted">{detailRow.scopeType} · {detailRow.status}</p>
                  </div>
                </div>
                <dl>
                  <div><dt>Cutoff</dt><dd>{detailRow.cutoffAt}</dd></div>
                  <div><dt>Scope filter</dt><dd>{detailRow.scopeFilterLabel}</dd></div>
                  <div><dt>Note</dt><dd>{detailRow.note}</dd></div>
                </dl>
                <div className="inventory__actions">
                  <button type="button" disabled={!detailRow.canStart} onClick={() => setPendingAction('start')}>Start</button>
                  <button type="button" disabled={!detailRow.canRequestAdjustment} onClick={() => setPendingAction('request_adjustment')}>Request adjustment</button>
                  <button type="button" disabled={!detailRow.canRetryAdjustment} onClick={() => setPendingAction('retry_adjustment')}>Retry</button>
                  <button type="button" className="inventory__danger" disabled={!detailRow.canCancel} onClick={() => setPendingAction('cancel')}>Cancel</button>
                </div>
                <h4>Variance review</h4>
                {detailRow.countRows.length ? (
                  <table className="inventory__table">
                    <thead>
                      <tr className="bg-[var(--surface-2)] border-b border-[var(--border-default)]">
                        <th>Vị trí/Vật tư/Lô</th>
                        <th>Sổ sách / Thực tế</th>
                        <th>Chênh lệch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRow.countRows.map((count) => (
                        <tr key={count.code}>
                          <td>{count.locationLabel}<small>{count.itemLabel} · {count.lotLabel}</small></td>
                          <td>{count.bookQty} / {count.countedQty}</td>
                          <td>{count.variance} ({count.variancePct}%){count.recountRequired ? <small>Recount required</small> : null}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="inventory__muted">Chưa có count từ PDA.</p>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 gap-2 min-h-[300px]">
                <svg className="w-8 h-8 text-[var(--text-muted)] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Chưa chọn stocktake</h4>
                <p className="text-xs text-[var(--text-secondary)]">Chọn một kỳ kiểm kê từ danh sách bên trái để xem dữ liệu chênh lệch và hành động.</p>
              </div>
            )}
          </aside>
        </div>
      ) : null}

      <Dialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tạo stocktake"
        maxWidth="max-w-[50%]"
      >
        <form className="flex flex-col gap-4 font-sans text-sm text-[var(--text-primary)]" onSubmit={(event) => { event.preventDefault(); createMutation.mutate() }}>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span>Scope type</span>
              <Select value={scopeType} onChange={(e) => setScopeType(e.target.value)}>
                <option>FULL</option>
                <option>ZONE</option>
                <option>CYCLE</option>
              </Select>
            </label>
            <label className="flex flex-col gap-1">
              <span>Cutoff at</span>
              <Input type="datetime-local" value={cutoffAt} onChange={(e) => setCutoffAt(e.target.value)} required />
            </label>
            <label className="flex flex-col gap-1 col-span-2">
              <span>Scope filter JSON {scopeType === 'FULL' ? '(optional)' : '(required)'}</span>
              <textarea
                rows={4}
                className="w-full p-2.5 border border-[var(--border-default)] rounded-lg bg-[var(--surface-3)] text-[var(--text-primary)] text-sm focus:outline-none"
                value={scopeFilterText}
                onChange={(e) => setScopeFilterText(e.target.value)}
                placeholder={'{"location_codes":["ZONE-A"]}'}
              />
              {invalidFilter ? <p className="text-xs text-[var(--color-danger-text)] font-semibold mt-0.5">JSON không hợp lệ.</p> : null}
            </label>
            <label className="flex flex-col gap-1 col-span-2">
              <span>Note</span>
              <textarea
                rows={3}
                className="w-full p-2.5 border border-[var(--border-default)] rounded-lg bg-[var(--surface-3)] text-[var(--text-primary)] text-sm focus:outline-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={createErrors.length > 0 || invalidFilter || createMutation.isPending}>
              Tạo kỳ kiểm kê
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={!!pendingAction}
        onClose={() => setPendingAction(null)}
        title={`Xác nhận ${pendingAction}`}
        maxWidth="max-w-[50%]"
      >
        <div className="flex flex-col gap-4 font-sans text-sm text-[var(--text-primary)]">
          <p>Action áp dụng cho <strong>{detailRow?.code}</strong> và chỉ gửi qua href do server cấp.</p>
          {actionNeedsReason ? (
            <label className="flex flex-col gap-1">
              <span>{pendingAction === 'cancel' ? 'Reason' : 'Variance reason'}</span>
              <textarea
                rows={3}
                className="w-full p-2.5 border border-[var(--border-default)] rounded-lg bg-[var(--surface-3)] text-[var(--text-primary)] text-sm focus:outline-none"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </label>
          ) : null}
          {pendingAction === 'request_adjustment' ? (
            <>
              <label className="flex flex-col gap-1">
                <span>Review note</span>
                <textarea
                  rows={3}
                  className="w-full p-2.5 border border-[var(--border-default)] rounded-lg bg-[var(--surface-3)] text-[var(--text-primary)] text-sm focus:outline-none"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                />
              </label>
              <p className="text-xs text-[var(--text-secondary)]">Sẽ gửi {adjustmentReviews.length} review cho các tuple variance khác 0.</p>
            </>
          ) : null}
          {mutationError ? (
            <p className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] text-xs" role="alert">
              {mutationError.code}: {mutationError.message}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
            <Button type="button" variant="secondary" onClick={() => setPendingAction(null)}>Hủy</Button>
            <Button
              type="button"
              variant={pendingAction === 'cancel' ? 'danger' : 'primary'}
              disabled={actionDisabled}
              onClick={() => actionMutation.mutate()}
            >
              Xác nhận
            </Button>
          </div>
        </div>
      </Dialog>
      {/* Excel Import/Export Dialog Modal */}
      <Dialog
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        title="Nhập / Xuất dữ liệu Excel (Stocktake)"
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
