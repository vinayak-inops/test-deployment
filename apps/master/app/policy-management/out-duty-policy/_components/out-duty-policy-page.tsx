"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import TableHeader from "@/components/header/table-header"
import PageNotFound from "@/components/page-notfound"
import { useState } from "react"

import {
  useOutDutyPolicyLogic,
  FIELD_LABELS,
  type OutDutySearchField,
} from "./hooks/useOutDutyPolicyLogic"
import OutDutyPolicyTable from "./out-duty-policy-table"
import OutDutyPolicyAddPopup from "./out-duty-policy-add-popup"

export default function OutDutyPolicyPage() {
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false)
  const [editingRowId, setEditingRowId]     = useState<string | null>(null)
  const [viewingRowId, setViewingRowId]     = useState<string | null>(null)

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
    refreshData,
  } = useOutDutyPolicyLogic()

  if (!effectivePermissions && permissionsLoading) {
    return <div className="h-[60vh]" />
  }

  if (!hasAnyPermission) {
    return <PageNotFound />
  }

  const handleEditOpen = (id: string) => {
    setEditingRowId(id)
    setViewingRowId(null)
    setIsAddPopupOpen(true)
  }

  const handleViewOpen = (id: string) => {
    setViewingRowId(id)
    setEditingRowId(null)
    setIsAddPopupOpen(true)
  }

  const handleClose = () => {
    setIsAddPopupOpen(false)
    setEditingRowId(null)
    setViewingRowId(null)
  }

  const handleSaved = async () => {
    await refreshData()
    handleClose()
  }

  return (
    <div>
      <TableHeader
        title="Out-Duty Policy"
        description={
          loading || countLoading
            ? "Out-Duty Policy | Loading..."
            : `Out-Duty Policy | ${totalCount} records`
        }
        canAdd={addMode}
        onAddNew={() => setIsAddPopupOpen(true)}
        addButtonText="Add Policy"
      />

      {/* Search bar */}
      <div className="w-full px-8 py-4 pb-0">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex bg-muted/50 rounded-lg border flex-1">
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-52">
              <Select
                value={searchField}
                onValueChange={(v) => setSearchField(v as OutDutySearchField)}
              >
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subsidiary.subsidiaryName">Subsidiary</SelectItem>
                  <SelectItem value="location.locationName">Location</SelectItem>
                  <SelectItem value="designation.designationName">Designation</SelectItem>
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
          <OutDutyPolicyTable
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
            onView={handleViewOpen}
          />
        </div>
      </div>

      <OutDutyPolicyAddPopup
        isOpen={isAddPopupOpen}
        mode={editingRowId ? "edit" : viewingRowId ? "view" : "add"}
        recordId={editingRowId || viewingRowId}
        onClose={handleClose}
        onSaved={handleSaved}
      />
    </div>
  )
}
