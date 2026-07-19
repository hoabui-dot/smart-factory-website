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
  { label: 'Công việc của tôi', href: '/web/shared/my-work' },
  { label: 'Danh sách phê duyệt', href: '/web/shared/approval-inbox' },
  { label: 'Dữ liệu tham chiếu', href: '/web/admin/ref-data' },
  { label: 'Quản trị hệ thống', href: '/admin' },
  { label: 'Quản lý người dùng', href: '/web/admin/users' },
  { label: 'Phân quyền người dùng (RBAC)', href: '/web/admin/rbac' },
  { label: 'Nhật ký hoạt động', href: '/web/admin/audit-logs' },
  { label: 'Quản lý tệp tin', href: '/web/admin/files' },
  { label: 'Quản lý in ấn', href: '/web/admin/print-queue' },
  { label: 'Giám sát sự kiện', href: '/web/admin/events' },
  { label: 'Nhập / Xuất dữ liệu', href: '/web/import-export' },
  { label: 'Trung tâm thông báo', href: '/web/notifications' },
  { label: 'Cấu hình gửi thông báo', href: '/web/admin/notification-delivery' },
  { label: 'Cài đặt nhận thông báo', href: '/web/settings/notifications' },
  { label: 'Tác vụ ngầm (Worker)', href: '/web/admin/worker-jobs' },
  { label: 'Danh mục vật tư', href: '/web/mes/items' },
  { label: 'Danh mục vị trí', href: '/web/wms/locations' },
  { label: 'Quy trình sản xuất', href: '/web/mes/routings' },
  { label: 'Hệ thống báo cáo', href: '/reports' },
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
