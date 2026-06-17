"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ContractorTable from "./contractor-table";
import ContractorHeader from "./contractor-header";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info";
import { encryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto";
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [action, setAction] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteData, setDeleteData] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteDataRef = useRef<any>(null);

  const itemsPerPage = 5;
  const tenantCode = useGetTenantCode();
  const { employeeId } = useKeyclockRoleInfo();
  const { hierarchyFilters } = useEmpHierarchy();

  const contractorCodes = useMemo(
    () =>
      Array.from(
        new Set(
          (hierarchyFilters?.contractors || [])
            .map((code: any) => String(code).trim())
            .filter(Boolean),
        ),
      ),
    [hierarchyFilters?.contractors],
  );

  useEffect(() => {
    deleteDataRef.current = deleteData;
  }, [deleteData]);

  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage]);
  const limit = itemsPerPage;

  const apiCriteria = useMemo(
    () => [
      {
        field: "tenantCode",
        value: tenantCode,
        operator: "eq",
      },
      {
        field: "contractorCode",
        value: contractorCodes,
        operator: "in",
      },
      {
        field: "createdOn",
        operator: "desc",
        value: "",
      },
    ],
    [tenantCode, contractorCodes],
  );

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

  const { loading, refetch: refetchContractor } = useRequest<any[]>({
    url: `contractor/search?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: apiCriteria,
    onSuccess: (data: any) => {
      if (data !== null && data !== undefined) {
        const active = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true);
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
        setContractorData(transformedData);
      }
    },
    onError: (error: any) => {
      console.error("Error fetching contractor data:", error);
      setContractorData([]);
    },
  });

  const { refetch: fetchSingleData } = useRequest<any[]>({
    url: "contractor/search",
    method: "POST",
    data: [{ field: "_id", value: deleteId, operator: "eq" }],
    onSuccess: (data: any) => {
      setDeleteData(Array.isArray(data) ? data[0] : null);
    },
    onError: (error: any) => {
      console.error("Error loading contractor data:", error);
    },
  });

  useEffect(() => {
    refetchContractor();
    refetchCount();
  }, [action, refetchContractor, refetchCount]);

  useEffect(() => {
    if (currentPage > 0) {
      refetchContractor();
    }
  }, [currentPage, refetchContractor]);

  const handleAddNew = useCallback(() => {
    router.push("/contractor?mode=add");
  }, [router]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  const { post: postDelete, loading: postLoading } = usePostRequest<any>({
    url: "contractor",
    onSuccess: () => {
      toast.success("Contractor deleted successfully!");
    },
    onError: (error) => {
      toast.error("Contractor submission failed!");
      console.error("POST error:", error);
    },
  });

  const handleOpenDelete = async (deleteValue: any) => {
    setDeleteError(null);
    setDeleteData(null);
    setItemToDelete(deleteValue);
    setShowDeleteConfirm(true);
    setDeleteLoading(true);
    setDeleteId(deleteValue?._id || null);
    await fetchSingleData();
    const start = Date.now();
    while (Date.now() - start < 2000) {
      if (deleteDataRef.current && deleteDataRef.current._id === deleteValue?._id) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    setDeleteLoading(false);
  };

  const handleCloseDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    setDeleteError(null);
    setDeleteLoading(false);
    setDeleteData(null);
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

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleteId(itemToDelete._id);
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
      await waitUntil(() => !!deleteDataRef.current && deleteDataRef.current._id === itemToDelete._id);
      setDeleteLoading(false);

      const payload = deleteDataRef.current;
      await postDelete({
        tenant: tenantCode,
        action: "insert",
        id: payload._id,
        collectionName: "contractor",
        data: {
          isDeleted: true,
          ...payload,
        },
      });

      setAction(payload._id);
      handleCloseDelete();
      refetchContractor();
      refetchCount();
    } catch (err) {
      console.error("Delete failed", err);
      setDeleteLoading(false);
      setDeleteError("Couldn't fetch record. Please try again after some time.");
    }
  };

  return (
    <>
      {(viewMode || editMode || addMode) && (
        <div>
          <ContractorHeader
            title="Contractors"
            description="Manage and review contractor records"
            onRefilter={() => {}}
            onAddNew={handleAddNew}
            canAdd={addMode}
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
                const encryptedData = encryptEmployeeData({
                  employeeId: employeeId || "",
                  _id: contractorIdValue,
                });
                router.push(`/contractor?mode=edit&id=${encryptedData}`);
              }}
              onView={(contractor) => {
                const contractorIdValue =
                  typeof contractor._id === "object" && contractor._id?.$oid
                    ? contractor._id.$oid
                    : String(contractor._id || "");
                const encryptedData = encryptEmployeeData({
                  employeeId: employeeId || "",
                  _id: contractorIdValue,
                });
                router.push(`/contractor?mode=view&id=${encryptedData}`);
              }}
              onDelete={handleOpenDelete}
            />
          )}

          {showDeleteConfirm && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => {
                if (!deleteLoading) handleCloseDelete();
              }}
            >
              <div
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
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
                    Are you sure you want to delete this contractor? This will permanently remove the record from the
                    system.
                  </p>
                  {(deleteLoading || postLoading) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                      Fetching record...
                    </div>
                  )}
                  {deleteError && <div className="text-sm text-red-600 mt-3">{deleteError}</div>}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCloseDelete}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deleteLoading || postLoading}
                    className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md ${
                      deleteLoading || postLoading ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {deleteLoading || postLoading ? "Please wait..." : "Delete"}
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
