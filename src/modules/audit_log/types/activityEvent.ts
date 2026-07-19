/** Activity event DTO aligned with API-SPEC NB-03 + backend audit_log.ActivityEvent. */
export type ActivityEventAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'state_transition'
  | 'execute'

export type ActivityEvent = {
  id: number
  code: string
  event_type: string
  entity_type: string
  entity_id: number
  actor_user_id: number | null
  actor_role_id: number | null
  action: ActivityEventAction | string
  from_state: string | null
  to_state: string | null
  payload: unknown
  machine_id: number | null
  lot_id: number | null
  work_order_id: number | null
  location_id: number | null
  device_id: number | null
  ip_address: string
  occurred_at: string
  correlation_id: number | null
  /** Optional server projection codes — never invent when absent. */
  location_code?: string | null
  work_order_code?: string | null
  lot_code?: string | null
  actor_user_code?: string | null
  actor_display_name?: string | null
}

export type AuditListPage = {
  items: ActivityEvent[]
  page: {
    limit: number
    next_cursor: string | null
    has_more: boolean
  }
}

export type AuditListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

export type AsyncJobReference = {
  job?: {
    id?: number
    code?: string
    type?: string
    status?: string
    status_url?: string
  }
  job_code?: string
  status?: string
}
