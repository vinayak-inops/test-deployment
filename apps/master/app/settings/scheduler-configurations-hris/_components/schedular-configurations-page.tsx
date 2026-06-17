"use client"

import { useMemo, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import TableHeader from "@/components/header/table-header"
import PageNotFound from "@/components/page-notfound"
import { toast } from "react-toastify"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"

import { useSchedulerConfigLogic, FIELD_LABELS, type SchedulerSearchField } from "./hooks/useschedulerconfiglogic"
import SchedulerConfigTable from "./schedular-configurations-table"
import SchedulerFormController from "./scheduler-form-controller"
import type { SchedulerFormValues } from "./scheduler-form-controller"


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulerConfigurationsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    setIsDraftPopupOpen,
    navigateToEdit,
    navigateToView,
    navigateToAdd,
    closeForm,
    mode,
    isFormMode,
    rowId,
    refreshData,
  } = useSchedulerConfigLogic()

  const selectedRow = useMemo(
    () => rows.find((row) => String(row._id) === String(rowId)),
    [rows, rowId]
  )

  const { post: postScheduler } = usePostRequest<any>({
    url: "scheduler_configurations",
    onSuccess: () => {
      toast.success(`Scheduler ${mode === "edit" ? "updated" : "created"} successfully`)
      void refreshData()
      closeForm()
      setIsSubmitting(false)
    },
    onError: (error) => {
      toast.error(`Failed to ${mode === "edit" ? "update" : "create"} scheduler`)
      console.error("Scheduler save error:", error)
      setIsSubmitting(false)
    },
  })

  const handleFormSubmit = async (formData: SchedulerFormValues) => {
    setIsSubmitting(true)

    const isEdit = mode === "edit"
    const now = new Date().toISOString()
    const existing = selectedRow?.raw

    const payloadData = {
      ...(existing || {}),
      ...formData,
      tenantCode: tenantCode || formData.tenantCode || existing?.tenantCode,
      organizationCode: tenantCode,
        created_by: existing?.audit?.created_by ?? employeeId ?? "",
        created_at: existing?.audit?.created_at ?? now,
        updated_by: isEdit ? employeeId ?? null : null,
        updated_at: isEdit ? now : null,
    }
    
    await postScheduler({
      tenant: tenantCode,
      action: isEdit ? "insert" : "insert",
      id: isEdit ? selectedRow?._id || null : null,
      collectionName: "scheduler_configurations",
      event: "scheduler",
      data: payloadData,
    })
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
        title="Scheduler Configurations"
        description={
          loading || countLoading
            ? "Scheduler Configuration Management | Loading..."
            : `Scheduler Configuration Management | ${totalCount} schedulers`
        }
        canAdd={addMode}
        onAddNew={navigateToAdd}
        addButtonText="Add New Scheduler"
      />

      {/* Search bar */}
      <div className="w-full px-8 py-4 pb-0">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex bg-muted/50 rounded-lg border flex-1">
            {/* Field selector */}
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-52">
              <Select
                value={searchField}
                onValueChange={(v) => setSearchField(v as SchedulerSearchField)}
              >
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduler_name">Scheduler Name</SelectItem>
                  <SelectItem value="scheduler_type">Scheduler Type</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                  <SelectItem value="frequency.type">Frequency Type</SelectItem>
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
          <SchedulerConfigTable
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

      {/* Modals */}
      {isFormMode && mode && (
        <SchedulerFormController
          isOpen
          mode={mode}
          initialValues={mode === "add" ? undefined : selectedRow?.raw}
          onSubmit={handleFormSubmit}
          submitLoading={isSubmitting}
          onClose={closeForm}
        />
      )}
      {/* {isAddPopupOpen && <AddSchedulerModal onClose={() => setIsAddPopupOpen(false)} />} */}
      {/* {isDraftPopupOpen && <DraftListModal onClose={() => setIsDraftPopupOpen(false)} />} */}
    </div>
  )
}
