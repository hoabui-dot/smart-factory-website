import { useState } from 'react'
import { Link } from 'react-router'

import { PageHeader } from '@/shared/components/layout/PageHeader'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { Button } from '@/shared/components/ui/Button'
import { Dialog } from '@/shared/components/ui/Dialog'
import { Input, Select, Textarea } from '@/shared/components/ui/Input'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { useShiftSkill } from '../hooks/useShiftSkill'
import {
  OPERATOR_SKILL_LEVEL_VALUES,
  OPERATOR_SKILL_STATUS_VALUES,
  ROLE_ON_LINE_VALUES,
  SKILL_CATEGORY_VALUES,
  TRAINING_RESULT_VALUES,
} from '../types/shiftSkill'
import type {
  OperatorSkillRecord,
  ShiftAssignmentRecord,
  ShiftRecord,
  SkillMasterRecord,
  ShiftRow,
  ShiftAssignmentRow,
  SkillMasterRow,
  OperatorSkillRow,
  TrainingRecordRow,
} from '../types/shiftSkill'
import { usePagination } from '@/shared/lib/usePagination'
import { GenericDataTable, ColumnDef } from '@/shared/components/ui/DataTable'

import './ShiftSkillPage.css'

type Api = ReturnType<typeof useShiftSkill>

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

