"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Calendar, X, Filter, Search as SearchIcon, UserPlus } from "lucide-react"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { getCurrentTimeIST } from "@/utils/time/time-control"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"
import { useHierarchyFilters } from "@/hooks/hierarchy/useHierarchyFilters"
import { useQuery, gql } from "@apollo/client"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import { toast } from "react-toastify"
import {
  weekOffApplicationSchema,
  type WeekOffApplication,
} from "../schemas/week-off-application-schema"

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

const serverFieldMap: Record<string, string> = {
  employeeID: "employeeID",
  fromDate:   "fromDate",
  toDate:     "toDate",
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
        subsidiary { subsidiaryCode subsidiaryName }
        division { divisionCode divisionName }
        department { departmentCode departmentName }
        designation { designationCode designationName }
        grade { gradeCode gradeName gradeTitle }
        employeeCategory { employeeCategoryCode employeeCategoryName }
      }
    }
  }
`

interface WeekOffFormPopupProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: WeekOffApplication) => void
  employeeId?: string | null
}

export function WeekOffFormPopup({
  open,
  onClose,
  onSubmit,
  employeeId,
}: WeekOffFormPopupProps) {
  const tenantCode = useGetTenantCode()
  const { hierarchyFilters: hierarchyFiltersFromHook } = useEmpHierarchy()
  const { employeeId: currentUserId } = useKeyclockRoleInfo()

  const [formFromDate, setFormFromDate] = useState("")
  const [formToDate, setFormToDate] = useState("")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("")
  const [popupShowErrors, setPopupShowErrors] = useState(false)
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const [employeeIdSearch, setEmployeeIdSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 5
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const pendingPayloadRef = useRef<WeekOffApplication | null>(null)

  const userEntitlement = useUserEntitlement(currentUserId, hierarchyFiltersFromHook)

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
    const hasHierarchyFilters = effectiveHierarchyFilters && Object.keys(effectiveHierarchyFilters).length > 0
    const hasUserEntitlement = userEntitlement && Object.keys(userEntitlement).length > 0

    if (!hasHierarchyFilters && !hasUserEntitlement) return FETCH_EMPLOYEES_QUERY_BASE

    const hierarchyFiltersString = hasHierarchyFilters
      ? Object.entries(effectiveHierarchyFilters!)
          .map(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`
            return ""
          })
          .filter(Boolean)
          .join(", ")
      : ""

    const userEntitlementString = hasUserEntitlement
      ? Object.entries(userEntitlement!)
          .map(([key, value]) => {
            if (key === "employeeID" && typeof value === "string") return `${key}: "${value}"`
            if (Array.isArray(value) && value.length > 0) return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`
            return ""
          })
          .filter(Boolean)
          .join(", ")
      : ""

    const queryParams: string[] = []
    if (hierarchyFiltersString) queryParams.push(`hierarchyFilters: { ${hierarchyFiltersString} }`)
    if (userEntitlementString) queryParams.push(`userEntitlement: { ${userEntitlementString} }`)

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
`)
  }, [effectiveHierarchyFilters, userEntitlement])

  const queryVariables = useMemo(() => {
    const criteriaRequests: any[] = [
      { field: "tenantCode", operator: "is", value: tenantCode },
    ]
    if (debouncedSearch.trim()) {
      criteriaRequests.push({ field: "employeeID", operator: "like", value: debouncedSearch.trim() })
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
    onError: () => {},
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

  const { data: employeesData, loading: employeesLoading, refetch: refetchEmployees } = useQuery(FETCH_EMPLOYEES_QUERY, {
    client,
    variables: queryVariables,
    skip: !open || !tenantCode,
    fetchPolicy: "network-only",
    onError: (err) => {
      console.error("Error fetching employees:", err)
      setSearchResults([])
    },
  })

  console.log(employeesData)

  useEffect(() => {
    if (employeesData?.fetchEmployees) {
      setSearchResults(
        (employeesData.fetchEmployees as any[]).map((e: any) => ({
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
    if (open && tenantCode && !selectedEmployeeId) void refetchCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tenantCode])

  useEffect(() => {
    if (open) {
      setFormFromDate("")
      setFormToDate("")
      setSelectedEmployeeId(employeeId || "")
      setSelectedEmployeeName("")
      setPopupShowErrors(false)
      setServerErrors({})
      setLoading(false)
      setEmployeeIdSearch("")
      setDebouncedSearch("")
      setSearchResults([])
      setCurrentPage(1)
      setTotalCount(0)
      pendingPayloadRef.current = null
      if (tenantCode) void refetchEmployees()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employeeId])

  const safeText = (v: unknown) => {
    if (v === null || v === undefined) return ""
    const s = String(v).trim()
    return s && s.toLowerCase() !== "undefined" && s.toLowerCase() !== "null" ? s : ""
  }

  const formatName = (emp: { firstName?: any; middleName?: any; lastName?: any; employeeID?: any }) => {
    const full = [safeText(emp.firstName), safeText(emp.middleName), safeText(emp.lastName)]
      .filter(Boolean)
      .join(" ")
      .trim()
    return full || safeText(emp.employeeID) || "-"
  }

  const handleSelectEmployee = (emp: any) => {
    setSelectedEmployeeId(emp.employeeID)
    setSelectedEmployeeName(formatName(emp))
    setServerErrors((prev) => { const n = { ...prev }; delete n.employeeID; return n })
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage

  const { post } = usePostRequest<any>({
    url: "validate",
    onSuccess: (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const nextErrors: Record<string, string> = {}
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const normalizedField =
            serverFieldMap[fieldName] ??
            serverFieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          nextErrors[normalizedField] = message
        })
        setServerErrors(nextErrors)
        setLoading(false)
        return
      }

      if (pendingPayloadRef.current) {
        onSubmit(pendingPayloadRef.current)
      }
      setLoading(false)
      onClose()
    },
    onError: () => {
      toast.error("Failed to validate week off change")
      setLoading(false)
    },
  })

  const handleSubmit = () => {
    const finalEmployeeId = selectedEmployeeId || employeeId || ""
    const result = weekOffApplicationSchema.safeParse({
      employeeID: finalEmployeeId,
      fromDate:   formFromDate,
      toDate:     formToDate,
      weekOffs:   [],
      createdBy:  finalEmployeeId,
      createdOn:  getCurrentTimeIST(),
    })
    if (!result.success) {
      setPopupShowErrors(true)
      return
    }
    setServerErrors({})
    setLoading(true)
    pendingPayloadRef.current = result.data
    post({
      tenant:         tenantCode,
      action:         "insert",
      collectionName: "weekOffChanges",
      event:          "validate",
      ruleId:         "weekOffChangesValidator",
      data: {
        ...result.data,
        tenantCode,
        organizationCode: tenantCode,
      },
    })
  }

  const handleClose = () => {
    if (loading) return
    setPopupShowErrors(false)
    setServerErrors({})
    onClose()
  }

  const formValidation = weekOffApplicationSchema.safeParse({
    employeeID: selectedEmployeeId || employeeId || "",
    fromDate:   formFromDate,
    toDate:     formToDate,
    weekOffs:   [],
  })
  const formErrors = formValidation.success ? {} : formValidation.error.flatten().fieldErrors

  const getFieldError = (field: string): string | undefined => {
    if (serverErrors[field]) return serverErrors[field]
    if (popupShowErrors && (formErrors as any)[field])
      return ((formErrors as any)[field] as string[])[0]
    return undefined
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Week Off Change</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Select employee and date range.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Employee selection */}
          <div className="space-y-2">
            <SubFormTitle title="Employee" />

            {/* Pre-supplied employee (read-only) */}
            {employeeId ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{employeeId}</span>
              </div>
            ) : selectedEmployeeId ? (
              /* Employee selected — show chip with clear */
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-semibold text-blue-900">{selectedEmployeeId}</span>
                {selectedEmployeeName && selectedEmployeeName !== selectedEmployeeId && (
                  <span className="text-xs text-blue-700">— {selectedEmployeeName}</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEmployeeId("")
                    setSelectedEmployeeName("")
                    setSearchResults([])
                    setEmployeeIdSearch("")
                    setDebouncedSearch("")
                    void refetchEmployees()
                  }}
                  className="ml-auto p-0.5 rounded text-blue-400 hover:text-blue-600 hover:bg-blue-100"
                  title="Change employee"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              /* Employee search table */
              <>
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
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                {employeesLoading ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">Loading employees...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">No employees found</p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg bg-slate-50/40 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                      <Table className="min-w-[1100px]">
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            {["Sl No", "Employee ID", "Name", "Subsidiary", "Division", "Department", "Designation", "Grade", "Category"].map((col) => (
                              <TableHead key={col} className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                                {col}
                              </TableHead>
                            ))}
                            <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right whitespace-nowrap sticky right-0 bg-slate-50 z-10">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {searchResults.map((emp: any, index: number) => {
                            const dep = emp.deployment
                            const name = formatName(emp)
                            const isEven = index % 2 === 1
                            return (
                              <TableRow
                                key={emp._id}
                                className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                              >
                                <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900 whitespace-nowrap">
                                  {startIndex + index + 1}
                                </TableCell>
                                <TableCell className="py-1.5 font-mono text-[11px] text-gray-900 whitespace-nowrap">
                                  {emp.employeeID || "-"}
                                </TableCell>
                                <TableCell className="py-1.5 text-sm text-gray-900 whitespace-nowrap">
                                  {name}
                                </TableCell>
                                <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                                  {(() => { const n = safeText(dep?.subsidiary?.subsidiaryName); const c = safeText(dep?.subsidiary?.subsidiaryCode); return n ? `${n}${c ? ` (${c})` : ""}` : "-" })()}
                                </TableCell>
                                <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                                  {(() => { const n = safeText(dep?.division?.divisionName); const c = safeText(dep?.division?.divisionCode); return n ? `${n}${c ? ` (${c})` : ""}` : "-" })()}
                                </TableCell>
                                <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                                  {(() => { const n = safeText(dep?.department?.departmentName); const c = safeText(dep?.department?.departmentCode); return n ? `${n}${c ? ` (${c})` : ""}` : "-" })()}
                                </TableCell>
                                <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                                  {(() => { const n = safeText(dep?.designation?.designationName); const c = safeText(dep?.designation?.designationCode); return n ? `${n}${c ? ` (${c})` : ""}` : "-" })()}
                                </TableCell>
                                <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                                  {(() => { const n = safeText(dep?.grade?.gradeName ?? dep?.grade?.gradeTitle); const c = safeText(dep?.grade?.gradeCode); return n ? `${n}${c ? ` (${c})` : ""}` : "-" })()}
                                </TableCell>
                                <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                                  {(() => { const n = safeText(dep?.employeeCategory?.employeeCategoryName); const c = safeText(dep?.employeeCategory?.employeeCategoryCode); return n ? `${n}${c ? ` (${c})` : ""}` : c || "-" })()}
                                </TableCell>
                                <TableCell
                                  className={`py-1.5 pr-4 text-right sticky right-0 z-10 ${isEven ? "bg-slate-50/60" : "bg-white"}`}
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                                >
                                  <div className="flex justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full"
                                      onClick={() => handleSelectEmployee(emp)}
                                      title="Select this employee"
                                    >
                                      <UserPlus className="h-3.5 w-3.5" />
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
                          Showing{" "}
                          <span className="font-semibold">
                            {Math.min(startIndex + 1, totalCount)}-{Math.min(startIndex + itemsPerPage, totalCount)}
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

                {getFieldError("employeeID") && (
                  <p className="text-red-500 text-xs mt-1" role="alert">{getFieldError("employeeID")}</p>
                )}
              </>
            )}
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <SubFormTitle title="Date Range" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  From Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formFromDate}
                  onChange={(e) => {
                    setFormFromDate(e.target.value)
                    setServerErrors((prev) => { const n = { ...prev }; delete n.fromDate; return n })
                  }}
                  max={formToDate || undefined}
                  className={`${INPUT_CLASS} ${getFieldError("fromDate") ? "border-red-500" : ""}`}
                />
                {getFieldError("fromDate") && (
                  <p className="text-red-500 text-xs" role="alert">{getFieldError("fromDate")}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  To Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formToDate}
                  onChange={(e) => {
                    setFormToDate(e.target.value)
                    setServerErrors((prev) => { const n = { ...prev }; delete n.toDate; return n })
                  }}
                  min={formFromDate || undefined}
                  className={`${INPUT_CLASS} ${getFieldError("toDate") ? "border-red-500" : ""}`}
                />
                {getFieldError("toDate") && (
                  <p className="text-red-500 text-xs" role="alert">{getFieldError("toDate")}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubmit}
          >
            {loading ? "Validating..." : "Add Row"}
          </Button>
        </div>
      </div>
    </div>
  )
}
