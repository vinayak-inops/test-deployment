"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "react-toastify";
import CompanyEmployeeTable, { type Employee } from "./company-employee-table";
import SidebarFromHeader from "@/components/header/sidebar-from-header";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info";
import { encryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto";
import { BasicInformationPopupForm } from "./basic-information-popup-form";
import AddCompanyEmployeeDraftInfoPopup from "./add-company-employee-draft-info-popup";
import { Input } from "@repo/ui/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";

interface CompanyEmployeeListViewProps {
  viewMode: boolean;
  editMode: boolean;
  addMode: boolean;
  deleteMode: boolean;
  refreshTick: number;
  onDuplicateDataChange: (data: any[]) => void;
}

export default function CompanyEmployeeListView({
  viewMode,
  editMode,
  addMode,
  deleteMode,
  refreshTick,
  onDuplicateDataChange,
}: CompanyEmployeeListViewProps) {
  const router = useRouter();

  const [employeeData, setEmployeeData] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<any>(null);
  const [deleteData, setDeleteData] = useState<any>(null);
  const [duplicateData, setDuplicateData] = useState<any[]>([]);
  const [isAddEmployeePopupOpen, setIsAddEmployeePopupOpen] = useState(false);
  const [isDraftListOpen, setIsDraftListOpen] = useState(false);
  const deleteDataRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchField, setSearchField] = useState<"employeeID" | "firstName" | "lastName" | "aadharNumber">("employeeID");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    deleteDataRef.current = deleteData;
  }, [deleteData]);

  const [itemsPerPage, setItemsPerPage] = useState(5);
  const tenantCode = useGetTenantCode();
  const { employeeId } = useKeyclockRoleInfo();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const apiCriteria = useMemo(
    () => [
      {
        field: "tenantCode",
        value: tenantCode,
        operator: "eq",
      },
      {
        field: "createdOn",
        value: "",
        operator: "desc",
      },
      ...(debouncedSearchTerm.trim()
        ? [
            {
              field: searchField,
              value: debouncedSearchTerm.trim(),
              operator: "like",
            },
          ]
        : []),
    ],
    [tenantCode, searchField, debouncedSearchTerm]
  );

  const { refetch: refetchCount } = useRequest<any>({
    url: "company_employee/count",
    method: "POST",
    data: apiCriteria,
    onSuccess: (data: any) => {
      if (data !== null && data !== undefined) {
        setTotalCount(data || 0);
      }
    },
    onError: (error: any) => {
      console.error("Error fetching company employee count:", error);
    },
  });

  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage]);
  const limit = itemsPerPage;

  const { loading: isLoadingEmployee, refetch: refetchCompanyEmployee } = useRequest<any>({
    url: `company_employee/search?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: apiCriteria,
    onSuccess: (data) => {
      if (data !== null && data !== undefined) {
        const active = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true);

        const transformedData = active.map((item: any) => ({
          _id: typeof item._id === "object" && item._id?.$oid ? item._id : item._id || "",
          employeeID: item?.employeeID || "",
          firstName: item?.firstName || "",
          lastName: item?.lastName || "",
          middleName: item?.middleName || "",
          gender: item?.gender || "",
          birthDate: item?.birthDate || "",
          nationality: item?.nationality || "",
          photo: item?.photo || "",
          address: item?.address || {
            permanentAddress: {
              addressLine1: "",
              addressLine2: "",
              country: "",
              state: "",
              city: "",
              pinCode: "",
            },
          },
          deployment: item?.deployment
            ? {
                subsidiary: item.deployment.subsidiary || { subsidiaryCode: "", subsidiaryName: "" },
                division: item.deployment.division || { divisionCode: "", divisionName: "" },
                department: item.deployment.department || { departmentCode: "", departmentName: "" },
                subDepartment: item.deployment.subDepartment,
                section: item.deployment.section || { sectionCode: "", sectionName: "" },
                employeeCategory: item.deployment.employeeCategory
                  ? {
                      employeeCategoryCode: item.deployment.employeeCategory.employeeCategoryCode || "",
                      employeeCategoryName: item.deployment.employeeCategory.employeeCategoryName || "",
                      employeeCategoryTitle: item.deployment.employeeCategory.employeeCategoryTitle || "",
                    }
                  : { employeeCategoryCode: "", employeeCategoryName: "" },
                grade: item.deployment.grade
                  ? {
                      gradeCode: item.deployment.grade.gradeCode || "",
                      gradeName: item.deployment.grade.gradeName || "",
                      gradeTitle: item.deployment.grade.gradeTitle || "",
                    }
                  : { gradeCode: "", gradeName: "" },
                designation: item.deployment.designation || { designationCode: "", designationName: "" },
                location: item.deployment.location || { locationCode: "", locationName: "" },
                skillLevel: item.deployment.skillLevel,
              }
            : {
                subsidiary: { subsidiaryCode: "", subsidiaryName: "" },
                division: { divisionCode: "", divisionName: "" },
                department: { departmentCode: "", departmentName: "" },
                section: { sectionCode: "", sectionName: "" },
                employeeCategory: { employeeCategoryCode: "", employeeCategoryName: "" },
                grade: { gradeCode: "", gradeName: "" },
                designation: { designationCode: "", designationName: "" },
                location: { locationCode: "", locationName: "" },
              },
          dateOfJoining: item?.dateOfJoining || item?.joiningDate || "",
          joiningDate: item?.joiningDate || item?.dateOfJoining || "",
          status: item?.status || { currentStatus: "" },
          contactNumber: item?.contactNumber || { primaryContactNo: "" },
          emailID: item?.emailID || { primaryEmailID: "" },
          aadharNumber: item?.aadharNumber || "",
          manager: item?.manager,
          superviser: item?.superviser,
        }));

        const duplicates = active.map((item: any) => ({
          _id: item._id,
          employeeID: item.employeeID,
          aadharNumber: item.aadharNumber,
        }));

        setDuplicateData(duplicates);
        onDuplicateDataChange(duplicates);
        setEmployeeData(transformedData);
      }
    },
    onError: (error) => {
      console.error("Error fetching company employee data:", error);
      onDuplicateDataChange([]);
      setEmployeeData([]);
    },
  });

  useEffect(() => {
    refetchCompanyEmployee();
    refetchCount();
  }, [refreshTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  useEffect(() => {
    if (currentPage > 0) {
      refetchCompanyEmployee();
    }
  }, [currentPage, searchField, debouncedSearchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setCurrentPage(1);
  }, [searchField, debouncedSearchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  const handleAddNew = useCallback(() => {
    setIsAddEmployeePopupOpen(true);
  }, []);

  const handleOpenDraftList = useCallback(() => {
    setIsDraftListOpen(true);
  }, []);

  const { post: postDelete } = usePostRequest<any>({
    url: "company_employee",
    onSuccess: () => {
      toast.success("Company Employee deleted successfully!");
    },
    onError: (error) => {
      toast.error("Company Employee deletion failed!");
      console.error("POST error:", error);
    },
  });

  const { refetch: fetchSingleData } = useRequest<any[]>({
    url: "company_employee/search",
    method: "POST",
    data: [{ field: "_id", value: deleteId, operator: "eq" }],
    onSuccess: (data: any) => {
      setDeleteData(data[0]);
    },
    onError: (err: any) => {
      console.error("Error loading company employee by id:", err);
    },
  });

  const handleCloseDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    setDeleteError(null);
    setDeleteLoading(false);
    setDeleteData(null);
  };

  const handleCancelDelete = () => {
    handleCloseDelete();
  };

  useEffect(() => {
    if (!showDeleteConfirm) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleteLoading) {
        handleCloseDelete();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showDeleteConfirm, deleteLoading]);

  const handleOpenDelete = async (deleteValue: Employee) => {
    setDeleteError(null);
    setDeleteData(null);
    setItemToDelete(deleteValue);
    setShowDeleteConfirm(true);
    setDeleteLoading(true);

    const employeeIdValue =
      typeof deleteValue._id === "object" && deleteValue._id?.$oid
        ? deleteValue._id.$oid
        : String(deleteValue._id || "");

    setDeleteId(employeeIdValue);
    await fetchSingleData();

    const start = Date.now();
    while (Date.now() - start < 2000) {
      if (
        deleteDataRef.current &&
        (deleteDataRef.current._id === employeeIdValue ||
          (typeof deleteDataRef.current._id === "object" &&
            deleteDataRef.current._id?.$oid === employeeIdValue))
      ) {
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    setDeleteLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const employeeIdValue =
        typeof itemToDelete._id === "object" && itemToDelete._id?.$oid
          ? itemToDelete._id.$oid
          : String(itemToDelete._id || "");

      setDeleteId(employeeIdValue);
      setDeleteError(null);
      setDeleteLoading(true);

      await new Promise((r) => setTimeout(r, 0));
      await fetchSingleData();

      const waitUntil = async (check: () => boolean, timeoutMs = 5000, intervalMs = 100) => {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
          if (check()) return;
          await new Promise((r) => setTimeout(r, intervalMs));
        }
        throw new Error("Timeout waiting for fetched record");
      };

      await waitUntil(() => {
        if (!deleteDataRef.current) return false;
        const currentId =
          typeof deleteDataRef.current._id === "object" && deleteDataRef.current._id?.$oid
            ? deleteDataRef.current._id.$oid
            : String(deleteDataRef.current._id || "");
        return currentId === employeeIdValue;
      });

      setDeleteLoading(false);
      const payload = deleteDataRef.current;

      const payloadId =
        typeof payload._id === "object" && payload._id?.$oid
          ? payload._id.$oid
          : String(payload._id || "");

      const postData = {
        tenant: tenantCode,
        action: "insert",
        id: payloadId,
        collectionName: "company_employee",
        data: {
          isDeleted: true,
          ...payload,
        },
      };

      await postDelete(postData);
      handleCloseDelete();
      refetchCompanyEmployee();
      refetchCount();
    } catch (err) {
      console.error("Delete failed", err);
      setDeleteLoading(false);
      setDeleteError("Couldn't fetch record. Please try again after some time.");
    }
  };

  return (
    <div>
      <SidebarFromHeader
        title="Company Employees"
        description="Manage and review company employee records"
        canAdd={addMode}
        onAddNew={handleAddNew}
        addButtonText="Add New Company Employee"
        onOpenDraftList={handleOpenDraftList}
        draftButtonText="Draft List"
      />
      <div className="px-6 py-4 pb-0">
        <div className="max-w-7xl mx-auto flex bg-muted/50 rounded-lg border">
          <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-52">
            <Select
              value={searchField}
              onValueChange={(value) =>
                setSearchField(value as "employeeID" | "firstName" | "lastName" | "aadharNumber")
              }
            >
              <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employeeID">Employee ID</SelectItem>
                <SelectItem value="firstName">First Name</SelectItem>
                <SelectItem value="lastName">Last Name</SelectItem>
                <SelectItem value="aadharNumber">Aadhar Number</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 flex items-center bg-background min-w-0">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder={`Search by ${searchField.replace(/([A-Z])/g, " $1").toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent w-full placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex items-center bg-background border-l rounded-r-lg px-3 py-2 w-36">
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 / page</SelectItem>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <BasicInformationPopupForm
        isOpen={isAddEmployeePopupOpen}
        duplicateData={duplicateData}
        onClose={() => {
          setIsAddEmployeePopupOpen(false);
          refetchCompanyEmployee();
          refetchCount();
        }}
      />
      <AddCompanyEmployeeDraftInfoPopup
        isOpen={isDraftListOpen}
        onClose={() => {
          setIsDraftListOpen(false);
          refetchCompanyEmployee();
          refetchCount();
        }}
      />

      <CompanyEmployeeTable
        employeeData={employeeData}
        loading={isLoadingEmployee}
        externalPagination={{
          currentPage,
          totalPages: Math.ceil(totalCount / itemsPerPage),
          totalItems: totalCount,
          itemsPerPage,
          startIndex,
          endIndex,
          onPageChange: handlePageChange,
        }}
        rolePermissions={{
          view: viewMode,
          edit: editMode,
          delete: deleteMode,
        }}
        onEdit={(employee: Employee) => {
          const employeeIdValue =
            typeof employee._id === "object" && employee._id?.$oid
              ? employee._id.$oid
              : String(employee._id || "");
          const encryptedData = encryptEmployeeData({ employeeId: employeeId || "", _id: employeeIdValue });
          router.push(`/company_management/company-employee?mode=edit&id=${encryptedData}`);
        }}
        onView={(employee: Employee) => {
          const employeeIdValue =
            typeof employee._id === "object" && employee._id?.$oid
              ? employee._id.$oid
              : String(employee._id || "");
          const encryptedData = encryptEmployeeData({ employeeId: employeeId || "", _id: employeeIdValue });
          router.push(`/company_management/company-employee?mode=view&id=${encryptedData}`);
        }}
        onDelete={(employee: Employee) => handleOpenDelete(employee)}
      />

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            if (!deleteLoading) handleCloseDelete();
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
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
                Are you sure you want to delete this company employee? This will permanently remove the record from
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
  );
}
