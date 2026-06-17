"use client"

import Table from "@repo/ui/components/table-dynamic/data-table";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Shield } from "lucide-react";

import { LeaveManagementForm } from "./forms/leave-management-form";
import EnhancedHeader from "./forms/enhanced-header";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import PageNotFound from "@/components/page-notfound";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";

const transformToUnderscore = (param: string) => {
    return param
        .replace(/-/g, '_') // Replace all hyphens with underscores
        .replace(/([A-Z])/g, '_$1') // Add underscore before capital letters
        .toLowerCase() // Convert to lowercase
        .replace(/^_/, ''); // Remove leading underscore if exists
};



export default function LeavePolicyPage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const [subOrganization, setSubOrganization] = useState<any[]>([])
    const [viewMode, setViewMode] = useState<any>(false);
    const [editMode, setEditMode] = useState<any>(false);
    const [addMode, setAddMode] = useState<any>(false);
    const [deleteMode, setDeleteMode] = useState<any>(false);
    const [duplicateData, setDuplicateData] = useState<any>(null);
    const tenantCode = useGetTenantCode()



    const rolePermissionsEmployee = "leavePolicy"

    // Centralized role-permissions
    const { responseData: rolePermissions } = useRolePermissions({
        serviceName: "policy",
        screenName: "leavePolicy",
    });
    useEffect(() => {
        setViewMode(rolePermissions?.view || false)
        setEditMode(rolePermissions?.edit || false)
        setAddMode(rolePermissions?.add || false)
        setDeleteMode(rolePermissions?.delete || false)
    }, [rolePermissions])

    // Get the mode from URL search params
    const mode = searchParams.get('mode')
    const isFormMode = mode === 'edit' || mode === 'add' || mode === 'view'

    // const transformedParam = transformToUnderscore(params["contractor-employee"][0])

    const {
        data,
        error,
        loading,
        refetch
    } = useRequest<any[]>({
        url: `map/leave_policy/search?tenantCode=${tenantCode}`,
        onSuccess: (data) => {
            // Filter out object values and replace with empty strings
            const filteredData = data
            const updateData = filteredData.map((item: any) => {
                return {
                    _id: item._id,
                    subsidiary: item.subsidiary.subsidiaryCode,
                    location: item.location.locationCode,
                    employeeCategory: item.employeeCategory,
                    leavePolicy: item.leavePolicy.leaveTitle,
                    leavePolicyCode: item.leavePolicy.leaveCode,
                }
            })
            const duplicateData = filteredData.map((item: any) => {
                return {
                    _id: item._id,
                    leaveCode: item.leavePolicy.leaveCode,
                    leaveTitle: item.leavePolicy.leaveTitle,
                }
            });
            setDuplicateData(duplicateData);
            setSubOrganization(updateData);
        },
        onError: (error) => {
            console.error('Error loading organization data:', error);
        }
    });

    useEffect(() => {   
        refetch()
    }, [mode])

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
                function: () => router.push("/leave-policy?mode=add"),
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
                function: (id: string) => {},
            },
            actionLink: {
                label: "link",
                status: viewMode,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: (item: any) => { router.push(`/leave-policy?mode=view&id=${item?._id}`) },
            },
            actionEdit: {
                label: "Edit",
                status: editMode,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: (data: any) => router.push(`/leave-policy?mode=edit&id=${data?._id}`),
            },
        },
    }

    // If in form mode, show the LeaveManagementForm
    if (isFormMode) {
        return (
            <>
                {
                    ((viewMode && mode === "view") || (editMode && mode === "edit") || (addMode && mode === "add")) ? (
                        <div className="px-12 py-4">
                            <LeaveManagementForm duplicateData={duplicateData} />
                        </div>
                    ) : (
                        <PageNotFound />
                    )
                }
            </>
        );
    }

    // Otherwise show the table view
    return (
        <>
        {
            (viewMode || editMode || addMode) ? (
                <>
                <div>
            <EnhancedHeader
                title={"Leave Policy"}
                description={"Leave Policy Management"}
                IconComponent={Shield}
                recordCount={data && data.length > 0 ? data.length : 0}
                organizationType={"Leave Policy"}
                lastSync={2}
                uptime={99.9}
            />
            {
               subOrganization && subOrganization.length >= 0 && (<Table
                functionalityList={functionalityList}
                data={[...subOrganization].reverse()}
            />)
            }
        </div>
                </>
            ) : (
                <PageNotFound />
            )
        }
        </>
    );
}