"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Landmark } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/serach/use-aggregate-array-fetch"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import EmployeeLWFContributionsFormPopup from "./employee-lwf-contributions-form-popup"
import {
  type LWFContributionCollection,
  type LWFContributionItem,
} from "../../schemas/lwf-contribution.schema"
import { defaultWageEmployerContributionsValues } from "../../schemas/wage-employer-contributions-form.schema"

type Mode = "add" | "edit" | "view"

type Props = {
  mode?: Mode
  rowId?: string | null
  tenantCode?: string
  onSaved?: () => Promise<void> | void
}

const EMPTY_LWF: LWFContributionCollection = { employer: [], employee: [] }

export default function EmployeeLWFContributionsSectionTable({
  mode = "add",
  rowId = null,
  tenantCode: propTenantCode,
  onSaved,
}: Props) {
  const hookTenantCode = useGetTenantCode()
  const tenantCode = propTenantCode || hookTenantCode
  const [lwf, setLwf] = useState<LWFContributionCollection>(EMPTY_LWF)
  const [open, setOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const pendingDeleteRowsRef = useRef<LWFContributionItem[] | null>(null)

  const isViewMode = mode === "view"
  const canFetchLwf = Boolean(rowId) && mode !== "add"

  const criteriaRequests = useMemo(() => {
    if (!rowId) return []
    const criteria: any[] = [{ field: "_id", operator: "eq", value: rowId }]
    if (tenantCode) criteria.push({ field: "tenantCode", operator: "is", value: tenantCode })
    return criteria
  }, [rowId, tenantCode])

  const { arrayData: fetchedEmployeeLwf, loading, refetch } = useAggregateArrayFetch<any>({
    collection: "wageEmployerContributions",
    criteriaRequests,
    arrayField: "lwf.employee",
    enabled: canFetchLwf,
    defaultValue: [],
  })

  const { post: postDelete, loading: deleteLoading } = usePostRequest<any>({
    url: "wageEmployerContributions",
    onSuccess: async () => {
      if (pendingDeleteRowsRef.current) {
        updateRows(pendingDeleteRowsRef.current)
        pendingDeleteRowsRef.current = null
      }
      setDeleteIndex(null)
      toast.success("Employee LWF contribution removed successfully")
      await refetch()
      await onSaved?.()
    },
    onError: () => {
      pendingDeleteRowsRef.current = null
      toast.error("Failed to remove employee LWF contribution")
    },
  })

  useEffect(() => {
    if (!canFetchLwf) return
    void refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchLwf, tenantCode])

  useEffect(() => {
    if (!canFetchLwf) return
    if (!Array.isArray(fetchedEmployeeLwf)) return
    setLwf((prev) => ({
      ...prev,
      employee: fetchedEmployeeLwf.map((item: any) => ({
        contribution: Number(item?.contribution) || 0,
        country: item?.country ?? "",
        state: item?.state ?? "",
        effectiveFrom:
          typeof item?.effectiveFrom === "string" && item.effectiveFrom.includes("T")
            ? item.effectiveFrom.split("T")[0]
            : item?.effectiveFrom ?? "",
      })),
    }))
  }, [canFetchLwf, fetchedEmployeeLwf])

  useEffect(() => {
    if (mode === "add") setLwf(EMPTY_LWF)
  }, [mode])

  const rows = useMemo<LWFContributionItem[]>(
    () =>
      (lwf.employee || []).map((item, index) => ({
        ...item,
        contributionType: "employee" as const,
        parseID: `employee-${item.state || "state"}-${item.effectiveFrom || "date"}-${index}`,
      })),
    [lwf],
  )

  const initialValue = useMemo(
    () => (editIndex !== null ? rows[editIndex] ?? null : null),
    [editIndex, rows],
  )

  const columns = useMemo<ActionTableColumn<LWFContributionItem>[]>(
    () => [
      { key: "state", label: "State", render: (row) => row.state || "-" },
      { key: "country", label: "Country", render: (row) => row.country || "-" },
      {
        key: "contribution",
        label: "Contribution",
        render: (row) => <Badge className="bg-blue-100 text-blue-800">Rs {row.contribution ?? 0}</Badge>,
      },
      { key: "effectiveFrom", label: "Effective From", render: (row) => row.effectiveFrom || "-" },
    ],
    [],
  )

  const searchFields = useMemo<ActionTableSearchField<LWFContributionItem>[]>(
    () => [
      { value: "state", label: "State", getValue: (row) => row.state || "" },
      { value: "country", label: "Country", getValue: (row) => row.country || "" },
    ],
    [],
  )

  const updateRows = (nextRows: LWFContributionItem[]) =>
    setLwf((prev) => ({
      ...prev,
      employee: nextRows.map(({ contribution, country, state, effectiveFrom }) => ({
        contribution,
        country,
        state,
        effectiveFrom,
      })),
    }))

  const persistDeleteRows = (nextRows: LWFContributionItem[]) => {
    const nextEmployeeRows = nextRows.map(({ contribution, country, state, effectiveFrom }) => ({
      contribution,
      country,
      state,
      effectiveFrom,
    }))

    pendingDeleteRowsRef.current = nextRows

    postDelete?.({
      tenant: tenantCode,
      action: mode === "edit" && rowId ? "update" : "insert",
      ...(mode === "edit" && rowId ? { id: rowId } : {}),
      collectionName: "wageEmployerContributions",
      event: "wageEmployerContributions",
      data: {
        pf: defaultWageEmployerContributionsValues.pf,
        esi: defaultWageEmployerContributionsValues.esi,
        lwf: {
          employer: lwf.employer,
          employee: nextEmployeeRows,
        },
        tenantCode,
        organizationCode: tenantCode,
        updatedOn: new Date().toISOString(),
      },
    })
  }

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Landmark className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Employee LWF Contributions ({rows.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or edit employee Labour Welfare Fund contribution configurations.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-600">Loading employee LWF contributions...</div>
        ) : (
          <ActionDataTable<LWFContributionItem>
            rows={rows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField="state"
            isViewMode={isViewMode}
            onAdd={!isViewMode ? () => { setEditIndex(null); setOpen(true) } : undefined}
            addButtonLabel="Add Employee LWF"
            onEdit={!isViewMode ? (index) => { setEditIndex(index); setOpen(true) } : undefined}
            onDelete={!isViewMode ? setDeleteIndex : undefined}
            getRowKey={(row, index) => `${row.parseID || "lwf"}-${index}`}
            emptyTitle="No employee LWF contributions added yet."
            emptyDescription="Use Add Employee LWF to create entries."
          />
        )}
      </div>

      <EmployeeLWFContributionsFormPopup
        open={open}
        isViewMode={isViewMode}
        initialValue={initialValue}
        mode={mode}
        rowId={rowId}
        tenantCode={tenantCode}
        lwf={lwf}
        editIndex={editIndex}
        refetchLwf={refetch}
        onSaved={onSaved}
        onClose={() => {
          setEditIndex(null)
          setOpen(false)
        }}
        onSubmit={(nextRows) => {
          updateRows(nextRows)
          setEditIndex(null)
          setOpen(false)
        }}
      />

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <Landmark className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove employee LWF contribution</h3>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Are you sure you want to remove this employee LWF contribution?
                </p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteLoading}
                onClick={() => {
                  persistDeleteRows(rows.filter((_, index) => index !== deleteIndex))
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
