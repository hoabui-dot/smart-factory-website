import { useState } from 'react'
import { Link } from 'react-router'

import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { Dialog } from '@/shared/components/ui/Dialog'
import { Input, Select } from '@/shared/components/ui/Input'
import { useSupplierMaster } from '../hooks/useSupplierMaster'
import { SUPPLIER_TIERS } from '../types/supplier'
import type { SupplierItemRecord, SupplierRecord } from '../types/supplier'

import './SupplierMasterPage.css'

type Api = ReturnType<typeof useSupplierMaster>

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

function SupplierEditor({ detail, admin }: { detail: SupplierRecord; admin: Api }) {
  const [supplierName, setSupplierName] = useState(detail.supplier_name)
  const [countryCode, setCountryCode] = useState(detail.country_code)
  const [supplierTier, setSupplierTier] = useState(detail.supplier_tier)
  const [iatfCertified, setIatfCertified] = useState(detail.iatf_certified)
  const [iso9001Certified, setIso9001Certified] = useState(detail.iso9001_certified)
  const [contactEmail, setContactEmail] = useState(detail.contact_email)
  const row = admin.supplierDetailRow
  const [tab, setTab] = useState<'overview' | 'edit'>('overview')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex border-b border-[var(--border-default)] gap-2">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            tab === 'overview'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => setTab('overview')}
        >
          Tổng quan
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            tab === 'edit'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => setTab('edit')}
        >
          Chỉnh sửa & Cấu hình
        </button>
      </div>

      {tab === 'overview' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Thông tin cơ bản</h4>
            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
              <span className="text-[var(--text-secondary)]">Mã NCC:</span>
              <span className="font-semibold text-[var(--text-primary)]">{detail.code}</span>
              <span className="text-[var(--text-secondary)]">Tên NCC:</span>
              <span className="font-semibold text-[var(--text-primary)]">{detail.supplier_name}</span>
              <span className="text-[var(--text-secondary)]">Mã quốc gia:</span>
              <span className="font-semibold text-[var(--text-primary)]">{detail.country_code}</span>
              <span className="text-[var(--text-secondary)]">Tier:</span>
              <span className="font-semibold text-[var(--text-primary)]">{detail.supplier_tier}</span>
            </div>
          </div>

          <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Trạng thái & Chứng nhận</h4>
            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
              <span className="text-[var(--text-secondary)]">Trạng thái:</span>
              <span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-info-bg)] text-[var(--color-info-text)]">
                  {detail.approval_status}
                </span>
              </span>
              <span className="text-[var(--text-secondary)]">Email QA:</span>
              <span className="font-medium text-[var(--text-primary)]">{detail.contact_email || '-'}</span>
              <span className="text-[var(--text-secondary)]">IATF 16949:</span>
              <span className={detail.iatf_certified ? "text-[var(--color-success-text)] font-semibold" : "text-[var(--text-muted)]"}>
                {detail.iatf_certified ? "Đạt chứng nhận" : "Không"}
              </span>
              <span className="text-[var(--text-secondary)]">ISO 9001:</span>
              <span className={detail.iso9001_certified ? "text-[var(--color-success-text)] font-semibold" : "text-[var(--text-muted)]"}>
                {detail.iso9001_certified ? "Đạt chứng nhận" : "Không"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            admin.saveSupplierEdit({
              supplier_name: supplierName.trim(),
              country_code: countryCode.trim(),
              supplier_tier: supplierTier,
              iatf_certified: iatfCertified,
              iso9001_certified: iso9001Certified,
              contact_email: contactEmail.trim(),
            })
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="supplier-admin__field">
              <span>Tên nhà cung cấp</span>
              <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
            </label>
            <label className="supplier-admin__field">
              <span>Mã quốc gia</span>
              <input value={countryCode} onChange={(e) => setCountryCode(e.target.value.toUpperCase())} />
            </label>
            <label className="supplier-admin__field">
              <span>Tier</span>
              <select value={supplierTier} onChange={(e) => setSupplierTier(e.target.value)}>
                {SUPPLIER_TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="supplier-admin__field">
              <span>Email QA contact</span>
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </label>
            <div className="flex flex-col gap-2 justify-center">
              <label className="supplier-admin__field supplier-admin__field--checkbox">
                <input
                  type="checkbox"
                  checked={iatfCertified}
                  onChange={(e) => setIatfCertified(e.target.checked)}
                />
                <span>IATF 16949 certified</span>
              </label>
              <label className="supplier-admin__field supplier-admin__field--checkbox">
                <input
                  type="checkbox"
                  checked={iso9001Certified}
                  onChange={(e) => setIso9001Certified(e.target.checked)}
                />
                <span>ISO 9001 certified</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button
              type="submit"
              className="supplier-admin__btn"
              disabled={!row?.canUpdate || admin.updateSupplierPending}
              title={row?.updateDisabledReason ?? undefined}
            >
              {admin.updateSupplierPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
            {!row?.canUpdate && (
              <p className="text-xs text-[var(--text-muted)]">
                Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
              </p>
            )}
          </div>

          {admin.updateSupplierError && (
            <p className="supplier-admin__error" role="alert">
              {admin.updateSupplierError.code}: {admin.updateSupplierError.message}
            </p>
          )}
          {admin.updateSupplierSuccess && (
            <p className="supplier-admin__banner" role="status">
              Đã lưu thay đổi.
            </p>
          )}

          <div className="border-t border-[var(--border-default)] pt-4 mt-2">
            <h4 className="text-sm font-semibold text-[var(--color-danger-text)]">Danger Zone</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Vô hiệu hóa nhà cung cấp này. Lựa chọn này không thể hoàn tác.</p>
            <div className="mt-3">
              <button
                type="button"
                className="supplier-admin__btn supplier-admin__btn--danger"
                disabled={!row?.canDeactivate}
                title={row?.deactivateDisabledReason ?? undefined}
                onClick={() => admin.setConfirmSupplierDeactivate(true)}
              >
                Deactivate supplier
              </button>
            </div>
            {!row?.canDeactivate && (
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                Deactivate không khả dụng
                {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
              </p>
            )}

            {admin.confirmSupplierDeactivate && (
              <div className="supplier-admin__confirm mt-3 p-3 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger-bg)]/10" role="dialog" aria-label="Xác nhận deactivate">
                <p className="text-sm text-[var(--text-primary)]">
                  Xác nhận deactivate <strong>{detail.code}</strong>? Nhà cung cấp sẽ không còn dùng cho phiếu nhập mới.
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    className="supplier-admin__btn supplier-admin__btn--danger"
                    disabled={admin.deactivateSupplierState === 'pending'}
                    onClick={admin.deactivateSupplier}
                  >
                    Xác nhận
                  </button>
                  <button type="button" className="px-3 rounded-lg bg-[var(--surface-3)] text-xs text-[var(--text-primary)] border border-[var(--border-default)]" onClick={() => admin.setConfirmSupplierDeactivate(false)}>
                    Hủy
                  </button>
                </div>
              </div>
            )}
            {admin.deactivateSupplierError && (
              <p className="supplier-admin__error mt-2" role="alert">
                {admin.deactivateSupplierError.code}: {admin.deactivateSupplierError.message}
              </p>
            )}
            {admin.deactivateSupplierState === 'success' && (
              <p className="supplier-admin__banner mt-2" role="status">
                Đã deactivate supplier.
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

function SupplierItemEditor({ detail, admin }: { detail: SupplierItemRecord; admin: Api }) {
  const [leadTimeDays, setLeadTimeDays] = useState(String(detail.lead_time_days))
  const [isDefault, setIsDefault] = useState(detail.is_default)
  const row = admin.supplierItemDetailRow
  const [tab, setTab] = useState<'overview' | 'edit'>('overview')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex border-b border-[var(--border-default)] gap-2">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            tab === 'overview'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => setTab('overview')}
        >
          Tổng quan
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            tab === 'edit'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => setTab('edit')}
        >
          Chỉnh sửa & Cấu hình
        </button>
      </div>

      {tab === 'overview' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Thông tin liên kết</h4>
            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
              <span className="text-[var(--text-secondary)]">Mã liên kết:</span>
              <span className="font-semibold text-[var(--text-primary)]">{detail.code}</span>
              <span className="text-[var(--text-secondary)]">Nhà cung cấp:</span>
              <span className="font-semibold text-[var(--text-primary)]">{row?.supplierLabel ?? '-'}</span>
              <span className="text-[var(--text-secondary)]">Vật tư:</span>
              <span className="font-semibold text-[var(--text-primary)]">{row?.itemLabel ?? '-'}</span>
            </div>
          </div>

          <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Cấu hình cung ứng</h4>
            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
              <span className="text-[var(--text-secondary)]">Lead time:</span>
              <span className="font-semibold text-[var(--text-primary)]">{detail.lead_time_days} ngày</span>
              <span className="text-[var(--text-secondary)]">Mặc định:</span>
              <span className={detail.is_default ? "text-[var(--color-success-text)] font-semibold" : "text-[var(--text-muted)]"}>
                {detail.is_default ? "Nhà cung cấp mặc định" : "Không"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            admin.saveSupplierItemEdit({
              lead_time_days: Number(leadTimeDays) || 0,
              is_default: isDefault,
            })
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="supplier-admin__field">
              <span>Lead time (ngày)</span>
              <input inputMode="numeric" value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} />
            </label>
            <div className="flex items-center">
              <label className="supplier-admin__field supplier-admin__field--checkbox">
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                <span>Nhà cung cấp mặc định cho item này</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button
              type="submit"
              className="supplier-admin__btn"
              disabled={!row?.canUpdate || admin.updateSupplierItemPending}
              title={row?.updateDisabledReason ?? undefined}
            >
              {admin.updateSupplierItemPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
            {!row?.canUpdate && (
              <p className="text-xs text-[var(--text-muted)]">
                Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
              </p>
            )}
          </div>

          {admin.updateSupplierItemError && (
            <p className="supplier-admin__error" role="alert">
              {admin.updateSupplierItemError.code}: {admin.updateSupplierItemError.message}
            </p>
          )}
          {admin.updateSupplierItemSuccess && (
            <p className="supplier-admin__banner" role="status">
              Đã lưu thay đổi.
            </p>
          )}

          <div className="border-t border-[var(--border-default)] pt-4 mt-2">
            <h4 className="text-sm font-semibold text-[var(--color-danger-text)]">Danger Zone</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Hủy kích hoạt liên kết cung ứng này.</p>
            <div className="mt-3">
              <button
                type="button"
                className="supplier-admin__btn supplier-admin__btn--danger"
                disabled={!row?.canDeactivate}
                title={row?.deactivateDisabledReason ?? undefined}
                onClick={() => admin.setConfirmSupplierItemDeactivate(true)}
              >
                Deactivate supplier item
              </button>
            </div>
            {!row?.canDeactivate && (
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                Deactivate không khả dụng
                {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
              </p>
            )}

            {admin.confirmSupplierItemDeactivate && (
              <div className="supplier-admin__confirm mt-3 p-3 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger-bg)]/10" role="dialog" aria-label="Xác nhận deactivate">
                <p className="text-sm text-[var(--text-primary)]">
                  Xác nhận deactivate <strong>{detail.code}</strong>?
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    className="supplier-admin__btn supplier-admin__btn--danger"
                    disabled={admin.deactivateSupplierItemState === 'pending'}
                    onClick={admin.deactivateSupplierItem}
                  >
                    Xác nhận
                  </button>
                  <button type="button" className="px-3 rounded-lg bg-[var(--surface-3)] text-xs text-[var(--text-primary)] border border-[var(--border-default)]" onClick={() => admin.setConfirmSupplierItemDeactivate(false)}>
                    Hủy
                  </button>
                </div>
              </div>
            )}
            {admin.deactivateSupplierItemError && (
              <p className="supplier-admin__error mt-2" role="alert">
                {admin.deactivateSupplierItemError.code}: {admin.deactivateSupplierItemError.message}
              </p>
            )}
            {admin.deactivateSupplierItemState === 'success' && (
              <p className="supplier-admin__banner mt-2" role="status">
                Đã deactivate supplier item.
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

export function SupplierMasterPage() {
  const admin = useSupplierMaster()

  return (
    <section className="supplier-admin" aria-labelledby="supplier-admin-title">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'WMS' },
          { label: 'Suppliers' },
        ]}
        title="Danh mục nhà cung cấp (Supplier Master)"
        subtitle="Quản lý thông tin đối tác cung ứng, danh mục vật tư nhập khẩu và chứng chỉ Mill Certificate đi kèm."
        actions={
          <Link to="/web/import-export">
            <Button variant="secondary">Nhập/Xuất Dữ liệu (Excel)</Button>
          </Link>
        }
      />

      <div className="flex border-b border-[var(--border-default)] mb-4 gap-2" role="tablist" aria-label="Supplier admin sections">
        <button
          type="button"
          role="tab"
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            admin.tab === 'suppliers'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          aria-selected={admin.tab === 'suppliers'}
          onClick={() => admin.setTab('suppliers')}
        >
          Nhà cung cấp
        </button>
        <button
          type="button"
          role="tab"
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            admin.tab === 'supplier_items'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          aria-selected={admin.tab === 'supplier_items'}
          onClick={() => admin.setTab('supplier_items')}
        >
          Vật tư liên kết (Supplier Items)
        </button>
        <button
          type="button"
          role="tab"
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            admin.tab === 'supplier_evaluations'
              ? 'border-[var(--color-action-primary)] text-[var(--color-action-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          aria-selected={admin.tab === 'supplier_evaluations'}
          onClick={() => admin.setTab('supplier_evaluations')}
        >
          Đánh giá nhà cung cấp (Evaluations)
        </button>
      </div>

      {admin.tab === 'suppliers' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'supSearchInput',
                type: 'text',
                placeholder: 'Tìm theo mã hoặc tên nhà cung cấp...',
              }
            ]}
            values={{
              supSearchInput: admin.supSearchInput,
            }}
            onChange={(_, val) => admin.setSupSearchInput(val)}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applySupplierSearch()
            }}
            onReset={() => {
              admin.setSupSearchInput('')
              admin.applySupplierSearch()
            }}
            isResetActive={Boolean(admin.supSearchInput)}
          >
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" onClick={admin.openSupplierCreate} size="sm" className="h-9">
                Tạo supplier
              </Button>
            </div>
          </FilterBar>

          <Dialog
            isOpen={admin.showSupplierCreate}
            onClose={admin.closeSupplierCreate}
            title="Tạo supplier mới"
            maxWidth="max-w-[50%]"
          >
            <div className="flex flex-col gap-4 font-sans text-sm text-[var(--text-primary)]">
              <p className="text-xs text-[var(--text-secondary)]">
                Form luôn hiển thị — server enforce quyền tạo (WMS06-003). approval_status khởi tạo
                CONDITIONAL, server derive.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span>Code</span>
                  <Input
                    value={admin.supplierCreateForm.code}
                    onChange={(e) =>
                      admin.setSupplierCreateForm({ ...admin.supplierCreateForm, code: e.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Tên nhà cung cấp</span>
                  <Input
                    value={admin.supplierCreateForm.supplier_name}
                    onChange={(e) =>
                      admin.setSupplierCreateForm({
                        ...admin.supplierCreateForm,
                        supplier_name: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Mã quốc gia</span>
                  <Input
                    value={admin.supplierCreateForm.country_code}
                    onChange={(e) =>
                      admin.setSupplierCreateForm({
                        ...admin.supplierCreateForm,
                        country_code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="VN"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Tier</span>
                  <Select
                    value={admin.supplierCreateForm.supplier_tier}
                    onChange={(e) =>
                      admin.setSupplierCreateForm({
                        ...admin.supplierCreateForm,
                        supplier_tier: e.target.value,
                      })
                    }
                  >
                    {SUPPLIER_TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1">
                  <span>Email QA contact</span>
                  <Input
                    value={admin.supplierCreateForm.contact_email}
                    onChange={(e) =>
                      admin.setSupplierCreateForm({
                        ...admin.supplierCreateForm,
                        contact_email: e.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={admin.supplierCreateForm.iatf_certified}
                    onChange={(e) =>
                      admin.setSupplierCreateForm({
                        ...admin.supplierCreateForm,
                        iatf_certified: e.target.checked,
                      })
                    }
                  />
                  <span>IATF 16949 certified</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={admin.supplierCreateForm.iso9001_certified}
                    onChange={(e) =>
                      admin.setSupplierCreateForm({
                        ...admin.supplierCreateForm,
                        iso9001_certified: e.target.checked,
                      })
                    }
                  />
                  <span>ISO 9001 certified</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={admin.closeSupplierCreate}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  disabled={admin.supplierCreateErrors.length > 0 || admin.createSupplierPending}
                  onClick={() => admin.createSupplier()}
                >
                  {admin.createSupplierPending ? 'Đang tạo…' : 'Tạo'}
                </Button>
              </div>
              {admin.createSupplierError ? (
                <p className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] text-xs" role="alert">
                  {admin.createSupplierError.code}: {admin.createSupplierError.message}
                </p>
              ) : null}
            </div>
          </Dialog>

          {(() => {
            const banner = listStateMessage(admin.supplierListState, 'supplier')
            return banner ? (
              <p
                className="supplier-admin__state"
                role={admin.supplierListState === 'error' ? 'alert' : 'status'}
              >
                {banner}
                {admin.supplierListError ? ` (${admin.supplierListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.supplierListState === 'ready' ? (
            <div className="supplier-admin__table-wrap">
              <table className="supplier-admin__table">
                <thead>
                  <tr>
                    <th>Mã NCC</th>
                    <th>Tên nhà cung cấp</th>
                    <th>Phân hạng (Tier)</th>
                    <th>Trạng thái phê duyệt</th>
                    <th>Quốc gia</th>
                  </tr>
                </thead>
                <tbody>
                  {admin.supplierRows.map((row) => (
                    <tr
                      key={row.code}
                      className={`transition-colors hover:bg-[var(--surface-2)] border-b border-[var(--border-default)] cursor-pointer ${
                        row.code === admin.selectedSupplierCode ? 'supplier-admin__row--active' : ''
                      }`}
                      onClick={() => admin.selectSupplier(row.code)}
                    >
                      <td>
                        <button
                          type="button"
                          className="supplier-admin__linkish"
                          onClick={(e) => {
                            e.stopPropagation()
                            admin.selectSupplier(row.code)
                          }}
                        >
                          {row.code}
                        </button>
                      </td>
                      <td>{row.supplierName}</td>
                      <td>{row.supplierTier}</td>
                      <td>{row.approvalStatus}</td>
                      <td>{row.countryCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {admin.supplierHasMore ? (
                <button
                  type="button"
                  className="supplier-admin__more"
                  onClick={admin.supplierLoadMore}
                >
                  Tải thêm
                </button>
              ) : null}
            </div>
          ) : null}

          <Dialog
            isOpen={!!admin.selectedSupplierCode}
            onClose={() => admin.selectSupplier(null)}
            title={`Chi tiết nhà cung cấp: ${admin.selectedSupplierCode ?? ''}`}
            maxWidth="max-w-[75%]"
          >
            {admin.supplierDetailLoading ? (
              <div className="p-8 text-center text-sm text-[var(--text-secondary)]">Đang tải chi tiết…</div>
            ) : admin.supplierDetail ? (
              <SupplierEditor key={admin.supplierDetail.code} detail={admin.supplierDetail} admin={admin} />
            ) : (
              <div className="p-8 text-center text-sm text-[var(--text-secondary)]">Không tìm thấy thông tin chi tiết.</div>
            )}
          </Dialog>
        </>
      ) : null}

      {admin.tab === 'supplier_items' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'siSearchInput',
                type: 'text',
                placeholder: 'Tìm theo mã supplier item...',
              }
            ]}
            values={{
              siSearchInput: admin.siSearchInput,
            }}
            onChange={(_, val) => admin.setSiSearchInput(val)}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applySupplierItemSearch()
            }}
            onReset={() => {
              admin.setSiSearchInput('')
              admin.applySupplierItemSearch()
            }}
            isResetActive={Boolean(admin.siSearchInput)}
          >
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" onClick={admin.openSupplierItemCreate} size="sm" className="h-9">
                Tạo supplier item
              </Button>
            </div>
          </FilterBar>

          <Dialog
            isOpen={admin.showSupplierItemCreate}
            onClose={admin.closeSupplierItemCreate}
            title="Tạo supplier item mới"
            maxWidth="max-w-[50%]"
          >
            <div className="flex flex-col gap-4 font-sans text-sm text-[var(--text-primary)]">
              <p className="text-xs text-[var(--text-secondary)]">
                Form luôn hiển thị — server enforce quyền tạo (WMS06-008).
              </p>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span>Code</span>
                  <Input
                    value={admin.supplierItemCreateForm.code}
                    onChange={(e) =>
                      admin.setSupplierItemCreateForm({
                        ...admin.supplierItemCreateForm,
                        code: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Supplier</span>
                  <Select
                    value={admin.supplierItemCreateForm.supplier_id}
                    onChange={(e) =>
                      admin.setSupplierItemCreateForm({
                        ...admin.supplierItemCreateForm,
                        supplier_id: Number(e.target.value),
                      })
                    }
                  >
                    <option value={0}>Chọn supplier</option>
                    {admin.supplierOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.supplier_name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1">
                  <span>Item</span>
                  <Select
                    value={admin.supplierItemCreateForm.item_id}
                    onChange={(e) =>
                      admin.setSupplierItemCreateForm({
                        ...admin.supplierItemCreateForm,
                        item_id: Number(e.target.value),
                      })
                    }
                  >
                    <option value={0}>Chọn item</option>
                    {admin.itemOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code} — {item.item_name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1">
                  <span>Lead time (ngày)</span>
                  <Input
                    inputMode="numeric"
                    value={admin.supplierItemCreateForm.lead_time_days || ''}
                    onChange={(e) =>
                      admin.setSupplierItemCreateForm({
                        ...admin.supplierItemCreateForm,
                        lead_time_days: Number(e.target.value) || 0,
                      })
                    }
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  checked={admin.supplierItemCreateForm.is_default}
                  onChange={(e) =>
                    admin.setSupplierItemCreateForm({
                      ...admin.supplierItemCreateForm,
                      is_default: e.target.checked,
                    })
                  }
                />
                <span>Nhà cung cấp mặc định cho item này</span>
              </label>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={admin.closeSupplierItemCreate}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  disabled={
                    admin.supplierItemCreateErrors.length > 0 || admin.createSupplierItemPending
                  }
                  onClick={() => admin.createSupplierItem()}
                >
                  {admin.createSupplierItemPending ? 'Đang tạo…' : 'Tạo'}
                </Button>
              </div>
              {admin.createSupplierItemError ? (
                <p className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] text-xs" role="alert">
                  {admin.createSupplierItemError.code}: {admin.createSupplierItemError.message}
                </p>
              ) : null}
            </div>
          </Dialog>

          {(() => {
            const banner = listStateMessage(admin.supplierItemListState, 'supplier item')
            return banner ? (
              <p
                className="supplier-admin__state"
                role={admin.supplierItemListState === 'error' ? 'alert' : 'status'}
              >
                {banner}
                {admin.supplierItemListError ? ` (${admin.supplierItemListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.supplierItemListState === 'ready' ? (
            <div className="supplier-admin__table-wrap">
              <table className="supplier-admin__table">
                <thead>
                  <tr>
                    <th>Mã liên kết</th>
                    <th>Nhà cung cấp</th>
                    <th>Vật tư</th>
                    <th>Thời gian giao hàng (Lead-time)</th>
                    <th>Mặc định</th>
                  </tr>
                </thead>
                <tbody>
                  {admin.supplierItemRows.map((row) => (
                    <tr
                      key={row.code}
                      className={`transition-colors hover:bg-[var(--surface-2)] border-b border-[var(--border-default)] cursor-pointer ${
                        row.code === admin.selectedSupplierItemCode ? 'supplier-admin__row--active' : ''
                      }`}
                      onClick={() => admin.selectSupplierItem(row.code)}
                    >
                      <td>
                        <button
                          type="button"
                          className="supplier-admin__linkish"
                          onClick={(e) => {
                            e.stopPropagation()
                            admin.selectSupplierItem(row.code)
                          }}
                        >
                          {row.code}
                        </button>
                      </td>
                      <td>{row.supplierLabel}</td>
                      <td>{row.itemLabel}</td>
                      <td>{row.leadTimeDays} ngày</td>
                      <td>{row.isDefault ? 'Có' : 'Không'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {admin.supplierItemHasMore ? (
                <button
                  type="button"
                  className="supplier-admin__more"
                  onClick={admin.supplierItemLoadMore}
                >
                  Tải thêm
                </button>
              ) : null}
            </div>
          ) : null}

          <Dialog
            isOpen={!!admin.selectedSupplierItemCode}
            onClose={() => admin.selectSupplierItem(null)}
            title={`Chi tiết vật tư liên kết: ${admin.selectedSupplierItemCode ?? ''}`}
            maxWidth="max-w-[75%]"
          >
            {admin.supplierItemDetailLoading ? (
              <div className="p-8 text-center text-sm text-[var(--text-secondary)]">Đang tải chi tiết…</div>
            ) : admin.supplierItemDetail ? (
              <SupplierItemEditor
                key={admin.supplierItemDetail.code}
                detail={admin.supplierItemDetail}
                admin={admin}
              />
            ) : (
              <div className="p-8 text-center text-sm text-[var(--text-secondary)]">Không tìm thấy thông tin chi tiết.</div>
            )}
          </Dialog>
        </>
      ) : null}

      {admin.tab === 'supplier_evaluations' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'evSearchInput',
                type: 'text',
                placeholder: 'Tìm theo mã hoặc kỳ đánh giá (Ví dụ: EVAL-... / 2026-Q2)...',
              }
            ]}
            values={{
              evSearchInput: admin.evSearchInput,
            }}
            onChange={(_, val) => admin.setEvSearchInput(val)}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyEvaluationSearch()
            }}
            onReset={() => {
              admin.setEvSearchInput('')
              admin.applyEvaluationSearch()
            }}
            isResetActive={Boolean(admin.evSearchInput)}
          >
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" onClick={admin.openEvaluationCreate} size="sm" className="h-9">
                Tạo evaluation
              </Button>
            </div>
          </FilterBar>

          <p className="supplier-admin__muted">
            Supplier evaluation là append-only trong Phase 1 — không có Edit/Delete.
          </p>

          <Dialog
            isOpen={admin.showEvaluationCreate}
            onClose={admin.closeEvaluationCreate}
            title="Tạo supplier evaluation mới"
            maxWidth="max-w-[50%]"
          >
            <div className="flex flex-col gap-4 font-sans text-sm text-[var(--text-primary)]">
              <p className="text-xs text-[var(--text-secondary)]">
                Form luôn hiển thị — server enforce quyền (WMS06-013). total_score/grade server
                derive; approval_status của supplier cập nhật atomic theo evaluation hiệu lực gần
                nhất.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span>Code</span>
                  <Input
                    value={admin.evaluationCreateForm.code}
                    onChange={(e) =>
                      admin.setEvaluationCreateForm({
                        ...admin.evaluationCreateForm,
                        code: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Supplier</span>
                  <Select
                    value={admin.evaluationCreateForm.supplier_id}
                    onChange={(e) =>
                      admin.setEvaluationCreateForm({
                        ...admin.evaluationCreateForm,
                        supplier_id: Number(e.target.value),
                      })
                    }
                  >
                    <option value={0}>Chọn supplier</option>
                    {admin.supplierOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.supplier_name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1">
                  <span>Kỳ đánh giá</span>
                  <Input
                    value={admin.evaluationCreateForm.evaluation_period}
                    onChange={(e) =>
                      admin.setEvaluationCreateForm({
                        ...admin.evaluationCreateForm,
                        evaluation_period: e.target.value,
                      })
                    }
                    placeholder="2026-Q2"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Quality score (0-100)</span>
                  <Input
                    inputMode="decimal"
                    value={admin.evaluationCreateForm.quality_score || ''}
                    onChange={(e) =>
                      admin.setEvaluationCreateForm({
                        ...admin.evaluationCreateForm,
                        quality_score: Number(e.target.value) || 0,
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Delivery score (0-100)</span>
                  <Input
                    inputMode="decimal"
                    value={admin.evaluationCreateForm.delivery_score || ''}
                    onChange={(e) =>
                      admin.setEvaluationCreateForm({
                        ...admin.evaluationCreateForm,
                        delivery_score: Number(e.target.value) || 0,
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Service score (0-100)</span>
                  <Input
                    inputMode="decimal"
                    value={admin.evaluationCreateForm.service_score || ''}
                    onChange={(e) =>
                      admin.setEvaluationCreateForm({
                        ...admin.evaluationCreateForm,
                        service_score: Number(e.target.value) || 0,
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Ngày đánh giá</span>
                  <Input
                    type="date"
                    value={admin.evaluationCreateForm.evaluated_at}
                    onChange={(e) =>
                      admin.setEvaluationCreateForm({
                        ...admin.evaluationCreateForm,
                        evaluated_at: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Action required (grade C/D)</span>
                  <Input
                    value={admin.evaluationCreateForm.action_required ?? ''}
                    onChange={(e) =>
                      admin.setEvaluationCreateForm({
                        ...admin.evaluationCreateForm,
                        action_required: e.target.value || null,
                      })
                    }
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={admin.closeEvaluationCreate}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  disabled={admin.evaluationCreateErrors.length > 0 || admin.createEvaluationPending}
                  onClick={() => admin.createEvaluation()}
                >
                  {admin.createEvaluationPending ? 'Đang tạo…' : 'Tạo'}
                </Button>
              </div>
              {admin.createEvaluationError ? (
                <p className="p-3 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/20 text-[var(--color-danger-text)] text-xs" role="alert">
                  {admin.createEvaluationError.code}: {admin.createEvaluationError.message}
                </p>
              ) : null}
            </div>
          </Dialog>

          {(() => {
            const banner = listStateMessage(admin.evaluationListState, 'evaluation')
            return banner ? (
              <p
                className="supplier-admin__state"
                role={admin.evaluationListState === 'error' ? 'alert' : 'status'}
              >
                {banner}
                {admin.evaluationListError ? ` (${admin.evaluationListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.evaluationListState === 'ready' ? (
            <div className="supplier-admin__table-wrap">
              <table className="supplier-admin__table">
                <thead>
                  <tr>
                    <th>Mã đánh giá</th>
                    <th>Nhà cung cấp</th>
                    <th>Kỳ đánh giá</th>
                    <th>Tổng điểm</th>
                    <th>Xếp loại</th>
                  </tr>
                </thead>
                <tbody>
                  {admin.evaluationRows.map((row) => (
                    <tr
                      key={row.code}
                      className={`transition-colors hover:bg-[var(--surface-2)] border-b border-[var(--border-default)] cursor-pointer ${
                        row.code === admin.selectedEvaluationCode ? 'supplier-admin__row--active' : ''
                      }`}
                      onClick={() => admin.selectEvaluation(row.code)}
                    >
                      <td>
                        <button
                          type="button"
                          className="supplier-admin__linkish"
                          onClick={(e) => {
                            e.stopPropagation()
                            admin.selectEvaluation(row.code)
                          }}
                        >
                          {row.code}
                        </button>
                      </td>
                      <td>{row.supplierLabel}</td>
                      <td>{row.evaluationPeriod}</td>
                      <td>{row.totalScore}</td>
                      <td>{row.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {admin.evaluationHasMore ? (
                <button
                  type="button"
                  className="supplier-admin__more"
                  onClick={admin.evaluationLoadMore}
                >
                  Tải thêm
                </button>
              ) : null}
            </div>
          ) : null}

          <Dialog
            isOpen={!!admin.selectedEvaluationCode}
            onClose={() => admin.selectEvaluation(null)}
            title={`Chi tiết đánh giá nhà cung cấp: ${admin.selectedEvaluationCode ?? ''}`}
            maxWidth="max-w-[75%]"
          >
            {admin.evaluationDetailLoading ? (
              <div className="p-8 text-center text-sm text-[var(--text-secondary)]">Đang tải chi tiết…</div>
            ) : admin.evaluationDetailRow ? (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
                    <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Điểm số chi tiết</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                      <span className="text-[var(--text-secondary)]">Quality score:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{admin.evaluationDetailRow.qualityScore}</span>
                      <span className="text-[var(--text-secondary)]">Delivery score:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{admin.evaluationDetailRow.deliveryScore}</span>
                      <span className="text-[var(--text-secondary)]">Service score:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{admin.evaluationDetailRow.serviceScore}</span>
                      <span className="text-[var(--text-secondary)]">Tổng điểm:</span>
                      <span className="font-bold text-[var(--color-action-primary)]">{admin.evaluationDetailRow.totalScore}</span>
                    </div>
                  </div>

                  <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
                    <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Thông tin đợt đánh giá</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                      <span className="text-[var(--text-secondary)]">Kỳ đánh giá:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{admin.evaluationDetailRow.evaluationPeriod}</span>
                      <span className="text-[var(--text-secondary)]">Xếp loại:</span>
                      <span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-info-bg)] text-[var(--color-info-text)]">
                          {admin.evaluationDetailRow.grade}
                        </span>
                      </span>
                      <span className="text-[var(--text-secondary)]">Đánh giá bởi:</span>
                      <span className="font-medium text-[var(--text-primary)]">{admin.evaluationDetailRow.evaluatedByLabel}</span>
                      <span className="text-[var(--text-secondary)]">Thời gian:</span>
                      <span className="font-medium text-[var(--text-primary)]">{admin.evaluationDetailRow.evaluatedAt}</span>
                    </div>
                  </div>
                </div>

                {admin.evaluationDetailRow.actionRequired && (
                  <div className="p-4 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-bg)]/10">
                    <h5 className="text-sm font-semibold text-[var(--color-danger-text)]">Yêu cầu hành động</h5>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{admin.evaluationDetailRow.actionRequired}</p>
                  </div>
                )}

                <p className="text-xs text-[var(--text-muted)] text-center mt-2">
                  Append-only — không có Edit/Delete cho supplier evaluation trong Phase 1.
                </p>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-[var(--text-secondary)]">Không tìm thấy thông tin chi tiết.</div>
            )}
          </Dialog>
        </>
      ) : null}
    </section>
  )
}
