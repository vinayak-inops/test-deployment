"use client"

import { useState, useMemo, useEffect } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { UserCheck, Plus, Trash2, Pencil, Filter, Search } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { type PfNominee } from "../../schemas/pf-nominee-form-schema"
import { PfNomineeFormPopup } from "./pf-nominee-form"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

type SearchField = "memberName" | "relation"

interface PfNomineesSectionFormProps {
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (payload: any) => void
}

export function PfNomineesSectionForm({
  mode = "add",
  employeeRecordId = null,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  onSubmit,
}: PfNomineesSectionFormProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedField, setSelectedField] = useState<SearchField>("memberName")
  const [page, setPage] = useState(1)
  const [pfNominees, setPfNominees] = useState<PfNominee[]>([])
  const pageSize = 5
  const tenantCode = useGetTenantCode()
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const canFetchPfNominees = Boolean(employeeRecordId) && currentMode !== "add"
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const { post: postPfNominees, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async () => {
      toast.success("PF nominees saved successfully!")
      void refetchPfNominees()
    },
    onError: (error) => {
      console.error("Error saving PF nominees:", error)
    },
  })

  const pfCriteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteriaRequests: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) {
      criteriaRequests.push({ field: "tenantCode", operator: "is", value: tenantCode })
    }
    return criteriaRequests
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedPfNominees, refetch: refetchPfNominees } = useAggregateArrayFetch<any>({
    collection: targetCollectionName,
    criteriaRequests: pfCriteriaRequests,
    arrayField: "pfNominee",
    enabled: canFetchPfNominees,
    defaultValue: [],
  })

  useEffect(() => {
    setPage(1)
  }, [pfNominees.length])

  useEffect(() => {
    if (!employeeRecordId || currentMode === "add") return
    void refetchPfNominees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeRecordId, currentMode, tenantCode])

  useEffect(() => {
    if (!employeeRecordId || currentMode === "add") return
    if (Array.isArray(fetchedPfNominees)) {
      setPfNominees(fetchedPfNominees as PfNominee[])
    }
  }, [employeeRecordId, currentMode, fetchedPfNominees])

  useEffect(() => {
    if (currentMode === "add") {
      setPfNominees([])
    }
  }, [currentMode])

  const openAdd = () => {
    setEditIndex(null)
    setIsFormOpen(true)
  }

  const openEdit = (index: number) => {
    setEditIndex(index)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditIndex(null)
  }

  const handlePopupSubmit = (next: PfNominee[]) => {
    setPfNominees(next)
    onSubmit?.({ pfNominee: next })
    closeForm()
  }

  const removeNominee = (index: number) => {
    const next = pfNominees.filter((_, i) => i !== index)
    const isEditMode = currentMode === "edit" && Boolean(employeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        pfNominee: next,
      },
    }
    postPfNominees(payload)
    setPfNominees(next)
    setDeleteIndex(null)
  }

  const getFilteredData = (): { row: PfNominee; index: number }[] => {
    const q = searchTerm.toLowerCase().trim()
    const rowsWithIndex = pfNominees.map((row, index) => ({ row, index })).reverse()
    if (!q) return rowsWithIndex
    return rowsWithIndex
      .filter(({ row }) => {
        const val =
          selectedField === "memberName"
            ? (row.memberName ?? "").toLowerCase()
            : (row.relation ?? "").toLowerCase()
        return val.includes(q)
      })
  }

  const filtered = useMemo(() => getFilteredData(), [pfNominees, searchTerm, selectedField])
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const initialValue =
    editIndex !== null && pfNominees[editIndex] ? pfNominees[editIndex] : null

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <UserCheck className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            PF Nominee ({pfNominees.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or edit PF nominees in the popup.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {pfNominees.length === 0 ? (
          <div className="border rounded-lg bg-gray-50 px-6 py-10 flex flex-col items-center justify-center text-center space-y-3">
            <p className="text-sm text-gray-700 font-medium">No PF nominees added yet.</p>
            <p className="text-xs text-gray-500 max-w-md">
              Use <span className="font-semibold">Add PF Nominee</span> to add details.
            </p>
            {!isViewMode && !postLoading && (
              <Button type="button" size="sm" className="mt-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={openAdd}>
                <Plus className="h-4 w-4 mr-1" />
                Add PF Nominee
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="flex bg-muted/50 rounded-lg border flex-1">
                <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                  <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                  <Select value={selectedField} onValueChange={(val: SearchField) => setSelectedField(val)}>
                    <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="memberName" className="text-sm">Nominee Name</SelectItem>
                      <SelectItem value="relation" className="text-sm">Relation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 flex items-center bg-background rounded-r-lg">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>
              {!isViewMode && (
                <Button
                  type="button"
                  size="default"
                  disabled={postLoading}
                  className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                  onClick={openAdd}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add PF Nominee
                </Button>
              )}
            </div>
            <div className="border rounded-lg bg-slate-50/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Nominee Name</TableHead>
                    <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Relation</TableHead>
                    <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Birth Date</TableHead>
                    <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Percentage</TableHead>
                    {!isViewMode && (
                      <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map(({ row, index }) => (
                    <TableRow key={`${row.memberName || "nominee"}-${index}`} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors">
                      <TableCell className="py-1.5 pl-4 text-sm text-gray-900">{row.memberName || "-"}</TableCell>
                      <TableCell className="py-1.5 text-sm text-gray-900">{row.relation || "-"}</TableCell>
                      <TableCell className="py-1.5 text-sm text-gray-900">{row.birthDate || "-"}</TableCell>
                      <TableCell className="py-1.5 text-sm text-gray-900">{row.percentage || "-"}</TableCell>
                      {!isViewMode && (
                        <TableCell className="py-1.5 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={postLoading}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-full"
                              onClick={() => openEdit(index)}
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={postLoading}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                              onClick={() => setDeleteIndex(index)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length > pageSize && (
                <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                  <p className="text-[11px] text-gray-500">
                    Showing <span className="font-semibold">{Math.min((page - 1) * pageSize + 1, filtered.length)}-{Math.min(page * pageSize, filtered.length)}</span> of <span className="font-semibold">{filtered.length}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[11px]" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      Prev
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[11px]" disabled={page * pageSize >= filtered.length} onClick={() => setPage((p) => (p * pageSize >= filtered.length ? p : p + 1))}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <PfNomineeFormPopup
        open={isFormOpen && !isViewMode && !postLoading}
        onClose={closeForm}
        initialValue={initialValue}
        onSubmit={handlePopupSubmit}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        employeeCollectionUrl={employeeCollectionUrl}
        pfNominees={pfNominees}
        editIndex={editIndex}
        refetchPfNominees={refetchPfNominees}
        disabled={isViewMode || postLoading}
      />


      {postLoading && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
          <div className="rounded-md bg-white shadow px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Saving permissions...</span>
          </div>
        </div>
      )}

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <UserCheck className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove PF nominee</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this nominee?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>Cancel</Button>
              <Button
                size="sm"
                disabled={postLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => removeNominee(deleteIndex)}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
