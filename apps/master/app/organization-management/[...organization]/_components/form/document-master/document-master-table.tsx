"use client"

import { gql, useQuery } from "@apollo/client"
import { useEffect, useMemo, useState } from "react"
import { Layers, Package } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import DocumentMasterAddFormValidated from "./DocumentMasterAddFormValidated"
import DocumentTypeAddFormValidated from "./DocumentTypeAddFormValidated"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"

type SearchField = "documentCategoryCode" | "documentCategoryName"
type DocumentTypeSearchField = "documentType"

type DocumentCategoryRow = {
  parseID?: string
  _id?: string
  id?: string
  documentCategoryCode?: string
  documentCategoryName?: string
  documentType?: string[]
  status?: string
}

type DocumentTypeRow = {
  documentType: string
}

interface DocumentMasterTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function DocumentMasterTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: DocumentMasterTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [isDocumentTypeDrawerOpen, setIsDocumentTypeDrawerOpen] = useState(false)
  const [documentTypeEditValue, setDocumentTypeEditValue] = useState<string | null>(null)
  const [documentTypeDeleteValue, setDocumentTypeDeleteValue] = useState<string | null>(null)
  const [categories, setCategories] = useState<DocumentCategoryRow[]>([])
  const [documentTypes, setDocumentTypes] = useState<string[]>([])

  const FETCH_ALL_ORGANIZATION_DOCUMENT_MASTER_QUERY = gql`
    query FetchAllOrganizationDocumentMaster($collection: String!, $tenantCode: String!) {
      fetchAllOrganization(collection: $collection, tenantCode: $tenantCode) {
        _id
        documentMaster {
          documentType
          documentCategory {
            parseID
            documentCategoryCode
            documentCategoryName
            documentType
            status
          }
        }
      }
    }
  `

  const {
    data,
    loading: categoriesLoading,
    refetch: refetchCategories,
  } = useQuery(FETCH_ALL_ORGANIZATION_DOCUMENT_MASTER_QUERY, {
    client,
    variables: {
      collection: "organization",
      tenantCode: tenantCode || "",
    },
    skip: !tenantCode,
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    const organization = data?.fetchAllOrganization?.[0]
    const documentMaster = organization?.documentMaster
    setCategories(Array.isArray(documentMaster?.documentCategory) ? documentMaster.documentCategory : [])
    setDocumentTypes(Array.isArray(documentMaster?.documentType) ? documentMaster.documentType : [])
  }, [data])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const openDocumentTypeAdd = () => {
    setDocumentTypeDeleteValue(null)
    setDocumentTypeEditValue(null)
    setIsDocumentTypeDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...categories].reverse(), [categories])
  const toOriginalIndex = (displayIndex: number) => categories.length - 1 - displayIndex
  const documentTypeRows = useMemo<DocumentTypeRow[]>(
    () => documentTypes.map((documentType) => ({ documentType })),
    [documentTypes]
  )

  const columns = useMemo<ActionTableColumn<DocumentCategoryRow>[]>(
    () => [
      {
        key: "documentCategoryCode",
        label: "Category Code",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.documentCategoryCode || "-",
      },
      {
        key: "documentCategoryName",
        label: "Category Name",
        render: (row) => row.documentCategoryName || "-",
      },
      {
        key: "documentType",
        label: "Document Types",
        render: (row) =>
          Array.isArray(row.documentType) && row.documentType.length > 0
            ? row.documentType.join(", ")
            : "-",
      },
    ],
    []
  )

  const documentTypeColumns = useMemo<ActionTableColumn<DocumentTypeRow>[]>(
    () => [
      {
        key: "documentType",
        label: "Document Type",
        render: (row) => row.documentType || "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<DocumentCategoryRow>[]>(
    () => [
      { value: "documentCategoryCode", label: "Category Code", getValue: (row) => row.documentCategoryCode || "" },
      { value: "documentCategoryName", label: "Category Name", getValue: (row) => row.documentCategoryName || "" },
    ],
    []
  )

  const documentTypeSearchFields = useMemo<ActionTableSearchField<DocumentTypeRow>[]>(
    () => [
      { value: "documentType", label: "Document Type", getValue: (row) => row.documentType || "" },
    ],
    []
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
              Document Types ({documentTypes.length})
            </h2>
            <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
              Manage the list of reusable document types.
            </p>
          </div>
        </div>

        <div className="space-y-4 px-6 py-4">
          <ActionDataTable<DocumentTypeRow>
            rows={documentTypeRows}
            columns={documentTypeColumns}
            searchFields={documentTypeSearchFields}
            defaultSearchField={"documentType" as DocumentTypeSearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openDocumentTypeAdd : undefined}
            addButtonLabel="Add Document Type"
            onEdit={editMode ? (rowIndex) => {
              setDocumentTypeDeleteValue(null)
              setDocumentTypeEditValue(documentTypeRows[rowIndex]?.documentType || null)
              setIsDocumentTypeDrawerOpen(true)
            } : undefined}
            onDelete={deleteMode ? (rowIndex) => {
              setDocumentTypeEditValue(null)
              setDocumentTypeDeleteValue(documentTypeRows[rowIndex]?.documentType || null)
              setIsDocumentTypeDrawerOpen(true)
            } : undefined}
            getRowKey={(row) => row.documentType}
            emptyTitle="No document types added yet."
            emptyDescription="Use Add Document Type to create records."
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
              Document Master ({categories.length})
            </h2>
            <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
              Add, edit and delete document categories.
            </p>
          </div>
        </div>

        <div className="space-y-4 px-6 py-4">
          {categoriesLoading && categories.length === 0 ? (
            <div className="text-sm text-gray-500">Loading document categories...</div>
          ) : (
            <ActionDataTable<DocumentCategoryRow>
              rows={displayedRows}
              columns={columns}
              searchFields={searchFields}
              defaultSearchField={"documentCategoryName" as SearchField}
              pageSize={10}
              isViewMode={!editMode && !deleteMode && !addMode}
              onAdd={addMode ? openAdd : undefined}
              addButtonLabel="Add Document Category"
              onEdit={editMode ? (rowIndex) => {
                setDeleteValue(null)
                setEditData(displayedRows[rowIndex])
                setIsEditMode(true)
                setIsAddDrawerOpen(true)
              } : undefined}
              onDelete={deleteMode ? (rowIndex) => {
                const originalIndex = toOriginalIndex(rowIndex)
                setEditData(null)
                setIsEditMode(false)
                setDeleteValue(categories[originalIndex])
                setIsAddDrawerOpen(true)
              } : undefined}
              getRowKey={(row, index) => `${row.parseID || row.documentCategoryCode || "document-category"}-${toOriginalIndex(index)}`}
              emptyTitle="No document categories added yet."
              emptyDescription="Use Add Document Category to create records."
            />
          )}
        </div>
      </div>

      {isAddDrawerOpen && (
        <DocumentMasterAddFormValidated
          key={`document-master-${isEditMode ? "edit" : "add"}-${editData?.parseID || editData?._id || editData?.id || "new"}`}
          open={isAddDrawerOpen}
          organizationId={organizationId}
          documentCategories={categories}
          documentTypes={documentTypes}
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
            await refetchCategories()
            return null
          }}
        />
      )}

      {isDocumentTypeDrawerOpen && (
        <DocumentTypeAddFormValidated
          open={isDocumentTypeDrawerOpen}
          setOpen={(open: boolean) => {
            setIsDocumentTypeDrawerOpen(open)
            if (!open) {
              setDocumentTypeEditValue(null)
              setDocumentTypeDeleteValue(null)
            }
          }}
          organizationId={organizationId}
          documentTypes={documentTypes}
          editValue={documentTypeEditValue}
          deleteValue={documentTypeDeleteValue}
          onSuccess={() => {
            setDocumentTypeEditValue(null)
            setDocumentTypeDeleteValue(null)
            void refetchCategories()
          }}
        />
      )}
    </div>
  )
}
