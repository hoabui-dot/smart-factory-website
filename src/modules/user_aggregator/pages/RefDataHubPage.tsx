import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  createRefDataRow,
  getRefDataUsage,
  listRefDataRegistry,
  listRefDataRows,
  retireRefDataRow,
  updateRefDataRow,
  type RefDataRow,
} from '../api/refDataApi'
import {
  projectRefDataRow,
  projectRegistryEntry,
  resolveRefDataState,
} from '../lib/refDataProjection'

// Import Tailwind Shadcn UI & Layout components
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Input, Select } from '@/shared/components/ui/Input'
import { Badge } from '@/shared/components/ui/Badge'
import { Dialog } from '@/shared/components/ui/Dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/shared/components/ui/Table'
import {
  Database,
  Search,
  RefreshCw,
  PlusCircle,
  Edit2,
  Trash2,
  AlertCircle,
  FileText,
  HelpCircle,
  Save,
  ChevronRight,
} from 'lucide-react'

import './SharedAggregatePages.css'

function stateMessage(state: string): string {
  return (
    {
      loading: 'Đang tải dòng reference data…',
      empty: 'Không có dòng reference data.',
      'no-result': 'Không có kết quả khớp bộ lọc.',
      'permission-denied': 'Bạn không có quyền xem REFDATA Hub.',
      error: 'Không tải được dữ liệu reference data.',
    }[state] ?? ''
  )
}

