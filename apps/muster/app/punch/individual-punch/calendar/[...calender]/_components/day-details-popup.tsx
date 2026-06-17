"use client"

import { useState, useMemo, useEffect } from "react"
import { useSession } from "next-auth/react"
import { X, Filter, Calendar, Clock, MapPin, Smartphone, FileText, Users, Printer, UserCheck, ArrowLeft, User, MessageSquare } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Input } from "@repo/ui/components/ui/input"
import BigPopupWrapper from "@repo/ui/components/popupwrapper/big-popup-wrapper"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useAdminRole } from "@inops/store/src/hooks/useAdminRole"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"

interface PunchRecord {
  id: string
  _id?: {
    timestamp: number
    date: {
      $numberLong: string
    }
  }
  employeeId: string
  name: string
  date: string
  type: "punch-in" | "punch-out" | "default"
  readerSerialNumber: string
  timestamp: string
  punchedTimeISO: string // Raw ISO format from database
  transactionTime: string
  transactionTimeISO: string // Raw ISO format from database
  location: string
  device: string
  notes: string
  totalHoursWorked: string
  status: string

}

interface DayDetailsPopupProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  attendanceDetail: any
  employeeData?: {
    employeeId: string
    employeeName: string
    fromDate?: string
    toDate?: string
  },
  employeeId: string
}

// Cookie helper (same as RequestForPunches)
const getCookie = (name: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      const value = cookie.substring(name.length + 1);
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return undefined;
};


