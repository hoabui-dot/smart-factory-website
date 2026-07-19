import { ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'

export type BreadcrumbItem = {
  label: string
  href?: string
}

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[]
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ breadcrumbs, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 pb-5 border-b border-slate-200 dark:border-slate-800 font-sans">
      {/* Breadcrumb */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1
            return (
              <div key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight size={12} className="text-slate-400 dark:text-slate-600" />}
                {isLast ? (
                  <span className="font-semibold text-slate-800 dark:text-slate-200" aria-current="page">
                    {crumb.label}
                  </span>
                ) : crumb.href ? (
                  <Link
                    to={crumb.href}
                    className="hover:underline text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </div>
            )
          })}
        </nav>
      )}

      {/* Main Title & Actions Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-1">
        <div className="flex flex-col">
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
