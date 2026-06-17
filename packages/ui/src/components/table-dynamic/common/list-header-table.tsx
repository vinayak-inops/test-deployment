import React, { useState } from "react";
import SearchInput from "./search-input";
import EntriesPerPage from "./entries-per-page";
import FilterButton from "./filter-button";
import AddUserButton from "./add-user-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
// import { toast } from "react-hot-toast";

export interface ListHeaderTableProps {
  entriesPerPage: number;
  handleEntriesChange: (value: number) => void;
  functionalityList: any;
  totalRows: number;
  tableType?: string;
  dataColumns: Array<{ key: string; label: string }>;
  onSearch: (column: string, value: string) => void;
  isSearching?: boolean;
  searchTerm?: string;
  searchColumn?: string;
  totalDataRows?: number;
}

const ListHeaderTable: React.FC<ListHeaderTableProps> = ({ 
  entriesPerPage, 
  handleEntriesChange,
  functionalityList,
  totalRows,
  tableType = "data",
  dataColumns,
  onSearch,
  isSearching = false,
  searchTerm = "",
  searchColumn = "",
  totalDataRows = 0
}) => {
  const [isEntriesOpen, setIsEntriesOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");

  const getTableTitle = () => {
    switch (tableType) {
      case "excel":
        return "Excel Data";
      case "data":
        return "Data Table";
      case "users":
        return "All Users";
      case "payroll":
        return "Payroll Records";
      case "employees":
        return "Employee Records";
      default:
        return "Data Records";
    }
  };

  const handleColumnSelect = (value: string) => {
    setSelectedColumn(value);
    // Clear search when column changes
    setSearchValue("");
    onSearch(value, "");
  };

  const handleSearch = (value: string) => {
    if (!selectedColumn) {
      // toast.error("Please select a column to search first");
      return;
    }
    setSearchValue(value);
    onSearch(selectedColumn, value);
  };

  return (
    <div className="flex items-center justify-between w-full py-4 border-b border-gray-200 px-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-medium text-gray-900">{getTableTitle()}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {totalRows} {totalRows === 1 ? 'record' : 'records'}
            {totalDataRows > 0 && totalDataRows !== totalRows && (
              <span className="ml-1 text-blue-600">(filtered from {totalDataRows})</span>
            )}
          </span>
          {isSearching && (
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Searching...
            </span>
          )}
          {searchTerm && !isSearching && (
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Found {totalRows} results
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {functionalityList?.filterfunctionality?.search?.status && (
          <>
            <Select value={selectedColumn} onValueChange={handleColumnSelect}>
              <SelectTrigger className="w-[180px] h-[35px]">
                <SelectValue placeholder="Select column to search" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {dataColumns.map((column) => (
                  <SelectItem key={column.key} value={column.key}>
                    {column.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <SearchInput 
              value={searchValue}
              onChange={handleSearch}
              placeholder={selectedColumn ? `Search by ${dataColumns.find(col => col.key === selectedColumn)?.label}` : "Select a column to search"}
              disabled={!selectedColumn}
            />
          </>
        )}

        <div className="flex items-center gap-2">
          {functionalityList?.outsidetablefunctionality?.paginationControls?.status && (
            <EntriesPerPage
              entriesPerPage={entriesPerPage}
              isOpen={isEntriesOpen}
              onToggle={() => setIsEntriesOpen(!isEntriesOpen)}
              handleEntriesChange={handleEntriesChange}
            />
          )}

          {functionalityList?.buttons?.addnew?.status && (
            <AddUserButton addnew={functionalityList?.buttons?.addnew}/>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListHeaderTable;
