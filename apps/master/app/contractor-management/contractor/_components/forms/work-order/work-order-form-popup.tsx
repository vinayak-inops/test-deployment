"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Separator } from "@repo/ui/components/ui/separator"
import { ClipboardList, X, Plus } from "lucide-react"
import DocumentUploadField from "../../../../../../components/fields/document-upload-field"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import { WorkOrderDepartmentsSection } from "./work-order-departments-section"
import { WorkOrderAssetChargesSection } from "./work-order-asset-charges-section"
import type { WorkOrder } from "../../schemas/work-order-form-schema"
import {
  createWorkOrderSchema,
  normalizeWorkOrderConfig,
  EMPTY_WORK_ORDER,
  type WorkOrderDepartmentFieldsConfig,
  type WorkOrderAssetChargeFieldsConfig,
  type WorkOrderEmployeeWagesFieldsConfig,
  type WorkOrderAllocatedManPowerFieldsConfig,
  type WorkOrderFieldsConfig,
  type WorkOrderRootConfig,
} from "../../schemas/work-order-form-schema"
import { useDynamicSchemaConfig } from "../../hooks/useDynamicSchemaConfig"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

export interface WorkOrderFormPopupProps {
  open: boolean
  onClose: () => void
  initialWorkOrder: WorkOrder | null
  onSubmit: (workOrders: WorkOrder[]) => void
  onSaved?: () => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  workOrders: WorkOrder[]
  editIndex: number | null
  refetchWorkOrders?: () => Promise<void> | void
  subOrganization: any
  loading?: boolean
  /** Legacy prop; uploads handled by DocumentUploadField */
  onUploadFile?: (file: File, kind: "workOrderDocumentFilePath" | "annexureFilePath") => Promise<string | null>
  disabled?: boolean
}
type WorkOrderFormField =
  | "workOrderNumber"
  | "workOrderDate"
  | "proposalReferenceNumber"
  | "NumberOfEmployee"
  | "contractPeriodFrom"
  | "contractPeriodTo"
  | "workOrderDocumentFilePath"
  | "annexureFilePath"
  | "serviceChargeAmount"
  | "workOrderType"
  | "workOrderLineItems"
  | "serviceLineItems"
  | "serviceCode"
  | "wcChargesPerEmployee"
  | "remarks"

function toPayloadWorkOrder(workOrder: WorkOrder) {
  return {
    parseID: workOrder.parseID || undefined,
    workOrderNumber: workOrder.workOrderNumber || "",
    workOrderDate: workOrder.workOrderDate || "",
    proposalReferenceNumber: workOrder.proposalReferenceNumber ?? "",
    NumberOfEmployee: Number(workOrder.NumberOfEmployee || 0),
    contractPeriodFrom: workOrder.contractPeriodFrom || "",
    contractPeriodTo: workOrder.contractPeriodTo || "",
    workOrderDocumentFilePath: workOrder.workOrderDocumentFilePath ?? "",
    annexureFilePath: workOrder.annexureFilePath ?? "",
    serviceChargeAmount: Number(workOrder.serviceChargeAmount || 0),
    workOrderType: workOrder.workOrderType || "Standard",
    workOrderLineItems: workOrder.workOrderLineItems ?? "",
    serviceLineItems: workOrder.serviceLineItems ?? "",
    serviceCode: workOrder.serviceCode ?? "",
    wcChargesPerEmployee: Number(workOrder.wcChargesPerEmployee || 0),
    assetChargesPerDay: (workOrder.assetChargesPerDay || []).map((asset) => ({
      assetCode: asset.assetCode || "",
      assetName: asset.assetName || "",
      assetCharges: Number(asset.assetCharges || 0),
    })),
    employeeWages: {
      wageType: workOrder.employeeWages?.wageType || "",
      wageAmount: Number(workOrder.employeeWages?.wageAmount || 0),
    },
    departments: (workOrder.departments || []).map((d) => ({
      departmentCode: d.departmentCode || "",
      departmentName: d.departmentName || "",
    })),
    remarks: workOrder.remarks ?? "",
    ...(workOrder.workOrderType === "Man Power"
      ? {
          allocatedManPower: (workOrder.allocatedManPower || []).map((ap) => ({
            skillLevel: {
              skilledLevelTitle: ap.skillLevel?.skilledLevelTitle || "",
              skilledLevelDescription: ap.skillLevel?.skilledLevelDescription || "",
            },
            manPower: Number(ap.manPower || 0),
          })),
        }
      : {}),
  }
}

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
const LABEL_CLASS = "block text-xs font-medium text-gray-700 uppercase tracking-wide"
const TEXTAREA_CLASS =
  "border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
