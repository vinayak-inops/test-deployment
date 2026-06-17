"use client"
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

type Column = {
  name: string;
  label: string;
  type: "string" | "number" | "boolean";
};
const DownloadExcel: React.FC = () => {
  const handleDownload = () => {
    const workbook = XLSX.utils.book_new();

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    saveAs(file, "GeneratedData.xlsx");
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Download Excel Template</h2>
      <button
        onClick={handleDownload}
        style={{
          padding: "10px 20px",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Download Excel
      </button>
    </div>
  );
};

export default DownloadExcel;
