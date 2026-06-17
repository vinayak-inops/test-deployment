export const toggleCellExpansion = (
    cellId: string,
    setExpandedCells: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  ) => {
    setExpandedCells((prev) => ({
      ...prev,
      [cellId]: !prev[cellId],
    }));
  };
  
  // Helper to detect if a string looks like a date
  export const isDateLikeString = (str: string): boolean => {
    // Basic patterns for date detection
    const datePatterns = [
      /\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/, // Date patterns like YYYY-MM-DD, DD/MM/YYYY
      /\d{1,2}:\d{1,2}(:\d{1,2})?/, // Time patterns like HH:MM:SS or HH:MM
      /\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\s+\d{1,2}:\d{1,2}/, // DateTime patterns
    ];

    return datePatterns.some((pattern) => pattern.test(str));
  };

  // Sort the data
  export const sortData = <T extends Record<string, any>>(
    data: T[],
    sortColumn: string | null,
    sortDirection: "asc" | "desc"
  ): T[] => {
    if (!sortColumn) return data;
  
    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
  
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
  
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
  
      return 0;
    });
  };
  
  // Handle page change
  export const handlePageChange = (
    pageNumber: number,
    setCurrentPage: any
  ) => {
    setCurrentPage(pageNumber);
  };
  
    // Handle entries per page change
  export const handleEntriesChange = (
    value: string,
    setEntriesPerPage: any,
    setCurrentPage: any
  ) => {
    setEntriesPerPage(Number.parseInt(value));
    setCurrentPage(1); // Reset to first page when changing entries per page
  };
  
  