import { ReactNode } from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './Table'
import { TablePagination } from './TablePagination'

export interface ColumnDef<T> {
  header: ReactNode
  className?: string
  cell: (row: T) => ReactNode
}

interface GenericDataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  pagination?: {
    currentPage: number
    pageSize: number
    totalItems: number
    totalPages: number
    startIndex: number
    endIndex: number
    setPage: (page: number) => void
    setPageSize: (size: number) => void
  }
  hasMore?: boolean
  onLoadMore?: () => void
  onRowClick?: (row: T) => void
  getRowClassName?: (row: T) => string
  isLoading?: boolean
}

export function GenericDataTable<T>({
  data,
  columns,
  pagination,
  hasMore,
  onLoadMore,
  onRowClick,
  getRowClassName,
  isLoading = false,
}: GenericDataTableProps<T>) {
  return (
    <div className="w-full border border-[var(--border-default)] rounded-lg bg-[var(--surface-1)] overflow-hidden shadow-sm">
      <Table containerClassName="relative w-full overflow-auto">
        <TableHeader>
          <TableRow className="bg-[var(--surface-2)] border-b border-[var(--border-default)] pointer-events-none hover:bg-transparent">
            {columns.map((col, index) => (
              <TableHead key={index} className={`text-[var(--text-secondary)] ${col.className || ''}`}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={rowIndex} className="pointer-events-none hover:bg-transparent border-b border-[var(--border-default)]">
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <div className="h-4 bg-[var(--surface-2)] rounded animate-pulse w-[75%]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow className="pointer-events-none hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-48 text-center bg-[var(--surface-1)]">
                <div className="flex flex-col items-center justify-center gap-2 p-6">
                  <div className="text-[var(--text-muted)] opacity-60">
                    <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">Không có dữ liệu</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Không tìm thấy bản ghi nào khớp với điều kiện tìm kiếm.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => {
              const rowClass = getRowClassName ? getRowClassName(row) : ''
              return (
                <TableRow
                  key={rowIndex}
                  className={`border-b border-[var(--border-default)] transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${rowClass || 'hover:bg-[var(--surface-2)]'}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col, colIndex) => (
                    <TableCell key={colIndex}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {pagination && !isLoading && (
        <TablePagination
          {...pagination}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
        />
      )}
    </div>
  )
}
