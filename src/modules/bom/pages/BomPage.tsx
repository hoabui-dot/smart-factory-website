import { useState } from 'react'
import { Link } from 'react-router'

import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Input, Select, Textarea } from '@/shared/components/ui/Input'
import { Dialog } from '@/shared/components/ui/Dialog'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { Badge } from '@/shared/components/ui/Badge'
import { Search, Download, AlertCircle, PlusCircle, RotateCw, Info, FileSpreadsheet } from 'lucide-react'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { useBom } from '../hooks/useBom'
import type { BomHeaderDetailRecord, BomTreeNode, BomRow } from '../types/bom'
import { usePagination } from '@/shared/lib/usePagination'
import { GenericDataTable, ColumnDef } from '@/shared/components/ui/DataTable'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/Table'
import { useImportExportCenter } from '@/modules/excel_import_export/hooks/useImportExportCenter'

import './BomPage.css'

type Api = ReturnType<typeof useBom>

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải danh mục BOM…'
    case 'empty':
      return 'Chưa có BOM nào.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem danh mục BOM.'
    case 'error':
      return 'Không tải được danh mục BOM. Thử lại sau.'
    default:
      return ''
  }
}

function BomTreeView({ node }: { node: BomTreeNode }) {
  return (
    <div className="bom-admin__tree-node">
      <strong>{node.code}</strong>{' '}
      <span className="bom-admin__muted">
        ({node.product_item_code ?? node.product_item_id} · {node.status})
      </span>
      {node.lines.length > 0 ? (
        <ul className="bom-admin__tree">
          {node.lines.map((line) => (
            <li key={line.code}>
              {line.material_item_code ?? line.material_item_id} × {line.qty_per_unit}{' '}
              {line.uom_code ?? ''}
              {line.children ? <BomTreeView node={line.children} /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function BomEditor({ detail, admin, onClose }: { detail: BomHeaderDetailRecord; admin: Api; onClose?: () => void }) {
  const [version, setVersion] = useState(detail.version)
  const [effectiveFrom, setEffectiveFrom] = useState(detail.effective_from.slice(0, 10))
  const row = admin.detailRow

  return (
    <div className="flex flex-col gap-4 font-sans text-sm">
      <h3>{detail.code}</h3>
      <p className="bom-admin__muted">
        {row?.productItemLabel ?? '-'} · {detail.status} · v{detail.version}
      </p>
      <dl className="bom-admin__meta">
        <div>
          <dt>Effective from</dt>
          <dd>{detail.effective_from}</dd>
        </div>
        <div>
          <dt>Effective to</dt>
          <dd>{detail.effective_to ?? '-'}</dd>
        </div>
        <div>
          <dt>Approved by</dt>
          <dd>{detail.approved_by == null ? '-' : `user #${detail.approved_by}`}</dd>
        </div>
      </dl>

      <h4>Lines ({admin.lineRows.length})</h4>
      {admin.lineRows.length === 0 ? (
        <p className="bom-admin__muted">
          Chưa có dòng vật tư. Thêm/sửa lô dòng qua BOM_IMPORT tại Import/Export Center.
        </p>
      ) : (
        <Table containerClassName="border border-[var(--border-default)] rounded-lg bg-[var(--surface-1)] overflow-hidden">
          <TableHeader>
            <TableRow className="pointer-events-none hover:bg-transparent bg-[var(--surface-2)]">
              <TableHead>Hạng mục</TableHead>
              <TableHead>Vật tư</TableHead>
              <TableHead>Định mức (Qty/unit)</TableHead>
              <TableHead>Tỷ lệ hao hụt (%)</TableHead>
              <TableHead>ĐVT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admin.lineRows.map((line) => (
              <TableRow key={line.code} className="hover:bg-[var(--surface-2)]">
                <TableCell>{line.code}</TableCell>
                <TableCell>{line.materialItemLabel}</TableCell>
                <TableCell>{line.qtyPerUnit}</TableCell>
                <TableCell>{line.scrapRate}</TableCell>
                <TableCell>{line.uomLabel}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <button type="button" className="bom-admin__btn" onClick={admin.toggleTree}>
        {admin.showTree ? 'Ẩn cây BOM' : 'Xem cây BOM'}
      </button>
      {admin.showTree ? (
        admin.treeLoading ? (
          <p className="bom-admin__muted">Đang tải cây BOM…</p>
        ) : admin.tree ? (
          <BomTreeView node={admin.tree} />
        ) : null
      ) : null}

      <h4>Sửa (chỉ khi DRAFT)</h4>
      <label className="flex flex-col gap-1.5 mb-3">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Version</span>
        <Input value={version} onChange={(e) => setVersion(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1.5 mb-4">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Effective from</span>
        <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
      </label>
      <Button
        type="button"
        disabled={!row?.canUpdate || admin.updatePending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() => {
          if (!window.confirm('Xác nhận lưu thay đổi BOM này?')) return
          admin.saveEdit({
            version: version.trim(),
            effective_from: effectiveFrom,
          })
        }}
        className="w-full justify-center"
      >
        {admin.updatePending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </Button>
      {!row?.canUpdate ? (
        <p className="bom-admin__muted mt-2">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateError ? (
        <p className="bom-admin__error mt-2" role="alert">
          {admin.updateError.code}: {admin.updateError.message}
        </p>
      ) : null}
      {admin.updateSuccess ? (
        <p className="bom-admin__banner mt-2" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4 className="mt-6">State transitions</h4>
      <div className="flex flex-wrap gap-2 mt-2">
        <Button
          type="button"
          disabled={!row?.canRelease}
          title={row?.releaseDisabledReason ?? undefined}
          onClick={() => admin.setConfirmRelease(true)}
        >
          Release
        </Button>
        <Button
          type="button"
          disabled={!row?.canCopy}
          title={row?.copyDisabledReason ?? undefined}
          onClick={admin.openCopy}
        >
          Copy
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={!row?.canObsolete}
          title={row?.obsoleteDisabledReason ?? undefined}
          onClick={admin.openObsolete}
        >
          Obsolete
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={!row?.canDeactivate}
          title={row?.deactivateDisabledReason ?? undefined}
          onClick={() => admin.setConfirmDeactivate(true)}
        >
          Deactivate
        </Button>
      </div>

      <ConfirmDialog
        isOpen={admin.confirmRelease}
        onClose={() => admin.setConfirmRelease(false)}
        onConfirm={admin.releaseBom}
        title="Xác nhận release"
        description={`Xác nhận release ${detail.code}? BOM RELEASED trước đó của cùng sản phẩm sẽ chuyển sang OBSOLETE.`}
        isPending={admin.releaseState === 'pending'}
      />

      <Dialog
        isOpen={admin.showCopy}
        onClose={admin.closeCopy}
        title="Copy BOM sang version mới"
        maxWidth="max-w-[50%]"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!window.confirm('Xác nhận copy BOM này?')) return
            admin.copyBom()
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">New code</span>
            <Input
              value={admin.copyForm.new_code}
              onChange={(e) => admin.setCopyForm({ ...admin.copyForm, new_code: e.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">New version</span>
            <Input
              value={admin.copyForm.new_version}
              onChange={(e) => admin.setCopyForm({ ...admin.copyForm, new_version: e.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Effective from</span>
            <Input
              type="date"
              value={admin.copyForm.effective_from}
              onChange={(e) =>
                admin.setCopyForm({ ...admin.copyForm, effective_from: e.target.value })
              }
              required
            />
          </label>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={admin.closeCopy}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={admin.copyErrors.length > 0 || admin.copyPending}
            >
              {admin.copyPending ? 'Đang copy…' : 'Copy'}
            </Button>
          </div>
          {admin.copyError ? (
            <p className="text-sm text-[var(--color-danger-text)] mt-2" role="alert">
              {admin.copyError.code}: {admin.copyError.message}
            </p>
          ) : null}
        </form>
      </Dialog>

      <Dialog
        isOpen={admin.showObsolete}
        onClose={admin.closeObsolete}
        title="Xác nhận obsolete BOM"
        maxWidth="max-w-[50%]"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!window.confirm(`Xác nhận obsolete ${detail.code}? BOM sẽ không còn dùng cho lệnh sản xuất mới.`)) return
            admin.obsoleteBom()
          }}
        >
          <p className="text-sm text-[var(--text-secondary)]">
            Xác nhận obsolete <strong>{detail.code}</strong>? BOM sẽ không còn dùng cho lệnh sản xuất mới.
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Effective to</span>
            <Input
              type="date"
              value={admin.obsoleteEffectiveTo}
              onChange={(e) => admin.setObsoleteEffectiveTo(e.target.value)}
              required
            />
          </label>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={admin.closeObsolete}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={admin.obsoleteErrors.length > 0 || admin.obsoletePending}
            >
              {admin.obsoletePending ? 'Đang xử lý…' : 'Xác nhận'}
            </Button>
          </div>
          {admin.obsoleteError ? (
            <p className="text-sm text-[var(--color-danger-text)] mt-2" role="alert">
              {admin.obsoleteError.code}: {admin.obsoleteError.message}
            </p>
          ) : null}
        </form>
      </Dialog>

      <ConfirmDialog
        isOpen={admin.confirmDeactivate}
        onClose={() => admin.setConfirmDeactivate(false)}
        onConfirm={admin.deactivate}
        title="Xác nhận deactivate"
        description={`Xác nhận deactivate ${detail.code}? BOM sẽ chuyển sang OBSOLETE.`}
        isPending={admin.deactivateState === 'pending'}
      />

      {admin.obsoleteSuccess ? (
        <p className="bom-admin__banner mt-2" role="status">
          Đã obsolete BOM.
        </p>
      ) : null}

      {admin.deactivateError ? (
        <p className="bom-admin__error mt-2" role="alert">
          {admin.deactivateError.code}: {admin.deactivateError.message}
        </p>
      ) : null}
      {admin.deactivateState === 'success' ? (
        <p className="bom-admin__banner mt-2" role="status">
          Đã deactivate BOM.
        </p>
      ) : null}
    </div>
  )
}

export function BomPage() {
  const admin = useBom()
  const pagination = usePagination(admin.rows, 10)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isExcelOpen, setIsExcelOpen] = useState(false)
  const ie = useImportExportCenter()

  const columns: ColumnDef<BomRow>[] = [
    {
      header: 'Mã định mức (BOM)',
      cell: (row) => (
        <button
          type="button"
          className="bom-admin__linkish"
          onClick={(e) => {
            e.stopPropagation()
            admin.selectBom(row.code)
            setIsDetailOpen(true)
          }}
        >
          {row.code}
        </button>
      ),
    },
    {
      header: 'Sản phẩm',
      cell: (row) => row.productItemLabel,
    },
    {
      header: 'Phiên bản',
      cell: (row) => row.version,
    },
    {
      header: 'Trạng thái',
      cell: (row) => row.status,
    },
    {
      header: 'Ngày hiệu lực',
      cell: (row) => row.effectiveFrom,
    },
  ]

  const banner = listStateMessage(admin.listState)

  return (
    <section className="bom-admin" aria-labelledby="bom-admin-title">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'MES' },
          { label: 'BOM Đa cấp' },
        ]}
        title="Định mức vật tư đa cấp (BOM)"
        subtitle="Quản lý định mức nguyên vật liệu đa cấp, các phiên bản cấu trúc sản phẩm và chi tiết line linh kiện."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              ie.setTemplateCode('BOM_IMPORT')
              ie.setExportTemplateCode('BOM_EXPORT')
              setIsExcelOpen(true)
            }}
          >
            Nhập/Xuất Dữ liệu (Excel)
          </Button>
        }
      />

      <FilterBar
        fields={[
          {
            name: 'searchInput',
            type: 'text',
            placeholder: 'Tìm theo mã / tên định mức (BOM)...'
          }
        ]}
        values={{ searchInput: admin.searchInput }}
        onChange={(_, val) => admin.setSearchInput(val)}
        onSubmit={(e) => {
          e.preventDefault()
          admin.applySearch()
        }}
        onReset={admin.clearSearch}
        isResetActive={!!admin.appliedQuery}
        className="w-full flex-nowrap"
      >
        <div className="ml-auto flex items-center">
          <Button type="button" variant="secondary" size="sm" onClick={admin.openCreate} className="mr-3">
            Tạo BOM mới
          </Button>
        </div>
      </FilterBar>

      <Dialog
        isOpen={admin.showCreate}
        onClose={admin.closeCreate}
        title="Tạo BOM mới"
        maxWidth="max-w-[50%]"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!window.confirm('Xác nhận tạo BOM này?')) return
            admin.create()
          }}
        >
          <p className="text-xs text-[var(--text-muted)]">Form luôn hiển thị — server enforce quyền tạo (MES02-003).</p>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Code</span>
            <Input
              value={admin.createForm.code}
              onChange={(e) => admin.setCreateForm({ ...admin.createForm, code: e.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Sản phẩm (item)</span>
            <Select
              value={admin.createForm.product_item_id}
              onChange={(e) =>
                admin.setCreateForm({
                  ...admin.createForm,
                  product_item_id: Number(e.target.value),
                })
              }
            >
              <option value={0}>Chọn sản phẩm</option>
              {admin.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} — {item.item_name}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Version</span>
            <Input
              value={admin.createForm.version}
              onChange={(e) => admin.setCreateForm({ ...admin.createForm, version: e.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Status khởi tạo</span>
            <Select
              value={admin.createForm.status}
              onChange={(e) => admin.setCreateForm({ ...admin.createForm, status: e.target.value })}
            >
              <option value="DRAFT">DRAFT</option>
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Effective from</span>
            <Input
              type="date"
              value={admin.createForm.effective_from}
              onChange={(e) =>
                admin.setCreateForm({ ...admin.createForm, effective_from: e.target.value })
              }
              required
            />
          </label>
          <div className="flex justify-end gap-2 mt-4">
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
            <p className="text-sm text-[var(--color-danger-text)] mt-2" role="alert">
              {admin.createError.code}: {admin.createError.message}
            </p>
          ) : null}
        </form>
      </Dialog>

      {banner ? (
        <p className="bom-admin__state" role={admin.listState === 'error' ? 'alert' : 'status'}>
          {banner}
          {admin.listError ? ` (${admin.listError.code})` : ''}
        </p>
      ) : null}

      {admin.listState === 'ready' ? (
        <div className="flex flex-col gap-4">
          <GenericDataTable
            data={pagination.paginatedItems}
            columns={columns}
            pagination={pagination}
            hasMore={admin.hasMore}
            onLoadMore={admin.loadMore}
            onRowClick={(row) => {
              admin.selectBom(row.code)
              setIsDetailOpen(true)
            }}
            getRowClassName={(row) =>
              row.code === admin.selectedCode
                ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]'
                : ''
            }
          />
        </div>
      ) : null}

      {/* Details Dialog Modal */}
      <Dialog
        isOpen={isDetailOpen && (!!admin.detail || admin.detailLoading)}
        onClose={() => setIsDetailOpen(false)}
        title={admin.detail ? `Chi tiết BOM: ${admin.detail.code}` : 'Chi tiết BOM'}
        maxWidth="max-w-[75%]"
      >
        {admin.detailLoading ? (
          <div className="p-8 text-center text-sm text-[var(--text-secondary)]">Đang tải chi tiết…</div>
        ) : admin.detail ? (
          <BomEditor
            key={admin.detail.code}
            detail={admin.detail}
            admin={admin}
            onClose={() => setIsDetailOpen(false)}
          />
        ) : null}
      </Dialog>

      {/* Excel Import/Export Dialog Modal */}
      <Dialog
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        title="Nhập / Xuất dữ liệu Excel (BOM)"
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

            {/* Export segment */}
            <div className="flex flex-col gap-4 bg-[var(--surface-1)] p-5 rounded-xl border border-[var(--border-default)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Download size={16} className="text-[var(--color-action-primary)]" />
                Xuất dữ liệu sản phẩm
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Nhấp nút bên dưới để tạo tác vụ xuất dữ liệu BOM sang định dạng Excel.
              </p>
              <Button
                type="button"
                disabled={ie.exportPending}
                onClick={() => {
                  if (!window.confirm('Xác nhận xuất dữ liệu BOM sang Excel?')) return
                  ie.createExport()
                }}
              >
                Khởi tạo tác vụ xuất dữ liệu
              </Button>
              {ie.exportError && (
                <div className="p-3 rounded bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger)]/20 text-xs flex items-center gap-2" role="alert">
                  <AlertCircle size={14} />
                  <span>{ie.exportError.code}: {ie.exportError.message}</span>
                </div>
              )}
              {ie.exportResult && (
                <div className="p-4 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Trạng thái:</span>
                    <Badge variant={ie.exportResult.status === 'COMPLETED' ? 'active' : 'inactive'}>
                      {ie.exportResult.status}
                    </Badge>
                  </div>
                  {ie.exportResult.result_file_id && (
                    <a
                      href={`/api/files/download/${ie.exportResult.result_file_id}`}
                      download
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--color-action-primary)] text-white hover:opacity-90 transition-opacity"
                    >
                      <Download size={14} className="mr-2" />
                      Tải File Excel
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Active Batch details if available */}
          {ie.detailRow && (
            <div className="flex flex-col gap-4 p-5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)]">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Lô đang hoạt động: {ie.detailRow.code}</h4>
                <Badge variant={ie.detailRow.status === 'COMMITTED' ? 'active' : ie.detailRow.status === 'FAILED' ? 'inactive' : 'default'}>
                  {ie.detailRow.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
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
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Người tạo</span>
                  <p className="font-semibold text-sm text-[var(--text-primary)] mt-0.5">{ie.detailRow.startedBy}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-[var(--border-default)] pt-4 mt-2">
                {ie.detailRow.canValidate && (
                  <Button
                    type="button"
                    onClick={() => {
                      if (!window.confirm('Xác nhận kiểm tra tính hợp lệ của lô dữ liệu này?')) return
                      ie.runValidate()
                    }}
                    disabled={ie.mutationState === 'pending'}
                  >
                    Kiểm tra (Validate)
                  </Button>
                )}
                {ie.detailRow.canCommit && (
                  <Button
                    type="button"
                    onClick={() => ie.setConfirmAction('commit')}
                    disabled={ie.mutationState === 'pending'}
                  >
                    Ghi nhận (Commit)
                  </Button>
                )}
                {ie.detailRow.canCancel && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => ie.setConfirmAction('cancel')}
                    disabled={ie.mutationState === 'pending'}
                  >
                    Hủy lô (Cancel)
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Errors list */}
          {ie.errors.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-[var(--color-danger-text)] uppercase px-1">Danh sách lỗi phát sinh ({ie.errors.length})</h4>
              <div className="max-h-40 overflow-y-auto border border-[var(--border-default)] rounded-lg bg-[var(--surface-1)] p-3 flex flex-col gap-2">
                {ie.errors.map((err, idx) => (
                  <div key={idx} className="text-xs text-[var(--color-danger-text)] border-b border-[var(--border-default)] last:border-0 pb-1.5">
                    Mã dòng {err.code} - cột {err.column_name ?? '-'}: {err.error_message_vi} ({err.error_code})
                  </div>
                ))}
              </div>
            </div>
          )}

          <ConfirmDialog
            isOpen={ie.confirmAction === 'commit'}
            onClose={() => ie.setConfirmAction(null)}
            onConfirm={ie.runConfirmedAction}
            title="Xác nhận nạp dữ liệu"
            description="Bạn có chắc chắn muốn ghi nhận (Commit) lô dữ liệu này vào hệ thống? Thao tác không thể hoàn tác."
            isPending={ie.mutationState === 'pending'}
          />

          <ConfirmDialog
            isOpen={ie.confirmAction === 'cancel'}
            onClose={() => ie.setConfirmAction(null)}
            onConfirm={ie.runConfirmedAction}
            title="Xác nhận hủy lô dữ liệu"
            description="Bạn có chắc chắn muốn hủy (Cancel) lô dữ liệu này? Thao tác không thể hoàn tác."
            isPending={ie.mutationState === 'pending'}
          />
        </div>
      </Dialog>
    </section>
  )
}
