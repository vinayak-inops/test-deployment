"use client"

import { useEffect } from "react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"

interface MailGroupAssociationRecordLoaderProps {
  tenantCode: string
  recordId: string
  onData: (data: any | null) => void
  onLoadingChange?: (loading: boolean) => void
}

export default function MailGroupAssociationRecordLoader({
  tenantCode,
  recordId,
  onData,
  onLoadingChange,
}: MailGroupAssociationRecordLoaderProps) {
  const { data, loading } = useRequest<any[]>({
    url: `map/mailGroupAssociation/search?tenantCode=${tenantCode}&_id=${encodeURIComponent(recordId)}`,
    dependencies: [tenantCode, recordId],
  })

  useEffect(() => {
    onLoadingChange?.(loading)
  }, [loading, onLoadingChange])

  useEffect(() => {
    if (!Array.isArray(data)) {
      onData(null)
      return
    }
    const matched =
      data.find((row: any) => {
        const id = row?._id?.$oid || row?._id
        return String(id || "") === String(recordId)
      }) || data[0] || null
    onData(matched)
  }, [data, onData, recordId])

  return null
}

