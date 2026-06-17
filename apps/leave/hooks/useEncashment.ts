import { useState, useEffect } from 'react'

export interface EncashmentApplication {
    _id: string
    employeeID: string
    leaveCode: string
    balance: number
    remarks: string
    workflowState: string
    appliedDate: string
    approvedBy?: string
    approvedOn?: string
    approvalComment?: string
    tenantCode: string
    workflowName: string
    stateEvent: string
    uploadedBy: string
    createdOn: string
    uploadTime: string
    organizationCode: string
}

interface UseEncashmentResult {
    encashmentData: EncashmentApplication[]
    loading: boolean
    error: string | null
    lastUpdated: Date | null
    refetch: () => Promise<void>
    updateEncashmentInState: (id: string, updates: Partial<EncashmentApplication>) => void
    handleEncashmentApprovalUpdate: (id: string, action: 'approve' | 'reject' | 'cancel', remarks?: string) => void
}

export const useEncashment = (encashmentResponse?: any): UseEncashmentResult => {
    const [encashmentData, setEncashmentData] = useState<EncashmentApplication[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    // Function to update a specific encashment application in the local state
    const updateEncashmentInState = (id: string, updates: Partial<EncashmentApplication>) => {
        setEncashmentData(prevData => 
            prevData.map(app => 
                app._id === id ? { ...app, ...updates } : app
            )
        )
    }

    // Process the encashment response data
    const processEncashmentData = (responseData: any) => {
        try {
            // Handle different response formats
            let normalizedData: EncashmentApplication[] = []
            if (Array.isArray(responseData)) {
                normalizedData = responseData
            } else if (responseData.data && Array.isArray(responseData.data)) {
                normalizedData = responseData.data
            } else if (responseData.leaveEncashmentApplication && Array.isArray(responseData.leaveEncashmentApplication)) {
                normalizedData = responseData.leaveEncashmentApplication
            } else {
                console.warn("Unexpected API response format:", responseData)
                normalizedData = []
            }
            
            setEncashmentData(normalizedData)
            setLastUpdated(new Date())
            
            // Find and log the latest item
            if (normalizedData.length > 0) {
                const latestItem = normalizedData.reduce((latest: EncashmentApplication, current: EncashmentApplication) =>
                    new Date(current.createdOn) > new Date(latest.createdOn) ? current : latest
                );
            }
        } catch (err) {
            console.error('Error processing encashment data:', err)
            setError(err instanceof Error ? err.message : 'Failed to process encashment data')
            setEncashmentData([])
            setLastUpdated(new Date())
        }
    }

    // Function to handle approval updates
    const handleEncashmentApprovalUpdate = (id: string, action: 'approve' | 'reject' | 'cancel', remarks?: string) => {
        setEncashmentData(prevData => 
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
                        approvalComment: remarks || app.approvalComment
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

    // Process encashment data when response changes
    useEffect(() => {
        if (encashmentResponse) {
            setLoading(false)
            setError(null)
            processEncashmentData(encashmentResponse)
        }
    }, [encashmentResponse])

    return {
        encashmentData,
        loading,
        error,
        lastUpdated,
        refetch,
        updateEncashmentInState,
        handleEncashmentApprovalUpdate
    }
} 