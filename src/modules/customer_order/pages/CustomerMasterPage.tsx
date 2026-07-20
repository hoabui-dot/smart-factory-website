import { useState, useEffect } from 'react'
import { Link } from 'react-router'

import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Input, Select, Textarea } from '@/shared/components/ui/Input'
import { Dialog } from '@/shared/components/ui/Dialog'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { useCustomerMaster } from '../hooks/useCustomerMaster'
import type { CustomerItemRecord, CustomerRecord, CustomerRow, CustomerItemRow } from '../types/customerOrder'
import { usePagination } from '@/shared/lib/usePagination'
import { GenericDataTable, ColumnDef } from '@/shared/components/ui/DataTable'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/Table'
import { FileSpreadsheet, Download, AlertCircle } from 'lucide-react'
import { useImportExportCenter } from '@/modules/excel_import_export/hooks/useImportExportCenter'

import './customerOrderShared.css'

function stateMsg(state: string, entity: string): string {
  switch (state) {
    case 'loading':
      return `Đang tải ${entity}…`
    case 'empty':
      return `Chưa có ${entity}.`
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return `Bạn không có quyền xem ${entity}.`
    case 'error':
      return `Không tải được ${entity}.`
    default:
      return ''
  }
}

function CustomerEditor({
  detail,
  admin,
}: {
  detail: CustomerRecord
  admin: ReturnType<typeof useCustomerMaster>
}) {
  const row = admin.detailRow
  const [name, setName] = useState(detail.customer_name)
  const [email, setEmail] = useState(detail.contact_email)
  const [ppm, setPpm] = useState(detail.target_ppm)

  return (
    <aside className="co-admin__detail" aria-label="Chi tiết customer">
      <h3>{detail.code}</h3>
      <p className="co-admin__muted">
        {detail.country_code} · PPAP {detail.ppap_level_default} ·{' '}
        {detail.is_active ? 'ACTIVE' : 'INACTIVE'}
      </p>
      {row?.canUpdate ? (
        <form
          className="flex flex-col gap-4 mt-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!window.confirm('Xác nhận lưu thay đổi thông tin khách hàng này?')) return
            admin.submitUpdate({ customer_name: name, contact_email: email, target_ppm: ppm })
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Email</span>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Target PPM</span>
            <Input type="number" value={ppm} onChange={(e) => setPpm(Number(e.target.value))} required />
          </label>
          <Button type="submit" className="w-full justify-center">Lưu thay đổi</Button>
        </form>
      ) : null}

      {row?.canDeactivate ? (
        <Button
          type="button"
          variant="danger"
          className="w-full justify-center mt-3"
          onClick={() => admin.setConfirmDeactivate(true)}
        >
          Deactivate
        </Button>
      ) : null}

      <ConfirmDialog
        isOpen={admin.confirmDeactivate}
        onClose={() => admin.setConfirmDeactivate(false)}
        onConfirm={admin.submitDeactivate}
        title="Xác nhận deactivate"
        description={`Deactivate khách hàng ${detail.code}?`}
        isPending={false}
      />

      {admin.updateError ? (
        <p className="co-admin__error mt-2" role="alert">
          {admin.updateError.code}: {admin.updateError.message}
        </p>
      ) : null}
    </aside>
  )
}

