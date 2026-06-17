"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table'
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'
import type { TrainingDetail } from './completed-trainings-table'

interface AvailableTrainingsTableProps {
  onAddTraining: (trainingCode: string) => void
  formatDate: (date?: string) => string
  tenantCode: string | null
  employeeCategoryCode: string | null
  searchTerm: string
  selectedTrainingCodes: string[]
}

export default function AvailableTrainingsTable({
  onAddTraining,
  formatDate,
  tenantCode,
  employeeCategoryCode,
  searchTerm,
  selectedTrainingCodes,
}: AvailableTrainingsTableProps) {
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})
  const [trainingCodesToFetch, setTrainingCodesToFetch] = useState<string[]>([])
  const [fullTrainingDetails, setFullTrainingDetails] = useState<Map<string, TrainingDetail>>(new Map())
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchTerm])

  // Fetch available trainings from employee_category_training_details using aggregate endpoint
  const trainingRequestData = useMemo(() => {
    if (!tenantCode) return null
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
    // Add arrayFilter to extract traninings array
    requestData.arrayFilter = {
      arrayField: "traninings",
      filterCriteria: [],
    }
    return requestData
  }, [tenantCode, employeeCategoryCode])

  const { data: trainingData, loading: loadingTrainings, refetch: refetchTrainings } = useRequest<any[]>({
    url: trainingRequestData ? "employee_category_training_details/aggregate" : "",
    method: "POST",
    data: trainingRequestData || [],
    dependencies: [], // manual refetch pattern
    onSuccess: () => {
      // Data processing handled in useMemo
    },
    onError: (error: any) => {
      if (tenantCode) {
        console.error("Error fetching training details:", error)
      }
    },
  })

  // Initial refetch when tenantCode or category code changes
  useEffect(() => {
    if (!tenantCode) return
    if (trainingRequestData && employeeCategoryCode) {
      refetchTrainings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode, employeeCategoryCode])

  // Extract all trainings with full details from the fetched data
  const availableTrainings = useMemo(() => {
    if (!trainingData || !Array.isArray(trainingData)) return []
    const trainingsMap = new Map<string, TrainingDetail>()

    // Handle aggregate response structure
    // Response is an array of employee_category_training_details objects, each with a traninings array
    trainingData.forEach((item: any) => {
      // Check if item has traninings array (standard structure from aggregate endpoint)
      if (item.traninings && Array.isArray(item.traninings)) {
        item.traninings.forEach((t: any) => {
          if (t.trainingCode) {
            // Only add if not already in map (avoid duplicates)
            if (!trainingsMap.has(t.trainingCode)) {
              trainingsMap.set(t.trainingCode, {
                trainingCode: t.trainingCode,
                trainingName: t.trainingName || "",
                trainingDescrition: t.trainingDescrition || "",
                startDate: t.startDate || "",
                endDate: t.endDate || "",
                validTill: t.validTill || "",
                notifyPriorDays: t.notifyPriorDays,
                blockingEnabled: t.blockingEnabled,
                notificationEnabled: t.notificationEnabled,
              })
            }
          }
        })
      }
    })

    return Array.from(trainingsMap.values()).sort((a, b) =>
      (a.trainingCode || "").localeCompare(b.trainingCode || "")
    )
  }, [trainingData])

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
        // Handle aggregate response structure - data is an array of employee_category_training_details objects
        data.forEach((item: any) => {
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
    if (trainingCodesToFetch.length > 0 && fullTrainingDetailsRequestData) {
      void refetchFullTrainingDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingCodesToFetch])

  // Filter trainings based on search and exclude selected ones
  const filteredTrainings = useMemo(() => {
    let filtered = availableTrainings.filter((training) => !selectedTrainingCodes.includes(training.trainingCode))
    
    const query = debouncedSearchTerm.toLowerCase().trim()
    if (query) {
      filtered = filtered.filter((training: TrainingDetail) =>
        (training.trainingCode || "").toLowerCase().includes(query) ||
        (training.trainingName || "").toLowerCase().includes(query)
      )
    } else {
      // Show first 50 if no search
      filtered = filtered.slice(0, 50)
    }
    
    return filtered
  }, [availableTrainings, debouncedSearchTerm, selectedTrainingCodes])

  // Handle read more with internal fetch logic
  const handleToggleReadMore = (key: string, trainingCode: string, isExpanded: boolean) => {
    // If expanding and full details not loaded, fetch them
    if (!isExpanded && trainingCode && !fullTrainingDetails.has(trainingCode) && !availableTrainings.some((t) => t.trainingCode === trainingCode)) {
      setTrainingCodesToFetch((prev) => {
        if (!prev.includes(trainingCode)) {
          return [...prev, trainingCode]
        }
        return prev
      })
    }
    setExpandedDescriptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // If no employee category code, show message that category is required
  if (!employeeCategoryCode) {
    return (
      <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50">
        <div className="text-center px-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Employee category not found</p>
          <p className="text-xs text-gray-500">
            Unable to load trainings. Please ensure the employee has a valid category assigned.
          </p>
        </div>
      </div>
    )
  }

  // Show loading state when fetching
  if (loadingTrainings) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">Loading trainings...</p>
      </div>
    )
  }

  // Show empty state when no trainings found
  if (filteredTrainings.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50">
        <div className="text-center px-4">
          <p className="text-sm font-medium text-gray-700 mb-1">No trainings found</p>
          <p className="text-xs text-gray-500">
            {debouncedSearchTerm.trim()
              ? "No trainings match your search criteria."
              : "No trainings available for this employee category."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-h-[400px] overflow-y-auto overflow-x-auto border rounded-lg bg-slate-50/40 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
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
            <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
              Notify Days
            </TableHead>
            <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
              Blocking
            </TableHead>
            <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
              Notification
            </TableHead>
            <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right whitespace-nowrap sticky right-0 bg-slate-50 z-10">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTrainings.map((training, index) => {
            const isEven = index % 2 === 1
            const key = String(training.trainingCode || index)
            const trainingCode = training.trainingCode

            // Get full details if available, otherwise use training data
            const fullDetails = trainingCode ? fullTrainingDetails.get(trainingCode) : null
            const description = fullDetails?.trainingDescrition || training.trainingDescrition || ""
            const raw = description.toString().trim()

            if (!raw) {
              return (
                <TableRow
                  key={training.trainingCode}
                  className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors cursor-pointer"
                  onClick={() => onAddTraining(training.trainingCode)}
                >
                  <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900 whitespace-nowrap">
                    {training.trainingCode}
                  </TableCell>
                  <TableCell className="py-1.5 text-sm text-gray-900 whitespace-nowrap">
                    {training.trainingName || "-"}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-gray-700">-</TableCell>
                  <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                    {formatDate(training.startDate)}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                    {formatDate(training.endDate)}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                    {formatDate(training.validTill)}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                    {typeof training.notifyPriorDays === "number" ? training.notifyPriorDays : "-"}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                    {typeof training.blockingEnabled === "boolean" ? (training.blockingEnabled ? "Yes" : "No") : "-"}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                    {typeof training.notificationEnabled === "boolean" ? (training.notificationEnabled ? "Yes" : "No") : "-"}
                  </TableCell>
                  <TableCell
                    className={`py-1.5 pr-4 text-right sticky right-0 z-10 ${isEven ? "bg-slate-50/60" : "bg-white"}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddTraining(training.trainingCode)
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            }

            const maxLen = 90
            const isLong = raw.length > maxLen
            const isExpanded = !!expandedDescriptions[key]
            const shown = isLong && !isExpanded ? `${raw.slice(0, maxLen)}…` : raw

            return (
              <TableRow
                key={training.trainingCode}
                className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors cursor-pointer"
                onClick={() => onAddTraining(training.trainingCode)}
              >
                <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900 whitespace-nowrap">
                  {training.trainingCode}
                </TableCell>
                <TableCell className="py-1.5 text-sm text-gray-900 whitespace-nowrap">
                  {training.trainingName || "-"}
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
                  {formatDate(training.startDate)}
                </TableCell>
                <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                  {formatDate(training.endDate)}
                </TableCell>
                <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                  {formatDate(training.validTill)}
                </TableCell>
                <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                  {typeof training.notifyPriorDays === "number" ? training.notifyPriorDays : "-"}
                </TableCell>
                <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                  {typeof training.blockingEnabled === "boolean" ? (training.blockingEnabled ? "Yes" : "No") : "-"}
                </TableCell>
                <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                  {typeof training.notificationEnabled === "boolean" ? (training.notificationEnabled ? "Yes" : "No") : "-"}
                </TableCell>
                <TableCell
                  className={`py-1.5 pr-4 text-right sticky right-0 z-10 ${isEven ? "bg-slate-50/60" : "bg-white"}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddTraining(training.trainingCode)
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

