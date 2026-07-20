import { useState } from 'react'
import { Link } from 'react-router'

import { useNcr } from '../hooks/useNcr'
import type { CapaRecord, NcrRecord } from '../types/ncr'
import { NCR_DISPOSITIONS, NCR_SEVERITIES, NCR_SOURCES } from '../types/ncr'
import { usePagination } from '@/shared/lib/usePagination'
import { TablePagination } from '@/shared/components/ui/TablePagination'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Dialog } from '@/shared/components/ui/Dialog'
import { Input, Select } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { Search } from 'lucide-react'

import './NcrPage.css'

type Api = ReturnType<typeof useNcr>

function listStateMessage(state: string, entity: string): string {
  switch (state) {
    case 'loading':
      return `Đang tải danh sách ${entity}…`
    case 'empty':
      return `Chưa có ${entity} nào trong hệ thống.`
    case 'no-result':
      return 'Không tìm thấy kết quả khớp bộ lọc.'
    case 'permission-denied':
      return `Bạn không có quyền xem thông tin ${entity}.`
    case 'error':
      return `Không tải được danh sách ${entity}. Thử lại sau.`
    default:
      return ''
  }
}

function NcrEditor({ detail, admin }: { detail: NcrRecord; admin: Api }) {
  const row = admin.detailRow
  const [qty, setQty] = useState(detail.qty_affected)
  const [severity, setSeverity] = useState(detail.severity)

  // Local confirmations
  const [isConfirmEditOpen, setIsConfirmEditOpen] = useState(false)
  const [isConfirmStartInvOpen, setIsConfirmStartInvOpen] = useState(false)
  const [isConfirmStartCapaOpen, setIsConfirmStartCapaOpen] = useState(false)
  const [isConfirmContainOpen, setIsConfirmContainOpen] = useState(false)
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false)
  const [isConfirmVoidOpen, setIsConfirmVoidOpen] = useState(false)

  return (
    <aside className="ncr-admin__detail" aria-label="Chi tiết NCR">
      <h3>{detail.code}</h3>
      <p className="ncr-admin__muted">
        {row?.itemLabel ?? '-'} · {detail.status} · {detail.source}
      </p>
      <dl className="ncr-admin__meta">
        <div>
          <dt>Lot</dt>
          <dd>{row?.lotLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Defect</dt>
          <dd>{row?.defectLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Work order</dt>
          <dd>{row?.workOrderLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Disposition</dt>
          <dd>{row?.disposition ?? '-'}</dd>
        </div>
        <div>
          <dt>Opened</dt>
          <dd>
            {row?.openedAt ?? '-'} · {row?.openedByLabel ?? '-'}
          </dd>
        </div>
      </dl>

      {row?.canUpdate ? (
        <form
          className="ncr-admin__form"
          onSubmit={(e) => {
            e.preventDefault()
            setIsConfirmEditOpen(true)
          }}
        >
          <label className="ncr-admin__field">
            <span>Qty affected</span>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </label>
          <label className="ncr-admin__field">
            <span>Severity</span>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
              {NCR_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="ncr-admin__btn" disabled={admin.updateUi === 'pending'}>
            Lưu thay đổi
          </button>
        </form>
      ) : null}

      <div className="ncr-admin__actions">
        {row?.canStartInvestigation ? (
          <button type="button" className="ncr-admin__btn" onClick={() => setIsConfirmStartInvOpen(true)}>
            Start investigation
          </button>
        ) : null}
        {row?.canContain ? (
          <button type="button" className="ncr-admin__btn" onClick={() => admin.openContain()}>
            Contain
          </button>
        ) : null}
        {row?.canStartCapa ? (
          <button type="button" className="ncr-admin__btn" onClick={() => setIsConfirmStartCapaOpen(true)}>
            Start CAPA
          </button>
        ) : null}
        {row?.canClose ? (
          <button type="button" className="ncr-admin__btn" onClick={() => admin.setShowClose(true)}>
            Close
          </button>
        ) : null}
        {row?.canVoid ? (
          <button type="button" className="ncr-admin__btn ncr-admin__btn--danger" onClick={() => setIsConfirmVoidOpen(true)}>
            Void
          </button>
        ) : null}
        <button type="button" className="ncr-admin__btn--ghost" onClick={() => admin.openCapaCreateFromNcr()}>
          Tạo CAPA
        </button>
        <Link className="ncr-admin__link-collaboration" to={`/web/shared/entities/non_conformance_report/${detail.id}/content`}>
          Ý kiến &amp; Đính kèm ↗
        </Link>
      </div>

      {admin.showContain ? (
        <div className="ncr-admin__contain-form">
          <h4>Thông tin Containment</h4>
          <label className="ncr-admin__field">
            <span>Disposition</span>
            <select
              value={admin.containForm.disposition}
              onChange={(e) =>
                admin.setContainForm({ ...admin.containForm, disposition: e.target.value })
              }
            >
              {NCR_DISPOSITIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="ncr-admin__field">
            <span>Lot code</span>
            <input
              value={admin.containForm.disposition_scope.lot_code}
              onChange={(e) =>
                admin.setContainForm({
                  ...admin.containForm,
                  disposition_scope: {
                    ...admin.containForm.disposition_scope,
                    lot_code: e.target.value,
                  },
                })
              }
            />
          </label>
          <label className="ncr-admin__field">
            <span>Qty</span>
            <input
              type="number"
              min={0.0001}
              step="any"
              value={admin.containForm.disposition_scope.qty}
              onChange={(e) =>
                admin.setContainForm({
                  ...admin.containForm,
                  disposition_scope: {
                    ...admin.containForm.disposition_scope,
                    qty: Number(e.target.value),
                  },
                })
              }
            />
          </label>
          <label className="ncr-admin__field">
            <span>From location (optional)</span>
            <input
              value={admin.containForm.disposition_scope.from_location_code ?? ''}
              onChange={(e) =>
                admin.setContainForm({
                  ...admin.containForm,
                  disposition_scope: {
                    ...admin.containForm.disposition_scope,
                    from_location_code: e.target.value,
                  },
                })
              }
            />
          </label>
          <label className="ncr-admin__field">
            <span>To location / quarantine (optional)</span>
            <input
              value={admin.containForm.disposition_scope.to_location_code ?? ''}
              onChange={(e) =>
                admin.setContainForm({
                  ...admin.containForm,
                  disposition_scope: {
                    ...admin.containForm.disposition_scope,
                    to_location_code: e.target.value,
                  },
                })
              }
            />
          </label>
          {admin.containErrors.length ? (
            <p className="ncr-admin__error">Thiếu: {admin.containErrors.join(', ')}</p>
          ) : null}
          {admin.containError ? (
            <p className="ncr-admin__error" role="alert">
              {admin.containError.code}: {admin.containError.message}
            </p>
          ) : null}
          <div className="ncr-admin__actions">
            <button type="button" className="ncr-admin__btn" onClick={() => setIsConfirmContainOpen(true)} disabled={admin.containErrors.length > 0}>
              Xác nhận contain
            </button>
            <button type="button" className="ncr-admin__btn--ghost" onClick={() => admin.setShowContain(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}

      {admin.showClose ? (
        <div className="ncr-admin__contain-form">
          <h4>Đóng NCR</h4>
          <label className="ncr-admin__field">
            <span>Evidence file ids (phân cách bằng dấu phẩy)</span>
            <input
              value={admin.evidenceRaw}
              onChange={(e) => admin.setEvidenceRaw(e.target.value)}
              placeholder="101, 102"
            />
          </label>
          {admin.closeErrors.length ? (
            <p className="ncr-admin__error">Thiếu: {admin.closeErrors.join(', ')}</p>
          ) : null}
          {admin.closeError ? (
            <p className="ncr-admin__error" role="alert">
              {admin.closeError.code}: {admin.closeError.message}
            </p>
          ) : null}
          <div className="ncr-admin__actions">
            <button type="button" className="ncr-admin__btn" onClick={() => setIsConfirmCloseOpen(true)} disabled={admin.closeErrors.length > 0}>
              Xác nhận close
            </button>
            <button type="button" className="ncr-admin__btn--ghost" onClick={() => admin.setShowClose(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}

      {admin.updateError ? (
        <p className="ncr-admin__error" role="alert">
          {admin.updateError.code}: {admin.updateError.message}
        </p>
      ) : null}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={isConfirmEditOpen}
        onClose={() => setIsConfirmEditOpen(false)}
        title="Xác nhận lưu thay đổi NCR"
        description={`Cập nhật thông tin báo cáo không phù hợp ${detail.code}?`}
        summary={{
          'Số lượng ảnh hưởng': qty,
          'Mức độ nghiêm trọng': severity,
        }}
        onConfirm={() => {
          setIsConfirmEditOpen(false)
          admin.submitUpdate({ qty_affected: qty, severity })
        }}
      />

      <ConfirmDialog
        isOpen={isConfirmStartInvOpen}
        onClose={() => setIsConfirmStartInvOpen(false)}
        title="Xác nhận Start Investigation"
        description={`Bạn muốn chuyển trạng thái NCR ${detail.code} sang INVESTIGATING?`}
        confirmText="Bắt đầu Điều tra"
        isPending={admin.startInvUi === 'pending'}
        onConfirm={() => {
          setIsConfirmStartInvOpen(false)
          admin.submitStartInv()
        }}
      />

      <ConfirmDialog
        isOpen={isConfirmStartCapaOpen}
        onClose={() => setIsConfirmStartCapaOpen(false)}
        title="Xác nhận Start CAPA"
        description={`Bạn muốn chuyển NCR ${detail.code} sang trạng thái CAPA_IN_PROGRESS?`}
        confirmText="Bắt đầu CAPA"
        isPending={admin.startCapaUi === 'pending'}
        onConfirm={() => {
          setIsConfirmStartCapaOpen(false)
          admin.submitStartCapa()
        }}
      />

      <ConfirmDialog
        isOpen={isConfirmContainOpen}
        onClose={() => setIsConfirmContainOpen(false)}
        title="Xác nhận Containment Action"
        description="Vui lòng kiểm tra lại thông tin Containment & xử lý lô hàng."
        summary={{
          'Disposition': admin.containForm.disposition,
          'Mã lô (Lot)': admin.containForm.disposition_scope.lot_code,
          'Số lượng xử lý': admin.containForm.disposition_scope.qty,
          'Vị trí nguồn': admin.containForm.disposition_scope.from_location_code || 'Không có',
          'Vị trí cách ly': admin.containForm.disposition_scope.to_location_code || 'Không có',
        }}
        isPending={admin.containUi === 'pending'}
        onConfirm={() => {
          setIsConfirmContainOpen(false)
          admin.submitContain()
        }}
      />

      <ConfirmDialog
        isOpen={isConfirmCloseOpen}
        onClose={() => setIsConfirmCloseOpen(false)}
        title="Xác nhận Đóng NCR"
        description={`Bạn muốn đóng báo cáo chất lượng NCR ${detail.code}?`}
        summary={{
          'Evidence file IDs': admin.evidenceRaw || 'Không có',
        }}
        isPending={admin.closeUi === 'pending'}
        onConfirm={() => {
          setIsConfirmCloseOpen(false)
          admin.submitClose()
        }}
      />

      <ConfirmDialog
        isOpen={isConfirmVoidOpen}
        onClose={() => setIsConfirmVoidOpen(false)}
        title={`Xác nhận hủy (Void) NCR ${detail.code}`}
        description="Hành động hủy báo cáo chất lượng NCR. Thao tác này không thể hoàn tác."
        type="reason-required"
        confirmText="Void NCR"
        isPending={admin.voidUi === 'pending'}
        onConfirm={(reason) => {
          setIsConfirmVoidOpen(false)
          admin.setVoidForm({ reason: reason || '' })
          admin.submitVoid()
        }}
      />
    </aside>
  )
}

function CapaEditor({ detail, admin }: { detail: CapaRecord; admin: Api }) {
  const row = admin.capaDetailRow
  const [rootCause, setRootCause] = useState(detail.root_cause)
  const [corrective, setCorrective] = useState(detail.corrective_action)
  const [preventive, setPreventive] = useState(detail.preventive_action)
  const [effectiveness, setEffectiveness] = useState(detail.effectiveness)
  const [dueDate, setDueDate] = useState(detail.due_date.slice(0, 10))

  // Local confirmations
  const [isConfirmEditCapaOpen, setIsConfirmEditCapaOpen] = useState(false)

  return (
    <aside className="ncr-admin__detail" aria-label="Chi tiết CAPA">
      <h3>{detail.code}</h3>
      <p className="ncr-admin__muted">
        NCR {row?.ncrLabel ?? '-'} · {row?.ownerLabel ?? '-'}
      </p>
      {row?.canUpdate ? (
        <form
          className="ncr-admin__form"
          onSubmit={(e) => {
            e.preventDefault()
            setIsConfirmEditCapaOpen(true)
          }}
        >
          <label className="ncr-admin__field">
            <span>Root cause</span>
            <textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} />
          </label>
          <label className="ncr-admin__field">
            <span>Corrective action</span>
            <textarea value={corrective} onChange={(e) => setCorrective(e.target.value)} />
          </label>
          <label className="ncr-admin__field">
            <span>Preventive action</span>
            <textarea value={preventive} onChange={(e) => setPreventive(e.target.value)} />
          </label>
          <label className="ncr-admin__field">
            <span>Due date</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
          <label className="ncr-admin__field">
            <span>Effectiveness</span>
            <select value={effectiveness} onChange={(e) => setEffectiveness(e.target.value)}>
              <option value="PENDING_VERIFY">PENDING_VERIFY</option>
              <option value="EFFECTIVE">EFFECTIVE</option>
              <option value="NOT_EFFECTIVE">NOT_EFFECTIVE</option>
            </select>
          </label>
          <button type="submit" className="ncr-admin__btn" disabled={admin.capaUpdateUi === 'pending'}>
            Lưu CAPA
          </button>
        </form>
      ) : null}
      {admin.capaUpdateError ? (
        <p className="ncr-admin__error" role="alert">
          {admin.capaUpdateError.code}: {admin.capaUpdateError.message}
        </p>
      ) : null}

      <ConfirmDialog
        isOpen={isConfirmEditCapaOpen}
        onClose={() => setIsConfirmEditCapaOpen(false)}
        title="Xác nhận cập nhật CAPA"
        description={`Cập nhật nội dung hành động khắc phục phòng ngừa cho ${detail.code}?`}
        summary={{
          'Nguyên nhân cốt lõi': rootCause.trim() || 'Chưa nhập',
          'Hành động khắc phục': corrective.trim() || 'Chưa nhập',
          'Hành động phòng ngừa': preventive.trim() || 'Chưa nhập',
          'Thời hạn hoàn thành': dueDate,
          'Đánh giá hiệu quả': effectiveness,
        }}
        onConfirm={() => {
          setIsConfirmEditCapaOpen(false)
          admin.submitCapaUpdate({
            root_cause: rootCause,
            corrective_action: corrective,
            preventive_action: preventive,
            effectiveness,
            due_date: dueDate,
          })
        }}
      />
    </aside>
  )
}

export function NcrPage() {
  const admin = useNcr()
  const banner = listStateMessage(admin.listState, 'NCR')
  const capaBanner = listStateMessage(admin.capaListState, 'CAPA')

  // Pagination for NCRs & CAPAs
  const ncrPagination = usePagination(admin.rows, 10)
  const capaPagination = usePagination(admin.capaRows, 10)

  // Local creation confirm
  const [isConfirmCreateNcrOpen, setIsConfirmCreateNcrOpen] = useState(false)
  const [isConfirmCreateCapaOpen, setIsConfirmCreateCapaOpen] = useState(false)

  return (
    <section className="ncr-admin flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'QMS' },
          { label: 'Quality Reports' },
        ]}
        title="Quality Reports"
        subtitle="Theo dõi báo cáo không phù hợp (NCR) và hành động khắc phục (CAPA)."
        actions={
          admin.tab === 'ncrs' ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={admin.ncrExportPending}
                onClick={admin.exportNcrs}
              >
                Export NCR
              </Button>
              <Button onClick={() => admin.setShowCreate(true)}>Tạo NCR</Button>
            </div>
          ) : admin.tab === 'capas' ? (
            <Button onClick={() => admin.setShowCapaCreate(true)}>Tạo CAPA</Button>
          ) : null
        }
      />
      {admin.ncrExportError ? (
        <p className="ncr-admin__error" role="alert">
          {admin.ncrExportError.code}: {admin.ncrExportError.message}
        </p>
      ) : null}
      {admin.ncrExportSuccess ? (
        <p className="ncr-admin__banner" role="status">
          Đã tạo job NCR_EXPORT — tải kết quả tại Import/Export Center.
        </p>
      ) : null}

      <div className="ncr-admin__tabs" role="tablist" aria-label="NCR sections">
        <button type="button" role="tab" aria-selected={admin.tab === 'ncrs'} onClick={() => admin.setTab('ncrs')}>
          NCRs
        </button>
        <button type="button" role="tab" aria-selected={admin.tab === 'capas'} onClick={() => admin.setTab('capas')}>
          CAPAs
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'pareto'}
          onClick={() => admin.setTab('pareto')}
        >
          Pareto
        </button>
      </div>

      {admin.tab === 'ncrs' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'search',
                type: 'text',
                placeholder: 'Tìm theo code...',
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
            className="max-w-md"
          />

          <Dialog
            isOpen={admin.showCreate}
            onClose={() => admin.setShowCreate(false)}
            title="Tạo NCR mới"
            maxWidth="max-w-[50%]"
          >
            <form
              className="flex flex-col gap-4 font-sans text-sm text-[var(--text-primary)]"
              onSubmit={(e) => {
                e.preventDefault()
                setIsConfirmCreateNcrOpen(true)
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span>Source</span>
                  <Select
                    value={admin.createForm.source}
                    onChange={(e) => admin.setCreateForm({ ...admin.createForm, source: e.target.value })}
                  >
                    {NCR_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1">
                  <span>Item</span>
                  <Select
                    value={admin.createForm.item_code}
                    onChange={(e) => admin.setCreateForm({ ...admin.createForm, item_code: e.target.value })}
                  >
                    <option value="">— chọn —</option>
                    {admin.items.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.code}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1">
                  <span>Defect</span>
                  <Select
                    value={admin.createForm.defect_code}
                    onChange={(e) => admin.setCreateForm({ ...admin.createForm, defect_code: e.target.value })}
                  >
                    <option value="">— chọn —</option>
                    {admin.defects.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1">
                  <span>Lot code (optional)</span>
                  <Input
                    value={admin.createForm.lot_code ?? ''}
                    onChange={(e) => admin.setCreateForm({ ...admin.createForm, lot_code: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Work order code (optional)</span>
                  <Input
                    value={admin.createForm.work_order_code ?? ''}
                    onChange={(e) =>
                      admin.setCreateForm({ ...admin.createForm, work_order_code: e.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Qty affected</span>
                  <Input
                    type="number"
                    min={1}
                    value={admin.createForm.qty_affected}
                    onChange={(e) =>
                      admin.setCreateForm({ ...admin.createForm, qty_affected: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 col-span-2">
                  <span>Severity (optional)</span>
                  <Select
                    value={admin.createForm.severity ?? ''}
                    onChange={(e) => admin.setCreateForm({ ...admin.createForm, severity: e.target.value })}
                  >
                    <option value="">— default từ defect —</option>
                    {NCR_SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
              {admin.createErrors.length ? (
                <p className="text-xs text-[var(--color-danger-text)] font-semibold">Thiếu: {admin.createErrors.join(', ')}</p>
              ) : null}
              {admin.createError ? (
                <p className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] text-xs" role="alert">
                  {admin.createError.code}: {admin.createError.message}
                </p>
              ) : null}
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
                <Button type="button" variant="secondary" onClick={() => admin.setShowCreate(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={admin.createUi === 'pending'}>
                  Lưu NCR
                </Button>
              </div>
            </form>
          </Dialog>

          {banner ? (
            <p className="ncr-admin__state" role={admin.listState === 'error' ? 'alert' : 'status'}>
              {banner}
              {admin.listError ? ` (${admin.listError})` : ''}
            </p>
          ) : null}

          {admin.listState === 'ready' ? (
            <>
              <div className="ncr-admin__table-wrap">
                <table className="ncr-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Item</th>
                      <th>Lot</th>
                      <th>Defect</th>
                      <th>Qty</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ncrPagination.paginatedItems.map((row) => (
                      <tr
                        key={row.code}
                        className={admin.selectedCode === row.code ? 'ncr-admin__row--active' : undefined}
                      >
                        <td>
                          <button type="button" className="ncr-admin__linkish" onClick={() => admin.selectNcr(row.code)}>
                            {row.code}
                          </button>
                        </td>
                        <td>{row.status}</td>
                        <td>{row.itemLabel}</td>
                        <td>{row.lotLabel}</td>
                        <td>{row.defectLabel}</td>
                        <td>{row.qtyAffected}</td>
                        <td>{row.severity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <TablePagination
                  {...ncrPagination}
                  hasMore={admin.page?.has_more}
                  onLoadMore={admin.loadMore}
                  sticky
                />
              </div>

              <Dialog
                isOpen={!!admin.selectedCode}
                onClose={() => admin.selectNcr('')}
                title={`Chi tiết NCR ${admin.selectedCode || ''}`}
                maxWidth="max-w-[75%]"
              >
                {admin.detailLoading ? (
                  <div className="p-8 text-center text-sm text-[var(--text-secondary)]">Đang tải chi tiết…</div>
                ) : admin.detail ? (
                  <NcrEditor key={admin.detail.code} detail={admin.detail} admin={admin} />
                ) : null}
              </Dialog>
            </>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'capas' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'search',
                type: 'text',
                placeholder: 'Tìm CAPA...',
              },
            ]}
            values={{
              search: admin.capaSearchInput,
            }}
            onChange={(name, value) => {
              if (name === 'search') {
                admin.setCapaSearchInput(value)
              }
            }}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyCapaSearch()
            }}
            onReset={() => {
              admin.setCapaSearchInput('')
              admin.applyCapaSearch()
            }}
            isResetActive={Boolean(admin.capaSearchInput)}
            className="max-w-md"
          />

          <Dialog
            isOpen={admin.showCapaCreate}
            onClose={() => admin.setShowCapaCreate(false)}
            title="Tạo CAPA mới"
            maxWidth="max-w-[50%]"
          >
            <form
              className="flex flex-col gap-4 font-sans text-sm text-[var(--text-primary)]"
              onSubmit={(e) => {
                e.preventDefault()
                setIsConfirmCreateCapaOpen(true)
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span>NCR ID (lựa chọn từ NCR detail)</span>
                  <Input
                    type="number"
                    min={1}
                    value={admin.capaCreateForm.ncr_id || ''}
                    onChange={(e) =>
                      admin.setCapaCreateForm({
                        ...admin.capaCreateForm,
                        ncr_id: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Owner User ID</span>
                  <Input
                    type="number"
                    min={1}
                    value={admin.capaCreateForm.owner_id || ''}
                    onChange={(e) =>
                      admin.setCapaCreateForm({
                        ...admin.capaCreateForm,
                        owner_id: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 col-span-2">
                  <span>Due date</span>
                  <Input
                    type="date"
                    value={admin.capaCreateForm.due_date}
                    onChange={(e) =>
                      admin.setCapaCreateForm({ ...admin.capaCreateForm, due_date: e.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 col-span-2">
                  <span>Root cause</span>
                  <textarea
                    rows={3}
                    className="w-full p-2.5 border border-[var(--border-default)] rounded-lg bg-[var(--surface-3)] text-[var(--text-primary)] text-sm focus:outline-none"
                    value={admin.capaCreateForm.root_cause}
                    onChange={(e) =>
                      admin.setCapaCreateForm({ ...admin.capaCreateForm, root_cause: e.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 col-span-2">
                  <span>Corrective action</span>
                  <textarea
                    rows={3}
                    className="w-full p-2.5 border border-[var(--border-default)] rounded-lg bg-[var(--surface-3)] text-[var(--text-primary)] text-sm focus:outline-none"
                    value={admin.capaCreateForm.corrective_action}
                    onChange={(e) =>
                      admin.setCapaCreateForm({
                        ...admin.capaCreateForm,
                        corrective_action: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 col-span-2">
                  <span>Preventive action</span>
                  <textarea
                    rows={3}
                    className="w-full p-2.5 border border-[var(--border-default)] rounded-lg bg-[var(--surface-3)] text-[var(--text-primary)] text-sm focus:outline-none"
                    value={admin.capaCreateForm.preventive_action}
                    onChange={(e) =>
                      admin.setCapaCreateForm({
                        ...admin.capaCreateForm,
                        preventive_action: e.target.value,
                      })
                    }
                  />
                </label>
              </div>
              {admin.capaCreateErrors.length ? (
                <p className="text-xs text-[var(--color-danger-text)] font-semibold">Thiếu: {admin.capaCreateErrors.join(', ')}</p>
              ) : null}
              {admin.capaCreateError ? (
                <p className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] text-xs" role="alert">
                  {admin.capaCreateError.code}: {admin.capaCreateError.message}
                </p>
              ) : null}
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
                <Button type="button" variant="secondary" onClick={() => admin.setShowCapaCreate(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={admin.capaCreateUi === 'pending'}>
                  Lưu CAPA
                </Button>
              </div>
            </form>
          </Dialog>

          {capaBanner ? (
            <p className="ncr-admin__state" role={admin.capaListState === 'error' ? 'alert' : 'status'}>
              {capaBanner}
              {admin.capaListError ? ` (${admin.capaListError})` : ''}
            </p>
          ) : null}

          {admin.capaListState === 'ready' ? (
            <>
              <div className="ncr-admin__table-wrap">
                <table className="ncr-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>NCR</th>
                      <th>Owner</th>
                      <th>Due</th>
                      <th>Effectiveness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capaPagination.paginatedItems.map((row) => (
                      <tr
                        key={row.code}
                        className={
                          admin.selectedCapaCode === row.code ? 'ncr-admin__row--active' : undefined
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="ncr-admin__linkish"
                            onClick={() => admin.selectCapa(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.ncrLabel}</td>
                        <td>{row.ownerLabel}</td>
                        <td>{row.dueDate}</td>
                        <td>{row.effectiveness}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <TablePagination
                  {...capaPagination}
                  hasMore={admin.capaPage?.has_more}
                  onLoadMore={admin.loadMoreCapas}
                  sticky
                />
              </div>

              <Dialog
                isOpen={!!admin.selectedCapaCode}
                onClose={() => admin.selectCapa('')}
                title={`Chi tiết CAPA ${admin.selectedCapaCode || ''}`}
                maxWidth="max-w-[75%]"
              >
                {admin.capaDetailLoading ? (
                  <div className="p-8 text-center text-sm text-[var(--text-secondary)]">Đang tải chi tiết CAPA…</div>
                ) : admin.capaDetail ? (
                  <CapaEditor key={admin.capaDetail.code} detail={admin.capaDetail} admin={admin} />
                ) : null}
              </Dialog>
            </>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'pareto' ? (
        <>
          <form
            className="ncr-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyParetoFilters()
            }}
          >
            <label className="ncr-admin__field">
              <span>From (YYYY-MM-DD)</span>
              <input value={admin.paretoFrom} onChange={(e) => admin.setParetoFrom(e.target.value)} />
            </label>
            <label className="ncr-admin__field">
              <span>To (YYYY-MM-DD)</span>
              <input value={admin.paretoTo} onChange={(e) => admin.setParetoTo(e.target.value)} />
            </label>
            <label className="ncr-admin__field">
              <span>Group by</span>
              <select
                value={admin.paretoGroupBy}
                onChange={(e) => admin.setParetoGroupBy(e.target.value)}
              >
                <option value="defect_code">defect_code</option>
                <option value="item_code">item_code</option>
                <option value="source">source</option>
              </select>
            </label>
            <label className="ncr-admin__field">
              <span>Source (optional)</span>
              <input
                value={admin.paretoSource}
                onChange={(e) => admin.setParetoSource(e.target.value)}
                placeholder="IQC / IPQC / …"
              />
            </label>
            <button type="submit" className="ncr-admin__btn">
              Áp dụng
            </button>
            <button
              type="button"
              className="ncr-admin__btn ncr-admin__btn--secondary"
              disabled={admin.paretoExportPending}
              onClick={admin.exportPareto}
            >
              Export Pareto
            </button>
          </form>
          {admin.paretoExportError ? (
            <p className="ncr-admin__error" role="alert">
              {admin.paretoExportError.code}: {admin.paretoExportError.message}
            </p>
          ) : null}
          {admin.paretoExportSuccess ? (
            <p className="ncr-admin__banner" role="status">
              Đã tạo job NCR_PARETO — tải kết quả tại Import/Export Center.
            </p>
          ) : null}
          {admin.paretoState !== 'ready' ? (
            <p
              className="ncr-admin__state"
              role={admin.paretoState === 'error' ? 'alert' : 'status'}
            >
              {admin.paretoState === 'loading'
                ? 'Đang tải Pareto…'
                : admin.paretoState === 'empty'
                  ? 'Chưa có dữ liệu Pareto.'
                  : admin.paretoState === 'permission-denied'
                    ? 'Bạn không có quyền xem Pareto.'
                    : 'Không tải được Pareto.'}
              {admin.paretoError ? ` (${admin.paretoError.code})` : ''}
            </p>
          ) : (
            <div className="ncr-admin__table-wrap">
              <p className="ncr-admin__muted">
                Group by <code>{admin.paretoGroupByApplied}</code> · Total qty {admin.paretoTotal}
              </p>
              <table className="ncr-admin__table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Label</th>
                    <th>Qty</th>
                    <th>%</th>
                    <th>Cum %</th>
                  </tr>
                </thead>
                <tbody>
                  {admin.paretoRows.map((row) => (
                    <tr key={row.groupKey}>
                      <td>{row.groupKey}</td>
                      <td>{row.groupLabel}</td>
                      <td>{row.qty}</td>
                      <td>{row.pct}</td>
                      <td>{row.cumPct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}

      {/* Confirm creation dialogs */}
      <ConfirmDialog
        isOpen={isConfirmCreateNcrOpen}
        onClose={() => setIsConfirmCreateNcrOpen(false)}
        title="Xác nhận tạo mới NCR"
        description="Vui lòng xác nhận thông tin chi tiết báo cáo chất lượng không phù hợp."
        summary={{
          'Source (Nguồn phát hiện)': admin.createForm.source,
          'Mã sản phẩm (Item)': admin.createForm.item_code || 'Chưa chọn',
          'Lỗi (Defect)': admin.createForm.defect_code || 'Chưa chọn',
          'Mã lô (Lot)': admin.createForm.lot_code || 'Không có',
          'Lệnh sản xuất (WO)': admin.createForm.work_order_code || 'Không có',
          'Số lượng lỗi': admin.createForm.qty_affected,
          'Mức độ nghiêm trọng': admin.createForm.severity || 'Mặc định defect',
        }}
        isPending={admin.createUi === 'pending'}
        onConfirm={() => {
          setIsConfirmCreateNcrOpen(false)
          admin.submitCreate()
        }}
      />

      <ConfirmDialog
        isOpen={isConfirmCreateCapaOpen}
        onClose={() => setIsConfirmCreateCapaOpen(false)}
        title="Xác nhận tạo mới CAPA"
        description="Vui lòng xác nhận thông tin hành động khắc phục phòng ngừa."
        summary={{
          'Mã NCR liên kết': admin.capaCreateForm.ncr_id,
          'Nguyên nhân cốt lõi': admin.capaCreateForm.root_cause,
          'Hành động khắc phục': admin.capaCreateForm.corrective_action,
          'Hành động phòng ngừa': admin.capaCreateForm.preventive_action,
          'Người chịu trách nhiệm ID': admin.capaCreateForm.owner_id,
          'Thời hạn hoàn thành': admin.capaCreateForm.due_date,
        }}
        isPending={admin.capaCreateUi === 'pending'}
        onConfirm={() => {
          setIsConfirmCreateCapaOpen(false)
          admin.submitCapaCreate()
        }}
      />
    </section>
  )
}
