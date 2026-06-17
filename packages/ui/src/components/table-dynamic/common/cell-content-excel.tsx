import React, { useRef, useState } from "react";

interface CellContentProps {
  content: string;
  cellId: string;
  expandedCells?: Record<string, boolean>;
  setExpandedCells?: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  functionCallingId: string;
  functionalityList: any;
  rowHeights: { [key: string]: number };
  setRowHeights: React.Dispatch<
    React.SetStateAction<{ [key: string]: number }>
  >;
  columnWidths: { [key: string]: number };
  setColumnWidths: React.Dispatch<
    React.SetStateAction<{ [key: string]: number }>
  >;
  columnKey: string;
  rowKey: string;
  updateCellValue: any;
}

const DEFAULT_WIDTH = 150;
const DEFAULT_HEIGHT = 40;
const MIN_WIDTH = 100;
const MIN_HEIGHT = 30;

const CellContentExcel: React.FC<CellContentProps> = ({
  content,
  cellId,
  rowHeights,
  setRowHeights,
  columnWidths,
  setColumnWidths,
  columnKey,
  rowKey,
  updateCellValue
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(content);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const resizableRef = useRef<HTMLDivElement | null>(null);

  const currentWidth = columnWidths[columnKey] ?? DEFAULT_WIDTH;
  const currentHeight = rowHeights[rowKey] ?? DEFAULT_HEIGHT;

  const measureSize = (text: string) => {
    const span = document.createElement("span");
    span.style.font = "14px Segoe UI";
    span.style.visibility = "hidden";
    span.style.whiteSpace = "pre-wrap";
    span.style.position = "absolute";
    span.style.width = "auto";
    span.style.padding = "8px";
    span.style.lineHeight = "1.5";
    span.style.wordWrap = "break-word";
    span.style.whiteSpace = "pre-wrap";
    span.textContent = text;
    document.body.appendChild(span);
    const rect = span.getBoundingClientRect();
    document.body.removeChild(span);
    const width = Math.max(MIN_WIDTH, rect.width + 20);
    const height = Math.max(MIN_HEIGHT, rect.height + 20);
    return { width, height };
  };

  const handleFocus = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateCellValue(rowKey, columnKey, localValue);
    setRowHeights((prev) => ({ ...prev, [rowKey]: DEFAULT_HEIGHT }));
    setColumnWidths((prev) => ({ ...prev, [columnKey]: DEFAULT_WIDTH }));
  };

  const handleClick = () => {
    if (!isEditing) handleFocus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setLocalValue(text);
    const { width, height } = measureSize(text);

    setColumnWidths((prev) => ({ ...prev, [columnKey]: width }));
    setRowHeights((prev) => ({ ...prev, [rowKey]: height }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = currentWidth;
    const startHeight = currentHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(MIN_WIDTH, startWidth + (e.clientX - startX));
      const newHeight = Math.max(
        MIN_HEIGHT,
        startHeight + (e.clientY - startY)
      );

      setColumnWidths((prev) => ({ ...prev, [columnKey]: newWidth }));
      setRowHeights((prev) => ({ ...prev, [rowKey]: newHeight }));
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  

  return (
    <div
      onClick={handleClick}
      ref={resizableRef}
      className="relative bg-white w-full"
      style={{
        width: currentWidth,
        height: currentHeight,
        minHeight: MIN_HEIGHT,
        minWidth: currentWidth,
        transition: "width 0.2s ease, height 0.2s ease",
      }}
    >
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full h-full p-2 resize-none focus:outline-none text-sm font-[Segoe UI] text-gray-800"
          style={{
            overflow: "hidden",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
          rows={1}
        />
      ) : (
        <div className="w-full h-full p-2 text-sm font-[Segoe UI] truncate text-gray-800">
          {localValue}
        </div>
      )}
      <div
        onMouseDown={handleMouseDown}
        className="absolute bottom-0 right-0 w-2 h-2 bg-gray-400 cursor-nwse-resize z-10"
      />
    </div>
  );
};

export default CellContentExcel;
