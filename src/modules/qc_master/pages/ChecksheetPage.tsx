import { useState, useEffect } from 'react'
import { Link } from 'react-router'

import { PageHeader } from '@/shared/components/layout/PageHeader'
import { useQcMaster } from '../hooks/useQcMaster'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { Button } from '@/shared/components/ui/Button'
import { CHAR_TYPES, SEVERITIES } from '../types/qcMaster'
import type { InspectionPlanDetailRecord } from '../types/qcMaster'

import { Input, Select } from '@/shared/components/ui/Input'
import { Dialog } from '@/shared/components/ui/Dialog'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { FileSpreadsheet, Download, AlertCircle } from 'lucide-react'
import { usePagination } from '@/shared/lib/usePagination'
import { TablePagination } from '@/shared/components/ui/TablePagination'
import { useImportExportCenter } from '@/modules/excel_import_export/hooks/useImportExportCenter'

import './ChecksheetPage.css'

type Api = ReturnType<typeof useQcMaster>

function listStateMessage(state: string, noun: string): string {
  switch (state) {
    case 'loading':
      return `Đang tải danh mục ${noun}…`
    case 'empty':
      return `Chưa có ${noun} nào.`
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return `Bạn không có quyền xem danh mục ${noun}.`
    case 'error':
      return `Không tải được danh mục ${noun}. Thử lại sau.`
    default:
      return ''
  }
}

