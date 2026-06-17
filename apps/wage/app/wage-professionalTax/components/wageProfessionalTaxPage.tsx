"use client"

import Table from "@repo/ui/components/table-dynamic/data-table"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import React, { useEffect, useRef, useState } from "react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import WageProfessionalTax from "./wageProfessionalTax"
import EnhancedHeader from "@/components/enhanced-header"
import { Shield } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import PageNotFound from "@/components/page-notfound"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

type Slab = { from: number; to: number; amount: number }
type ProfessionalTaxItem = { state: string; effectiveFrom: string; slabs: Slab[]; applicableTo: string }
type WageProfessionalTaxForm = {
  _id?: { $oid: string }
  organizationCode: string
  tenantCode: string
  professionaTax: ProfessionalTaxItem[]
}

export default function WageProfessionalTaxPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  // Table/data state
  const [subOrganization, setSubOrganization] = useState<any[]>([])
  const [action, setAction] = useState<any[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any>(null)
  const [duplicateData, setDuplicateData] = useState<any>([])
  const [deleteId, setDeleteId] = useState<any>(null)
  const [deleteData, setDeleteData] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const deleteDataRef = useRef<any>(null)
  const [modeCheck, setModeCheck] = useState<any>("")
  const tenantCode = useGetTenantCode()

  const wageProfessionalTaxScreen = "wageProfessionalTax"

  // Role-based permissions for this screen (align with SubOrganizationPage pattern)
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "wage", // adjust if your backend expects another service name
    screenName: wageProfessionalTaxScreen,
  })

  const viewMode = rolePermissions?.view || false
  const editMode = rolePermissions?.edit || false
  const addMode = rolePermissions?.add || false
  const deleteMode = rolePermissions?.delete || false

  useEffect(() => {
    deleteDataRef.current = deleteData
  }, [deleteData])

  // Get the mode from URL search params
  const mode = searchParams.get("mode")
  const formType = searchParams.get("form") // currently unused but kept for compatibility
  const isFormMode = mode === "edit" || mode === "add" || mode === "view"

  useEffect(() => {
    if (mode !== modeCheck) {
      setModeCheck(mode)
    }
  }, [mode, modeCheck])

  // Handle back/cancel navigation
  const handleBackNavigation = () => {
    router.push("/wage-professionalTax")
  }

  const {
    data,
    error,
    loading,
    refetch,
  }: {
    data: any
    error: any
    loading: any
    refetch: any
  } = useRequest<any[]>({
    url: `map/wageProfessionalTax/search?tenantCode=${tenantCode}`,
    onSuccess: (data: any) => {

      // Handle the case where data is a single record with professionaTax array
      let professionalTaxItems: any[] = []

      if (Array.isArray(data)) {
        // If data is an array, use it directly
        professionalTaxItems = data
      } else if (data && data.professionaTax && Array.isArray(data.professionaTax)) {
        // If data is a single record with professionaTax array, extract the array
        professionalTaxItems = data.professionaTax
      } else {
      }

      const filteredData = professionalTaxItems.map((item: any, index: number) => ({
        _id: item._id || `${data._id}_${index}`,
        state: item.state || "",
        effectiveFrom: item.effectiveFrom ? new Date(item.effectiveFrom).toISOString().slice(0, 10) : "",
        applicableTo: item.applicableTo || "",
        slabsCount: (item.slabs || []).length,
        country: item.country || "",
      }))


      const dummyData = professionalTaxItems.map((item: any, index: number) => ({
        _id: item._id || `${data._id}_${index}`,
        state: item.state,
        effectiveFrom: item.effectiveFrom,
      }))

      setDuplicateData(dummyData)
      const dataTable = filteredData.reverse()
      setSubOrganization(dataTable)
    },
    onError: (error: any) => {
      console.error("Error loading wage professional tax data:", error)
    },
  })

  const {
    data: singleData,
    error: singleError,
    loading: singleLoading,
    refetch: fetchSingleData,
  }: {
    data: any
    error: any
    loading: any
    refetch: any
  } = useRequest<any[]>({
    url: "wageProfessionalTax/search",
    method: "POST",
    data: [
      {
        field: "_id",
        value: deleteId,
        operator: "eq",
      },
    ],
    onSuccess: (data: any) => {
      setDeleteData(data[0])
    },
    onError: (error: any) => {
      console.error("Error loading wage professional tax data:", error)
    },
  })

  useEffect(() => {
    if (action) {
      refetch()
    }
  }, [action, mode])

  const {
    post: postDelete,
    loading: postLoading,
    error: postError,
    data: postData,
  } = usePostRequest<any>({
    url: "wageProfessionalTax",
    onSuccess: (data) => {
      toast.success("Wage Professional Tax deleted successfully!")
    },
    onError: (error) => {
      toast.error("Wage Professional Tax submission failed!")
      console.error("POST error:", error)
    },
  })

  const functionalityList = {
    tabletype: {
      type: "data",
      classvalue: {
        container: "col-span-12 mb-2",
        tableheder: {
          container: "bg-[#f8fafc]",
        },
        label: "text-gray-600",
        field: "p-1",
      },
    },
    columnfunctionality: {
      draggable: {
        status: true,
      },
      handleRenameColumn: {
        status: true,
      },
      slNumber: {
        status: true,
      },
      selectCheck: {
        status: false,
      },
      activeColumn: {
        status: true,
      },
    },
    textfunctionality: {
      expandedCells: {
        status: true,
      },
    },
    filterfunctionality: {
      handleSortAsc: {
        status: true,
      },
      handleSortDesc: {
        status: true,
      },
      search: {
        status: true,
      },
    },
    outsidetablefunctionality: {
      paginationControls: {
        status: true,
        start: "",
        end: "",
      },
      entriesPerPageSelector: {
        status: false,
      },
    },
    buttons: {
      save: {
        label: "Save",
        status: false,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: () => {},
      },
      submit: {
        label: "Submit",
        status: false,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: () => {},
      },
      addnew: {
        label: "Add New",
        status: addMode,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: () => router.push("/wage-professionalTax?mode=add"),
      },
      cancel: {
        label: "Cancel",
        status: false,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: () => {},
      },
      actionDelete: {
        label: "Delete",
        status: deleteMode,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: async (deleteValue: any) => {
          await handleOpenDelete(deleteValue)
        },
      },
      actionLink: {
        label: "link",
        status: viewMode,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: (data: any) => router.push(`/wage-professionalTax?mode=view&id=${data._id}`),
      },
      actionEdit: {
        label: "Edit",
        status: editMode,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: (data: any) => router.push(`/wage-professionalTax?mode=edit&id=${data._id}`),
      },
    },
  }

  // Centralized open/close handlers for delete popup
  const handleOpenDelete = async (deleteValue: any) => {
    setDeleteError(null)
    setDeleteData(null)
    setItemToDelete(deleteValue)
    setShowDeleteConfirm(true)
    setDeleteLoading(true)
    setDeleteId(deleteValue._id)
    await fetchSingleData()
    const start = Date.now()
    while (Date.now() - start < 2000) {
      if (deleteDataRef.current && deleteDataRef.current._id === deleteValue._id) break
      await new Promise((r) => setTimeout(r, 100))
    }
    setDeleteLoading(false)
  }

  const handleCloseDelete = () => {
    setShowDeleteConfirm(false)
    setItemToDelete(null)
    setDeleteError(null)
    setDeleteLoading(false)
    setDeleteData(null)
  }

  // Close modal with Escape key when not loading
  useEffect(() => {
    if (!showDeleteConfirm) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleteLoading) {
        handleCloseDelete()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [showDeleteConfirm, deleteLoading])

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    try {
      // 1) Select item id for fetching only
      setDeleteId(itemToDelete._id)
      // 2) Fetch latest full record and wait until state is populated
      setDeleteError(null)
      setDeleteLoading(true)
      // Ensure state update has flushed before refetch
      await new Promise((r) => setTimeout(r, 0))
      await fetchSingleData()
      const waitUntil = async (check: () => boolean, timeoutMs = 5000, intervalMs = 100) => {
        const start = Date.now()
        while (Date.now() - start < timeoutMs) {
          if (check()) return
          await new Promise((r) => setTimeout(r, intervalMs))
        }
        throw new Error("Timeout waiting for fetched record")
      }
      await waitUntil(() => !!deleteDataRef.current && deleteDataRef.current._id === itemToDelete._id)
      setDeleteLoading(false)
      const payload = deleteDataRef.current
      // 3) Build delete request using fetched record only
      const postData = {
        tenant: tenantCode,
        action: "insert",
        id: payload._id,
        collectionName: "wageProfessionalTax",
        data: {
          isDeleted: true,
          ...payload,
        },
      }
      // 4) Execute delete
      await postDelete(postData)
      // 5) Refresh list and close dialog
      setAction(payload._id)
      handleCloseDelete()
      refetch()
    } catch (err) {
      console.error("Delete failed", err)
      setDeleteLoading(false)
      setDeleteError("Couldn't fetch record. Please try again after some time.")
    }
  }

  const handleCancelDelete = () => {
    handleCloseDelete()
  }

  // If user has no permission at all, show 404-style page
  if (!viewMode && !editMode && !addMode) {
    return <PageNotFound />
  }

  // Per-mode protection for direct URL access
  if (modeCheck === "add" && !addMode) {
    return <PageNotFound />
  }
  if (modeCheck === "edit" && !editMode) {
    return <PageNotFound />
  }
  if (modeCheck === "view" && !viewMode) {
    return <PageNotFound />
  }

  // If in form mode, show the WageProfessionalTax form (only when allowed)
  if (modeCheck === "add" || modeCheck === "edit" || modeCheck === "view") {
    return (
      <div className="px-12 py-4">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={handleBackNavigation}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to List
          </button>
        </div>
        <WageProfessionalTax scrollToIndex={undefined} initialData={undefined} />
      </div>
    )
  }

  // Otherwise show the table view (requires at least view permission)
  if (!viewMode) {
    return <PageNotFound />
  }

  return (
    <div>
      <EnhancedHeader
        title={"Manage Wage Professional Tax"}
        description={"Manage Wage Professional Tax"}
        IconComponent={Shield}
        recordCount={subOrganization?.length || 0}
        organizationType={tenantCode}
        lastSync={2}
        uptime={99.9}
      />

      {subOrganization && subOrganization.length > 0 ? (
        <Table functionalityList={functionalityList} data={subOrganization} />
      ) : (
        <div className="text-center py-8 text-gray-500">
          {loading ? "Loading..." : "No professional tax data found"}
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  ></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-700">
                Are you sure you want to delete this wage professional tax? This will permanently remove the record from
                the system.
              </p>
              {deleteLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  Fetching record...
                </div>
              )}
              {deleteError && <div className="text-sm text-red-600 mt-3">{deleteError}</div>}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                  deleteLoading ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {deleteLoading ? "Please wait..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}