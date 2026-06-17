// Helper to get column styling
export const getColumnStyle = (
    index: number,
    dragActive?: boolean,
    draggedColumnIndex?: number | null,
    dragOverColumnIndex?: number | null
  ): string => {
    if (dragActive) {
      if (draggedColumnIndex === index) {
        return "opacity-70 bg-blue-100";
      }
      if (dragOverColumnIndex === index) {
        return "bg-gray-100";
      }
    }
    return "";
  };
  