function ItemEditor({
  detail,
  admin,
}: {
  detail: CustomerItemRecord
  admin: ReturnType<typeof useCustomerMaster>
}) {
  const row = admin.itemDetailRow
  const [partName, setPartName] = useState(detail.customer_part_name)
  const [packaging, setPackaging] = useState(detail.packaging_spec)

  return (
    <aside className="co-admin__detail" aria-label="Chi tiết customer item">
      <h3>{detail.code}</h3>
      <p className="co-admin__muted">
        {row?.customerLabel} · {row?.itemLabel} · {detail.characteristic_class}
      </p>
      {row?.canUpdate ? (
        <form
          className="flex flex-col gap-4 mt-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!window.confirm('Xác nhận lưu thay đổi customer item này?')) return
            admin.submitItemUpdate({ customer_part_name: partName, packaging_spec: packaging })
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Customer part name</span>
            <Input value={partName} onChange={(e) => setPartName(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Packaging</span>
            <Textarea value={packaging} onChange={(e) => setPackaging(e.target.value)} required />
          </label>
          <Button type="submit" className="w-full justify-center">Lưu thay đổi</Button>
        </form>
      ) : null}

      {row?.canDeactivate ? (
        <Button
          type="button"
          variant="danger"
          className="w-full justify-center mt-3"
          onClick={() => admin.setConfirmItemDeactivate(true)}
        >
          Deactivate
        </Button>
      ) : null}

      <ConfirmDialog
        isOpen={admin.confirmItemDeactivate}
        onClose={() => admin.setConfirmItemDeactivate(false)}
        onConfirm={admin.submitItemDeactivate}
        title="Xác nhận deactivate"
        description={`Deactivate customer item ${detail.code}?`}
        isPending={false}
      />
    </aside>
  )
}

export function CustomerMasterPage() {
  const admin = useCustomerMaster()
  const customerPagination = usePagination(admin.rows, 10)
  const itemPagination = usePagination(admin.itemRows, 10)

  const [isExcelOpen, setIsExcelOpen] = useState(false)
  const ie = useImportExportCenter()

  useEffect(() => {
    if (isExcelOpen) {
      ie.setTemplateCode('CUSTOMER_IMPORT')
    }
  }, [isExcelOpen])

  const customerColumns: ColumnDef<CustomerRow>[] = [
    {
      header: 'Mã khách hàng',
      cell: (row) => (
        <button
          type="button"
          className="co-admin__linkish"
          onClick={(e) => {
            e.stopPropagation()
            admin.selectCustomer(row.code)
          }}
        >
          {row.code}
        </button>
      ),
    },
    {
      header: 'Tên khách hàng',
      cell: (row) => row.customerName,
    },
    {
      header: 'Quốc gia',
      cell: (row) => row.countryCode,
    },
    {
      header: 'Hoạt động',
      cell: (row) => (row.isActive ? 'Y' : 'N'),
    },
  ]

  const customerItemColumns: ColumnDef<CustomerItemRow>[] = [
    {
      header: 'Mã liên kết',
      cell: (row) => (
        <button
          type="button"
          className="co-admin__linkish"
          onClick={(e) => {
            e.stopPropagation()
            admin.selectItem(row.code)
          }}
        >
          {row.code}
        </button>
      ),
    },
    {
      header: 'Khách hàng',
      cell: (row) => row.customerLabel,
    },
    {
      header: 'Mã vật tư (Nội bộ)',
      cell: (row) => row.itemLabel,
    },
    {
      header: 'Mã linh kiện (Khách hàng)',
      cell: (row) => row.customerPartName,
    },
  ]

  const banner = stateMsg(admin.listState, 'customer')
  const itemBanner = stateMsg(admin.itemListState, 'customer item')

  return (
    <section className="co-admin" aria-labelledby="customer-master-title">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'MES' },
          { label: 'Customers' },
        ]}
        title="Danh mục khách hàng (Customer Master)"
        subtitle="Quản lý thông tin khách hàng doanh nghiệp, liên kết mã hàng hóa nội bộ (Customer Items) và cấu hình đơn hàng."
        actions={
          <div className="flex gap-2">
            <Link to="/web/mes/customer-orders">
              <Button>Đơn hàng khách hàng</Button>
            </Link>
            <Button variant="secondary" onClick={() => setIsExcelOpen(true)}>Nhập/Xuất Excel</Button>
          </div>
        }
      />

      <div className="co-admin__tabs" role="tablist">
        <button type="button" role="tab" aria-selected={admin.tab === 'customers'} onClick={() => admin.setTab('customers')}>
          Customers
        </button>
        <button type="button" role="tab" aria-selected={admin.tab === 'items'} onClick={() => admin.setTab('items')}>
          Customer items
        </button>
      </div>

      {admin.tab === 'customers' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'search',
                type: 'text',
                label: 'Tìm',
                placeholder: 'Tìm kiếm khách hàng...',
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
            expands={
              <Button type="button" className="co-admin__btn shrink-0" onClick={() => admin.setShowCreate(true)}>
                Tạo customer
              </Button>
            }
          />

          <Dialog
            isOpen={admin.showCreate}
            onClose={() => admin.setShowCreate(false)}
            title="Tạo Customer mới"
            maxWidth="max-w-[50%]"
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!window.confirm('Xác nhận tạo khách hàng mới này?')) return
                admin.submitCreate()
              }}
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Code</span>
                <Input
                  value={admin.createForm.code}
                  onChange={(e) => admin.setCreateForm({ ...admin.createForm, code: e.target.value })}
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Name</span>
                <Input
                  value={admin.createForm.customer_name}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, customer_name: e.target.value })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Country</span>
                <Input
                  value={admin.createForm.country_code}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, country_code: e.target.value })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Email</span>
                <Input
                  value={admin.createForm.contact_email}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, contact_email: e.target.value })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">PPAP level</span>
                <Input
                  value={admin.createForm.ppap_level_default}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, ppap_level_default: e.target.value })
                  }
                  required
                />
              </label>
              {admin.createErrors.length ? (
                <p className="text-sm text-[var(--color-danger-text)]">Thiếu: {admin.createErrors.join(', ')}</p>
              ) : null}
              {admin.createError ? (
                <p className="text-sm text-[var(--color-danger-text)]" role="alert">
                  {admin.createError.code}: {admin.createError.message}
                </p>
              ) : null}
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" onClick={() => admin.setShowCreate(false)}>
                  Hủy
                </Button>
                <Button type="submit">Tạo</Button>
              </div>
            </form>
          </Dialog>

          {banner ? <p className="co-admin__state">{banner}</p> : null}

          {admin.listState === 'ready' ? (
            <div className="co-admin__layout">
              <div className="co-admin__table-wrap flex flex-col gap-4">
                <GenericDataTable
                  data={customerPagination.paginatedItems}
                  columns={customerColumns}
                  pagination={customerPagination}
                  onRowClick={(row) => admin.selectCustomer(row.code)}
                  getRowClassName={(row) =>
                    row.code === admin.selectedCode ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]' : ''
                  }
                />
              </div>
              {admin.detail ? (
                <CustomerEditor key={admin.detail.code} detail={admin.detail} admin={admin} />
              ) : (
                <p className="co-admin__muted">Chọn customer.</p>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'items' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'search',
                type: 'text',
                label: 'Tìm',
                placeholder: 'Tìm kiếm customer item...',
              },
            ]}
            values={{
              search: admin.itemSearch,
            }}
            onChange={(name, value) => {
              if (name === 'search') {
                admin.setItemSearch(value)
              }
            }}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyItemSearch()
            }}
            onReset={() => {
              admin.setItemSearch('')
              admin.applyItemSearch()
            }}
            isResetActive={Boolean(admin.itemSearch)}
            expands={
              <Button type="button" className="co-admin__btn shrink-0" onClick={() => admin.setShowItemCreate(true)}>
                Tạo customer item
              </Button>
            }
          />

          <Dialog
            isOpen={admin.showItemCreate}
            onClose={() => admin.setShowItemCreate(false)}
            title="Tạo Customer Item mới"
            maxWidth="max-w-[50%]"
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!window.confirm('Xác nhận tạo customer item mới này?')) return
                admin.submitItemCreate()
              }}
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Code</span>
                <Input
                  value={admin.itemForm.code}
                  onChange={(e) => admin.setItemForm({ ...admin.itemForm, code: e.target.value })}
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Customer</span>
                <Select
                  value={admin.itemForm.customer_id || ''}
                  onChange={(e) =>
                    admin.setItemForm({ ...admin.itemForm, customer_id: Number(e.target.value) })
                  }
                >
                  <option value="">—</option>
                  {admin.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Item</span>
                <Select
                  value={admin.itemForm.item_id || ''}
                  onChange={(e) =>
                    admin.setItemForm({ ...admin.itemForm, item_id: Number(e.target.value) })
                  }
                >
                  <option value="">—</option>
                  {admin.mesItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.code}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Part name</span>
                <Input
                  value={admin.itemForm.customer_part_name}
                  onChange={(e) =>
                    admin.setItemForm({ ...admin.itemForm, customer_part_name: e.target.value })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Class</span>
                <Select
                  value={admin.itemForm.characteristic_class}
                  onChange={(e) =>
                    admin.setItemForm({ ...admin.itemForm, characteristic_class: e.target.value })
                  }
                >
                  <option value="STANDARD">STANDARD</option>
                  <option value="SC">SC</option>
                  <option value="CC">CC</option>
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Packaging</span>
                <Input
                  value={admin.itemForm.packaging_spec}
                  onChange={(e) =>
                    admin.setItemForm({ ...admin.itemForm, packaging_spec: e.target.value })
                  }
                  required
                />
              </label>
              {admin.itemErrors.length ? (
                <p className="text-sm text-[var(--color-danger-text)]">Thiếu: {admin.itemErrors.join(', ')}</p>
              ) : null}
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => admin.setShowItemCreate(false)}
                >
                  Hủy
                </Button>
                <Button type="submit">Tạo</Button>
              </div>
            </form>
          </Dialog>

          {itemBanner ? <p className="co-admin__state">{itemBanner}</p> : null}

          {admin.itemListState === 'ready' ? (
            <div className="co-admin__layout">
              <div className="co-admin__table-wrap flex flex-col gap-4">
                <GenericDataTable
                  data={itemPagination.paginatedItems}
                  columns={customerItemColumns}
                  pagination={itemPagination}
                  onRowClick={(row) => admin.selectItem(row.code)}
                  getRowClassName={(row) =>
                    row.code === admin.selectedItemCode ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]' : ''
                  }
                />
              </div>
              {admin.itemDetail ? (
                <ItemEditor key={admin.itemDetail.code} detail={admin.itemDetail} admin={admin} />
              ) : (
                <p className="co-admin__muted">Chọn customer item.</p>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {/* Excel Import/Export Dialog Modal */}
      <Dialog
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        title="Nhập / Xuất dữ liệu Excel (Customer)"
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
