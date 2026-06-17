"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type ExcelValidationViewProps = {
  excelData: Record<string, Record<string, unknown>[]>;
  selectedSheet: string;
  setSelectedSheet: (sheet: string) => void;
};

const ITEMS_PER_PAGE = 10;
const ALL_FIELDS = "__all__";
const MIN_CELL_WIDTH = 120;
const MAX_CELL_WIDTH = 420;
const CHARACTER_PIXEL_WIDTH = 8;

const formatCellValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

type TruncatedInlineTextProps = {
  value: string;
  widthClassName?: string;
  textClassName?: string;
  buttonClassName?: string;
};

function TruncatedInlineText({
  value,
  widthClassName = "max-w-[200px]",
  textClassName = "text-slate-700",
  buttonClassName = "text-blue-700 hover:text-blue-800",
}: TruncatedInlineTextProps) {
  const [expanded, setExpanded] = useState(false);
  const trimmedValue = value.trim();
  const isLong = trimmedValue.length > 24;

  if (!isLong) {
    return (
      <span className={`inline-block truncate align-middle ${widthClassName} ${textClassName}`}>
        {trimmedValue || "N/A"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 max-w-full align-middle">
      <span
        title={trimmedValue}
        className={`inline-block align-middle ${widthClassName} ${expanded ? "whitespace-nowrap overflow-visible" : "truncate"
          } ${textClassName}`}
      >
        {trimmedValue}
      </span>
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={`shrink-0 text-xs font-medium whitespace-nowrap ${buttonClassName}`}
        >
          Read more
        </button>
      )}
      {expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className={`shrink-0 text-xs font-medium whitespace-nowrap ${buttonClassName}`}
        >
          Less
        </button>
      )}
    </span>
  );
}

