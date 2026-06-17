import { useState } from "react";

export function useDraggableColumns(dataColumns: any, setDataColumns: any) {
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(
    null
  );
  const [dragOverColumnIndex, setDragOverColumnIndex] = useState<number | null>(
    null
  );
  const [dragActive, setDragActive] = useState(false);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColumnIndex(index);
    setDragActive(true);
  };

  const handleDragEnter = (index: number) => {
    setDragOverColumnIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedColumnIndex !== null && dragOverColumnIndex !== null) {
      const newColumns = [...dataColumns];
      const draggedColumn = newColumns[draggedColumnIndex];

      newColumns.splice(draggedColumnIndex, 1);
      newColumns.splice(dragOverColumnIndex, 0, draggedColumn);

      setDataColumns(newColumns);
    }

    setDraggedColumnIndex(null);
    setDragOverColumnIndex(null);
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return {
    draggedColumnIndex,
    dragOverColumnIndex,
    dragActive,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    handleDragOver
  };
}