"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertCircle, Briefcase, Home, Loader2, Mail, MapPin, Phone, Shield, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64"
import { useKeyclockRoleInfo } from "@/hooks/search/keyclock-role-info"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"
import CompanyEmployeeHeader from "./company-employee-header"

interface UsernameProps {
  duplicateData: any
  refetch: any
}

function formatValue(value?: unknown): string {
  if (value === undefined || value === null || value === "") return "Not provided"
  if (typeof value === "string" || typeof value === "number") return String(value)
  if (Array.isArray(value)) {
    const normalized: string[] = value.map((item) => formatValue(item)).filter((item) => item !== "Not provided")
    return normalized.length > 0 ? normalized.join(", ") : "Not provided"
  }
  if (typeof value === "object") return "Not provided"
  return String(value)
}

function getPrimaryContactNumber(contactValue: unknown): string {
  if (!contactValue) return "Not provided"
  if (typeof contactValue === "string" || typeof contactValue === "number") return String(contactValue)
  if (typeof contactValue === "object") {
    const contact = contactValue as Record<string, unknown>
    return formatValue(
      contact.primaryContactNo ??
        contact.secondaryContactNumber ??
        contact.secondarContactNumber ??
        contact.emergencyContactNo1 ??
        contact.emergencyContactNo2
    )
  }
  return "Not provided"
}

function formatDateForDisplay(dateString?: string) {
  if (!dateString) return "Not provided"
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

function getInitials(firstName?: string, middleName?: string, lastName?: string) {
  const parts = [firstName, middleName, lastName].filter(Boolean).slice(0, 2)
  if (parts.length === 0) return "EP"
  return parts.map((part) => part?.charAt(0).toUpperCase() ?? "").join("")
}

function guessMimeFromPath(path: string): string {
  const lower = path.toLowerCase()
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".gif")) return "image/gif"
  if (lower.endsWith(".webp")) return "image/webp"
  return "application/octet-stream"
}

function formatAddress(address?: {
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  country?: string
  pinCode?: string
  taluka?: string
}) {
  if (!address) return "Not provided"

  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.country,
    address.pinCode,
    address.taluka,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))

  return parts.length > 0 ? parts.join(", ") : "Not provided"
}

