"use client"

import { useMemo, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import TableHeader from "@/components/header/table-header"
import PageNotFound from "@/components/page-notfound"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info"

import { useMinimumWagesLogic, FIELD_LABELS, type MinimumWagesSearchField } from "./hooks/useMinimumwageSlogic"
import MinimumWagesTable from "./minimum-wages-table"
import MinimumWagesFormController from "./minimum-wages-form-controller"
import MinimumWagesFormPopup from "./minimum-wages-form-popup"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MinimumWagesConfigurationsPage() {
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false)
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()

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
  } = useMinimumWagesLogic()

  const selectedRow = useMemo(
    () => rows.find((row) => String(row._id) === String(rowId)),
    [rows, rowId]
  )

  const canAccessRequestedMode =
    (mode === "view" && viewMode) ||
    (mode === "edit" && editMode) ||
    (mode === "add" && addMode)

//   const handleFormSubmit = async (formData: MinimumWagesFormValues) => {
//     setIsSubmitting(true)

//     const isEdit = mode === "edit"
//     const now = new Date().toISOString()
//     const existing = selectedRow?.raw

//     const payloadData = {
//       ...(existing || {}),
//       ...formData,
//       tenantCode: tenantCode || formData.tenantCode || existing?.tenantCode,
//       organizationCode: tenantCode,
//       updatedOn: now,
//     }

//     await postMinimumWages({
//       tenant: tenantCode,
//       action: "insert",
//       id: isEdit ? selectedRow?._id || null : null,
//       collectionName: "wageMinimumWages",
//       event: "wageMinimumWages",
//       data: payloadData,
//     })
//   }

  // ── Permission guards ──────────────────────────────────────────────────────

  if (!effectivePermissions && permissionsLoading) {
    return <div className="h-[60vh]" />
  }

  if (!hasAnyPermission) {
    return <PageNotFound />
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isFormMode && mode && mode !== "add") {
    if (!canAccessRequestedMode) return <PageNotFound />
    return (
      <MinimumWagesFormController
        mode={mode}
        rowId={selectedRow?._id ? String(selectedRow._id) : rowId}
        initialValues={selectedRow?.raw}
        tenantCode={tenantCode}
        employeeId={employeeId}
        onClose={closeForm}
        onSaved={refreshData}
      />
    )
  }

  return (
    <div>
      {/* Header */}
      <TableHeader
        title="Minimum Wages Configurations"
        description={
          loading || countLoading
            ? "Minimum Wages Configuration Management | Loading..."
            : `Minimum Wages Configuration Management | ${totalCount} records`
        }
        canAdd={addMode}
        onAddNew={() => setIsAddPopupOpen(true)}
        addButtonText="Add New Minimum Wage"
      />

      {/* Search bar */}
      <div className="w-full px-8 py-4 pb-0">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex bg-muted/50 rounded-lg border flex-1">
            {/* Field selector */}
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-52">
              <Select
                value={searchField}
                onValueChange={(v) => setSearchField(v as MinimumWagesSearchField)}
              >
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="state">State</SelectItem>
                  <SelectItem value="applicableTo">Applicable To</SelectItem>
                  <SelectItem value="effectiveFrom">Effective From</SelectItem>
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
          <MinimumWagesTable
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

      <MinimumWagesFormPopup
        isOpen={isAddPopupOpen}
        mode="add"
        tenantCode={tenantCode}
        employeeId={employeeId}
        onClose={() => setIsAddPopupOpen(false)}
        onSaved={async () => {
          await refreshData()
          setIsAddPopupOpen(false)
        }}
      />
    </div>
  )
}
