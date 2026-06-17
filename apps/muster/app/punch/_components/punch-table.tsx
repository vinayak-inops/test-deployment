"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Search, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, Clock, AlertCircle, ChevronLeft, ChevronRight, Filter, BadgeCheck, Edit } from "lucide-react"
import { Input } from "@repo/ui/components/ui/input"
import { Badge } from "@repo/ui/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"

export interface PunchRecord {
  _id: string
  punchedTime: string
  transactionTime: string
  inOut: string
  typeOfMovement: string
  readerSerialNumber: string
  uploadTime: string
  attendanceDate: string
  employeeID: string
  organizationCode: string
  tenantCode: string
  isDeleted: string
  state: string
  date: string
  _class: string
  processed: boolean
  failureDescription?: string
}

interface PunchTableProps {
  data: PunchRecord[]
  tableTitle?: string
  onRowClick?: (record: PunchRecord) => void
  onSelectionChange?: (selectedIds: string[]) => void
  statusFilter?: "all" | "processed" | "pending" | "inPunches" | "outPunches" | "defaultPunches"
  onStatusFilterChange?: (filter: "all" | "processed" | "pending" | "inPunches" | "outPunches" | "defaultPunches") => void
  onOpenForm?: (record: PunchRecord) => void
  onEdit?: (record: PunchRecord) => void
  permissions?: {
    canViewSuspected?: boolean
    canApproveSuspected?: boolean
  }
  visibleColumns?: Array<
    | "employeeID"
    | "inOut"
    | "typeOfMovement"
    | "punchedTime"
    | "readerSerialNumber"
    | "processed"
    | "failureDescription"
    | "actions"
  >
  // External pagination props (for server-side pagination)
  externalPagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    startIndex: number
    endIndex: number
    onPageChange: (page: number) => void
  }
  // Server-side search props
  searchField?: "employeeID" | "readerSerialNumber" | "failureDescription"
  searchValue?: string
  onSearchFieldChange?: (field: "employeeID" | "readerSerialNumber" | "failureDescription") => void
  onSearchValueChange?: (value: string) => void
  loading?: boolean
}

type SortField = "punchedTime" | "processed" | "employeeID" | "inOut"
type SortDirection = "asc" | "desc" | null

