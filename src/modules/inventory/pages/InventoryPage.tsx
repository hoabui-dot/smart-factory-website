import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'

import { ApiError } from '@/shared/api'

import {
  createTransfer,
  exportInventoryByLot,
  getStockTransaction,
  listBalances,
  listInventoryLots,
  listStockTransactions,
} from '../api/inventoryApi'
import {
  projectBalanceRow,
  projectStockTransactionRow,
  resolveListState,
  validateTransferLine,
} from '../lib/inventoryProjection'
import type { TransferLineRequest } from '../types/inventory'

import './inventory.css'

type InventoryTab = 'balances' | 'lots' | 'transactions'

const emptyTransfer: TransferLineRequest = {
  item_code: '', lot_code: '', from_location_code: '', to_location_code: '', quantity: 0,
}

function stateMessage(state: string): string {
  return {
    loading: 'Đang tải dữ liệu…', empty: 'Chưa có dữ liệu.', 'no-result': 'Không có kết quả phù hợp.',
    'permission-denied': 'Bạn không có quyền xem dữ liệu này.', error: 'Không thể tải dữ liệu. Vui lòng thử lại.',
  }[state] ?? ''
}

export function InventoryPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<InventoryTab>('balances')
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transfer, setTransfer] = useState<TransferLineRequest>(emptyTransfer)

  const balanceQuery = useQuery({
    queryKey: ['wms05', tab, query],
    queryFn: () => {
      const params = { q: query || undefined, limit: 50 }
      if (tab === 'balances') return listBalances(params)
      return listInventoryLots(params)
    },
    enabled: tab !== 'transactions',
  })
  const transactionQuery = useQuery({
    queryKey: ['wms05', 'transactions', query],
    queryFn: () => listStockTransactions({ q: query || undefined, limit: 50 }),
    enabled: tab === 'transactions',
  })
  const detailQuery = useQuery({
    queryKey: ['wms05', 'transaction', selectedTransaction],
    queryFn: () => getStockTransaction(selectedTransaction as string),
    enabled: Boolean(selectedTransaction),
  })
  const transferMutation = useMutation({
    mutationFn: () => createTransfer([{ ...transfer, lot_code: transfer.lot_code?.trim() || null }]),
    onSuccess: async () => {
      setTransfer(emptyTransfer)
      setTransferOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['wms05'] })
    },
  })
  const exportMutation = useMutation({ mutationFn: exportInventoryByLot })

  const activeQuery = tab === 'transactions' ? transactionQuery : balanceQuery
  const itemCount = activeQuery.data?.items.length ?? 0
  const rows = useMemo(() => (balanceQuery.data?.items ?? []).map(projectBalanceRow), [balanceQuery.data?.items])
  const transactionRows = useMemo(() => (transactionQuery.data?.items ?? []).map(projectStockTransactionRow), [transactionQuery.data?.items])
  const listError = activeQuery.error instanceof ApiError ? activeQuery.error : null
  const listState = resolveListState(
    activeQuery.isLoading || activeQuery.isFetching ? 'loading' : activeQuery.isError ? 'error' : 'success',
    itemCount, Boolean(query), listError?.code ?? null,
  )
  const detail = detailQuery.data ? projectStockTransactionRow(detailQuery.data) : null
  const transferErrors = validateTransferLine(transfer)
  const transferError = transferMutation.error instanceof ApiError ? transferMutation.error : null
  const exportError = exportMutation.error instanceof ApiError ? exportMutation.error : null

  const changeTab = (next: InventoryTab) => {
    setTab(next); setQuery(''); setSearchInput(''); setSelectedTransaction(null)
  }

  return (
    <section className="inventory" aria-labelledby="inventory-title">
      <header className="inventory__header">
        <div>
          <p className="inventory__eyebrow">WEB-WMS-05-INVENTORY</p>
          <h2 id="inventory-title">Inventory Control</h2>
          <p className="inventory__lead">Tồn kho theo vị trí/lot, lịch sử giao dịch và điều chuyển nội bộ.</p>
        </div>
        <div className="inventory__actions">
          <button type="button" className="inventory__button" onClick={() => setTransferOpen(true)}>Tạo transfer</button>
          <Link to="/web/wms/stocktakes">Stocktake</Link>
        </div>
      </header>

      <nav className="inventory__tabs" aria-label="Inventory sections">
        {([['balances', 'Balances'], ['lots', 'By lot'], ['transactions', 'Transactions']] as const).map(([key, label]) => (
          <button key={key} type="button" aria-current={tab === key ? 'page' : undefined} onClick={() => changeTab(key)}>{label}</button>
        ))}
      </nav>

      <form className="inventory__toolbar" onSubmit={(event) => { event.preventDefault(); setQuery(searchInput.trim()) }}>
        <label><span>Tìm theo mã nghiệp vụ</span><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /></label>
        <button type="submit">Lọc</button>
        {tab === 'lots' ? <button type="button" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>Xuất by-lot</button> : null}
        <Link to="/web/import-export">Import / Export Center</Link>
      </form>
      {exportMutation.isSuccess ? <p className="inventory__success" role="status">Đã tạo export job.</p> : null}
      {exportError ? <p className="inventory__error" role="alert">{exportError.code}: {exportError.message}</p> : null}

      {listState !== 'ready' ? <p className="inventory__state" role={listState === 'error' ? 'alert' : 'status'}>{stateMessage(listState)}{listError ? ` (${listError.code})` : ''}</p> : null}
      {listState === 'ready' ? (
        <div className="inventory__workspace">
          <div className="inventory__table-wrap">
            {tab !== 'transactions' ? (
              <table className="inventory__table"><thead><tr><th>Location</th><th>Item</th><th>Lot</th><th>On hand</th><th>Reserved</th><th>Available</th><th>Last movement</th></tr></thead>
                <tbody>{rows.map((row) => <tr key={row.code}><td>{row.locationLabel}</td><td>{row.itemLabel}</td><td>{row.lotLabel}</td><td>{row.onHandQty}</td><td>{row.reservedQty}</td><td>{row.availableQty}</td><td>{row.lastMovementAt}</td></tr>)}</tbody></table>
            ) : (
              <table className="inventory__table"><thead><tr><th>Transaction</th><th>Type</th><th>Reference</th><th>Status</th><th>Performed at</th></tr></thead>
                <tbody>{transactionRows.map((row) => <tr key={row.code}><td><button type="button" className="inventory__link-button" onClick={() => setSelectedTransaction(row.code)}>{row.code}</button></td><td>{row.transactionTypeLabel}</td><td>{row.referenceLabel}</td><td><span className="inventory__status">{row.status}</span></td><td>{row.performedAt}</td></tr>)}</tbody></table>
            )}
          </div>
          {tab === 'transactions' ? (
            <aside className="inventory__panel" aria-label="Chi tiết giao dịch">
              {detailQuery.isLoading ? <p>Đang tải chi tiết…</p> : detail ? <>
                <h3>{detail.code}</h3><p className="inventory__muted">{detail.transactionTypeLabel} · {detail.status}</p>
                <dl><div><dt>Reference</dt><dd>{detail.referenceLabel}</dd></div><div><dt>Performed by</dt><dd>{detail.performedByLabel}</dd></div><div><dt>Performed at</dt><dd>{detail.performedAt}</dd></div></dl>
                <table className="inventory__table"><thead><tr><th>Item / lot</th><th>Route</th><th>Qty</th></tr></thead><tbody>{detail.lineRows.map((line) => <tr key={line.code}><td>{line.itemLabel}<small>{line.lotLabel}</small></td><td>{line.fromLocationLabel} → {line.toLocationLabel}</td><td>{line.qty}</td></tr>)}</tbody></table>
              </> : <p className="inventory__muted">Chọn giao dịch để xem line và business codes.</p>}
            </aside>
          ) : null}
        </div>
      ) : null}

      {transferOpen ? <div className="inventory__modal" role="dialog" aria-modal="true" aria-label="Tạo transfer"><form className="inventory__panel inventory__form" onSubmit={(event) => { event.preventDefault(); transferMutation.mutate() }}>
        <div className="inventory__panel-heading"><h3>Tạo transfer</h3><button type="button" onClick={() => setTransferOpen(false)}>Đóng</button></div>
        <p className="inventory__muted">Điều chuyển một line bằng mã item, lot và location; server xử lý posting/idempotency.</p>
        <label><span>Item code</span><input value={transfer.item_code} onChange={(e) => setTransfer({ ...transfer, item_code: e.target.value })} required /></label>
        <label><span>Lot code (optional)</span><input value={transfer.lot_code ?? ''} onChange={(e) => setTransfer({ ...transfer, lot_code: e.target.value })} /></label>
        <div className="inventory__form-grid"><label><span>From location</span><input value={transfer.from_location_code} onChange={(e) => setTransfer({ ...transfer, from_location_code: e.target.value })} required /></label><label><span>To location</span><input value={transfer.to_location_code} onChange={(e) => setTransfer({ ...transfer, to_location_code: e.target.value })} required /></label></div>
        <label><span>Quantity</span><input type="number" min="0.000001" step="any" value={transfer.quantity || ''} onChange={(e) => setTransfer({ ...transfer, quantity: Number(e.target.value) })} required /></label>
        {transferError ? <p className="inventory__error" role="alert">{transferError.code}: {transferError.message}</p> : null}
        <button className="inventory__button" type="submit" disabled={transferErrors.length > 0 || transferMutation.isPending}>Xác nhận transfer</button>
      </form></div> : null}
    </section>
  )
}
