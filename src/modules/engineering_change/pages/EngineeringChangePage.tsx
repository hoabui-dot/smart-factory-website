import { useState } from 'react'
import { Link } from 'react-router'

import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Dialog } from '@/shared/components/ui/Dialog'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { Button } from '@/shared/components/ui/Button'
import { Input, Select, Textarea } from '@/shared/components/ui/Input'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { useEngineeringChange } from '../hooks/useEngineeringChange'
import type { ChangeRequestRow } from '../types/changeRequest'
import { usePagination } from '@/shared/lib/usePagination'
import { GenericDataTable, ColumnDef } from '@/shared/components/ui/DataTable'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/Table'

import './EngineeringChangePage.css'

function msg(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải…'
    case 'empty':
      return 'Chưa có change request.'
    case 'no-result':
      return 'Không có kết quả khớp.'
    case 'permission-denied':
      return 'Bạn không có quyền xem.'
    case 'error':
      return 'Không tải được dữ liệu.'
    default:
      return ''
  }
}

export function EngineeringChangePage() {
  const e = useEngineeringChange()
  const [showCreate, setShowCreate] = useState(false)
  const pagination = usePagination(e.rows, 10)

  const columns: ColumnDef<ChangeRequestRow>[] = [
    {
      header: 'Mã yêu cầu',
      cell: (row) => (
        <button
          type="button"
          className="ecr-admin__linkish"
          onClick={(ev) => {
            ev.stopPropagation()
            e.select(row.code)
          }}
        >
          {row.code}
        </button>
      ),
    },
    {
      header: 'Loại thay đổi',
      cell: (row) => row.changeType,
    },
    {
      header: 'Vật tư ảnh hưởng',
      cell: (row) => row.itemLabel,
    },
    {
      header: 'Trạng thái',
      cell: (row) => row.status,
    },
  ]

  const banner = msg(e.listState)

  return (
    <section className="ecr-admin" aria-labelledby="ecr-title">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'MES' },
          { label: 'ECO/ECR' },
        ]}
        title="Yêu cầu thay đổi kỹ thuật (Engineering Change)"
        subtitle="Quản lý vòng đời thay đổi thiết kế/quy trình (ECR/ECN), theo dõi phê duyệt thiết kế và đánh giá mức độ ảnh hưởng kỹ thuật."
      />

      <Dialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tạo ECR mới"
        maxWidth="max-w-[50%]"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(ev) => {
            ev.preventDefault()
            if (!window.confirm('Xác nhận tạo yêu cầu thay đổi kỹ thuật (ECR) này?')) return
            e.create()
            setShowCreate(false)
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">change_type</span>
            <Select
              value={e.createForm.change_type}
              onChange={(ev) => e.setCreateForm({ ...e.createForm, change_type: ev.target.value })}
            >
              {['ITEM_REV', 'BOM_REV', 'ROUTING_REV', 'TOOLING', 'CONTROL_PLAN', 'MULTI'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">reason</span>
            <Input
              value={e.createForm.reason}
              onChange={(ev) => e.setCreateForm({ ...e.createForm, reason: ev.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">impact_assessment</span>
            <Input
              value={e.createForm.impact_assessment}
              onChange={(ev) =>
                e.setCreateForm({ ...e.createForm, impact_assessment: ev.target.value })
              }
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">target_item_id (optional)</span>
            <Input
              type="number"
              value={e.createForm.target_item_id ?? ''}
              onChange={(ev) =>
                e.setCreateForm({
                  ...e.createForm,
                  target_item_id: ev.target.value ? Number(ev.target.value) : null,
                })
              }
            />
          </label>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={e.createPending}>
              Tạo
            </Button>
          </div>
          {e.createError ? (
            <p className="text-sm text-[var(--color-danger-text)] mt-2" role="alert">
              {e.createError.code}: {e.createError.message}
            </p>
          ) : null}
        </form>
      </Dialog>

      <FilterBar
        fields={[
          {
            name: 'search',
            type: 'text',
            placeholder: 'Tìm code...',
          },
        ]}
        values={{
          search: e.searchInput,
        }}
        onChange={(name, value) => {
          if (name === 'search') {
            e.setSearchInput(value)
          }
        }}
        onSubmit={(ev) => {
          ev.preventDefault()
          e.applySearch()
        }}
        onReset={() => {
          e.setSearchInput('')
          e.applySearch()
        }}
        isResetActive={Boolean(e.searchInput)}
        expands={
          <Button type="button" className="shrink-0" onClick={() => setShowCreate(true)}>
            Tạo ECR
          </Button>
        }
      />

      {e.listState === 'empty' || e.listState === 'no-result' ? (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-[var(--surface-1)] rounded-xl border border-[var(--border-default)] my-4">
          <svg className="w-12 h-12 text-[var(--text-muted)] opacity-60 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {e.listState === 'empty' ? 'Chưa có yêu cầu thay đổi (ECR)' : 'Không tìm thấy yêu cầu thay đổi nào'}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1">
            {e.listState === 'empty'
              ? 'Hệ thống chưa ghi nhận yêu cầu thay đổi kỹ thuật nào.'
              : 'Thử điều chỉnh từ khóa tìm kiếm hoặc xóa bộ lọc để tìm lại.'}
          </p>
        </div>
      ) : (() => {
        const b = msg(e.listState)
        return b && e.listState !== 'ready' && e.listState !== 'loading' ? (
          <p className="ecr-admin__state" role="status">
            {b}
            {e.listError ? ` (${e.listError.code})` : ''}
          </p>
        ) : null
      })()}

      {e.listState === 'ready' ? (
        <div className="ecr-admin__table-wrap flex flex-col gap-4">
          <GenericDataTable
            data={pagination.paginatedItems}
            columns={columns}
            pagination={pagination}
            onRowClick={(row) => e.select(row.code)}
            getRowClassName={(row) =>
              row.code === e.selectedCode
                ? 'bg-[var(--surface-2)] border-l-4 border-l-[var(--color-action-primary)]'
                : ''
            }
          />
          {e.hasMore ? (
            <Button
              type="button"
              variant="secondary"
              className="self-center"
              onClick={e.loadMore}
            >
              Tải thêm từ máy chủ
            </Button>
          ) : null}
        </div>
      ) : null}

      <Dialog
        isOpen={Boolean(e.selectedCode)}
        onClose={() => e.select(null)}
        title={`Chi tiết ECR: ${e.selectedCode || ''}`}
      >
        {e.detailLoading ? (
          <div className="p-8 text-center text-[var(--text-secondary)]">Đang tải chi tiết…</div>
        ) : e.detail && e.detailRow ? (
          <aside className="flex flex-col gap-4 text-left">
            <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Thông tin ECR</h4>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <span className="text-xs text-[var(--text-secondary)]">Trạng thái</span>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{e.detailRow.status}</p>
                </div>
                <div>
                  <span className="text-xs text-[var(--text-secondary)]">Loại thay đổi</span>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{e.detailRow.changeType}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-[var(--text-secondary)]">Vật tư ảnh hưởng</span>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{e.detailRow.itemLabel}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-[var(--text-secondary)]">Lý do thay đổi</span>
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-line">{e.detailRow.reason}</p>
                </div>
              </div>
            </div>

            {e.detailRow.canUpdate ? (
              <form
                className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-3"
                onSubmit={(ev) => {
                  ev.preventDefault()
                  if (!window.confirm('Xác nhận lưu thay đổi lý do ECR này?')) return
                  e.saveUpdate()
                }}
              >
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Cập nhật thông tin (DRAFT)</h4>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Lý do thay đổi (Reason)</span>
                  <Textarea
                    value={e.editForm.reason ?? e.detail.reason}
                    onChange={(ev) => e.setEditForm({ ...e.editForm, reason: ev.target.value })}
                  />
                </label>
                <Button type="submit" disabled={e.updatePending} className="self-end">
                  Lưu
                </Button>
              </form>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[var(--border-default)]">
              <Button
                type="button"
                disabled={!e.detailRow.canSubmit || e.lifecyclePending}
                onClick={() => {
                  if (!window.confirm('Xác nhận submit ECR này?')) return
                  e.runLifecycle('submit')
                }}
              >
                Submit
              </Button>
              <Button
                type="button"
                disabled={!e.detailRow.canStartReview || e.lifecyclePending}
                onClick={() => {
                  if (!window.confirm('Xác nhận bắt đầu review ECR này?')) return
                  e.runLifecycle('start_review')
                }}
              >
                Start review
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!e.detailRow.canApprove || e.lifecyclePending}
                onClick={() => {
                  if (!window.confirm('Xác nhận approve ECR này?')) return
                  e.runLifecycle('approve')
                }}
              >
                Approve
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!e.detailRow.canClose || e.lifecyclePending}
                onClick={() => {
                  if (!window.confirm('Xác nhận close ECR này?')) return
                  e.runLifecycle('close')
                }}
              >
                Close
              </Button>
            </div>

            {e.detailRow.canReject ? (
              <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Reject Reason</span>
                  <Input
                    value={e.rejectReason}
                    onChange={(ev) => e.setRejectReason(ev.target.value)}
                  />
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!e.rejectReason.trim() || e.lifecyclePending}
                  onClick={() => {
                    if (!window.confirm('Xác nhận reject ECR này?')) return
                    e.runLifecycle('reject')
                  }}
                  className="self-end"
                >
                  Reject
                </Button>
              </div>
            ) : null}

            {e.detailRow.canImplement ? (
              <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Implement links</h4>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] font-medium">Entity Type</span>
                  <Input
                    value={e.implementLinks[0]?.target_entity_type ?? ''}
                    onChange={(ev) =>
                      e.setImplementLinks([
                        {
                          ...e.implementLinks[0],
                          target_entity_type: ev.target.value,
                          target_entity_id: e.implementLinks[0]?.target_entity_id ?? 0,
                          action: e.implementLinks[0]?.action ?? 'SUPERSEDE',
                        },
                      ])
                    }
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] font-medium">Entity ID</span>
                  <Input
                    type="number"
                    value={e.implementLinks[0]?.target_entity_id || ''}
                    onChange={(ev) =>
                      e.setImplementLinks([
                        {
                          ...e.implementLinks[0],
                          target_entity_type:
                            e.implementLinks[0]?.target_entity_type ?? 'BOM_HEADER',
                          target_entity_id: Number(ev.target.value),
                          action: e.implementLinks[0]?.action ?? 'SUPERSEDE',
                        },
                      ])
                    }
                  />
                </label>
                <Button
                  type="button"
                  disabled={e.lifecyclePending}
                  onClick={() => {
                    if (!window.confirm('Xác nhận thực thi (implement) thay đổi này?')) return
                    e.runLifecycle('implement')
                  }}
                  className="self-end mt-2"
                >
                  Implement
                </Button>
              </div>
            ) : null}

            {e.approvals.length > 0 ? (
              <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-default)] flex flex-col gap-2">
                <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-left">Approvals</h4>
                <ul className="text-sm text-[var(--text-secondary)] list-disc pl-5">
                  {e.approvals.map((a) => (
                    <li key={a.code} className="py-1">
                      #{a.step_order} {a.approval_party_type} {a.role_required ?? ''} —{' '}
                      <span className="font-semibold text-[var(--text-primary)]">{a.decision ?? 'PENDING'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {e.lifecycleError ? (
              <p className="ecr-admin__error mt-2" role="alert">
                {e.lifecycleError.code}: {e.lifecycleError.message}
              </p>
            ) : null}
            {e.updateError ? (
              <p className="ecr-admin__error mt-2" role="alert">
                {e.updateError.code}: {e.updateError.message}
              </p>
            ) : null}
          </aside>
        ) : null}
      </Dialog>
    </section>
  )
}
