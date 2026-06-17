"use client"

import React, { useEffect, useMemo, useState } from "react"
import { X, Search as SearchIcon, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { encryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ContractorDraftRow {
  _id: string
  contractorName?: string
  contractorCode?: string
  ownerName?: string
  ownerContactNo?: string
  ownerEmailId?: string
  aadharNumber?: string
  panNumber?: string
  serviceSince?: string
  workLocation?: string
}

interface AddContractorDraftInfoPopupProps {
  isOpen: boolean
  onClose: () => void
  onAddDraft?: () => void
}

const safeText = (v: unknown) => {
  if (v === null || v === undefined) return "-"
  const s = String(v).trim()
  return s ? s : "-"
}

export default function AddContractorDraftInfoPopup({ isOpen, onClose, onAddDraft }: AddContractorDraftInfoPopupProps) {
  const router = useRouter()
  const tenantCode = useGetTenantCode()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()

  const [searchText, setSearchText] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [searchField, setSearchField] = useState("contractorCode")
  const [rows, setRows] = useState<ContractorDraftRow[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const itemsPerPage = 5
  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage])
  const limit = itemsPerPage

  const criteriaRequests = useMemo(() => {
    const base = [
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
      { field: "createdOn", operator: "desc", value: "" },
    ]
    const q = debouncedSearch.trim()
    if (!q) return base
    return [...base, { field: searchField, operator: "like", value: q }]
  }, [tenantCode, debouncedSearch, searchField])

  const { refetch: refetchCount } = useRequest<any>({
    url: "draft/contractor/count",
    method: "POST",
    data: criteriaRequests,
    onSuccess: (data: any) => {
      if (data !== null && data !== undefined) {
        setTotalCount(Number(data) || 0)
      }
    },
    onError: (error) => {
      console.error("Error fetching draft contractor count:", error)
      setTotalCount(0)
    },
    dependencies: [tenantCode, debouncedSearch, searchField, isOpen],
  })

  const { loading, refetch } = useRequest<any>({
    url: `draft/contractor/search?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: criteriaRequests,
    onSuccess: (data: any) => {
      const list = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)
      setRows(
        list.map((c: any) => ({
          _id: String(c?._id?.$oid || c?._id || ""),
          contractorName: c?.contractorName || "",
          contractorCode: c?.contractorCode || "",
          ownerName: c?.ownerName || "",
          ownerContactNo: c?.ownerContactNo || "",
          ownerEmailId: c?.ownerEmailId || "",
          aadharNumber: c?.aadharNumber || "",
          panNumber: c?.panNumber || "",
          serviceSince: c?.serviceSince || "",
          workLocation: c?.workLocation || "",
        }))
      )
    },
    onError: (error) => {
      console.error("Error fetching draft contractors:", error)
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
    setSearchField("contractorCode")
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

  if (!isOpen) return null

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Draft Contractor Information</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Showing basic details from draft contractor records.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={onAddDraft}>
              Add Draft
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
          <div className="flex w-full max-w-[700px] overflow-hidden rounded-lg border bg-background">
            <div className="flex w-[240px] items-center border-r px-2 py-1.5">
              <SearchIcon className="w-4 h-4 text-muted-foreground mr-2" />
              <Select value={searchField} onValueChange={setSearchField}>
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contractorCode">Contractor Code</SelectItem>
                  <SelectItem value="contractorName">Contractor Name</SelectItem>
                  <SelectItem value="ownerName">Owner Name</SelectItem>
                  <SelectItem value="ownerContactNo">Owner Contact No</SelectItem>
                  <SelectItem value="aadharNumber">Aadhar Number</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[460px] items-center">
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
            <Table className="min-w-[1800px]">
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Sl No</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Contractor Code</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Contractor Name</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Owner Name</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Owner Contact</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Owner Email</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Aadhar Number</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">PAN Number</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Service Since</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Work Location</TableHead>
                  <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right whitespace-nowrap sticky right-0 bg-slate-50 z-10">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell className="py-8 text-center text-gray-500" colSpan={11}>Loading contractors...</TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-8 text-center text-gray-500" colSpan={11}>No draft contractors found.</TableCell>
                  </TableRow>
                ) : (
                  rows.map((contractor, idx) => (
                    <TableRow key={`${contractor._id}-${idx}`} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors">
                      <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900 whitespace-nowrap">{startIndex + idx + 1}</TableCell>
                      <TableCell className="py-1.5 font-mono text-[11px] text-gray-900 whitespace-nowrap">{safeText(contractor.contractorCode)}</TableCell>
                      <TableCell className="py-1.5 text-sm text-gray-900 whitespace-nowrap">{safeText(contractor.contractorName)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{safeText(contractor.ownerName)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{safeText(contractor.ownerContactNo)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{safeText(contractor.ownerEmailId)}</TableCell>
                      <TableCell className="py-1.5 font-mono text-[11px] text-gray-700 whitespace-nowrap">{safeText(contractor.aadharNumber)}</TableCell>
                      <TableCell className="py-1.5 font-mono text-[11px] text-gray-700 whitespace-nowrap">{safeText(contractor.panNumber)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{safeText(contractor.serviceSince)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{safeText(contractor.workLocation)}</TableCell>
                      <TableCell className="py-1.5 pr-4 text-right sticky right-0 bg-white z-10">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full"
                          title="Edit contractor"
                          onClick={() => {
                            const encryptedData = encryptEmployeeData({
                              employeeId: loginEmployeeId || "",
                              _id: contractor._id,
                            })
                            onClose()
                            router.push(`/contractor-management/contractor?form=temp&mode=edit&id=${encodeURIComponent(encryptedData)}`)
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
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
