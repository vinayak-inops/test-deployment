"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { X, Users, Filter, Search as SearchIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useQuery, gql } from "@apollo/client"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"
import { useHierarchyFilters } from "@/hooks/hierarchy/useHierarchyFilters"

export interface Employee {
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
    employeeCategory?: {
      employeeCategoryCode?: string
      employeeCategoryName?: string
    }
  }
}

interface AddApproverPopupProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (mergedApprovers: Employee[]) => Promise<void>
  approvers: Employee[]
}

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

export default function AddApproverPopup({
  isOpen,
  onClose,
  onSelect,
  approvers,
}: AddApproverPopupProps) {
  const tenantCode = useGetTenantCode()
  const { hierarchyFilters: hierarchyFiltersFromHook } = useEmpHierarchy()
  const { employeeId } = useKeyclockRoleInfo()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedMap, setSelectedMap] = useState<Map<string, Employee>>(new Map())
  const [saving, setSaving] = useState(false)

  const toggleEmployee = (employee: Employee) => {
    setSelectedMap((prev) => {
      const next = new Map(prev)
      if (next.has(employee.employeeID)) {
        next.delete(employee.employeeID)
      } else {
        next.set(employee.employeeID, employee)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (searchResults.length === 0) return
    const allSelected = searchResults.every((e) => selectedMap.has(e.employeeID))
    if (allSelected) {
      setSelectedMap((prev) => {
        const next = new Map(prev)
        searchResults.forEach((e) => next.delete(e.employeeID))
        return next
      })
    } else {
      setSelectedMap((prev) => {
        const next = new Map(prev)
        searchResults.forEach((e) => next.set(e.employeeID, e))
        return next
      })
    }
  }

  const handleSave = async () => {
    if (selectedMap.size === 0) return
    const existingIds = new Set(approvers.map((a) => a.employeeID))
    const toAdd = Array.from(selectedMap.values()).filter((e) => !existingIds.has(e.employeeID))
    const merged = [...approvers, ...toAdd]
    setSaving(true)
    try {
      await onSelect(merged)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const safeText = (v: unknown) => {
    if (v === null || v === undefined) return ""
    const s = String(v).trim()
    if (!s || s.toLowerCase() === "undefined" || s.toLowerCase() === "null")
      return ""
    return s
  }

  const formatName = (emp: {
    firstName?: unknown
    middleName?: unknown
    lastName?: unknown
    employeeID?: unknown
  }) => {
    const full = [
      safeText(emp.firstName),
      safeText(emp.middleName),
      safeText(emp.lastName),
    ]
      .filter(Boolean)
      .join(" ")
      .trim()
    return full || safeText(emp.employeeID) || "-"
  }

  const [employeeIdSearch, setEmployeeIdSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Employee[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 5
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const userEntitlement = useUserEntitlement(employeeId, hierarchyFiltersFromHook)

  const filterSelectionsForHook = useMemo(() => {
    if (!hierarchyFiltersFromHook) return null
    return {
      subsidiaries: hierarchyFiltersFromHook.subsidiaries || [],
      divisions: hierarchyFiltersFromHook.divisions || [],
      departments: hierarchyFiltersFromHook.departments || [],
      locations: hierarchyFiltersFromHook.locations || [],
      contractors: hierarchyFiltersFromHook.contractors || [],
      workOrderNumbers: [],
      employeeID: "",
    }
  }, [hierarchyFiltersFromHook])

  const effectiveHierarchyFilters = useHierarchyFilters(filterSelectionsForHook)

  const FETCH_EMPLOYEES_QUERY = useMemo(() => {
    const hasHierarchyFilters =
      effectiveHierarchyFilters && Object.keys(effectiveHierarchyFilters).length > 0
    const hasUserEntitlement =
      userEntitlement && Object.keys(userEntitlement).length > 0

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

    return gql(`
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
            subsidiary { subsidiaryCode subsidiaryName }
            division { divisionCode divisionName }
            department { departmentCode departmentName }
            designation { designationCode designationName }
            grade { gradeCode gradeName }
            employeeCategory { employeeCategoryCode employeeCategoryName }
          }
        }
      }
    `)
  }, [effectiveHierarchyFilters, userEntitlement])

  const queryVariables = useMemo(() => {
    const criteriaRequests: any[] = [
      { field: "tenantCode", operator: "is", value: tenantCode },
      { field: "employeeID", operator: "nin", value: approvers },
    ]
    if (debouncedSearch.trim()) {
      criteriaRequests.push({
        field: "employeeID",
        operator: "like",
        value: debouncedSearch.trim(),
      })
    }
    return {
      criteriaRequests,
      collection: "contract_employee",
      offset: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage,
    }
  }, [tenantCode, debouncedSearch, currentPage, itemsPerPage])

  const countRequestData = useMemo(
    () => ({
      hierarchyFilters: effectiveHierarchyFilters || {},
      criteriaRequests: [
        { field: "tenantCode", operator: "is", value: tenantCode },
        ...(debouncedSearch.trim()
          ? [{ field: "employeeID", operator: "like", value: debouncedSearch.trim() }]
          : []),
      ],
      userEntitlement,
    }),
    [tenantCode, debouncedSearch, effectiveHierarchyFilters, userEntitlement]
  )

  const { refetch: refetchCount } = useRequest<any>({
    url: "contract_employee/count/searchWithHierarchy",
    method: "POST",
    data: countRequestData,
    onSuccess: (data: any) => {
      if (data !== null && data !== undefined) setTotalCount(data || 0)
    },
    onError: (err: any) => console.error("Error fetching count:", err),
    dependencies: [],
  })

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(employeeIdSearch)
      setCurrentPage(1)
    }, 500)
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [employeeIdSearch])

  const { data: employeesData, loading, refetch: refetchEmployees } = useQuery(FETCH_EMPLOYEES_QUERY, {
    client,
    variables: queryVariables,
    skip: !isOpen || !tenantCode,
    fetchPolicy: "network-only",
    onError: (err) => {
      console.error("Error fetching employees:", err)
      setSearchResults([])
    },
  })

  useEffect(() => {
    if (employeesData?.fetchEmployees) {
      setSearchResults(
        (employeesData.fetchEmployees as any[]).map((e) => ({
          _id: e._id,
          employeeID: e.employeeID || "",
          firstName: e.firstName || "",
          middleName: e.middleName,
          lastName: e.lastName,
          organizationCode: e.organizationCode,
          contractorCode: e.contractorCode,
          tenantCode: e.tenantCode,
          deployment: e.deployment || {},
        }))
      )
    } else if (employeesData !== undefined) {
      setSearchResults([])
    }
  }, [employeesData])

  useEffect(() => {
    if (isOpen) {
      setEmployeeIdSearch("")
      setDebouncedSearch("")
      setSearchResults([])
      setCurrentPage(1)
      setTotalCount(0)
      setErrorMessage(null)
      setSelectedMap(new Map())
      if (tenantCode) void refetchEmployees()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (isOpen && tenantCode) void refetchCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tenantCode, debouncedSearch, effectiveHierarchyFilters])

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

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Users className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Select Contract Employees
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Search and select one or more employees to add as approvers.
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

        {/* Body */}
        <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start justify-between gap-2">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="ml-2 flex-shrink-0 text-red-500 hover:text-red-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {/* Search */}
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
                      <TableHead className="py-2 pl-4 w-10 sticky left-0 bg-slate-50 z-10">
                        <Checkbox
                          checked={
                            searchResults.length > 0 &&
                            searchResults.every((e) => selectedMap.has(e.employeeID))
                          }
                          onCheckedChange={toggleAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      {[
                        "Sl No",
                        "Employee ID",
                        "Name",
                        "Subsidiary",
                        "Division",
                        "Department",
                        "Designation",
                        "Grade",
                        "Category",
                      ].map((col) => (
                        <TableHead
                          key={col}
                          className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap"
                        >
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((employee, index) => {
                      const isChecked = selectedMap.has(employee.employeeID)
                      const isEven = index % 2 === 1
                      const name = formatName(employee)
                      const dep = employee.deployment
                      return (
                        <TableRow
                          key={employee._id}
                          className={`transition-colors cursor-pointer ${isChecked ? "bg-blue-50 hover:bg-blue-50" : "odd:bg-white even:bg-slate-50/60 hover:bg-slate-50/80"}`}
                          onClick={() => toggleEmployee(employee)}
                        >
                          <TableCell
                            className={`py-1.5 pl-4 w-10 sticky left-0 z-10 ${isChecked ? "bg-blue-50" : isEven ? "bg-slate-50/60" : "bg-white"}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggleEmployee(employee)}
                              aria-label={`Select ${employee.employeeID}`}
                            />
                          </TableCell>
                          <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900 whitespace-nowrap">
                            {startIndex + index + 1}
                          </TableCell>
                          <TableCell className="py-1.5 font-mono text-[11px] text-gray-900 whitespace-nowrap">
                            {employee.employeeID || "-"}
                          </TableCell>
                          <TableCell className="py-1.5 text-sm text-gray-900 whitespace-nowrap">
                            {name}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                            {(() => {
                              const n = safeText(dep?.subsidiary?.subsidiaryName)
                              const c = safeText(dep?.subsidiary?.subsidiaryCode)
                              return n ? `${n}${c ? ` (${c})` : ""}` : "-"
                            })()}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                            {(() => {
                              const n = safeText(dep?.division?.divisionName)
                              const c = safeText(dep?.division?.divisionCode)
                              return n ? `${n}${c ? ` (${c})` : ""}` : "-"
                            })()}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                            {(() => {
                              const n = safeText(dep?.department?.departmentName)
                              const c = safeText(dep?.department?.departmentCode)
                              return n ? `${n}${c ? ` (${c})` : ""}` : "-"
                            })()}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                            {(() => {
                              const n = safeText(dep?.designation?.designationName)
                              const c = safeText(dep?.designation?.designationCode)
                              return n ? `${n}${c ? ` (${c})` : ""}` : "-"
                            })()}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                            {(() => {
                              const n = safeText(
                                dep?.grade?.gradeName ?? dep?.grade?.gradeTitle
                              )
                              const c = safeText(dep?.grade?.gradeCode)
                              return n ? `${n}${c ? ` (${c})` : ""}` : "-"
                            })()}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                            {(() => {
                              const n = safeText(
                                dep?.employeeCategory?.employeeCategoryName
                              )
                              const c = safeText(
                                dep?.employeeCategory?.employeeCategoryCode
                              )
                              if (n) return `${n}${c ? ` (${c})` : ""}`
                              if (c) return c
                              return "-"
                            })()}
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
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-2">
          <p className="text-[11px] text-gray-500">
            {selectedMap.size > 0 ? (
              <span className="font-semibold text-blue-600">{selectedMap.size} employee{selectedMap.size > 1 ? "s" : ""} selected</span>
            ) : (
              "No employees selected"
            )}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={selectedMap.size === 0 || saving}
              onClick={handleSave}
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                `Add${selectedMap.size > 0 ? ` (${selectedMap.size})` : ""}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}