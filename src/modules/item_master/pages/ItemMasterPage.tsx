import { useState } from 'react'
import { Link } from 'react-router'

import { useItemMaster } from '../hooks/useItemMaster'
import type { ItemRecord } from '../types/itemMaster'
import { usePagination } from '@/shared/lib/usePagination'
import { DataTablePagination } from '@/shared/components/DataTablePagination'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'

// Import Tailwind Shadcn UI components
import { Button } from '@/shared/components/ui/Button'
import { Input, Select } from '@/shared/components/ui/Input'
import { Badge } from '@/shared/components/ui/Badge'
import { Dialog } from '@/shared/components/ui/Dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/shared/components/ui/Table'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Search } from 'lucide-react'

type Api = ReturnType<typeof useItemMaster>

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải danh mục item…'
    case 'empty':
      return 'Chưa có item nào. Nhấp vào "Tạo item" để bắt đầu.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc. Thử từ khóa khác.'
    case 'permission-denied':
      return 'Bạn không có quyền xem danh mục item.'
    case 'error':
      return 'Không tải được danh mục item. Thử lại sau.'
    default:
      return ''
  }
}

function ItemEditor({
  detail,
  admin,
  onClose,
}: {
  detail: ItemRecord
  admin: Api
  onClose: () => void
}) {
  const [itemName, setItemName] = useState(detail.item_name)
  const [itemTypeId, setItemTypeId] = useState(detail.item_type_id)
  const [categoryId, setCategoryId] = useState(detail.category_id)
  const [isLotTracked, setIsLotTracked] = useState(detail.is_lot_tracked)
  const [isSerialTracked, setIsSerialTracked] = useState(detail.is_serial_tracked)
  const [isPhantom, setIsPhantom] = useState(detail.is_phantom)
  const [shelfLifeDays, setShelfLifeDays] = useState(
    detail.shelf_life_days == null ? '' : String(detail.shelf_life_days),
  )

  // Local dialog control
  const [isConfirmEditOpen, setIsConfirmEditOpen] = useState(false)
  const [isConfirmDeactivateOpen, setIsConfirmDeactivateOpen] = useState(false)

  const row = admin.detailRow

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{detail.code}</h2>
          <Badge variant={detail.is_active ? 'active' : 'inactive'}>
            {detail.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <p className="text-sm text-slate-500 mt-1">{detail.item_name}</p>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Thông tin chung</h4>
        <dl className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg text-sm">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-slate-400 font-medium">Item type</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">{detail.item_type_code ?? '-'}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-slate-400 font-medium">Category</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">{detail.category_code ?? '-'}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-slate-400 font-medium">Base UOM</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">{detail.base_uom_code ?? '-'}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-slate-400 font-medium">Current revision</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">{detail.current_revision_code ?? '-'}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cấu hình thông số</h4>
        
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Tên item</span>
          <Input value={itemName} onChange={(e) => setItemName(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Item type</span>
          <Select value={itemTypeId} onChange={(e) => setItemTypeId(Number(e.target.value))}>
            {admin.itemTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} — {t.name_vi}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Category</span>
          <Select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
            {admin.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.category_name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-3 mt-1">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              checked={isLotTracked}
              onChange={(e) => setIsLotTracked(e.target.checked)}
            />
            <span>Lot tracked</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              checked={isSerialTracked}
              onChange={(e) => setIsSerialTracked(e.target.checked)}
            />
            <span>Serial tracked</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              checked={isPhantom}
              onChange={(e) => setIsPhantom(e.target.checked)}
            />
            <span>Phantom (BOM only)</span>
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Shelf life (days)</span>
          <Input
            inputMode="numeric"
            value={shelfLifeDays}
            onChange={(e) => setShelfLifeDays(e.target.value)}
            placeholder="Bỏ trống nếu không giới hạn"
          />
        </div>

        <Button
          type="button"
          disabled={!row?.canUpdate || admin.updatePending}
          title={row?.updateDisabledReason ?? undefined}
          onClick={() => setIsConfirmEditOpen(true)}
          className="w-full mt-2"
        >
          {admin.updatePending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>

        {!row?.canUpdate ? (
          <p className="text-xs text-red-500 mt-1 text-center">
            Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
          </p>
        ) : null}
        {admin.updateError ? (
          <p className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-650 border border-red-200 dark:border-red-900" role="alert">
            {admin.updateError.code}: {admin.updateError.message}
          </p>
        ) : null}
        {admin.updateSuccess ? (
          <p className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/20 text-xs text-emerald-600 border border-emerald-200 dark:border-emerald-900" role="status">
            Đã lưu thay đổi.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ngừng hoạt động</h4>
        <Button
          type="button"
          variant="danger"
          disabled={!row?.canDeactivate}
          title={row?.deactivateDisabledReason ?? undefined}
          onClick={() => setIsConfirmDeactivateOpen(true)}
          className="w-full"
        >
          Deactivate item
        </Button>
        {!row?.canDeactivate ? (
          <p className="text-xs text-slate-400 text-center">
            Deactivate không khả dụng
            {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
          </p>
        ) : null}

        {admin.deactivateError ? (
          <p className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-600 border border-red-200 dark:border-red-900" role="alert">
            {admin.deactivateError.code}: {admin.deactivateError.message}
          </p>
        ) : null}
        {admin.deactivateState === 'success' ? (
          <p className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/20 text-xs text-emerald-600 border border-emerald-200 dark:border-emerald-900" role="status">
            Đã deactivate item.
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={isConfirmEditOpen}
        onClose={() => setIsConfirmEditOpen(false)}
        title="Xác nhận lưu thay đổi"
        description={`Bạn có chắc chắn muốn cập nhật thông tin vật tư ${detail.code}?`}
        summary={{
          'Tên item': itemName.trim(),
          'Item Type': admin.itemTypes.find((t) => t.id === itemTypeId)?.code ?? itemTypeId,
          'Category': admin.categories.find((c) => c.id === categoryId)?.code ?? categoryId,
          'Lot Tracked': isLotTracked ? 'Có' : 'Không',
          'Serial Tracked': isSerialTracked ? 'Có' : 'Không',
          'Phantom': isPhantom ? 'Có' : 'Không',
          'Shelf Life (ngày)': shelfLifeDays.trim() || 'Không giới hạn',
        }}
        onConfirm={() => {
          setIsConfirmEditOpen(false)
          admin.saveEdit({
            item_name: itemName.trim(),
            item_type_id: itemTypeId,
            category_id: categoryId,
            is_lot_tracked: isLotTracked,
            is_serial_tracked: isSerialTracked,
            is_phantom: isPhantom,
            shelf_life_days: shelfLifeDays.trim() === '' ? null : Number(shelfLifeDays),
          })
          onClose()
        }}
      />

      <ConfirmDialog
        isOpen={isConfirmDeactivateOpen}
        onClose={() => setIsConfirmDeactivateOpen(false)}
        title={`Xác nhận dừng hoạt động: ${detail.code}`}
        description={`Hành động này sẽ chuyển trạng thái của vật tư ${detail.code} sang ngừng hoạt động.`}
        type="reason-required"
        confirmText="Deactivate"
        isPending={admin.deactivateState === 'pending'}
        onConfirm={() => {
          setIsConfirmDeactivateOpen(false)
          admin.deactivate()
          onClose()
        }}
      />
    </div>
  )
}

export function ItemMasterPage() {
  const admin = useItemMaster()
  const banner = listStateMessage(admin.listState)

  const pagination = usePagination(admin.rows, 10)

  // Local creation confirm
  const [isConfirmCreateOpen, setIsConfirmCreateOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  return (
    <section className="item-master flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'MES' },
          { label: 'Item Master' },
        ]}
        title="Item Master"
        subtitle="Quản lý danh mục vật tư và thành phẩm phục vụ sản xuất."
        actions={<Button onClick={admin.openCreate}>Tạo item</Button>}
      />

      <form
        className="flex items-center gap-2 max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg"
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
      >
        <div className="flex-1">
          <Input
            value={admin.searchInput}
            onChange={(e) => admin.setSearchInput(e.target.value)}
            placeholder="Tìm item (code / tên)..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-9 px-2"
          />
        </div>
        <Button type="submit" size="sm" className="h-9 w-9 px-0" aria-label="Lọc">
          <Search size={16} />
        </Button>
      </form>

      {admin.showCreate ? (
        <form
          className="flex flex-col gap-5 p-6 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault()
            setIsConfirmCreateOpen(true)
          }}
        >
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Tạo item mới</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Form luôn hiển thị — server enforce quyền tạo (MES01-003).
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">Code</span>
              <Input
                value={admin.createForm.code}
                onChange={(e) => admin.setCreateForm({ ...admin.createForm, code: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">Tên item</span>
              <Input
                value={admin.createForm.item_name}
                onChange={(e) =>
                  admin.setCreateForm({ ...admin.createForm, item_name: e.target.value })
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">Item type</span>
              <Select
                value={admin.createForm.item_type_id}
                onChange={(e) =>
                  admin.setCreateForm({ ...admin.createForm, item_type_id: Number(e.target.value) })
                }
                required
              >
                <option value={0}>Chọn item type</option>
                {admin.itemTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.name_vi}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">Category</span>
              <Select
                value={admin.createForm.category_id}
                onChange={(e) =>
                  admin.setCreateForm({ ...admin.createForm, category_id: Number(e.target.value) })
                }
                required
              >
                <option value={0}>Chọn category</option>
                {admin.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.category_name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">Base UOM</span>
              <Select
                value={admin.createForm.base_uom_id}
                onChange={(e) =>
                  admin.setCreateForm({ ...admin.createForm, base_uom_id: Number(e.target.value) })
                }
                required
              >
                <option value={0}>Chọn UOM</option>
                {admin.uoms.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} — {u.uom_name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={admin.createForm.is_lot_tracked}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, is_lot_tracked: e.target.checked })
                  }
                />
                <span>Lot tracked</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={admin.createForm.is_serial_tracked}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, is_serial_tracked: e.target.checked })
                  }
                />
                <span>Serial tracked</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={admin.createForm.is_phantom}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, is_phantom: e.target.checked })
                  }
                />
                <span>Phantom (BOM only)</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-650 focus:ring-blue-500 cursor-pointer"
                  checked={admin.createForm.is_active}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, is_active: e.target.checked })
                  }
                />
                <span>Active</span>
              </label>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 mt-2">
            <Button
              type="submit"
              disabled={admin.createErrors.length > 0 || admin.createPending}
            >
              {admin.createPending ? 'Đang tạo…' : 'Tạo'}
            </Button>
            <Button type="button" variant="secondary" onClick={admin.closeCreate}>
              Hủy
            </Button>
          </div>
          {admin.createError ? (
            <p className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-600 border border-red-200 dark:border-red-900" role="alert">
              {admin.createError.code}: {admin.createError.message}
            </p>
          ) : null}
        </form>
      ) : null}

      {banner ? (
        <p className="p-4 rounded bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300" role={admin.listState === 'error' ? 'alert' : 'status'}>
          {banner}
          {admin.listError ? ` (${admin.listError.code})` : ''}
        </p>
      ) : null}

      {admin.listState === 'ready' ? (
        <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <Table containerClassName="relative w-full overflow-auto">
            <TableHeader>
              <TableRow className="pointer-events-none hover:bg-transparent">
                <TableHead>Code</TableHead>
                <TableHead>Tên item</TableHead>
                <TableHead>Item type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Base UOM</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedItems.map((row) => (
                <TableRow
                  key={row.code}
                  className={row.code === admin.selectedCode ? 'bg-blue-50/50 dark:bg-slate-800/80' : ''}
                  onClick={() => {
                    admin.selectItem(row.code)
                    setIsDetailOpen(true)
                  }}
                >
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-0 py-0 h-auto font-semibold hover:underline"
                      onClick={(e) => {
                        e.stopPropagation()
                        admin.selectItem(row.code)
                        setIsDetailOpen(true)
                      }}
                    >
                      {row.code}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium text-slate-800 dark:text-slate-200">{row.itemName}</TableCell>
                  <TableCell>{row.itemTypeLabel}</TableCell>
                  <TableCell>{row.categoryLabel}</TableCell>
                  <TableCell>{row.baseUomLabel}</TableCell>
                  <TableCell>
                    <Badge variant={row.isActive ? 'active' : 'inactive'}>
                      {row.isActive ? 'Có' : 'Không'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10">
            <div className="flex-1">
              {admin.hasMore && (
                <Button variant="secondary" size="sm" onClick={admin.loadMore}>
                  Nạp thêm từ Server
                </Button>
              )}
            </div>
            
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
      ) : null}

      {/* Reusable Dialog wrapper */}
      <Dialog
        isOpen={isDetailOpen && !!admin.detail}
        onClose={() => setIsDetailOpen(false)}
        title="Chi tiết sản phẩm / vật tư"
        maxWidth="max-w-2xl"
      >
        {admin.detailLoading ? (
          <div className="p-12 text-center text-sm text-slate-500 font-sans">Đang tải chi tiết…</div>
        ) : admin.detail ? (
          <ItemEditor
            key={admin.detail.code}
            detail={admin.detail}
            admin={admin}
            onClose={() => setIsDetailOpen(false)}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        isOpen={isConfirmCreateOpen}
        onClose={() => setIsConfirmCreateOpen(false)}
        title="Xác nhận tạo mới Item"
        description="Bạn đang chuẩn bị thêm một vật tư/sản phẩm mới vào hệ thống. Vui lòng xác nhận thông tin dưới đây."
        summary={{
          'Mã item': admin.createForm.code,
          'Tên item': admin.createForm.item_name,
          'Item Type': admin.itemTypes.find((t) => t.id === admin.createForm.item_type_id)?.code ?? admin.createForm.item_type_id,
          'Category': admin.categories.find((c) => c.id === admin.createForm.category_id)?.code ?? admin.createForm.category_id,
          'UOM': admin.uoms.find((u) => u.id === admin.createForm.base_uom_id)?.code ?? admin.createForm.base_uom_id,
          'Lot Tracked': admin.createForm.is_lot_tracked ? 'Có' : 'Không',
          'Serial Tracked': admin.createForm.is_serial_tracked ? 'Có' : 'Không',
          'Phantom': admin.createForm.is_phantom ? 'Có' : 'Không',
          'Active': admin.createForm.is_active ? 'Có' : 'Không',
        }}
        onConfirm={() => {
          setIsConfirmCreateOpen(false)
          admin.create()
        }}
      />
    </section>
  )
}
