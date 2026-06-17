"use client";

import { useState } from "react";
import { Filter, Search } from "lucide-react";
import { TableViewerButton } from "./common/table-viewer-button";

interface FilterBarProps {
  onFilterChange?: (filters: { searchTerm: string; selectedFilters: string[] }) => void;
  onGenerateReport?: () => void;
  canUpload?: boolean;
}

const statusFilters = [
  { label: "Completed", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
  { label: "Processing", value: "PROCESSING" },
];

export default function ChallanFilterBar({ onFilterChange, onGenerateReport, canUpload = false }: FilterBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const toggleFilter = (filterValue: string) => {
    const newFilters = selectedFilters.includes(filterValue) ? [] : [filterValue];
    setSelectedFilters(newFilters);
    onFilterChange?.({ searchTerm, selectedFilters: newFilters });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFilterChange?.({ searchTerm: value, selectedFilters });
  };

  return (
    <div className="w-full">
      <div className="pb-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 max-w-3xl relative">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-gray-400 focus-within:shadow-sm transition-all bg-white">
              <Search className="absolute left-3 text-gray-400 pointer-events-none" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search challan files..."
                className="flex-1 pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
              />

              <div className="relative">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`px-3 py-2.5 border-l border-gray-300 transition-colors flex items-center gap-1.5 ${
                    filterOpen || selectedFilters.length > 0 ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                  }`}
                >
                  <Filter
                    size={16}
                    className={filterOpen || selectedFilters.length > 0 ? "text-blue-600" : "text-gray-600"}
                  />
                  <span
                    className={`text-sm ${filterOpen || selectedFilters.length > 0 ? "text-blue-600 font-medium" : "text-gray-600"}`}
                  >
                    Filter
                  </span>
                </button>

                {filterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-56 border border-gray-200 rounded-md shadow-lg z-20 py-2 bg-white">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Filter by status</div>
                      {statusFilters.map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => toggleFilter(filter.value)}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${
                            selectedFilters.includes(filter.value)
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                          }`}
                        >
                          <span>{filter.label}</span>
                          {selectedFilters.includes(filter.value) && <span className="text-blue-600 font-semibold">Selected</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canUpload && (
              <TableViewerButton totalSelected={0} onOpen={onGenerateReport || (() => {})} variant="inline" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
