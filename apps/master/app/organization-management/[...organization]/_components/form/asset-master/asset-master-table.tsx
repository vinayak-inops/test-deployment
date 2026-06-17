"use client"

import { gql, useQuery } from "@apollo/client"
import { useEffect, useMemo, useState } from "react"
import { Layers, Package } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import AssetMasterAddFormValidated from "./AssetMasterAddFormValidated"
import AssetTypeAddFormValidated from "./AssetTypeAddFormValidated"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"

type SearchField = "assetCode" | "assetName"
type AssetTypeSearchField = "assetType"

type AssetRow = {
  parseID?: string
  _id?: string
  id?: string
  assetCode?: string
  assetName?: string
  assetType?: string
}

type AssetTypeRow = {
  assetType: string
}

interface AssetMasterTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function AssetMasterTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: AssetMasterTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [isAssetTypeDrawerOpen, setIsAssetTypeDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [assetTypeEditValue, setAssetTypeEditValue] = useState<string | null>(null)
  const [assetTypeDeleteValue, setAssetTypeDeleteValue] = useState<string | null>(null)
  const [assets, setAssets] = useState<AssetRow[]>([])
  const [assetTypes, setAssetTypes] = useState<string[]>([])

  const FETCH_ALL_ORGANIZATION_ASSET_MASTER_QUERY = gql`
    query FetchAllOrganizationAssetMaster($collection: String!, $tenantCode: String!) {
      fetchAllOrganization(collection: $collection, tenantCode: $tenantCode) {
        _id
        assetMaster {
          assetTypes
          assets {
            parseID
            assetCode
            assetName
            assetType
          }
        }
      }
    }
  `

  const {
    data,
    loading: assetsLoading,
    refetch: refetchAssets,
  } = useQuery(FETCH_ALL_ORGANIZATION_ASSET_MASTER_QUERY, {
    client,
    variables: {
      collection: "organization",
      tenantCode: tenantCode || "",
    },
    skip: !tenantCode,
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchAssets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    const organization = data?.fetchAllOrganization?.[0]
    const assetMaster = organization?.assetMaster
    setAssets(Array.isArray(assetMaster?.assets) ? assetMaster.assets : [])
    setAssetTypes(Array.isArray(assetMaster?.assetTypes) ? assetMaster.assetTypes : [])
  }, [data])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const openAssetTypeAdd = () => {
    setAssetTypeDeleteValue(null)
    setAssetTypeEditValue(null)
    setIsAssetTypeDrawerOpen(true)
  }

  const displayedAssets = useMemo(() => [...assets].reverse(), [assets])
  const toOriginalIndex = (displayIndex: number) => assets.length - 1 - displayIndex
  const assetTypeRows = useMemo<AssetTypeRow[]>(
    () => assetTypes.map((assetType) => ({ assetType })),
    [assetTypes]
  )

  const columns = useMemo<ActionTableColumn<AssetRow>[]>(
    () => [
      {
        key: "assetCode",
        label: "Asset Code",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.assetCode || "-",
      },
      {
        key: "assetName",
        label: "Asset Name",
        render: (row) => row.assetName || "-",
      },
      {
        key: "assetType",
        label: "Asset Type",
        render: (row) => row.assetType || "-",
      },
    ],
    []
  )

  const assetTypeColumns = useMemo<ActionTableColumn<AssetTypeRow>[]>(
    () => [
      {
        key: "assetType",
        label: "Asset Type",
        render: (row) => row.assetType || "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<AssetRow>[]>(
    () => [
      { value: "assetCode", label: "Asset Code", getValue: (row) => row.assetCode || "" },
      { value: "assetName", label: "Asset Name", getValue: (row) => row.assetName || "" },
    ],
    []
  )

  const assetTypeSearchFields = useMemo<ActionTableSearchField<AssetTypeRow>[]>(
    () => [
      { value: "assetType", label: "Asset Type", getValue: (row) => row.assetType || "" },
    ],
    []
  )

  const existingAssetCodes = useMemo(
    () =>
      assets
        .map((asset) => asset.assetCode || "")
        .filter((assetCode) => {
          if (isEditMode && editData?.assetCode) {
            return assetCode !== editData.assetCode
          }
          return true
        }),
    [assets, editData?.assetCode, isEditMode]
  )

  return (
    <div className="space-y-6">
      <div className="relative rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-3">
          <div className="rounded-lg bg-blue-100 p-1.5">
            <Layers className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold leading-none text-gray-900">
              Asset Types ({assetTypes.length})
            </h2>
            <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
              Manage the list of reusable asset types.
            </p>
          </div>
        </div>

        <div className="space-y-4 px-6 py-4">
          <ActionDataTable<AssetTypeRow>
            rows={assetTypeRows}
            columns={assetTypeColumns}
            searchFields={assetTypeSearchFields}
            defaultSearchField={"assetType" as AssetTypeSearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAssetTypeAdd : undefined}
            addButtonLabel="Add Asset Type"
            onEdit={editMode ? (rowIndex) => {
              setAssetTypeDeleteValue(null)
              setAssetTypeEditValue(assetTypeRows[rowIndex]?.assetType || null)
              setIsAssetTypeDrawerOpen(true)
            } : undefined}
            onDelete={deleteMode ? (rowIndex) => {
              setAssetTypeEditValue(null)
              setAssetTypeDeleteValue(assetTypeRows[rowIndex]?.assetType || null)
              setIsAssetTypeDrawerOpen(true)
            } : undefined}
            getRowKey={(row) => row.assetType}
            emptyTitle="No asset types added yet."
            emptyDescription="Use Add Asset Type to create records."
          />
        </div>
      </div>

      <div className="relative rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-3">
          <div className="rounded-lg bg-blue-100 p-1.5">
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold leading-none text-gray-900">
              Asset Master ({assets.length})
            </h2>
            <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
              Add, edit and delete asset records.
            </p>
          </div>
        </div>

        <div className="space-y-4 px-6 py-4">
          {assetsLoading && assets.length === 0 ? (
            <div className="text-sm text-gray-500">Loading assets...</div>
          ) : (
            <ActionDataTable<AssetRow>
              rows={displayedAssets}
              columns={columns}
              searchFields={searchFields}
              defaultSearchField={"assetName" as SearchField}
              pageSize={10}
              isViewMode={!editMode && !deleteMode && !addMode}
              onAdd={addMode ? openAdd : undefined}
              addButtonLabel="Add Asset"
              onEdit={editMode ? (rowIndex) => {
                setDeleteValue(null)
                setEditData(displayedAssets[rowIndex])
                setIsEditMode(true)
                setIsAddDrawerOpen(true)
              } : undefined}
              onDelete={deleteMode ? (rowIndex) => {
                const originalIndex = toOriginalIndex(rowIndex)
                setEditData(null)
                setIsEditMode(false)
                setDeleteValue(assets[originalIndex])
                setIsAddDrawerOpen(true)
              } : undefined}
              getRowKey={(row, index) => `${row.parseID || row.assetCode || "asset"}-${toOriginalIndex(index)}`}
              emptyTitle="No assets added yet."
              emptyDescription="Use Add Asset to create records."
            />
          )}
        </div>
      </div>

      {isAddDrawerOpen && (
        <AssetMasterAddFormValidated
          key={`asset-master-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
          open={isAddDrawerOpen}
          organizationId={organizationId}
          assetTypes={assetTypes}
          existingAssetCodes={existingAssetCodes}
          deleteValue={deleteValue}
          setOpen={(open: boolean) => {
            setIsAddDrawerOpen(open)
            if (!open) {
              setIsEditMode(false)
              setEditData(null)
              setDeleteValue(null)
            }
          }}
          editData={editData}
          isEditMode={isEditMode}
          onSuccess={() => {
            setIsEditMode(false)
            setEditData(null)
            setDeleteValue(null)
          }}
          onServerUpdate={async () => {
            await refetchAssets()
            return null
          }}
        />
      )}

      {isAssetTypeDrawerOpen && (
        <AssetTypeAddFormValidated
          open={isAssetTypeDrawerOpen}
          setOpen={(open) => {
            setIsAssetTypeDrawerOpen(open)
            if (!open) {
              setAssetTypeEditValue(null)
              setAssetTypeDeleteValue(null)
            }
          }}
          organizationId={organizationId}
          assetTypes={assetTypes}
          editValue={assetTypeEditValue}
          deleteValue={assetTypeDeleteValue}
          onSuccess={() => {
            setAssetTypeEditValue(null)
            setAssetTypeDeleteValue(null)
            void refetchAssets()
          }}
        />
      )}
    </div>
  )
}