export default function PunchTable({ 
  data, 
  tableTitle,
  onRowClick, 
  onSelectionChange,
  statusFilter = "all",
  onStatusFilterChange,
  onOpenForm,
  onEdit,
  permissions,
  visibleColumns,
  externalPagination,
  searchField: externalSearchField,
  searchValue: externalSearchValue,
  onSearchFieldChange,
  onSearchValueChange,
  loading = false
}: PunchTableProps) {
  // Use external search props if provided (server-side), otherwise use internal state (client-side)
  const useExternalSearch = !!externalPagination && !!onSearchFieldChange && !!onSearchValueChange
  const [internalSearchTerm, setInternalSearchTerm] = useState("")
  const [internalSelectedField, setInternalSelectedField] = useState<"employeeID" | "readerSerialNumber" | "failureDescription">("readerSerialNumber")
  
  const searchTerm = useExternalSearch ? (externalSearchValue || "") : internalSearchTerm
  const selectedField = useExternalSearch ? (externalSearchField || "readerSerialNumber") : internalSelectedField
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [internalCurrentPage, setInternalCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null)
  const canViewSuspected = permissions?.canViewSuspected
  
  // Track the last non-"all" filter to determine which mode we're in
  const lastFilterRef = useRef<"inPunches" | "outPunches" | "defaultPunches" | "processed" | "pending" | null>(null)
  
  // Update last filter when statusFilter changes
  useEffect(() => {
    if (statusFilter && statusFilter !== "all") {
      lastFilterRef.current = statusFilter as "inPunches" | "outPunches" | "defaultPunches" | "processed" | "pending"
    }
  }, [statusFilter])
  
  // Determine if we should show punch type filters or status filters
  const showPunchTypeFilters = statusFilter === "inPunches" || 
                                statusFilter === "outPunches" || 
                                statusFilter === "defaultPunches" ||
                                (statusFilter === "all" && 
                                 lastFilterRef.current && 
                                 (lastFilterRef.current === "inPunches" || 
                                  lastFilterRef.current === "outPunches" || 
                                  lastFilterRef.current === "defaultPunches"))

  // Search fields configuration
  const searchFields = [
    { value: "employeeID", label: "Employee ID" },
    { value: "readerSerialNumber", label: "Reader Serial No." },
    { value: "failureDescription", label: "Failure Description" },
  ]

  // Use external pagination if provided, otherwise use internal
  const useExternalPagination = !!externalPagination
  const currentPage = externalPagination?.currentPage ?? internalCurrentPage
  const handlePageChange = externalPagination?.onPageChange ?? setInternalCurrentPage

  // Columns visibility
  const defaultColumns: Required<NonNullable<PunchTableProps["visibleColumns"]>> = [
    "employeeID",
    "inOut",
    "typeOfMovement",
    "punchedTime",
    "readerSerialNumber",
    "processed",
    "failureDescription",
    "actions",
  ]
  const computedVisibleColumns = useMemo(() => {
    const columns = visibleColumns && visibleColumns.length ? [...visibleColumns] : [...defaultColumns]
    // Ensure actions column is available when approvals are allowed
    if (canViewSuspected && !columns.includes("actions")) {
      columns.push("actions")
    }
    return columns
  }, [visibleColumns, canViewSuspected])
  const visibleSet = useMemo(() => new Set(computedVisibleColumns), [computedVisibleColumns])
  const show = (key: string) => visibleSet.has(key as any)

  // Format time for display
  const formatTime = (isoString: string) => {
    if (!isoString) return "--:--"
    try {
      const date = new Date(isoString)
      if (isNaN(date.getTime())) return isoString
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    } catch {
      return isoString
    }
  }

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    // When using external pagination, server handles search - only do status filtering client-side if needed
    // Otherwise, do full client-side filtering
    let filtered = data.filter((record) => {
      // Client-side search filtering (only when NOT using external pagination)
      let matchesSearch = true
      if (!useExternalSearch && searchTerm.trim()) {
        const searchValue = searchTerm.toLowerCase()
        switch (selectedField) {
          case "employeeID":
            matchesSearch = record.employeeID?.toLowerCase().includes(searchValue) ?? false
            break
          case "readerSerialNumber":
            matchesSearch = record.readerSerialNumber?.toLowerCase().includes(searchValue) ?? false
            break
          case "failureDescription":
            matchesSearch = record.failureDescription?.toLowerCase().includes(searchValue) ?? false
            break
        }
      }

      // Status filtering (client-side for both cases)
      // Note: inPunches, outPunches, defaultPunches filtering is done in parent component
      const matchesStatus =
        statusFilter === "all" ||
        statusFilter === "inPunches" ||
        statusFilter === "outPunches" ||
        statusFilter === "defaultPunches" ||
        (statusFilter === "processed" && record.processed) ||
        (statusFilter === "pending" && !record.processed)

      return matchesSearch && matchesStatus
    })

    // Sort data
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = a[sortField]
        let bValue: any = b[sortField]

        if (sortField === "punchedTime") {
          aValue = new Date(aValue).getTime()
          bValue = new Date(bValue).getTime()
        } else if (sortField === "processed") {
          aValue = aValue ? 1 : 0
          bValue = bValue ? 1 : 0
        } else {
          aValue = String(aValue || "").toLowerCase()
          bValue = String(bValue || "").toLowerCase()
        }

        if (sortDirection === "asc") {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
        }
      })
    }

    return filtered
  }, [data, searchTerm, selectedField, statusFilter, sortField, sortDirection, useExternalSearch])

  // Pagination - use external if provided, otherwise calculate from filtered data
  const internalTotalPages = useExternalPagination ? 0 : Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const internalStartIndex = useExternalPagination ? 0 : (internalCurrentPage - 1) * itemsPerPage
  const internalEndIndex = useExternalPagination ? 0 : internalStartIndex + itemsPerPage
  
  // External pagination values
  const totalPages = useExternalPagination ? (externalPagination?.totalPages ?? 0) : internalTotalPages
  const totalItems = useExternalPagination ? (externalPagination?.totalItems ?? 0) : filteredAndSortedData.length
  const startIndex = useExternalPagination ? (externalPagination?.startIndex ?? 0) : internalStartIndex
  const endIndex = useExternalPagination ? (externalPagination?.endIndex ?? 0) : internalEndIndex
  
  const paginatedData = useExternalPagination ? filteredAndSortedData : filteredAndSortedData.slice(internalStartIndex, internalEndIndex)

  // Check if data is effectively empty (empty array or contains only empty objects)
  const isEmptyData = useMemo(() => {
    if (data.length === 0) return true
    
    // Check if all items are empty objects or have no valid data
    const hasValidData = data.some((record) => {
      // Check if object is completely empty (no properties or all undefined/null)
      const objectKeys = Object.keys(record || {})
      if (objectKeys.length === 0) return false
      
      // Check if record has valid _id
      if (!record._id || (typeof record._id === 'string' && record._id.trim() === '')) {
        return false
      }
      
      // Check if key fields have valid data (not just placeholders)
      const hasValidEmployeeID = record.employeeID && 
                                record.employeeID !== '--' && 
                                typeof record.employeeID === 'string' &&
                                record.employeeID.trim() !== ''
      const hasValidPunchTime = record.punchedTime && 
                                record.punchedTime !== '--:--' && 
                                typeof record.punchedTime === 'string' &&
                                record.punchedTime.trim() !== '' &&
                                !record.punchedTime.includes('Invalid')
      // At least one key field should have valid data
      return hasValidEmployeeID || hasValidPunchTime
    })
    return !hasValidData
  }, [data])

  // Check if all current page items are selected
  const allPageItemsSelected = paginatedData.length > 0 && paginatedData.every((record) => selectedIds.has(record._id))
  const somePageItemsSelected = paginatedData.some((record) => selectedIds.has(record._id))

  // Handle select all on current page
  const handleSelectAll = (checked: boolean) => {
    const newSelectedIds = new Set(selectedIds)
    if (checked) {
      paginatedData.forEach((record) => {
        if (record._id) {
          newSelectedIds.add(record._id)
        }
      })
    } else {
      paginatedData.forEach((record) => {
        if (record._id) {
          newSelectedIds.delete(record._id)
        }
      })
    }
    setSelectedIds(newSelectedIds)
    onSelectionChange?.(Array.from(newSelectedIds))
  }

  // Handle individual row selection
  const handleRowSelect = (recordId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds)
    if (checked) {
      newSelectedIds.add(recordId)
    } else {
      newSelectedIds.delete(recordId)
    }
    setSelectedIds(newSelectedIds)
    onSelectionChange?.(Array.from(newSelectedIds))
  }

  // Check if a record is selected
  const isSelected = (recordId: string) => selectedIds.has(recordId)

  // Update indeterminate state of select all checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = somePageItemsSelected && !allPageItemsSelected
    }
  }, [allPageItemsSelected, somePageItemsSelected])

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortField(null)
        setSortDirection(null)
      } else {
        setSortDirection("asc")
      }
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4 text-blue-600" />
    }
    if (sortDirection === "desc") {
      return <ArrowDown className="h-4 w-4 text-blue-600" />
    }
    return <ArrowUpDown className="h-4 w-4 text-gray-400" />
  }

  // Get punch type badge
  const getPunchTypeBadge = (inOut: string) => {
    // Handle empty or undefined values
    if (!inOut || inOut.trim() === "") {
      return (
        <Badge
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-none bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-600"
        >
          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
          None
        </Badge>
      )
    }
    
    const isIn = inOut === "I" || inOut?.toUpperCase() === "IN"
    return (
      <Badge
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-none ${
          isIn
            ? "bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-100 hover:text-blue-800"
            : "bg-orange-100 text-orange-800 border border-orange-200 hover:bg-orange-100 hover:text-orange-800"
        }`}
      >
        {isIn ? (
          <>
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            In
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-orange-600"></span>
            Out
          </>
        )}
      </Badge>
    )
  }

  // Get status badge
  const getStatusBadge = (processed: boolean) => {
    return processed ? (
      <Badge className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 hover:text-white transition-colors">
        <CheckCircle2 className="h-3 w-3" />
        Processed
      </Badge>
    ) : (
      <Badge className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 hover:text-white transition-colors">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    )
  }

  return (
    <div className="w-full max-w-full overflow-hidden relative">
      <Card className="w-full">
        <CardHeader className="bg-gray-50/50 border-b border-gray-200 px-4 md:px-5 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600 mb-0">
              {tableTitle || ""}
            </CardTitle>
            <div className="flex items-center gap-3">
              {selectedIds.size > 0 && (
                <span className="text-xs font-normal text-blue-600">
                  {selectedIds.size} selected
                </span>
              )}
              <span className="text-xs font-normal text-gray-500">
                {filteredAndSortedData.length} record{filteredAndSortedData.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0 w-full overflow-hidden">
          {/* Search and Filter Bar */}
          <div className="p-3 md:p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              {/* Filter Dropdown and Search Input */}
              <div className="flex-1 flex bg-gray-50 rounded-lg border border-gray-200 min-w-0">
                {/* Field Selection - Left Side */}
                <div className="flex items-center bg-white border-r border-gray-200 rounded-l-lg px-3 py-2 w-40">
                  <Filter className="w-4 h-4 text-gray-400 mr-2" />
                  <Select value={selectedField} onValueChange={(value) => {
                    const fieldValue = value as "employeeID" | "readerSerialNumber" | "failureDescription"
                    if (useExternalSearch && onSearchFieldChange) {
                      onSearchFieldChange(fieldValue)
                    } else {
                      setInternalSelectedField(fieldValue)
                    }
                    if (useExternalPagination) {
                      handlePageChange(1)
                    } else {
                      setInternalCurrentPage(1)
                    }
                  }}>
                    <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-gray-900 focus:ring-0 bg-transparent shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {searchFields.map((field) => (
                        <SelectItem key={field.value} value={field.value} className="text-sm">
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Field - Right Side */}
                <div className="flex-1 flex items-center bg-white rounded-r-lg relative">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder={`Search by ${searchFields.find((f) => f.value === selectedField)?.label.toLowerCase()}...`}
                      value={searchTerm}
                      onChange={(e) => {
                        const value = e.target.value
                        if (useExternalSearch && onSearchValueChange) {
                          onSearchValueChange(value)
                        } else {
                          setInternalSearchTerm(value)
                        }
                        if (useExternalPagination) {
                          handlePageChange(1)
                        } else {
                          setInternalCurrentPage(1)
                        }
                      }}
                      className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                    />
                  </div>
                  {searchTerm && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                {/* <Filter className="h-4 w-4 text-gray-500" /> */}
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      onStatusFilterChange?.("all")
                      if (useExternalPagination) {
                        handlePageChange(1)
                      } else {
                        setInternalCurrentPage(1)
                      }
                    }}
                    className={`text-sm ${
                      statusFilter === "all"
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : ""
                    }`}
                  >
                    All
                  </Button>
                  {/* Show punch type filters (inPunches, outPunches, defaultPunches) if parent passes those, otherwise show default Processed/Pending */}
                  {showPunchTypeFilters ? (
                    <>
                      <Button
                        variant={statusFilter === "inPunches" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          onStatusFilterChange?.("inPunches")
                          if (useExternalPagination) {
                            handlePageChange(1)
                          } else {
                            setInternalCurrentPage(1)
                          }
                        }}
                        className={`text-sm ${
                          statusFilter === "inPunches"
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : ""
                        }`}
                      >
                        In Punches
                      </Button>
                      <Button
                        variant={statusFilter === "outPunches" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          onStatusFilterChange?.("outPunches")
                          if (useExternalPagination) {
                            handlePageChange(1)
                          } else {
                            setInternalCurrentPage(1)
                          }
                        }}
                        className={`text-sm ${
                          statusFilter === "outPunches"
                            ? "bg-orange-600 text-white hover:bg-orange-700"
                            : ""
                        }`}
                      >
                        Out Punches
                      </Button>
                      <Button
                        variant={statusFilter === "defaultPunches" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          onStatusFilterChange?.("defaultPunches")
                          if (useExternalPagination) {
                            handlePageChange(1)
                          } else {
                            setInternalCurrentPage(1)
                          }
                        }}
                        className={`text-sm ${
                          statusFilter === "defaultPunches"
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : ""
                        }`}
                      >
                        Default Punches
                      </Button>
                    </>
                  ) : (
                    /* Default: Show Processed and Pending filters */
                    <>
                      <Button
                        variant={statusFilter === "processed" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          onStatusFilterChange?.("processed")
                          if (useExternalPagination) {
                            handlePageChange(1)
                          } else {
                            setInternalCurrentPage(1)
                          }
                        }}
                        className={`text-sm ${
                          statusFilter === "processed"
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : ""
                        }`}
                      >
                        Processed
                      </Button>
                      <Button
                        variant={statusFilter === "pending" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          onStatusFilterChange?.("pending")
                          if (useExternalPagination) {
                            handlePageChange(1)
                          } else {
                            setInternalCurrentPage(1)
                          }
                        }}
                        className={`text-sm ${
                          statusFilter === "pending"
                            ? "bg-gray-600 text-white hover:bg-gray-700"
                            : ""
                        }`}
                      >
                        Pending
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          {isEmptyData ? (
            <div className="flex flex-col items-center justify-center py-16 min-h-[400px]">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold mb-1">No Records Found</h3>
              <p className="text-sm text-muted-foreground text-center">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No suspected punch records available"}
              </p>
            </div>
          ) : (
            <>
              <div className="relative">
                {loading && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg transition-all duration-300 ease-in-out">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="text-sm font-medium text-gray-700">Loading suspected punches...</span>
                    </div>
                  </div>
                )}
                <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                <table className="w-full border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
                  <thead>
                    <tr className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-200">
                      {/* <th className="w-[50px] min-w-[50px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                        <input
                          type="checkbox"
                          ref={selectAllCheckboxRef}
                          checked={allPageItemsSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </th> */}
                      {show("employeeID") && (
                      <th className="min-w-[100px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                        <button
                          onClick={() => handleSort("employeeID")}
                          className="flex items-center gap-1.5 hover:text-gray-900 transition-colors text-left"
                        >
                          Employee ID
                          {getSortIcon("employeeID")}
                        </button>
                      </th>
                      )}
                      {show("inOut") && (
                      <th className="min-w-[90px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                        <button
                          onClick={() => handleSort("inOut")}
                          className="flex items-center gap-1.5 hover:text-gray-900 transition-colors text-left"
                        >
                          Punch Type
                          {getSortIcon("inOut")}
                        </button>
                      </th>
                      )}
                      {show("typeOfMovement") && (
                      <th className="min-w-[110px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">Movement Type</th>
                      )}
                      {show("punchedTime") && (
                      <th className="min-w-[140px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                        <button
                          onClick={() => handleSort("punchedTime")}
                          className="flex items-center gap-1.5 hover:text-gray-900 transition-colors text-left"
                        >
                          Punch Time
                          {getSortIcon("punchedTime")}
                        </button>
                      </th>
                      )}
                      {show("readerSerialNumber") && (
                      <th className="min-w-[130px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">Reader Serial No.</th>
                      )}
                      {show("processed") && (
                      <th className="min-w-[90px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                        <button
                          onClick={() => handleSort("processed")}
                          className="flex items-center gap-1.5 hover:text-gray-900 transition-colors text-left"
                        >
                          Status
                          {getSortIcon("processed")}
                        </button>
                      </th>
                      )}
                      {show("failureDescription") && (
                      <th className="min-w-[180px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">Failure Description</th>
                      )}
                      {canViewSuspected && show("actions") && (
                        <th className="w-[60px] min-w-[60px] text-right px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 border-l z-10">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((record, index) => (
                      <tr
                        key={record._id || index}
                        onClick={() => onRowClick?.(record)}
                        className={`cursor-pointer hover:bg-gray-50/70 ${
                          isSelected(record._id) ? "bg-blue-50" : ""
                        }`}
                      >
                        {/* <td className="px-3 md:px-5 py-2 whitespace-nowrap text-left" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected(record._id)}
                            onChange={(e) => {
                              e.stopPropagation()
                              handleRowSelect(record._id, e.target.checked)
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                          />
                        </td> */}
                        {show("employeeID") && (
                          <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-normal text-gray-700 text-left">{record.employeeID || "--"}</td>
                        )}
                        {show("inOut") && (
                          <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm text-left">
                            {getPunchTypeBadge(record.inOut)}
                          </td>
                        )}
                        {show("typeOfMovement") && (
                          <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-normal text-gray-600 text-left">{record.typeOfMovement || "--"}</td>
                        )}
                        {show("punchedTime") && (
                          <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-mono font-normal text-gray-700 text-left">{formatTime(record.punchedTime)}</td>
                        )}
                        {show("readerSerialNumber") && (
                          <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-normal text-gray-600 text-left">{record.readerSerialNumber || "--"}</td>
                        )}
                        {show("processed") && (
                          <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm text-left">{getStatusBadge(record.processed)}</td>
                        )}
                        {show("failureDescription") && (
                          <td className="max-w-[200px] truncate px-3 md:px-5 py-2 text-sm font-normal text-gray-600 text-left">
                            <div
                              className="truncate"
                              title={record.failureDescription || "No failure description"}
                            >
                              {record.failureDescription || (
                                <span className="text-gray-400 italic">No description</span>
                              )}
                            </div>
                          </td>
                        )}
                        {canViewSuspected && show("actions") && (
                          <td className="text-right px-3 md:px-5 py-2 whitespace-nowrap sticky right-0 bg-white border-l z-10">
                            <div className="flex items-center justify-end gap-1">
                              {onEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEdit(record)
                                  }}
                                  className="h-7 w-7"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {onOpenForm && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onOpenForm(record)
                                  }}
                                  className="h-7 w-7"
                                  title="Approve"
                                >
                                  <BadgeCheck className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>

              {/* Pagination */}
              {(useExternalPagination ? totalPages : internalTotalPages) > 1 && (
                <div className="flex items-center justify-between px-3 md:px-5 py-2 pb-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    {useExternalPagination ? (
                      <>Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries</>
                    ) : (
                      <>Showing {internalStartIndex + 1} to {Math.min(internalEndIndex, filteredAndSortedData.length)} of {filteredAndSortedData.length} entries</>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (useExternalPagination) {
                          handlePageChange(Math.max(1, currentPage - 1));
                        } else {
                          setInternalCurrentPage((prev) => Math.max(1, prev - 1));
                        }
                      }}
                      disabled={currentPage === 1}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: useExternalPagination ? totalPages : internalTotalPages }, (_, i) => i + 1)
                        .filter(page => {
                          const maxPages = useExternalPagination ? totalPages : internalTotalPages
                          if (page === 1 || page === maxPages) return true
                          if (page >= currentPage - 1 && page <= currentPage + 1) return true
                          return false
                        })
                        .map((page, index, array) => {
                          if (index > 0 && page - array[index - 1] > 1) {
                            return (
                              <div key={page} className="flex items-center gap-1">
                                <span className="px-2">...</span>
                                <Button
                                  type="button"
                                  variant={page === currentPage ? "default" : "outline"}
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (useExternalPagination) {
                                      handlePageChange(page);
                                    } else {
                                      setInternalCurrentPage(page);
                                    }
                                  }}
                                  className="h-7 w-7 p-0"
                                >
                                  {page}
                                </Button>
                              </div>
                            )
                          }
                          return (
                            <Button
                              key={page}
                              type="button"
                              variant={page === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (useExternalPagination) {
                                  handlePageChange(page);
                                } else {
                                  setInternalCurrentPage(page);
                                }
                              }}
                              className="h-7 w-7 p-0"
                            >
                              {page}
                            </Button>
                          )
                        })}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const maxPages = useExternalPagination ? totalPages : internalTotalPages
                        if (useExternalPagination) {
                          handlePageChange(Math.min(totalPages, currentPage + 1));
                        } else {
                          setInternalCurrentPage((prev) => Math.min(internalTotalPages, prev + 1));
                        }
                      }}
                      disabled={currentPage === (useExternalPagination ? totalPages : internalTotalPages)}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
