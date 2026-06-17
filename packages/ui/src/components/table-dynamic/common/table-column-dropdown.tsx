import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../ui/dropdown-menu";
import { 
  ArrowDown, 
  ChevronUp, 
  ChevronDown, 
  X,
  SortAsc,
  SortDesc,
  Type,
  ArrowUpDown
} from "lucide-react";

interface ColumnDropdownProps {
  columnKey: string;
  handleSortAsc?: (key: string) => void;
  handleSortDesc?: (key: string) => void;
  handleRenameColumn?: (key: string, value: string) => void;
  currentSortColumn?: string | null;
  currentSortDirection?: "asc" | "desc";
  onClearSort?: (columnKey: string) => void;
  onSortAlphabetical?: (columnKey: string, direction: "A-Z" | "Z-A") => void;
}

const ColumnDropdown: React.FC<ColumnDropdownProps> = ({ 
  columnKey, 
  handleSortAsc, 
  handleSortDesc, 
  handleRenameColumn,
  currentSortColumn,
  currentSortDirection,
  onClearSort,
  onSortAlphabetical
}) => {
  const isCurrentColumn = currentSortColumn === columnKey;
  const isAscending = isCurrentColumn && currentSortDirection === "asc";
  const isDescending = isCurrentColumn && currentSortDirection === "desc";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none ml-2 p-1 rounded hover:bg-gray-100 transition-colors">
          <ArrowDown className={`h-4 w-4 ${isCurrentColumn ? 'text-blue-600' : 'text-gray-400'} hover:text-gray-600 transition-colors`} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-white shadow-lg border border-gray-200 rounded-lg">
        {/* Sort Options Header */}
        <div className="px-3 py-2 border-b border-gray-100">
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Sort Options</h4>
        </div>
        
        {/* Sort Ascending */}
        <DropdownMenuItem 
          onClick={() => handleSortAsc && handleSortAsc(columnKey)} 
          className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
            isAscending 
              ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <SortAsc className={`h-4 w-4 ${isAscending ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className="text-sm font-medium">Sort Ascending</span>
          </div>
          <ChevronUp className={`h-4 w-4 ${isAscending ? 'text-blue-600' : 'text-gray-400'}`} />
        </DropdownMenuItem>
        
        {/* Sort Descending */}
        <DropdownMenuItem 
          onClick={() => handleSortDesc && handleSortDesc(columnKey)} 
          className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
            isDescending 
              ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <SortDesc className={`h-4 w-4 ${isDescending ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className="text-sm font-medium">Sort Descending</span>
          </div>
          <ChevronDown className={`h-4 w-4 ${isDescending ? 'text-blue-600' : 'text-gray-400'}`} />
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        {/* Alphabetical Sorting Section */}
        <div className="px-3 py-2 border-b border-gray-100">
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Alphabetical</h4>
        </div>

        {/* A to Z */}
        <DropdownMenuItem 
          onClick={() => onSortAlphabetical && onSortAlphabetical(columnKey, "A-Z")} 
          className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 text-gray-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">A to Z</span>
          </div>
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
        </DropdownMenuItem>

        {/* Z to A */}
        <DropdownMenuItem 
          onClick={() => onSortAlphabetical && onSortAlphabetical(columnKey, "Z-A")} 
          className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 text-gray-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">Z to A</span>
          </div>
          <ArrowUpDown className="h-4 w-4 text-gray-400 rotate-180" />
        </DropdownMenuItem>

        {/* Clear Sort - Only show if column is currently sorted */}
        {isCurrentColumn && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem 
              onClick={() => onClearSort && onClearSort(columnKey)}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="text-sm font-medium">Clear Sort</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ColumnDropdown;