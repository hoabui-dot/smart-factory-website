import { useState } from 'react'
import { Link } from 'react-router'

import { useImportExportCenter } from '../hooks/useImportExportCenter'
import { usePagination } from '@/shared/lib/usePagination'
import { TablePagination } from '@/shared/components/ui/TablePagination'

// Import Tailwind Shadcn UI & Layout components
import { PageHeader } from '@/shared/components/layout/PageHeader'
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
import {
  Search,
  RotateCw,
  Download,
  PlusCircle,
  FileSpreadsheet,
  AlertCircle,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Info,
} from 'lucide-react'

import './ImportExportCenterPage.css'

function batchStateMessage(state: string): string {
  switch (state) {
    case 'idle':
      return 'Chọn template và tải batch theo mã, hoặc tạo batch mới từ file nguồn.'
    case 'loading':
      return 'Đang tải thông tin lô nạp dữ liệu (import batch)...'
    case 'empty':
      return 'Không có lô nạp dữ liệu nào đang mở.'
    case 'permission-denied':
      return 'Bạn không có quyền trên phân hệ sở hữu (owning module) của template này.'
    case 'not-found':
      return 'Không tìm thấy lô nạp dữ liệu (import batch) tương ứng.'
    case 'error':
      return 'Không tải được thông tin lô nạp dữ liệu (import batch).'
    default:
      return ''
  }
}

