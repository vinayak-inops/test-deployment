import { Dispatch, SetStateAction } from "react";
import { Row, SheetData } from "./excel-file-manager";

export interface ExcelTableProps {
    excelData: SheetData;
    tab: string;
    onDataUpdate: (data: SheetData) => void;
  }
  
  export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }
  
  export interface TableHeaderProps {
    headers: string[];
    onSort: (columnIndex: number) => void;
  }
  
  export interface TableRowProps {
    row: Row;
    headers: string[];
    onEdit: () => void;
    onDelete: () => void;
  }
  
  export interface ActionButtonsProps {
    onEdit: () => void;
    onDelete: () => void;
  }
  
  export interface EditingEmployee {
    sheet: string;
    row: number;
    data: Row;
  }
  
  export interface DownloadExcelProps{
    excelData: SheetData|null;
  }

  
  export interface EditEmployeeFormProps {
    employee: Row
    headers: string[]
    onEditEmployee: (updatedEmployee: Row) => void
    onOpenChange: (open: boolean) => void
  }
  export interface ExcelUploaderProps {
    setXmlFileList: (data: SheetData | null) => void;
    setOpen:Dispatch<SetStateAction<boolean>>;
    setExcelDataTable: Dispatch<SetStateAction<SheetData | null>>
  }
  