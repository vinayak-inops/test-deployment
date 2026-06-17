"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { CalendarDays, Mail, Phone, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64"
import { encryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto"
import { useKeyclockRoleInfo } from "@/hooks/search/keyclock-role-info"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"
import useCurrentDomain from "@/hooks/api/useCurrentDomain";

interface ContractProfileDrawerProps {
  open: boolean
  onClose: () => void
  userName: string
}

function formatValue(value?: unknown): string {
  if (value === undefined || value === null || value === "") return "Not provided"
  if (typeof value === "string" || typeof value === "number") return String(value)
  if (Array.isArray(value)) {
    const normalized: string[] = value.map((item) => formatValue(item)).filter((item) => item !== "Not provided")
    return normalized.length > 0 ? normalized.join(", ") : "Not provided"
  }
  return "Not provided"
}

function formatDate(dateString?: string) {
  if (!dateString) return "Not provided"
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

function getProfileInitials(first?: string, middle?: string, last?: string) {
  const parts = [first, middle, last].filter(Boolean).slice(0, 2)
  if (parts.length === 0) return "U"
  return parts.map((part) => part?.charAt(0).toUpperCase() ?? "").join("")
}

function getProfileMime(path: string) {
  const lower = path.toLowerCase()
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".gif")) return "image/gif"
  return "application/octet-stream"
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

export default function ContractProfileDrawer({ open, onClose, userName }: ContractProfileDrawerProps) {
  const router = useRouter()
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  const [employeeProfile, setEmployeeProfile] = useState<any>(null)
  const [profilePhoto, setProfilePhoto] = useState("")
  const { fetchByteArray } = useByteToBase64()
  const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()

  const {
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useRequest<any>({
    url: "contract_employee/search",
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
        setEmployeeProfile(data[0])
      } else {
        setEmployeeProfile(null)
      }
    },
    onError: () => {
      setEmployeeProfile(null)
    },
    dependencies: [employeeId, tenantCode],
  })

  useEffect(() => {
    if (open && employeeId && tenantCode) {
      refetchProfile()
    }
  }, [open, employeeId, tenantCode])

  useEffect(() => {
    let currentObjectUrl: string | null = null
    const photoValue =
      typeof employeeProfile?.photo === "string" ? employeeProfile.photo : employeeProfile?.photo?.documentPath

    const run = async () => {
      if (!open) {
        setProfilePhoto("")
        return
      }

      if (photoValue && photoValue.startsWith("/app/documents/")) {
        try {
          const result: any = await fetchByteArray(photoValue, getProfileMime(photoValue))
          if (result.success && result.objectUrl) {
            currentObjectUrl = result.objectUrl
            setProfilePhoto(result.objectUrl)
            return
          }
        } catch {}
        setProfilePhoto("")
        return
      }

      setProfilePhoto(photoValue || "")
    }

    void run()

    return () => {
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
    }
  }, [employeeProfile?.photo, open, fetchByteArray])

  const normalizedEmail =
    typeof employeeProfile?.emailID === "object" ? employeeProfile?.emailID?.primaryEmailID : employeeProfile?.emailID
  const personalInformationFields = [
    { label: "Employee ID", value: employeeProfile?.employeeID },
    { label: "First Name", value: employeeProfile?.firstName },
    { label: "Middle Name", value: employeeProfile?.middleName },
    { label: "Last Name", value: employeeProfile?.lastName },
    { label: "Father / Husband Name", value: employeeProfile?.fatherHusbandName },
    { label: "Gender", value: employeeProfile?.gender },
    { label: "Birth Date", value: formatDate(employeeProfile?.birthDate) },
    { label: "Blood Group", value: employeeProfile?.bloodGroup },
    { label: "Nationality", value: employeeProfile?.nationality },
    { label: "Marital Status", value: employeeProfile?.maritalStatus },
    { label: "Caste", value: employeeProfile?.caste },
    { label: "Identification Mark", value: employeeProfile?.identificationMark },
  ]
  const employmentDetailsFields = [
    { label: "Date Of Joining", value: formatDate(employeeProfile?.dateOfJoining) },
    { label: "Contract From", value: formatDate(employeeProfile?.contractFrom) },
    { label: "Contract To", value: formatDate(employeeProfile?.contractTo) },
    { label: "Contract Period", value: employeeProfile?.contractPeriod },
    { label: "Is Rejoining", value: employeeProfile?.rejoin?.isRejoining ? "Yes" : "No" },
    { label: "Old Employee Code", value: employeeProfile?.rejoin?.oldEmployeeCode },
    { label: "Work Skill Title", value: employeeProfile?.workSkill?.workSkillTitle },
    { label: "Payment Mode", value: employeeProfile?.paymentMode },
    { label: "Background Verification Remark", value: employeeProfile?.backgroundVerificationRemark },
    { label: "Nature Of Work Title", value: employeeProfile?.natureOfWork?.natureOfWorkTitle },
    { label: "Manager", value: employeeProfile?.managerName || employeeProfile?.manager },
    { label: "Supervisor", value: employeeProfile?.superviser },
    { label: "Subsidiary Name", value: employeeProfile?.deployment?.subsidiary?.subsidiaryName },
    { label: "Division Name", value: employeeProfile?.deployment?.division?.divisionName },
    { label: "Department Name", value: employeeProfile?.deployment?.department?.departmentName },
    { label: "Sub Department Name", value: employeeProfile?.deployment?.subDepartment?.subDepartmentName },
    { label: "Section Name", value: employeeProfile?.deployment?.section?.sectionName },
    { label: "Employee Category", value: employeeProfile?.deployment?.employeeCategory?.employeeCategoryName },
    { label: "Grade", value: employeeProfile?.deployment?.grade?.gradeName },
    { label: "Designation", value: employeeProfile?.deployment?.designation?.designationName },
    { label: "Location", value: employeeProfile?.deployment?.location?.locationName },
    { label: "Skill Level Title", value: employeeProfile?.deployment?.skillLevel?.skilledLevelTitle },
    { label: "Skill Level Description", value: employeeProfile?.deployment?.skillLevel?.skilledLevelDescription },
    { label: "Contractor Name", value: employeeProfile?.deployment?.contractor?.contractorName },
    { label: "Salary Zone", value: employeeProfile?.deployment?.salaryZone },
  ]

  const handleViewMore = () => {
    const employeeIdValue =
      typeof employeeProfile?._id === "object" && employeeProfile?._id?.$oid
        ? employeeProfile._id.$oid
        : String(employeeProfile?._id || "")

    if (!employeeIdValue) return

    const encryptedData = encryptEmployeeData({ employeeId: employeeId || "", _id: employeeIdValue })
    router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/master/profile/employee?form=cont&mode=view&id=${encryptedData}`)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200]">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-[#f3f4f8] shadow-2xl">
        <div className="sticky top-0 z-[100] bg-[#f3f4f8] px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-slate-700">EMPLOYEE PROFILE</h2>
              <button
                type="button"
                onClick={onClose}
                className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600"
                aria-label="Close profile drawer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Quick access to contract employee details and contact information</p>
          </motion.div>
        </div>

        <div className="px-4 pb-4">
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
            <div className="relative h-32 overflow-hidden border-b border-slate-200 bg-[#2f5fda]">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(15,23,42,0.08))]" />
              <div className="absolute -bottom-3 left-[58%] h-32 w-24 rounded-t-[72px] bg-white/25" />
              <div className="absolute top-4 left-[50%] h-20 w-20 rounded-t-[60px] bg-white/22" />
              <div className="absolute top-7 left-[73%] h-16 w-16 rounded-t-[48px] bg-white/20" />
            </div>
            <CardContent className="px-5 pb-5 pt-0">
              {employeeProfile ? (
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={handleViewMore}
                    className="rounded-lg bg-[#2f5fda] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#244fc0]"
                  >
                    View More
                  </button>
                </div>
              ) : null}

              <div className="flex flex-col items-center text-center">
                <div className="-mt-24 z-50 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt={userName || "Profile"} className="h-full w-full object-cover" />
                  ) : (
                    <span className="leading-none text-2xl font-semibold text-slate-700">
                      {getProfileInitials(employeeProfile?.firstName, employeeProfile?.middleName, employeeProfile?.lastName)}
                    </span>
                  )}
                </div>

                <h3 className="mt-2.5 text-lg font-semibold text-slate-900">
                  {formatValue(
                    [employeeProfile?.firstName, employeeProfile?.middleName, employeeProfile?.lastName]
                      .filter(Boolean)
                      .join(" ")
                  )}
                </h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  Employee ID: {formatValue(employeeProfile?.employeeID)}
                </p>
                <p className="mt-0 text-xs text-slate-400">
                  Department: {formatValue(employeeProfile?.deployment?.department?.departmentName)}
                </p>

                <div className="mt-3 grid w-full grid-cols-2 gap-3 text-left">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Email</p>
                    <div className="mt-2 flex items-start gap-2 text-xs text-slate-700">
                      <Mail className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                      <span>{formatValue(normalizedEmail)}</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Phone</p>
                    <div className="mt-2 flex items-start gap-2 text-xs text-slate-700">
                      <Phone className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                      <span>{getPrimaryContactNumber(employeeProfile?.contactNumber ?? employeeProfile?.mobileNumber)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 space-y-4">
            {profileLoading ? (
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent className="flex items-center justify-center py-10">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#0a66c2] border-t-transparent" />
                    <p className="text-sm text-slate-500">Loading contract profile details...</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {profileError && !profileLoading ? (
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-slate-500">Failed to load contract employee profile.</p>
                </CardContent>
              </Card>
            ) : null}

            {!profileLoading && !profileError ? (
              <>
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">Personal Information</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      {personalInformationFields.map((field) => (
                        <div key={field.label}>
                          <p className="text-xs text-slate-500">{field.label}</p>
                          <p className="mt-1 font-medium text-slate-900">{formatValue(field.value)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      <h4 className="text-sm font-semibold text-slate-900">Employment Details</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      {employmentDetailsFields.map((field) => (
                        <div key={field.label}>
                          <p className="text-xs text-slate-500">{field.label}</p>
                          <p className="mt-1 font-medium text-slate-900">{formatValue(field.value)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  )
}
