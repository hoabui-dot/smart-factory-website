import { useState } from 'react'
import { Link } from 'react-router'

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
} from '../types/shiftSkill'

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
      {admin.confirmShiftDeactivate ? (
        <div className="shift-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
          <p>
            Xác nhận deactivate <strong>{detail.code}</strong>? Ca sẽ bị xoá (chỉ khi không còn
            phân ca gắn).
          </p>
          <div className="shift-admin__actions">
            <button
              type="button"
              className="shift-admin__btn shift-admin__btn--danger"
              disabled={admin.deactivateShiftState === 'pending'}
              onClick={admin.deactivateShift}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmShiftDeactivate(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
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
      {admin.confirmAssignmentDeactivate ? (
        <div className="shift-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
          <p>
            Xác nhận deactivate <strong>{detail.code}</strong>?
          </p>
          <div className="shift-admin__actions">
            <button
              type="button"
              className="shift-admin__btn shift-admin__btn--danger"
              disabled={admin.deactivateAssignmentState === 'pending'}
              onClick={admin.deactivateAssignment}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmAssignmentDeactivate(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
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
      {admin.confirmSkillDeactivate ? (
        <div className="shift-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
          <p>
            Xác nhận deactivate <strong>{detail.code}</strong>?
          </p>
          <div className="shift-admin__actions">
            <button
              type="button"
              className="shift-admin__btn shift-admin__btn--danger"
              disabled={admin.deactivateSkillState === 'pending'}
              onClick={admin.deactivateSkill}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmSkillDeactivate(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
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
      {admin.confirmOperatorSkillDeactivate ? (
        <div className="shift-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
          <p>
            Xác nhận deactivate <strong>{detail.code}</strong>? Chứng chỉ sẽ chuyển sang SUSPENDED.
          </p>
          <div className="shift-admin__actions">
            <button
              type="button"
              className="shift-admin__btn shift-admin__btn--danger"
              disabled={admin.deactivateOperatorSkillState === 'pending'}
              onClick={admin.deactivateOperatorSkill}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmOperatorSkillDeactivate(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
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

  return (
    <section className="shift-admin" aria-labelledby="shift-admin-title">
      <header className="shift-admin__header">
        <div>
          <p className="shift-admin__eyebrow">WEB-MES-09-SHIFT-SKILL · `/web/mes/shifts`</p>
          <h2 id="shift-admin-title">Lao động &amp; Ca làm việc — Shift / Skill / Training</h2>
          <p className="shift-admin__lead">
            Quản lý ca, phân ca, skill master, chứng chỉ operator và training record
            (MES09-001..023). Mutation gated bởi server <code>allowed_actions</code>.
          </p>
        </div>
        <div className="shift-admin__actions">
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

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
          <form
            className="shift-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyShiftSearch()
            }}
          >
            <label className="shift-admin__field">
              <span>Tìm ca (code)</span>
              <input
                value={admin.shiftSearchInput}
                onChange={(e) => admin.setShiftSearchInput(e.target.value)}
                placeholder="SHIFT-…"
              />
            </label>
            <button type="submit" className="shift-admin__btn">
              Lọc
            </button>
            <button type="button" className="shift-admin__btn" onClick={admin.openShiftCreate}>
              Tạo ca
            </button>
          </form>

          {admin.showShiftCreate ? (
            <div className="shift-admin__create">
              <h3>Tạo ca mới</h3>
              <p className="shift-admin__muted">
                Form luôn hiển thị — server enforce quyền tạo (MES09-003).
              </p>
              <label className="shift-admin__field">
                <span>Code</span>
                <input
                  value={admin.shiftCreateForm.code}
                  onChange={(e) =>
                    admin.setShiftCreateForm({ ...admin.shiftCreateForm, code: e.target.value })
                  }
                />
              </label>
              <label className="shift-admin__field">
                <span>Giờ bắt đầu</span>
                <input
                  type="time"
                  value={admin.shiftCreateForm.start_time}
                  onChange={(e) =>
                    admin.setShiftCreateForm({
                      ...admin.shiftCreateForm,
                      start_time: e.target.value,
                    })
                  }
                />
              </label>
              <label className="shift-admin__field">
                <span>Giờ kết thúc</span>
                <input
                  type="time"
                  value={admin.shiftCreateForm.end_time}
                  onChange={(e) =>
                    admin.setShiftCreateForm({ ...admin.shiftCreateForm, end_time: e.target.value })
                  }
                />
              </label>
              <div className="shift-admin__actions">
                <button
                  type="button"
                  className="shift-admin__btn"
                  disabled={admin.shiftCreateErrors.length > 0 || admin.createShiftPending}
                  onClick={() => admin.createShift()}
                >
                  {admin.createShiftPending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closeShiftCreate}>
                  Hủy
                </button>
              </div>
              {admin.createShiftError ? (
                <p className="shift-admin__error" role="alert">
                  {admin.createShiftError.code}: {admin.createShiftError.message}
                </p>
              ) : null}
            </div>
          ) : null}

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
              <div className="shift-admin__table-wrap">
                <table className="shift-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Bắt đầu</th>
                      <th>Kết thúc</th>
                      <th>Qua đêm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.shiftRows.map((row) => (
                      <tr
                        key={row.code}
                        className={row.code === admin.selectedShiftCode ? 'shift-admin__row--active' : ''}
                      >
                        <td>
                          <button
                            type="button"
                            className="shift-admin__linkish"
                            onClick={() => admin.selectShift(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.startTime}</td>
                        <td>{row.endTime}</td>
                        <td>{row.isOvernight ? 'Có' : 'Không'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.shiftHasMore ? (
                  <button type="button" className="shift-admin__more" onClick={admin.shiftLoadMore}>
                    Tải thêm
                  </button>
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
          <form
            className="shift-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyAssignmentSearch()
            }}
          >
            <label className="shift-admin__field">
              <span>Tìm phân ca (code / operator / work center)</span>
              <input
                value={admin.saSearchInput}
                onChange={(e) => admin.setSaSearchInput(e.target.value)}
                placeholder="SA-…"
              />
            </label>
            <button type="submit" className="shift-admin__btn">
              Lọc
            </button>
            <button type="button" className="shift-admin__btn" onClick={admin.openAssignmentCreate}>
              Tạo phân ca
            </button>
          </form>

          {admin.showAssignmentCreate ? (
            <div className="shift-admin__create">
              <h3>Tạo phân ca mới</h3>
              <p className="shift-admin__muted">
                Form luôn hiển thị — server enforce quyền tạo (MES09-008). Operator dùng user ID
                số (chưa có canonical lookup trả về id cho non-admin, xem BUILD-STATE notes).
              </p>
              <label className="shift-admin__field">
                <span>Code</span>
                <input
                  value={admin.assignmentCreateForm.code}
                  onChange={(e) =>
                    admin.setAssignmentCreateForm({
                      ...admin.assignmentCreateForm,
                      code: e.target.value,
                    })
                  }
                />
              </label>
              <label className="shift-admin__field">
                <span>Ngày làm</span>
                <input
                  type="date"
                  value={admin.assignmentCreateForm.work_date}
                  onChange={(e) =>
                    admin.setAssignmentCreateForm({
                      ...admin.assignmentCreateForm,
                      work_date: e.target.value,
                    })
                  }
                />
              </label>
              <label className="shift-admin__field">
                <span>Ca</span>
                <select
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
                </select>
              </label>
              <label className="shift-admin__field">
                <span>Operator (user ID)</span>
                <input
                  inputMode="numeric"
                  value={admin.assignmentCreateForm.operator_id || ''}
                  onChange={(e) =>
                    admin.setAssignmentCreateForm({
                      ...admin.assignmentCreateForm,
                      operator_id: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="shift-admin__field">
                <span>Work center (ID)</span>
                <input
                  inputMode="numeric"
                  value={admin.assignmentCreateForm.work_center_id || ''}
                  onChange={(e) =>
                    admin.setAssignmentCreateForm({
                      ...admin.assignmentCreateForm,
                      work_center_id: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="shift-admin__field">
                <span>Vai trò</span>
                <select
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
                </select>
              </label>
              <div className="shift-admin__actions">
                <button
                  type="button"
                  className="shift-admin__btn"
                  disabled={admin.assignmentCreateErrors.length > 0 || admin.createAssignmentPending}
                  onClick={() => admin.createAssignment()}
                >
                  {admin.createAssignmentPending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closeAssignmentCreate}>
                  Hủy
                </button>
              </div>
              {admin.createAssignmentError ? (
                <p className="shift-admin__error" role="alert">
                  {admin.createAssignmentError.code}: {admin.createAssignmentError.message}
                </p>
              ) : null}
            </div>
          ) : null}

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
              <div className="shift-admin__table-wrap">
                <table className="shift-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Ngày</th>
                      <th>Ca</th>
                      <th>Operator</th>
                      <th>Work center</th>
                      <th>Vai trò</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.assignmentRows.map((row) => (
                      <tr
                        key={row.code}
                        className={
                          row.code === admin.selectedAssignmentCode ? 'shift-admin__row--active' : ''
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="shift-admin__linkish"
                            onClick={() => admin.selectAssignment(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.workDate}</td>
                        <td>{row.shiftLabel}</td>
                        <td>{row.operatorLabel}</td>
                        <td>{row.workCenterLabel}</td>
                        <td>{row.roleOnLine}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.assignmentHasMore ? (
                  <button type="button" className="shift-admin__more" onClick={admin.assignmentLoadMore}>
                    Tải thêm
                  </button>
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
          <form
            className="shift-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applySkillSearch()
            }}
          >
            <label className="shift-admin__field">
              <span>Tìm kỹ năng (code / tên)</span>
              <input
                value={admin.skillSearchInput}
                onChange={(e) => admin.setSkillSearchInput(e.target.value)}
                placeholder="SK-… / tên"
              />
            </label>
            <button type="submit" className="shift-admin__btn">
              Lọc
            </button>
            <button type="button" className="shift-admin__btn" onClick={admin.openSkillCreate}>
              Tạo kỹ năng
            </button>
          </form>

          {admin.showSkillCreate ? (
            <div className="shift-admin__create">
              <h3>Tạo kỹ năng mới</h3>
              <p className="shift-admin__muted">
                Form luôn hiển thị — server enforce quyền tạo (MES09-013).
              </p>
              <label className="shift-admin__field">
                <span>Code</span>
                <input
                  value={admin.skillCreateForm.code}
                  onChange={(e) =>
                    admin.setSkillCreateForm({ ...admin.skillCreateForm, code: e.target.value })
                  }
                />
              </label>
              <label className="shift-admin__field">
                <span>Tên kỹ năng</span>
                <input
                  value={admin.skillCreateForm.skill_name}
                  onChange={(e) =>
                    admin.setSkillCreateForm({ ...admin.skillCreateForm, skill_name: e.target.value })
                  }
                />
              </label>
              <label className="shift-admin__field">
                <span>Nhóm</span>
                <select
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
                </select>
              </label>
              <label className="shift-admin__field">
                <span>Hiệu lực (tháng, optional)</span>
                <input
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
              <label className="shift-admin__field">
                <span>Đơn vị cấp</span>
                <input
                  value={admin.skillCreateForm.issuer}
                  onChange={(e) =>
                    admin.setSkillCreateForm({ ...admin.skillCreateForm, issuer: e.target.value })
                  }
                />
              </label>
              <div className="shift-admin__actions">
                <button
                  type="button"
                  className="shift-admin__btn"
                  disabled={admin.skillCreateErrors.length > 0 || admin.createSkillPending}
                  onClick={() => admin.createSkill()}
                >
                  {admin.createSkillPending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closeSkillCreate}>
                  Hủy
                </button>
              </div>
              {admin.createSkillError ? (
                <p className="shift-admin__error" role="alert">
                  {admin.createSkillError.code}: {admin.createSkillError.message}
                </p>
              ) : null}
            </div>
          ) : null}

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
              <div className="shift-admin__table-wrap">
                <table className="shift-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Tên</th>
                      <th>Nhóm</th>
                      <th>Hiệu lực (tháng)</th>
                      <th>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.skillRows.map((row) => (
                      <tr
                        key={row.code}
                        className={row.code === admin.selectedSkillCode ? 'shift-admin__row--active' : ''}
                      >
                        <td>
                          <button
                            type="button"
                            className="shift-admin__linkish"
                            onClick={() => admin.selectSkill(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.skillName}</td>
                        <td>{row.skillCategory}</td>
                        <td>{row.validityMonths}</td>
                        <td>{row.isActive ? 'Active' : 'Inactive'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.skillHasMore ? (
                  <button type="button" className="shift-admin__more" onClick={admin.skillLoadMore}>
                    Tải thêm
                  </button>
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
          <form
            className="shift-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyOperatorSkillSearch()
            }}
          >
            <label className="shift-admin__field">
              <span>Tìm chứng chỉ (code / operator / skill)</span>
              <input
                value={admin.osSearchInput}
                onChange={(e) => admin.setOsSearchInput(e.target.value)}
                placeholder="OS-…"
              />
            </label>
            <button type="submit" className="shift-admin__btn">
              Lọc
            </button>
            <button
              type="button"
              className="shift-admin__btn"
              onClick={admin.openOperatorSkillCreate}
            >
              Tạo chứng chỉ
            </button>
          </form>

          {admin.showOperatorSkillCreate ? (
            <div className="shift-admin__create">
              <h3>Tạo chứng chỉ operator mới</h3>
              <p className="shift-admin__muted">
                Form luôn hiển thị — server enforce quyền tạo (MES09-018). Operator dùng user ID
                số (chưa có canonical lookup trả về id cho non-admin, xem BUILD-STATE notes).
              </p>
              <label className="shift-admin__field">
                <span>Code</span>
                <input
                  value={admin.operatorSkillCreateForm.code}
                  onChange={(e) =>
                    admin.setOperatorSkillCreateForm({
                      ...admin.operatorSkillCreateForm,
                      code: e.target.value,
                    })
                  }
                />
              </label>
              <label className="shift-admin__field">
                <span>Operator (user ID)</span>
                <input
                  inputMode="numeric"
                  value={admin.operatorSkillCreateForm.operator_id || ''}
                  onChange={(e) =>
                    admin.setOperatorSkillCreateForm({
                      ...admin.operatorSkillCreateForm,
                      operator_id: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="shift-admin__field">
                <span>Skill</span>
                <select
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
                </select>
              </label>
              <label className="shift-admin__field">
                <span>Level</span>
                <select
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
                </select>
              </label>
              <label className="shift-admin__field">
                <span>Ngày cấp</span>
                <input
                  type="date"
                  value={admin.operatorSkillCreateForm.issued_date}
                  onChange={(e) =>
                    admin.setOperatorSkillCreateForm({
                      ...admin.operatorSkillCreateForm,
                      issued_date: e.target.value,
                    })
                  }
                />
              </label>
              <label className="shift-admin__field">
                <span>Status</span>
                <select
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
                </select>
              </label>
              <div className="shift-admin__actions">
                <button
                  type="button"
                  className="shift-admin__btn"
                  disabled={
                    admin.operatorSkillCreateErrors.length > 0 || admin.createOperatorSkillPending
                  }
                  onClick={() => admin.createOperatorSkill()}
                >
                  {admin.createOperatorSkillPending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closeOperatorSkillCreate}>
                  Hủy
                </button>
              </div>
              {admin.createOperatorSkillError ? (
                <p className="shift-admin__error" role="alert">
                  {admin.createOperatorSkillError.code}: {admin.createOperatorSkillError.message}
                </p>
              ) : null}
            </div>
          ) : null}

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
              <div className="shift-admin__table-wrap">
                <table className="shift-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Operator</th>
                      <th>Skill</th>
                      <th>Level</th>
                      <th>Hết hạn</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.operatorSkillRows.map((row) => (
                      <tr
                        key={row.code}
                        className={
                          row.code === admin.selectedOperatorSkillCode ? 'shift-admin__row--active' : ''
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="shift-admin__linkish"
                            onClick={() => admin.selectOperatorSkill(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.operatorLabel}</td>
                        <td>{row.skillLabel}</td>
                        <td>{row.level}</td>
                        <td>{row.expiryDate}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.operatorSkillHasMore ? (
                  <button
                    type="button"
                    className="shift-admin__more"
                    onClick={admin.operatorSkillLoadMore}
                  >
                    Tải thêm
                  </button>
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
          <form
            className="shift-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyTrainingRecordSearch()
            }}
          >
            <label className="shift-admin__field">
              <span>Tìm training record (code / operator / skill)</span>
              <input
                value={admin.trSearchInput}
                onChange={(e) => admin.setTrSearchInput(e.target.value)}
                placeholder="TR-…"
              />
            </label>
            <button type="submit" className="shift-admin__btn">
              Lọc
            </button>
            <button
              type="button"
              className="shift-admin__btn"
              onClick={admin.openTrainingRecordCreate}
            >
              Tạo training record
            </button>
          </form>

          {admin.showTrainingRecordCreate ? (
            <div className="shift-admin__create">
              <h3>Tạo training record mới</h3>
              <p className="shift-admin__muted">
                Form luôn hiển thị — server enforce quyền tạo (MES09-023). Kết quả PASS tự động
                tạo operator_skill TRAINEE. Không có update/deactivate cho entity này theo contract.
                Operator/Instructor dùng user ID số (xem BUILD-STATE notes).
              </p>
              <label className="shift-admin__field">
                <span>Code</span>
                <input
                  value={admin.trainingRecordCreateForm.code}
                  onChange={(e) =>
                    admin.setTrainingRecordCreateForm({
                      ...admin.trainingRecordCreateForm,
                      code: e.target.value,
                    })
                  }
                />
              </label>
              <label className="shift-admin__field">
                <span>Operator (user ID)</span>
                <input
                  inputMode="numeric"
                  value={admin.trainingRecordCreateForm.operator_id || ''}
                  onChange={(e) =>
                    admin.setTrainingRecordCreateForm({
                      ...admin.trainingRecordCreateForm,
                      operator_id: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="shift-admin__field">
                <span>Skill</span>
                <select
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
                </select>
              </label>
              <label className="shift-admin__field">
                <span>Ngày training</span>
                <input
                  type="date"
                  value={admin.trainingRecordCreateForm.training_date}
                  onChange={(e) =>
                    admin.setTrainingRecordCreateForm({
                      ...admin.trainingRecordCreateForm,
                      training_date: e.target.value,
                    })
                  }
                />
              </label>
              <label className="shift-admin__field">
                <span>Số giờ</span>
                <input
                  inputMode="decimal"
                  value={admin.trainingRecordCreateForm.duration_hours || ''}
                  onChange={(e) =>
                    admin.setTrainingRecordCreateForm({
                      ...admin.trainingRecordCreateForm,
                      duration_hours: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="shift-admin__field">
                <span>Instructor (user ID)</span>
                <input
                  inputMode="numeric"
                  value={admin.trainingRecordCreateForm.instructor_id || ''}
                  onChange={(e) =>
                    admin.setTrainingRecordCreateForm({
                      ...admin.trainingRecordCreateForm,
                      instructor_id: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="shift-admin__field">
                <span>Kết quả</span>
                <select
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
                </select>
              </label>
              <div className="shift-admin__actions">
                <button
                  type="button"
                  className="shift-admin__btn"
                  disabled={
                    admin.trainingRecordCreateErrors.length > 0 || admin.createTrainingRecordPending
                  }
                  onClick={() => admin.createTrainingRecord()}
                >
                  {admin.createTrainingRecordPending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closeTrainingRecordCreate}>
                  Hủy
                </button>
              </div>
              {admin.createTrainingRecordError ? (
                <p className="shift-admin__error" role="alert">
                  {admin.createTrainingRecordError.code}: {admin.createTrainingRecordError.message}
                </p>
              ) : null}
            </div>
          ) : null}

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
            <div className="shift-admin__table-wrap">
              <table className="shift-admin__table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Operator</th>
                    <th>Skill</th>
                    <th>Ngày</th>
                    <th>Số giờ</th>
                    <th>Instructor</th>
                    <th>Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {admin.trainingRecordRows.map((row) => (
                    <tr key={row.code}>
                      <td>{row.code}</td>
                      <td>{row.operatorLabel}</td>
                      <td>{row.skillLabel}</td>
                      <td>{row.trainingDate}</td>
                      <td>{row.durationHours}</td>
                      <td>{row.instructorLabel}</td>
                      <td>{row.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {admin.trainingRecordHasMore ? (
                <button
                  type="button"
                  className="shift-admin__more"
                  onClick={admin.trainingRecordLoadMore}
                >
                  Tải thêm
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
