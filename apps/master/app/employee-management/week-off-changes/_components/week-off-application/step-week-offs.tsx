"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"
import { getCurrentTimeIST } from "@/utils/time/time-control"
import { toast } from "react-toastify"
import { WeekOffFormPopup } from "./week-off-form-popup"
import WeekOffFormController, { type WeekOffRecord } from "./week-off-form-controller"
import { type WeekOffApplication, type WeekOffItem } from "../schemas/week-off-application-schema"
import WeekOffChangesTable from "./week-off-changes-table"
import WeekOffFilterBar from "./week-off-filter-bar"
import EmployeeShiftHeader from "../../../employee-shift/_components/employee-shift-header"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"

const SEARCH_FIELDS = [
  { value: "employeeID", label: "Employee ID" },
  { value: "fromDate", label: "From Date" },
  { value: "toDate", label: "To Date" },
  { value: "weekOff", label: "Week Off" },
]

interface StepWeekOffsProps {
  recordId: string | null | undefined
  onSave?: () => void
  /** Called with payload on add/edit/delete (like bank-details-table). Parent should post and refetch. */
  employeeSearchUrl?: string
  loading?: boolean
  mode?: "add" | "edit" | "view"
  fromDate?: string | null
  toDate?: string | null
  employeeId?: string | null
}

