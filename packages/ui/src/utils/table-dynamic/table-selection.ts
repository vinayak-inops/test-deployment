import { TableItem } from "../../types/table";
import { Dispatch, SetStateAction } from "react";

// Define available selection functions
export const SELECTION_FUNCTIONS = {
  HANDLE_SELECT_ALL: 'handleSelectAll',
  HANDLE_INDIVIDUAL_SELECT: 'handleIndividualSelect'
} as const;

// Type for selection functions
type SelectionFunction = typeof SELECTION_FUNCTIONS[keyof typeof SELECTION_FUNCTIONS];

// Validate if a function exists in the functions array
const validateFunction = (functionName: SelectionFunction, functions: string[]): boolean => {
  return Array.isArray(functions) && functions.includes(functionName);
};

export const handleSelectAll = (selectedItems: TableItem[]) => {
  // Dispatch a custom event with the selected items
  const event = new CustomEvent('tableSelectAll', { detail: selectedItems });
  window.dispatchEvent(event);
};

export const handleIndividualSelect = (item: TableItem) => {
  // Dispatch a custom event with the selected item
  const event = new CustomEvent('tableIndividualSelect', { detail: item });
  window.dispatchEvent(event);
};

export const handleSelectAllClick = (
  selectAll: boolean,
  tableData: TableItem[],
  currentItems: TableItem[],
  setData: (data: TableItem[]) => void,
  setSelectAll: (value: boolean) => void,
  setSelectedComponents: Dispatch<SetStateAction<TableItem[]>>,
  functionalityList: any,
  handleSelectAll: (items: TableItem[]) => void
) => {
  // Toggle select all state
  const newSelectAll = !selectAll;

  // Update table data with new selection state
  const updatedData = tableData.map(item => {
    const isOnCurrentPage = currentItems.some(currentItem => currentItem.id === item.id);
    return isOnCurrentPage ? { ...item, isChecked: newSelectAll } : item;
  });
  setData(updatedData);

  // If functionalityList has selectCheck handlers, use them
  if (functionalityList?.columnfunctionality?.selectCheck?.functions) {
    const functions = functionalityList.columnfunctionality.selectCheck.functions;
    
    // Validate if handleSelectAll function exists
    if (validateFunction(SELECTION_FUNCTIONS.HANDLE_SELECT_ALL, functions)) {
      const selectedItems = newSelectAll ? currentItems : [];
      handleSelectAll(selectedItems);
      // Set selectAll state after updating data
      setSelectAll(newSelectAll);
    }
  } else {
    // Original behavior
    if (newSelectAll) {
      setSelectedComponents(currentItems.map(item => ({ ...item, isChecked: true })));
      // Set selectAll state after updating data
      setSelectAll(true);
    } else {
      setSelectedComponents((prev: TableItem[]) => 
        prev.filter((item: TableItem) => !currentItems.some(currentItem => currentItem.id === item.id))
      );
      // Set selectAll state after updating data
      setSelectAll(false);
    }
  }
};

export const handleCollectCheckedData = (
  com: TableItem,
  tableData: TableItem[],
  setData: (data: TableItem[]) => void,
  setSelectedComponents: Dispatch<SetStateAction<TableItem[]>>,
  functionalityList: any,
  handleIndividualSelect: (item: TableItem) => void
) => {
  if (!com) return;

  // Update the table data
  const updatedData = tableData.map((item: TableItem) => {
    if (item.id === com.id) {
      return {
        ...item,
        isChecked: !item.isChecked
      };
    }
    return item;
  });
  setData(updatedData);

  // If functionalityList has selectCheck handlers, use them
  if (functionalityList?.columnfunctionality?.selectCheck?.functions) {
    const functions = functionalityList.columnfunctionality.selectCheck.functions;
    
    // Validate if handleIndividualSelect function exists
    if (validateFunction(SELECTION_FUNCTIONS.HANDLE_INDIVIDUAL_SELECT, functions)) {
      handleIndividualSelect(com);
    }
  } else {
    // Original behavior
    setSelectedComponents((prev: TableItem[]) => {
      const isAlreadySelected = prev.some((component: TableItem) => component.id === com.id);
      if (isAlreadySelected) {
        return prev.filter((componentId: TableItem) => componentId.id !== com.id);
      } else {
        return [...prev, { ...com, isChecked: true }];
      }
    });
  }
}; 