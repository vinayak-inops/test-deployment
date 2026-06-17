import React, { isValidElement } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  isDateLikeString,
  toggleCellExpansion,
} from "../../../utils/table-dynamic/table-body";

// Helper function to check if content is an object
const isObject = (content: any): boolean => {
  return typeof content === 'object' && content !== null && !Array.isArray(content);
};

// Helper function to get first object value
const getFirstObjectValue = (obj: any): string => {
  const keys = Object.keys(obj);
  if (keys.length === 0) return "";
  const firstKey = keys[0]!;
  const firstValue = obj[firstKey];
  
  // If the first value is also an object, recursively get its first value
  if (isObject(firstValue)) {
    return getFirstObjectValue(firstValue);
  }
  
  // Convert to string and handle different types
  if (typeof firstValue === 'string') {
    return firstValue;
  } else if (typeof firstValue === 'number' || typeof firstValue === 'boolean') {
    return String(firstValue);
  } else if (Array.isArray(firstValue)) {
    return firstValue.length > 0 ? String(firstValue[0]) : "";
  }
  
  return String(firstValue || "");
};

interface CellContentProps {
  content: any;
  cellId: string;
  expandedCells?: Record<string, boolean>;
  setExpandedCells?: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  functionCallingId: string;
}

const CellContent: React.FC<CellContentProps> = ({
  content,
  cellId,
  expandedCells,
  setExpandedCells,
  functionCallingId,
}) => {
  if (!content) return "";

  const isExpanded = expandedCells && expandedCells[cellId];
  const isObjectContent = isObject(content);
  const isDateLike = isDateLikeString(content);

  if (isValidElement(content)) {
    return content;
  }

  // If content is an object, get the first object value
  if (isObjectContent) {
    const firstValue = getFirstObjectValue(content);
    const needsTruncation = firstValue.length > 10;
    
    if (!needsTruncation) {
      return <div className="flex items-start whitespace-nowrap">{firstValue}</div>;
    }

    return (
      <div className="flex items-start justify-between w-full">
        <div className={`${isExpanded ? "" : "truncate"}`}>
          {expandedCells
            ? isExpanded
              ? firstValue
              : firstValue.substring(0, 10) + "..."
            : firstValue}
        </div>
        <button
          className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            if (setExpandedCells) {
              toggleCellExpansion(cellId, setExpandedCells);
            }
          }}
        >
          {expandedCells &&
            (isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            ))}
        </button>
      </div>
    );
  }

  // Convert content to string for length check
  const contentString = String(content);
  const needsTruncation = contentString.length > 10;

  // For date-like strings, ensure they appear on a single line
  if (isDateLike) {
    return (
      <div className="flex items-start whitespace-nowrap">
        <div>{content}</div>
      </div>
    );
  }

  // For regular text
  if (!needsTruncation) {
    return <div className="flex items-start whitespace-nowrap">{content}</div>;
  }

  return (
    <div className="flex items-start justify-between w-full">
      <div className={`${isExpanded ? "" : "truncate"}`}>
        {expandedCells
          ? isExpanded
            ? content
            : contentString.substring(0, 10) + "..."
          : content}
      </div>
      <button
        className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
        onClick={(e) => {
          e.stopPropagation();
          if (setExpandedCells) {
            toggleCellExpansion(cellId, setExpandedCells);
          }
        }}
      >
        {expandedCells &&
          (isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ))}
      </button>
    </div>
  );
};

export default CellContent;
