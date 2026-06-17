"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  UserCircle,
  Clock,
  Upload,
  UploadCloud,
  LayoutGrid,
  FileUp,
  Download,
  Send,
  UploadCloudIcon,
  Plus,
  SearchCheck,
  Circle,
  CircleEllipsis,
  CircleEllipsisIcon,
  DownloadCloud,
  X,
  LogIn,
  LogOut,
  Calendar,
  MessageSquare,
  User,
  AlertCircle,
} from "lucide-react";
import TopTitleDescription from "@repo/ui/components/titleline/top-title-discription";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@repo/ui/components/ui/card";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";

// Timeline Item Component for Punch Requests
const PunchTimelineItem = ({ item, isLast }: any) => {
  const isSuccess = item.isSuccess === true || item.isSuccess === "true";
  const [showDetails, setShowDetails] = useState(false);

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const formattedDate = new Date(item.timestamp).toLocaleString();
  const isDateInvalid = formattedDate === "Invalid Date";

  if (isDateInvalid) {
    return (
      <div className="mb-6 relative pl-8">
        <div className="absolute left-0 top-2">
          <div className="bg-amber-400 pulse-animation rounded-full p-1 z-10 shadow-sm">
            <Clock size={16} color="white" strokeWidth={2.5} />
          </div>
        </div>

        {!isLast && (
          <div className="absolute left-3 top-8 h-full border-l-2 border-blue-100 z-0"></div>
        )}

        <div className="bg-white p-3 rounded-md w-full shadow-sm hover:shadow transition-shadow border border-amber-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <UserCircle size={14} className="text-blue-600 mr-2" />
              <span className="font-medium mr-1">Processing</span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 animate-pulse">
              <Clock size={12} />
              <span>Updating...</span>
            </div>
          </div>
          <div className="border-b border-gray-100 my-2"></div>
          <div className="flex items-center">
            <FileText size={14} className="mr-2 text-amber-500" />
            <span className="text-gray-400 text-xs">Waiting for punch request details...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 relative pl-8">
      <div className="absolute left-0 top-2">
        <div
          className={`${isSuccess ? "bg-green-500" : "bg-amber-400 pulse-animation"} rounded-full p-1 z-10 shadow-sm`}
        >
          {isSuccess ? (
            <CheckCircle size={16} color="white" strokeWidth={2.5} />
          ) : (
            <Clock size={16} color="white" strokeWidth={2.5} />
          )}
        </div>
      </div>

      {!isLast && (
        <div className="absolute left-3 top-8 h-full border-l-2 border-blue-100 z-0"></div>
      )}

      <div
        className={`bg-white p-3 rounded-md w-full shadow-sm hover:shadow transition-shadow border ${!isSuccess ? "border-amber-100" : "border-gray-100"}`}
      >
        <div className="flex items-center text-sm border-b-2 border-gray-100 pb-1">
          <div className="flex items-center">
            <UserCircle size={14} className="text-blue-600 mr-2" />
            <span className="font-medium mr-1">{item.stateName || "Status Update"}</span>
          </div>
          <span className="ml-auto text-xs text-gray-500">{formattedDate}</span>
        </div>

        <div className="flex justify-between items-center mt-1 text-sm text-gray-700">
          <div className="flex items-center">
            {item.type === "in" ? (
              <LogIn size={14} className={`mr-2 ${!isSuccess ? "text-amber-500" : "text-blue-600"}`} />
            ) : (
              <LogOut size={14} className={`mr-2 ${!isSuccess ? "text-amber-500" : "text-indigo-600"}`} />
            )}
            <p className={!isSuccess ? "font-medium text-amber-700" : ""}>
              {item.eventName || `Punch ${item.type === "in" ? "In" : "Out"} Request`}
            </p>
            <span className="text-xs text-gray-500">• {item.performedBy || "System"}</span>
          </div>

          {item.details && (
            <CircleEllipsisIcon
              size={18}
              className="ml-auto text-gray-600 rotate-90 cursor-pointer hover:text-blue-600"
              onClick={toggleDetails}
            />
          )}
        </div>

        {item.eventMessage && (
          <p className="text-xs mt-2 text-gray-600">{item.eventMessage}</p>
        )}

        {item.details && (
          <div className="flex items-center gap-3 justify-end mt-2">
            <button className="flex items-center justify-center p-1 bg-white text-blue-600 border border-gray-200 rounded-md shadow-sm hover:shadow-md hover:bg-blue-50 transition-all">
              <UploadCloudIcon size={14} />
            </button>
            <button className="flex items-center justify-center p-1 bg-white text-amber-600 border border-gray-200 rounded-md shadow-sm hover:shadow-md hover:bg-blue-50 transition-all">
              <Send size={14} />
            </button>
          </div>
        )}
      </div>

      {showDetails && item.details && (
        <Card className="shadow-sm mt-3 p-0">
          <CardHeader className="pb-2 p-3">
            <h3 className="font-medium text-gray-800 mb-0">
              {item.details.event || "Punch Request Details"}
            </h3>
            <p className="text-xs text-gray-500 mt-0">
              {item.details.description || "Additional information about this punch request"}
            </p>
            <p className="text-xs text-gray-500 mt-0">
              {item.details.time || formattedDate}
            </p>
          </CardHeader>

          <CardContent className="p-0 px-3 pt-0">
            <h4 className="font-medium text-gray-800 mb-2">
              Request Information
            </h4>

            <div className="grid grid-cols-1 gap-y-1">
              {item.details.statusCounts ? (
                item.details.statusCounts.map((statusItem: any, index: any) => (
                  <div key={index} className="flex flex-wrap items-center">
                    {statusItem.completed ? (
                      <CheckCircle size={14} className="text-blue-600 mr-2" />
                    ) : (
                      <Circle size={14} className="text-blue-600 mr-2" />
                    )}
                    <span className="text-sm text-gray-600">
                      {statusItem.count} {statusItem.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Requested: {item.requestedTime ? new Date(item.requestedTime).toLocaleString() : "N/A"}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default function PunchStatusUpdate({ 
  requestId, 
  setOpen, 
  punchRequest 
}: { 
  requestId: string, 
  setOpen: (open: boolean) => void,
  punchRequest?: any
}) {
  const [timelineData, setTimelineData] = useState<any[]>([]);

  const {
    data,
    error,
    loading,
    refetch
  } = useRequest<any[]>({
    url: `punch/status-updates?requestId=${requestId}`,
    method: 'GET',
    onSuccess: (data: any) => {
      if (data) {
        // Ensure data is always an array
        const timelineArray = Array.isArray(data) ? data : (data?.data || data.results || []);
        setTimelineData(timelineArray);
      }
    },
    onError: (error) => {
      console.error('Error loading punch status data:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        error: error.response?.data
      });
      // Don't show alert, just log the error
    },
    dependencies: [requestId]
  });

  // Ensure timelineData is always an array
  const safeTimelineData = Array.isArray(timelineData) ? timelineData : [];

  return (
    <div className="shadow-sm border-0 bg-white/70 backdrop-blur-sm overflow-y-scroll scroll-hidden h-full">
      <div className="p-4 relative">
        <Button onClick={() => setOpen(false)} variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full absolute top-2 right-2">
          <X size={18} />
        </Button>
        <div className="flex justify-between items-start mb-4">
          <TopTitleDescription
            titleValue={{
              title: "Punch Request Status",
              description: "Real-time status updates for your punch request.",
            }}
          />
        </div>

        {/* Punch Request Summary */}
        {punchRequest && (
          <Card className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow ${punchRequest.type === "in" ? "bg-blue-100" : "bg-indigo-100"}`}>
                {punchRequest.type === "in" ? (
                  <LogIn className="h-6 w-6 text-blue-600" />
                ) : (
                  <LogOut className="h-6 w-6 text-indigo-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-gray-900">
                  Manual Punch {punchRequest.type === "in" ? "In" : "Out"}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${
                    punchRequest.status === "approved" ? "bg-green-100 text-green-700 border-green-200" :
                    punchRequest.status === "pending" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                    "bg-red-100 text-red-700 border-red-200"
                  }`}>
                    {punchRequest.status}
                  </span>
                  <span className="text-sm text-gray-600">Request ID: #{punchRequest.id}</span>
                </div>
              </div>
            </div>
            {punchRequest.reason && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold text-gray-700 text-sm">Reason:</span>
                </div>
                <p className="text-sm text-gray-800">{punchRequest.reason}</p>
              </div>
            )}
          </Card>
        )}

        {/* Loading and Error States */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading status updates...</p>
          </div>
        )}
        {error && (
          <div className="text-red-500 text-center py-4 px-4 bg-red-50 rounded-md mx-4">
            Failed to load status updates. Please try again.
          </div>
        )}

        {!loading && !error && safeTimelineData.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center p-8 mt-16">
            <div className="flex items-center justify-center h-16 w-16 bg-amber-100 rounded-full pulse-animation">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="mt-6 text-lg font-bold text-gray-800">Status is Updating</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md px-4">
              We are processing your punch request. Status updates will appear here shortly.
            </p>
          </div>
        )}
        {!loading && !error && safeTimelineData.map((item, idx) => (
          <PunchTimelineItem 
            key={item._id || idx} 
            item={item} 
            isLast={idx === safeTimelineData.length - 1} 
          />
        ))}
      </div>
      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(251, 191, 36, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(251, 191, 36, 0);
          }
        }
        .pulse-animation {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
} 