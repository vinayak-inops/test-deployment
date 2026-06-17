"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { X, UserPlus, Filter, Search as SearchIcon } from "lucide-react"
import { useQuery, gql } from '@apollo/client'
import { client } from '@repo/ui/hooks/api/dynamic-graphql'
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { getCurrentTimeIST } from "@/utils/time/time-control"
import { useEmpHierarchy } from '@/hooks/hierarchy/emp-hierarchy'
import { useUserEntitlement } from '@/hooks/hierarchy/useUserEntitlement'
import { useHierarchyFilters } from '@/hooks/hierarchy/useHierarchyFilters'

interface Employee {
  _id: string
  employeeID: string
  firstName?: string
  middleName?: string
  lastName?: string
  organizationCode?: string
  contractorCode?: string
  tenantCode?: string
  deployment?: {
    effectiveFrom?: string
    subsidiary?: { subsidiaryCode?: string; subsidiaryName?: string }
    division?: { divisionCode?: string; divisionName?: string }
    department?: { departmentCode?: string; departmentName?: string }
    designation?: { designationCode?: string; designationName?: string }
    grade?: { gradeCode?: string; gradeTitle?: string; gradeName?: string }
    employeeCategory?: { employeeCategoryCode?: string; employeeCategoryName?: string }
  }
}

interface AddContractEmployeeTrainingPopupProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (employee: Employee) => void
}

// Base GraphQL query for fetching employees (without hierarchyFilters)
const FETCH_EMPLOYEES_QUERY_BASE = gql`
  query FetchEmployees(
    $criteriaRequests: [CriteriaRequest!]!
    $collection: String!
    $offset: Int
    $limit: Int
  ) {
    fetchEmployees(
      criteriaRequests: $criteriaRequests
      collection: $collection
      offset: $offset
      limit: $limit
    ) {
      _id
      firstName
      middleName
      lastName
      employeeID
      organizationCode
      contractorCode
      tenantCode
      deployment {
        effectiveFrom
        subsidiary {
          subsidiaryCode
          subsidiaryName
        }
        division {
          divisionCode
          divisionName
        }
        department {
          departmentCode
          departmentName
        }
        designation {
          designationCode
          designationName
        }
        grade {
          gradeCode
          gradeName
        }
        employeeCategory {
          employeeCategoryCode
          employeeCategoryName
        }
      }
    }
  }
`

