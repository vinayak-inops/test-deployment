import { useState, useEffect } from 'react'

// Type definitions for the leave of absence application data
export interface LeaveOfAbsenceApplication {
  _id: string
  tenantCode: string
  workflowName: string
  uploadedBy: string
  createdOn: string
  employeeID: string
  leaveCode?: string
  leaveTitle?: string
  typeOfAbsence: string
  lastDayOfWork: string
  firstDayOfAbsence: string
  estimatedLastDayOfAbsence: string
  actualReturnDate?: string
  uploadTime: string
  organizationCode: string
  appliedDate: string
  workflowState: string
  commentToApprover: string
  reason: string
  childsBirthDate?: string
  adoptionPlacementDate?: string
  totalDays: number
}

interface UseLeaveOfAbsenceReturn {
  absenceData: LeaveOfAbsenceApplication[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refetch: () => Promise<void>
  updateAbsenceInState: (id: string, updates: Partial<LeaveOfAbsenceApplication>) => void
  handleAbsenceApprovalUpdate: (id: string, action: 'approve' | 'reject' | 'cancel', remarks?: string) => void
}

export const useLeaveOfAbsence = (absenceResponse?: any): UseLeaveOfAbsenceReturn => {
  const [absenceData, setAbsenceData] = useState<LeaveOfAbsenceApplication[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Function to update a specific absence application in the local state
  const updateAbsenceInState = (id: string, updates: Partial<LeaveOfAbsenceApplication>) => {
    setAbsenceData(prevData => 
      prevData.map(app => 
        app._id === id ? { ...app, ...updates } : app
      )
    )
  }

  // Process the absence response data
  const processAbsenceData = (responseData: any) => {
    try {
      // Check if the response has the expected structure
      if (!responseData || typeof responseData !== 'object') {
        throw new Error('Invalid API response format')
      }

      // Handle different possible response structures
      let apiData: any[]
      
      // If the response is directly an array of leave of absence applications
      if (Array.isArray(responseData)) {
        apiData = responseData
      }
      // If the response is wrapped in a data property (single object or array)
      else if (responseData.data) {
        if (Array.isArray(responseData.data)) {
          apiData = responseData.data
        } else {
          // If data is a single object, wrap it in an array
          apiData = [responseData.data]
        }
      }
      // If the response has applications property
      else if (responseData.applications && Array.isArray(responseData.applications)) {
        apiData = responseData.applications
      }
      // If none of the above, throw error
      else {
        throw new Error('API response does not contain expected leave of absence application data')
      }

      // Normalize the data to match our interface based on the actual API structure
      const normalizedData: LeaveOfAbsenceApplication[] = apiData.map((item: any) => {
        return {
          _id: item._id || item.id || '',
          tenantCode: item.tenantCode || item.tenant || '',
          workflowName: item.workflowName || item.workflow || 'specialLeave Application',
          uploadedBy: item.uploadedBy || item.createdBy || item.user || '',
          createdOn: item.createdOn || item.createdAt || item.dateCreated || '',
          employeeID: item.employeeID || item.employeeId || item.empId || item.employee || '',
          leaveCode: item.leaveCode || item.code || '',
          leaveTitle: item.leaveTitle || item.typeOfAbsence || item.absenceType || item.leaveType || item.type || '',
          typeOfAbsence: item.leaveTitle || item.typeOfAbsence || item.absenceType || item.leaveType || item.type || '',
          lastDayOfWork: item.lastDayOfWork || item.lastWorkingDay || item.lastWorkDay || '',
          firstDayOfAbsence: item.fromDate || item.firstDayOfAbsence || item.absenceStartDate || item.startDate || '',
          estimatedLastDayOfAbsence: item.toDate || item.estimatedLastDayOfAbsence || item.absenceEndDate || item.endDate || '',
          actualReturnDate: item.actualReturnDate || item.returnDate || item.actualEndDate || undefined,
          uploadTime: item.uploadTime || item.uploadedAt || item.createdAt || '',
          organizationCode: item.organizationCode || item.orgCode || item.organization || '',
          appliedDate: item.appliedDate || item.applicationDate || item.dateApplied || '',
          workflowState: item.workflowState || item.status || item.state || '',
          commentToApprover: item.approverComment || item.commentToApprover || item.comments || item.remarks || '',
          reason: item.remarks || item.reason || item.purpose || item.description || '',
          childsBirthDate: item.DOBOfChild || item.childsBirthDate || item.childBirthDate || item.birthDate || undefined,
          adoptionPlacementDate: item.AdoptionPlacementDate || item.adoptionPlacementDate || item.adoptionDate || undefined,
          totalDays: parseInt(item.noOfDays) || item.totalDays || item.days || item.duration || 0
        }
      })

      setAbsenceData(normalizedData)
      setLastUpdated(new Date())
      
      // Find and log the latest item
      if (normalizedData.length > 0) {
        const latestItem = normalizedData.reduce((latest, current) =>
          new Date(current.createdOn) > new Date(latest.createdOn) ? current : latest
        );
      }
    } catch (err) {
      console.error('Error processing absence data:', err)
      setError(err instanceof Error ? err.message : 'Failed to process absence data')
      setAbsenceData([])
      setLastUpdated(new Date())
    }
  }

  // Function to handle approval updates
  const handleAbsenceApprovalUpdate = (id: string, action: 'approve' | 'reject' | 'cancel', remarks?: string) => {
    setAbsenceData(prevData => 
      prevData.map(app => {
        if (app._id === id) {
          let newState = app.workflowState
          switch (action) {
            case 'approve':
              newState = 'APPROVED'
              break
            case 'reject':
              newState = 'REJECTED'
              break
            case 'cancel':
              newState = 'CANCELLED'
              break
          }
          return {
            ...app,
            // workflowState: newState,
            commentToApprover: remarks || app.commentToApprover
          }
        }
        return app
      })
    )
  }

  // Refetch function
  const refetch = async () => {
    // This function is kept for compatibility but doesn't make API calls
    // The parent component should handle refetching
  }

  // Process absence data when response changes
  useEffect(() => {
    if (absenceResponse) {
      setLoading(false)
      setError(null)
      processAbsenceData(absenceResponse)
    }
  }, [absenceResponse])

  return {
    absenceData,
    loading,
    error,
    lastUpdated,
    refetch,
    updateAbsenceInState,
    handleAbsenceApprovalUpdate
  }
} 