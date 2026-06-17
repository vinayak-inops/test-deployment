"use client"

import Table from "@repo/ui/components/table-dynamic/data-table"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import WorkOrderCompletionForm from "./work-order-completion-form"
import EnhancedHeader from "@/components/common/enhanced-header"
import { CheckCircle } from "lucide-react"
import { GeneratePassPopup } from "./generate-pass-popup"
import PageNotFound from "@/components/page-notfound"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

export default function WorkOrderCompletionPage() {
    const router = useRouter()
    const [rows, setRows] = useState<any[]>([])
    const [fullRows, setFullRows] = useState<any[]>([])
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [isViewMode, setIsViewMode] = useState(false)
    const [editData, setEditData] = useState<any>(null)
    const [deleteData, setDeleteData] = useState<any>(null)
    const [itemToDelete, setItemToDelete] = useState<any>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isPopupOpen, setIsPopupOpen] = useState(false)
    const [popupFileId, setPopupFileId] = useState<string | null>(null)
    const [workOrderNumber, setWorkOrderNumber] = useState<string | null>(null)
    const tenantCode = useGetTenantCode()

    const formatDateTime = (value: any) => {
        if (!value) return ""
        const date = new Date(value)
        if (isNaN(date.getTime())) return String(value)
        return date.toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      }

    const [permView, setPermView] = useState(false)
    const [permEdit, setPermEdit] = useState(false)
    const [permAdd, setPermAdd] = useState(false)
    const [permDelete, setPermDelete] = useState(false)

    // Centralized role-permissions
    const { responseData: rolePermissions } = useRolePermissions({
        serviceName: 'setting',
        screenName: 'workOrderCompletion',
    })
    useEffect(() => {
        setPermView(!!rolePermissions?.view)
        setPermEdit(!!rolePermissions?.edit)
        setPermAdd(!!rolePermissions?.add)
        setPermDelete(!!rolePermissions?.delete)
    }, [rolePermissions])

    const { data, loading, error, refetch } = useRequest<any[]>({
        url: `map/workOrderCompletionApplication/search?tenantCode=${tenantCode}`,
        onSuccess: (d) => {
            setFullRows(d || [])
            setRows((d || []).map((r: any) => ({
                _id: r._id,
                contractorCode: r.contractorCode,
                workOrderNumber: r.workOrderNumber,
                remarks: r.remarks,
                createdOn: formatDateTime(r.createdOn),
                createdBy: r.createdBy
            })))
        },
        onError: (e) => {
            console.error('Failed to load work order completions', e)
        }
    })

    useEffect(() => {
        refetch()
    }, [data])

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
                status: permEdit || permView || permAdd,
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
                status: permAdd,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: () => {
                    setIsEditMode(false)
                    setIsViewMode(false)
                    setEditData(null)
                    setIsFormOpen(true)
                },
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
                status: permDelete,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: (item: any) => {
                    setItemToDelete(item);
                    setShowDeleteConfirm(true);
                },
            },
            actionLink: {
                label: "View",
                status: permView,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: (item: any) => {
                    const found = fullRows.find(r => r._id === item._id) || item
                    setPopupFileId(found._id)
                    setIsPopupOpen(true)
                    setWorkOrderNumber(found.workOrderNumber)
                },
            },
            actionEdit: {
                label: "Edit",
                status: permEdit,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: (item: any) => {
                    // Find the original data item based on _id
                    const originalItem = fullRows.find(orig => orig._id === item._id);

                    if (originalItem) {
                        setIsEditMode(true)
                        setIsViewMode(false)
                        setEditData(originalItem) // Use original data with nested objects
                        setIsFormOpen(true)
                    } else {
                        console.error("Original data not found for item:", item);
                        // Fallback: use the table item
                        setIsEditMode(true)
                        setIsViewMode(false)
                        setEditData(item)
                        setIsFormOpen(true)
                    }
                },
            },
        },
    }

    return (
        <>
            {
                (permView || permEdit || permAdd) ? (
                    <>
                        <div>
                            <EnhancedHeader
                                title={"Work Order Completion"}
                                description={"Manage work order completion requests"}
                                IconComponent={CheckCircle}
                                recordCount={rows?.length || 0}
                                organizationType={"work-order-completion"}
                                lastSync={2}
                                uptime={99.9}
                            />

                            {
                                rows && rows.length >= 0 && (<Table functionalityList={functionalityList} data={[...rows].reverse()} />)
                            }

                            <WorkOrderCompletionForm
                                open={isFormOpen}
                                setOpen={setIsFormOpen}
                                editData={editData}
                                isEditMode={isEditMode}
                                isViewMode={isViewMode}
                                deleteValue={deleteData}
                                onSuccess={() => { setIsFormOpen(false); setEditData(null); setDeleteData(null); setIsEditMode(false); refetch() }}
                                onServerUpdate={async () => { await refetch() }}
                            />

                            <GeneratePassPopup
                                isOpen={isPopupOpen}
                                onClose={() => {
                                    setIsPopupOpen(false)
                                    setPopupFileId(null)
                                    setWorkOrderNumber(null)
                                }}
                                workOrderNumber={workOrderNumber}
                                fileId={popupFileId}
                                statusShower={null}
                            />
                        </div>
                    </>
                ) : (
                    <PageNotFound />
                )
            }
        </>
    )
}