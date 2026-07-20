import type { MyWorkGroup, MyWorkRow, MyWorkTask } from '../types/myWork.ts'
import { formatDateTime } from '../../../shared/lib/formatDate.ts'

const UNAVAILABLE = '-'

function safeWebDeepLink(value: string): string | null {
  if (!value.startsWith('/web/') || value.startsWith('//') || value.includes('://') || value.includes('\\')) return null
  return value
}

export function projectTask(task: MyWorkTask): MyWorkRow {
  const location = task.location?.code
    ? `${task.location.code}${task.location.name ? ` · ${task.location.name}` : ''}`
    : UNAVAILABLE
  return {
    key: task.task_key,
    title: task.title || UNAVAILABLE,
    taskType: task.task_type || UNAVAILABLE,
    sourceModule: task.source_module || UNAVAILABLE,
    targetLabel: `${task.source_entity_type || UNAVAILABLE} · ${task.source_entity_code || UNAVAILABLE}`,
    occurredAt: task.occurred_at ? formatDateTime(task.occurred_at) : UNAVAILABLE,
    locationLabel: location,
    workOrderLabel: task.work_order?.code || UNAVAILABLE,
    deepLink: safeWebDeepLink(task.deep_link),
  }
}

export function groupTasksByModule(tasks: MyWorkTask[]): MyWorkGroup[] {
  const groups = new Map<string, MyWorkRow[]>()
  for (const task of tasks) {
    const row = projectTask(task)
    groups.set(row.sourceModule, [...(groups.get(row.sourceModule) ?? []), row])
  }
  return [...groups].map(([sourceModule, rows]) => ({ sourceModule, rows }))
}

export function resolveMyWorkState(
  status: 'loading' | 'success' | 'error', itemCount: number, hasQuery: boolean, errorCode: string | null,
): 'loading' | 'empty' | 'no-result' | 'permission-denied' | 'error' | 'ready' {
  if (status === 'loading') return 'loading'
  if (status === 'error') return errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  if (itemCount === 0) return hasQuery ? 'no-result' : 'empty'
  return 'ready'
}
