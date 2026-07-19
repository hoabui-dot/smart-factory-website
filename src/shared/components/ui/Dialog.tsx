import { ReactNode } from 'react'
import { X } from 'lucide-react'

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string // e.g. 'max-w-md' | 'max-w-xl'
}

export function Dialog({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }: DialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px]">
      <div className={`w-full ${maxWidth} bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-500 focus-visible:outline-none cursor-pointer"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[85vh] flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
