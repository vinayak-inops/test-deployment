"use client";
import TopTitleDescription from "@repo/ui/components/titleline/top-title-discription";
import { Button } from "@repo/ui/components/ui/button";
import { useDynamicQuery } from "@repo/ui/hooks/api/dynamic-graphql";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken";
import {
  CheckCircle,
  Clock,
  FileText,
  Filter,
  Search,
  UploadCloud,
  XCircle,
  ExternalLink,
  Download,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface UploadedChallanFile {
  _id: string;
  fileName: string;
  fileSize?: string | number;
  workflowName?: string;
  status?: string;
  description?: string;
  uploadedBy?: string;
  createdOn?: string;
  salMonth?: string;
}

const apiBaseUrl = () =>
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : process.env.NEXT_PUBLIC_API_BASE_URL;

export default function FilesAndAssets({
  setOpen,
  permission,
}: {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  permission: any;
}) {
  const router = useRouter();
  const { token } = useAuthToken();
  const tenantCode = useGetTenantCode();
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [fileContentLoading, setFileContentLoading] = useState(false);

  // Download the challan PDF using the document API and constructed path
  const handleDownload = async (file: { _id: string; fileName?: string; salMonth?: string }) => {
    const baseUrl = apiBaseUrl();
    if (!token || !baseUrl) {
      alert("Unable to download. Please sign in again.");
      return;
    }

    // Build server path: /app/documents/Challan/{tenantCode}/{salMonth}/{fileName}.pdf
    const monthSegment = (file as any).salMonth
      ? String((file as any).salMonth).toLowerCase()
      : "nov";
    let fileName = file.fileName || "challan.pdf";
    if (!fileName.toLowerCase().endsWith(".pdf")) {
      fileName = `${(fileName.replace(/\.[^/.]+$/, "") || "challan")}.pdf`;
    }
    const tenantSegment = tenantCode || "Midhani";
    const serverPath = `/app/documents/Challan/${tenantSegment}/${monthSegment}/${fileName}`;

    if (!token || !apiBaseUrl()) {
      alert("Unable to download. Please sign in again.");
      return;
    }
    setFileContentLoading(true);
    try {
      const url = `${baseUrl}/api/query/attendance/document?path=${encodeURIComponent(serverPath)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/pdf",
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error(res.statusText || "Download failed");

      const arrayBuffer = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const objectUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Download failed. Please try again.");
    } finally {
      setFileContentLoading(false);
    }
  };

  const fileDetailsFields = {
    fields: [
      "_id",
      "tenantCode",
      "fileName",
      "fileSize",
      "workflowName",
      "status",
      "description",
      "uploadedBy",
      "createdOn",
    ],
  };

  const { data: challanData, loading } = useDynamicQuery(
    fileDetailsFields,
    "challan",
    "FetchAllFileDetails",
    "fetchAllFileDetails",
    { tenantCode }
  );

  const uploadedFiles = useMemo(() => {
    if (!challanData) return [];
    return (challanData as any[])
      .filter((file: any) => file != null)
      .sort((a: any, b: any) => {
        const aTime = new Date(a?.createdOn || 0).getTime();
        const bTime = new Date(b?.createdOn || 0).getTime();
        return bTime - aTime;
      })
      .map((file: any) => {
        const fileSize = file?.fileSize || 0;
        const fileSizeInKB = Number(fileSize) / 1024;
        const formattedFileSize =
          fileSizeInKB >= 1024
            ? `${(fileSizeInKB / 1024).toFixed(2)} MB`
            : `${fileSizeInKB.toFixed(2)} KB`;
        const createdOn = file?.createdOn || "";
        const formattedDate = createdOn
          ? new Date(createdOn).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : "";
        return {
          ...file,
          fileSize: formattedFileSize,
          createdOn: formattedDate,
        };
      });
  }, [challanData]);

  const tabs = ["All", "Uploaded", "Pending"];

  const renderStatusIcon = (status?: string) => {
    switch (status) {
      case "approved":
      case "completed":
        return <CheckCircle className="text-green-500 w-5 h-5" />;
      case "in-progress":
      case "pending":
        return <Clock className="text-yellow-500 w-5 h-5 animate-pulse" />;
      case "rejected":
        return <XCircle className="text-red-500 w-5 h-5" />;
      default:
        return <Clock className="text-gray-400 w-5 h-5" />;
    }
  };

  const filteredFiles = uploadedFiles.filter((file: any) => {
    const matchesTab =
      activeTab === "All"
        ? true
        : activeTab === "Uploaded"
          ? (file.status === "approved" || file.status === "completed")
          : activeTab === "Pending"
            ? (file.status === "in-progress" || file.status === "pending")
            : true;
    const matchesSearch = (file.fileName || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="w-full max-w-sm p-6 h-full border-gray-200 bg-white shadow-xl bg-gradient-to-br rounded-md my-2">
      <div
        className="h-full overflow-y-auto scroll-hidden"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        } as React.CSSProperties}
      >
        {permission?.excelUpload && (
          <>
            <TopTitleDescription
              titleValue={{
                title: "Challan Upload & Workflow Selection",
                description:
                  "Upload Challan PDF files and store their data by selecting an appropriate workflow.",
              }}
            />

            <button
              onClick={() => setOpen(true)}
              className="border-dashed w-full border-2 border-[#001f32] rounded-xl p-6 mt-4 text-center text-sm text-gray-700 bg-[#f0f5f9] hover:bg-[#e2e8f0] transition"
            >
              <UploadCloud className="mx-auto mb-3 text-[#001f32] w-7 h-7" />
              <p className="font-semibold text-[#001f32]">Click to upload</p>
              <p className="text-xs">Upload PDF files (max size 5MB)</p>
            </button>
          </>
        )}

        {permission?.excelUpload && (
          <div>
            <div className="mt-4">
              <TopTitleDescription
                titleValue={{
                  title: "Uploaded Challan Files",
                  description:
                    "View your uploaded PDF challan files and their processing status.",
                }}
              />
            </div>

            <div className="w-full max-w-2xl p-0 bg-white rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 flex-1">
                  <Search className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by filename"
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
                    className={`px-4 py-1.5 rounded-full text-sm border border-gray-200 font-medium transition ${
                      activeTab === tab
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
              {loading ? (
                <p className="text-sm text-gray-500 p-3">Loading uploaded files...</p>
              ) : filteredFiles.length === 0 ? (
                <p className="text-sm text-gray-500 p-3">No uploaded files yet.</p>
              ) : (
                filteredFiles.map((file: any) => (
                  <div key={file._id}>
                    <button
                      className={`w-full flex justify-between items-center text-sm p-3 rounded-lg border shadow-sm transition-colors ${
                        file._id === selectedFileId
                          ? "bg-blue-50 border-blue-400"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        const alreadySelected = file._id === selectedFileId;
                        setSelectedFileId(alreadySelected ? null : file._id);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="text-red-500 w-5 h-5 shrink-0" />
                        <div className="min-w-0 text-left">
                          <p
                            className={`font-semibold truncate ${
                              file.status === "rejected"
                                ? "text-red-600"
                                : "text-gray-800"
                            }`}
                            title={file.fileName}
                          >
                            {file.fileName || "Unnamed PDF"}
                          </p>
                          {file.createdOn && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {file.createdOn}
                            </p>
                          )}
                          {file.salMonth && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Salary month: {file.salMonth}
                            </p>
                          )}
                        </div>
                      </div>
                      {renderStatusIcon(file.status)}
                    </button>

                    {selectedFileId === file._id && (
                      <div className="mt-2 ml-5 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg text-sm">
                        {file.description && (
                          <p className="font-medium text-blue-900">
                            {file.description}
                          </p>
                        )}
                        <p className="text-blue-800 mt-1">Size: {file.fileSize}</p>
                        {file.uploadedBy && (
                          <p className="text-blue-800">Uploaded by: {file.uploadedBy}</p>
                        )}
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                            onClick={() => handleDownload(file)}
                            disabled={fileContentLoading && selectedFileId === file._id}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            {fileContentLoading && selectedFileId === file._id ? "Downloading…" : "Download"}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() =>
                              router.push(
                                `/challan-upload/upload-statues?mode=all&id=${file._id}`
                              )
                            }
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View status
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
