"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertCircle,
  Edit3,
  Loader2,
  Pencil,
} from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import OrganizationEditForm from "./organization-edit-form"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"

interface OrganizationData {
  organizationName: string
  organizationCode: string
  addressLine1: string | null
  addressLine2: string | null
  city: string
  pinCode: string
  logoFileName: string
  description: string
  emailId: string
  contactPersonContactNumber: string
  registrationNo: string
  tenantCode: string
  isActive: number
  firstMonthOfFinancialYear: number
}

const defaultOrganizationData: OrganizationData = {
  organizationName: "",
  organizationCode: "",
  addressLine1: null,
  addressLine2: null,
  city: "",
  pinCode: "",
  logoFileName: "",
  description: "",
  emailId: "",
  contactPersonContactNumber: "",
  registrationNo: "",
  tenantCode: "",
  isActive: 1,
  firstMonthOfFinancialYear: 1,
}

function formatValue(value?: string | null) {
  if (!value) return "Not provided"
  return value
}

function getMonthLabel(month?: number) {
  if (!month || month < 1 || month > 12) return "Not set"
  return new Date(2024, month - 1, 1).toLocaleDateString("en-US", { month: "long" })
}

function getInitials(name?: string) {
  if (!name) return "ORG"

  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) return "ORG"
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("")
}

export default function OrganizationInfo() {
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [currentData, setCurrentData] = useState<OrganizationData>(defaultOrganizationData)
  const tenantCode = useGetTenantCode()

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "organization",
    screenName: "organization",
  })

  const editMode = rolePermissions?.edit || false

  const { loading: isLoading, error: organizationError, refetch: fetchOrganization } = useRequest<any>({
    url: "organization/search",
    method: "POST",
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode,
      },
    ],
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setCurrentData(data[0])
      }
    },
    onError: (error) => {
      console.error("Error fetching organization data:", error)
    },
    dependencies: [],
  })

  useEffect(() => {
    fetchOrganization()
  }, [])

  const handleEditClose = () => {
    setIsEditFormOpen(false)
  }

  const handleEditSubmit = (updatedData: OrganizationData) => {
    setCurrentData(updatedData)
    fetchOrganization()
  }

  const addressParts = [
    currentData.addressLine1,
    currentData.addressLine2,
    currentData.city,
    currentData.pinCode,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))

  const formattedAddress = addressParts.length > 0 ? addressParts.join(", ") : "Not provided"

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f2ef]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#0a66c2]" />
          <h2 className="mb-2 text-xl font-semibold text-gray-700">Loading Organization Information</h2>
          <p className="text-gray-500">Please wait while we fetch the data...</p>
        </div>
      </div>
    )
  }

  if (organizationError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f2ef]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-700">Error Loading Data</h2>
          <p className="mb-4 text-gray-500">Failed to load organization information</p>
          <Button onClick={fetchOrganization} className="bg-[#0a66c2] text-white hover:bg-[#004182]">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="">
      <div className="mx-auto max-w-6xl space-y-5">
        <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
          <div className="relative h-36 overflow-hidden border-b border-gray-200 bg-[linear-gradient(120deg,#f8d7cb_0%,#f3b999_22%,#d8dde7_50%,#aebdd4_72%,#ffd7b4_100%)] sm:h-44">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(0,0,0,0.10))]" />
            <div className="absolute inset-y-0 left-[38%] w-20 rounded-t-[72px] bg-white/75 blur-[1px] sm:w-24" />
            <div className="absolute inset-y-5 left-[50%] w-24 -translate-x-1/2 rounded-t-[84px] bg-white/85 sm:w-28" />
            <div className="absolute inset-y-7 left-[62%] w-20 rounded-t-[68px] bg-white/70 sm:w-24" />

            {editMode ? (
              <button
                type="button"
                onClick={() => setIsEditFormOpen(true)}
                className="absolute right-4 top-4 rounded-full border border-gray-200 bg-white p-2 text-[#0a66c2] shadow-sm transition hover:bg-blue-50"
                aria-label="Edit organization"
              >
                <Pencil className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <CardContent className="px-5 pb-5 pt-0 sm:px-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Avatar className="-mt-10 h-[5.5rem] w-[5.5rem] border-4 border-white bg-white shadow-md sm:-mt-12 sm:h-24 sm:w-24">
                  {currentData.logoFileName ? <AvatarImage src={currentData.logoFileName} alt={currentData.organizationName} /> : null}
                  <AvatarFallback className="bg-gradient-to-br from-slate-200 via-slate-100 to-white text-2xl font-semibold text-slate-700">
                    {getInitials(currentData.organizationName)}
                  </AvatarFallback>
                </Avatar>

                <div className="relative flex min-w-0 flex-1 flex-col gap-1.5 pt-1 sm:pt-4 xl:pr-[22rem]">
                  <h1 className="text-lg font-semibold leading-[1.05] text-[#1d2226]">
                    {formatValue(currentData.organizationName)}
                  </h1>
                  <p className="mt-0 max-w-3xl text-base leading-5 text-[#4b5563]">{formatValue(currentData.description)}</p>

                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-gray-600 sm:text-base">
                    <span>{formatValue(currentData.city)}</span>
                    <span className="hidden text-gray-300 sm:inline">|</span>
                    <span>{formatValue(currentData.contactPersonContactNumber)}</span>
                    <span className="hidden text-gray-300 sm:inline">|</span>
                    <span className="font-medium text-[#0a66c2]">{formatValue(currentData.emailId)}</span>
                  </div>

                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm font-medium text-gray-600 sm:text-base">
                    <span>{formatValue(currentData.organizationCode)}</span>
                    <span className="text-gray-300">•</span>
                    <span>{formatValue(currentData.registrationNo)}</span>
                    <span className="text-gray-300">•</span>
                    <span>{getMonthLabel(currentData.firstMonthOfFinancialYear)}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2.5 xl:absolute xl:right-0 xl:top-4 xl:mt-0 xl:justify-end">
                    <Button type="button" className="bg-[#0a66c2] px-5 text-white hover:bg-[#004182]">
                      Organization Overview
                    </Button>
                    {editMode ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-[#0a66c2] hover:bg-blue-50 hover:text-[#004182]"
                        onClick={() => setIsEditFormOpen(true)}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-[#fbfbfa] p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Address</p>
              <p className="mt-2 text-sm font-medium leading-6 text-gray-900">{formattedAddress}</p>
            </div>
          </CardContent>
        </Card>

      </div>

      <OrganizationEditForm
        isOpen={isEditFormOpen}
        onClose={handleEditClose}
        initialValues={
          currentData.organizationName
            ? currentData
            : {
                organizationName: "",
                organizationCode: "",
                addressLine1: "",
                addressLine2: "",
                city: "",
                pinCode: "",
                logoFileName: "",
                description: "",
                emailId: "",
                contactPersonContactNumber: "",
                registrationNo: "",
                tenantCode: "",
                isActive: 1,
                firstMonthOfFinancialYear: 1,
              }
        }
        onSubmit={handleEditSubmit}
      />
    </div>
  )
}
