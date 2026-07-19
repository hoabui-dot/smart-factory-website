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
    <section className="shared-agg" aria-labelledby="approval-title">
      <header className="shared-agg__header">
        <div>
          <p className="shared-agg__eyebrow">
            WEB-SHARED-01D-APPROVAL-INBOX · `/web/shared/approval-inbox`
          </p>
          <h2 id="approval-title">Approval Inbox + Global Search</h2>
          <p className="shared-agg__lead">
            Approve/Reject chỉ theo <code>allowed_actions</code> string từ server; search deep-link
            nội bộ <code>/web/</code>.
          </p>
        </div>
        <Link to="/home">Về trang chủ</Link>
      </header>

      <div className="shared-agg__tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'inbox'} onClick={() => setTab('inbox')}>
          Inbox
        </button>
        <button type="button" role="tab" aria-selected={tab === 'search'} onClick={() => setTab('search')}>
          Global Search
        </button>
      </div>

      {tab === 'inbox' ? (
        <>
          <form
            className="shared-agg__toolbar"
            onSubmit={(ev) => {
              ev.preventDefault()
              setInboxCursor(undefined)
              setInboxQ(inboxQInput.trim())
            }}
          >
            <label>
              <span>Lọc inbox</span>
              <input value={inboxQInput} onChange={(e) => setInboxQInput(e.target.value)} />
            </label>
            <button type="submit">Tìm</button>
            <button type="button" onClick={() => inboxQuery.refetch()} disabled={inboxQuery.isFetching}>
              Làm mới
            </button>
          </form>

          {inboxState !== 'ready' ? (
            <p
              className="shared-agg__state"
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
                  <article className="shared-agg__item" key={row.approvalKey}>
                    <h4>{row.title}</h4>
                    <p className="shared-agg__muted">{row.sourceLabel}</p>
                    <time dateTime={row.requestedAt}>{row.requestedAt}</time>
                    <div className="shared-agg__actions">
                      <button
                        type="button"
                        disabled={!row.canApprove || !raw}
                        onClick={() => {
                          if (!raw) return
                          setDecisionTarget(raw)
                          setDecision('APPROVE')
                          setReason('')
                          setActionError(null)
                        }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={!row.canReject || !raw}
                        onClick={() => {
                          if (!raw) return
                          setDecisionTarget(raw)
                          setDecision('REJECT')
                          setReason('')
                          setActionError(null)
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
          {inboxQuery.data?.page.has_more ? (
            <button
              type="button"
              onClick={() => {
                const next = inboxQuery.data?.page.next_cursor
                if (next) setInboxCursor(next)
              }}
            >
              Trang tiếp theo
            </button>
          ) : null}
        </>
      ) : (
        <>
          <form
            className="shared-agg__toolbar"
            onSubmit={(ev) => {
              ev.preventDefault()
              setSearchCursor(undefined)
              setSearchQ(searchInput.trim())
            }}
          >
            <label>
              <span>Global search (bắt buộc)</span>
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} required />
            </label>
            <button type="submit">Tìm</button>
          </form>
          {!searchQ.trim() ? (
            <p className="shared-agg__state" role="status">
              Nhập từ khóa để tìm trong phạm vi được authorize.
            </p>
          ) : searchState !== 'ready' ? (
            <p
              className="shared-agg__state"
              role={searchState === 'error' || searchState === 'permission-denied' ? 'alert' : 'status'}
            >
              {stateMessage(searchState === 'empty' ? 'no-result' : searchState)}
              {searchErr ? ` (${searchErr.code})` : ''}
            </p>
          ) : (
            <div className="shared-agg__list">
              {searchRows.map((row) => (
                <article className="shared-agg__item" key={row.key}>
                  <h4>{row.label}</h4>
                  <p className="shared-agg__muted">
                    {row.sourceModule} · {row.resultType} · {row.businessCode}
                  </p>
                  {row.deepLink ? (
                    <Link to={row.deepLink}>Mở <span aria-hidden>→</span></Link>
                  ) : (
                    <p className="shared-agg__muted">Deep link không hợp lệ.</p>
                  )}
                </article>
              ))}
            </div>
          )}
          {searchQuery.data?.page.has_more ? (
            <button
              type="button"
              onClick={() => {
                const next = searchQuery.data?.page.next_cursor
                if (next) setSearchCursor(next)
              }}
            >
              Trang tiếp theo
            </button>
          ) : null}
        </>
      )}

      {decisionTarget ? (
        <div className="shared-agg__dialog" role="dialog" aria-labelledby="decide-title">
          <h3 id="decide-title">
            {decision === 'APPROVE' ? 'Approve' : 'Reject'}: {decisionTarget.title}
          </h3>
          <p className="shared-agg__muted">
            {decisionTarget.source_module} · {decisionTarget.source_entity_code}
          </p>
          <label>
            <span>Reason (bắt buộc)</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
          </label>
          {actionError ? (
            <p className="shared-agg__state" role="alert">
              {actionError}
            </p>
          ) : null}
          <div className="shared-agg__actions">
            <button
              type="button"
              disabled={!reason.trim() || decideMut.isPending}
              onClick={() => decideMut.mutate()}
            >
              {decideMut.isPending ? 'Đang gửi…' : 'Xác nhận'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDecisionTarget(null)
                setActionError(null)
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
