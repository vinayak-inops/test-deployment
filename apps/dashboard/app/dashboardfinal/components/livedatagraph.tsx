"use client";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { useGetTenantCode } from '@/hooks/useGetTenantCode';
import { useEmpHierarchy } from '@/hooks/hierarchy/emp-hierarchy';
import { useKeyclockRoleInfo } from '@/hooks/search/keyclock-role-info';
import { useUserEntitlement } from '@/hooks/hierarchy/useUserEntitlement';
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

function countFormatter(value: number) {
  return `${Math.abs(value)}`;
}

export default function LiveDataGraph() {
  // Get today's date in YYYY-MM-DD format for API
  const todayDate = new Date().toISOString().split('T')[0];
  const { employeeIds, employeesLite, loading: hLoading, error: hError, hierarchyFilters } = useEmpHierarchy()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()

  const tenantCode = useGetTenantCode();

  // Centralized user entitlement using shared hook (consistent with other dashboard components)
  const userEntitlement = useUserEntitlement(loginEmployeeId, hierarchyFilters)

  const api: any = {
    hierarchyFilters: {
      ...(hierarchyFilters?.subsidiaries && hierarchyFilters.subsidiaries.length > 0 && { subsidiary: hierarchyFilters.subsidiaries }),
      ...(hierarchyFilters?.divisions && hierarchyFilters.divisions.length > 0 && { division: hierarchyFilters.divisions }),
      ...(hierarchyFilters?.departments && hierarchyFilters.departments.length > 0 && { department: hierarchyFilters.departments }),
      ...(hierarchyFilters?.contractors && hierarchyFilters.contractors.length > 0 && { contractor: hierarchyFilters.contractors }),
      ...(hierarchyFilters?.locations && hierarchyFilters.locations.length > 0 && { location: hierarchyFilters.locations }),
    },
    criteriaRequests: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
      {
        field: "date",
        operator: "eq",
        value: todayDate
      }
    ],
    userEntitlement: userEntitlement,
  }

  const {
    data: attendanceResponseData,
    loading: isLoading,
    error: attendanceError,
    refetch: fetchAttendance
  } = useRequest<any>({
    url: 'muster/livePunchCount/searchWithHierarchy',
    method: 'POST',
    data: api,
    onSuccess: (data) => {
    },
    onError: (error) => {
      console.error("Error fetching attendance data:", error);
    },
    dependencies: [todayDate, tenantCode, hierarchyFilters]
  });

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
          <span className="text-xl font-semibold text-gray-900">Live Punch Count</span>
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
        {/* Date Display */}
        <div className="px-4 py-1.5 rounded-md border border-gray-200 bg-white text-gray-800 font-medium shadow-sm">
          {today}
        </div>
      </div>
      <div className="border-b border-gray-100 mb-2" />
      {/* Chart */}
      <div className="flex flex-row gap-6">
        {/* Chart Area */}
        <div className="flex-1 min-w-0">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 48 }}
                barCategoryGap={16}
                barGap={-32}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 13 }}
                  angle={-35}
                  dy={16}
                  interval={0}
                  label={{ value: "Time", position: "insideBottom", offset: -30 }}
                />
                <YAxis 
                  tickFormatter={countFormatter} 
                  tick={{ fontSize: 14 }} 
                  domain={[-80, 80]}
                  label={{ value: "Count", angle: -90, position: "insideLeft", offset: 10 }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [`${Math.abs(value)}`, name === 'punchIn' ? 'Punch In' : 'Punch Out']} 
                  labelFormatter={(label) => `${label}`}
                />
                <ReferenceLine y={0} stroke="#222" strokeWidth={1} />
                <Bar dataKey="punchIn" fill="#0092fb" radius={[6, 6, 0, 0]} barSize={32} name="Punch In" />
                <Bar dataKey="punchOut" fill="#cde9ff" radius={[6, 6, 0, 0]} barSize={32} name="Punch Out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Right Side: Buttons + Stat Cards */}
        <div className="flex flex-col items-end min-w-[260px] w-[300px]">
          {/* Punch In Card */}
          <div className="bg-white border-l h-full p-6 w-full max-w-sm flex flex-col gap-4">
            <div className="flex items-center w-full max-w-md">
              {/* Icon */}
              <div className="rounded-xl w-14 h-14 flex items-center justify-center mr-4" style={{background: "#0092fb"}}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M8 12l4 4 4-4" />
                </svg>
              </div>
              {/* Label and Value */}
              <div className="flex flex-col flex-1 justify-center">
                <span className="text-gray-500 font-medium">Punch In</span>
                <span className="text-xl font-bold text-gray-900">
                  {chartData.reduce((sum: number, item: ChartDataItem) => sum + item.punchIn, 0)}
                </span>
              </div>
              {/* Percentage */}
              <span className="px-3 py-1 rounded-full text-sm font-semibold ml-4 bg-green-100 text-green-600">
                {chartData.length > 0 ? Math.round((chartData.reduce((sum: number, item: ChartDataItem) => sum + item.punchIn, 0) / (chartData.length * 50)) * 100) : 0}%
              </span>
            </div>
            <div className="border-t border-gray-100 my-2" />
            {/* Punch Out Card */}
            <div className="flex items-center w-full max-w-md">
              {/* Icon */}
              <div className="rounded-xl w-14 h-14 flex items-center justify-center mr-4" style={{background: "#cde9ff"}}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M16 12l-4-4-4 4" />
                </svg>
              </div>
              {/* Label and Value */}
              <div className="flex flex-col flex-1 justify-center">
                <span className="text-gray-500 font-medium">Punch Out</span>
                <span className="text-xl font-bold text-gray-900">
                  {Math.abs(chartData.reduce((sum: number, item: ChartDataItem) => sum + item.punchOut, 0))}
                </span>
              </div>
              {/* Percentage */}
              <span className="px-3 py-1 rounded-full text-sm font-semibold ml-4 bg-blue-100 text-blue-600">
                {chartData.length > 0 ? Math.round((Math.abs(chartData.reduce((sum: number, item: ChartDataItem) => sum + item.punchOut, 0)) / (chartData.length * 40)) * 100) : 0}%
              </span>
            </div>
            <div className="border-t border-gray-100 my-2" />
            {/* Net Card */}
            <div className="flex items-center w-full max-w-md">
              {/* Icon */}
              <div className="rounded-xl w-14 h-14 flex items-center justify-center mr-4" style={{background: "#7daae8"}}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              {/* Label and Value */}
              <div className="flex flex-col flex-1 justify-center">
                <span className="text-gray-500 font-medium">Net</span>
                <span className="text-xl font-bold text-gray-900">
                  {Math.abs(chartData.reduce((sum: number, item: ChartDataItem) => sum + item.punchIn + item.punchOut, 0))}
                </span>
              </div>
              {/* Percentage */}
              <span className="px-3 py-1 rounded-full text-sm font-semibold ml-4 bg-purple-100 text-purple-600">
                Net
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 