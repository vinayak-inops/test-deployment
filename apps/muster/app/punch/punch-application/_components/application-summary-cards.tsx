"use client"

import React, { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, ListChecks } from "lucide-react"

interface SummaryCardsProps {
  data: Array<{ status?: string; workflowState?: string }>
  countsOverride?: {
    total: number
    approved: number
    rejected: number
    cancelled: number
    pending: number
  }
}

export default function ApplicationSummaryCards({ data, countsOverride }: SummaryCardsProps) {
  const counts = useMemo(() => {
    if (countsOverride) return countsOverride
    const norm = (s?: string) => (s || "").toString().toUpperCase()
    const total = data.length
    let approved = 0,
      rejected = 0,
      cancelled = 0,
      pending = 0

    for (const row of data) {
      const s = norm(row.status || row.workflowState)
      if (s === "APPROVED") approved++
      else if (s === "REJECTED") rejected++
      else if (s === "CANCELLED" || s === "CANCEL") cancelled++
      else pending++
    }

    return { total, approved, rejected, cancelled, pending }
  }, [data, countsOverride])

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


