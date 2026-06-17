"use client";

import { useCallback, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode";
import { useKeyclockRoleInfo } from "../../../../hooks/search/keyclock-role-info";
import WfhCalendarSelectedDayTable from "./wfh-calendar-selected-day-table";

interface WfhCalendarProps {
  isSelfPermission?: boolean;
  isAllPermission?: boolean;
}

type CalendarViewMode = "individual" | "manager";

type WfhApplicationItem = {
  _id?: string;
  employeeID?: string;
  fromDate?: string;
  toDate?: string;
  fromDuration?: string;
  toDuration?: string;
  workflowState?: string;
  description?: string;
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const dayNames = ["Mon", "Tues", "Wed", "Thu", "Fri", "Sat", "Sun"];

const calendarSkeletonDays = Array.from({ length: 42 }, (_, index) => index);

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getCalendarDates(currentDate: Date) {
  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  );
  const start = new Date(firstDay);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  start.setDate(firstDay.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function getStatusClasses(status?: string) {
  const normalized = (status || "").toUpperCase();
  if (normalized.includes("APPROVED"))
    return "bg-green-50 border-green-200 text-green-800";
  if (normalized.includes("REJECTED"))
    return "bg-red-50 border-red-200 text-red-800";
  if (normalized.includes("CANCEL"))
    return "bg-gray-50 border-gray-200 text-gray-700";
  if (normalized.includes("FAILED"))
    return "bg-orange-50 border-orange-200 text-orange-800";
  return "bg-blue-50 border-blue-200 text-blue-800";
}

function getStatusDotClasses(status?: string) {
  const normalized = (status || "").toUpperCase();
  if (normalized.includes("APPROVED")) return "bg-green-500";
  if (normalized.includes("REJECTED")) return "bg-red-500";
  if (normalized.includes("CANCEL")) return "bg-gray-500";
  if (normalized.includes("FAILED")) return "bg-orange-500";
  return "bg-blue-500";
}

function getDurationLabel(application: WfhApplicationItem) {
  const fromDuration = application.fromDuration?.trim();
  const toDuration = application.toDuration?.trim();

  if (fromDuration && toDuration) {
    return fromDuration === toDuration
      ? fromDuration
      : `${fromDuration} to ${toDuration}`;
  }

  return fromDuration || toDuration || "Duration not available";
}

export default function WfhCalendar({
  isSelfPermission = false,
  isAllPermission = false,
}: WfhCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(
    toDateOnly(new Date()),
  );
  const [isSelectedDayPopupOpen, setIsSelectedDayPopupOpen] = useState(false);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("individual");
  const [applications, setApplications] = useState<WfhApplicationItem[]>([]);
  const tenantCode = useGetTenantCode();
  const { employeeId } = useKeyclockRoleInfo();

  const calendarDates = useMemo(
    () => getCalendarDates(currentDate),
    [currentDate],
  );
  const calendarDateKeys = useMemo(
    () => calendarDates.map((date) => toDateOnly(date)),
    [calendarDates],
  );
  const monthStart = useMemo(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    [currentDate],
  );
  const monthEnd = useMemo(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
    [currentDate],
  );

  const requestData = useMemo(() => {
    const data: any[] = [
      { field: "tenantCode", value: tenantCode, operator: "eq" },
      { field: "fromDate", value: toDateOnly(monthStart), operator: "gte" },
      { field: "fromDate", value: toDateOnly(monthEnd), operator: "lte" },
      { field: "workflowState", value: "APPROVED", operator: "eq" },
      { field: "createdOn", value: "", operator: "desc" },
      { field: "employeeID", value: employeeId, operator: "eq" },
    ];

    if (employeeId) {
      if (isSelfPermission)
        data.push({ field: "employeeID", value: employeeId, operator: "eq" });
      else if (isAllPermission)
        data.push({ field: "createdBy", value: employeeId, operator: "eq" });
    }

    return data;
  }, [
    tenantCode,
    monthStart,
    monthEnd,
    employeeId,
    isSelfPermission,
    isAllPermission,
  ]);

  const { loading, refetch } = useRequest<WfhApplicationItem[]>({
    url: "wfhApplication/search",
    method: "POST",
    data: requestData,
    onSuccess: (data: any) => setApplications(Array.isArray(data) ? data : []),
    onError: () => setApplications([]),
  });

  const monthlyApplications = useMemo(() => {
    return applications.filter((application) => {
      const fromDate = parseDate(application.fromDate);
      const toDate = parseDate(application.toDate) || fromDate;
      if (!fromDate || !toDate) return false;
      return fromDate <= monthEnd && toDate >= monthStart;
    });
  }, [applications, monthStart, monthEnd]);

  const getApplicationsForDate = useCallback(
    (date: Date) => {
      const dateOnly = toDateOnly(date);
      return monthlyApplications.filter((application) => {
        const fromDate = parseDate(application.fromDate);
        const toDate = parseDate(application.toDate) || fromDate;
        if (!fromDate || !toDate) return false;
        return (
          toDateOnly(fromDate) <= dateOnly && toDateOnly(toDate) >= dateOnly
        );
      });
    },
    [monthlyApplications],
  );

  const dailyWfhCounts = useMemo(() => {
    return calendarDates.reduce<Record<string, number>>((counts, date) => {
      const dateKey = toDateOnly(date);
      counts[dateKey] = getApplicationsForDate(date).length;
      return counts;
    }, {});
  }, [calendarDates, getApplicationsForDate]);

  const monthlyWfhCount = useMemo(() => {
    if (viewMode === "individual") return monthlyApplications.length;

    return calendarDateKeys.reduce((total, dateKey) => {
      const date = parseDate(dateKey);
      if (!date || date.getMonth() !== currentDate.getMonth()) return total;
      return total + (dailyWfhCounts[dateKey] || 0);
    }, 0);
  }, [
    calendarDateKeys,
    currentDate,
    dailyWfhCounts,
    monthlyApplications,
    viewMode,
  ]);

  const pageLoading = loading;

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return next;
    });
  };

  const openSelectedDayPopup = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    setIsSelectedDayPopupOpen(true);
  };

  if (pageLoading) {
    return (
      <div className="pb-3">
        <div className="px-0 pt-6 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">
              WFH Calendar
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            View work-from-home requests by month
          </p>
        </div>

        <div className="relative w-full mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="pointer-events-none select-none blur-[2px]">
            <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="h-4 w-20 rounded bg-gray-200" />
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-gray-200" />
                  <div className="h-6 w-6 rounded bg-gray-200" />
                  <div className="h-4 w-28 rounded bg-gray-200" />
                  <div className="h-6 w-6 rounded bg-gray-200" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-7 w-16 rounded bg-gray-200" />
              </div>
            </div>

            <div className="grid grid-cols-7 border-t border-gray-200">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="flex h-8 items-center justify-center border-r border-b border-gray-200 bg-gray-50 p-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400"
                >
                  {day}
                </div>
              ))}

              {calendarSkeletonDays.map((day) => (
                <div
                  key={day}
                  className="min-h-28 border-r border-b border-gray-200 bg-white p-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-6 rounded-full bg-gray-200" />
                    {day % 4 === 0 && (
                      <div className="h-3.5 w-3.5 rounded-full bg-blue-100" />
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    {day % 3 === 0 && (
                      <div className="h-7 rounded-md border border-blue-100 bg-blue-50" />
                    )}
                    {day % 5 === 0 && (
                      <div className="h-7 rounded-md border border-green-100 bg-green-50" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-7 w-24 rounded-lg bg-white shadow-sm" />
                <div className="h-7 w-24 rounded-lg bg-white shadow-sm" />
                <div className="h-7 w-24 rounded-lg bg-white shadow-sm" />
              </div>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-lg">
              <Clock className="h-5 w-5 animate-spin text-blue-600" />
              Loading WFH calendar...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-3">
      <div className="px-0 pt-6 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">
            WFH Calendar
          </h1>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          View work-from-home requests by month
        </p>
      </div>

      <div className="w-full mb-6 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex flex-col gap-3 px-4 py-3 bg-white border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={viewMode === "individual"}
                onChange={() => setViewMode("individual")}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              Individual
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={viewMode === "manager"}
                onChange={() => setViewMode("manager")}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              Manager
            </label>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("prev")}
                className="h-6 w-6 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-sm font-semibold text-gray-800">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("next")}
                className="h-6 w-6 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-600">
              Total:{" "}
              <span className="font-semibold text-gray-800">
                {monthlyWfhCount}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                refetch();
              }}
              className="h-7 px-2 text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-t border-gray-200">
          {dayNames.map((day) => (
            <div
              key={day}
              className="h-8 p-1 text-[10px] font-semibold text-gray-600 uppercase tracking-wide border-r border-b border-gray-200 bg-gray-50 text-center flex items-center justify-center"
            >
              {day}
            </div>
          ))}

          {calendarDates.map((date) => {
            const dayApplications = getApplicationsForDate(date);
            const dateKey = toDateOnly(date);
            const dailyWfhCount =
              viewMode === "individual"
                ? dayApplications.length
                : dailyWfhCounts[dateKey] || 0;
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = dateKey === toDateOnly(new Date());
            const isSelected = dateKey === selectedDateKey;

            return (
              <div
                key={dateKey}
                role="button"
                tabIndex={0}
                onClick={() => openSelectedDayPopup(dateKey)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openSelectedDayPopup(dateKey);
                  }
                }}
                className={`min-h-28 cursor-pointer border-r border-b border-gray-200 p-2 outline-none transition-colors hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
                  isSelected
                    ? "bg-blue-50 ring-2 ring-blue-500 ring-inset"
                    : isCurrentMonth
                      ? "bg-white"
                      : "bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`h-6 w-6 rounded-full text-xs font-semibold flex items-center justify-center ${
                      isToday
                        ? "bg-blue-600 text-white"
                        : isCurrentMonth
                          ? "text-gray-800"
                          : "text-gray-400"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {dailyWfhCount > 0 && (
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                  )}
                </div>
                {viewMode === "manager" && dailyWfhCount > 0 && (
                  <div className="mt-2 inline-flex items-center rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    WFH: {dailyWfhCount}
                  </div>
                )}
                {viewMode === "individual" && (
                  <div className="mt-2 space-y-1">
                    {dayApplications.slice(0, 2).map((application, index) => (
                      <div
                        key={`${application._id || application.employeeID || dateKey}-${index}`}
                        className={`rounded-md border px-2 py-1.5 text-[10px] leading-tight shadow-sm ${getStatusClasses(application.workflowState)}`}
                        title={`${getDurationLabel(application)} - ${application.workflowState || "Pending"}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${getStatusDotClasses(application.workflowState)}`}
                          />
                          <div className="min-w-0">
                            <div className="truncate font-semibold">
                              {getDurationLabel(application)}
                            </div>
                            <div className="truncate text-[9px] font-medium uppercase tracking-wide opacity-70">
                              {application.workflowState || "Pending"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {dayApplications.length > 2 && (
                      <div className="text-[10px] font-medium text-gray-500">
                        +{dayApplications.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
              <span className="text-xs text-gray-700 font-semibold">
                Pending
              </span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="w-3 h-3 bg-green-100 rounded-full"></div>
              <span className="text-xs text-gray-700 font-semibold">
                Approved
              </span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="w-3 h-3 bg-red-100 rounded-full"></div>
              <span className="text-xs text-gray-700 font-semibold">
                Rejected
              </span>
            </div>
            {loading && (
              <span className="text-xs text-gray-500">
                Loading WFH requests...
              </span>
            )}
          </div>
        </div>
      </div>

      {isSelectedDayPopupOpen && (
        <WfhCalendarSelectedDayTable
          selectedDateKey={selectedDateKey}
          viewMode={viewMode}
          dailyWfhCount={dailyWfhCounts[selectedDateKey] || 0}
          tenantCode={tenantCode}
          employeeId={employeeId}
          isSelfPermission={isSelfPermission}
          isAllPermission={isAllPermission}
          onClose={() => setIsSelectedDayPopupOpen(false)}
        />
      )}
    </div>
  );
}
