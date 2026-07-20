import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { useBinLocation } from '../hooks/useBinLocation'
import type { LocationRecord } from '../types/binLocation'
import { usePagination } from '@/shared/lib/usePagination'
import { TablePagination } from '@/shared/components/ui/TablePagination'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { Dialog } from '@/shared/components/ui/Dialog'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Input, Select } from '@/shared/components/ui/Input'
import { Search, MapPin, FilterX } from 'lucide-react'
import { FilterBar } from '@/shared/components/ui/FilterBar'

import './LocationMasterPage.css'

type Api = ReturnType<typeof useBinLocation>

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải danh mục location…'
    case 'empty':
      return 'Chưa có location nào.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem danh mục location.'
    case 'error':
      return 'Không tải được danh mục location. Thử lại sau.'
    default:
      return ''
  }
}

type TreeNode = {
  item: LocationRecord
  children: TreeNode[]
}

function buildTree(items: LocationRecord[]): TreeNode[] {
  const map = new Map<number, TreeNode>()
  const roots: TreeNode[] = []

  for (const item of items) {
    map.set(item.id, { item, children: [] })
  }

  for (const item of items) {
    const node = map.get(item.id)!
    if (item.parent_location_id && map.has(item.parent_location_id)) {
      map.get(item.parent_location_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

function getDescendantIds(nodeId: number, items: LocationRecord[]): Set<number> {
  const ids = new Set<number>([nodeId])
  let added = true
  while (added) {
    added = false
    for (const item of items) {
      if (item.parent_location_id && ids.has(item.parent_location_id) && !ids.has(item.id)) {
        ids.add(item.id)
        added = true
      }
    }
  }
  return ids
}

function LocationTreeItem({
  node,
  selectedCode,
  selectedTreeId,
  onSelectTree,
  onSelectCode,
  expandedIds,
  toggleExpand,
}: {
  node: TreeNode
  selectedCode: string | null
  selectedTreeId: number | null
  onSelectTree: (id: number | null) => void
  onSelectCode: (code: string) => void
  expandedIds: Set<number>
  toggleExpand: (id: number) => void
}) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.item.id)
  const isSelected = selectedTreeId === node.item.id || selectedCode === node.item.code

  return (
    <div className="location-tree-node">
      <div className={`location-tree-item ${isSelected ? 'location-tree-item--active' : ''}`}>
        {hasChildren ? (
          <button
            type="button"
            className="location-tree-toggle"
            onClick={(e) => {
              e.stopPropagation()
              toggleExpand(node.item.id)
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        ) : (
          <span className="location-tree-spacer" />
        )}
        <button
          type="button"
          className="location-tree-label"
          onClick={() => {
            onSelectTree(node.item.id)
            onSelectCode(node.item.code)
          }}
        >
          <span className="location-tree-code">{node.item.code}</span>
          <span className="location-tree-name"> — {node.item.location_name}</span>
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div className="location-tree-children">
          {node.children.map((child) => (
            <LocationTreeItem
              key={child.item.id}
              node={child}
              selectedCode={selectedCode}
              selectedTreeId={selectedTreeId}
              onSelectTree={onSelectTree}
              onSelectCode={onSelectCode}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LocationEditor({ detail, admin }: { detail: LocationRecord; admin: Api }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'edit'>('overview')
  const [locationName, setLocationName] = useState(detail.location_name)
  const [locationTypeId, setLocationTypeId] = useState(detail.location_type_id)
  const [parentLocationId, setParentLocationId] = useState<number | null>(
    detail.parent_location_id ?? null,
  )
  const [warehouseCategoryId, setWarehouseCategoryId] = useState<number | null>(
    detail.warehouse_category_id ?? null,
  )
  const [barcode, setBarcode] = useState(detail.barcode ?? '')
  const [capacityQty, setCapacityQty] = useState(
    detail.capacity_qty == null ? '' : String(detail.capacity_qty),
  )
  const [capacityUomId, setCapacityUomId] = useState<number | null>(
    detail.capacity_uom_id ?? null,
  )

  // Local confirmations
  const [isConfirmEditOpen, setIsConfirmEditOpen] = useState(false)
  const [isConfirmDeactivateOpen, setIsConfirmDeactivateOpen] = useState(false)

  const row = admin.detailRow
  const typeCode =
    admin.locationTypes.find((t) => t.id === detail.location_type_id)?.code ?? '-'

  return (
    <div className="location-master__detail space-y-4" aria-label="Chi tiết location">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Tổng quan
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'edit'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('edit')}
        >
          Chỉnh sửa & Cấu hình
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Header Info Card */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
              <MapPin size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{detail.code}</h4>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                  detail.is_active 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50' 
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50'
                }`}>
                  {detail.is_active ? 'Hoạt động' : 'Tạm ngưng'}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">{detail.location_name}</p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
              <span className="block text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Loại vị trí</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{typeCode}</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
              <span className="block text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Cấp bậc (Level)</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{detail.level}</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 col-span-1 sm:col-span-2">
              <span className="block text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Đường dẫn cấu trúc (Path)</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono break-all">{detail.path}</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
              <span className="block text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Vị trí cha</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row?.parentLabel ?? '-'}</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
              <span className="block text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Danh mục kho</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row?.warehouseCategoryLabel ?? '-'}</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
              <span className="block text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Sức chứa tối đa</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {detail.capacity_qty ? `${detail.capacity_qty} ${admin.capacityUoms.find((u) => u.id === detail.capacity_uom_id)?.code ?? ''}` : 'Không giới hạn'}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
              <span className="block text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Mã vạch (Barcode)</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">{detail.barcode ?? '-'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tên vị trí *</span>
              <input 
                type="text"
                className="w-full min-h-[40px] px-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={locationName} 
                onChange={(e) => setLocationName(e.target.value)} 
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Loại vị trí *</span>
              <Select
                value={locationTypeId}
                onChange={(e) => setLocationTypeId(Number(e.target.value))}
              >
                {admin.locationTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.name_vi}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Vị trí cha</span>
              <Select
                value={parentLocationId ?? 0}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setParentLocationId(v > 0 ? v : null)
                }}
              >
                <option value={0}>— Root (không có parent) —</option>
                {admin.parentOptions
                  .filter((p) => p.code !== detail.code)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.location_name}
                    </option>
                  ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Phân nhóm (Warehouse category)</span>
              <Select
                value={warehouseCategoryId ?? 0}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setWarehouseCategoryId(v > 0 ? v : null)
                }}
              >
                <option value={0}>— Không —</option>
                {admin.warehouseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name_vi}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Mã vạch (Barcode)</span>
              <input 
                type="text"
                className="w-full min-h-[40px] px-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                value={barcode} 
                onChange={(e) => setBarcode(e.target.value)} 
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Sức chứa tối đa</span>
              <input
                type="text"
                inputMode="decimal"
                className="w-full min-h-[40px] px-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={capacityQty}
                onChange={(e) => setCapacityQty(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Đơn vị sức chứa (Capacity UoM)</span>
              <Select
                value={capacityUomId ?? 0}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setCapacityUomId(v > 0 ? v : null)
                }}
              >
                <option value={0}>— Không —</option>
                {admin.capacityUoms.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} — {u.uom_name}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          {/* Form Feedback & Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md text-sm font-semibold transition-all cursor-pointer text-slate-700 dark:text-slate-300"
                onClick={() => admin.selectLocation(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
                disabled={!row?.canUpdate || admin.updatePending}
                onClick={() => setIsConfirmEditOpen(true)}
              >
                {admin.updatePending ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
            
            {!row?.canUpdate && (
              <p className="text-xs text-rose-500 mt-1">
                Chỉnh sửa không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
              </p>
            )}
            {admin.updateError && (
              <p className="text-xs text-rose-500 mt-1" role="alert">
                Lỗi: {admin.updateError.message}
              </p>
            )}
            {admin.updateSuccess && (
              <p className="text-xs text-emerald-600 mt-1" role="status">
                Đã cập nhật thông tin vị trí thành công.
              </p>
            )}
          </div>

          {/* Danger Zone (Deactivation) */}
          <div className="pt-6 mt-6 border-t border-rose-100 dark:border-rose-950/30">
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-400">Ngừng hoạt động vị trí</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Hành động này sẽ tạm dừng hoạt động của vị trí kho. Vị trí này sẽ không khả dụng để chứa hàng hóa hoặc vật tư.
                </p>
              </div>
              <div className="flex justify-start">
                <button
                  type="button"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
                  disabled={!row?.canDeactivate}
                  onClick={() => setIsConfirmDeactivateOpen(true)}
                >
                  Ngừng hoạt động (Deactivate)
                </button>
              </div>
              {!row?.canDeactivate && (
                <p className="text-xs text-slate-400">
                  Ngừng hoạt động không khả dụng{row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
                </p>
              )}
              {admin.deactivateError && (
                <p className="text-xs text-rose-500" role="alert">
                  Lỗi: {admin.deactivateError.message}
                </p>
              )}
              {admin.deactivateState === 'success' && (
                <p className="text-xs text-rose-600" role="status">
                  Đã ngừng hoạt động vị trí này.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isConfirmEditOpen}
        onClose={() => setIsConfirmEditOpen(false)}
        title="Xác nhận lưu thay đổi Vị trí"
        description={`Bạn đang thay đổi cấu hình cho vị trí ${detail.code}.`}
        summary={{
          'Tên vị trí': locationName.trim(),
          'Loại vị trí': admin.locationTypes.find((t) => t.id === locationTypeId)?.code ?? locationTypeId,
          'Vị trí cha': admin.parentOptions.find((p) => p.id === parentLocationId)?.code ?? 'Root',
          'Danh mục kho': admin.warehouseCategories.find((c) => c.id === warehouseCategoryId)?.code ?? 'Không',
          'Mã vạch (Barcode)': barcode.trim() || 'Không',
          'Sức chứa tối đa': capacityQty.trim() ? `${capacityQty} ${admin.capacityUoms.find((u) => u.id === capacityUomId)?.code ?? ''}` : 'Không',
        }}
        onConfirm={() => {
          setIsConfirmEditOpen(false)
          admin.saveEdit({
            location_name: locationName.trim(),
            location_type_id: locationTypeId,
            parent_location_id: parentLocationId,
            warehouse_category_id: warehouseCategoryId,
            barcode: barcode.trim() === '' ? null : barcode.trim(),
            capacity_qty: capacityQty.trim() === '' ? null : Number(capacityQty),
            capacity_uom_id: capacityUomId,
          })
        }}
      />

      <ConfirmDialog
        isOpen={isConfirmDeactivateOpen}
        onClose={() => setIsConfirmDeactivateOpen(false)}
        title={`Xác nhận dừng hoạt động vị trí ${detail.code}`}
        description="Ngừng hoạt động vị trí kho/shopfloor. Vị trí này sẽ không khả dụng để chứa hàng."
        type="reason-required"
        confirmText="Ngừng hoạt động"
        isPending={admin.deactivateState === 'pending'}
        onConfirm={(reason) => {
          setIsConfirmDeactivateOpen(false)
          // We trigger the hook mutation (which ignores payload but enforces reason on UI)
          admin.deactivate()
        }}
      />
    </div>
  )
}

export function LocationMasterPage() {
  const admin = useBinLocation()
  const banner = listStateMessage(admin.listState)

  const [selectedTreeId, setSelectedTreeId] = useState<number | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  // Local confirmations
  const [isConfirmCreateOpen, setIsConfirmCreateOpen] = useState(false)

  // Build recursive tree nodes
  const treeNodes = useMemo(() => buildTree(admin.treeRoots), [admin.treeRoots])

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Find all descendant IDs of selectedTreeId to filter the table
  const descendantIds = useMemo(() => {
    if (!selectedTreeId) return null
    return getDescendantIds(selectedTreeId, admin.treeRoots)
  }, [selectedTreeId, admin.treeRoots])

  // Filter rows by tree selection
  const filteredRows = useMemo(() => {
    if (!descendantIds) return admin.rows
    return admin.rows.filter((row) => {
      const item = admin.parentOptions.find((p) => p.code === row.code)
      return item && descendantIds.has(item.id)
    })
  }, [descendantIds, admin.rows, admin.parentOptions])

  // Paginate rows
  const pagination = usePagination(filteredRows, 10)

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsConfirmCreateOpen(true)
  }

  return (
    <section className="location-master flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'WMS' },
          { label: 'Locations' },
        ]}
        title="Location Master"
        subtitle="Quản lý cây vị trí kho và phân xưởng sản xuất."
        actions={<Button onClick={admin.openCreate}>Tạo location</Button>}
      />

      <FilterBar
        fields={[
          {
            name: 'searchInput',
            type: 'text',
            placeholder: 'Tìm theo mã / tên vị trí...'
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
        className="max-w-md"
      />

      <Dialog
        isOpen={admin.showCreate}
        onClose={admin.closeCreate}
        title="Tạo location mới"
        maxWidth="max-w-[50%]"
      >
        <form className="flex flex-col gap-4 font-sans text-sm text-[var(--text-primary)]" onSubmit={handleCreateSubmit}>
          <p className="text-xs text-[var(--text-secondary)]">
            Form luôn hiển thị — server enforce quyền tạo (WMS01-003). Manager assignment bỏ trống
            (nullable; không có user-id lookup trên surface này).
          </p>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Code</span>
              <Input
                value={admin.createForm.code}
                onChange={(e) => admin.setCreateForm({ ...admin.createForm, code: e.target.value })}
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Tên location</span>
              <Input
                value={admin.createForm.location_name}
                onChange={(e) =>
                  admin.setCreateForm({ ...admin.createForm, location_name: e.target.value })
                }
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Location type</span>
              <Select
                value={admin.createForm.location_type_id}
                onChange={(e) =>
                  admin.setCreateForm({
                    ...admin.createForm,
                    location_type_id: Number(e.target.value),
                  })
                }
                required
              >
                <option value={0}>Chọn location type</option>
                {admin.locationTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.name_vi}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Parent location</span>
              <Select
                value={admin.createForm.parent_location_id ?? 0}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  admin.setCreateForm({
                    ...admin.createForm,
                    parent_location_id: v > 0 ? v : null,
                  })
                }}
              >
                <option value={0}>— Root —</option>
                {admin.parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.location_name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Warehouse category</span>
              <Select
                value={admin.createForm.warehouse_category_id ?? 0}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  admin.setCreateForm({
                    ...admin.createForm,
                    warehouse_category_id: v > 0 ? v : null,
                  })
                }}
              >
                <option value={0}>— Không —</option>
                {admin.warehouseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name_vi}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Barcode</span>
              <Input
                value={admin.createForm.barcode ?? ''}
                onChange={(e) =>
                  admin.setCreateForm({
                    ...admin.createForm,
                    barcode: e.target.value,
                  })
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Capacity qty</span>
              <Input
                inputMode="decimal"
                value={
                  admin.createForm.capacity_qty == null ? '' : String(admin.createForm.capacity_qty)
                }
                onChange={(e) =>
                  admin.setCreateForm({
                    ...admin.createForm,
                    capacity_qty: e.target.value.trim() === '' ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Capacity UoM</span>
              <Select
                value={admin.createForm.capacity_uom_id ?? 0}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  admin.setCreateForm({
                    ...admin.createForm,
                    capacity_uom_id: v > 0 ? v : null,
                  })
                }}
              >
                <option value={0}>— Không —</option>
                {admin.capacityUoms.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} — {u.uom_name}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <label className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              checked={admin.createForm.is_active}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, is_active: e.target.checked })
              }
            />
            <span>Active</span>
          </label>
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
            <Button
              type="button"
              variant="secondary"
              onClick={admin.closeCreate}
            >
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
            <p className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] text-xs" role="alert">
              {admin.createError.code}: {admin.createError.message}
            </p>
          ) : null}
        </form>
      </Dialog>

      {banner && admin.listState !== 'loading' ? (
        <p
          className="location-master__state"
          role={admin.listState === 'error' ? 'alert' : 'status'}
        >
          {banner}
          {admin.listError ? ` (${admin.listError.code})` : ''}
        </p>
      ) : null}

      {(admin.listState === 'ready' || admin.listState === 'loading') ? (
        <div className="location-master__workspace">
          {/* Left Column: Location Tree */}
          <aside className="location-master__tree-column">
            <div className="location-master__tree-header">
              <h4>Cây sơ đồ kho</h4>
              {selectedTreeId && (
                <button
                  type="button"
                  className="location-master__clear-tree-btn flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  onClick={() => setSelectedTreeId(null)}
                  title="Xóa bộ lọc"
                  aria-label="Xóa bộ lọc"
                >
                  <FilterX size={14} />
                </button>
              )}
            </div>
            <div className="location-master__tree-content">
              {treeNodes.length > 0 ? (
                treeNodes.map((node) => (
                  <LocationTreeItem
                    key={node.item.id}
                    node={node}
                    selectedCode={admin.selectedCode}
                    selectedTreeId={selectedTreeId}
                    onSelectTree={setSelectedTreeId}
                    onSelectCode={admin.selectLocation}
                    expandedIds={expandedIds}
                    toggleExpand={toggleExpand}
                  />
                ))
              ) : (
                <p className="location-master__muted">Không có dữ liệu cây sơ đồ.</p>
              )}
            </div>
          </aside>

          {/* Middle Column: Bảng Locations */}
          <div className="location-master__table-column">
            <div className="location-master__table-wrap">
              <table className="location-master__table">
                <thead>
                  <tr>
                    <th>Mã vị trí</th>
                    <th>Tên vị trí</th>
                    <th>Loại vị trí</th>
                    <th>Vị trí cha</th>
                    <th>Phân nhóm</th>
                    <th>Cấp bậc</th>
                    <th>Hoạt động</th>
                  </tr>
                </thead>
                <tbody>
                  {admin.listState === 'loading' ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="pointer-events-none hover:bg-transparent">
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[70%] my-1" /></td>
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[80%] my-1" /></td>
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[60%] my-1" /></td>
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[50%] my-1" /></td>
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[70%] my-1" /></td>
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[30%] my-1" /></td>
                        <td><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-[40%] my-1" /></td>
                      </tr>
                    ))
                  ) : pagination.paginatedItems.map((row) => (
                    <tr
                      key={row.code}
                      className={row.code === admin.selectedCode ? 'location-master__row--active' : ''}
                      onClick={() => admin.selectLocation(row.code)}
                    >
                      <td>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {row.code}
                        </span>
                      </td>
                      <td>{row.locationName}</td>
                      <td>{row.locationTypeLabel}</td>
                      <td>{row.parentLabel}</td>
                      <td>{row.warehouseCategoryLabel}</td>
                      <td>{row.level}</td>
                      <td>
                        <span className={`location-master__status-badge ${row.isActive ? 'active' : 'inactive'}`}>
                          {row.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <TablePagination
                {...pagination}
                hasMore={admin.hasMore}
                onLoadMore={admin.loadMore}
                sticky
              />
            </div>
          </div>
        </div>
      ) : null}

      <Dialog
        isOpen={!!admin.selectedCode}
        onClose={() => admin.selectLocation(null)}
        title={`Thông tin chi tiết Vị trí: ${admin.selectedCode ?? ''}`}
      >
        {admin.detailLoading ? (
          <div className="location-master__state">Đang tải chi tiết…</div>
        ) : admin.detail ? (
          <LocationEditor key={admin.detail.code} detail={admin.detail} admin={admin} />
        ) : (
          <div className="location-master__state">Không tìm thấy thông tin vị trí.</div>
        )}
      </Dialog>

      <ConfirmDialog
        isOpen={isConfirmCreateOpen}
        onClose={() => setIsConfirmCreateOpen(false)}
        title="Xác nhận tạo vị trí mới"
        description="Vui lòng xác nhận các thông tin thiết lập cho vị trí mới."
        summary={{
          'Mã vị trí (Code)': admin.createForm.code,
          'Tên vị trí': admin.createForm.location_name,
          'Loại vị trí': admin.locationTypes.find((t) => t.id === admin.createForm.location_type_id)?.code ?? admin.createForm.location_type_id,
          'Vị trí cha': admin.parentOptions.find((p) => p.id === admin.createForm.parent_location_id)?.code ?? 'Root',
          'Danh mục kho': admin.warehouseCategories.find((c) => c.id === admin.createForm.warehouse_category_id)?.code ?? 'Không',
          'Mã vạch (Barcode)': admin.createForm.barcode || 'Không',
          'Sức chứa tối đa': admin.createForm.capacity_qty ? `${admin.createForm.capacity_qty} ${admin.capacityUoms.find((u) => u.id === admin.createForm.capacity_uom_id)?.code ?? ''}` : 'Không',
        }}
        isPending={admin.createPending}
        onConfirm={() => {
          setIsConfirmCreateOpen(false)
          admin.create()
        }}
      />
    </section>
  )
}
