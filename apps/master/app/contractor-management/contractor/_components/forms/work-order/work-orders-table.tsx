"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { ClipboardList, AlertTriangle, Eye } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import DocumentPreview from "@/components/popup/document-preview"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { WorkOrderFormPopup } from "./work-order-form-popup"
import { type WorkOrder } from "../../schemas/work-order-form-schema"

type SearchField = "workOrderNumber" | "workOrderDate" | "contractPeriodFrom" | "contractPeriodTo" | "workOrderType"

interface WorkOrdersTableProps {
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  onSaved?: () => void
}

function getFileNameFromPath(path?: string): string {
  if (!path) return ""
  const normalized = path.replace(/\\/g, "/")
  const parts = normalized.split("/")
  return parts[parts.length - 1] || path
}

function guessMimeFromPath(path: string): string {
  const lower = (path || "").toLowerCase()
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".gif")) return "image/gif"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".pdf")) return "application/pdf"
  if (lower.endsWith(".doc")) return "application/msword"
  if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  return "application/octet-stream"
}

function toIsoDate(value: any): string {
  if (!value) return ""
  if (typeof value === "string") return value.includes("T") ? value.split("T")[0] : value
  if (typeof value === "object" && value.$date) {
    try {
      return new Date(value.$date).toISOString().split("T")[0]
    } catch {
      return ""
    }
  }
  return ""
}

function normalizeWorkOrder(workOrder: any): WorkOrder {
  const normalizePath = (val: any) => (typeof val === "string" ? val : val?.documentPath || "")
  return {
    parseID: workOrder.parseID || undefined,
    workOrderNumber: workOrder.workOrderNumber || "",
    workOrderDate: toIsoDate(workOrder.workOrderDate),
    proposalReferenceNumber: workOrder.proposalReferenceNumber || "",
    NumberOfEmployee: Number(workOrder.NumberOfEmployee || workOrder.NumberOfEmployees || 0),
    contractPeriodFrom: toIsoDate(workOrder.contractPeriodFrom),
    contractPeriodTo: toIsoDate(workOrder.contractPeriodTo),
    workOrderDocumentFilePath: normalizePath(workOrder.workOrderDocumentFilePath),
    annexureFilePath: normalizePath(workOrder.annexureFilePath),
    serviceChargeAmount: Number(workOrder.serviceChargeAmount || 0),
    workOrderType: workOrder.workOrderType || "Standard",
    workOrderLineItems: workOrder.workOrderLineItems || "",
    serviceLineItems: workOrder.serviceLineItems || "",
    serviceCode: workOrder.serviceCode || "",
    wcChargesPerEmployee: Number(workOrder.wcChargesPerEmployee || 0),
    assetChargesPerDay: Array.isArray(workOrder.assetChargesPerDay)
      ? workOrder.assetChargesPerDay.map((asset: any) => ({
          assetCode: asset.assetCode || "",
          assetName: asset.assetName || "",
          assetCharges: Number(asset.assetCharges || 0),
        }))
      : workOrder.assetCode
      ? [{ assetCode: workOrder.assetCode || "", assetName: workOrder.assetName || "", assetCharges: Number(workOrder.assetCharges || 0) }]
      : [{ assetCode: "", assetName: "", assetCharges: 0 }],
    employeeWages: {
      wageType: workOrder.wageType || workOrder.employeeWages?.wageType || "",
      wageAmount: Number(workOrder.wageAmount || workOrder.employeeWages?.wageAmount || 0),
    },
    allocatedManPower: Array.isArray(workOrder.allocatedManPower)
      ? workOrder.allocatedManPower.map((ap: any) => ({
          skillLevel: {
            skilledLevelTitle: ap?.skillLevel?.skilledLevelTitle || "",
            skilledLevelDescription: ap?.skillLevel?.skilledLevelDescription || "",
          },
          manPower: Number(ap?.manPower || 0),
        }))
      : [],
    departments: Array.isArray(workOrder.departments)
      ? workOrder.departments
      : Array.isArray(workOrder.department)
      ? workOrder.department
      : [],
    remarks: workOrder.remarks || "",
    showAllManPower: Boolean(workOrder.showAllManPower),
    showAllAssetCharges: Boolean(workOrder.showAllAssetCharges),
  }
}

