import React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'active' | 'inactive' | 'default'
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const baseStyle = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2'

  const variants = {
    default: 'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80',
    active: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    inactive: 'border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }

  return <div className={`${baseStyle} ${variants[variant]} ${className}`} {...props} />
}
