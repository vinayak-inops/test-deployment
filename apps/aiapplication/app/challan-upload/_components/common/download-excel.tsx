"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { DownloadIcon } from "lucide-react";
import * as XLSX from "xlsx";

function DownloadExcel({ excelData }: { excelData: any }) {
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const checkSessionStorage = () => {
      const storedData = sessionStorage.getItem("excelData");
      setHasData(!!storedData);
    };

    checkSessionStorage();

    // Add event listener for storage changes
    window.addEventListener("storage", checkSessionStorage);

    // Cleanup
    return () => {
      window.removeEventListener("storage", checkSessionStorage);
    };
  }, [excelData]);

  const handleDownload = () => {
    try {
      const storedData = sessionStorage.getItem("excelData");
      if (!storedData) {
        console.error("No data found in session storage");
        return;
      }

      const parsedData = JSON.parse(storedData);

      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // For each sheet in the parsed data
      Object.entries(parsedData).forEach(([sheetName, sheetData]) => {
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData as unknown[][]);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      // Write the workbook and trigger download
      XLSX.writeFile(workbook, `excel_data.xlsx`);
    } catch (error) {
      console.error("Error downloading Excel file:", error);
    }
  };

  if (!hasData) {
    return null;
  }

  return (
    <Button onClick={handleDownload}>
      <DownloadIcon className="mr-2 h-4 w-4" />
      Download Excel
    </Button>
  );
}

export default DownloadExcel;
