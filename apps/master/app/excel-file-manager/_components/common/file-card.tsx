import {
  FileSpreadsheet,
  MoreVertical,
  Download,
  Trash2,
  Share2,
  Star,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { cn } from "@repo/ui/lib/utils";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

export function FileCard({ file, deleteNote }: { file: any; deleteNote: any }) {
  const router = useRouter();

  function convertToExcelFormat(data:any) {
    // Create array for Excel
    const excelData = [];
    
    // Extract headers from the first object
    const headers = Object.keys(data[0]);
    
    // Add headers as first row
    excelData.push(headers);
    
    // Add each data row
    data.forEach((item: any) => {
      const row:any= [];
      headers.forEach(header => {
        row.push(item[header]);
      });
      excelData.push(row);
    });
    
    return excelData;
  }

 

  const handleDownload = async() => {
      const excelData:any= convertToExcelFormat(file?.[0].data)
      try {
        // Create a new workbook
        const workbook = XLSX.utils.book_new();
  
        // Create a worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  
        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  
        // Write the workbook and trigger download
        XLSX.writeFile(workbook, `excel_data.xlsx`);
      } catch (error) {
        console.error("Error downloading Excel file:", error);
      }
    };
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-white transition-all hover:shadow-md">
      <div className="absolute right-2 top-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              onClick={() => {
                router.push(`/excel-file-manager/excel-edit/${file?.[0].like}`);
              }}
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                router.push(`/excel-file-manager/excel-edit/${file?.[0].like}`);
              }}
              className="min-w-[150px]"
            >
              <Share2 className="mr-2 h-4 w-4" />
              <span>Share</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                router.push(
                  `/excel-file-manager/upload-statues/${file?.[0].like}`
                );
              }}
            >
              <Star className="mr-2 h-4 w-4" />
              <span>Statues</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                handleDownload();
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              <span>Download</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                deleteNote(file.id);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center border-b p-3">
        <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
        <span className="ml-2 truncate font-medium text-[14px]">
          financial-data.xlsx
        </span>
      </div>

      <div className="flex h-[140px] items-center justify-center bg-slate-50 p-4">
        <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-slate-200">
          <span className="text-xs text-slate-400">Preview not available</span>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3">
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-xs text-white bg-orange-500"
          )}
        >
          A
        </div>
        <span className="text-xs text-slate-500">
          You modified • Mar 20, 2025
        </span>
      </div>
    </div>
  );
}
