"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import { Briefcase, X, FileText } from "lucide-react"
import WorkOrderSection from "./workorder-form"
import {
  createEmptyWorkOrder,
  createWorkOrderArraySchema,
  normalizeWorkOrderConfig,
  type WorkOrderConfig,
} from "../../schemas/workorder-schema"
import { useWorkOrderContractorFromEmployee } from "./hooks/use-workorder-contractor-from-employee"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import DocumentPreview from "@/components/popup/document-preview"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
type SubFormWorkOrderData = z.infer<ReturnType<typeof createSubFormWorkOrderSchema>>
type WorkOrderSearchField = "workOrderNumber" | "status"
type WorkOrderTableRow = { wo: any; originalIndex: number }

function createSubFormWorkOrderSchema(rawConfig?: WorkOrderConfig) {
  return z.object({
    workOrder: createWorkOrderArraySchema(rawConfig),
  })
}

interface SubFormWorkOrderProps {
  employeeRecordId?: string | null
  mode?: "add" | "edit" | "view"
  onNextTab?: () => void
  onPreviousTab?: () => void
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (payload: any) => void
}

function guessMimeFromPath(path?: string) {
  if (!path) return "application/octet-stream"
  const lower = path.toLowerCase()
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".gif")) return "image/gif"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".pdf")) return "application/pdf"
  if (lower.endsWith(".doc")) return "application/msword"
  if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  return "application/octet-stream"
}

