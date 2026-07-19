import { useState, type ReactNode } from 'react'
import { NavLink, Link } from 'react-router'
import { Sun, Moon, Menu } from 'lucide-react'

import { useTheme } from '@/shared/lib/useTheme'

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
  const { toggleTheme, isDark } = useTheme()
  
  // Persist sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return localStorage.getItem('sf-sidebar-open') !== 'false'
  })

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev
      localStorage.setItem('sf-sidebar-open', String(next))
      return next
    })
  }

  return (
    <div className={`shell ${isSidebarOpen ? '' : 'shell--sidebar-off'}`}>
      <aside className="shell__sidebar" aria-label="Điều hướng chính">
        <Link to="/home" className="shell__brand-link">
          <div className="shell__brand">
            <span className="shell__brand-mark" aria-hidden />
            <div>
              <strong>SmartFactory</strong>
              <p>MES · WMS · QMS</p>
            </div>
          </div>
        </Link>
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
          <div className="shell__header-left">
            <button
              type="button"
              className="shell__sidebar-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
            <h1>{title}</h1>
          </div>
          <div className="shell__header-actions">
            <button
              type="button"
              className="shell__theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
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
