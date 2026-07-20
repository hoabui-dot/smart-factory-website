import { Link } from 'react-router'

import { useAuthStore } from '@/shared/store/authStore'
import { isSystemAdminSession } from '@/shared/api'

import { useRbacAdmin } from '../hooks/useRbacAdmin'
import { usePagination } from '@/shared/lib/usePagination'
import { GenericDataTable, ColumnDef } from '@/shared/components/ui/DataTable'
import type { Permission } from '../types/rbac'

// Import Tailwind Shadcn UI & Layout components
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Input, Select } from '@/shared/components/ui/Input'
import { Badge } from '@/shared/components/ui/Badge'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { Search } from 'lucide-react'

import './RbacAdminPage.css'

export function RbacAdminPage() {
  const session = useAuthStore((s) => s.session)
  const rbac = useRbacAdmin()
  const pagination = usePagination(rbac.permissions, 10)

  const columns: ColumnDef<Permission>[] = [
    {
      header: 'Gán',
      className: 'w-[80px]',
      cell: (perm) => {
        const checked = rbac.draftCodes.includes(perm.code)
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              className="rounded border-slate-350 dark:border-slate-800 cursor-pointer"
              checked={checked}
              onChange={() => rbac.toggleCode(perm.code)}
              aria-label={`Gán ${perm.code}`}
            />
          </div>
        )
      },
    },
    {
      header: 'Mã quyền',
      cell: (perm) => (
        <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
          {perm.code}
        </code>
      ),
    },
    {
      header: 'Phân hệ',
      cell: (perm) => (
        <span className="font-semibold text-slate-800 dark:text-slate-100">{perm.module_code}</span>
      ),
    },
    {
      header: 'Hành động',
      cell: (perm) => perm.action,
    },
    {
      header: 'Phạm vi',
      cell: (perm) => perm.scope,
    },
    {
      header: 'Ứng dụng',
      cell: (perm) => <span className="text-xs text-slate-400">{perm.allowed_apps}</span>,
    },
    {
      header: 'Mô tả chi tiết',
      cell: (perm) => (
        <span className="max-w-xs truncate text-xs block" title={perm.description}>
          {perm.description}
        </span>
      ),
    },
  ]

  if (!isSystemAdminSession(session)) {
    return (
      <section className="flex flex-col gap-6 font-sans">
        <PageHeader
          breadcrumbs={[
            { label: 'Trang chủ', href: '/home' },
            { label: 'Quản trị', href: '/admin' },
            { label: 'RBAC' },
          ]}
          title="RBAC Admin"
        />
        <p className="p-4 rounded bg-red-50 dark:bg-red-950/20 text-sm text-red-650 border border-red-200" role="alert">
          Bạn không có quyền xem RBAC Admin (system_admin_only).
        </p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Quản trị', href: '/admin' },
          { label: 'RBAC' },
        ]}
        title="RBAC Admin"
        subtitle="Xem permission catalog và cấu hình gán quyền theo vai trò người dùng (Role)."
        actions={
          <div className="flex items-center gap-2">
            {rbac.saveState === 'unsaved-changes' && (
              <Badge variant="inactive" className="animate-pulse py-1 px-2.5">
                Có thay đổi chưa lưu
              </Badge>
            )}
            <Button
              variant="secondary"
              onClick={rbac.resetDraft}
              disabled={!rbac.dirty || rbac.saveState === 'saving'}
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (
                  rbac.dirty &&
                  window.confirm(
                    `Xác nhận thay thế toàn bộ permission của role ${rbac.roleCode}?`,
                  )
                ) {
                  rbac.save()
                }
              }}
              disabled={!rbac.dirty || rbac.saveState === 'saving'}
            >
              {rbac.saveState === 'saving' ? 'Đang lưu…' : 'Lưu gán quyền'}
            </Button>
          </div>
        }
      />

      <FilterBar
        fields={[
          {
            name: 'role',
            type: 'select',
            label: 'Role',
            options: rbac.roleCodes.map((code) => ({ value: code, label: code })),
          },
          {
            name: 'search',
            type: 'text',
            label: 'Tìm kiếm permission',
            placeholder: 'Tìm permission (ví dụ: MES-01.view.ALL)...',
          },
        ]}
        values={{
          role: rbac.roleCode,
          search: rbac.searchInput,
        }}
        onChange={(name, value) => {
          if (name === 'role') {
            rbac.setRoleCode(value)
          } else if (name === 'search') {
            rbac.setSearchInput(value)
          }
        }}
        onSubmit={(event) => {
          event.preventDefault()
          rbac.applySearch()
        }}
        onReset={() => {
          rbac.setSearchInput('')
          // Reset action logic needs to trigger the actual filter logic update
          rbac.applySearch()
        }}
        isResetActive={Boolean(rbac.searchInput)}
      />

      {rbac.roleError && (
        <p className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-sm text-red-650 border border-red-200" role="alert">
          {rbac.roleError.code}: {rbac.roleError.message}
        </p>
      )}
      {rbac.saveError && (
        <p className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-sm text-red-650 border border-red-200" role="alert">
          {rbac.saveError.code}: {rbac.saveError.message}
        </p>
      )}

      {rbac.roleLoading && (
        <div className="text-sm text-slate-400">Đang tải cấu hình RBAC…</div>
      )}
      {rbac.listState === 'permission-denied' && (
        <div className="p-4 rounded bg-red-50 dark:bg-red-950/20 text-sm text-red-650 border border-red-200" role="alert">
          Không có quyền truy cập permission catalog.
        </div>
      )}
      {(rbac.listState === 'empty' || rbac.listState === 'no-result') && (
        <div className="p-4 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm text-slate-500">
          {rbac.listState === 'no-result'
            ? 'Không tìm thấy permission khớp bộ lọc.'
            : 'Không tìm thấy permission trong catalog.'}
        </div>
      )}
      {rbac.listState === 'error' && (
        <div className="p-4 rounded bg-red-50 dark:bg-red-950/20 text-sm text-red-650 border border-red-200" role="alert">
          Không tải được catalog. {rbac.listError ? `(${rbac.listError.code})` : ''}
        </div>
      )}

      {(rbac.listState === 'ready' || rbac.listState === 'loading') && (
        <GenericDataTable
          data={pagination.paginatedItems}
          columns={columns}
          pagination={pagination}
          isLoading={rbac.listState === 'loading'}
          onRowClick={(perm) => rbac.toggleCode(perm.code)}
          getRowClassName={(perm) => rbac.draftCodes.includes(perm.code) ? 'bg-blue-50/20 dark:bg-slate-900/30' : ''}
        />
      )}
    </section>
  )
}
