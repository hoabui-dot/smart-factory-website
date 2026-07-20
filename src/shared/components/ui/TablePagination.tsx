import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Select } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'

export interface TablePaginationProps {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
  startIndex: number
  endIndex: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  hasMore?: boolean
  onLoadMore?: () => void
  sticky?: boolean
}

export function TablePagination({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  setPage,
  setPageSize,
  hasMore = false,
  onLoadMore,
  sticky = false,
}: TablePaginationProps) {
  const showFirstLast = totalPages > 20

  return (
    <div
      className={`table-pagination flex flex-col w-full border-t border-[var(--border-default)] bg-[var(--surface-1)] font-sans ${
        sticky ? 'sticky bottom-0 z-10 shadow-md' : ''
      }`}
    >
      {/* Optional Load More Segment */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center p-2 bg-[var(--surface-2)] border-b border-[var(--border-default)]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onLoadMore}
            className="text-xs h-8"
          >
            Nạp thêm từ Server
          </Button>
        </div>
      )}

      {/* Main Pagination Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full h-auto md:h-14 px-5 py-3 md:py-0 text-[13px] font-medium text-[var(--text-secondary)]">
        {/* Left Section: Records Info */}
        <div className="flex items-center">
          <span>
            Hiển thị{' '}
            <strong className="font-semibold text-[var(--text-primary)]">
              {startIndex}–{endIndex}
            </strong>
            {' '}/{' '}
            <strong className="font-semibold text-[var(--text-primary)]">
              {totalItems}
            </strong>
            {' '}bản ghi
          </span>
        </div>

        {/* Middle & Right Section Wrapper */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Middle Section: Rows Selection */}
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)]">Số dòng:</span>
            <Select
              value={pageSize}
              onChange={(e: any) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              aria-label="Rows per page"
              className="h-8 w-20 px-2 text-xs py-0.5 bg-[var(--surface-2)] border-[var(--border-default)] text-[var(--text-primary)]"
              direction="up"
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
                className="flex items-center justify-center h-8 w-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
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
              className="flex items-center justify-center h-8 w-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              title="Previous Page"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-2 text-[var(--text-secondary)]">
              Trang{' '}
              <strong className="font-semibold text-[var(--color-action-primary)]">
                {currentPage}
              </strong>
              {' '}/{' '}
              <strong className="font-semibold text-[var(--text-primary)]">
                {totalPages}
              </strong>
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="flex items-center justify-center h-8 w-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
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
                className="flex items-center justify-center h-8 w-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                title="Last Page"
                aria-label="Last page"
              >
                <ChevronsRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
