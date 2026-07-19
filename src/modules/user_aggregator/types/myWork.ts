export type MyWorkTask = {
  task_key: string
  task_type: string
  source_module: string
  source_entity_type: string
  source_entity_code: string
  title: string
  occurred_at: string
  location?: { code: string; name?: string } | null
  work_order?: { code: string } | null
  deep_link: string
}

export type MyWorkPage = {
  items: MyWorkTask[]
  page: { limit: number; has_more: boolean; next_cursor: string | null }
}

export type MyWorkRow = {
  key: string
  title: string
  taskType: string
  sourceModule: string
  targetLabel: string
  occurredAt: string
  locationLabel: string
  workOrderLabel: string
  deepLink: string | null
}

export type MyWorkGroup = { sourceModule: string; rows: MyWorkRow[] }
