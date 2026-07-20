import { useState, useEffect, type ReactNode } from 'react'
import { NavLink, Link, useNavigate } from 'react-router'
import {
  Sun,
  Moon,
  Menu,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  User,
  HelpCircle,
  LogOut,
  Settings,
  Globe,
  Database,
  Wifi,
  WifiOff,
  Bell,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  UserPlus,
  Sparkles,
  Command
} from 'lucide-react'

import { useTheme } from '@/shared/lib/useTheme'
import { GlobalSearchModal } from './GlobalSearchModal'
import { UserProfileDialog } from './UserProfileDialog'
import { Dialog } from '@/shared/components/ui/Dialog'
import { Button } from '@/shared/components/ui/Button'

import './AppLayout.css'

type AppLayoutProps = {
  title: string
  userLabel?: string
  onSignOut?: () => void
  children: ReactNode
}

interface NavItem {
  label: string
  href: string
}

interface NavGroup {
  groupName: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupName: 'Tổng quan & Công việc',
    items: [
      { label: 'Trang chủ', href: '/home' },
      { label: 'Công việc của tôi', href: '/web/shared/my-work' },
      { label: 'Hộp thư phê duyệt', href: '/web/shared/approval-inbox' },
    ],
  },
  {
    groupName: 'Sản xuất (MES)',
    items: [
      { label: 'Danh mục vật tư (Item)', href: '/web/mes/items' },
      { label: 'Định mức vật tư (BOM)', href: '/web/mes/boms' },
      { label: 'Quy trình sản xuất (Routing)', href: '/web/mes/routings' },
      { label: 'Danh sách Lệnh sản xuất', href: '/web/mes/work-orders' },
      { label: 'Nhật ký sản xuất (Logs)', href: '/web/mes/production-logs' },
      { label: 'Bảng điều hành sản xuất', href: '/web/mes/dashboards' },
      { label: 'Yêu cầu thay đổi kỹ thuật (ECO)', href: '/web/mes/change-requests' },
      { label: 'Quản lý Ca & Kỹ năng đào tạo', href: '/web/mes/shifts' },
      { label: 'Truy xuất nguồn gốc sản phẩm', href: '/web/mes/traceability' },
    ],
  },
  {
    groupName: 'Kho vận (WMS)',
    items: [
      { label: 'Vị trí kho hàng (Locations)', href: '/web/wms/locations' },
      { label: 'Kiểm soát tồn kho (Inventory)', href: '/web/wms/inventory' },
      { label: 'Phiếu nhập kho (Goods Receipts)', href: '/web/wms/goods-receipts' },
      { label: 'Phiếu xuất kho (Goods Issues)', href: '/web/wms/goods-issues' },
      { label: 'Quản lý số lô (Lot)', href: '/web/wms/lots' },
      { label: 'Danh mục nhà cung cấp', href: '/web/wms/suppliers' },
      { label: 'Kiểm kê & Đối chiếu kho', href: '/web/wms/stocktakes' },
    ],
  },
  {
    groupName: 'Chất lượng (QMS)',
    items: [
      { label: 'Tiêu chuẩn & Checksheet', href: '/web/qms/checksheets' },
      { label: 'Kết quả kiểm tra chất lượng', href: '/web/qms/inspection-results' },
      { label: 'Báo cáo NCR & Sự cố chất lượng', href: '/web/qms/ncrs' },
      { label: 'Tài liệu kỹ thuật & PPAP', href: '/web/qms/documents' },
    ],
  },
  {
    groupName: 'Quản trị & Cấu hình',
    items: [
      { label: 'Khu vực quản trị chung', href: '/admin' },
      { label: 'Quản lý người dùng', href: '/web/admin/users' },
      { label: 'Phân quyền vai trò (RBAC)', href: '/web/admin/rbac' },
      { label: 'Dữ liệu tham chiếu (REFDATA)', href: '/web/admin/ref-data' },
      { label: 'Hàng đợi In ấn (Print Queue)', href: '/web/admin/print-queue' },
      { label: 'Quản trị lưu trữ tệp tin', href: '/web/admin/files' },
      { label: 'Nhật ký gửi thông báo', href: '/web/admin/notification-delivery' },
      { label: 'Cài đặt nhận thông báo', href: '/web/settings/notifications' },
      { label: 'Trung tâm xuất nhập (Excel)', href: '/web/import-export' },
      { label: 'Bảng điều khiển tác vụ ngầm', href: '/web/admin/worker-jobs' },
      { label: 'Giám sát sự kiện thời gian thực', href: '/web/admin/events' },
      { label: 'Nhật ký hoạt động (Audit Logs)', href: '/web/admin/audit-logs' },
    ],
  },
]

