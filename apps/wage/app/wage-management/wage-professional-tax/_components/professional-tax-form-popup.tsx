"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Separator } from "@repo/ui/components/ui/separator"
import { X, CalendarCheck } from "lucide-react"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info"
import { useAggregateArrayFetch } from "@/hooks/api/serach/use-aggregate-array-fetch"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  professionalTaxBasicDetailsSchema,
  type ProfessionalTaxBasicDetailsValues,
} from "./schemas/professional-tax-basic-details.schema"
import {
  defaultProfessionalTaxFormValues,
  type ProfessionalTaxFormValues,
  type ProfessionalTaxSlab,
} from "./schemas/professional-tax.schema"
import SingleSelectField from "@/components/fields/single-select-field"
import { useRouter } from "next/navigation"

const getMsg = (err: any): string | undefined =>
  typeof err?.message === "string" ? err.message : undefined

type Mode = "add" | "edit" | "view"

interface ProfessionalTaxFormPopupProps {
  isOpen?: boolean
  mode?: Mode
  title?: string
  rowId?: string | null
  initialValues?: Partial<ProfessionalTaxFormValues>
  onClose?: () => void
  onSaved?: () => Promise<void> | void
}

const serverFieldMap: Record<string, "country" | "state" | "effectiveFrom" | "applicableTo"> = {
  country: "country",
  state: "state",
  effectiveFrom: "effectiveFrom",
  applicableTo: "applicableTo",
}

