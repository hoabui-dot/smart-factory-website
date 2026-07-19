import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { useBinLocation } from '../hooks/useBinLocation'
import type { LocationRecord } from '../types/binLocation'
import { usePagination } from '@/shared/lib/usePagination'
import { DataTablePagination } from '@/shared/components/DataTablePagination'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Search } from 'lucide-react'

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
    <aside className="location-master__detail" aria-label="Chi tiết location">
      <div className="location-master__detail-header">
        <h3>{detail.code}</h3>
        <p className="location-master__muted">
          {detail.location_name} · {typeCode}
        </p>
      </div>

      <div className="location-master__detail-section">
        <h4 className="location-master__detail-title">Thông tin chung</h4>
        <dl className="location-master__meta">
          <div>
            <dt>Level</dt>
            <dd>{detail.level}</dd>
          </div>
          <div>
            <dt>Path</dt>
            <dd>{detail.path}</dd>
          </div>
          <div>
            <dt>Parent</dt>
            <dd>{row?.parentLabel ?? '-'}</dd>
          </div>
          <div>
            <dt>Warehouse category</dt>
            <dd>{row?.warehouseCategoryLabel ?? '-'}</dd>
          </div>
          <div>
            <dt>Manager</dt>
            <dd>{detail.manager_user_id == null ? '-' : 'Assigned'}</dd>
          </div>
          <div>
            <dt>Trạng thái</dt>
            <dd>
              <span className={`location-master__status-badge ${detail.is_active ? 'active' : 'inactive'}`}>
                {detail.is_active ? 'Active' : 'Inactive'}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="location-master__detail-section">
        <h4 className="location-master__detail-title">Chỉnh sửa thông tin</h4>
        <label className="location-master__field">
          <span>Tên location</span>
          <input value={locationName} onChange={(e) => setLocationName(e.target.value)} />
        </label>
        <label className="location-master__field">
          <span>Location type</span>
          <select
            value={locationTypeId}
            onChange={(e) => setLocationTypeId(Number(e.target.value))}
          >
            {admin.locationTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} — {t.name_vi}
              </option>
            ))}
          </select>
        </label>
        <label className="location-master__field">
          <span>Parent location</span>
          <select
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
          </select>
        </label>
        <label className="location-master__field">
          <span>Warehouse category</span>
          <select
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
          </select>
        </label>
        <label className="location-master__field">
          <span>Barcode</span>
          <input value={barcode} onChange={(e) => setBarcode(e.target.value)} />
        </label>
        <label className="location-master__field">
          <span>Capacity qty</span>
          <input
            inputMode="decimal"
            value={capacityQty}
            onChange={(e) => setCapacityQty(e.target.value)}
          />
        </label>
        <label className="location-master__field">
          <span>Capacity UoM</span>
          <select
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
          </select>
        </label>
        <button
          type="button"
          className="location-master__btn"
          disabled={!row?.canUpdate || admin.updatePending}
          title={row?.updateDisabledReason ?? undefined}
          onClick={() => setIsConfirmEditOpen(true)}
        >
          {admin.updatePending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
        {!row?.canUpdate ? (
          <p className="location-master__muted">
            Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
          </p>
        ) : null}
        {admin.updateError ? (
          <p className="location-master__error" role="alert">
            {admin.updateError.code}: {admin.updateError.message}
          </p>
        ) : null}
        {admin.updateSuccess ? (
          <p className="location-master__banner" role="status">
            Đã lưu thay đổi.
          </p>
        ) : null}
      </div>

      <div className="location-master__detail-section">
        <h4 className="location-master__detail-title">Ngừng hoạt động</h4>
        <button
          type="button"
          className="location-master__btn location-master__btn--danger"
          disabled={!row?.canDeactivate}
          title={row?.deactivateDisabledReason ?? undefined}
          onClick={() => setIsConfirmDeactivateOpen(true)}
        >
          Deactivate location
        </button>
        {!row?.canDeactivate ? (
          <p className="location-master__muted">
            Deactivate không khả dụng
            {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
          </p>
        ) : null}
        {admin.deactivateError ? (
          <p className="location-master__error" role="alert">
            {admin.deactivateError.code}: {admin.deactivateError.message}
          </p>
        ) : null}
        {admin.deactivateState === 'success' ? (
          <p className="location-master__banner" role="status">
            Đã deactivate location.
          </p>
        ) : null}
      </div>

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
    </aside>
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

      <form
        className="flex items-center gap-2 max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg"
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
      >
        <div className="flex-1">
          <input
            className="w-full bg-transparent border-0 focus:outline-none text-sm text-slate-800 dark:text-slate-200 px-2"
            value={admin.searchInput}
            onChange={(e) => admin.setSearchInput(e.target.value)}
            placeholder="Tìm location (code / tên)..."
          />
        </div>
        <Button type="submit" size="sm" className="h-9 w-9 px-0" aria-label="Lọc">
          <Search size={16} />
        </Button>
      </form>

      {admin.showCreate ? (
        <form className="location-master__create" onSubmit={handleCreateSubmit}>
          <h3>Tạo location mới</h3>
          <p className="location-master__muted">
            Form luôn hiển thị — server enforce quyền tạo (WMS01-003). Manager assignment bỏ trống
            (nullable; không có user-id lookup trên surface này).
          </p>
          <div className="location-master__form-grid">
            <label className="location-master__field">
              <span>Code</span>
              <input
                value={admin.createForm.code}
                onChange={(e) => admin.setCreateForm({ ...admin.createForm, code: e.target.value })}
                required
              />
            </label>
            <label className="location-master__field">
              <span>Tên location</span>
              <input
                value={admin.createForm.location_name}
                onChange={(e) =>
                  admin.setCreateForm({ ...admin.createForm, location_name: e.target.value })
                }
                required
              />
            </label>
            <label className="location-master__field">
              <span>Location type</span>
              <select
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
              </select>
            </label>
            <label className="location-master__field">
              <span>Parent location</span>
              <select
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
              </select>
            </label>
            <label className="location-master__field">
              <span>Warehouse category</span>
              <select
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
              </select>
            </label>
            <label className="location-master__field">
              <span>Barcode</span>
              <input
                value={admin.createForm.barcode ?? ''}
                onChange={(e) =>
                  admin.setCreateForm({
                    ...admin.createForm,
                    barcode: e.target.value,
                  })
                }
              />
            </label>
            <label className="location-master__field">
              <span>Capacity qty</span>
              <input
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
            <label className="location-master__field">
              <span>Capacity UoM</span>
              <select
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
              </select>
            </label>
            <label className="location-master__checkbox">
              <input
                type="checkbox"
                checked={admin.createForm.is_active}
                onChange={(e) =>
                  admin.setCreateForm({ ...admin.createForm, is_active: e.target.checked })
                }
              />
              <span>Active</span>
            </label>
          </div>
          <div className="location-master__actions">
            <button
              type="submit"
              className="location-master__btn"
              disabled={admin.createErrors.length > 0 || admin.createPending}
            >
              {admin.createPending ? 'Đang tạo…' : 'Tạo'}
            </button>
            <button type="button" className="location-master__btn--ghost" onClick={admin.closeCreate}>
              Hủy
            </button>
          </div>
          {admin.createError ? (
            <p className="location-master__error" role="alert">
              {admin.createError.code}: {admin.createError.message}
            </p>
          ) : null}
        </form>
      ) : null}

      {banner ? (
        <p
          className="location-master__state"
          role={admin.listState === 'error' ? 'alert' : 'status'}
        >
          {banner}
          {admin.listError ? ` (${admin.listError.code})` : ''}
        </p>
      ) : null}

      {admin.listState === 'ready' ? (
        <div className="location-master__workspace">
          {/* Left Column: Location Tree */}
          <aside className="location-master__tree-column">
            <div className="location-master__tree-header">
              <h4>Cây sơ đồ kho</h4>
              {selectedTreeId && (
                <button
                  type="button"
                  className="location-master__clear-tree-btn"
                  onClick={() => setSelectedTreeId(null)}
                >
                  Xóa lọc
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
                    <th>Code</th>
                    <th>Tên</th>
                    <th>Type</th>
                    <th>Parent</th>
                    <th>Category</th>
                    <th>Level</th>
                    <th>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paginatedItems.map((row) => (
                    <tr
                      key={row.code}
                      className={row.code === admin.selectedCode ? 'location-master__row--active' : ''}
                      onDoubleClick={() => admin.selectLocation(row.code)}
                    >
                      <td>
                        <button
                          type="button"
                          className="location-master__linkish"
                          onClick={() => admin.selectLocation(row.code)}
                        >
                          {row.code}
                        </button>
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

              <div className="location-master__paging-row">
                {admin.hasMore ? (
                  <button type="button" className="location-master__more" onClick={admin.loadMore}>
                    Nạp thêm từ Server
                  </button>
                ) : (
                  <span className="location-master__all-loaded">Đã tải hết từ Server</span>
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
          </div>

          {/* Right Column: Detail Panel */}
          <div className="location-master__detail-column">
            {admin.detailLoading ? (
              <div className="location-master__state">Đang tải chi tiết…</div>
            ) : admin.detail ? (
              <LocationEditor key={admin.detail.code} detail={admin.detail} admin={admin} />
            ) : (
              <div className="location-master__empty-detail">
                <div className="location-master__empty-icon">📍</div>
                <h4>Thông tin chi tiết Vị trí</h4>
                <p>Chọn một vị trí từ cây sơ đồ hoặc bảng danh sách để xem thông tin chi tiết.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

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
