"use client";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import React, { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

// Type definitions
interface AttendanceData {
  _id: string | { $oid: string };
  tenantCode: string;
  organizationCode: string;
  ins: number;
  outs: number;
  time: string;
  date: string;
}

interface ChartDataItem {
  time: string;
  punchIn: number;
  punchOut: number;
  date: string;
}

interface WeeklyDataItem {
  day: string;
  hours: number;
}

function countFormatter(value: number) {
  return `${Math.abs(value)}`;
}

export default function WorkingHours({ title = "Working Hours" }: { title?: string }) {
  // Get today's date
  const now = new Date();
  const todayDate = now.toISOString().split('T')[0];
  const reqYear = now.getFullYear();
  const reqMonth = now.getMonth() + 1; // 1-based
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  // Cookie helper and role/employee resolution
  const getCookie = (name: string): string | undefined => {
    if (typeof window === 'undefined') return undefined;
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        const value = cookie.substring(name.length + 1);
        try { return decodeURIComponent(value); } catch { return value; }
      }
    }
    return undefined;
  };

  const userRole = useMemo(() => {
    const raw = getCookie('userRole');
    if (!raw) return {} as any;
    try { return JSON.parse(raw); } catch { try { return JSON.parse(decodeURIComponent(raw)); } catch { return {} as any; } }
  }, []);
  const employeeId: string = (userRole as any)?.employeeID || '';

  const {
    data: attendanceResponseData,
    loading: isLoading,
    error: attendanceError,
    refetch: fetchAttendance
  } = useRequest<any>({
    url: 'muster/muster/search',
    method: 'POST',
    data: [
      { field: 'year', operator: 'eq', value: reqYear },
      { field: 'month', operator: 'eq', value: reqMonth },
      ...(employeeId ? [{ field: 'employeeID', operator: 'eq', value: employeeId }] : [])
    ],
    onSuccess: (data) => {
        setAttendanceData(data[0].attendanceDetails);
    },
    onError: (error) => {
      console.error("Error fetching attendance data:", error);
    },
    dependencies: []
  });

  useEffect(() => {
    fetchAttendance();
  }, [employeeId]);

  const attendanceResponse:any=[
    {
      time: "09:00",
      ins: 0,
      outs: 0,
    },
  ]

  // Transform the API response data to chart format
  const chartData: ChartDataItem[] = useMemo(() => {
    // Use API data if available, otherwise use hardcoded data
    const dataToUse = attendanceResponseData || attendanceResponse;
    
    if (!dataToUse || !Array.isArray(dataToUse)) {
      return [];
    }

    // Remove duplicates and get last 14 items
    const uniqueData = dataToUse.filter((item: any, index: number, self: any[]) => 
      index === self.findIndex((t: any) => t.time === item.time)
    ).slice(-14); // Get last 14 items

    return uniqueData.map((item: any) => ({
      time: item.time,
      punchIn: item.ins || 0,
      punchOut: -(item.outs || 0), // Make outs negative for the chart
      date: item.date || ''
    }));
  }, [attendanceResponseData, attendanceResponse]);

  // Aggregate to weekly like the reference image (Mon..Sun, single series)
  const weeklyData: WeeklyDataItem[] = useMemo(() => {
    const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const totals: Record<string, number> = Object.fromEntries(weekDays.map(d => [d, 0]));
    (attendanceData || []).forEach((detail: any) => {
      const minutes: number = typeof detail?.hoursWorked === 'number' ? detail.hoursWorked : 0;
      const dateStr: string = detail?.date;
      if (!dateStr) return;
      const dt = new Date(dateStr);
      if (isNaN(dt.getTime())) return;
      const jsDay = dt.getDay(); // 0..6 (Sun..Sat)
      const dayName = weekDays[(jsDay + 6) % 7]; // map to Mon..Sun index
      totals[dayName] += minutes / 60; // convert to hours
    });
    return weekDays.map(day => ({ day, hours: Math.round(totals[day] * 10) / 10 }));
  }, [attendanceData]);

  const totalMonthlyWorkingHours = useMemo(() => {
    const totalMinutes = (attendanceData || []).reduce((sum, d: any) => sum + (typeof d?.hoursWorked === 'number' ? d.hoursWorked : 0), 0);
    return Math.round(totalMinutes / 60);
  }, [attendanceData]);

  // Get today's date for display
  const today:any = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className=" border bg-white border-gray-200 shadow-xl rounded-xl  p-4">
      {/* Header with buttons on the right */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <span className="text-xl font-semibold text-gray-900">{title}</span>
          <Legend
            wrapperStyle={{ paddingLeft: 0 }}
            iconType="rect"
            formatter={(value) =>
              <span className={value === "punchIn" ? "text-[#0092fb] font-medium" : "text-[#cde9ff] font-medium"}>
                {value === "punchIn" ? "Punch In" : "Punch Out"}
              </span>
            }
          />
        </div>
        {/* Buttons aligned right */}
        <div className="flex gap-2">
          {/* Date Display */}
          <div className="px-4 py-1.5 rounded-md border border-gray-200 bg-white text-gray-800 font-medium shadow-sm">
            {today}
          </div>
          {/* Manage Button */}
          <button className="px-4 py-1.5 rounded-md border border-gray-200 bg-white text-gray-800 font-medium shadow-sm hover:bg-gray-50 transition flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage
          </button>
        </div>
      </div>
      <div className="border-b border-gray-100 mb-2" />
      {/* Total monthly working hours */}
      <div className="flex items-center justify-end px-1 pb-2">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-blue-800 font-semibold text-sm">
          Total Working Hours (This Month): {totalMonthlyWorkingHours}h
        </div>
      </div>

      {/* Chart */}
      <div className="flex flex-row gap-6">
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} barCategoryGap={20}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${v}`} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => [`${v} h`, 'Hours']} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
              <Legend wrapperStyle={{ paddingTop: 8 }} formatter={() => 'Hours'} />
              {/* Highlight today */}
              <ReferenceLine x={new Date().toLocaleDateString('en-US', { weekday: 'long' })} stroke="#2563eb" strokeDasharray="3 3" />
              <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 