export function Username({ duplicateData, refetch }: UsernameProps) {
  const searchParams = useSearchParams()
  const modeParam = searchParams.get("mode")
  const currentMode = modeParam === "edit" || modeParam === "add" || modeParam === "view" ? modeParam : "view"

  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  const { fetchByteArray } = useByteToBase64()

  const [employeeData, setEmployeeData] = useState<any>(null)
  const [photoPreview, setPhotoPreview] = useState("")

  const {
    loading: isLoading,
    error: employeeError,
    refetch: fetchEmployeeData,
  } = useRequest<any>({
    url: "company_employee/search",
    method: "POST",
    data: [
      {
        field: "employeeID",
        value: employeeId,
        operator: "eq",
      },
      {
        field: "tenantCode",
        value: tenantCode,
        operator: "eq",
      },
    ],
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setEmployeeData(data[0])
      } else {
        setEmployeeData(null)
      }
    },
    onError: () => {
      setEmployeeData(null)
    },
    dependencies: [employeeId, tenantCode],
  })

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeData()
    }
  }, [employeeId, tenantCode])

  useEffect(() => {
    let currentObjectUrl: string | null = null
    const photoValue =
      typeof employeeData?.photo === "string" ? employeeData.photo : employeeData?.photo?.documentPath

    const run = async () => {
      if (photoValue && photoValue.startsWith("/app/documents/")) {
        try {
          const result: any = await fetchByteArray(photoValue, guessMimeFromPath(photoValue))
          if (result.success && result.objectUrl) {
            currentObjectUrl = result.objectUrl
            setPhotoPreview(result.objectUrl)
            return
          }
        } catch {}
        setPhotoPreview("")
        return
      }

      setPhotoPreview(photoValue || "")
    }

    void run()

    return () => {
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
    }
  }, [employeeData?.photo, fetchByteArray])

  const normalizedEmail =
    typeof employeeData?.emailID === "object" ? employeeData?.emailID?.primaryEmailID || "" : employeeData?.emailID || ""
  const fullName =
    [employeeData?.firstName, employeeData?.middleName, employeeData?.lastName].filter(Boolean).join(" ") || "Not provided"
  const deployment = employeeData?.deployment || {}
  const temporaryAddress = employeeData?.address?.temporaryAddress || {}
  const permanentAddress = employeeData?.address?.permanentAddress || {}
  const statusValue =
    typeof employeeData?.status === "object" ? employeeData?.status?.currentStatus : employeeData?.status || "Not provided"
  const phoneNumber = getPrimaryContactNumber(employeeData?.contactNumber ?? employeeData?.mobileNumber)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f4ef]">
        <CompanyEmployeeHeader mode={currentMode} employeeID={employeeId} onBack={() => {}} />
        <div className="flex min-h-[calc(100vh-88px)] items-center justify-center px-6">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#0a66c2]" />
            <h2 className="mb-2 text-xl font-semibold text-slate-700">Loading Profile Information</h2>
            <p className="text-slate-500">Please wait while we fetch the employee data.</p>
          </div>
        </div>
      </div>
    )
  }

  if (employeeError) {
    return (
      <div className="min-h-screen bg-[#f6f4ef]">
        <CompanyEmployeeHeader mode={currentMode} employeeID={employeeId} onBack={() => {}} />
        <div className="flex min-h-[calc(100vh-88px)] items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-slate-700">Error Loading Profile</h2>
            <p className="mb-4 text-slate-500">Failed to load employee information.</p>
            <Button onClick={fetchEmployeeData} className="bg-[#0a66c2] text-white hover:bg-[#004182]">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f4ef]">
      <CompanyEmployeeHeader mode={currentMode} employeeID={employeeData?.employeeID || employeeId} onBack={() => {}} />

      <div className="px-6 py-6 sm:px-10 xl:px-12">
        <div className="mx-auto max-w-6xl space-y-5">
          <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
            <div className="relative h-40 overflow-hidden border-b border-gray-200 bg-[linear-gradient(120deg,#d8e7f7_0%,#eef4fb_24%,#f8dcc9_58%,#f4c59b_82%,#e4edf7_100%)] sm:h-48">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(15,23,42,0.12))]" />
              <div className="absolute inset-y-0 left-[34%] w-20 rounded-t-[72px] bg-white/70 blur-[1px] sm:w-24" />
              <div className="absolute inset-y-4 left-[50%] w-24 -translate-x-1/2 rounded-t-[84px] bg-white/80 sm:w-28" />
              <div className="absolute inset-y-8 left-[64%] w-20 rounded-t-[68px] bg-white/65 sm:w-24" />
            </div>

            <CardContent className="px-5 pb-5 pt-0 sm:px-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Avatar className="-mt-12 h-[6rem] w-[6rem] border-4 border-white bg-white shadow-md sm:-mt-14 sm:h-28 sm:w-28">
                    {photoPreview ? <AvatarImage src={photoPreview} alt={fullName} /> : null}
                    <AvatarFallback className="bg-gradient-to-br from-slate-200 via-slate-100 to-white text-2xl font-semibold text-slate-700">
                      {getInitials(employeeData?.firstName, employeeData?.middleName, employeeData?.lastName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="relative flex min-w-0 flex-1 flex-col gap-2 pt-1 sm:pt-4 xl:pr-[20rem]">
                    <h1 className="text-xl font-semibold leading-tight text-[#1d2226]">{fullName}</h1>
                    <p className="max-w-3xl text-sm leading-6 text-[#4b5563]">
                      {formatValue(employeeData?.designation?.designationName || deployment?.designation?.designationName)}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                      <span>{formatValue(employeeData?.employeeID)}</span>
                      <span className="hidden text-gray-300 sm:inline">|</span>
                      <span>{formatValue(employeeData?.nationality)}</span>
                      <span className="hidden text-gray-300 sm:inline">|</span>
                      <span>{formatDateForDisplay(employeeData?.joiningDate || employeeData?.dateOfJoining)}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge className="bg-[#e8f1fb] text-[#0a66c2] hover:bg-[#e8f1fb]">
                        {formatValue(statusValue)}
                      </Badge>
                      <Badge variant="outline" className="border-slate-300 text-slate-600">
                        {formatValue(deployment?.employeeCategory?.employeeCategoryTitle)}
                      </Badge>
                      <Badge variant="outline" className="border-slate-300 text-slate-600">
                        {formatValue(deployment?.grade?.gradeTitle)}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2.5 xl:absolute xl:right-0 xl:top-4 xl:mt-0 xl:justify-end">
                      <Button type="button" className="bg-[#0a66c2] px-5 text-white hover:bg-[#004182]">
                        Profile Overview
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Email</p>
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>{formatValue(normalizedEmail)}</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Phone</p>
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{phoneNumber}</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Gender</p>
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                      <User className="h-4 w-4 text-slate-400" />
                      <span>{formatValue(employeeData?.gender)}</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Aadhar</p>
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Shield className="h-4 w-4 text-slate-400" />
                      <span>{formatValue(employeeData?.aadharNumber)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <Briefcase className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Deployment Information</h2>
                  <p className="text-[11px] text-slate-500">Organizational placement and reporting structure</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-[#fbfbfa] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Subsidiary</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{formatValue(deployment?.subsidiary?.subsidiaryName)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatValue(deployment?.subsidiary?.subsidiaryCode)}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-[#fbfbfa] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Division</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{formatValue(deployment?.division?.divisionName)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatValue(deployment?.division?.divisionCode)}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-[#fbfbfa] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Department</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{formatValue(deployment?.department?.departmentName)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatValue(deployment?.department?.departmentCode)}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-[#fbfbfa] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Designation</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{formatValue(deployment?.designation?.designationName)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatValue(deployment?.designation?.designationCode)}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-[#fbfbfa] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Location</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{formatValue(deployment?.location?.locationName)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatValue(deployment?.location?.locationCode)}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-[#fbfbfa] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Manager</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{formatValue(employeeData?.managerName || employeeData?.manager)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatValue(employeeData?.manager)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-100 p-2">
                    <Home className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Temporary Address</h2>
                    <p className="text-[11px] text-slate-500">Current residential contact details</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border-2 border-dashed border-slate-300 bg-[#fbfbfa] p-4">
                  <p className="text-sm font-medium leading-6 text-slate-900">{formatAddress(temporaryAddress)}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Verification: {temporaryAddress?.isVerified ? "Verified" : "Not Verified"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-100 p-2">
                    <MapPin className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Permanent Address</h2>
                    <p className="text-[11px] text-slate-500">Registered permanent location</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border-2 border-dashed border-slate-300 bg-[#fbfbfa] p-4">
                  <p className="text-sm font-medium leading-6 text-slate-900">{formatAddress(permanentAddress)}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Verification: {permanentAddress?.isVerified ? "Verified" : "Not Verified"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
