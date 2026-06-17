"use client"

import { useCallback, useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@inops/store/src/store"
import { clearHierarchy, hierarchyRequest } from "@inops/store/src/sagas/hierarchy/hierarchy-slice"
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"

type FetchUserEntitlementsParams = {
  userId?: string | null
  tenantCode?: string | null
  token?: string | null
  level?: number
}

type PendingRequest = {
  resolve: (value: boolean) => void
  started: boolean
}

export function useFetchUserEntitlements() {
  const dispatch = useDispatch()
  const { token, loading: tokenLoading } = useAuthToken()
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()

  const hierarchyState = useSelector((state: RootState) => (state as any).hierarchy)
  const pendingRequestRef = useRef<PendingRequest | null>(null)

  const fetchUserEntitlements = useCallback(
    async (params?: FetchUserEntitlementsParams): Promise<boolean> => {
      const resolvedUserId = params?.userId ?? employeeId
      const resolvedTenantCode = params?.tenantCode ?? tenantCode
      const resolvedToken = params?.token ?? token

      if (!resolvedUserId || !resolvedTenantCode || !resolvedToken) {
        return false
      }

      if (pendingRequestRef.current) {
        pendingRequestRef.current.resolve(false)
      }

      dispatch(clearHierarchy())

      return new Promise<boolean>((resolve) => {
        pendingRequestRef.current = {
          resolve,
          started: false,
        }

        dispatch(
          hierarchyRequest({
            userId: resolvedUserId,
            level: params?.level,
            tenantCode: resolvedTenantCode,
            token: resolvedToken,
          })
        )
      })
    },
    [dispatch, employeeId, tenantCode, token]
  )

  useEffect(() => {
    if (!pendingRequestRef.current) return

    if (hierarchyState?.loading) {
      pendingRequestRef.current.started = true
      return
    }

    if (!pendingRequestRef.current.started) return

    if (hierarchyState?.error) {
      pendingRequestRef.current.resolve(false)
      pendingRequestRef.current = null
      return
    }

    if (hierarchyState?.data != null) {
      pendingRequestRef.current.resolve(true)
      pendingRequestRef.current = null
    }
  }, [hierarchyState?.loading, hierarchyState?.error, hierarchyState?.data])

  useEffect(() => {
    return () => {
      if (pendingRequestRef.current) {
        pendingRequestRef.current.resolve(false)
        pendingRequestRef.current = null
      }
    }
  }, [])

  return {
    fetchUserEntitlements,
    loading: Boolean(hierarchyState?.loading) || tokenLoading,
    error: (hierarchyState?.error as string | null) ?? null,
    data: hierarchyState?.data ?? null,
  }
}
