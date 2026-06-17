"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Briefcase, Building2, Mail, Phone, UserRound, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { encryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto"
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64"
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import useCurrentDomain from "@/hooks/api/useCurrentDomain";

interface ContractorProfileDrawerProps {
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

function getProfileInitials(name?: string) {
  const parts = String(name || "")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) return "C"
  return parts.map((part) => part.charAt(0).toUpperCase()).join("")
}

function getProfileMime(path: string) {
  const lower = path.toLowerCase()
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".gif")) return "image/gif"
  return "application/octet-stream"
}

export default function ContractorProfileDrawer({ open, onClose, userName }: ContractorProfileDrawerProps) {
  const router = useRouter()
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  const [contractorProfile, setContractorProfile] = useState<any>(null)
  const [profilePhoto, setProfilePhoto] = useState("")
  const { fetchByteArray } = useByteToBase64()
  const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()

  const {
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useRequest<any>({
    url: "contractor/search",
    method: "POST",
    data: [
      {
        field: "contractorCode",
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
        setContractorProfile(data[0])
      } else {
        setContractorProfile(null)
      }
    },
    onError: () => {
      setContractorProfile(null)
    },
    dependencies: [employeeId, tenantCode],
  })

  useEffect(() => {
    if (open && tenantCode) {
      refetchProfile()
    }
  }, [open, employeeId, tenantCode])

  useEffect(() => {
    let currentObjectUrl: string | null = null
    const photoValue =
      typeof contractorProfile?.contractorImage === "string"
        ? contractorProfile.contractorImage
        : contractorProfile?.contractorImage?.documentPath

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
  }, [contractorProfile?.contractorImage, open, fetchByteArray])

  const companyDetailsFields = [
    { label: "Type Of Company", value: contractorProfile?.typeOfCompany },
    { label: "Work Type Code", value: contractorProfile?.workType?.workTypeCode || contractorProfile?.workTypeCode },
    { label: "Work Type Title", value: contractorProfile?.workType?.workTypeTitle || contractorProfile?.workTypeTitle },
    { label: "Area Of Work Code", value: contractorProfile?.areaOfWork?.areaOfWorkCode || contractorProfile?.areaOfWorkCode },
    { label: "Area Of Work Title", value: contractorProfile?.areaOfWork?.areaOfWorkTitle || contractorProfile?.areaOfWorkTitle },
  ]

  const handleViewMore = () => {
    const contractorIdValue =
      typeof contractorProfile?._id === "object" && contractorProfile?._id?.$oid
        ? contractorProfile._id.$oid
        : String(contractorProfile?._id || "")

    if (!contractorIdValue) return

    const encryptedData = encryptEmployeeData({ employeeId: employeeId || "", _id: contractorIdValue })
    router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/master/profile/contractor?mode=view&id=${encryptedData}`)
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
              <h2 className="text-sm font-semibold tracking-wide text-slate-700">CONTRACTOR PROFILE</h2>
              <button
                type="button"
                onClick={onClose}
                className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600"
                aria-label="Close profile drawer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Quick access to contractor details and company information</p>
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
              {contractorProfile ? (
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
                    <img src={profilePhoto} alt={userName || "Contractor"} className="h-full w-full object-cover" />
                  ) : (
                    <span className="leading-none text-2xl font-semibold text-slate-700">
                      {getProfileInitials(contractorProfile?.contractorName)}
                    </span>
                  )}
                </div>

                <h3 className="mt-2.5 text-lg font-semibold text-slate-900">{formatValue(contractorProfile?.contractorName)}</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  Contractor Code: {formatValue(contractorProfile?.contractorCode)}
                </p>
                <p className="mt-0 text-xs text-slate-400">
                  Work Location: {formatValue(contractorProfile?.workLocation)}
                </p>

                <div className="mt-3 grid w-full grid-cols-2 gap-3 text-left">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Owner Email</p>
                    <div className="mt-2 flex items-start gap-2 text-xs text-slate-700">
                      <Mail className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                      <span>{formatValue(contractorProfile?.ownerEmailId)}</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Owner Contact</p>
                    <div className="mt-2 flex items-start gap-2 text-xs text-slate-700">
                      <Phone className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                      <span>{formatValue(contractorProfile?.ownerContactNo)}</span>
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
                    <p className="text-sm text-slate-500">Loading contractor details...</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {profileError && !profileLoading ? (
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-slate-500">Failed to load contractor profile.</p>
                </CardContent>
              </Card>
            ) : null}

            {!profileLoading && !profileError ? (
              <>
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-slate-400" />
                      <h4 className="text-sm font-semibold text-slate-900">Basic Information</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Contractor Name</p>
                        <p className="mt-1 font-medium text-slate-900">{formatValue(contractorProfile?.contractorName)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Contractor Code</p>
                        <p className="mt-1 font-medium text-slate-900">{formatValue(contractorProfile?.contractorCode)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Aadhar Number</p>
                        <p className="mt-1 font-medium text-slate-900">{formatValue(contractorProfile?.aadharNumber)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">PAN Number</p>
                        <p className="mt-1 font-medium text-slate-900">{formatValue(contractorProfile?.panNumber)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Owner Name</p>
                        <p className="mt-1 font-medium text-slate-900">{formatValue(contractorProfile?.ownerName)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Owner Contact No</p>
                        <p className="mt-1 font-medium text-slate-900">{formatValue(contractorProfile?.ownerContactNo)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Owner Email</p>
                        <p className="mt-1 font-medium text-slate-900">{formatValue(contractorProfile?.ownerEmailId)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Father Name</p>
                        <p className="mt-1 font-medium text-slate-900">{formatValue(contractorProfile?.fatherName)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Contact Person Name</p>
                        <p className="mt-1 font-medium text-slate-900">{formatValue(contractorProfile?.contactPersonName)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Contact Person Contact No</p>
                        <p className="mt-1 font-medium text-slate-900">{formatValue(contractorProfile?.contactPersonContactNo)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Contact Person Email</p>
                        <p className="mt-1 font-medium text-slate-900">{formatValue(contractorProfile?.contactPersonEmailId)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Birth Date</p>
                        <p className="mt-1 font-medium text-slate-900">{formatDate(contractorProfile?.birthDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Work Location</p>
                        <p className="mt-1 font-medium text-slate-900">{formatValue(contractorProfile?.workLocation)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Service Since</p>
                        <p className="mt-1 font-medium text-slate-900">{formatDate(contractorProfile?.serviceSince)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <h4 className="text-sm font-semibold text-slate-900">Company Details</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      {companyDetailsFields.map((field) => (
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
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      <h4 className="text-sm font-semibold text-slate-900">Primary Contacts</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Owner</p>
                        <p className="mt-1 font-medium text-slate-900">{formatValue(contractorProfile?.ownerName)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Contact Person</p>
                        <p className="mt-1 font-medium text-slate-900">{formatValue(contractorProfile?.contactPersonName)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Owner Contact</p>
                        <p className="mt-1 font-medium text-slate-900">{formatValue(contractorProfile?.ownerContactNo)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Contact Person Contact</p>
                        <p className="mt-1 font-medium text-slate-900">{formatValue(contractorProfile?.contactPersonContactNo)}</p>
                      </div>
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
