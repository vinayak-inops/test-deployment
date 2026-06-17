"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileSpreadsheet,
  Search,
  XCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import TopTitleDescription from "@repo/ui/components/titleline/top-title-discription";
import { useDynamicQuery } from "@repo/ui/hooks/api/dynamic-graphql";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";

interface TransformedFileDetails {
  _id: string;
  tenantCode?: string;
  fileName: string;
  fileSize: string;
  workflowName: string;
  status: string;
  description: string;
  uploadedBy: string;
  createdOn: string;
}

interface FileTableManagerProps {
  excelData: any[];
  permission?: {
    excelUpload: boolean;
  };
}

const ITEMS_PER_PAGE = 10;

function FileTableManager({ excelData: _excelData, permission }: FileTableManagerProps) {
  const router = useRouter();
  const tenantCode = useGetTenantCode();
  const excelUpload = permission?.excelUpload || false;
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fileDetailsFields = {
    fields: [
      "_id",
      "tenantCode",
      "fileName",
      "fileSize",
      "workflowName",
      "status",
      "description",
      "uploadedBy",
      "createdOn",
    ],
  };

  const { data, loading } = useDynamicQuery(
    fileDetailsFields,
    "files",
    "FetchAllFileDetails",
    "fetchAllFileDetails",
    {
      collection: "files",
      tenantCode,
    }
  );

  const transformedFileDetails = useMemo(() => {
    if (!data) return [];

    return data
      .filter((file: any) => file !== null && file !== undefined)
      .sort((a: any, b: any) => {
        const aTime = new Date(a?.createdOn || 0).getTime();
        const bTime = new Date(b?.createdOn || 0).getTime();
        return bTime - aTime;
      })
      .map((file: any) => {
        const fileSize = file?.fileSize || 0;
        const fileSizeInKB = parseInt(fileSize.toString()) / 1024;
        const formattedFileSize =
          fileSizeInKB >= 1024
            ? `${(fileSizeInKB / 1024).toFixed(2)} MB`
            : `${fileSizeInKB.toFixed(2)} KB`;

        const date = new Date(file?.createdOn || new Date());
        const formattedDate = date.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });

        const { __typename, ...rest } = file;
        return {
          ...rest,
          fileName: rest.fileName || "-",
          fileSize: formattedFileSize,
          workflowName: rest.workflowName || "-",
          status: rest.status || "Pending",
          description: rest.description || "-",
          uploadedBy: rest.uploadedBy || "-",
          createdOn: formattedDate,
        } as TransformedFileDetails;
      });
  }, [data]);

  const filteredData = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return transformedFileDetails;

    return transformedFileDetails.filter((file) => {
      return [
        file.fileName,
        file.fileSize,
        file.workflowName,
        file.status,
        file.description,
        file.uploadedBy,
        file.createdOn,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [searchTerm, transformedFileDetails]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length);
  const currentData = filteredData.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus.includes("complete") || normalizedStatus.includes("success")) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          {status}
        </Badge>
      );
    }

    if (normalizedStatus.includes("fail") || normalizedStatus.includes("error")) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          {status}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
        <Clock className="h-3 w-3 mr-1" />
        {status || "Pending"}
      </Badge>
    );
  };

  const handleViewFile = (file: TransformedFileDetails) => {
    if (!excelUpload || !file?._id) return;
    router.push(`/excel-file-manager/upload-statues?mode=all&id=${file._id}`);
  };

  return (
    <div className="pl-6 pr-2 mt-0 pt-0">
      {/* <div className="mb-4">
        <TopTitleDescription
          titleValue={{
            title: "Uploaded Excel Files",
            description:
              "View the list of Excel files uploaded along with their processing status and workflow steps.",
          }}
        />
      </div> */}

      <Card>
        <CardHeader className="bg-gray-50/50 border-b border-gray-200 px-5 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold text-gray-700 mb-0">
              Excel Files
            </CardTitle>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search files..."
                className="h-9 pl-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 py-0">
          {loading ? (
            <div className="rounded-md border my-3 mx-3 overflow-x-auto">
              <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow className="bg-blue-50 hover:bg-blue-50">
                    {["Sl No", "File Name", "Status", "Workflow", "Size", "Uploaded By", "Created On", "Actions"].map((heading) => (
                      <TableHead key={heading} className="px-5 py-2 whitespace-nowrap text-sm">
                        {heading}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      {Array.from({ length: 8 }).map((__, cellIndex) => (
                        <TableCell key={cellIndex} className="px-5 py-2">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : currentData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold mb-1">No Excel Files</h3>
              <p className="text-sm text-muted-foreground">No files found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border my-3 mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                <Table className="min-w-[1100px]">
                  <TableHeader>
                    <TableRow className="bg-blue-50 hover:bg-blue-50">
                      <TableHead className="w-[70px] px-5 py-2 whitespace-nowrap text-sm">Sl No</TableHead>
                      <TableHead className="w-[260px] px-5 py-2 whitespace-nowrap text-sm">File Name</TableHead>
                      <TableHead className="w-[140px] px-5 py-2 whitespace-nowrap text-sm">Status</TableHead>
                      <TableHead className="w-[180px] px-5 py-2 whitespace-nowrap text-sm">Workflow</TableHead>
                      {/* <TableHead className="w-[110px] px-5 py-2 whitespace-nowrap text-sm">Size</TableHead> */}
                      <TableHead className="w-[160px] px-5 py-2 whitespace-nowrap text-sm">Uploaded By</TableHead>
                      <TableHead className="w-[180px] px-5 py-2 whitespace-nowrap text-sm">Created On</TableHead>
                      <TableHead className="w-[80px] text-right px-5 py-2 whitespace-nowrap text-sm sticky right-0 bg-blue-50 border-l z-10">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((row, index) => (
                      <TableRow
                        key={row._id || index}
                        className={excelUpload ? "cursor-pointer hover:bg-gray-50/70" : "hover:bg-gray-50/70"}
                        onClick={() => handleViewFile(row)}
                      >
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          {startIndex + index + 1}
                        </TableCell>
                        <TableCell className="font-medium px-5 py-2 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate max-w-[230px]" title={row.fileName}>
                              {row.fileName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          {getStatusBadge(row.status)}
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{row.workflowName}</TableCell>
                        {/* <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{row.fileSize}</TableCell> */}
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{row.uploadedBy}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{row.createdOn}</TableCell>
                        <TableCell className="text-right px-5 py-2 whitespace-nowrap sticky right-0 bg-white border-l z-10">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={!excelUpload}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleViewFile(row);
                            }}
                            className="h-7 w-7"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredData.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between px-5 py-2 pb-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    Showing {startIndex + 1} to {endIndex} of {filteredData.length} entries
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
  );
}

export default FileTableManager;
