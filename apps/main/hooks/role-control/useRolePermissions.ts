"use client"

import { useCallback, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@inops/store/src/store"

interface RolePermissionsParams {
  serviceName?: string
  screenName: string
}

interface RolePermissionsResponse {
  [key: string]: boolean
}

export const useRolePermissions = (params: RolePermissionsParams) => {
  const [responseData, setResponseData] = useState<RolePermissionsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get data from Redux state instead of making API calls
  const apiState = useSelector((state: RootState) => (state as any)?.api)
  const adminRole = useSelector((state: RootState) => (state as any)?.adminRole?.adminRole)

  const actualScreenName = params.screenName

  const extractPermissions = useCallback(() => {
    // First try to get from API state (fresh data from AdminWrapper)
    if (apiState?.data && Array.isArray(apiState.data) && apiState.data.length > 0) {
      const roleData = apiState.data[0]
      if (roleData.screenPermissions && Array.isArray(roleData.screenPermissions)) {
        const targetService = roleData.screenPermissions.find(
          (service: any) => service.serviceName === (params.serviceName || ""),
        )

        if (targetService && targetService.screens) {
          const targetScreen = targetService.screens.find(
            (screen: any) => screen.screenName === actualScreenName,
          )

          if (targetScreen && targetScreen.permissions) {
            const permissions: any = {}
            Object.keys(targetScreen.permissions).forEach((key) => {
              if (targetScreen.permissions[key] === true) {
                permissions[key] = true
              }
            })
            return permissions
          }
        }
      }
    }

    // Fallback to adminRole state
    if (adminRole?.screenPermissions && Array.isArray(adminRole.screenPermissions)) {
      const targetService = adminRole.screenPermissions.find(
        (service: any) => service.serviceName === (params.serviceName || ""),
      )

      if (targetService && targetService.screens) {
        const targetScreen = targetService.screens.find(
          (screen: any) => screen.screenName === actualScreenName,
        )

        if (targetScreen && (targetScreen as any).permissions) {
          const permissions: any = {}
          Object.keys((targetScreen as any).permissions).forEach((key) => {
            if ((targetScreen as any).permissions[key] === true) {
              permissions[key] = true
            }
          })
          return permissions
        }
      }
    }

    return null
  }, [apiState?.data, adminRole?.screenPermissions, actualScreenName, params.serviceName])

  useEffect(() => {
    const permissions = extractPermissions()
    if (permissions) {
      setResponseData(permissions)
      setError(null)
    } else {
      setError("No permissions found for the specified screen")
    }
  }, [extractPermissions])

  useEffect(() => {
    setLoading(!!apiState?.loading)
    if (apiState?.error) {
      setError(apiState.error)
    }
  }, [apiState?.loading, apiState?.error])

  return {
    responseData,
    loading,
    error,
    actualScreenName,
    serviceName: params.serviceName || "",
    refetch: extractPermissions,
  }
}


