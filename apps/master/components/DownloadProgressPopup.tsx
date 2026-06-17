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
  progress?: number; // Add progress prop for external control
  statusMessage?: string; // Add status message prop
}

export default function DownloadProgressPopup({
  isOpen,
  onClose,
  onDownload,
  fileName = "report",
  fileExtension = "pdf",
  fileSize = "Unknown",
  fileType = "PDF",
  progress: externalProgress,
  statusMessage: externalStatusMessage
}: DownloadProgressPopupProps) {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [currentStatusMessage, setCurrentStatusMessage] = useState<string>('');

  // Use external progress if provided, otherwise use internal progress
  const currentProgress = externalProgress !== undefined ? externalProgress : downloadProgress;
  const currentMessage = externalStatusMessage || currentStatusMessage;

  // Update download status based on external progress
  useEffect(() => {
    if (externalProgress !== undefined) {
      if (externalProgress === 100) {
        setDownloadStatus('success');
        // Don't auto-close - wait for user to manually close after successful download
      } else if (externalProgress > 0) {
        setDownloadStatus('downloading');
      } else if (externalProgress === 0) {
        setDownloadStatus('downloading'); // Start downloading when progress is 0
      }
    }
  }, [externalProgress]);

  // Reset state when popup opens
  useEffect(() => {
    if (isOpen) {
      setDownloadProgress(0);
      setDownloadStatus('downloading');
      setDownloadError(null);
      setCurrentStatusMessage('Preparing file conversion...');
      
      // Don't start internal download - wait for external progress updates
      // The parent component will control the progress via props
    }
  }, [isOpen]);

  const startDownload = async () => {
    try {
      // Execute the actual download function passed from parent
      await onDownload();
      
      // The parent component will handle progress updates via props
      // This function just triggers the download process
      
    } catch (error) {
      console.error('Error in download process:', error);
      setDownloadStatus('error');
      setDownloadError(error instanceof Error ? error.message : 'Unknown error');
      setCurrentStatusMessage('File conversion failed');
      
      // Don't auto-close on error - let user close manually or parent component controls it
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
          <div className="absolute inset-0 bg-blue-600/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl shadow-sm">
                <DownloadCloud className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">File Generation</h3>
                <p className="text-blue-100 text-sm font-medium">
                  {downloadStatus === 'downloading' ? 'Generating file in browser...' : 
                   downloadStatus === 'success' ? 'File generated successfully!' :
                   downloadStatus === 'error' ? 'Generation failed' :
                   'Preparing file generation...'}
                </p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Simple Progress Section */}
          <div className="text-center space-y-6">
            {/* Enhanced Circular Loader */}
            <div className="flex justify-center">
              {downloadStatus === 'downloading' && (
                <div className="relative">
                  <div className="w-18 h-18 border-4 border-blue-100 rounded-full animate-spin border-t-blue-600"></div>
                  <div className="absolute inset-1 w-16 h-16 border-2 border-blue-200 rounded-full animate-spin border-t-blue-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
              )}
              
              {downloadStatus === 'success' && (
                <div className="w-18 h-18 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-9 h-9 text-white" />
                </div>
              )}
              
              {downloadStatus === 'error' && (
                <div className="w-18 h-18 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <AlertCircle className="w-9 h-9 text-white" />
                </div>
              )}
            </div>

            {/* Enhanced Progress Bar */}
            {downloadStatus === 'downloading' && (
              <div className="space-y-4">
                <div className="w-full bg-gray-100 rounded-full h-3 shadow-inner">
                  <div 
                    className="h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-out shadow-sm"
                    style={{ width: `${Math.max(currentProgress, 2)}%` }}
                  ></div>
                </div>
                <div className="text-sm font-semibold text-blue-700">
                  {currentProgress > 0 ? `${currentProgress}%` : 'Preparing...'}
                </div>
              </div>
            )}

            {/* Enhanced Status Message */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 shadow-sm">
                <p className="text-sm font-semibold text-gray-800">
                  {downloadStatus === 'downloading' && (currentMessage || 'Generating file...')}
                  {downloadStatus === 'success' && 'File downloaded successfully!'}
                  {downloadStatus === 'error' && 'Download failed'}
                </p>
                {downloadStatus === 'error' && downloadError && (
                  <p className="text-xs text-red-600 mt-2 font-medium">{downloadError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced File Info */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">
                {fileName}.{fileExtension}
              </p>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          {downloadStatus === 'error' && (
            <div className="flex gap-3">
              <Button
                onClick={startDownload}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200"
                size="sm"
              >
                Try Again
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                Cancel
              </Button>
            </div>
          )}

          {downloadStatus === 'success' && (
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200"
              size="sm"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
