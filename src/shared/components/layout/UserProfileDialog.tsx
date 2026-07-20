import { useState } from 'react'
import { User, Shield, Building, Clock, Monitor, Settings } from 'lucide-react'

import { Dialog } from '@/shared/components/ui/Dialog'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Input'

interface UserProfileDialogProps {
  isOpen: boolean
  onClose: () => void
  userName?: string
}

export function UserProfileDialog({ isOpen, onClose, userName = 'Hoà Bùi' }: UserProfileDialogProps) {
  const [lang, setLang] = useState('vi')
  const [density, setDensity] = useState('comfortable')

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Thông tin cá nhân & Thiết lập">
      <div className="flex flex-col gap-5 font-sans text-sm max-w-md w-full">
        {/* User Card Header */}
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-150 dark:border-slate-800">
          <div className="w-16 h-16 bg-blue-600 dark:bg-blue-700 text-white rounded-full flex items-center justify-center font-bold text-xl shadow">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-150">{userName}</h3>
            <span className="text-xs text-slate-450 dark:text-slate-400 font-mono">ID: SF-00891</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-slate-800 px-1.5 py-0.5 rounded uppercase">
                <Shield size={10} />
                System Admin
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phòng ban</span>
            <span className="font-semibold text-slate-700 dark:text-slate-205 flex items-center gap-1 mt-0.5">
              <Building size={13} className="text-slate-400" />
              Công nghệ & Vận hành
            </span>
          </div>
          <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nhà máy phụ trách</span>
            <span className="font-semibold text-slate-700 dark:text-slate-205 flex items-center gap-1 mt-0.5">
              <Building size={13} className="text-slate-400" />
              HCM Plant
            </span>
          </div>
          <div className="p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 flex flex-col gap-0.5 col-span-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lần đăng nhập cuối</span>
            <span className="font-semibold text-slate-700 dark:text-slate-205 flex items-center gap-1 mt-0.5 font-mono text-xs">
              <Clock size={13} className="text-slate-400" />
              2026-07-19 22:40 (GMT+7)
            </span>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="flex flex-col gap-3.5 border-t border-slate-100 dark:border-slate-800 pt-4 mt-1">
          <h4 className="font-bold text-slate-800 dark:text-slate-150 flex items-center gap-1.5">
            <Settings size={14} className="text-slate-450" />
            Cấu hình hiển thị
          </h4>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Ngôn ngữ hiển thị (Language)</label>
            <Select value={lang} onChange={(e) => setLang(e.target.value)} className="h-9">
              <option value="vi">Tiếng Việt (Vietnamese)</option>
              <option value="en">English (Mỹ)</option>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Độ giãn bảng (Display Density)</label>
            <Select value={density} onChange={(e) => setDensity(e.target.value)} className="h-9">
              <option value="comfortable">Rộng rãi (Comfortable)</option>
              <option value="compact">Gọn gàng (Compact)</option>
            </Select>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
          <Button variant="secondary" onClick={onClose}>
            Đóng thiết lập
          </Button>
          <Button variant="primary" onClick={onClose}>
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
