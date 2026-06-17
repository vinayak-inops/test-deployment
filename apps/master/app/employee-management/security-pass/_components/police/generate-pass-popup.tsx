"use client"

import React from "react"
import { createPortal } from "react-dom"
import { Button } from "@repo/ui/components/ui/button"
import { CreditCard, X, CheckCircle, XCircle, Loader2, Eye, Download, FileText, Clock } from "lucide-react"
import AutoStatusUpdate from "./auto-stutues-update"

// Utility function for base64 to blob conversion
const base64ToBlob = (base64Data: string, mimeType: string): Blob => {
  try {
    // Input validation
    if (!base64Data || typeof base64Data !== 'string') {
      throw new Error('Invalid input: base64Data must be a non-empty string');
    }

    // Validate base64 string format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64Data)) {
      throw new Error('Invalid base64 string format');
    }

    // Check for reasonable file size (max 50MB to prevent memory issues)
    const estimatedSize = Math.ceil((base64Data.length * 3) / 4);
    if (estimatedSize > 50 * 1024 * 1024) {
      throw new Error('File size too large (max 50MB)');
    }

    // Convert base64 to binary array using proper binary handling
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create blob with proper MIME type
    const blob = new Blob([bytes], { type: mimeType });
    
    // Validate blob was created successfully
    if (blob.size === 0) {
      throw new Error('Generated file is empty');
    }



    return blob;
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    throw error;
  }
};

// Utility function for downloading blob
const downloadBlob = (blob: Blob, filename: string) => {
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    

  } catch (error) {
    console.error('Error creating download link:', error);
    throw error;
  }
};

// Utility function to validate PDF base64 data
const isValidPdfBase64 = (base64Data: string): boolean => {
  try {
    // Check if it's valid base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64Data)) {
      return false;
    }

    // More flexible PDF header check - PDF files can start with different headers
    const pdfHeaders = ['JVBERi0xLjQK', 'JVBERi0xLjQNCg==', 'JVBERi0xLjQNCg==', 'JVBERi0xLjQ'];
    const startsWithPdfHeader = pdfHeaders.some(header => base64Data.startsWith(header));
    
    if (!startsWithPdfHeader) {
      // Don't fail here - some PDFs might have different headers
    }

    // Try to convert to blob to ensure it's valid
    const blob = base64ToBlob(base64Data, 'application/pdf');
    const isValid = blob.size > 0;
    return isValid;
  } catch (error) {
    console.error('Error validating PDF base64:', error);
    return false;
  }
};

interface GeneratePassPopupProps {
  isOpen: boolean
  onClose: () => void
  fileId: string | null
  onShowDownloadProgress?: any
  onPdfFileReady?: () => void
  statusShower:any
  downloadProgress?: {
    updateProgress: (progress: number, message?: string) => void
    setComplete: () => void
    setError: (error: string) => void
  }
}

