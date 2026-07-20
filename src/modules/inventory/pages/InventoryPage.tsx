import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'

import { ApiError } from '@/shared/api'
import { usePagination } from '@/shared/lib/usePagination'
import { TablePagination } from '@/shared/components/ui/TablePagination'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { Dialog } from '@/shared/components/ui/Dialog'
import { Input } from '@/shared/components/ui/Input'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { FilterBar } from '@/shared/components/ui/FilterBar'
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
  const activeList = (tab === 'transactions' ? transactionRows : rows) as any[]
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

      <FilterBar
        fields={[
          {
            name: 'searchInput',
            type: 'text',
            placeholder: 'Mã vật tư, lot, location…',
          }
        ]}
        values={{
          searchInput: searchInput,
        }}
        onChange={(_, val) => setSearchInput(val)}
        onSubmit={(event) => {
          event.preventDefault()
          setQuery(searchInput.trim())
        }}
        onReset={() => {
          setSearchInput('')
          setQuery('')
        }}
        isResetActive={Boolean(searchInput)}
      >
        {tab === 'lots' && (
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
            >
              Xuất by-lot
            </Button>
          </div>
        )}
      </FilterBar>
      {exportMutation.isSuccess ? <p className="inventory__success" role="status">Đã tạo export job thành công.</p> : null}
      {exportError ? <p className="inventory__error" role="alert">{exportError.code}: {exportError.message}</p> : null}

      {listState !== 'ready' && listState !== 'loading' ? (
        <p className="inventory__state" role={listState === 'error' ? 'alert' : 'status'}>
          {stateMessage(listState)}
          {listError ? ` (${listError.code})` : ''}
        </p>
      ) : null}

      {listState === 'ready' || listState === 'loading' ? (
        <div className="inventory__workspace">
          <div className="inventory__table-wrap">
            {tab !== 'transactions' ? (
              <table className="inventory__table">
                <thead>
                  <tr>
                    <th>Vị trí</th>
                    <th>Vật tư</th>
                    <th>Số lô</th>
                    <th>Tồn thực tế (On-hand)</th>
                    <th>Đã giữ hàng (Reserved)</th>
                    <th>Có sẵn (Available)</th>
                    <th>Giao dịch cuối</th>
                  </tr>
                </thead>
                <tbody>
                  {listState === 'loading' ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="pointer-events-none hover:bg-transparent">
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[65%] my-1" /></td>
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[75%] my-1" /></td>
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[80%] my-1" /></td>
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[40%] my-1" /></td>
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[40%] my-1" /></td>
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[45%] my-1" /></td>
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[60%] my-1" /></td>
                      </tr>
                    ))
                  ) : pagination.paginatedItems.map((row) => (
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
                    <th>Mã giao dịch</th>
                    <th>Loại giao dịch</th>
                    <th>Tham chiếu</th>
                    <th>Trạng thái</th>
                    <th>Thời gian thực hiện</th>
                  </tr>
                </thead>
                <tbody>
                  {listState === 'loading' ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="pointer-events-none hover:bg-transparent">
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[70%] my-1" /></td>
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[60%] my-1" /></td>
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[75%] my-1" /></td>
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[40%] my-1" /></td>
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[60%] my-1" /></td>
                      </tr>
                    ))
                  ) : pagination.paginatedItems.map((row) => (
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
            
            <TablePagination
              {...pagination}
              hasMore={activeQuery.data?.page.has_more}
              onLoadMore={() => activeQuery.refetch()}
              sticky
            />
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
                      <th>Vật tư / Số lô</th>
                      <th>Luồng di chuyển</th>
                      <th>Số lượng</th>
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

      <Dialog
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Tạo transfer"
        maxWidth="max-w-[50%]"
      >
        <form className="flex flex-col gap-4 font-sans text-sm text-[var(--text-primary)]" onSubmit={handleTransferSubmit}>
          <p className="text-xs text-[var(--text-secondary)]">Điều chuyển vật tư bằng mã item, lot và location; server xử lý posting/idempotency.</p>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span>Item code</span>
              <Input value={transfer.item_code} onChange={(e) => setTransfer({ ...transfer, item_code: e.target.value })} required />
            </label>
            <label className="flex flex-col gap-1">
              <span>Lot code (tùy chọn)</span>
              <Input value={transfer.lot_code ?? ''} onChange={(e) => setTransfer({ ...transfer, lot_code: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1">
              <span>From location</span>
              <Input value={transfer.from_location_code} onChange={(e) => setTransfer({ ...transfer, from_location_code: e.target.value })} required />
            </label>
            <label className="flex flex-col gap-1">
              <span>To location</span>
              <Input value={transfer.to_location_code} onChange={(e) => setTransfer({ ...transfer, to_location_code: e.target.value })} required />
            </label>
            <label className="flex flex-col gap-1 col-span-2">
              <span>Quantity</span>
              <Input type="number" min="0.000001" step="any" value={transfer.quantity || ''} onChange={(e) => setTransfer({ ...transfer, quantity: Number(e.target.value) })} required />
            </label>
          </div>
          {transferError ? <p className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] text-xs" role="alert">{transferError.code}: {transferError.message}</p> : null}
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
            <Button type="button" variant="secondary" onClick={() => setTransferOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={transferErrors.length > 0 || transferMutation.isPending}>
              Xác nhận transfer
            </Button>
          </div>
        </form>
      </Dialog>

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
