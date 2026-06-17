import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CellContent from "./cell-content-excel";
import RenderPagination from "./render-pagination";

interface PaginationControlsProps {
  dataLength: number;
  indexOfFirstItem: number;
  indexOfLastItem: number;
  totalPages: number;
  currentPage: number;
  handlePageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  dataLength,
  indexOfFirstItem,
  indexOfLastItem,
  totalPages,
  currentPage,
  handlePageChange,
}) => {
  if (dataLength === 0) return null;

  return (
    <div className="flex items-center justify-between mt-0 text-sm px-6 py-4">
      <div className="text-gray-500">
        Showing {indexOfFirstItem + 1} to{" "}
        {Math.min(indexOfLastItem, dataLength)} of {dataLength} entries
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`w-8 h-8 flex items-center justify-center rounded-full ${
            currentPage === 1
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <RenderPagination
          handlePageChange={handlePageChange}
          currentPage={currentPage}
          totalPages={totalPages}
        />
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`w-8 h-8 flex items-center justify-center rounded-full ${
            currentPage === totalPages
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
