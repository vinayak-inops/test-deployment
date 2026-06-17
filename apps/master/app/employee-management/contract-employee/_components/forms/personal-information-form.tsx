"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { gql, useQuery } from "@apollo/client"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { SingleSelectField } from "@/components/fields/single-select-field"
import { User, Upload, X } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { SuccessPopup } from "@/components/success-popup"
import PreviewOfEmp from "@/app/contractor/_components/forms/basic-information/preview-of-emp"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useFileUpload } from "@/hooks/api/file-handle/useFileUpload"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import { FormActionsFooter } from "../../../../../components/footer/form-actions-footer"
import { GradientFormHeader } from "../../../../../components/header/form-header"
import { SubFormTitle } from "../../../../../components/header/sub-form-title"
import {
  createPersonalInformationSchema,
  normalizePersonalInformationConfig,
  type PersonalInformationFieldsConfig,
  type PersonalInformationTabConfig,
  type PersonalInformationData,
} from "../schemas/personal-information-schema"
import { toast } from "react-toastify"

interface PersonalInformationFormProps {
  employeeRecordId?: string | null
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
}

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

const extractServerPath = (res: any): string => {
  if (typeof res?.serverPath === "string") return res.serverPath
  if (typeof res?.data === "string") return res.data
  if (typeof res?.data?.path === "string") return res.data.path
  if (typeof res?.data?.serverPath === "string") return res.data.serverPath
  if (typeof res?.path === "string") return res.path
  return ""
}

const FETCH_ORGANIZATION_CASTE_QUERY = gql`
  query FetchOrganizationCaste($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      caste {
        casteName
        casteDescription
      }
    }
  }
`

