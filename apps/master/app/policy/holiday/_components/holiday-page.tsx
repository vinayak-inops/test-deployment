"use client"

import Table from "@repo/ui/components/table-dynamic/data-table";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react"
import { Calendar } from "lucide-react";
import EnhancedHeader from "@/components/common/enhanced-header";
import HolidayAddFormValidated from "./holiday-form";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";

const transformToUnderscore = (param: string) => {
    return param
        .replace(/-/g, '_') // Replace all hyphens with underscores
        .replace(/([A-Z])/g, '_$1') // Add underscore before capital letters
        .toLowerCase() // Convert to lowercase
        .replace(/^_/, ''); // Remove leading underscore if exists
};

// UPDATED: Function to extract specific nested values for table display
// UPDATED: Function to extract specific nested values for table display
const filterObjectValues = (data: any[]): any[] => {
    return data.map(item => {
        const filteredItem: any = {};
        Object.keys(item).forEach(key => {
            const value = item[key];
            
            // Handle specific nested objects to extract their values
            if (key === 'location' && typeof value === 'object' && value !== null) {
                filteredItem[key] = value.locationCode || "";
            } else if (key === 'holiday' && typeof value === 'object' && value !== null) {
                filteredItem['Holiday Date'] = value.holidayDate || "";  // Renamed column
                filteredItem['Holiday Name'] = value.holidayName || "";  // Added new column
                filteredItem['Holiday Type'] = value.holidayType || "";  // Added new column
            } else if (key === 'subsidiary' && typeof value === 'object' && value !== null) {
                filteredItem[key] = value.subsidiaryCode || "";
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


export default function HolidayPage() {
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


    const contractorEmployee = "holiday"
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

    // FIXED: This fetches holiday data (array of holiday documents)
    const {
        data: holidayData, // Renamed for clarity
        error,
        loading,
        refetch
    } = useRequest<any[]>({
        url: `map/holiday/search?tenantCode=${tenantCode}`,
        onSuccess: (data) => {
            // Store original data for edit functionality
            setOriginalData(data);

            const tableValue= data.map((item: any) => {
                return {
                    _id: item._id,
                    holidayName: item.holiday.holidayName,
                    holidayDate: item.holiday.holidayDate,
                    subsidiary: item.subsidiary.subsidiaryCode,
                    location: item.location.locationCode,
                    holidayType: item.holiday.holidayType,
                    createdOn: formatDateTime(item.createdOn)||"",
                    createdBy: item.createdBy||"",
                }
            })
            setTable(tableValue)
            // Filter and extract nested values for table display
            const filteredData = filterObjectValues(data);
            setSubOrganization(filteredData);
        },
        onError: (error) => {
            console.error('Error loading holiday data:', error);
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
                    setEditData(null)
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
                label: "View",
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
                        setEditData(originalItem) // Use original data with nested objects
                        setDeleteData(null)
                        setIsFormOpen(true)
                    } else {
                        console.error("Original data not found for item:", item);
                        // Fallback: use the table item
                        setIsEditMode(false)
                        setEditData(item)
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
                        setIsEditMode(true)
                        setEditData(originalItem) // Use original data with nested objects
                        setDeleteData(null)
                        setIsFormOpen(true)
                    } else {
                        console.error("Original data not found for item:", item);
                        // Fallback: use the table item
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
        setDeleteData(null)
    }

    // Handle server update
    const handleServerUpdate = async () => {
        await refetch()
    }

    // Show the table view with form modal
    return (
        <div>
            <EnhancedHeader
                title={"Holiday Policy"}
                description={"Holiday Policy Management"}
                IconComponent={Calendar}
                recordCount={holidayData && holidayData.length > 0 ? holidayData.length : 0}
                organizationType={"Holiday Policy"}
                lastSync={2}
                uptime={99.9}
            />
            {
               subOrganization && subOrganization.length >= 0 && (<Table
                functionalityList={functionalityList}
                data={[...table].reverse()}
            />)
            }
            
            {/* Holiday Form Modal - FIXED: Pass holiday data instead of organization data */}
            <HolidayAddFormValidated
                open={isFormOpen}
                setOpen={setIsFormOpen}
                holidayData={originalData} // Pass actual holiday data array
                onSuccess={handleFormSuccess}
                onServerUpdate={handleServerUpdate}
                editData={editData}
                isEditMode={isEditMode}
                isViewMode={!isEditMode && editData && !deleteData}
                deleteValue={deleteData}
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
                            Are you sure you want to delete this holiday policy? This will permanently remove the record from the system.
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