export function RefDataHubPage() {
  const qc = useQueryClient()
  const [tableKey, setTableKey] = useState<string>('')
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [includeInactive, setIncludeInactive] = useState(false)
  const [selected, setSelected] = useState<RefDataRow | null>(null)
  const [reason, setReason] = useState('')
  const [createCode, setCreateCode] = useState('')
  const [createFieldJson, setCreateFieldJson] = useState('{}')
  const [editFieldJson, setEditFieldJson] = useState('{}')
  const [usageText, setUsageText] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const registryQuery = useQuery({
    queryKey: ['shared01e', 'registry'],
    queryFn: listRefDataRegistry,
  })
  const tables = useMemo(
    () => (registryQuery.data ?? []).map(projectRegistryEntry),
    [registryQuery.data],
  )
  const activeTable = tables.find((t) => t.tableKey === tableKey) ?? tables[0] ?? null
  const resolvedTableKey = activeTable?.tableKey ?? ''

  const rowsQuery = useQuery({
    queryKey: ['shared01e', 'rows', resolvedTableKey, q, cursor, includeInactive],
    queryFn: () =>
      listRefDataRows(resolvedTableKey, {
        q: q || undefined,
        cursor,
        limit: 50,
        include_inactive: includeInactive,
      }),
    enabled: Boolean(resolvedTableKey),
  })

  const rowsErr = rowsQuery.error instanceof ApiError ? rowsQuery.error : null
  const rowsState = resolveRefDataState(
    rowsQuery.isLoading ? 'loading' : rowsQuery.isError ? 'error' : 'success',
    rowsQuery.data?.items.length ?? 0,
    Boolean(q),
    rowsErr?.code ?? null,
  )
  const rowViews = (rowsQuery.data?.items ?? []).map(projectRefDataRow)

  const invalidateRows = () =>
    qc.invalidateQueries({ queryKey: ['shared01e', 'rows', resolvedTableKey] })

  const createMut = useMutation({
    mutationFn: () => {
      if (!activeTable) throw new Error('no table')
      const fields = JSON.parse(createFieldJson) as Record<string, unknown>
      return createRefDataRow(activeTable.tableKey, {
        code: createCode.trim(),
        fields,
        updated_reason: reason.trim(),
      })
    },
    onSuccess: async () => {
      setCreateCode('')
      setCreateFieldJson('{}')
      setReason('')
      setActionError(null)
      await invalidateRows()
    },
    onError: (err) => {
      const apiErr = err instanceof ApiError ? err : null
      setActionError(apiErr ? `${apiErr.code}: ${apiErr.message}` : 'Create failed')
    },
  })

  const updateMut = useMutation({
    mutationFn: () => {
      if (!activeTable || !selected) throw new Error('no row')
      const fields = JSON.parse(editFieldJson) as Record<string, unknown>
      return updateRefDataRow(activeTable.tableKey, selected.code, {
        fields,
        updated_reason: reason.trim(),
        row_version: selected.row_version,
      })
    },
    onSuccess: async () => {
      setSelected(null)
      setReason('')
      setActionError(null)
      await invalidateRows()
    },
    onError: (err) => {
      const apiErr = err instanceof ApiError ? err : null
      setActionError(apiErr ? `${apiErr.code}: ${apiErr.message}` : 'Update failed')
      void invalidateRows()
    },
  })

  const retireMut = useMutation({
    mutationFn: () => {
      if (!activeTable || !selected) throw new Error('no row')
      return retireRefDataRow(activeTable.tableKey, selected.code, {
        updated_reason: reason.trim(),
      })
    },
    onSuccess: async () => {
      setSelected(null)
      setUsageText(null)
      setReason('')
      setActionError(null)
      await invalidateRows()
    },
    onError: (err) => {
      const apiErr = err instanceof ApiError ? err : null
      setActionError(apiErr ? `${apiErr.code}: ${apiErr.message}` : 'Retire failed')
      void invalidateRows()
    },
  })

  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Quản trị', href: '/admin' },
          { label: 'Reference Data Hub' },
        ]}
        title="Reference Data Hub"
        subtitle="Hệ thống quản lý registry dữ liệu dùng chung (Reference Data allowlist) và hỗ trợ soft-retire."
      />

      {registryQuery.isLoading && <div className="text-sm text-slate-400">Đang tải registry dữ liệu…</div>}
      {registryQuery.isError && (
        <div className="p-3.5 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-sm" role="alert">
          Không tải được registry dữ liệu
          {registryQuery.error instanceof ApiError ? ` (${registryQuery.error.code})` : ''}
        </div>
      )}

      {tables.length === 0 && !registryQuery.isLoading && !registryQuery.isError && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-450 text-center">
          Không tìm thấy bảng reference data nào thuộc phạm vi quyền của bạn.
        </div>
      )}

      {tables.length > 0 && (
        <div className="flex flex-col gap-6">
          
          {/* Toolbar Filters Panel */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Bảng dữ liệu (Table)</span>
                <Select
                  value={resolvedTableKey}
                  onChange={(e) => {
                    setTableKey(e.target.value)
                    setCursor(undefined)
                    setSelected(null)
                    setUsageText(null)
                  }}
                  className="h-9"
                >
                  {tables.map((t) => (
                    <option key={t.tableKey} value={t.tableKey}>
                      {t.tableKey} ({t.sourceModule})
                    </option>
                  ))}
                </Select>
              </div>
              <form
                className="flex flex-col gap-1 md:col-span-2"
                onSubmit={(ev) => {
                  ev.preventDefault()
                  setCursor(undefined)
                  setQ(qInput.trim())
                }}
              >
                <span className="text-xs font-semibold text-slate-400">Tìm kiếm theo mã/nhãn (q)</span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      value={qInput}
                      onChange={(e) => setQInput(e.target.value)}
                      placeholder="Nhập từ khóa tìm kiếm..."
                      className="pl-8 h-9"
                    />
                  </div>
                  <Button type="submit" size="sm" className="h-9 px-4">
                    Tìm
                  </Button>
                </div>
              </form>
            </div>

            <div className="flex items-center gap-4 h-9 pb-1.5 md:pb-0">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-655 dark:text-slate-300">
                <input
                  type="checkbox"
                  className="rounded border-slate-350 dark:border-slate-800 cursor-pointer"
                  checked={includeInactive}
                  onChange={(e) => {
                    setIncludeInactive(e.target.checked)
                    setCursor(undefined)
                  }}
                />
                <span>Bao gồm bản ghi inactive</span>
              </label>

              <Button
                variant="secondary"
                size="sm"
                className="h-9 gap-1"
                onClick={() => rowsQuery.refetch()}
                disabled={rowsQuery.isFetching}
              >
                <RefreshCw size={14} className={rowsQuery.isFetching ? 'animate-spin' : ''} />
                Làm mới
              </Button>
            </div>
          </div>

          {activeTable && (
            <div className="px-1 text-xs text-slate-450 flex flex-wrap gap-x-4 gap-y-1">
              <span>Trường có thể sửa: <strong className="font-semibold text-slate-700 dark:text-slate-300">{activeTable.editableFields.join(', ') || '—'}</strong></span>
              <span>Quyền tác vụ: <strong className="font-semibold text-slate-700 dark:text-slate-300">create={String(activeTable.canCreate)} · update={String(activeTable.canUpdate)} · retire={String(activeTable.canRetire)}</strong></span>
            </div>
          )}

          {actionError && (
            <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-200 text-xs flex items-center gap-2" role="alert">
              <AlertCircle size={14} />
              <span>{actionError}</span>
            </div>
          )}

          {rowsState !== 'ready' ? (
            <div
              className={`p-6 text-center text-sm border rounded-lg ${
                rowsState === 'error' || rowsState === 'permission-denied'
                  ? 'bg-red-50 dark:bg-red-950/20 text-red-655 border-red-200'
                  : 'bg-slate-50 dark:bg-slate-900/30 text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
              role={rowsState === 'error' || rowsState === 'permission-denied' ? 'alert' : 'status'}
            >
              <p>{stateMessage(rowsState)}</p>
              {rowsErr && (
                <p className="mt-2 text-xs font-mono text-red-600 bg-red-100 dark:bg-red-900/30 py-0.5 px-1.5 rounded inline-block">
                  {rowsErr.code}
                </p>
              )}
            </div>
          ) : (
            /* Reference Data Rows Table */
            <div className="w-full border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <Table containerClassName="relative w-full overflow-auto">
                <TableHeader>
                  <TableRow className="pointer-events-none hover:bg-transparent">
                    <TableHead>Mã (Code)</TableHead>
                    <TableHead>Tên nhãn (Label)</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thuộc tính (Fields Summary)</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rowViews.map((row) => {
                    const raw = rowsQuery.data?.items.find((i) => i.code === row.code)
                    return (
                      <TableRow key={row.code} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{row.code}</TableCell>
                        <TableCell className="font-medium text-slate-800 dark:text-slate-200">{row.label}</TableCell>
                        <TableCell>
                          <Badge variant={row.isActive ? 'active' : 'inactive'}>
                            {row.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 max-w-[400px] truncate" title={row.fieldSummary}>
                          {row.fieldSummary}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-blue-650 hover:bg-blue-50/50"
                              disabled={!activeTable?.canUpdate || !raw}
                              onClick={() => {
                                if (!raw) return
                                setSelected(raw)
                                setEditFieldJson(JSON.stringify(raw.fields ?? {}, null, 2))
                                setReason('')
                                setUsageText(null)
                                setActionError(null)
                              }}
                            >
                              <Edit2 size={13} />
                              Sửa
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-red-650 hover:bg-red-50/50"
                              disabled={!activeTable?.canRetire || !raw || !row.isActive}
                              onClick={async () => {
                                if (!raw || !activeTable) return
                                setSelected(raw)
                                setReason('')
                                setActionError(null)
                                try {
                                  const usage = await getRefDataUsage(activeTable.tableKey, raw.code)
                                  setUsageText(
                                    `FK refs total=${usage.total_count}; groups=${usage.usage_groups
                                      .map((g) => `${g.group_label}:${g.reference_count}`)
                                      .join(', ') || 'none'}`,
                                  )
                                } catch (err) {
                                  const apiErr = err instanceof ApiError ? err : null
                                  setUsageText(null)
                                  setActionError(
                                    apiErr ? `${apiErr.code}: ${apiErr.message}` : 'Usage lookup failed',
                                  )
                                }
                              }}
                            >
                              <Trash2 size={13} />
                              Retire
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {rowsQuery.data?.page.has_more && (
                <div className="flex justify-center p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1.5 px-6"
                    onClick={() => {
                      const next = rowsQuery.data?.page.next_cursor
                      if (next) setCursor(next)
                    }}
                  >
                    Xem trang kế tiếp
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Create Row Card Panel */}
          {activeTable?.canCreate && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 mt-2">
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-250 flex items-center gap-2">
                <PlusCircle size={16} className="text-blue-600" />
                Tạo dòng Reference mới (Create Row)
              </h3>
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                onSubmit={(ev) => {
                  ev.preventDefault()
                  createMut.mutate()
                }}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-400">Mã code (Unique)</span>
                    <Input
                      value={createCode}
                      onChange={(e) => setCreateCode(e.target.value)}
                      required
                      placeholder="Nhập mã code dùng chung..."
                      className="h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-400">Lý do cập nhật (updated_reason)</span>
                    <Input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      placeholder="Bắt buộc ghi nhận lý do..."
                      className="h-9"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!reason.trim() || !createCode.trim() || createMut.isPending}
                    className="h-9 mt-1.5"
                  >
                    {createMut.isPending ? 'Đang tạo…' : 'Thêm dòng mới'}
                  </Button>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-400">Cấu hình trường JSON (Fields JSON)</span>
                  <textarea
                    value={createFieldJson}
                    onChange={(e) => setCreateFieldJson(e.target.value)}
                    required
                    rows={4}
                    className="w-full text-xs font-mono p-2.5 border border-slate-350 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* EDIT ROW DIALOG OVERLAY */}
      <Dialog
        isOpen={!!selected && !usageText && activeTable?.canUpdate}
        onClose={() => setSelected(null)}
        title={selected ? `Cập nhật: ${selected.code}` : 'Sửa dòng Reference'}
      >
        {selected && (
          <form
            className="flex flex-col gap-4 font-sans text-sm"
            onSubmit={(ev) => {
              ev.preventDefault()
              updateMut.mutate()
            }}
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 block">Cấu hình trường JSON (Fields JSON)</span>
              <textarea
                value={editFieldJson}
                onChange={(e) => setEditFieldJson(e.target.value)}
                rows={6}
                className="w-full text-xs font-mono p-2.5 border border-slate-350 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-slate-100 font-semibold"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 block">Lý do thay đổi (updated_reason)</span>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                placeholder="Bắt buộc ghi lý do..."
                className="h-9"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
              <Button variant="secondary" type="button" onClick={() => setSelected(null)}>
                Hủy
              </Button>
              <Button type="submit" disabled={!reason.trim() || updateMut.isPending} className="gap-1.5">
                <Save size={14} />
                {updateMut.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* SOFT-RETIRE ROW DIALOG OVERLAY */}
      <Dialog
        isOpen={!!selected && !!usageText}
        onClose={() => {
          setSelected(null)
          setUsageText(null)
        }}
        title={selected ? `Soft-retire: ${selected.code}` : 'Retire dòng Reference'}
      >
        {selected && usageText && (
          <div className="flex flex-col gap-4 font-sans text-sm">
            <div className="p-3.5 rounded-lg border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10 text-slate-800 dark:text-slate-200 text-xs leading-relaxed flex items-start gap-2">
              <HelpCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Cảnh báo quan hệ khóa ngoại (Foreign Keys):</p>
                <p className="font-mono text-[11px] leading-normal">{usageText}</p>
              </div>
            </div>

            <p className="text-slate-655 dark:text-slate-350">
              Soft-retire sẽ chuyển đổi trạng thái của bản ghi dữ liệu dùng chung này sang <strong>INACTIVE</strong>. Hãy nhập lý do thực hiện.
            </p>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400">Lý do retire (updated_reason)</span>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                placeholder="Nhập lý do soft-retire..."
                className="h-9"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setSelected(null)
                  setUsageText(null)
                }}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                disabled={!reason.trim() || retireMut.isPending}
                onClick={() => retireMut.mutate()}
              >
                {retireMut.isPending ? 'Đang retire…' : 'Xác nhận soft-retire'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </section>
  )
}
