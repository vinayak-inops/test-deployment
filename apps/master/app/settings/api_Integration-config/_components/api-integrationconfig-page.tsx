"use client"

import { useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import TableHeader from "@/components/header/table-header"
import PageNotFound from "@/components/page-notfound"
import { toast } from "react-toastify"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import ApiIntegrationController, { type ApiIntegrationFormValues } from "./api-integration-controller"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"

import { useApiIntegrationConfigLogic, FIELD_LABELS, type ApiIntegrationSearchField } from "./hooks/Useapiintegrationconfiglogic"
import ApiIntegrationConfigTable from "./api-integrationconfig-table"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApiIntegrationConfigPage() {
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
    setIsAddPopupOpen,
    setIsDraftPopupOpen,
    mode,
    isFormMode,
    rowId,
    navigateToEdit,
    navigateToView,
    navigateToAdd,
    closeForm,
    refreshData,
  } = useApiIntegrationConfigLogic()

  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  const selectedRow = useMemo(() => rows.find((r) => String(r._id) === String(rowId)), [rows, rowId])

  const { post } = usePostRequest<any>({
    url: "apiIntegrationConfig",
    onSuccess: () => {
      toast.success(`Config ${mode === "edit" ? "updated" : "created"} successfully`)
      void refreshData()
      closeForm()
    },
    onError: () => {
      toast.error(`Failed to ${mode === "edit" ? "update" : "create"} config`)
    },
  })

  const handleSubmit = async (formData: ApiIntegrationFormValues) => {
    const isEdit = mode === "edit"
    const now = new Date().toISOString()
    const existing = selectedRow?.raw
    const payloadData = {
      ...(existing || {}),
      ...formData,
      tenantCode: tenantCode || existing?.tenantCode,
      organizationCode: tenantCode || existing?.organizationCode || "",
      createdBy: existing?.created_by ?? employeeId ?? "",
      createdOn: existing?.created_at ?? now,
      updatedBy: isEdit ? employeeId ?? null : null,
      updatedOn: isEdit ? now : null,
    }
    await post({
      tenant: tenantCode,
      action: "insert",
      id: isEdit ? selectedRow?._id || null : null,
      collectionName: "apiIntegrationConfig",
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
        title="API Integration Config"
        description={
          loading || countLoading
            ? "API Integration Config Management | Loading..."
            : `API Integration Config Management | ${totalCount} configs`
        }
        canAdd={addMode}
        onAddNew={navigateToAdd}
        addButtonText="Add New Config"
      />

      {/* Search bar */}
      <div className="w-full px-8 py-4 pb-0">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex bg-muted/50 rounded-lg border flex-1">
            {/* Field selector */}
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-52">
              <Select
                value={searchField}
                onValueChange={(v) => setSearchField(v as ApiIntegrationSearchField)}
              >
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apiName">API Name</SelectItem>
                  <SelectItem value="server">Server</SelectItem>
                  <SelectItem value="method">Method</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="requestBodyType">Request Body Type</SelectItem>
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
          <ApiIntegrationConfigTable
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
        <>
          {(mode === "edit" || mode === "view") && selectedRow && (
            <ApiIntegrationController
              isOpen
              mode={mode}
              initialValues={selectedRow.raw}
              onClose={closeForm}
              onSubmit={handleSubmit}
            />
          )}
          {mode === "add" && (
            <ApiIntegrationController
              isOpen
              mode={mode}
              onClose={closeForm}
              onSubmit={handleSubmit}
            />
          )}
        </>
      )}
      {/* {isDraftPopupOpen && <DraftListModal onClose={() => setIsDraftPopupOpen(false)} />} */}
    </div>
  )
}
