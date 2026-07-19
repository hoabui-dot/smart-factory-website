import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { useAuthStore } from '@/shared/store/authStore'
import { isSystemAdminSession } from '@/shared/api'

import { usePrintQueueAdmin } from '../hooks/usePrintQueueAdmin'
import type { PrintJobAction } from '../types/labelPrinting'

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
  Printer,
  FileText,
  Play,
  RotateCw,
  Search,
  AlertCircle,
  Clock,
  PrinterIcon,
  PlusCircle,
  FileSpreadsheet,
  Terminal,
  Activity,
  XCircle,
} from 'lucide-react'

import './PrintQueueAdminPage.css'

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải print queue…'
    case 'empty':
      return 'Chưa có print job.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem Print Queue (system_admin_only).'
    case 'error':
      return 'Không tải được print queue. Thử lại sau.'
    default:
      return ''
  }
}

function actionLabel(action: PrintJobAction): string {
  switch (action) {
    case 'retry':
      return 'Retry'
    case 'cancel':
      return 'Cancel'
    case 'request_reprint':
      return 'Reprint'
    case 'approve_reprint':
      return 'Approve Reprint'
    default:
      return action
  }
}

export function PrintQueueAdminPage() {
  const session = useAuthStore((s) => s.session)
  const admin = usePrintQueueAdmin()
  
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false)
  const [isPrinterDetailOpen, setIsPrinterDetailOpen] = useState(false)
  const [isTemplateDetailOpen, setIsTemplateDetailOpen] = useState(false)

  const [enqueueForm, setEnqueueForm] = useState({
    entity_type: 'LOT',
    entity_id: '',
    template_code: '',
    printer_code: '',
    copies: '1',
  })
  const [printerForm, setPrinterForm] = useState({
    code: '',
    printer_name: '',
    model: '',
    protocol: 'ZPL',
    ip_address: '',
    location_id: '',
    supported_label_types: 'LOT,CON,FC,BIN,MACHINE',
    is_active: true,
  })
  const [templateForm, setTemplateForm] = useState({
    code: '',
    label_type: 'LOT',
    version: 'v1',
    template_format: 'ZPL',
    template_body: '^XA^FD{{lot_no}}^XZ',
    is_active: true,
    effective_from: new Date().toISOString(),
  })

  if (!isSystemAdminSession(session)) {
    return (
      <section className="flex flex-col gap-6 font-sans">
        <PageHeader
          breadcrumbs={[
            { label: 'Trang chủ', href: '/home' },
            { label: 'Quản trị hệ thống', href: '/admin' },
            { label: 'Print Management' },
          ]}
          title="Print Queue"
          subtitle="Hệ thống quản trị hàng đợi in ấn nhãn công nghiệp."
        />
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-sm flex items-center gap-2" role="alert">
          <AlertCircle size={16} />
          <span>Bạn không có quyền xem hàng đợi in ấn (chỉ dành cho system_admin).</span>
        </div>
      </section>
    )
  }

  const banner = admin.tab === 'jobs' ? listStateMessage(admin.listState) : ''

  const onEnqueue = (event: FormEvent) => {
    event.preventDefault()
    const entityId = Number(enqueueForm.entity_id)
    const copies = Number(enqueueForm.copies)
    if (!Number.isInteger(entityId) || entityId <= 0 || !Number.isInteger(copies) || copies <= 0) {
      return
    }
    admin.enqueue({
      entity_type: enqueueForm.entity_type.trim(),
      entity_id: entityId,
      template_code: enqueueForm.template_code.trim(),
      printer_code: enqueueForm.printer_code.trim(),
      copies,
    })
  }

  const onCreatePrinter = (event: FormEvent) => {
    event.preventDefault()
    const locationId = Number(printerForm.location_id)
    if (!Number.isInteger(locationId) || locationId <= 0) {
      return
    }
    admin.createPrinter({
      code: printerForm.code.trim(),
      printer_name: printerForm.printer_name.trim(),
      model: printerForm.model.trim(),
      protocol: printerForm.protocol,
      ip_address: printerForm.ip_address.trim() || undefined,
      location_id: locationId,
      supported_label_types: printerForm.supported_label_types.trim(),
      is_active: printerForm.is_active,
    })
  }

  const onCreateTemplate = (event: FormEvent) => {
    event.preventDefault()
    admin.createTemplate({
      code: templateForm.code.trim(),
      label_type: templateForm.label_type,
      version: templateForm.version.trim(),
      template_format: templateForm.template_format,
      template_body: templateForm.template_body,
      is_active: templateForm.is_active,
      effective_from: templateForm.effective_from,
    })
  }

  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Quản trị', href: '/admin' },
          { label: 'Print Queue' },
        ]}
        title="Print Queue / Printer"
        subtitle="Hệ thống quản lý hàng đợi in ấn nhãn công nghiệp, thiết bị in ZPL/TSPL và template nhãn vạch."
      />

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'jobs'}
          className={`pb-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            admin.tab === 'jobs'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
          onClick={() => admin.setTab('jobs')}
        >
          Print Jobs
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'printers'}
          className={`pb-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            admin.tab === 'printers'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
          onClick={() => admin.setTab('printers')}
        >
          Printers
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'templates'}
          className={`pb-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            admin.tab === 'templates'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
          onClick={() => admin.setTab('templates')}
        >
          Templates
        </button>
      </div>

      {banner && (
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
          {banner}
        </div>
      )}

      {/* JOBS TAB CONTENT */}
      {admin.tab === 'jobs' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form: Enqueue print job */}
            <div className="lg:col-span-1 flex flex-col gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-250 flex items-center gap-2">
                <PlusCircle size={16} className="text-blue-600" />
                Yêu cầu in mới (Enqueue)
              </h3>
              <form className="flex flex-col gap-3" onSubmit={onEnqueue}>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400">Loại đối tượng (entity_type)</span>
                  <Input
                    value={enqueueForm.entity_type}
                    onChange={(e) => setEnqueueForm((s) => ({ ...s, entity_type: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400">ID đối tượng (entity_id)</span>
                  <Input
                    value={enqueueForm.entity_id}
                    onChange={(e) => setEnqueueForm((s) => ({ ...s, entity_id: e.target.value }))}
                    placeholder="Ví dụ: 101"
                    className="h-9"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400">Template</span>
                  <Select
                    value={enqueueForm.template_code}
                    onChange={(e) => setEnqueueForm((s) => ({ ...s, template_code: e.target.value }))}
                    className="h-9"
                  >
                    <option value="">Chọn template</option>
                    {admin.templates.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.code}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400">Máy in (Printer)</span>
                  <Select
                    value={enqueueForm.printer_code}
                    onChange={(e) => setEnqueueForm((s) => ({ ...s, printer_code: e.target.value }))}
                    className="h-9"
                  >
                    <option value="">Chọn máy in</option>
                    {admin.printers.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.code}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400">Số bản sao (copies)</span>
                  <Input
                    value={enqueueForm.copies}
                    onChange={(e) => setEnqueueForm((s) => ({ ...s, copies: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <Button type="submit" size="sm" disabled={admin.enqueuePending} className="h-9 mt-2">
                  Gửi yêu cầu in
                </Button>
              </form>
              
              {admin.enqueueError && (
                <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs flex items-center gap-1.5" role="alert">
                  <AlertCircle size={14} />
                  <span>{admin.enqueueError.code}: {admin.enqueueError.message}</span>
                </div>
              )}
              {admin.enqueueSuccess && (
                <div className="p-3 rounded bg-green-50/40 dark:bg-green-950/10 text-green-650 border border-green-200 text-xs" role="status">
                  Đã xếp hàng yêu cầu in thành công.
                </div>
              )}
            </div>

            {/* Print Jobs List */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {/* Search Toolbar */}
              <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <form
                  className="flex-1 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    admin.applySearch()
                  }}
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      value={admin.searchInput}
                      onChange={(event) => admin.setSearchInput(event.target.value)}
                      placeholder="Tìm kiếm theo mã in, loại nhãn..."
                      className="pl-9 h-9"
                    />
                  </div>
                  <Button type="submit" size="sm" className="h-9">
                    Lọc
                  </Button>
                  <Button type="button" variant="secondary" size="sm" className="h-9" onClick={admin.refresh}>
                    <RotateCw size={14} />
                  </Button>
                </form>
              </div>

              <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <Table containerClassName="relative w-full overflow-auto">
                  <TableHeader>
                    <TableRow className="pointer-events-none hover:bg-transparent">
                      <TableHead>Mã in (Code)</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Loại nhãn</TableHead>
                      <TableHead>Máy in</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Thời gian yêu cầu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admin.jobRows.map((row) => (
                      <TableRow
                        key={row.code}
                        className={`hover:bg-slate-50/50 cursor-pointer ${
                          row.code === admin.selectedCode ? 'bg-blue-50/50 dark:bg-slate-800/80' : ''
                        }`}
                        onClick={() => {
                          admin.setSelectedCode(row.code)
                          setIsJobDetailOpen(true)
                        }}
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-0 py-0 h-auto font-semibold hover:underline"
                            onClick={(e) => {
                              e.stopPropagation()
                              admin.setSelectedCode(row.code)
                              setIsJobDetailOpen(true)
                            }}
                          >
                            {row.code}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.status === 'COMPLETED' ? 'active' : row.status === 'FAILED' ? 'inactive' : 'default'}>
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-850 dark:text-slate-100">{row.labelType}</TableCell>
                        <TableCell className="text-slate-550 font-mono text-xs">{row.printerLabel}</TableCell>
                        <TableCell className="text-slate-550 font-mono text-xs">{row.templateLabel}</TableCell>
                        <TableCell className="text-slate-400 whitespace-nowrap">{row.requestedAt}</TableCell>
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
                    >
                      Tải thêm print jobs
                    </Button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PRINTERS TAB CONTENT */}
      {admin.tab === 'printers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form: Create printer */}
          <div className="lg:col-span-1 flex flex-col gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-250 flex items-center gap-2">
              <PlusCircle size={16} className="text-green-600" />
              Đăng ký Máy in (Printer)
            </h3>
            <form className="flex flex-col gap-3" onSubmit={onCreatePrinter}>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Mã máy in (code)</span>
                <Input
                  value={printerForm.code}
                  onChange={(e) => setPrinterForm((s) => ({ ...s, code: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Tên máy in (printer_name)</span>
                <Input
                  value={printerForm.printer_name}
                  onChange={(e) => setPrinterForm((s) => ({ ...s, printer_name: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Model máy in</span>
                <Input
                  value={printerForm.model}
                  onChange={(e) => setPrinterForm((s) => ({ ...s, model: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Giao thức truyền (protocol)</span>
                <Select
                  value={printerForm.protocol}
                  onChange={(e) => setPrinterForm((s) => ({ ...s, protocol: e.target.value }))}
                  className="h-9"
                >
                  <option value="ZPL">ZPL (Zebra)</option>
                  <option value="TSPL">TSPL (TSC)</option>
                  <option value="ESC_POS">ESC/POS (Thermal)</option>
                  <option value="PDF">PDF Document</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Mã vị trí (location_id)</span>
                <Input
                  value={printerForm.location_id}
                  onChange={(e) => setPrinterForm((s) => ({ ...s, location_id: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">IP Address (Không bắt buộc)</span>
                <Input
                  value={printerForm.ip_address}
                  onChange={(e) => setPrinterForm((s) => ({ ...s, ip_address: e.target.value }))}
                  placeholder="192.168.1.100"
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Supported labels</span>
                <Input
                  value={printerForm.supported_label_types}
                  onChange={(e) =>
                    setPrinterForm((s) => ({ ...s, supported_label_types: e.target.value }))
                  }
                  className="h-9"
                />
              </div>
              <Button type="submit" size="sm" disabled={admin.createPrinterPending} className="h-9 mt-2">
                Đăng ký máy in
              </Button>
            </form>
            {admin.createPrinterError && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs flex items-center gap-1.5" role="alert">
                <AlertCircle size={14} />
                <span>{admin.createPrinterError.message}</span>
              </div>
            )}
          </div>

          {/* Printers List Table */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {admin.printersError && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs">
                {admin.printersError.message}
              </div>
            )}
            {admin.printersLoading && <div className="text-sm text-slate-450">Đang tải danh sách printers...</div>}
            
            <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <Table containerClassName="relative w-full overflow-auto">
                <TableHeader>
                  <TableRow className="pointer-events-none hover:bg-transparent">
                    <TableHead>Mã máy in</TableHead>
                    <TableHead>Tên máy in</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Kích hoạt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admin.printers.map((p) => (
                    <TableRow
                      key={p.code}
                      className={`hover:bg-slate-50/50 cursor-pointer ${
                        p.code === admin.selectedPrinterCode ? 'bg-blue-50/50 dark:bg-slate-800/80' : ''
                      }`}
                      onClick={() => {
                        admin.setSelectedPrinterCode(p.code)
                        setIsPrinterDetailOpen(true)
                      }}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-0 py-0 h-auto font-semibold hover:underline"
                          onClick={(e) => {
                            e.stopPropagation()
                            admin.setSelectedPrinterCode(p.code)
                            setIsPrinterDetailOpen(true)
                          }}
                        >
                          {p.code}
                        </Button>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-850 dark:text-slate-100">{p.printer_name}</TableCell>
                      <TableCell className="text-slate-500 font-mono text-xs">{p.protocol}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'READY' ? 'active' : 'default'}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.is_active ? 'active' : 'inactive'}>
                          {p.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATES TAB CONTENT */}
      {admin.tab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form: Create template */}
          <div className="lg:col-span-1 flex flex-col gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-250 flex items-center gap-2">
              <PlusCircle size={16} className="text-orange-600" />
              Tạo Template Nhãn mới
            </h3>
            <form className="flex flex-col gap-3" onSubmit={onCreateTemplate}>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Mã template (code)</span>
                <Input
                  value={templateForm.code}
                  onChange={(e) => setTemplateForm((s) => ({ ...s, code: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Loại nhãn (label_type)</span>
                <Select
                  value={templateForm.label_type}
                  onChange={(e) => setTemplateForm((s) => ({ ...s, label_type: e.target.value }))}
                  className="h-9"
                >
                  <option value="LOT">LOT (Nhãn lô vật tư)</option>
                  <option value="CON">CON (Container/Pallet)</option>
                  <option value="FC">FC (Phiếu nhập xuất)</option>
                  <option value="BIN">BIN (Vị trí kho)</option>
                  <option value="MACHINE">MACHINE (Máy móc/Thiết bị)</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Phiên bản (version)</span>
                <Input
                  value={templateForm.version}
                  onChange={(e) => setTemplateForm((s) => ({ ...s, version: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Định dạng template</span>
                <Select
                  value={templateForm.template_format}
                  onChange={(e) =>
                    setTemplateForm((s) => ({ ...s, template_format: e.target.value }))
                  }
                  className="h-9"
                >
                  <option value="ZPL">ZPL (Zebra Markup)</option>
                  <option value="TSPL">TSPL (Command Language)</option>
                  <option value="HTML">HTML (Raw Document)</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Nội dung template (ZPL/HTML)</span>
                <textarea
                  value={templateForm.template_body}
                  onChange={(e) =>
                    setTemplateForm((s) => ({ ...s, template_body: e.target.value }))
                  }
                  rows={4}
                  className="w-full text-xs font-mono p-2.5 border border-slate-350 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
              </div>
              <Button type="submit" size="sm" disabled={admin.createTemplatePending} className="h-9 mt-2">
                Tạo template
              </Button>
            </form>
            {admin.createTemplateError && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs flex items-center gap-1.5" role="alert">
                <AlertCircle size={14} />
                <span>{admin.createTemplateError.message}</span>
              </div>
            )}
          </div>

          {/* Templates List Table */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {admin.templatesError && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs">
                {admin.templatesError.message}
              </div>
            )}
            {admin.templatesLoading && <div className="text-sm text-slate-450">Đang tải danh sách templates...</div>}

            <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <Table containerClassName="relative w-full overflow-auto">
                <TableHeader>
                  <TableRow className="pointer-events-none hover:bg-transparent">
                    <TableHead>Mã Template</TableHead>
                    <TableHead>Label Type</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admin.templates.map((t) => (
                    <TableRow
                      key={t.code}
                      className={`hover:bg-slate-50/50 cursor-pointer ${
                        t.code === admin.selectedTemplateCode ? 'bg-blue-50/50 dark:bg-slate-800/80' : ''
                      }`}
                      onClick={() => {
                        admin.setSelectedTemplateCode(t.code)
                        setIsTemplateDetailOpen(true)
                      }}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-0 py-0 h-auto font-semibold hover:underline"
                          onClick={(e) => {
                            e.stopPropagation()
                            admin.setSelectedTemplateCode(t.code)
                            setIsTemplateDetailOpen(true)
                          }}
                        >
                          {t.code}
                        </Button>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-850 dark:text-slate-100">{t.label_type}</TableCell>
                      <TableCell className="text-slate-500 font-mono text-xs">{t.version}</TableCell>
                      <TableCell className="text-slate-500 font-mono text-xs">{t.template_format}</TableCell>
                      <TableCell>
                        <Badge variant={t.is_active ? 'active' : 'inactive'}>
                          {t.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* JOBS DETAIL DIALOG OVERLAY */}
      <Dialog
        isOpen={isJobDetailOpen && !!admin.selectedCode && admin.tab === 'jobs'}
        onClose={() => {
          setIsJobDetailOpen(false)
          admin.setConfirmAction(null)
        }}
        title={admin.detailRow ? `Print Job: ${admin.detailRow.code}` : 'Chi tiết in'}
      >
        {admin.detailRow ? (
          <div className="flex flex-col gap-4 font-sans text-sm">
            {/* Job metrics metadata */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Trạng thái</span>
                <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                  <Badge variant={admin.detailRow.status === 'COMPLETED' ? 'active' : admin.detailRow.status === 'FAILED' ? 'inactive' : 'default'}>
                    {admin.detailRow.status}
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Số bản in</span>
                <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                  {admin.detailRow.copies} bản
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Đối tượng chính</span>
                <div className="mt-1 font-semibold text-slate-850 dark:text-slate-200 truncate" title={admin.detailRow.parentType}>
                  {admin.detailRow.parentType}
                </div>
              </div>
            </div>

            {/* Time Metrics */}
            <div className="flex flex-col gap-2 p-3 rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-1.5 text-xs text-slate-550 dark:text-slate-400">
                <Clock size={13} className="text-slate-400" />
                <span>Thời gian yêu cầu: {admin.detailRow.requestedAt || '-'}</span>
              </div>
              {admin.detailRow.printedAt && (
                <div className="flex items-center gap-1.5 text-xs text-slate-550 dark:text-slate-400">
                  <PrinterIcon size={13} className="text-green-500" />
                  <span>Thời gian in thực tế: {admin.detailRow.printedAt}</span>
                </div>
              )}
            </div>

            {/* Linked hardware logs */}
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-655 bg-slate-50/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block">Printer Code:</span>
                <strong className="font-semibold text-slate-850 dark:text-slate-200">{admin.detailRow.printerLabel}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Template Code:</span>
                <strong className="font-semibold text-slate-850 dark:text-slate-200">{admin.detailRow.templateLabel}</strong>
              </div>
            </div>

            {/* Error Message log if any */}
            {admin.detailRow.errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs">
                <strong>Thông báo lỗi:</strong> {admin.detailRow.errorMessage}
              </div>
            )}

            {/* ZPL Payload preview */}
            <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
              <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                <Terminal size={13} />
                Nội dung nhãn (Payload Preview)
              </span>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-48 leading-relaxed">
                {admin.detailRow.payloadPreview}
              </pre>
            </div>

            {/* Action buttons list */}
            <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
              {admin.detailRow.actions.map((action) => (
                <Button
                  key={action}
                  variant={action === 'cancel' ? 'danger' : 'secondary'}
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => {
                    admin.setActionReason('')
                    admin.setConfirmAction(action)
                  }}
                >
                  <Activity size={13} />
                  {actionLabel(action)}
                </Button>
              ))}
            </div>

            {/* Action Confirmation Inline panel inside dialog */}
            {admin.confirmAction && (
              <div className="p-3.5 rounded-lg border border-yellow-250 bg-yellow-50/50 dark:bg-yellow-950/10 text-slate-850 dark:text-slate-200 mt-2 flex flex-col gap-3">
                <p className="text-xs leading-relaxed">
                  Xác nhận thực hiện hành động <strong className="uppercase font-bold text-blue-650 dark:text-blue-400">{actionLabel(admin.confirmAction)}</strong> cho mã in {admin.detailRow.code}?
                </p>
                {admin.reasonRequired && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-400">Lý do thực hiện</span>
                    <Input
                      value={admin.actionReason}
                      onChange={(event) => admin.setActionReason(event.target.value)}
                      placeholder="Bắt buộc nhập lý do..."
                      className="h-8 text-xs"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 py-0"
                    onClick={() => admin.setConfirmAction(null)}
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 py-0"
                    disabled={
                      (admin.reasonRequired && admin.actionReason.trim().length === 0) ||
                      admin.actionState === 'pending'
                    }
                    onClick={admin.requestJobAction}
                  >
                    Xác nhận
                  </Button>
                </div>
              </div>
            )}

            {admin.actionError && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs flex items-center gap-1.5 mt-2" role="alert">
                <AlertCircle size={14} />
                <span>{admin.actionError.code}: {admin.actionError.message}</span>
              </div>
            )}
            {admin.actionState === 'success' && (
              <div className="p-3 rounded bg-green-50/40 dark:bg-green-950/10 text-green-650 border border-green-200 text-xs mt-2" role="status">
                Thực hiện hành động thành công.
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">
              <Button variant="secondary" onClick={() => setIsJobDetailOpen(false)}>
                Đóng chi tiết
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Chọn một print job để xem chi tiết.</p>
        )}
      </Dialog>

      {/* PRINTER DETAIL DIALOG OVERLAY */}
      <Dialog
        isOpen={isPrinterDetailOpen && !!admin.selectedPrinterCode && admin.tab === 'printers'}
        onClose={() => {
          setIsPrinterDetailOpen(false)
          admin.setConfirmArchivePrinter(false)
        }}
        title={`Máy in: ${admin.selectedPrinterCode}`}
      >
        <div className="flex flex-col gap-4 font-sans text-sm">
          <p className="text-slate-600 dark:text-slate-350 leading-relaxed">
            Quản trị trạng thái và cấu hình phần cứng cho thiết bị in mã{' '}
            <strong className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
              {admin.selectedPrinterCode}
            </strong>.
          </p>

          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="danger"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => admin.setConfirmArchivePrinter(true)}
            >
              <XCircle size={14} />
              Deactivate Printer
            </Button>
          </div>

          {/* Confirm archive printer */}
          {admin.confirmArchivePrinter && (
            <div className="p-3.5 rounded-lg border border-yellow-250 bg-yellow-50/50 dark:bg-yellow-950/10 text-slate-850 dark:text-slate-205 mt-2 flex flex-col gap-3">
              <p className="text-xs leading-relaxed">
                Deactivate máy in <strong className="font-mono">{admin.selectedPrinterCode}</strong>? Nhấp xác nhận để lưu cấu hình.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" className="h-8 py-0" onClick={() => admin.setConfirmArchivePrinter(false)}>
                  Hủy
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="h-8 py-0"
                  disabled={admin.archivePrinterState === 'pending'}
                  onClick={admin.requestArchivePrinter}
                >
                  Xác nhận
                </Button>
              </div>
            </div>
          )}

          {admin.archivePrinterError && (
            <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs flex items-center gap-1.5 mt-2" role="alert">
              <AlertCircle size={14} />
              <span>{admin.archivePrinterError.message}</span>
            </div>
          )}

          <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">
            <Button variant="secondary" onClick={() => setIsPrinterDetailOpen(false)}>
              Đóng chi tiết
            </Button>
          </div>
        </div>
      </Dialog>

      {/* TEMPLATE DETAIL DIALOG OVERLAY */}
      <Dialog
        isOpen={isTemplateDetailOpen && !!admin.selectedTemplateCode && admin.tab === 'templates'}
        onClose={() => {
          setIsTemplateDetailOpen(false)
          admin.setConfirmArchiveTemplate(false)
        }}
        title={`Template: ${admin.selectedTemplateCode}`}
      >
        <div className="flex flex-col gap-4 font-sans text-sm">
          <p className="text-slate-655 dark:text-slate-350 leading-relaxed">
            Quản trị phiên bản cấu trúc nhãn và cấu hình markup cho bản mẫu nhãn{' '}
            <strong className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
              {admin.selectedTemplateCode}
            </strong>.
          </p>

          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="danger"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => admin.setConfirmArchiveTemplate(true)}
            >
              <XCircle size={14} />
              Deactivate Template
            </Button>
          </div>

          {/* Confirm archive template */}
          {admin.confirmArchiveTemplate && (
            <div className="p-3.5 rounded-lg border border-yellow-250 bg-yellow-50/50 dark:bg-yellow-950/10 text-slate-850 dark:text-slate-205 mt-2 flex flex-col gap-3">
              <p className="text-xs leading-relaxed">
                Deactivate mẫu thiết kế nhãn <strong className="font-mono">{admin.selectedTemplateCode}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" className="h-8 py-0" onClick={() => admin.setConfirmArchiveTemplate(false)}>
                  Hủy
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="h-8 py-0"
                  disabled={admin.archiveTemplateState === 'pending'}
                  onClick={admin.requestArchiveTemplate}
                >
                  Xác nhận
                </Button>
              </div>
            </div>
          )}

          {admin.archiveTemplateError && (
            <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs flex items-center gap-1.5 mt-2" role="alert">
              <AlertCircle size={14} />
              <span>{admin.archiveTemplateError.message}</span>
            </div>
          )}

          <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">
            <Button variant="secondary" onClick={() => setIsTemplateDetailOpen(false)}>
              Đóng chi tiết
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  )
}