export function ImportExportCenterPage() {
  const center = useImportExportCenter()
  const [tab, setTab] = useState<'import' | 'export'>('import')
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isExcelOpen, setIsExcelOpen] = useState(false)

  const banner = batchStateMessage(center.batchState)
  const sessionPagination = usePagination(center.sessionBatches, 10)

  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Nhập / Xuất dữ liệu (Import/Export)' },
        ]}
        title="Trung tâm Nhập / Xuất dữ liệu"
        subtitle="Hub quản lý và thực thi nạp/xuất dữ liệu Excel tích hợp cho các phân hệ MES, WMS và QMS."
        actions={
          <Button variant="secondary" onClick={() => setIsExcelOpen(true)}>Nhập/Xuất Dữ liệu (Excel)</Button>
        }
      />

      {/* Modern Tabs */}
      <div className="flex border-b border-[var(--border-default)]">
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tab === 'import'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => setTab('import')}
        >
          Trung tâm Nhập dữ liệu (Import)
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tab === 'export'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => setTab('export')}
        >
          Trung tâm Xuất dữ liệu (Export)
        </button>
      </div>

      {tab === 'import' ? (
        <>

          {banner && (
            <p
              className={`p-4 rounded border text-sm ${
                center.batchState === 'error' || center.batchState === 'permission-denied'
                  ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border-[var(--color-danger)]/20'
                  : 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border-default)]'
              }`}
              role={center.batchState === 'error' ? 'alert' : 'status'}
            >
              {banner}
              {center.batchError ? ` (${center.batchError.code})` : ''}
            </p>
          )}

          {/* Session Batches Table */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 px-1">
              <FileSpreadsheet size={16} className="text-[var(--text-muted)]" />
              Danh sách Batch trong phiên
            </h3>
            
            <div className="w-full border border-[var(--border-default)] rounded-lg bg-[var(--surface-1)] overflow-hidden">
              <Table containerClassName="relative w-full overflow-auto">
                <TableHeader>
                  <TableRow className="bg-[var(--surface-2)] border-b border-[var(--border-default)] pointer-events-none hover:bg-transparent">
                    <TableHead className="text-[var(--text-secondary)]">Mã Batch</TableHead>
                    <TableHead className="text-[var(--text-secondary)]">Mã Template</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionPagination.paginatedItems.map((code) => (
                    <TableRow
                      key={code}
                      className={`cursor-pointer transition-colors border-b border-[var(--border-default)] ${
                        code === center.detailRow?.code 
                          ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]' 
                          : 'hover:bg-[var(--surface-2)]'
                      }`}
                      onClick={() => {
                        center.selectSessionBatch(code)
                        setIsDetailOpen(true)
                      }}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-0 py-0 h-auto font-semibold hover:underline text-[var(--color-action-primary)]"
                          onClick={(e) => {
                            e.stopPropagation()
                            center.selectSessionBatch(code)
                            setIsDetailOpen(true)
                          }}
                        >
                          {code}
                        </Button>
                      </TableCell>
                      <TableCell className="font-semibold text-[var(--text-primary)]">{center.templateCode}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {center.sessionBatches.length === 0 && (
                <div className="p-8 flex flex-col items-center justify-center gap-2 bg-[var(--surface-1)]">
                  <FileSpreadsheet size={32} className="text-[var(--text-muted)] opacity-60" />
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">Chưa có lô nạp dữ liệu (Import Batch)</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Sử dụng bảng bên trên để tra cứu hoặc tạo mới một lô dữ liệu.</p>
                </div>
              )}
              <TablePagination {...sessionPagination} />
            </div>
          </div>
        </>
      ) : (
        /* Export Tab Content */
        <div className="flex flex-col gap-4 bg-[var(--surface-2)] p-5 rounded-xl border border-[var(--border-default)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Info size={16} className="text-[var(--text-muted)]" />
            Kết quả xuất dữ liệu
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Phân hệ sở hữu (owning module) sẽ xử lý tác vụ bất đồng bộ và trả về kết quả trạng thái chi tiết của Export Job.
          </p>
          {center.exportError && (
            <div className="p-3 rounded bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger)]/20 flex items-center gap-2 text-xs" role="alert">
              <AlertCircle size={14} />
              <span>{center.exportError.code}: {center.exportError.message}</span>
            </div>
          )}
          {center.exportResult ? (
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-sm mt-2">
              <div className="p-3.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg">
                <dt className="text-xs font-semibold text-[var(--text-muted)] uppercase">Mã tác vụ xuất (Job Code)</dt>
                <dd className="font-mono text-base font-semibold text-[var(--text-primary)] mt-1">
                  {center.exportResult.code}
                </dd>
              </div>
              <div className="p-3.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg">
                <dt className="text-xs font-semibold text-[var(--text-muted)] uppercase">Trạng thái (Status)</dt>
                <dd className="mt-1">
                  <Badge variant={center.exportResult.status === 'COMPLETED' ? 'active' : 'inactive'}>
                    {center.exportResult.status}
                  </Badge>
                </dd>
              </div>
              <div className="p-3.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg">
                <dt className="text-xs font-semibold text-[var(--text-muted)] uppercase">Phân loại báo cáo</dt>
                <dd className="font-semibold text-[var(--text-primary)] mt-1">
                  {center.exportResult.report_type}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="p-8 border border-dashed border-[var(--border-strong)] rounded-lg text-center bg-[var(--surface-1)] flex flex-col items-center justify-center gap-2">
              <Download size={32} className="text-[var(--text-muted)] opacity-60" />
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Chưa có tác vụ xuất dữ liệu (Export Job)</h4>
              <p className="text-xs text-[var(--text-secondary)]">Nhấp nút Nhập/Xuất Dữ liệu (Excel) ở phía trên để bắt đầu.</p>
            </div>
          )}
        </div>
      )}

      {/* Import Batch Details Dialog Modal Overlay */}
      <Dialog
        isOpen={isDetailOpen && !!center.detailRow}
        onClose={() => {
          setIsDetailOpen(false)
          center.setConfirmAction(null)
        }}
        title={center.detailRow ? `Chi tiết lô nạp dữ liệu: ${center.detailRow.code}` : 'Chi tiết Batch'}
      >
        {center.detailRow && (
          <div className="flex flex-col gap-5 font-sans text-sm">
            {/* Batch Status Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)]">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">Trạng thái</span>
                <div className="mt-1 font-semibold text-sm text-[var(--text-primary)]">
                  <Badge variant={center.detailRow.status === 'COMMITTED' ? 'active' : center.detailRow.status === 'FAILED' ? 'inactive' : 'default'}>
                    {center.detailRow.status}
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)]">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">Đối tượng nạp (Target Entity)</span>
                <div className="mt-1 font-semibold text-sm text-[var(--text-primary)] font-mono truncate" title={center.detailRow.targetEntity}>
                  {center.detailRow.targetEntity}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)]">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">Commit Mode</span>
                <div className="mt-1 font-semibold text-sm text-[var(--text-primary)]">
                  {center.detailRow.mode === 'ALL_OR_NOTHING'
                    ? 'Tất cả hoặc không (ALL_OR_NOTHING)'
                    : center.detailRow.mode === 'PARTIAL'
                      ? 'Nạp một phần (PARTIAL)'
                      : center.detailRow.mode}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)]">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">Import Mode</span>
                <div className="mt-1 font-semibold text-sm text-[var(--text-primary)]">
                  {center.detailRow.importMode === 'UPSERT'
                    ? 'Thêm mới hoặc Cập nhật (UPSERT)'
                    : center.detailRow.importMode === 'INSERT'
                      ? 'Chỉ thêm mới (INSERT)'
                      : center.detailRow.importMode === 'UPDATE'
                        ? 'Chỉ cập nhật (UPDATE)'
                        : center.detailRow.importMode}
                </div>
              </div>
            </div>

            {/* Row Counts */}
            <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)]">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Thống kê dòng dữ liệu</span>
              <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)] mt-0.5">
                <span>Tổng số bản ghi: <strong className="font-semibold text-[var(--text-primary)]">{center.detailRow.totalRows}</strong></span>
                <span>Nạp thành công: <strong className="font-semibold text-[var(--color-success-text)]">{center.detailRow.successRows}</strong></span>
                <span>Số dòng lỗi: <strong className="font-semibold text-[var(--color-danger-text)]">{center.detailRow.failedRows}</strong></span>
                <span>Số dòng bỏ qua: <strong className="font-semibold text-[var(--text-muted)]">{center.detailRow.skippedRows}</strong></span>
              </div>
            </div>

            {/* Metadata Timestamps */}
            <div className="flex flex-col gap-2.5 px-1 text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-[var(--text-muted)]" />
                <span>Bắt đầu: {center.detailRow.startedAt || '-'}</span>
                <User size={13} className="ml-3 text-[var(--text-muted)]" />
                <span>Bởi tài khoản #{center.detailRow.startedBy}</span>
              </div>
              {center.detailRow.completedAt && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-[var(--color-success-text)]" />
                  <span>Hoàn tất: {center.detailRow.completedAt}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 border-t border-[var(--border-default)] pt-4 mt-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 gap-1.5"
                disabled={!center.detailRow.canValidate || center.mutationState === 'pending'}
                onClick={center.runValidate}
              >
                <Play size={13} />
                Kiểm tra (Validate)
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 gap-1.5"
                disabled={!center.detailRow.canCommit}
                onClick={() => center.setConfirmAction('commit')}
              >
                <CheckCircle2 size={13} />
                Ghi nhận (Commit)
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1 gap-1.5"
                disabled={!center.detailRow.canCancel}
                onClick={() => center.setConfirmAction('cancel')}
              >
                <XCircle size={13} />
                Hủy bỏ (Cancel)
              </Button>
            </div>

            {/* Action Confirmation Panel Overlay */}
            {center.confirmAction && (
              <div className="p-3.5 rounded-lg border border-[var(--color-warning-text)]/20 bg-[var(--color-warning-bg)] text-[var(--text-primary)] mt-2 flex flex-col gap-3">
                <p className="text-xs leading-relaxed">
                  Xác nhận thực hiện hành động <strong className="uppercase font-bold text-[var(--color-action-primary)]">{center.confirmAction === 'commit' ? 'Ghi nhận (Commit)' : center.confirmAction === 'cancel' ? 'Hủy bỏ (Cancel)' : center.confirmAction}</strong>? 
                  Hành động này được cấp quyền bất đồng bộ từ hành động kiểm soát <code>allowed_actions</code> của máy chủ.
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 py-0"
                    onClick={() => center.setConfirmAction(null)}
                  >
                    Đóng
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 py-0"
                    disabled={center.mutationState === 'pending'}
                    onClick={center.runConfirmedAction}
                  >
                    Xác nhận
                  </Button>
                </div>
              </div>
            )}

            {center.actionError && (
              <div className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] flex items-center gap-2 text-xs mt-2" role="alert">
                <AlertCircle size={14} />
                <span>{center.actionError.code}: {center.actionError.message}</span>
              </div>
            )}

            {/* Error rows nested section */}
            <div className="flex flex-col gap-2.5 border-t border-[var(--border-default)] pt-4 mt-2">
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Chi tiết các dòng dữ liệu bị lỗi
              </h4>
              {center.errorsLoading && <p className="text-xs text-[var(--text-muted)]">Đang tải chi tiết lỗi...</p>}
              {center.errorsError && (
                <div className="p-3 rounded bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger)]/20 text-xs" role="alert">
                  {center.errorsError.code}: {center.errorsError.message}
                </div>
              )}
              
              <div className="w-full border border-[var(--border-default)] rounded-lg overflow-hidden bg-[var(--surface-1)]">
                <Table containerClassName="relative w-full overflow-auto max-h-48">
                  <TableHeader>
                    <TableRow className="bg-[var(--surface-2)] border-b border-[var(--border-default)] pointer-events-none hover:bg-transparent">
                      <TableHead className="text-[var(--text-secondary)]">Mã dòng (Code)</TableHead>
                      <TableHead className="text-[var(--text-secondary)]">Cột bị lỗi (Column)</TableHead>
                      <TableHead className="text-[var(--text-secondary)]">Nội dung lỗi chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {center.errors.map((row) => (
                      <TableRow key={row.code} className="border-b border-[var(--border-default)] hover:bg-[var(--surface-2)] transition-colors">
                        <TableCell className="font-semibold text-[var(--text-primary)] font-mono text-xs">{row.code}</TableCell>
                        <TableCell className="font-medium text-[var(--text-secondary)] font-mono text-xs">{row.column_name ?? '-'}</TableCell>
                        <TableCell className="text-xs text-[var(--color-danger-text)]">
                          {row.error_code}: {row.error_message_vi}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {center.errors.length === 0 && !center.errorsLoading && (
                  <div className="p-4 text-center text-xs text-[var(--text-secondary)] bg-[var(--surface-2)]">
                    Không có dòng lỗi nào được ghi nhận.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-[var(--border-default)]">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Đóng cửa sổ
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Excel Configuration Dialog Modal */}
      <Dialog
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        title={tab === 'import' ? "Khởi tạo / Tải lô nạp dữ liệu Excel" : "Khởi tạo Tác vụ Xuất dữ liệu Excel"}
        maxWidth="max-w-[75%]"
      >
        <div className="flex flex-col gap-6 font-sans text-sm text-[var(--text-primary)]">
          {tab === 'import' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Segment: Load / Inquiry Batch */}
              <div className="flex flex-col gap-4 bg-[var(--surface-1)] p-5 rounded-xl border border-[var(--border-default)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Search size={16} className="text-[var(--color-action-primary)]" />
                  Tải / Tra cứu Lô (Batch)
                </h3>
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(event) => {
                    event.preventDefault()
                    center.loadBatch()
                    setIsExcelOpen(false)
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Mẫu Phân hệ (Template Ownership)</span>
                    <Select
                      value={center.templateCode}
                      onChange={(event) => center.setTemplateCode(event.target.value)}
                    >
                      {center.templates.map((item) => (
                        <option key={item.templateCode} value={item.templateCode}>
                          {item.label} ({item.templateCode})
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Mã lô nạp dữ liệu (Batch Code)</span>
                    <Input
                      value={center.batchCodeInput}
                      onChange={(event) => center.setBatchCodeInput(event.target.value)}
                      placeholder="Ví dụ: IMP-000001"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button type="submit" size="sm" className="h-9 flex-1">
                      Tải lô dữ liệu
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-9"
                      onClick={center.refresh}
                      disabled={!center.detailRow}
                    >
                      <RotateCw size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-9 gap-1.5"
                      onClick={center.downloadTemplate}
                      disabled={center.downloadPending}
                    >
                      <Download size={14} />
                      Tải template
                    </Button>
                  </div>
                </form>
                {center.downloadError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 flex items-center gap-2 text-xs" role="alert">
                    <AlertCircle size={14} />
                    <span>{center.downloadError.code}: {center.downloadError.message}</span>
                  </div>
                )}
              </div>

              {/* Right Segment: Initialize New Batch */}
              <div className="flex flex-col gap-4 bg-[var(--surface-1)] p-5 rounded-xl border border-[var(--border-default)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <PlusCircle size={16} className="text-[var(--color-action-primary)]" />
                  Khởi tạo Batch mới
                </h3>
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (!window.confirm('Xác nhận tạo lô nạp dữ liệu (Import Batch) mới từ file nguồn?')) return
                    center.createBatch()
                    setIsExcelOpen(false)
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">ID File nguồn (Source File ID)</span>
                    <Input
                      value={center.sourceFileId}
                      onChange={(event) => center.setSourceFileId(event.target.value)}
                      placeholder="Nhập ID file dữ liệu nguồn (ví dụ: 123)..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Phương thức Ghi nhận (Commit Mode)</span>
                      <Select
                        value={center.mode}
                        onChange={(event) => center.setMode(event.target.value)}
                      >
                        {(center.template?.commitModes ?? ['ALL_OR_NOTHING', 'PARTIAL']).map((value) => (
                          <option key={value} value={value}>
                            {value === 'ALL_OR_NOTHING'
                              ? 'Tất cả hoặc không (ALL_OR_NOTHING)'
                              : value === 'PARTIAL'
                                ? 'Cho phép một phần (PARTIAL)'
                                : value}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Phương thức Nạp (Import Mode)</span>
                      <Select
                        value={center.importMode}
                        onChange={(event) => center.setImportMode(event.target.value)}
                      >
                        {(center.template?.importModes ?? ['UPSERT']).map((value) => (
                          <option key={value} value={value}>
                            {value === 'UPSERT'
                              ? 'Thêm mới hoặc Cập nhật (UPSERT)'
                              : value === 'INSERT'
                                ? 'Chỉ thêm mới (INSERT)'
                                : value === 'UPDATE'
                                  ? 'Chỉ cập nhật (UPDATE)'
                                  : value}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" disabled={center.createPending} size="sm" className="h-9 mt-2">
                    Tạo import batch
                  </Button>
                </form>
                {center.createError && (
                  <div className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] flex items-center gap-2 text-xs" role="alert">
                    <AlertCircle size={14} />
                    <span>{center.createError.code}: {center.createError.message}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 bg-[var(--surface-1)] p-5 rounded-xl border border-[var(--border-default)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Download size={16} className="text-[var(--color-action-primary)]" />
                Tạo Tác vụ Xuất dữ liệu (Export Job)
              </h3>
              <form
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  center.createExport()
                  setIsExcelOpen(false)
                }}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Mẫu xuất dữ liệu (Export Template)</span>
                  <Select
                    value={center.exportTemplateCode}
                    onChange={(event) => center.setExportTemplateCode(event.target.value)}
                  >
                    {center.exportTemplates.map((item) => (
                      <option key={item.templateCode} value={item.templateCode}>
                        {item.label} ({item.templateCode})
                      </option>
                    ))}
                  </Select>
                </div>
                <Button type="submit" disabled={center.exportPending} className="h-9">
                  Khởi tạo tác vụ xuất dữ liệu
                </Button>
              </form>
            </div>
          )}
        </div>
      </Dialog>
    </section>
  )
}