function ShiftEditor({ detail, admin }: { detail: ShiftRecord; admin: Api }) {
  const [startTime, setStartTime] = useState(detail.start_time.slice(0, 5))
  const [endTime, setEndTime] = useState(detail.end_time.slice(0, 5))
  const row = admin.shiftDetailRow

  return (
    <aside className="shift-admin__detail" aria-label="Chi tiết ca">
      <h3>{detail.code}</h3>
      <p className="shift-admin__muted">
        {detail.start_time} → {detail.end_time} {row?.isOvernight ? '(qua đêm)' : ''}
      </p>

      <label className="shift-admin__field">
        <span>Giờ bắt đầu</span>
        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
      </label>
      <label className="shift-admin__field">
        <span>Giờ kết thúc</span>
        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      </label>

      <button
        type="button"
        className="shift-admin__btn"
        disabled={!row?.canUpdate || admin.updateShiftPending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() => admin.saveShiftEdit({ start_time: startTime, end_time: endTime })}
      >
        {admin.updateShiftPending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="shift-admin__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateShiftError ? (
        <p className="shift-admin__error" role="alert">
          {admin.updateShiftError.code}: {admin.updateShiftError.message}
        </p>
      ) : null}
      {admin.updateShiftSuccess ? (
        <p className="shift-admin__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>Deactivate</h4>
      <button
        type="button"
        className="shift-admin__btn shift-admin__btn--danger"
        disabled={!row?.canDeactivate}
        title={row?.deactivateDisabledReason ?? undefined}
        onClick={() => admin.setConfirmShiftDeactivate(true)}
      >
        Deactivate ca
      </button>
      {!row?.canDeactivate ? (
        <p className="shift-admin__muted">
          Deactivate không khả dụng
          {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
        </p>
      ) : null}
      <ConfirmDialog
        isOpen={admin.confirmShiftDeactivate}
        onClose={() => admin.setConfirmShiftDeactivate(false)}
        onConfirm={admin.deactivateShift}
        title="Xác nhận deactivate"
        description={`Xác nhận deactivate ${detail.code}? Ca sẽ bị xoá (chỉ khi không còn phân ca gắn).`}
        isPending={admin.deactivateShiftState === 'pending'}
      />
      {admin.deactivateShiftError ? (
        <p className="shift-admin__error" role="alert">
          {admin.deactivateShiftError.code}: {admin.deactivateShiftError.message}
        </p>
      ) : null}
      {admin.deactivateShiftState === 'success' ? (
        <p className="shift-admin__banner" role="status">
          Đã deactivate ca.
        </p>
      ) : null}
    </aside>
  )
}

function ShiftAssignmentEditor({
  detail,
  admin,
}: {
  detail: ShiftAssignmentRecord
  admin: Api
}) {
  const [roleOnLine, setRoleOnLine] = useState(detail.role_on_line)
  const row = admin.assignmentDetailRow

  return (
    <aside className="shift-admin__detail" aria-label="Chi tiết phân ca">
      <h3>{detail.code}</h3>
      <p className="shift-admin__muted">
        {row?.shiftLabel ?? '-'} · {row?.operatorLabel ?? '-'} · {row?.workCenterLabel ?? '-'} ·{' '}
        {detail.work_date}
      </p>

      <label className="shift-admin__field">
        <span>Vai trò</span>
        <select value={roleOnLine} onChange={(e) => setRoleOnLine(e.target.value)}>
          {ROLE_ON_LINE_VALUES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="shift-admin__btn"
        disabled={!row?.canUpdate || admin.updateAssignmentPending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() => admin.saveAssignmentEdit({ role_on_line: roleOnLine })}
      >
        {admin.updateAssignmentPending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="shift-admin__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateAssignmentError ? (
        <p className="shift-admin__error" role="alert">
          {admin.updateAssignmentError.code}: {admin.updateAssignmentError.message}
        </p>
      ) : null}
      {admin.updateAssignmentSuccess ? (
        <p className="shift-admin__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>Deactivate</h4>
      <button
        type="button"
        className="shift-admin__btn shift-admin__btn--danger"
        disabled={!row?.canDeactivate}
        title={row?.deactivateDisabledReason ?? undefined}
        onClick={() => admin.setConfirmAssignmentDeactivate(true)}
      >
        Deactivate phân ca
      </button>
      {!row?.canDeactivate ? (
        <p className="shift-admin__muted">
          Deactivate không khả dụng
          {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
        </p>
      ) : null}
      <ConfirmDialog
        isOpen={admin.confirmAssignmentDeactivate}
        onClose={() => admin.setConfirmAssignmentDeactivate(false)}
        onConfirm={admin.deactivateAssignment}
        title="Xác nhận deactivate"
        description={`Xác nhận deactivate ${detail.code}?`}
        isPending={admin.deactivateAssignmentState === 'pending'}
      />
      {admin.deactivateAssignmentError ? (
        <p className="shift-admin__error" role="alert">
          {admin.deactivateAssignmentError.code}: {admin.deactivateAssignmentError.message}
        </p>
      ) : null}
      {admin.deactivateAssignmentState === 'success' ? (
        <p className="shift-admin__banner" role="status">
          Đã deactivate phân ca.
        </p>
      ) : null}
    </aside>
  )
}

function SkillEditor({ detail, admin }: { detail: SkillMasterRecord; admin: Api }) {
  const [skillName, setSkillName] = useState(detail.skill_name)
  const [issuer, setIssuer] = useState(detail.issuer)
  const [validityMonths, setValidityMonths] = useState(
    detail.validity_months == null ? '' : String(detail.validity_months),
  )
  const row = admin.skillDetailRow

  return (
    <aside className="shift-admin__detail" aria-label="Chi tiết kỹ năng">
      <h3>{detail.code}</h3>
      <p className="shift-admin__muted">
        {detail.skill_category} · {detail.is_active ? 'Active' : 'Inactive'}
      </p>

      <label className="shift-admin__field">
        <span>Tên kỹ năng</span>
        <input value={skillName} onChange={(e) => setSkillName(e.target.value)} />
      </label>
      <label className="shift-admin__field">
        <span>Đơn vị cấp</span>
        <input value={issuer} onChange={(e) => setIssuer(e.target.value)} />
      </label>
      <label className="shift-admin__field">
        <span>Hiệu lực (tháng)</span>
        <input
          inputMode="numeric"
          value={validityMonths}
          onChange={(e) => setValidityMonths(e.target.value)}
        />
      </label>

      <button
        type="button"
        className="shift-admin__btn"
        disabled={!row?.canUpdate || admin.updateSkillPending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() =>
          admin.saveSkillEdit({
            skill_name: skillName.trim(),
            issuer: issuer.trim(),
            validity_months: validityMonths.trim() ? Number(validityMonths) : null,
          })
        }
      >
        {admin.updateSkillPending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="shift-admin__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateSkillError ? (
        <p className="shift-admin__error" role="alert">
          {admin.updateSkillError.code}: {admin.updateSkillError.message}
        </p>
      ) : null}
      {admin.updateSkillSuccess ? (
        <p className="shift-admin__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>Deactivate</h4>
      <button
        type="button"
        className="shift-admin__btn shift-admin__btn--danger"
        disabled={!row?.canDeactivate}
        title={row?.deactivateDisabledReason ?? undefined}
        onClick={() => admin.setConfirmSkillDeactivate(true)}
      >
        Deactivate kỹ năng
      </button>
      {!row?.canDeactivate ? (
        <p className="shift-admin__muted">
          Deactivate không khả dụng
          {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
        </p>
      ) : null}
      <ConfirmDialog
        isOpen={admin.confirmSkillDeactivate}
        onClose={() => admin.setConfirmSkillDeactivate(false)}
        onConfirm={admin.deactivateSkill}
        title="Xác nhận deactivate"
        description={`Xác nhận deactivate ${detail.code}?`}
        isPending={admin.deactivateSkillState === 'pending'}
      />
      {admin.deactivateSkillError ? (
        <p className="shift-admin__error" role="alert">
          {admin.deactivateSkillError.code}: {admin.deactivateSkillError.message}
        </p>
      ) : null}
      {admin.deactivateSkillState === 'success' ? (
        <p className="shift-admin__banner" role="status">
          Đã deactivate kỹ năng.
        </p>
      ) : null}
    </aside>
  )
}

function OperatorSkillEditor({
  detail,
  admin,
}: {
  detail: OperatorSkillRecord
  admin: Api
}) {
  const [level, setLevel] = useState(detail.level)
  const [status, setStatus] = useState(detail.status)
  const row = admin.operatorSkillDetailRow

  return (
    <aside className="shift-admin__detail" aria-label="Chi tiết chứng chỉ operator">
      <h3>{detail.code}</h3>
      <p className="shift-admin__muted">
        {row?.operatorLabel ?? '-'} · {row?.skillLabel ?? '-'} · hết hạn {row?.expiryDate ?? '-'}
      </p>

      <label className="shift-admin__field">
        <span>Level</span>
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          {OPERATOR_SKILL_LEVEL_VALUES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label className="shift-admin__field">
        <span>Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {OPERATOR_SKILL_STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="shift-admin__btn"
        disabled={!row?.canUpdate || admin.updateOperatorSkillPending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() => admin.saveOperatorSkillEdit({ level, status })}
      >
        {admin.updateOperatorSkillPending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="shift-admin__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updateOperatorSkillError ? (
        <p className="shift-admin__error" role="alert">
          {admin.updateOperatorSkillError.code}: {admin.updateOperatorSkillError.message}
        </p>
      ) : null}
      {admin.updateOperatorSkillSuccess ? (
        <p className="shift-admin__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>Deactivate (suspend)</h4>
      <button
        type="button"
        className="shift-admin__btn shift-admin__btn--danger"
        disabled={!row?.canDeactivate}
        title={row?.deactivateDisabledReason ?? undefined}
        onClick={() => admin.setConfirmOperatorSkillDeactivate(true)}
      >
        Deactivate chứng chỉ
      </button>
      {!row?.canDeactivate ? (
        <p className="shift-admin__muted">
          Deactivate không khả dụng
          {row?.deactivateDisabledReason ? ` (${row.deactivateDisabledReason})` : ''}.
        </p>
      ) : null}
      <ConfirmDialog
        isOpen={admin.confirmOperatorSkillDeactivate}
        onClose={() => admin.setConfirmOperatorSkillDeactivate(false)}
        onConfirm={admin.deactivateOperatorSkill}
        title="Xác nhận deactivate"
        description={`Xác nhận deactivate ${detail.code}? Chứng chỉ sẽ chuyển sang SUSPENDED.`}
        isPending={admin.deactivateOperatorSkillState === 'pending'}
      />
      {admin.deactivateOperatorSkillError ? (
        <p className="shift-admin__error" role="alert">
          {admin.deactivateOperatorSkillError.code}: {admin.deactivateOperatorSkillError.message}
        </p>
      ) : null}
      {admin.deactivateOperatorSkillState === 'success' ? (
        <p className="shift-admin__banner" role="status">
          Đã deactivate chứng chỉ.
        </p>
      ) : null}
    </aside>
  )
}

export function ShiftSkillPage() {
  const admin = useShiftSkill()

  const shiftPagination = usePagination(admin.shiftRows, 10)
  const saPagination = usePagination(admin.assignmentRows, 10)
  const skillPagination = usePagination(admin.skillRows, 10)
  const osPagination = usePagination(admin.operatorSkillRows, 10)
  const trainingRecordPagination = usePagination(admin.trainingRecordRows, 10)

  const shiftColumns: ColumnDef<ShiftRow>[] = [
    {
      header: 'Mã ca',
      cell: (row) => (
        <button
          type="button"
          className="shift-admin__linkish"
          onClick={(e) => {
            e.stopPropagation()
            admin.selectShift(row.code)
          }}
        >
          {row.code}
        </button>
      ),
    },
    {
      header: 'Bắt đầu',
      cell: (row) => row.startTime,
    },
    {
      header: 'Kết thúc',
      cell: (row) => row.endTime,
    },
    {
      header: 'Qua đêm',
      cell: (row) => row.isOvernight,
    },
  ]

  const saColumns: ColumnDef<ShiftAssignmentRow>[] = [
    {
      header: 'Mã phân lịch',
      cell: (row) => (
        <button
          type="button"
          className="shift-admin__linkish"
          onClick={(e) => {
            e.stopPropagation()
            admin.selectAssignment(row.code)
          }}
        >
          {row.code}
        </button>
      ),
    },
    {
      header: 'Nhân viên vận hành',
      cell: (row) => row.operatorLabel,
    },
    {
      header: 'Ca',
      cell: (row) => row.shiftLabel,
    },
    {
      header: 'Khu công đoạn',
      cell: (row) => row.workCenterLabel,
    },
    {
      header: 'Ngày',
      cell: (row) => row.workDate,
    },
    {
      header: 'Vai trò',
      cell: (row) => row.roleOnLine,
    },
  ]

  const skillColumns: ColumnDef<SkillMasterRow>[] = [
    {
      header: 'Mã kỹ năng',
      cell: (row) => (
        <button
          type="button"
          className="shift-admin__linkish"
          onClick={(e) => {
            e.stopPropagation()
            admin.selectSkill(row.code)
          }}
        >
          {row.code}
        </button>
      ),
    },
    {
      header: 'Tên kỹ năng',
      cell: (row) => row.skillName,
    },
    {
      header: 'Nhóm',
      cell: (row) => row.skillCategory,
    },
    {
      header: 'Hiệu lực (tháng)',
      cell: (row) => row.validityMonths,
    },
    {
      header: 'Hoạt động',
      cell: (row) => (row.isActive ? 'Active' : 'Inactive'),
    },
  ]

  const osColumns: ColumnDef<OperatorSkillRow>[] = [
    {
      header: 'Mã chứng chỉ',
      cell: (row) => (
        <button
          type="button"
          className="shift-admin__linkish"
          onClick={(e) => {
            e.stopPropagation()
            admin.selectOperatorSkill(row.code)
          }}
        >
          {row.code}
        </button>
      ),
    },
    {
      header: 'Nhân viên',
      cell: (row) => row.operatorLabel,
    },
    {
      header: 'Kỹ năng',
      cell: (row) => row.skillLabel,
    },
    {
      header: 'Cấp độ',
      cell: (row) => row.level,
    },
    {
      header: 'Trạng thái',
      cell: (row) => row.status,
    },
    {
      header: 'Ngày hết hạn',
      cell: (row) => row.expiryDate,
    },
  ]

  const trainingRecordColumns: ColumnDef<TrainingRecordRow>[] = [
    {
      header: 'Mã đào tạo',
      cell: (row) => row.code,
    },
    {
      header: 'Nhân viên vận hành',
      cell: (row) => row.operatorLabel,
    },
    {
      header: 'Kỹ năng đào tạo',
      cell: (row) => row.skillLabel,
    },
    {
      header: 'Ngày',
      cell: (row) => row.trainingDate,
    },
    {
      header: 'Số giờ',
      cell: (row) => row.durationHours,
    },
    {
      header: 'Giảng viên hướng dẫn',
      cell: (row) => row.instructorLabel,
    },
    {
      header: 'Kết quả',
      cell: (row) => row.result,
    },
  ]

  return (
    <section className="shift-admin" aria-labelledby="shift-admin-title">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'MES' },
          { label: 'Ca & Kỹ năng' },
        ]}
        title="Quản lý Ca & Kỹ năng (Shift & Skill)"
        subtitle="Quản lý ca làm việc, phân lịch nhân viên, danh mục ma trận kỹ năng tay nghề và kết quả đào tạo nội bộ."
      />

      <div className="shift-admin__tabs" role="tablist" aria-label="Shift/Skill admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'shifts'}
          onClick={() => admin.setTab('shifts')}
        >
          Shifts
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'shift_assignments'}
          onClick={() => admin.setTab('shift_assignments')}
        >
          Shift Assignments
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'skills'}
          onClick={() => admin.setTab('skills')}
        >
          Skills
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'operator_skills'}
          onClick={() => admin.setTab('operator_skills')}
        >
          Operator Skills
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'training_records'}
          onClick={() => admin.setTab('training_records')}
        >
          Training Records
        </button>
      </div>

      {admin.tab === 'shifts' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'search',
                type: 'text',
                label: 'Tìm ca (code)',
                placeholder: 'SHIFT-…',
              },
            ]}
            values={{
              search: admin.shiftSearchInput,
            }}
            onChange={(name, value) => {
              if (name === 'search') {
                admin.setShiftSearchInput(value)
              }
            }}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyShiftSearch()
            }}
            onReset={() => {
              admin.setShiftSearchInput('')
              admin.applyShiftSearch()
            }}
            isResetActive={Boolean(admin.shiftSearchInput)}
            expands={
              <Button type="button" className="shift-admin__btn shrink-0" onClick={admin.openShiftCreate}>
                Tạo ca
              </Button>
            }
          />

          <Dialog
            isOpen={admin.showShiftCreate}
            onClose={admin.closeShiftCreate}
            title="Tạo ca mới"
            maxWidth="max-w-[50%]"
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!window.confirm('Xác nhận tạo ca làm việc này?')) return
                admin.createShift()
              }}
            >
              <p className="text-xs text-[var(--text-muted)]">
                Form luôn hiển thị — server enforce quyền tạo (MES09-003).
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Code</span>
                <Input
                  value={admin.shiftCreateForm.code}
                  onChange={(e) =>
                    admin.setShiftCreateForm({ ...admin.shiftCreateForm, code: e.target.value })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Giờ bắt đầu</span>
                <Input
                  type="time"
                  value={admin.shiftCreateForm.start_time}
                  onChange={(e) =>
                    admin.setShiftCreateForm({
                      ...admin.shiftCreateForm,
                      start_time: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Giờ kết thúc</span>
                <Input
                  type="time"
                  value={admin.shiftCreateForm.end_time}
                  onChange={(e) =>
                    admin.setShiftCreateForm({ ...admin.shiftCreateForm, end_time: e.target.value })
                  }
                  required
                />
              </label>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={admin.closeShiftCreate}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={admin.shiftCreateErrors.length > 0 || admin.createShiftPending}
                >
                  {admin.createShiftPending ? 'Đang tạo…' : 'Tạo'}
                </Button>
              </div>
              {admin.createShiftError ? (
                <p className="text-sm text-[var(--color-danger-text)] mt-2" role="alert">
                  {admin.createShiftError.code}: {admin.createShiftError.message}
                </p>
              ) : null}
            </form>
          </Dialog>

          {(() => {
            const banner = listStateMessage(admin.shiftListState, 'ca')
            return banner ? (
              <p className="shift-admin__state" role={admin.shiftListState === 'error' ? 'alert' : 'status'}>
                {banner}
                {admin.shiftListError ? ` (${admin.shiftListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.shiftListState === 'ready' ? (
            <div className="shift-admin__layout">
              <div className="shift-admin__table-wrap flex flex-col gap-4">
                <GenericDataTable
                  data={shiftPagination.paginatedItems}
                  columns={shiftColumns}
                  pagination={shiftPagination}
                  onRowClick={(row) => admin.selectShift(row.code)}
                  getRowClassName={(row) =>
                    row.code === admin.selectedShiftCode
                      ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]'
                      : ''
                  }
                />
                {admin.shiftHasMore ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="self-center"
                    onClick={admin.shiftLoadMore}
                  >
                    Tải thêm từ máy chủ
                  </Button>
                ) : null}
              </div>

              {admin.shiftDetailLoading ? (
                <div className="shift-admin__state">Đang tải chi tiết…</div>
              ) : admin.shiftDetail ? (
                <ShiftEditor key={admin.shiftDetail.code} detail={admin.shiftDetail} admin={admin} />
              ) : (
                <div className="shift-admin__state">Chọn ca để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'shift_assignments' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'search',
                type: 'text',
                label: 'Tìm phân ca (code / operator / work center)',
                placeholder: 'SA-…',
              },
            ]}
            values={{
              search: admin.saSearchInput,
            }}
            onChange={(name, value) => {
              if (name === 'search') {
                admin.setSaSearchInput(value)
              }
            }}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyAssignmentSearch()
            }}
            onReset={() => {
              admin.setSaSearchInput('')
              admin.applyAssignmentSearch()
            }}
            isResetActive={Boolean(admin.saSearchInput)}
            expands={
              <Button type="button" className="shift-admin__btn shrink-0" onClick={admin.openAssignmentCreate}>
                Tạo phân ca
              </Button>
            }
          />

          <Dialog
            isOpen={admin.showAssignmentCreate}
            onClose={admin.closeAssignmentCreate}
            title="Tạo phân ca mới"
            maxWidth="max-w-[50%]"
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!window.confirm('Xác nhận tạo phân ca này?')) return
                admin.createAssignment()
              }}
            >
              <p className="text-xs text-[var(--text-muted)]">
                Form luôn hiển thị — server enforce quyền tạo (MES09-008). Operator dùng user ID
                số (chưa có canonical lookup trả về id cho non-admin, xem BUILD-STATE notes).
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Code</span>
                <Input
                  value={admin.assignmentCreateForm.code}
                  onChange={(e) =>
                    admin.setAssignmentCreateForm({
                      ...admin.assignmentCreateForm,
                      code: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Ngày làm</span>
                <Input
                  type="date"
                  value={admin.assignmentCreateForm.work_date}
                  onChange={(e) =>
                    admin.setAssignmentCreateForm({
                      ...admin.assignmentCreateForm,
                      work_date: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Ca</span>
                <Select
                  value={admin.assignmentCreateForm.shift_id}
                  onChange={(e) =>
                    admin.setAssignmentCreateForm({
                      ...admin.assignmentCreateForm,
                      shift_id: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>Chọn ca</option>
                  {admin.shiftOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} ({s.start_time}–{s.end_time})
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Operator (user ID)</span>
                <Input
                  inputMode="numeric"
                  value={admin.assignmentCreateForm.operator_id || ''}
                  onChange={(e) =>
                    admin.setAssignmentCreateForm({
                      ...admin.assignmentCreateForm,
                      operator_id: Number(e.target.value) || 0,
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Work center (ID)</span>
                <Input
                  inputMode="numeric"
                  value={admin.assignmentCreateForm.work_center_id || ''}
                  onChange={(e) =>
                    admin.setAssignmentCreateForm({
                      ...admin.assignmentCreateForm,
                      work_center_id: Number(e.target.value) || 0,
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Vai trò</span>
                <Select
                  value={admin.assignmentCreateForm.role_on_line}
                  onChange={(e) =>
                    admin.setAssignmentCreateForm({
                      ...admin.assignmentCreateForm,
                      role_on_line: e.target.value,
                    })
                  }
                >
                  {ROLE_ON_LINE_VALUES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={admin.closeAssignmentCreate}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={admin.assignmentCreateErrors.length > 0 || admin.createAssignmentPending}
                >
                  {admin.createAssignmentPending ? 'Đang tạo…' : 'Tạo'}
                </Button>
              </div>
              {admin.createAssignmentError ? (
                <p className="text-sm text-[var(--color-danger-text)] mt-2" role="alert">
                  {admin.createAssignmentError.code}: {admin.createAssignmentError.message}
                </p>
              ) : null}
            </form>
          </Dialog>

          {(() => {
            const banner = listStateMessage(admin.assignmentListState, 'phân ca')
            return banner ? (
              <p
                className="shift-admin__state"
                role={admin.assignmentListState === 'error' ? 'alert' : 'status'}
              >
                {banner}
                {admin.assignmentListError ? ` (${admin.assignmentListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.assignmentListState === 'ready' ? (
            <div className="shift-admin__layout">
              <div className="shift-admin__table-wrap flex flex-col gap-4">
                <GenericDataTable
                  data={saPagination.paginatedItems}
                  columns={saColumns}
                  pagination={saPagination}
                  onRowClick={(row) => admin.selectAssignment(row.code)}
                  getRowClassName={(row) =>
                    row.code === admin.selectedAssignmentCode
                      ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]'
                      : ''
                  }
                />
                {admin.assignmentHasMore ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="self-center"
                    onClick={admin.assignmentLoadMore}
                  >
                    Tải thêm từ máy chủ
                  </Button>
                ) : null}
              </div>

              {admin.assignmentDetailLoading ? (
                <div className="shift-admin__state">Đang tải chi tiết…</div>
              ) : admin.assignmentDetail ? (
                <ShiftAssignmentEditor
                  key={admin.assignmentDetail.code}
                  detail={admin.assignmentDetail}
                  admin={admin}
                />
              ) : (
                <div className="shift-admin__state">Chọn phân ca để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'skills' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'search',
                type: 'text',
                label: 'Tìm kỹ năng (code / tên)',
                placeholder: 'SK-… / tên',
              },
            ]}
            values={{
              search: admin.skillSearchInput,
            }}
            onChange={(name, value) => {
              if (name === 'search') {
                admin.setSkillSearchInput(value)
              }
            }}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applySkillSearch()
            }}
            onReset={() => {
              admin.setSkillSearchInput('')
              admin.applySkillSearch()
            }}
            isResetActive={Boolean(admin.skillSearchInput)}
            expands={
              <Button type="button" className="shift-admin__btn shrink-0" onClick={admin.openSkillCreate}>
                Tạo kỹ năng
              </Button>
            }
          />

          <Dialog
            isOpen={admin.showSkillCreate}
            onClose={admin.closeSkillCreate}
            title="Tạo kỹ năng mới"
            maxWidth="max-w-[50%]"
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!window.confirm('Xác nhận tạo kỹ năng này?')) return
                admin.createSkill()
              }}
            >
              <p className="text-xs text-[var(--text-muted)]">
                Form luôn hiển thị — server enforce quyền tạo (MES09-013).
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Code</span>
                <Input
                  value={admin.skillCreateForm.code}
                  onChange={(e) =>
                    admin.setSkillCreateForm({ ...admin.skillCreateForm, code: e.target.value })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Tên kỹ năng</span>
                <Input
                  value={admin.skillCreateForm.skill_name}
                  onChange={(e) =>
                    admin.setSkillCreateForm({ ...admin.skillCreateForm, skill_name: e.target.value })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Nhóm</span>
                <Select
                  value={admin.skillCreateForm.skill_category}
                  onChange={(e) =>
                    admin.setSkillCreateForm({
                      ...admin.skillCreateForm,
                      skill_category: e.target.value,
                    })
                  }
                >
                  {SKILL_CATEGORY_VALUES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Hiệu lực (tháng, optional)</span>
                <Input
                  inputMode="numeric"
                  value={admin.skillCreateForm.validity_months ?? ''}
                  onChange={(e) =>
                    admin.setSkillCreateForm({
                      ...admin.skillCreateForm,
                      validity_months: e.target.value.trim() ? Number(e.target.value) : null,
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Đơn vị cấp</span>
                <Input
                  value={admin.skillCreateForm.issuer}
                  onChange={(e) =>
                    admin.setSkillCreateForm({ ...admin.skillCreateForm, issuer: e.target.value })
                  }
                  required
                />
              </label>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={admin.closeSkillCreate}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={admin.skillCreateErrors.length > 0 || admin.createSkillPending}
                >
                  {admin.createSkillPending ? 'Đang tạo…' : 'Tạo'}
                </Button>
              </div>
              {admin.createSkillError ? (
                <p className="text-sm text-[var(--color-danger-text)] mt-2" role="alert">
                  {admin.createSkillError.code}: {admin.createSkillError.message}
                </p>
              ) : null}
            </form>
          </Dialog>

          {(() => {
            const banner = listStateMessage(admin.skillListState, 'kỹ năng')
            return banner ? (
              <p className="shift-admin__state" role={admin.skillListState === 'error' ? 'alert' : 'status'}>
                {banner}
                {admin.skillListError ? ` (${admin.skillListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.skillListState === 'ready' ? (
            <div className="shift-admin__layout">
              <div className="shift-admin__table-wrap flex flex-col gap-4">
                <GenericDataTable
                  data={skillPagination.paginatedItems}
                  columns={skillColumns}
                  pagination={skillPagination}
                  onRowClick={(row) => admin.selectSkill(row.code)}
                  getRowClassName={(row) =>
                    row.code === admin.selectedSkillCode
                      ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]'
                      : ''
                  }
                />
                {admin.skillHasMore ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="self-center"
                    onClick={admin.skillLoadMore}
                  >
                    Tải thêm từ máy chủ
                  </Button>
                ) : null}
              </div>

              {admin.skillDetailLoading ? (
                <div className="shift-admin__state">Đang tải chi tiết…</div>
              ) : admin.skillDetail ? (
                <SkillEditor key={admin.skillDetail.code} detail={admin.skillDetail} admin={admin} />
              ) : (
                <div className="shift-admin__state">Chọn kỹ năng để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'operator_skills' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'search',
                type: 'text',
                label: 'Tìm chứng chỉ (code / operator / skill)',
                placeholder: 'OS-…',
              },
            ]}
            values={{
              search: admin.osSearchInput,
            }}
            onChange={(name, value) => {
              if (name === 'search') {
                admin.setOsSearchInput(value)
              }
            }}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyOperatorSkillSearch()
            }}
            onReset={() => {
              admin.setOsSearchInput('')
              admin.applyOperatorSkillSearch()
            }}
            isResetActive={Boolean(admin.osSearchInput)}
            expands={
              <Button
                type="button"
                className="shift-admin__btn shrink-0"
                onClick={admin.openOperatorSkillCreate}
              >
                Tạo chứng chỉ
              </Button>
            }
          />

          <Dialog
            isOpen={admin.showOperatorSkillCreate}
            onClose={admin.closeOperatorSkillCreate}
            title="Tạo chứng chỉ operator mới"
            maxWidth="max-w-[50%]"
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!window.confirm('Xác nhận tạo chứng chỉ operator này?')) return
                admin.createOperatorSkill()
              }}
            >
              <p className="text-xs text-[var(--text-muted)]">
                Form luôn hiển thị — server enforce quyền tạo (MES09-018). Operator dùng user ID
                số (chưa có canonical lookup trả về id cho non-admin, xem BUILD-STATE notes).
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Code</span>
                <Input
                  value={admin.operatorSkillCreateForm.code}
                  onChange={(e) =>
                    admin.setOperatorSkillCreateForm({
                      ...admin.operatorSkillCreateForm,
                      code: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Operator (user ID)</span>
                <Input
                  inputMode="numeric"
                  value={admin.operatorSkillCreateForm.operator_id || ''}
                  onChange={(e) =>
                    admin.setOperatorSkillCreateForm({
                      ...admin.operatorSkillCreateForm,
                      operator_id: Number(e.target.value) || 0,
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Skill</span>
                <Select
                  value={admin.operatorSkillCreateForm.skill_id}
                  onChange={(e) =>
                    admin.setOperatorSkillCreateForm({
                      ...admin.operatorSkillCreateForm,
                      skill_id: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>Chọn kỹ năng</option>
                  {admin.skillOptions.map((sk) => (
                    <option key={sk.id} value={sk.id}>
                      {sk.code} — {sk.skill_name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Level</span>
                <Select
                  value={admin.operatorSkillCreateForm.level}
                  onChange={(e) =>
                    admin.setOperatorSkillCreateForm({
                      ...admin.operatorSkillCreateForm,
                      level: e.target.value,
                    })
                  }
                >
                  {OPERATOR_SKILL_LEVEL_VALUES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Ngày cấp</span>
                <Input
                  type="date"
                  value={admin.operatorSkillCreateForm.issued_date}
                  onChange={(e) =>
                    admin.setOperatorSkillCreateForm({
                      ...admin.operatorSkillCreateForm,
                      issued_date: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Status</span>
                <Select
                  value={admin.operatorSkillCreateForm.status}
                  onChange={(e) =>
                    admin.setOperatorSkillCreateForm({
                      ...admin.operatorSkillCreateForm,
                      status: e.target.value,
                    })
                  }
                >
                  {OPERATOR_SKILL_STATUS_VALUES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={admin.closeOperatorSkillCreate}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={
                    admin.operatorSkillCreateErrors.length > 0 || admin.createOperatorSkillPending
                  }
                >
                  {admin.createOperatorSkillPending ? 'Đang tạo…' : 'Tạo'}
                </Button>
              </div>
              {admin.createOperatorSkillError ? (
                <p className="text-sm text-[var(--color-danger-text)] mt-2" role="alert">
                  {admin.createOperatorSkillError.code}: {admin.createOperatorSkillError.message}
                </p>
              ) : null}
            </form>
          </Dialog>

          {(() => {
            const banner = listStateMessage(admin.operatorSkillListState, 'chứng chỉ operator')
            return banner ? (
              <p
                className="shift-admin__state"
                role={admin.operatorSkillListState === 'error' ? 'alert' : 'status'}
              >
                {banner}
                {admin.operatorSkillListError ? ` (${admin.operatorSkillListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.operatorSkillListState === 'ready' ? (
            <div className="shift-admin__layout">
              <div className="shift-admin__table-wrap flex flex-col gap-4">
                <GenericDataTable
                  data={osPagination.paginatedItems}
                  columns={osColumns}
                  pagination={osPagination}
                  onRowClick={(row) => admin.selectOperatorSkill(row.code)}
                  getRowClassName={(row) =>
                    row.code === admin.selectedOperatorSkillCode
                      ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]'
                      : ''
                  }
                />
                {admin.operatorSkillHasMore ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="self-center"
                    onClick={admin.operatorSkillLoadMore}
                  >
                    Tải thêm từ máy chủ
                  </Button>
                ) : null}
              </div>

              {admin.operatorSkillDetailLoading ? (
                <div className="shift-admin__state">Đang tải chi tiết…</div>
              ) : admin.operatorSkillDetail ? (
                <OperatorSkillEditor
                  key={admin.operatorSkillDetail.code}
                  detail={admin.operatorSkillDetail}
                  admin={admin}
                />
              ) : (
                <div className="shift-admin__state">Chọn chứng chỉ để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'training_records' ? (
        <>
          <FilterBar
            fields={[
              {
                name: 'search',
                type: 'text',
                label: 'Tìm training record (code / operator / skill)',
                placeholder: 'TR-…',
              },
            ]}
            values={{
              search: admin.trSearchInput,
            }}
            onChange={(name, value) => {
              if (name === 'search') {
                admin.setTrSearchInput(value)
              }
            }}
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyTrainingRecordSearch()
            }}
            onReset={() => {
              admin.setTrSearchInput('')
              admin.applyTrainingRecordSearch()
            }}
            isResetActive={Boolean(admin.trSearchInput)}
            expands={
              <Button
                type="button"
                className="shift-admin__btn shrink-0"
                onClick={admin.openTrainingRecordCreate}
              >
                Tạo training record
              </Button>
            }
          />

          <Dialog
            isOpen={admin.showTrainingRecordCreate}
            onClose={admin.closeTrainingRecordCreate}
            title="Tạo training record mới"
            maxWidth="max-w-[50%]"
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!window.confirm('Xác nhận tạo training record này?')) return
                admin.createTrainingRecord()
              }}
            >
              <p className="text-xs text-[var(--text-muted)]">
                Form luôn hiển thị — server enforce quyền tạo (MES09-023). Kết quả PASS tự động
                tạo operator_skill TRAINEE. Không có update/deactivate cho entity này theo contract.
                Operator/Instructor dùng user ID số (xem BUILD-STATE notes).
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Code</span>
                <Input
                  value={admin.trainingRecordCreateForm.code}
                  onChange={(e) =>
                    admin.setTrainingRecordCreateForm({
                      ...admin.trainingRecordCreateForm,
                      code: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Operator (user ID)</span>
                <Input
                  inputMode="numeric"
                  value={admin.trainingRecordCreateForm.operator_id || ''}
                  onChange={(e) =>
                    admin.setTrainingRecordCreateForm({
                      ...admin.trainingRecordCreateForm,
                      operator_id: Number(e.target.value) || 0,
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Skill</span>
                <Select
                  value={admin.trainingRecordCreateForm.skill_id}
                  onChange={(e) =>
                    admin.setTrainingRecordCreateForm({
                      ...admin.trainingRecordCreateForm,
                      skill_id: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>Chọn kỹ năng</option>
                  {admin.skillOptions.map((sk) => (
                    <option key={sk.id} value={sk.id}>
                      {sk.code} — {sk.skill_name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Ngày training</span>
                <Input
                  type="date"
                  value={admin.trainingRecordCreateForm.training_date}
                  onChange={(e) =>
                    admin.setTrainingRecordCreateForm({
                      ...admin.trainingRecordCreateForm,
                      training_date: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Số giờ</span>
                <Input
                  inputMode="decimal"
                  value={admin.trainingRecordCreateForm.duration_hours || ''}
                  onChange={(e) =>
                    admin.setTrainingRecordCreateForm({
                      ...admin.trainingRecordCreateForm,
                      duration_hours: Number(e.target.value) || 0,
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Instructor (user ID)</span>
                <Input
                  inputMode="numeric"
                  value={admin.trainingRecordCreateForm.instructor_id || ''}
                  onChange={(e) =>
                    admin.setTrainingRecordCreateForm({
                      ...admin.trainingRecordCreateForm,
                      instructor_id: Number(e.target.value) || 0,
                    })
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Kết quả</span>
                <Select
                  value={admin.trainingRecordCreateForm.result}
                  onChange={(e) =>
                    admin.setTrainingRecordCreateForm({
                      ...admin.trainingRecordCreateForm,
                      result: e.target.value,
                    })
                  }
                >
                  {TRAINING_RESULT_VALUES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={admin.closeTrainingRecordCreate}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={
                    admin.trainingRecordCreateErrors.length > 0 || admin.createTrainingRecordPending
                  }
                >
                  {admin.createTrainingRecordPending ? 'Đang tạo…' : 'Tạo'}
                </Button>
              </div>
              {admin.createTrainingRecordError ? (
                <p className="text-sm text-[var(--color-danger-text)] mt-2" role="alert">
                  {admin.createTrainingRecordError.code}: {admin.createTrainingRecordError.message}
                </p>
              ) : null}
            </form>
          </Dialog>

          {(() => {
            const banner = listStateMessage(admin.trainingRecordListState, 'training record')
            return banner ? (
              <p
                className="shift-admin__state"
                role={admin.trainingRecordListState === 'error' ? 'alert' : 'status'}
              >
                {banner}
                {admin.trainingRecordListError ? ` (${admin.trainingRecordListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.trainingRecordListState === 'ready' ? (
            <div className="shift-admin__table-wrap flex flex-col gap-4">
              <GenericDataTable
                data={trainingRecordPagination.paginatedItems}
                columns={trainingRecordColumns}
                pagination={trainingRecordPagination}
              />
              {admin.trainingRecordHasMore ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="self-center"
                  onClick={admin.trainingRecordLoadMore}
                >
                  Tải thêm từ máy chủ
                </Button>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