export function SubFormWorkOrder({
  employeeRecordId = null,
  mode = "add",
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
  onSubmit,
}: SubFormWorkOrderProps) {
  const showErrors = false
  const [workOrderData, setWorkOrderData] = useState<any[]>([])
  const [workOrderValidationErrors, setWorkOrderValidationErrors] = useState<{ [key: number]: string[] }>({})
  const [showDateError, setShowDateError] = useState<string | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<"add" | "edit">("add")
  const [pendingAddInEditor, setPendingAddInEditor] = useState(false)
  const [editorSubmitted, setEditorSubmitted] = useState(false)
  const [isSavingWorkOrder, setIsSavingWorkOrder] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ path?: string; mime?: string; title?: string }>({})
  const [auditStatusFormData, setAuditStatusFormData] = useState<any>({
    workOrder: [createEmptyWorkOrder()],
  })
  const pageSize = 10

  const currentMode = mode
  const isViewMode = currentMode === "view"
  const tenantCode = useGetTenantCode()
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const { formStructure } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const workOrderConfig = useMemo(
    () =>
      normalizeWorkOrderConfig(
        (formStructure?.workOrder as WorkOrderConfig | undefined) ?? undefined
      ),
    [formStructure]
  )
  const subFormWorkOrderSchema = useMemo(
    () =>
      createSubFormWorkOrderSchema({
        tabRequired: workOrderConfig.tabRequired,
        fields: workOrderConfig.fields,
      }),
    [workOrderConfig]
  )
  const canFetchWorkOrders = Boolean(employeeRecordId) && currentMode !== "add"

  const onFormDataChange = useCallback((data: any) => {
    if (!data || typeof data !== "object") return
    setAuditStatusFormData((prev: any) => ({
      ...(prev || {}),
      ...data,
    }))
  }, [])

  const { contractorCode: contractorCodeFromEmployee } = useWorkOrderContractorFromEmployee({
    currentMode,
  })

  const contractorCode =
    contractorCodeFromEmployee || auditStatusFormData?.deployment?.contractor?.contractorCode || ""

  const employeeCriteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []

    const criteriaRequests: Array<{ field: string; operator: string; value: string }> = [
      {
        field: "_id",
        operator: "is",
        value: employeeRecordId,
      },
    ]

    if (tenantCode) {
      criteriaRequests.push({
        field: "tenantCode",
        operator: "is",
        value: tenantCode,
      })
    }

    return criteriaRequests
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedWorkOrders, refetch: refetchEmployeeWorkOrders } = useAggregateArrayFetch<any>({
    collection: targetCollectionName,
    criteriaRequests: employeeCriteriaRequests,
    arrayField: "workOrder",
    enabled: canFetchWorkOrders,
    defaultValue: [createEmptyWorkOrder()],
    onError: (error: any) => {
      if (employeeRecordId) console.error("Error fetching contract employee work orders:", error)
    },
  })

  const {
    formState: { errors },
    watch,
    setValue,
  } = useForm<SubFormWorkOrderData>({
    resolver: zodResolver(subFormWorkOrderSchema),
    defaultValues: {
      workOrder: [createEmptyWorkOrder()],
    },
    mode: "onChange",
  })

  const watchedValues = watch()

  const getDateForInput = (dateString: string) => {
    if (!dateString) return undefined
    if (dateString.includes("-") && dateString.split("-").length === 3) {
      const parts = dateString.split("-")
      if (parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) return dateString
      if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`
    }
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const day = date.getDate().toString().padStart(2, "0")
      return `${year}-${month}-${day}`
    }
    return undefined
  }

  const formatDateForDisplay = (dateString: string | undefined) => {
    if (!dateString) return ""
    const parsed = getDateForInput(dateString)
    return parsed || dateString
  }

  const getSelectedWorkOrder = (workOrderNumber: string) => {
    return workOrderData?.find((wo: any) => wo.workOrderNumber === workOrderNumber)
  }

  const validateDateConstraints = (workOrderNumber: string, effectiveFrom: string, effectiveTo: string) => {
    const selectedWO = getSelectedWorkOrder(workOrderNumber)
    if (!selectedWO) return { isValid: false, errors: [] as string[] }

    const validationErrors: string[] = []
    const contractFromStr = getDateForInput(selectedWO.contractPeriodFrom)
    const contractToStr = getDateForInput(selectedWO.contractPeriodTo)

    if (!contractFromStr || !contractToStr) {
      validationErrors.push("Contract period dates are missing")
      return { isValid: false, errors: validationErrors }
    }

    const contractFrom = new Date(contractFromStr)
    const contractTo = new Date(contractToStr)
    if (isNaN(contractFrom.getTime()) || isNaN(contractTo.getTime())) {
      validationErrors.push("Invalid contract period dates")
      return { isValid: false, errors: validationErrors }
    }

    if (effectiveFrom) {
      const fromDate = new Date(effectiveFrom)
      if (isNaN(fromDate.getTime())) {
        validationErrors.push("Invalid Effective From date format")
      } else {
        if (fromDate < contractFrom) validationErrors.push(`Effective From cannot be before ${formatDateForDisplay(selectedWO.contractPeriodFrom)}`)
        if (fromDate > contractTo) validationErrors.push(`Effective From cannot be after ${formatDateForDisplay(selectedWO.contractPeriodTo)}`)
      }
    }

    if (effectiveTo) {
      const toDate = new Date(effectiveTo)
      if (isNaN(toDate.getTime())) {
        validationErrors.push("Invalid Effective To date format")
      } else {
        if (toDate < contractFrom) validationErrors.push(`Effective To cannot be before ${formatDateForDisplay(selectedWO.contractPeriodFrom)}`)
        if (effectiveFrom) {
          const fromDate = new Date(effectiveFrom)
          if (toDate < fromDate) validationErrors.push("Effective To must be greater than or equal to Effective From")
        }
      }
    }

    return { isValid: validationErrors.length === 0, errors: validationErrors }
  }

  const showDateValidationError = (message: string) => {
    setShowDateError(message)
    setTimeout(() => setShowDateError(null), 3000)
  }

  const addWorkOrder = () => {
    const newWorkOrders = [...(watchedValues.workOrder || []), createEmptyWorkOrder()]
    setValue("workOrder", newWorkOrders)
    onFormDataChange({ workOrder: newWorkOrders })
    setWorkOrderValidationErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[newWorkOrders.length - 1]
      return newErrors
    })
  }

  const openAddInEditor = () => {
    setEditorMode("add")
    setEditorSubmitted(false)
    setPendingAddInEditor(true)
    addWorkOrder()
    setIsEditorOpen(true)
  }

  const removeWorkOrder = (index: number) => {
    const newWorkOrders = watchedValues.workOrder?.filter((_, i) => i !== index) || []
    const finalWorkOrders = newWorkOrders.length > 0 ? newWorkOrders : [createEmptyWorkOrder()]
    setValue("workOrder", finalWorkOrders)
    onFormDataChange({ workOrder: finalWorkOrders })
    setWorkOrderValidationErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[index]
      return newErrors
    })

  }

  // WorkOrderSection edits only the latest row. Move selected row to end for editing.
  const openEditInEditor = (index: number) => {
    const current = [...(watchedValues.workOrder || [])]
    if (index < 0 || index >= current.length) return
    const selected = current[index]
    const rest = current.filter((_, i) => i !== index)
    const reordered = [...rest, selected]
    setValue("workOrder", reordered)
    onFormDataChange({ workOrder: reordered })
    setEditorMode("edit")
    setEditorSubmitted(false)
    setPendingAddInEditor(false)
    setIsEditorOpen(true)
  }

  const discardPendingAddIfNeeded = () => {
    if (editorMode !== "add" || !pendingAddInEditor || editorSubmitted) return

    const currentWorkOrders = [...(watchedValues.workOrder || [])]
    if (currentWorkOrders.length === 0) return

    const revertedWorkOrders = currentWorkOrders.slice(0, -1)
    const nextWorkOrders = revertedWorkOrders.length > 0 ? revertedWorkOrders : [createEmptyWorkOrder()]
    setValue("workOrder", nextWorkOrders)
    onFormDataChange({ workOrder: nextWorkOrders })
    setWorkOrderValidationErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[currentWorkOrders.length - 1]
      return newErrors
    })
  }

  const handleEditorClose = () => {
    discardPendingAddIfNeeded()
    setIsEditorOpen(false)
    setPendingAddInEditor(false)
    setEditorSubmitted(false)
  }

  const handleDateChange = (index: number, field: "effectiveFrom" | "effectiveTo", value: string) => {
    const workOrder = watchedValues.workOrder?.[index]
    if (!workOrder?.workOrderNumber) return

    const updatedWorkOrder = { ...workOrder, [field]: value }
    const validation = validateDateConstraints(
      updatedWorkOrder.workOrderNumber || "",
      updatedWorkOrder.effectiveFrom || "",
      updatedWorkOrder.effectiveTo || ""
    )

    if (!validation.isValid) {
      setWorkOrderValidationErrors((prev) => ({ ...prev, [index]: validation.errors }))
      showDateValidationError(validation.errors.join(", "))
      return
    }

    setWorkOrderValidationErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[index]
      return newErrors
    })

    setValue(`workOrder.${index}.${field}`, value)
    const updatedWorkOrders = [...(watchedValues.workOrder || [])]
    updatedWorkOrders[index] = updatedWorkOrder
    onFormDataChange({ workOrder: updatedWorkOrders })
  }

  useEffect(() => {
    if (!canFetchWorkOrders) return
    void refetchEmployeeWorkOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchWorkOrders, tenantCode])

  useEffect(() => {
    if (!canFetchWorkOrders) return
    onFormDataChange({ workOrder: fetchedWorkOrders })
  }, [canFetchWorkOrders, fetchedWorkOrders, onFormDataChange])

  useEffect(() => {
    if (auditStatusFormData?.workOrder) {
      const formattedWorkOrders = auditStatusFormData.workOrder.map((wo: any) => {
        let isActive = false
        if (wo.effectiveFrom && wo.effectiveTo) {
          const today = new Date()
          const fromDate = new Date(wo.effectiveFrom)
          const toDate = new Date(wo.effectiveTo)
          if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
            const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
            const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
            isActive = todayOnly >= fromDateOnly && todayOnly <= toDateOnly
          }
        }

        return {
          ...wo,
          effectiveFrom: wo.effectiveFrom ? getDateForInput(wo.effectiveFrom) : "",
          effectiveTo: wo.effectiveTo ? getDateForInput(wo.effectiveTo) : "",
          isActive,
        }
      })
      setValue("workOrder", formattedWorkOrders.length > 0 ? formattedWorkOrders : [createEmptyWorkOrder()])
    }
  }, [auditStatusFormData, setValue])

  useEffect(() => {
    const workOrderCount = watchedValues.workOrder?.length || 0
    if (workOrderCount === 0) {
      const initialWorkOrder = createEmptyWorkOrder()
      setValue("workOrder", [initialWorkOrder])
      onFormDataChange({ workOrder: [initialWorkOrder] })
    }
  }, [watchedValues.workOrder?.length, setValue, onFormDataChange])

  const workOrderRowsForTable = useMemo(
    () =>
      (watchedValues.workOrder || [])
        .map((wo: any, index: number) => ({ wo, originalIndex: index }))
        .filter(({ wo }) => {
          const hasWorkOrderNumber = Boolean((wo?.workOrderNumber || "").trim())
          const hasEffectiveFrom = Boolean((wo?.effectiveFrom || "").trim())
          const hasEffectiveTo = Boolean((wo?.effectiveTo || "").trim())
          const hasRemark = Boolean((wo?.remark || "").trim())
          const hasDocument = Boolean((wo?.nocByContractor?.documentPath || "").trim())
          return hasWorkOrderNumber || hasEffectiveFrom || hasEffectiveTo || hasRemark || hasDocument
        })
        .reverse(),
    [watchedValues.workOrder]
  )
  const getWorkOrderActive = (wo: any) => {
    if (!wo?.effectiveFrom || !wo?.effectiveTo) return false
    const today = new Date()
    const fromDate = new Date(wo.effectiveFrom)
    const toDate = new Date(wo.effectiveTo)
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return false
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const fromOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
    const toOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
    return todayOnly >= fromOnly && todayOnly <= toOnly
  }
  const columns = useMemo<ActionTableColumn<WorkOrderTableRow>[]>(
    () => [
      {
        key: "serial",
        label: "#",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (_row, index) => index + 1,
      },
      {
        key: "workOrderNumber",
        label: "Work Order Number",
        render: (row) => row.wo?.workOrderNumber || "-",
      },
      {
        key: "effectiveFrom",
        label: "Effective From",
        render: (row) => (row.wo?.effectiveFrom ? formatDateForDisplay(row.wo.effectiveFrom) : "-"),
      },
      {
        key: "effectiveTo",
        label: "Effective To",
        render: (row) => (row.wo?.effectiveTo ? formatDateForDisplay(row.wo.effectiveTo) : "-"),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => {
          const isActive = getWorkOrderActive(row.wo)
          return (
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
              {isActive ? "Active" : "Inactive"}
            </span>
          )
        },
      },
      {
        key: "document",
        label: "Document",
        render: (row) => {
          const documentPath = row.wo?.nocByContractor?.documentPath
          const hasDocument = typeof documentPath === "string" && documentPath.trim().length > 0
          if (!hasDocument) return "-"
          return (
            <div className="flex items-center gap-2">
              <span>Uploaded</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setPreviewDoc({
                    path: documentPath,
                    mime: guessMimeFromPath(documentPath),
                    title: "Work Order Document",
                  })
                  setPreviewOpen(true)
                }}
              >
                Preview
              </Button>
            </div>
          )
        },
      },
      {
        key: "remark",
        label: "Remark",
        render: (row) => row.wo?.remark || "-",
      },
    ],
    [formatDateForDisplay, getWorkOrderActive]
  )

  const searchFields = useMemo<ActionTableSearchField<WorkOrderTableRow>[]>(
    () => [
      {
        value: "workOrderNumber",
        label: "Work Order Number",
        getValue: (row) => row.wo?.workOrderNumber || "",
      },
      {
        value: "status",
        label: "Status",
        getValue: (row) => (getWorkOrderActive(row.wo) ? "active" : "inactive"),
      },
    ],
    [getWorkOrderActive]
  )

  return (
    <Card className="relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Briefcase className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Work Orders ({workOrderRowsForTable.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or edit work orders in the popup.
          </p>
        </div>
      </div>
      <div className="px-6 py-4 space-y-4">
        {showDateError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-600" />
              <p>{showDateError}</p>
            </div>
          </div>
        )}

        <ActionDataTable<WorkOrderTableRow>
          rows={workOrderRowsForTable}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"workOrderNumber" as WorkOrderSearchField}
          pageSize={pageSize}
          isViewMode={isViewMode || isSavingWorkOrder}
          onAdd={!isViewMode && !isSavingWorkOrder ? openAddInEditor : undefined}
          addButtonLabel="Add Work Order"
          onEdit={
            !isViewMode && !isSavingWorkOrder
              ? (rowIndex) => openEditInEditor(workOrderRowsForTable[rowIndex]?.originalIndex ?? rowIndex)
              : undefined
          }
          onDelete={
            !isViewMode && !isSavingWorkOrder
              ? (rowIndex) => setDeleteIndex(workOrderRowsForTable[rowIndex]?.originalIndex ?? rowIndex)
              : undefined
          }
          getRowKey={(row) => `workorder-row-${row.originalIndex}`}
          emptyTitle="No work orders added yet."
          emptyDescription="Use Add Work Order to add details."
        />

        {deleteIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <FileText className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-900">Remove work order</h3>
                  <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this work order?</p>
                </div>
              </div>
              <div className="px-5 py-4 flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={isSavingWorkOrder}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    if (deleteIndex === null) return
                    removeWorkOrder(deleteIndex)
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        )}

        <WorkOrderSection
          watchedValues={watchedValues}
          setValue={setValue}
          onFormDataChange={onFormDataChange}
          isViewMode={isViewMode || isSavingWorkOrder}
          isOpen={isEditorOpen}
          onClose={handleEditorClose}
          employeeSearchUrl={employeeSearchUrl}
          employeeCollectionUrl={employeeCollectionUrl}
          tenantCode={tenantCode}
          employeeRecordId={employeeRecordId}
          popupTitle={editorMode === "add" ? "Add Work Order" : "Edit Work Order"}
          contractorCode={contractorCode}
          setWorkOrderData={setWorkOrderData}
          showErrors={showErrors}
          errors={errors}
          workOrderData={workOrderData}
          workOrderValidationErrors={workOrderValidationErrors}
          setWorkOrderValidationErrors={setWorkOrderValidationErrors}
          showDateValidationError={showDateValidationError}
          handleDateChange={handleDateChange}
          removeWorkOrder={removeWorkOrder}
          getSelectedWorkOrder={getSelectedWorkOrder}
          getDateForInput={getDateForInput}
          formatDateForDisplay={formatDateForDisplay}
          currentMode={currentMode}
          auditStatusFormData={auditStatusFormData}
          workOrderConfig={workOrderConfig}
          onSaveSuccess={() => {
            setEditorSubmitted(true)
            setPendingAddInEditor(false)
            setIsEditorOpen(false)
            void refetchEmployeeWorkOrders()
          }}
          onSavingChange={setIsSavingWorkOrder}
        />

        <DocumentPreview
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          documentPath={previewDoc.path}
          mimeType={previewDoc.mime}
          title={previewDoc.title}
        />
      </div>
    </Card>
  )
}

