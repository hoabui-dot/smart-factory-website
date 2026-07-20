import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ApiError } from '@/shared/api'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { useAuthStore } from '@/shared/store/authStore'

import { listMyWork } from '../api/myWorkApi'
import { groupTasksByModule, resolveMyWorkState } from '../lib/myWorkProjection'

// Import Shadcn & Layout components
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'

import './MyWorkPage.css'

function stateMessage(state: string): string {
  return {
    loading: 'Đang tổng hợp hàng đợi công việc…',
    empty: 'Hiện chưa có việc cần làm.',
    'no-result': 'Không có công việc phù hợp từ khóa.',
    'permission-denied': 'Bạn không có quyền xem My Work.',
    error: 'Không thể tải My Work. Vui lòng thử lại.'
  }[state] ?? ''
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
  const state = resolveMyWorkState(
    workQuery.isLoading ? 'loading' : workQuery.isError ? 'error' : 'success',
    workQuery.data?.items.length ?? 0,
    Boolean(query),
    error?.code ?? null
  )

  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Công việc của tôi' },
        ]}
        title="Công việc của tôi"
        subtitle={`Hàng đợi việc cần xử lý của ${session?.user.full_name ?? 'người dùng hiện tại'}, tổng hợp từ MES, WMS và QMS.`}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => workQuery.refetch()}
            disabled={workQuery.isFetching}
          >
            Làm mới
          </Button>
        }
      />

      <FilterBar
        fields={[
          {
            name: 'searchInput',
            type: 'text',
            placeholder: 'Tìm theo tiêu đề / mã nghiệp vụ...'
          }
        ]}
        values={{ searchInput }}
        onChange={(_, val) => setSearchInput(val)}
        onSubmit={(event) => {
          event.preventDefault()
          setCursor(undefined)
          setQuery(searchInput.trim())
        }}
        onReset={() => {
          setSearchInput('')
          setQuery('')
          setCursor(undefined)
        }}
        isResetActive={!!query}
        className="max-w-lg"
      />

      {workQuery.isFetching && !workQuery.isLoading ? (
        <p className="p-4 rounded bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-350" role="status">
          Đang cập nhật dữ liệu trong scope…
        </p>
      ) : null}

      {state !== 'ready' ? (
        <p className="p-4 rounded bg-red-50 dark:bg-red-950/20 text-sm text-red-650 border border-red-200 dark:border-red-900" role={state === 'error' || state === 'permission-denied' ? 'alert' : 'status'}>
          {stateMessage(state)}{error ? ` (${error.code}: ${error.message})` : ''}
        </p>
      ) : null}

      {state === 'ready' ? (
        <div className="my-work__groups">
          {groups.map((group) => (
            <section className="my-work__group" key={group.sourceModule} aria-labelledby={`group-${group.sourceModule}`}>
              <header>
                <h3 id={`group-${group.sourceModule}`}>{group.sourceModule}</h3>
                <span>{group.rows.length} việc</span>
              </header>
              <div className="my-work__cards">
                {group.rows.map((row) => (
                  <article className="my-work__card" key={row.key}>
                    <div className="my-work__card-top">
                      <span>{row.taskType.replaceAll('_', ' ')}</span>
                      <time dateTime={row.occurredAt}>{row.occurredAt}</time>
                    </div>
                    <h4>{row.title}</h4>
                    <p className="my-work__target">{row.targetLabel}</p>
                    <dl>
                      <div>
                        <dt>Location</dt>
                        <dd>{row.locationLabel}</dd>
                      </div>
                      <div>
                        <dt>Work order</dt>
                        <dd>{row.workOrderLabel}</dd>
                      </div>
                    </dl>
                    {row.deepLink ? (
                      <Link className="my-work__open" to={row.deepLink}>
                        Mở công việc <span aria-hidden>→</span>
                      </Link>
                    ) : (
                      <p className="my-work__blocked">Deep link không hợp lệ; hãy làm mới danh sách.</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {workQuery.data?.page.has_more ? (
        <Button
          className="self-center"
          variant="secondary"
          size="sm"
          onClick={() => {
            const next = workQuery.data?.page.next_cursor
            if (next) setCursor(next)
          }}
        >
          Trang tiếp theo
        </Button>
      ) : null}
    </section>
  )
}
