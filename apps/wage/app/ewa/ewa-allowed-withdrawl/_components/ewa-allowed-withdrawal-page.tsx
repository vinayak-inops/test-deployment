"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import TableHeader from "@/components/header/table-header"
import PageNotFound from "@/components/page-notfound"

import {
  useEWAAllowedWithdrawalLogic,
  FIELD_LABELS,
  type EWAAllowedWithdrawalSearchField,
} from "./hooks/useewaallowedwithdrawallogic"
import EWAAllowedWithdrawalTable from "./ewa-allowed-withdrawal-table"
import AddEWAAllowedWithdrawalModal, { type EWAAllowedWithdrawalItem } from "./add-ewaallowed-with-drawal-modal"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EWAAllowedWithdrawalPage() {
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
  } = useEWAAllowedWithdrawalLogic()

  const isAddOpen = mode === "add"
  const isEditOpen = mode === "edit"
  const isViewOpen = mode === "view"
  const [editData, setEditData] = useState<EWAAllowedWithdrawalItem | null>(null)
  const shouldLoadEditData = (isEditOpen || isViewOpen) && !!rowId

  // ── Load single record for edit/view ──────────────────────────────────────

  useRequest<any[]>({
    url: "EWA_allowed_withdrawl/search",
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
        limit: Number(item?.limit ?? 0),
        withdrawn: Number(item?.withdrawn ?? 0),
        available: Number(item?.available ?? 0),
        version: Number(item?.version ?? 1),
      })
    },
  })

  useEffect(() => {
    if (isAddOpen) setEditData(null)
  }, [isAddOpen])

  const closeModal = () => {
    setEditData(null)
    router.push("/ewa/ewa-allowed-withdrawl")
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
        title="EWA Allowed Withdrawal"
        description={
          loading || countLoading
            ? "EWA Allowed Withdrawal Management | Loading..."
            : `EWA Allowed Withdrawal Management | ${totalCount} records`
        }
        canAdd={addMode}
        onAddNew={() => router.push("/ewa/ewa-allowed-withdrawl?mode=add")}
        addButtonText="Add New Record"
      />

      {/* Search bar */}
      <div className="w-full px-8 py-4 pb-0">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex bg-muted/50 rounded-lg border flex-1">
            {/* Field selector */}
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-52">
              <Select
                value={searchField}
                onValueChange={(v) => setSearchField(v as EWAAllowedWithdrawalSearchField)}
              >
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employeeID">Employee ID</SelectItem>
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
          <EWAAllowedWithdrawalTable
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

      {/* Modal */}
      <AddEWAAllowedWithdrawalModal
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
    </div>
  )
}