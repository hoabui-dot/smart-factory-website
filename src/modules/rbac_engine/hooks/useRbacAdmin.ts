import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  getRolePermissions,
  listPermissions,
  replaceRolePermissions,
} from '../api/rbacApi'
import { diffPermissionCodes, resolveRbacListState, resolveSaveUiState } from '../lib/rbacProjection'
import { CANONICAL_ROLE_CODES } from '@/shared/constants/roles'

const PERMS_KEY = ['nb02', 'permissions'] as const
const ROLE_KEY = ['nb02', 'role-permissions'] as const

export function useRbacAdmin(initialRole = 'system_admin') {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [roleCode, setRoleCodeState] = useState(initialRole)
  const [draftOverride, setDraftOverride] = useState<string[] | null>(null)

  const listQuery = useQuery({
    queryKey: [...PERMS_KEY, { q: appliedQuery }],
    queryFn: () => listPermissions({ q: appliedQuery || undefined, limit: 200 }),
  })

  const roleQuery = useQuery({
    queryKey: [...ROLE_KEY, roleCode],
    queryFn: () => getRolePermissions(roleCode),
    enabled: Boolean(roleCode),
  })

  const baselineCodes = useMemo(
    () => roleQuery.data?.permission_codes ?? [],
    [roleQuery.data?.permission_codes],
  )
  const draftCodes = draftOverride ?? baselineCodes

  const saveMutation = useMutation({
    mutationFn: () => replaceRolePermissions(roleCode, draftCodes),
    onSuccess: async () => {
      setDraftOverride(null)
      await queryClient.invalidateQueries({ queryKey: ROLE_KEY })
    },
  })

  const listState = resolveRbacListState({
    status: listQuery.isLoading || listQuery.isFetching ? 'loading' : listQuery.isError ? 'error' : 'success',
    itemCount: listQuery.data?.items.length ?? 0,
    hasQuery: appliedQuery.trim().length > 0,
    errorCode: listQuery.error instanceof ApiError ? listQuery.error.code : null,
  })

  const dirty = useMemo(
    () => diffPermissionCodes(baselineCodes, draftCodes),
    [baselineCodes, draftCodes],
  )

  const saveState = resolveSaveUiState({
    dirty,
    saving: saveMutation.isPending,
    errorCode: saveMutation.error instanceof ApiError ? saveMutation.error.code : null,
  })

  const setRoleCode = useCallback((next: string) => {
    setRoleCodeState(next)
    setDraftOverride(null)
    saveMutation.reset()
  }, [saveMutation])

  const toggleCode = useCallback(
    (code: string) => {
      const current = draftOverride ?? baselineCodes
      setDraftOverride(
        current.includes(code) ? current.filter((c) => c !== code) : [...current, code],
      )
    },
    [baselineCodes, draftOverride],
  )

  const applySearch = useCallback(() => {
    setAppliedQuery(searchInput.trim())
  }, [searchInput])

  const resetDraft = useCallback(() => {
    setDraftOverride(null)
    saveMutation.reset()
  }, [saveMutation])

  return {
    roleCodes: CANONICAL_ROLE_CODES,
    roleCode,
    setRoleCode,
    searchInput,
    setSearchInput,
    applySearch,
    listState,
    permissions: listQuery.data?.items ?? [],
    listError: listQuery.error instanceof ApiError ? listQuery.error : null,
    roleLoading: roleQuery.isLoading,
    roleError: roleQuery.error instanceof ApiError ? roleQuery.error : null,
    draftCodes,
    toggleCode,
    dirty,
    saveState,
    saveError: saveMutation.error instanceof ApiError ? saveMutation.error : null,
    save: () => saveMutation.mutate(),
    resetDraft,
  }
}
