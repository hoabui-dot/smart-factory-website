import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Select } from '@/shared/components/ui/Input'
import './DataTablePagination.css'

interface DataTablePaginationProps {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
  startIndex: number
  endIndex: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
}

export function DataTablePagination({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  setPage,
  setPageSize,
}: DataTablePaginationProps) {
  const showFirstLast = totalPages > 20

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full h-auto md:h-14 px-5 py-3 md:py-0 border-t border-slate-200 dark:border-slate-800 text-[13px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-transparent font-sans">
      
      {/* Left Section: Records Info */}
      <div className="flex items-center">
        <span>
          <strong className="font-semibold text-slate-800 dark:text-slate-200">{startIndex}–{endIndex}</strong>
          {' '}/{' '}
          <strong className="font-semibold text-slate-800 dark:text-slate-200">{totalItems}</strong>
          {' '}bản ghi
        </span>
      </div>

      {/* Middle & Right Section Wrapper */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-between md:justify-end">
        
        {/* Middle Section: Rows Selection */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500">Hiển thị</span>
          <Select
            value={pageSize}
            onChange={(e: any) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            aria-label="Rows per page"
            className="h-9 w-20 px-2 text-xs py-1"
          >
            {[10, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </div>

        {/* Right Section: Pagination Buttons */}
        <div className="flex items-center gap-1.5">
          {showFirstLast && (
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage(1)}
              className="flex items-center justify-center h-9 w-9 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              title="First Page"
              aria-label="First page"
            >
              <ChevronsLeft size={16} />
            </button>
          )}

          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            title="Previous Page"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="px-2 text-slate-500 dark:text-slate-400">
            Trang{' '}
            <strong className="font-semibold text-blue-600 dark:text-blue-400">{currentPage}</strong>
            {' '}/{' '}
            <strong className="font-semibold text-slate-850 dark:text-slate-200">{totalPages}</strong>
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            title="Next Page"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>

          {showFirstLast && (
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(totalPages)}
              className="flex items-center justify-center h-9 w-9 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              title="Last Page"
              aria-label="Last page"
            >
              <ChevronsRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
