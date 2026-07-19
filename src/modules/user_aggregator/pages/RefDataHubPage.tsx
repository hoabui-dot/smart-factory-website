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

import './SharedAggregatePages.css'

function stateMessage(state: string): string {
  return (
    {
      loading: 'Đang tải…',
      empty: 'Không có dòng reference data.',
      'no-result': 'Không có kết quả khớp.',
      'permission-denied': 'Bạn không có quyền xem REFDATA Hub.',
      error: 'Không tải được dữ liệu.',
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
    <section className="shared-agg" aria-labelledby="refdata-title">
      <header className="shared-agg__header">
        <div>
          <p className="shared-agg__eyebrow">WEB-SHARED-01E-REFDATA-HUB · `/web/admin/ref-data`</p>
          <h2 id="refdata-title">Reference Data Hub</h2>
          <p className="shared-agg__lead">
            Registry allowlist + soft-retire facade. Mutations gated by server{' '}
            <code>capabilities</code>; mọi write cần <code>updated_reason</code>.
          </p>
        </div>
        <Link to="/admin">Về Admin</Link>
      </header>

      {registryQuery.isLoading ? (
        <p className="shared-agg__state" role="status">
          Đang tải registry…
        </p>
      ) : registryQuery.isError ? (
        <p className="shared-agg__state" role="alert">
          Không tải được registry
          {registryQuery.error instanceof ApiError
            ? ` (${registryQuery.error.code})`
            : ''}
        </p>
      ) : tables.length === 0 ? (
        <p className="shared-agg__state" role="status">
          Không có bảng reference nào trong scope quyền của bạn.
        </p>
      ) : (
        <>
          <form
            className="shared-agg__toolbar"
            onSubmit={(ev) => {
              ev.preventDefault()
              setCursor(undefined)
              setQ(qInput.trim())
            }}
          >
            <label>
              <span>Table</span>
              <select
                value={resolvedTableKey}
                onChange={(e) => {
                  setTableKey(e.target.value)
                  setCursor(undefined)
                  setSelected(null)
                  setUsageText(null)
                }}
              >
                {tables.map((t) => (
                  <option key={t.tableKey} value={t.tableKey}>
                    {t.tableKey} ({t.sourceModule})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Tìm code/label</span>
              <input value={qInput} onChange={(e) => setQInput(e.target.value)} />
            </label>
            <label>
              <span>Include inactive</span>
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => {
                  setIncludeInactive(e.target.checked)
                  setCursor(undefined)
                }}
              />
            </label>
            <button type="submit">Tìm</button>
            <button type="button" onClick={() => rowsQuery.refetch()} disabled={rowsQuery.isFetching}>
              Làm mới
            </button>
          </form>

          {activeTable ? (
            <p className="shared-agg__muted">
              Editable: {activeTable.editableFields.join(', ') || '—'} · Caps: create=
              {String(activeTable.canCreate)} update={String(activeTable.canUpdate)} retire=
              {String(activeTable.canRetire)}
            </p>
          ) : null}

          {rowsState !== 'ready' ? (
            <p
              className="shared-agg__state"
              role={rowsState === 'error' || rowsState === 'permission-denied' ? 'alert' : 'status'}
            >
              {stateMessage(rowsState)}
              {rowsErr ? ` (${rowsErr.code})` : ''}
            </p>
          ) : (
            <div className="shared-agg__list">
              {rowViews.map((row) => {
                const raw = rowsQuery.data?.items.find((i) => i.code === row.code)
                return (
                  <article className="shared-agg__item" key={row.code}>
                    <h4>
                      {row.code} — {row.label}
                    </h4>
                    <p className="shared-agg__muted">
                      {row.isActive ? 'ACTIVE' : 'INACTIVE'} · {row.fieldSummary}
                    </p>
                    <div className="shared-agg__actions">
                      <button
                        type="button"
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
                        Edit
                      </button>
                      <button
                        type="button"
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
                        Soft-retire…
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {rowsQuery.data?.page.has_more ? (
            <button
              type="button"
              onClick={() => {
                const next = rowsQuery.data?.page.next_cursor
                if (next) setCursor(next)
              }}
            >
              Trang tiếp theo
            </button>
          ) : null}

          {activeTable?.canCreate ? (
            <form
              className="shared-agg__dialog"
              onSubmit={(ev) => {
                ev.preventDefault()
                createMut.mutate()
              }}
            >
              <h3>Create row</h3>
              <label>
                <span>Code</span>
                <input value={createCode} onChange={(e) => setCreateCode(e.target.value)} required />
              </label>
              <label>
                <span>Fields JSON</span>
                <textarea
                  value={createFieldJson}
                  onChange={(e) => setCreateFieldJson(e.target.value)}
                  required
                />
              </label>
              <label>
                <span>updated_reason</span>
                <input value={reason} onChange={(e) => setReason(e.target.value)} required />
              </label>
              <button type="submit" disabled={!reason.trim() || !createCode.trim() || createMut.isPending}>
                {createMut.isPending ? 'Đang tạo…' : 'Create'}
              </button>
            </form>
          ) : null}

          {selected && usageText ? (
            <div className="shared-agg__dialog" role="dialog" aria-labelledby="retire-title">
              <h3 id="retire-title">Soft-retire {selected.code}</h3>
              <p className="shared-agg__muted">{usageText}</p>
              <label>
                <span>updated_reason</span>
                <input value={reason} onChange={(e) => setReason(e.target.value)} required />
              </label>
              <div className="shared-agg__actions">
                <button
                  type="button"
                  disabled={!reason.trim() || retireMut.isPending}
                  onClick={() => retireMut.mutate()}
                >
                  {retireMut.isPending ? 'Đang retire…' : 'Confirm soft-retire'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null)
                    setUsageText(null)
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : null}

          {selected && !usageText && activeTable?.canUpdate ? (
            <form
              className="shared-agg__dialog"
              onSubmit={(ev) => {
                ev.preventDefault()
                updateMut.mutate()
              }}
            >
              <h3>Update {selected.code}</h3>
              <label>
                <span>Fields JSON</span>
                <textarea value={editFieldJson} onChange={(e) => setEditFieldJson(e.target.value)} />
              </label>
              <label>
                <span>updated_reason</span>
                <input value={reason} onChange={(e) => setReason(e.target.value)} required />
              </label>
              <div className="shared-agg__actions">
                <button type="submit" disabled={!reason.trim() || updateMut.isPending}>
                  {updateMut.isPending ? 'Đang lưu…' : 'Save'}
                </button>
                <button type="button" onClick={() => setSelected(null)}>
                  Hủy
                </button>
              </div>
            </form>
          ) : null}

          {actionError ? (
            <p className="shared-agg__state" role="alert">
              {actionError}
            </p>
          ) : null}
        </>
      )}
    </section>
  )
}
