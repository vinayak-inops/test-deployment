"use client";

import { useState, useEffect } from "react";

import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import StepProgress from "./StepProgressBar";
import PayrollHeader from "./PayrollHeader";
import ProgressSteps from "./progress-steps";

import {
  Search,
  Filter,
  LayoutGrid,
  Users,
  FileUp,
  FileText,
  ClipboardEdit,
  Server,
  Tally5,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import TopTitleDescription from "@repo/ui/components/titleline/top-title-discription";
import { useWorkflowSSE } from "@repo/ui/hooks/workflow-management/useWorkflowSSE";

interface ProgressStep {
  label: string;
  date: string;
  completed: boolean;
}

interface PayrollRun {
  id: string;
  country: string;
  countryCode: string;
  company: string;
  amount?: string;
  status?: string;
  steps: ProgressStep[];
  payDay: string;
  action: {
    label: string;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  };
}

// A beautifully redesigned placeholder for when no files are being processed.
function NoFileUploadsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center text-center bg-white rounded-2xl p-8 my-4 ml-6 mr-2 border border-gray-100 shadow-lg animate-fadeIn">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-in-out;
        }
      `}</style>
      <div className="flex items-center justify-center h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md animate-pulse">
        <FileUp className="h-8 w-8 text-white" />
      </div>
      <h3 className="mt-6 text-lg font-bold text-gray-800">No File Uploads in Progress</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-md">
        Once you upload a file from the right panel, you can monitor its real-time processing status here.
      </p>
    </div>
  );
}

export default function PayrollRuns() {
  const { workflows: sseData, status, error, reconnect } = useWorkflowSSE();

  // Debug logging to check SSE connection


  // A banner to show connection status at the top of the page.
  const ConnectionStatus = () => {
    // Show all connection states for debugging
    if (status === 'connected') {
      return (
        <div className="flex items-center gap-3 bg-green-100 text-green-800 text-sm font-medium pl-6 pr-4 py-3 rounded-md border border-green-200 my-4 ml-6 mr-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>SSE Connected:</span>
          <span className="font-normal text-green-700">Receiving real-time updates</span>
          <span className="ml-auto text-xs text-green-600">
            {Object.keys(sseData).length} workflows active
          </span>
        </div>
      );
    }

    if (status === 'connecting') {
      return (
        <div className="flex items-center gap-3 bg-blue-100 text-blue-800 text-sm font-medium pl-6 pr-4 py-3 rounded-md border border-blue-200 my-4 ml-6 mr-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>SSE Connecting:</span>
          <span className="font-normal text-blue-700">Establishing connection...</span>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="flex items-center gap-3 bg-red-100 text-red-800 text-sm font-medium pl-6 pr-4 py-3 rounded-md border border-red-200 my-4 ml-6 mr-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>SSE Connection Error:</span>
          <span className="font-normal text-red-700">{error}</span>
          <Button onClick={reconnect} variant="ghost" size="sm" className="ml-auto text-red-600 hover:bg-red-200 h-7 px-2">
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        </div>
      );
    }

    return null;
  };

  // Transform SSE data to match your UI's expected structure
  const payrollRunsSet = Object.entries(sseData).map(([id, dataArr]) => {
    const sortedArr = [...dataArr].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const latest = sortedArr[sortedArr.length - 1];

    return {
      id,
      excelfilename: latest?.fileId || id,
      workflowname: latest?.workflowName || "",
      time: latest?.timestamp ? new Date(latest.timestamp).toLocaleTimeString() : "",
      steps: sortedArr.map((step: any) => ({
        label: step.stateName,
        date: step.timestamp ? new Date(step.timestamp).toLocaleDateString() : "",
        completed: step.isSuccess === true || step.isSuccess === "true",
      })),
      payDay: latest?.timestamp ? new Date(latest.timestamp).toLocaleDateString() : "",
      action: {
        label:
          latest && (latest.isSuccess === true || latest.isSuccess === "true")
            ? "Completed"
            : (latest?.currentStatus || "In-Progress"),
      },
    };
  });

  return (
    <div className="w-full">
      <ConnectionStatus />

      {(() => {
        // Show loading indicator
        if (status === 'connecting' && payrollRunsSet.length === 0) {
          return (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
              <span className="ml-4 text-lg text-gray-600">Connecting to server...</span>
            </div>
          );
        }

        // Show data table if available
        if (payrollRunsSet.length > 0) {
          return (
            <div className={`w-full pl-6 pr-2 pt-4 mx-auto`}>
              <div className="mb-4">
                <TopTitleDescription
                  titleValue={{
                    title: "Uploaded Excel Files",
                    description: "Status: Monitoring real-time file processing updates.",
                  }}
                />
              </div>
              <div className="space-y-4">
                {payrollRunsSet.map((run) => (
                  <PayrollCard key={run.id} run={run} />
                ))}
              </div>
            </div>
          );
        }

        // Default: Show placeholder for no file uploads
        return <NoFileUploadsPlaceholder />;
      })()}
    </div>
  );
}

function PayrollCard({ run }: { run: any }) {
  return (
    <div className="bg-white rounded-lg p-6 py-8">
      <div className="">
        <ProgressSteps run={run} />
      </div>
    </div>
  );
}
