"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { X, Search, Check, Filter, UserPlus, ChevronLeft, ChevronRight } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { getCurrentTimeIST } from "@/utils/time/time-control"

interface CompanyEmployee {
  _id: string
  employeeID: string
  firstName?: string
  middleName?: string
  lastName?: string
  deployment?: {
    subsidiary?: { subsidiaryCode?: string; subsidiaryName?: string }
    division?: { divisionCode?: string; divisionName?: string }
    department?: { departmentCode?: string; departmentName?: string }
    location?: { locationCode?: string; locationName?: string }
  }
}

interface AddContractEmployeePopupProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (employee: CompanyEmployee) => void
}

export default function AddContractEmployeePopup({ isOpen, onClose, onSelect }: AddContractEmployeePopupProps) {
  const router = useRouter()
  const tenantCode = useGetTenantCode()
  
  const [employees, setEmployees] = useState<CompanyEmployee[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 5

  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // For sequential (await-able) "exists check" flow
  const [checkEmployeeId, setCheckEmployeeId] = useState<string | null>(null)
  const pendingCheckRef = useRef<{
    resolve: (rows: any[]) => void
    reject: (err: any) => void
  } | null>(null)

  // Debounce employeeID search
  const [employeeIdSearch, setEmployeeIdSearch] = useState('')
  const [debouncedEmployeeIdSearch, setDebouncedEmployeeIdSearch] = useState('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { employeeId } = useKeyclockRoleInfo()

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedEmployeeIdSearch(employeeIdSearch)
    }, 500)
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [employeeIdSearch])

  // Build API criteria array - only EmployeeID search, no hierarchy
  const apiCriteria = useMemo(() => {
    const filters: any[] = [
      {
        field: "tenantCode",
        value: tenantCode,
        operator: "eq",
      },
      {
        field: "createdOn",
        value: "",
        operator: "desc"
      }
    ]

    // Add employeeID filter if search exists
    if (debouncedEmployeeIdSearch.trim()) {
      filters.push({
        field: "employeeID",
        operator: "like",
        value: debouncedEmployeeIdSearch.trim()
      })
    }

    return filters
  }, [tenantCode, debouncedEmployeeIdSearch])

  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage])
  const searchCriteriaString = useMemo(() => JSON.stringify(apiCriteria), [apiCriteria])

  // Fetch company employees
  const { refetch, loading: requestLoading } = useRequest<any[]>({
    url: `company_employee/search?offset=${offset}&limit=${itemsPerPage}`,
    method: "POST",
    data: apiCriteria,
    dependencies: [searchCriteriaString, currentPage, offset],
    onSuccess: (rows: any[]) => {
      if (!rows || !Array.isArray(rows)) {
        setEmployees([])
        return
      }

      const validRows = rows.filter(
        (item: any) => item && typeof item === "object" && Object.keys(item).length > 0 && item.isDeleted !== true
      )

      const mapped: CompanyEmployee[] = validRows.map((item: any) => ({
        _id: item._id?.$oid || item._id || "",
        employeeID: item.employeeID || "",
        firstName: item.firstName || "",
        middleName: item.middleName || "",
        lastName: item.lastName || "",
        deployment: item.deployment || {}
      }))
      setEmployees(mapped)
    },
    onError: () => {},
  })

  // Count API call
  const { refetch: refetchCount } = useRequest<number>({
    url: "company_employee/count",
    method: "POST",
    data: apiCriteria,
    dependencies: [searchCriteriaString],
    onSuccess: (val: any) => {
      const n = typeof val === "number" ? val : 0
      setTotalCount(n)
    },
  })

  // POST request for creating new approver
  const { post: postApprover, loading: postLoading } = usePostRequest<any>({
    url: "contract_employee_approver",
    onSuccess: (data: any) => {
      const createdId = Array.isArray(data) && data.length > 0 ? data[0]._id : data?._id
      if (createdId) {
        router.push(`/hierarchy/contract-employee-approver?mode=edit&id=${createdId}`)
      } else {
        router.push(`/hierarchy/contract-employee-approver`)
      }
    },
    onError: (error) => {
      setIsProcessing(false)
      setErrorMessage("Failed to create approver. Please try again.")
      console.error("Error creating approver:", error)
    },
  })

  // Exists-check request (query API) — same hook style as other `useRequest` usages.
  const checkCriteria = useMemo(() => {
    if (!checkEmployeeId || !tenantCode) return []
    return [
      { field: "employeeID", operator: "is", value: checkEmployeeId },
      { field: "tenantCode", operator: "is", value: tenantCode },
    ]
  }, [checkEmployeeId, tenantCode])

  const { refetch: refetchCheckExisting } = useRequest<any[]>({
    url: `contract_employee_approver/search?offset=0&limit=1`,
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

  const runExistsCheck = async (employeeID: string) => {
    setCheckEmployeeId(employeeID)
    const rows = await new Promise<any[]>((resolve, reject) => {
      pendingCheckRef.current = { resolve, reject }
      // Force fetch; response goes to onSuccess/onError above
      void refetchCheckExisting()
    })
    // Treat `[{}]` (or any empty objects) as "no rows"
    return rows.filter((item: any) => item && typeof item === "object" && Object.keys(item).length > 0)
  }

  // Unified function that executes check and creation sequentially
  const handleCreateApprover = async (employee: CompanyEmployee) => {
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
        setErrorMessage(`EmployeeID "${employeeID}" already exists. Cannot create duplicate approver.`)
        return
      }

      // Step 2: Create approver if check passes
      const payload = {
        tenant: tenantCode,
        action: "insert",
        id: null,
        collectionName: "contract_employee_approver",
        data: {
          employeeID,
          leaveApprover: [],
          punchApprover: [],
          shiftApprover: [],
          outDutyApprover: [],
          organizationCode: tenantCode,
          tenantCode: tenantCode,
          createdBy: employeeId,
          createdOn: getCurrentTimeIST(),
        },
      }

      await postApprover(payload)
      // onSuccess will navigate; keep processing state as-is
    } catch (err: any) {
      setIsProcessing(false)
      setErrorMessage(
        err?.response?.data?.message || err?.message || "Failed to validate or create approver. Please try again."
      )
      console.error("Error in handleCreateApprover:", err)
    }
  }

  useEffect(() => {
    refetch()
    refetchCount()
  }, [])

  // Reset when popup opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1)
      setEmployeeIdSearch('')
      setDebouncedEmployeeIdSearch('')
      setErrorMessage(null)
      setIsProcessing(false)
    }
  }, [isOpen])

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedEmployeeIdSearch])

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

  const totalPages = useMemo(() => Math.ceil(totalCount / itemsPerPage), [totalCount])
  const startIndex = offset

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
              <h3 className="text-sm font-semibold text-gray-900">Select Company Employee</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Search employee and create a new contract employee approver record.
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
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
          {requestLoading ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">Loading employees...</p>
            </div>
          ) : employees.length === 0 ? (
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
                        Location
                      </TableHead>
                      <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right whitespace-nowrap sticky right-0 bg-slate-50 z-10">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee, index) => {
                      const isEven = index % 2 === 1
                      const name =
                        [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(" ") ||
                        employee.employeeID ||
                        "-"
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
                            {employee.deployment?.subsidiary?.subsidiaryName || "-"}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                            {employee.deployment?.division?.divisionName || "-"}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                            {employee.deployment?.department?.departmentName || "-"}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                            {employee.deployment?.location?.locationName || "-"}
                          </TableCell>
                          <TableCell
                            className={`py-1.5 pr-4 text-right sticky right-0 z-10 ${
                              isEven ? "bg-slate-50/60" : "bg-white"
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
                                onClick={() => handleCreateApprover(employee)}
                                disabled={postLoading || isProcessing}
                                title="Create new approver"
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