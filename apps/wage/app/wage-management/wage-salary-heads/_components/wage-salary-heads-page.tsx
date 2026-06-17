"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import TableHeader from "@/components/header/table-header"
import PageNotFound from "@/components/page-notfound"

import { useWageSalaryHeadsLogic, FIELD_LABELS, type SalaryHeadSearchField } from "./hooks/useWagesalaryHeadsLogic"
import WageSalaryHeadsTable from "./wage-salary-heads-table"
import WageSalaryHeadsAddPopup from "./wage-salary-heads-add-popup"
import type { WageSalaryHeadFormValues } from "./schemas/wage-salary-head-form.schema"
// import WageSalaryHeadsFormController from "./wage-salary-heads-form-controller"
// import type { WageSalaryHeadsFormValues } from "./wage-salary-heads-form-controller"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WageSalaryHeadsPage() {
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [editInitialData, setEditInitialData] = useState<WageSalaryHeadFormValues | null>(null)

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
    refreshData,
  } = useWageSalaryHeadsLogic()

//   const handleFormSubmit = async (formData: WageSalaryHeadsFormValues) => {
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

//     await postSalaryHead({
//       tenant: tenantCode,
//       action: "insert",
//       id: isEdit ? selectedRow?._id || null : null,
//       collectionName: "wageSalaryHeads",
//       event: "wageSalaryHeads",
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

  const handleEditOpen = (id: string) => {
    const selected = rows.find((row) => String(row._id) === String(id))
    if (!selected) return

    const raw = selected.raw ?? {}
    const mapped: WageSalaryHeadFormValues = {
      name: raw?.name || "",
      code: raw?.code || "",
      description: raw?.description || "",
      excludedDays: Array.isArray(raw?.excludedDays) ? raw.excludedDays : [],
      applicableMonths: Array.isArray(raw?.applicableMonths) ? raw.applicableMonths : [],
      primarySalaryHead: {
        name: raw?.primarySalaryHead?.name || "",
        code: raw?.primarySalaryHead?.code || "",
      },
      salaryType: raw?.salaryType === "deduction" ? "deduction" : "earning",
      calculationType: {
        type: raw?.calculationType?.type === "percentage" ? "percentage" : "fixed",
      },
      salaryCalculationBasis: raw?.salaryCalculationBasis || "",
      printable: raw?.printable === true,
    }

    setEditingRowId(String(selected._id))
    setEditInitialData(mapped)
    setIsAddPopupOpen(true)
  }

  return (
    <div>
      {/* Header */}
      <TableHeader
        title="Wage Salary Heads"
        description={
          loading || countLoading
            ? "Salary Head Management | Loading..."
            : `Salary Head Management | ${totalCount} heads`
        }
        canAdd={addMode}
        onAddNew={() => setIsAddPopupOpen(true)}
        addButtonText="Add New Head"
      />

      {/* Search bar */}
      <div className="w-full px-8 py-4 pb-0">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex bg-muted/50 rounded-lg border flex-1">
            {/* Field selector */}
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-52">
              <Select
                value={searchField}
                onValueChange={(v) => setSearchField(v as SalaryHeadSearchField)}
              >
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="state">State</SelectItem>
                  <SelectItem value="zone">Zone</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="subsidiary.subsidiaryName">Subsidiary</SelectItem>
                  <SelectItem value="designation.designationName">Designation</SelectItem>
                  <SelectItem value="grade.gradeName">Grade</SelectItem>
                  <SelectItem value="category.categoryName">Category</SelectItem>
                  <SelectItem value="skillLevel.skilledLevelTitle">Skill Level</SelectItem>
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
          <WageSalaryHeadsTable
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
            onEdit={handleEditOpen}
            onView={navigateToView}
          />
        </div>
      </div>

      <WageSalaryHeadsAddPopup
        isOpen={isAddPopupOpen}
        mode={editingRowId ? "edit" : "add"}
        recordId={editingRowId}
        onClose={() => {
          setIsAddPopupOpen(false)
          setEditingRowId(null)
          setEditInitialData(null)
        }}
        onSaved={async () => {
          await refreshData()
          setIsAddPopupOpen(false)
          setEditingRowId(null)
          setEditInitialData(null)
        }}
      />
    </div>
  )
}
