"use client";
import TopTitleDescription from "@repo/ui/components/titleline/top-title-discription";
import { Button } from "@repo/ui/components/ui/button";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import {
  CheckCircle,
  Clock, FileText, Filter, Search, UploadCloud, XCircle
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";


export default function FilesAndAssets({
  setOpen,
  permission
}: {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  permission: any;
}) {
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [hasData, setHasData] = useState(false);
  const [excelData, setExcelData] = useState<any>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("excel_data.xlsx");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [excelConfigData, setExcelConfigData] = useState<any>([]);

  const {
    data,
    error,
    loading,
    refetch
  }: {
    data: any;
    error: any;
    loading: any;
    refetch: any;
  } = useRequest<any[]>({
    url: 'Exceluploadconfiguration',
    onSuccess: (data: any) => {
      setExcelConfigData(data);
    },
    onError: (error: any) => {
      console.error('Error loading organization data:', error);
    }
  });

  const tabs = ["All", "Uploaded", "Pending"];

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="text-green-500 w-5 h-5" />;
      case "in-progress":
        return <Clock className="text-yellow-500 w-5 h-5 animate-pulse" />;
      case "rejected":
        return <XCircle className="text-red-500 w-5 h-5" />;
    }
  };

  const handleWorkflowRedirect = () => {
    // router.push('/workflow');
  };

  useEffect(() => {
    const checkSessionStorage = () => {
      const storedData = sessionStorage.getItem("excelData");
      setHasData(!!storedData);
    };

    checkSessionStorage();

    window.addEventListener("storage", checkSessionStorage);
    return () => window.removeEventListener("storage", checkSessionStorage);
  }, []);

  const handleDownload = () => {
    if (!excelData || typeof excelData !== "object") {
      console.warn("No valid Excel data to download.");
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      // Format the data correctly for each sheet
      excelData.forEach((sheetConfig: any) => {
        // Create header row from column definitions
        const headers = sheetConfig.columns[0].map((col: { label: string }) => col.label);

        // Create a sample data row (you might want to replace this with actual data)
        const sampleRow = sheetConfig.columns[0].map((col: { name: string; type: string }) => {
          // Generate appropriate sample data based on column type
          switch (col.type) {
            case "string": return col.name + "_sample";
            case "number": return 100;
            case "boolean": return true;
            default: return "";
          }
        });

        // Combine headers and data into AOA format
        const sheetData = [headers, sampleRow];

        // Create and append the worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetConfig.name);
      });

      XLSX.writeFile(workbook, selectedFileName || "excel_data.xlsx");
    } catch (error) {
      console.error("Error downloading Excel file:", error);
    }
  };

  const excelConfigList = Array.isArray(excelConfigData)
    ? excelConfigData
    : Array.isArray(excelConfigData?.data)
      ? excelConfigData.data
      : [];

  const filteredFiles = excelConfigList.filter((file: any) => {
    const matchesTab =
      activeTab === "All"
        ? true
        : activeTab === "Uploaded"
          ? file.status === "approved"
          : activeTab === "Pending"
            ? file.status === "in-progress"
            : true;

    const matchesSearch = (file?.name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });


  return (
    <div className="w-full max-w-sm p-6 h-full border-gray-200 bg-white shadow-xl bg-gradient-to-br rounded-md my-2">
      <div 
        className="h-full overflow-y-auto scroll-hidden" 
        style={{ 
          WebkitOverflowScrolling: 'touch', 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
        } as React.CSSProperties}
      >
        {
          permission?.excelUpload && (
            <>
              <TopTitleDescription
                titleValue={{
                  title: "Excel Upload & Workflow Selection",
                  description:
                    "Upload Excel files and store their data by selecting an appropriate workflow.",
                }}
              />



              <button
                onClick={() => setOpen(true)}
                className="border-dashed w-full border-2 border-[#001f32] rounded-xl p-6 mt-4 text-center text-sm text-gray-700 bg-[#f0f5f9] hover:bg-[#e2e8f0] transition"
              >
                <UploadCloud className="mx-auto mb-3 text-[#001f32] w-7 h-7" />
                <p className="font-semibold text-[#001f32]">Click to upload</p>
                <p className="text-xs">Upload .xlsx or .xls files (max size 5MB)</p>
              </button>
            </>
          )
        }

        {
          permission?.excelUpload && (
            <div>
              <div className="mt-4">
                <TopTitleDescription
                  titleValue={{
                    title: "Excel Templates",
                    description:
                      "Download pre-defined Excel templates, fill in your data, and upload them to begin processing.",
                  }}
                />
              </div>

              <div className="w-full max-w-2xl p-0 bg-white rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 flex-1">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search"
                      className="ml-2 bg-transparent outline-none text-sm w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                    <Filter className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <div className="flex gap-1 mb-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      className={`px-4 py-1.5 rounded-full text-sm border border-gray-200 font-medium transition ${activeTab === tab
                          ? "bg-gray-200 text-gray-900"
                          : "text-gray-500 hover:bg-gray-100"
                        }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {filteredFiles.map((file: any) => (
                  <div key={file.id}>
                    <button
                      className={`w-full flex justify-between items-center text-sm p-3 rounded-lg border shadow-sm transition-colors ${file.id === selectedFileId
                          ? "bg-blue-50 border-blue-400"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      onClick={() => {
                        const alreadySelected = file.id === selectedFileId;
                        setSelectedFileId(alreadySelected ? null : file.id);
                        setExcelData(
                          alreadySelected ? null : file.filestructure ?? null,
                        );
                        setSelectedFileName(
                          alreadySelected ? "excel_data.xlsx" : file.name,
                        );
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="text-gray-500 w-5 h-5" />
                        <div>
                          <p
                            className={`font-semibold ${file.status === "rejected"
                                ? "text-red-600"
                                : "text-gray-800"
                              }`}
                          >
                            {file.name}
                          </p>
                          {file.status === "rejected" && (
                            <p className="text-xs text-red-400">
                              Voided by {file.rejectedBy}
                            </p>
                          )}
                        </div>
                      </div>
                      {renderStatusIcon(file.status)}
                    </button>

                    {selectedFileId === file.id && (
                      <div className="mt-2 ml-5 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg text-sm">
                        <p className="font-medium text-blue-900">
                          {file.description}
                        </p>
                        <p className="text-blue-800 mt-1">Size: {file.size}</p>
                        <p className="text-blue-800">Uploaded by: {file.uploader}</p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={handleDownload}
                            disabled={!file.filestructure}
                          >
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleWorkflowRedirect}
                          >
                            View Workflow
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
}
