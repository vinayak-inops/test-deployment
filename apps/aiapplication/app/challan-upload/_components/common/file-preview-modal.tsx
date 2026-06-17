"use client";

import React, { useEffect } from "react";
import { Download, FileText, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  viewerUrl: string | null;
  viewerType: string;
  loading: boolean;
}

export default function FilePreviewModal({
  isOpen,
  onClose,
  fileName,
  viewerUrl,
  viewerType,
  loading,
}: FilePreviewModalProps) {
  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", onEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!viewerUrl) return;
    const link = document.createElement("a");
    link.href = viewerUrl;
    link.download = fileName || `challan.${viewerType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Card className="w-full bg-white max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <CardHeader className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700">
              File Viewer ({viewerType.toUpperCase()})
            </CardTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100"
              aria-label="Close viewer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 px-4 py-4 overflow-auto bg-gray-50">
          {loading ? (
            <div className="h-[70vh] flex items-center justify-center text-sm text-gray-600">
              Loading file preview...
            </div>
          ) : viewerUrl && viewerType === "pdf" ? (
            <iframe
              src={viewerUrl}
              className="w-full h-[70vh] rounded-md bg-white border"
              title="Challan File Preview"
            />
          ) : (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-3 text-center">
              <FileText className="h-10 w-10 text-blue-600" />
              <p className="text-sm text-gray-700">Preview not supported for this file type.</p>
              <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="h-4 w-4 mr-1" />
                Download file
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

