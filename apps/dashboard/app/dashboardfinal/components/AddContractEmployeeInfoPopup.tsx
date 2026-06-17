"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { X, Search as SearchIcon, Pencil, Download } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { encryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto"
import { useKeyclockRoleInfo } from "@/hooks/search/keyclock-role-info"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"

interface LiveAttendanceRow {
  _id: string
  employeeID?: string
  shiftGroupCode?: string
  shiftCode?: string
  attendanceDate?: string
  deployment?: {
    contractor?: {
      contractorCode?: string
      contractorName?: string
    }
    remark?: string
    section?: {
      sectionName?: string
      sectionCode?: string
    }
    subDepartment?: {
      subDepartmentName?: string
      subDepartmentCode?: string
    }
    skillLevel?: {
      SKILLEDLevelTitle?: string
      skilledLevelDescription?: string
    }
    subsidiary?: {
      subsidiaryName?: string
      subsidiaryCode?: string
    }
    division?: {
      divisionCode?: string
      divisionName?: string
    }
    employeeCategory?: {
      employeeCategoryCode?: string
      employeeCategoryName?: string
    }
    grade?: {
      gradeName?: string
      gradeCode?: string
    }
    location?: {
      locationName?: string
      locationCode?: string
    }
    designation?: {
      designationName?: string
      designationCode?: string
    }
    department?: {
      departmentName?: string
      departmentCode?: string
    }
    effectiveFrom?: string
  }
  lateIn?: boolean
  earlyOut?: boolean
  present?: boolean
  absent?: boolean
  firstIn?: string
  lastOut?: string
  insidePremises?: boolean
  gender?: string
  firstName?: string
  workOrderNumber?: string
}

interface AddContractEmployeeInfoPopupProps {
  isOpen: boolean
  onClose: () => void
  attendanceType?: "present" | "absent" | "lateIn" | "earlyOut"
  shiftCode?: string
  shiftGroupCode?: string
  departmentCode?: string
  contractorCode?: string
  workOrderNumber?: string
}

const safeText = (v: unknown) => {
  if (v === null || v === undefined) return "-"
  const s = String(v).trim()
  return s ? s : "-"
}

const formatDateTime = (dateTimeStr?: string) => {
  if (!dateTimeStr) return "-"
  try {
    const date = new Date(dateTimeStr)
    if (isNaN(date.getTime())) return "-"
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return "-"
  }
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-"
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return "-"
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return "-"
  }
}

const getAttendanceStatus = (present?: boolean, absent?: boolean) => {
  if (present) return "Present"
  if (absent) return "Absent"
  return "-"
}

const attendanceTypeLabels: Record<NonNullable<AddContractEmployeeInfoPopupProps["attendanceType"]>, string> = {
  present: "Present",
  absent: "Absent",
  lateIn: "Late In",
  earlyOut: "Early Out",
}