export default function ProfessionalTaxFormPopup({
  isOpen = false,
  mode = "add",
  title = "Professional Tax Details",
  rowId,
  initialValues,
  onClose,
  onSaved,
}: ProfessionalTaxFormPopupProps) {
  const isViewMode = mode === "view"
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  const [localLoading, setLocalLoading] = useState(false)
  const [slabs, setSlabs] = useState<ProfessionalTaxSlab[]>(
    Array.isArray(initialValues?.slabs) ? initialValues.slabs : [],
  )
  const lastHydratedSignatureRef = useRef("")
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
    reset,
    setValue,
    watch,
    setError,
  } = useForm<ProfessionalTaxBasicDetailsValues>({
    resolver: zodResolver(professionalTaxBasicDetailsSchema),
    defaultValues: {
      country: initialValues?.country ?? "",
      state: initialValues?.state ?? "",
      effectiveFrom: initialValues?.effectiveFrom ?? "",
      applicableTo: initialValues?.applicableTo ?? "All",
    },
  })

  const formData = watch()

  // Reset form state every time popup opens
  useEffect(() => {
    if (!isOpen) return

    if (mode === "add") {
      reset({ country: "", state: "", effectiveFrom: "", applicableTo: "All" })
      setSlabs([])
      lastHydratedSignatureRef.current = ""
      return
    }

    reset({
      country: initialValues?.country ?? "",
      state: initialValues?.state ?? "",
      effectiveFrom: initialValues?.effectiveFrom ?? "",
      applicableTo: initialValues?.applicableTo ?? "All",
    })
    setSlabs(Array.isArray(initialValues?.slabs) ? initialValues.slabs : [])
    lastHydratedSignatureRef.current = ""
  }, [isOpen, mode, initialValues])

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !localLoading) onClose?.()
    }
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, localLoading])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode],
  )

  const { arrayData: countryArray } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "country",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: stateArray } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "state",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const countryOptions: any[] = useMemo(
    () =>
      (countryArray || []).map((country: any) => ({
        value: country.countryCode,
        label: country.countryName,
      })),
    [countryArray],
  )

  const stateOptions: any[] = useMemo(() => {
    if (!formData.country) return []
    return (stateArray || [])
      .filter(
        (state: any) =>
          state.countryCode === formData.country ||
          state.countryCode === formData.country.substring(0, 2) ||
          formData.country.startsWith(state.countryCode),
      )
      .map((state: any) => ({
        value: state.stateCode,
        label: state.region ? `${state.stateName} - ${state.region}` : state.stateName,
      }))
  }, [stateArray, formData.country])

  const fetchPayload = useMemo(() => {
    if (!rowId || mode === "add") return null
    return [
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
      { field: "_id", operator: "eq", value: rowId },
    ]
  }, [rowId, tenantCode, mode])

  const { data: fetchedRecord } = useRequest<any[]>({
    url: "wageProfessionalTax/search?offset=0&limit=1",
    method: "POST",
    data: fetchPayload ?? undefined,
    dependencies: [fetchPayload],
  })

  useEffect(() => {
    const record = Array.isArray(fetchedRecord) ? fetchedRecord[0] : undefined
    if (!record) return

    const nextCountry = record.country ?? initialValues?.country ?? ""
    const nextState = record.state ?? initialValues?.state ?? ""
    const nextEffectiveFrom = record.effectiveFrom ?? initialValues?.effectiveFrom ?? ""
    const nextApplicableTo = record.applicableTo ?? initialValues?.applicableTo ?? "All"
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
    if (lastHydratedSignatureRef.current === signature) return

    reset({
      country: nextCountry,
      state: nextState,
      effectiveFrom: nextEffectiveFrom,
      applicableTo: nextApplicableTo,
    })
    setSlabs(nextSlabs)
    lastHydratedSignatureRef.current = signature
  }, [fetchedRecord, initialValues, rowId])

  const { post: postProfessionalTax } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const responseData =
        response?.data && typeof response.data === "object" ? response.data : response
      const status = responseData?.status

      if (!status) {
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const normalizedField =
            serverFieldMap[fieldName] ?? serverFieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField, { type: "server", message })
        })
        setLocalLoading(false)
        return
      }

      router.push(
        "/wage-management/wage-professional-tax?mode=edit&id=" + (responseData?.id || rowId),
      )
      toast.success(`Professional Tax ${mode === "edit" ? "updated" : "created"} successfully`)
      await onSaved?.()
      onClose?.()
      setLocalLoading(false)
    },
    onError: () => {
      toast.error(`Failed to ${mode === "edit" ? "update" : "create"} professional tax`)
      setLocalLoading(false)
    },
  })

  const isStepValid = Boolean(
    formData.country?.trim() &&
      formData.state?.trim() &&
      formData.effectiveFrom?.trim() &&
      formData.applicableTo?.trim(),
  )

  const onSubmit = async (data: ProfessionalTaxBasicDetailsValues) => {
    if (isViewMode) return
    setLocalLoading(true)
    await postProfessionalTax({
      tenant: tenantCode,
      action: mode === "edit" ? "update" : "insert",
      id: mode === "edit" ? rowId || null : null,
      event: "validate",
      ruleId: "wageProfessionalTaxValidator",
      collectionName: "wageProfessionalTax",
      data: {
        ...(initialValues || {}),
        ...data,
        slabs,
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
    reset({
      country: initialValues?.country ?? "",
      state: initialValues?.state ?? "",
      effectiveFrom: initialValues?.effectiveFrom ?? "",
      applicableTo: initialValues?.applicableTo ?? "All",
    })
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !localLoading) onClose?.()
  }

  const fieldStyles = `h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-3xl flex flex-col">
        <Card className="w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 shadow-sm">
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-gray-600" />
                <CardTitle className="text-base font-semibold text-gray-700">{title}</CardTitle>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={localLoading}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 px-6 py-4 space-y-6 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)} className="space-y-6">

              {/* Basic Information Section */}
              <div className="space-y-3">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Basic Information
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <SingleSelectField
                      label="COUNTRY"
                      placeholder="Select Country"
                      value={formData.country || ""}
                      disabled={isViewMode}
                      onChange={(value) => {
                        setValue("country", value, { shouldValidate: isSubmitted })
                        setValue("state", "", { shouldValidate: false })
                      }}
                      options={countryOptions}
                    />
                    {errors.country?.message && (
                      <p className="text-xs text-red-500 mt-1">{errors.country.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <SingleSelectField
                      label="STATE"
                      placeholder={formData.country ? "Select State" : "Please select a country first"}
                      value={formData.state || ""}
                      disabled={isViewMode || !formData.country}
                      onChange={(value) => setValue("state", value, { shouldValidate: isSubmitted })}
                      options={stateOptions}
                    />
                    {errors.state?.message && (
                      <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-2" />

              {/* Applicability Section */}
              <div className="space-y-3">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Applicability Details
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700">
                      EFFECTIVE FROM <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      {...register("effectiveFrom")}
                      disabled={isViewMode}
                      className={
                        errors.effectiveFrom
                          ? "h-9 w-full rounded-md border border-red-500 px-3 py-1.5 text-sm focus-visible:ring-red-500"
                          : fieldStyles
                      }
                    />
                    {errors.effectiveFrom?.message && (
                      <p className="text-xs text-red-500 mt-1">{errors.effectiveFrom.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700">
                      APPLICABLE TO <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.applicableTo}
                      onValueChange={(value) =>
                        setValue("applicableTo", value as "All" | "Male" | "Female", {
                          shouldValidate: isSubmitted,
                        })
                      }
                      disabled={isViewMode}
                    >
                      <SelectTrigger
                        className={`${getMsg(errors.applicableTo) ? "border-red-500" : ""} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"} h-9`}
                      >
                        <SelectValue placeholder="Select applicability" />
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

            </form>
          </CardContent>

          <CardFooter className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end">
            <ActionButtons
              layout="end"
              gap="gap-3"
              secondaryLabel="Reset"
              onSecondary={handleReset}
              primaryLabel={mode === "view" ? "Close" : "Save Changes"}
              onPrimary={
                mode === "view" ? onClose : handleSubmit(onSubmit, handleInvalidSubmit)
              }
              primaryLoading={localLoading}
              primaryDisabled={mode === "view" ? false : (!isStepValid || localLoading)}
              secondaryDisabled={isViewMode || localLoading}
              secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              primaryClassName={
                mode === "view"
                  ? "bg-gray-600 hover:bg-gray-700"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