export default function AddContractEmployeeTrainingPopup({ isOpen, onClose, onSelect }: AddContractEmployeeTrainingPopupProps) {
  const router = useRouter()
  const tenantCode = useGetTenantCode()
  const { hierarchyFilters: hierarchyFiltersFromHook } = useEmpHierarchy()

  const safeText = (v: unknown) => {
    if (v === null || v === undefined) return ""
    const s = String(v).trim()
    if (!s || s.toLowerCase() === "undefined" || s.toLowerCase() === "null") return ""
    return s
  }

  const formatName = (emp: { firstName?: unknown; middleName?: unknown; lastName?: unknown; employeeID?: unknown }) => {
    const full = [safeText(emp.firstName), safeText(emp.middleName), safeText(emp.lastName)].filter(Boolean).join(" ").trim()
    return full || safeText(emp.employeeID) || "-"
  }

  const [employeeIdSearch, setEmployeeIdSearch] = useState("")
  const [debouncedEmployeeIdSearch, setDebouncedEmployeeIdSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Employee[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 5
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // For sequential (await-able) "exists check" flow
  const [checkEmployeeId, setCheckEmployeeId] = useState<string | null>(null)
  const pendingCheckRef = useRef<{
    resolve: (rows: any[]) => void
    reject: (err: any) => void
  } | null>(null)

  const { employeeId } = useKeyclockRoleInfo()
  const userEntitlement = useUserEntitlement(employeeId, hierarchyFiltersFromHook)

  // Convert hierarchy filters from hook to FilterSelections format and use shared hook
  const filterSelectionsForHook = useMemo(() => {
    if (!hierarchyFiltersFromHook) return null
    return {
      subsidiaries: hierarchyFiltersFromHook.subsidiaries || [],
      divisions: hierarchyFiltersFromHook.divisions || [],
      departments: hierarchyFiltersFromHook.departments || [],
      locations: hierarchyFiltersFromHook.locations || [],
      contractors: hierarchyFiltersFromHook.contractors || [],
      workOrderNumbers: [],
      employeeID: ''
    }
  }, [hierarchyFiltersFromHook])

  // Use shared hook to convert filter selections to hierarchyFilters format
  const effectiveHierarchyFilters = useHierarchyFilters(filterSelectionsForHook)

  // Build GraphQL query dynamically with hierarchyFilters and userEntitlement inline
  const FETCH_EMPLOYEES_QUERY = useMemo(() => {
    const hasHierarchyFilters =
      effectiveHierarchyFilters && Object.keys(effectiveHierarchyFilters).length > 0
    const hasUserEntitlement = userEntitlement && Object.keys(userEntitlement).length > 0

    if (!hasHierarchyFilters && !hasUserEntitlement) {
      return FETCH_EMPLOYEES_QUERY_BASE
    }

    const hierarchyFiltersString = hasHierarchyFilters
      ? Object.entries(effectiveHierarchyFilters!)
          .map(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
              return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`
            }
            return ""
          })
          .filter(Boolean)
          .join(", ")
      : ""

    const userEntitlementString = hasUserEntitlement
      ? Object.entries(userEntitlement!)
          .map(([key, value]) => {
            if (key === "employeeID" && typeof value === "string") {
              return `${key}: "${value}"`
            }
            if (Array.isArray(value) && value.length > 0) {
              return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`
            }
            return ""
          })
          .filter(Boolean)
          .join(", ")
      : ""

    const queryParams: string[] = []
    if (hierarchyFiltersString) {
      queryParams.push(`hierarchyFilters: { ${hierarchyFiltersString} }`)
    }
    if (userEntitlementString) {
      queryParams.push(`userEntitlement: { ${userEntitlementString} }`)
    }

    const queryString = `
      query FetchEmployees(
        $criteriaRequests: [CriteriaRequest!]!
        $collection: String!
        $offset: Int
        $limit: Int
      ) {
        fetchEmployees(
          criteriaRequests: $criteriaRequests
          collection: $collection
          offset: $offset
          limit: $limit
          ${queryParams.join("\n          ")}
        ) {
          _id
          firstName
          middleName
          lastName
          employeeID
          organizationCode
          contractorCode
          tenantCode
          deployment {
            effectiveFrom
            subsidiary {
              subsidiaryCode
              subsidiaryName
            }
            division {
              divisionCode
              divisionName
            }
            department {
              departmentCode
              departmentName
            }
            designation {
              designationCode
              designationName
            }
            grade {
              gradeCode
              gradeName
            }
            employeeCategory {
              employeeCategoryCode
              employeeCategoryName
            }
          }
        }
      }
    `
    return gql(queryString)
  }, [effectiveHierarchyFilters, userEntitlement])

  // Build query variables
  const queryVariables = useMemo(() => {
    const criteriaRequests: any[] = []

    // Add tenantCode filter
    criteriaRequests.push({
      field: 'tenantCode',
      operator: 'is',
      value: tenantCode,
    })

    if (debouncedEmployeeIdSearch.trim()) {
      criteriaRequests.push({
        field: 'employeeID',
        operator: 'like',
        value: debouncedEmployeeIdSearch.trim(),
      })
    }

    const offset = (currentPage - 1) * itemsPerPage

    const vars = {
      criteriaRequests,
      collection: 'contract_employee',
      offset,
      limit: itemsPerPage,
    }

    return vars
  }, [tenantCode, debouncedEmployeeIdSearch, currentPage, itemsPerPage])

  // Build count request data (same criteria as query but without pagination)
  const countRequestData = useMemo(() => {
    const criteriaRequests: any[] = []

    // Add tenantCode filter
    criteriaRequests.push({
      field: 'tenantCode',
      operator: 'is',
      value: tenantCode,
    })

    if (debouncedEmployeeIdSearch.trim()) {
      criteriaRequests.push({
        field: 'employeeID',
        operator: 'like',
        value: debouncedEmployeeIdSearch.trim(),
      })
    }

    return {
      hierarchyFilters: effectiveHierarchyFilters || {},
      criteriaRequests,
      userEntitlement,
    }
  }, [tenantCode, debouncedEmployeeIdSearch, effectiveHierarchyFilters, userEntitlement])

  // Count API call to get total number of employees
  const {
    data: countData,
    loading: countLoading,
    error: countError,
    refetch: refetchCount,
  } = useRequest<any>({
    url: 'contract_employee/count/searchWithHierarchy',
    method: 'POST',
    data: countRequestData,
    onSuccess: (data: any) => {
      if (data !== null && data !== undefined) {
        setTotalCount(data || 0)
      }
    },
    onError: (error: any) => {
      console.error("Error fetching contract employee count:", error)
    },
    dependencies: [] // Empty dependencies - requests will only be made via manual refetch
  })

  // Debounce search input with optimized timing to reduce backend calls
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce set to 500ms - optimal balance between responsiveness and backend load
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedEmployeeIdSearch(employeeIdSearch)
      setCurrentPage(1) // Reset to first page on new search
    }, 500)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [employeeIdSearch])

  // Fetch employees using GraphQL
  const {
    data: employeesData,
    loading,
    error: queryError,
  } = useQuery(FETCH_EMPLOYEES_QUERY, {
    client,
    variables: queryVariables,
    skip: !isOpen || !tenantCode,
    fetchPolicy: 'network-only',
    onError: (err) => {
      console.error('Error fetching employees:', err)
      setErrorMessage('Failed to load employees')
      setSearchResults([])
    },
  })

  // Update search results when query completes
  useEffect(() => {
    if (employeesData?.fetchEmployees) {
      const mapped: Employee[] = (employeesData.fetchEmployees || []).map((e: any) => ({
        _id: e._id,
        employeeID: e.employeeID || '',
        firstName: e.firstName || '',
        middleName: e.middleName,
        lastName: e.lastName,
        organizationCode: e.organizationCode,
        contractorCode: e.contractorCode,
        tenantCode: e.tenantCode,
        deployment: e.deployment || {},
      }))
      setSearchResults(mapped)
    } else if (employeesData !== undefined) {
      setSearchResults([])
    }
  }, [employeesData])

  // Handle query error
  useEffect(() => {
    if (queryError) {
      console.error('GraphQL query error:', queryError)
      setErrorMessage('Failed to load employees')
      setSearchResults([])
    }
  }, [queryError])

  // POST request for creating new training completion record
  const { post: postTrainingCompletion, loading: postLoading } = usePostRequest<any>({
    url: "employee_training_completion",
    onSuccess: (data: any) => {
      const createdId = Array.isArray(data) && data.length > 0 ? data[0]._id : data?._id
      if (createdId) {
        router.push(`/employee-management/employee-training-completion?mode=edit&id=${createdId}`)
      } else {
        router.push(`/employee-management/employee-training-completion`)
      }
    },
    onError: (error) => {
      setIsProcessing(false)
      setErrorMessage("Failed to create training completion record. Please try again.")
      console.error("Error creating training completion:", error)
    },
  })

  // Exists-check request (query API)
  const checkCriteria = useMemo(() => {
    if (!checkEmployeeId || !tenantCode) return []
    return [
      { field: "employeeID", operator: "is", value: checkEmployeeId },
      { field: "tenantCode", operator: "is", value: tenantCode },
    ]
  }, [checkEmployeeId, tenantCode])

  const { refetch: refetchCheckExisting } = useRequest<any[]>({
    url: `employee_training_completion/search?offset=0&limit=1`,
    method: "POST",
    data: checkCriteria,
    dependencies: [], // manual only
    onSuccess: (rows: any) => {
      const arr = Array.isArray(rows) ? rows : []
      pendingCheckRef.current?.resolve(arr)
      pendingCheckRef.current = null
    },
    onError: (err) => {
      pendingCheckRef.current?.reject(err)
      pendingCheckRef.current = null
    },
  })

  // Trigger the exists-check only AFTER state updates (avoids refetch-before-data race)
  useEffect(() => {
    if (!pendingCheckRef.current) return
    if (!checkEmployeeId) return
    if (!tenantCode) return
    if (!Array.isArray(checkCriteria) || checkCriteria.length === 0) return

    void refetchCheckExisting()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkCriteria, checkEmployeeId, tenantCode])

  const runExistsCheck = async (employeeID: string) => {
    setCheckEmployeeId(employeeID)
    const rows = await new Promise<any[]>((resolve, reject) => {
      pendingCheckRef.current = { resolve, reject }
    })
    // Treat `[{}]` (or any empty objects) as "no rows"
    return rows.filter((item: any) => item && typeof item === "object" && Object.keys(item).length > 0)
  }

  // Unified function that executes check and creation sequentially
  const handleCreateTrainingCompletion = async (employee: Employee) => {
    const employeeID = String(employee?.employeeID || "").trim()
    if (!employeeID) {
      setErrorMessage("Employee ID is required.")
      return
    }
    if (!tenantCode) {
      setErrorMessage("Tenant information is missing. Please refresh and try again.")
      return
    }
    if (isProcessing || postLoading) return

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // Step 1: Check if employeeID already exists
      const existing = await runExistsCheck(employeeID)
      if (existing.length > 0) {
        setIsProcessing(false)
        setErrorMessage(`EmployeeID "${employeeID}" already has a training completion record. Cannot create duplicate.`)
        return
      }

      // Step 2: Create training completion record if check passes
      const payload = {
        tenant: tenantCode,
        action: "insert",
        id: null,
        collectionName: "employee_training_completion",
        data: {
          employeeID,
          trainingsCompleted: [],
          organizationCode: tenantCode,
          tenantCode: tenantCode,
          createdBy: employeeId,
          createdOn: getCurrentTimeIST(),
        },
      }

      await postTrainingCompletion(payload)
      // onSuccess will navigate; keep processing state as-is
    } catch (err: any) {
      setIsProcessing(false)
      setErrorMessage(
        err?.response?.data?.message || err?.message || "Failed to validate or create training completion record. Please try again."
      )
      console.error("Error in handleCreateTrainingCompletion:", err)
    }
  }

  const handleSelect = (emp: Employee) => {
    void handleCreateTrainingCompletion(emp)
  }

  // Reset when popup opens
  useEffect(() => {
    if (isOpen) {
      setEmployeeIdSearch("")
      setDebouncedEmployeeIdSearch("")
      setSearchResults([])
      setCurrentPage(1)
      setTotalCount(0)
      setCheckEmployeeId(null)
      pendingCheckRef.current = null
      setErrorMessage(null)
      setIsProcessing(false)
    }
  }, [isOpen])

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedEmployeeIdSearch])

  // Refetch count when search or filters change
  useEffect(() => {
    if (isOpen && tenantCode) {
      void refetchCount()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tenantCode, debouncedEmployeeIdSearch, effectiveHierarchyFilters])

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <UserPlus className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Select Contract Employee</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Search contract employee and create a new training completion record.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
          {/* Employee ID Search */}
          <div className="flex bg-muted/50 rounded-lg border w-full">
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
              <Filter className="w-4 h-4 text-muted-foreground mr-2" />
              <Select value="employeeID">
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employeeID" className="text-sm">
                    Employee ID
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 flex items-center bg-background rounded-r-lg min-w-0">
              <div className="relative flex-1 w-full">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search by employee id..."
                  value={employeeIdSearch}
                  onChange={(e) => setEmployeeIdSearch(e.target.value)}
                  className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent w-full placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">Loading employees...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">No employees found</p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg bg-slate-50/40 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                <Table className="min-w-[1400px]">
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                        Sl No
                      </TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                        Employee ID
                      </TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                        Name
                      </TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap min-w-[150px]">
                        Subsidiary
                      </TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap min-w-[150px]">
                        Division
                      </TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap min-w-[150px]">
                        Department
                      </TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap min-w-[150px]">
                        Designation
                      </TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap min-w-[120px]">
                        Grade
                      </TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap min-w-[150px]">
                        Category
                      </TableHead>
                      <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right whitespace-nowrap sticky right-0 bg-slate-50 z-10">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((employee, index) => {
                      const isEven = index % 2 === 1
                      const name = formatName(employee)
                      const deployment = employee.deployment
                      return (
                        <TableRow
                          key={employee._id}
                          className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                        >
                          <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900 whitespace-nowrap">
                            {startIndex + index + 1}
                          </TableCell>
                          <TableCell className="py-1.5 font-mono text-[11px] text-gray-900 whitespace-nowrap">
                            {employee.employeeID || "-"}
                          </TableCell>
                          <TableCell className="py-1.5 text-sm text-gray-900 whitespace-nowrap">{name}</TableCell>
                          <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                            {(() => {
                              const n = safeText(deployment?.subsidiary?.subsidiaryName)
                              const c = safeText(deployment?.subsidiary?.subsidiaryCode)
                              return n ? `${n}${c ? ` (${c})` : ""}` : "-"
                            })()}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                            {(() => {
                              const n = safeText(deployment?.division?.divisionName)
                              const c = safeText(deployment?.division?.divisionCode)
                              return n ? `${n}${c ? ` (${c})` : ""}` : "-"
                            })()}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                            {(() => {
                              const n = safeText(deployment?.department?.departmentName)
                              const c = safeText(deployment?.department?.departmentCode)
                              return n ? `${n}${c ? ` (${c})` : ""}` : "-"
                            })()}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                            {(() => {
                              const n = safeText(deployment?.designation?.designationName)
                              const c = safeText(deployment?.designation?.designationCode)
                              return n ? `${n}${c ? ` (${c})` : ""}` : "-"
                            })()}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                            {(() => {
                              const n = safeText(deployment?.grade?.gradeName ?? deployment?.grade?.gradeTitle)
                              const c = safeText(deployment?.grade?.gradeCode)
                              return n ? `${n}${c ? ` (${c})` : ""}` : "-"
                            })()}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                            {(() => {
                              const n = safeText(deployment?.employeeCategory?.employeeCategoryName)
                              const c = safeText(deployment?.employeeCategory?.employeeCategoryCode)
                              if (n) return `${n}${c ? ` (${c})` : ""}`
                              if (c) return c
                              return "-"
                            })()}
                          </TableCell>
                          <TableCell
                            className={`py-1.5 pr-4 text-right sticky right-0 z-10 ${isEven ? "bg-slate-50/60" : "bg-white"
                              }`}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                          >
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full"
                                onClick={() => handleSelect(employee)}
                                disabled={postLoading || isProcessing}
                                title="Create new training completion record"
                              >
                                {isProcessing ? (
                                  <div className="h-3.5 w-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <UserPlus className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                  <p className="text-[11px] text-gray-500">
                    Showing{" "}
                    <span className="font-semibold">
                      {Math.min(startIndex + 1, totalCount)}-
                      {Math.min(startIndex + itemsPerPage, totalCount)}
                    </span>{" "}
                    of <span className="font-semibold">{totalCount}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
