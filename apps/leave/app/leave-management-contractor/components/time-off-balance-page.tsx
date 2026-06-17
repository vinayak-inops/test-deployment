"use client"

import { ArrowLeft, Calendar, Download, Filter, Search, User, ChevronDown } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { Badge } from "@repo/ui/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { useEffect, useState, useMemo } from "react"
import { useLeaveBalances } from "../../../hooks/useLeaveBalances"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import EmpFilter from "./emp-filter"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import * as XLSX from 'xlsx'
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"


interface TimeOffBalancePageProps {
  onBack: () => void
}

// Get cookie information
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

// API Response Types
interface BalanceData {
  leaveTitle: string
  leaveCode: string
  unitOfTime: string
  beginningYearBalance: number
  carryoverBalance: number
  absencePaidYearToDate: number
  absencePaidInPeriod: number
  beginningPeriodBalance: number
  accruedInPeriod: number
  carryoverForfeitedInPeriod: number
  balance: number
  encashed: number
  includeEventsAwaitingApproval: number
  asOfPeriod: string
}

interface ApiResponse {
  balances: BalanceData[]
  employeeID: string
}

// Transformed data type for the component
interface TransformedBalanceData {
  absencePlan: string
  unitOfTime: string
  beginningYearBalance: number
  carryoverBalance: number
  absencePaidYearToDate: number
  absencePaidInPeriod: number
  beginningPeriodBalance: number
  accruedInPeriod: number
  carryoverForfeitedInPeriod: number
  balance: number
  encashed: number
  includeEventsAwaitingApproval: number
  asOfPeriod: string
  highlighted?: boolean
}

// Row for the All Employees tab
interface EmployeeSummaryRow {
  employeeID: string
  name: string
  [key: string]: string | number // Dynamic leave code properties (balance values are numbers)
}

export function TimeOffBalancePage({ onBack }: TimeOffBalancePageProps) {
  const [balanceData, setBalanceData] = useState<TransformedBalanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [employeeID, setEmployeeID] = useState<string>("")
  const [empStatues, setEmpStatues] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'self' | 'individual'>("all")

  // state for All Employees tab
  const [employeeSummary, setEmployeeSummary] = useState<EmployeeSummaryRow[]>([])
  const [groupedEmployeeData, setGroupedEmployeeData] = useState<any[]>([])
  const [isLoadingEmployeeSummary, setIsLoadingEmployeeSummary] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false)
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("")
  const [uniqueLeaveCodes, setUniqueLeaveCodes] = useState<string[]>([])
  const [useGroupedView, setUseGroupedView] = useState<boolean>(true)
  const tenantCode = useGetTenantCode()
  
  const { employeeIds, employeesLite, rawEmployees, loading: employeesLoading } = useEmpHierarchy()
