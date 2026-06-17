"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import PageNotFound from "@/components/page-notfound"
import EmployeeCategoryTrainingDetailsHeader from "./employee-category-training-details-header"
import EmployeeCategoryTrainingDetailsFilterBar from "./employee-category-training-details-filter-bar"
import EmployeeCategoryTrainingDetailsTable from "./employee-category-training-details-table"
import AddCategoryPopup from "./add-category-popup"
import EmployeeCategoryTrainingDetailsEditHeader from "./employee-category-training-details-edit-header"
import StepCategoryTrainings from "./steps/step-category-trainings"
import type { EmployeeCategoryTrainingDetailsItem } from "./types"

const COLLECTION = "employee_category_training_details"

export default function EmployeeCategoryTrainingDetailsPage() {
  const tenantCode = useGetTenantCode()
  const searchParams = useSearchParams()
  const router = useRouter()

  const modeParam = searchParams.get("mode") as "add" | "edit" | "view" | null
  const editId = searchParams.get("id")
  const isDetailMode = !!(modeParam && editId)

  // Role permissions (same pattern as Employee Balance)
  const screenName = "employeeCategoryTrainingDetails"
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "employeeManagement",
    screenName,
  })

  const viewMode = rolePermissions?.view || false
  const editMode = rolePermissions?.edit || false
  const addMode = rolePermissions?.add || false
  const deleteMode = rolePermissions?.delete || false

  // UI state
  const [rows, setRows] = useState<EmployeeCategoryTrainingDetailsItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filtersApplied, setFiltersApplied] = useState(true) // no separate filter popup yet; keep enabled
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedField, setSelectedField] = useState("employeeCategoryCode")
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Detail mode state for single employee category (with traninings array)
  const [detailItem, setDetailItem] = useState<EmployeeCategoryTrainingDetailsItem | null>(null)

  const itemsPerPage = 10
  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage])
  const limit = itemsPerPage

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      debounceTimerRef.current = null
    }, 400)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [searchTerm])

  // Build criteria for search/count
  const criteriaRequests = useMemo(() => {
    const criteria: any[] = [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode || "",
      },
      {
        field: "createdOn",
        operator: "desc",
        value: "",
      },
    ]

    if (debouncedSearchTerm.trim()) {
      criteria.push({
        field: selectedField,
        operator: "like",
        value: debouncedSearchTerm.trim(),
      })
    }

    return criteria
  }, [tenantCode, debouncedSearchTerm, selectedField])

  // Manual-refetch pattern
  const {
    data: searchData,
    loading: loadingRows,
    refetch: refetchRows,
  } = useRequest<EmployeeCategoryTrainingDetailsItem[]>({
    url: `${COLLECTION}/search?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: criteriaRequests,
    onSuccess: (data: any) => {
      if (!filtersApplied) return
      const list = Array.isArray(data) ? data : []
      const active = list.filter((r: any) => r?.isDeleted !== true)
      setRows(active as EmployeeCategoryTrainingDetailsItem[])
    },
    onError: (error: any) => {
      if (!filtersApplied) return
      console.error("Error fetching employee category training details:", error)
      setRows([])
    },
    dependencies: [], // manual
  })

  const { refetch: refetchCount, loading: loadingCount } = useRequest<number>({
    url: `${COLLECTION}/count`,
    method: "POST",
    data: criteriaRequests,
    onSuccess: (val: any) => {
      const n = typeof val === "number" ? val : 0
      setTotalCount(n)
    },
    onError: (error: any) => {
      console.error("Error fetching employee category training details count:", error)
      setTotalCount(0)
    },
    dependencies: [], // manual
  })

  // Detail fetch for single employee category (edit/view mode)
  const { loading: detailLoading, refetch: refetchDetail } = useRequest<EmployeeCategoryTrainingDetailsItem[]>({
    url: isDetailMode ? `${COLLECTION}/search` : "",
    method: "POST",
    data: isDetailMode
      ? [
          {
            field: "_id",
            operator: "is",
            value: editId,
          },
          {
            field: "tenantCode",
            operator: "eq",
            value: tenantCode || "",
          },
        ]
      : [],
    onSuccess: (data: any) => {
      if (!isDetailMode) return
      const list = Array.isArray(data) ? data : []
      setDetailItem(list[0] || null)
    },
    onError: (error: any) => {
      if (!isDetailMode) return
      console.error("Error fetching employee category training detail:", error)
      setDetailItem(null)
    },
    dependencies: [isDetailMode ? editId : "", tenantCode],
  })

  // Initial + reactive refetch (tenant, pagination, search)
  useEffect(() => {
    if (!tenantCode) return
    if (!filtersApplied) return
    refetchRows()
    refetchCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode, offset, limit, JSON.stringify(criteriaRequests), filtersApplied])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const { post: postDelete, loading: deleteLoading } = usePostRequest<any>({
    url: COLLECTION,
    onSuccess: () => {
      toast.success("Deleted successfully")
      refetchRows()
      refetchCount()
    },
    onError: (e: any) => {
      toast.error("Delete failed")
      console.error(e)
    },
  })

  const handleDelete = useCallback(
    async (row: EmployeeCategoryTrainingDetailsItem) => {
      if (!deleteMode) return
      if (!row?._id) return

      const postData = {
        tenant: tenantCode,
        action: "delete",
        id: row._id,
        collectionName: COLLECTION,
        data: row,
      }

      await postDelete(postData)
    },
    [deleteMode, postDelete, tenantCode]
  )

  const handleEdit = useCallback(
    (row: EmployeeCategoryTrainingDetailsItem) => {
      if (!editMode) return
      if (!row?._id) {
        toast.error("Unable to edit: record id not found.")
        return
      }
      // Navigate to detail page in edit mode
      router.push(`/employee-management/employee-category-training-details?mode=edit&id=${row._id}`)
    },
    [editMode, router]
  )

  const handleView = useCallback(
    (row: EmployeeCategoryTrainingDetailsItem) => {
      if (!viewMode) return
      if (!row?._id) {
        toast.error("Unable to open: record id not found.")
        return
      }
      // Navigate to detail page in view mode
      router.push(`/employee-management/employee-category-training-details?mode=view&id=${row._id}`)
    },
    [viewMode, router]
  )

  const handleAddNew = useCallback(() => {
    if (!addMode) return
    setIsAddPopupOpen(true)
  }, [addMode])

  const handleAddSuccess = useCallback(() => {
    // Refetch data after successful creation
    refetchRows()
    refetchCount()
    setCurrentPage(1) // Reset to first page
  }, [refetchRows, refetchCount])

  if (!viewMode && !editMode && !addMode) {
    return <PageNotFound />
  }

  // Detail mode UI: show trainings step for selected category
  if (isDetailMode) {
    const effectiveMode: "add" | "edit" | "view" =
      modeParam === "edit" && editMode
        ? "edit"
        : "view"

    return (
      <div className="w-full">
        <EmployeeCategoryTrainingDetailsEditHeader
          mode={effectiveMode}
          onBack={() => router.push("/employee-management/employee-category-training-details")}
          employeeCategoryCode={detailItem?.employeeCategoryCode || undefined}
        />

        <div className="px-12 py-4">
          <div className="max-w-7xl mx-auto">
            <StepCategoryTrainings
              trainings={detailItem?.traninings || []}
              mode={effectiveMode}
              recordId={detailItem?._id || editId}
              permission={{
                view: viewMode,
                edit: editMode,
                add: addMode,
                delete: deleteMode,
              }}
              onServerRefresh={async () => {
                // Keep parent in sync after step triggers backend changes
                await refetchDetail()
                await refetchRows()
                await refetchCount()
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <EmployeeCategoryTrainingDetailsHeader />

      <EmployeeCategoryTrainingDetailsFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedField={selectedField}
        setSelectedField={(val) => {
          setSelectedField(val)
          setCurrentPage(1)
        }}
        searchFields={[
          { value: "employeeCategoryCode", label: "Employee Category Code" },
          { value: "traninings.trainingCode", label: "Training Code" },
          { value: "traninings.trainingName", label: "Training Name" },
        ]}
        filtersApplied={filtersApplied}
        onFilterClick={() => {
          // No popup yet; keep in-place UX
          toast.info("Filter popup not configured yet")
        }}
        onAddNew={handleAddNew}
        canAdd={addMode}
      />

      <EmployeeCategoryTrainingDetailsTable
        data={rows}
        loading={loadingRows || loadingCount || deleteLoading}
        currentPage={currentPage}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onEdit={editMode ? handleEdit : undefined}
        onDelete={deleteMode ? handleDelete : undefined}
        onView={viewMode ? handleView : undefined}
        editMode={editMode}
        deleteMode={deleteMode}
        viewMode={viewMode}
      />

      {/* keep state usage to avoid unused vars in case hooks change */}
      <div className="hidden">{JSON.stringify(searchData || [])}</div>

      {/* Add Category Popup */}
      <AddCategoryPopup
        isOpen={isAddPopupOpen}
        onClose={() => setIsAddPopupOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  )
}


