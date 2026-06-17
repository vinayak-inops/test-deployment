"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, Search, FileText, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import { toast } from "react-toastify";

interface ContractorRow {
  _id: string;
  contractorCode: string;
  contractorName: string;
  typeOfCompany?: string;
  organizationCode?: string;
  workLocation?: string;
  serviceSince?: string;
  contactPersonName?: string;
  contactPersonContactNo?: string;
  workOrders?: Array<{
    workOrderNumber: string;
  }>;
}

interface SelectedContractorDocument {
  _id: string;
  contractorName: string;
  contractorCode: string;
}

interface ContractEmployeeApproveTableFilterPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAction?: (employee: ContractorRow) => void;
  uploadedBy?: string;
  onSubmitted?: () => void;
}

export default function ContractEmployeeApproveTableFilterPopup({
  isOpen,
  onClose,
  onAction,
  uploadedBy = "",
  onSubmitted,
}: ContractEmployeeApproveTableFilterPopupProps) {
  const [searchField, setSearchField] = useState("contractorCode");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tableRows, setTableRows] = useState<ContractorRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedContractorMap, setSelectedContractorMap] = useState<Map<string, SelectedContractorDocument>>(new Map());

  const itemsPerPage = 10;
  const tenantCode = useGetTenantCode();
  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage]);
  const selectedCount = selectedIds.size;

  const normalizeId = (id: any) => {
    if (id && typeof id === "object" && "$oid" in id) return String((id as any).$oid || "");
    return String(id || "");
  };

  const apiCriteria = useMemo(() => {
    const filters: any[] = [
      { field: "tenantCode", value: tenantCode, operator: "eq" },
      { field: "createdOn", operator: "desc", value: "" },
      { field: "isVerified", value: true, operator: "eq" },
    ];

    const query = debouncedSearchText.trim();
    if (query) {
      if (searchField === "contractorCode") {
        filters.push({ field: "contractorCode", operator: "like", value: query });
      } else if (searchField === "contractorName") {
        filters.push({ field: "contractorName", operator: "like", value: query });
      } else if (searchField === "organizationCode") {
        filters.push({ field: "organizationCode", operator: "like", value: query });
      } else if (searchField === "workLocation") {
        filters.push({ field: "workLocation", operator: "like", value: query });
      } else if (searchField === "workOrderNumber") {
        filters.push({ field: "workOrders.workOrderNumber", operator: "like", value: query });
      } else {
        filters.push({ field: searchField, operator: "like", value: query });
      }
    }

    return filters;
  }, [tenantCode, debouncedSearchText, searchField]);

  const { refetch: refetchCount } = useRequest<any>({
    url: "draft/contractor/count",
    method: "POST",
    data: apiCriteria,
    onSuccess: (data: any) => {
      if (data !== null && data !== undefined) {
        setTotalCount(Number(data) || 0);
      }
    },
    onError: (error: any) => {
      console.error("Error fetching contractor count:", error);
      setTotalCount(0);
    },
    dependencies: [],
  });

  const { loading, refetch: refetchContractor } = useRequest<any>({
    url: `draft/contractor/search?offset=${offset}&limit=${itemsPerPage}`,
    method: "POST",
    data: apiCriteria,
    onSuccess: (data: any) => {
      const active = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true);
      const transformed = active.map((item: any) => ({
        _id: item?._id,
        contractorCode: item?.contractorCode || "",
        contractorName: item?.contractorName || "",
        typeOfCompany: item?.typeOfCompany || "",
        organizationCode: item?.organizationCode || "",
        workLocation: item?.workLocation || "",
        serviceSince: item?.serviceSince || "",
        contactPersonName: item?.contactPersonName || "",
        contactPersonContactNo: item?.contactPersonContactNo || "",
        workOrders: item?.workOrders || [],
      }));
      setTableRows(transformed);
    },
    onError: (error: any) => {
      console.error("Error fetching contractor data:", error);
      setTableRows([]);
    },
    dependencies: [],
  });

  const { post: postApproval, loading: approvalLoading } = usePostRequest<any>({
    url: "masterDataApproval",
    onSuccess: () => {
      toast.success("Submitted for approval successfully.");
      onSubmitted?.();
      onClose();
    },
    onError: (error) => {
      toast.error("Approval submission failed.");
      console.error("POST error:", error);
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentPage(1);
  }, [debouncedSearchText, searchField, isOpen]);

  useEffect(() => {
    if (!isOpen || !tenantCode) return;
    refetchCount();
    refetchContractor();
  }, [isOpen, tenantCode, currentPage, debouncedSearchText, searchField]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setSearchField("contractorCode");
    setSearchText("");
    setDebouncedSearchText("");
    setCurrentPage(1);
    setSelectedIds(new Set());
    setSelectedContractorMap(new Map());
  }, [isOpen]);

  if (!isOpen) return null;

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  const isAllOnPageSelected =
    tableRows.length > 0 && tableRows.every((row) => selectedIds.has(normalizeId(row._id)));

  const toggleSelectAllOnPage = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      tableRows.forEach((row) => {
        const id = normalizeId(row._id);
        if (!id) return;
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
    setSelectedContractorMap((prev) => {
      const next = new Map(prev);
      tableRows.forEach((row) => {
        const id = normalizeId(row._id);
        if (!id) return;
        if (checked) {
          next.set(id, {
            _id: id,
            contractorName: row.contractorName || "",
            contractorCode: row.contractorCode || "",
          });
        } else {
          next.delete(id);
        }
      });
      return next;
    });
  };

  const toggleSelectOne = (rowId: any, checked: boolean) => {
    const id = normalizeId(rowId);
    if (!id) return;
    const row = tableRows.find((r) => normalizeId(r._id) === id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    setSelectedContractorMap((prev) => {
      const next = new Map(prev);
      if (checked) {
        next.set(id, {
          _id: id,
          contractorName: row?.contractorName || "",
          contractorCode: row?.contractorCode || "",
        });
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleFinalSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one record.");
      return;
    }

    const documents = Array.from(selectedIds)
      .map((id) => selectedContractorMap.get(id))
      .filter((doc): doc is SelectedContractorDocument => Boolean(doc && doc._id && doc.contractorCode))
      .filter(Boolean);

    const payload = {
      tenant: tenantCode,
      action: "insert",
      collectionName: "masterDataApproval",
      id: null,
      event: "application",
      data: {
        tenantCode,
        organizationCode: tenantCode,
        collectionName: "contractor",
        documents,
        workflowName: "MASTER_DATA_APPROVAL",
        uploadedBy: uploadedBy || "Midhani Admin",
        createdOn: new Date().toISOString(),
        status: "Initiated",
        stateEvent: "NEXT",
      },
    };

    await postApproval(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-transparent w-full max-w-6xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="w-full min-h-[70vh] max-h-[90vh] flex flex-col overflow-hidden">
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">Select Contractors</CardTitle>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 px-6 py-4 overflow-hidden flex flex-col gap-4 min-h-0">
            <div className="shrink-0">
              <div className="flex bg-muted/50 rounded-lg border w-full">
                <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-44">
                  <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                  <Select value={searchField} onValueChange={setSearchField}>
                    <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contractorCode">Contractor Code</SelectItem>
                      <SelectItem value="contractorName">Contractor Name</SelectItem>
                      <SelectItem value="organizationCode">Organization Code</SelectItem>
                      <SelectItem value="workLocation">Work Location</SelectItem>
                      <SelectItem value="contactPersonName">Contact Person</SelectItem>
                      <SelectItem value="workOrderNumber">Work Order Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 flex items-center bg-background rounded-r-lg min-w-0">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Type to filter..."
                      className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent w-full placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-md overflow-auto flex-1 min-h-[360px]">
              <table className="min-w-[1200px] w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap sticky top-0 z-10 bg-gray-50">
                      <input
                        type="checkbox"
                        checked={isAllOnPageSelected}
                        onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap sticky top-0 z-10 bg-gray-50">S.No</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap sticky top-0 z-10 bg-gray-50">Contractor Code</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap sticky top-0 z-10 bg-gray-50">Contractor Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap sticky top-0 z-10 bg-gray-50">Organization</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap sticky top-0 z-10 bg-gray-50">Work Location</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap sticky top-0 z-10 bg-gray-50">Contact</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap sticky top-0 z-10 bg-gray-50">Work Orders</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap sticky top-0 right-0 z-20 bg-gray-50">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-sm text-gray-500">Fetching records...</td>
                    </tr>
                  ) : tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-sm text-gray-500">No records found</td>
                    </tr>
                  ) : (
                    tableRows.map((employee, index) => (
                      <tr key={employee._id || `${employee.contractorCode}-${index}`} className="border-b border-gray-100">
                        <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(normalizeId(employee._id))}
                            onChange={(e) => toggleSelectOne(employee._id, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{startIndex + index + 1}</td>
                        <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{employee.contractorCode || "-"}</td>
                        <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{employee.contractorName || "-"}</td>
                        <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                          {employee.organizationCode || "-"}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                          {employee.workLocation || "-"}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                          {employee.contactPersonName && employee.contactPersonContactNo
                            ? `${employee.contactPersonName} (${employee.contactPersonContactNo})`
                            : employee.contactPersonName || employee.contactPersonContactNo || "-"}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                          {(employee.workOrders || [])
                            .map((wo) => wo.workOrderNumber)
                            .filter(Boolean)
                            .join(", ") || "-"}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap sticky right-0 bg-white">
                          <button
                            type="button"
                            onClick={() => onAction?.(employee)}
                            className="p-1.5 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                            title="Form View"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between shrink-0">
              <p className="text-xs text-gray-600">
                {totalCount > 0
                  ? `Showing ${startIndex + 1} to ${Math.min(endIndex, totalCount)} of ${totalCount} entries`
                  : "No entries found"}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                  className="h-7 w-7 p-0 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      if (index > 0 && page - array[index - 1] > 1) {
                        return (
                          <div key={page} className="flex items-center gap-1">
                            <span className="px-2 text-xs text-gray-500">...</span>
                            <button
                              type="button"
                              onClick={() => setCurrentPage(page)}
                              disabled={loading}
                              className={`h-7 w-7 p-0 flex items-center justify-center rounded-md text-xs font-medium ${
                                page === currentPage
                                  ? "bg-blue-600 text-white"
                                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      }
                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          disabled={loading}
                          className={`h-7 w-7 p-0 flex items-center justify-center rounded-md text-xs font-medium ${
                            page === currentPage
                              ? "bg-blue-600 text-white"
                              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="h-7 w-7 p-0 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={selectedCount === 0 || approvalLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mr-2"
            >
              {approvalLoading ? "Submitting..." : `Final Submit (${selectedCount})`}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
