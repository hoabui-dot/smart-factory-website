import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  getForwardImpactViaAction,
  getLotGenealogy,
  loadGraphForSearchHit,
  requestTraceExportViaAction,
  searchTraceRoots,
} from '../api/traceApi'
import {
  projectGraphView,
  projectSearchHit,
  resolveExportUiState,
  resolveGraphState,
  resolveListState,
} from '../lib/traceProjection'
import type { TraceRootRef } from '../types/traceability'

const SEARCH_KEY = ['mes07', 'search'] as const
const GRAPH_KEY = ['mes07', 'graph'] as const
const IMPACT_KEY = ['mes07', 'impact'] as const
const GENEALOGY_KEY = ['mes07', 'genealogy'] as const

function errorCode(error: unknown): string | null {
  return error instanceof ApiError ? error.code : null
}

function mutationStatus(mutation: {
  isPending: boolean
  isSuccess: boolean
  isError: boolean
}): 'idle' | 'pending' | 'success' | 'error' {
  if (mutation.isPending) return 'pending'
  if (mutation.isSuccess) return 'success'
  if (mutation.isError) return 'error'
  return 'idle'
}

export function useTraceability() {
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedHit, setSelectedHit] = useState<TraceRootRef | null>(null)
  const [showImpact, setShowImpact] = useState(false)
  const [showGenealogy, setShowGenealogy] = useState(false)

  const searchQuery = useQuery({
    queryKey: [...SEARCH_KEY, { q: appliedQuery, cursor }],
    queryFn: () => searchTraceRoots({ q: appliedQuery || undefined, cursor, limit: 20 }),
    enabled: Boolean(appliedQuery),
  })

  const graphQuery = useQuery({
    queryKey: [...GRAPH_KEY, selectedHit?.root_type, selectedHit?.root_code],
    queryFn: () => loadGraphForSearchHit(selectedHit as TraceRootRef),
    enabled: Boolean(selectedHit),
  })

  const graphView = useMemo(
    () => (graphQuery.data ? projectGraphView(graphQuery.data) : null),
    [graphQuery.data],
  )

  const impactQuery = useQuery({
    queryKey: [...IMPACT_KEY, selectedHit?.root_code, graphView?.forwardImpactAction?.href],
    queryFn: () => getForwardImpactViaAction(graphView!.forwardImpactAction!),
    enabled: showImpact && Boolean(graphView?.canForwardImpact && graphView.forwardImpactAction),
  })

  const genealogyQuery = useQuery({
    queryKey: [...GENEALOGY_KEY, selectedHit?.root_code],
    queryFn: () => getLotGenealogy(selectedHit!.root_code),
    enabled:
      showGenealogy &&
      Boolean(selectedHit) &&
      (selectedHit?.root_type.toUpperCase() === 'LOT' ||
        graphView?.rootType === 'lot' ||
        graphView?.rootType === 'finished_lot'),
  })

  const exportMutation = useMutation({
    mutationFn: () => {
      const action = graphView?.exportAction
      const rootType = graphView?.exportRootType
      if (!action || !graphView?.canExport || !rootType || !graphView.rootCode) {
        throw new ApiError('VALIDATION_ERROR', 'export không khả dụng.', 400)
      }
      return requestTraceExportViaAction(action, {
        root_type: rootType,
        root_code: graphView.rootCode,
        format: 'XLSX',
      })
    },
  })

  const hits = useMemo(
    () => (searchQuery.data?.items ?? []).map(projectSearchHit),
    [searchQuery.data?.items],
  )

  const listState = resolveListState({
    status: !appliedQuery
      ? 'success'
      : searchQuery.isLoading
        ? 'loading'
        : searchQuery.isError
          ? 'error'
          : 'success',
    itemCount: hits.length,
    hasQuery: Boolean(appliedQuery),
    errorCode: errorCode(searchQuery.error),
  })

  const graphState = resolveGraphState({
    status: !selectedHit
      ? 'idle'
      : graphQuery.isLoading
        ? 'loading'
        : graphQuery.isError
          ? 'error'
          : 'success',
    errorCode: errorCode(graphQuery.error),
  })

  const exportJob =
    exportMutation.data?.job?.code ??
    exportMutation.data?.job_code ??
    exportMutation.data?.code ??
    null

  return {
    searchInput,
    setSearchInput,
    applySearch: () => {
      setCursor(undefined)
      setSelectedHit(null)
      setShowImpact(false)
      setShowGenealogy(false)
      setAppliedQuery(searchInput.trim())
    },
    cursor,
    setCursor,
    nextCursor: searchQuery.data?.page.next_cursor ?? null,
    hasMore: Boolean(searchQuery.data?.page.has_more),
    hits,
    listState,
    listError: errorCode(searchQuery.error),
    selectedHit,
    selectHit: (hit: TraceRootRef) => {
      setSelectedHit(hit)
      setShowImpact(false)
      setShowGenealogy(false)
    },
    graph: graphQuery.data ?? null,
    graphView,
    graphState,
    graphError: errorCode(graphQuery.error),
    showImpact,
    setShowImpact,
    impactGraph: impactQuery.data ?? null,
    impactView: impactQuery.data ? projectGraphView(impactQuery.data) : null,
    impactState: resolveGraphState({
      status: !showImpact
        ? 'idle'
        : impactQuery.isLoading
          ? 'loading'
          : impactQuery.isError
            ? 'error'
            : 'success',
      errorCode: errorCode(impactQuery.error),
    }),
    showGenealogy,
    setShowGenealogy,
    genealogy: genealogyQuery.data ?? null,
    genealogyState: resolveGraphState({
      status: !showGenealogy
        ? 'idle'
        : genealogyQuery.isLoading
          ? 'loading'
          : genealogyQuery.isError
            ? 'error'
            : 'success',
      errorCode: errorCode(genealogyQuery.error),
    }),
    requestExport: () => exportMutation.mutate(),
    exportState: resolveExportUiState({
      status: mutationStatus(exportMutation),
      jobCode: exportJob,
      errorCode: errorCode(exportMutation.error),
    }),
    exportJobCode: exportJob,
    exportError: errorCode(exportMutation.error),
  }
}
