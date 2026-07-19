import { Link } from 'react-router'

import { useAuthStore } from '@/shared/store/authStore'
import { isSystemAdminSession } from '@/shared/api'

import { useRbacAdmin } from '../hooks/useRbacAdmin'
import { usePagination } from '@/shared/lib/usePagination'
import { DataTablePagination } from '@/shared/components/DataTablePagination'

// Import Tailwind Shadcn UI & Layout components
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Input, Select } from '@/shared/components/ui/Input'
import { Badge } from '@/shared/components/ui/Badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/shared/components/ui/Table'
import { Search } from 'lucide-react'

import './RbacAdminPage.css'

export function RbacAdminPage() {
  const session = useAuthStore((s) => s.session)
  const rbac = useRbacAdmin()
  const pagination = usePagination(rbac.permissions, 10)

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

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-[200px]">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</span>
          <Select
            value={rbac.roleCode}
            onChange={(event) => rbac.setRoleCode(event.target.value)}
            className="h-9"
          >
            {rbac.roleCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        </div>

        <form
          className="flex flex-1 items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg max-w-md"
          onSubmit={(event) => {
            event.preventDefault()
            rbac.applySearch()
          }}
        >
          <div className="flex-1">
            <Input
              value={rbac.searchInput}
              onChange={(event) => rbac.setSearchInput(event.target.value)}
              placeholder="Tìm permission (ví dụ: MES-01.view.ALL)..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-8 px-2"
              autoComplete="off"
            />
          </div>
          <Button type="submit" size="sm" className="h-8 w-8 px-0" aria-label="Lọc">
            <Search size={14} />
          </Button>
        </form>
      </div>

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

      {(rbac.listState === 'loading' || rbac.roleLoading) && (
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

      {rbac.listState === 'ready' && (
        <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
          <Table containerClassName="relative w-full overflow-auto">
            <TableHeader>
              <TableRow className="pointer-events-none hover:bg-transparent">
                <TableHead className="w-[80px]">Gán</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Apps</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedItems.map((perm) => {
                const checked = rbac.draftCodes.includes(perm.code)
                return (
                  <TableRow
                    key={perm.code}
                    className={checked ? 'bg-blue-50/20 dark:bg-slate-900/30' : ''}
                    onClick={() => rbac.toggleCode(perm.code)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="rounded border-slate-350 dark:border-slate-800 cursor-pointer"
                        checked={checked}
                        onChange={() => rbac.toggleCode(perm.code)}
                        aria-label={`Gán ${perm.code}`}
                      />
                    </TableCell>
                    <TableCell>
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {perm.code}
                      </code>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800 dark:text-slate-100">{perm.module_code}</TableCell>
                    <TableCell>{perm.action}</TableCell>
                    <TableCell>{perm.scope}</TableCell>
                    <TableCell className="text-xs text-slate-400">{perm.allowed_apps}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs" title={perm.description}>{perm.description}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <DataTablePagination {...pagination} />
        </div>
      )}
    </section>
  )
}
