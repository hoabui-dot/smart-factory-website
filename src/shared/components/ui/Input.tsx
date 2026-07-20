import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex h-10 w-full rounded border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-primary)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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
  direction?: 'up' | 'down'
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ className = '', children, value, onChange, disabled, placeholder = 'Chọn...', direction, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [computedDirection, setComputedDirection] = useState<'up' | 'down'>('down')
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

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
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node) &&
          menuRef.current &&
          !menuRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
      if (!isOpen) return

      const updateCoords = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          const scrollY = window.scrollY
          const scrollX = window.scrollX
          
          setCoords({
            top: rect.top + scrollY,
            left: rect.left + scrollX,
            width: rect.width,
            height: rect.height,
          })

          const spaceBelow = window.innerHeight - rect.bottom
          const dropdownHeight = 260
          let directionToUse = direction
          if (!directionToUse) {
            if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
              directionToUse = 'up'
            } else {
              directionToUse = 'down'
            }
          }
          setComputedDirection(directionToUse)
        }
      }

      updateCoords()
      window.addEventListener('resize', updateCoords)
      window.addEventListener('scroll', updateCoords, { capture: true })
      return () => {
        window.removeEventListener('resize', updateCoords)
        window.removeEventListener('scroll', updateCoords, { capture: true })
      }
    }, [isOpen, direction])

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
          className={`select-trigger flex h-10 w-full items-center justify-between rounded border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-action-primary)] disabled:cursor-not-allowed disabled:opacity-50 text-left cursor-pointer ${className}`}
          {...(props as any)}
        >
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronDown size={16} className="text-[var(--text-muted)] transition-transform duration-200" />
        </button>

        {isOpen && typeof document !== 'undefined' && createPortal(
          <div
            style={{
              position: 'absolute',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              height: coords.height,
              pointerEvents: 'none',
              zIndex: 99999,
            }}
          >
            <div
              ref={menuRef}
              style={{ pointerEvents: 'auto' }}
              className={`absolute w-full z-50 ${computedDirection === 'up' ? 'bottom-full mb-1 animate-in fade-in-50 slide-in-from-bottom-1' : 'top-full mt-1 animate-in fade-in-50 slide-in-from-top-1'} max-h-60 overflow-auto rounded border border-[var(--border-strong)] bg-[var(--surface-3)] p-1 text-[var(--text-primary)] shadow-lg focus:outline-none`}
            >
              {options.map((opt) => {
                const isSelected = String(opt.value) === String(value ?? '')
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-[var(--surface-2)] transition-colors ${
                      isSelected ? 'bg-[var(--surface-2)] font-semibold' : ''
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        <Check size={14} className="text-[var(--text-primary)]" />
                      </span>
                    )}
                    <span>{opt.label}</span>
                  </div>
                )
              })}
            </div>
          </div>,
          document.body
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
        className={`flex min-h-[80px] w-full rounded border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-primary)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'