export default function StepWeekOffs({
  recordId,
  onSave,
  employeeSearchUrl = "employee_shift",
  loading = false,
  mode = "edit",
  fromDate,
  toDate,
  employeeId,
}: StepWeekOffsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const isReadOnly = mode === "view"
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "employeeManagement",
    screenName: "weekOffChanges",
  })
  const canView = rolePermissions?.view || false
  const canEdit = rolePermissions?.edit || false
  const canAdd = rolePermissions?.add || false
  const canDelete = rolePermissions?.delete || false
  const isReadOnlyByModeOrRole = isReadOnly || (!canEdit && !canAdd)
  const tenantCode = useGetTenantCode()
  const { employeeId: currentEmployeeId } = useKeyclockRoleInfo()
  const { hierarchyFilters: empHierarchyFilters } = useEmpHierarchy()
  const userEntitlement = useUserEntitlement(currentEmployeeId, empHierarchyFilters)
  const currentMode = mode
  const canFetchWeekOffs = Boolean(tenantCode) && currentMode !== "add"

  const [weekOffs, setWeekOffs] = useState<WeekOffItem[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("")
  const [selectedField, setSelectedField] = useState("employeeID")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [editWeekOffs, setEditWeekOffs] = useState<WeekOffItem[]>([])
  const [popupEmployeeId, setPopupEmployeeId] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [applicationFromDate, setApplicationFromDate] = useState(fromDate ?? "")
  const [applicationToDate, setApplicationToDate] = useState(toDate ?? "")
  const [newRecordCache, setNewRecordCache] = useState<WeekOffRecord | null>(null)
  const itemsPerPage = 10
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage])

  const criteriaRequests = useMemo(() => {
    const criteria: Array<{ field: string; operator: string; value: string }> = [
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
      { field: "createdOn", operator: "desc", value: "" },
    ]
    if (employeeId) {
      criteria.push({ field: "employeeID", operator: "eq", value: employeeId })
    }
    const q = debouncedSearchValue.trim()
    if (q) {
      const field = selectedField === "weekOff" ? "weekOffs.weekOff" : selectedField
      criteria.push({ field, operator: "like", value: q })
    }
    return criteria
  }, [tenantCode, employeeId, debouncedSearchValue, selectedField])

  const buildRequestData = useMemo(
    () => ({
      hierarchyFilters: empHierarchyFilters || {},
      criteriaRequests,
      userEntitlement,
    }),
    [criteriaRequests, empHierarchyFilters, userEntitlement],
  )
  const buildRequestDataString = useMemo(
    () => JSON.stringify(buildRequestData ?? {}),
    [buildRequestData],
  )

  type WeekOffInput = {
    week?: number | string | null
    weekOff?: Array<number | string | null>
  }

  const normalizeWeekOffs = (items: WeekOffInput[]): WeekOffItem[] =>
    items
      .map((w) => {
        const base = typeof w === "object" && w !== null ? w : ({} as WeekOffInput)
        return {
          ...base,
          week: Number(w?.week ?? 0),
          weekOff: Array.isArray(w?.weekOff)
            ? w.weekOff
                .map((n) => Number(n))
                .filter((n) => !Number.isNaN(n) && n >= 1 && n <= 7)
                .filter((n, i, arr) => arr.indexOf(n) === i)
                .sort((a, b) => a - b)
            : [],
        } as WeekOffItem
      })
      .filter((w) => w.week > 0)

  // Replace by week (last wins) to avoid old week values lingering
  const dedupeWeekOffsByWeek = (items: WeekOffItem[]) => {
    const map = new Map<number, WeekOffItem>()
    items.forEach((w) => {
      if (!w?.week) return
      map.set(w.week, w)
    })
    return Array.from(map.values()).sort((a, b) => a.week - b.week)
  }

  // ── URL-based controller record ────────────────────────────────────────────
  const urlId   = searchParams.get("id")
  const urlMode = searchParams.get("mode") as "edit" | "view" | null

  const controllerRecord = useMemo<WeekOffRecord | null>(() => {
    if (!urlId || !urlMode) return null
    const row = applications.find((a) => a._id === urlId)
    if (row) {
      return {
        _id:              row._id,
        employeeID:       row.employeeID ?? "",
        fromDate:         row.fromDate,
        toDate:           row.toDate,
        weekOffs:         dedupeWeekOffsByWeek(normalizeWeekOffs(row.weekOffs ?? [])),
        organizationCode: row.organizationCode,
        tenantCode:       row.tenantCode,
      }
    }
    if (newRecordCache?._id === urlId) return newRecordCache
    return null
  }, [urlId, urlMode, applications, newRecordCache])

  const { refetch: refetchWeekOffs, loading: requestLoading } = useRequest<any[]>({
    url: `weekOffChanges/searchWithHierarchy?offset=${offset}&limit=${itemsPerPage}`,
    method: "POST",
    data: buildRequestData,
    dependencies: [buildRequestDataString, recordId, tenantCode, offset, itemsPerPage],
    onSuccess: (rows: any[]) => {
      const list = Array.isArray(rows)
        ? rows
        : Array.isArray((rows as any)?.data)
          ? (rows as any).data
          : []
      setApplications(list)

      const record = list[0] ?? null
      const rawWeekOffs = Array.isArray(record?.weekOffs) ? record.weekOffs : []
      const cleaned = dedupeWeekOffsByWeek(normalizeWeekOffs(rawWeekOffs))
      setWeekOffs(cleaned)
      setEditWeekOffs(cleaned)
    },
    onError: () => {
      setWeekOffs([])
      setApplications([])
      setEditWeekOffs([])
    },
  })

  const { data: weekOffsCount, refetch: refetchWeekOffsCount } = useRequest<any>({
    url: "weekOffChanges/count/searchWithHierarchy",
    method: "POST",
    data: buildRequestData,
    dependencies: [buildRequestDataString, recordId, tenantCode],
    onSuccess: (data: any) => {
    },
  })

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearchValue(searchValue)
      setCurrentPage(1)
      debounceRef.current = null
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchValue])

  useEffect(() => {
    if (!canFetchWeekOffs) return
    void refetchWeekOffs()
    void refetchWeekOffsCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode, canFetchWeekOffs, currentPage, debouncedSearchValue, selectedField])

  useEffect(() => {
    if (currentMode === "add") setWeekOffs([])
  }, [currentMode])

  useEffect(() => {
    setApplicationFromDate(fromDate ?? "")
    setApplicationToDate(toDate ?? "")
  }, [fromDate, toDate])

  const pendingAddRef = useRef<{ employeeID: string; fromDate: string; toDate: string } | null>(null)

  const { post: postWeekOffs, loading: postLoading } = usePostRequest<any>({
    url: "weekOffChanges",
    onSuccess: (response) => {
      toast.success("Week off configuration saved successfully!")
      onSave?.()
      if (pendingAddRef.current) {
        const newId = response?._id || response?.data?._id || response?.id
        if (newId) {
          const newRecord: WeekOffRecord = {
            _id:        newId,
            ...pendingAddRef.current,
            weekOffs:   [],
          }
          setNewRecordCache(newRecord)
          router.push(`${pathname}?mode=edit&id=${encodeURIComponent(newId)}`)
        }
        pendingAddRef.current = null
        closeForm()
        void refetchWeekOffs()
        void refetchWeekOffsCount()
      } else {
        void refetchWeekOffs()
        void refetchWeekOffsCount()
      }
    },
    onError: (error) => {
      console.error("Error saving week off configuration:", error)
      toast.error("Failed to save week off configuration")
      pendingAddRef.current = null
    },
  })

  const isBusy = loading || postLoading || requestLoading

  const openAdd = () => {
    if (!canAdd || isReadOnlyByModeOrRole) return
    setEditIndex(null)
    setSelectedRecordId(null)
    setEditWeekOffs([])
    setPopupEmployeeId("")
    setIsFormOpen(true)
  }

  const openEdit = (index: number) => {
    setEditIndex(index)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditIndex(null)
  }

  const handlePopupSubmit = (payload: WeekOffApplication) => {
    pendingAddRef.current = {
      employeeID: payload.employeeID,
      fromDate: payload.fromDate,
      toDate: payload.toDate,
    }
    postWeekOffs?.({
      tenant: tenantCode,
      action: "insert",
      collectionName: "weekOffChanges",
      data: {
        weekOffs: [],
        fromDate: payload.fromDate,
        toDate: payload.toDate,
        employeeID: payload.employeeID,
        tenantCode: tenantCode,
        organizationCode: tenantCode,
        createdBy: currentEmployeeId,
        createdOn: getCurrentTimeIST(),
      },
    })
  }

  const removeWeekOff = (index: number) => {
    const next = weekOffs.filter((_, i) => i !== index)
    if (!recordId) {
      toast.error("No record to update")
      return
    }
    const payload = {
      tenant: tenantCode,
      action: "update",
      id: recordId,
      collectionName: "weekOffChanges",
      data: { weekOffs: next },
    }
    postWeekOffs?.(payload)
    setWeekOffs(next)
    setDeleteIndex(null)
  }


  if (controllerRecord) {
    return (
      <WeekOffFormController
        mode={urlMode ?? (isReadOnly ? "view" : "edit")}
        record={controllerRecord}
        onClose={() => {
          setNewRecordCache(null)
          router.push(pathname)
        }}
      />
    )
  }

  return (
    <div className="relative">
      <div className="px-12">
        <EmployeeShiftHeader
          title="Week Off Change Application"
          description="Manage and review employee week off records"
          onAddNew={openAdd}
          canAdd={canAdd}
          addButtonText="Week Off Change"
        />
      </div>

      <WeekOffFilterBar
        searchTerm={searchValue}
        setSearchTerm={(value) => {
          setSearchValue(value)
        }}
        selectedField={selectedField}
        setSelectedField={(value) => {
          setSelectedField(value)
          setCurrentPage(1)
        }}
        searchFields={SEARCH_FIELDS}
        filtersApplied={true}
        onFilterClick={() => {
          setCurrentPage(1)
          if (canFetchWeekOffs) {
            refetchWeekOffs()
            refetchWeekOffsCount()
          }
        }}
        onAddNew={openAdd}
        canAdd={canAdd && !isReadOnlyByModeOrRole && !!recordId && !isBusy}
      />

      <div className="px-4 pb-4">
        <WeekOffChangesTable
          employeeData={applications}
          loading={isBusy}
          currentPage={currentPage}
          totalCount={weekOffsCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          editMode={canEdit && !isReadOnly}
          deleteMode={canDelete && !isReadOnly}
          viewMode={canView && isReadOnly}
          onEdit={(row) => {
            if (!canEdit || isReadOnly) return
            if (!row || !Array.isArray(row.weekOffs)) {
              toast.error("No week off row to edit")
              return
            }
            router.push(`${pathname}?mode=edit&id=${encodeURIComponent(row._id)}`)
          }}
          onDelete={() => {
            if (!canDelete || isReadOnly) return
            if (weekOffs.length === 0) {
              toast.error("No week off row to delete")
              return
            }
            setDeleteIndex(0)
          }}
        />
      </div>

      <WeekOffFormPopup
        open={isFormOpen && !isReadOnlyByModeOrRole && !isBusy}
        onClose={closeForm}
        onSubmit={handlePopupSubmit}
        employeeId={popupEmployeeId || employeeId}
      />

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove week off row</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this row?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" disabled={isBusy} onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button size="sm" disabled={isBusy} className="bg-red-600 hover:bg-red-700 text-white" onClick={() => removeWeekOff(deleteIndex)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
