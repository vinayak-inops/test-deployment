"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { X, UserPlus, Filter, Search as SearchIcon } from "lucide-react"
import { useQuery } from "@apollo/client"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { getCurrentTimeIST } from "@/utils/time/time-control"
import { FETCH_COMPANY_EMPLOYEE_QUERY } from "@/utils/query/gql"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CompanyEmployee {
  _id: string
  employeeID: string
  firstName?: string
  lastName?: string
  emailID?: string
}

interface AddEntitlementAssignmentPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddEntitlementAssignmentPopup({
  isOpen,
  onClose,
}: AddEntitlementAssignmentPopupProps) {
  const router = useRouter()
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()

  const [employeeIdSearch, setEmployeeIdSearch] = useState("")
  const [debouncedEmployeeIdSearch, setDebouncedEmployeeIdSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkEmployeeId, setCheckEmployeeId] = useState<string | null>(null)

  const pendingCheckRef = useRef<{
    resolve: (rows: any[]) => void
    reject: (err: any) => void
  } | null>(null)

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const itemsPerPage = 5

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedEmployeeIdSearch(employeeIdSearch)
      setCurrentPage(1)
    }, 500)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [employeeIdSearch])

  const employeeVariables = useMemo(() => ({
    criteriaRequests: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode,
      },
    ],
    collection: "company_employee",
  }), [tenantCode])

  const { data: employeesResponse, loading: employeesLoading, error: employeesError } = useQuery(
    FETCH_COMPANY_EMPLOYEE_QUERY,
    {
      client,
      variables: employeeVariables,
      skip: !isOpen || !tenantCode,
      fetchPolicy: "network-only",
    },
  )

  const employeesData = useMemo<CompanyEmployee[]>(() => {
    const rows = employeesResponse?.fetchCompanyEmployee
    if (!Array.isArray(rows)) return []

    return rows
      .filter((emp: any) => !emp?.isDeleted)
      .map((emp: any) => ({
        _id: String(emp?._id ?? ""),
        employeeID: String(emp?.employeeID ?? ""),
        firstName: emp?.firstName || "",
        lastName: emp?.lastName || "",
        emailID: emp?.emailID || "",
      }))
  }, [employeesResponse])

  const filteredEmployees = useMemo(() => {
    const search = debouncedEmployeeIdSearch.trim().toLowerCase()
    if (!search) return employeesData

    return employeesData.filter((employee) => {
      const name = `${employee.firstName || ""} ${employee.lastName || ""}`.trim().toLowerCase()
      return (
        employee.employeeID.toLowerCase().includes(search) ||
        name.includes(search) ||
        String(employee.emailID || "").toLowerCase().includes(search)
      )
    })
  }, [employeesData, debouncedEmployeeIdSearch])

  const totalCount = filteredEmployees.length
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount)
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex)

  const checkCriteria = useMemo(() => {
    if (!checkEmployeeId || !tenantCode) return []
    return [
      { field: "employeeID", operator: "eq", value: checkEmployeeId },
      { field: "tenantCode", operator: "eq", value: tenantCode },
    ]
  }, [checkEmployeeId, tenantCode])

  const { refetch: refetchCheckExisting } = useRequest<any[]>({
    url: "userEntitlements/search?offset=0&limit=1",
    method: "POST",
    data: checkCriteria,
    dependencies: [],
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

  useEffect(() => {
    if (!pendingCheckRef.current || !checkEmployeeId || !tenantCode || checkCriteria.length === 0) return
    void refetchCheckExisting()
  }, [checkCriteria, checkEmployeeId, tenantCode, refetchCheckExisting])

  const runExistsCheck = async (employeeID: string) => {
    setCheckEmployeeId(employeeID)
    const rows = await new Promise<any[]>((resolve, reject) => {
      pendingCheckRef.current = { resolve, reject }
    })
    return rows.filter((item: any) => item && typeof item === "object" && Object.keys(item).length > 0)
  }

  const { post: postEntitlement, loading: postLoading } = usePostRequest<any>({
    url: "userEntitlements",
    onSuccess: (data: any) => {
      const createdId = Array.isArray(data) && data.length > 0 ? data[0]?._id : data?._id
      if (createdId) {
        router.push(`/hierarchy/user-entitlements?mode=edit&id=${createdId}`)
      } else {
        router.push("/hierarchy/user-entitlements")
      }
      onClose()
    },
    onError: (error) => {
      setIsProcessing(false)
      setErrorMessage("Failed to create entitlement assignment. Please try again.")
      console.error("Error creating entitlement assignment:", error)
    },
  })

  const handleCreateAssignment = async (employee: CompanyEmployee) => {
    const selectedEmployeeId = String(employee?.employeeID || "").trim()
    if (!selectedEmployeeId) return setErrorMessage("Employee ID is required.")
    if (!tenantCode) return setErrorMessage("Tenant information is missing. Please refresh and try again.")
    if (isProcessing || postLoading) return

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const existing = await runExistsCheck(selectedEmployeeId)
      if (existing.length > 0) {
        setIsProcessing(false)
        setErrorMessage(`EmployeeID "${selectedEmployeeId}" already exists. Cannot create duplicate entitlement assignment.`)
        return
      }

      const payload = {
        tenant: tenantCode,
        action: "insert",
        _id: null,
        collectionName: "userEntitlements",
        data: {
          employeeID: selectedEmployeeId,
          roleID: "",
          subsidiaries: [],
          divisions: [],
          departments: [],
          locations: [],
          contractors: [],
          organizationCode: tenantCode,
          tenantCode,
          createdBy: employeeId,
          createdOn: getCurrentTimeIST(),
        },
      }

      await postEntitlement(payload)
    } catch (err: any) {
      setIsProcessing(false)
      setErrorMessage(err?.response?.data?.message || err?.message || "Failed to validate or create entitlement assignment. Please try again.")
      console.error("Error in handleCreateAssignment:", err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1)
      setEmployeeIdSearch("")
      setDebouncedEmployeeIdSearch("")
      setCheckEmployeeId(null)
      pendingCheckRef.current = null
      setErrorMessage(null)
      setIsProcessing(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose()
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <UserPlus className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Select Employee</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Search employee and create a new entitlement assignment record.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
          <div className="flex bg-muted/50 rounded-lg border w-full">
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
              <Filter className="w-4 h-4 text-muted-foreground mr-2" />
              <Select value="employeeID">
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employeeID" className="text-sm">Employee ID</SelectItem>
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

          {employeesLoading ? (
            <div className="py-16 text-center"><p className="text-sm text-muted-foreground">Loading employees...</p></div>
          ) : employeesError ? (
            <div className="py-16 text-center"><p className="text-sm text-red-600">Failed to load employees.</p></div>
          ) : paginatedEmployees.length === 0 ? (
            <div className="py-16 text-center"><p className="text-sm text-muted-foreground">No employees found</p></div>
          ) : (
            <>
              <div className="border rounded-lg bg-slate-50/40 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                <Table className="min-w-[1000px]">
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Sl No</TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Employee ID</TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Name</TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Email</TableHead>
                      <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right whitespace-nowrap sticky right-0 bg-slate-50 z-10">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEmployees.map((employee, index) => {
                      const isEven = index % 2 === 1
                      const name = `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || employee.employeeID || "-"
                      return (
                        <TableRow key={employee._id} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors">
                          <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900 whitespace-nowrap">{startIndex + index + 1}</TableCell>
                          <TableCell className="py-1.5 font-mono text-[11px] text-gray-900 whitespace-nowrap">{employee.employeeID || "-"}</TableCell>
                          <TableCell className="py-1.5 text-sm text-gray-900 whitespace-nowrap">{name}</TableCell>
                          <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{employee.emailID || "-"}</TableCell>
                          <TableCell className={`py-1.5 pr-4 text-right sticky right-0 z-10 ${isEven ? "bg-slate-50/60" : "bg-white"}`}>
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full"
                                onClick={() => handleCreateAssignment(employee)}
                                disabled={postLoading || isProcessing}
                                title="Create new entitlement assignment"
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                  <p className="text-[11px] text-gray-500">
                    Showing <span className="font-semibold">{Math.min(startIndex + 1, totalCount)}-{Math.min(endIndex, totalCount)}</span> of <span className="font-semibold">{totalCount}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[11px]" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</Button>
                    <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[11px]" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}

          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
