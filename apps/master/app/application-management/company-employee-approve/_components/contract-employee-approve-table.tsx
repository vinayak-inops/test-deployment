"use client";

import React from 'react';
import { FileText, Calendar, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Employee {
  _id: string;
  employeeID: string;
  createdOn?: string;
  status?: string;
  uploadedBy?: string;
}

interface SecurityPassTableProps {
  employeeData: Employee[];
  loading?: boolean;
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onFormView?: (employee: Employee) => void;
}

export default function SecurityPassTable({
  employeeData,
  loading = false,
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
  onFormView,
}: SecurityPassTableProps) {
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  const getStatusBadge = (status?: string) => {
    const s = (status || "PENDING").toUpperCase();

    if (s.includes("APPROVED")) {
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    }

    if (s.includes("REJECTED")) {
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }

    return (
      <Badge className="bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="h-3 w-3 mr-1" />
        {status || "Pending"}
      </Badge>
    );
  };

  const renderEmployeeIdCell = (employee: Employee) => {
    const ids = String(employee.employeeID || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) return "N/A";
    if (ids.length <= 5) return ids.join(", ");

    const visible = ids.slice(0, 5).join(", ");
    const remaining = ids.length - 5;

    return (
      <span className="text-sm text-gray-900">
        {visible}{" "}
        {onFormView && (
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline ml-1"
            onClick={(e) => {
              e.stopPropagation();
              onFormView(employee);
            }}
          >
            +{remaining} more (Read more)
          </button>
        )}
      </span>
    );
  };

  return (
    <Card className="mx-8 my-4">
      <CardHeader className="border-b px-5 py-2 bg-gray-50/50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-semibold">
            Company Employee Approval
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${totalCount} entries`}
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-0 py-0">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading records...</p>
          </div>
        ) : employeeData.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No records found</p>
          </div>
        ) : (
          <div className="rounded-md border my-3 mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="px-5 py-2 min-w-[90px] whitespace-nowrap">Sl No</TableHead>
                  <TableHead className="px-5 py-2 min-w-[200px] whitespace-nowrap">Employee ID</TableHead>
                  <TableHead className="px-5 py-2 min-w-[160px] whitespace-nowrap">Created On</TableHead>
                  <TableHead className="px-5 py-2 min-w-[140px] whitespace-nowrap">Status</TableHead>
                  <TableHead className="px-5 py-2 min-w-[180px] whitespace-nowrap">Uploaded By</TableHead>
                  <TableHead className="px-5 py-2 text-right sticky right-0 bg-blue-50 border-l z-10 whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeData.map((employee, index) => (
                  <TableRow key={employee._id} className="hover:bg-gray-50">
                    <TableCell className="px-5 py-2">{startIndex + index + 1}</TableCell>
                    <TableCell className="px-5 py-2 font-medium">
                      {renderEmployeeIdCell(employee)}
                    </TableCell>
                    <TableCell className="px-5 py-2">{employee.createdOn || "N/A"}</TableCell>
                    <TableCell className="px-5 py-2">{getStatusBadge(employee.status)}</TableCell>
                    <TableCell className="px-5 py-2">{employee.uploadedBy || "N/A"}</TableCell>
                    <TableCell className="px-5 py-2 text-right sticky right-0 bg-white border-l z-10">
                      <div className="flex items-center justify-end gap-1">
                        {onFormView && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onFormView(employee)}
                            className="h-7 w-7"
                            title="Application View"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {totalPages > 0 && (
        <div className="flex items-center justify-between px-5 py-2 pb-3 border-t text-xs text-muted-foreground">
          <div>
            Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} entries
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center border rounded disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            >
              {"<"}
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
                      <React.Fragment key={page}>
                        <span className="px-1">...</span>
                        <button
                          type="button"
                          className={`h-7 w-7 flex items-center justify-center border rounded ${
                            page === currentPage ? "bg-blue-600 text-white" : "bg-white"
                          }`}
                          onClick={() => onPageChange(page)}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  }
                  return (
                    <button
                      key={page}
                      type="button"
                      className={`h-7 w-7 flex items-center justify-center border rounded ${
                        page === currentPage ? "bg-blue-600 text-white" : "bg-white"
                      }`}
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </button>
                  );
                })}
            </div>
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center border rounded disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            >
              {">"}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
