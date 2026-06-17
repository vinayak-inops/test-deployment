"use client"

import React, { useEffect, useState } from 'react'
import { EmployeeManagementForm, type Mode } from './employee-management-form'
import EmployeeShiftHeader from "../../employee-shift/_components/employee-shift-header"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { decryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import PageNotFound from "@/components/page-notfound"
import EmployeeHierarchyAccessWrapper from "@/components/employee-hierarchy-access-wrapper"

function formController() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const encryptedId = searchParams.get("id")
  const modeParam = searchParams.get("mode")
  const formParam = searchParams.get("form")
  const mode: Mode = modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : "add"
  const isDraftForm = formParam === "temp"
  const employeeSearchUrl = isDraftForm ? "draft/contract_employee/search" : "contract_employee/search"

  const [id, setId] = useState<string | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)

  useEffect(() => {
    if (mode === "add") {
      setId(null)
      return
    }
    if (!encryptedId) {
      setId(null)
      return
    }
    setIsDecrypting(true)
    try {
      const decryptedData = decryptEmployeeData(encryptedId)
      setId(decryptedData?._id ?? null)
    } catch {
      setId(null)
    } finally {
      setIsDecrypting(false)
    }
  }, [encryptedId, mode])

  const { data: employeeResponse, loading: isLoadingEmployee, refetch: fetchEmployee } = useRequest<any>({
    url: employeeSearchUrl,
    method: "POST",
    data: [{ field: "_id", value: id, operator: "eq" }],
    dependencies: [id, employeeSearchUrl],
  })

  useEffect(() => {
    if ((mode === "view" || mode === "edit") && id) fetchEmployee()
  }, [ id, mode])

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "user",
    screenName: "contractorEmployee",
  })
  const viewMode = rolePermissions?.view || false
  const editMode = rolePermissions?.edit || false
  const addMode = rolePermissions?.add || false
  const isModeAllowed =
    (viewMode && mode === "view") ||
    (editMode && mode === "edit") ||
    (addMode && mode === "add")

  if (!isModeAllowed) return <PageNotFound />
  if (!isDecrypting && mode !== "add" && !id) return <PageNotFound />

  const shouldShowLoading =
    mode !== "add" && (isDecrypting || (!!id && isLoadingEmployee))

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
  const content = (
    <div className="w-full mx-auto">
      <EmployeeShiftHeader
        title={"Contract Employee Details"}
        description={"View and manage contract employee information, including personal details, job assignments, and contract duration."}
        employeeId={headerEmployeeId || undefined}
        showBackButton={true}
        onBack={() => router.push("/employee-management/contract-employee")}
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

  if (mode === "add" || isDraftForm) {
    return content
  }

  return (
    <EmployeeHierarchyAccessWrapper
      _id={id}
      loadingFallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Validating access...</p>
          </div>
        </div>
      }
    >
      {content}
    </EmployeeHierarchyAccessWrapper>
  )
}

export default formController
