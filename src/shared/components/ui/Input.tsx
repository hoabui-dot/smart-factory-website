import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex h-10 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-blue-600 ${className}`}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  value?: string | number
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void
  placeholder?: string
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ className = '', children, value, onChange, disabled, placeholder = 'Chọn...', ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Parse options from children (expecting option tags)
    const options = React.useMemo(() => {
      return React.Children.toArray(children)
        .filter((child) => React.isValidElement(child) && child.type === 'option')
        .map((child) => {
          const el = child as React.ReactElement<React.HTMLProps<HTMLOptionElement>>
          return {
            value: String(el.props.value ?? ''),
            label: String(el.props.children ?? el.props.value ?? ''),
          }
        })
    }, [children])

    const selectedOption = options.find((opt) => String(opt.value) === String(value ?? ''))

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (val: string) => {
      if (disabled) return
      if (onChange) {
        onChange({
          target: {
            value: val,
          },
        } as any)
      }
      setIsOpen(false)
    }

    return (
      <div ref={containerRef} className="relative w-full font-sans">
        <button
          ref={ref}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-10 w-full items-center justify-between rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 text-left cursor-pointer ${className}`}
          {...(props as any)}
        >
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronDown size={16} className="text-slate-400 dark:text-slate-500 transition-transform duration-200" />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded border border-slate-200 bg-white dark:bg-slate-900 p-1 text-slate-900 dark:text-slate-100 shadow-lg focus:outline-none animate-in fade-in-50 slide-in-from-top-1 dark:border-slate-800">
            {options.map((opt) => {
              const isSelected = String(opt.value) === String(value ?? '')
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors ${
                    isSelected ? 'bg-slate-50 dark:bg-slate-800 font-semibold' : ''
                  }`}
                >
                  {isSelected && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <Check size={14} className="text-slate-900 dark:text-slate-100" />
                    </span>
                  )}
                  <span>{opt.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`flex min-h-[80px] w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-blue-600 ${className}`}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'