const DISABLED_CLASS = "bg-gray-100 cursor-not-allowed"

export function WorkOrderFormPopup({
  open,
  onClose,
  initialWorkOrder,
  onSubmit,
  onSaved,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  workOrders,
  editIndex,
  refetchWorkOrders,
  subOrganization,
  loading = false,
  disabled = false,
}: WorkOrderFormPopupProps) {
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contractor_form_strcture",
  })

  const workOrderTabConfig = useMemo(
    () =>
      normalizeWorkOrderConfig(
        formStructure?.workOrder as WorkOrderFieldsConfig | WorkOrderRootConfig | undefined
      ),
    [formStructure]
  )

  const workOrderSchemaDef = useMemo(
    () => createWorkOrderSchema(workOrderTabConfig),
    [workOrderTabConfig]
  )

  const { schema: workOrderSchema, isRequired, isVisible, getLabel } = useDynamicSchemaConfig({
    schema: workOrderSchemaDef,
    fieldConfig: workOrderTabConfig,
    emptyValues: EMPTY_WORK_ORDER,
    defaultRequired: {
      workOrderNumber: true,
      workOrderDate: true,
      proposalReferenceNumber: false,
      NumberOfEmployee: true,
      contractPeriodFrom: true,
      contractPeriodTo: true,
      workOrderDocumentFilePath: false,
      annexureFilePath: false,
      serviceChargeAmount: false,
      workOrderType: true,
      workOrderLineItems: false,
      serviceLineItems: false,
      serviceCode: false,
      wcChargesPerEmployee: false,
      remarks: false,
    },
  })
  const [formWo, setFormWo] = useState<WorkOrder>({ ...EMPTY_WORK_ORDER })
  const [popupErrors, setPopupErrors] = useState<Record<string, string[]>>({})
  const [pendingWorkOrders, setPendingWorkOrders] = useState<WorkOrder[] | null>(null)
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const showBasicDetailsSection =
    isVisible("workOrderNumber") ||
    isVisible("workOrderDate") ||
    isVisible("proposalReferenceNumber") ||
    isVisible("NumberOfEmployee") ||
    isVisible("contractPeriodFrom") ||
    isVisible("contractPeriodTo")
  const showDocumentsSection =
    isVisible("workOrderDocumentFilePath") || isVisible("annexureFilePath")
  const showServiceDetailsSection =
    isVisible("serviceChargeAmount") ||
    isVisible("workOrderType") ||
    isVisible("workOrderLineItems") ||
    isVisible("serviceLineItems") ||
    isVisible("serviceCode") ||
    isVisible("wcChargesPerEmployee")
  const showRemarksSection = isVisible("remarks")
  const departmentsFieldsConfig: WorkOrderDepartmentFieldsConfig =
    workOrderTabConfig.departments?.fields ?? {}
  const assetChargesFieldsConfig: WorkOrderAssetChargeFieldsConfig =
    workOrderTabConfig.assetChargesPerDay?.fields ?? {}
  const employeeWagesFieldsConfig: WorkOrderEmployeeWagesFieldsConfig =
    workOrderTabConfig.employeeWages?.fields ?? {}
  const allocatedManPowerFieldsConfig: WorkOrderAllocatedManPowerFieldsConfig =
    workOrderTabConfig.allocatedManPower?.fields ?? {}

  const getNestedVisible = (
    config: Record<string, { visible?: boolean } | undefined> | undefined,
    key: string
  ) => config?.[key]?.visible ?? true

  const getNestedLabel = (
    config: Record<string, { label?: string } | undefined> | undefined,
    key: string,
    fallback: string
  ) => {
    const label = config?.[key]?.label
    return typeof label === "string" && label.trim() ? label : fallback
  }

  const showEmployeeWagesSection =
    getNestedVisible(employeeWagesFieldsConfig, "wageType") ||
    getNestedVisible(employeeWagesFieldsConfig, "wageAmount")
  const showAllocatedManPowerSection =
    getNestedVisible(allocatedManPowerFieldsConfig, "skilledLevelTitle") ||
    getNestedVisible(allocatedManPowerFieldsConfig, "skilledLevelDescription") ||
    getNestedVisible(allocatedManPowerFieldsConfig, "manPower")
  const showDepartmentsSection =
    getNestedVisible(departmentsFieldsConfig, "departmentCode") ||
    getNestedVisible(departmentsFieldsConfig, "departmentName")
  const showAssetChargesSection =
    getNestedVisible(assetChargesFieldsConfig, "assetCode") ||
    getNestedVisible(assetChargesFieldsConfig, "assetName") ||
    getNestedVisible(assetChargesFieldsConfig, "assetCharges")

  useEffect(() => {
    if (open) {
      setFormWo(initialWorkOrder ? { ...initialWorkOrder } : { ...EMPTY_WORK_ORDER })
      setPopupErrors({})
      setPendingWorkOrders(null)
    }
  }, [open, initialWorkOrder])

  const { post: postContractor, loading: postLoading } = usePostRequest<any>({
    url: contractorCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const normalizeServerField = (fieldName: string): WorkOrderFormField | null => {
          const fieldMap: Record<string, WorkOrderFormField> = {
            workOrderNumber: "workOrderNumber",
            workOrderDate: "workOrderDate",
            proposalReferenceNumber: "proposalReferenceNumber",
            NumberOfEmployee: "NumberOfEmployee",
            contractPeriodFrom: "contractPeriodFrom",
            contractPeriodTo: "contractPeriodTo",
            workOrderDocumentFilePath: "workOrderDocumentFilePath",
            annexureFilePath: "annexureFilePath",
            serviceChargeAmount: "serviceChargeAmount",
            workOrderType: "workOrderType",
            workOrderLineItems: "workOrderLineItems",
            serviceLineItems: "serviceLineItems",
            serviceCode: "serviceCode",
            wcChargesPerEmployee: "wcChargesPerEmployee",
            remarks: "remarks",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("workOrders.")) {
            const key = fieldName.split(".").pop() ?? ""
            return fieldMap[key] ?? null
          }
          return null
        }

        const nextErrors: Record<string, string[]> = {}
        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
            if (typeof message !== "string" || !message.trim()) return
            const normalizedField = normalizeServerField(fieldName)
            if (!normalizedField) return
            nextErrors[normalizedField] = [message]
          })
        }
        setPopupErrors(nextErrors)
        return
      }

      toast.success("Contractor data saved successfully!")
      if (pendingWorkOrders) {
        onSubmit(pendingWorkOrders)
      }
      setPendingWorkOrders(null)
      await refetchWorkOrders?.()
      onSaved?.()
      onClose()
    },
    onError: (error) => {
    },
  })

  const updateField = (field: keyof WorkOrder, value: any) => {
    setFormWo((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (shouldShowConfigLoader || postLoading) return
    const result = workOrderSchema.safeParse(formWo)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[]>
      const err: Record<string, string[]> = {}
      Object.entries(fieldErrors).forEach(([k, v]) => {
        err[k] = Array.isArray(v) ? v : [String(v)]
      })
      setPopupErrors(err)
      return
    }
    setPopupErrors({})
    const payload: WorkOrder = {
      ...EMPTY_WORK_ORDER,
      ...formWo,
      ...result.data,
      parseID: (initialWorkOrder as Record<string, any> | null)?.parseID,
      workOrderNumber: result.data.workOrderNumber ?? "",
      workOrderDate: result.data.workOrderDate ?? "",
      contractPeriodFrom: result.data.contractPeriodFrom ?? "",
      contractPeriodTo: result.data.contractPeriodTo ?? "",
      workOrderType: result.data.workOrderType ?? "Standard",
      proposalReferenceNumber: result.data.proposalReferenceNumber ?? "",
      workOrderDocumentFilePath: result.data.workOrderDocumentFilePath ?? "",
      annexureFilePath: result.data.annexureFilePath ?? "",
      workOrderLineItems: result.data.workOrderLineItems ?? "",
      serviceLineItems: result.data.serviceLineItems ?? "",
      serviceCode: result.data.serviceCode ?? "",
      remarks: result.data.remarks ?? "",
      NumberOfEmployee: result.data.NumberOfEmployee ?? 0,
      assetChargesPerDay: result.data.assetChargesPerDay ?? formWo.assetChargesPerDay ?? [],
      employeeWages: result.data.employeeWages ?? formWo.employeeWages ?? EMPTY_WORK_ORDER.employeeWages,
      allocatedManPower: result.data.allocatedManPower ?? formWo.allocatedManPower ?? [],
      departments: formWo.departments ?? [],
    }
    const payloadWorkOrder = toPayloadWorkOrder(payload) as WorkOrder
    const parseId = (payloadWorkOrder as Record<string, any>)?.parseID
    const next =
      parseId
        ? workOrders.map((workOrder) =>
            (workOrder as Record<string, any>)?.parseID === parseId ? payloadWorkOrder : workOrder
          )
        : editIndex !== null
          ? workOrders.map((workOrder, index) => (index === editIndex ? payloadWorkOrder : workOrder))
          : [...workOrders, payloadWorkOrder]
    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetWorkOrderTab = employeeSearchUrl === "draft/contractor/search"
    const postPayload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      event: "validate",
      ruleId: "contractorWorkOrder",
      collectionName: "contractor",
      data: {
        workOrders: [payloadWorkOrder],
        ...(shouldSetWorkOrderTab ? { workOrdertab: true } : {}),
      },
    }
    setPendingWorkOrders(next)
    postContractor?.(postPayload)
  }

  const handleClose = () => {
    setPopupErrors({})
    setPendingWorkOrders(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm">
      <div className="bg-white shadow-xl border-l border-gray-200 w-full max-w-5xl h-full overflow-hidden flex flex-col rounded-l-lg">
        <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <ClipboardList className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-700">
                {initialWorkOrder !== null ? "Edit Work Order" : "Add Work Order"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Work order details, documents, departments, and charges.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scroll-smooth bg-white [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            {shouldShowConfigLoader ? (
              <div className="py-12 text-center text-sm text-gray-600">
                Loading form configuration...
              </div>
            ) : (
              <>
            {showBasicDetailsSection && (
            <div className="space-y-4">
              <SubFormTitle title="Basic Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isVisible("workOrderNumber") && (
                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{getLabel("workOrderNumber", "Work Order Number")} {isRequired("workOrderNumber") && <span className="text-red-500">*</span>}</Label>
                  <Input
                    value={formWo.workOrderNumber}
                    onChange={(e) => updateField("workOrderNumber", e.target.value)}
                    className={`${INPUT_CLASS} ${disabled ? DISABLED_CLASS : ""}`}
                    placeholder="Work order number"
                    disabled={disabled}
                  />
                  {popupErrors.workOrderNumber && (
                    <p className="text-red-500 text-xs mt-0.5">{popupErrors.workOrderNumber[0]}</p>
                  )}
                </div>
                )}
                {isVisible("workOrderDate") && (
                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{getLabel("workOrderDate", "Work Order Date")} {isRequired("workOrderDate") && <span className="text-red-500">*</span>}</Label>
                  <Input
                    type="date"
                    value={formWo.workOrderDate}
                    onChange={(e) => updateField("workOrderDate", e.target.value)}
                    className={`${INPUT_CLASS} ${disabled ? DISABLED_CLASS : ""}`}
                    disabled={disabled}
                  />
                  {popupErrors.workOrderDate && (
                    <p className="text-red-500 text-xs mt-0.5">{popupErrors.workOrderDate[0]}</p>
                  )}
                </div>
                )}
                {isVisible("proposalReferenceNumber") && (
                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{getLabel("proposalReferenceNumber", "Proposal Reference Number")}</Label>
                  <Input
                    value={formWo.proposalReferenceNumber || ""}
                    onChange={(e) => updateField("proposalReferenceNumber", e.target.value)}
                    className={`${INPUT_CLASS} ${disabled ? DISABLED_CLASS : ""}`}
                    placeholder="Proposal reference"
                    disabled={disabled}
                  />
                </div>
                )}
                {isVisible("NumberOfEmployee") && (
                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{getLabel("NumberOfEmployee", "Number of Employees")} {isRequired("NumberOfEmployee") && <span className="text-red-500">*</span>}</Label>
                  <Input
                    type="number"
                    value={formWo.NumberOfEmployee ?? ""}
                    onChange={(e) =>
                      updateField("NumberOfEmployee", e.target.value === "" ? undefined : parseInt(e.target.value, 10))
                    }
                    className={`${INPUT_CLASS} ${disabled ? DISABLED_CLASS : ""}`}
                    disabled={disabled}
                  />
                  {popupErrors.NumberOfEmployee && (
                    <p className="text-red-500 text-xs mt-0.5">{popupErrors.NumberOfEmployee[0]}</p>
                  )}
                </div>
                )}
                {isVisible("contractPeriodFrom") && (
                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{getLabel("contractPeriodFrom", "Contract Period From")} {isRequired("contractPeriodFrom") && <span className="text-red-500">*</span>}</Label>
                  <Input
                    type="date"
                    value={formWo.contractPeriodFrom}
                    onChange={(e) => updateField("contractPeriodFrom", e.target.value)}
                    min={formWo.workOrderDate || undefined}
                    className={`${INPUT_CLASS} ${disabled ? DISABLED_CLASS : ""}`}
                    disabled={disabled}
                  />
                  {popupErrors.contractPeriodFrom && (
                    <p className="text-red-500 text-xs mt-0.5">{popupErrors.contractPeriodFrom[0]}</p>
                  )}
                </div>
                )}
                {isVisible("contractPeriodTo") && (
                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{getLabel("contractPeriodTo", "Contract Period To")} {isRequired("contractPeriodTo") && <span className="text-red-500">*</span>}</Label>
                  <Input
                    type="date"
                    value={formWo.contractPeriodTo}
                    onChange={(e) => updateField("contractPeriodTo", e.target.value)}
                    min={formWo.contractPeriodFrom || undefined}
                    className={`${INPUT_CLASS} ${disabled ? DISABLED_CLASS : ""}`}
                    disabled={disabled}
                  />
                  {popupErrors.contractPeriodTo && (
                    <p className="text-red-500 text-xs mt-0.5">{popupErrors.contractPeriodTo[0]}</p>
                  )}
                </div>
                )}
              </div>
            </div>
            )}

            {showBasicDetailsSection && (showDocumentsSection || showServiceDetailsSection || showRemarksSection) && <Separator />}

            {showDocumentsSection && (
            <div className="space-y-4">
              <SubFormTitle title="Documents" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isVisible("workOrderDocumentFilePath") && (
                <DocumentUploadField
                  id="popup-workorder-file"
                  label={`${getLabel("workOrderDocumentFilePath", "Work Order Document")}${isRequired("workOrderDocumentFilePath") ? " *" : ""}`}
                  isViewMode={disabled}
                  employeeID={formWo.workOrderNumber || "work-order"}
                  value={{
                    documentPath: formWo.workOrderDocumentFilePath || "",
                    documentType: "",
                  }}
                  onChange={(doc) => updateField("workOrderDocumentFilePath", doc.documentPath || "")}
                  uploadPrefix="work_order"
                  uploadButtonText="Upload Work Order"
                  wrapperClassName="space-y-2"
                  labelClassName={LABEL_CLASS}
                />
                )}
                {isVisible("annexureFilePath") && (
                <DocumentUploadField
                  id="popup-annexure-file"
                  label={`${getLabel("annexureFilePath", "Annexure")}${isRequired("annexureFilePath") ? " *" : ""}`}
                  isViewMode={disabled}
                  employeeID={formWo.workOrderNumber || "work-order"}
                  value={{
                    documentPath: formWo.annexureFilePath || "",
                    documentType: "",
                  }}
                  onChange={(doc) => updateField("annexureFilePath", doc.documentPath || "")}
                  uploadPrefix="annexure"
                  uploadButtonText="Upload Annexure"
                  wrapperClassName="space-y-2"
                  labelClassName={LABEL_CLASS}
                />
                )}
              </div>
            </div>
            )}

            {showDocumentsSection && (showServiceDetailsSection || showRemarksSection) && <Separator />}

            {showServiceDetailsSection && (
            <div className="space-y-4">
              <SubFormTitle title="Service Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isVisible("serviceChargeAmount") && (
                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{getLabel("serviceChargeAmount", "Service Charge Amount")}</Label>
                  <Input
                    type="number"
                    value={formWo.serviceChargeAmount ?? ""}
                    onChange={(e) =>
                      updateField("serviceChargeAmount", e.target.value ? Number(e.target.value) : undefined)
                    }
                    className={`${INPUT_CLASS} ${disabled ? DISABLED_CLASS : ""}`}
                    disabled={disabled}
                  />
                </div>
                )}
                {isVisible("workOrderType") && (
                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{getLabel("workOrderType", "Work Order Type")} {isRequired("workOrderType") && <span className="text-red-500">*</span>}</Label>
                  <Select
                    value={formWo.workOrderType}
                    onValueChange={(v) => updateField("workOrderType", v)}
                    disabled={disabled}
                  >
                    <SelectTrigger className={`${INPUT_CLASS} ${disabled ? DISABLED_CLASS : ""}`}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Job Work">Job Work</SelectItem>
                      <SelectItem value="Man Power">Man Power</SelectItem>
                    </SelectContent>
                  </Select>
                  {popupErrors.workOrderType && (
                    <p className="text-red-500 text-xs mt-0.5">{popupErrors.workOrderType[0]}</p>
                  )}
                </div>
                )}
                {isVisible("workOrderLineItems") && (
                <div className="md:col-span-2 space-y-2">
                  <Label className={LABEL_CLASS}>{getLabel("workOrderLineItems", "Work Order Line Items")}</Label>
                  <Textarea
                    value={formWo.workOrderLineItems || ""}
                    onChange={(e) => updateField("workOrderLineItems", e.target.value)}
                    className={`${TEXTAREA_CLASS} ${disabled ? DISABLED_CLASS : ""}`}
                    rows={2}
                    disabled={disabled}
                  />
                </div>
                )}
                {isVisible("serviceLineItems") && (
                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{getLabel("serviceLineItems", "Service Line Items")}</Label>
                  <Textarea
                    value={formWo.serviceLineItems || ""}
                    onChange={(e) => updateField("serviceLineItems", e.target.value)}
                    className={`${TEXTAREA_CLASS} ${disabled ? DISABLED_CLASS : ""}`}
                    rows={2}
                    disabled={disabled}
                  />
                </div>
                )}
                {isVisible("serviceCode") && (
                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{getLabel("serviceCode", "Service Code")}</Label>
                  <Input
                    value={formWo.serviceCode || ""}
                    onChange={(e) => updateField("serviceCode", e.target.value)}
                    className={`${INPUT_CLASS} ${disabled ? DISABLED_CLASS : ""}`}
                    disabled={disabled}
                  />
                </div>
                )}
                {isVisible("wcChargesPerEmployee") && (
                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{getLabel("wcChargesPerEmployee", "WC Charges Per Employee")}</Label>
                  <Input
                    type="number"
                    value={formWo.wcChargesPerEmployee ?? ""}
                    onChange={(e) =>
                      updateField("wcChargesPerEmployee", e.target.value ? Number(e.target.value) : 0)
                    }
                    className={`${INPUT_CLASS} ${disabled ? DISABLED_CLASS : ""}`}
                    disabled={disabled}
                  />
                </div>
                )}
              </div>
            </div>
            )}

            {showEmployeeWagesSection && <Separator />}

            {showEmployeeWagesSection && (
            <div className="space-y-4">
              <SubFormTitle title="Employee Wages" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getNestedVisible(employeeWagesFieldsConfig, "wageType") && (
                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{getNestedLabel(employeeWagesFieldsConfig, "wageType", "Wage Type")}</Label>
                  <Select
                    value={formWo.employeeWages?.wageType || ""}
                    onValueChange={(v) =>
                      setFormWo((prev) => ({
                        ...prev,
                        employeeWages: {
                          ...prev.employeeWages,
                          wageType: v,
                          wageAmount: prev.employeeWages?.wageAmount ?? 0,
                        },
                      }))
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className={`${INPUT_CLASS} ${disabled ? DISABLED_CLASS : ""}`}>
                      <SelectValue placeholder="Select wage type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                )}
                {getNestedVisible(employeeWagesFieldsConfig, "wageAmount") && (
                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{getNestedLabel(employeeWagesFieldsConfig, "wageAmount", "Wage Amount")}</Label>
                  <Input
                    type="number"
                    value={formWo.employeeWages?.wageAmount ?? ""}
                    onChange={(e) =>
                      setFormWo((prev) => ({
                        ...prev,
                        employeeWages: {
                          ...prev.employeeWages,
                          wageType: prev.employeeWages?.wageType ?? "",
                          wageAmount: Number(e.target.value) || 0,
                        },
                      }))
                    }
                    className={`${INPUT_CLASS} ${disabled ? DISABLED_CLASS : ""}`}
                    disabled={disabled}
                  />
                </div>
                )}
              </div>
            </div>
            )}

            {formWo.workOrderType === "Man Power" && showAllocatedManPowerSection && (
              <>
                <Separator />
                <div className="space-y-4">
                  <SubFormTitle title={`Allocated Man Power (${formWo.allocatedManPower?.length || 0})`} />
                  {(formWo.allocatedManPower || []).map((ap, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3">
                      {getNestedVisible(allocatedManPowerFieldsConfig, "skilledLevelTitle") && (
                      <div className="space-y-2">
                        <Label className={LABEL_CLASS}>{getNestedLabel(allocatedManPowerFieldsConfig, "skilledLevelTitle", "Skilled Level Title")}</Label>
                        <Select
                          value={ap.skillLevel?.skilledLevelTitle || ""}
                          onValueChange={(value) => {
                            const skillOptions = subOrganization?.skillLevels || []
                            const found = skillOptions.find(
                              (o: any) => (o.title || o.skilledLevelTitle || "") === value
                            )
                            const description = found?.skilledLevelDescription || found?.description || ""
                            setFormWo((prev) => {
                              const list = [...(prev.allocatedManPower || [])]
                              list[idx] = {
                                skillLevel: {
                                  skilledLevelTitle: value,
                                  skilledLevelDescription: description,
                                },
                                manPower: ap.manPower || 0,
                              }
                              return { ...prev, allocatedManPower: list }
                            })
                          }}
                          disabled={disabled}
                        >
                          <SelectTrigger className={`${INPUT_CLASS} ${disabled ? DISABLED_CLASS : ""}`}>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            {(subOrganization?.skillLevels || []).map((opt: any) => (
                              <SelectItem
                                key={opt.title || opt.skilledLevelTitle}
                                value={opt.title || opt.skilledLevelTitle || ""}
                              >
                                {opt.title || opt.skilledLevelTitle || ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      )}
                      {getNestedVisible(allocatedManPowerFieldsConfig, "skilledLevelDescription") && (
                      <div className="md:col-span-2 space-y-2">
                        <Label className={LABEL_CLASS}>{getNestedLabel(allocatedManPowerFieldsConfig, "skilledLevelDescription", "Description")}</Label>
                        <Input
                          value={ap.skillLevel?.skilledLevelDescription || ""}
                          readOnly
                          className={`${INPUT_CLASS} bg-gray-50`}
                        />
                      </div>
                      )}
                      {getNestedVisible(allocatedManPowerFieldsConfig, "manPower") && (
                      <div className="space-y-2">
                        <Label className={LABEL_CLASS}>{getNestedLabel(allocatedManPowerFieldsConfig, "manPower", "Man Power")}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={ap.manPower ?? ""}
                          onChange={(e) => {
                            setFormWo((prev) => {
                              const list = [...(prev.allocatedManPower || [])]
                              list[idx] = {
                                ...list[idx],
                                manPower: parseFloat(e.target.value) || 0,
                              }
                              return { ...prev, allocatedManPower: list }
                            })
                          }}
                          className={`${INPUT_CLASS} ${disabled ? DISABLED_CLASS : ""}`}
                          disabled={disabled}
                        />
                      </div>
                      )}
                      {!disabled && (
                        <div className="md:col-span-4 flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => {
                              setFormWo((prev) => ({
                                ...prev,
                                allocatedManPower: (prev.allocatedManPower || []).filter((_, i) => i !== idx),
                              }))
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {!disabled && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormWo((prev) => ({
                          ...prev,
                          allocatedManPower: [
                            ...(prev.allocatedManPower || []),
                            {
                              skillLevel: {
                                skilledLevelTitle: "Low-Skilled",
                                skilledLevelDescription: "Entry-level",
                              },
                              manPower: 0,
                            },
                          ],
                        }))
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Man Power Entry
                    </Button>
                  )}
                </div>
              </>
            )}

            {showRemarksSection && <Separator />}

            {showRemarksSection && (
            <div className="space-y-2">
              <SubFormTitle title="Remarks" />
              <Textarea
                value={formWo.remarks || ""}
                onChange={(e) => updateField("remarks", e.target.value)}
                className={`${TEXTAREA_CLASS} ${disabled ? DISABLED_CLASS : ""}`}
                rows={3}
                placeholder="Additional notes"
                disabled={disabled}
              />
            </div>
            )}

            {showDepartmentsSection && (
            <WorkOrderDepartmentsSection
              value={formWo.departments || []}
              onChange={(departments) => updateField("departments", departments)}
              disabled={disabled}
              loading={loading}
              fieldConfig={departmentsFieldsConfig}
            />
            )}

            {showAssetChargesSection && (
            <WorkOrderAssetChargesSection
              value={formWo.assetChargesPerDay || []}
              onChange={(charges) => updateField("assetChargesPerDay", charges)}
              assetOptions={subOrganization?.assetMaster?.assets ?? []}
              disabled={disabled}
              loading={loading}
              fieldConfig={assetChargesFieldsConfig}
            />
            )}
              </>
            )}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubmit}
            disabled={disabled || shouldShowConfigLoader || postLoading}
          >
            {initialWorkOrder !== null ? "Save Work Order" : "Add Work Order"}
          </Button>
        </div>
      </div>
    </div>
  )
}
 