const { responseData: roleApproverEmployeeManagement } = useRolePermissions({
    serviceName: 'employeeManagement',
    screenName: 'employeeBalance'
  });
  const canSeeSelf = false
  const canSeeAll = Boolean((roleApproverEmployeeManagement as any)?.view)

  // Get stored role information from cookies
  const storedRoleInfo = useMemo(() => {
    try {
      const keyclockroleinfo = getCookie("keyclockroleinfo");
      if (keyclockroleinfo) {
        return JSON.parse(keyclockroleinfo);
      }
    } catch (error) {
      // ignore parse errors
    }
    return null;
  }, []);

  // Apply role-based visibility similar to page.tsx
  useEffect(() => {
    // Emp filter is allowed only when user has ALL permission
    setEmpStatues(canSeeAll)

    // Default active tab based on permissions
    if (canSeeAll) {
      setActiveTab(prev => (prev === 'all' || prev === 'self' || prev === 'individual' ? prev : 'all'))
    } else if (canSeeSelf) {
      setActiveTab('self')
      // If canSeeAll is false and canSeeSelf is true, auto-select employee from cookie
      if (storedRoleInfo?.employeeId) {
        setSelectedEmployeeId(storedRoleInfo.employeeId)
      }
    }
  }, [canSeeAll, canSeeSelf, storedRoleInfo])

  // EmpFilter popup state
  const [isEmpFilterOpen, setIsEmpFilterOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const [hasUserSelectedEmployee, setHasUserSelectedEmployee] = useState<boolean>(false)


  // Use the leave balances hook
  const { 
    balanceData: hookBalanceData, 
    loading: hookLoading, 
    error: hookError, 
    lastUpdated, 
    updateBalanceData, 
    setLoadingState, 
    setErrorState 
  } = useLeaveBalances()


  // API call for leave balance data using useRequest hook
  const {
    data: leaveBalanceResponse,
    loading: isLoadingLeaveBalance,
    error: leaveBalanceError,
    refetch: fetchLeaveBalance
  } = useRequest<any>({
    url: 'leaveBalance/search',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
      {
        field: "employeeID",
        operator: "eq",
        value: selectedEmployeeId
      },
    ],
    onSuccess: (data: any) => {
      updateBalanceData(data)
    },
    onError: (error: Error) => {
      console.error("Error fetching leave balance data:", error);
      setErrorState(error.message)
    },
    dependencies: []
  });

  useEffect(() => {
    setLoadingState(true)
    fetchLeaveBalance()
  }, [])

  // Refetch individual balance when selected employee changes
  useEffect(() => {
    if (activeTab === 'individual' && selectedEmployeeId) {
      setLoadingState(true)
      fetchLeaveBalance()
    }
  }, [selectedEmployeeId, activeTab])

  // Update loading state based on API call
  useEffect(() => {
    setLoadingState(isLoadingLeaveBalance)
  }, [isLoadingLeaveBalance])

  // Transform API data to component format
  const transformApiData = (apiData: ApiResponse): TransformedBalanceData[] => {
    return apiData.balances.map((balance, index) => ({
      absencePlan: balance.leaveCode,
      unitOfTime: balance.unitOfTime,
      beginningYearBalance: balance.beginningYearBalance,
      carryoverBalance: balance.carryoverBalance,
      absencePaidYearToDate: balance.absencePaidYearToDate,
      absencePaidInPeriod: balance.absencePaidInPeriod,
      beginningPeriodBalance: balance.beginningPeriodBalance,
      accruedInPeriod: balance.accruedInPeriod,
      carryoverForfeitedInPeriod: balance.carryoverForfeitedInPeriod,
      balance: balance.balance,
      encashed: balance.encashed,
      includeEventsAwaitingApproval: balance.includeEventsAwaitingApproval,
      asOfPeriod: balance.asOfPeriod,
      highlighted: index === 0 // Highlight first item as example
    }))
  }

  // Get employees basic info from employeesLite/rawEmployees
  const getEmployeesForDropdown = useMemo(() => {
    // Filter out deleted employees and map to dropdown format
    const validEmployees = (rawEmployees || []).filter((emp: any) => emp.isDeleted !== true)
    
    return validEmployees.map((emp: any) => ({
      employeeID: emp.employeeID || emp.employeeId || emp.empId || '',
      name: `${emp.firstName || ''}${emp.middleName ? ' ' + emp.middleName : ''} ${emp.lastName || ''}`.trim()
    })).filter((emp: { employeeID: string; name: string }) => emp.employeeID) as { employeeID: string; name: string }[]
  }, [rawEmployees])

  // Extract unique leave codes from all employee balance data
  const extractUniqueLeaveCodes = (raw: any[]): string[] => {
    const leaveCodeSet = new Set<string>()
    
    raw.forEach((entry: any) => {
      const balances: any[] = entry?.balances || []
      balances.forEach((b: any) => {
        const leaveCode = b?.leaveCode || b?.leaveTitle || ''
        if (leaveCode && leaveCode.trim()) {
          leaveCodeSet.add(leaveCode.trim())
        }
      })
    })
    
    return Array.from(leaveCodeSet).sort()
  }

  // Build grouped summary data for the new table format with row spanning info
  const buildGroupedSummaryFromBalances = (raw: any[]): any[] => {
    const groupedData: any[] = []
    const employeeCounts = new Map<string, number>()
    
    // First pass: count leave codes per employee
    raw.forEach((entry: any) => {
      const id = entry?.employeeID
      const balances: any[] = entry?.balances || []
      if (!id) return
      
      let leaveCodeCount = 0
      balances.forEach((b: any) => {
        const leaveCode = b?.leaveCode || b?.leaveTitle || ''
        if (leaveCode && leaveCode.trim()) {
          leaveCodeCount++
        }
      })
      if (leaveCodeCount > 0) {
        employeeCounts.set(id, leaveCodeCount)
      }
    })
    
    // Second pass: create rows with row span info
    raw.forEach((entry: any) => {
      const id = entry?.employeeID
      const balances: any[] = entry?.balances || []
      if (!id) return
      
      const totalRows = employeeCounts.get(id) || 0
      let currentRow = 0
      
      balances.forEach((b: any) => {
        const leaveCode = b?.leaveCode || b?.leaveTitle || ''
        if (leaveCode && leaveCode.trim()) {
          groupedData.push({
            employeeID: id,
            name: id, // Will be updated with actual name later
            leaveCode: leaveCode.trim(),
            balance: parseFloat(b?.balance || 0),
            rowSpan: currentRow === 0 ? totalRows : 0, // Only first row gets rowSpan
            isFirstRow: currentRow === 0 // Flag to identify first row
          })
          currentRow++
        }
      })
    })
    
    return groupedData
  }

  // Build summary map from balances array (all employees) - keeping original for backward compatibility
  const buildSummaryFromBalances = (raw: any[]): EmployeeSummaryRow[] => {
    const map = new Map<string, EmployeeSummaryRow>()
    
    // Extract unique leave codes first
    const uniqueCodes = extractUniqueLeaveCodes(raw)
    setUniqueLeaveCodes(uniqueCodes)
    
    raw.forEach((entry: any) => {
      const id = entry?.employeeID
      const balances: any[] = entry?.balances || []
      if (!id) return
      
      // Initialize employee row with all unique leave codes
      const existing = map.get(id) || { 
        employeeID: id, 
        name: id,
        ...Object.fromEntries(uniqueCodes.map(code => [code, 0]))
      }
      
      balances.forEach((b: any) => {
        const leaveCode = b?.leaveCode || b?.leaveTitle || ''
        if (leaveCode && leaveCode.trim()) {
          const value = parseFloat(b?.balance || 0)
          ;(existing as any)[leaveCode.trim()] = value
        }
      })
      map.set(id, existing)
    })
    return Array.from(map.values())
  }

  // Fetch all balances for tenant and merge with employee names
  const { refetch: fetchAllBalances } = useRequest<any>({
    url: 'leaveBalance/search',
    method: 'POST',
    data: [
      {
        field: 'tenantCode',
        operator: 'eq',
        value: tenantCode
      },
      {
        field: "employeeID",
        operator: "in",
        value: employeeIds
      },
    ],
    onSuccess: async (data: any) => {
      try {
        const rawArray = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
        const summary = buildSummaryFromBalances(rawArray)
        const groupedData = buildGroupedSummaryFromBalances(rawArray)
        const nameMap = new Map(getEmployeesForDropdown.map((e: { employeeID: string; name: string }) => [e.employeeID, e.name]))
        const merged = summary.map(row => ({ ...row, name: (nameMap.get(row.employeeID) || row.name) as string }))
        const mergedGrouped = groupedData.map(row => ({ ...row, name: (nameMap.get(row.employeeID) || row.name) as string }))
        setEmployeeSummary(merged)
        setGroupedEmployeeData(mergedGrouped)
      } finally {
        setIsLoadingEmployeeSummary(false)
      }
    },
    onError: () => {
      setIsLoadingEmployeeSummary(false)
    },
    dependencies: []
  })

  // Trigger loading employee summary when switching to All tab first time
  useEffect(() => {
    if (canSeeAll && activeTab === 'all' && employeeSummary.length === 0 && !isLoadingEmployeeSummary) {
      setIsLoadingEmployeeSummary(true)
      fetchAllBalances()
    }
  }, [activeTab, canSeeAll])

  // Reset to first page when data or page size changes
  useEffect(() => {
    setCurrentPage(1)
  }, [employeeSummary, pageSize])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.employee-dropdown-container')) {
        setIsEmployeeDropdownOpen(false)
        setEmployeeSearchTerm("") // Clear search when dropdown closes
      }
    }

    if (isEmployeeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEmployeeDropdownOpen])

  // Filter employees based on selection
  const filteredEmployeeSummary = useMemo(() => {
    if (selectedEmployees.length === 0) {
      return employeeSummary
    }
    return employeeSummary.filter(emp => selectedEmployees.includes(emp.employeeID))
  }, [employeeSummary, selectedEmployees])

  // Filter grouped employee data based on selection
  const filteredGroupedEmployeeData = useMemo(() => {
    if (selectedEmployees.length === 0) {
      return groupedEmployeeData
    }
    return groupedEmployeeData.filter(emp => selectedEmployees.includes(emp.employeeID))
  }, [groupedEmployeeData, selectedEmployees])

  // Filter employees for dropdown search
  const filteredEmployees = employeeSummary.filter(emp => {
    if (!emp.employeeID) return false;
    const matches = emp.employeeID.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                   emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase());
    return matches;
  })

  const totalPages = Math.max(1, Math.ceil(filteredEmployeeSummary.length / pageSize))
  const startIdx = (currentPage - 1) * pageSize
  const endIdx = startIdx + pageSize
  const paginatedSummary = filteredEmployeeSummary.slice(startIdx, endIdx)

  // Pagination for grouped view
  const groupedTotalPages = Math.max(1, Math.ceil(filteredGroupedEmployeeData.length / pageSize))
  const groupedStartIdx = (currentPage - 1) * pageSize
  const groupedEndIdx = groupedStartIdx + pageSize
  const paginatedGroupedData = filteredGroupedEmployeeData.slice(groupedStartIdx, groupedEndIdx)

  const handleDownloadAllEmployeesExcel = () => {
    let exportData: any[]
    
    if (useGroupedView) {
      exportData = filteredGroupedEmployeeData.map(row => ({
        'Employee ID': row.employeeID,
        'Name': row.name,
        'Leave Code': row.leaveCode,
        'Balance': row.balance
      }))
    } else {
      exportData = filteredEmployeeSummary.map(row => {
        const baseData = {
          'Employee ID': row.employeeID,
          'Name': row.name,
        }
        
        // Add dynamic leave code columns
        const leaveCodeData = uniqueLeaveCodes.reduce((acc, code) => {
          const value = row[code]
          acc[code] = typeof value === 'number' ? value : parseFloat(String(value)) || 0
          return acc
        }, {} as Record<string, number>)
        
        return { ...baseData, ...leaveCodeData }
      })
    }
    
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(exportData)
    XLSX.utils.book_append_sheet(wb, ws, useGroupedView ? 'Grouped Leave Balance' : 'Employee Leave Balance')
    XLSX.writeFile(wb, `Employee_Leave_Balance_${useGroupedView ? 'Grouped' : 'Summary'}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Handle employee selection in dropdown
  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  // Handle select all employees
  const handleSelectAllEmployees = () => {
    if (selectedEmployees.length === employeeSummary.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(employeeSummary.map(emp => emp.employeeID))
    }
  }

  // Transform hook data to component format
  const transformHookData = (hookData: any[]): TransformedBalanceData[] => {
    return hookData.map((balance: any) => ({
      absencePlan: balance.type, // Map the backend leave type to absencePlan for display
      unitOfTime: balance.unitOfTime || "Days",
      beginningYearBalance: balance.total - balance.used,
      carryoverBalance: 0, // Not available in hook data
      absencePaidYearToDate: balance.used,
      absencePaidInPeriod: 0, // Not available in hook data
      beginningPeriodBalance: balance.total,
      accruedInPeriod: 0, // Not available in hook data
      carryoverForfeitedInPeriod: 0, // Not available in hook data
      balance: balance.balance,
      encashed: 0, // Not available in hook data
      includeEventsAwaitingApproval: balance.balance, // Using balance as approximation
      asOfPeriod: balance.asOfPeriod || new Date().toISOString().split('T')[0]
    }))
  }

  useEffect(() => {
    // Use hook data when available
    if (hookBalanceData && hookBalanceData.length > 0) {
      const transformedData = transformHookData(hookBalanceData)
      setBalanceData(transformedData)
      setEmployeeID("EMP001")
      setLoading(false)
    }
  }, [hookBalanceData])

  // Filter data based on search term
  const filteredData = balanceData.filter(item =>
    item.absencePlan.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate totals
  const totalBalance = filteredData.reduce((sum, item) => sum + item.balance, 0)
  const totalIncludingEvents = filteredData.reduce((sum, item) => sum + item.includeEventsAwaitingApproval, 0)

  // Handle employee selection from EmpFilter
  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId)
    setHasUserSelectedEmployee(true)
    setIsEmpFilterOpen(false)
    setActiveTab('individual')
  }

  // Handle opening EmpFilter popup
  const handleOpenEmpFilter = () => {
    setIsEmpFilterOpen(true)
  }

  // Handle closing EmpFilter popup
  const handleCloseEmpFilter = () => {
    setIsEmpFilterOpen(false)
    if (!selectedEmployeeId && canSeeAll) {
      setActiveTab('all')
    }
  }

  

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Time Off Balance
                </h1>
                <p className="text-gray-600 mt-1 text-base">{employeeID}</p>
              </div>
            </div>
          </div>
          
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
                              <Button onClick={fetchLeaveBalance} variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-full overflow-x-auto p-4">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Time Off Balance
              </h1>
              <p className="text-gray-600 mt-1 text-base">
                {activeTab === 'individual' && hasUserSelectedEmployee && selectedEmployeeId && (
                  <span className="text-blue-600 ml-2 font-medium">
                    - Employee ID: {selectedEmployeeId}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {activeTab === 'individual' && (canSeeAll || canSeeSelf) && (
              <>
                <Button 
                  variant="outline" 
                  className="hover:bg-gray-50"
                  onClick={handleOpenEmpFilter}
                >
                  <User className="h-4 w-4 mr-2" />
                  Filter by Employee
                </Button>
                {selectedEmployeeId && (
                  <Button 
                    variant="outline" 
                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    onClick={() => { setSelectedEmployeeId(""); setHasUserSelectedEmployee(false); }}
                  >
                    Clear Filter
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => {
          const val = v as 'all' | 'self' | 'individual'
          if (val === 'all' && !canSeeAll) return
          if (val === 'self' && !canSeeSelf) return
          if (val === 'individual') {
            if (!canSeeAll) return
            // Clear any pre-filled employee when opening Individual filter
            setSelectedEmployeeId("")
            setHasUserSelectedEmployee(false)
            setIsEmpFilterOpen(true)
            if (!selectedEmployeeId) return
          }
          if (val === 'self' && storedRoleInfo?.employeeId) {
            setSelectedEmployeeId(storedRoleInfo.employeeId)
          }
          setActiveTab(val)
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-0 mb-2 h-10 bg-slate-50 rounded-full p-1 border border-slate-200">
            {canSeeAll && (
              <TabsTrigger 
                value="all" 
                className={"text-sm rounded-full transition-colors text-slate-700 hover:bg-white data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm"}
              >
                All Employee Balance
              </TabsTrigger>
            )}
            {canSeeSelf && (
              <TabsTrigger 
                value="self" 
                className={"text-sm rounded-full transition-colors text-slate-700 hover:bg-white data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm"}
              >
                Check Self Info
              </TabsTrigger>
            )}
            {canSeeAll && (
              <TabsTrigger 
                value="individual" 
                className={"text-sm rounded-full transition-colors text-slate-700 hover:bg-white data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm"}
              >
                Individual Employee Balance
              </TabsTrigger>
            )}
          </TabsList>

          {/* TAB 1: All Employees list */}
          {canSeeAll && (
          <TabsContent value="all" className="m-0">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Employee Leave Balance Summary</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">View:</span>
                      <Button 
                        variant={useGroupedView ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setUseGroupedView(true)}
                        className="text-xs"
                      >
                        Grouped
                      </Button>
                      <Button 
                        variant={!useGroupedView ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setUseGroupedView(false)}
                        className="text-xs"
                      >
                        Summary
                      </Button>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {useGroupedView ? filteredGroupedEmployeeData.length : filteredEmployeeSummary.length} Records
                    </Badge>
                    <Button variant="outline" className="hover:bg-gray-50" onClick={handleDownloadAllEmployeesExcel}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Excel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Employee Filter Dropdown */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="relative employee-dropdown-container">
                      <Button 
                        variant="outline" 
                        className="w-[300px] justify-between"
                        onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
                      >
                        <span>
                          {selectedEmployees.length === 0 
                            ? "Select Employees" 
                            : selectedEmployees.length === employeeSummary.length 
                              ? "All Employees Selected" 
                              : `${selectedEmployees.length} Employee(s) Selected`
                          }
                        </span>
                        <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isEmployeeDropdownOpen ? 'rotate-180' : ''}`} />
                      </Button>
                      
                      {isEmployeeDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-[300px] bg-white border border-gray-200 rounded-md shadow-lg z-[9999] employee-dropdown-container">
                          <div className="max-h-[300px] overflow-y-auto">
                            {/* Search Input */}
                            <div className="p-2 border-b bg-gray-50 employee-dropdown-container">
                              <div className="relative">
                                <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <circle cx="11" cy="11" r="8" />
                                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <input
                                  type="text"
                                  placeholder="Search employees..."
                                  className="pl-8 pr-8 py-1 w-full text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  value={employeeSearchTerm}
                                  onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                {employeeSearchTerm && (
                                  <button
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEmployeeSearchTerm("")
                                    }}
                                  >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <line x1="18" y1="6" x2="6" y2="18" />
                                      <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Select All */}
                            <div className="p-2 border-b bg-gray-50 employee-dropdown-container">
                              <div 
                                className="flex items-center space-x-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSelectAllEmployees()
                                }}
                              >
                                <Checkbox
                                  id="select-all"
                                  checked={selectedEmployees.length === employeeSummary.length && employeeSummary.length > 0}
                                  onCheckedChange={handleSelectAllEmployees}
                                />
                                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                                  Select All ({employeeSummary.length})
                                </label>
                              </div>
                            </div>
                            
                            {/* Employee List */}
                            {isLoadingEmployeeSummary ? (
                              <div className="p-4 text-center text-sm text-gray-500">
                                Loading employees...
                              </div>
                            ) : filteredEmployees.length === 0 ? (
                              <div className="p-4 text-center text-sm text-gray-500">
                                {employeeSearchTerm ? 'No employees found matching your search' : 'No employees found'}
                              </div>
                            ) : (
                              filteredEmployees.map((employee) => (
                                <div 
                                  key={employee.employeeID} 
                                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 employee-dropdown-container"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEmployeeToggle(employee.employeeID)
                                  }}
                                >
                                  <Checkbox
                                    id={employee.employeeID}
                                    checked={selectedEmployees.includes(employee.employeeID)}
                                    onCheckedChange={() => handleEmployeeToggle(employee.employeeID)}
                                  />
                                  <label htmlFor={employee.employeeID} className="text-sm flex-1 cursor-pointer">
                                    <div className="font-medium">{employee.employeeID}</div>
                                    <div className="text-gray-500">{employee.name}</div>
                                  </label>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {selectedEmployees.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedEmployees([])}
                        className="text-red-600 hover:text-red-700"
                      >
                        Clear Selection
                      </Button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {useGroupedView ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/80">
                          <TableHead className="text-gray-800 w-[200px] text-sm tracking-wide">Employee ID</TableHead>
                          <TableHead className="text-gray-800 text-sm tracking-wide">Name</TableHead>
                          <TableHead className="text-gray-800 text-sm tracking-wide">Leave Code</TableHead>
                          <TableHead className="text-gray-800 text-center text-sm tracking-wide">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingEmployeeSummary && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-sm py-6">Loading...</TableCell>
                          </TableRow>
                        )}
                        {!isLoadingEmployeeSummary && paginatedGroupedData.map((row, index) => (
                          <TableRow key={`${row.employeeID}-${row.leaveCode}-${index}`} className="hover:bg-gray-50/50 transition-all duration-200 group">
                            {row.isFirstRow ? (
                              <TableCell 
                                rowSpan={row.rowSpan} 
                                className="font-medium text-gray-900 text-sm border-r border-gray-200"
                              >
                                {row.employeeID}
                              </TableCell>
                            ) : null}
                            {row.isFirstRow ? (
                              <TableCell 
                                rowSpan={row.rowSpan} 
                                className="text-gray-700 text-sm border-r border-gray-200"
                              >
                                {row.name}
                              </TableCell>
                            ) : null}
                            <TableCell className="text-gray-700 text-sm">{row.leaveCode}</TableCell>
                            <TableCell className="text-center text-gray-700 text-sm font-medium">{row.balance.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/80">
                          <TableHead className="text-gray-800 w-[200px] text-sm tracking-wide">Employee ID</TableHead>
                          <TableHead className="text-gray-800 text-sm tracking-wide">Name</TableHead>
                          {uniqueLeaveCodes.map((leaveCode) => (
                            <TableHead key={leaveCode} className="text-gray-800 text-center text-sm tracking-wide">
                              {leaveCode}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingEmployeeSummary && (
                          <TableRow>
                            <TableCell colSpan={2 + uniqueLeaveCodes.length} className="text-center text-sm py-6">Loading...</TableCell>
                          </TableRow>
                        )}
                        {!isLoadingEmployeeSummary && paginatedSummary.map((row) => (
                          <TableRow key={row.employeeID} className="hover:bg-gray-50/50 transition-all duration-200 group">
                            <TableCell className="font-medium text-gray-900 text-sm">{row.employeeID}</TableCell>
                            <TableCell className="text-gray-700 text-sm">{row.name}</TableCell>
                            {uniqueLeaveCodes.map((leaveCode) => (
                              <TableCell key={leaveCode} className="text-center text-gray-700 text-sm">
                                {typeof row[leaveCode] === 'number' ? row[leaveCode].toFixed(2) : '0.00'}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>
                      {useGroupedView 
                        ? `Showing ${filteredGroupedEmployeeData.length === 0 ? 0 : groupedStartIdx + 1}-${Math.min(groupedEndIdx, filteredGroupedEmployeeData.length)} of ${filteredGroupedEmployeeData.length}`
                        : `Showing ${filteredEmployeeSummary.length === 0 ? 0 : startIdx + 1}-${Math.min(endIdx, filteredEmployeeSummary.length)} of ${filteredEmployeeSummary.length}`
                      }
                    </span>
                    <div className="flex items-center gap-2 ml-4">
                      <span>Rows per page</span>
                      <select
                        className="border border-gray-200 rounded-md px-2 py-1 text-sm bg-white"
                        value={pageSize}
                        onChange={(e) => setPageSize(parseInt(e.target.value) || 10)}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                        <option value={500}>500</option>
                        <option value={1000}>1,000</option>
                        <option value={5000}>5,000</option>
                        <option value={10000}>10,000</option>
                        <option value={100000}>100,000</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="h-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>First</Button>
                    <Button variant="outline" className="h-8" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {useGroupedView ? groupedTotalPages : totalPages}
                    </span>
                    <Button variant="outline" className="h-8" onClick={() => setCurrentPage((p) => Math.min(useGroupedView ? groupedTotalPages : totalPages, p + 1))} disabled={currentPage === (useGroupedView ? groupedTotalPages : totalPages)}>Next</Button>
                    <Button variant="outline" className="h-8" onClick={() => setCurrentPage(useGroupedView ? groupedTotalPages : totalPages)} disabled={currentPage === (useGroupedView ? groupedTotalPages : totalPages)}>Last</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* TAB 2: Self info (same UI as Individual, without employee filter requirement) */}
          {canSeeSelf && (
          <TabsContent value="self" className="m-0">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium">Total Balance</p>
                  <p className="text-2xl font-bold">{totalBalance.toFixed(2)}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs font-medium">Including Pending</p>
                  <p className="text-2xl font-bold">{totalIncludingEvents.toFixed(2)}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs font-medium">Leave Types</p>
                  <p className="text-2xl font-bold">{filteredData.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs font-medium">Balance As Of</p>
                  <p className="text-base font-bold">
                    {balanceData.length > 0 ? new Date(balanceData[0].asOfPeriod).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    }).split('/').join('-') : 'N/A'}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Balance Info */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">My Leave Balance</CardTitle>
                <CardDescription className="mt-2">
                  Values displayed are based on the Balance entered. To view details drill down on Year to
                  Date values.
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {filteredData.length} Items
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Search and Filters */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search absence plans..."
                  className="pl-10 h-11 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Table */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Leave Balance Summary</CardTitle>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {filteredData.length} Records
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-gray-800 w-[200px] text-sm tracking-wide">Leave Code</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Unit Of Time</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Beginning Year Balance</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Carryover Balance</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Absence Paid Year To Date</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Absence Paid In Period</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Beginning Period Balance</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Accrued In Period</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Carryover Forfeited In Period</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Balance</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Encashed</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Include Events Awaiting Approval</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">As Of Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, index) => (
                    <TableRow key={index} className={`hover:bg-gray-50/50 transition-all duration-200 group ${row.highlighted ? "bg-blue-50/80" : ""}`}>
                      <TableCell className="font-medium text-gray-900 text-sm">{row.absencePlan}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.unitOfTime}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.beginningYearBalance}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.carryoverBalance}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.absencePaidYearToDate}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.absencePaidInPeriod}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.beginningPeriodBalance}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.accruedInPeriod}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.carryoverForfeitedInPeriod}</TableCell>
                      <TableCell className="text-center font-semibold text-gray-900 text-sm">{row.balance}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.encashed}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.includeEventsAwaitingApproval}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">
                        {new Date(row.asOfPeriod).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }).split('/').join('-')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
          </TabsContent>
          )}

          {/* TAB 3: Individual balance (requires employee selection) */}
          {canSeeAll && (
          <TabsContent value="individual" className="m-0">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium">Total Balance</p>
                  <p className="text-2xl font-bold">{totalBalance.toFixed(2)}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs font-medium">Including Pending</p>
                  <p className="text-2xl font-bold">{totalIncludingEvents.toFixed(2)}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs font-medium">Leave Types</p>
                  <p className="text-2xl font-bold">{filteredData.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs font-medium">Balance As Of</p>
                  <p className="text-base font-bold">
                    {balanceData.length > 0 ? new Date(balanceData[0].asOfPeriod).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    }).split('/').join('-') : 'N/A'}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Balance Info */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Balance Information</CardTitle>
                <CardDescription className="mt-2">
                  Values displayed are based on the Balance entered. To view details drill down on Year to
                  Date values.
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {filteredData.length} Items
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Search and Filters */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search absence plans..."
                  className="pl-10 h-11 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {selectedEmployeeId && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">
                    Filtered by: {selectedEmployeeId}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Balance Table */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Leave Balance Summary</CardTitle>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {filteredData.length} Records
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-gray-800 w-[200px] text-sm tracking-wide">Leave Code</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Unit Of Time</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Beginning Year Balance</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Carryover Balance</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Absence Paid Year To Date</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Absence Paid In Period</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Beginning Period Balance</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Accrued In Period</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Carryover Forfeited In Period</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Balance</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Encashed</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">Include Events Awaiting Approval</TableHead>
                    <TableHead className="text-gray-800 text-center text-sm tracking-wide">As Of Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, index) => (
                    <TableRow key={index} className={`hover:bg-gray-50/50 transition-all duration-200 group ${row.highlighted ? "bg-blue-50/80" : ""}`}>
                      <TableCell className="font-medium text-gray-900 text-sm">{row.absencePlan}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.unitOfTime}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.beginningYearBalance}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.carryoverBalance}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.absencePaidYearToDate}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.absencePaidInPeriod}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.beginningPeriodBalance}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.accruedInPeriod}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.carryoverForfeitedInPeriod}</TableCell>
                      <TableCell className="text-center font-semibold text-gray-900 text-sm">{row.balance}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.encashed}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">{row.includeEventsAwaitingApproval}</TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">
                        {new Date(row.asOfPeriod).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }).split('/').join('-')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow className="bg-gray-100/80 font-semibold">
                    <TableCell className="text-right font-bold text-gray-900 text-sm">
                      Total
                    </TableCell>
                    <TableCell className="text-center text-gray-700 text-sm">-</TableCell>
                    <TableCell className="text-center font-bold text-gray-900 text-sm">
                      {filteredData.reduce((sum, item) => sum + item.beginningYearBalance, 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center font-bold text-gray-900 text-sm">
                      {filteredData.reduce((sum, item) => sum + item.carryoverBalance, 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center font-bold text-gray-900 text-sm">
                      {filteredData.reduce((sum, item) => sum + item.absencePaidYearToDate, 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center font-bold text-gray-900 text-sm">
                      {filteredData.reduce((sum, item) => sum + item.absencePaidInPeriod, 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center font-bold text-gray-900 text-sm">
                      {filteredData.reduce((sum, item) => sum + item.beginningPeriodBalance, 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center font-bold text-gray-900 text-sm">
                      {filteredData.reduce((sum, item) => sum + item.accruedInPeriod, 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center font-bold text-gray-900 text-sm">
                      {filteredData.reduce((sum, item) => sum + item.carryoverForfeitedInPeriod, 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center font-bold text-gray-900 text-sm">{totalBalance.toFixed(2)}</TableCell>
                    <TableCell className="text-center font-bold text-gray-900 text-sm">
                      {filteredData.reduce((sum, item) => sum + item.encashed, 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center font-bold text-gray-900 text-sm">{totalIncludingEvents.toFixed(2)}</TableCell>
                    <TableCell className="text-center text-gray-700 text-sm">-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
          </TabsContent>
          )}
        </Tabs>
      </div>

      {/* EmpFilter Popup */}
      <EmpFilter
        isOpen={isEmpFilterOpen}
        onClose={handleCloseEmpFilter}
        onEmployeeSelect={handleEmployeeSelect}
        preSelectedEmployeeId={empStatues ? undefined : undefined}
      />
    </div>
  )
}