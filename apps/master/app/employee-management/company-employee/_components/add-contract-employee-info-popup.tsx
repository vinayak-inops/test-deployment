"use client"

import React, { useEffect, useMemo, useState } from "react"
import { X, Search as SearchIcon, Pencil } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { encryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"

interface EmployeeInfoRow {
  _id: string
  employeeID?: string
  firstName?: string
  middleName?: string
  lastName?: string
  fatherHusbandName?: string
  gender?: string
  birthDate?: string
  bloodGroup?: string
  nationality?: string
  identificationMark?: string
}

interface AddContractEmployeeInfoPopupProps {
  isOpen: boolean
  onClose: () => void
}

const safeText = (v: unknown) => {
  if (v === null || v === undefined) return "-"
  const s = String(v).trim()
  return s ? s : "-"
}

const formatName = (emp: EmployeeInfoRow) => {
  const full = [emp.firstName, emp.middleName, emp.lastName].map((v) => String(v || "").trim()).filter(Boolean).join(" ")
  return full || safeText(emp.employeeID)
}

export default function AddContractEmployeeInfoPopup({ isOpen, onClose }: AddContractEmployeeInfoPopupProps) {
  const router = useRouter()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
  const tenantCode = useGetTenantCode()
  const [searchText, setSearchText] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [searchField, setSearchField] = useState("employeeID")
  const [rows, setRows] = useState<EmployeeInfoRow[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 5
  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage])
  const limit = itemsPerPage

  const criteriaRequests = useMemo(() => {
    const base = [{ field: "tenantCode", operator: "eq", value: tenantCode || "" },
      { field: "createdOn", operator: "desc", value: "" },
    ]
    const q = debouncedSearch.trim()
    if (!q) return base
    return [...base, { field: searchField, operator: "like", value: q }]
  }, [tenantCode, debouncedSearch, searchField])

  const { refetch: refetchCount } = useRequest<any>({
    url: "draft/contract_employee/count",
    method: "POST",
    data: criteriaRequests,
    onSuccess: (data: any) => {
      if (data !== null && data !== undefined) {
        setTotalCount(Number(data) || 0)
      }
    },
    onError: (error) => {
      console.error("Error fetching company employee count:", error)
      setTotalCount(0)
    },
    dependencies: [tenantCode, debouncedSearch, searchField, isOpen],
  })

  const { loading, refetch } = useRequest<any>({
    url: `draft/contract_employee/search?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: criteriaRequests,
    onSuccess: (data: any) => {
      const list = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)
      setRows(
        list.map((e: any) => ({
          _id: String(e?._id || ""),
          employeeID: e?.employeeID || "",
          firstName: e?.firstName || "",
          middleName: e?.middleName || "",
          lastName: e?.lastName || "",
          fatherHusbandName: e?.fatherHusbandName || "",
          gender: e?.gender || "",
          birthDate: e?.birthDate || "",
          bloodGroup: e?.bloodGroup || "",
          nationality: e?.nationality || "",
          identificationMark: e?.identificationMark || "",
        }))
      )
    },
    onError: (error) => {
      console.error("Error fetching Company employee info:", error)
      setRows([])
    },
    dependencies: [tenantCode, debouncedSearch, searchField, isOpen, offset, limit],
  })

  useEffect(() => {
    if (!isOpen || !tenantCode) return
    void refetch()
  }, [isOpen, tenantCode, debouncedSearch, searchField, offset, limit])

  useEffect(() => {
    if (!isOpen || !tenantCode) return
    void refetchCount()
  }, [isOpen, tenantCode, debouncedSearch, searchField])


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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Company Employee Information</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Showing personal and contact details from draft records.</p>
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
                  <SelectItem value="firstName">First Name</SelectItem>
                  <SelectItem value="lastName">Last Name</SelectItem>
                  <SelectItem value="fatherHusbandName">Father / Husband</SelectItem>
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
            <Table className="min-w-[2200px]">
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Sl No</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Employee ID</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Name</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Father / Husband</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Gender</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Birth Date</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Blood Group</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Nationality</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Identification Mark</TableHead>
                  <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right whitespace-nowrap sticky right-0 bg-slate-50 z-10">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell className="py-8 text-center text-gray-500" colSpan={10}>Loading employees...</TableCell>
                  </TableRow>
                ) : pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-8 text-center text-gray-500" colSpan={10}>No employees found.</TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((employee, idx) => (
                    <TableRow key={`${employee._id}-${idx}`} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors">
                      <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900 whitespace-nowrap">{startIndex + idx + 1}</TableCell>
                      <TableCell className="py-1.5 font-mono text-[11px] text-gray-900 whitespace-nowrap">{safeText(employee.employeeID)}</TableCell>
                      <TableCell className="py-1.5 text-sm text-gray-900 whitespace-nowrap">{formatName(employee)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{safeText(employee.fatherHusbandName)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{safeText(employee.gender)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{safeText(employee.birthDate)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{safeText(employee.bloodGroup)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{safeText(employee.nationality)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{safeText(employee.identificationMark)}</TableCell>
                      <TableCell className="py-1.5 pr-4 text-right sticky right-0 bg-white z-10">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full"
                          title="Edit employee"
                          onClick={() => {
                            const encryptedData = encryptEmployeeData({
                              employeeId: loginEmployeeId || "",
                              _id: employee._id,
                            })
                            onClose()
                            router.push(`/employee-management/company-employee?form=temp&mode=edit&id=${encryptedData}`)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
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

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
