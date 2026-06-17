import { useState, useRef } from "react";

// Define the return type of the hook
interface TableState {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  entriesPerPage: number;
  setEntriesPerPage: (entries: number) => void;
  sortColumn: string | null;
  setSortColumn: (column: string | null) => void;
  sortDirection: "asc" | "desc";
  setSortDirection: (direction: "asc" | "desc") => void;
  expandedCells: Record<string, boolean>;
  setExpandedCells: (cells: Record<string, boolean>) => void;
  data: Array<Record<string, any>>;
  setData: (data: Array<Record<string, any>>) => void;
  dataColumns: Array<{ key: string; label: string;excelname:string }>;
  setDataColumns: (columns: Array<{ key: string; label: string;excelname:string }>) => void;
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  draggedColumnIndex: number | null;
  setDraggedColumnIndex: (index: number | null) => void;
  dragOverColumnIndex: number | null;
  setDragOverColumnIndex: (index: number | null) => void;
  tableRef: React.RefObject<HTMLDivElement | null>;
}

export function useTableState(): TableState {
  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Expanded cells state
  const [expandedCells, setExpandedCells] = useState<Record<string, boolean>>({});

  // Data and column state
  const [data, setData] = useState<Array<Record<string, any>>>([]);
  const [dataColumns, setDataColumns] = useState<
    Array<{ key: string; label: string;excelname:string }>
  >([]);

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(
    null
  );
  const [dragOverColumnIndex, setDragOverColumnIndex] = useState<number | null>(
    null
  );

  // Table scroll reference
  const tableRef = useRef<HTMLDivElement>(null);

  return {
    currentPage,
    setCurrentPage,
    entriesPerPage,
    setEntriesPerPage,
    sortColumn,
    setSortColumn,
    sortDirection,
    setSortDirection,
    expandedCells,
    setExpandedCells,
    data,
    setData,
    dataColumns,
    setDataColumns,
    dragActive,
    setDragActive,
    draggedColumnIndex,
    setDraggedColumnIndex,
    dragOverColumnIndex,
    setDragOverColumnIndex,
    tableRef,
  };
}