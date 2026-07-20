import { useState } from 'react'
import { Link } from 'react-router'

import { useAuthStore } from '@/shared/store/authStore'
import { isSystemAdminSession } from '@/shared/api'

import { useFileStorageAdmin } from '../hooks/useFileStorageAdmin'

// Import Tailwind Shadcn UI & Layout components
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Badge } from '@/shared/components/ui/Badge'
import { Dialog } from '@/shared/components/ui/Dialog'
import { FilterBar } from '@/shared/components/ui/FilterBar'
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
  RefreshCw,
  Download,
  Trash2,
  AlertCircle,
  Clock,
  User,
  ShieldAlert,
  FileText,
  FileCheck,
  Globe,
} from 'lucide-react'

import './FileStorageAdminPage.css'

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải danh sách file…'
    case 'empty':
      return 'Chưa có file trong hệ thống.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem File Storage Admin (system_admin_only).'
    case 'error':
      return 'Không tải được danh sách file. Thử lại sau.'
    default:
      return ''
  }
}

function archiveStateMessage(state: string, message: string | null): string {
  switch (state) {
    case 'pending':
      return 'Đang lưu trữ file…'
    case 'success':
      return 'Đã lưu trữ (archive) file thành công.'
    case 'permission-denied':
      return 'Không có quyền archive file.'
    case 'error':
      return message ?? 'Archive thất bại.'
    default:
      return ''
  }
}

