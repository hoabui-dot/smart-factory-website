import { useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  decideApproval,
  globalSearch,
  listApprovalInbox,
  type ApprovalItem,
} from '../api/approvalInboxApi'
import {
  projectApprovalItem,
  projectSearchHit,
  resolveApprovalListState,
} from '../lib/approvalInboxProjection'

// Import Shadcn & Layout components
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'

import './SharedAggregatePages.css'

function stateMessage(state: string): string {
  return (
    {
      loading: 'Đang tải…',
      empty: 'Không có phê duyệt đang chờ.',
      'no-result': 'Không có kết quả khớp từ khóa.',
      'permission-denied': 'Bạn không có quyền xem Approval Inbox.',
      error: 'Không tải được dữ liệu. Vui lòng thử lại.',
    }[state] ?? ''
  )
}

export function ApprovalInboxPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'inbox' | 'search'>('inbox')
  const [inboxQInput, setInboxQInput] = useState('')
  const [inboxQ, setInboxQ] = useState('')
  const [inboxCursor, setInboxCursor] = useState<string | undefined>()
  const [searchInput, setSearchInput] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [searchCursor, setSearchCursor] = useState<string | undefined>()
  const [decisionTarget, setDecisionTarget] = useState<ApprovalItem | null>(null)
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE')
  const [reason, setReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const inboxQuery = useQuery({
    queryKey: ['shared01d', 'approval-inbox', inboxQ, inboxCursor],
    queryFn: () => listApprovalInbox({ q: inboxQ || undefined, cursor: inboxCursor, limit: 50 }),
  })
  const searchQuery = useQuery({
    queryKey: ['shared01d', 'search', searchQ, searchCursor],
    queryFn: () => globalSearch({ q: searchQ, cursor: searchCursor, limit: 50 }),
    enabled: tab === 'search' && searchQ.trim().length > 0,
  })

  const decideMut = useMutation({
    mutationFn: () => {
      if (!decisionTarget) throw new Error('missing target')
      return decideApproval(decisionTarget.approval_key, {
        decision,
        reason: reason.trim(),
        source_version: decisionTarget.source_version,
      })
    },
    onSuccess: async () => {
      setDecisionTarget(null)
      setReason('')
      setActionError(null)
      await qc.invalidateQueries({ queryKey: ['shared01d', 'approval-inbox'] })
    },
    onError: (err) => {
      const apiErr = err instanceof ApiError ? err : null
      setActionError(apiErr ? `${apiErr.code}: ${apiErr.message}` : 'Decide failed')
      void qc.invalidateQueries({ queryKey: ['shared01d', 'approval-inbox'] })
    },
  })

  const inboxErr = inboxQuery.error instanceof ApiError ? inboxQuery.error : null
  const inboxState = resolveApprovalListState(
    inboxQuery.isLoading ? 'loading' : inboxQuery.isError ? 'error' : 'success',
    inboxQuery.data?.items.length ?? 0,
    Boolean(inboxQ),
    inboxErr?.code ?? null,
  )
  const inboxRows = (inboxQuery.data?.items ?? []).map(projectApprovalItem)

  const searchErr = searchQuery.error instanceof ApiError ? searchQuery.error : null
  const searchState =
    !searchQ.trim()
      ? 'empty'
      : resolveApprovalListState(
          searchQuery.isLoading ? 'loading' : searchQuery.isError ? 'error' : 'success',
          searchQuery.data?.items.length ?? 0,
          true,
          searchErr?.code ?? null,
        )
  const searchRows = (searchQuery.data?.items ?? []).map(projectSearchHit)

  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Kênh phê duyệt' },
        ]}
        title="Danh sách phê duyệt"
        subtitle="Duyệt hoặc từ chối các yêu cầu thay đổi, tài liệu chất lượng và lệnh sản xuất."
      />

      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'inbox'}
          className={`pb-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tab === 'inbox'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-355'
          }`}
          onClick={() => setTab('inbox')}
        >
          Hộp thư phê duyệt
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'search'}
          className={`pb-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tab === 'search'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-355'
          }`}
          onClick={() => setTab('search')}
        >
          Tìm kiếm toàn cầu
        </button>
      </div>

      {tab === 'inbox' ? (
        <>
          <form
            className="flex items-center gap-2 max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg"
            onSubmit={(ev) => {
              ev.preventDefault()
              setInboxCursor(undefined)
              setInboxQ(inboxQInput.trim())
            }}
          >
            <div className="flex-1">
              <Input
                value={inboxQInput}
                onChange={(e) => setInboxQInput(e.target.value)}
                placeholder="Lọc hộp thư phê duyệt..."
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-9 px-2"
              />
            </div>
            <Button type="submit" size="sm">
              Tìm
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inboxQuery.refetch()}
              disabled={inboxQuery.isFetching}
            >
              Làm mới
            </Button>
          </form>

          {inboxState !== 'ready' ? (
            <p
              className="p-4 rounded bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-355"
              role={inboxState === 'error' || inboxState === 'permission-denied' ? 'alert' : 'status'}
            >
              {stateMessage(inboxState)}
              {inboxErr ? ` (${inboxErr.code})` : ''}
            </p>
          ) : (
            <div className="shared-agg__list">
              {inboxRows.map((row) => {
                const raw = inboxQuery.data?.items.find((i) => i.approval_key === row.approvalKey)
                return (
                  <article className="shared-agg__item border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-2" key={row.approvalKey}>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">{row.title}</h4>
                    <p className="text-sm text-slate-500">{row.sourceLabel}</p>
                    <time className="text-xs text-slate-400" dateTime={row.requestedAt}>{row.requestedAt}</time>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!row.canApprove || !raw}
                        onClick={() => {
                          if (!raw) return
                          setDecisionTarget(raw)
                          setDecision('APPROVE')
                          setReason('')
                          setActionError(null)
                        }}
                      >
                        Duyệt
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={!row.canReject || !raw}
                        onClick={() => {
                          if (!raw) return
                          setDecisionTarget(raw)
                          setDecision('REJECT')
                          setReason('')
                          setActionError(null)
                        }}
                      >
                        Từ chối
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
          {inboxQuery.data?.page.has_more ? (
            <Button
              className="self-center"
              variant="secondary"
              size="sm"
              onClick={() => {
                const next = inboxQuery.data?.page.next_cursor
                if (next) setInboxCursor(next)
              }}
            >
              Trang tiếp theo
            </Button>
          ) : null}
        </>
      ) : (
        <>
          <form
            className="flex items-center gap-2 max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg"
            onSubmit={(ev) => {
              ev.preventDefault()
              setSearchCursor(undefined)
              setSearchQ(searchInput.trim())
            }}
          >
            <div className="flex-1">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm toàn cục trong hệ thống..."
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-9 px-2"
                required
              />
            </div>
            <Button type="submit" size="sm">
              Tìm kiếm
            </Button>
          </form>
          {!searchQ.trim() ? (
            <p className="p-4 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-500" role="status">
              Nhập từ khóa để tìm trong phạm vi được ủy quyền.
            </p>
          ) : searchState !== 'ready' ? (
            <p
              className="p-4 rounded bg-red-50 dark:bg-red-955/20 text-sm text-red-650 border border-red-200"
              role={searchState === 'error' || searchState === 'permission-denied' ? 'alert' : 'status'}
            >
              {stateMessage(searchState === 'empty' ? 'no-result' : searchState)}
              {searchErr ? ` (${searchErr.code})` : ''}
            </p>
          ) : (
            <div className="shared-agg__list">
              {searchRows.map((row) => (
                <article className="shared-agg__item border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-2" key={row.key}>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100">{row.label}</h4>
                  <p className="text-sm text-slate-500">
                    Phân hệ: {row.sourceModule} · Loại: {row.resultType} · Mã nghiệp vụ: {row.businessCode}
                  </p>
                  {row.deepLink ? (
                    <Link className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 mt-1" to={row.deepLink}>
                      Mở liên kết <span aria-hidden>→</span>
                    </Link>
                  ) : (
                    <p className="text-xs text-slate-400">Không có deep link khả dụng.</p>
                  )}
                </article>
              ))}
            </div>
          )}
          {searchQuery.data?.page.has_more ? (
            <Button
              className="self-center"
              variant="secondary"
              size="sm"
              onClick={() => {
                const next = searchQuery.data?.page.next_cursor
                if (next) setSearchCursor(next)
              }}
            >
              Trang tiếp theo
            </Button>
          ) : null}
        </>
      )}

      {decisionTarget ? (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {decision === 'APPROVE' ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {decisionTarget.title} ({decisionTarget.source_module})
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">Ý kiến phê duyệt (Bắt buộc)</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do hoặc ý kiến..."
                className="w-full h-24 p-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            {actionError ? (
              <p className="p-3 rounded bg-red-50 dark:bg-red-955/20 text-xs text-red-650 border border-red-200" role="alert">
                {actionError}
              </p>
            ) : null}
            <div className="flex gap-2 justify-end mt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDecisionTarget(null)
                  setActionError(null)
                }}
              >
                Hủy
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!reason.trim() || decideMut.isPending}
                onClick={() => decideMut.mutate()}
              >
                {decideMut.isPending ? 'Đang xử lý…' : 'Xác nhận'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