function PlanEditor({ detail, admin }: { detail: InspectionPlanDetailRecord; admin: Api }) {
  const [samplingParam, setSamplingParam] = useState(detail.sampling_param)
  const row = admin.planDetailRow

  return (
    <aside className="qc-admin__detail" aria-label="Chi tiết checksheet">
      <h3>{detail.code}</h3>
      <p className="qc-admin__muted">
        {row?.stageLabel} · {row?.itemLabel} · {detail.status}
      </p>
      <dl className="qc-admin__meta">
        <div>
          <dt>Item revision</dt>
          <dd>{row?.revisionLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Sampling method</dt>
          <dd>{row?.samplingMethodLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Frequency</dt>
          <dd>{row?.frequencyLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Active</dt>
          <dd>{detail.is_active ? 'Có' : 'Không'}</dd>
        </div>
      </dl>

      <h4>Đặc tính kiểm tra ({detail.characteristics.length})</h4>
      {detail.characteristics.length === 0 ? (
        <p className="qc-admin__muted">
          Chưa có đặc tính. Thêm đặc tính qua QC_CHECKSHEET_IMPORT tại Import/Export Center.
        </p>
      ) : (
        <table className="qc-admin__table qc-admin__table--compact">
          <thead>
            <tr>
              <th>Characteristic</th>
              <th>Type</th>
              <th>Nominal / LSL / USL</th>
              <th>UoM</th>
              <th>Criticality</th>
            </tr>
          </thead>
          <tbody>
            {detail.characteristics.map((c) => (
              <tr key={c.code}>
                <td>{c.char_master_code ?? `#${c.char_master_id}`}</td>
                <td>{c.char_type}</td>
                <td>
                  {c.nominal ?? '-'} / {c.lsl ?? '-'} / {c.usl ?? '-'}
                </td>
                <td>{c.uom}</td>
                <td>{c.criticality}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h4>Sửa (chỉ khi DRAFT)</h4>
      <label className="qc-admin__field">
        <span>Sampling param</span>
        <input value={samplingParam} onChange={(e) => setSamplingParam(e.target.value)} />
      </label>
      <button
        type="button"
        className="qc-admin__btn"
        disabled={!row?.canUpdate || admin.updatePlanPending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() => admin.savePlanEdit({ sampling_param: samplingParam.trim() })}
      >
        {admin.updatePlanPending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="qc-admin__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updatePlanError ? (
        <p className="qc-admin__error" role="alert">
          {admin.updatePlanError.code}: {admin.updatePlanError.message}
        </p>
      ) : null}
      {admin.updatePlanSuccess ? (
        <p className="qc-admin__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>State transitions</h4>
      <div className="qc-admin__actions">
        <button
          type="button"
          className="qc-admin__btn"
          disabled={!row?.canRelease}
          title={row?.releaseDisabledReason ?? undefined}
          onClick={() => admin.setConfirmPlanRelease(true)}
        >
          Release
        </button>
        <button
          type="button"
          className="qc-admin__btn qc-admin__btn--danger"
          disabled={!row?.canObsolete}
          title={row?.obsoleteDisabledReason ?? undefined}
          onClick={() => admin.setConfirmPlanObsolete(true)}
        >
          Obsolete
        </button>
        <button
          type="button"
          className="qc-admin__btn qc-admin__btn--danger"
          disabled={!row?.canDeactivate}
          title={row?.deactivateDisabledReason ?? undefined}
          onClick={() => admin.setConfirmPlanDeactivate(true)}
        >
          Deactivate
        </button>
      </div>

      {admin.confirmPlanRelease ? (
        <div className="qc-admin__confirm" role="dialog" aria-label="Xác nhận release">
          <p>
            Xác nhận release <strong>{detail.code}</strong>? Plan RELEASED trước đó cùng scope
            item/stage/revision sẽ chuyển sang OBSOLETE.
          </p>
          <div className="qc-admin__actions">
            <button type="button" disabled={admin.releasePlanState === 'pending'} onClick={admin.releasePlan}>
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmPlanRelease(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.releasePlanError ? (
        <p className="qc-admin__error" role="alert">
          {admin.releasePlanError.code}: {admin.releasePlanError.message}
        </p>
      ) : null}

      {admin.confirmPlanObsolete ? (
        <div className="qc-admin__confirm" role="dialog" aria-label="Xác nhận obsolete">
          <p>
            Xác nhận obsolete <strong>{detail.code}</strong>? Plan sẽ không còn dùng cho lô kiểm tra mới.
          </p>
          <div className="qc-admin__actions">
            <button type="button" disabled={admin.obsoletePlanState === 'pending'} onClick={admin.obsoletePlan}>
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmPlanObsolete(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.obsoletePlanError ? (
        <p className="qc-admin__error" role="alert">
          {admin.obsoletePlanError.code}: {admin.obsoletePlanError.message}
        </p>
      ) : null}

      {admin.confirmPlanDeactivate ? (
        <div className="qc-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
          <p>
            Xác nhận deactivate <strong>{detail.code}</strong>?
          </p>
          <div className="qc-admin__actions">
            <button
              type="button"
              disabled={admin.deactivatePlanState === 'pending'}
              onClick={admin.deactivatePlan}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmPlanDeactivate(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.deactivatePlanError ? (
        <p className="qc-admin__error" role="alert">
          {admin.deactivatePlanError.code}: {admin.deactivatePlanError.message}
        </p>
      ) : null}
      {(admin.releasePlanState === 'success' ||
        admin.obsoletePlanState === 'success' ||
        admin.deactivatePlanState === 'success') ? (
        <p className="qc-admin__banner" role="status">
          Đã cập nhật trạng thái checksheet.
        </p>
      ) : null}
    </aside>
  )
}

export function ChecksheetPage() {
  const admin = useQcMaster()
  const [isExcelOpen, setIsExcelOpen] = useState(false)
  const ie = useImportExportCenter()

  const planPagination = usePagination(admin.planRows, 10)
  const cmPagination = usePagination(admin.cmRows, 10)
  const dcPagination = usePagination(admin.dcRows, 10)

  useEffect(() => {
    if (isExcelOpen) {
      ie.setTemplateCode('QC_CHECKSHEET_IMPORT')
    }
  }, [isExcelOpen])

  return (
    <section className="qc-admin">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'QMS' },
          { label: 'Tiêu chuẩn & Checksheet' },
        ]}
        title="Tiêu chuẩn & Checksheet"
        subtitle="Quản lý inspection plan (IQC + IPQC/FQC/OQC/FAI), characteristic master và defect code (QMS01-001..020). Mutation gated bởi server allowed_actions."
        actions={
          <Button variant="secondary" className="flex items-center gap-1.5" onClick={() => setIsExcelOpen(true)}>
            <FileSpreadsheet size={14} />
            Import / Export Center
          </Button>
        }
      />

      <div className="qc-admin__tabs" role="tablist" aria-label="Checksheet admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'checksheets'}
          onClick={() => admin.setTab('checksheets')}
        >
          Checksheets
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'characteristics'}
          onClick={() => admin.setTab('characteristics')}
        >
          Characteristics
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'defect_codes'}
          onClick={() => admin.setTab('defect_codes')}
        >
          Defect Codes
        </button>
      </div>

      {admin.tab === 'checksheets' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'search',
                type: 'text',
                label: 'Tìm checksheet (code)',
                placeholder: 'IP-…',
              },
            ]}
            values={{
              search: admin.planSearchInput,
            }}
            onChange={(name, value) => {
              if (name === 'search') {
                admin.setPlanSearchInput(value)
              }
            }}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyPlanSearch()
            }}
            onReset={() => {
              admin.setPlanSearchInput('')
              admin.applyPlanSearch()
            }}
            isResetActive={Boolean(admin.planSearchInput)}
            expands={
              <Button type="button" className="qc-admin__btn shrink-0" onClick={admin.openPlanCreate}>
                Tạo checksheet
              </Button>
            }
          />

          <Dialog
            isOpen={admin.showPlanCreate}
            onClose={admin.closePlanCreate}
            title="Tạo checksheet mới"
            maxWidth="max-w-[50%]"
          >
            <div className="flex flex-col gap-4 font-sans text-sm text-[var(--text-primary)]">
              <p className="text-xs text-[var(--text-secondary)]">Form luôn hiển thị — server enforce quyền tạo (QMS01-003).</p>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span>Code</span>
                  <Input
                    value={admin.planCreateForm.code}
                    onChange={(e) => admin.setPlanCreateForm({ ...admin.planCreateForm, code: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Inspection stage</span>
                  <Select
                    value={admin.planCreateForm.inspection_stage_id}
                    onChange={(e) => {
                      const stageId = Number(e.target.value)
                      admin.setPlanCreateForm({
                        ...admin.planCreateForm,
                        inspection_stage_id: stageId,
                        item_id: 0,
                        item_revision_id: null,
                      })
                      admin.setPlanCreateItemCode('')
                    }}
                  >
                    <option value={0}>Chọn stage</option>
                    {admin.stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} ({s.stage_group}) — {s.name_vi}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1">
                  <span>
                    Item (
                    {admin.planCreateStageGroup.toUpperCase() === 'IQC'
                      ? 'RAW/COMPONENT'
                      : admin.planCreateRequiresRevision ||
                          ['IPQC', 'OQC', 'SPECIAL'].includes(
                            admin.planCreateStageGroup.toUpperCase(),
                          )
                        ? 'SF/FG'
                        : 'theo stage'}
                    )
                  </span>
                  <Select
                    value={admin.planCreateForm.item_id}
                    onChange={(e) => {
                      const id = Number(e.target.value)
                      const item = admin.planCreateItemOptions.find((it) => it.id === id)
                      admin.setPlanCreateForm({
                        ...admin.planCreateForm,
                        item_id: id,
                        item_revision_id: null,
                      })
                      admin.setPlanCreateItemCode(item?.code ?? '')
                    }}
                  >
                    <option value={0}>Chọn item</option>
                    {admin.planCreateItemOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code} — {item.item_name}
                        {item.item_type_code || item.item_type
                          ? ` (${item.item_type_code || item.item_type})`
                          : ''}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1">
                  <span>
                    Item revision
                    {admin.planCreateRequiresRevision
                      ? ' (bắt buộc)'
                      : ' (tùy chọn)'}
                  </span>
                  <Select
                    value={admin.planCreateForm.item_revision_id ?? 0}
                    onChange={(e) =>
                      admin.setPlanCreateForm({
                        ...admin.planCreateForm,
                        item_revision_id: Number(e.target.value) || null,
                      })
                    }
                  >
                    <option value={0}>
                      {admin.planCreateRequiresRevision ? 'Chọn revision' : 'Không áp dụng'}
                    </option>
                    {admin.planCreateRevisionOptions.map((rev) => (
                      <option key={rev.id} value={rev.id}>
                        {rev.code} ({rev.status})
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1">
                  <span>Sampling method</span>
                  <Select
                    value={admin.planCreateForm.sampling_method_id}
                    onChange={(e) =>
                      admin.setPlanCreateForm({
                        ...admin.planCreateForm,
                        sampling_method_id: Number(e.target.value),
                      })
                    }
                  >
                    <option value={0}>Chọn sampling method</option>
                    {admin.samplingMethods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.code} — {m.name_vi}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1">
                  <span>Inspection frequency</span>
                  <Select
                    value={admin.planCreateForm.inspection_frequency_id}
                    onChange={(e) =>
                      admin.setPlanCreateForm({
                        ...admin.planCreateForm,
                        inspection_frequency_id: Number(e.target.value),
                      })
                    }
                  >
                    <option value={0}>Chọn frequency</option>
                    {admin.frequencies.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code} — {f.name_vi}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1 col-span-2">
                  <span>Sampling param</span>
                  <Input
                    value={admin.planCreateForm.sampling_param}
                    onChange={(e) =>
                      admin.setPlanCreateForm({ ...admin.planCreateForm, sampling_param: e.target.value })
                    }
                    placeholder="n=5,c=0"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={admin.closePlanCreate}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  disabled={admin.planCreateErrors.length > 0 || admin.createPlanPending}
                  onClick={() => {
                    if (window.confirm('Xác nhận tạo checksheet mới?')) {
                      admin.createPlan()
                    }
                  }}
                >
                  {admin.createPlanPending ? 'Đang tạo…' : 'Tạo'}
                </Button>
              </div>
              {admin.createPlanError ? (
                <p className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] text-xs" role="alert">
                  {admin.createPlanError.code}: {admin.createPlanError.message}
                </p>
              ) : null}
            </div>
          </Dialog>

          {(() => {
            const banner = listStateMessage(admin.planListState, 'checksheet')
            return banner ? (
              <p className="qc-admin__state" role={admin.planListState === 'error' ? 'alert' : 'status'}>
                {banner}
                {admin.planListError ? ` (${admin.planListError.code})` : ''}
              </p>
            ) : null
          })()}
          {admin.planListState === 'ready' ? (
            <>
              <div className="qc-admin__table-wrap">
                <table className="qc-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Stage</th>
                      <th>Item</th>
                      <th>Status</th>
                      <th>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planPagination.paginatedItems.map((row) => (
                      <tr
                        key={row.code}
                        className={row.code === admin.selectedPlanCode ? 'qc-admin__row--active' : ''}
                      >
                        <td>
                          <button
                            type="button"
                            className="qc-admin__linkish"
                            onClick={() => admin.selectPlan(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.stageLabel}</td>
                        <td>{row.itemLabel}</td>
                        <td>{row.status}</td>
                        <td>{row.isActive ? 'Có' : 'Không'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <TablePagination
                  {...planPagination}
                  hasMore={admin.planHasMore}
                  onLoadMore={admin.planLoadMore}
                />
              </div>

              <Dialog
                isOpen={!!admin.selectedPlanCode}
                onClose={() => admin.selectPlan('')}
                title={`Chi tiết Checksheet ${admin.selectedPlanCode || ''}`}
                maxWidth="max-w-[75%]"
              >
                {admin.planDetailLoading ? (
                  <div className="p-8 text-center text-sm text-[var(--text-secondary)]">Đang tải chi tiết…</div>
                ) : admin.planDetail ? (
                  <PlanEditor key={admin.planDetail.code} detail={admin.planDetail} admin={admin} />
                ) : null}
              </Dialog>
            </>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'characteristics' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'search',
                type: 'text',
                label: 'Tìm characteristic (code / tên)',
                placeholder: 'CM-… / tên',
              },
            ]}
            values={{
              search: admin.cmSearchInput,
            }}
            onChange={(name, value) => {
              if (name === 'search') {
                admin.setCmSearchInput(value)
              }
            }}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyCmSearch()
            }}
            onReset={() => {
              admin.setCmSearchInput('')
              admin.applyCmSearch()
            }}
            isResetActive={Boolean(admin.cmSearchInput)}
            expands={
              <Button type="button" className="qc-admin__btn shrink-0" onClick={admin.openCmCreate}>
                Tạo characteristic
              </Button>
            }
          />

          <Dialog
            isOpen={admin.showCmCreate}
            onClose={admin.closeCmCreate}
            title="Tạo characteristic master mới"
            maxWidth="max-w-[50%]"
          >
            <div className="flex flex-col gap-4 font-sans text-sm text-[var(--text-primary)]">
              <p className="text-xs text-[var(--text-secondary)]">Form luôn hiển thị — server enforce quyền tạo (QMS01-010).</p>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span>Code</span>
                  <Input
                    value={admin.cmCreateForm.code}
                    onChange={(e) => admin.setCmCreateForm({ ...admin.cmCreateForm, code: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Tên (VI)</span>
                  <Input
                    value={admin.cmCreateForm.name_vi}
                    onChange={(e) => admin.setCmCreateForm({ ...admin.cmCreateForm, name_vi: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Tên (EN)</span>
                  <Input
                    value={admin.cmCreateForm.name_en}
                    onChange={(e) => admin.setCmCreateForm({ ...admin.cmCreateForm, name_en: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Characteristic category</span>
                  <Select
                    value={admin.cmCreateForm.characteristic_category_id}
                    onChange={(e) =>
                      admin.setCmCreateForm({
                        ...admin.cmCreateForm,
                        characteristic_category_id: Number(e.target.value) || 0,
                      })
                    }
                  >
                    <option value={0}>Chọn category</option>
                    {admin.categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.code} — {cat.name_vi}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1">
                  <span>Default char type</span>
                  <Select
                    value={admin.cmCreateForm.default_char_type}
                    onChange={(e) =>
                      admin.setCmCreateForm({ ...admin.cmCreateForm, default_char_type: e.target.value })
                    }
                  >
                    {CHAR_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1">
                  <span>Default UoM</span>
                  <Input
                    value={admin.cmCreateForm.default_uom}
                    onChange={(e) => admin.setCmCreateForm({ ...admin.cmCreateForm, default_uom: e.target.value })}
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={admin.closeCmCreate}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  disabled={admin.cmCreateErrors.length > 0 || admin.createCmPending}
                  onClick={() => {
                    if (window.confirm('Xác nhận tạo characteristic master mới?')) {
                      admin.createCm()
                    }
                  }}
                >
                  {admin.createCmPending ? 'Đang tạo…' : 'Tạo'}
                </Button>
              </div>
              {admin.createCmError ? (
                <p className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] text-xs" role="alert">
                  {admin.createCmError.code}: {admin.createCmError.message}
                </p>
              ) : null}
            </div>
          </Dialog>

          {(() => {
            const banner = listStateMessage(admin.cmListState, 'characteristic')
            return banner ? (
              <p className="qc-admin__state" role={admin.cmListState === 'error' ? 'alert' : 'status'}>
                {banner}
                {admin.cmListError ? ` (${admin.cmListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.cmListState === 'ready' ? (
            <div className="qc-admin__layout">
              <div className="qc-admin__table-wrap">
                <table className="qc-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Tên</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>UoM</th>
                      <th>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cmPagination.paginatedItems.map((row) => (
                      <tr key={row.code} className={row.code === admin.selectedCmCode ? 'qc-admin__row--active' : ''}>
                        <td>
                          <button type="button" className="qc-admin__linkish" onClick={() => admin.selectCm(row.code)}>
                            {row.code}
                          </button>
                        </td>
                        <td>{row.nameVi}</td>
                        <td>{row.categoryLabel}</td>
                        <td>{row.defaultCharType}</td>
                        <td>{row.defaultUom}</td>
                        <td>{row.isActive ? 'Có' : 'Không'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <TablePagination
                  {...cmPagination}
                  hasMore={admin.cmHasMore}
                  onLoadMore={admin.cmLoadMore}
                />
              </div>

              {admin.cmDetailRow ? (
                <aside className="qc-admin__detail" aria-label="Chi tiết characteristic">
                  <h3>{admin.cmDetailRow.code}</h3>
                  <p className="qc-admin__muted">
                    {admin.cmDetailRow.nameVi} · {admin.cmDetailRow.categoryLabel}
                  </p>
                  <button
                    type="button"
                    className="qc-admin__btn qc-admin__btn--danger"
                    disabled={!admin.cmDetailRow.canDeactivate}
                    title={admin.cmDetailRow.updateDisabledReason ?? undefined}
                    onClick={() => admin.setConfirmCmDeactivate(true)}
                  >
                    Deactivate
                  </button>
                  {admin.confirmCmDeactivate ? (
                    <div className="qc-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
                      <p>
                        Xác nhận deactivate <strong>{admin.cmDetailRow.code}</strong>?
                      </p>
                      <div className="qc-admin__actions">
                        <button
                          type="button"
                          disabled={admin.deactivateCmState === 'pending'}
                          onClick={admin.deactivateCm}
                        >
                          Xác nhận
                        </button>
                        <button type="button" onClick={() => admin.setConfirmCmDeactivate(false)}>
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {admin.deactivateCmError ? (
                    <p className="qc-admin__error" role="alert">
                      {admin.deactivateCmError.code}: {admin.deactivateCmError.message}
                    </p>
                  ) : null}
                  {admin.deactivateCmState === 'success' ? (
                    <p className="qc-admin__banner" role="status">
                      Đã deactivate characteristic.
                    </p>
                  ) : null}
                </aside>
              ) : (
                <div className="qc-admin__state">Chọn characteristic để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'defect_codes' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'search',
                type: 'text',
                label: 'Tìm defect code (code / tên)',
                placeholder: 'DC-… / tên',
              },
            ]}
            values={{
              search: admin.dcSearchInput,
            }}
            onChange={(name, value) => {
              if (name === 'search') {
                admin.setDcSearchInput(value)
              }
            }}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyDcSearch()
            }}
            onReset={() => {
              admin.setDcSearchInput('')
              admin.applyDcSearch()
            }}
            isResetActive={Boolean(admin.dcSearchInput)}
            expands={
              <Button type="button" className="qc-admin__btn shrink-0" onClick={admin.openDcCreate}>
                Tạo defect code
              </Button>
            }
          />

          <Dialog
            isOpen={admin.showDcCreate}
            onClose={admin.closeDcCreate}
            title="Tạo defect code mới"
            maxWidth="max-w-[50%]"
          >
            <div className="flex flex-col gap-4 font-sans text-sm text-[var(--text-primary)]">
              <p className="text-xs text-[var(--text-secondary)]">Form luôn hiển thị — server enforce quyền tạo (QMS01-015).</p>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span>Code</span>
                  <Input
                    value={admin.dcCreateForm.code}
                    onChange={(e) => admin.setDcCreateForm({ ...admin.dcCreateForm, code: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Tên (VI)</span>
                  <Input
                    value={admin.dcCreateForm.name_vi}
                    onChange={(e) => admin.setDcCreateForm({ ...admin.dcCreateForm, name_vi: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Tên (EN)</span>
                  <Input
                    value={admin.dcCreateForm.name_en}
                    onChange={(e) => admin.setDcCreateForm({ ...admin.dcCreateForm, name_en: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Characteristic category</span>
                  <Select
                    value={admin.dcCreateForm.characteristic_category_id}
                    onChange={(e) =>
                      admin.setDcCreateForm({
                        ...admin.dcCreateForm,
                        characteristic_category_id: Number(e.target.value) || 0,
                      })
                    }
                  >
                    <option value={0}>Chọn category</option>
                    {admin.categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.code} — {cat.name_vi}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1 col-span-2">
                  <span>Default severity</span>
                  <Select
                    value={admin.dcCreateForm.default_severity}
                    onChange={(e) => admin.setDcCreateForm({ ...admin.dcCreateForm, default_severity: e.target.value })}
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={admin.closeDcCreate}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  disabled={admin.dcCreateErrors.length > 0 || admin.createDcPending}
                  onClick={() => {
                    if (window.confirm('Xác nhận tạo defect code mới?')) {
                      admin.createDc()
                    }
                  }}
                >
                  {admin.createDcPending ? 'Đang tạo…' : 'Tạo'}
                </Button>
              </div>
              {admin.createDcError ? (
                <p className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] text-xs" role="alert">
                  {admin.createDcError.code}: {admin.createDcError.message}
                </p>
              ) : null}
            </div>
          </Dialog>

          {(() => {
            const banner = listStateMessage(admin.dcListState, 'defect code')
            return banner ? (
              <p className="qc-admin__state" role={admin.dcListState === 'error' ? 'alert' : 'status'}>
                {banner}
                {admin.dcListError ? ` (${admin.dcListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.dcListState === 'ready' ? (
            <div className="qc-admin__layout">
              <div className="qc-admin__table-wrap">
                <table className="qc-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Tên</th>
                      <th>Category</th>
                      <th>Severity</th>
                      <th>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dcPagination.paginatedItems.map((row) => (
                      <tr key={row.code} className={row.code === admin.selectedDcCode ? 'qc-admin__row--active' : ''}>
                        <td>
                          <button type="button" className="qc-admin__linkish" onClick={() => admin.selectDc(row.code)}>
                            {row.code}
                          </button>
                        </td>
                        <td>{row.nameVi}</td>
                        <td>{row.categoryLabel}</td>
                        <td>{row.defaultSeverity}</td>
                        <td>{row.isActive ? 'Có' : 'Không'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <TablePagination
                  {...dcPagination}
                  hasMore={admin.dcHasMore}
                  onLoadMore={admin.dcLoadMore}
                />
              </div>

              {admin.dcDetailRow ? (
                <aside className="qc-admin__detail" aria-label="Chi tiết defect code">
                  <h3>{admin.dcDetailRow.code}</h3>
                  <p className="qc-admin__muted">
                    {admin.dcDetailRow.nameVi} · {admin.dcDetailRow.categoryLabel} ·{' '}
                    {admin.dcDetailRow.defaultSeverity}
                  </p>
                  <button
                    type="button"
                    className="qc-admin__btn qc-admin__btn--danger"
                    disabled={!admin.dcDetailRow.canDeactivate}
                    onClick={() => admin.setConfirmDcDeactivate(true)}
                  >
                    Deactivate
                  </button>
                  {admin.confirmDcDeactivate ? (
                    <div className="qc-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
                      <p>
                        Xác nhận deactivate <strong>{admin.dcDetailRow.code}</strong>?
                      </p>
                      <div className="qc-admin__actions">
                        <button
                          type="button"
                          disabled={admin.deactivateDcState === 'pending'}
                          onClick={admin.deactivateDc}
                        >
                          Xác nhận
                        </button>
                        <button type="button" onClick={() => admin.setConfirmDcDeactivate(false)}>
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {admin.deactivateDcError ? (
                    <p className="qc-admin__error" role="alert">
                      {admin.deactivateDcError.code}: {admin.deactivateDcError.message}
                    </p>
                  ) : null}
                  {admin.deactivateDcState === 'success' ? (
                    <p className="qc-admin__banner" role="status">
                      Đã deactivate defect code.
                    </p>
                  ) : null}
                </aside>
              ) : (
                <div className="qc-admin__state">Chọn defect code để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}
      {/* Excel Import/Export Dialog Modal */}
      <Dialog
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        title="Nhập / Xuất dữ liệu Excel (Checksheet)"
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