"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import TableHeader from "@/components/header/table-header"
import PageNotFound from "@/components/page-notfound"

import { useManpowerPlanningLogic, FIELD_LABELS, type ManpowerSearchField } from "./hooks/useManpowerPlanningLogic"
import ManpowerPlanningTable from "./manpower-planning-table"
import ManpowerPlanningAddPopup from "./manpower-planning-add-popup"
import type { ManpowerPlanningFormValues } from "./schemas/manpower-planning-form.schema"

export default function ManpowerPlanningPage() {
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [editInitialData, setEditInitialData] = useState<ManpowerPlanningFormValues | null>(null)

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
    navigateToView,
    refreshData,
  } = useManpowerPlanningLogic()

  if (!effectivePermissions && permissionsLoading) {
    return <div className="h-[60vh]" />
  }

  if (!hasAnyPermission) {
    return <PageNotFound />
  }

  const handleEditOpen = (id: string) => {
    const selected = rows.find((row) => String(row._id) === String(id))
    if (!selected) return

    const raw = selected.raw ?? {}
    const mapped: ManpowerPlanningFormValues = {
      subsidiary: {
        subsidiaryCode: raw?.subsidiary?.subsidiaryCode || "",
        subsidiaryName: raw?.subsidiary?.subsidiaryName || "",
      },
      division: {
        divisionCode: raw?.division?.divisionCode || "",
        divisionName: raw?.division?.divisionName || "",
      },
      location: {
        locationCode: raw?.location?.locationCode || "",
        locationName: raw?.location?.locationName || "",
      },
      department: {
        departmentCode: raw?.department?.departmentCode || "",
        departmentName: raw?.department?.departmentName || "",
      },
      fromDate: raw?.fromDate?.split("T")[0] || "",
      toDate: raw?.toDate?.split("T")[0] || "",
      shiftGroupCode: raw?.shiftGroupCode || "",
      shiftCode: raw?.shiftCode || "",
      manpower: {
        planned: raw?.manpower?.planned ?? 0,
        rotaPlanned: raw?.manpower?.rotaPlanned ?? 0,
        bench: raw?.manpower?.bench ?? 0,
        iedRequired: raw?.manpower?.iedRequired ?? 0,
      },
    }

    setEditingRowId(String(selected._id))
    setEditInitialData(mapped)
    setIsAddPopupOpen(true)
  }

  return (
    <div>
      <TableHeader
        title="Manpower Planning"
        description={
          loading || countLoading
            ? "Manpower Planning | Loading..."
            : `Manpower Planning | ${totalCount} records`
        }
        canAdd={addMode}
        onAddNew={() => setIsAddPopupOpen(true)}
        addButtonText="Add New Plan"
      />

      {/* Search bar */}
      <div className="w-full px-8 py-4 pb-0">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex bg-muted/50 rounded-lg border flex-1">
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-52">
              <Select
                value={searchField}
                onValueChange={(v) => setSearchField(v as ManpowerSearchField)}
              >
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subsidiary.subsidiaryName">Subsidiary</SelectItem>
                  <SelectItem value="division.divisionName">Division</SelectItem>
                  <SelectItem value="location.locationName">Location</SelectItem>
                  <SelectItem value="department.departmentName">Department</SelectItem>
                  <SelectItem value="shiftGroupCode">Shift Group</SelectItem>
                  <SelectItem value="shiftCode">Shift</SelectItem>
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
          <ManpowerPlanningTable
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

      <ManpowerPlanningAddPopup
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