import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import { archiveAdminFile, getFileDownloadUrl, listAdminFiles } from '../api/fileStorageApi'
import {
  projectFileRow,
  resolveArchiveUiState,
  resolveFileListState,
} from '../lib/fileProjection'

const LIST_KEY = ['nb04', 'admin-files'] as const

export function useFileStorageAdmin(initialQuery = '') {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [appliedQuery, setAppliedQuery] = useState(initialQuery)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [archiveReason, setArchiveReason] = useState('')
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: [...LIST_KEY, { q: appliedQuery, cursor }],
    queryFn: () =>
      listAdminFiles({
        q: appliedQuery || undefined,
        cursor,
        limit: 50,
        sort: 'uploaded_at_desc',
      }),
  })

  const selectedRecord = useMemo(
    () => listQuery.data?.items.find((item) => item.id === selectedId) ?? null,
    [listQuery.data?.items, selectedId],
  )

  const archiveMutation = useMutation({
    mutationFn: () => archiveAdminFile(selectedId as number, archiveReason.trim()),
    onSuccess: () => {
      setConfirmArchive(false)
      setArchiveReason('')
      void queryClient.invalidateQueries({ queryKey: LIST_KEY })
    },
  })

  const downloadMutation = useMutation({
    mutationFn: () => getFileDownloadUrl(selectedId as number),
    onSuccess: (result) => {
      setDownloadUrl(result.signed_url)
    },
  })

  const listState = resolveFileListState({
    status: listQuery.isLoading || listQuery.isFetching ? 'loading' : listQuery.isError ? 'error' : 'success',
    itemCount: listQuery.data?.items.length ?? 0,
    hasQuery: appliedQuery.trim().length > 0,
    errorCode: listQuery.error instanceof ApiError ? listQuery.error.code : null,
  })

  const rows = useMemo(
    () => (listQuery.data?.items ?? []).map(projectFileRow),
    [listQuery.data?.items],
  )

  const detailRow = useMemo(
    () => (selectedRecord ? projectFileRow(selectedRecord) : null),
    [selectedRecord],
  )

  const archiveError = archiveMutation.error instanceof ApiError ? archiveMutation.error : null
  const archiveState = resolveArchiveUiState({
    confirmOpen: confirmArchive,
    status: archiveMutation.isPending
      ? 'pending'
      : archiveMutation.isSuccess
        ? 'success'
        : archiveMutation.isError
          ? 'error'
          : 'idle',
    errorCode: archiveError?.code ?? null,
  })

  const applySearch = useCallback(() => {
    setCursor(undefined)
    setAppliedQuery(searchInput.trim())
  }, [searchInput])

  const loadMore = useCallback(() => {
    const next = listQuery.data?.page.next_cursor
    if (next) {
      setCursor(next)
    }
  }, [listQuery.data?.page.next_cursor])

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: LIST_KEY })
  }, [queryClient])

  return {
    searchInput,
    setSearchInput,
    applySearch,
    loadMore,
    refresh,
    listState,
    rows,
    hasMore: Boolean(listQuery.data?.page.has_more),
    selectedId,
    setSelectedId,
    detailRow,
    selectedRecord,
    archiveReason,
    setArchiveReason,
    confirmArchive,
    setConfirmArchive,
    archiveState,
    archiveError,
    requestArchive: () => archiveMutation.mutate(),
    downloadUrl,
    downloadPending: downloadMutation.isPending,
    downloadError: downloadMutation.error instanceof ApiError ? downloadMutation.error : null,
    requestDownload: () => {
      setDownloadUrl(null)
      downloadMutation.mutate()
    },
  }
}
