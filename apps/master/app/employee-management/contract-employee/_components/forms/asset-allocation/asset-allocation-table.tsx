"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Package, FileText } from "lucide-react"
import { AssetAllocationFormPopup } from "./asset-allocation-form"
import { type AssetAllocationItem } from "../../schemas/asset-allocation-form-schema"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

interface AssetAllocationSectionFormProps {
  employeeRecordId?: string | null
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (payload: any) => void
}

type SearchField = "assetCode" | "assetName" | "assetType"

export function AssetAllocationSectionForm({
  employeeRecordId = null,
  mode = "add",
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
  onSubmit,
}: AssetAllocationSectionFormProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [assetAllocated, setAssetAllocated] = useState<AssetAllocationItem[]>([])
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const tenantCode = useGetTenantCode()
  const canFetchAssets = Boolean(employeeRecordId) && currentMode !== "add"
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const { post: postAssetAllocations, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async () => {
      toast.success("Asset allocation saved successfully!")
      void refetchAssets()
    },
    onError: (error) => {
      console.error("Error saving asset allocation:", error)
    },
  })

  const assetCriteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteriaRequests: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) {
      criteriaRequests.push({ field: "tenantCode", operator: "is", value: tenantCode })
    }
    return criteriaRequests
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedAssets, refetch: refetchAssets } = useAggregateArrayFetch<any>({
    collection: employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee",
    criteriaRequests: assetCriteriaRequests,
    arrayField: "assetAllocated",
    enabled: canFetchAssets,
    defaultValue: [],
  })

  const openAdd = () => {
    setEditIndex(null)
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

  const handlePopupSubmit = (next: AssetAllocationItem[]) => {
    setAssetAllocated(next)
    closeForm()
  }

  const removeAsset = (index: number) => {
    const next = assetAllocated.filter((_, i) => i !== index)
    const isEditMode = currentMode === "edit" && Boolean(employeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        assetAllocated: next,
      },
    }
    postAssetAllocations(payload)
    setAssetAllocated(next)
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<AssetAllocationItem>[]>(
    () => [
      {
        key: "assetCode",
        label: "Asset Code",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.asset?.assetCode || "-",
      },
      {
        key: "assetName",
        label: "Asset Name",
        render: (row) => row.asset?.assetName || "-",
      },
      {
        key: "assetType",
        label: "Asset Type",
        render: (row) => row.asset?.assetType?.assetTypeTitle || "-",
      },
      {
        key: "dates",
        label: "Dates",
        render: (row) => (
          <>
            <Badge className="bg-blue-100 text-blue-800 mr-2">Allocated</Badge>
            {row.issueDate || "-"} {row.returnDate ? `to ${row.returnDate}` : ""}
          </>
        ),
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<AssetAllocationItem>[]>(
    () => [
      { value: "assetCode", label: "Asset Code", getValue: (row) => row.asset?.assetCode || "" },
      { value: "assetName", label: "Asset Name", getValue: (row) => row.asset?.assetName || "" },
      { value: "assetType", label: "Asset Type", getValue: (row) => row.asset?.assetType?.assetTypeTitle || "" },
    ],
    []
  )

  useEffect(() => {
    if (!canFetchAssets) return
    void refetchAssets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchAssets, tenantCode])

  useEffect(() => {
    if (!canFetchAssets) return
    if (Array.isArray(fetchedAssets)) {
      setAssetAllocated(fetchedAssets as AssetAllocationItem[])
    }
  }, [canFetchAssets, fetchedAssets])

  useEffect(() => {
    if (currentMode === "add") {
      setAssetAllocated([])
    }
  }, [currentMode])

  const initialValue = editIndex !== null && assetAllocated[editIndex] ? assetAllocated[editIndex] : null

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Package className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Asset Allocation ({assetAllocated.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or edit asset allocations in the popup.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<AssetAllocationItem>
          rows={assetAllocated}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"assetCode" as SearchField}
          isViewMode={isViewMode || postLoading}
          onAdd={!isViewMode && !postLoading ? openAdd : undefined}
          addButtonLabel="Allocate Asset"
          onEdit={!isViewMode && !postLoading ? openEdit : undefined}
          onDelete={!isViewMode && !postLoading ? setDeleteIndex : undefined}
          getRowKey={(row, index) => `${row.asset?.assetCode || "asset"}-${index}`}
          emptyTitle="No asset allocations added yet."
          emptyDescription="Use Allocate Asset to add details."
        />
      </div>

      <AssetAllocationFormPopup
        open={isFormOpen && !isViewMode && !postLoading}
        onClose={closeForm}
        initialValue={initialValue}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        employeeCollectionUrl={employeeCollectionUrl}
        assetAllocated={assetAllocated}
        editIndex={editIndex}
        refetchAssets={refetchAssets}
        onSubmit={handlePopupSubmit}
        isViewMode={isViewMode || postLoading}
      />

      {postLoading && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
          <div className="rounded-md bg-white shadow px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Saving permissions...</span>
          </div>
        </div>
      )}

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <FileText className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove asset allocation</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this asset allocation?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={postLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => removeAsset(deleteIndex)}
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
