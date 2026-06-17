"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import ShiftList from "./shift-list";
import ShiftForm from "./shift-form";
import ShiftZoneForm from "../../../_components/shift-zone-form";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { toast } from "react-toastify";
import LoadingOverlay from "../../../_components/LoadingOverlay";
import ShiftViewModal from "./ShiftViewModal";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import PageNotFound from "@/components/page-notfound";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import SidebarFromHeader from "@/components/header/sidebar-from-header";
import ActionDataTable from "@/components/common/action-data-table";
import ShiftListFilterBar from "../../../_components/shift-list-filter-bar";
import { SubFormTitle } from "@/components/header/sub-form-title";


export default function ShiftsForm() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showSuccess, setShowSuccess] = useState(false);
    const [isShiftFormOpen, setIsShiftFormOpen] = useState(false);
    const [editShift, setEditShift] = useState<any>(null);
    const [deleteShift, setDeleteShift] = useState<any>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [viewShift, setViewShift] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isShiftZoneFormOpen, setIsShiftZoneFormOpen] = useState(false);
    const [editShiftGroup, setEditShiftGroup] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedField, setSelectedField] = useState("shiftName");
    const [viewMode, setViewMode] = useState<any>(false);
    const [editMode, setEditMode] = useState<any>(false);
    const [addMode, setAddMode] = useState<any>(false);
    const [deleteMode, setDeleteMode] = useState<any>(false);
    const tenantCode = useGetTenantCode()


    
    const contractorEmployee = "shiftsLists"
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
    // Get the id from query parameters
    const shiftId = searchParams.get('id');

    const {
        post: postShiftZone,
        loading: postLoading,
        error: postError,
        data: postData,
      } = usePostRequest<any>({
        url: "shift",
        onSuccess: async (data) => {
          if (fetchAttendance) {
            await fetchAttendance();
          }
          toast.success("✅ Shift updated successfully!", {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        },
        onError: (error) => {
          toast.error("❌ Failed to update shift. Please try again.", {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          console.error("POST error:", error);
        },
      });

    const {
        data: attendanceResponse,
        loading: isLoading,
        error: attendanceError,
        refetch: fetchAttendance
    } = useRequest<any>({
        url: 'shift/search',
        method: 'POST',
        data: [
            {
                field: "tenantCode",
                operator: "eq",
                value: tenantCode
            },
            {
                field: "_id",
                operator: "eq",
                value: shiftId
            },
        ],
        dependencies: []
    });

    useEffect(() => {
        fetchAttendance();
    }, []);


    // Find the shift by id
    const shiftData = useMemo(() => {
        if (!attendanceResponse || !Array.isArray(attendanceResponse)) return null;
        return attendanceResponse.find((item: any) => (item._id?.$oid || item._id) === shiftId);
    }, [attendanceResponse, shiftId]);

    // Filter shifts by search term (shiftName)
    const filteredShifts = useMemo(() => {
        if (!shiftData?.shift) return [];
        if (!searchTerm) return shiftData.shift;
        const normalizedSearch = searchTerm.toLowerCase();
        return shiftData.shift.filter((s: any) => {
            const fieldMap: Record<string, string> = {
                shiftName: s.shiftName || "",
                shiftCode: s.shiftCode || "",
                shiftStart: s.shiftStart || "",
                shiftEnd: s.shiftEnd || "",
            };
            return fieldMap[selectedField]?.toLowerCase().includes(normalizedSearch);
        });
    }, [shiftData, searchTerm, selectedField]);


    const existingShiftGroupCodes = attendanceResponse ? attendanceResponse.map((item: any) => item.shiftGroupCode?.toLowerCase()).filter(Boolean) : [];
    const existingShiftGroupNames = attendanceResponse ? attendanceResponse.map((item: any) => item.shiftGroupName?.toLowerCase()).filter(Boolean) : [];
    const employeeCategoryRows = Array.isArray(shiftData?.employeeCategory)
        ? shiftData.employeeCategory.map((code: string, index: number) => {
            const matchedCategory = Array.isArray(attendanceResponse?.[0]?.employeeCategory)
                ? attendanceResponse[0].employeeCategory.find((item: any) => item?.employeeCategoryCode === code)
                : null;
            return {
                code,
                name: matchedCategory?.employeeCategoryName || code,
                index,
            };
        })
        : [];

    return (
       <div className="pb-2"> {
            (viewMode || editMode || addMode  || deleteMode) ? (
                <><div className="px-12 pt-0 py-6 h-full ">
            {/* Loading overlay for post request */}
            {postLoading && (
                <LoadingOverlay message="Updating shift, please wait..." />
            )}
            <div className="relative z-40">
                <SidebarFromHeader
                    title="Shift Management"
                    description="Manage shifts and schedules"
                    canAdd={editMode && !!shiftData}
                    onAddNew={() => {
                        if (!shiftData) return;
                        setEditShiftGroup(shiftData);
                        setIsShiftZoneFormOpen(true);
                    }}
                    addButtonText="Update Shift Group Code"
                    showBackButton={true}
                    onBack={() => router.push("/policy-management/shift")}
                />
                {isLoading && <div className="mt-4 text-lg">Loading...</div>}
                {attendanceError && <div className="mt-4 text-lg text-red-500">Error loading shift data</div>}

                {!isLoading && !attendanceError && !shiftData && (
                    <div className="mt-4 text-lg text-gray-500">Shift not found</div>
                )}
            </div>

            {!isLoading && !attendanceError && shiftData && (
                <div className="mx-auto mt-4 grid max-w-7xl pb-2 grid-cols-1 gap-4 px-0 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-5 py-2 border-b border-gray-200">
                            <h3 className="text-base font-semibold text-gray-700">Shift Group Details</h3>
                        </div>
                        <div className="px-5 py-2">
                            <div className="flex items-center justify-between border-b border-gray-200 py-2">
                                <span className="text-sm font-medium text-gray-500">Shift Group Name</span>
                                <span className="text-sm font-medium text-gray-900">{shiftData.shiftGroupName || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-200 py-2">
                                <span className="text-sm font-medium text-gray-500">Shift Group Code</span>
                                <span className="text-sm font-medium text-gray-900">{shiftData.shiftGroupCode || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-200 py-2">
                                <span className="text-sm font-medium text-gray-500">Subsidiary</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {shiftData.subsidiary?.subsidiaryName || "N/A"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-200 py-2">
                                <span className="text-sm font-medium text-gray-500">Total Shifts</span>
                                <span className="text-sm font-medium text-gray-900">{Array.isArray(shiftData.shift) ? shiftData.shift.length : 0}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-200 py-2">
                                <span className="text-sm font-medium text-gray-500">Location</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {shiftData.location?.locationName || "N/A"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm font-medium text-gray-500">Status</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {shiftData.isActive === false ? "Inactive" : "Active"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-5 py-2 border-b border-gray-200">
                            <h3 className="text-base font-semibold text-gray-700">Employee Categories</h3>
                        </div>
                        <div className="px-5 py-3">
                            <ActionDataTable
                                rows={employeeCategoryRows}
                                columns={[
                                    {
                                        key: "code",
                                        label: "Category Code",
                                        render: (row:any) => row?.code,
                                    },
                                    {
                                        key: "name",
                                        label: "Category Name",
                                        render: (row) => row?.name,
                                    },
                                ]}
                                searchFields={[
                                    {
                                        value: "code",
                                        label: "Code",
                                        getValue: (row) => row?.code,
                                    },
                                    {
                                        value: "name",
                                        label: "Name",
                                        getValue: (row) => row?.name,
                                    },
                                ]}
                                defaultSearchField="code"
                                pageSize={3}
                                isViewMode={true}
                                getRowKey={(row) => `${row?.code}-${row?.index}`}
                                emptyTitle="No employee categories found."
                                emptyDescription="No categories are assigned to this shift group."
                            />
                        </div>
                    </div>
                </div>
            )}
            
            <div className="mt-2 mx-auto max-w-7xl -mb-1">
                <SubFormTitle title="Shift List Overview" />
            </div>
            <ShiftListFilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedField={selectedField}
                setSelectedField={setSelectedField}
                searchFields={[
                    { value: "shiftName", label: "Shift Name" },
                    { value: "shiftCode", label: "Shift Code" },
                    { value: "shiftStart", label: "Shift Start" },
                    { value: "shiftEnd", label: "Shift End" },
                ]}
                filtersApplied={true}
                onFilterClick={() => {}}
                selectedFilterLabel=""
                showAddButton={addMode}
                addButtonLabel="Add New Shift"
                onAddClick={() => {
                    setEditShift(null);
                    setIsShiftFormOpen(true);
                }}
            />

            <ShiftList
                shiftData={{...shiftData, shift: filteredShifts}}
                onEditShift={(shift) => {
                    setEditShift(shift);
                    setIsShiftFormOpen(true);
                }}
                onDeleteShift={(shift) => {
                    setDeleteShift(shift);
                    setIsDeleteModalOpen(true);
                }}
                onViewShift={(shift) => {
                    setViewShift(shift);
                    setIsViewModalOpen(true);
                }}
                permission={
                    {
                        viewMode: viewMode,
                        editMode: editMode,
                        deleteMode: deleteMode,
                    }
                }
            />
            <ShiftForm
                isOpen={isShiftFormOpen}
                onClose={() => {
                    setIsShiftFormOpen(false);
                    setEditShift(null);
                }}
                initialValues={editShift || {}}
                onSubmit={() => {
                    fetchAttendance();
                }}
                shiftData={shiftData}
            />
            <ShiftZoneForm
                isOpen={isShiftZoneFormOpen}
                onClose={() => {
                    setIsShiftZoneFormOpen(false);
                    setEditShiftGroup(null);
                }}
                onSubmit={() => {
                    setIsShiftZoneFormOpen(false);
                    setEditShiftGroup(null);
                    fetchAttendance();
                }}
                initialData={editShiftGroup}
                isEdit={!!editShiftGroup}
                existingShiftGroupCodes={existingShiftGroupCodes}
                existingShiftGroupNames={existingShiftGroupNames}
            />
            {/* Delete confirmation modal */}
            {isDeleteModalOpen && deleteShift && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center">
                        <div className="mb-4 text-xl font-semibold text-gray-800">Confirm Delete</div>
                        <div className="mb-6 text-gray-600">Are you sure you want to delete shift <span className="font-bold">{deleteShift.shiftName}</span>?</div>
                        <div className="flex gap-4">
                            <button
                                className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                                onClick={() => setIsDeleteModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-6 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                                onClick={() => {
                                    // Remove the shift and update
                                    const newShiftData = {
                                        ...shiftData,
                                        shift: Array.isArray(shiftData?.shift)
                                            ? shiftData.shift.filter((s: any) => s.shiftCode !== deleteShift.shiftCode)
                                            : [],
                                    };
                                    const formattedData = {
                                        tenant: tenantCode,
                                        action: "insert",
                                        id: newShiftData._id,
                                        collectionName: "shift",
                                        data: newShiftData
                                    };
                                    postShiftZone(formattedData);
                                    setIsDeleteModalOpen(false);
                                    setDeleteShift(null);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ShiftViewModal
                shift={viewShift}
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
            />
        </div>
        </>
            ) : (
                <PageNotFound />
            )
        }</div>
    );
}
