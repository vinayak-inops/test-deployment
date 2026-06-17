"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, User, FileText, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import AutoStatusUpdate from '../../../components/auto-stutues-update'

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
  leaves: Leave[]
  uploadTime: string
  organizationCode: string
  appliedDate: string
  workflowState: string
  remarks: string
}

interface LeaveStatusUpdateProps {
  requestId: string
  setOpen: (open: boolean) => void
  leaveApplication?: LeaveApplication | null
}

interface StatusUpdate {
  id: string
  status: string
  updatedBy: string
  updatedAt: Date
  comment?: string
  action: 'Validated' | 'approved' | 'rejected' | 'cancelled'
}

const LeaveStatusUpdate: React.FC<LeaveStatusUpdateProps> = ({ requestId, setOpen, leaveApplication }) => {
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([])
  const [loading, setLoading] = useState(true)


  const getLeaveSummary = (leaves: Leave[] | undefined) => {
    if (!leaves || leaves.length === 0) return 'No leaves'

    const leaveTypes = leaves.reduce((acc, leave) => {
      const code = leave.leaveCode || 'Unknown'
      acc[code] = (acc[code] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(leaveTypes)
      .map(([code, count]) => `${count} ${code}`)
      .join(', ')
  }

 

  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-[400px]">
        <AutoStatusUpdate fileId={requestId} setOpen={setOpen} extension="pdf" reportData={leaveApplication} />
      </div>
    </div>
  )
}

export default LeaveStatusUpdate 