export function WorkOrdersTable({
  mode = "add",
  employeeRecordId = null,
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  onSaved,
}: WorkOrdersTableProps) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [subOrganization, setSubOrganization] = useState<any>({})
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ path?: string; mime?: string; title?: string }>({})

  const tenantCode = useGetTenantCode()
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const canFetchWorkOrders = Boolean(employeeRecordId) && currentMode !== "add"

  const criteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteria: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) criteria.push({ field: "tenantCode", operator: "is", value: tenantCode })
    return criteria
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedWorkOrders, refetch: refetchWorkOrders } = useAggregateArrayFetch<any>({
    collection: employeeSearchUrl !== "contractor/search" ? "draft/contractor" : "contractor",
    criteriaRequests,
    arrayField: "workOrders",
    enabled: canFetchWorkOrders,
    defaultValue: [],
  })

  const { refetch: fetchOrgData } = useRequest<any[]>({
    url: `map/organization/search?tenantCode=${tenantCode}`,
    onSuccess: (data: any) => {
      if (Array.isArray(data) && data.length > 0) {
        const org = data[0] || {}
        setSubOrganization({
          ...org,
          assetMaster: org.assetMaster || { assets: [] },
          skillLevels: org.skillLevels || [],
          divisions: org.divisions || [],
          departments: org.departments || [],
          subDepartments: org.subDepartments || [],
          sections: org.sections || [],
          employeeCategories: org.employeeCategories || [],
          grades: org.grades || [],
          designations: org.designations || [],
          location: org.location || [],
        })
      } else {
        setSubOrganization({
          assetMaster: { assets: [] },
          skillLevels: [],
          divisions: [],
          departments: [],
          subDepartments: [],
          sections: [],
          employeeCategories: [],
          grades: [],
          designations: [],
          location: [],
        })
      }
    },
    onError: () => {
      setSubOrganization({
        assetMaster: { assets: [] },
        skillLevels: [],
        divisions: [],
        departments: [],
        subDepartments: [],
        sections: [],
        employeeCategories: [],
        grades: [],
        designations: [],
        location: [],
      })
    },
  })

  useEffect(() => {
    void fetchOrgData()
  }, [])

  useEffect(() => {
    if (!canFetchWorkOrders) return
    void refetchWorkOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchWorkOrders, tenantCode])

  useEffect(() => {
    if (!canFetchWorkOrders) return
    if (Array.isArray(fetchedWorkOrders)) {
      setWorkOrders(fetchedWorkOrders.map(normalizeWorkOrder))
    }
  }, [canFetchWorkOrders, fetchedWorkOrders])

  useEffect(() => {
    if (currentMode === "add") setWorkOrders([])
  }, [currentMode])

  const openAdd = () => {
    setEditIndex(null)
    setIsFormOpen(true)
  }

  const openEdit = (index: number) => {
    setEditIndex(index)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditIndex(null)
  }

  const handlePopupSubmit = (next: WorkOrder[]) => {
    setWorkOrders(next)
  }

  const removeWorkOrder = (index: number) => {
    setWorkOrders((prev) => prev.filter((_, i) => i !== index))
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<WorkOrder>[]>(
    () => [
      {
        key: "workOrderNumber",
        label: "Work Order Number",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.workOrderNumber || "-",
      },
      { key: "workOrderDate", label: "Work Order Date", render: (row) => row.workOrderDate || "-" },
      { key: "proposalReferenceNumber", label: "Proposal Ref", render: (row) => row.proposalReferenceNumber || "-" },
      { key: "NumberOfEmployee", label: "Employees", render: (row) => `${Number(row.NumberOfEmployee || 0)}` },
      { key: "contractPeriodFrom", label: "Contract From", render: (row) => row.contractPeriodFrom || "-" },
      { key: "contractPeriodTo", label: "Contract To", render: (row) => row.contractPeriodTo || "-" },
      { key: "workOrderType", label: "Work Order Type", render: (row) => row.workOrderType || "-" },
      { key: "serviceChargeAmount", label: "Service Charge", render: (row) => `${Number(row.serviceChargeAmount || 0)}` },
      { key: "serviceCode", label: "Service Code", render: (row) => row.serviceCode || "-" },
      { key: "wcChargesPerEmployee", label: "WC/Employee", render: (row) => `${Number(row.wcChargesPerEmployee || 0)}` },
      {
        key: "workOrderLineItems",
        label: "Work Order Items",
        render: (row) => row.workOrderLineItems || "-",
      },
      {
        key: "serviceLineItems",
        label: "Service Items",
        render: (row) => row.serviceLineItems || "-",
      },
      {
        key: "employeeWages",
        label: "Wages",
        render: (row) => {
          const wt = row.employeeWages?.wageType || "-"
          const wa = Number(row.employeeWages?.wageAmount || 0)
          return `${wt} / ${wa}`
        },
      },
      {
        key: "departments",
        label: "Departments",
        render: (row) =>
          Array.isArray(row.departments) && row.departments.length > 0
            ? row.departments.map((d) => d.departmentCode || d.departmentName).filter(Boolean).join(", ")
            : "-",
      },
      {
        key: "assetChargesPerDay",
        label: "Asset Charges",
        render: (row) =>
          Array.isArray(row.assetChargesPerDay) && row.assetChargesPerDay.length > 0
            ? row.assetChargesPerDay
                .map((a) => `${a.assetCode || a.assetName || "-"}:${Number(a.assetCharges || 0)}`)
                .join(", ")
            : "-",
      },
      {
        key: "allocatedManPower",
        label: "Allocated Man Power",
        render: (row) =>
          Array.isArray(row.allocatedManPower) && row.allocatedManPower.length > 0
            ? row.allocatedManPower
                .map(
                  (m) =>
                    `${m.skillLevel?.skilledLevelTitle || "-"}:${Number(m.manPower || 0)}`
                )
                .join(", ")
            : "-",
      },
      {
        key: "remarks",
        label: "Remarks",
        render: (row) => row.remarks || "-",
      },
      {
        key: "workOrderDocumentFilePath",
        label: "Document",
        render: (row) =>
          row.workOrderDocumentFilePath ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setPreviewDoc({
                  path: row.workOrderDocumentFilePath,
                  mime: guessMimeFromPath(row.workOrderDocumentFilePath || ""),
                  title: getFileNameFromPath(row.workOrderDocumentFilePath) || "Work Order Document",
                })
                setPreviewOpen(true)
              }}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview
            </Button>
          ) : (
            "-"
          ),
      },
      {
        key: "annexureFilePath",
        label: "Annexure",
        render: (row) =>
          row.annexureFilePath ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setPreviewDoc({
                  path: row.annexureFilePath,
                  mime: guessMimeFromPath(row.annexureFilePath || ""),
                  title: getFileNameFromPath(row.annexureFilePath) || "Annexure",
                })
                setPreviewOpen(true)
              }}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview
            </Button>
          ) : (
            "-"
          ),
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<WorkOrder>[]>(
    () => [
      { value: "workOrderNumber", label: "Work Order Number", getValue: (row) => row.workOrderNumber || "" },
      { value: "workOrderDate", label: "Work Order Date", getValue: (row) => row.workOrderDate || "" },
      { value: "proposalReferenceNumber", label: "Proposal Ref", getValue: (row) => row.proposalReferenceNumber || "" },
      { value: "NumberOfEmployee", label: "Employees", getValue: (row) => String(row.NumberOfEmployee || "") },
      { value: "contractPeriodFrom", label: "Contract From", getValue: (row) => row.contractPeriodFrom || "" },
      { value: "contractPeriodTo", label: "Contract To", getValue: (row) => row.contractPeriodTo || "" },
      { value: "workOrderType", label: "Work Order Type", getValue: (row) => row.workOrderType || "" },
      { value: "serviceCode", label: "Service Code", getValue: (row) => row.serviceCode || "" },
      { value: "remarks", label: "Remarks", getValue: (row) => row.remarks || "" },
    ],
    []
  )

  const initialValue = editIndex !== null && workOrders[editIndex] ? workOrders[editIndex] : null
  const displayedWorkOrders = useMemo(() => [...workOrders].reverse(), [workOrders])
  const toOriginalIndex = (displayIndex: number) => workOrders.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <ClipboardList className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Work Orders ({workOrders.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add or edit work orders in the popup.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<WorkOrder>
          rows={displayedWorkOrders}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"workOrderNumber" as SearchField}
          isViewMode={isViewMode}
          onAdd={!isViewMode ? openAdd : undefined}
          addButtonLabel="Add Work Order"
          onEdit={!isViewMode ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.workOrderNumber || "work-order"}-${toOriginalIndex(index)}`}
          emptyTitle="No work orders added yet."
          emptyDescription="Use Add Work Order to add details."
        />
      </div>

      <WorkOrderFormPopup
        open={isFormOpen && !isViewMode}
        onClose={closeForm}
        initialWorkOrder={initialValue}
        onSaved={onSaved}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        contractorCollectionUrl={contractorCollectionUrl}
        workOrders={workOrders}
        editIndex={editIndex}
        refetchWorkOrders={refetchWorkOrders}
        onSubmit={handlePopupSubmit}
        subOrganization={subOrganization}
        disabled={isViewMode}
      />

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
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
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => removeWorkOrder(deleteIndex)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      <DocumentPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentPath={previewDoc.path}
        mimeType={previewDoc.mime}
        title={previewDoc.title}
      />
    </div>
  )
}
