import React from "react";
import ColumnDropdown from "./common/table-column-dropdown";
import { ChevronUp, ChevronDown } from "lucide-react";

interface TableHeaderProps {
  functionalityList: any;
  dataColumns: Array<{ key: string; label: string }>;
  dragActive?: boolean;
  draggedColumnIndex?: number | null;
  dragOverColumnIndex?: number | null;
  getColumnStyle: (
    index: number,
    dragActive: boolean,
    draggedColumnIndex: number | null,
    dragOverColumnIndex: number | null
  ) => string;
  handleDragStart?: (
    e: React.DragEvent<HTMLTableCellElement>,
    index: number
  ) => void;
  handleDragOver?: (e: React.DragEvent<HTMLTableCellElement>) => void;
  handleDragEnter?: (index: number) => void;
  handleDragEnd?: () => void;
  handleSortAsc?: (key: string) => void;
  handleSortDesc?: (key: string) => void;
  handleRenameColumn?: (key: string, value: string) => void;
  selectAll: boolean;
  handleSelectAll: () => void;
  currentSortColumn?: string | null;
  currentSortDirection?: "asc" | "desc";
  onClearSort?: (columnKey: string) => void;
  onSortAlphabetical?: (columnKey: string, direction: "A-Z" | "Z-A") => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  functionalityList,
  dataColumns,
  dragActive,
  draggedColumnIndex,
  dragOverColumnIndex,
  getColumnStyle,
  handleDragStart,
  handleDragOver,
  handleDragEnter,
  handleDragEnd,
  handleSortAsc,
  handleSortDesc,
  handleRenameColumn,
  selectAll,
  handleSelectAll,
  currentSortColumn,
  currentSortDirection,
  onClearSort,
  onSortAlphabetical,
}) => {
  const formatColumnKey = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim(); // Remove any leading/trailing spaces
  };

  return (
    <thead className="px-4">
      <tr className={`bg-[#f9fafc] ${functionalityList?.tabletype.classvalue?.tableheder?.container}`}>
        {functionalityList?.columnfunctionality?.slNumber?.status && (
          <th className="py-3 px-4 text-[#374151] pl-6 text-left text-sm font-medium  uppercase tracking-wider whitespace-nowrap">
            SL.No
          </th>
        )}
        {functionalityList?.columnfunctionality?.selectCheck?.status && (
          <th className="py-3 px-4 text-left text-sm font-medium  uppercase tracking-wider whitespace-nowrap">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                aria-label="Select all rows"
              />
            </div>
          </th>
        )}

        {dataColumns.map((column, index) => {
          if(column.key != "_id"){
            return (
              <th
                key={column.key}
                className={`py-4 px-2 text-left font-medium text-sm tracking-wider relative ${getColumnStyle ? getColumnStyle(index, !!dragActive, draggedColumnIndex ?? null, dragOverColumnIndex ?? null) : ""} transition-colors duration-200 whitespace-nowrap text-[#374151]`}
                draggable={!!handleDragStart}
                onDragStart={(e) => handleDragStart && handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver && handleDragOver(e)}
                onDragEnter={() => handleDragEnter && handleDragEnter(index)}
                onDragEnd={() => handleDragEnd && handleDragEnd()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{formatColumnKey(column.key)}</span>
                    {/* Sort indicators */}
                    {currentSortColumn === column.key && (
                      <div className="flex items-center">
                        {currentSortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4 text-blue-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    )}
                  </div>
      
                  {/* Dropdown Menu */}
                  <ColumnDropdown
                    columnKey={column.key}
                    handleSortAsc={handleSortAsc}
                    handleSortDesc={handleSortDesc}
                    handleRenameColumn={handleRenameColumn}
                    currentSortColumn={currentSortColumn}
                    currentSortDirection={currentSortDirection}
                    onClearSort={onClearSort}
                    onSortAlphabetical={onSortAlphabetical}
                  />
                </div>
      
                {/* Drag Indicator */}
                {dragActive && draggedColumnIndex === index && (
                  <div className="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-50 bg-opacity-50 pointer-events-none"></div>
                )}
              </th>
            );
          }
          return null;
        })}
        {functionalityList?.columnfunctionality?.activeColumn?.status && (
          /* Actions Column */
          <th className="py-3 px-4 text-left text-sm font-medium  uppercase tracking-wider whitespace-nowrap">
            ACTIONS
          </th>
        )}
      </tr>
    </thead>
  );
};

export default TableHeader;