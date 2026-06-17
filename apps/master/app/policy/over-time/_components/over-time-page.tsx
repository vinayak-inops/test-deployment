"use client"

import Table from "@repo/ui/components/table-dynamic/data-table";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react"
import { Clock } from "lucide-react";
import EnhancedHeader from "@/components/common/enhanced-header";
import OTPolicyForm from "./OTPolicyForm";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";

const transformToUnderscore = (param: string) => {
    return param
        .replace(/-/g, '_') // Replace all hyphens with underscores
        .replace(/([A-Z])/g, '_$1') // Add underscore before capital letters
        .toLowerCase() // Convert to lowercase
        .replace(/^_/, ''); // Remove leading underscore if exists
};

// Function to filter out object values and replace with empty strings
const filterObjectValues = (data: any[]): any[] => {
    return data.map(item => {
        const filteredItem: any = {};
        Object.keys(item).forEach(key => {
            const value = item[key];
            
            // Handle specific nested objects to extract their values
            if (key === 'subsidiary' && typeof value === 'object' && value !== null) {
                filteredItem[key] = value.subsidiaryCode || "";
            } else if (key === 'location' && typeof value === 'object' && value !== null) {
                filteredItem[key] = value.locationCode || "";
            } else if (key === 'otPolicy' && typeof value === 'object' && value !== null) {
                filteredItem['Policy Name'] = value.otPolicyName || "";
                filteredItem['Policy Code'] = value.otPolicyCode || "";
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // For other objects, still replace with empty string
                filteredItem[key] = "";
            } else {
                filteredItem[key] = value;
            }
        });
        return filteredItem;
    });
};

