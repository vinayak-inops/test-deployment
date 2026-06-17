"use client"

import React, { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, ListChecks } from "lucide-react"

interface SummaryCardsProps {
  data: Array<{ workflowState?: string }>
  countsOverride?: {
    total: number
    approved: number
    rejected: number
    cancelled: number
    pending: number
  }
}

export default function CompoffSummaryCards({ data, countsOverride }: SummaryCardsProps) {
  const counts = useMemo(() => {
    if (countsOverride) return countsOverride
    const norm = (s?: string) => (s || "").toString().toUpperCase()
    const total = data.length
    let approved = 0,
      rejected = 0,
      cancelled = 0,
      pending = 0

    for (const row of data) {
      const s = norm(row.workflowState)
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
  }: {
    title: string
    value: number
    icon: React.ReactNode
    className: string
    accent: string
  }) => (
    <Card className={`flex-1 border ${className} shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">{title}</div>
            <div className="text-2xl font-semibold text-gray-900">{value}</div>
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${accent}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 px-0">
      <Item
        title="Total Requests"
        value={counts.total}
        icon={<ListChecks className="h-5 w-5 text-gray-700" />}
        className="bg-white"
        accent="bg-gray-100"
      />
      <Item
        title="Approved"
        value={counts.approved}
        icon={<CheckCircle className="h-5 w-5 text-green-600" />}
        className="bg-green-50 border-green-100"
        accent="bg-green-100"
      />
      <Item
        title="Rejected"
        value={counts.rejected}
        icon={<XCircle className="h-5 w-5 text-red-600" />}
        className="bg-red-50 border-red-100"
        accent="bg-red-100"
      />
      <Item
        title="Cancelled"
        value={counts.cancelled}
        icon={<XCircle className="h-5 w-5 text-gray-700" />}
        className="bg-gray-50 border-gray-100"
        accent="bg-gray-200"
      />
      <Item
        title="Pending"
        value={counts.pending}
        icon={<Clock className="h-5 w-5 text-blue-600" />}
        className="bg-blue-50 border-blue-100"
        accent="bg-blue-100"
      />
    </div>
  )
}


