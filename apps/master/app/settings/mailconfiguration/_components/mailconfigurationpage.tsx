"use client"

import Table from "@repo/ui/components/table-dynamic/data-table"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import React, { useEffect, useRef, useState } from "react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { MailConfigurationForm } from "./mailconfiguration"
import { useRouter, useSearchParams } from "next/navigation"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

export default function MailConfigurationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const mode = searchParams.get('mode')
  const tenantCode = useGetTenantCode()

  const [configurations, setConfigurations] = useState<any[]>([])
  const [action, setAction] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<any>(null)
  const [deleteData, setDeleteData] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const deleteDataRef = useRef<any>(null)
  const [modeCheck, setModeCheck] = useState<any>("")

  useEffect(() => {
    deleteDataRef.current = deleteData
  }, [deleteData])

  useEffect(() => {
    if (mode !== modeCheck) {
      setModeCheck(mode)
    }
  }, [mode, modeCheck])

  // Fetch all mail configurations
  const {
    data,
    error,
    loading,
    refetch
  }: {
    data: any;
    error: any;
    loading: any;
    refetch: any;
  } = useRequest<any[]>({
    url: `map/mail_server_config/search?tenantCode=${tenantCode || "Midhani"}`,
    onSuccess: (data: any) => {
      
      const active = (data || []).filter((item: any) => item?.isDeleted !== true)
      
      const filteredData = active.map((item: any) => ({
        _id: item._id,
        outgoingHost: item.outgoingHost || "",
        outgoingPort: item.outgoingPort || "",
        defaultFromEmail: item.defaultFromEmail || "",
        isActive: item.isActive ? "Active" : "Inactive",
        createdOn: item.createdOn ? new Date(item.createdOn).toISOString().slice(0, 10) : "",
        createdBy: item.createdBy || "",
      }))
      setConfigurations(filteredData)
    },
    onError: (error: any) => {
      console.error('Error loading mail configurations:', error);
    }
  });

  // Fetch single configuration for delete
  const {
    data: singleData,
    error: singleError,
    loading: singleLoading,
    refetch: fetchSingleData
  }: {
    data: any;
    error: any;
    loading: any;
    refetch: any;
  } = useRequest<any[]>({
    url: 'mail_server_config/search',
    method: 'POST',
    data: [
      {
        field: "_id",
        value: deleteId,
        operator: "eq",
      }
    ],
    onSuccess: (data: any) => {
      setDeleteData(data[0])
    },
    onError: (error: any) => {
      console.error('Error loading mail configuration:', error);
    }
  });

  useEffect(() => {
    if (action) {
      refetch()
    }
  }, [action, mode])

  // Delete API call
  const {
    post: postDelete,
    loading: postDeleteLoading,
    error: postDeleteError,
    data: postDeleteData,
  } = usePostRequest<any>({
    url: "mail_server_config",
    onSuccess: (data) => {
      toast.success("Mail configuration deleted successfully!");
      refetch()
    },
    onError: (error) => {
      toast.error("Mail configuration deletion failed!");
      console.error("POST error:", error);
    },
  });

  // Handle back navigation
  const handleBackNavigation = () => {
    router.push('/settings/mailconfiguration')
  }

  // Table configuration
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
      },
      submit: {
        label: "Submit",
        status: false,
      },
      addnew: {
        label: "Add New",
        status: true,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: () => router.push("/settings/mailconfiguration?mode=add"),
      },
      cancel: {
        label: "Cancel",
        status: false,
      },
      actionDelete: {
        label: "Delete",
        status: true,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: async (deleteValue: any) => {
          await handleOpenDelete(deleteValue);
        },
      },
      actionLink: {
        label: "link",
        status: true,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: (data: any) => router.push(`/settings/mailconfiguration?mode=view&id=${data._id}`),
      },
      actionEdit: {
        label: "Edit",
        status: true,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: (data: any) => router.push(`/settings/mailconfiguration?mode=edit&id=${data._id}`),
      },
    },
  }

  // Delete handlers
  const handleOpenDelete = async (deleteValue: any) => {
    setDeleteError(null);
    setDeleteData(null);
    setItemToDelete(deleteValue);
    setShowDeleteConfirm(true);
    setDeleteLoading(true);
    setDeleteId(deleteValue._id);
    await fetchSingleData();
    const start = Date.now();
    while (Date.now() - start < 2000) {
      if (deleteDataRef.current && deleteDataRef.current._id === deleteValue._id) break;
      await new Promise(r => setTimeout(r, 100));
    }
    setDeleteLoading(false);
  }

  const handleCloseDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    setDeleteError(null);
    setDeleteLoading(false);
    setDeleteData(null);
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleteId(itemToDelete._id);
      setDeleteError(null);
      setDeleteLoading(true);
      await new Promise(r => setTimeout(r, 0));
      await fetchSingleData();
      const waitUntil = async (check: () => boolean, timeoutMs = 5000, intervalMs = 100) => {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
          if (check()) return;
          await new Promise(r => setTimeout(r, intervalMs));
        }
        throw new Error("Timeout waiting for fetched record");
      };
      await waitUntil(() => !!deleteDataRef.current && deleteDataRef.current._id === itemToDelete._id);
      setDeleteLoading(false);
      const payload = deleteDataRef.current;
      const postData = {
        tenant: tenantCode || "Midhani",
        action: "insert",
        id: payload._id,
        collectionName: "mail_server_config",
        data: {
          isDeleted: true,
          ...payload,
        },
      };
      await postDelete(postData);
      setAction(payload._id);
      handleCloseDelete();
      refetch()
    } catch (err) {
      console.error("Delete failed", err);
      setDeleteLoading(false);
      setDeleteError("Couldn't fetch record. Please try again after some time.");
    }
  };

  const handleCancelDelete = () => {
    handleCloseDelete();
  };

  // If in form mode, show the Mail Configuration form
  if (modeCheck === 'add' || modeCheck === 'edit' || modeCheck === 'view') {
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
        <MailConfigurationFormWrapper id={id} mode={modeCheck} refetch={refetch} />
      </div>
    );
  }

  // Otherwise show the table view
  return (
    <>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mail Configuration</h1>
          <p className="text-gray-600 mt-1">Manage your mail server configurations</p>
        </div>
        
        {configurations && configurations.length > 0 ? (
          <Table
            functionalityList={functionalityList}
            data={configurations}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            {loading ? 'Loading...' : 'No mail configurations found'}
          </div>
        )}

        {/* Delete Confirmation Popup */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-700">
                  Are you sure you want to delete this mail configuration? This will permanently remove the record from the system.
                </p>
                {deleteLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    Fetching record...
                  </div>
                )}
                {deleteError && (
                  <div className="text-sm text-red-600 mt-3">
                    {deleteError}
                  </div>
                )}
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
                  className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${deleteLoading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {deleteLoading ? 'Please wait...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Wrapper component for the form that handles data fetching
function MailConfigurationFormWrapper({ id, mode, refetch }: { id: string | null, mode: string, refetch: () => void }) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(true)
  const [initialData, setInitialData] = useState<any>(undefined)
  const tenantCode = useGetTenantCode()

  // Fetch single configuration for edit/view
  const {
    data: configData,
    loading: configLoading,
    error: configError,
    refetch: fetchConfig
  } = useRequest<any>({
    url: 'mail_server_config/search',
    method: 'POST',
    data: id ? [
      {
        field: "_id",
        value: id,
        operator: "eq",
      }
    ] : [],
    onSuccess: (data: any) => {
      if (data && data.length > 0) {
        const config = data[0]
        setInitialData({
          outgoingHost: config.outgoingHost || "",
          outgoingPort: config.outgoingPort || 587,
          authentication: {
            required: config.authentication?.required ?? true,
            username: config.authentication?.username || "",
            password: config.authentication?.password || "",
          },
          enableSsl: config.enableSsl ?? true,
          enableTsl: config.enableTsl ?? false,
          timeoutInSeconds: config.timeoutInSeconds ?? 0,
          defaultFromEmail: config.defaultFromEmail || "",
          isActive: config.isActive ?? true,
        })
      }
    },
    onError: (error: any) => {
      console.error('Error loading mail configuration:', error);
    }
  });

  useEffect(() => {
    if (id && (mode === 'edit' || mode === 'view')) {
      fetchConfig()
    }
  }, [id, mode])

  const {
    post: postConfig,
    loading: postLoading,
    error: postError,
  } = usePostRequest<any>({
    url: "mail_server_config",
    onSuccess: (data) => {
      toast.success(`Mail configuration ${mode === 'add' ? 'created' : 'updated'} successfully!`);
      refetch()
      setIsFormOpen(false)
      router.push('/settings/mailconfiguration')
    },
    onError: (error) => {
      toast.error(`Mail configuration ${mode === 'add' ? 'creation' : 'update'} failed!`);
      console.error("POST error:", error);
    },
  });

  const handleCloseForm = () => {
    setIsFormOpen(false)
    router.push('/settings/mailconfiguration')
  }

  const handleSubmit = async (data: {
    outgoingHost: string
    outgoingPort: number
    authentication: {
      required: boolean
      username?: string
      password?: string
    }
    enableSsl: boolean
    enableTsl: boolean
    timeoutInSeconds: number
    defaultFromEmail: string
    isActive: boolean
  }) => {
    try {
      const recordId = mode === 'edit' && id ? id : null
      
      const mailConfigData: any = {
        outgoingHost: data.outgoingHost,
        outgoingPort: data.outgoingPort,
        authentication: {
          required: data.authentication.required,
          username: data.authentication.username || "",
          password: data.authentication.password || "",
        },
        enableSsl: data.enableSsl,
        enableTsl: data.enableTsl,
        timeoutInSeconds: data.timeoutInSeconds,
        defaultFromEmail: data.defaultFromEmail,
        isActive: data.isActive,
        createdOn: mode === 'add' ? new Date().toISOString() : undefined,
        updatedOn: mode === 'edit' ? new Date().toISOString() : undefined,
        createdBy: "User",
        organizationCode: tenantCode || "Midhani",
        tenantCode: tenantCode || "Midhani",
      }

      // Add _id for edit mode
      if (mode === 'edit' && recordId) {
        mailConfigData._id = recordId
      }

      const payload = {
        tenant: tenantCode || "Midhani",
        action: "insert",
        id: recordId,
        collectionName: "mail_server_config",
        data: mailConfigData
      }
      await postConfig(payload)
    } catch (error) {
      console.error("Error saving mail configuration:", error)
      throw error
    }
  }

  if (configLoading && (mode === 'edit' || mode === 'view')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <MailConfigurationForm
      isOpen={isFormOpen}
      onClose={handleCloseForm}
      onSubmit={handleSubmit}
      initialData={initialData}
      mode={mode as 'add' | 'edit' | 'view'}
    />
  )
}
