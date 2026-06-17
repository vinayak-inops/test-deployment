"use client"

import React, { useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, ListChecks } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from '@/hooks/useGetTenantCode'

interface SummaryCardsProps {
  isPopupOpen?: boolean
  isFormOpen?: boolean
}

export default function ApplicationSummaryCards({ isPopupOpen, isFormOpen }: SummaryCardsProps) {
  const tenantCode = useGetTenantCode()

  // Base filter data for count APIs
  const baseFilterData = useMemo(() => [
    {
      field: "tenantCode",
      value: tenantCode,
      operator: "eq",
    }
  ], [tenantCode])

  // Count API for all applications
  const {
    data: allCount,
    refetch: allCountRefetch,
  } = useRequest<any>({
    url: 'editPunchApplication/count',
    method: 'POST',
    data: baseFilterData,
    onSuccess: (data: any) => {},
    onError: (error: any) => {
      console.error("Error fetching all count:", error);
    },
    dependencies: [tenantCode, isPopupOpen, isFormOpen]
  })

  // Count API for pending applications
  const {
    data: pendingCount,
    refetch: pendingCountRefetch,
  } = useRequest<any>({
    url: 'editPunchApplication/count',
    method: 'POST',
    data: [
      ...baseFilterData,
      {
        field: "workflowState",
        operator: "in",
        value: ["INITIATED", "PENDING", "VALIDATE", "NEW"]
      }
    ],
    onSuccess: (data: any) => {},
    onError: (error: any) => {
      console.error("Error fetching pending count:", error);
    },
    dependencies: [tenantCode, isPopupOpen, isFormOpen]
  })

  // Count API for approved applications
  const {
    data: approvedCount,
    refetch: approvedCountRefetch,
  } = useRequest<any>({
    url: 'editPunchApplication/count',
    method: 'POST',
    data: [
      ...baseFilterData,
      {
        field: "workflowState",
        operator: "eq",
        value: "APPROVED"
      }
    ],
    onSuccess: (data: any) => {},
    onError: (error: any) => {
      console.error("Error fetching approved count:", error);
    },
    dependencies: [tenantCode, isPopupOpen, isFormOpen]
  })

  // Count API for rejected applications
  const {
    data: rejectedCount,
    refetch: rejectedCountRefetch,
  } = useRequest<any>({
    url: 'editPunchApplication/count',
    method: 'POST',
    data: [
      ...baseFilterData,
      {
        field: "workflowState",
        operator: "eq",
        value: "REJECTED"
      }
    ],
    onSuccess: (data: any) => {},
    onError: (error: any) => {
      console.error("Error fetching rejected count:", error);
    },
    dependencies: [tenantCode, isPopupOpen, isFormOpen]
  })

  // Count API for cancelled applications
  const {
    data: cancelledCount,
    refetch: cancelledCountRefetch,
  } = useRequest<any>({
    url: 'editPunchApplication/count',
    method: 'POST',
    data: [
      ...baseFilterData,
      {
        field: "workflowState",
        operator: "in",
        value: ["CANCELLED", "CANCEL"]
      }
    ],
    onSuccess: (data: any) => {},
    onError: (error: any) => {
      console.error("Error fetching cancelled count:", error);
    },
    dependencies: [tenantCode, isPopupOpen, isFormOpen]
  })

  
  useEffect(() => {
    allCountRefetch()
    pendingCountRefetch()
    approvedCountRefetch()
    rejectedCountRefetch()
    cancelledCountRefetch()
  }, [tenantCode])

  const counts = useMemo(() => {
    return {
      total: allCount || 0,
      approved: approvedCount || 0,
      rejected: rejectedCount || 0,
      cancelled: cancelledCount || 0,
      pending: pendingCount || 0,
    }
  }, [allCount, approvedCount, rejectedCount, cancelledCount, pendingCount])

  const Item = ({
    title,
    value,
    icon,
    className,
    accent,
    isDark = false,
  }: {
    title: string
    value: number
    icon: React.ReactNode
    className: string
    accent: string
    isDark?: boolean
  }) => (
    <Card
      className={`flex-1 border ${className} shadow-sm hover:shadow-md transition-shadow duration-200`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{title}</div>
            <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${accent}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 px-0">
      <Item
        title="Total Applications"
        value={counts.total}
        icon={<ListChecks className="h-5 w-5 text-gray-700" />}
        className="bg-white border-gray-200"
        accent="bg-gray-100"
      />
      <Item
        title="Pending"
        value={counts.pending}
        icon={<Clock className="h-5 w-5 text-yellow-700" />}
        className="bg-yellow-50 border-yellow-200"
        accent="bg-yellow-100"
      />
      <Item
        title="Approve"
        value={counts.approved}
        icon={<CheckCircle className="h-5 w-5 text-blue-600" />}
        className="bg-blue-50 border-blue-200"
        accent="bg-blue-100"
      />
      <Item
        title="Cancel"
        value={counts.cancelled}
        icon={<XCircle className="h-5 w-5 text-red-600" />}
        className="bg-red-50 border-red-200"
        accent="bg-red-100"
      />
      <Item
        title="Reject"
        value={counts.rejected}
        icon={<XCircle className="h-5 w-5 text-red-700" />}
        className="bg-red-100 border-red-200"
        accent="bg-red-300"
      />
    </div>
  )
}