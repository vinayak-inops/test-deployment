import { useState } from 'react'

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

// Transformed data type for dashboard display
interface DashboardBalanceData {
  type: string
  balance: number
  used: number
  total: number
  color: string
  leaveCode: string
  unitOfTime: string
  asOfPeriod: string
}

export const useLeaveBalances = () => {
  const [balanceData, setBalanceData] = useState<DashboardBalanceData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Color mapping for different leave types
  const getColorForLeaveType = (leaveType: string): string => {
    // Normalize the leave type string for better matching
    const normalizedType = leaveType.toLowerCase().trim()
    
    // More comprehensive color mapping with multiple variations
    const colorMap: { [key: string]: string } = {
      // Earned Leave variations
      'earned leave': 'bg-blue-500',
      'earned': 'bg-blue-500',
      'el': 'bg-blue-500',
      
      // Sick Leave variations
      'sick leave': 'bg-green-500',
      'sick': 'bg-green-500',
      'sl': 'bg-green-500',
      'medical leave': 'bg-green-500',
      
      // Casual Leave variations
      'casual leave': 'bg-purple-500',
      'casual': 'bg-purple-500',
      'cl': 'bg-purple-500',
      
      // Leave without Pay variations
      'leave without pay': 'bg-orange-500',
      'lwp': 'bg-orange-500',
      'unpaid leave': 'bg-orange-500',
      
      // Other leave types
      'community service time day': 'bg-indigo-500',
      'compensatory off': 'bg-pink-500',
      'maternity leave': 'bg-rose-500',
      'paternity leave': 'bg-cyan-500',
      'annual leave': 'bg-blue-500',
      'vacation': 'bg-blue-500',
      'personal leave': 'bg-purple-500',
      'bereavement leave': 'bg-gray-500',
      'jury duty': 'bg-gray-500',
    }
    
    // Try exact match first
    if (colorMap[normalizedType]) {
      return colorMap[normalizedType]
    }
    
    // Try partial matches
    for (const [key, color] of Object.entries(colorMap)) {
      if (normalizedType.includes(key) || key.includes(normalizedType)) {
        return color
      }
    }
    
    // Default color based on common patterns
    if (normalizedType.includes('sick') || normalizedType.includes('medical')) {
      return 'bg-green-500'
    }
    if (normalizedType.includes('casual') || normalizedType.includes('personal')) {
      return 'bg-purple-500'
    }
    if (normalizedType.includes('earned') || normalizedType.includes('annual') || normalizedType.includes('vacation')) {
      return 'bg-blue-500'
    }
    if (normalizedType.includes('unpaid') || normalizedType.includes('without pay')) {
      return 'bg-orange-500'
    }
    
    // Fallback to default gray
    return 'bg-gray-500'
  }

  // Transform API data to dashboard format
  const transformApiData = (apiData: ApiResponse): DashboardBalanceData[] => {
    return apiData.balances.map((balance) => {
      const total = balance.beginningYearBalance + balance.carryoverBalance + balance.accruedInPeriod
      const used = balance.absencePaidYearToDate // Only count actual used leave, not encashed
      const available = balance.balance
      return {
        type: balance.leaveTitle,
        balance: available,
        used: used,
        total: total,
        color: getColorForLeaveType(balance.leaveTitle),
        leaveCode: balance.leaveCode,
        unitOfTime: balance.unitOfTime,
        asOfPeriod: balance.asOfPeriod,
      }
    })
  }

  // Function to handle API response and transform data
  const handleApiResponse = (rawData: any) => {
    try {
      // Handle different possible response structures
      let apiData: ApiResponse
      
      if (rawData.balances && Array.isArray(rawData.balances) && rawData.employeeID) {
        apiData = rawData as ApiResponse
      } else if (rawData.data && rawData.data.balances && Array.isArray(rawData.data.balances)) {
        apiData = rawData.data as ApiResponse
      } else if (Array.isArray(rawData)) {
        const rawBalances = rawData[0]?.balances || []
        
        apiData = {
          balances: rawBalances.map((item: any) => ({
            leaveTitle: item.leaveTitle || item.leaveCode,
            leaveCode: item.leaveCode,
            unitOfTime: item.unitOfTime || "Days",
            beginningYearBalance: item.beginningYearBalance || 0,
            carryoverBalance: item.carryoverBalance || 0,
            absencePaidYearToDate: item.absencePaidYearToDate || 0,
            absencePaidInPeriod: item.absencePaidInPeriod || 0,
            beginningPeriodBalance: item.beginningPeriodBalance || 0,
            accruedInPeriod: item.accruedInPeriod || 0,
            carryoverForfeitedInPeriod: item.carryoverForfeitedInPeriod || 0,
            balance: item.balance || 0,
            encashed: item.encashed || 0,
            includeEventsAwaitingApproval: item.includeEventsAwaitingApproval || 0,
            asOfPeriod: item.asOfPeriod || new Date().toISOString().split('T')[0]
          })),
          employeeID: rawData[0]?.employeeID || "EMP001"
        }
      } else {
        console.error('Unexpected API response structure:', rawData)
        throw new Error('API response does not contain expected balance data')
      }

      const transformedData = transformApiData(apiData)
      setBalanceData(transformedData)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      console.error('Error processing balance data:', err)
      setError(err instanceof Error ? err.message : 'Failed to process balance data')
      
      // Fallback to mock data for development
      const mockData: DashboardBalanceData[] = [
        { type: "Earned Leave", balance: 15.5, used: 4.5, total: 20, color: "bg-blue-500", leaveCode: "EL", unitOfTime: "Days", asOfPeriod: "2024-06-01" },
        { type: "Sick Leave", balance: 8, used: 2, total: 10, color: "bg-green-500", leaveCode: "SL", unitOfTime: "Days", asOfPeriod: "2024-06-01" },
        { type: "Casual Leave", balance: 3, used: 2, total: 5, color: "bg-purple-500", leaveCode: "CL", unitOfTime: "Days", asOfPeriod: "2024-06-01" },
        { type: "Leave without Pay", balance: 12, used: 4, total: 16, color: "bg-orange-500", leaveCode: "LWP", unitOfTime: "Days", asOfPeriod: "2024-06-01" },
      ]
      setBalanceData(mockData)
    }
  }

  // Function to handle API errors
  const handleApiError = (error: any) => {
    console.error('Error fetching balance data:', error)
    setError(error instanceof Error ? error.message : 'Failed to fetch balance data')
    
    // Fallback to mock data for development
    const mockData: DashboardBalanceData[] = [
      { type: "Earned Leave", balance: 15.5, used: 4.5, total: 20, color: "bg-blue-500", leaveCode: "EL", unitOfTime: "Days", asOfPeriod: "2024-06-01" },
      { type: "Sick Leave", balance: 8, used: 2, total: 10, color: "bg-green-500", leaveCode: "SL", unitOfTime: "Days", asOfPeriod: "2024-06-01" },
      { type: "Casual Leave", balance: 3, used: 2, total: 5, color: "bg-purple-500", leaveCode: "CL", unitOfTime: "Days", asOfPeriod: "2024-06-01" },
      { type: "Leave without Pay", balance: 12, used: 4, total: 16, color: "bg-orange-500", leaveCode: "LWP", unitOfTime: "Days", asOfPeriod: "2024-06-01" },
    ]
    setBalanceData(mockData)
  }

  return {
    balanceData,
    loading,
    error,
    lastUpdated,
    handleApiResponse,
    handleApiError,
    updateBalanceData: handleApiResponse,
    setErrorState: setError,
    setLoadingState: setLoading,
    refetch: () => {
      // This function can be used to trigger a refetch
      // For now, it just logs that a refetch was requested
      // In a real implementation, this would trigger the API call again
    }
  }
} 