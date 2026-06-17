"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "react-toastify";
import ContractorTable from "./contractor-table";
import ContractorHeader from "./contractor-header";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info";
import { encryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto";
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy";
import AddContractorDraftInfoPopup from "./add-contractor-draft-info-popup";
import { BasicInformationDraftForm } from "./basic-information-draft-form";
import { Input } from "@repo/ui/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";

interface ContractorListViewProps {
  viewMode: boolean;
  editMode: boolean;
  addMode: boolean;
  deleteMode: boolean;
}

export default function ContractorListView({
  viewMode,
  editMode,
  addMode,
  deleteMode,
}: ContractorListViewProps) {
  const router = useRouter();
  const [contractorData, setContractorData] = useState<any[]>([]);
  const [duplicateData, setDuplicateData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isAddDraftOpen, setIsAddDraftOpen] = useState(false);
  const [isDraftListOpen, setIsDraftListOpen] = useState(false);
  const [searchField, setSearchField] = useState<"contractorCode" | "contractorName" | "organizationCode" | "workLocation">("contractorCode");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<"true" | "false" | "all">("true");

  const [itemsPerPage, setItemsPerPage] = useState(5);
  const tenantCode = useGetTenantCode();
  const { employeeId } = useKeyclockRoleInfo();
  const { hierarchyFilters } = useEmpHierarchy();

  const contractorCodes = useMemo(() => {
    return Array.from(
      new Set((hierarchyFilters?.contractors || []).map((code: any) => String(code).trim()).filter(Boolean))
    );
  }, [hierarchyFilters?.contractors]);

  const formatDateTime = (value: any) => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const mode = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("mode") : null;

  // Calculate offset and limit based on current page
  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage]);
  const limit = itemsPerPage;

  // Build API criteria array
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
      ...(contractorCodes.length > 0
        ? [{
            field: "contractorCode",
            value: contractorCodes,
            operator: "in",
          }]
        : []),
      {
        field: "createdOn",
        operator: "desc",
        value: "",
      },
      ...(isActiveFilter !== "all"
        ? [{
            field: "isActive",
            operator: "eq",
            value: isActiveFilter === "true",
          }]
        : []),
      ...(debouncedSearchTerm.trim()
        ? [{
            field: searchField,
            operator: "like",
            value: debouncedSearchTerm.trim(),
          }]
        : []),
    ],
    [tenantCode, contractorCodes, searchField, debouncedSearchTerm, isActiveFilter]
  );

  // Count API call to get total collection length
  const { refetch: refetchCount } = useRequest<any>({
    url: "contractor/count",
    method: "POST",
    data: apiCriteria,
    onSuccess: (data: any) => {
      if (data !== null && data !== undefined) {
        setTotalCount(data || 0);
      }
    },
    onError: (error: any) => {
      console.error("Error fetching contractor count:", error);
    },
  });

  // Fetch contractor data with pagination
  const {
    loading,
    refetch: refetchContractor,
  }: {
    loading: any;
    refetch: any;
  } = useRequest<any[]>({
    url: `contractor/search?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: apiCriteria,
    onSuccess: (data: any) => {
      if (data !== null && data !== undefined) {
        const active = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true);

        // Transform data to match Contractor interface format
        const transformedData = active.map((item: any) => ({
          _id: typeof item._id === "object" && item._id?.$oid ? item._id : { $oid: item._id || "" },
          contractorName: item.contractorName || "",
          contractorCode: item.contractorCode || "",
          typeOfCompany: item.typeOfCompany || "",
          organizationCode: item.organizationCode || "",
          workLocation: item.workLocation || "",
          serviceSince: item.serviceSince || "",
          workOrders: item.workOrders || [],
          contactPersonName: item.contactPersonName || "",
          contactPersonContactNo: item.contactPersonContactNo || "",
          contactPersonEmailId: item.contactPersonEmailId || "",
          ownerName: item.ownerName || "",
          licenses: item.licenses || [],
          securityDeposit: item.securityDeposit || [],
          contractorImage: item.contractorImage || "",
        }));

        const dummyData = active.map((item: any) => ({
          _id: item._id,
          contractorCode: item.contractorCode,
          aadharNumber: item.aadharNumber,
        }));

        setDuplicateData(dummyData);
        setContractorData(transformedData);
      }
    },
    onError: (error: any) => {
      console.error("Error fetching contractor data:", error);
      setContractorData([]);
    },
  });

  useEffect(() => {
    refetchContractor();
    refetchCount();
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setCurrentPage(1);
  }, [searchField, debouncedSearchTerm, isActiveFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Trigger API refetch when page changes
  useEffect(() => {
    if (currentPage > 0) {
      refetchContractor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchField, debouncedSearchTerm]);

  // Handle add new contractor navigation
  const handleAddNew = useCallback(() => {
    setIsAddDraftOpen(true);
  }, []);

  const handleOpenDraftList = useCallback(() => {
    setIsDraftListOpen(true);
  }, []);

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  const {
    post: postDelete,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "contractor",
    onSuccess: () => {
      toast.success("Contractor deleted successfully!");
    },
    onError: (error) => {
      toast.error("Contractor submission failed!");
      console.error("POST error:", error);
    },
  });

  // Centralized open/close handlers for delete popup
  const handleOpenDelete = (deleteValue: any) => {
    setDeleteError(null);
    setItemToDelete(deleteValue);
    setShowDeleteConfirm(true);
  };

  const handleCloseDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    setDeleteError(null);
  };

  // Close modal with Escape key when not loading
  useEffect(() => {
    if (!showDeleteConfirm) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !postLoading) {
        handleCloseDelete();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showDeleteConfirm, postLoading]);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleteError(null);
      const payload = itemToDelete;
      const postData = {
        tenant: tenantCode,
        action: "insert",
        id: payload._id,
        collectionName: "contractor",
        data: {
          ...payload,
          isDeleted: true,
        },
      };
      await postDelete(postData);
      handleCloseDelete();
      refetchContractor();
      refetchCount();
    } catch (err) {
      console.error("Delete failed", err);
      setDeleteError("Delete failed. Please try again after some time.");
    }
  };

  const handleCancelDelete = () => {
    handleCloseDelete();
  };

  return (
    <>
      {(viewMode || editMode || addMode) && (
        <div>
          <ContractorHeader
            title="Contractors"
            description="Manage and review contractor records"
            onRefilter={() => {}}
            onOpenDraftList={handleOpenDraftList}
            onAddNew={handleAddNew}
            canAdd={addMode}
          />
          <div className="py-4 px-6  pb-0">
            <div className="flex bg-muted/50 rounded-lg border max-w-7xl mx-auto">
              <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-52">
                <Select value={searchField} onValueChange={(value) => setSearchField(value as "contractorCode" | "contractorName" | "organizationCode" | "workLocation")}>
                  <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contractorCode">Contractor Code</SelectItem>
                    <SelectItem value="contractorName">Contractor Name</SelectItem>
                    <SelectItem value="organizationCode">Organization Code</SelectItem>
                    <SelectItem value="workLocation">Work Location</SelectItem>
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
              <div className="flex items-center bg-background border-l px-3 py-2 w-40">
                <Select value={isActiveFilter} onValueChange={(value) => setIsActiveFilter(value as "true" | "false" | "all")}>
                  <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
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
          <BasicInformationDraftForm
            isOpen={isAddDraftOpen}
            onClose={() => {
              setIsAddDraftOpen(false);
              refetchContractor();
              refetchCount();
            }}
            mode="add"
            employeeRecordId={null}
            employeeSearchUrl="draft/contractor/search"
          />
          <AddContractorDraftInfoPopup
            isOpen={isDraftListOpen}
            onAddDraft={() => {
              setIsDraftListOpen(false);
              setIsAddDraftOpen(true);
            }}
            onClose={() => {
              setIsDraftListOpen(false);
              refetchContractor();
              refetchCount();
            }}
          />
          {contractorData && contractorData.length >= 0 && (
            <ContractorTable
              contractorData={contractorData}
              loading={loading}
              externalPagination={{
                currentPage,
                totalPages,
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
              onEdit={(contractor) => {
                const contractorIdValue =
                  typeof contractor._id === "object" && contractor._id?.$oid
                    ? contractor._id.$oid
                    : String(contractor._id || "");
                const encryptedData = encryptEmployeeData({ employeeId: employeeId || "", _id: contractorIdValue });
                router.push(`/contractor-management/contractor?mode=edit&id=${encryptedData}`);
              }}
              onView={(contractor) => {
                const contractorIdValue =
                  typeof contractor._id === "object" && contractor._id?.$oid
                    ? contractor._id.$oid
                    : String(contractor._id || "");
                const encryptedData = encryptEmployeeData({ employeeId: employeeId || "", _id: contractorIdValue });
                router.push(`/contractor-management/contractor?mode=view&id=${encryptedData}`);
              }}
              onDelete={handleOpenDelete}
            />
          )}

          {/* Delete Confirmation Popup */}
          {showDeleteConfirm && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => {
                if (!postLoading) handleCloseDelete();
              }}
            >
              <div
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
                    Are you sure you want to delete this contractor? This will permanently remove the record from
                    the system.
                  </p>
                  {postLoading && (
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
                    disabled={postLoading}
                    className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                      postLoading ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {postLoading ? "Please wait..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

