"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2 } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { toast } from "react-toastify"
import { GradientFormHeader } from "../../../../../components/header/form-header"
import { SubFormTitle } from "../../../../../components/header/sub-form-title"
import { FormActionsFooter } from "../../../../../components/footer/form-actions-footer"
import { useDynamicSchemaConfig } from "../hooks/useDynamicSchemaConfig"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import {
  createCompanyDetailsSchema,
  normalizeCompanyDetailsConfig,
  type CompanyDetailsFieldsConfig,
  type CompanyDetailsTabConfig,
  type CompanyDetailsFormData,
} from "../schemas/company-details-schema"

interface CompanyDetailsFormProps {
  employeeRecordId?: string | null
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  onSaved?: () => void
}

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export function CompanyDetailsForm(props: CompanyDetailsFormProps) {
  const {
    employeeRecordId = null,
    onNextTab,
    onPreviousTab,
    mode = "add",
    employeeSearchUrl = "contractor/search",
    contractorCollectionUrl = "contractor",
    onSaved,
  } = props
  const [showErrors, setShowErrors] = useState(false)
  const tenantCode = useGetTenantCode()
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contractor_form_strcture",
  })
  const searchParams = useSearchParams()
  const idFromUrl = searchParams.get("id")
  const resolvedEmployeeRecordId = employeeRecordId || idFromUrl
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const emptyValues: CompanyDetailsFormData = {
    typeOfCompany: "",
    workType: {
      workTypeCode: "",
      workTypeTitle: "",
    },
    areaOfWork: {
      areaOfWorkCode: "",
      areaOfWorkTitle: "",
    },
  }

  const companyDetailsTabConfig = useMemo(
    () =>
      normalizeCompanyDetailsConfig(
        (formStructure?.companyDetails as
          | CompanyDetailsFieldsConfig
          | CompanyDetailsTabConfig
          | undefined)
      ),
    [formStructure]
  )

  const companyDetailsSchema = useMemo(
    () => createCompanyDetailsSchema(companyDetailsTabConfig),
    [companyDetailsTabConfig]
  )

  const { schema, isRequired, isVisible, getLabel } = useDynamicSchemaConfig({
    schema: companyDetailsSchema,
    fieldConfig: companyDetailsTabConfig,
    emptyValues,
  })
  const showCompanyInformation = isVisible("typeOfCompany")
  const showWorkTypeSection = isVisible("workTypeCode") || isVisible("workTypeTitle")
  const showAreaOfWorkSection = isVisible("areaOfWorkCode") || isVisible("areaOfWorkTitle")

  const {
    register,
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors, isValid },
    trigger,
  } = useForm<CompanyDetailsFormData>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
    mode: "onChange",
  })

  const watchedValues = watch()

  useEffect(() => {
    if (!resolvedEmployeeRecordId || currentMode === "add") return
    void fetchContractor()
  }, [resolvedEmployeeRecordId, currentMode, employeeSearchUrl])

  const { refetch: fetchContractor } = useRequest<any>({
    url: employeeSearchUrl,
    method: "POST",
    data: [{ field: "_id", value: resolvedEmployeeRecordId, operator: "eq" }],
    onSuccess: (data) => {
      if (Array.isArray(data) && data[0] && data[0].isDeleted !== true) {
        const row = data[0]
        reset({
          typeOfCompany: row.typeOfCompany || "",
          workType: {
            workTypeCode: row.workType?.workTypeCode || row.workTypeCode || "",
            workTypeTitle: row.workType?.workTypeTitle || row.workTypeTitle || "",
          },
          areaOfWork: {
            areaOfWorkCode: row.areaOfWork?.areaOfWorkCode || row.areaOfWorkCode || "",
            areaOfWorkTitle: row.areaOfWork?.areaOfWorkTitle || row.areaOfWorkTitle || "",
          },
        })
      }
    },
    onError: (error) => {
      console.error("Error fetching contractor data:", error)
    },
    dependencies: [resolvedEmployeeRecordId, employeeSearchUrl],
  })

  const { post: postCompanyDetails, loading: postLoading } = usePostRequest<any>({
    url: contractorCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const normalizeServerField = (fieldName: string) => {
          if (fieldName === "workTypeCode") return "workType.workTypeCode"
          if (fieldName === "workTypeTitle") return "workType.workTypeTitle"
          if (fieldName === "areaOfWorkCode") return "areaOfWork.areaOfWorkCode"
          if (fieldName === "areaOfWorkTitle") return "areaOfWork.areaOfWorkTitle"
          return fieldName
        }

        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
            if (typeof message !== "string" || !message.trim()) return

            setError(normalizeServerField(fieldName) as any, {
              type: "server",
              message,
            })
          })
        }
        return
      }

      toast.success("Contractor company details saved successfully!")
      if (resolvedEmployeeRecordId && currentMode !== "add") {
        void fetchContractor()
      }
      onSaved?.()
    },
    onError: (error) => {
      console.error("Error saving contractor company details:", error)
    },
  })

  const handleInputChange = async (field: keyof CompanyDetailsFormData | "workType.workTypeCode" | "workType.workTypeTitle" | "areaOfWork.areaOfWorkCode" | "areaOfWork.areaOfWorkTitle", value: string) => {
    setValue(field as any, value, { shouldDirty: true, shouldTouch: true })
    await trigger(field as any)
  }

  const handleSave = async () => {
    if (shouldShowConfigLoader) return
    setShowErrors(true)
    clearErrors()
    const valid = await trigger()
    if (!valid) return

    const watched = watch()
    const formValues: CompanyDetailsFormData = {
      typeOfCompany: watched.typeOfCompany ?? emptyValues.typeOfCompany,
      workType: {
        ...emptyValues.workType,
        ...(watched.workType ?? {}),
      },
      areaOfWork: {
        ...emptyValues.areaOfWork,
        ...(watched.areaOfWork ?? {}),
      },
    }
    const isEditMode = currentMode === "edit" && Boolean(resolvedEmployeeRecordId)
    const shouldSetCompanyDetailsTab = employeeSearchUrl === "draft/contractor/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: resolvedEmployeeRecordId } : {}),
      collectionName: "contractor",
      ruleId: "",
      data: {
        ...formValues,
        ...(shouldSetCompanyDetailsTab ? { companyDetailstab: true } : {}),
      },
    }
    postCompanyDetails?.(payload)
  }

  const shouldShowConfigLoader = formStructureLoading || !formStructure

  return (
    <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
      <GradientFormHeader
        icon={Building2}
        title="Company Details"
        description="Company type, work classification, and business details"
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

        {showCompanyInformation && (
        <div className="space-y-3">
          <SubFormTitle title="Company Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="typeOfCompany" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("typeOfCompany", "Type Of Company")} {isRequired("typeOfCompany") && <span className="text-red-500">*</span>}
              </Label>
              <Select
                value={watchedValues.typeOfCompany || ""}
                onValueChange={(value) => {
                  void handleInputChange("typeOfCompany", value)
                }}
                disabled={isViewMode}
              >
                <SelectTrigger
                  id="typeOfCompany"
                  className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                >
                  <SelectValue placeholder="Select company type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Proprietorship">Proprietorship</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Private Limited">Private Limited</SelectItem>
                  <SelectItem value="Public Limited">Public Limited</SelectItem>
                  <SelectItem value="LLP">LLP</SelectItem>
                </SelectContent>
              </Select>
              {showErrors && errors.typeOfCompany?.message && <p className="text-xs text-red-600">{errors.typeOfCompany.message}</p>}
            </div>
          </div>
        </div>
        )}

        {showWorkTypeSection && (
        <div className="space-y-3">
          <SubFormTitle title="Work Type" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isVisible("workTypeCode") && (
            <div className="space-y-2">
              <Label htmlFor="workTypeCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("workTypeCode", "Work Type Code")} {isRequired("workTypeCode") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                {...register("workType.workTypeCode")}
                id="workTypeCode"
                value={watchedValues.workType?.workTypeCode || ""}
                onChange={(e) => {
                  void handleInputChange("workType.workTypeCode", e.target.value)
                }}
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="Enter work type code"
              />
              {showErrors && errors.workType?.workTypeCode && <p className="text-xs text-red-600">{typeof errors.workType.workTypeCode.message === "string" ? errors.workType.workTypeCode.message : ""}</p>}
            </div>
            )}
            {isVisible("workTypeTitle") && (
            <div className="space-y-2">
              <Label htmlFor="workTypeTitle" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("workTypeTitle", "Work Type Title")} {isRequired("workTypeTitle") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                {...register("workType.workTypeTitle")}
                id="workTypeTitle"
                value={watchedValues.workType?.workTypeTitle || ""}
                onChange={(e) => {
                  void handleInputChange("workType.workTypeTitle", e.target.value)
                }}
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="Enter work type title"
              />
              {showErrors && errors.workType?.workTypeTitle && <p className="text-xs text-red-600">{typeof errors.workType.workTypeTitle.message === "string" ? errors.workType.workTypeTitle.message : ""}</p>}
            </div>
            )}
          </div>
        </div>
        )}

        {showAreaOfWorkSection && (
        <div className="space-y-3">
          <SubFormTitle title="Area Of Work" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isVisible("areaOfWorkCode") && (
            <div className="space-y-2">
              <Label htmlFor="areaOfWorkCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("areaOfWorkCode", "Area Of Work Code")} {isRequired("areaOfWorkCode") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                {...register("areaOfWork.areaOfWorkCode")}
                id="areaOfWorkCode"
                value={watchedValues.areaOfWork?.areaOfWorkCode || ""}
                onChange={(e) => {
                  void handleInputChange("areaOfWork.areaOfWorkCode", e.target.value)
                }}
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="Enter area of work code"
              />
              {showErrors && errors.areaOfWork?.areaOfWorkCode && <p className="text-xs text-red-600">{typeof errors.areaOfWork.areaOfWorkCode.message === "string" ? errors.areaOfWork.areaOfWorkCode.message : ""}</p>}
            </div>
            )}
            {isVisible("areaOfWorkTitle") && (
            <div className="space-y-2">
              <Label htmlFor="areaOfWorkTitle" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("areaOfWorkTitle", "Area Of Work Title")} {isRequired("areaOfWorkTitle") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                {...register("areaOfWork.areaOfWorkTitle")}
                id="areaOfWorkTitle"
                value={watchedValues.areaOfWork?.areaOfWorkTitle || ""}
                onChange={(e) => {
                  void handleInputChange("areaOfWork.areaOfWorkTitle", e.target.value)
                }}
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="Enter area of work title"
              />
              {showErrors && errors.areaOfWork?.areaOfWorkTitle && <p className="text-xs text-red-600">{typeof errors.areaOfWork.areaOfWorkTitle.message === "string" ? errors.areaOfWork.areaOfWorkTitle.message : ""}</p>}
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
        postLoading={postLoading || shouldShowConfigLoader}
        onSave={handleSave}
      />
    </Card>
  )
}
