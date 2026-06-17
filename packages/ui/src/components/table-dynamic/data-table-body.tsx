import React, { isValidElement } from "react";
import TableActions from "./common/table-actions";
import { Checkbox } from "../ui/checkbox";
import CellContent from "./common/cell-content";
import CellContentExcel from "./common/cell-content-excel";

interface TableBodyProps {
  data: Array<Record<string, any>>;
  dataColumns: Array<{ key: string; label: string }>;
  expandedCells?: Record<string, boolean>;
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  setExpandedCells?: any;
  functionalityList?: any;
  collectCheckedData: (item: any) => void;
  rowHeights: any;
  columnWidths: any;
  setRowHeights: any;
  setColumnWidths: any;
  updateCellValue: any;
  selectAll?: boolean;
}

const TableBody: React.FC<TableBodyProps> = ({
  data,
  dataColumns,
  expandedCells,
  handleEdit,
  handleDelete,
  setExpandedCells,
  functionalityList,
  collectCheckedData,
  rowHeights,
  columnWidths,
  setRowHeights,
  setColumnWidths,
  updateCellValue,
  selectAll,
}) => {
  return (
    <tbody className={`bg-white`}>
      {data.map((item, rowIndex) => (
        <tr
          className={
            functionalityList.tabletype.type === "excel"
              ? "even:bg-gray-50 odd:bg-white border border-gray-300"
              : functionalityList.tabletype.type === "data"
                ? "border-b hover:bg-gray-50"
                : ""
          }
          key={item.id || rowIndex}
        >
          {functionalityList?.columnfunctionality?.slNumber?.status && (
            <td className="flex justify-center items-center min-h-full py-3 px-4">
              {rowIndex + 1}
            </td>
          )}
          {functionalityList?.columnfunctionality?.selectCheck?.status && (
            <td className="flex justify-center items-center min-h-full py-1 px-4">
              <input
                type="checkbox"
                checked={selectAll || item.isChecked}
                onChange={() => collectCheckedData(item)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </td>
          )}
          {dataColumns.map((column) => {
            if (column.key === "functioncallingid") {
              return null; // Skip rendering this column
            }

            const cellId = `${item.id || rowIndex}-${column.key}`;
            const value = item[column.key];
            let cellContent: any;

            if (isValidElement(value)) {
              // It's a React component
              cellContent = value || "";
            } else {
              cellContent = value?.toString?.() || "";
            }
            const _id = item._id
            if (column.key != "_id") {
              return (
                <td
                  key={cellId}
                  className={
                    functionalityList.tabletype.type === "excel"
                      ? `border border-gray-300 p-[0] text-sm text-gray-500`
                      : functionalityList.tabletype.type === "data"
                        ? isValidElement(cellContent)
                          ? `p-0`
                          : `py-1 px-2 text-sm text-gray-500 ${expandedCells && expandedCells[cellId]
                            ? "h-auto"
                            : ""
                          }`
                        : ""
                  }
                >
                  {functionalityList?.tabletype.type == "excel" && (
                    <CellContentExcel
                      setExpandedCells={setExpandedCells}
                      expandedCells={expandedCells}
                      content={cellContent}
                      cellId={cellId}
                      functionalityList={functionalityList}
                      functionCallingId={item.functioncallingid}
                      rowHeights={rowHeights}
                      setRowHeights={setRowHeights}
                      columnWidths={columnWidths}
                      setColumnWidths={setColumnWidths}
                      columnKey={column.key}
                      updateCellValue={updateCellValue}
                      rowKey={item.id || rowIndex.toString()}
                    />
                  )}{" "}
                  {functionalityList?.tabletype.type == "data" && (
                    <CellContent
                      setExpandedCells={setExpandedCells}
                      expandedCells={expandedCells}
                      content={cellContent}
                      cellId={cellId}
                      functionCallingId={item._id}
                    />
                  )}
                </td>
              );
            }
          })}
          {/* Actions (Edit & Delete) */}
          {
            functionalityList?.columnfunctionality?.activeColumn?.status && (
              <TableActions
                item={item}
                id={item.id || rowIndex.toString()}
                onEdit={handleEdit}
                onDelete={handleDelete}
                functionCallingId={item}
                functionalityList={functionalityList}
              />
            )
          }

        </tr>
      ))}
      {functionalityList.addNewRows && (
        <tr>
          <td colSpan={dataColumns.length + 2} className="py-0 px-0 text-left">
            <button
              onClick={functionalityList?.handleAddRow}
              className="bg-green-500 hover:bg-green-600 text-white w-6 h-6 p-0 flex items-center justify-center text-lg font-bold"
              title="Add Row"
            >
              +
            </button>
          </td>
        </tr>
      )}
    </tbody>
  );
};

export default TableBody;