export default function OverTimePage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const [subOrganization, setSubOrganization] = useState<any[]>([])
    const [originalData, setOriginalData] = useState<any[]>([]) // Store original data
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editData, setEditData] = useState<any>(null)
    const [isEditMode, setIsEditMode] = useState(false)
    const [deleteData, setDeleteData] = useState<any>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [viewMode, setViewMode] = useState<any>(false);
    const [editMode, setEditMode] = useState<any>(false);
    const [addMode, setAddMode] = useState<any>(false);
    const [deleteMode, setDeleteMode] = useState<any>(false);
    const [duplicateData, setDuplicateData] = useState<any[]>([])
    const [isViewMode, setIsViewMode] = useState(false)
    const [viewData, setViewData] = useState<any>(null)
    const [table,setTable] = useState<any>([])
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

    const contractorEmployee = "overTime"
    // Centralized role-permissions
    const { responseData: rolePermissions } = useRolePermissions({
        serviceName: 'policy',
        screenName: contractorEmployee,
    })
    useEffect(() => {
        setViewMode(!!rolePermissions?.view)
        setEditMode(!!rolePermissions?.edit)
        setAddMode(!!rolePermissions?.add)
        setDeleteMode(!!rolePermissions?.delete)
    }, [rolePermissions])

    // Get the mode from URL search params
    const mode = searchParams.get('mode')
    const editId = searchParams.get('id')
    const isFormMode = mode === 'edit' || mode === 'add'

    const {
        data: otData,
        error,
        loading,
        refetch
    } = useRequest<any[]>({
        url: `map/ot_policy/search?tenantCode=${tenantCode}`,
        onSuccess: (data) => {
            // Store original data for edit functionality
            setOriginalData(data);
            // Filter out object values and replace with empty strings for table display
            const filteredData = filterObjectValues(data);
            setSubOrganization(filteredData);

            const updateData= data.map((item: any) => {
                return {
                    _id: item._id,
                    subsidiary: item.subsidiary.subsidiaryCode,
                    location: item.location.locationCode,
                    employeeCategory: item.employeeCategory,
                    otPolicy: item.otPolicy.otPolicyName,
                    otPolicyCode: item.otPolicy.otPolicyCode,
                    createdOn: formatDateTime(item.createdOn)||"",
                    createdBy: item.createdBy||"",
                }
            })
            setTable(updateData)

            const dumpli = data.map((item: any) => {
                return {
                    _id: item._id,
                    otPolicyCode: item.otPolicy.otPolicyCode,
                }
            })
            setDuplicateData(dumpli)
        },
        onError: (error) => {
            console.error('Error loading OT policy data:', error);
        }
    });

    useEffect(() => {
        refetch()
    }, [])

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
                function: () => {
                    setIsEditMode(false)
                    setIsViewMode(false)
                    setEditData(null)
                    setViewData(null)
                    setDeleteData(null)
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
                status: deleteMode,
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
                label: "link",
                status: viewMode,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: (item: any) => { 
                    // Find the original data item based on _id
                    const originalItem = originalData.find(orig => orig._id === item._id);
                    
                    if (originalItem) {
                    setIsEditMode(false)
                    setIsViewMode(true)
                        setViewData(originalItem) // Use original data with nested objects
                        setDeleteData(null)
                        setIsFormOpen(true)
                    } else {
                        console.error("Original data not found for item:", item);
                        // Fallback: use the table item
                    setIsEditMode(false)
                    setIsViewMode(true)
                        setViewData(item)
                        setDeleteData(null)
                        setIsFormOpen(true)
                    }
                },
            },
            actionEdit: {
                label: "Edit",
                status: editMode,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: (item: any) => {
                    // Find the original data item based on _id
                    const originalItem = originalData.find(orig => orig._id === item._id);
                    
                    if (originalItem) {
                    setIsViewMode(false)
                    setViewData(null)
                    setIsEditMode(true)
                        setEditData(originalItem) // Use original data with nested objects
                        setDeleteData(null)
                        setIsFormOpen(true)
                    } else {
                        console.error("Original data not found for item:", item);
                        // Fallback: use the table item
                    setIsViewMode(false)
                    setViewData(null)
                    setIsEditMode(true)
                        setEditData(item)
                        setDeleteData(null)
                        setIsFormOpen(true)
                    }
                },
            },
        },
    }

    const handleConfirmDelete = () => {
        if (itemToDelete) {
            // Find the original data item based on _id
            const originalItem = originalData.find(orig => orig._id === itemToDelete._id);
            
            if (originalItem) {
                setDeleteData(originalItem);
                setIsEditMode(false); // Not edit mode for delete
                setEditData(null);
                setIsFormOpen(true);
            } else {
                console.error("Original data not found for delete:", itemToDelete);
            }
            
            // Close the confirmation popup
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
        setItemToDelete(null);
    };

         // Handle form success
     const handleFormSuccess = (updatedData: any) => {
         // Refresh the data
         refetch()
         setIsFormOpen(false)
         setEditData(null)
         setIsEditMode(false)
         setViewData(null)
         setIsViewMode(false)
         setDeleteData(null)
         
         // Reset form state to ensure clean state for next use
     }

    // Handle server update
    const handleServerUpdate = async () => {
        await refetch()
    }

    // Show the table view with form modal
    return (
        <div>
            <EnhancedHeader
                title={"Overtime Policy"}
                description={"Overtime Policy Management"}
                IconComponent={Clock}
                recordCount={otData && otData.length > 0 ? otData.length : 0}
                organizationType={"Overtime Policy"}
                lastSync={2}
                uptime={99.9}
            />
            {
               subOrganization && subOrganization.length >= 0 && (<Table
                functionalityList={functionalityList}
                data={[...table].reverse()}
            />)
            }
            
                         {/* OT Policy Form Modal */}
             <OTPolicyForm
                 open={isFormOpen}
                 setOpen={setIsFormOpen}
                 otData={originalData} // Pass actual OT policy data array
                 onSuccess={handleFormSuccess}
                 onServerUpdate={handleServerUpdate}
                 editData={editData}
                 isEditMode={isEditMode}
                 isViewMode={isViewMode}
                 viewData={viewData}
                 deleteValue={deleteData}
                 duplicateData={duplicateData}
             />

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
                        
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete this overtime policy? This will permanently remove the record from the system.
                        </p>
                        
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCancelDelete}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}