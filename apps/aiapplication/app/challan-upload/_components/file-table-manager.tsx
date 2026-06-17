"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronLeft, ChevronRight, Clock, Eye, FileText, XCircle } from "lucide-react";
import TopTitleDescription from "@repo/ui/components/titleline/top-title-discription";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64";
import ChallanFilterBar from "./challan-filter-bar";
import FilePreviewModal from "./common/file-preview-modal";

interface FileRecord {
  _id: string;
  fileName?: string;
  fileSize?: number | string;
  workflowName?: string;
  status?: string;
  description?: string;
  uploadedBy?: string;
  createdOn?: string;
  salMonth?: string;
}

interface FileTableManagerProps {
  permission?: {
    view: boolean;
    upload: boolean;
  };
  onGenerateReport?: () => void;
}

const ITEMS_PER_PAGE = 10;

function ReadMoreCell({ value }: { value?: string }) {
  const text = value?.trim() || "-";
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const textRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;
    setShowToggle(element.scrollWidth > element.clientWidth);
  }, [text, expanded]);

  return (
    <div className="max-w-[220px]">
      {expanded ? (
        <div className="text-sm whitespace-normal break-words" title={text}>
          {text}{" "}
          {showToggle && (
            <button
              type="button"
              className="text-xs text-blue-600 hover:text-blue-700"
              onClick={(event) => {
                event.stopPropagation();
                setExpanded(false);
              }}
            >
              Read less
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 min-w-0">
          <div
            ref={textRef}
            className="text-sm whitespace-nowrap overflow-hidden text-ellipsis min-w-0 flex-1"
            title={text}
          >
            {text}
          </div>
          {showToggle && (
            <button
              type="button"
              className="text-xs text-blue-600 hover:text-blue-700 shrink-0"
              onClick={(event) => {
                event.stopPropagation();
                setExpanded(true);
              }}
            >
              Read more
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FileTableManager({ permission, onGenerateReport }: FileTableManagerProps) {
  const router = useRouter();
  const tenantCode = useGetTenantCode();
  const canOpenDetails = permission?.view ?? false;
  const [rows, setRows] = useState<FileRecord[]>([]);
  const [filters, setFilters] = useState<{ searchTerm: string; selectedFilters: string[] }>({
    searchTerm: "",
    selectedFilters: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState("pdf");
  const [previewFileName, setPreviewFileName] = useState<string>("challan.pdf");
  const { fetchByteArray, loading: previewLoading } = useByteToBase64();
  const selectedStatus = filters.selectedFilters[0] || "all";

  const offset = useMemo(() => (currentPage - 1) * ITEMS_PER_PAGE, [currentPage]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(filters.searchTerm.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters.searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const requestCriteria = useMemo(() => {
    const criteria: Array<{ field: string; operator: string; value: string }> = [
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
      { field: "createdOn", operator: "desc", value: "" },
    ];

    if (searchTerm) {
      criteria.push({ field: "fileName", operator: "like", value: searchTerm });
    }

    if (selectedStatus !== "all") {
      criteria.push({ field: "status", operator: "eq", value: selectedStatus });
    }

    return criteria;
  }, [tenantCode, searchTerm, selectedStatus]);

  const { loading: countLoading, refetch: refetchCount } = useRequest<number>({
    url: "challan/count",
    method: "POST",
    data: requestCriteria,    
    onSuccess: (count) => {
      const parsedCount = typeof count === "number" ? count : Number(count) || 0;
      setTotalCount(parsedCount);
    },
    onError: () => {
      setTotalCount(0);
    },
  });

  const { loading, refetch } = useRequest<FileRecord[]>({
    url: `challan/search?offset=${offset}&limit=${ITEMS_PER_PAGE}`,
    method: "POST",
    data: requestCriteria,
    onSuccess: (data) => {
      setRows(Array.isArray(data) ? data : []);
    },
    onError: () => {
      setRows([]);
    },
  });

  useEffect(() => {
    refetchCount();
    refetch()
  }, [tenantCode,requestCriteria]);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = totalCount === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(safeCurrentPage * ITEMS_PER_PAGE, totalCount);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getStatusBadge = (status?: string) => {
    const statusUpper = (status || "").toUpperCase();

    if (!status || statusUpper.includes("PROCESS") || statusUpper.includes("PENDING")) {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
          <Clock className="h-3 w-3 mr-1" />
          Processing
        </Badge>
      );
    }
    if (statusUpper.includes("COMPLETE") || statusUpper.includes("SUCCESS")) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    }
    if (statusUpper.includes("FAIL")) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    }

    return <Badge variant="outline">{status}</Badge>;
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setIsPreviewOpen(false);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileView = async (row: FileRecord, event: React.MouseEvent) => {
    event.stopPropagation();
    const monthSegment = row.salMonth ? String(row.salMonth).toLowerCase() : "nov";
    let fileName = row.fileName || "challan.pdf";
    if (!fileName.toLowerCase().endsWith(".pdf")) {
      fileName = `${fileName.replace(/\.[^/.]+$/, "") || "challan"}.pdf`;
    }
    const serverPath = `/app/documents/Challan/${tenantCode || ""}/${monthSegment}/${fileName}`;

    try {
      const response = await fetchByteArray(serverPath, "application/pdf");
      if (!response.success || !response.objectUrl) {
        alert(response.error || "Unable to open file preview.");
        return;
      }

      setPreviewUrl(response.objectUrl);
      setPreviewType("pdf");
      setPreviewFileName(fileName);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error("File preview error:", error);
      alert("Unable to open file preview.");
    }
  };

  return (
    <div className="pl-2 pr-2 mt-0 pt-4">
      <div className="w-full max-w-[1380px] mx-auto flex flex-col ">
        <div className="w-full flex-shrink-0 sticky top-0 z-10  pb-2">
          <ChallanFilterBar
            onFilterChange={setFilters}
            onGenerateReport={onGenerateReport}
            canUpload={permission?.upload ?? false}
          />
        </div>

        <div className="flex-1 overflow-y-auto scroll-hidden">
          <Card className="bg-white">
            <CardHeader className="bg-gray-50/50 border-b border-gray-200 px-5 py-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-700 mb-0">Challan Files</CardTitle>
                <span className="text-sm font-normal text-muted-foreground">{totalCount} files</span>
              </div>
            </CardHeader>

            <CardContent className="px-0 py-0">
              {(loading || countLoading) ? (
                <div className="py-10 text-center text-sm text-gray-500">Loading challan files...</div>
              ) : rows.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">No challan files found.</div>
              ) : (
                <>
                  <div className="rounded-md border my-3 mx-3 overflow-x-auto">
                    <Table className="min-w-[1000px] bg-white">
                      <TableHeader>
                        <TableRow className="bg-blue-50 hover:bg-blue-50">
                          <TableHead className="w-[70px] px-5 py-2 text-sm">Sl No</TableHead>
                          <TableHead className="w-[240px] px-5 py-2 text-sm">File Name</TableHead>
                          <TableHead className="w-[130px] px-5 py-2 text-sm">Status</TableHead>
                          <TableHead className="w-[110px] px-5 py-2 text-sm">Month</TableHead>
                          <TableHead className="w-[240px] px-5 py-2 text-sm">Description</TableHead>
                          <TableHead className="w-[190px] px-5 py-2 text-sm">Created On</TableHead>
                          <TableHead className="w-[150px] px-5 py-2 text-sm">Uploaded By</TableHead>
                          <TableHead className="w-[120px] text-right px-5 py-2 text-sm sticky right-0 bg-blue-50 border-l z-10">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row, index) => (
                          <TableRow
                            key={row._id || `${row.fileName}-${index}`}
                            className={canOpenDetails ? "cursor-pointer hover:bg-gray-50/70" : "hover:bg-gray-50/70"}
                            onClick={() => {
                              if (!canOpenDetails) return;
                              router.push(`/challan-upload/upload-statues?mode=all&id=${row._id}`);
                            }}
                          >
                            <TableCell className="px-5 py-2 text-sm">{startIndex + index}</TableCell>
                            <TableCell className="px-5 py-2 text-sm font-medium">
                              <ReadMoreCell value={row.fileName} />
                            </TableCell>
                            <TableCell className="px-5 py-2 text-sm">{getStatusBadge(row.status)}</TableCell>
                            <TableCell className="px-5 py-2 text-sm uppercase">{row.salMonth || "-"}</TableCell>
                            <TableCell className="px-5 py-2 text-sm">
                              <ReadMoreCell value={row.description} />
                            </TableCell>
                            <TableCell className="px-5 py-2 text-sm">{formatDate(row.createdOn)}</TableCell>
                            <TableCell className="px-5 py-2 text-sm">
                              <ReadMoreCell value={row.uploadedBy} />
                            </TableCell>
                            <TableCell className="text-right px-5 py-2 sticky right-0 bg-white border-l z-10">
                              {canOpenDetails && (
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(event) => void handleFileView(row, event)}
                                    title="View File"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      router.push(`/challan-upload/upload-statues?mode=all&id=${row._id}`);
                                    }}
                                    title="View Status"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-2 pb-3 border-t">
                      <div className="text-xs text-muted-foreground">
                        Showing {startIndex} to {endIndex} of {totalCount} entries
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="h-7 w-7 p-0 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm px-2">
                          {currentPage} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="h-7 w-7 p-0 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        viewerUrl={previewUrl}
        viewerType={previewType}
        fileName={previewFileName}
        loading={previewLoading}
      />
    </div>
  );
}

export default FileTableManager;
