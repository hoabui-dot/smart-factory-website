import { useState } from 'react'
import { Link } from 'react-router'

import { useItemMaster } from '../hooks/useItemMaster'
import type { ItemRecord, ItemRow } from '../types/itemMaster'
import { usePagination } from '@/shared/lib/usePagination'
import { GenericDataTable, ColumnDef } from '@/shared/components/ui/DataTable'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'

// Import Tailwind Shadcn UI components
import { Button } from '@/shared/components/ui/Button'
import { Input, Select } from '@/shared/components/ui/Input'
import { Badge } from '@/shared/components/ui/Badge'
import { Dialog } from '@/shared/components/ui/Dialog'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Search, Package, MapPin } from 'lucide-react'
import { FilterBar } from '@/shared/components/ui/FilterBar'

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
  detail: NonNullable<Api['detail']>
  admin: Api
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'edit'>('overview')
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
    <div className="flex flex-col gap-4 font-sans text-sm">
      {/* Tabs Header */}
      <div className="flex border-b border-[var(--border-default)] mb-6">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Tổng quan
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'edit'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => setActiveTab('edit')}
        >
          Chỉnh sửa & Cấu hình
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Header Info Card */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-default)]">
            <div className="p-3 bg-[var(--color-action-primary)]/10 text-[var(--color-action-primary)] rounded-lg">
              <Package size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{detail.code}</h4>
                <Badge variant={detail.is_active ? 'active' : 'inactive'}>
                  {detail.is_active ? 'Hoạt động' : 'Tạm ngưng'}
                </Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] truncate mt-1">{detail.item_name}</p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)]">
              <span className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Loại vật tư</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">{detail.item_type_code ?? '-'}</span>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)]">
              <span className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Phân nhóm (Category)</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">{detail.category_code ?? '-'}</span>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)]">
              <span className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Đơn vị tính cơ bản</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">{detail.base_uom_code ?? '-'}</span>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)]">
              <span className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Phiên bản hiện tại (Revision)</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">{detail.current_revision_code ?? '-'}</span>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)]">
              <span className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Hạn bảo quản (Shelf life)</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {detail.shelf_life_days ? `${detail.shelf_life_days} ngày` : 'Không giới hạn'}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)]">
              <span className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Phương thức quản lý</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {isLotTracked && <Badge variant="default">Lot tracked</Badge>}
                {isSerialTracked && <Badge variant="default">Serial tracked</Badge>}
                {isPhantom && <Badge variant="default">Phantom</Badge>}
                {!isLotTracked && !isSerialTracked && !isPhantom && <span className="text-sm text-[var(--text-secondary)]">Bình thường</span>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Tên vật tư *</span>
              <Input 
                value={itemName} 
                onChange={(e) => setItemName(e.target.value)} 
                className="bg-[var(--surface-2)] border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Loại vật tư *</span>
              <Select 
                value={itemTypeId} 
                onChange={(e) => setItemTypeId(Number(e.target.value))}
                className="bg-[var(--surface-2)] border-[var(--border-default)] text-[var(--text-primary)]"
              >
                {admin.itemTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.name_vi}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Phân nhóm *</span>
              <Select 
                value={categoryId} 
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="bg-[var(--surface-2)] border-[var(--border-default)] text-[var(--text-primary)]"
              >
                {admin.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.category_name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Hạn bảo quản (ngày)</span>
              <Input
                inputMode="numeric"
                value={shelfLifeDays}
                onChange={(e) => setShelfLifeDays(e.target.value)}
                placeholder="Bỏ trống nếu không giới hạn"
                className="bg-[var(--surface-2)] border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </label>

            <div className="flex flex-col gap-2.5 col-span-1 sm:col-span-2 mt-2">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Cấu hình theo dõi</span>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--color-action-primary)] focus:ring-[var(--color-action-primary)] cursor-pointer"
                    checked={isLotTracked}
                    onChange={(e) => setIsLotTracked(e.target.checked)}
                  />
                  <span>Lot tracked</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--color-action-primary)] focus:ring-[var(--color-action-primary)] cursor-pointer"
                    checked={isSerialTracked}
                    onChange={(e) => setIsSerialTracked(e.target.checked)}
                  />
                  <span>Serial tracked</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--color-action-primary)] focus:ring-[var(--color-action-primary)] cursor-pointer"
                    checked={isPhantom}
                    onChange={(e) => setIsPhantom(e.target.checked)}
                  />
                  <span>Phantom (BOM only)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Form Feedback & Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border-default)]">
            <div className="flex items-center gap-2 justify-end">
              <Button variant="secondary" type="button" onClick={onClose}>
                Hủy
              </Button>
              <Button
                type="button"
                disabled={!row?.canUpdate || admin.updatePending}
                title={row?.updateDisabledReason ?? undefined}
                onClick={() => setIsConfirmEditOpen(true)}
              >
                {admin.updatePending ? 'Đang lưu…' : 'Lưu thay đổi'}
              </Button>
            </div>
            
            {!row?.canUpdate && (
              <p className="text-xs text-[var(--color-danger-text)] mt-1">
                Chỉnh sửa không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
              </p>
            )}
            {admin.updateError && (
              <p className="text-xs text-[var(--color-danger-text)] mt-1" role="alert">
                Lỗi: {admin.updateError.message}
              </p>
            )}
            {admin.updateSuccess && (
              <p className="text-xs text-[var(--color-success-text)] mt-1" role="status">
                Đã cập nhật thông tin vật tư thành công.
              </p>
            )}
          </div>

          {/* Danger Zone (Deactivation) */}
          <div className="pt-6 mt-6 border-t border-[var(--border-default)]">
            <div className="p-4 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-bg)] space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-danger-text)]">Ngừng hoạt động vật tư</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Hành động này sẽ tạm dừng hoạt động của vật tư này. Vật tư này sẽ không khả dụng để lập lệnh sản xuất hay tạo BOM.
                </p>
              </div>
              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="danger"
                  disabled={!row?.canDeactivate}
                  title={row?.deactivateDisabledReason ?? undefined}
                  onClick={() => setIsConfirmDeactivateOpen(true)}
                >
                  Ngừng hoạt động (Deactivate)
                </Button>
              </div>
              {!row?.canDeactivate && (
                <p className="text-xs text-[var(--text-muted)]">
                  Ngừng hoạt động không khả dụng{row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
                </p>
              )}
              {admin.deactivateError && (
                <p className="text-xs text-[var(--color-danger-text)]" role="alert">
                  Lỗi: {admin.deactivateError.message}
                </p>
              )}
              {admin.deactivateState === 'success' && (
                <p className="text-xs text-[var(--color-danger-text)]" role="status">
                  Đã ngừng hoạt động vật tư này.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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

  const columns: ColumnDef<ItemRow>[] = [
    {
      header: 'Mã vật tư',
      cell: (row) => (
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
      ),
    },
    {
      header: 'Tên vật tư',
      cell: (row) => <span className="font-medium text-slate-800 dark:text-slate-200">{row.itemName}</span>,
    },
    {
      header: 'Loại vật tư',
      cell: (row) => row.itemTypeLabel,
    },
    {
      header: 'Phân nhóm',
      cell: (row) => row.categoryLabel,
    },
    {
      header: 'Đơn vị tính cơ bản',
      cell: (row) => row.baseUomLabel,
    },
    {
      header: 'Hoạt động',
      cell: (row) => (
        <Badge variant={row.isActive ? 'active' : 'inactive'}>
          {row.isActive ? 'Có' : 'Không'}
        </Badge>
      ),
    },
  ]

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
        actions={
          <div className="flex gap-2">
            {admin.hasMore && (
              <Button variant="secondary" size="sm" onClick={admin.loadMore}>
                Nạp thêm từ Server
              </Button>
            )}
            <Button size="sm" onClick={admin.openCreate}>
              Tạo item
            </Button>
          </div>
        }
      />

      <FilterBar
        fields={[
          {
            name: 'searchInput',
            type: 'text',
            placeholder: 'Tìm theo mã / tên mặt hàng...'
          }
        ]}
        values={{ searchInput: admin.searchInput }}
        onChange={(_, val) => admin.setSearchInput(val)}
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
        onReset={() => {
          admin.setSearchInput('')
          admin.applySearch()
        }}
        isResetActive={!!admin.searchInput}
        className="max-w-lg"
      />

      <Dialog
        isOpen={admin.showCreate}
        onClose={admin.closeCreate}
        title="Tạo item mới"
        maxWidth="max-w-[75%]"
      >
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            setIsConfirmCreateOpen(true)
          }}
        >
          <p className="text-xs text-[var(--text-secondary)]">
            Form luôn hiển thị — server enforce quyền tạo (MES01-003).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Code</span>
              <Input
                value={admin.createForm.code}
                onChange={(e) => admin.setCreateForm({ ...admin.createForm, code: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Tên item</span>
              <Input
                value={admin.createForm.item_name}
                onChange={(e) =>
                  admin.setCreateForm({ ...admin.createForm, item_name: e.target.value })
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Item type</span>
              <Select
                value={admin.createForm.item_type_id}
                onChange={(e) =>
                  admin.setCreateForm({ ...admin.createForm, item_type_id: Number(e.target.value) })
                }
                required
                direction="up"
              >
                <option value={0}>Chọn item type</option>
                {admin.itemTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.name_vi}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Category</span>
              <Select
                value={admin.createForm.category_id}
                onChange={(e) =>
                  admin.setCreateForm({ ...admin.createForm, category_id: Number(e.target.value) })
                }
                required
                direction="up"
              >
                <option value={0}>Chọn category</option>
                {admin.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.category_name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Base UOM</span>
              <Select
                value={admin.createForm.base_uom_id}
                onChange={(e) =>
                  admin.setCreateForm({ ...admin.createForm, base_uom_id: Number(e.target.value) })
                }
                required
                direction="up"
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
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--color-action-primary)] focus:ring-[var(--color-action-primary)] cursor-pointer"
                  checked={admin.createForm.is_lot_tracked}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, is_lot_tracked: e.target.checked })
                  }
                />
                <span>Lot tracked</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--color-action-primary)] focus:ring-[var(--color-action-primary)] cursor-pointer"
                  checked={admin.createForm.is_serial_tracked}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, is_serial_tracked: e.target.checked })
                  }
                />
                <span>Serial tracked</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--color-action-primary)] focus:ring-[var(--color-action-primary)] cursor-pointer"
                  checked={admin.createForm.is_phantom}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, is_phantom: e.target.checked })
                  }
                />
                <span>Phantom (BOM only)</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--color-action-primary)] focus:ring-[var(--color-action-primary)] cursor-pointer"
                  checked={admin.createForm.is_active}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, is_active: e.target.checked })
                  }
                />
                <span>Active</span>
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border-default)] pt-4 mt-2">
            <Button type="button" variant="secondary" onClick={admin.closeCreate}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={admin.createErrors.length > 0 || admin.createPending}
            >
              {admin.createPending ? 'Đang tạo…' : 'Tạo'}
            </Button>
          </div>
          {admin.createError ? (
            <p className="text-sm text-[var(--color-danger-text)] mt-2" role="alert">
              {admin.createError.code}: {admin.createError.message}
            </p>
          ) : null}
        </form>
      </Dialog>

      {banner && admin.listState !== 'loading' ? (
        <p className="p-4 rounded bg-[var(--surface-2)] border border-[var(--border-default)] text-sm text-[var(--text-secondary)]" role={admin.listState === 'error' ? 'alert' : 'status'}>
          {banner}
          {admin.listError ? ` (${admin.listError.code})` : ''}
        </p>
      ) : null}

      {(admin.listState === 'ready' || admin.listState === 'loading') ? (
        <GenericDataTable
          data={pagination.paginatedItems}
          columns={columns}
          pagination={pagination}
          isLoading={admin.listState === 'loading'}
          onRowClick={(row) => {
            admin.selectItem(row.code)
            setIsDetailOpen(true)
          }}
          getRowClassName={(row) => row.code === admin.selectedCode ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]' : ''}
        />
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
