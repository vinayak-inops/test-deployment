"use client"

import { useMemo, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import TableHeader from "@/components/header/table-header"
import PageNotFound from "@/components/page-notfound"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

import {
  useEmployeeWageTemplateLogic,
  FIELD_LABELS,
  type EmployeeWageSearchField,
} from "./hooks/useEmployeeWageTemplateLogic"
import EmployeeWageTemplateTable from "./employee-wage-template-table"
import EmployeeWageTemplateAddPopup from "./employee-wage-template-add-popup"
import EmployeeWageTemplateFormController from "./employee-wage-template-form-controller"

export default function EmployeeWageTemplatePage() {
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false)
  const tenantCode = useGetTenantCode()

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
    navigateToEdit,
    navigateToView,
    closeForm,
    mode,
    isFormMode,
    rowId,
    refreshData,
  } = useEmployeeWageTemplateLogic()

  const selectedRow = useMemo(
    () => rows.find((row) => String(row._id) === String(rowId)),
    [rows, rowId],
  )

  const canAccessRequestedMode =
    (mode === "view" && viewMode) ||
    (mode === "edit" && editMode) ||
    (mode === "add" && addMode)

  if (!effectivePermissions && permissionsLoading) {
    return <div className="h-[60vh]" />
  }

  if (!hasAnyPermission) {
    return <PageNotFound />
  }

  if (isFormMode && mode) {
    if (!canAccessRequestedMode) return <PageNotFound />
    return (
      <EmployeeWageTemplateFormController
        mode={mode}
        rowId={selectedRow?._id ? String(selectedRow._id) : rowId}
        tenantCode={tenantCode}
        onClose={closeForm}
        onSaved={refreshData}
      />
    )
  }

  return (
    <div>
      <TableHeader
        title="Employee Wage Template"
        description={
          loading || countLoading
            ? "Employee Wage Template | Loading..."
            : `Employee Wage Template | ${totalCount} records`
        }
        canAdd={addMode}
        onAddNew={() => setIsAddPopupOpen(true)}
        addButtonText="Add New Template"
      />

      {/* Search bar */}
      <div className="w-full px-8 py-4 pb-0">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex bg-muted/50 rounded-lg border flex-1">
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-52">
              <Select
                value={searchField}
                onValueChange={(v) => setSearchField(v as EmployeeWageSearchField)}
              >
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employeeID">Employee ID</SelectItem>
                  <SelectItem value="effectiveFrom">Effective From</SelectItem>
                  <SelectItem value="effectiveTo">Effective To</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
          <EmployeeWageTemplateTable
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

      <EmployeeWageTemplateAddPopup
        isOpen={isAddPopupOpen}
        mode="add"
        recordId={null}
        onClose={() => setIsAddPopupOpen(false)}
        onSaved={async () => {
          await refreshData()
          setIsAddPopupOpen(false)
        }}
      />
    </div>
  )
}
