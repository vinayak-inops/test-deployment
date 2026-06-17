export type CellValue = string | number | boolean | null;
export type Row = CellValue[];
export type Sheet = Row[];
export type SheetData = { [sheetName: string]: Sheet };
export type EmployeeData = {
  [key: string]: string;
};