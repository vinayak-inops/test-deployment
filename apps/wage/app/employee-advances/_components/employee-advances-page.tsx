"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import TableHeader from "@/components/header/table-header"
import PageNotFound from "@/components/page-notfound"

import {
  useEmployeeAdvancesLogic,
  FIELD_LABELS,
  type EmployeeAdvanceSearchField,
} from "./hooks/Useemployeeadvanceslogic"
import EmployeeAdvancesTable from "./employee-advances-table"
import AddEmployeeAdvanceModal, { type EmployeeAdvanceItem } from "./AddEmployeeAdvanceModal"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmployeeAdvancesPage() {
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
  } = useEmployeeAdvancesLogic()
  const [editData, setEditData] = useState<EmployeeAdvanceItem | null>(null)
  const isAddOpen = mode === "add"
  const isEditOpen = mode === "edit"
  const isViewOpen = mode === "view"
  const shouldLoadEditData = (isEditOpen || isViewOpen) && !!rowId

  useRequest<any[]>({
    url: "employee_advances/search",
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
        transactionDate: item?.transactionDate || "",
        amount: Number(item?.amount ?? 0),
        adjustmentMonth: Number(item?.adjustmentMonth ?? 1),
        adjustmentYear: Number(item?.adjustmentYear ?? new Date().getFullYear()),
        isAdjusted: !!item?.isAdjusted,
        isIncludedInPayroll: !!item?.isIncludedInPayroll,
        description: item?.description || "",
        employeeID: item?.employeeID || "",
      })
    },
  })

  useEffect(() => {
    if (isAddOpen) setEditData(null)
  }, [isAddOpen])

  const closeModal = () => {
    setEditData(null)
    router.push("/employee-advances")
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
        title="Employee Advances"
        description={
          loading || countLoading
            ? "Employee Advances Management | Loading..."
            : `Employee Advances Management | ${totalCount} records`
        }
        canAdd={addMode}
        onAddNew={() => router.push("/employee-advances?mode=add")}
        
        addButtonText="Add New Advance"
      />

      {/* Search bar */}
      <div className="w-full px-8 py-4 pb-0">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex bg-muted/50 rounded-lg border flex-1">
            {/* Field selector */}
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-52">
              <Select
                value={searchField}
                onValueChange={(v) => setSearchField(v as EmployeeAdvanceSearchField)}
              >
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employeeID">Employee ID</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                  <SelectItem value="transactionDate">Transaction Date</SelectItem>
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
          <EmployeeAdvancesTable
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

      <AddEmployeeAdvanceModal
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
