import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'

import { ApiError } from '@/shared/api'
import { usePagination } from '@/shared/lib/usePagination'
import { DataTablePagination } from '@/shared/components/DataTablePagination'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Search } from 'lucide-react'

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
  switch (state) {
    case 'loading':
      return 'Đang tải dữ liệu tồn kho…'
    case 'empty':
      return 'Chưa có bản ghi tồn kho nào.'
    case 'no-result':
      return 'Không tìm thấy kết quả phù hợp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem thông tin tồn kho.'
    case 'error':
      return 'Không tải được dữ liệu. Vui lòng thử lại sau.'
    default:
      return ''
  }
}

export function InventoryPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<InventoryTab>('balances')
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transfer, setTransfer] = useState<TransferLineRequest>(emptyTransfer)

  // Local confirmations
  const [isConfirmTransferOpen, setIsConfirmTransferOpen] = useState(false)

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

  // Sliced active list pagination
  const activeList = tab === 'transactions' ? transactionRows : rows
  const pagination = usePagination(activeList, 10)

  const changeTab = (next: InventoryTab) => {
    setTab(next); setQuery(''); setSearchInput(''); setSelectedTransaction(null)
  }

  const handleTransferSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setIsConfirmTransferOpen(true)
  }

  return (
    <section className="inventory flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'WMS' },
          { label: 'Inventory' },
        ]}
        title="Inventory"
        subtitle="Theo dõi số dư tồn kho, số lô và lịch sử giao dịch."
        actions={
          <div className="flex gap-2">
            <Link to="/web/wms/stocktakes">
              <Button variant="secondary">Stocktake</Button>
            </Link>
            <Button onClick={() => setTransferOpen(true)}>Tạo transfer</Button>
          </div>
        }
      />

      <nav className="inventory__tabs" aria-label="Inventory sections" role="tablist">
        {([['balances', 'Balances'], ['lots', 'By lot'], ['transactions', 'Transactions']] as const).map(([key, label]) => (
          <button key={key} type="button" aria-selected={tab === key} role="tab" onClick={() => changeTab(key)}>{label}</button>
        ))}
      </nav>

      <form className="flex items-center gap-2 max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg" onSubmit={(event) => { event.preventDefault(); setQuery(searchInput.trim()) }}>
        <div className="flex-1">
          <input
            className="w-full bg-transparent border-0 focus:outline-none text-sm text-slate-800 dark:text-slate-200 px-2"
            placeholder="Mã vật tư, lot, location…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <Button type="submit" size="sm" className="h-9 w-9 px-0" aria-label="Lọc">
          <Search size={16} />
        </Button>
        {tab === 'lots' ? <button type="button" className="inventory__button inventory__button--secondary min-h-[32px] px-3 py-1 rounded text-xs font-semibold" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>Xuất by-lot</button> : null}
      </form>
      {exportMutation.isSuccess ? <p className="inventory__success" role="status">Đã tạo export job thành công.</p> : null}
      {exportError ? <p className="inventory__error" role="alert">{exportError.code}: {exportError.message}</p> : null}

      {listState !== 'ready' ? <p className="inventory__state" role={listState === 'error' ? 'alert' : 'status'}>{stateMessage(listState)}{listError ? ` (${listError.code})` : ''}</p> : null}
      {listState === 'ready' ? (
        <div className="inventory__workspace">
          <div className="inventory__table-wrap">
            {tab !== 'transactions' ? (
              <table className="inventory__table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Item</th>
                    <th>Lot</th>
                    <th>On hand</th>
                    <th>Reserved</th>
                    <th>Available</th>
                    <th>Last movement</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paginatedItems.map((row) => (
                    <tr key={row.code}>
                      <td>{row.locationLabel}</td>
                      <td>{row.itemLabel}</td>
                      <td>{row.lotLabel}</td>
                      <td>{row.onHandQty}</td>
                      <td>{row.reservedQty}</td>
                      <td>{row.availableQty}</td>
                      <td>{row.lastMovementAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="inventory__table">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Type</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th>Performed at</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paginatedItems.map((row) => (
                    <tr key={row.code}>
                      <td>
                        <button type="button" className="inventory__link-button" onClick={() => setSelectedTransaction(row.code)}>
                          {row.code}
                        </button>
                      </td>
                      <td>{row.transactionTypeLabel}</td>
                      <td>{row.referenceLabel}</td>
                      <td><span className="inventory__status-tag">{row.status}</span></td>
                      <td>{row.performedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            <div className="inventory__paging-row">
              {activeQuery.data?.page.has_more ? (
                <button type="button" className="inventory__more" onClick={() => activeQuery.refetch()}>
                  Nạp thêm từ Server
                </button>
              ) : (
                <span className="inventory__all-loaded">Đã tải hết dữ liệu từ Server</span>
              )}
              
              <DataTablePagination
                currentPage={pagination.currentPage}
                pageSize={pagination.pageSize}
                totalItems={pagination.totalItems}
                totalPages={pagination.totalPages}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                setPage={pagination.setPage}
                setPageSize={pagination.setPageSize}
              />
            </div>
          </div>
          
          {tab === 'transactions' ? (
            <aside className="inventory__panel" aria-label="Chi tiết giao dịch">
              {detailQuery.isLoading ? <p>Đang tải chi tiết…</p> : detail ? <>
                <h3>{detail.code}</h3>
                <p className="inventory__muted">{detail.transactionTypeLabel} · {detail.status}</p>
                <dl className="inventory__meta-dl">
                  <div>
                    <dt>Reference</dt>
                    <dd>{detail.referenceLabel}</dd>
                  </div>
                  <div>
                    <dt>Performed by</dt>
                    <dd>{detail.performedByLabel}</dd>
                  </div>
                  <div>
                    <dt>Performed at</dt>
                    <dd>{detail.performedAt}</dd>
                  </div>
                </dl>
                <table className="inventory__table inventory__table--compact">
                  <thead>
                    <tr>
                      <th>Item / lot</th>
                      <th>Route</th>
                      <th>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lineRows.map((line) => (
                      <tr key={line.code}>
                        <td>
                          {line.itemLabel}
                          <small style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Lot: {line.lotLabel}</small>
                        </td>
                        <td>{line.fromLocationLabel} → {line.toLocationLabel}</td>
                        <td>{line.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </> : <p className="inventory__muted">Chọn giao dịch để xem chi tiết.</p>}
            </aside>
          ) : null}
        </div>
      ) : null}

      {transferOpen ? (
        <div className="inventory__modal" role="dialog" aria-modal="true" aria-label="Tạo transfer">
          <form className="inventory__panel inventory__form" onSubmit={handleTransferSubmit}>
            <div className="inventory__panel-heading">
              <h3>Tạo transfer</h3>
              <button type="button" className="inventory__btn-close" onClick={() => setTransferOpen(false)}>Đóng</button>
            </div>
            <p className="inventory__muted">Điều chuyển vật tư bằng mã item, lot và location; server xử lý posting/idempotency.</p>
            <label className="inventory__field">
              <span>Item code</span>
              <input value={transfer.item_code} onChange={(e) => setTransfer({ ...transfer, item_code: e.target.value })} required />
            </label>
            <label className="inventory__field">
              <span>Lot code (tùy chọn)</span>
              <input value={transfer.lot_code ?? ''} onChange={(e) => setTransfer({ ...transfer, lot_code: e.target.value })} />
            </label>
            <div className="inventory__form-grid">
              <label className="inventory__field">
                <span>From location</span>
                <input value={transfer.from_location_code} onChange={(e) => setTransfer({ ...transfer, from_location_code: e.target.value })} required />
              </label>
              <label className="inventory__field">
                <span>To location</span>
                <input value={transfer.to_location_code} onChange={(e) => setTransfer({ ...transfer, to_location_code: e.target.value })} required />
              </label>
            </div>
            <label className="inventory__field">
              <span>Quantity</span>
              <input type="number" min="0.000001" step="any" value={transfer.quantity || ''} onChange={(e) => setTransfer({ ...transfer, quantity: Number(e.target.value) })} required />
            </label>
            {transferError ? <p className="inventory__error" role="alert">{transferError.code}: {transferError.message}</p> : null}
            <button className="inventory__button" type="submit" disabled={transferErrors.length > 0 || transferMutation.isPending}>
              Xác nhận transfer
            </button>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={isConfirmTransferOpen}
        onClose={() => setIsConfirmTransferOpen(false)}
        title="Xác nhận điều chuyển tồn kho (Transfer)"
        description="Vui lòng kiểm tra kỹ thông tin điều chuyển trước khi thực hiện giao dịch."
        summary={{
          'Mã vật tư': transfer.item_code,
          'Mã lô (Lot)': transfer.lot_code || 'Không có',
          'Vị trí nguồn': transfer.from_location_code,
          'Vị trí đích': transfer.to_location_code,
          'Số lượng': transfer.quantity,
        }}
        isPending={transferMutation.isPending}
        onConfirm={() => {
          setIsConfirmTransferOpen(false)
          transferMutation.mutate()
        }}
      />
    </section>
  )
}
