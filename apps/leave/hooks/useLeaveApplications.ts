import { useState } from 'react'

// Type definitions for the leave application data
interface Leave {
  date: string
  leaveCode: string
  duration: string
}

interface LeaveApplication {
  _id: string
  tenantCode: string
  workflowName: string
  uploadedBy: string
  createdOn: string
  employeeID: string
  fromDate: string
  toDate: string
  uploadTime: string
  organizationCode: string
  appliedDate: string
  workflowState: string
  commentToApprover: string
  reason: string
  leaves: Leave[]
  noOfDays: number
  stateEvent: string // Added stateEvent
}

interface UseLeaveApplicationsReturn {
  applicationsData: LeaveApplication[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  updateApplicationInState: (id: string, updates: Partial<LeaveApplication>) => void
  handleApplicationApprovalUpdate: (id: string, action: 'approve' | 'reject' | 'cancel', remarks?: string) => void
  handleApiResponse: (rawData: any) => void
  handleApiError: (error: any) => void
  updateApplicationsData: (rawData: any) => void
  setLoadingState: (loading: boolean) => void
  setErrorState: (error: string | null) => void
  refetch: () => void
}

export const useLeaveApplications = (): UseLeaveApplicationsReturn => {
  const [applicationsData, setApplicationsData] = useState<LeaveApplication[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Function to update a specific application in the local state
  const updateApplicationInState = (id: string, updates: Partial<LeaveApplication>) => {
    setApplicationsData(prevData => 
      prevData.map(app => 
        app._id === id ? { ...app, ...updates } : app
      )
    )
  }

  // Function to handle API response and transform data
  const handleApiResponse = (rawData: any) => {
    try {
      // Check if the response has the expected structure
      if (!rawData || typeof rawData !== 'object') {
        throw new Error('Invalid API response format')
      }

      // Handle different possible response structures
      let apiData: any[]
      
      // If the response is directly an array of leave applications
      if (Array.isArray(rawData)) {
        apiData = rawData
      }
      // If the response is wrapped in a data property (single object or array)
      else if (rawData.data) {
        if (Array.isArray(rawData.data)) {
          apiData = rawData.data
        } else {
          // If data is a single object, wrap it in an array
          apiData = [rawData.data]
        }
      }
      // If the response has applications property
      else if (rawData.applications && Array.isArray(rawData.applications)) {
        apiData = rawData.applications
      }
      // If none of the above, throw error
      else {
        throw new Error('API response does not contain expected leave application data')
      }

      // Normalize the data to match our interface based on the actual API structure
      const normalizedData: LeaveApplication[] = apiData.map((item: any) => {
        return {
          _id: item._id || item.id || '',
          tenantCode: item.tenantCode || item.tenant || '',
          workflowName: item.workflowName || item.workflow || 'Leave Application',
          uploadedBy: item.uploadedBy || item.createdBy || item.user || '',
          createdOn: item.createdOn || item.createdAt || item.dateCreated || '',
          employeeID: item.employeeID || item.employeeId || item.empId || item.employee || '',
          fromDate: item.fromDate || item.startDate || item.leaveStartDate || '',
          toDate: item.toDate || item.endDate || item.leaveEndDate || '',
          uploadTime: item.uploadTime || item.uploadedAt || item.createdAt || '',
          organizationCode: item.organizationCode || item.orgCode || item.organization || '',
          appliedDate: item.appliedDate || item.applicationDate || item.dateApplied || '',
          workflowState: item.workflowState || item.status || item.state || '',
          commentToApprover: item.approverComment || item.commentToApprover || item.comments || item.remarks || '',
          reason: item.remarks || item.reason || item.purpose || item.description || '',
          leaves: item.leaves || item.leaveDetails || item.dates || [],
          noOfDays: parseInt(item.noOfDays) || item.totalDays || item.days || item.duration || 0,
          stateEvent: item.stateEvent || '' // Added normalization for stateEvent
        }
      })

      setApplicationsData(normalizedData)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      console.error('Error processing applications data:', err)
      setError(err instanceof Error ? err.message : 'Failed to process applications data')
    }
  }

  // Function to handle API errors
  const handleApiError = (error: any) => {
    console.error('Error fetching applications data:', error)
    setError(error instanceof Error ? error.message : 'Failed to fetch applications data')
  }

  // Function to handle approval updates
  const handleApplicationApprovalUpdate = (id: string, action: 'approve' | 'reject' | 'cancel', remarks?: string) => {
    setApplicationsData(prevData => 
      prevData.map(app => {
        if (app._id === id) {
          let newState = app.workflowState
          let newStateEvent = app.stateEvent
          switch (action) {
            case 'approve':
              newState = 'APPROVED'
              newStateEvent = 'NEXT'
              break
            case 'reject':
              newState = 'REJECTED'
              newStateEvent = 'REJECT'
              break
            case 'cancel':
              newState = 'CANCELLED'
              newStateEvent = 'CANCEL'
              break
          }
          return {
            ...app,
            workflowState: newState,
            stateEvent: newStateEvent, // Update stateEvent
            commentToApprover: remarks || app.commentToApprover
          }
        }
        return app
      })
    )
  }

  return {
    applicationsData,
    loading,
    error,
    lastUpdated,
    updateApplicationInState,
    handleApplicationApprovalUpdate,
    handleApiResponse,
    handleApiError,
    updateApplicationsData: handleApiResponse,
    setLoadingState: setLoading,
    setErrorState: setError,
    refetch: () => {
      // This function can be used to trigger a refetch
      // For now, it just logs that a refetch was requested
      // In a real implementation, this would trigger the API call again
    }
  }
} 