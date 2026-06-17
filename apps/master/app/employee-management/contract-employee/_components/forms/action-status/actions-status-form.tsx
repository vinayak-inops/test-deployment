"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Settings, X } from "lucide-react"
import { SuccessPopup } from "@/components/success-popup"
import { SingleSelectField } from "@/components/fields/single-select-field"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { useEmployeeShiftGraphql } from "@/hooks/api/useEmployeeShiftGraphql"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { FormActionsFooter } from "../../../../../../components/footer/form-actions-footer"
import { GradientFormHeader } from "../../../../../../components/header/form-header"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import {
  createActionsStatusSchema,
  EMPTY_ACTIONS_STATUS_FORM_VALUES,
  normalizeActionsStatusConfig,
  type ActionsStatusConfig,
  type ActionsStatusFormData,
  type ActionsStatusNestedFieldKey,
  type ActionsStatusRootFieldKey,
} from "../../schemas/actions-status-form-schema"
import { toast } from "react-toastify"

interface ActionsStatusFormProps {
  employeeRecordId?: string | null
  onPreviousTab?: () => void
  onNextTab?: () => void
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (data: any) => void
}

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

const SECTION_CARD_CLASS =
  "rounded-lg border border-gray-200 bg-gray-50/30 p-4 space-y-3"

