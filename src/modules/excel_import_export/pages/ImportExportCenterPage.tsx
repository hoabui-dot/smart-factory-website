import { useState } from 'react'
import { Link } from 'react-router'

import { useImportExportCenter } from '../hooks/useImportExportCenter'
import { usePagination } from '@/shared/lib/usePagination'
import { DataTablePagination } from '@/shared/components/DataTablePagination'

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
      />

      {/* Modern Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tab === 'import'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
          }`}
          onClick={() => setTab('import')}
        >
          Trung tâm Nhập dữ liệu (Import)
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tab === 'export'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
          }`}
          onClick={() => setTab('export')}
        >
          Trung tâm Xuất dữ liệu (Export)
        </button>
      </div>

      {tab === 'import' ? (
        <>
          {/* Dual Panel Configuration Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card: Load / Inquiry Batch */}
            <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Search size={16} className="text-blue-600 dark:text-blue-500" />
                Tải / Tra cứu Lô (Batch)
              </h3>
              <form
                className="flex flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  center.loadBatch()
                }}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mẫu Phân hệ (Template Ownership)</span>
                  <Select
                    value={center.templateCode}
                    onChange={(event) => center.setTemplateCode(event.target.value)}
                    className="h-9"
                  >
                    {center.templates.map((item) => (
                      <option key={item.templateCode} value={item.templateCode}>
                        {item.label} ({item.templateCode})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mã lô nạp dữ liệu (Batch Code)</span>
                  <Input
                    value={center.batchCodeInput}
                    onChange={(event) => center.setBatchCodeInput(event.target.value)}
                    placeholder="Ví dụ: IMP-000001"
                    className="h-9"
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

            {/* Right Card: Initialize New Batch */}
            <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <PlusCircle size={16} className="text-green-600 dark:text-green-500" />
                Khởi tạo Batch mới
              </h3>
              <form
                className="flex flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  center.createBatch()
                }}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ID File nguồn (Source File ID)</span>
                  <Input
                    value={center.sourceFileId}
                    onChange={(event) => center.setSourceFileId(event.target.value)}
                    placeholder="Nhập ID file dữ liệu nguồn (ví dụ: 123)..."
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phương thức Ghi nhận (Commit Mode)</span>
                    <Select
                      value={center.mode}
                      onChange={(event) => center.setMode(event.target.value)}
                      className="h-9"
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
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phương thức Nạp (Import Mode)</span>
                    <Select
                      value={center.importMode}
                      onChange={(event) => center.setImportMode(event.target.value)}
                      className="h-9"
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
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 flex items-center gap-2 text-xs" role="alert">
                  <AlertCircle size={14} />
                  <span>{center.createError.code}: {center.createError.message}</span>
                </div>
              )}
            </div>
          </div>

          {banner && (
            <p
              className={`p-4 rounded border text-sm ${
                center.batchState === 'error' || center.batchState === 'permission-denied'
                  ? 'bg-red-50 dark:bg-red-950/20 text-red-650 border-red-200'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-250 dark:border-slate-800'
              }`}
              role={center.batchState === 'error' ? 'alert' : 'status'}
            >
              {banner}
              {center.batchError ? ` (${center.batchError.code})` : ''}
            </p>
          )}

          {/* Session Batches Table */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 px-1">
              <FileSpreadsheet size={16} className="text-slate-400" />
              Danh sách Batch trong phiên
            </h3>
            
            <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
              <Table containerClassName="relative w-full overflow-auto">
                <TableHeader>
                  <TableRow className="pointer-events-none hover:bg-transparent">
                    <TableHead>Mã Batch</TableHead>
                    <TableHead>Mã Template</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionPagination.paginatedItems.map((code) => (
                    <TableRow
                      key={code}
                      className={code === center.detailRow?.code ? 'bg-blue-50/50 dark:bg-slate-800/80' : ''}
                      onClick={() => {
                        center.selectSessionBatch(code)
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
                            center.selectSessionBatch(code)
                            setIsDetailOpen(true)
                          }}
                        >
                          {code}
                        </Button>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-250">{center.templateCode}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {center.sessionBatches.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
                  Chưa có lô nạp dữ liệu nào được khởi tạo trong phiên này.
                </div>
              )}
              <DataTablePagination {...sessionPagination} />
            </div>
          </div>
        </>
      ) : (
        /* Export Tab Content */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Download size={16} className="text-blue-600 dark:text-blue-500" />
              Tạo Tác vụ Xuất dữ liệu (Export Job)
            </h3>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                center.createExport()
              }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mẫu xuất dữ liệu (Export Template)</span>
                <Select
                  value={center.exportTemplateCode}
                  onChange={(event) => center.setExportTemplateCode(event.target.value)}
                  className="h-9"
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

          <div className="lg:col-span-2 flex flex-col gap-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Info size={16} className="text-slate-400" />
              Kết quả xuất dữ liệu
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Phân hệ sở hữu (owning module) sẽ xử lý tác vụ bất đồng bộ và trả về kết quả trạng thái chi tiết của Export Job.
            </p>
            {center.exportError && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 flex items-center gap-2 text-xs" role="alert">
                <AlertCircle size={14} />
                <span>{center.exportError.code}: {center.exportError.message}</span>
              </div>
            )}
            {center.exportResult ? (
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-sm mt-2">
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <dt className="text-xs font-semibold text-slate-400 uppercase">Mã tác vụ xuất (Job Code)</dt>
                  <dd className="font-mono text-base font-semibold text-slate-800 dark:text-slate-100 mt-1">
                    {center.exportResult.code}
                  </dd>
                </div>
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <dt className="text-xs font-semibold text-slate-400 uppercase">Trạng thái (Status)</dt>
                  <dd className="mt-1">
                    <Badge variant={center.exportResult.status === 'COMPLETED' ? 'active' : 'inactive'}>
                      {center.exportResult.status}
                    </Badge>
                  </dd>
                </div>
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <dt className="text-xs font-semibold text-slate-400 uppercase">Phân loại báo cáo</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {center.exportResult.report_type}
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="text-sm text-slate-400 p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center bg-white dark:bg-slate-900/10">
                Chưa có tác vụ xuất dữ liệu nào được thực thi.
              </div>
            )}
          </div>
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
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Trạng thái</span>
                <div className="mt-1 font-semibold text-sm text-slate-800 dark:text-slate-200">
                  <Badge variant={center.detailRow.status === 'COMMITTED' ? 'active' : center.detailRow.status === 'FAILED' ? 'inactive' : 'default'}>
                    {center.detailRow.status}
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Đối tượng nạp (Target Entity)</span>
                <div className="mt-1 font-semibold text-sm text-slate-700 dark:text-slate-300 font-mono truncate" title={center.detailRow.targetEntity}>
                  {center.detailRow.targetEntity}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Commit Mode</span>
                <div className="mt-1 font-semibold text-sm text-slate-800 dark:text-slate-200">
                  {center.detailRow.mode === 'ALL_OR_NOTHING'
                    ? 'Tất cả hoặc không (ALL_OR_NOTHING)'
                    : center.detailRow.mode === 'PARTIAL'
                      ? 'Nạp một phần (PARTIAL)'
                      : center.detailRow.mode}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Import Mode</span>
                <div className="mt-1 font-semibold text-sm text-slate-800 dark:text-slate-200">
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
            <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Thống kê dòng dữ liệu</span>
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                <span>Tổng số bản ghi: <strong className="font-semibold text-slate-800 dark:text-slate-100">{center.detailRow.totalRows}</strong></span>
                <span>Nạp thành công: <strong className="font-semibold text-green-600">{center.detailRow.successRows}</strong></span>
                <span>Số dòng lỗi: <strong className="font-semibold text-red-650">{center.detailRow.failedRows}</strong></span>
                <span>Số dòng bỏ qua: <strong className="font-semibold text-slate-450">{center.detailRow.skippedRows}</strong></span>
              </div>
            </div>

            {/* Metadata Timestamps */}
            <div className="flex flex-col gap-2.5 px-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-slate-400" />
                <span>Bắt đầu: {center.detailRow.startedAt || '-'}</span>
                <User size={13} className="ml-3 text-slate-400" />
                <span>Bởi tài khoản #{center.detailRow.startedBy}</span>
              </div>
              {center.detailRow.completedAt && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-green-500" />
                  <span>Hoàn tất: {center.detailRow.completedAt}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
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
              <div className="p-3.5 rounded-lg border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10 text-slate-800 dark:text-slate-200 mt-2 flex flex-col gap-3">
                <p className="text-xs leading-relaxed">
                  Xác nhận thực hiện hành động <strong className="uppercase font-bold text-blue-650 dark:text-blue-400">{center.confirmAction === 'commit' ? 'Ghi nhận (Commit)' : center.confirmAction === 'cancel' ? 'Hủy bỏ (Cancel)' : center.confirmAction}</strong>? 
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
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 flex items-center gap-2 text-xs mt-2" role="alert">
                <AlertCircle size={14} />
                <span>{center.actionError.code}: {center.actionError.message}</span>
              </div>
            )}

            {/* Error rows nested section */}
            <div className="flex flex-col gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Chi tiết các dòng dữ liệu bị lỗi
              </h4>
              {center.errorsLoading && <p className="text-xs text-slate-400">Đang tải chi tiết lỗi...</p>}
              {center.errorsError && (
                <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs" role="alert">
                  {center.errorsError.code}: {center.errorsError.message}
                </div>
              )}
              
              <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <Table containerClassName="relative w-full overflow-auto max-h-48">
                  <TableHeader>
                    <TableRow className="pointer-events-none hover:bg-transparent">
                      <TableHead>Mã dòng (Code)</TableHead>
                      <TableHead>Cột bị lỗi (Column)</TableHead>
                      <TableHead>Nội dung lỗi chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {center.errors.map((row) => (
                      <TableRow key={row.code}>
                        <TableCell className="font-semibold text-slate-800 dark:text-slate-250 font-mono text-xs">{row.code}</TableCell>
                        <TableCell className="font-medium text-slate-500 font-mono text-xs">{row.column_name ?? '-'}</TableCell>
                        <TableCell className="text-xs text-red-600 dark:text-red-400">
                          {row.error_code}: {row.error_message_vi}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {center.errors.length === 0 && !center.errorsLoading && (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
                    Không có dòng lỗi nào được ghi nhận.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Đóng cửa sổ
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </section>
  )
}
