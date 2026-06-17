"use client"

import React, { useEffect, useState } from 'react'
import { EmployeeManagementForm, type Mode } from '@/app/employee-management/contract-employee/_components/employee-management-form'
import EmployeeShiftHeader from "@/app/employee-management/employee-shift/_components/employee-shift-header"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { decryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissions"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import PageNotFound from "@/components/page-notfound"

function formController() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { employeeId: currentUserEmployeeId } = useKeyclockRoleInfo()
  const encryptedId = searchParams.get("id")
  const modeParam = searchParams.get("mode")
  const formParam = searchParams.get("form")
  const mode: Mode = "view"
  const isViewMode = modeParam === "view"
  const isDraftForm = formParam === "temp"
  const employeeSearchUrl = isDraftForm ? "draft/contract_employee/search" : "contract_employee/search"

  const [id, setId] = useState<string | null>(null)
  const [isEmployeeIdMatch, setIsEmployeeIdMatch] = useState(true)
  const [isDecrypting, setIsDecrypting] = useState(false)

  useEffect(() => {
    if (!isViewMode) return
    if (!encryptedId) {
      setId(null)
      setIsEmployeeIdMatch(false)
      return
    }
    setIsDecrypting(true)
    try {
      const decryptedData = decryptEmployeeData(encryptedId)
      setId(decryptedData?._id ?? null)
      setIsEmployeeIdMatch(decryptedData?.employeeId === currentUserEmployeeId)
    } catch {
      setId(null)
      setIsEmployeeIdMatch(false)
    } finally {
      setIsDecrypting(false)
    }
  }, [currentUserEmployeeId, encryptedId, isViewMode])

  const { data: employeeResponse, loading: isLoadingEmployee, refetch: fetchEmployee } = useRequest<any>({
    url: employeeSearchUrl,
    method: "POST",
    data: [{ field: "_id", value: id, operator: "eq" }],
    dependencies: [id, employeeSearchUrl],
  })

  useEffect(() => {
    if (isViewMode && id) fetchEmployee()
  }, [ id, isViewMode])

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "master",
    screenName: "contractorEmployee",
  })
  const canView = rolePermissions?.view || false

  if (!isViewMode) return <PageNotFound />
  if (!isDecrypting && !isEmployeeIdMatch) return <PageNotFound />
  if (!canView) return <PageNotFound />

  const shouldShowLoading =
    isDecrypting || (isEmployeeIdMatch && !!id && isLoadingEmployee)

  if (shouldShowLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isDecrypting ? "Validating access..." : "Loading employee data..."}
          </p>
        </div>
      </div>
    )
  }

  const headerEmployeeId = employeeResponse?.[0]?.employeeID || ""

  return (
    <div className="w-full mx-auto">
      <EmployeeShiftHeader
        title={"Contract Employee Details"}
        description={"View and manage contract employee information, including personal details, job assignments, and contract duration."}
        employeeId={headerEmployeeId || undefined}
        showBackButton={true}
        onBack={() => router.push("/bgv-application")}
        canAdd={false}
      />
      <EmployeeManagementForm
        duplicateData={undefined}
        employeeResponse={employeeResponse}
        mode={mode}
        employeeRecordId={id}
        employeeSearchUrl={employeeSearchUrl}
      />
    </div>
  )
}

export default formController
