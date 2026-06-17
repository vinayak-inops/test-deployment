"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Separator } from "@repo/ui/components/ui/separator"
import { CalendarCheck } from "lucide-react"
import { GradientFormHeader } from "@/components/header/form-header"
import { SubFormTitle } from "@/components/header/sub-form-title"
import SingleSelectField, { type SingleSelectOption } from "@/components/fields/single-select-field"
import type { ProfessionalTaxFormValues } from "./schemas/professional-tax.schema"
import {
  professionalTaxBasicDetailsSchema,
  type ProfessionalTaxBasicDetailsValues,
} from "./schemas/professional-tax-basic-details.schema"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info"

const getMsg = (err: any): string | undefined =>
  typeof err?.message === "string" ? err.message : undefined

const serverFieldMap: Record<string, "country" | "state" | "effectiveFrom" | "applicableTo"> = {
  country: "country",
  state: "state",
  effectiveFrom: "effectiveFrom",
  applicableTo: "applicableTo",
}

type Props = {
  mode: "add" | "edit" | "view"
  rowId?: string | null
  formData: ProfessionalTaxFormValues
  isViewMode: boolean
  submitLoading?: boolean
  isStepValid: boolean
  fieldErrors?: Partial<Record<"country" | "state" | "effectiveFrom" | "applicableTo", string>>
  onFieldErrorsChange?: (errors: Partial<Record<"country" | "state" | "effectiveFrom" | "applicableTo", string>>) => void
  onSaved?: () => Promise<void> | void
  onClose?: () => void
  countryOptions: SingleSelectOption[]
  stateOptions: SingleSelectOption[]
  onChange: <K extends keyof ProfessionalTaxFormValues>(field: K, value: ProfessionalTaxFormValues[K]) => void
}

