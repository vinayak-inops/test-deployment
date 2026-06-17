"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table'
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'

interface TrainingDetail {
  trainingCode: string
  trainingName?: string
  trainingDescrition?: string
  startDate?: string
  endDate?: string
  validTill?: string
  notifyPriorDays?: number
  blockingEnabled?: boolean
  notificationEnabled?: boolean
}

interface CompletedTrainingRow {
  code: string
  details?: TrainingDetail
}

interface CompletedTrainingsTableProps {
  rows: CompletedTrainingRow[]
  isReadOnly: boolean
  expandedDescriptions: Record<string, boolean>
  onToggleReadMore: (key: string, trainingCode: string, isExpanded: boolean) => void
  onDeleteClick: (trainingCode: string) => void
  formatDate: (date?: string) => string
  tenantCode: string | null
  employeeCategoryCode: string | null
}

export default function CompletedTrainingsTable({
  rows,
  isReadOnly,
  expandedDescriptions,
  onToggleReadMore,
  onDeleteClick,
  formatDate,
  tenantCode,
  employeeCategoryCode,
}: CompletedTrainingsTableProps) {
  // State to track which training codes need full details fetched
  const [trainingCodesToFetch, setTrainingCodesToFetch] = useState<string[]>([])
  const [fullTrainingDetails, setFullTrainingDetails] = useState<Map<string, TrainingDetail>>(new Map())

  // Fetch full training details from employee_category_training_details using aggregate with IN operator
  const fullTrainingDetailsRequestData = useMemo(() => {
    if (!tenantCode || trainingCodesToFetch.length === 0) return null
    const requestData: any = {
      criteriaRequests: [
        {
          field: "tenantCode",
          operator: "is",
          value: tenantCode,
        },
      ],
    }
    // Add category filter if available
    if (employeeCategoryCode) {
      requestData.criteriaRequests.push({
        field: "employeeCategoryCode",
        operator: "is",
        value: employeeCategoryCode,
      })
    }
    // Add arrayFilter to extract traninings array with IN filter for training codes
    requestData.arrayFilter = {
      arrayField: "traninings",
      filterCriteria: [
        {
          field: "trainingCode",
          operator: "in",
          value: trainingCodesToFetch,
        },
      ],
    }
    return requestData
  }, [tenantCode, employeeCategoryCode, trainingCodesToFetch])

  const { refetch: refetchFullTrainingDetails } = useRequest<any[]>({
    url: fullTrainingDetailsRequestData ? "employee_category_training_details/aggregate" : "",
    method: "POST",
    data: fullTrainingDetailsRequestData || {},
    dependencies: [], // manual refetch
    onSuccess: (data: any) => {
      if (Array.isArray(data)) {
        const detailsMap = new Map<string, TrainingDetail>()
        // Handle aggregate response structure
        data.forEach((item: any) => {
          // Check if item has traninings array (nested structure)
          if (item.traninings && Array.isArray(item.traninings)) {
            item.traninings.forEach((training: any) => {
              if (training.trainingCode) {
                // Only add if not already in map (avoid duplicates)
                if (!detailsMap.has(training.trainingCode)) {
                  detailsMap.set(training.trainingCode, {
                    trainingCode: training.trainingCode,
                    trainingName: training.trainingName || "",
                    trainingDescrition: training.trainingDescrition || "",
                    startDate: training.startDate || "",
                    endDate: training.endDate || "",
                    validTill: training.validTill || "",
                    notifyPriorDays: training.notifyPriorDays,
                    blockingEnabled: training.blockingEnabled,
                    notificationEnabled: training.notificationEnabled,
                  })
                }
              }
            })
          } else if (item.trainingCode) {
            // Handle flat structure where item itself is a training object
            if (!detailsMap.has(item.trainingCode)) {
              detailsMap.set(item.trainingCode, {
                trainingCode: item.trainingCode,
                trainingName: item.trainingName || "",
                trainingDescrition: item.trainingDescrition || "",
                startDate: item.startDate || "",
                endDate: item.endDate || "",
                validTill: item.validTill || "",
                notifyPriorDays: item.notifyPriorDays,
                blockingEnabled: item.blockingEnabled,
                notificationEnabled: item.notificationEnabled,
              })
            }
          }
        })
        setFullTrainingDetails((prev) => {
          const updated = new Map(prev)
          detailsMap.forEach((value, key) => updated.set(key, value))
          return updated
        })
      }
    },
    onError: (error: any) => {
      console.error("Error fetching full training details:", error)
    },
  })

  // Trigger fetch when training codes are added
  useEffect(() => {
    if (trainingCodesToFetch.length > 0 && fullTrainingDetailsRequestData && tenantCode) {
      void refetchFullTrainingDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingCodesToFetch, fullTrainingDetailsRequestData])

  // Fetch training details for completed trainings on load
  useEffect(() => {
    const trainingCodes = rows.map((r) => r.code)
    if (trainingCodes.length > 0 && tenantCode) {
      // Get training codes that don't have details yet
      const codesToFetch = trainingCodes.filter((code) => {
        return !fullTrainingDetails.has(code)
      })

      if (codesToFetch.length > 0) {
        setTrainingCodesToFetch((prev) => {
          const newCodes = codesToFetch.filter((code) => !prev.includes(code))
          return newCodes.length > 0 ? [...prev, ...newCodes] : prev
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, tenantCode, employeeCategoryCode])

  // Enhance rows with fetched details
  const enhancedRows = useMemo(() => {
    return rows.map((row) => {
      // Check fullTrainingDetails (from aggregate fetch)
      const fullDetail = fullTrainingDetails.get(row.code)
      if (fullDetail) {
        return { ...row, details: fullDetail }
      }
      return row
    })
  }, [rows, fullTrainingDetails])

  // Handle read more with internal fetch logic
  const handleToggleReadMore = (key: string, trainingCode: string, isExpanded: boolean) => {
    // If expanding and full details not loaded, fetch them
    if (!isExpanded && trainingCode && !fullTrainingDetails.has(trainingCode)) {
      setTrainingCodesToFetch((prev) => {
        if (!prev.includes(trainingCode)) {
          return [...prev, trainingCode]
        }
        return prev
      })
    }
    onToggleReadMore(key, trainingCode, isExpanded)
  }

  return (
    <div className="border rounded-lg bg-slate-50/40 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
      <Table className="min-w-[1400px]">
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
              Training Code
            </TableHead>
            <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
              Training Name
            </TableHead>
            <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap min-w-[200px]">
              Description
            </TableHead>
            <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
              Start Date
            </TableHead>
            <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
              End Date
            </TableHead>
            <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
              Valid Till
            </TableHead>
            {!isReadOnly && (
              <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right whitespace-nowrap sticky right-0 bg-slate-50 z-10">
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {enhancedRows.map((item, index) => {
            const isEven = index % 2 === 1
            const trainingCode = item.code
            const details = item.details
            const key = String(trainingCode || index)
            const raw = (details?.trainingDescrition ?? "").toString().trim()

            if (!raw) {
              return (
                <TableRow
                  key={trainingCode}
                  className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                >
                  <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900 whitespace-nowrap">
                    {trainingCode}
                  </TableCell>
                  <TableCell className="py-1.5 text-sm text-gray-900 whitespace-nowrap">
                    {details?.trainingName || "-"}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-gray-700">-</TableCell>
                  <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                    {formatDate(details?.startDate)}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                    {formatDate(details?.endDate)}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                    {formatDate(details?.validTill)}
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell className={`py-1.5 pr-4 text-right sticky right-0 z-10 ${isEven ? 'bg-slate-50/60' : 'bg-white'}`}>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                          onClick={() => onDeleteClick(trainingCode)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )
            }

            const maxLen = 90
            const isLong = raw.length > maxLen
            const isExpanded = !!expandedDescriptions[key]
            const shown = isLong && !isExpanded ? `${raw.slice(0, maxLen)}…` : raw

            return (
              <TableRow
                key={trainingCode}
                className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
              >
                <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900 whitespace-nowrap">
                  {trainingCode}
                </TableCell>
                <TableCell className="py-1.5 text-sm text-gray-900 whitespace-nowrap">
                  {details?.trainingName || "-"}
                </TableCell>
                <TableCell className="py-1.5 text-xs text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="break-words">{shown}</span>
                    {isLong && (
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleToggleReadMore(key, trainingCode, isExpanded)
                        }}
                      >
                        {isExpanded ? "Read less" : "Read more"}
                      </button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                  {formatDate(details?.startDate)}
                </TableCell>
                <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                  {formatDate(details?.endDate)}
                </TableCell>
                <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                  {formatDate(details?.validTill)}
                </TableCell>
                {!isReadOnly && (
                  <TableCell className={`py-1.5 pr-4 text-right sticky right-0 z-10 ${isEven ? 'bg-slate-50/60' : 'bg-white'}`}>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                        onClick={() => onDeleteClick(trainingCode)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export type { TrainingDetail, CompletedTrainingRow }

