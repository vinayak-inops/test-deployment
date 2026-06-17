"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@repo/ui/components/ui/button"
import { AlertTriangle, Calendar } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import type { ProfessionalTaxFormValues, ProfessionalTaxSlab } from "../../schemas/professional-tax.schema"
import ProfessionalTaxSlabFormPopup from "./professional-tax-slab-form-popup"
import type { ProfessionalTaxSlabItem } from "../../schemas/professional-tax-slab.schema"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/serach/use-aggregate-array-fetch"

type Props = {
  formData: ProfessionalTaxFormValues
  isViewMode: boolean
  submitLoading?: boolean
  isStepValid: boolean
  onSave: () => void
  onChange: <K extends keyof ProfessionalTaxFormValues>(field: K, value: ProfessionalTaxFormValues[K]) => void
  onSlabChange: (index: number, key: keyof ProfessionalTaxSlab, value: number | string) => void
  createSlab: () => ProfessionalTaxSlab
}

export default function ProfessionalTaxSlabsTab({ formData, isViewMode, onChange }: Props) {
  const tenantCode = useGetTenantCode()
  const searchParams = useSearchParams()
  const rowId = searchParams.get("id")
  const [open, setOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [rows, setRows] = useState<ProfessionalTaxSlab[]>(formData.slabs || [])

  const canFetchSlabs = Boolean(rowId)
  const criteriaRequests = useMemo(() => {
    if (!rowId) return []
    const criteria: any[] = [{ field: "_id", operator: "eq", value: rowId }]
    if (tenantCode) criteria.push({ field: "tenantCode", operator: "is", value: tenantCode })
    return criteria
  }, [rowId, tenantCode])

  const { arrayData: fetchedSlabs, loading, refetch } = useAggregateArrayFetch<any>({
    collection: "wageProfessionalTax",
    criteriaRequests,
    arrayField: "slabs",
    enabled: canFetchSlabs,
    defaultValue: [],
  })

  useEffect(() => {
    if (!canFetchSlabs) return
    void refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchSlabs, tenantCode])

  useEffect(() => {
    if (!canFetchSlabs) return
    if (!Array.isArray(fetchedSlabs)) return
    const normalized = fetchedSlabs.map((item: any, index: number) => ({
      parseID: item?.parseID || `slab-${index}`,
      from: Number(item?.from || 0),
      to: Number(item?.to || 0),
      amount: Number(item?.amount || 0),
    }))
    setRows(normalized)
    onChange("slabs", normalized)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchSlabs, fetchedSlabs])

  useEffect(() => {
    if (canFetchSlabs) return
    setRows(formData.slabs || [])
  }, [canFetchSlabs, formData.slabs])

  const initialValue = useMemo(
    () => (editIndex !== null ? (rows[editIndex] as ProfessionalTaxSlabItem) ?? null : null),
    [editIndex, rows],
  )

  const columns = useMemo<ActionTableColumn<ProfessionalTaxSlab>[]>(
    () => [
      { key: "slNo", label: "SL", render: (_row, index) => index + 1 },
      { key: "from", label: "From", render: (row) => row.from },
      { key: "to", label: "To", render: (row) => row.to },
      { key: "amount", label: "Amount", render: (row) => row.amount },
    ],
    [],
  )

  const searchFields = useMemo<ActionTableSearchField<ProfessionalTaxSlab>[]>(
    () => [
      { value: "from", label: "From", getValue: (row) => String(row.from ?? "") },
      { value: "to", label: "To", getValue: (row) => String(row.to ?? "") },
      { value: "amount", label: "Amount", getValue: (row) => String(row.amount ?? "") },
    ],
    [],
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg"><Calendar className="h-4 w-4 text-gray-600" /></div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Professional Tax Slabs ({rows.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add or update slab configuration details.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-600">Loading slabs...</div>
        ) : (
          <ActionDataTable<ProfessionalTaxSlab>
            rows={rows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField="from"
            isViewMode={isViewMode}
            onAdd={!isViewMode ? () => { setEditIndex(null); setOpen(true) } : undefined}
            addButtonLabel="Add Row"
            onEdit={!isViewMode ? (index) => { setEditIndex(index); setOpen(true) } : undefined}
            onDelete={!isViewMode ? setDeleteIndex : undefined}
            getRowKey={(row, index) => `${row.parseID || "slab"}-${index}`}
            emptyTitle="No slabs configured"
            emptyDescription='Use "Add Row" to set from, to, and amount.'
          />
        )}
      </div>

      <ProfessionalTaxSlabFormPopup
        open={open && !isViewMode}
        isViewMode={isViewMode}
        initialSlab={initialValue}
        tenantCode={tenantCode}
        rowId={rowId}
        onClose={() => { setEditIndex(null); setOpen(false) }}
        onSubmit={(item) => {
          const slab: ProfessionalTaxSlab = {
            parseID: item.parseID || crypto.randomUUID(),
            from: item.from,
            to: item.to,
            amount: item.amount,
          }
          const nextRows = editIndex !== null ? rows.map((x, idx) => (idx === editIndex ? slab : x)) : [...rows, slab]
          setRows(nextRows)
          onChange("slabs", nextRows)
          setEditIndex(null)
          setOpen(false)
        }}
      />

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg"><AlertTriangle className="h-4 w-4 text-red-600" /></div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove slab row</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this row?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>Cancel</Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  const nextRows = rows.filter((_, idx) => idx !== deleteIndex)
                  setRows(nextRows)
                  onChange("slabs", nextRows)
                  setDeleteIndex(null)
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