export function PersonalInformationForm({
  employeeRecordId = null,
  onNextTab,
  onPreviousTab,
  mode = "add",
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
}: PersonalInformationFormProps) {
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [photoFileName, setPhotoFileName] = useState("")
  const [photoUploading, setPhotoUploading] = useState(false)
  const photoRef = useRef("")
  const tenantCode = useGetTenantCode()
  const { uploadFile: uploadEmployeePhoto } = useFileUpload({ uploadPath: "contract_employee" })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })

  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const resolvedEmployeeRecordId = employeeRecordId || id
  const currentMode = mode
  const isViewMode = currentMode === "view"

  const personalInformationTabConfig = useMemo(
    () =>
      normalizePersonalInformationConfig(
        (formStructure?.personalInformation as
          | PersonalInformationFieldsConfig
          | PersonalInformationTabConfig
          | undefined) ?? undefined
      ),
    [formStructure]
  )

  const personalInformationSchema = useMemo(
    () =>
      createPersonalInformationSchema({
        tabRequired: personalInformationTabConfig.tabRequired,
        fields: personalInformationTabConfig.fields,
      }),
    [personalInformationTabConfig]
  )

  const isRequired = (field: keyof PersonalInformationData) =>
    personalInformationTabConfig.fields[field]?.required ??
    ({
      employeeID: true,
      firstName: true,
      gender: true,
      nationality: true,
      identificationMark: true,
    } as Partial<Record<keyof PersonalInformationData, boolean>>)[field] ??
    false

  const isVisible = (field: keyof PersonalInformationData) =>
    personalInformationTabConfig.fields[field]?.visible ?? true

  const getLabel = (field: keyof PersonalInformationData, fallback: string) =>
    personalInformationTabConfig.fields[field]?.label || fallback

  const showProfilePhoto = isVisible("photo")
  const showBasicInformation =
    isVisible("employeeID") ||
    isVisible("firstName") ||
    isVisible("middleName") ||
    isVisible("lastName") ||
    isVisible("fatherHusbandName")
  const showPersonalDetails =
    isVisible("gender") ||
    isVisible("birthDate") ||
    isVisible("bloodGroup") ||
    isVisible("nationality") ||
    isVisible("maritalStatus") ||
    isVisible("caste") ||
    isVisible("identificationMark")

  const {
    post: postPersonalInformation,
    loading: postLoading,
  } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        setShowErrors(true)
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const applyFieldError = (fieldName: string, message: string) => {
          const normalized = fieldName.trim()
          if (!normalized || !message.trim()) return
          setError(normalized as any, {
            type: "server",
            message,
          })
        }

        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return

            if (typeof message === "string") {
              applyFieldError(fieldName, message)
              return
            }

            if (message && typeof message === "object") {
              Object.entries(message as Record<string, unknown>).forEach(([childKey, childValue]) => {
                if (typeof childValue !== "string") return
                applyFieldError(`${fieldName}.${childKey}`, childValue)
              })
            }
          })
        }
        return
      }
      fetchEmployee()
      toast.success("Personal information saved successfully!")
    },
    onError: (error) => {
      console.error("Error saving personal information:", error)
    },
  })

  const { refetch: fetchEmployee } = useRequest<any>({
    url: employeeSearchUrl,
    method: "POST",
    data: [
      {
        field: "_id",
        value: resolvedEmployeeRecordId,
        operator: "eq",
      },
    ],
    onSuccess: (data) => {
      if (Array.isArray(data) && data[0] && data[0].isDeleted !== true) {
        setEmployeeData(data[0])
      }
    },
    onError: (error) => {
      console.error("Error fetching employee data:", error)
    },
    dependencies: [resolvedEmployeeRecordId, employeeSearchUrl],
  })

  const emptyFormValues: PersonalInformationData = {
    photo: "",
    employeeID: "",
    firstName: "",
    middleName: "",
    lastName: "",
    fatherHusbandName: "",
    gender: undefined as any,
    birthDate: "",
    bloodGroup: undefined,
    nationality: "",
    maritalStatus: undefined,
    caste: "",
    identificationMark: "",
  }

  const {
    register,
    formState: { errors, isValid },
    watch,
    setValue,
    setError,
    trigger,
    reset,
    clearErrors,
  } = useForm<PersonalInformationData>({
    resolver: zodResolver(personalInformationSchema),
    defaultValues: emptyFormValues,
    mode: "onChange",
  })

  // Helper function to safely get error message from error object
  const getErrorMessage = (error: unknown): string | undefined => {
    if (error && typeof error === "object" && "message" in error) {
      return (error as { message: string }).message
    }
    return undefined
  }

  const watchedValues = watch()
  const auditEntityId = String(resolvedEmployeeRecordId || watchedValues?.employeeID || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const shouldShowConfigLoader = formStructureLoading || !formStructure

  const { data: organizationResponse } = useQuery(FETCH_ORGANIZATION_CASTE_QUERY, {
    variables: {
      criteriaRequests: [{ field: "tenantCode", operator: "eq", value: tenantCode }],
      collection: "organization",
    },
    skip: !tenantCode,
    client,
  })
  const casteArray = useMemo(() => {
    const organizations = organizationResponse?.fetchOrganization
    if (!Array.isArray(organizations) || organizations.length === 0) return []
    const caste = organizations[0]?.caste
    return Array.isArray(caste) ? caste : []
  }, [organizationResponse])

  useEffect(() => {
    if (!resolvedEmployeeRecordId || currentMode === "add") return
    void fetchEmployee()
  }, [resolvedEmployeeRecordId, currentMode, employeeSearchUrl])

  useEffect(() => {
    if (!employeeData) {
      reset(emptyFormValues)
      return
    }

    reset({
      photo: employeeData.photo || photoRef.current || "",
      employeeID: employeeData.employeeID || "",
      firstName: employeeData.firstName || "",
      middleName: employeeData.middleName || "",
      lastName: employeeData.lastName || "",
      fatherHusbandName: employeeData.fatherHusbandName || "",
      gender: employeeData.gender || undefined,
      birthDate: employeeData.birthDate || "",
      bloodGroup: employeeData.bloodGroup || undefined,
      nationality: employeeData.nationality || "",
      maritalStatus: employeeData.maritalStatus || undefined,
      caste: employeeData.caste || "",
      identificationMark: employeeData.identificationMark || "",
    })
  }, [employeeData, reset])

  const handleInputChange = async (field: keyof PersonalInformationData, value: any) => {
    setValue(field, value)
    await trigger(field)
  }

  const handleSelectChange = async (field: keyof PersonalInformationData, value: any) => {
    setValue(field, value)
    await trigger(field)
  }

  const removePhoto = () => {
    setValue("photo", "")
    setPhotoFileName("")
    photoRef.current = ""
  }

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputElement = event.target as HTMLInputElement
    const file = inputElement.files?.[0]
    if (!file) return

    const ext = file.name.split(".").pop() || "png"
    const code = watchedValues.employeeID || watchedValues.firstName || "employee"
    const now = new Date()
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`
    const fileName = `${String(code).replace(/\s+/g, "_")}_photo_${ts}.${ext}`
    const renamed = new File([file], fileName, { type: file.type })

    setPhotoUploading(true)

    uploadEmployeePhoto(renamed, fileName)
      .then((res: any) => {
        const serverPath = extractServerPath(res)
        if (res?.success && serverPath) {
          setPhotoFileName(file.name)
          photoRef.current = serverPath
          setValue("photo", serverPath)
          void trigger("photo")
          return
        }
        setValue("photo", "")
        toast.error(res?.error || "Photo upload failed")
      })
      .catch(() => {
        setValue("photo", "")
        toast.error("Photo upload failed")
      })
      .finally(() => {
        setPhotoUploading(false)
        inputElement.value = ""
      })
  }

  const handleSaveAndContinue = async () => {
    if (shouldShowConfigLoader || photoUploading) return
    setShowErrors(true)
    clearErrors()
    const formValues = watch()

    const valid = await trigger()
    if (!valid) return

    const isEditMode = currentMode === "edit" && Boolean(resolvedEmployeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: resolvedEmployeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "contractEmployeeBasic",
      data: {
        ...formValues,
        personalInformation: true,
      },
      audit: auditPayload,
    }
    postPersonalInformation(payload)
  }

  const handleSave = async () => {
    await handleSaveAndContinue()
  }

  const handleContinue = async () => {
    setShowErrors(true)
    const valid = await trigger()
    if (!valid) return

    if (onNextTab) onNextTab()
  }

  const employeeIdDisabled = currentMode === "edit" || currentMode === "view"

  return (
    <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
      {postLoading && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
          <div className="rounded-md bg-white shadow px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Saving permissions...</span>
          </div>
        </div>
      )}
      <GradientFormHeader
        icon={User}
        title="Personal Information"
        description="Essential personal details and identification"
      />

      <CardContent className="flex-1 px-6 py-4 space-y-6 overflow-y-auto">
        {shouldShowConfigLoader ? (
          <div className="py-12 text-center text-sm text-gray-600">
            Loading form configuration...
          </div>
        ) : (
          <>
        {showErrors && Object.keys(errors).length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Please fix highlighted fields before continuing.
          </div>
        )}

        {(showProfilePhoto || showBasicInformation) && (
        <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-6 gap-6 items-start">
          {showProfilePhoto && (
          <div className="space-y-3 lg:col-span-1 xl:col-span-1">
            <SubFormTitle title={getLabel("photo", "Profile Photo")} />
            <div className="rounded-lg border border-gray-200 p-2 flex justify-center min-h-[140px] relative overflow-hidden">
              <PreviewOfEmp path={watchedValues?.photo || ""} />
              {!isViewMode && watchedValues?.photo && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {!isViewMode && (
              <label className={`h-9 border border-gray-300 rounded-md flex items-center justify-center gap-2 px-3 ${photoUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                <Upload className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">
                  {photoUploading ? "Uploading..." : photoFileName || "Upload photo"}
                </span>
                <input type="file" className="hidden" accept="image/*" disabled={photoUploading} onChange={handlePhotoChange} />
              </label>
            )}
            {showErrors && getErrorMessage(errors.photo) && (
              <p className="text-xs text-red-600">{getErrorMessage(errors.photo)}</p>
            )}
          </div>
          )}

          {showBasicInformation && (
          <div className={`space-y-3 ${showProfilePhoto ? "lg:col-span-4 xl:col-span-5" : "lg:col-span-5 xl:col-span-6"}`}>
            <SubFormTitle title="Basic Information" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isVisible("employeeID") && (
            <div className="space-y-2">
              <Label htmlFor="employeeID" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("employeeID", "Employee ID")} {isRequired("employeeID") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                {...register("employeeID")}
                id="employeeID"
                disabled={employeeIdDisabled}
                onChange={(e) => {
                  void handleInputChange("employeeID", e.target.value)
                }}
                className={`${INPUT_CLASS} ${employeeIdDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="e.g., 10001"
              />
              {showErrors && getErrorMessage(errors.employeeID) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.employeeID)}</p>
              )}
            </div>
            )}

            {isVisible("firstName") && (
            <div className="space-y-2">
              <Label htmlFor="firstName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("firstName", "First Name")} {isRequired("firstName") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                {...register("firstName")}
                id="firstName"
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="e.g., Satyanarayana"
              />
              {showErrors && getErrorMessage(errors.firstName) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.firstName)}</p>
              )}
            </div>
            )}

            {isVisible("middleName") && (
            <div className="space-y-2">
              <Label htmlFor="middleName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("middleName", "Middle Name")}
              </Label>
              <Input
                {...register("middleName")}
                id="middleName"
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="e.g., (optional)"
              />
              {showErrors && getErrorMessage(errors.middleName) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.middleName)}</p>
              )}
            </div>
            )}

            {isVisible("lastName") && (
            <div className="space-y-2">
              <Label htmlFor="lastName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("lastName", "Last Name")}
              </Label>
              <Input
                {...register("lastName")}
                id="lastName"
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="e.g., Bondugula"
              />
              {showErrors && getErrorMessage(errors.lastName) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.lastName)}</p>
              )}
            </div>
            )}

            {isVisible("fatherHusbandName") && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fatherHusbandName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("fatherHusbandName", "Father / Husband Name")}
              </Label>
              <Input
                {...register("fatherHusbandName")}
                id="fatherHusbandName"
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="e.g., (optional)"
              />
              {showErrors && getErrorMessage(errors.fatherHusbandName) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.fatherHusbandName)}</p>
              )}
            </div>
            )}
            </div>
          </div>
          )}
        </div>
        )}

        {showPersonalDetails && (
        <div className="space-y-3">
          <SubFormTitle title="Personal Details" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isVisible("gender") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("gender", "Gender")} {isRequired("gender") && <span className="text-red-500">*</span>}
              </Label>
              <Select
                value={watchedValues.gender}
                onValueChange={(value) => {
                  void handleSelectChange("gender", value)
                }}
                disabled={isViewMode}
              >
                <SelectTrigger className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
              {showErrors && getErrorMessage(errors.gender) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.gender)}</p>
              )}
            </div>
            )}

            {isVisible("birthDate") && (
            <div className="space-y-2">
              <Label htmlFor="birthDate" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("birthDate", "Date of Birth")} {isRequired("birthDate") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                {...register("birthDate")}
                id="birthDate"
                type="date"
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              {showErrors && getErrorMessage(errors.birthDate) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.birthDate)}</p>
              )}
            </div>
            )}

            {isVisible("bloodGroup") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("bloodGroup", "Blood Group")} {isRequired("bloodGroup") && <span className="text-red-500">*</span>}
              </Label>
              <Select
                value={watchedValues.bloodGroup}
                onValueChange={(value) => {
                  void handleSelectChange("bloodGroup", value)
                }}
                disabled={isViewMode}
              >
                <SelectTrigger className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
              {showErrors && getErrorMessage(errors.bloodGroup) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.bloodGroup)}</p>
              )}
            </div>
            )}

            {isVisible("nationality") && (
            <div className="space-y-2">
              <Label htmlFor="nationality" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("nationality", "Nationality")} {isRequired("nationality") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                {...register("nationality")}
                id="nationality"
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="e.g., Indian"
              />
              {showErrors && getErrorMessage(errors.nationality) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.nationality)}</p>
              )}
            </div>
            )}

            {isVisible("maritalStatus") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("maritalStatus", "Marital Status")} {isRequired("maritalStatus") && <span className="text-red-500">*</span>}
              </Label>
              <Select
                value={watchedValues.maritalStatus}
                onValueChange={(value) => {
                  void handleSelectChange("maritalStatus", value)
                }}
                disabled={isViewMode}
              >
                <SelectTrigger className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Unmarried">Unmarried</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
              {showErrors && getErrorMessage(errors.maritalStatus) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.maritalStatus)}</p>
              )}
            </div>
            )}

            {isVisible("caste") && (
            <SingleSelectField
              key="caste"
              id="caste"
              label={getLabel("caste", "Caste")}
              required={isRequired("caste")}
              placeholder="Search Caste"
              disabled={isViewMode || postLoading}
              value={watchedValues.caste || ""}
              onChange={(value) => {
                void handleSelectChange("caste", value)
              }}
              options={(casteArray ?? []).map((o: any) => ({
                value: o.casteName || o.name || "",
                label: o.casteName || o.name || "",
                tooltip: o.casteDescription || o.casteName || o.name || "",
              }))}
              showOnlyValueInTrigger
              className="space-y-2"
              errorMessage={showErrors && getErrorMessage(errors.caste) ? getErrorMessage(errors.caste) : undefined}
              allowOnlyProvidedOptions
            />
            )}

            {isVisible("identificationMark") && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="identificationMark" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("identificationMark", "Identification Mark")} {isRequired("identificationMark") && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                {...register("identificationMark")}
                id="identificationMark"
                disabled={isViewMode}
                className={`min-h-[72px] border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="e.g., A mole on left palm"
              />
              {showErrors && getErrorMessage(errors.identificationMark) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.identificationMark)}</p>
              )}
            </div>
            )}
            </div>
          </div>
        )}
          </>
        )}
      </CardContent>
      <FormActionsFooter
        onPreviousTab={onPreviousTab}
        isViewMode={isViewMode}
        isValid={isValid}
        showErrors={showErrors}
        errorCount={Object.keys(errors).length}
        postLoading={postLoading || shouldShowConfigLoader || photoUploading}
        onSave={handleSave}
      />
    </Card>
  )
}