"use client"

import React, { useEffect, useMemo, useState } from "react"
import { X, Search as SearchIcon, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LeavePolicyDraftRow {
  _id: string
  leaveCode?: string
  leaveTitle?: string
  subsidiaryCode?: string
  locationCode?: string
  designationCode?: string
  employeeCategory?: string
}

interface AddLeavePolicyDraftInfoPopupProps {
  isOpen: boolean
  onClose: () => void
  onAddDraft?: () => void
}

const safeText = (v: unknown) => {
  if (v === null || v === undefined) return "-"
  const s = String(v).trim()
  return s ? s : "-"
}

export default function AddLeavePolicyDraftInfoPopup({ isOpen, onClose, onAddDraft }: AddLeavePolicyDraftInfoPopupProps) {
  const router = useRouter()
  const tenantCode = useGetTenantCode()

  const [searchText, setSearchText] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [searchField, setSearchField] = useState("leaveCode")
  const [rows, setRows] = useState<LeavePolicyDraftRow[]>([])
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
    url: "draft/leave_policy/count",
    method: "POST",
    data: criteriaRequests,
    onSuccess: (data: any) => {
      if (data !== null && data !== undefined) {
        setTotalCount(Number(data) || 0)
      }
    },
    onError: (error) => {
      console.error("Error fetching draft leave policy count:", error)
      setTotalCount(0)
    },
    dependencies: [tenantCode, debouncedSearch, searchField, isOpen],
  })

  const { loading, refetch } = useRequest<any>({
    url: `draft/leave_policy/search?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: criteriaRequests,
    onSuccess: (data: any) => {
      const list = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)
      setRows(
        list.map((item: any) => ({
          _id: String(item?._id?.$oid || item?._id || ""),
          leaveCode: item?.leavePolicy?.leaveCode || item?.leaveCode || "",
          leaveTitle: item?.leavePolicy?.leaveTitle || item?.leaveTitle || "",
          subsidiaryCode: item?.subsidiary?.subsidiaryCode || "",
          locationCode: item?.location?.locationCode || "",
          designationCode: item?.designation?.designationCode || "",
          employeeCategory: Array.isArray(item?.employeeCategory) ? item.employeeCategory.join(", ") : "",
        }))
      )
    },
    onError: (error) => {
      console.error("Error fetching draft leave policies:", error)
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
    setSearchField("leaveCode")
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
            <h3 className="text-sm font-semibold text-gray-900">Draft Leave Policy Information</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Showing basic details from draft leave policy records.</p>
          </div>
          <div className="flex items-center gap-2">
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
                  <SelectItem value="leaveCode">Leave Code</SelectItem>
                  <SelectItem value="leaveTitle">Leave Title</SelectItem>
                  <SelectItem value="subsidiary.subsidiaryCode">Subsidiary Code</SelectItem>
                  <SelectItem value="location.locationCode">Location Code</SelectItem>
                  <SelectItem value="designation.designationCode">Designation Code</SelectItem>
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
            <Table className="min-w-[1450px]">
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Sl No</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Leave Code</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Leave Title</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Subsidiary Code</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Location Code</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Designation Code</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Category Codes</TableHead>
                  <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right whitespace-nowrap sticky right-0 bg-slate-50 z-10">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell className="py-8 text-center text-gray-500" colSpan={8}>Loading leave policies...</TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-8 text-center text-gray-500" colSpan={8}>No draft leave policies found.</TableCell>
                  </TableRow>
                ) : (
                  rows.map((policy, idx) => (
                    <TableRow key={`${policy._id}-${idx}`} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors">
                      <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900 whitespace-nowrap">{startIndex + idx + 1}</TableCell>
                      <TableCell className="py-1.5 font-mono text-[11px] text-gray-900 whitespace-nowrap">{safeText(policy.leaveCode)}</TableCell>
                      <TableCell className="py-1.5 text-sm text-gray-900 whitespace-nowrap">{safeText(policy.leaveTitle)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{safeText(policy.subsidiaryCode)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{safeText(policy.locationCode)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{safeText(policy.designationCode)}</TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">{safeText(policy.employeeCategory)}</TableCell>
                      <TableCell className="py-1.5 pr-4 text-right sticky right-0 bg-white z-10">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full"
                          title="Edit leave policy"
                          onClick={() => {
                            onClose()
                            router.push(`/policy-management/leave-policy?form=temp&mode=edit&id=${encodeURIComponent(policy._id)}`)
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
