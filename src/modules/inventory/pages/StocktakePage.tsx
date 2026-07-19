import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'

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
      <header className="inventory__header"><div><p className="inventory__eyebrow">WEB-WMS-05-STOCKTAKE</p><h2 id="stocktake-title">Stocktake &amp; Reconciliation</h2><p className="inventory__lead">Lập kỳ kiểm kê, review variance và gửi điều chỉnh tồn kho có kiểm soát.</p></div><div className="inventory__actions"><button className="inventory__button" type="button" onClick={() => setCreateOpen(true)}>Tạo stocktake</button><Link to="/web/wms/inventory">Inventory</Link></div></header>
      <p className="inventory__handoff">Count capture và submit-counts là luồng PDA-only. Web chỉ quản trị kỳ, review variance và action từ <code>allowed_actions</code> của server.</p>
      <form className="inventory__toolbar" onSubmit={(event) => { event.preventDefault(); setQuery(searchInput.trim()) }}><label><span>Tìm theo stocktake code</span><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} /></label><label><span>Status</span><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Tất cả</option>{['DRAFT','OPEN','COUNTING','RECONCILED','ADJUSTMENT_FAILED','CANCELLED','CLOSED'].map((value) => <option key={value}>{value}</option>)}</select></label><button type="submit">Lọc</button><button type="button" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>Xuất stocktake</button><Link to="/web/import-export">Import counts</Link></form>
      {exportMutation.isSuccess ? <p className="inventory__success" role="status">Đã tạo stocktake export job.</p> : null}
      {listState !== 'ready' ? <p className="inventory__state" role={listState === 'error' ? 'alert' : 'status'}>{stateMessage(listState)}{listError ? ` (${listError.code})` : ''}</p> : null}
      {listState === 'ready' ? <div className="inventory__workspace"><div className="inventory__table-wrap"><table className="inventory__table"><thead><tr><th>Stocktake</th><th>Scope</th><th>Cutoff</th><th>Status</th><th>Bins</th></tr></thead><tbody>{rows.map((row) => <tr key={row.code}><td><button type="button" className="inventory__link-button" onClick={() => { setSelectedCode(row.code); setPendingAction(null) }}>{row.code}</button></td><td>{row.scopeType}<small>{row.scopeFilterLabel}</small></td><td>{row.cutoffAt}</td><td><span className="inventory__status">{row.status}</span></td><td>{row.totalBins}</td></tr>)}</tbody></table></div>
        <aside className="inventory__panel" aria-label="Chi tiết stocktake">{detailQuery.isLoading ? <p>Đang tải chi tiết…</p> : detailRow ? <><div className="inventory__panel-heading"><div><h3>{detailRow.code}</h3><p className="inventory__muted">{detailRow.scopeType} · {detailRow.status}</p></div></div><dl><div><dt>Cutoff</dt><dd>{detailRow.cutoffAt}</dd></div><div><dt>Scope filter</dt><dd>{detailRow.scopeFilterLabel}</dd></div><div><dt>Note</dt><dd>{detailRow.note}</dd></div></dl>
          <div className="inventory__actions"><button type="button" disabled={!detailRow.canStart} onClick={() => setPendingAction('start')}>Start</button><button type="button" disabled={!detailRow.canRequestAdjustment} onClick={() => setPendingAction('request_adjustment')}>Request adjustment</button><button type="button" disabled={!detailRow.canRetryAdjustment} onClick={() => setPendingAction('retry_adjustment')}>Retry</button><button type="button" className="inventory__danger" disabled={!detailRow.canCancel} onClick={() => setPendingAction('cancel')}>Cancel</button></div>
          <h4>Variance review</h4>{detailRow.countRows.length ? <table className="inventory__table"><thead><tr><th>Tuple</th><th>Book / counted</th><th>Variance</th></tr></thead><tbody>{detailRow.countRows.map((count) => <tr key={count.code}><td>{count.locationLabel}<small>{count.itemLabel} · {count.lotLabel}</small></td><td>{count.bookQty} / {count.countedQty}</td><td>{count.variance} ({count.variancePct}%){count.recountRequired ? <small>Recount required</small> : null}</td></tr>)}</tbody></table> : <p className="inventory__muted">Chưa có count từ PDA.</p>}
        </> : <p className="inventory__muted">Chọn stocktake để xem counts và allowed actions.</p>}</aside></div> : null}

      {createOpen ? <div className="inventory__modal" role="dialog" aria-modal="true" aria-label="Tạo stocktake"><form className="inventory__panel inventory__form" onSubmit={(event) => { event.preventDefault(); createMutation.mutate() }}><div className="inventory__panel-heading"><h3>Tạo stocktake</h3><button type="button" onClick={() => setCreateOpen(false)}>Đóng</button></div><label><span>Scope type</span><select value={scopeType} onChange={(e) => setScopeType(e.target.value)}><option>FULL</option><option>ZONE</option><option>CYCLE</option></select></label><label><span>Scope filter JSON {scopeType === 'FULL' ? '(optional)' : '(required)'}</span><textarea rows={4} value={scopeFilterText} onChange={(e) => setScopeFilterText(e.target.value)} placeholder={'{"location_codes":["ZONE-A"]}'} /></label>{invalidFilter ? <p className="inventory__error">JSON không hợp lệ.</p> : null}<label><span>Cutoff at</span><input type="datetime-local" value={cutoffAt} onChange={(e) => setCutoffAt(e.target.value)} required /></label><label><span>Note</span><textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></label><button className="inventory__button" type="submit" disabled={createErrors.length > 0 || invalidFilter || createMutation.isPending}>Tạo kỳ kiểm kê</button></form></div> : null}

      {pendingAction ? <div className="inventory__modal" role="dialog" aria-modal="true" aria-label="Xác nhận stocktake action"><div className="inventory__panel inventory__form"><div className="inventory__panel-heading"><h3>Xác nhận {pendingAction}</h3><button type="button" onClick={() => setPendingAction(null)}>Đóng</button></div><p>Action áp dụng cho <strong>{detailRow?.code}</strong> và chỉ gửi qua href do server cấp.</p>{actionNeedsReason ? <label><span>{pendingAction === 'cancel' ? 'Reason' : 'Variance reason'}</span><textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required /></label> : null}{pendingAction === 'request_adjustment' ? <><label><span>Review note</span><textarea rows={3} value={actionNote} onChange={(e) => setActionNote(e.target.value)} /></label><p className="inventory__muted">Sẽ gửi {adjustmentReviews.length} review cho các tuple variance khác 0.</p></> : null}{mutationError ? <p className="inventory__error" role="alert">{mutationError.code}: {mutationError.message}</p> : null}<button className={pendingAction === 'cancel' ? 'inventory__danger' : 'inventory__button'} type="button" disabled={actionDisabled} onClick={() => actionMutation.mutate()}>Xác nhận</button></div></div> : null}
    </section>
  )
}
