"use client"

import { ArrowLeft, Calendar, Download, Filter, Search, User } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { Badge } from "@repo/ui/components/ui/badge"
import { useEffect, useState, useMemo } from "react"
import { useLeaveBalances } from "../../../hooks/useLeaveBalances"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import EmpFilter from "./emp-filter"
import { useAdminRole } from '@inops/store/src/hooks/useAdminRole'
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

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

export function TimeOffBalancePage({ onBack }: TimeOffBalancePageProps) {
  const [balanceData, setBalanceData] = useState<TransformedBalanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [employeeID, setEmployeeID] = useState<string>("")
  const [empStatues, setEmpStatues] = useState(false)
  const [isClient, setIsClient] = useState(false);
  const [allowedServices, setAllowedServices] = useState<any[]>([]);
  const [leaveService, setleaveService] = useState<any>(null);
  const  tenantCode  = useGetTenantCode();

  const contractorEmployee = "leaveManagement"

  // If leave not allowed, softly redirect to launchdesk
  const { adminRole, adminUser, setAdminRoleData, setAdminUserData } = useAdminRole();

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

  // Load allowed services from Redux only
  useEffect(() => {
    setIsClient(true);

    if (adminRole?.screenPermissions) {
      setAllowedServices(adminRole.screenPermissions);
    } else {
      setAllowedServices([]);
    }
  }, [adminRole]);

  // If leave not allowed, softly redirect to launchdesk
  useEffect(() => {
    if (!isClient) return;

    const leave = allowedServices.find((service: any) => service.serviceName === 'leave');
    setleaveService(leave);
    if (!leave) {
      // router.replace('/launchdesk');
    }
  }, [isClient, allowedServices]);

  useEffect(() => {
    const empStatues = leaveService?.screens.find((screen: any) => screen.screenName === `${contractorEmployee}`)?.permissions[`empFilterTimeOffBalance`];
    
    setEmpStatues(empStatues)
    
    // If empStatues is true, automatically open the EmpFilter popup
    if (empStatues) {
      setIsEmpFilterOpen(true)
    }
    // If empStatues is undefined, automatically set the employee ID from storedRoleInfo
    else if (!empStatues && storedRoleInfo?.employeeId) {
      setSelectedEmployeeId(storedRoleInfo.employeeId)
    }
  }, [contractorEmployee, leaveService, storedRoleInfo])

  // EmpFilter popup state
  const [isEmpFilterOpen, setIsEmpFilterOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")


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

  // Update loading state based on API call
  useEffect(() => {
    setLoadingState(isLoadingLeaveBalance)
  }, [isLoadingLeaveBalance])

  // Transform API data to component format
  const transformApiData = (apiData: ApiResponse): TransformedBalanceData[] => {
    return apiData.balances.map((balance, index) => ({
      absencePlan: balance.leaveTitle,
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
    setIsEmpFilterOpen(false)
  }

  // Handle opening EmpFilter popup
  const handleOpenEmpFilter = () => {
    setIsEmpFilterOpen(true)
  }

  // Handle closing EmpFilter popup
  const handleCloseEmpFilter = () => {
    setIsEmpFilterOpen(false)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6" style={{ width: '1200px', margin: '0 auto' }}>
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
                
                {selectedEmployeeId && (
                  <span className="text-blue-600 ml-2 font-medium">
                    - Employee ID: {selectedEmployeeId}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {
              empStatues && (
                <Button 
                  variant="outline" 
                  className="hover:bg-gray-50"
                  onClick={handleOpenEmpFilter}
                >
                  <User className="h-4 w-4 mr-2" />
                  Filter by Employee
                </Button>
              )
            }
            {empStatues && (
              <Button 
                variant="outline" 
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                onClick={() => setSelectedEmployeeId("")}
              >
                Clear Filter
              </Button>
            )}
           {
            empStatues && (
              <Button variant="outline" className="hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            )
           }
            {
              empStatues && (
                <Button variant="outline" className="hover:bg-gray-50">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )
            }
          </div>
        </div>

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
                    <TableHead className="text-gray-800 w-[200px] text-sm tracking-wide">Leave Title</TableHead>
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
