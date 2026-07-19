import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { ApiError } from '@/shared/api'
import { useAuthStore } from '@/shared/store/authStore'

import { listMyWork } from '../api/myWorkApi'
import { groupTasksByModule, resolveMyWorkState } from '../lib/myWorkProjection'

import './MyWorkPage.css'

function stateMessage(state: string): string {
  return { loading: 'Đang tổng hợp hàng đợi công việc…', empty: 'Hiện chưa có việc cần làm.', 'no-result': 'Không có công việc phù hợp từ khóa.', 'permission-denied': 'Bạn không có quyền xem My Work.', error: 'Không thể tải My Work. Vui lòng thử lại.' }[state] ?? ''
}

export function MyWorkPage() {
  const session = useAuthStore((state) => state.session)
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const workQuery = useQuery({
    queryKey: ['shared01', 'my-work', query, cursor],
    queryFn: () => listMyWork({ q: query || undefined, cursor, limit: 50 }),
  })
  const groups = useMemo(() => groupTasksByModule(workQuery.data?.items ?? []), [workQuery.data?.items])
  const error = workQuery.error instanceof ApiError ? workQuery.error : null
  const state = resolveMyWorkState(workQuery.isLoading ? 'loading' : workQuery.isError ? 'error' : 'success', workQuery.data?.items.length ?? 0, Boolean(query), error?.code ?? null)

  return <section className="my-work" aria-labelledby="my-work-title">
    <header className="my-work__header"><div><p className="my-work__eyebrow">WEB-SHARED-01A-MY-WORK</p><h2 id="my-work-title">My Work</h2><p className="my-work__lead">Hàng đợi trong scope của {session?.user.full_name ?? 'người dùng hiện tại'}, tổng hợp từ MES, WMS và QMS.</p></div><button type="button" onClick={() => workQuery.refetch()} disabled={workQuery.isFetching}>Làm mới</button></header>
    <form className="my-work__toolbar" onSubmit={(event) => { event.preventDefault(); setCursor(undefined); setQuery(searchInput.trim()) }}><label><span>Tìm theo tiêu đề hoặc mã nghiệp vụ</span><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /></label><button type="submit">Tìm</button>{query ? <button type="button" onClick={() => { setSearchInput(''); setQuery(''); setCursor(undefined) }}>Xóa lọc</button> : null}</form>
    {workQuery.isFetching && !workQuery.isLoading ? <p className="my-work__refresh" role="status">Đang cập nhật dữ liệu trong scope…</p> : null}
    {state !== 'ready' ? <p className="my-work__state" role={state === 'error' || state === 'permission-denied' ? 'alert' : 'status'}>{stateMessage(state)}{error ? ` (${error.code}: ${error.message})` : ''}</p> : null}
    {state === 'ready' ? <div className="my-work__groups">{groups.map((group) => <section className="my-work__group" key={group.sourceModule} aria-labelledby={`group-${group.sourceModule}`}><header><h3 id={`group-${group.sourceModule}`}>{group.sourceModule}</h3><span>{group.rows.length} việc</span></header><div className="my-work__cards">{group.rows.map((row) => <article className="my-work__card" key={row.key}><div className="my-work__card-top"><span>{row.taskType.replaceAll('_', ' ')}</span><time dateTime={row.occurredAt}>{row.occurredAt}</time></div><h4>{row.title}</h4><p className="my-work__target">{row.targetLabel}</p><dl><div><dt>Location</dt><dd>{row.locationLabel}</dd></div><div><dt>Work order</dt><dd>{row.workOrderLabel}</dd></div></dl>{row.deepLink ? <Link className="my-work__open" to={row.deepLink}>Mở công việc <span aria-hidden>→</span></Link> : <p className="my-work__blocked">Deep link không hợp lệ; hãy làm mới danh sách.</p>}</article>)}</div></section>)}</div> : null}
    {workQuery.data?.page.has_more ? <button className="my-work__next" type="button" onClick={() => { const next = workQuery.data?.page.next_cursor; if (next) setCursor(next) }}>Trang tiếp theo</button> : null}
  </section>
}
