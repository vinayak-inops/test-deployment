"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, AlertTriangle } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { getCurrentTimeIST } from "@/utils/time/time-control"
import { toast } from "react-toastify"
import { WeekOffFormPopup } from "./week-off-form-popup"
import { type WeekOffApplication, type WeekOffItem } from "../../schemas/week-off-application-schema"
import WeekOffChangesTable from "./week-off-changes-table"
import WeekOffFilterBar from "./week-off-filter-bar"

// 1 = Monday, 2 = Tuesday, ... 7 = Sunday
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const

function formatWeekOff(arr: number[]) {
  if (!Array.isArray(arr) || arr.length === 0) return "—"
  return arr
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_NAMES[d - 1] ?? String(d))
    .join(", ")
}

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
  const isReadOnly = mode === "view"
  const tenantCode = useGetTenantCode()
  const { employeeId: currentEmployeeId } = useKeyclockRoleInfo()
  const currentMode = mode
  const canFetchWeekOffs = Boolean(tenantCode) && currentMode !== "add"

  const [weekOffs, setWeekOffs] = useState<WeekOffItem[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [selectedField, setSelectedField] = useState("employeeID")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [editWeekOffs, setEditWeekOffs] = useState<WeekOffItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [applicationFromDate, setApplicationFromDate] = useState(fromDate ?? "")
  const [applicationToDate, setApplicationToDate] = useState(toDate ?? "")
  const itemsPerPage = 10

  const criteriaRequests = useMemo(() => {
    const criteria: Array<{ field: string; operator: string; value: string }> = [
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
      { field: "createdOn", operator: "desc", value: "" },
    ]
    if (employeeId) {
      criteria.push({ field: "employeeID", operator: "eq", value: employeeId })
    }
    return criteria
  }, [tenantCode, employeeId])

  const buildRequestData = useMemo(
    () => ({
      criteriaRequests,
    }),
    [criteriaRequests],
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


  const { refetch: refetchWeekOffs, loading: requestLoading } = useRequest<any[]>({
    url: `weekOffChanges/search`,
    method: "POST",
    data: criteriaRequests,
    dependencies: [buildRequestDataString, recordId, tenantCode],
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

  useEffect(() => {
    void refetchWeekOffs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode, canFetchWeekOffs])

  useEffect(() => {
    if (currentMode === "add") setWeekOffs([])
  }, [currentMode])

  useEffect(() => {
    setApplicationFromDate(fromDate ?? "")
    setApplicationToDate(toDate ?? "")
  }, [fromDate, toDate])

  const { post: postWeekOffs, loading: postLoading } = usePostRequest<any>({
    url: "weekOffChanges",
    onSuccess: async () => {
      toast.success("Week off configuration saved successfully!")
      onSave?.()
      void refetchWeekOffs()
    },
    onError: (error) => {
      console.error("Error saving week off configuration:", error)
      toast.error("Failed to save week off configuration")
    },
  })

  const isBusy = loading || postLoading || requestLoading

  const openAdd = () => {
    setEditIndex(null)
    setSelectedRecordId(null)
    setEditWeekOffs([])
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
    const incoming = Array.isArray(payload.weekOffs) ? payload.weekOffs : []
    const isUpdate = selectedRecordId !== null
    const cleanedIncoming = dedupeWeekOffsByWeek(normalizeWeekOffs(incoming))

    if (cleanedIncoming.length === 0) {
      toast.error("Please select at least one day")
      return
    }
    if (isUpdate && !selectedRecordId) {
      toast.error("No record to update")
      return
    }
    setApplicationFromDate(payload.fromDate)
    setApplicationToDate(payload.toDate)
    const requestPayload = {
      tenant: tenantCode,
      action: isUpdate ? "update" : "insert",
      collectionName: "weekOffChanges",
      data: {
        weekOffs: cleanedIncoming,
        fromDate: payload.fromDate,
        toDate: payload.toDate,
        employeeID: payload.employeeID,
        tenantCode: tenantCode,
        organizationCode: tenantCode,
        ...(isUpdate
          ? {
              updatedBy: currentEmployeeId,
              updatedOn: getCurrentTimeIST(),
            }
          : {
              createdBy: currentEmployeeId,
              createdOn: getCurrentTimeIST(),
            }),
      },
      ...(isUpdate ? { id: selectedRecordId } : {}),
    }
    postWeekOffs?.(requestPayload)
    closeForm()
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


  const initialValue = selectedRecordId ? editWeekOffs[0] ?? null : null
  const filteredApplications = useMemo(() => {
    const q = searchValue.trim().toLowerCase()
    if (!q) return applications
    return applications.filter((item: any) => {
      const employeeId = String(item?.employeeID ?? "").toLowerCase()
      const fromDate = String(item?.fromDate ?? "").toLowerCase()
      const toDate = String(item?.toDate ?? "").toLowerCase()
      const weekOffText = Array.isArray(item?.weekOffs)
        ? item.weekOffs
            .map((w: any) => formatWeekOff(Array.isArray(w?.weekOff) ? w.weekOff : []))
            .join(" ")
            .toLowerCase()
        : ""
      if (selectedField === "employeeID") return employeeId.includes(q)
      if (selectedField === "fromDate") return fromDate.includes(q)
      if (selectedField === "toDate") return toDate.includes(q)
      if (selectedField === "weekOff") return weekOffText.includes(q)
      return (
        employeeId.includes(q) ||
        fromDate.includes(q) ||
        toDate.includes(q) ||
        weekOffText.includes(q)
      )
    })
  }, [applications, searchValue, selectedField])

  const totalCount = filteredApplications.length
  const pagedApplications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredApplications.slice(start, start + itemsPerPage)
  }, [filteredApplications, currentPage])

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <Calendar className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Week Off Configuration ({weekOffs.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Configure weekly off days for different weeks in the rotation cycle.
          </p>
        </div>
      </div>

      <WeekOffFilterBar
        searchTerm={searchValue}
        setSearchTerm={(value) => {
          setSearchValue(value)
          setCurrentPage(1)
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
          if (canFetchWeekOffs) refetchWeekOffs()
        }}
        onAddNew={openAdd}
        canAdd={!isReadOnly && !!recordId && !isBusy}
      />

      <div className="px-4 pb-4">
        <WeekOffChangesTable
          employeeData={pagedApplications}
          loading={isBusy}
          currentPage={currentPage}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          editMode={!isReadOnly}
          deleteMode={!isReadOnly}
          onEdit={(row) => {
            if (!row || !Array.isArray(row.weekOffs)) {
              toast.error("No week off row to edit")
              return
            }
            setSelectedRecordId(row._id ?? null)
            const cleaned = dedupeWeekOffsByWeek(normalizeWeekOffs(row?.weekOffs))
            setEditWeekOffs(cleaned)
            setApplicationFromDate(row.fromDate ?? "")
            setApplicationToDate(row.toDate ?? "")
            setEditIndex(0)
            setIsFormOpen(true)
          }}
          onDelete={() => {
            if (weekOffs.length === 0) {
              toast.error("No week off row to delete")
              return
            }
            setDeleteIndex(0)
          }}
        />
      </div>

      <WeekOffFormPopup
        open={isFormOpen && !isReadOnly && !isBusy}
        onClose={closeForm}
        initialWeekOff={initialValue}
        existingWeekOffs={editWeekOffs}
        onSubmit={handlePopupSubmit}
        fromDate={applicationFromDate}
        toDate={applicationToDate}
        employeeId={employeeId}
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
