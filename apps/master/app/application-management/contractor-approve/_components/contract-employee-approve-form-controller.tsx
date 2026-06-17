"use client"

import React, { useEffect, useState } from 'react'
import { type Mode } from '@/app/contractor-management/contractor/_components/contractor-management-form-content'
import { ContractorManagementFormContent } from '@/app/contractor-management/contractor/_components/contractor-management-form-content'
import EmployeeShiftHeader from "@/app/employee-management/employee-shift/_components/employee-shift-header"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { decryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissions"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import PageNotFound from "@/components/page-notfound"

interface ContractEmployeeApproveFormControllerProps {
  encryptedId?: string | null
  onBack?: () => void
}

function FormController({ encryptedId: encryptedIdProp, onBack }: ContractEmployeeApproveFormControllerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { employeeId: currentUserEmployeeId } = useKeyclockRoleInfo()
  const encryptedId = encryptedIdProp ?? searchParams.get("id")
  const modeParam = encryptedIdProp ? "view" : searchParams.get("mode")
  const returnTo = searchParams.get("returnTo")
  const formParam = searchParams.get("form")
  const mode: Mode = "view"
  const isViewMode = modeParam === "view"
  const isDraftForm = formParam === "temp"
  const contractorSearchUrl = isDraftForm ? "draft/contractor/search" : "contractor/search"
  const contractorCollectionUrl = "validate"

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

  const { data: contractorResponse, loading: isLoadingContractor } = useRequest<any>({
    url: contractorSearchUrl,
    method: "POST",
    data: [{ field: "_id", value: id, operator: "eq" }],
    dependencies: [id, contractorSearchUrl],
  })

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "master",
    screenName: "contractorEmployee",
  })
  const canView = rolePermissions?.view || false

  if (!isViewMode) return <PageNotFound />
  if (!isDecrypting && !isEmployeeIdMatch) return <PageNotFound />
  if (!canView) return <PageNotFound />

  const shouldShowLoading =
    isDecrypting || (isEmployeeIdMatch && !!id && isLoadingContractor)

  if (shouldShowLoading) {
    return (
      <div className="flex items-center justify-center min-h-[360px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isDecrypting ? "Validating access..." : "Loading employee data..."}
          </p>
        </div>
      </div>
    )
  }

  const headerContractorCode = contractorResponse?.[0]?.contractorCode || ""

  return (
    <div className="w-full mx-auto">
      <EmployeeShiftHeader
        title={"Contracter Details"}
        description={"View and manage contracter information, including personal details, job assignments, and contracter duration."}
        employeeId={headerContractorCode || undefined}
        showBackButton={true}
        onBack={onBack || (() => router.push(returnTo || "/application-management/contract-employee-approve"))}
        canAdd={false}
      />
      <ContractorManagementFormContent
        contractorResponse={contractorResponse}
        mode={mode}
        contractorRecordId={id}
        contractorSearchUrl={contractorSearchUrl}
        contractorCollectionUrl={contractorCollectionUrl}
      />
    </div>
  )
}

export default FormController
