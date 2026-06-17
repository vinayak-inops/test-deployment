"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

type ExcelErrorRow = {
  employeeID: string;
  parseID: string;
  sheet: string;
  reasons: string[];
};

type ExcelErrorViewProps = {
  errorRows: ExcelErrorRow[];
  loading: boolean;
  errorMessage?: string | null;
};

export default function ExcelErrorView({
  errorRows,
  loading,
  errorMessage,
}: ExcelErrorViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedField, setSelectedField] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const itemsPerPage = 5;

  const filteredRows = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    if (!query) return errorRows;

    return errorRows.filter((row) => {
      const reasonText = row.reasons.join(" ").toLowerCase();

      if (selectedField === "employeeID") {
        return row.employeeID.toLowerCase().includes(query);
      }

      if (selectedField === "sheet") {
        return row.sheet.toLowerCase().includes(query);
      }

      if (selectedField === "reasons") {
        return reasonText.includes(query);
      }

      return (
        row.employeeID.toLowerCase().includes(query) ||
        row.sheet.toLowerCase().includes(query) ||
        reasonText.includes(query)
      );
    });
  }, [errorRows, searchInput, selectedField]);

  const totalCount = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput, selectedField]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [currentPage, filteredRows]);

  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCount);

  if (loading) {
    return (
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
        Loading upload errors...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        Failed to load upload errors: {errorMessage}
      </div>
    );
  }

  if (errorRows.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 w-full rounded-xl border border-gray-200 bg-slate-50 p-4">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-800">Upload Error Details</h3>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
        <div className="text-sm font-medium text-slate-700">
          Total Errors: {totalCount}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-50 rounded-xl p-0 h-10">
            <div className="flex items-center bg-white border border-gray-200 rounded-l-xl px-3 h-10 w-40">
              <Filter className="w-4 h-4 text-gray-500 mr-2" />
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger className="w-full h-10 border-none p-0 text-sm font-medium text-gray-900 focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[140px] shadow-none border border-gray-200">
                  <SelectItem value="all" className="text-sm">All Fields</SelectItem>
                  <SelectItem value="employeeID" className="text-sm">Employee ID</SelectItem>
                  <SelectItem value="sheet" className="text-sm">Sheet</SelectItem>
                  <SelectItem value="reasons" className="text-sm">Error Description</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex items-center bg-white border-t border-r border-b border-gray-200 rounded-r-xl h-10 relative min-w-[280px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search upload errors..."
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="pl-10 pr-3 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="bg-blue-50 text-slate-700">
              <th className="px-5 py-2 border-b border-gray-200 text-left font-semibold">Employee ID</th>
              <th className="px-5 py-2 border-b border-gray-200 text-left font-semibold">Sheet</th>
              <th className="px-5 py-2 border-b border-gray-200 text-left font-semibold">Error Description</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, index) => (
              <tr key={`${row.parseID}-${index}`} className="odd:bg-white even:bg-slate-50">
                <td className="px-5 py-3 border-b border-slate-100 align-top text-slate-700">
                  {row.employeeID || "N/A"}
                </td>
                <td className="px-5 py-3 border-b border-slate-100 align-top text-slate-700">
                  {row.sheet || "N/A"}
                </td>
                <td className="px-5 py-3 border-b border-slate-100 align-top">
                  <div className="space-y-1">
                    {row.reasons.length > 0 ? (
                      row.reasons.map((reason, reasonIndex) => (
                        <div
                          key={`${row.parseID}-${reasonIndex}`}
                          className="rounded-md bg-red-50 px-3 py-2 text-red-700 border border-red-100"
                        >
                          {reason}
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-700">N/A</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalCount === 0 && (
        <div className="mt-4 h-[180px] flex items-center justify-center rounded-md border border-gray-200 bg-white text-slate-500">
          No upload errors found for the current search.
        </div>
      )}

      {totalCount > 0 && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between px-5 py-2 pb-1 border-t">
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
    </div>
  );
}