export default function AddContractEmployeeInfoPopup({
  isOpen,
  onClose,
  attendanceType,
  shiftCode,
  shiftGroupCode,
  departmentCode,
  contractorCode,
  workOrderNumber,
}: AddContractEmployeeInfoPopupProps) {
  const router = useRouter()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
  const tenantCode = useGetTenantCode()
  const { employeeIds, hierarchyFilters } = useEmpHierarchy()
  const userEntitlement = useUserEntitlement(loginEmployeeId, hierarchyFilters)
  const { fetchByteArray } = useByteToBase64()
  const [searchText, setSearchText] = useState("")
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "excel" | null>(null)
  const downloadFormatRef = useRef<"pdf" | "excel" | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [searchField, setSearchField] = useState("employeeID")
  const [rows, setRows] = useState<LiveAttendanceRow[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10
  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage])
  const limit = itemsPerPage
  const todayDate = useMemo(() => new Date().toISOString().split("T")[0], [])

  const criteriaRequests = useMemo(() => {
    const base: Array<{ field: string; operator: string; value: string | boolean }> = [{ field: "tenantCode", operator: "eq", value: tenantCode || "" },
      { field: "attendanceDate", operator: "eq", value: todayDate },
    ]
    if (attendanceType) {
      base.push({ field: attendanceType, operator: "eq", value: true })
    }
    if (shiftCode) {
      base.push({ field: "shiftCode", operator: "eq", value: shiftCode })
    }
    if (shiftGroupCode) {
      base.push({ field: "shiftGroupCode", operator: "eq", value: shiftGroupCode })
    }
    if (departmentCode) {
      base.push({ field: "deployment.department.departmentCode", operator: "eq", value: departmentCode })
    }
    if (contractorCode) {
      base.push({ field: "deployment.contractor.contractorCode", operator: "eq", value: contractorCode })
    }
    if (workOrderNumber) {
      base.push({ field: "workOrderNumber", operator: "eq", value: workOrderNumber })
    }
    const q = debouncedSearch.trim()
    if (!q) return base
    return [...base, { field: searchField, operator: "like", value: q }]
  }, [tenantCode, todayDate, debouncedSearch, searchField, attendanceType, shiftCode, shiftGroupCode, departmentCode, contractorCode, workOrderNumber])

  const hierarchyPayload = useMemo(() => ({
    hierarchyFilters: {
      ...(hierarchyFilters?.subsidiaries && hierarchyFilters.subsidiaries.length > 0 && { subsidiary: hierarchyFilters.subsidiaries }),
      ...(hierarchyFilters?.divisions && hierarchyFilters.divisions.length > 0 && { division: hierarchyFilters.divisions }),
      ...(hierarchyFilters?.departments && hierarchyFilters.departments.length > 0 && { department: hierarchyFilters.departments }),
      ...(hierarchyFilters?.contractors && hierarchyFilters.contractors.length > 0 && { contractor: hierarchyFilters.contractors }),
      ...(hierarchyFilters?.locations && hierarchyFilters.locations.length > 0 && { location: hierarchyFilters.locations }),
    },
    criteriaRequests,
    userEntitlement,
  }), [hierarchyFilters, criteriaRequests, userEntitlement])

  const { refetch: refetchCount } = useRequest<any>({
    url: "muster/liveAttendance/count/searchWithHierarchy",
    method: "POST",
    data: hierarchyPayload,
    onSuccess: (data: any) => {
      if (data !== null && data !== undefined) {
        setTotalCount(Number(data) || 0)
      }
    },
    onError: (error) => {
      console.error("Error fetching live attendance count:", error)
      setTotalCount(0)
    },
    dependencies: [tenantCode, debouncedSearch, searchField, attendanceType, shiftCode, shiftGroupCode, departmentCode, contractorCode, workOrderNumber, hierarchyFilters, userEntitlement, isOpen],
  })

  const { loading, refetch } = useRequest<any>({
    url: `muster/liveAttendance/searchWithHierarchy?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: hierarchyPayload,
    onSuccess: (data: any) => {
      const list = (Array.isArray(data) ? data : []).filter((item: any) => item)
      setRows(
        list.map((e: any) => ({
          _id: String(e?._id || ""),
          employeeID: e?.employeeID || "",
          shiftGroupCode: e?.shiftGroupCode || "",
          shiftCode: e?.shiftCode || "",
          attendanceDate: e?.attendanceDate || "",
          deployment: e?.deployment || {},
          lateIn: e?.lateIn || false,
          earlyOut: e?.earlyOut || false,
          present: e?.present || false,
          absent: e?.absent || false,
          firstIn: e?.firstIn || "",
          lastOut: e?.lastOut || "",
          insidePremises: e?.insidePremises || false,
          gender: e?.gender || "",
          firstName: e?.firstName || "",
          workOrderNumber: e?.workOrderNumber || "",
        }))
      )
    },
    onError: (error) => {
      console.error("Error fetching live attendance data:", error)
      setRows([])
    },
    dependencies: [tenantCode, debouncedSearch, searchField, attendanceType, shiftCode, shiftGroupCode, departmentCode, contractorCode, workOrderNumber, hierarchyFilters, userEntitlement, isOpen, offset, limit],
  })

  useEffect(() => {
    if (!isOpen || !tenantCode || !employeeIds || (Array.isArray(employeeIds) && employeeIds.length === 0)) return
    void refetch()
  }, [isOpen, tenantCode, employeeIds, debouncedSearch, searchField, attendanceType, shiftCode, shiftGroupCode, departmentCode, contractorCode, workOrderNumber, offset, limit])

  useEffect(() => {
    if (!isOpen || !tenantCode || !employeeIds || (Array.isArray(employeeIds) && employeeIds.length === 0)) return
    void refetchCount()
  }, [isOpen, tenantCode, employeeIds, debouncedSearch, searchField, attendanceType, shiftCode, shiftGroupCode, departmentCode, contractorCode, workOrderNumber])

  useEffect(() => {
    if (!isOpen) return
    setSearchText("")
    setDebouncedSearch("")
    setSearchField("employeeID")
    setCurrentPage(1)
    setTotalCount(0)
  }, [isOpen])

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchText)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchText])

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalCount / itemsPerPage))
    if (currentPage > maxPage) {
      setCurrentPage(maxPage)
    }
  }, [totalCount, currentPage])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", onKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const pageRows = rows
  const filterLabels = [
    attendanceType ? attendanceTypeLabels[attendanceType] : null,
    departmentCode ? `Department: ${departmentCode}` : null,
    contractorCode ? `Contractor: ${contractorCode}` : null,
    workOrderNumber ? `Work Order: ${workOrderNumber}` : null,
    shiftCode ? `Shift: ${shiftCode}` : null,
    shiftGroupCode ? `Shift Group: ${shiftGroupCode}` : null,
  ].filter(Boolean)
  const popupTitle = filterLabels.length > 0 ? `${filterLabels[0]} Attendance Information` : "Live Attendance Information"
  const popupDescription = filterLabels.length > 1
    ? `Showing records for ${filterLabels.slice(1).join(" • ")}.`
    : "Showing real-time attendance records from live tracking."

  const { loading: downloadLoading, post: postExport } = usePostRequest<{ fileName: string; path: string }>({
    url: `export?tenant=${encodeURIComponent(tenantCode || "")}&format=${downloadFormat || "pdf"}&collection=liveAttendance`,
    data: hierarchyPayload,
    onSuccess: async (data) => {
      const fmt = downloadFormatRef.current
      if (!fmt) return
      downloadFormatRef.current = null
      setDownloadFormat(null)
      const mimeType = fmt === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      const fileExt = fmt === "pdf" ? "pdf" : "xlsx"
      try {
        const result = await fetchByteArray(data.path, mimeType)
        if (result.success && result.objectUrl) {
          const anchor = document.createElement("a")
          anchor.href = result.objectUrl
          anchor.download = data.fileName || `live-attendance-report.${fileExt}`
          document.body.appendChild(anchor)
          anchor.click()
          document.body.removeChild(anchor)
          URL.revokeObjectURL(result.objectUrl)
        } else {
          console.error("Failed to fetch file bytes:", result.error)
        }
      } catch (err) {
        console.error("Download error:", err)
      }
    },
    onError: (error) => {
      console.error("Download report error:", error)
      downloadFormatRef.current = null
      setDownloadFormat(null)
    },
  })

  useEffect(() => {
    if (!downloadFormat || !tenantCode) return
    void postExport()
  }, [downloadFormat])

  const handleDownloadReport = (format: "pdf" | "excel") => {
    if (downloadLoading) return
    downloadFormatRef.current = format
    setDownloadFormat(format)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-7xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{popupTitle}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">{popupDescription}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
          <div className="flex w-full max-w-[650px] overflow-hidden rounded-lg border bg-background">
            <div className="flex w-[220px] items-center border-r px-2 py-1.5">
              <SearchIcon className="w-4 h-4 text-muted-foreground mr-2" />
              <Select value={searchField} onValueChange={setSearchField}>
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employeeID">Employee ID</SelectItem>
                  <SelectItem value="workOrderNumber">Work Order Number</SelectItem>
                  <SelectItem value="shiftCode">Shift Code</SelectItem>
                  <SelectItem value="shiftGroupCode">Shift Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[430px] items-center">
              <div className="relative w-full">
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={`Search by ${searchField}`}
                  className="h-9 w-full border-none rounded-none bg-transparent px-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </div>
            </div>
          </div>

          <div className="border rounded-lg bg-slate-50/40 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            <Table className="min-w-[1600px]">
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Sl No</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Employee ID</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Work Order No</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Attendance Date</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Status</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">First In</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Last Out</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Late In</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Early Out</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Inside Premises</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Shift Code</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Shift Group</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Gender</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Contractor</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Department</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Designation</TableHead>
                  {/* <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right whitespace-nowrap sticky right-0 bg-slate-50 z-10">Action</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell className="py-8 text-center text-gray-500" colSpan={17}>Loading attendance records...</TableCell>
                  </TableRow>
                ) : pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-8 text-center text-gray-500" colSpan={17}>No attendance records found.</TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((record, idx) => (
                    <TableRow key={`${record._id}-${idx}`} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors">
                      <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900 whitespace-nowrap">{startIndex + idx + 1}</TableCell>
                      <TableCell className="py-1.5 font-mono text-[11px] text-gray-900 whitespace-nowrap">{safeText(record.employeeID)}</TableCell>
                      <TableCell className="py-1.5 font-mono text-[11px] text-gray-900 whitespace-nowrap">{safeText(record.workOrderNumber)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{formatDate(record.attendanceDate)}</TableCell>
                      <TableCell className="py-1.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          record.present 
                            ? 'bg-green-100 text-green-800' 
                            : record.absent 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {getAttendanceStatus(record.present, record.absent)}
                        </span>
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{formatDateTime(record.firstIn)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{formatDateTime(record.lastOut)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {record.lateIn ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-800">Yes</span>
                        ) : "No"}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {record.earlyOut ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800">Yes</span>
                        ) : "No"}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {record.insidePremises ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">Inside</span>
                        ) : "Outside"}
                      </TableCell>
                      <TableCell className="py-1.5 font-mono text-[11px] text-gray-900 whitespace-nowrap">{safeText(record.shiftCode)}</TableCell>
                      <TableCell className="py-1.5 font-mono text-[11px] text-gray-900 whitespace-nowrap">{safeText(record.shiftGroupCode)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{safeText(record.gender)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap max-w-[200px] truncate" title={record.deployment?.contractor?.contractorName}>
                        {safeText(record.deployment?.contractor?.contractorName)}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap max-w-[150px] truncate" title={record.deployment?.department?.departmentName}>
                        {safeText(record.deployment?.department?.departmentName)}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap max-w-[150px] truncate" title={record.deployment?.designation?.designationName}>
                        {safeText(record.deployment?.designation?.designationName)}
                      </TableCell>
                      {/* <TableCell className="py-1.5 pr-4 text-right sticky right-0 bg-white z-10">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full"
                          title="Edit attendance"
                          onClick={() => {
                            // You can modify this to navigate to attendance edit page
                            const encryptedData = encryptEmployeeData({
                              employeeId: loginEmployeeId || "",
                              _id: record._id,
                            })
                            onClose()
                            router.push(`/attendance-management/live-attendance?form=temp&mode=edit&id=${encryptedData}`)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell> */}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-gray-500">
                Showing <span className="font-semibold">{Math.min(startIndex + 1, totalCount)}-{Math.min(startIndex + itemsPerPage, totalCount)}</span> of <span className="font-semibold">{totalCount}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[11px]" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                  Prev
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[11px]" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 text-[11px] bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              disabled={downloadLoading || !tenantCode}
              onClick={() => handleDownloadReport("pdf")}
            >
              <Download className="h-3.5 w-3.5" />
              {downloadLoading && downloadFormat === "pdf" ? "Downloading..." : "Download PDF"}
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 text-[11px] bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              disabled={downloadLoading || !tenantCode}
              onClick={() => handleDownloadReport("excel")}
            >
              <Download className="h-3.5 w-3.5" />
              {downloadLoading && downloadFormat === "excel" ? "Downloading..." : "Download Excel"}
            </Button>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}