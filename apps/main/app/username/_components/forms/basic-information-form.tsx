"use client"

import React, { useState, useEffect } from "react"
import { User, Camera, MapPin, Home } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useSearchParams } from "next/navigation"
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64"
import { useKeyclockRoleInfo } from "@/hooks/search/keyclock-role-info"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"

interface BasicInformationFormProps {
  // No props - component is self-contained
}

export function BasicInformationForm({}: BasicInformationFormProps = {}) {
  // Byte to Base64 hook for fetching server images
  const { fetchByteArray } = useByteToBase64()

  const { employeeId } = useKeyclockRoleInfo()
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const [localFormData, setLocalFormData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const tenantCode =useGetTenantCode()
  
  // Guess mime from file extension
  const guessMimeFromPath = (path: string): string => {
    const lower = path.toLowerCase()
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
    if (lower.endsWith('.png')) return 'image/png'
    if (lower.endsWith('.gif')) return 'image/gif'
    if (lower.endsWith('.webp')) return 'image/webp'
    return 'application/octet-stream'
  }

  // Build preview URL from document path
  const buildPreviewUrl = (documentPath: string | undefined | null): string => {
    if (!documentPath) return ''
    const path = documentPath.trim()
    if (!path) return ''
    // Absolute or data URL: return as-is
    if (path.startsWith('data:') || /^https?:\/\//i.test(path)) return path
    // Normalize leading slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim()
    if (!base) return normalizedPath
    // Remove trailing slash from base to avoid //
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
    return `${normalizedBase}${normalizedPath}`
  }
  
  // Get the "mode" value from the URL query parameters
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const currentMode = (modeParam === "add" || modeParam === "edit" || modeParam === "view") ? modeParam : "add";

  // Fetch employee data
  const {
    data: employeeDataResponse,
    loading: isLoadingEmployeeData,
    error: employeeDataError,
    refetch: fetchEmployeeData
  } = useRequest<any>({
    url: 'company_employee/search',
    method: 'POST',
    data: [
      {
        field: "employeeID",
        value: employeeId,
        operator: "eq",
      },
      {
        field:"tenantCode",
        value:tenantCode,
        operator:"eq"
      }
    ],
    onSuccess: (data) => {
      if (data && data.length > 0) {
        const employeeData = data[0]

        // Normalize emailID - handle both string and object formats
        const normalizedEmailID = typeof employeeData.emailID === 'object' 
          ? employeeData.emailID?.primaryEmailID || "" 
          : employeeData.emailID || ""
        // Set local form data with normalized values
        setLocalFormData({
          _id: employeeData._id,
          employeeID: employeeData.employeeID || "",
          firstName: employeeData.firstName || "",
          middleName: employeeData.middleName || "",
          lastName: employeeData.lastName || "",
          gender: employeeData.gender || "",
          birthDate: employeeData.birthDate || "",
          bloodGroup: employeeData.bloodGroup || "",
          photo: employeeData.photo || "",
          nationality: employeeData.nationality || "",
          maritalStatus: employeeData.maritalStatus || "",
          joiningDate: employeeData.joiningDate || employeeData.dateOfJoining || "",
          emailID: normalizedEmailID,
          aadharNumber: employeeData.aadharNumber || "",
          status: employeeData.status || (typeof employeeData.status === 'object' ? employeeData.status?.currentStatus : undefined),
          // Add address data
          address: employeeData.address || {},
        })
      }
      setLoading(false)
    },
    onError: (error) => {
      setLoading(false)
    },
    dependencies: [employeeId]
  })

  // Trigger fetch when employeeId is available
  useEffect(() => {
      fetchEmployeeData()
  }, [employeeId])

  // Photo preview effect: fetch bytes when photo is a server path
  useEffect(() => {
    let currentObjectUrl: string | null = null
    const photoValue: string | undefined = (typeof localFormData?.photo === 'string' ? localFormData.photo : localFormData?.photo?.documentPath)

    const run = async () => {
      if (photoValue && photoValue.startsWith('/app/documents/')) {
        const mime = guessMimeFromPath(photoValue)
        try {
          const res: any = await fetchByteArray(photoValue, mime)
          if (res.success && res.objectUrl) {
            currentObjectUrl = res.objectUrl
            setPhotoPreview(res.objectUrl)
          } else {
            setPhotoPreview("")
          }
        } catch {
          setPhotoPreview("")
        }
      } else if (photoValue) {
        setPhotoPreview(photoValue)
      } else {
        setPhotoPreview("")
      }
    }

    void run()
    return () => {
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
    }
  }, [localFormData?.photo, fetchByteArray])

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const isViewMode = currentMode === "view";

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Employee Information Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Employee Information</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Complete employee details including basic information, personal details, and contact information
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          {/* Combined Profile Photo & Employee Identification */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gray-100 rounded-md">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Profile & Identification</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column: Profile Photo */}
              <div className="lg:col-span-1">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-[130px] h-[130px] rounded-lg border-2 border-gray-300 overflow-hidden bg-gray-50">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Employee photo"
                          className="w-full h-full object-cover"
                          onError={() => setPhotoPreview("")}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <Camera className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Employee Identification & Personal Information */}
              <div className="lg:col-span-3">
                {/* Personal Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  {/* First Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">First Name</label>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{`${localFormData.firstName} ${localFormData.middleName} ${localFormData.lastName}`.trim() || "-"}</span>
                    </div>
                  </div>

                  {/* Employee ID */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee ID</label>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{localFormData.employeeID || "-"}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                    <div>
                      <span className="text-sm font-medium text-gray-900 capitalize">{localFormData.status || "-"}</span>
                    </div>
                  </div>

                  {/* Joining Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Joining Date</label>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{formatDateForDisplay(localFormData.joiningDate) || "-"}</span>
                    </div>
                  </div>

                  {/* Aadhar Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aadhar Number</label>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{localFormData.aadharNumber || "-"}</span>
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</label>
                    <div>
                      <span className="text-sm text-gray-900">{localFormData.gender || "-"}</span>
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date of Birth</label>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{formatDateForDisplay(localFormData.birthDate) || "-"}</span>
                    </div>
                  </div>

                  {/* Blood Group */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Blood Group</label>
                    <div>
                      <span className="text-sm text-gray-900">{localFormData.bloodGroup || "-"}</span>
                    </div>
                  </div>

                  {/* Marital Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Marital Status</label>
                    <div>
                      <span className="text-sm text-gray-900">{localFormData.maritalStatus || "-"}</span>
                    </div>
                  </div>

                  {/* Nationality */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nationality</label>
                    <div>
                      <span className="text-sm text-gray-900">{localFormData.nationality || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gray-100 rounded-md">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Contact Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
                <div>
                  <span className="text-sm font-medium text-gray-900">{localFormData.emailID || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-6">
            {/* Temporary Address Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gray-100 rounded-md">
                  <Home className="h-4 w-4 text-gray-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Temporary Address</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                {/* Address Line 1 */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address Line 1</label>
                  <div>
                    <span className="text-sm text-gray-900">
                      {localFormData.address?.temporaryAddress?.addressLine1 || "-"}
                    </span>
                  </div>
                </div>

                {/* Address Line 2 */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address Line 2</label>
                  <div>
                    <span className="text-sm text-gray-900">
                      {localFormData.address?.temporaryAddress?.addressLine2 || "-"}
                    </span>
                  </div>
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">City</label>
                  <div>
                    <span className="text-sm text-gray-900">
                      {localFormData.address?.temporaryAddress?.city || "-"}
                    </span>
                  </div>
                </div>

                {/* State */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">State</label>
                  <div>
                    <span className="text-sm text-gray-900">
                      {localFormData.address?.temporaryAddress?.state || "-"}
                    </span>
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Country</label>
                  <div>
                    <span className="text-sm text-gray-900">
                      {localFormData.address?.temporaryAddress?.country || "-"}
                    </span>
                  </div>
                </div>

                {/* PIN Code */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PIN Code</label>
                  <div>
                    <span className="text-sm text-gray-900">
                      {localFormData.address?.temporaryAddress?.pinCode || "-"}
                    </span>
                  </div>
                </div>

                {/* Verification Status */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Verification Status</label>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${localFormData.address?.temporaryAddress?.isVerified ? 'bg-gray-900' : 'bg-gray-400'}`} />
                      <span className="text-sm text-gray-900">
                        {localFormData.address?.temporaryAddress?.isVerified 
                          ? "Verified" 
                          : "Not Verified"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Permanent Address Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gray-100 rounded-md">
                  <MapPin className="h-4 w-4 text-gray-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Permanent Address</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                {/* Address Line 1 */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address Line 1</label>
                  <div>
                    <span className="text-sm text-gray-900">
                      {localFormData.address?.permanentAddress?.addressLine1 || "-"}
                    </span>
                  </div>
                </div>

                {/* Address Line 2 */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address Line 2</label>
                  <div>
                    <span className="text-sm text-gray-900">
                      {localFormData.address?.permanentAddress?.addressLine2 || "-"}
                    </span>
                  </div>
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">City</label>
                  <div>
                    <span className="text-sm text-gray-900">
                      {localFormData.address?.permanentAddress?.city || "-"}
                    </span>
                  </div>
                </div>

                {/* State */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">State</label>
                  <div>
                    <span className="text-sm text-gray-900">
                      {localFormData.address?.permanentAddress?.state || "-"}
                    </span>
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Country</label>
                  <div>
                    <span className="text-sm text-gray-900">
                      {localFormData.address?.permanentAddress?.country || "-"}
                    </span>
                  </div>
                </div>

                {/* PIN Code */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PIN Code</label>
                  <div>
                    <span className="text-sm text-gray-900">
                      {localFormData.address?.permanentAddress?.pinCode || "-"}
                    </span>
                  </div>
                </div>

                {/* Taluka */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Taluka</label>
                  <div>
                    <span className="text-sm text-gray-900">
                      {localFormData.address?.permanentAddress?.taluka || "-"}
                    </span>
                  </div>
                </div>

                {/* Verification Status */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Verification Status</label>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${localFormData.address?.permanentAddress?.isVerified ? 'bg-gray-900' : 'bg-gray-400'}`} />
                      <span className="text-sm text-gray-900">
                        {localFormData.address?.permanentAddress?.isVerified 
                          ? "Verified" 
                          : "Not Verified"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}