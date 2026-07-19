import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { useAuthStore } from '@/shared/store/authStore'
import { isSystemAdminSession } from '@/shared/api'

import { usePrintQueueAdmin } from '../hooks/usePrintQueueAdmin'
import type { PrintJobAction } from '../types/labelPrinting'

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
      return 'Request reprint'
    case 'approve_reprint':
      return 'Approve reprint'
    default:
      return action
  }
}

export function PrintQueueAdminPage() {
  const session = useAuthStore((s) => s.session)
  const admin = usePrintQueueAdmin()
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
      <section className="print-admin" aria-labelledby="print-admin-title">
        <header className="print-admin__header">
          <div>
            <p className="print-admin__eyebrow">WEB-NB-05-PRINT-QUEUE</p>
            <h2 id="print-admin-title">Print Queue / Printer Management</h2>
          </div>
          <Link className="print-admin__back" to="/admin">
            Về quản trị
          </Link>
        </header>
        <div className="print-admin__state" role="alert">
          Bạn không có quyền xem Print Queue (system_admin_only).
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
    <section className="print-admin" aria-labelledby="print-admin-title">
      <header className="print-admin__header">
        <div>
          <p className="print-admin__eyebrow">WEB-NB-05-PRINT-QUEUE · `/web/admin/print-queue`</p>
          <h2 id="print-admin-title">Print Queue / Printer Management</h2>
          <p className="print-admin__lead">
            Xem queue, retry/cancel/reprint và quản lý printer/template (system_admin).
          </p>
        </div>
        <Link className="print-admin__back" to="/admin">
          Về quản trị
        </Link>
      </header>

      <div className="print-admin__tabs" role="tablist" aria-label="Print admin sections">
        <button type="button" role="tab" aria-selected={admin.tab === 'jobs'} onClick={() => admin.setTab('jobs')}>
          Print jobs
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'printers'}
          onClick={() => admin.setTab('printers')}
        >
          Printers
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'templates'}
          onClick={() => admin.setTab('templates')}
        >
          Templates
        </button>
      </div>

      {banner ? (
        <div className="print-admin__state" role="status">
          {banner}
        </div>
      ) : null}

      {admin.tab === 'jobs' ? (
        <>
          <form
            className="print-admin__filters"
            onSubmit={(event) => {
              event.preventDefault()
              admin.applySearch()
            }}
          >
            <label className="print-admin__field">
              <span>Tìm kiếm</span>
              <input
                value={admin.searchInput}
                onChange={(event) => admin.setSearchInput(event.target.value)}
                placeholder="code, label type…"
              />
            </label>
            <button type="submit">Lọc</button>
            <button type="button" onClick={admin.refresh}>
              Làm mới
            </button>
          </form>

          <div className="print-admin__panel">
            <h3>Enqueue print job</h3>
            <form className="print-admin__form" onSubmit={onEnqueue}>
              <label className="print-admin__field">
                <span>entity_type</span>
                <input
                  value={enqueueForm.entity_type}
                  onChange={(e) => setEnqueueForm((s) => ({ ...s, entity_type: e.target.value }))}
                />
              </label>
              <label className="print-admin__field">
                <span>entity_id</span>
                <input
                  value={enqueueForm.entity_id}
                  onChange={(e) => setEnqueueForm((s) => ({ ...s, entity_id: e.target.value }))}
                />
              </label>
              <label className="print-admin__field">
                <span>template_code</span>
                <select
                  value={enqueueForm.template_code}
                  onChange={(e) => setEnqueueForm((s) => ({ ...s, template_code: e.target.value }))}
                >
                  <option value="">Chọn template</option>
                  {admin.templates.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="print-admin__field">
                <span>printer_code</span>
                <select
                  value={enqueueForm.printer_code}
                  onChange={(e) => setEnqueueForm((s) => ({ ...s, printer_code: e.target.value }))}
                >
                  <option value="">Chọn printer</option>
                  {admin.printers.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="print-admin__field">
                <span>copies</span>
                <input
                  value={enqueueForm.copies}
                  onChange={(e) => setEnqueueForm((s) => ({ ...s, copies: e.target.value }))}
                />
              </label>
              <button type="submit" disabled={admin.enqueuePending}>
                Enqueue
              </button>
            </form>
            {admin.enqueueError ? (
              <p className="print-admin__state" role="alert">
                {admin.enqueueError.code}: {admin.enqueueError.message}
              </p>
            ) : null}
            {admin.enqueueSuccess ? (
              <p className="print-admin__state" role="status">
                Đã enqueue print job.
              </p>
            ) : null}
          </div>

          <div className="print-admin__layout">
            <div className="print-admin__table-wrap">
              <table className="print-admin__table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Status</th>
                    <th>Label</th>
                    <th>Printer</th>
                    <th>Template</th>
                    <th>Requested at</th>
                  </tr>
                </thead>
                <tbody>
                  {admin.jobRows.map((row) => (
                    <tr
                      key={row.code}
                      className={
                        row.code === admin.selectedCode
                          ? 'print-admin__row print-admin__row--active'
                          : 'print-admin__row'
                      }
                      onClick={() => admin.setSelectedCode(row.code)}
                    >
                      <td>{row.code}</td>
                      <td>{row.status}</td>
                      <td>{row.labelType}</td>
                      <td>{row.printerLabel}</td>
                      <td>{row.templateLabel}</td>
                      <td>{row.requestedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {admin.hasMore ? (
                <button type="button" className="print-admin__more" onClick={admin.loadMore}>
                  Tải thêm
                </button>
              ) : null}
            </div>

            <aside className="print-admin__detail" aria-label="Chi tiết print job">
              {admin.detailRow ? (
                <>
                  <h3>{admin.detailRow.code}</h3>
                  <dl>
                    <div>
                      <dt>Status</dt>
                      <dd>{admin.detailRow.status}</dd>
                    </div>
                    <div>
                      <dt>Printer</dt>
                      <dd>{admin.detailRow.printerLabel}</dd>
                    </div>
                    <div>
                      <dt>Template</dt>
                      <dd>{admin.detailRow.templateLabel}</dd>
                    </div>
                    <div>
                      <dt>Parent</dt>
                      <dd>
                        {admin.detailRow.parentType}
                      </dd>
                    </div>
                    <div>
                      <dt>Copies</dt>
                      <dd>{admin.detailRow.copies}</dd>
                    </div>
                    <div>
                      <dt>Requested at</dt>
                      <dd>{admin.detailRow.requestedAt}</dd>
                    </div>
                    <div>
                      <dt>Printed at</dt>
                      <dd>{admin.detailRow.printedAt}</dd>
                    </div>
                    <div>
                      <dt>Error</dt>
                      <dd>{admin.detailRow.errorMessage}</dd>
                    </div>
                    <div>
                      <dt>Payload</dt>
                      <dd className="print-admin__payload">{admin.detailRow.payloadPreview}</dd>
                    </div>
                  </dl>

                  <div className="print-admin__actions">
                    {admin.detailRow.actions.map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => {
                          admin.setActionReason('')
                          admin.setConfirmAction(action)
                        }}
                      >
                        {actionLabel(action)}
                      </button>
                    ))}
                  </div>

                  {admin.confirmAction ? (
                    <div className="print-admin__confirm" role="dialog" aria-label="Xác nhận action">
                      <p>
                        Xác nhận <strong>{actionLabel(admin.confirmAction)}</strong> cho{' '}
                        {admin.detailRow.code}?
                      </p>
                      {admin.reasonRequired ? (
                        <label className="print-admin__field">
                          <span>Lý do</span>
                          <input
                            value={admin.actionReason}
                            onChange={(event) => admin.setActionReason(event.target.value)}
                            placeholder="Bắt buộc theo contract"
                          />
                        </label>
                      ) : null}
                      <div className="print-admin__actions">
                        <button
                          type="button"
                          disabled={
                            (admin.reasonRequired && admin.actionReason.trim().length === 0) ||
                            admin.actionState === 'pending'
                          }
                          onClick={admin.requestJobAction}
                        >
                          Xác nhận
                        </button>
                        <button type="button" onClick={() => admin.setConfirmAction(null)}>
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {admin.actionError ? (
                    <p className="print-admin__state" role="alert">
                      {admin.actionError.code}: {admin.actionError.message}
                    </p>
                  ) : null}
                  {admin.actionState === 'success' ? (
                    <p className="print-admin__state" role="status">
                      Action thành công.
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="print-admin__muted">Chọn một print job để xem chi tiết.</p>
              )}
            </aside>
          </div>
        </>
      ) : null}

      {admin.tab === 'printers' ? (
        <div className="print-admin__layout">
          <div className="print-admin__table-wrap">
            {admin.printersError ? (
              <div className="print-admin__state" role="alert">
                {admin.printersError.message}
              </div>
            ) : null}
            {admin.printersLoading ? (
              <div className="print-admin__state" role="status">
                Đang tải printers…
              </div>
            ) : null}
            <table className="print-admin__table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Protocol</th>
                  <th>Status</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {admin.printers.map((p) => (
                  <tr
                    key={p.code}
                    className={
                      p.code === admin.selectedPrinterCode
                        ? 'print-admin__row print-admin__row--active'
                        : 'print-admin__row'
                    }
                    onClick={() => admin.setSelectedPrinterCode(p.code)}
                  >
                    <td>{p.code}</td>
                    <td>{p.printer_name}</td>
                    <td>{p.protocol}</td>
                    <td>{p.status}</td>
                    <td>{p.is_active ? 'yes' : 'no'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <aside className="print-admin__detail" aria-label="Printer detail">
            <div className="print-admin__panel" style={{ border: 0, padding: 0 }}>
              <h3>Create printer</h3>
              <form className="print-admin__form" onSubmit={onCreatePrinter}>
                <label className="print-admin__field">
                  <span>code</span>
                  <input
                    value={printerForm.code}
                    onChange={(e) => setPrinterForm((s) => ({ ...s, code: e.target.value }))}
                  />
                </label>
                <label className="print-admin__field">
                  <span>printer_name</span>
                  <input
                    value={printerForm.printer_name}
                    onChange={(e) => setPrinterForm((s) => ({ ...s, printer_name: e.target.value }))}
                  />
                </label>
                <label className="print-admin__field">
                  <span>model</span>
                  <input
                    value={printerForm.model}
                    onChange={(e) => setPrinterForm((s) => ({ ...s, model: e.target.value }))}
                  />
                </label>
                <label className="print-admin__field">
                  <span>protocol</span>
                  <select
                    value={printerForm.protocol}
                    onChange={(e) => setPrinterForm((s) => ({ ...s, protocol: e.target.value }))}
                  >
                    <option value="ZPL">ZPL</option>
                    <option value="TSPL">TSPL</option>
                    <option value="ESC_POS">ESC_POS</option>
                    <option value="PDF">PDF</option>
                  </select>
                </label>
                <label className="print-admin__field">
                  <span>location_id</span>
                  <input
                    value={printerForm.location_id}
                    onChange={(e) => setPrinterForm((s) => ({ ...s, location_id: e.target.value }))}
                  />
                </label>
                <label className="print-admin__field print-admin__field--wide">
                  <span>supported_label_types</span>
                  <input
                    value={printerForm.supported_label_types}
                    onChange={(e) =>
                      setPrinterForm((s) => ({ ...s, supported_label_types: e.target.value }))
                    }
                  />
                </label>
                <button type="submit" disabled={admin.createPrinterPending}>
                  Tạo printer
                </button>
              </form>
              {admin.createPrinterError ? (
                <p className="print-admin__state" role="alert">
                  {admin.createPrinterError.message}
                </p>
              ) : null}
            </div>

            {admin.selectedPrinterCode ? (
              <>
                <h3>{admin.selectedPrinterCode}</h3>
                <div className="print-admin__actions">
                  <button type="button" onClick={() => admin.setConfirmArchivePrinter(true)}>
                    Deactivate
                  </button>
                </div>
                {admin.confirmArchivePrinter ? (
                  <div className="print-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
                    <p>Deactivate printer {admin.selectedPrinterCode}? Hành động cần xác nhận.</p>
                    <div className="print-admin__actions">
                      <button
                        type="button"
                        disabled={admin.archivePrinterState === 'pending'}
                        onClick={admin.requestArchivePrinter}
                      >
                        Xác nhận
                      </button>
                      <button type="button" onClick={() => admin.setConfirmArchivePrinter(false)}>
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : null}
                {admin.archivePrinterError ? (
                  <p className="print-admin__state" role="alert">
                    {admin.archivePrinterError.message}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="print-admin__muted">Chọn printer để deactivate.</p>
            )}
          </aside>
        </div>
      ) : null}

      {admin.tab === 'templates' ? (
        <div className="print-admin__layout">
          <div className="print-admin__table-wrap">
            {admin.templatesError ? (
              <div className="print-admin__state" role="alert">
                {admin.templatesError.message}
              </div>
            ) : null}
            {admin.templatesLoading ? (
              <div className="print-admin__state" role="status">
                Đang tải templates…
              </div>
            ) : null}
            <table className="print-admin__table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Version</th>
                  <th>Format</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {admin.templates.map((t) => (
                  <tr
                    key={t.code}
                    className={
                      t.code === admin.selectedTemplateCode
                        ? 'print-admin__row print-admin__row--active'
                        : 'print-admin__row'
                    }
                    onClick={() => admin.setSelectedTemplateCode(t.code)}
                  >
                    <td>{t.code}</td>
                    <td>{t.label_type}</td>
                    <td>{t.version}</td>
                    <td>{t.template_format}</td>
                    <td>{t.is_active ? 'yes' : 'no'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <aside className="print-admin__detail" aria-label="Template detail">
            <div className="print-admin__panel" style={{ border: 0, padding: 0 }}>
              <h3>Create template</h3>
              <form className="print-admin__form" onSubmit={onCreateTemplate}>
                <label className="print-admin__field">
                  <span>code</span>
                  <input
                    value={templateForm.code}
                    onChange={(e) => setTemplateForm((s) => ({ ...s, code: e.target.value }))}
                  />
                </label>
                <label className="print-admin__field">
                  <span>label_type</span>
                  <select
                    value={templateForm.label_type}
                    onChange={(e) => setTemplateForm((s) => ({ ...s, label_type: e.target.value }))}
                  >
                    <option value="LOT">LOT</option>
                    <option value="CON">CON</option>
                    <option value="FC">FC</option>
                    <option value="BIN">BIN</option>
                    <option value="MACHINE">MACHINE</option>
                  </select>
                </label>
                <label className="print-admin__field">
                  <span>version</span>
                  <input
                    value={templateForm.version}
                    onChange={(e) => setTemplateForm((s) => ({ ...s, version: e.target.value }))}
                  />
                </label>
                <label className="print-admin__field">
                  <span>template_format</span>
                  <select
                    value={templateForm.template_format}
                    onChange={(e) =>
                      setTemplateForm((s) => ({ ...s, template_format: e.target.value }))
                    }
                  >
                    <option value="ZPL">ZPL</option>
                    <option value="TSPL">TSPL</option>
                    <option value="HTML">HTML</option>
                  </select>
                </label>
                <label className="print-admin__field print-admin__field--wide">
                  <span>template_body</span>
                  <textarea
                    value={templateForm.template_body}
                    onChange={(e) =>
                      setTemplateForm((s) => ({ ...s, template_body: e.target.value }))
                    }
                  />
                </label>
                <button type="submit" disabled={admin.createTemplatePending}>
                  Tạo template
                </button>
              </form>
              {admin.createTemplateError ? (
                <p className="print-admin__state" role="alert">
                  {admin.createTemplateError.message}
                </p>
              ) : null}
            </div>

            {admin.selectedTemplateCode ? (
              <>
                <h3>{admin.selectedTemplateCode}</h3>
                <div className="print-admin__actions">
                  <button type="button" onClick={() => admin.setConfirmArchiveTemplate(true)}>
                    Deactivate
                  </button>
                </div>
                {admin.confirmArchiveTemplate ? (
                  <div className="print-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
                    <p>Deactivate template {admin.selectedTemplateCode}?</p>
                    <div className="print-admin__actions">
                      <button
                        type="button"
                        disabled={admin.archiveTemplateState === 'pending'}
                        onClick={admin.requestArchiveTemplate}
                      >
                        Xác nhận
                      </button>
                      <button type="button" onClick={() => admin.setConfirmArchiveTemplate(false)}>
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : null}
                {admin.archiveTemplateError ? (
                  <p className="print-admin__state" role="alert">
                    {admin.archiveTemplateError.message}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="print-admin__muted">Chọn template để deactivate.</p>
            )}
          </aside>
        </div>
      ) : null}
    </section>
  )
}
