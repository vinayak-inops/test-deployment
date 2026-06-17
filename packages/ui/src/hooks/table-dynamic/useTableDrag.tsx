import { useEffect, RefObject } from "react";

const useTableDrag = (tableRef: any) => {
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    let isDragging = false;
    let startX: number;
    let scrollLeft: number;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.pageX - table.offsetLeft;
      scrollLeft = table.scrollLeft;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - table.offsetLeft;
      const walk = (x - startX) * 2; // Adjust scroll speed
      table.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    table.addEventListener("mousedown", handleMouseDown);
    table.addEventListener("mousemove", handleMouseMove);
    table.addEventListener("mouseup", handleMouseUp);
    table.addEventListener("mouseleave", handleMouseUp);

    return () => {
      table.removeEventListener("mousedown", handleMouseDown);
      table.removeEventListener("mousemove", handleMouseMove);
      table.removeEventListener("mouseup", handleMouseUp);
      table.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [tableRef]);
};

export default useTableDrag;