"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader as DataTableHeader, TableRow } from "@/components/ui/table"
import { Edit, MoreVertical, Loader2, Calendar, Search, ChevronLeft, ChevronRight } from "lucide-react"
import TableHeader from "@/components/header/table-header"

import { LeaveManagementForm } from "./forms/leave-management-form"
import AddLeavePolicyPopup from "./add-leave-policy-popup"
import AddLeavePolicyDraftInfoPopup from "./add-leave-policy-draft-info-popup"
// import EnhancedHeader from "./forms/enhanced-header";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import PageNotFound from "@/components/page-notfound"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"

type LeavePolicySearchField =
  | "leaveCode"
  | "leaveTitle"
  | "subsidiary"
  | "location"
  | "designation"
  | "employeeCategory"

type LeavePolicyRow = {
  _id: string
  leaveCode: string
  leaveTitle: string
  subsidiary: string
  location: string
  designation: string
  employeeCategory: string
  raw: any
}

const pageSize = 10

export default function LeavePolicyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()
  const { hierarchyFilters } = useEmpHierarchy()
  const userEntitlement = useUserEntitlement(undefined, hierarchyFilters)

  const [rows, setRows] = useState<LeavePolicyRow[]>([])
  const [duplicateData, setDuplicateData] = useState<any>(null)
  const [searchField, setSearchField] = useState<LeavePolicySearchField>("leaveTitle")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [viewMode, setViewMode] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [addMode, setAddMode] = useState(false)
  const [stableRolePermissions, setStableRolePermissions] = useState<Record<string, boolean> | null>(null)
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false)
  const [isDraftPopupOpen, setIsDraftPopupOpen] = useState(false)

  const modeParam = searchParams.get("mode")
  const mode: "add" | "edit" | "view" | null =
    modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : null
  const isFormMode = mode !== null
  const rowId = searchParams.get("id")

  const { responseData: rolePermissions, loading: permissionsLoading } = useRolePermissions({
    serviceName: "policy",
    screenName: "leavePolicy",
  })

  useEffect(() => {
    if (rolePermissions) setStableRolePermissions(rolePermissions)
  }, [rolePermissions])

  const effectivePermissions = stableRolePermissions ?? rolePermissions

  useEffect(() => {
    setViewMode(!!effectivePermissions?.view)
    setEditMode(!!effectivePermissions?.edit)
    setAddMode(!!effectivePermissions?.add)
  }, [effectivePermissions])

  const apiCriteria = useMemo(() => {
    const criteria: Array<{ field: string; operator: string; value: any }> = [
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
    ]

    const subsidiaryList =
      Array.isArray(userEntitlement?.subsidiary) && userEntitlement.subsidiary.length > 0
        ? userEntitlement.subsidiary
        : Array.isArray(hierarchyFilters?.subsidiaries)
          ? hierarchyFilters.subsidiaries
          : []

    const locationList =
      Array.isArray(userEntitlement?.location) && userEntitlement.location.length > 0
        ? userEntitlement.location
        : Array.isArray(hierarchyFilters?.locations)
          ? hierarchyFilters.locations
          : []

    if (subsidiaryList.length > 0) {
      criteria.push({
        field: "subsidiary.subsidiaryCode",
        operator: "in",
        value: subsidiaryList,
      })
    }

    if (locationList.length > 0) {
      criteria.push({
        field: "location.locationCode",
        operator: "in",
        value: locationList,
      })
    }

    criteria.push({ field: "createdOn", operator: "desc", value: "" })

    const query = searchTerm.trim()
    if (query) {
      criteria.push({ field: searchField, operator: "like", value: query })
    }
    return criteria
  }, [tenantCode, searchField, searchTerm, userEntitlement, hierarchyFilters])

  const offset = useMemo(() => (currentPage - 1) * pageSize, [currentPage])
  const limit = pageSize

  const { loading: countLoading, refetch: refetchCount } = useRequest<any>({
    url: "leave_policy/count",
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, searchField, searchTerm],
    onSuccess: (count) => {
      setTotalCount(typeof count === "number" ? count : Number(count) || 0)
    },
    onError: (e) => {
      console.error("Failed to load leave policy count", e)
      setTotalCount(0)
    },
  })

  const { loading, refetch } = useRequest<any[]>({
    url: `leave_policy/search?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, currentPage, searchField, searchTerm],
    onSuccess: (data) => {
      const list = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)
      const mapped = list.map((item: any) => ({
        _id: item?._id?.$oid || item?._id || "",
        leaveCode: item?.leavePolicy?.leaveCode || "-",
        leaveTitle: item?.leavePolicy?.leaveTitle || "-",
        subsidiary: item?.subsidiary?.subsidiaryCode || "-",
        location: item?.location?.locationCode || "-",
        designation: item?.designation?.designationCode || "-",
        employeeCategory: Array.isArray(item?.employeeCategory) ? item.employeeCategory.join(", ") : "-",
        raw: item,
      }))

      const duplicate = list.map((item: any) => ({
        _id: item?._id,
        leaveCode: item?.leavePolicy?.leaveCode || "",
        leaveTitle: item?.leavePolicy?.leaveTitle || "",
      }))

      setRows(mapped)
      setDuplicateData(duplicate)
    },
    onError: (error) => {
      console.error("Error loading leave policy data:", error)
      setRows([])
      setDuplicateData([])
    },
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchCount()
    void refetch()
  }, [tenantCode, currentPage, searchField, searchTerm, mode])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchField, searchTerm])

  const totalItems = totalCount
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const pageRows = rows

  const canAccessRequestedMode =
    (mode === "view" && viewMode) || (mode === "edit" && editMode) || (mode === "add" && addMode)

  if (!effectivePermissions && permissionsLoading) {
    return <div className="h-[60vh]" />
  }

  if (!(viewMode || editMode || addMode)) {
    return <PageNotFound />
  }

  if (isFormMode) {
    if (!canAccessRequestedMode) return <PageNotFound />
    if ((mode === "edit" || mode === "view") && !rowId) return <PageNotFound />
  }

  const fieldLabels: Record<LeavePolicySearchField, string> = {
    leaveCode: "Leave Code",
    leaveTitle: "Leave Title",
    subsidiary: "Subsidiary Code",
    location: "Location Code",
    designation: "Designation Code",
    employeeCategory: "Category Codes",
  }

  return (
    <div>
      <TableHeader
        title="Leave Policy"
        description={
          loading || countLoading
            ? "Leave Policy Management | Loading..."
            : `Leave Policy Management | ${totalItems} policies`
        }
        canAdd={addMode}
        onAddNew={() => {
          router.push("/policy-management/leave-policy?mode=add")
        }}
        // onOpenDraftList={() => setIsDraftPopupOpen(true)}
        // draftButtonText="Draft Storage List"
        addButtonText="Add New Leave Policy"
      />

      <div className="w-full px-8 py-4 pb-0">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex bg-muted/50 rounded-lg border flex-1">
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-52">
              <Select value={searchField} onValueChange={(v) => setSearchField(v as LeavePolicySearchField)}>
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leaveCode">Leave Code</SelectItem>
                  <SelectItem value="leaveTitle">Leave Title</SelectItem>
                  <SelectItem value="subsidiary">Subsidiary Code</SelectItem>
                  <SelectItem value="location">Location Code</SelectItem>
                  <SelectItem value="designation">Designation Code</SelectItem>
                  <SelectItem value="employeeCategory">Category Codes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex items-center bg-background rounded-r-lg min-w-0">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder={`Search by ${fieldLabels[searchField].toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent w-full placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-4">
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading || countLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading leave policies...</p>
            </div>
          ) : pageRows.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No leave policies found</p>
            </div>
          ) : (
            <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              <Table className="min-w-[1300px]">
                <DataTableHeader>
                  <TableRow className="bg-gray-50/80 border-b border-gray-200 hover:bg-gray-50/80">
                    <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Sl No</TableHead>
                    <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Leave Code</TableHead>
                    <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Leave Title</TableHead>
                    <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Subsidiary Code</TableHead>
                    <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Location Code</TableHead>
                    <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Designation Code</TableHead>
                    <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Category Codes</TableHead>
                    <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10">
                      Action
                    </TableHead>
                  </TableRow>
                </DataTableHeader>
                <TableBody>
                  {pageRows.map((row, index) => (
                    <TableRow key={row._id || `${row.leaveCode}-${index}`} className="hover:bg-gray-50/70 border-b border-gray-200">
                      <TableCell className="px-5 py-2">{startIndex + index + 1}</TableCell>
                      <TableCell className="px-5 py-2 font-medium">{row.leaveCode}</TableCell>
                      <TableCell className="px-5 py-2">{row.leaveTitle}</TableCell>
                      <TableCell className="px-5 py-2">{row.subsidiary}</TableCell>
                      <TableCell className="px-5 py-2">{row.location}</TableCell>
                      <TableCell className="px-5 py-2">{row.designation}</TableCell>
                      <TableCell className="px-5 py-2 text-sm">{row.employeeCategory}</TableCell>
                      <TableCell className="px-5 py-2 sticky right-0 bg-white z-10" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {editMode && (
                            <button
                              type="button"
                              onClick={() => router.push(`/policy-management/leave-policy?mode=edit&id=${encodeURIComponent(String(row._id))}`)}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {viewMode && (
                            <button
                              type="button"
                              onClick={() => router.push(`/policy-management/leave-policy?mode=view&id=${encodeURIComponent(String(row._id))}`)}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                              title="View"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-600">
                {totalItems > 0 ? (
                  <>Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries</>
                ) : (
                  <>No entries found</>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                  disabled={safePage === 1}
                  className="h-7 w-7 p-0 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (page === 1 || page === totalPages) return true
                      return page >= safePage - 1 && page <= safePage + 1
                    })
                    .map((page, index, array) => {
                      if (index > 0 && page - array[index - 1] > 1) {
                        return (
                          <div key={page} className="flex items-center gap-1">
                            <span className="px-2 text-xs text-gray-500">...</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={`h-7 w-7 p-0 text-xs font-medium ${
                                page === safePage
                                  ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </Button>
                          </div>
                        )
                      }
                      return (
                        <Button
                          key={page}
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`h-7 w-7 p-0 text-xs font-medium ${
                            page === safePage
                              ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </Button>
                      )
                    })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                  disabled={safePage === totalPages}
                  className="h-7 w-7 p-0 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddLeavePolicyPopup
        open={isAddPopupOpen}
        onClose={() => setIsAddPopupOpen(false)}
        onSaved={() => {
          setCurrentPage(1)
          void refetchCount()
          void refetch()
        }}
      />

      <AddLeavePolicyDraftInfoPopup
        isOpen={isDraftPopupOpen}
        onClose={() => setIsDraftPopupOpen(false)}
        onAddDraft={() => {
          setIsDraftPopupOpen(false)
          setIsAddPopupOpen(true)
        }}
      />

      {isFormMode && (
        <div className="fixed inset-0 z-[50] bg-black/40 backdrop-blur-sm">
          <LeaveManagementForm duplicateData={duplicateData} />
        </div>
      )}
    </div>
  )
}
