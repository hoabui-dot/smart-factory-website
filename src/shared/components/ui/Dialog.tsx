import { ReactNode } from 'react'
import { X } from 'lucide-react'

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string // e.g. 'max-w-md' | 'max-w-xl'
}

export function Dialog({ isOpen, onClose, title, children, maxWidth = 'max-w-[75%]' }: DialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px]">
      <div className={`w-full ${maxWidth} bg-[var(--surface-3)] rounded-lg border border-[var(--border-strong)] shadow-lg overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-strong)]">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
          <button
            type="button"
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] focus-visible:outline-none cursor-pointer"
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
