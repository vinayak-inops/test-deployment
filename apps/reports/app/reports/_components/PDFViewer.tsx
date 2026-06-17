'use client';

import { useEffect, useState } from 'react';
import { MoreVertical, Download, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export default function PDFViewer() {
  const [mode, setMode] = useState<'preview' | 'advanced'>('advanced');
  const [isPdfJsReady, setIsPdfJsReady] = useState(false);
  const [thumbnails, setThumbnails] = useState<{ [key: string]: string }>({});

  const pdfFiles = [
    { name: 'Project Report', url: '/pdf/sample-1.pdf', createdAt: 'Created on: 2024-10-15' },
  ];

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      setIsPdfJsReady(true);
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const renderPdfThumbnail = async (url: string) => {
    return new Promise<string>(async (resolve, reject) => {
      if (typeof window !== 'undefined' && window?.pdfjsLib?.getDocument) {
        try {
          const loadingTask = window?.pdfjsLib?.getDocument(url);
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);
          const canvas = document.createElement('canvas');
          const viewport = page.getViewport({ scale: 1.0 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
          resolve(canvas.toDataURL());
        } catch (error) {
          console.error('Error loading PDF:', error);
          reject('Failed to render PDF');
        }
      } else {
        reject('PDF.js is not loaded');
      }
    });
  };

  useEffect(() => {
    if (mode === 'advanced' && isPdfJsReady) {
      pdfFiles.forEach(async (file) => {
        if (!thumbnails[file.url]) {
          const imgData = await renderPdfThumbnail(file.url);
          setThumbnails((prev) => ({ ...prev, [file.url]: imgData }));
        }
      });
    }
  }, [mode, isPdfJsReady]);

  const handleDownload = (file: any) => {
  };

  const handlePreview = (file: any) => {
  };

  return (
    <div className="p-0 w-full">
      <div className="">
        {pdfFiles.map((file) => (
          <div
            key={file.url}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            
            {mode === 'advanced' && thumbnails[file.url] ? (
              <img src={thumbnails[file.url]} alt={file.name} className="w-full h-40 object-cover object-top" />
            ) : (
              <div className="w-full h-48 bg-gray-300 flex items-center justify-center text-gray-600">
                {mode === 'advanced' ? 'Loading preview...' : 'No Preview'}
              </div>
            )}
            <div className="p-4 py-2 bg-[#f5f5f5] relative">
            <div className="ml-4 flex-shrink-0 absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-48 rounded-md shadow-lg border border-gray-200 bg-white py-1"
                    >
                      <DropdownMenuItem 
                        onClick={() => handleDownload(file)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        <Download className="mr-3 h-4 w-4 text-gray-500" />
                        <span>Download</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handlePreview(file)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        <Eye className="mr-3 h-4 w-4 text-gray-500" />
                        <span>Preview</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              <h2 className="font-semibold text-sm mb-1 text-gray-900 pr-8">{file.name}</h2>
              <p className="text-gray-500 text-sm">{file.createdAt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