export default function DayDetailsPopup({ isOpen, onClose, selectedDate, attendanceDetail, employeeData, employeeId }: DayDetailsPopupProps) {
  const { data: session } = useSession();
  const userRole = useMemo(() => {
    const raw = getCookie("userRole");
    if (!raw) return {} as any;
    try {
      return JSON.parse(raw);
    } catch {
      try {
        return JSON.parse(decodeURIComponent(raw));
      } catch {
        return {} as any;
      }
    }
  }, []);
  const isUser = (userRole as any).role === 'user';
  const [activeTab, setActiveTab] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedPunchRecord, setSelectedPunchRecord] = useState<PunchRecord | null>(null)
  const [formData, setFormData] = useState<any>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isClient, setIsClient] = useState(false);
  const [allowedServices, setAllowedServices] = useState<string[]>([]);
  const [excelService, setExcelService] = useState<any>(null);
  const [editablePunch, setEditablePunch] = useState<any>(null);
  const [transactionTimeValue, setTransactionTimeValue] = useState<string>('');
  const  tenantCode  = useGetTenantCode();


  const contractorEmployee = "muster-punch-calendar"

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
      const addNewPunch = musterScreen?.permissions[`punchEditable`];
      setEditablePunch(addNewPunch);
    }
  }, [contractorEmployee, excelService]);

  const {
    post: postShiftZone,
    loading: postLoading,
    error: postError,
    data: postData,
  } = usePostRequest<any>({
    url: "editPunchApplication",
    onSuccess: (data) => {
      // Show toast on success
      toast.success("Punch application submitted successfully!");
      // onSubmit(data);
      // onClose();
    },
    onError: (error) => {
      // Optionally handle error (e.g., show a toast)
      console.error("POST error:", error);
    },
  });

  if (!isOpen || !selectedDate || !attendanceDetail) return null

  const handlePrint = () => {
    window.print();
  };

  const handleEditPunch = (record: PunchRecord) => {
    setSelectedPunchRecord(record)
    setIsEditMode(true)
    
    // Set transaction time value - use raw ISO value if available to avoid timezone issues
    if (record.transactionTimeISO) {
      // Normalize the ISO value to datetime-local format (YYYY-MM-DDTHH:mm:ss)
      const normalized = toDatetimeLocalValue(record.transactionTimeISO)
      if (normalized) {
        setTransactionTimeValue(normalized)
        return
      }
    }
    
    // Fallback: try to construct from date and formatted time
    // Use punchedTimeISO if available, otherwise use timestamp
    if (record.punchedTimeISO) {
      const normalized = toDatetimeLocalValue(record.punchedTimeISO)
      if (normalized) {
        setTransactionTimeValue(normalized)
        return
      }
    }
    
    const existingTransactionTime = normalizeToDatetimeLocal(record.date, record.transactionTime)
    const punchedTimeValue = normalizeToDatetimeLocal(record.date, record.timestamp)
    setTransactionTimeValue(existingTransactionTime || punchedTimeValue)
  }

  const handleBackToDetails = () => {
    setIsEditMode(false)
    setSelectedPunchRecord(null)
  }


  const handleSaveChanges = () => {
    // Helper functions for date formatting (similar to PunchFormPopup)
    const pad = (n: number) => n < 10 ? `0${n}` : n;
    
    // Get current time in Indian Standard Time (IST)
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    const yyyy = istTime.getFullYear();
    const mm = pad(istTime.getMonth() + 1);
    const dd = pad(istTime.getDate());
    const hh = pad(istTime.getHours());
    const min = pad(istTime.getMinutes());
    const ss = pad(istTime.getSeconds());
    const ms = pad(istTime.getMilliseconds());
    
    // Normalize various inputs to ISO with seconds (YYYY-MM-DDTHH:mm:ss)
    const toIsoSeconds = (input: string, fallbackDate?: string) => {
      if (!input) return ''
      // If already full datetime
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(input)) {
        const base = input.split('.')[0] // drop milliseconds if present
        // ensure seconds present
        return /:\d{2}$/.test(base) ? base : `${base}:00`
      }
      // If only time provided (HH:mm or HH:mm:ss), require fallback date
      if (!fallbackDate) return ''
      const parts = input.split(':')
      const hh = pad(parseInt(parts[0] || '0'))
      const mm = pad(parseInt(parts[1] || '0'))
      const ss = pad(parseInt(parts[2] || '0'))
      return `${fallbackDate}T${hh}:${mm}:${ss}`
    }

    

    // Collect form data from the form fields
    const newAttendanceDateInput = (document.querySelector('input[name="newAttendanceDate"]') as HTMLInputElement)?.value;
    const transactionTime = transactionTimeValue;
    const inOut = (document.querySelector('select[name="inOut"]') as HTMLSelectElement)?.value;
    const isDeletedStr = (document.querySelector('select[name="isDeleted"]') as HTMLSelectElement)?.value;
    const typeOfMovement = (document.querySelector('select[name="typeOfMovement"]') as HTMLSelectElement)?.value;
    const appliedDate = (document.querySelector('input[name="appliedDate"]') as HTMLInputElement)?.value;
    const remarks = (document.querySelector('textarea[name="remarks"]') as HTMLTextAreaElement)?.value;

    // Fallback to original attendance date if newAttendanceDate is not provided
    const newAttendanceDate = newAttendanceDateInput || selectedPunchRecord?.date || '';

    // Derive ISO strings
    const punchedTimeISO = toIsoSeconds(formatTimeForDisplay(selectedPunchRecord?.timestamp || ''), selectedPunchRecord?.date || '')
    const transactionTimeISO = toIsoSeconds(transactionTime)
    
    // Ensure both times have proper seconds format (YYYY-MM-DDTHH:mm:ss)
    
    // Validate that times are in correct format
    if (!punchedTimeISO || !transactionTimeISO) {
      toast.error('Invalid time format. Please check your inputs.');
      return;
    }
    
    // createdOn: 'YYYY-MM-DDTHH:mm:ss.sss+05:30' (IST timezone offset)
    const createdOn = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}+05:30`;
    // uploadTime: 'YYYY-MM-DDTHH:mm:ss'
    const uploadTime = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
    
    // Get username from session token
    let uploadedBy = session?.user?.name || 'user';
    // If you have a token, extract username here
    // Example: uploadedBy = getUserFromToken();
    
    // Create the merged object with edited and non-edited values
    const mergedData = {
      // Edited form values
      // punchID: selectedPunchRecord?._id,
      employeeID: employeeId,
      punchedTime: punchedTimeISO,
      transactionTime: transactionTimeISO,
      inOut: inOut,
      typeOfMovement: typeOfMovement,
      newAttendanceDate: newAttendanceDate,
      attendanceDate: selectedPunchRecord?.date,
      isDeleted: isDeletedStr === 'true',
      appliedDate: appliedDate,
      remarks: remarks,
      tenantCode: tenantCode,
      workflowName: "EditPunch Application",
      organizationCode: tenantCode,
      stateEvent:"NEXT",
      state:"new",
      // Non-edited time values (merged)
      uploadedBy: uploadedBy,
      createdOn: createdOn,
      uploadTime: uploadTime,
      workflowState: "INITIATED",
      punchID: selectedPunchRecord?._id || null,
    };
  
    setFormData(mergedData)

    const postData = {
      tenant: tenantCode,
        action: "insert",
        id: null,
        event: "application",
        collectionName: "editPunchApplication",
        data: mergedData,
    }


    postShiftZone(postData)
    
    
    // Show success message
    setShowSuccessMessage(true)
    
    // Close the edit mode after a short delay
    setTimeout(() => {
      setIsEditMode(false)
      setSelectedPunchRecord(null)
      setShowSuccessMessage(false)
    }, 2000)
    
    // You can add API call here to save the data
    // Example: savePunchRecord(mergedData)
  }

  // Helper function to format time for display
  const formatTimeForDisplay = (timeString: string) => {
    if (!timeString) return '';
    
    // If it's already in HH:MM format, return as is
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      return timeString;
    }
    
    // If it's in HH:MM AM/PM format, convert to 24-hour
    if (timeString.includes('AM') || timeString.includes('PM')) {
      const [time, period] = timeString.split(' ');
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours);
      
      if (period === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period === 'AM' && hour === 12) {
        hour = 0;
      }
      
      return `${hour.toString().padStart(2, '0')}:${minutes}`;
    }
    
    return timeString;
  }



  // Extract only available fields from attendanceDetail
  
  // Helper: normalize ISO string to datetime-local value (YYYY-MM-DDTHH:mm:ss)
  // This function preserves the date and time as-is without timezone conversion
  const toDatetimeLocalValue = (iso: string) => {
    if (!iso) return ''
    
    // Remove timezone info and milliseconds if present
    const base = iso.split('.')[0].split('+')[0].split('Z')[0]
    
    // Check if it matches the pattern YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(base)) {
      // Ensure seconds are present
      return /:\d{2}$/.test(base) ? base : `${base}:00`
    }
    
    return ''
  }

  // Helper to extract 24-hour time from various formats
  const extract24HourTime = (timeString: string): string | null => {
    if (!timeString) return null
    
    // If it's already in HH:MM or HH:MM:SS format (24-hour)
    const match24 = timeString.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/)
    if (match24) {
      return `${match24[1]}:${match24[2]}`
    }
    
    // If it's in 12-hour format with AM/PM
    const match12 = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (match12) {
      let hours = parseInt(match12[1], 10)
      const minutes = match12[2]
      const period = match12[3].toUpperCase()
      
      if (period === 'PM' && hours !== 12) {
        hours += 12
      } else if (period === 'AM' && hours === 12) {
        hours = 0
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes}`
    }
    
    return null
  }

  // Build a datetime-local string from either an ISO string or a time string plus date
  const normalizeToDatetimeLocal = (dateStr: string | undefined, value: string | undefined) => {
    if (!value) return ''
    
    // If already looks like ISO with date, normalize and return
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      return toDatetimeLocalValue(value)
    }
    
    // If only time provided, build from provided date
    if (!dateStr) return ''
    
    // Extract 24-hour time format
    const time24 = extract24HourTime(value)
    if (time24) {
      return `${dateStr}T${time24}:00`
    }
    
    return ''
  }
  const infoLeft = [
    attendanceDetail.employeeName && { label: 'Courier Name', value: attendanceDetail.employeeName },
    attendanceDetail.employeeId && { label: 'Courier Code', value: attendanceDetail.employeeId },
    attendanceDetail.joinedDate && { label: 'Joined Date', value: attendanceDetail.joinedDate },
    attendanceDetail.email && { label: 'Email', value: attendanceDetail.email, highlight: 'orange' },
    attendanceDetail.address && { label: 'Address', value: attendanceDetail.address },
    attendanceDetail.phone && { label: 'Phone Number', value: attendanceDetail.phone, highlight: 'orange' },
  ].filter(Boolean)

  const infoRight = [
    attendanceDetail.fleetBrand && { label: 'Fleet Brand', value: attendanceDetail.fleetBrand },
    attendanceDetail.fleetModel && { label: 'Fleet Model', value: attendanceDetail.fleetModel },
    attendanceDetail.fleetCode && { label: 'Fleet Code', value: attendanceDetail.fleetCode },
    attendanceDetail.lastChecking && { label: 'Last Checking', value: attendanceDetail.lastChecking, highlight: 'orange' },
    attendanceDetail.fleetCapacity && { label: 'Fleet Capacity', value: attendanceDetail.fleetCapacity },
    attendanceDetail.fleetCondition && { label: 'Fleet Condition', value: attendanceDetail.fleetCondition, highlight: 'green' },
  ].filter(Boolean)

  // Utility to format dates
  function formatDate(date: Date | null) {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Utility to parse datetime string without timezone conversion
  function parseLocalDateTime(dateTimeString: string): { year: number; month: number; day: number; hours: number; minutes: number; seconds: number } | null {
    if (!dateTimeString) return null;
    
    // Handle formats like "2025-10-17T07:01" or "2025-10-17T07:01:00"
    const match = dateTimeString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10),
        day: parseInt(match[3], 10),
        hours: parseInt(match[4], 10),
        minutes: parseInt(match[5], 10),
        seconds: parseInt(match[6] || '0', 10)
      };
    }
    
    // Fallback to Date parsing if format doesn't match
    try {
      const date = new Date(dateTimeString);
      if (!isNaN(date.getTime())) {
        return {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
          hours: date.getHours(),
          minutes: date.getMinutes(),
          seconds: date.getSeconds()
        };
      }
    } catch {
      // Ignore
    }
    
    return null;
  }

  // Utility to format ISO time strings
  function formatTimeDisplay(isoString: string) {
    if (!isoString) return '';
    
    // Try to parse as local datetime first to avoid timezone issues
    const parsed = parseLocalDateTime(isoString);
    if (parsed) {
      const hour12 = parsed.hours % 12 || 12;
      const ampm = parsed.hours >= 12 ? 'PM' : 'AM';
      return `${hour12.toString().padStart(2, '0')}:${parsed.minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    // Fallback to Date parsing
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString; // fallback if invalid
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Utility to format ISO datetime for database display (readable format)
  function formatDateTimeForDB(isoString: string) {
    if (!isoString) return '-';
    try {
      // Parse as local datetime to avoid timezone conversion issues
      const parsed = parseLocalDateTime(isoString);
      if (parsed) {
        return `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')} ${String(parsed.hours).padStart(2, '0')}:${String(parsed.minutes).padStart(2, '0')}:${String(parsed.seconds).padStart(2, '0')}`;
      }
      
      // Fallback: try to format string directly
      const cleaned = isoString.split('.')[0].replace('T', ' ');
      return cleaned || isoString;
    } catch {
      // Fallback: try to format string directly
      const cleaned = isoString.split('.')[0].replace('T', ' ');
      return cleaned || isoString;
    }
  }

  // Utility to format datetime in a human-readable way
  function formatDateTimeReadable(isoString: string) {
    if (!isoString) return '-';
    try {
      // Parse as local datetime to avoid timezone conversion issues
      const parsed = parseLocalDateTime(isoString);
      if (parsed) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[parsed.month - 1];
        const day = parsed.day;
        const year = parsed.year;
        
        // Format time in 12-hour format
        let hours = parsed.hours;
        const minutes = String(parsed.minutes).padStart(2, '0');
        const seconds = String(parsed.seconds).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const hoursStr = String(hours).padStart(2, '0');
        
        return `${monthName} ${day}, ${year} at ${hoursStr}:${minutes}:${seconds} ${ampm}`;
      }
      
      // Fallback: try to format string directly
      const cleaned = isoString.split('.')[0].replace('T', ' ');
      return cleaned || isoString;
    } catch {
      // Fallback: try to format string directly
      const cleaned = isoString.split('.')[0].replace('T', ' ');
      return cleaned || isoString;
    }
  }

  // Generate punch records from attendance detail
  const generatePunchRecords = (): PunchRecord[] => {
    const records: PunchRecord[] = [];
    let recordId = 1;

    // Add in punches
    attendanceDetail.punchDetails.inPunches.forEach((punch: any, index: number) => {
      const rawPunchedTime = punch.punchedTime || `${attendanceDetail.date}T08:30:00`;
      const rawTransactionTime = punch.transactionTime || `${attendanceDetail.date}T08:30:00`;
      records.push({
        id: `in-${recordId++}`,
        _id: punch._id,
        employeeId: employeeId,
        name: attendanceDetail.employeeName || "Employee",
        date: attendanceDetail.date,
        type: "punch-in",
        readerSerialNumber: punch.readerSerialNumber || "",
        timestamp: formatTimeDisplay(rawPunchedTime),
        punchedTimeISO: rawPunchedTime, // Store raw ISO value
        transactionTime: formatTimeDisplay(rawTransactionTime),
        transactionTimeISO: rawTransactionTime, // Store raw ISO value
        location: punch.location || "Office - Main Gate",
        device: punch.device || "Biometric Device",
        notes: punch.notes || "Regular punch in",
        totalHoursWorked: attendanceDetail.hoursWorked ? `${Math.floor(attendanceDetail.hoursWorked / 60)}:${(attendanceDetail.hoursWorked % 60).toString().padStart(2, '0')}` : "00:00",
        status: "Present"
      })
    })

    // Add out punches
    attendanceDetail.punchDetails.outPunches.forEach((punch: any, index: number) => {
      const rawPunchedTime = punch.punchedTime || `${attendanceDetail.date}T17:30:00`;
      const rawTransactionTime = punch.transactionTime || `${attendanceDetail.date}T17:30:00`;
      records.push({
        id: `out-${recordId++}`,
        _id: punch._id,
        employeeId: employeeId,
        name: attendanceDetail.employeeName || "Employee",
        date: attendanceDetail.date,
        readerSerialNumber: punch.readerSerialNumber || "",
        type: "punch-out",
        timestamp: formatTimeDisplay(rawPunchedTime),
        punchedTimeISO: rawPunchedTime, // Store raw ISO value
        transactionTime: formatTimeDisplay(rawTransactionTime),
        transactionTimeISO: rawTransactionTime, // Store raw ISO value
        location: punch.location || "Office - Main Gate",
        device: punch.device || "Biometric Device",
        notes: punch.notes || "Regular punch out",
        totalHoursWorked: attendanceDetail.hoursWorked ? `${Math.floor(attendanceDetail.hoursWorked / 60)}:${(attendanceDetail.hoursWorked % 60).toString().padStart(2, '0')}` : "00:00",
        status: "Present"
      })
    })

    // Add default punches
    attendanceDetail.punchDetails.defaultPunches.forEach((punch: any, index: number) => {
      const rawPunchedTime = punch.punchedTime || `${attendanceDetail.date}T12:00:00`;
      const rawTransactionTime = punch.transactionTime || `${attendanceDetail.date}T12:00:00`;
      records.push({
        id: `default-${recordId++}`,
        _id: punch._id,
        employeeId: employeeId,
        name: attendanceDetail.employeeName || "Employee",
        date: attendanceDetail.date,
        type: "default",
        readerSerialNumber: punch.readerSerialNumber || "",
        timestamp: formatTimeDisplay(rawPunchedTime),
        punchedTimeISO: rawPunchedTime, // Store raw ISO value
        transactionTime: formatTimeDisplay(rawTransactionTime),
        transactionTimeISO: rawTransactionTime, // Store raw ISO value
        location: punch.location || "Office - Default",
        device: punch.device || "System Default",
        notes: punch.notes || "Default punch record",
        totalHoursWorked: attendanceDetail.hoursWorked ? `${Math.floor(attendanceDetail.hoursWorked / 60)}:${(attendanceDetail.hoursWorked % 60).toString().padStart(2, '0')}` : "00:00",
        status: "Present"
      })
    })

    return records;
  }

  const allPunchRecords = generatePunchRecords()

  // Filter records based on active tab and search
  const filteredRecords = allPunchRecords.filter(record => {
    const matchesTab = activeTab === "all" || record.type === activeTab
    return matchesTab
  })

  const getPunchTypeColor = (type: string) => {
    switch (type) {
      case "punch-in":
        return "bg-green-100 text-green-700 border-green-200"
      case "punch-out":
        return "bg-red-100 text-red-700 border-red-200"
      case "default":
        return "bg-gray-100 text-gray-700 border-gray-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getPunchTypeIcon = (type: string) => {
    switch (type) {
      case "punch-in":
        return <span className="text-green-600">🟢</span>
      case "punch-out":
        return <span className="text-red-600">🔴</span>
      case "default":
        return <span className="text-gray-500">⚪</span>
      default:
        return <span className="text-gray-500">⚪</span>
    }
  }

  // Prefill value for Transaction Time: use Punched Time when available
  const punchedTimeLocal = (isEditMode && selectedPunchRecord)
    ? normalizeToDatetimeLocal(selectedPunchRecord.date, selectedPunchRecord?.timestamp as any)
    : ''

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-blue-100/60 to-white/80 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl p-0 relative overflow-hidden max-h-[90vh] print:border-0 print:shadow-none print:max-w-full print:rounded-none">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-500 rounded-t-2xl border-b border-blue-200 print:bg-white print:border-0 print:rounded-none">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-white" />
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide print:text-blue-700">Employee Attendance Details</h2>
                <div className="text-blue-100 text-xs mt-1 print:text-gray-500">{formatDate(selectedDate)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="hidden print:hidden md:inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition text-sm"
                onClick={handlePrint}
                title="Print"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                className="text-white hover:bg-blue-700/30 rounded-full p-1 transition-colors text-2xl font-bold print:hidden"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-0 py-8 bg-gradient-to-br from-white to-blue-50/40 print:bg-white print:px-0 print:py-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            <div className="px-8">
            {/* Section: Attendance Info */}
            <div className="mb-6">
              <div className="text-blue-700 font-bold text-lg mb-2 pb-1 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-400" /> Attendance Information
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2">
                <div className="text-xs text-gray-500">Date</div>
                <div className="font-semibold text-gray-800">{attendanceDetail?.date || '-'}</div>
                <div className="text-xs text-gray-500">Work Order Number</div>
                <div className="font-semibold text-gray-800">{attendanceDetail?.workOrderNumber || '-'}</div>
                <div className="text-xs text-gray-500">Shifts Allocated</div>
                <div className="font-semibold text-gray-800">{attendanceDetail?.shiftsAllocated || '-'}</div>
                <div className="text-xs text-gray-500">Shift Code</div>
                <div className="font-semibold text-gray-800">{attendanceDetail?.shiftCode || '-'}</div>
                <div className="text-xs text-gray-500">Extra ManShift</div>
                <div className="font-semibold text-gray-800">{attendanceDetail?.extraManShift || '-'}</div>
                <div className="text-xs text-gray-500">Attendance ID</div>
                <div className="font-semibold text-gray-800">{attendanceDetail?.attendanceID || '-'}</div>
                <div className="text-xs text-gray-500">Hours Worked</div>
                <div className="font-mono text-base text-blue-800">{attendanceDetail?.hoursWorked ? `${Math.floor(attendanceDetail.hoursWorked / 60)}:${(attendanceDetail.hoursWorked % 60).toString().padStart(2, '0')}` : '00:00'}</div>
                <div className="text-xs text-gray-500">Late In</div>
                <div className="font-mono text-base text-blue-800">{attendanceDetail?.lateIn ? `${Math.floor(attendanceDetail.lateIn / 60)}:${(attendanceDetail.lateIn % 60).toString().padStart(2, '0')}` : '00:00'}</div>
                <div className="text-xs text-gray-500">Early Out</div>
                <div className="font-mono text-base text-blue-800">{attendanceDetail?.earlyOut ? `${Math.floor(attendanceDetail.earlyOut / 60)}:${(attendanceDetail.earlyOut % 60).toString().padStart(2, '0')}` : '00:00'}</div>
                <div className="text-xs text-gray-500">Extra Hours Post Shift</div>
                <div className="font-mono text-base text-blue-800">{attendanceDetail?.extraHours ? `${Math.floor(attendanceDetail.extraHours / 60)}:${(attendanceDetail.extraHours % 60).toString().padStart(2, '0')}` : '00:00'}</div>
                <div className="text-xs text-gray-500">Extra Hours Pre Shift</div>
                <div className="font-mono text-base text-blue-800">{attendanceDetail?.extraHoursPreShift ? `${Math.floor(attendanceDetail.extraHoursPreShift / 60)}:${(attendanceDetail.extraHoursPreShift % 60).toString().padStart(2, '0')}` : '00:00'}</div>
                <div className="text-xs text-gray-500">Extra Hours</div>
                <div className="font-mono text-base text-blue-800">{attendanceDetail?.extraHours ? `${Math.floor(attendanceDetail.extraHours / 60)}:${(attendanceDetail.extraHours % 60).toString().padStart(2, '0')}` : '00:00'}</div>
                <div className="text-xs text-gray-500">Personal Out</div>
                <div className="font-mono text-base text-blue-800">{attendanceDetail?.personalOut ? `${Math.floor(attendanceDetail.personalOut / 60)}:${(attendanceDetail.personalOut % 60).toString().padStart(2, '0')}` : '00:00'}</div>
                <div className="text-xs text-gray-500">Official Out</div>
                <div className="font-mono text-base text-blue-800">{attendanceDetail?.officialOut ? `${Math.floor(attendanceDetail.officialOut / 60)}:${(attendanceDetail.officialOut % 60).toString().padStart(2, '0')}` : '00:00'}</div>
                <div className="text-xs text-gray-500">OT Hours</div>
                <div className="font-mono text-base text-blue-800">{attendanceDetail?.otHours ? `${Math.floor(attendanceDetail.otHours / 60)}:${(attendanceDetail.otHours % 60).toString().padStart(2, '0')}` : '00:00'}</div>
                <div className="text-xs text-gray-500">Leave Code</div>
                <div className="font-mono text-base text-blue-800">{attendanceDetail?.leaveCode || '-'}</div>
              </div>
            </div>

            {/* Section: Punch Records */}
            <div className="mb-6">
              <div className="text-blue-700 font-bold text-lg mb-2 border-b border-blue-100 pb-1 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" /> Punch Records
              </div>

              {/* Tabs */}
              <div className="mb-6">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'punch-in' | 'punch-out' | 'default')}>
                  <TabsList className="flex w-auto justify-center bg-transparent border-none p-0 mb-4">
                    <TabsTrigger 
                      value="all"
                      className={`px-6 py-3 text-base font-semibold transition-all duration-150 border border-blue-200 focus:outline-none ${activeTab === 'all' ? 'bg-blue-600 text-white shadow font-bold border-blue-600' : 'text-blue-700 hover:bg-blue-100 bg-blue-50'} rounded-l-xl border-r-0`}
                    >
                      All Punches
                    </TabsTrigger>
                    <TabsTrigger 
                      value="punch-in"
                      className={`px-6 py-3 text-base font-semibold transition-all duration-150 border border-blue-200 focus:outline-none ${activeTab === 'punch-in' ? 'bg-blue-600 text-white shadow font-bold border-blue-600' : 'text-blue-700 hover:bg-blue-100 bg-blue-50'} border-r-0`}
                    >
                      Punch Ins
                    </TabsTrigger>
                    <TabsTrigger 
                      value="punch-out"
                      className={`px-6 py-3 text-base font-semibold transition-all duration-150 border border-blue-200 focus:outline-none ${activeTab === 'punch-out' ? 'bg-blue-600 text-white shadow font-bold border-blue-600' : 'text-blue-700 hover:bg-blue-100 bg-blue-50'} border-r-0`}
                    >
                      Punch Outs
                    </TabsTrigger>
                    <TabsTrigger 
                      value="default"
                      className={`px-6 py-3 text-base font-semibold transition-all duration-150 border border-blue-200 focus:outline-none ${activeTab === 'default' ? 'bg-blue-600 text-white shadow font-bold border-blue-600' : 'text-blue-700 hover:bg-blue-100 bg-blue-50'} rounded-r-xl`}
                    >
                      Default
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-0">
                    <div className="overflow-x-auto relative">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">PUNCHED TIME</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">TRANSACTION TIME</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">TRANSACTION TIME (DB)</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">IN/OUT</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">TYPE OF MOVEMENT</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">READER SERIAL NUMBER</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">EMPLOYEE ID</th>
                            {
                              editablePunch && (
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap sticky right-0 bg-gray-50 z-10 border-l border-gray-200">ACTION</th>
                              )
                            }
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.map((record, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.timestamp}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.transactionTime}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-mono text-xs whitespace-nowrap">{formatDateTimeForDB(record.transactionTimeISO)}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPunchTypeColor(record.type)}`}>
                                  {getPunchTypeIcon(record.type)}
                                  {record.type === "punch-in" ? "In" : "Out"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.notes || "Regular punch"}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.readerSerialNumber || ""}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.employeeId}</td>
                              {editablePunch && (
                                <td className="px-4 py-3 sticky right-0 bg-white z-10 whitespace-nowrap group-hover:bg-gray-50 border-l border-gray-200">
                                  <button
                                    onClick={() => handleEditPunch(record)}
                                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="punch-in" className="mt-0">
                    <div className="overflow-x-auto relative">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">PUNCHED TIME</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">TRANSACTION TIME</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">TRANSACTION TIME (DB)</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">IN/OUT</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">TYPE OF MOVEMENT</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">READER SERIAL NUMBER</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">EMPLOYEE ID</th>
                            {
                              editablePunch && (
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap sticky right-0 bg-gray-50 z-10 border-l border-gray-200">ACTION</th>
                              )
                            }
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.filter(record => record.type === "punch-in").map((record, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.timestamp}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.transactionTime}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-mono text-xs whitespace-nowrap">{formatDateTimeForDB(record.transactionTimeISO)}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPunchTypeColor(record.type)}`}>
                                  {getPunchTypeIcon(record.type)}
                                  {record.type === "punch-in" ? "In" : "Out"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.notes || "Regular punch"}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.readerSerialNumber||""}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.employeeId}</td>
                              {editablePunch && (
                                <td className="px-4 py-3 sticky right-0 bg-white z-10 whitespace-nowrap group-hover:bg-gray-50 border-l border-gray-200">
                                  <button
                                    onClick={() => handleEditPunch(record)}
                                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="punch-out" className="mt-0">
                    <div className="overflow-x-auto relative">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">PUNCHED TIME</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">TRANSACTION TIME</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">TRANSACTION TIME (DB)</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">IN/OUT</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">TYPE OF MOVEMENT</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">READER SERIAL NUMBER</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">EMPLOYEE ID</th>
                            {
                              editablePunch && (
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap sticky right-0 bg-gray-50 z-10 border-l border-gray-200">ACTION</th>
                              )
                            }
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.filter(record => record.type === "punch-out").map((record, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.timestamp}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.transactionTime}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-mono text-xs whitespace-nowrap">{formatDateTimeForDB(record.transactionTimeISO)}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPunchTypeColor(record.type)}`}>
                                  {getPunchTypeIcon(record.type)}
                                  {record.type === "punch-in" ? "In" : "Out"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.notes || "Regular punch"}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.readerSerialNumber || ""}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.employeeId}</td>
                              {editablePunch && (
                                <td className="px-4 py-3 sticky right-0 bg-white z-10 whitespace-nowrap group-hover:bg-gray-50 border-l border-gray-200">
                                  <button
                                    onClick={() => handleEditPunch(record)}
                                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="default" className="mt-0">
                    <div className="overflow-x-auto relative">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">PUNCHED TIME</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">TRANSACTION TIME</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">TRANSACTION TIME (DB)</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">IN/OUT</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">TYPE OF MOVEMENT</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">READER SERIAL NUMBER</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">EMPLOYEE ID</th>
                            {
                              editablePunch && (
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap sticky right-0 bg-gray-50 z-10 border-l border-gray-200">ACTION</th>
                              )
                            }
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.filter(record => record.type === "default").map((record, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.timestamp}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.transactionTime}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-mono text-xs whitespace-nowrap">{formatDateTimeForDB(record.transactionTimeISO)}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPunchTypeColor(record.type)}`}>
                                  {getPunchTypeIcon(record.type)}
                                  {record.type === "punch-in" ? "In" : "Out"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.notes || "Regular punch"}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.readerSerialNumber || ""}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{record.employeeId}</td>
                              {
                                editablePunch && (
                                  <td className="px-4 py-3 sticky right-0 bg-white z-10 whitespace-nowrap">
                                <button
                                  onClick={() => handleEditPunch(record)}
                                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors gap-1"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                              </td>
                                )
                              }
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
        {/* Edit Mode Overlay */}
      {isEditMode && selectedPunchRecord && (
        <div className="absolute inset-0 z-50 flex overflow-hidden">
          {/* Left Side - Transparent */}
          <div className="w-1/3 bg-transparent"></div>
          
          {/* Right Side - White Background */}
          <div className="w-2/3 h-full bg-white flex flex-col shadow-2xl ">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToDetails}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Clock className="h-6 w-6" />
                    Edit Punch Record
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {employeeData?.employeeName || selectedPunchRecord.name} ({employeeData?.employeeId || selectedPunchRecord.employeeId}) - {selectedPunchRecord.type}
                  </p>
                  {employeeData?.fromDate && employeeData?.toDate && (
                    <p className="text-blue-100 text-xs mt-1">
                      Date Range: {employeeData.fromDate} to {employeeData.toDate}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleBackToDetails}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success Message */}
            {/* {showSuccessMessage && (
              <div className="absolute inset-0 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-1">Success!</h3>
                  <p className="text-green-600">Punch record updated successfully</p>
                </div>
              </div>
            )} */}

            {/* Edit Form */}
            <div className="flex-1 p-6 overflow-y-auto" >
              <div className="space-y-6">
                {/* Employee Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b border-blue-200 pb-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Employee Information
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Employee ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={employeeData?.employeeId || selectedPunchRecord.employeeId} 
                        readOnly 
                        className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm transition hover:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Attendance Date
                      </label>
                      <input
                        type="date"
                        value={selectedPunchRecord.date}
                        readOnly
                        className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm transition hover:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        New Attendance Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="newAttendanceDate"
                        defaultValue={selectedPunchRecord.date}
                        className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm transition hover:border-blue-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Punch Details Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b border-blue-200 pb-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Punch Details
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Punched Time
                      </label>
                      <input
                        type="text"
                        value={selectedPunchRecord.punchedTimeISO ? formatDateTimeReadable(selectedPunchRecord.punchedTimeISO) : ((selectedPunchRecord.timestamp && selectedPunchRecord.date) ? formatDateTimeReadable(`${selectedPunchRecord.date}T${formatTimeForDisplay(selectedPunchRecord.timestamp)}:00`) : '')}
                        readOnly
                        className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm transition hover:border-blue-400"
                      />
                      <p className="text-xs text-gray-500 mt-1">Readable format: Date and Time</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Transaction Time <span className="text-red-500">*</span>
                      </label>
                      {/* Show existing value first */}
                      <div className="text-xs text-gray-600 mb-1">
                        Current: {transactionTimeValue ? formatDateTimeReadable(transactionTimeValue) : "-"}
                      </div>
                      <input
                        name="transactionTime"
                        type="datetime-local"
                        step="1"
                        value={transactionTimeValue}
                        onChange={(e) => setTransactionTimeValue(e.target.value)}
                        className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm transition hover:border-blue-400"
                      />
                      <p className="text-xs text-gray-500 mt-1">Time when transaction was processed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Swipe Mode <span className="text-red-500">*</span>
                      </label>
                      <select name="inOut" className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm transition hover:border-blue-400">
                        <option value="">Select One</option>
                        <option value="I" selected={selectedPunchRecord.type === "punch-in"}>In</option>
                        <option value="O" selected={selectedPunchRecord.type === "punch-out"}>Out</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                       Is Deleted <span className="text-red-500">*</span>
                      </label>
                      <select name="isDeleted" className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm transition hover:border-blue-400" defaultValue={"false"}>
                        <option value="">Select One</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Type of Movement <span className="text-red-500">*</span>
                      </label>
                      <select 
                        name="typeOfMovement"
                        defaultValue={(
                          ((selectedPunchRecord as any)?.typeOfMovement ?? (attendanceDetail as any)?.typeOfMovement ?? "P")
                            .toString()
                            .trim()
                            .toUpperCase()
                        )}
                        className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm transition hover:border-blue-400"
                      >
                        <option value="">Select a Reason</option>
                        <option value="P">Personal</option>
                        <option value="O">Official(Authorization)</option>
                        <option value="B">Break</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Applied Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="appliedDate"
                        type="date"
                        defaultValue={selectedPunchRecord.date}
                        className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm transition hover:border-blue-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b border-blue-200 pb-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Additional Information
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Remarks <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="remarks"
                      className="w-full h-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm resize-none transition hover:border-blue-400"
                      placeholder="Enter remarks (minimum 10 characters)"
                      defaultValue={selectedPunchRecord.notes}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 flex-shrink-0">
              <button
                type="button"
                onClick={handleBackToDetails}
                className="px-6 py-2 h-10 rounded-md font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                className="px-6 py-2 h-10 rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      

    </div>
  )
} 