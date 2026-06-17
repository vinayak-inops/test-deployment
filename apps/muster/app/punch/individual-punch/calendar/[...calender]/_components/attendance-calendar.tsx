"use client"

import { useEffect, useState } from "react"
import { Calendar } from "lucide-react"
import PunchFormPopup from "../../../../_components/punch-form-popup"
import PunchRequestsPopup from '../../../../_components/punch-requests-popup'
import EditPunchForm from "./edit-punch-form"
import AddNewPunchForm from "../../../../_components/add-new-punch-form"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import DayDetailsPopup from "./day-details-popup"
import { ToastContainer } from "react-toastify"
import { useAdminRole } from "@inops/store/src/hooks/useAdminRole"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useKeyclockRoleInfo } from "@/hooks/search/keyclock-role-info"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"
import { useHierarchyFilters } from "@/hooks/hierarchy/useHierarchyFilters"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import PunchTable, { PunchRecord as PunchTableRecord } from "../../../../_components/punch-table"
import type { AttendanceRequest, AttendanceDetail, AttendanceRecord, AttendanceCalendarProps } from "./types"
import { formatYMD } from "./calendar-utils"
import BigCalendar from "./big-calendar"
import SmallCalendar from "./small-calendar"
import InfoSection from "./info-section"

export default function AttendanceCalendar({ attendanceData, onNewPunchSubmit }: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null) // No date selected initially
  const [showSplitView, setShowSplitView] = useState(false) // Start with big calendar
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false)
  const [isPunchFormOpen, setIsPunchFormOpen] = useState(false)
  const [isPunchRequestsPopupOpen, setIsPunchRequestsPopupOpen] = useState(false)
  const [isNewPunchFormOpen, setIsNewPunchFormOpen] = useState(false)
  const [isAddNewPunchFormOpen, setIsAddNewPunchFormOpen] = useState(false)
  const [contractEmployeeData, setContractEmployeeData] = useState<any>(null)
  const [attendanceDataFromAPI, setAttendanceDataFromAPI] = useState<any>(null)
  const [attendanceByDate, setAttendanceByDate] = useState<Record<string, AttendanceDetail>>({})
  const [punchFormType, setPunchFormType] = useState<"in" | "out">("in")
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [isClient, setIsClient] = useState(false);
  const [allowedServices, setAllowedServices] = useState<string[]>([]);
  const [excelService, setExcelService] = useState<any>(null);
  const [addNewPunch, setAddNewPunch] = useState<any>(null);
  const [applyApplication, setApplyApplication] = useState<any>(null);
  const [knowStatus, setKnowStatus] = useState<any>(null);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [hasContentOverflow, setHasContentOverflow] = useState(false);
  const [punchFilter, setPunchFilter] = useState<"all" | "inPunches" | "outPunches" | "defaultPunches">("all");
  const [editPunchRecord, setEditPunchRecord] = useState<any | null>(null);
  const [isEditPunchFormOpen, setIsEditPunchFormOpen] = useState(false);

  // State for URL parameters
  const [year, setYear] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [employeeID, setEmployeeID] = useState<string | null>(null);

  // Get hierarchy filters and employee ID
  const { hierarchyFilters: empHierarchyFilters } = useEmpHierarchy()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
  const userEntitlement = useUserEntitlement(loginEmployeeId, empHierarchyFilters)
  
  // Get current employeeID for hierarchy filters
  const reqEmployeeIdForFilters = employeeID || contractEmployeeData?.employeeID || ""
  const hierarchyFilters = useHierarchyFilters(null, reqEmployeeIdForFilters)

  // Get values from URL query parameters
  useEffect(() => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
      const urlYear = params.get('year');
      const urlMonth = params.get('month');
      const urlEmployeeID = params.get('employeeId');
      
      setYear(urlYear ? urlYear.replace(/^0+/, "") : null);
      setMonth(urlMonth ? urlMonth.replace(/^0+/, "") : null);
      setEmployeeID(urlEmployeeID);
    }
  }, []);

  // Initialize current date from URL params if provided; otherwise keep today's month
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const yParam = params.get('year');
    const mParam = params.get('month');
    const yNum = yParam ? Number(yParam) : NaN;
    const mNum = mParam ? Number(mParam) : NaN;
    if (!Number.isNaN(yNum) && !Number.isNaN(mNum) && mNum >= 1 && mNum <= 12) {
      setCurrentDate(new Date(yNum, mNum - 1, 1));
    }
  }, []);

  // Prepare request data based on URL params or fallback to current date and employee
  const getRequestData = () => {
    let reqYear = Number(year) || currentDate.getFullYear();
    let reqMonth = Number(month) || (currentDate.getMonth() + 1);
    let reqEmployeeId = employeeID || contractEmployeeData?.employeeID || "";
    
    return {
      hierarchyFilters: hierarchyFilters,
      criteriaRequests: [
        { field: "year", operator: "eq", value: reqYear },
        { field: "month", operator: "eq", value: reqMonth },
        { field: "employeeID", operator: "eq", value: reqEmployeeId }
      ],
      userEntitlement: userEntitlement
    };
  };

  // Use the useRequest hook for attendance data
  const {
    loading: isLoading,
    refetch: fetchAttendance
  } = useRequest<any>({
    url: 'muster/muster/searchWithHierarchy',
    method: 'POST',
    data: getRequestData(),
    onSuccess: (data) => {
      setAttendanceDataFromAPI(data);
      setIsDataLoading(false);

      // Build initial map from current month
      try {
        const map: Record<string, AttendanceDetail> = {};
        if (Array.isArray(data) && data.length > 0 && data[0]?.attendanceDetails) {
          for (const detail of data[0].attendanceDetails as AttendanceDetail[]) {
            if (detail?.date) {
              map[detail.date] = detail;
            }
          }
        }
        setAttendanceByDate(prev => ({ ...prev, ...map }));
      } catch (e) {
        // Error building attendance map
      }

      // Update current date only when API explicitly provides month and year
      if (data && Array.isArray(data) && data.length > 0) {
        const attendanceRecord = data[0] as AttendanceRecord;
        if (attendanceRecord?.month && attendanceRecord?.year) {
          const apiMonth = Number(attendanceRecord.month);
          const apiYear = Number(attendanceRecord.year);
          if (!Number.isNaN(apiMonth) && !Number.isNaN(apiYear) && apiMonth >= 1 && apiMonth <= 12) {
            const newDate = new Date(apiYear, apiMonth - 1, 1);
            setCurrentDate(newDate);
          }
        }
      }

      // After current month success, also fetch prev and next months and merge into map
      try {
        const baseDate = new Date(currentDate);
        const prevMonthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
        const nextMonthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
        const prevYear = prevMonthDate.getFullYear();
        const prevMonth = prevMonthDate.getMonth() + 1;
        const nextYear = nextMonthDate.getFullYear();
        const nextMonth = nextMonthDate.getMonth() + 1;

        const reqEmployeeId = (employeeID || contractEmployeeData?.employeeID || "");
        if (reqEmployeeId) {
          const fetchMonth = async (y: number, m: number) => {
            const body: any = {
              hierarchyFilters: hierarchyFilters,
              criteriaRequests: [
                { field: "year", operator: "eq", value: y },
                { field: "month", operator: "eq", value: m },
                { field: "employeeID", operator: "eq", value: reqEmployeeId }
              ],
              userEntitlement: userEntitlement
            };
            const res = await fetch('muster/muster/searchWithHierarchy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            if (!res.ok) return null;
            const json = await res.json();
            return json;
          };

          Promise.all([fetchMonth(prevYear, prevMonth), fetchMonth(nextYear, nextMonth)])
            .then(results => {
              const [prevData, nextData] = results;
              const map: Record<string, AttendanceDetail> = {};
              const mergeFrom = (arr: any) => {
                if (Array.isArray(arr) && arr.length > 0 && arr[0]?.attendanceDetails) {
                  for (const d of arr[0].attendanceDetails as AttendanceDetail[]) {
                    if (d?.date) map[d.date] = d;
                  }
                }
              };
              mergeFrom(prevData);
              mergeFrom(nextData);
              if (Object.keys(map).length > 0) {
                setAttendanceByDate(prev => ({ ...prev, ...map }));
              }
            })
            .catch(() => {});
        }
      } catch (e) {
        // Error preparing adjacent month fetch
      }
    },
    onError: () => {
      setIsDataLoading(false);
    }
  });

  // Fetch data when parameters change - with debouncing to prevent flickering
  useEffect(() => {
    if (employeeID) {
      setIsDataLoading(true);
      // Add a small delay to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        fetchAttendance();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [year, month, employeeID]);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }

      // Update URL with new month and year
      const newMonth = (newDate.getMonth() + 1).toString().padStart(2, '0')
      const newYear = newDate.getFullYear().toString()

      // Get current URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      urlParams.set('month', newMonth)
      urlParams.set('year', newYear)

      // Update the URL without page reload
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`
      window.history.pushState({}, '', newUrl)

      // Update state variables to trigger data fetch
      setMonth(newMonth.replace(/^0+/, ""));
      setYear(newYear);

      return newDate
    })
  }

  const contractorEmployee = "muster-punch-calendar"

  // Get role permissions using useRolePermissions hook
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: 'muster',
    screenName: 'musterPunch'
  });

  // Get role permissions using useRolePermissions hook
  const { responseData: rolePermissionsEditPunch } = useRolePermissions({
    serviceName: 'applicationApplier',
    screenName: 'editPunchApplication'
  });

  // Extract punchEditable permission
  const punchEditable = !!(rolePermissionsEditPunch?.all || rolePermissions?.self);

  // Get admin role data from Redux
  const { adminRole } = useAdminRole();

  // Load allowed services from Redux only
  useEffect(() => {
    setIsClient(true);

    if (adminRole?.screenPermissions) {
      setAllowedServices(adminRole.screenPermissions);
    } else {
      setAllowedServices([]);
    }
  }, [adminRole]);

  // Set excel service from allowed services
  useEffect(() => {
    if (!isClient) return;

    const muster = allowedServices.find((service: any) => service.serviceName === "muster");
    setExcelService(muster);
    // silently ignore when not found
  }, [isClient, allowedServices]);

  // Get permissions for each task
  useEffect(() => {
    if (!excelService) return;

    const musterScreen = excelService.screens.find((screen: any) => screen.screenName === contractorEmployee);

    if (musterScreen) {
      const addNewPunch = musterScreen?.permissions[`addNewPunch`];
      const applyApplication = musterScreen?.permissions[`applyApplication`];
      const knowStatus = musterScreen?.permissions[`knowStatusOfApplication`];
      setAddNewPunch(addNewPunch);
      setApplyApplication(applyApplication);
      setKnowStatus(knowStatus);
    }
  }, [contractorEmployee, excelService]);

  // Date-aware attendance lookup across months/years
  const getAttendanceForDate = (date: Date): AttendanceDetail | null => {
    const key = formatYMD(date);
    if (attendanceByDate && attendanceByDate[key]) return attendanceByDate[key];

    // Fallback to current-month array if map not populated
    if (!attendanceDataFromAPI || !Array.isArray(attendanceDataFromAPI) || attendanceDataFromAPI.length === 0) {
      return null;
    }
    const attendanceRecord = attendanceDataFromAPI[0] as AttendanceRecord;
    if (!attendanceRecord?.attendanceDetails) return null;
    return attendanceRecord.attendanceDetails.find(detail => detail.date === key) || null;
  }

  const handlePunchFormSubmit = () => {
    setIsPunchFormOpen(false)
  }

  const handleNewPunchFormSubmit = async (data: any) => {
    if (onNewPunchSubmit) {
      const success = await onNewPunchSubmit(data)
      if (success) {
        setIsNewPunchFormOpen(false)
      }
    }
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setShowSplitView(true) // Switch to split view after selection
    setIsInfoExpanded(false) // Reset expanded state when selecting new date
  }

  // Convert attendance detail punch details to PunchTableRecord format
  const convertToPunchTableRecords = (attendanceDetail: AttendanceDetail | null): PunchTableRecord[] => {
    if (!attendanceDetail) return []
    
    const records: PunchTableRecord[] = []
    
    // Helper to format time
    const formatTime = (timeStr: string | undefined, dateStr: string): string => {
      if (!timeStr) return ''
      // If already in ISO format
      if (timeStr.includes('T')) {
        try {
          const date = new Date(timeStr)
          return date.toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
        } catch {
          return timeStr
        }
      }
      // If just time, combine with date
      return `${dateStr} ${timeStr}`
    }

    // Helper to get sortable time value
    const getSortableTime = (timeStr: string | undefined, dateStr: string): number => {
      if (!timeStr) return 0
      try {
        // If already in ISO format
        if (timeStr.includes('T')) {
          return new Date(timeStr).getTime()
        }
        // If just time, combine with date
        const combinedDateTime = `${dateStr} ${timeStr}`
        return new Date(combinedDateTime).getTime()
      } catch {
        return 0
      }
    }
    
    // Add in punches
    attendanceDetail.punchDetails.inPunches.forEach((punch: any) => {
      const rawPunchedTime = punch.punchedTime || punch.transactionTime || ''
      const rawTransactionTime = punch.transactionTime || punch.punchedTime || ''
      
      records.push({
        _id: punch._id || punch.id || `in-${Date.now()}-${Math.random()}`,
        punchedTime: formatTime(rawPunchedTime, attendanceDetail.date),
        transactionTime: formatTime(rawTransactionTime, attendanceDetail.date),
        inOut: "I",
        typeOfMovement: punch.typeOfMovement || "P",
        readerSerialNumber: punch.readerSerialNumber || "",
        uploadTime: punch.uploadTime || attendanceDetail.date,
        attendanceDate: attendanceDetail.date,
        employeeID: employeeID || contractEmployeeData?.employeeID || "",
        organizationCode: punch.organizationCode || "",
        tenantCode: punch.tenantCode || "",
        isDeleted: punch.isDeleted ? "true" : "false",
        state: punch.state || "new",
        date: attendanceDetail.date,
        _class: punch._class || "",
        processed: punch.processed !== undefined ? punch.processed : true,
        failureDescription: punch.failureDescription || undefined,
        // Store raw time for sorting
        _sortTime: getSortableTime(rawPunchedTime, attendanceDetail.date),
        // Store raw ISO values for editing
        _rawPunchedTimeISO: rawPunchedTime,
        _rawTransactionTimeISO: rawTransactionTime
      } as any)
    })
    
    // Add out punches
    attendanceDetail.punchDetails.outPunches.forEach((punch: any) => {
      const rawPunchedTime = punch.punchedTime || punch.transactionTime || ''
      const rawTransactionTime = punch.transactionTime || punch.punchedTime || ''
      
      records.push({
        _id: punch._id || punch.id || `out-${Date.now()}-${Math.random()}`,
        punchedTime: formatTime(rawPunchedTime, attendanceDetail.date),
        transactionTime: formatTime(rawTransactionTime, attendanceDetail.date),
        inOut: "O",
        typeOfMovement: punch.typeOfMovement || "P",
        readerSerialNumber: punch.readerSerialNumber || "",
        uploadTime: punch.uploadTime || attendanceDetail.date,
        attendanceDate: attendanceDetail.date,
        employeeID: employeeID || contractEmployeeData?.employeeID || "",
        organizationCode: punch.organizationCode || "",
        tenantCode: punch.tenantCode || "",
        isDeleted: punch.isDeleted ? "true" : "false",
        state: punch.state || "new",
        date: attendanceDetail.date,
        _class: punch._class || "",
        processed: punch.processed !== undefined ? punch.processed : true,
        failureDescription: punch.failureDescription || undefined,
        // Store raw time for sorting
        _sortTime: getSortableTime(rawPunchedTime, attendanceDetail.date),
        // Store raw ISO values for editing
        _rawPunchedTimeISO: rawPunchedTime,
        _rawTransactionTimeISO: rawTransactionTime
      } as any)
    })
    
    // Add default punches
    attendanceDetail.punchDetails.defaultPunches.forEach((punch: any) => {
      const rawPunchedTime = punch.punchedTime || punch.transactionTime || ''
      const rawTransactionTime = punch.transactionTime || punch.punchedTime || ''
      
      records.push({
        _id: punch._id || punch.id || `default-${Date.now()}-${Math.random()}`,
        punchedTime: formatTime(rawPunchedTime, attendanceDetail.date),
        transactionTime: formatTime(rawTransactionTime, attendanceDetail.date),
        inOut: punch.inOut || "I",
        typeOfMovement: punch.typeOfMovement || "P",
        readerSerialNumber: punch.readerSerialNumber || "",
        uploadTime: punch.uploadTime || attendanceDetail.date,
        attendanceDate: attendanceDetail.date,
        employeeID: employeeID || contractEmployeeData?.employeeID || "",
        organizationCode: punch.organizationCode || "",
        tenantCode: punch.tenantCode || "",
        isDeleted: punch.isDeleted ? "true" : "false",
        state: punch.state || "new",
        date: attendanceDetail.date,
        _class: punch._class || "",
        processed: punch.processed !== undefined ? punch.processed : true,
        failureDescription: punch.failureDescription || undefined,
        // Store raw time for sorting
        _sortTime: getSortableTime(rawPunchedTime, attendanceDetail.date),
        // Mark as default punch for filtering
        _isDefaultPunch: true,
        // Store raw ISO values for editing
        _rawPunchedTimeISO: rawPunchedTime,
        _rawTransactionTimeISO: rawTransactionTime
      } as any)
    })
    
    // Sort records by punchedTime (ascending - oldest first)
    records.sort((a, b) => {
      const timeA = (a as any)._sortTime || 0
      const timeB = (b as any)._sortTime || 0
      return timeA - timeB
    })
    
    return records
  }

  // Filter punch records based on punch type filter
  const getFilteredPunchRecords = (attendanceDetail: AttendanceDetail | null): PunchTableRecord[] => {
    const allRecords = convertToPunchTableRecords(attendanceDetail);
    
    if (punchFilter === "all") {
      return allRecords;
    }
    
    return allRecords.filter((record) => {
      if (punchFilter === "inPunches") {
        // In punches are from inPunches array (not default)
        return record.inOut === "I" && !(record as any)._isDefaultPunch;
      } else if (punchFilter === "outPunches") {
        // Out punches are from outPunches array (not default)
        return record.inOut === "O" && !(record as any)._isDefaultPunch;
      } else if (punchFilter === "defaultPunches") {
        // Default punches are marked with _isDefaultPunch
        return (record as any)._isDefaultPunch === true;
      }
      return true;
    });
  }

  // Helper to convert formatted time string to ISO format
  const convertToISOFormat = (timeStr: string, dateStr?: string): string => {
    if (!timeStr) return new Date().toISOString().slice(0, 16);
    
    try {
      // If already in ISO format or contains 'T'
      if (timeStr.includes('T')) {
        return new Date(timeStr).toISOString().slice(0, 16);
      }
      
      // If it's a formatted date-time string like "2024-01-15 14:30:00"
      if (timeStr.includes(' ') && timeStr.includes(':')) {
        return new Date(timeStr).toISOString().slice(0, 16);
      }
      
      // If it's just time, combine with date
      if (dateStr) {
        const combined = `${dateStr} ${timeStr}`;
        return new Date(combined).toISOString().slice(0, 16);
      }
      
      return new Date().toISOString().slice(0, 16);
    } catch {
      return new Date().toISOString().slice(0, 16);
    }
  }

  // Handle edit action - convert PunchTableRecord to EditPunchForm format
  const handleEditPunch = (record: PunchTableRecord) => {
    // Convert PunchTableRecord to format expected by EditPunchForm
    // Use raw ISO values if available, otherwise fall back to formatted values
    const rawPunchedTimeISO = (record as any)._rawPunchedTimeISO || record.punchedTime || ""
    const rawTransactionTimeISO = (record as any)._rawTransactionTimeISO || record.transactionTime || ""
    
    const editRecord = {
      id: record._id || `record-${Date.now()}`,
      _id: record._id,
      employeeId: record.employeeID || employeeID || contractEmployeeData?.employeeID || "",
      name: contractEmployeeData?.employeeName || "Employee",
      date: record.attendanceDate || selectedDate?.toISOString().split("T")[0] || "",
      type: record.inOut === "I" ? "punch-in" : "punch-out" as "punch-in" | "punch-out" | "default",
      timestamp: record.punchedTime || "",
      punchedTimeISO: rawPunchedTimeISO,
      transactionTime: record.transactionTime || "",
      transactionTimeISO: rawTransactionTimeISO,
      notes: record.failureDescription || "",
      typeOfMovement: record.typeOfMovement || "P"
    };
    setEditPunchRecord(editRecord);
    setIsEditPunchFormOpen(true);
  }

  // Calculate total working hours for the current month
  const getTotalMonthlyWorkingHours = () => {
    if (
      !attendanceDataFromAPI ||
      !Array.isArray(attendanceDataFromAPI) ||
      attendanceDataFromAPI.length === 0
    ) {
      return 0;
    }
    const attendanceRecord = attendanceDataFromAPI[0];
    if (!attendanceRecord?.attendanceDetails) return 0;
    // Sum up hoursWorked for all days in the month
    const totalMinutes = attendanceRecord.attendanceDetails.reduce(
      (sum: number, detail: any) =>
        typeof detail.hoursWorked === "number" ? sum + detail.hoursWorked : sum,
      0
    );
    return Math.round(totalMinutes / 60); // Convert minutes to hours
  };
  const totalMonthlyWorkingHours = getTotalMonthlyWorkingHours();

  // Check if we have a valid employeeID before rendering
  const currentEmployeeID = employeeID || contractEmployeeData?.employeeID;
  
  if (!currentEmployeeID) {
    return (
      <div className="w-full mb-6 bg-white rounded-xl shadow-xl border border-gray-200">
        <div className="flex items-center justify-center p-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <div className="text-xl font-semibold text-gray-800 mb-2">No Employee ID Available</div>
            <div className="text-sm text-gray-500">Please ensure you have selected an employee or have proper access permissions.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      {/* Loading Screen */}
      {(isLoading || isDataLoading) && (
        <div className="w-full mb-6 overflow-hidden bg-white rounded-xl shadow-xl border border-gray-200">
          <div className="flex items-center justify-center p-16">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              <div className="text-lg font-semibold text-gray-700">Loading attendance data...</div>
              <div className="text-sm text-gray-500">Please wait while we fetch your calendar</div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Component - Big Calendar (Initial) or Split View (After Selection) */}
      {!isLoading && !isDataLoading && (
        <>
          {!showSplitView ? (
            /* Big Calendar - Full Width */
            <BigCalendar
              currentDate={currentDate}
              selectedDate={selectedDate}
              navigateMonth={navigateMonth}
              totalMonthlyWorkingHours={totalMonthlyWorkingHours}
              getAttendanceForDate={getAttendanceForDate}
              handleDayClick={handleDayClick}
            />
          ) : (
            /* Split View - Calendar Left, Info Right, Table Below Both */
            <div className="w-full mb-6 flex flex-col gap-4">
              {/* Top Row - Calendar Left + Info Right */}
              <div className="w-full flex gap-4 items-stretch">
                {/* Left Side - Small Calendar - Vercel Style */}
                <SmallCalendar
                  currentDate={currentDate}
                  selectedDate={selectedDate}
                  navigateMonth={navigateMonth}
                  setShowSplitView={setShowSplitView}
                  getAttendanceForDate={getAttendanceForDate}
                  handleDayClick={handleDayClick}
                />

                {/* Right Side - Info Section - Two Column Layout */}
                {selectedDate && (
                  <InfoSection
                    selectedDate={selectedDate}
                    attendanceDetail={getAttendanceForDate(selectedDate)}
                    isInfoExpanded={isInfoExpanded}
                    setIsInfoExpanded={setIsInfoExpanded}
                    hasContentOverflow={hasContentOverflow}
                    setHasContentOverflow={setHasContentOverflow}
                    showSplitView={showSplitView}
                    attendanceDataFromAPI={attendanceDataFromAPI}
                  />
                )}
              </div>

              {/* Bottom - Punch Records Table - Full Width Below Both */}
              {selectedDate && getAttendanceForDate(selectedDate) && (
                <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <PunchTable
                      data={getFilteredPunchRecords(getAttendanceForDate(selectedDate))}
                      tableTitle="Punch Records"
                      visibleColumns={["employeeID", "inOut", "typeOfMovement", "punchedTime", "readerSerialNumber", "processed", "actions"]}
                      statusFilter={punchFilter}
                      onStatusFilterChange={(filter) => {
                        // Only accept punch type filters (inPunches, outPunches, defaultPunches) or "all"
                        if (filter === "all" || filter === "inPunches" || filter === "outPunches" || filter === "defaultPunches") {
                          setPunchFilter(filter)
                        }
                      }}
                      onEdit={punchEditable ? handleEditPunch : undefined}
                      permissions={{ canViewSuspected: true }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <PunchFormPopup
        isOpen={isPunchFormOpen}
        onClose={() => setIsPunchFormOpen(false)}
        initialValues={{
          inOut: punchFormType === "in" ? "I" : "O",
          attendanceDate: new Date().toISOString().split("T")[0],
          punchedTime: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          transactionTime: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        }}
        onSubmit={handlePunchFormSubmit}
        refetch={()=>{}}
      />

      <PunchRequestsPopup
        isOpen={isPunchRequestsPopupOpen}
        onClose={() => setIsPunchRequestsPopupOpen(false)}
        initialSelectedRequest={null}
        selectedRequestId={null}
        employeeId={employeeID || contractEmployeeData?.employeeID}
      />

      {/* Day Details Popup - Keep for edit functionality if needed */}
      <DayDetailsPopup
        isOpen={isDayDetailsOpen}
        employeeId={employeeID || contractEmployeeData?.employeeID}
        onClose={() => setIsDayDetailsOpen(false)}
        selectedDate={selectedDate}
        attendanceDetail={selectedDate ? getAttendanceForDate(selectedDate) : null}
      />

      {/* Edit Punch Form Popup */}
      {editPunchRecord && (
        <EditPunchForm
          isOpen={isEditPunchFormOpen}
          onClose={() => {
            setIsEditPunchFormOpen(false);
            setEditPunchRecord(null);
          }}
          onSubmit={async (data) => {
            // Refetch attendance data after edit
            if (employeeID) {
              await fetchAttendance();
            }
            return true;
          }}
          month={Number(month)}
          year={Number(year)}
          punchRecord={editPunchRecord}
          employeeId={employeeID || contractEmployeeData?.employeeID || ""}
          employeeName={contractEmployeeData?.employeeName}
          attendanceDetail={selectedDate ? getAttendanceForDate(selectedDate) : null}
        />
      )}

      {/* Add New Punch Form Popup */}
      <AddNewPunchForm
        isOpen={isAddNewPunchFormOpen}
        onClose={() => setIsAddNewPunchFormOpen(false)}
        initialValues={{
          employeeID: employeeID || contractEmployeeData?.employeeID,
        }}
        onSubmit={async () => {
          return true
        }}
      />
    </>
  )
} 
