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

type ValidationRow = {
  contributionType: string;
  calculated: unknown;
  fromFile: unknown;
  difference: unknown;
  status: string;
  remarks: string;
};

type ValidationBlock = {
  employeeId: string;
  month: string;
  status: string;
  rows: ValidationRow[];
};

type ApiTableData = {
  rows: Record<string, unknown>[];
  columns: string[];
};

type ChallanValidationViewProps = {
  viewLoading: boolean;
  apiViewerError: string | null;
  viewerType: string;
  activeStatusTabs: string[];
  selectedStatusTab: string;
  setSelectedStatusTab: (status: string) => void;
  statusCountMap: Map<string, number>;
  validationSearchFields: Array<{ value: string; label: string }>;
  selectedValidationFieldLabel: string;
  employeeSearchInput: string;
  setEmployeeSearchInput: (value: string) => void;
  hasValidationBlocks: boolean;
  filteredValidationBlocks: ValidationBlock[];
  apiTableData: ApiTableData;
  filteredApiRows: Record<string, unknown>[];
  apiViewerData: unknown;
  normalizeStatus: (value: unknown) => string;
  parseNumber: (value: unknown) => number | null;
  toAmount: (value: unknown) => string;
  formatTableCell: (value: unknown) => string;
};

export default function ChallanValidationView({
  viewLoading,
  apiViewerError,
  viewerType,
  activeStatusTabs,
  selectedStatusTab,
  setSelectedStatusTab,
  statusCountMap,
  validationSearchFields,
  selectedValidationFieldLabel,
  employeeSearchInput,
  setEmployeeSearchInput,
  hasValidationBlocks,
  filteredValidationBlocks,
  apiTableData,
  filteredApiRows,
  apiViewerData,
  normalizeStatus,
  parseNumber,
  toAmount,
  formatTableCell,
}: ChallanValidationViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalCount = filteredValidationBlocks.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatusTab, employeeSearchInput, hasValidationBlocks]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedValidationBlocks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredValidationBlocks.slice(start, end);
  }, [currentPage, filteredValidationBlocks]);

  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className="mt-4 w-full rounded-xl border border-gray-200 bg-slate-50 p-4">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-800">Challan Validation View</h3>
      </div>

      {viewLoading && (
        <div className="h-[520px] flex items-center justify-center">
          <p className="text-gray-600">Loading API response...</p>
        </div>
      )}

      {!viewLoading && apiViewerError && (
        <div className="h-[520px] p-4 overflow-auto text-red-600 bg-red-50 rounded-md">
          {apiViewerError}
        </div>
      )}

      {!viewLoading && !apiViewerError && viewerType === "json" && (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <div className="flex bg-gray-50 rounded-xl p-0 h-10">
              {activeStatusTabs.map((status) => {
                const isActive = selectedStatusTab === status;
                return (
                  <button
                    key={status}
                    type="button"
                    className={`px-5 h-10 inline-flex items-center text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2 ${
                      isActive
                        ? "bg-blue-100 text-blue-800 border-blue-400"
                        : "text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    onClick={() => setSelectedStatusTab(status)}
                  >
                    {status} ({statusCountMap.get(status) || 0})
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-50 rounded-xl p-0 h-10">
                <div className="flex items-center bg-white border border-gray-200 rounded-l-xl px-3 h-10 w-40">
                  <Filter className="w-4 h-4 text-gray-500 mr-2" />
                  <Select value="employeeId">
                    <SelectTrigger className="w-full h-10 border-none p-0 text-sm font-medium text-gray-900 focus:ring-0 bg-transparent shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="min-w-[140px] shadow-none border border-gray-200">
                      {validationSearchFields.map((field) => (
                        <SelectItem key={field.value} value={field.value} className="text-sm">
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 flex items-center bg-white border-t border-r border-b border-gray-200 rounded-r-xl h-10 relative">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors" />
                    <Input
                      type="text"
                      placeholder={`Search by ${selectedValidationFieldLabel}...`}
                      value={employeeSearchInput}
                      onChange={(event) => setEmployeeSearchInput(event.target.value)}
                      className="pl-10 pr-3 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {hasValidationBlocks ? (
            filteredValidationBlocks.length > 0 ? (
              <>
                <div className="overflow-y-auto space-y-5">
                  {paginatedValidationBlocks.map((block, blockIdx) => (
                    <div
                      key={`${block.employeeId}-${blockIdx}`}
                      className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
                    >
                      <div className="grid grid-cols-3 text-sm font-semibold border-b border-gray-200 bg-blue-50">
                        <div className="px-5 py-2 border-r border-gray-200 text-slate-700">
                          Employee ID: {block.employeeId}
                        </div>
                        <div className="px-5 py-2 border-r border-gray-200 text-center text-slate-700">
                          Month: {block.month || "N/A"}
                        </div>
                        <div className="px-5 py-2 text-right text-slate-700">
                          Status: {block.status}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-sm">
                          <thead>
                            <tr className="bg-blue-50 text-slate-700">
                              <th className="px-5 py-2 border border-gray-200 text-center font-semibold">Contribution Type</th>
                              <th className="px-5 py-2 border border-gray-200 text-center font-semibold">Calculated</th>
                              <th className="px-5 py-2 border border-gray-200 text-center font-semibold">From File</th>
                              <th className="px-5 py-2 border border-gray-200 text-center font-semibold">Difference</th>
                              <th className="px-5 py-2 border border-gray-200 text-center font-semibold">Status</th>
                              <th className="px-5 py-2 border border-gray-200 text-center font-semibold">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {block.rows.map((row, rowIdx) => {
                              const isMatch = normalizeStatus(row.status) === "MATCH";
                              const diffNum = parseNumber(row.difference);
                              const isNegative = diffNum !== null && diffNum < 0;

                              return (
                                <tr
                                  key={`${blockIdx}-${rowIdx}`}
                                  className={isMatch ? "bg-emerald-50/70" : "bg-rose-50/70"}
                                >
                                  <td className="px-5 py-2 border border-gray-200 text-center font-semibold text-slate-800">
                                    {row.contributionType}
                                  </td>
                                  <td className="px-5 py-2 border border-gray-200 text-center text-slate-800">
                                    {toAmount(row.calculated)}
                                  </td>
                                  <td className="px-5 py-2 border border-gray-200 text-center text-slate-800">
                                    {toAmount(row.fromFile)}
                                  </td>
                                  <td
                                    className={`px-5 py-2 border border-gray-200 text-center font-semibold ${
                                      isMatch ? "text-slate-800" : "text-rose-700"
                                    }`}
                                  >
                                    {isNegative
                                      ? `-${toAmount(Math.abs(diffNum ?? 0))}`
                                      : toAmount(row.difference)}
                                  </td>
                                  <td
                                    className={`px-5 py-2 border border-gray-200 text-center font-semibold ${
                                      isMatch ? "text-emerald-600" : "text-rose-700"
                                    }`}
                                  >
                                    {normalizeStatus(row.status) || (isMatch ? "MATCH" : "DISCREPANCY")}
                                  </td>
                                  <td className="px-5 py-2 border border-gray-200 text-center text-slate-800">
                                    {row.remarks}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between px-5 py-2 pb-3 border-t">
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
            ) : (
              <div className="h-[520px] flex items-center justify-center rounded-md border border-gray-200 bg-white text-slate-500">
                No records found for selected status/employee.
              </div>
            )
          ) : apiTableData.rows.length > 0 && apiTableData.columns.length > 0 ? (
            filteredApiRows.length > 0 ? (
              <div className="overflow-x-auto border border-gray-200 rounded-md bg-white">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="sticky top-0 bg-blue-50 z-10">
                    <tr>
                      <th className="px-5 py-2 text-left font-semibold text-slate-700 border-b border-gray-200">S.No</th>
                      {apiTableData.columns.map((col) => (
                        <th
                          key={col}
                          className="px-5 py-2 text-left font-semibold text-slate-700 border-b border-gray-200 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApiRows.map((row, index) => (
                      <tr key={index} className="odd:bg-white even:bg-slate-50">
                        <td className="px-5 py-2 border-b border-slate-100 align-top text-slate-600">
                          {index + 1}
                        </td>
                        {apiTableData.columns.map((col) => (
                          <td key={`${index}-${col}`} className="px-5 py-2 border-b border-slate-100 align-top text-slate-700">
                            <span className="break-all">{formatTableCell(row[col])}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-[520px] flex items-center justify-center rounded-md border border-gray-200 bg-white text-slate-500">
                No records found for selected status/employee.
              </div>
            )
          ) : (
            <pre className="p-4 overflow-auto text-xs bg-slate-50 rounded-md">
              {JSON.stringify(apiViewerData, null, 2)}
            </pre>
          )}
        </>
      )}

      {!viewLoading && !apiViewerError && viewerType === "text" && (
        <pre className="p-4 overflow-auto text-xs bg-slate-50 rounded-md whitespace-pre-wrap">
          {typeof apiViewerData === "string"
            ? apiViewerData
            : JSON.stringify(apiViewerData, null, 2)}
        </pre>
      )}
    </div>
  );
}
