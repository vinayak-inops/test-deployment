"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { useFileUpload } from "@/hooks/api/file-handle/useFileUpload"
import PreviewOfEmp from "@/app/contractor/_components/forms/basic-information/preview-of-emp"
import { User, Upload, X } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { toast } from "react-toastify"
import { GradientFormHeader } from "../../../../../components/header/form-header"
import { SubFormTitle } from "../../../../../components/header/sub-form-title"
import { FormActionsFooter } from "../../../../../components/footer/form-actions-footer"
import { useDynamicSchemaConfig } from "../hooks/useDynamicSchemaConfig"
import { useCollectionFormStructure } from "../../../../../hooks/form-functions/useCollectionFormStructure"
import {
  createBasicInformationSchema,
  normalizeBasicInformationConfig,
  type BasicInformationFieldsConfig,
  type BasicInformationTabConfig,
  type BasicInformationData,
} from "../schemas/basic-information-draft-schema"

const formatAadharNumber = (value: string) => {
  const digits = value.replace(/\D/g, "").substring(0, 12)
  return digits.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3").trim()
}

const getUnformattedAadhar = (value: string) => value.replace(/\D/g, "").substring(0, 12)
const formatPhoneNumber = (value: string) => value.replace(/\D/g, "").substring(0, 10)
const formatPANNumber = (value: string) => value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().substring(0, 10)
const INPUT_CLASS = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

const extractServerPath = (res: any): string => {
  if (typeof res?.serverPath === "string") return res.serverPath
  if (typeof res?.data === "string") return res.data
  if (typeof res?.data?.path === "string") return res.data.path
  if (typeof res?.data?.serverPath === "string") return res.data.serverPath
  if (typeof res?.path === "string") return res.path
  return ""
}

interface BasicInformationFormProps {
  employeeRecordId?: string | null
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  onSaved?: () => void
}

