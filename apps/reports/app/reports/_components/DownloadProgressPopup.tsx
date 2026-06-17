import { useState, useEffect } from "react";
import { DownloadCloud, X, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";

interface DownloadProgressPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => Promise<void>;
  fileName?: string;
  fileExtension?: string;
  fileSize?: string;
  fileType?: string;
}

export default function DownloadProgressPopup({
  isOpen,
  onClose,
  onDownload,
  fileName = "report",
  fileExtension = "pdf",
  fileSize = "Unknown",
  fileType = "PDF"
}: DownloadProgressPopupProps) {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Reset state when popup opens
  useEffect(() => {
    if (isOpen) {
      setDownloadProgress(0);
      setDownloadStatus('downloading');
      setDownloadError(null);
      startDownload();
    }
  }, [isOpen]);

  const startDownload = async () => {
    try {
      // Simulate progress steps
      setDownloadProgress(10);
      await new Promise(resolve => setTimeout(resolve, 200));

      setDownloadProgress(30);
      await new Promise(resolve => setTimeout(resolve, 300));

      setDownloadProgress(60);
      await new Promise(resolve => setTimeout(resolve, 400));

      setDownloadProgress(80);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Execute the actual download
      await onDownload();

      setDownloadProgress(100);
      setDownloadStatus('success');
      
      // Auto close popup after 2 seconds
      setTimeout(() => {
        onClose();
        setDownloadStatus('idle');
        setDownloadProgress(0);
      }, 2000);

    } catch (error) {
      console.error('Error in download process:', error);
      setDownloadStatus('error');
      setDownloadError(error instanceof Error ? error.message : 'Unknown error');
      
      // Auto close popup after 3 seconds on error
      setTimeout(() => {
        onClose();
        setDownloadStatus('idle');
        setDownloadProgress(0);
        setDownloadError(null);
      }, 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <DownloadCloud className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Download Progress</h3>
                <p className="text-blue-100 text-sm">Processing your file...</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:bg-white/20 rounded-xl transition-all duration-200"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress Section */}
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {downloadStatus === 'downloading' && 'Preparing file...'}
                  {downloadStatus === 'success' && 'Download completed!'}
                  {downloadStatus === 'error' && 'Download failed'}
                </span>
                <span className="text-lg font-bold text-gray-900">{downloadProgress}%</span>
              </div>
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ease-out relative ${
                      downloadStatus === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                      downloadStatus === 'error' ? 'bg-gradient-to-r from-red-500 to-pink-500' : 
                      'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}
                    style={{ width: `${downloadProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                {/* Progress dots */}
                <div className="flex justify-between mt-2">
                  {[0, 25, 50, 75, 100].map((step) => (
                    <div 
                      key={step}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        downloadProgress >= step ? 
                          (downloadStatus === 'success' ? 'bg-green-500' : 
                           downloadStatus === 'error' ? 'bg-red-500' : 'bg-blue-500') : 
                          'bg-gray-300'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {downloadStatus === 'downloading' && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="relative">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200"></div>
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent absolute inset-0"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Processing file...</p>
                  <p className="text-xs text-blue-600">Converting and preparing download</p>
                </div>
              </div>
            )}

            {downloadStatus === 'success' && (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Download completed!</p>
                  <p className="text-xs text-green-600">File saved to your downloads folder</p>
                </div>
              </div>
            )}

            {downloadStatus === 'error' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="p-2 bg-red-100 rounded-full mt-0.5">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Download failed</p>
                  {downloadError && (
                    <p className="text-xs text-red-600 mt-1">{downloadError}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* File Info Card */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">
                  {fileName}.{fileExtension}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-gray-500">
                    Size: {fileSize}
                  </span>
                  <span className="text-xs text-gray-500">
                    Type: {fileType}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {downloadStatus === 'error' && (
            <div className="flex gap-3 pt-2">
              <Button
                onClick={startDownload}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                size="sm"
              >
                <DownloadCloud className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Success Actions */}
          {downloadStatus === 'success' && (
            <div className="flex gap-3 pt-2">
              <Button
                onClick={onClose}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
