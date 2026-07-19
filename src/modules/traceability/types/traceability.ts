export type AllowedAction = {
  action: string
  method: string
  href: string
  enabled: boolean
  disabled_reason_code?: string | null
}

export type PageMeta = {
  limit: number
  next_cursor: string | null
  has_more: boolean
}

export type TraceRootRef = {
  root_type: string
  root_code: string
  label: string
  route: string
}

export type TraceSearchPage = { items: TraceRootRef[]; page: PageMeta }

export type TraceEntityRef = {
  entity_type: string
  code: string
  label: string
}

export type TraceNode = {
  node_key: string
  entity_type: string
  code: string
  label: string
  node_role: string
}

export type TraceEdge = {
  from_node_key: string
  to_node_key: string
  relation_type: string
}

export type TraceGraphRecord = {
  root: TraceEntityRef
  nodes: TraceNode[]
  edges: TraceEdge[]
  allowed_actions?: AllowedAction[]
}

export type TraceExportRequest = {
  root_type: string
  root_code: string
  format: string
}

export type AsyncJobReference = {
  job?: { code?: string; status?: string }
  job_code?: string
  code?: string
  status?: string
}

export type GenealogyNode = {
  lot_code?: string
  code?: string
  label?: string
  children?: GenealogyNode[]
}

export type GenealogyRecord = {
  root?: GenealogyNode
  nodes?: GenealogyNode[]
  parents?: GenealogyNode[]
  children?: GenealogyNode[]
}

export type TraceSearchHitView = {
  rootType: string
  rootCode: string
  label: string
  route: string
}

export type TraceGraphView = {
  rootType: string
  rootCode: string
  rootLabel: string
  nodeCount: number
  edgeCount: number
  nodes: TraceNode[]
  edges: TraceEdge[]
  canExport: boolean
  canForwardImpact: boolean
  exportAction: AllowedAction | null
  forwardImpactAction: AllowedAction | null
  exportRootType: string | null
}
