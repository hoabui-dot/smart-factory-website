import type { ReactNode } from 'react'
import { NavLink } from 'react-router'

import './AppLayout.css'

type AppLayoutProps = {
  title: string
  userLabel?: string
  onSignOut?: () => void
  children: ReactNode
}

const NAV_ITEMS = [
  { label: 'Trang chủ', href: '/home' },
  { label: 'My Work', href: '/web/shared/my-work' },
  { label: 'Approvals', href: '/web/shared/approval-inbox' },
  { label: 'Ref Data', href: '/web/admin/ref-data' },
  { label: 'Quản trị', href: '/admin' },
  { label: 'Users', href: '/web/admin/users' },
  { label: 'RBAC', href: '/web/admin/rbac' },
  { label: 'Audit', href: '/web/admin/audit-logs' },
  { label: 'Files', href: '/web/admin/files' },
  { label: 'Print', href: '/web/admin/print-queue' },
  { label: 'Events', href: '/web/admin/events' },
  { label: 'Import/Export', href: '/web/import-export' },
  { label: 'Notifications', href: '/web/notifications' },
  { label: 'Delivery', href: '/web/admin/notification-delivery' },
  { label: 'Notif settings', href: '/web/settings/notifications' },
  { label: 'Worker jobs', href: '/web/admin/worker-jobs' },
  { label: 'Item Master', href: '/web/mes/items' },
  { label: 'Locations', href: '/web/wms/locations' },
  { label: 'Routings', href: '/web/mes/routings' },
  { label: 'Báo cáo', href: '/reports' },
]

export function AppLayout({ title, userLabel, onSignOut, children }: AppLayoutProps) {
  return (
    <div className="shell">
      <aside className="shell__sidebar" aria-label="Điều hướng chính">
        <div className="shell__brand">
          <span className="shell__brand-mark" aria-hidden />
          <div>
            <strong>SmartFactory</strong>
            <p>MES · WMS · QMS</p>
          </div>
        </div>
        <nav className="shell__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                isActive ? 'shell__nav-link shell__nav-link--active' : 'shell__nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="shell__main">
        <header className="shell__header">
          <h1>{title}</h1>
          <div className="shell__header-actions">
            {userLabel ? <span className="shell__user">{userLabel}</span> : null}
            {onSignOut ? (
              <button type="button" className="shell__signout" onClick={onSignOut}>
                Đăng xuất
              </button>
            ) : null}
          </div>
        </header>
        <main className="shell__content">{children}</main>
      </div>
    </div>
  )
}
