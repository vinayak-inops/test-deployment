"use client"

import React, { useEffect, useState } from "react"
import PageNotFound from "@/components/page-notfound"
import { useCheckEmployeeInHierarchy } from "@/hooks/hierarchy/useCheckEmployeeInHierarchy"

interface EmployeeHierarchyAccessWrapperProps {
  _id?: string | null
  employeeID?: string | null
  children: React.ReactNode
  fallback?: React.ReactNode
  loadingFallback?: React.ReactNode
}

export default function EmployeeHierarchyAccessWrapper({
  _id,
  employeeID,
  children,
  fallback,
  loadingFallback,
}: EmployeeHierarchyAccessWrapperProps) {
  const { checkEmployeeInHierarchy, loading } = useCheckEmployeeInHierarchy()
  const [hasAccess, setHasAccess] = useState(false)
  const [isChecked, setIsChecked] = useState(false)

  useEffect(() => {
    let isMounted = true

    const runCheck = async () => {
      const normalizedId = String(_id || "").trim()
      const normalizedEmployeeId = String(employeeID || "").trim()

      if (!normalizedId && !normalizedEmployeeId) {
        if (isMounted) {
          setHasAccess(false)
          setIsChecked(true)
        }
        return
      }

      if (isMounted) {
        setIsChecked(false)
      }

      const result = await checkEmployeeInHierarchy({
        _id: normalizedId || undefined,
        employeeID: normalizedEmployeeId || undefined,
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
  }, [_id, employeeID, checkEmployeeInHierarchy])

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
