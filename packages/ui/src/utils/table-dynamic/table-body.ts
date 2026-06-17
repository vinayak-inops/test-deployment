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

  // Performance monitoring utility
  export const measurePerformance = (label: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
  };

  // Optimized sorting for large datasets (10,000+ items)
  export const sortDataOptimized = <T extends Record<string, any>>(
    data: T[],
    sortColumn: string | null,
    sortDirection: "asc" | "desc"
  ): T[] => {
    if (!sortColumn || data.length === 0) return data;

    // For very large datasets, use optimized sorting
    if (data.length > 5000) {
      return sortLargeDataset(data, sortColumn, sortDirection);
    }

    // For smaller datasets, use standard sorting
    return sortData(data, sortColumn, sortDirection);
  };

  // Optimized sorting for large datasets using efficient algorithms
  const sortLargeDataset = <T extends Record<string, any>>(
    data: T[],
    sortColumn: string,
    sortDirection: "asc" | "desc"
  ): T[] => {
    // Create indexed array for better performance
    const indexedData = data.map((item, index) => ({
      item,
      index,
      value: item[sortColumn]
    }));

    // Sort by data type for optimal performance
    const sortedIndexed = indexedData.sort((a, b) => {
      const aValue = a.value;
      const bValue = b.value;

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === "asc" ? -1 : 1;
      if (bValue == null) return sortDirection === "asc" ? 1 : -1;

      // Type-specific sorting for better performance
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        // Use localeCompare for proper string sorting
        const comparison = aValue.localeCompare(bValue, undefined, { 
          numeric: true, 
          sensitivity: 'base' 
        });
        return sortDirection === "asc" ? comparison : -comparison;
      }

      // Mixed types - convert to string and compare
      const aStr = String(aValue);
      const bStr = String(bValue);
      const comparison = aStr.localeCompare(bStr, undefined, { 
        numeric: true, 
        sensitivity: 'base' 
      });
      return sortDirection === "asc" ? comparison : -comparison;
    });

    // Return sorted items
    return sortedIndexed.map(({ item }) => item);
  };

  // Enhanced search with indexing for large datasets
  export const createSearchIndex = <T extends Record<string, any>>(
    data: T[],
    columns: string[]
  ): Map<string, Set<number>> => {
    const index = new Map<string, Set<number>>();
    
    data.forEach((item, rowIndex) => {
      columns.forEach(column => {
        const value = item[column];
        if (value != null) {
          const searchTerms = String(value).toLowerCase().split(/\s+/);
          searchTerms.forEach(term => {
            if (term.length > 0) {
              if (!index.has(term)) {
                index.set(term, new Set());
              }
              index.get(term)!.add(rowIndex);
            }
          });
        }
      });
    });
    
    return index;
  };

  // Fast search using pre-built index
  export const searchWithIndex = <T extends Record<string, any>>(
    data: T[],
    searchTerm: string,
    searchIndex: Map<string, Set<number>>,
    column: string
  ): T[] => {
    if (!searchTerm.trim()) return data;

    const terms = searchTerm.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    if (terms.length === 0) return data;

    // Find intersection of all search terms
    let resultIndices: Set<number> | null = null;
    
    terms.forEach(term => {
      const termIndices = searchIndex.get(term);
      if (termIndices) {
        if (resultIndices === null) {
          resultIndices = new Set(termIndices);
        } else {
          // Intersection of sets
          resultIndices = new Set(Array.from(resultIndices).filter(index => termIndices.has(index)));
        }
      } else {
        // If any term is not found, return empty result
        resultIndices = new Set();
      }
    });

    if (!resultIndices || (resultIndices as Set<number>).size === 0) return []

    // Convert indices back to data items
    return Array.from(resultIndices as Set<number>).map(index => data[index]!).filter(Boolean);
  };

  // Debounced search for better performance
  export const createDebouncedSearch = <T extends Record<string, any>>(
    callback: (results: T[]) => void,
    delay: number = 300
  ) => {
    let timeoutId: NodeJS.Timeout;
    
    return (searchTerm: string, data: T[], searchIndex: Map<string, Set<number>>, column: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const results = searchWithIndex(data, searchTerm, searchIndex, column);
        callback(results);
      }, delay);
    };
  };

  // Optimized filtering for large datasets
  export const filterDataOptimized = <T extends Record<string, any>>(
    data: T[],
    filters: Array<{
      column: string;
      value: string;
      operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
    }>
  ): T[] => {
    if (filters.length === 0) return data;

    return data.filter(item => {
      return filters.every(filter => {
        const itemValue = item[filter.column];
        if (itemValue == null) return false;

        const itemStr = String(itemValue).toLowerCase();
        const filterStr = filter.value.toLowerCase();

        switch (filter.operator) {
          case 'contains':
            return itemStr.includes(filterStr);
          case 'equals':
            return itemStr === filterStr;
          case 'startsWith':
            return itemStr.startsWith(filterStr);
          case 'endsWith':
            return itemStr.endsWith(filterStr);
          default:
            return true;
        }
      });
    });
  };

  // Virtual scrolling helper for large datasets
  export const getVisibleItems = <T>(
    data: T[],
    startIndex: number,
    endIndex: number
  ): T[] => {
    return data.slice(startIndex, endIndex);
  };

  // Calculate virtual scroll parameters
  export const calculateVirtualScrollParams = (
    totalItems: number,
    containerHeight: number,
    itemHeight: number,
    scrollTop: number
  ) => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + 1, totalItems);
    
    return {
      startIndex,
      endIndex,
      visibleCount,
      totalHeight: totalItems * itemHeight,
      offsetY: startIndex * itemHeight
    };
  };

  // Sort the data (original function for backward compatibility)
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
    value: string | number,
    setEntriesPerPage: any,
    setCurrentPage: any
  ) => {
    setEntriesPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing entries per page
  };
  
  