export function FileStorageAdminPage() {
  const session = useAuthStore((s) => s.session)
  const admin = useFileStorageAdmin()
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  if (!isSystemAdminSession(session)) {
    return (
      <section className="flex flex-col gap-6 font-sans">
        <PageHeader
          breadcrumbs={[
            { label: 'Trang chủ', href: '/home' },
            { label: 'Quản trị hệ thống', href: '/admin' },
            { label: 'File Storage' },
          ]}
          title="File Storage Admin"
          subtitle="Quản trị metadata lưu trữ tệp tin SmartFactory."
        />
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-sm flex items-center gap-2" role="alert">
          <ShieldAlert size={16} />
          <span>Bạn không có quyền xem File Storage Admin (chỉ dành cho system_admin).</span>
        </div>
      </section>
    )
  }

  const banner = listStateMessage(admin.listState)
  const archiveBanner = archiveStateMessage(
    admin.archiveState,
    admin.archiveError?.message ?? null,
  )

  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Quản trị', href: '/admin' },
          { label: 'File Storage' },
        ]}
        title="File Storage Admin"
        subtitle="Quản trị, tra cứu chi tiết và lưu trữ metadata tệp tin trong hệ thống."
        actions={
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5 h-9"
            onClick={admin.refresh}
            disabled={admin.listState === 'loading'}
          >
            <RefreshCw size={14} className={admin.listState === 'loading' ? 'animate-spin' : ''} />
            Làm mới
          </Button>
        }
      />

      <FilterBar
        fields={[
          {
            name: 'search',
            type: 'text',
            placeholder: 'Tìm kiếm theo mã tệp, tên file, định dạng MIME...',
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
        onSubmit={(event) => {
          event.preventDefault()
          admin.applySearch()
        }}
        onReset={() => {
          admin.setSearchInput('')
          admin.applySearch()
        }}
        isResetActive={Boolean(admin.searchInput)}
      />

      {banner && admin.listState !== 'ready' && (
        <div className="p-6 text-center text-sm text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-lg" role="status">
          {banner}
        </div>
      )}

      {archiveBanner && (
        <div
          className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${
            admin.archiveState === 'error'
              ? 'bg-red-50 dark:bg-red-950/20 text-red-650 border-red-200'
              : 'bg-green-50 dark:bg-green-950/20 text-green-700 border-green-200'
          }`}
          role="status"
        >
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>{archiveBanner}</span>
        </div>
      )}

      {(admin.listState === 'ready' || admin.rows.length > 0) && (
        <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <Table containerClassName="relative w-full overflow-auto">
            <TableHeader>
              <TableRow className="pointer-events-none hover:bg-transparent">
                <TableHead>Mã tệp</TableHead>
                <TableHead>Tên tệp (Filename)</TableHead>
                <TableHead>MIME Type</TableHead>
                <TableHead>Kích thước</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thời gian tải lên</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admin.rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`hover:bg-slate-50/50 cursor-pointer ${
                    row.id === admin.selectedId ? 'bg-blue-50/50 dark:bg-slate-800/80' : ''
                  }`}
                  onClick={() => {
                    admin.setSelectedId(row.id)
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
                        admin.setSelectedId(row.id)
                        setIsDetailOpen(true)
                      }}
                    >
                      {row.code}
                    </Button>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800 dark:text-slate-100 max-w-[200px] truncate" title={row.originalFilename}>
                    {row.originalFilename}
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs">{row.mimeType}</TableCell>
                  <TableCell className="text-slate-500">{row.sizeLabel}</TableCell>
                  <TableCell className="text-slate-550 font-mono text-xs">{row.storageProvider}</TableCell>
                  <TableCell>
                    <Badge variant={row.statusLabel === 'ACTIVE' ? 'active' : 'inactive'}>
                      {row.statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-450 whitespace-nowrap">{row.uploadedAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {admin.hasMore && (
            <div className="flex justify-center p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 px-6"
                onClick={admin.loadMore}
                disabled={admin.listState === 'loading'}
              >
                Tải thêm tệp tin
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Details Dialog Modal Overlay */}
      <Dialog
        isOpen={isDetailOpen && !!admin.selectedId}
        onClose={() => {
          setIsDetailOpen(false)
          admin.setConfirmArchive(false)
        }}
        title={admin.detailRow ? `Tệp tin: ${admin.detailRow.code}` : 'Chi tiết tệp tin'}
      >
        {admin.detailRow ? (
          <div className="flex flex-col gap-4 font-sans text-sm">
            {/* File Metrics Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Kích thước</span>
                <div className="mt-1 font-semibold text-slate-850 dark:text-slate-200">
                  {admin.detailRow.sizeLabel}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Định dạng MIME</span>
                <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200 font-mono text-xs truncate" title={admin.detailRow.mimeType}>
                  {admin.detailRow.mimeType}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Trạng thái</span>
                <div className="mt-1">
                  <Badge variant={admin.detailRow.statusLabel === 'ACTIVE' ? 'active' : 'inactive'}>
                    {admin.detailRow.statusLabel}
                  </Badge>
                </div>
              </div>
            </div>

            {/* File Properties */}
            <div className="flex flex-col gap-3 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">Tên tệp tin gốc</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 break-all">
                  <FileText size={14} className="text-blue-500" />
                  {admin.detailRow.originalFilename}
                </span>
              </div>
              <div className="flex flex-col gap-1 border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-0.5">
                <span className="text-xs font-semibold text-slate-400 uppercase">Khóa kiểm tra Checksum (SHA-256)</span>
                <span className="font-mono text-xs text-slate-655 break-all">
                  {admin.detailRow.checksumPreview}
                </span>
              </div>
            </div>

            {/* Metadata Upload Logs */}
            <div className="flex items-center gap-4 text-xs text-slate-550 dark:text-slate-400 px-1">
              <div className="flex items-center gap-1">
                <User size={13} className="text-slate-400" />
                <span>Bởi user #{admin.detailRow.uploadedBy}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={13} className="text-slate-400" />
                <span>Tải lên: {admin.detailRow.uploadedAt}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-1 gap-1.5"
                disabled={admin.detailRow.isDeleted || admin.downloadPending}
                onClick={admin.requestDownload}
              >
                <Download size={14} />
                Tải xuống tệp
              </Button>
              {!admin.detailRow.isDeleted && (
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => admin.setConfirmArchive(true)}
                >
                  <Trash2 size={14} />
                  Archive
                </Button>
              )}
            </div>

            {admin.downloadUrl && (
              <div className="p-3.5 rounded bg-green-50 dark:bg-green-950/20 text-green-750 border border-green-200 text-xs flex items-center justify-between mt-2">
                <span className="font-medium">URL tải xuống đã được khởi tạo:</span>
                <a
                  href={admin.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline text-green-700 hover:text-green-600 flex items-center gap-1"
                >
                  <Globe size={13} />
                  Mở link tải
                </a>
              </div>
            )}

            {admin.downloadError && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs flex items-center gap-2 mt-2" role="alert">
                <AlertCircle size={14} />
                <span>Lỗi download: {admin.downloadError.message}</span>
              </div>
            )}

            {/* Archive Confirmation overlay */}
            {admin.confirmArchive && (
              <div className="p-3.5 rounded-lg border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10 text-slate-800 dark:text-slate-200 mt-2 flex flex-col gap-3">
                <p className="text-xs leading-relaxed font-medium">
                  Hành động lưu trữ (archive) sẽ thu hồi quyền truy cập tệp và soft-delete metadata tệp khỏi hệ thống. Vui lòng nhập lý do.
                </p>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400">Lý do lưu trữ</span>
                  <Input
                    value={admin.archiveReason}
                    onChange={(event) => admin.setArchiveReason(event.target.value)}
                    placeholder="Nhập lý do thực hiện lưu trữ..."
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 py-0"
                    onClick={() => admin.setConfirmArchive(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="h-8 py-0"
                    disabled={admin.archiveReason.trim().length === 0 || admin.archiveState === 'pending'}
                    onClick={admin.requestArchive}
                  >
                    Xác nhận
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Đóng chi tiết
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Chọn một file để xem chi tiết.</p>
        )}
      </Dialog>
    </section>
  )
}
