"use client"

import { useEffect, useMemo, useState } from "react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

interface UseCollectionFormStructureParams {
  collectionName: string
  searchUrl?: string
}

export function useCollectionFormStructure({
  collectionName,
  searchUrl,
}: UseCollectionFormStructureParams) {
  const tenantCode = useGetTenantCode()
  const [formStructure, setFormStructure] = useState<Record<string, unknown> | null>(null)

  const resolvedUrl = useMemo(
    () => searchUrl || `${collectionName}/search`,
    [collectionName, searchUrl]
  )

  const requestData = useMemo(
    () => [{ field: "tenantCode", value: tenantCode || "", operator: "eq" }],
    [tenantCode]
  )

  const { loading, refetch } = useRequest<any>({
    url: resolvedUrl,
    method: "POST",
    data: requestData,
    onSuccess: (data) => {
      const row = Array.isArray(data) ? data[0] : data

      if (!row || row.isDeleted === true) {
        setFormStructure(null)
        return
      }

      // Supports both direct-shape documents and wrapped payloads.
      const payload =
        row.formStructure ||
        row.formSchema ||
        row.schema ||
        row.data ||
        row

      setFormStructure(payload && typeof payload === "object" ? payload : null)
    },
    onError: (error) => {
      console.error(`Error fetching form structure from ${collectionName}:`, error)
      setFormStructure(null)
    },
    dependencies: [resolvedUrl, tenantCode, collectionName],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetch()
  }, [tenantCode])

  return {
    formStructure,
    loading,
    refetch,
  }
}

