"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import TableHeader from "@/components/header/table-header"
import PageNotFound from "@/components/page-notfound"

import {
  useEmployeePenaltiesLogic,
  FIELD_LABELS,
  type EmployeePenaltySearchField,
} from "./hooks/Useemployeepenaltieslogic"
import EmployeePenaltiesTable from "./employee-penalties-table"
import AddEmployeePenaltyModal, { type EmployeePenaltyItem } from "./AddEmployeePenaltyModal"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmployeePenaltiesPage() {
  const router = useRouter()
  const {
    rows,
    totalCount,
    totalPages,
    safePage,
    startIndex,
    endIndex,
    searchField,
    setSearchField,
    searchTerm,
    setSearchTerm,
    setCurrentPage,
    loading,
    countLoading,
    viewMode,
    editMode,
    addMode,
    hasAnyPermission,
    effectivePermissions,
    permissionsLoading,
    setIsDraftPopupOpen,
    navigateToEdit,
    navigateToView,
    mode,
    rowId,
    refetch,
    refetchCount,
  } = useEmployeePenaltiesLogic()
  const [editData, setEditData] = useState<EmployeePenaltyItem | null>(null)
  const isAddOpen = mode === "add"
  const isEditOpen = mode === "edit"
  const isViewOpen = mode === "view"
  const shouldLoadEditData = (isEditOpen || isViewOpen) && !!rowId

  useRequest<any[]>({
    url: "employee_penalties/search",
    method: "POST",
    data: shouldLoadEditData ? [{ field: "_id", operator: "eq", value: rowId || "" }] : [],
    dependencies: [rowId, mode, shouldLoadEditData],
    onSuccess: (data) => {
      if (!shouldLoadEditData) return
      const item = Array.isArray(data) ? data[0] : null
      if (!item) {
        setEditData(null)
        return
      }
      setEditData({
        _id: item?._id?.$oid || item?._id || "",
        employeeID: item?.employeeID || "",
        dateOfOffence: item?.dateOfOffence || "",
        actionTaken: item?.actionTaken || "",
        adjustmentMonth: Number(item?.adjustmentMonth ?? 1),
        adjustmentYear: Number(item?.adjustmentYear ?? new Date().getFullYear()),
        isCauseShownAgainstFine: !!item?.isCauseShownAgainstFine,
        fineImposed: Number(item?.fineImposed ?? 0),
        witnessEmployeeID: item?.witnessEmployeeID || "",
        witnessName: item?.witnessName || "",
        fineRealisedDate: item?.fineRealisedDate || "",
        isAdjusted: !!item?.isAdjusted,
        isIncludedInPayroll: !!item?.isIncludedInPayroll,
        offenceDescription: item?.offenceDescription || "",
      })
    },
  })

  useEffect(() => {
    if (isAddOpen) {
      setEditData(null)
    }
  }, [isAddOpen])

  const closeModal = () => {
    setEditData(null)
    router.push("/employee-penalties")
  }

  // ── Permission guards ──────────────────────────────────────────────────────

  if (!effectivePermissions && permissionsLoading) {
    return <div className="h-[60vh]" />
  }

  if (!hasAnyPermission) {
    return <PageNotFound />
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <TableHeader
        title="Employee Penalties"
        description={
          loading || countLoading
            ? "Employee Penalties Management | Loading..."
            : `Employee Penalties Management | ${totalCount} records`
        }
        canAdd={addMode}
        onAddNew={() => router.push("/employee-penalties?mode=add")}
        
        addButtonText="Add New Penalty"
      />

      {/* Search bar */}
      <div className="w-full px-8 py-4 pb-0">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex bg-muted/50 rounded-lg border flex-1">
            {/* Field selector */}
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-52">
              <Select
                value={searchField}
                onValueChange={(v) => setSearchField(v as EmployeePenaltySearchField)}
              >
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employeeID">Employee ID</SelectItem>
                  <SelectItem value="witnessEmployeeID">Witness Employee ID</SelectItem>
                  <SelectItem value="witnessName">Witness Name</SelectItem>
                  <SelectItem value="actionTaken">Action Taken</SelectItem>
                  <SelectItem value="offenceDescription">Offence Description</SelectItem>
                  <SelectItem value="adjustmentMonth">Adjustment Month</SelectItem>
                  <SelectItem value="adjustmentYear">Adjustment Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search input */}
            <div className="flex-1 flex items-center bg-background rounded-r-lg min-w-0">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder={`Search by ${FIELD_LABELS[searchField].toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent w-full placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="px-8 py-4">
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <EmployeePenaltiesTable
            rows={rows}
            loading={loading}
            countLoading={countLoading}
            totalCount={totalCount}
            totalPages={totalPages}
            safePage={safePage}
            startIndex={startIndex}
            endIndex={endIndex}
            setCurrentPage={setCurrentPage}
            viewMode={viewMode}
            editMode={editMode}
            onEdit={navigateToEdit}
            onView={navigateToView}
          />
        </div>
      </div>

      <AddEmployeePenaltyModal
        key={`${mode || "list"}-${rowId || "new"}`}
        open={isAddOpen || isEditOpen || isViewOpen}
        isEditMode={isEditOpen}
        isViewMode={isViewOpen}
        editData={isEditOpen || isViewOpen ? editData : null}
        onClose={closeModal}
        onSuccess={async () => {
          await refetch()
          await refetchCount()
        }}
      />
      {/* {isDraftPopupOpen && <DraftListModal onClose={() => setIsDraftPopupOpen(false)} />} */}
    </div>
  )
}