export default function ExcelValidationView({
  excelData,
  selectedSheet,
  setSelectedSheet,
}: ExcelValidationViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedField, setSelectedField] = useState(ALL_FIELDS);
  const [searchInput, setSearchInput] = useState("");
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);
  const [showTableLeftButton, setShowTableLeftButton] = useState(false);
  const [showTableRightButton, setShowTableRightButton] = useState(false);
  const sheetTabsRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);

  const sheetNames = useMemo(() => Object.keys(excelData || {}), [excelData]);

  const activeRows = useMemo(
    () => (selectedSheet && excelData?.[selectedSheet] ? excelData[selectedSheet] : []),
    [excelData, selectedSheet]
  );

  const columns = useMemo(() => {
    const unique = new Set<string>();
    activeRows.forEach((row) => {
      Object.keys(row || {}).forEach((key) => unique.add(key));
    });
    return Array.from(unique);
  }, [activeRows]);

  const searchFields = useMemo(
    () => [{ value: ALL_FIELDS, label: "All Columns" }, ...columns.map((column) => ({ value: column, label: column }))],
    [columns]
  );

  const filteredRows = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    if (!query) return activeRows;

    return activeRows.filter((row) => {
      if (selectedField !== ALL_FIELDS) {
        return formatCellValue(row?.[selectedField]).toLowerCase().includes(query);
      }

      return columns.some((column) => formatCellValue(row?.[column]).toLowerCase().includes(query));
    });
  }, [activeRows, columns, searchInput, selectedField]);

  const totalCount = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSheet, searchInput, selectedField]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const container = sheetTabsRef.current;
    if (!container) return;

    const updateScrollState = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1);
    };

    updateScrollState();
    container.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [sheetNames, selectedSheet]);

  useEffect(() => {
    const container = tableScrollRef.current;
    if (!container) return;

    const updateScrollState = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowTableLeftButton(scrollLeft > 0);
      setShowTableRightButton(scrollLeft < scrollWidth - clientWidth - 1);
    };

    requestAnimationFrame(updateScrollState);
    container.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [columns, filteredRows, selectedSheet]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredRows]);

  const columnWidths = useMemo(() => {
    return columns.reduce<Record<string, number>>((widths, column) => {
      const longestValueLength = activeRows.reduce((maxLength, row) => {
        return Math.max(maxLength, formatCellValue(row?.[column]).length);
      }, column.length);

      widths[column] = Math.min(
        MAX_CELL_WIDTH,
        Math.max(MIN_CELL_WIDTH, longestValueLength * CHARACTER_PIXEL_WIDTH + 48)
      );

      return widths;
    }, {});
  }, [activeRows, columns]);

  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  if (sheetNames.length === 0) {
    return (
      <div className="mt-4 w-full rounded-xl border border-gray-200 bg-slate-50 p-4">
        <div className="h-[320px] flex items-center justify-center rounded-md border border-gray-200 bg-white text-slate-500">
          No sheet data available.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 w-full rounded-xl border border-gray-200 bg-slate-50 p-4">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-800">Excel Data View</h3>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
        <div className="relative w-full md:w-auto md:flex-1 md:max-w-[55%] min-w-0">
          {showLeftButton && (
            <button
              type="button"
              onClick={() => sheetTabsRef.current?.scrollBy({ left: -220, behavior: "smooth" })}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-r-md border border-gray-200 bg-white/95 p-1 shadow-md"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
          )}

          {showRightButton && (
            <button
              type="button"
              onClick={() => sheetTabsRef.current?.scrollBy({ left: 220, behavior: "smooth" })}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-l-md border border-gray-200 bg-white/95 p-1 shadow-md"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          )}

          <div
            ref={sheetTabsRef}
            className="flex items-center overflow-x-auto rounded-xl bg-gray-50 p-0 h-10 scroll-smooth"
            style={{
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {sheetNames.map((sheetName) => {
              const isActive = selectedSheet === sheetName;
              return (
                <button
                  key={sheetName}
                  type="button"
                  className={`px-5 h-10 inline-flex items-center text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2 shrink-0 ${isActive
                    ? "bg-blue-100 text-blue-800 border-blue-400"
                    : "text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  onClick={() => setSelectedSheet(sheetName)}
                >
                  {sheetName} ({excelData[sheetName]?.length || 0})
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-50 rounded-xl p-0 h-10">
            <div className="flex items-center bg-white border border-gray-200 rounded-l-xl px-3 h-10 w-44">
              <Filter className="w-4 h-4 text-gray-500 mr-2" />
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger className="w-full h-10 border-none p-0 text-sm font-medium text-gray-900 focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[160px] shadow-none border border-gray-200">
                  {searchFields.map((field) => (
                    <SelectItem key={field.value} value={field.value} className="text-sm">
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex items-center bg-white border-t border-r border-b border-gray-200 rounded-r-xl h-10 relative min-w-[280px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors" />
                <Input
                  type="text"
                  placeholder={`Search by ${selectedField === ALL_FIELDS ? "all columns" : selectedField
                    }...`}
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="pl-10 pr-3 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {paginatedRows.length > 0 ? (
        <>
          <div className="overflow-y-auto space-y-5">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="grid grid-cols-3 text-sm font-semibold border-b border-gray-200 bg-blue-50">
                <div className="px-5 py-2 border-r border-gray-200 text-slate-700">
                  Sheet: {selectedSheet}
                </div>
                <div className="px-5 py-2 border-r border-gray-200 text-center text-slate-700">
                  Columns: {columns.length}
                </div>
                <div className="px-5 py-2 text-right text-slate-700">
                  Rows: {totalCount}
                </div>
              </div>
              <div className="relative">
                {showTableLeftButton && (
                  <button
                    type="button"
                    onClick={() => tableScrollRef.current?.scrollBy({ left: -420, behavior: "smooth" })}
                    className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-r-md border border-gray-200 bg-white/95 p-1.5 shadow-md"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>
                )}

                {showTableRightButton && (
                  <button
                    type="button"
                    onClick={() => tableScrollRef.current?.scrollBy({ left: 420, behavior: "smooth" })}
                    className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-l-md border border-gray-200 bg-white/95 p-1.5 shadow-md"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </button>
                )}

              <div
                ref={tableScrollRef}
                className="overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full"
              >
                <table className="w-max min-w-full text-sm table-auto">
                  <thead>
                    <tr className="bg-blue-50 text-slate-700">
                      <th className="px-5 py-2 border border-gray-200 text-left font-semibold">S.No</th>
                      {columns.map((column) => (
                        <th
                          key={column}
                          className="px-5 py-2 border border-gray-200 text-left font-semibold whitespace-nowrap"
                        >
                          <div
                            className="inline-flex items-center"
                            style={{ width: `${columnWidths[column] || MIN_CELL_WIDTH}px` }}
                          >
                            <TruncatedInlineText
                              value={column}
                              widthClassName="max-w-full"
                              textClassName="text-slate-700"
                              buttonClassName="text-blue-700 hover:text-blue-800"
                            />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row, rowIdx) => (
                      <tr key={`${selectedSheet}-${rowIdx}`} className="odd:bg-white even:bg-slate-50">
                        <td className="px-5 py-2 border border-gray-200 align-top text-slate-700 font-medium">
                          {(currentPage - 1) * ITEMS_PER_PAGE + rowIdx + 1}
                        </td>
                        {columns.map((column) => (
                          <td
                            key={`${selectedSheet}-${rowIdx}-${column}`}
                            className="px-5 py-2 border border-gray-200 align-top text-slate-700"
                          >
                            <div
                              className="inline-flex items-center"
                              style={{ width: `${columnWidths[column] || MIN_CELL_WIDTH}px` }}
                            >
                              <TruncatedInlineText
                                value={formatCellValue(row?.[column])}
                                widthClassName="max-w-full"
                                textClassName="text-slate-700"
                                buttonClassName="text-blue-700 hover:text-blue-800"
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            </div>
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
        <div className="h-[320px] flex items-center justify-center rounded-md border border-gray-200 bg-white text-slate-500">
          No records found for the selected sheet/search.
        </div>
      )}
    </div>
  );
}
