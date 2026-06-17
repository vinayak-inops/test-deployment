"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { FileText } from "lucide-react"
import type { SalaryHeadItem } from "../../schemas/salary-head.schema"
import TemplateSalaryHeadsFormPopup from "./template-salary-heads-form-popup"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/serach/use-aggregate-array-fetch"

type SearchField = "salaryHeadCode" | "salaryHeadName"

interface TemplateSalaryHeadsSectionTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string 
  templateId?: string | null
}

export default function TemplateSalaryHeadsSectionTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
  templateId,
}: TemplateSalaryHeadsSectionTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [salaryHeads, setSalaryHeads] = useState<SalaryHeadItem[]>([])
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  // Fetch the template document to get salary heads
  const templateCriteria = useMemo(
    () => (tenantCode && templateId ? [
      { field: "tenantCode", operator: "eq", value: tenantCode },
      { field: "_id", operator: "eq", value: templateId }
    ] : []),
    [tenantCode, templateId]
  )

  const {
    arrayData: salaryHeadsArray,
    loading: salaryHeadsLoading,
    refetch: refetchSalaryHeads,
  } = useAggregateArrayFetch<any>({
    collection: "wageSalaryTemplates",
    criteriaRequests: templateCriteria,
    arrayField: "salaryHeads",
    enabled: Boolean(tenantCode && templateId),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode || !templateId) return
    void refetchSalaryHeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode, templateId])

  useEffect(() => {
    if (!Array.isArray(salaryHeadsArray)) return
    setSalaryHeads(salaryHeadsArray)
  }, [salaryHeadsArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedSalaryHeads = useMemo(() => [...salaryHeads].reverse(), [salaryHeads])
  const toOriginalIndex = (displayIndex: number) => salaryHeads.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<SalaryHeadItem>[]>(
    () => [
      {
        key: "salaryHeadCode",
        label: "Salary Head Code",
        render: (row) => row.salaryHeadCode || "-",
      },
      {
        key: "salaryHeadName",
        label: "Salary Head Name",
        render: (row) => row.salaryHeadName || "-",
      },
      {
        key: "amount",
        label: "Amount",
        render: (row) => (
          <Badge className="bg-blue-100 text-blue-800">
            Rs {row.amount ?? 0}
          </Badge>
        ),
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<SalaryHeadItem>[]>(
    () => [
      { value: "salaryHeadCode", label: "Code", getValue: (row) => row.salaryHeadCode || "" },
      { value: "salaryHeadName", label: "Name", getValue: (row) => row.salaryHeadName || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <FileText className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Salary Heads ({salaryHeads.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete salary head records for this template.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {salaryHeadsLoading && salaryHeads.length === 0 ? (
          <div className="text-sm text-gray-500">Loading salary heads...</div>
        ) : (
          <ActionDataTable<SalaryHeadItem>
            rows={displayedSalaryHeads}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"salaryHeadCode" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Salary Head"
            onEdit={editMode ? (rowIndex) => {
              setDeleteValue(null)
              setEditData(displayedSalaryHeads[rowIndex])
              setIsEditMode(true)
              setIsAddDrawerOpen(true)
            } : undefined}
            onDelete={deleteMode ? (rowIndex) => {
              const originalIndex = toOriginalIndex(rowIndex)
              setEditData(null)
              setIsEditMode(false)
              setDeleteValue(salaryHeads[originalIndex])
              setIsAddDrawerOpen(true)
            } : undefined}
            getRowKey={(row, index) => `${row.parseID || row.salaryHeadCode || "salary"}-${toOriginalIndex(index)}`}
            emptyTitle="No salary heads added yet."
            emptyDescription="Use Add Salary Head to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <TemplateSalaryHeadsFormPopup
          key={`template-salary-heads-${isEditMode ? "edit" : "add"}-${editData?.parseID || editData?._id || "new"}`}
          open={isAddDrawerOpen}
          organizationId={organizationId}
          templateId={templateId}
          deleteValue={deleteValue}
          setOpen={(isOpen: boolean) => {
            setIsAddDrawerOpen(isOpen)
            if (!isOpen) {
              setIsEditMode(false)
              setEditData(null)
              setDeleteValue(null)
            }
          }}
          editData={editData}
          isEditMode={isEditMode}
          onSuccess={() => {
            setIsEditMode(false)
            setEditData(null)
            setDeleteValue(null)
          }}
          onAddSuccess={() => {
            setShowSuccessPopup(true)
            setTimeout(() => setShowSuccessPopup(false), 3000)
          }}
          onServerUpdate={async () => {
            await refetchSalaryHeads()
            return null
          }}
        />
      )}

      {/* {showSuccessPopup && (
        <div className="fixed inset-x-0 top-6 z-[60] flex justify-center px-4">
          <SuccessAlertCard
            className="max-w-2xl"
            title="Salary head stored successfully!"
            description="The salary head has been added to the template successfully."
            actionLabel=""
            onClose={() => setShowSuccessPopup(false)}
          />
        </div>
      )} */}
    </div>
  )
}