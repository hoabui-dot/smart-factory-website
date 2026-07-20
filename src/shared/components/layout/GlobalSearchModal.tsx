import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { Search, X, Command, Globe, Folder, Shield, Calendar, Users, Cpu, FileText } from 'lucide-react'

import { Dialog } from '@/shared/components/ui/Dialog'

interface SearchItem {
  category: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string; size?: number }>
}

const SEARCH_REGISTRY: SearchItem[] = [
  { category: 'Hệ thống', label: 'Trang chủ', href: '/home', icon: Globe },
  { category: 'Hệ thống', label: 'Công việc của tôi', href: '/web/shared/my-work', icon: FileText },
  { category: 'Hệ thống', label: 'Hộp thư phê duyệt', href: '/web/shared/approval-inbox', icon: Shield },
  { category: 'Sản xuất (MES)', label: 'Danh mục vật tư (Item Master)', href: '/web/mes/items', icon: Folder },
  { category: 'Sản xuất (MES)', label: 'Danh mục định tuyến (Routing)', href: '/web/mes/routings', icon: Cpu },
  { category: 'Sản xuất (MES)', label: 'Định mức vật tư (BOM)', href: '/web/mes/boms', icon: Folder },
  { category: 'Sản xuất (MES)', label: 'Danh sách Lệnh sản xuất', href: '/web/mes/work-orders', icon: Calendar },
  { category: 'Kho vận (WMS)', label: 'Vị trí kho hàng (Locations)', href: '/web/wms/locations', icon: Globe },
  { category: 'Kho vận (WMS)', label: 'Kiểm soát tồn kho (Inventory)', href: '/web/wms/inventory', icon: Folder },
  { category: 'Chất lượng (QMS)', label: 'Tiêu chuẩn & Checksheet', href: '/web/qms/checksheets', icon: Shield },
  { category: 'Chất lượng (QMS)', label: 'Kết quả kiểm tra', href: '/web/qms/inspection-results', icon: Shield },
  { category: 'Chất lượng (QMS)', label: 'Báo cáo NCR', href: '/web/qms/ncrs', icon: Shield },
  { category: 'Quản trị', label: 'Khu vực quản trị chung', href: '/admin', icon: Users },
  { category: 'Quản trị', label: 'Quản lý người dùng', href: '/web/admin/users', icon: Users },
  { category: 'Quản trị', label: 'Phân quyền vai trò (RBAC)', href: '/web/admin/rbac', icon: Shield },
  { category: 'Quản trị', label: 'Nhật ký hoạt động (Audit Logs)', href: '/web/admin/audit-logs', icon: FileText },
  { category: 'Quản trị', label: 'Bảng điều khiển tác vụ ngầm (Worker Jobs)', href: '/web/admin/worker-jobs', icon: Cpu },
]

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const filtered = SEARCH_REGISTRY.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          navigate(filtered[selectedIndex].href)
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filtered, selectedIndex, navigate, onClose])

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Tìm kiếm nhanh hệ thống (Ctrl + K)">
      <div className="flex flex-col gap-4 font-sans max-w-lg w-full">
        <div className="relative border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900 px-3 py-2 flex items-center gap-2">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Nhập tên phân hệ, báo cáo, quản trị..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const Icon = item.icon
              const isSelected = idx === selectedIndex
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    navigate(item.href)
                    onClose()
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-sm transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-305'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isSelected ? 'text-white' : 'text-slate-400'} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {item.category}
                  </span>
                </button>
              )
            })
          ) : (
            <div className="text-center py-6 text-sm text-slate-400">
              Không tìm thấy kết quả phù hợp cho "{query}"
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-150 dark:border-slate-800 pt-3 mt-1 font-mono">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">↑↓</kbd>
            <span>để di chuyển</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">Enter</kbd>
            <span>để truy cập</span>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
