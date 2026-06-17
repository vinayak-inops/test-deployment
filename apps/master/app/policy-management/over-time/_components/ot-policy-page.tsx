"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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

import {
  useOtPolicyLogic,
  FIELD_LABELS,
  type OtPolicySearchField,
} from "./hooks/useOtpolicyLogic"
import OtPolicyTable from "./ot-policy-table"
import OtPolicyAddPopup from "./ot-policy-add-popup" // Import the popup component
import OtPolicyFormController from "./ot-policy-form-controller" // Import the form controller

export default function OtPolicyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get mode and id from URL
  const modeParam = searchParams.get("mode")
  const rowId = searchParams.get("id")
  
  // Popup state (only for add mode)
  const [isPopupOpen, setIsPopupOpen] = useState(false)

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
  } = useOtPolicyLogic()

  // Handle opening popup for add only
  const handleAdd = () => {
    setIsPopupOpen(true)
  }

  // Handle edit and view using URL navigation (controller)
  const handleEdit = (id: string) => {
    router.push(`?mode=edit&id=${encodeURIComponent(id)}`)
  }

  const handleView = (id: string) => {
    router.push(`?mode=view&id=${encodeURIComponent(id)}`)
  }

  // Handle popup close
  const handleClosePopup = () => {
    setIsPopupOpen(false)
  }

  // Handle save from popup
  const handleSaved = async () => {
    await refreshData()
    handleClosePopup()
  }

  // Handle close from controller
  const closeForm = () => {
    router.push("?")
  }

  // Check if we're in edit/view mode (controller mode)
  const isFormMode = modeParam === "edit" || modeParam === "view"
  const currentMode = modeParam as "add" | "edit" | "view" | null

  if (!effectivePermissions && permissionsLoading) {
    return <div className="h-[60vh]" />
  }

  if (!hasAnyPermission) {
    return <PageNotFound />
  }

  // If in edit or view mode, show the controller
  if (isFormMode && currentMode) {
    return (
      <OtPolicyFormController
        mode={currentMode}
        rowId={currentMode !== "add" ? rowId : null}
        onClose={closeForm}
        onSaved={async () => {
          await refreshData()
        }}
      />
    )
  }

  // Otherwise show the list view with popup for add
  return (
    <div>
      <TableHeader
        title="OT Policy"
        description={
          loading || countLoading
            ? "OT Policy | Loading..."
            : `OT Policy | ${totalCount} records`
        }
        canAdd={addMode}
        onAddNew={handleAdd}
        addButtonText="Add OT Policy"
      />

      {/* Search bar */}
      <div className="w-full px-8 py-4 pb-0">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex bg-muted/50 rounded-lg border flex-1">
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-52">
              <Select
                value={searchField}
                onValueChange={(v) => setSearchField(v as OtPolicySearchField)}
              >
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="otPolicy.otPolicyName">Policy Name</SelectItem>
                  <SelectItem value="otPolicy.otPolicyCode">Policy Code</SelectItem>
                  <SelectItem value="otPolicy.calculateOnTheBasisOf">Calculate On</SelectItem>
                  <SelectItem value="otPolicy.status">Status</SelectItem>
                  <SelectItem value="subsidiary.subsidiaryName">Subsidiary</SelectItem>
                  <SelectItem value="location.locationName">Location</SelectItem>
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
          <OtPolicyTable
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
            onEdit={handleEdit}
            onView={handleView}
          />
        </div>
      </div>

      {/* Popup Component - Only for Add mode */}
      <OtPolicyAddPopup
        isOpen={isPopupOpen}
        mode="add"
        recordId={null}
        onClose={handleClosePopup}
        onSaved={handleSaved}
      />
    </div>
  )
}