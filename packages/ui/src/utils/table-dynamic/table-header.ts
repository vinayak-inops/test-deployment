  // Sort handlers
  export const handleSort = (
    column: string,
    direction: "asc" | "desc",
    setSortColumn: (column: string) => void,
    setSortDirection: (direction: "asc" | "desc") => void
  ) => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  // Handle column rename
  export const renameColumn = (
    dataColumns: Array<{ key: string; label: string;excelname:string }>,
    key: string,
    newLabel: string
  ) => {
    if (!newLabel) return dataColumns;
  
    return dataColumns.map((col) =>
      col.key === key ? { ...col, label: newLabel.toUpperCase(),excelname:newLabel } : col
    );
  };