export function ActionsStatusForm({
  employeeRecordId = null,
  onPreviousTab,
  onNextTab,
  mode = "add",
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
  onSubmit,
}: ActionsStatusFormProps) {
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const hydratedForRecordRef = useRef<string | null>(null)
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const resolvedEmployeeRecordId = employeeRecordId || id
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const tenantCode = useGetTenantCode()
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const actionsStatusConfig = useMemo(
    () =>
      normalizeActionsStatusConfig(
        formStructure?.actionsAndStatus as ActionsStatusConfig | undefined
      ),
    [formStructure]
  )
  const actionsStatusSchema = useMemo(
    () => createActionsStatusSchema(actionsStatusConfig),
    [actionsStatusConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  type ActionsStatusFieldPath =
    | "remark"
    | "defaultShiftGroupCode"
    | "status.currentStatus"
    | "status.resignationDate"
    | "status.relievingDate"
    | "status.dateOfLeaving"
    | "status.notToReHire"
    | "status.onNoticePeriod"

  const getRootConfig = (field: ActionsStatusRootFieldKey) => actionsStatusConfig.fields[field]
  const getStatusConfig = (field: ActionsStatusNestedFieldKey) => actionsStatusConfig.status.fields[field]

  const isRequired = useMemo(() => {
    return (fieldPath: ActionsStatusFieldPath): boolean => {
      switch (fieldPath) {
        case "remark":
          return Boolean(getRootConfig("remark")?.required)
        case "defaultShiftGroupCode":
          return getRootConfig("defaultShiftGroupCode")?.required ?? true
        case "status.currentStatus":
          return getStatusConfig("currentStatus")?.required ?? true
        case "status.resignationDate":
          return Boolean(getStatusConfig("resignationDate")?.required)
        case "status.relievingDate":
          return Boolean(getStatusConfig("relievingDate")?.required)
        case "status.dateOfLeaving":
          return Boolean(getStatusConfig("dateOfLeaving")?.required)
        default:
          return false
      }
    }
  }, [actionsStatusConfig.fields, actionsStatusConfig.status.fields])

  const isVisible = useMemo(() => {
    return (fieldPath: ActionsStatusFieldPath): boolean => {
      switch (fieldPath) {
        case "remark":
          return getRootConfig("remark")?.visible ?? true
        case "defaultShiftGroupCode":
          return getRootConfig("defaultShiftGroupCode")?.visible ?? true
        case "status.currentStatus":
          return getStatusConfig("currentStatus")?.visible ?? true
        case "status.resignationDate":
          return getStatusConfig("resignationDate")?.visible ?? true
        case "status.relievingDate":
          return getStatusConfig("relievingDate")?.visible ?? true
        case "status.dateOfLeaving":
          return getStatusConfig("dateOfLeaving")?.visible ?? true
        case "status.notToReHire":
          return getStatusConfig("notToReHire")?.visible ?? true
        case "status.onNoticePeriod":
          return getStatusConfig("onNoticePeriod")?.visible ?? true
      }
    }
  }, [actionsStatusConfig.fields, actionsStatusConfig.status.fields])

  const getLabel = useMemo(() => {
    return (fieldPath: ActionsStatusFieldPath, fallback: string): string => {
      switch (fieldPath) {
        case "remark":
          return getRootConfig("remark")?.label || fallback
        case "defaultShiftGroupCode":
          return getRootConfig("defaultShiftGroupCode")?.label || fallback
        case "status.currentStatus":
          return getStatusConfig("currentStatus")?.label || fallback
        case "status.resignationDate":
          return getStatusConfig("resignationDate")?.label || fallback
        case "status.relievingDate":
          return getStatusConfig("relievingDate")?.label || fallback
        case "status.dateOfLeaving":
          return getStatusConfig("dateOfLeaving")?.label || fallback
        case "status.notToReHire":
          return getStatusConfig("notToReHire")?.label || fallback
        case "status.onNoticePeriod":
          return getStatusConfig("onNoticePeriod")?.label || fallback
      }
    }
  }, [actionsStatusConfig.fields, actionsStatusConfig.status.fields])

  const showCurrentStatusSection =
    isVisible("status.currentStatus") || isVisible("status.notToReHire")
  const showShiftSection = isVisible("defaultShiftGroupCode")
  const showStatusDatesSection =
    isVisible("status.resignationDate") ||
    isVisible("status.relievingDate") ||
    isVisible("status.dateOfLeaving") ||
    isVisible("status.onNoticePeriod")
  const showRemarksSection = isVisible("remark")
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"

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
      console.error("Error fetching employee actions/status data:", error)
    },
    dependencies: [resolvedEmployeeRecordId, employeeSearchUrl],
  })

  const employeeShiftHierarchyFilters = useMemo(() => {
    const deployment = employeeData?.deployment
    const subsidiaryCode = deployment?.subsidiary?.subsidiaryCode
    const locationCode = deployment?.location?.locationCode
    const employeeCategoryCode = deployment?.employeeCategory?.employeeCategoryCode

    return {
      subsidiaries: subsidiaryCode,
      locations: locationCode,
      categories: employeeCategoryCode,
    }
  }, [employeeData])

  const { shiftGroups } = useEmployeeShiftGraphql({
    tenantCode,
    shiftGroupSearch: "",
    hierarchyFilters: employeeShiftHierarchyFilters,
  })

  useEffect(() => {
    if (!resolvedEmployeeRecordId || currentMode === "add") return
    void fetchEmployee()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedEmployeeRecordId, currentMode, employeeSearchUrl])

  useEffect(() => {
    hydratedForRecordRef.current = null
  }, [resolvedEmployeeRecordId])

  const { post: postActionsStatus, loading: postLoading } = usePostRequest({
    url: employeeCollectionUrl,
    onSuccess: async(response:any) => {
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
      console.error("Error saving actions status:", error)
    },
  })

  const {
    register,
    formState: { errors, isValid },
    watch,
    setValue,
    setError,
    trigger,
    reset,
    clearErrors,
  } = useForm<ActionsStatusFormData>({
    resolver: zodResolver(actionsStatusSchema),
    defaultValues: EMPTY_ACTIONS_STATUS_FORM_VALUES,
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

  const watchedValues = watch()

  const shiftOptions = useMemo(
    () =>
      shiftGroups.map((shift) => ({
        value: shift.shiftGroupCode || "",
        label: shift.shiftGroupName || shift.shiftGroupCode || "",
        tooltip: shift.shiftGroupName
          ? `${shift.shiftGroupName} (${shift.shiftGroupCode || ""})`
          : shift.shiftGroupCode || "",
      })),
    [shiftGroups]
  )

  useEffect(() => {
    if (!employeeData || !resolvedEmployeeRecordId) {
      reset(EMPTY_ACTIONS_STATUS_FORM_VALUES)
      return
    }
    if (hydratedForRecordRef.current === resolvedEmployeeRecordId) return

    reset({
      remark: employeeData.remark || "",
      defaultShiftGroupCode: employeeData.defaultShiftGroupCode || "",
      resignationDate: employeeData.status?.resignationDate || employeeData.resignationDate || "",
      relievingDate: employeeData.status?.relievingDate || employeeData.relievingDate || "",
      dateOfLeaving: employeeData.status?.dateOfLeaving || employeeData.dateOfLeaving || "",
      status: {
        currentStatus: employeeData.status?.currentStatus || "Active",
        resignationDate: employeeData.status?.resignationDate || "",
        relievingDate: employeeData.status?.relievingDate || "",
        dateOfLeaving: employeeData.status?.dateOfLeaving || "",
        notToReHire: employeeData.status?.notToReHire ?? false,
        onNoticePeriod: employeeData.status?.onNoticePeriod ?? false,
      },
    })
    hydratedForRecordRef.current = resolvedEmployeeRecordId
  }, [employeeData, resolvedEmployeeRecordId, reset])

  const handleSaveAndContinue = async () => {
    setShowErrors(true)
    if (shouldShowConfigLoader) return
    clearErrors()

    try {
      const valid = await trigger()
      if (!valid) return

      const formValues = watch()
      const flatData = {
        remark: formValues.remark || "",
        defaultShiftGroupCode: formValues.defaultShiftGroupCode || "",
        resignationDate: formValues.status?.resignationDate || "",
        relievingDate: formValues.status?.relievingDate || "",
        dateOfLeaving: formValues.status?.dateOfLeaving || "",
        status: formValues.status || {
          currentStatus: "Active",
          resignationDate: "",
          relievingDate: "",
          dateOfLeaving: "",
          notToReHire: false,
          onNoticePeriod: false,
        },
      }
      const shouldUpdate = Boolean(resolvedEmployeeRecordId)
      const shouldSetActionsStatusTab = employeeSearchUrl === "draft/contract_employee/search"
      const payload = {
        tenant: tenantCode,
        action: shouldUpdate ? "update" : "insert",
        ...(shouldUpdate ? { id: resolvedEmployeeRecordId } : {}),
        collectionName: "contract_employee",
      event: "validate",
        ruleId: "",
        data: {
          ...flatData,
          ...(shouldSetActionsStatusTab ? { actionsAndStatustab: true } : {}),
        },
        audit: auditPayload,
      }

      postActionsStatus(payload)
    } catch (error) {
      console.error("Error saving form:", error)
    }
  }

  const handleNestedSelectChange = async (fieldPath: "status.currentStatus", value: string) => {
    setValue(fieldPath as any, value, { shouldValidate: true, shouldDirty: true })
    await trigger(fieldPath as any)
  }

  const handleNestedCheckboxChange = async (
    fieldPath: "status.notToReHire" | "status.onNoticePeriod",
    checked: boolean
  ) => {
    setValue(fieldPath as any, checked, { shouldValidate: true, shouldDirty: true })
    await trigger(fieldPath as any)
  }

  const handleRootSelectChange = async (fieldPath: "defaultShiftGroupCode", value: string) => {
    setValue(fieldPath, value, { shouldValidate: true, shouldDirty: true })
    await trigger(fieldPath)
  }

  const handleSave = async () => {
    await handleSaveAndContinue()
  }

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
        icon={Settings}
        title="Actions & Status"
        description="Employee status, shifts, and remarks"
      />

        <CardContent className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
          {shouldShowConfigLoader ? (
            <div className="py-8 text-center text-sm text-gray-600">
              Loading form configuration...
            </div>
          ) : (
            <>
          {showErrors && Object.keys(errors).length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Please fix highlighted fields before continuing.
            </div>
          )}

          {showCurrentStatusSection && (
            <div className={SECTION_CARD_CLASS}>
              <SubFormTitle title="Current Status" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isVisible("status.currentStatus") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("status.currentStatus", "Employment Status")} {isRequired("status.currentStatus") && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                      value={watchedValues.status?.currentStatus || ""}
                      disabled={isViewMode}
                      onValueChange={(value) => {
                        if (!isViewMode) {
                          void handleNestedSelectChange("status.currentStatus", value)
                        }
                      }}
                    >
                      <SelectTrigger className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Terminated">Terminated</SelectItem>
                        <SelectItem value="Resigned">Resigned</SelectItem>
                        <SelectItem value="convertedIntoCompanyEmployee">Converted Into Company Employee</SelectItem>
                        <SelectItem value="convertedFTC">Converted FTC</SelectItem>
                      </SelectContent>
                    </Select>
                    {showErrors && errors.status?.currentStatus && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {errors.status.currentStatus.message}
                      </p>
                    )}
                  </div>
                )}

                {isVisible("status.notToReHire") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("status.notToReHire", "Re-hire Status")}
                    </Label>
                    <div className="h-9 flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3">
                      <input
                        type="checkbox"
                        checked={!!watchedValues.status?.notToReHire}
                        disabled={isViewMode}
                        onChange={(e) => {
                          if (!isViewMode) {
                            void handleNestedCheckboxChange("status.notToReHire", e.target.checked)
                          }
                        }}
                        className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <Label className="text-sm text-gray-700">{getLabel("status.notToReHire", "Not to Re-hire")}</Label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        {showShiftSection && (
          <div className={SECTION_CARD_CLASS}>
            <SubFormTitle title="Shift Configuration" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SingleSelectField
                id="defaultShiftGroupCode"
                label={getLabel("defaultShiftGroupCode", "Shift Group Code")}
                required={isRequired("defaultShiftGroupCode")}
                placeholder="Search shift group"
                disabled={isViewMode}
                value={watchedValues.defaultShiftGroupCode || ""}
                onChange={(value) => {
                  if (!isViewMode) {
                    void handleRootSelectChange("defaultShiftGroupCode", value)
                  }
                }}
                options={shiftOptions}
                showOnlyValueInTrigger
                className="space-y-2"
                errorMessage={
                  showErrors && (errors.defaultShiftGroupCode as any)
                    ? (errors.defaultShiftGroupCode as any).message
                    : undefined
                }
                allowOnlyProvidedOptions
              />

              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("defaultShiftGroupCode", "Shift Status")}</Label>
                <div className="h-9 flex items-center rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700">
                  {watchedValues.defaultShiftGroupCode
                    ? `Assigned: ${watchedValues.defaultShiftGroupCode}`
                    : "No shift assigned"}
                </div>
              </div>
            </div>
          </div>
        )}

        {showStatusDatesSection && (
          <div className={SECTION_CARD_CLASS}>
            <SubFormTitle title="Status Dates" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isVisible("status.resignationDate") && (
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {getLabel("status.resignationDate", "Resignation Date")} {isRequired("status.resignationDate") && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    {...register("status.resignationDate")}
                    type="date"
                    disabled={isViewMode}
                    max={watchedValues.status?.relievingDate || undefined}
                    className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  />
                  {showErrors && errors.status?.resignationDate && (
                    <p className="text-xs text-red-600">{errors.status.resignationDate.message}</p>
                  )}
                </div>
              )}

              {isVisible("status.relievingDate") && (
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {getLabel("status.relievingDate", "Relieving Date")} {isRequired("status.relievingDate") && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    {...register("status.relievingDate")}
                    type="date"
                    disabled={isViewMode}
                    min={watchedValues.status?.resignationDate || undefined}
                    className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  />
                  {showErrors && errors.status?.relievingDate && (
                    <p className="text-xs text-red-600">{errors.status.relievingDate.message}</p>
                  )}
                </div>
              )}

              {isVisible("status.dateOfLeaving") && (
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {getLabel("status.dateOfLeaving", "Date of Leaving")} {isRequired("status.dateOfLeaving") && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    {...register("status.dateOfLeaving")}
                    type="date"
                    disabled={isViewMode}
                    min={watchedValues.status?.relievingDate || undefined}
                    className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  />
                  {showErrors && errors.status?.dateOfLeaving && (
                    <p className="text-xs text-red-600">{errors.status.dateOfLeaving.message}</p>
                  )}
                </div>
              )}
            </div>

            {isVisible("status.onNoticePeriod") && (
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("status.onNoticePeriod", "Notice Period")}</Label>
                <div className="h-9 flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3">
                  <input
                    type="checkbox"
                    checked={!!watchedValues.status?.onNoticePeriod}
                    disabled={isViewMode}
                    onChange={(e) => {
                      if (!isViewMode) {
                        void handleNestedCheckboxChange("status.onNoticePeriod", e.target.checked)
                      }
                    }}
                    className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Label className="text-sm text-gray-700">{getLabel("status.onNoticePeriod", "On Notice Period")}</Label>
                </div>
              </div>
            )}
          </div>
        )}

        {showRemarksSection && (
          <div className={SECTION_CARD_CLASS}>
            <SubFormTitle title="General Remarks" />
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("remark", "Remarks")} {isRequired("remark") && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                {...register("remark")}
                disabled={isViewMode}
                className={`min-h-[72px] border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="Enter general remarks"
                rows={3}
              />
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
