import React, { ReactNode } from 'react'
import { Filter, FilterX } from 'lucide-react'
import { Button } from './Button'
import { Tooltip } from './Tooltip'
import { Input, Select } from './Input'

export interface FilterFieldOption {
  value: string
  label: string
}

export interface FilterFieldConfig {
  name: string
  type: 'text' | 'select' | 'radio'
  label?: string
  placeholder?: string
  options?: FilterFieldOption[]
}

export interface FilterBarProps {
  /** List of standard filter input configurations */
  fields?: FilterFieldConfig[]
  /** Current state values of the filter inputs */
  values?: Record<string, any>
  /** Callback when any standard filter input changes value */
  onChange?: (name: string, value: any) => void
  /** Form submission callback */
  onSubmit: (e: React.FormEvent) => void
  /** Clear filter button callback */
  onReset?: () => void
  /** Controls if the clear filters button is displayed */
  isResetActive?: boolean
  /** Any extra custom elements or special layout cases */
  expands?: ReactNode
  /** Custom children, fallback if fields are not defined */
  children?: ReactNode
  /** Extra class names for customization */
  className?: string
}

export function FilterBar({
  fields = [],
  values = {},
  onChange,
  onSubmit,
  onReset,
  isResetActive = false,
  expands,
  children,
  className = '',
}: FilterBarProps) {
  // Determine if any field has a label to select the layout style
  const hasLabels = fields.some((f) => !!f.label)

  return (
    <form
      onSubmit={onSubmit}
      className={`flex bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-[var(--color-action-primary)]/25 transition-all w-full ${
        hasLabels ? 'flex-col gap-4 p-4' : 'flex-row items-center gap-3 p-1.5 h-12'
      } ${className}`}
    >
      {/* Fields Container */}
      <div
        className={
          hasLabels
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end w-full'
            : 'flex-1 flex items-center gap-2'
        }
      >
        {fields.map((field) => {
          const val = values[field.name] ?? ''

          switch (field.type) {
            case 'select':
              return (
                <div
                  key={field.name}
                  className={`flex flex-col gap-1.5 ${hasLabels ? 'w-full' : 'w-48'}`}
                >
                  {field.label && (
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">{field.label}</span>
                  )}
                  <Select
                    value={String(val)}
                    onChange={(e) => onChange?.(field.name, e.target.value)}
                    className="h-9 text-xs w-full bg-[var(--surface-2)] border-[var(--border-default)] text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-action-primary)]"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              )

            case 'radio':
              return (
                <div key={field.name} className="flex flex-col gap-1.5 min-w-[185px]">
                  {field.label && (
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">{field.label}</span>
                  )}
                  <div className="flex items-center gap-3 h-9 text-xs">
                    {field.options?.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={field.name}
                          value={opt.value}
                          checked={val === opt.value}
                          onChange={() => onChange?.(field.name, opt.value)}
                          className="h-4 w-4 accent-[var(--color-action-primary)]"
                        />
                        <span className="text-[var(--text-primary)]">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )

            case 'text':
            default:
              return (
                <div key={field.name} className="flex-1 flex flex-col gap-1.5">
                  {field.label && (
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">{field.label}</span>
                  )}
                  <Input
                    value={String(val)}
                    onChange={(e) => onChange?.(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={
                      hasLabels
                        ? 'h-9 text-xs w-full px-2.5 bg-[var(--surface-2)] border-[var(--border-default)] text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-action-primary)]'
                        : 'h-9 text-xs w-full px-2.5 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-[var(--text-primary)]'
                    }
                  />
                </div>
              )
          }
        })}
        {/* Action Buttons inside Grid if hasLabels is true */}
        {hasLabels && (
          <div className="flex items-center gap-2 pb-[1px]">
            <Tooltip content="Áp dụng lọc">
              <button
                type="submit"
                className="!p-0 !min-h-0 !h-9 !w-9 flex items-center justify-center bg-[var(--color-action-primary)] hover:bg-[var(--color-action-primary-hover)] text-white rounded-lg shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-action-primary)] transition-colors cursor-pointer shrink-0"
                aria-label="Lọc"
              >
                <Filter size={20} className="w-5 h-5" />
              </button>
            </Tooltip>

            {isResetActive && onReset && (
              <Tooltip content="Xóa bộ lọc">
                <button
                  type="button"
                  onClick={onReset}
                  className="!p-0 !min-h-0 !h-9 !w-9 flex items-center justify-center !bg-transparent hover:!bg-[var(--surface-3)] !text-[var(--text-secondary)] hover:!text-[var(--text-primary)] !border !border-[var(--border-default)] rounded-lg shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-action-primary)] transition-colors cursor-pointer shrink-0"
                  aria-label="Xóa bộ lọc"
                >
                  <FilterX size={20} className="w-5 h-5" />
                </button>
              </Tooltip>
            )}
          </div>
        )}

        {/* Fallback to legacy children if no fields defined */}
        {fields.length === 0 && children && (
          <div className="flex-1 flex items-center">
            {children}
          </div>
        )}
      </div>

      {/* Expands / Special Case Filters Rendering */}
      {expands && hasLabels && (
        <div className="w-full border-t border-[var(--border-default)] pt-3">
          {expands}
        </div>
      )}

      {/* Inline Action Buttons for horizontal layout without labels */}
      {!hasLabels && (
        <div className="flex items-center gap-2">
          <Tooltip content="Áp dụng lọc">
            <button
              type="submit"
              className="!p-0 !min-h-0 !h-9 !w-9 flex items-center justify-center bg-[var(--color-action-primary)] hover:bg-[var(--color-action-primary-hover)] text-white rounded-lg shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-action-primary)] transition-colors cursor-pointer shrink-0"
              aria-label="Lọc"
            >
              <Filter size={20} className="w-5 h-5" />
            </button>
          </Tooltip>

          {isResetActive && onReset && (
            <Tooltip content="Xóa bộ lọc">
              <button
                type="button"
                onClick={onReset}
                className="!p-0 !min-h-0 !h-9 !w-9 flex items-center justify-center !bg-transparent hover:!bg-[var(--surface-3)] !text-[var(--text-secondary)] hover:!text-[var(--text-primary)] !border !border-[var(--border-default)] rounded-lg shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-action-primary)] transition-colors cursor-pointer shrink-0"
                aria-label="Xóa bộ lọc"
              >
                <FilterX size={20} className="w-5 h-5" />
              </button>
            </Tooltip>
          )}
        </div>
      )}
    </form>
  )
}