export function BasicInformationForm({
  employeeRecordId = null,
  onPreviousTab,
  mode = "add",
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  onSaved,
}: BasicInformationFormProps) {
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()
  const { uploadFile: uploadContractorImage } = useFileUpload({ uploadPath: "contractor" })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contractor_form_strcture",
  })
  const emptyValues: BasicInformationData = {
    contractorName: "",
    contractorCode: "",
    aadharNumber: "",
    panNumber: "",
    ownerName: "",
    ownerContactNo: "",
    ownerEmailId: "",
    fatherName: "",
    contactPersonName: "",
    contactPersonContactNo: "",
    contactPersonEmailId: "",
    birthDate: "",
    workLocation: "",
    contractorImage: "",
    serviceSince: "",
  }

  const basicInformationTabConfig = useMemo(
    () =>
      normalizeBasicInformationConfig(
        (formStructure?.basicInformation as
          | BasicInformationFieldsConfig
          | BasicInformationTabConfig
          | undefined)
      ),
    [formStructure]
  )
  const basicInformationSchema = useMemo(
    () => createBasicInformationSchema(basicInformationTabConfig),
    [basicInformationTabConfig]
  )

  const { schema, isRequired, isVisible, getLabel } = useDynamicSchemaConfig({
    schema: basicInformationSchema,
    fieldConfig: basicInformationTabConfig,
    emptyValues,
  })

  const idFromUrl = searchParams.get("id")
  const resolvedEmployeeRecordId = employeeRecordId || idFromUrl
  const isViewMode = mode === "view"
  const [showErrors, setShowErrors] = useState(false)
  const [photoFileName, setPhotoFileName] = useState("")
  const [photoUploading, setPhotoUploading] = useState(false)
  const contractorImageRef = useRef("")
  const showOwnerSection =
    isVisible("ownerName") ||
    isVisible("ownerContactNo") ||
    isVisible("ownerEmailId")
  const showContactPersonSection =
    isVisible("contactPersonName") ||
    isVisible("contactPersonContactNo") ||
    isVisible("contactPersonEmailId")
  const showAdditionalSection =
    isVisible("fatherName") ||
    isVisible("workLocation")
  const showContractorPhoto = isVisible("contractorImage")
  const showContractorDetailsSection =
    isVisible("contractorName") ||
    isVisible("contractorCode") ||
    isVisible("aadharNumber") ||
    isVisible("panNumber") ||
    isVisible("serviceSince") ||
    isVisible("birthDate")

  const shouldShowConfigLoader = formStructureLoading || !formStructure

  const {
    register,
    watch,
    setValue,
    trigger,
    reset,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<BasicInformationData>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
    mode: "onChange",
  })

  const watchedValues = watch()

  const { refetch: fetchContractor } = useRequest<any>({
    url: employeeSearchUrl,
    method: "POST",
    data: [{ field: "_id", value: resolvedEmployeeRecordId, operator: "eq" }],
    onSuccess: (data) => {
      if (Array.isArray(data) && data[0] && data[0].isDeleted !== true) {
        const row = data[0]
        reset({
          contractorName: row.contractorName || "",
          contractorCode: row.contractorCode || "",
          ownerName: row.ownerName || "",
          ownerContactNo: row.ownerContactNo || "",
          ownerEmailId: row.ownerEmailId || "",
          fatherName: row.fatherName || "",
          contactPersonName: row.contactPersonName || "",
          contactPersonContactNo: row.contactPersonContactNo || "",
          contactPersonEmailId: row.contactPersonEmailId || "",
          birthDate: row.birthDate || "",
          workLocation: row.workLocation || "",
          aadharNumber: row.aadharNumber || "",
          panNumber: row.panNumber || "",
          contractorImage: row.contractorImage || contractorImageRef.current || "",
          serviceSince: row.serviceSince || "",
        })
      }
    },
    onError: (error) => {
      console.error("Error fetching contractor data:", error)
    },
    dependencies: [resolvedEmployeeRecordId, employeeSearchUrl],
  })

  const { post: postContractor, loading: postLoading } = usePostRequest<any>({
    url: contractorCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
            if (typeof message !== "string" || !message.trim()) return
            setError(fieldName as keyof BasicInformationData, {
              type: "server",
              message,
            })
          })
        }
        return
      }

      toast.success("Contractor basic information saved successfully!")
      if (resolvedEmployeeRecordId && mode !== "add") {
        void fetchContractor()
      }
      onSaved?.()
    },
    onError: (error) => {
      console.error("Error saving contractor basic information:", error)
    },
  })

  useEffect(() => {
    if (!resolvedEmployeeRecordId || mode === "add") {
      reset(emptyValues)
      return
    }
    void fetchContractor()
  }, [resolvedEmployeeRecordId, mode, employeeSearchUrl])

  const removePhoto = () => {
    setValue("contractorImage", "")
    setPhotoFileName("")
  }

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputElement = event.target as HTMLInputElement
    const file = inputElement.files?.[0]
    if (!file) return

    const ext = file.name.split(".").pop() || "png"
    const code = watchedValues.contractorCode || watchedValues.contractorName || "contractor"
    const now = new Date()
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`
    const fileName = `${String(code).replace(/\s+/g, "_")}_contractorImage_${ts}.${ext}`
    const renamed = new File([file], fileName, { type: file.type })

    setPhotoUploading(true)

    uploadContractorImage(renamed, fileName)
      .then((res: any) => {
        const serverPath = extractServerPath(res)
        if (res?.success && serverPath) {
          setPhotoFileName(file.name)
          contractorImageRef.current = serverPath
          setValue("contractorImage", serverPath)
          void trigger("contractorImage")
          return
        }
        setValue("contractorImage", "")
        toast.error(res?.error || "Contractor image upload failed")
      })
      .catch(() => {
        setValue("contractorImage", "")
        toast.error("Contractor image upload failed")
      })
      .finally(() => {
        setPhotoUploading(false)
        inputElement.value = ""
      })
  }

  const handleSave = async () => {
    if (shouldShowConfigLoader || photoUploading) return
    setShowErrors(true)
    clearErrors()
    const valid = await trigger()
    if (!valid) return

    const values = {
      ...emptyValues,
      ...watch(),
    }
    const isEditMode = mode === "edit" && Boolean(resolvedEmployeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: resolvedEmployeeRecordId } : {}),
      collectionName: "contractor",
      ruleId: "contractorDetails",
      data: {
        ...values,
      },
    }
    console.log("Payload to be sent for saving contractor basic information:", payload)
    postContractor?.(payload)
  }

  return (
    <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
      <GradientFormHeader
        icon={User}
        title="Basic Information"
        description="Essential contractor details and identification"
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

        {(showContractorPhoto || showContractorDetailsSection) && (
        <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-6 gap-6 items-start">
          {showContractorPhoto && (
          <div className="space-y-3 lg:col-span-1 xl:col-span-1">
            <SubFormTitle title={getLabel("contractorImage", "Contractor Photo")} />
            <div className="rounded-lg border border-gray-200 p-2 flex justify-center min-h-[140px] relative overflow-hidden">
              <PreviewOfEmp path={watchedValues.contractorImage || ""} />
              {!isViewMode && watchedValues.contractorImage && (
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
            {showErrors && errors.contractorImage && <p className="text-xs text-red-600">{typeof errors.contractorImage.message === "string" ? errors.contractorImage.message : ""}</p>}
          </div>
          )}

          {showContractorDetailsSection && (
          <div className={`space-y-3 ${showContractorPhoto ? "lg:col-span-4 xl:col-span-5" : "lg:col-span-5 xl:col-span-6"}`}>
            <SubFormTitle title="Contractor Details" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isVisible("contractorName") && (
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("contractorName", "Contractor Name")} {isRequired("contractorName") && <span className="text-red-500">*</span>}</Label>
                <Input {...register("contractorName")} disabled={isViewMode} className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`} placeholder="Enter contractor name" />
                {showErrors && errors.contractorName && <p className="text-xs text-red-600">{typeof errors.contractorName.message === "string" ? errors.contractorName.message : ""}</p>}
              </div>
              )}
              {isVisible("contractorCode") && (
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("contractorCode", "Contractor Code")} {isRequired("contractorCode") && <span className="text-red-500">*</span>}</Label>
                <Input {...register("contractorCode")} disabled={isViewMode || mode === "edit"} className={`${INPUT_CLASS} ${isViewMode || mode === "edit" ? "bg-gray-100 cursor-not-allowed" : ""}`} placeholder="Enter contractor code" />
                {showErrors && errors.contractorCode && <p className="text-xs text-red-600">{typeof errors.contractorCode.message === "string" ? errors.contractorCode.message : ""}</p>}
              </div>
              )}
              {isVisible("aadharNumber") && (
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("aadharNumber", "Aadhar Number")}</Label>
                <Input
                  value={formatAadharNumber(watchedValues.aadharNumber || "")}
                  onChange={(e) => setValue("aadharNumber", getUnformattedAadhar(e.target.value))}
                  disabled={isViewMode}
                  className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  placeholder="XXXX XXXX XXXX"
                />
                {showErrors && errors.aadharNumber && <p className="text-xs text-red-600">{typeof errors.aadharNumber.message === "string" ? errors.aadharNumber.message : ""}</p>}
              </div>
              )}
              {isVisible("panNumber") && (
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("panNumber", "PAN Number")}</Label>
                <Input
                  value={watchedValues.panNumber || ""}
                  onChange={(e) => setValue("panNumber", formatPANNumber(e.target.value))}
                  disabled={isViewMode}
                  className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  placeholder="ABCDE1234F"
                />
                {showErrors && errors.panNumber && <p className="text-xs text-red-600">{typeof errors.panNumber.message === "string" ? errors.panNumber.message : ""}</p>}
              </div>
              )}
              {isVisible("serviceSince") && (
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("serviceSince", "Service Since")} {isRequired("serviceSince") && <span className="text-red-500">*</span>}</Label>
                <Input {...register("serviceSince")} type="date" disabled={isViewMode} className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`} />
                {showErrors && errors.serviceSince && <p className="text-xs text-red-600">{typeof errors.serviceSince.message === "string" ? errors.serviceSince.message : ""}</p>}
              </div>
              )}
              {isVisible("birthDate") && (
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("birthDate", "Birth Date")}</Label>
                <Input {...register("birthDate")} type="date" disabled={isViewMode} className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`} />
                {showErrors && errors.birthDate && <p className="text-xs text-red-600">{typeof errors.birthDate.message === "string" ? errors.birthDate.message : ""}</p>}
              </div>
              )}
            </div>
          </div>
          )}
        </div>
        )}

        {showOwnerSection && (
        <div className="space-y-3">
          <SubFormTitle title="Owner Information" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isVisible("ownerName") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("ownerName", "Owner Name")} {isRequired("ownerName") && <span className="text-red-500">*</span>}</Label>
              <Input {...register("ownerName")} disabled={isViewMode} className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`} placeholder="Enter owner name" />
              {showErrors && errors.ownerName && <p className="text-xs text-red-600">{typeof errors.ownerName.message === "string" ? errors.ownerName.message : ""}</p>}
            </div>
            )}
            {isVisible("ownerContactNo") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("ownerContactNo", "Owner Contact Number")} {isRequired("ownerContactNo") && <span className="text-red-500">*</span>}</Label>
              <Input
                value={watchedValues.ownerContactNo || ""}
                onChange={(e) => setValue("ownerContactNo", formatPhoneNumber(e.target.value))}
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="10-digit number"
              />
              {showErrors && errors.ownerContactNo && <p className="text-xs text-red-600">{typeof errors.ownerContactNo.message === "string" ? errors.ownerContactNo.message : ""}</p>}
            </div>
            )}
            {isVisible("ownerEmailId") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("ownerEmailId", "Owner Email")} {isRequired("ownerEmailId") && <span className="text-red-500">*</span>}</Label>
              <Input {...register("ownerEmailId")} type="email" disabled={isViewMode} className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`} placeholder="Enter owner email" />
              {showErrors && errors.ownerEmailId && <p className="text-xs text-red-600">{typeof errors.ownerEmailId.message === "string" ? errors.ownerEmailId.message : ""}</p>}
            </div>
            )}
          </div>
        </div>
        )}

        {showContactPersonSection && (
        <div className="space-y-3">
          <SubFormTitle title="Contact Person Information" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isVisible("contactPersonName") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("contactPersonName", "Contact Person Name")}</Label>
              <Input {...register("contactPersonName")} disabled={isViewMode} className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`} placeholder="Enter contact person name" />
              {showErrors && errors.contactPersonName && <p className="text-xs text-red-600">{typeof errors.contactPersonName.message === "string" ? errors.contactPersonName.message : ""}</p>}
            </div>
            )}
            {isVisible("contactPersonContactNo") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("contactPersonContactNo", "Contact Person Number")}</Label>
              <Input
                value={watchedValues.contactPersonContactNo || ""}
                onChange={(e) => setValue("contactPersonContactNo", formatPhoneNumber(e.target.value))}
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="10-digit number"
              />
              {showErrors && errors.contactPersonContactNo && <p className="text-xs text-red-600">{typeof errors.contactPersonContactNo.message === "string" ? errors.contactPersonContactNo.message : ""}</p>}
            </div>
            )}
            {isVisible("contactPersonEmailId") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("contactPersonEmailId", "Contact Person Email")}</Label>
              <Input {...register("contactPersonEmailId")} type="email" disabled={isViewMode} className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`} placeholder="Enter contact person email" />
              {showErrors && errors.contactPersonEmailId && <p className="text-xs text-red-600">{typeof errors.contactPersonEmailId.message === "string" ? errors.contactPersonEmailId.message : ""}</p>}
            </div>
            )}
          </div>
        </div>
        )}

        {showAdditionalSection && (
        <div className="space-y-3">
          <SubFormTitle title="Additional Information" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isVisible("fatherName") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("fatherName", "Father Name")}</Label>
              <Input {...register("fatherName")} disabled={isViewMode} className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`} placeholder="Enter father name" />
              {showErrors && errors.fatherName && <p className="text-xs text-red-600">{typeof errors.fatherName.message === "string" ? errors.fatherName.message : ""}</p>}
            </div>
            )}
            {isVisible("workLocation") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("workLocation", "Work Location")}</Label>
              <Input {...register("workLocation")} disabled={isViewMode} className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`} placeholder="Enter work location" />
              {showErrors && errors.workLocation && <p className="text-xs text-red-600">{typeof errors.workLocation.message === "string" ? errors.workLocation.message : ""}</p>}
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
