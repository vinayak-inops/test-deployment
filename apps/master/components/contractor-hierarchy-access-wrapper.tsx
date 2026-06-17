"use client"

import React, { useEffect, useState } from "react"
import PageNotFound from "@/components/page-notfound"
import { useCheckContractorInHierarchy } from "@/hooks/hierarchy/useCheckContractorInHierarchy"

interface ContractorHierarchyAccessWrapperProps {
  _id?: string | null
  contractorCode?: string | null
  children: React.ReactNode
  fallback?: React.ReactNode
  loadingFallback?: React.ReactNode
}

export default function ContractorHierarchyAccessWrapper({
  _id,
  contractorCode,
  children,
  fallback,
  loadingFallback,
}: ContractorHierarchyAccessWrapperProps) {
  const { checkContractorInHierarchy, loading } = useCheckContractorInHierarchy()
  const [hasAccess, setHasAccess] = useState(false)
  const [isChecked, setIsChecked] = useState(false)

  useEffect(() => {
    let isMounted = true

    const runCheck = async () => {
      const normalizedId = String(_id || "").trim()
      const normalizedContractorCode = String(contractorCode || "").trim()

      if (!normalizedId && !normalizedContractorCode) {
        if (isMounted) {
          setHasAccess(false)
          setIsChecked(true)
        }
        return
      }

      if (isMounted) {
        setIsChecked(false)
      }

      const result = await checkContractorInHierarchy({
        _id: normalizedId || undefined,
        contractorCode: normalizedContractorCode || undefined,
      })

      if (isMounted) {
        setHasAccess(result)
        setIsChecked(true)
      }
    }

    void runCheck()

    return () => {
      isMounted = false
    }
  }, [_id, contractorCode, checkContractorInHierarchy])

  if (loading || !isChecked) {
    return (
      <>
        {loadingFallback ?? (
          <div className="flex mt-10 justify-center">
            <div className="border border-gray-300 rounded-lg p-8 max-w-lg mx-4 text-center">
              <p className="text-base text-gray-700">Checking access...</p>
            </div>
          </div>
        )}
      </>
    )
  }

  if (!hasAccess) {
    return <>{fallback ?? <PageNotFound />}</>
  }

  return <>{children}</>
}
