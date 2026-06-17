"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Bus } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { SuccessPopup } from "@/components/success-popup"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import {
  createBusDetailsSchema,
  normalizeBusDetailsConfig,
  type BusDetailsConfig,
  type BusDetailsData,
  type BusDetailsFieldKey,
} from "../schemas/bus-details-schema"
import { FormActionsFooter } from "../../../../../components/footer/form-actions-footer"
import { GradientFormHeader } from "../../../../../components/header/form-header"
import { SubFormTitle } from "../../../../../components/header/sub-form-title"
import { toast } from "react-toastify"

interface BusDetailsFormProps {
  employeeRecordId?: string | null
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (data: any) => void
}

export function BusDetailsForm({
  employeeRecordId = null,
  onNextTab,
  onPreviousTab,
  mode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
  onSubmit,
}: BusDetailsFormProps) {
  const INPUT_CLASS =
    "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
  const SECTION_CARD_CLASS =
    "rounded-lg border border-gray-200 bg-gray-50/30 p-4 space-y-3"

  const [employeeData, setEmployeeData] = useState<any>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const hydratedForRecordRef = useRef<string | null>(null)
  const tenantCode = useGetTenantCode()
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })

  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const modeParam = searchParams.get("mode")
  const resolvedEmployeeRecordId = employeeRecordId || id
  const currentMode: "add" | "edit" | "view" =
    mode === "add" || mode === "edit" || mode === "view"
      ? mode
      : modeParam === "add" || modeParam === "edit" || modeParam === "view"
        ? modeParam
        : resolvedEmployeeRecordId
          ? "edit"
          : "add"
  const isViewMode = currentMode === "view"
  const busDetailsConfig = useMemo(
    () =>
      normalizeBusDetailsConfig(
        (formStructure?.busDetails as BusDetailsConfig | undefined) ?? undefined
      ),
    [formStructure]
  )
  const busDetailsSchema = useMemo(
    () =>
      createBusDetailsSchema({
        tabRequired: busDetailsConfig.tabRequired,
        busDetail: busDetailsConfig.busDetail,
      }),
    [busDetailsConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isVisible = (field: BusDetailsFieldKey) =>
    busDetailsConfig.busDetail.fields[field]?.visible ?? true
  const isRequired = (field: BusDetailsFieldKey) =>
    busDetailsConfig.busDetail.fields[field]?.required ?? false
  const getLabel = (field: BusDetailsFieldKey, fallback: string) =>
    busDetailsConfig.busDetail.fields[field]?.label || fallback
  const showTransportSection =
    isVisible("busNumber") ||
    isVisible("busRegistrationNumber") ||
    isVisible("route")
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const {
    post: postBusDetails,
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

      toast.success("Employee data saved successfully!");
      void fetchEmployee()
    },
    onError: (error) => {
      console.error("Error saving bus details:", error)
    },
  })

  const {
    register,
    formState: { errors, isValid },
    watch,
    setValue,
    setError,
    trigger,
    clearErrors,
  } = useForm<BusDetailsData>({
    resolver: zodResolver(busDetailsSchema),
    defaultValues: {
      busDetail: {
        busNumber: "",
        busRegistrationNumber: "",
        route: "",
      },
    },
    mode: "onChange",
  })
  const auditEntityId = String(
    resolvedEmployeeRecordId ||
      employeeData?._id ||
      employeeData?.employeeID ||
      employeeData?.employeeId ||
      "",
  )
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })

  const { refetch: fetchEmployee } = useRequest<any>({
    url: employeeSearchUrl,
    method: "POST",
    data: [
      { field: "_id", value: resolvedEmployeeRecordId, operator: "eq" },
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

  useEffect(() => {
    if (!resolvedEmployeeRecordId || currentMode === "add") return
    void fetchEmployee()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedEmployeeRecordId, currentMode, employeeSearchUrl])

  useEffect(() => {
    hydratedForRecordRef.current = null
  }, [resolvedEmployeeRecordId])

  useEffect(() => {
    if (!employeeData) return
    if (!resolvedEmployeeRecordId) return
    if (hydratedForRecordRef.current === resolvedEmployeeRecordId) return
    setValue("busDetail.busNumber", employeeData?.busDetail?.busNumber || "")
    setValue("busDetail.busRegistrationNumber", employeeData?.busDetail?.busRegistrationNumber || "")
    setValue("busDetail.route", employeeData?.busDetail?.route || "")
    hydratedForRecordRef.current = resolvedEmployeeRecordId
    void trigger()
  }, [employeeData, resolvedEmployeeRecordId, setValue, trigger])

  const handleSaveAndContinue = async () => {
    if (shouldShowConfigLoader) return
    setShowErrors(true)
    clearErrors()
    const formValues = watch()
    const valid = await trigger()
    if (!valid) return

    const shouldUpdate = Boolean(resolvedEmployeeRecordId)
    const shouldSetBusDetailsTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: shouldUpdate ? "update" : "insert",
      ...(shouldUpdate ? { id: resolvedEmployeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        ...formValues,
        ...(shouldSetBusDetailsTab ? { busDetailstab: true } : {}),
      },
      audit: auditPayload,
    }

    postBusDetails(payload)
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

  return (
    <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
      {postLoading && (
          <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
            <div className="rounded-md bg-white shadow px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Saving work orders...</span>
            </div>
          </div>
        )}
      <GradientFormHeader
        icon={Bus}
        title="Bus Details"
        description="Transportation details for the employee"
      />

      <CardContent className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
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

        {showTransportSection && (
          <div className={SECTION_CARD_CLASS}>
            <SubFormTitle title="Transportation Information" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {isVisible("busNumber") && (
                <div className="space-y-2">
                  <Label htmlFor="busNumber" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {getLabel("busNumber", "Bus Number")} {isRequired("busNumber") && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="busNumber"
                    {...register("busDetail.busNumber")}
                    disabled={isViewMode}
                    className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder="Enter bus number"
                  />
                  {showErrors && errors.busDetail?.busNumber?.message && (
                    <p className="text-xs text-red-600">{errors.busDetail.busNumber.message}</p>
                  )}
                </div>
              )}

              {isVisible("busRegistrationNumber") && (
                <div className="space-y-2">
                  <Label htmlFor="busRegistrationNumber" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {getLabel("busRegistrationNumber", "Bus Registration Number")} {isRequired("busRegistrationNumber") && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="busRegistrationNumber"
                    {...register("busDetail.busRegistrationNumber")}
                    disabled={isViewMode}
                    className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder="Enter registration number"
                  />
                  {showErrors && errors.busDetail?.busRegistrationNumber?.message && (
                    <p className="text-xs text-red-600">{errors.busDetail.busRegistrationNumber.message}</p>
                  )}
                </div>
              )}

              {isVisible("route") && (
                <div className="space-y-2">
                  <Label htmlFor="route" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {getLabel("route", "Route")} {isRequired("route") && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="route"
                    {...register("busDetail.route")}
                    disabled={isViewMode}
                    className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder="Enter route"
                  />
                  {showErrors && errors.busDetail?.route?.message && (
                    <p className="text-xs text-red-600">{errors.busDetail.route.message}</p>
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
        postLoading={postLoading || shouldShowConfigLoader}
        onSave={handleSave}
      />
    </Card>
  )
}