// PDF Preview Component with multiple fallback strategies
const PdfPreview = ({ base64String, onError }: { base64String: string; onError: (error: string) => void }) => {
  const [currentMethod, setCurrentMethod] = React.useState<'blob' | 'direct' | 'object' | 'embed' | 'external'>('blob');
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    if (!base64String) return;

    try {
      setIsLoading(true);
      setHasError(false);

      // Create blob URL for blob method
      const blob = base64ToBlob(base64String, 'application/pdf');
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setIsLoading(false);
      

    } catch (error) {
      console.error("Error converting base64 to PDF for preview:", error);
      setHasError(true);
      setIsLoading(false);
      onError("Failed to convert PDF data for preview");
    }

    // Cleanup function
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [base64String, onError]);

  const tryNextMethod = () => {
    const methods: Array<'blob' | 'direct' | 'object' | 'embed' | 'external'> = ['blob', 'direct', 'object', 'embed', 'external'];
    const currentIndex = methods.indexOf(currentMethod);
    const nextMethod = methods[currentIndex + 1];
    
    if (nextMethod) {
      setCurrentMethod(nextMethod);
      setHasError(false);
      setRetryCount(prev => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const openExternalPreview = () => {
    try {
      const blob = base64ToBlob(base64String, 'application/pdf');
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.onload = () => URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to open external preview:', error);
      onError('Failed to open external preview');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-400 mx-auto mb-2 animate-spin" />
          <p className="text-blue-600 font-medium">Converting PDF...</p>
          <p className="text-sm text-blue-500">Please wait while we prepare the preview</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 font-medium">PDF Preview Unavailable</p>
          <p className="text-sm text-red-500 mb-3">All preview methods failed to load the PDF.</p>
          <div className="space-y-2">
            <Button
              onClick={() => {
                setCurrentMethod('blob');
                setHasError(false);
                setRetryCount(0);
              }}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Retry Preview
            </Button>
            <Button
              onClick={openExternalPreview}
              variant="outline"
              className="px-3 py-1 text-xs"
            >
              Open in New Tab
            </Button>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Total attempts: {retryCount} | Last method: {currentMethod}
          </div>
        </div>
      </div>
    );
  }

  // Method 1: Blob URL iframe (most reliable)
  if (currentMethod === 'blob' && blobUrl) {
  return (
    <iframe
        src={blobUrl}
      className="w-full h-full"
        title="Security Pass PDF Preview (Blob)"
              onLoad={() => {
          setIsLoading(false);
        }}
              onError={() => {
          tryNextMethod();
        }}
      style={{ border: 'none' }}
    />
    );
  }

  // Method 2: Direct base64 data URL
  if (currentMethod === 'direct') {
    return (
      <iframe
        src={`data:application/pdf;base64,${base64String}`}
        className="w-full h-full"
        title="Security Pass PDF Preview (Direct)"
        onLoad={() => {
          setIsLoading(false);
        }}
        onError={() => {
          tryNextMethod();
        }}
        style={{ border: 'none' }}
      />
    );
  }

  // Method 3: Object tag (alternative PDF viewer)
  if (currentMethod === 'object') {
    return (
      <object
        data={`data:application/pdf;base64,${base64String}`}
        type="application/pdf"
        className="w-full h-full"
        onError={() => {
          tryNextMethod();
        }}
      >
        <p>PDF cannot be displayed. <a href={`data:application/pdf;base64,${base64String}`} target="_blank">Click here to view</a></p>
      </object>
    );
  }

  // Method 4: Embed tag (last resort)
  if (currentMethod === 'embed') {
    return (
      <embed
        src={`data:application/pdf;base64,${base64String}`}
        type="application/pdf"
        className="w-full h-full"
        onError={() => {
          tryNextMethod();
        }}
      />
    );
  }

  // Method 5: External preview (opens in new tab)
  if (currentMethod === 'external') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">PDF Preview Unavailable</h3>
          <p className="text-sm text-gray-600 mb-4">
            The PDF cannot be displayed in this viewer due to browser restrictions.
          </p>
          <div className="space-y-3">
            <Button
              onClick={openExternalPreview}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Eye className="h-4 w-4 mr-2" />
              Open PDF in New Tab
            </Button>
            <Button
              onClick={() => {
                setCurrentMethod('blob');
                setHasError(false);
                setRetryCount(0);
              }}
              variant="outline"
              className="w-full"
            >
              Retry Preview
            </Button>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Attempts: {retryCount} | Method: External Preview
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <XCircle className="h-12 w-12 text-red-400 mx-auto mb-2" />
        <p className="text-red-600 font-medium">Preview Method Not Available</p>
        <Button onClick={tryNextMethod} className="mt-2">
          Try Next Method
        </Button>
      </div>
    </div>
  );
};

export function GeneratePassPopup({
  isOpen,
  onClose,
  fileId,
  onShowDownloadProgress,
  onPdfFileReady,
  statusShower,
  downloadProgress
}: GeneratePassPopupProps) {
  const [mounted, setMounted] = React.useState(false)
  const [reportData, setReportData] = React.useState<string | null>(null)
  const [pdfData, setPdfData] = React.useState<string | null>(null)
  const [isAutoStatusRunning, setIsAutoStatusRunning] = React.useState(false)
  const [isPdfGenerationComplete, setIsPdfGenerationComplete] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    
    // Cleanup function to reset states when component unmounts
    return () => {
      setReportData(null)
      setIsAutoStatusRunning(false)
      setIsPdfGenerationComplete(false)
    }
  }, [])

  // Reset states when popup closes
  React.useEffect(() => {
    if (!isOpen) {
      setReportData(null)
      setIsAutoStatusRunning(false)
      setIsPdfGenerationComplete(false)
    }
  }, [isOpen])

  // Auto-trigger PDF data fetch when fileId is available
  React.useEffect(() => {
    if (fileId && !isPdfGenerationComplete) {
      setIsAutoStatusRunning(true)
    }
  }, [fileId, isPdfGenerationComplete])
  
  if (!isOpen || !mounted) return null

  // Function to handle PDF data from setPdfData callback
  const handlePdfData = (pdfData: any) => {
    // If this is valid PDF data, use it
    if (pdfData && typeof pdfData === 'string' && pdfData.trim() !== '') {
      if (isValidPdfBase64(pdfData)) {
        setReportData(pdfData);
        setIsPdfGenerationComplete(true); // Mark PDF generation as complete
        // Notify parent that PDF file is ready
        if (onPdfFileReady) {
          onPdfFileReady();
        }
        // Don't switch tabs, just update the data
      }
    }
  };

  // Function to handle report data from timeline
  const handleTimelineReportData = (reportData: any) => {
    // Handle different data structures that might be passed
    let base64String = '';
    
    if (typeof reportData === 'string') {
      base64String = reportData;
    } else if (reportData && typeof reportData === 'object') {
      // If it's an object, try to extract the report field
      if (reportData.report && typeof reportData.report === 'string') {
        base64String = reportData.report;
      } else if (reportData.data && typeof reportData.data === 'string') {
        base64String = reportData.data;
      } else if (reportData.content && typeof reportData.content === 'string') {
        base64String = reportData.content;
      } else if (reportData.base64 && typeof reportData.base64 === 'string') {
        base64String = reportData.base64;
      } else {
        console.warn("Could not find report string in object:", reportData);
        return;
      }
    } else {
      console.warn("Invalid report data received:", reportData);
      return;
    }
    
    if (base64String && base64String.trim() !== '') {
      // Use utility function to validate PDF base64 data
      if (isValidPdfBase64(base64String)) {
        setReportData(base64String);
        setIsPdfGenerationComplete(true); // Mark PDF generation as complete
        // Notify parent that PDF file is ready
        if (onPdfFileReady) {
          onPdfFileReady();
        }
        // Don't switch tabs, just update the data
      } else {
        console.warn("Received data is not a valid PDF base64 string");
        console.error("PDF validation failed for timeline data");
      }
    } else {
      console.warn("No valid base64 string found in report data");
    }
  }

  // Function to handle PDF download with progress tracking
  const handleDownloadPdf = async () => {
    if (!reportData) return;
    
    // Show download progress popup when download starts
    statusShower()
    
    try {
      
      // Update progress: Starting download
      if (downloadProgress) {
        downloadProgress.updateProgress(10, 'Preparing PDF download...');
      }
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update progress: Converting data
      if (downloadProgress) {
        downloadProgress.updateProgress(50, 'Converting PDF data...');
      }
      
      // Use utility function to convert base64 to blob and download
      const blob = base64ToBlob(reportData, 'application/pdf');
      
      // Update progress: Creating download
      if (downloadProgress) {
        downloadProgress.updateProgress(80, 'Initiating browser download...');
      }
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 200));
      
      downloadBlob(blob, 'security-pass.pdf');
      
      // Additional delay to ensure download starts
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update progress: Complete
      if (downloadProgress) {
        downloadProgress.updateProgress(100, 'File downloaded successfully to browser!');
        downloadProgress.setComplete();
      }
      
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      if (downloadProgress) {
        downloadProgress.setError(error instanceof Error ? error.message : 'Download failed');
      }
    }
  }

  const content = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90dvh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Security Pass - Preview
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-2">
          
          {/* Left Side - Preview (60%) */}
          <div className="flex-1 w-3/5">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {/* Tab Header for Preview */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800">PDF Preview</h4>
                  {isPdfGenerationComplete && (
                    <div className="flex items-center gap-1 text-green-600 text-sm ml-auto bg-green-100 px-2 py-1 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                      <span>Ready</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-4 min-h-[500px]">
                {reportData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-800">Security Pass Preview</h5>
                      <Button
                        onClick={handleDownloadPdf}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </Button>
                    </div>
                    <div className="h-96 border border-gray-200 rounded-lg overflow-hidden bg-gray-100 shadow-inner">
                      <iframe
                        src={`data:application/pdf;base64,${reportData}`}
                        className="w-full h-full"
                        title="PDF Preview"
                        onError={(e) => {
                          console.error('PDF preview error:', e);
                          alert('Failed to load PDF preview. You can still download the file.');
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2 text-lg">Generating Security Pass</p>
                    <p className="text-sm text-gray-500 mb-6">
                      {isAutoStatusRunning 
                        ? "Creating your security pass PDF... This will appear automatically when ready."
                        : "Initializing security pass generation..."
                      }
                    </p>
                    {isAutoStatusRunning && (
                      <div className="space-y-4">
                        {/* <div className="flex items-center justify-center gap-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="text-blue-600 font-medium text-lg">Processing...</span>
                        </div> */}
                        <div className="text-sm text-blue-500 bg-blue-50 px-4 py-3 rounded-md max-w-md mx-auto border border-blue-200">
                          <div className="space-y-1">
                            <p className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Security pass generation initiated
                            </p>
                            <p className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Processing security pass data
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                              Generating PDF in browser...
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          File generation happens automatically in the browser
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Know Status (40%) */}
          <div className="w-2/5">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {/* Tab Header for Know Status */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-gray-200 px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <h4 className="font-medium text-amber-800">Know Status</h4>
                    {isAutoStatusRunning && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  
                </div>
              </div>

              {/* Status Content */}
              <div className="min-h-[500px]">
                <AutoStatusUpdate
                  fileId={fileId}
                  setOpen={() => {}} // No-op since this is always visible
                  extension="pdf"
                  reportData={reportData}
                  onTimelineReportData={handleTimelineReportData}
                  setPdfData={setPdfData}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}