export default function ProfessionalTaxBasicDetailsTab({
  mode,
  rowId,
  formData,
  isViewMode,
  submitLoading,
  isStepValid,
  onFieldErrorsChange,
  onSaved,
  onClose,
  countryOptions,
  stateOptions,
  onChange,
}: Props) {
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  const [localLoading, setLocalLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const lastHydratedSignatureRef = useRef("")

  const isEditMode = mode === "edit"
  const isAddMode = mode === "add"
  const isCountryStateDisabled = isViewMode || isEditMode

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
    reset,
    setValue,
    setError,
  } = useForm<ProfessionalTaxBasicDetailsValues>({
    resolver: zodResolver(professionalTaxBasicDetailsSchema),
    defaultValues: {
      country: formData.country,
      state: formData.state,
      effectiveFrom: formData.effectiveFrom,
      applicableTo: formData.applicableTo,
    },
  })

  // Sync a field in both the parent and the internal form
  const setField = <K extends keyof ProfessionalTaxBasicDetailsValues>(
    field: K,
    value: ProfessionalTaxBasicDetailsValues[K],
    shouldValidate = isSubmitted,
  ) => {
    onChange(field as keyof ProfessionalTaxFormValues, value as any)
    setValue(field, value as any, { shouldValidate })
  }

  // ── API Criteria for fetching single record ────────────────────────────────────
  const searchApiCriteria = useMemo(() => {
    if (!rowId || (!isEditMode && !isViewMode)) return null
    return [
      { field: "_id", operator: "eq", value: rowId },
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
    ]
  }, [rowId, isEditMode, isViewMode, tenantCode])

  // ── Fetch single record ────────────────────────────────────
  const { loading: recordLoading, refetch: fetchRecord } = useRequest<any[]>({
    url: "wageProfessionalTax/search",
    method: "POST",
    data: searchApiCriteria || [],
    dependencies: [searchApiCriteria],
    enabled: Boolean(searchApiCriteria),
    onSuccess: (data: any[]) => {
      const record = Array.isArray(data) && data.length > 0 ? data[0] : null
      if (record) {
        const nextCountry = record.country ?? ""
        const nextState = record.state ?? ""
        const nextEffectiveFrom = record.effectiveFrom ?? ""
        const nextApplicableTo = record.applicableTo ?? "All"
        const nextSlabs = Array.isArray(record.slabs) ? record.slabs : []

        const signature = JSON.stringify({
          id: record?._id ?? rowId ?? "",
          updatedOn: record?.updatedOn ?? "",
          country: nextCountry,
          state: nextState,
          effectiveFrom: nextEffectiveFrom,
          applicableTo: nextApplicableTo,
          slabsLength: nextSlabs.length,
        })

        if (lastHydratedSignatureRef.current !== signature) {
          // Sync both parent and internal form
          setField("country", nextCountry)
          setField("state", nextState)
          setField("effectiveFrom", nextEffectiveFrom)
          setField("applicableTo", nextApplicableTo)
          onChange("slabs", nextSlabs)
          lastHydratedSignatureRef.current = signature
        }
      } else if (rowId) {
        toast.error("Record not found")
        onClose?.()
      }
      setFetchingData(false)
    },
    onError: () => {
      toast.error("Failed to load professional tax data")
      setFetchingData(false)
      onClose?.()
    },
  })

  // ── Load record when in edit/view mode ────────────────────────────────────
  useEffect(() => {
    if ((isEditMode || isViewMode) && rowId && searchApiCriteria) {
      setFetchingData(true)
      fetchRecord()
    } else if (isAddMode) {
      setField("country", "")
      setField("state", "")
      setField("effectiveFrom", "")
      setField("applicableTo", "All")
      onFieldErrorsChange?.({})
      lastHydratedSignatureRef.current = ""
      setFetchingData(false)
    }
  }, [rowId, isEditMode, isViewMode, isAddMode, searchApiCriteria])

  const { post: postProfessionalTax } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const responseData =
        response?.data && typeof response.data === "object" ? response.data : response
      const status = responseData?.status

      if (status === false) {
        const serverErrors: Partial<Record<"country" | "state" | "effectiveFrom" | "applicableTo", string>> = {}
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const normalizedField =
            serverFieldMap[fieldName] ?? serverFieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField, { type: "server", message })
          serverErrors[normalizedField] = message
        })
        onFieldErrorsChange?.(serverErrors)
        setLocalLoading(false)
        return
      }
      toast.success(`Professional Tax ${isEditMode ? "updated" : "created"} successfully`)
      onFieldErrorsChange?.({})
      await onSaved?.()
      setLocalLoading(false)
    },
    onError: () => {
      toast.error(`Failed to ${isEditMode ? "update" : "create"} professional tax`)
      setLocalLoading(false)
    },
  })

  const onFormSubmit = async (data: ProfessionalTaxBasicDetailsValues) => {
    if (isViewMode) return
    setLocalLoading(true)
    await postProfessionalTax({
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      id: isEditMode ? rowId || null : null,
      collectionName: "wageProfessionalTax",
      event: "validate",
      ruleId: "wageProfessionalTaxValidator",
      data: {
        ...data,
        tenantCode,
        organizationCode: tenantCode,
        updatedOn: new Date().toISOString(),
        updatedBy: employeeId ?? null,
      },
    })
  }

  const handleInvalidSubmit = () => {
    toast.error("Please fix the validation errors before saving")
  }

  const handleReset = () => {
    setField("country", "")
    setField("state", "")
    setField("effectiveFrom", "")
    setField("applicableTo", "All")
    onFieldErrorsChange?.({})
  }

  const isLoading = fetchingData || recordLoading

  return (
    <div className="w-full mx-auto space-y-6">
      <Card className="w-full mx-auto border border-gray-200 bg-white shadow-sm">
        <GradientFormHeader
          icon={CalendarCheck}
          title="Professional Tax Details"
          description="Define country, state, effective date, and applicability for this professional tax configuration."
        />

        <CardContent className="px-6 py-4 space-y-6">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-600">
              Loading professional tax data...
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <SubFormTitle title="Basic Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <SingleSelectField
                      label="Country"
                      required
                      placeholder="Select Country"
                      value={formData.country || ""}
                      disabled={isCountryStateDisabled}
                      onChange={(value) => {
                        setField("country", value)
                        setField("state", "", false)
                      }}
                      options={countryOptions}
                    />
                    {errors.country?.message && (
                      <p className="text-xs text-red-500 mt-1">{errors.country.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <SingleSelectField
                      label="State"
                      required
                      placeholder={formData.country ? "Select State" : "Please select a country first"}
                      value={formData.state || ""}
                      disabled={isCountryStateDisabled || !formData.country}
                      onChange={(value) => setField("state", value)}
                      options={stateOptions}
                    />
                    {errors.state?.message && (
                      <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SubFormTitle title="Applicability" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Effective From <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      {...register("effectiveFrom")}
                      value={formData.effectiveFrom}
                      disabled={isViewMode}
                      onChange={(e) => setField("effectiveFrom", e.target.value)}
                      className={`h-9 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${errors.effectiveFrom ? "border-red-500" : ""}`}
                    />
                    {errors.effectiveFrom?.message && (
                      <p className="text-xs text-red-500 mt-1">{errors.effectiveFrom.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Applicable To <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.applicableTo}
                      onValueChange={(value) =>
                        setField("applicableTo", value as "All" | "Male" | "Female")
                      }
                      disabled={isViewMode}
                    >
                      <SelectTrigger
                        className={`h-9 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${getMsg(errors.applicableTo) ? "border-red-500" : ""}`}
                      >
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {getMsg(errors.applicableTo) && (
                      <p className="text-xs text-red-500 mt-1">{getMsg(errors.applicableTo)}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <ActionButtons
            layout="end"
            gap="gap-3"
            secondaryLabel="Reset"
            onSecondary={handleReset}
            primaryLabel="Save Changes"
            onPrimary={handleSubmit(onFormSubmit, handleInvalidSubmit)}
            primaryLoading={Boolean(submitLoading || localLoading)}
            primaryDisabled={isViewMode || !isStepValid || localLoading || isLoading}
            secondaryDisabled={isViewMode || localLoading || isLoading}
            primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
            secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
          />
        </div>
      </Card>
    </div>
  )
}
