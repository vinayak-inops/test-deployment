import type { AttendanceDetail } from "./types"

export const monthNames = [
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
]

export const dayNames = ["Mon", "Tues", "Wed", "Thu", "Fri", "Sat", "Sun"]
export const dayNamesShort = ["M", "T", "W", "T", "F", "S", "S"]

export const getDaysInMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export const getFirstDayOfMonth = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  return firstDay === 0 ? 6 : firstDay - 1 // Convert Sunday (0) to 6, Monday (1) to 0, etc.
}

export const formatYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const formatWorkDuration = (minutes?: number) => {
  if (!minutes) return "--"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

// Get background color based on leave code
export const getLeaveCodeBgColor = (leaveCode: string | undefined): string => {
  if (!leaveCode) return 'bg-blue-100';
  
  // Map leave codes to background colors (light pastel colors)
  const leaveCodeMap: Record<string, string> = {
    'AL': 'bg-blue-100',        // Annual Leave - Light Blue
    'SL': 'bg-cyan-100',        // Sick Leave - Light Cyan
    'CL': 'bg-purple-100',      // Casual Leave - Light Purple
    'PL': 'bg-pink-100',        // Paternity Leave - Light Pink
    'EL': 'bg-rose-100',        // Earned Leave - Light Rose
    'ML': 'bg-violet-100',      // Maternity Leave - Light Violet
    'LWP': 'bg-orange-100',     // Leave Without Pay - Light Orange
    'HL': 'bg-indigo-100',      // Half Leave - Light Indigo
    'VL': 'bg-teal-100',        // Vacation Leave - Light Teal
    'FL': 'bg-amber-100',       // Family Leave - Light Amber
    'AL001': 'bg-blue-100',
    'SL001': 'bg-cyan-100',
    'CL001': 'bg-purple-100',
    'PL001': 'bg-pink-100',
    'ML001': 'bg-violet-100',
  };
  
  // Check if exact match exists
  if (leaveCodeMap[leaveCode]) {
    return leaveCodeMap[leaveCode];
  }
  
  // Check prefix match (e.g., "AL" from "AL001")
  const prefix = leaveCode.substring(0, 2);
  if (leaveCodeMap[prefix]) {
    return leaveCodeMap[prefix];
  }
  
  // Default color for unknown leave codes
  return 'bg-gray-100';
}

// Determine card color based on attendance status
export const getCardColor = (attendanceDetail: AttendanceDetail | null) => {
  if (!attendanceDetail) return 'bg-gray-200'; // Default for no data
  
  // Priority 1: Leave codes get their specific colors (only if not '00' or empty)
  const leaveCode = attendanceDetail.leaveCode ? String(attendanceDetail.leaveCode).trim() : '';
  if (leaveCode !== '' && leaveCode !== '00' && leaveCode !== '0') {
    return getLeaveCodeBgColor(leaveCode);
  }
  
  // Priority 2: Attendance ID based colors - each condition gets distinct color
  // Normalize attendanceID by converting to string, trimming and converting to uppercase
  const attendanceID = attendanceDetail.attendanceID 
    ? String(attendanceDetail.attendanceID).trim().toUpperCase().replace(/\s+/g, '') 
    : '';
  
  // Apply colors based on attendanceID
  if (attendanceID === 'AA') {
    return 'bg-red-100'; // Absent - Red color
  }
  if (attendanceID === 'HH') {
    return 'bg-yellow-100'; // Holiday - Yellow color
  }
  if (attendanceID === 'PP') {
    return 'bg-blue-100'; // Present - Light Blue color
  }
  if (attendanceID === 'WW') {
    return 'bg-gray-100'; // Weekend - Light Gray color
  }
  
  // Default color for any other conditions
  return 'bg-blue-50'; // Very light blue background as fallback
}

// Get text color based on leave code
export const getLeaveCodeTextColor = (leaveCode: string | undefined): string => {
  if (!leaveCode) return 'text-gray-800';
  
  const textColorMap: Record<string, string> = {
    'AL': 'text-blue-800',
    'SL': 'text-cyan-800',
    'CL': 'text-purple-800',
    'PL': 'text-pink-800',
    'EL': 'text-rose-800',
    'ML': 'text-violet-800',
    'LWP': 'text-orange-800',
    'HL': 'text-indigo-800',
    'VL': 'text-teal-800',
    'FL': 'text-amber-800',
    'AL001': 'text-blue-800',
    'SL001': 'text-cyan-800',
    'CL001': 'text-purple-800',
    'PL001': 'text-pink-800',
    'ML001': 'text-violet-800',
  };
  
  if (textColorMap[leaveCode]) return textColorMap[leaveCode];
  const prefix = leaveCode.substring(0, 2);
  if (textColorMap[prefix]) return textColorMap[prefix];
  return 'text-gray-800';
}

// Get text color based on attendance ID with multiple color options
export const getAttendanceTextColor = (attendanceDetail: AttendanceDetail): string => {
  // Priority 1: Leave codes get their specific text colors
  if (attendanceDetail.leaveCode && attendanceDetail.leaveCode.trim() !== '') {
    return getLeaveCodeTextColor(attendanceDetail.leaveCode);
  }
  
  // Priority 2: Attendance ID based text colors
  const textColorMap: Record<string, string> = {
    'PP': 'text-blue-800',        // Present - Dark Blue
    'AA': 'text-red-800',         // Absent - Dark Red
    'HH': 'text-yellow-800',      // Holiday - Dark Yellow
    'WW': 'text-gray-700',        // Weekend - Dark Gray
    'HD': 'text-purple-800',      // Half Day - Dark Purple
    'OD': 'text-indigo-800',      // On Duty - Dark Indigo
    'WO': 'text-orange-800',      // Work Off - Dark Orange
    'PH': 'text-pink-800',        // Public Holiday - Dark Pink
    'CL': 'text-cyan-800',        // Compensatory Leave - Dark Cyan
    'SL': 'text-teal-800',        // Special Leave - Dark Teal
  };
  
  // Check if attendanceID exists and has a mapped color
  if (attendanceDetail.attendanceID && attendanceDetail.attendanceID.trim() !== '') {
    const color = textColorMap[attendanceDetail.attendanceID];
    if (color) return color;
  }
  
  // Default text color if no condition matches
  return 'text-gray-800'; // Dark gray as default
}

// Helper function to get dot color for small calendar
export const getDotColor = (attendanceDetail: AttendanceDetail): string => {
  const attendanceID = attendanceDetail.attendanceID?.trim() || '';
  if (attendanceID === 'AA') {
    return 'bg-red-500'; // Absent - Red dot
  }
  if (attendanceID === 'HH') {
    return 'bg-yellow-500'; // Holiday - Yellow dot
  }
  if (attendanceID === 'PP') {
    return 'bg-blue-500'; // Present - Blue dot
  }
  if (attendanceID === 'WW') {
    return 'bg-gray-400'; // Weekend - Gray dot
  }
  return 'bg-blue-400'; // Default - Light blue dot
}