export function AppLayout({ title, userLabel = 'Hoà Bùi', onSignOut, children }: AppLayoutProps) {
  const navigate = useNavigate()
  const { toggleTheme, isDark } = useTheme()

  // Collapsible sidebar groups state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('sf-sidebar-expanded-groups')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        /* fallback */
      }
    }
    return {
      'Tổng quan & Công việc': true,
      'Sản xuất (MES)': false,
      'Kho vận (WMS)': false,
      'Chất lượng (QMS)': false,
      'Quản trị & Cấu hình': false,
    }
  })

  // Global Dialog and Menu Overlay states
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return localStorage.getItem('sf-sidebar-open') !== 'false'
  })
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isAvatarOpen, setIsAvatarOpen] = useState(false)
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Sync expanded groups to storage (Accordion style: only one open at a time)
  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const isCurrentlyExpanded = !!prev[groupName]
      const next: Record<string, boolean> = {}
      
      NAV_GROUPS.forEach((g) => {
        next[g.groupName] = false
      })
      
      if (!isCurrentlyExpanded) {
        next[groupName] = true
      }
      
      localStorage.setItem('sf-sidebar-expanded-groups', JSON.stringify(next))
      return next
    })
  }

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev
      localStorage.setItem('sf-sidebar-open', String(next))
      return next
    })
  }

  // Monitor network status
  useEffect(() => {
    const online = () => setIsOnline(true)
    const offline = () => setIsOnline(false)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
    }
  }, [])

  // Keyboard shortcut hooks (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
      if (e.shiftKey && e.key === 'A') {
        e.preventDefault()
        toggleTheme()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [toggleTheme])

  // Session Timeout warning trigger (mock 15 mins of inactivity)
  useEffect(() => {
    let timeout: NodeJS.Timeout
    const resetTimer = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        setShowTimeoutWarning(true)
      }, 15 * 60 * 1000)
    }
    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keydown', resetTimer)
    resetTimer()
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keydown', resetTimer)
    }
  }, [])

  return (
    <div className={`shell ${isSidebarOpen ? '' : 'shell--sidebar-off'} font-sans antialiased text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950`}>
      {/* Sidebar Navigation */}
      <aside className="shell__sidebar bg-slate-900 border-r border-slate-950 flex flex-col justify-between" aria-label="Điều hướng chính">
        <div>
          {/* Logo Brand Brandmark */}
          <Link to="/home" className="shell__brand-link border-b border-slate-950/40">
            <div className="shell__brand flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow border border-blue-500">
                SF
              </span>
              <div>
                <strong className="text-white text-sm font-semibold tracking-tight block">SmartFactory</strong>
                <p className="text-[10px] text-slate-400 font-mono tracking-wider">MES · WMS · QMS</p>
              </div>
            </div>
          </Link>

          {/* Grouped Nav Items */}
          <nav className="shell__nav flex flex-col gap-1 p-3 overflow-y-auto max-h-[75vh]">
            {NAV_GROUPS.map((group) => {
              const isExpanded = expandedGroups[group.groupName]
              return (
                <div key={group.groupName} className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.groupName)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-slate-450 uppercase tracking-wider py-2 px-2 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{group.groupName}</span>
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                  
                  {isExpanded && (
                    <div className="flex flex-col gap-0.5 border-l border-slate-800/40 ml-2.5 pl-1.5 animate-fade-in">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.href}
                          to={item.href}
                          className={({ isActive }) =>
                            `shell__nav-link text-xs rounded-md py-1.5 px-3 font-medium transition-all ${
                              isActive
                                ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 pl-2.5 font-semibold bg-slate-800/40'
                                : 'text-slate-355 hover:text-white hover:bg-slate-800/40'
                            }`
                          }
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-slate-950/40 bg-slate-950/20 text-[10px] text-slate-550 font-mono flex items-center justify-between">
          <span>v2.3.1</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div className="shell__main flex-1 flex flex-col min-h-screen">
        <header className="shell__header h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div className="shell__header-left flex items-center gap-4">
            <button
              type="button"
              className="shell__sidebar-toggle text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>

            {/* Quick Global Search Triggers */}
            <div className="hidden md:flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 w-64 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer" onClick={() => setIsSearchOpen(true)}>
              <Search size={14} className="text-slate-400" />
              <span className="text-xs text-slate-450 flex-1">Tìm kiếm nhanh...</span>
              <kbd className="text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1 rounded text-slate-400">⌘K</kbd>
            </div>
          </div>

          <div className="shell__header-actions flex items-center gap-3">
            {/* Environment indicators */}
            <div className="hidden lg:flex items-center gap-3 text-xs text-slate-450 border-r border-slate-200 dark:border-slate-800 pr-3">
              <span className="flex items-center gap-1">
                <Database size={12} className="text-blue-500" />
                Production
              </span>
              <span className="flex items-center gap-1">
                <Globe size={12} />
                HCM Plant
              </span>
            </div>

            {/* Quick Create menu '+' */}
            <div className="relative">
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                onClick={() => setIsCreateOpen(!isCreateOpen)}
                aria-label="Quick creation shortcuts"
              >
                <Plus size={16} />
              </button>
              {isCreateOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsCreateOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 z-50 animate-fade-in-up text-sm font-medium">
                    <button
                      onClick={() => {
                        setIsCreateOpen(false)
                        navigate('/web/mes/work-orders')
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <Plus size={14} className="text-slate-400" />
                      Lệnh sản xuất mới
                    </button>
                    <button
                      onClick={() => {
                        setIsCreateOpen(false)
                        navigate('/web/mes/items')
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <FolderPlus size={14} className="text-slate-400" />
                      Vật tư mới
                    </button>
                    <button
                      onClick={() => {
                        setIsCreateOpen(false)
                        navigate('/web/wms/locations')
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <Globe size={14} className="text-slate-400" />
                      Vị trí mới
                    </button>
                    <button
                      onClick={() => {
                        setIsCreateOpen(false)
                        navigate('/web/admin/users')
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <UserPlus size={14} className="text-slate-400" />
                      Người dùng mới
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Notifications Shortcut Link */}
            <Link
              to="/web/notifications"
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 relative"
              aria-label="Notification Center"
            >
              <Bell size={15} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-600 rounded-full" />
            </Link>

            {/* Theme switcher */}
            <button
              type="button"
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Avatar Dropdown User Menu */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full pl-1.5 pr-2.5 py-1 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                onClick={() => setIsAvatarOpen(!isAvatarOpen)}
                aria-label="User Account Menu"
              >
                <div className="w-[24px] h-[24px] bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold font-sans">
                  {userLabel.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-305 hidden sm:inline">{userLabel}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>
              
              {isAvatarOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsAvatarOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 z-50 animate-fade-in-up text-sm font-medium">
                    <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex flex-col gap-0.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{userLabel}</span>
                      <span className="text-[10px] text-slate-400 font-mono">system_admin</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsAvatarOpen(false)
                        setIsProfileOpen(true)
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <User size={14} className="text-slate-400" />
                      Thông tin cá nhân
                    </button>
                    <button
                      onClick={() => {
                        setIsAvatarOpen(false)
                        setIsProfileOpen(true)
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <Settings size={14} className="text-slate-400" />
                      Cấu hình hiển thị
                    </button>
                    <button
                      onClick={() => {
                        setIsAvatarOpen(false)
                        setIsHelpOpen(true)
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <HelpCircle size={14} className="text-slate-400" />
                      Trợ giúp &amp; Phím tắt
                    </button>
                    {onSignOut && (
                      <button
                        onClick={() => {
                          setIsAvatarOpen(false)
                          onSignOut()
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-800/80 mt-1 cursor-pointer"
                      >
                        <LogOut size={14} />
                        Đăng xuất
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content canvas */}
        <main className="shell__content flex-1 p-6">{children}</main>
      </div>

      {/* Global search palette */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* User profile details preferences */}
      <UserProfileDialog isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} userName={userLabel} />

      {/* Help shortcuts reference modal */}
      <Dialog isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="Trợ giúp & Phím tắt">
        <div className="flex flex-col gap-4 font-sans text-sm max-w-sm w-full">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Hỗ trợ vận hành</h4>
            <p className="text-xs text-slate-505 mt-1 leading-relaxed">
              Nếu gặp khó khăn trong việc thao tác hoặc lỗi hệ thống, vui lòng liên hệ Bộ phận IT theo số máy nhánh <strong>#8812</strong> hoặc gửi email tới <strong>support@company.com</strong>.
            </p>
          </div>
          
          <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Command size={14} />
              Phím tắt nhanh
            </h4>
            <div className="flex flex-col gap-1.5 mt-1 font-mono text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>Tìm kiếm nhanh</span>
                <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">Ctrl + K / ⌘K</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Chuyển chế độ Sáng/Tối</span>
                <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">Shift + A</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Đóng hộp thoại popup</span>
                <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">Esc</kbd>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
            <Button variant="secondary" onClick={() => setIsHelpOpen(false)}>
              Đóng trợ giúp
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Session timeout idle warning */}
      <Dialog isOpen={showTimeoutWarning} onClose={() => setShowTimeoutWarning(false)} title="Cảnh báo: Sắp hết hạn phiên làm việc">
        <div className="flex flex-col gap-4 font-sans text-sm max-w-sm w-full">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-405 border border-yellow-250 dark:border-yellow-900/50 rounded-xl flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <p className="text-xs leading-relaxed">
              Bạn đã không thao tác trong 15 phút. Vì lý do bảo mật công nghiệp, hệ thống sẽ tự động đăng xuất sau 1 phút nữa để tránh truy cập trái phép.
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowTimeoutWarning(false)
                if (onSignOut) onSignOut()
              }}
            >
              Đăng xuất ngay
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowTimeoutWarning(false)
              }}
            >
              Gia hạn phiên làm việc
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
