"use client"

import React, { useEffect, useMemo, useState } from "react"
import { BookOpen, Filter, Search as SearchIcon, Edit, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { toast } from "react-toastify"
import type { TrainingItem } from "../types"
import TrainingFormPopup from "../forms/training-form-popup"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"

type CrudPermission = {
  view: boolean
  edit: boolean
  add: boolean
  delete: boolean
}

interface StepCategoryTrainingsProps {
  trainings: TrainingItem[]
  mode?: "add" | "edit" | "view"
  recordId?: string | null
  onServerRefresh?: () => void
  permission?: Partial<CrudPermission>
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return dateString
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
  } catch {
    return dateString
  }
}

export default function StepCategoryTrainings({
  trainings,
  mode = "edit",
  recordId,
  onServerRefresh,
  permission,
}: StepCategoryTrainingsProps) {
  const isReadOnly = mode === "view"
  // In this detail screen, adding a training row is part of "editing" the same parent record.
  // So allow Add Training when user has edit OR add permission; always block in view mode.
  const canAdd = (!!permission?.edit || !!permission?.add) && !isReadOnly
  const canEdit = !!permission?.edit && !isReadOnly
  // Delete should depend on edit + delete permission together
  const canDelete = !!permission?.edit && !!permission?.delete && !isReadOnly

  const tenantCode = useGetTenantCode()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"add" | "edit">("add")
  const [editItem, setEditItem] = useState<TrainingItem | undefined>(undefined)
  const [editOriginalCode, setEditOriginalCode] = useState<string | undefined>(undefined)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const [serverTrainings, setServerTrainings] = useState<TrainingItem[]>([])
  const [serverRecord, setServerRecord] = useState<any>(null)
  const effectiveTrainings = useMemo(() => {
    // Prefer server trainings when recordId is available (edit/view screen)
    if (recordId) return serverTrainings
    return trainings || []
  }, [recordId, serverTrainings, trainings])

  const detailCriteria = useMemo(() => {
    if (!recordId) return []
    return [
      { field: "_id", operator: "is", value: recordId },
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
    ]
  }, [recordId, tenantCode])

  const { refetch: refetchDetail, loading: detailLoading } = useRequest<any[]>({
    url: recordId ? "employee_category_training_details/search" : "",
    method: "POST",
    data: detailCriteria,
    dependencies: [], // manual
    onSuccess: (data: any) => {
      const list = Array.isArray(data) ? data : []
      const first = list[0] || null
      const tr = Array.isArray(first?.traninings) ? first.traninings : []
      setServerTrainings(tr as TrainingItem[])
      setServerRecord(first)
    },
    onError: (e: any) => {
      console.error(e)
      setServerTrainings([])
      setServerRecord(null)
    },
  })

  const { post: postUpsert, loading: posting } = usePostRequest<any>({
    url: "employee_category_training_details",
    onSuccess: async () => {
      toast.success("Updated successfully")
      if (recordId) {
        await refetchDetail()
      }
      await onServerRefresh?.()
    },
    onError: (e) => {
      toast.error("Failed to update")
      console.error(e)
    },
  })

  useEffect(() => {
    if (!recordId) return
    if (!tenantCode) return
    void refetchDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId, tenantCode])

  useEffect(() => {
    setPage(1)
  }, [effectiveTrainings?.length])

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return effectiveTrainings || []
    return (effectiveTrainings || []).filter((t) => {
      const code = (t.trainingCode || "").toLowerCase()
      const name = (t.trainingName || "").toLowerCase()
      return code.includes(q) || name.includes(q)
    })
  }, [effectiveTrainings, searchTerm])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <BookOpen className="h-4 w-4 text-gray-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Trainings</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Training list mapped to this employee category
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!canAdd || posting}
          onClick={() => {
            setFormMode("add")
            setEditItem(undefined)
            setEditOriginalCode(undefined)
            setIsFormOpen(true)
          }}
        >
          Add Training
        </Button>
      </div>

      <div className="px-6 py-4 space-y-4">
        {recordId && detailLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Loading trainings...
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex bg-muted/50 rounded-lg border flex-1">
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
              <Filter className="w-4 h-4 text-muted-foreground mr-2" />
              <Select value="training">
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training" className="text-sm">
                    Training
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex items-center bg-background rounded-r-lg">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by training code/name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg bg-slate-50/40 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                  Training Code
                </TableHead>
                <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                  Training Name
                </TableHead>
                <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap min-w-[260px]">
                  Description
                </TableHead>
                <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                  Start Date
                </TableHead>
                <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                  End Date
                </TableHead>
                <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                  Valid Till
                </TableHead>
                <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                  Notify Prior Days
                </TableHead>
                <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                  Blocking
                </TableHead>
                <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                  Notification
                </TableHead>
                {(canEdit || canDelete) && (
                  <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right whitespace-nowrap sticky right-0 bg-slate-50 z-10">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length > 0 ? (
                paginated.map((t, idx) => {
                  const isEven = idx % 2 === 1
                  return (
                    <TableRow
                      key={`${t.trainingCode || "row"}-${idx}`}
                      className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                    >
                      <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900 whitespace-nowrap">
                        {t.trainingCode || "-"}
                      </TableCell>
                      <TableCell className="py-1.5 text-sm text-gray-900 whitespace-nowrap">
                        {t.trainingName || "-"}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700">
                        {(() => {
                          const key = String(t.trainingCode || idx)
                          const raw = (t.trainingDescrition ?? "").toString().trim()
                          if (!raw) return "-"

                          const maxLen = 90
                          const isLong = raw.length > maxLen
                          const isExpanded = !!expandedDescriptions[key]
                          const shown = isLong && !isExpanded ? `${raw.slice(0, maxLen)}…` : raw

                          return (
                            <div className="flex items-start gap-2">
                              <span className="break-words">{shown}</span>
                              {isLong && (
                                <button
                                  type="button"
                                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setExpandedDescriptions((prev) => ({
                                      ...prev,
                                      [key]: !prev[key],
                                    }))
                                  }}
                                >
                                  {isExpanded ? "Read less" : "Read more"}
                                </button>
                              )}
                            </div>
                          )
                        })()}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {formatDate(t.startDate)}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {formatDate(t.endDate)}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {formatDate(t.validTill)}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {typeof t.notifyPriorDays === "number" ? t.notifyPriorDays : "-"}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {typeof t.blockingEnabled === "boolean" ? (t.blockingEnabled ? "Yes" : "No") : "-"}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {typeof t.notificationEnabled === "boolean" ? (t.notificationEnabled ? "Yes" : "No") : "-"}
                      </TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell className={`py-1.5 pr-4 text-right sticky right-0 z-10 ${isEven ? 'bg-slate-50/60' : 'bg-white'}`}>
                          <div className="flex justify-end gap-1">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-full"
                                onClick={async () => {
                                  const code = t.trainingCode || ""
                                  if (!code) {
                                    toast.error("Training code not found.")
                                    return
                                  }
                                  setFormMode("edit")
                                  setEditOriginalCode(code)

                                  // Always take latest from server if recordId is available
                                  if (recordId) {
                                    await refetchDetail()
                                    const latest = (serverTrainings || []).find((x) => (x.trainingCode || "") === code)
                                    setEditItem(latest || t)
                                  } else {
                                    setEditItem(t)
                                  }

                                  setIsFormOpen(true)
                                }}
                                title="Edit"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                                onClick={async () => {
                                  const code = t.trainingCode || ""
                                  if (!code) {
                                    toast.error("Training code not found.")
                                    return
                                  }
                                  setDeleteTarget(code)
                                  setShowDeleteConfirm(true)
                                }}
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={(canEdit || canDelete) ? 10 : 9} className="py-8 text-center text-sm text-gray-500">
                    No trainings found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {filtered.length > pageSize && (
            <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
              <p className="text-[11px] text-gray-500">
                Showing{" "}
                <span className="font-semibold">
                  {Math.min((page - 1) * pageSize + 1, filtered.length)}-
                  {Math.min(page * pageSize, filtered.length)}
                </span>{" "}
                of <span className="font-semibold">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {(canAdd || canEdit) && (
        <TrainingFormPopup
          isOpen={isFormOpen}
          mode={formMode}
          initialValues={formMode === "edit" ? editItem : undefined}
          onClose={() => setIsFormOpen(false)}
          onSubmit={async (item) => {
            if (!recordId) {
              toast.error("Record id not found.")
              return
            }
            if (!serverRecord) {
              toast.error("Record data not loaded yet. Please try again.")
              return
            }
            const current = serverTrainings || []
            const nextCode = (item.trainingCode || "").trim()
            if (!nextCode) {
              toast.error("Training code is required.")
              return
            }

            let updated = [...current]

            if (formMode === "edit" && editOriginalCode) {
              const idx = updated.findIndex((x) => (x.trainingCode || "") === editOriginalCode)
              if (idx === -1) {
                toast.error("Training not found.")
                return
              }
              // Code cannot change in edit
              updated[idx] = { ...updated[idx], ...item, trainingCode: editOriginalCode }
            } else {
              const exists = updated.some((x) => (x.trainingCode || "") === nextCode)
              if (exists) {
                toast.error(`Training code "${nextCode}" already exists.`)
                return
              }
              updated = [{ ...item, trainingCode: nextCode }, ...updated]
            }

            const payload = {
              tenant: tenantCode,
              action: "insert",
              id: recordId,
              collectionName: "employee_category_training_details",
              data: {
                ...serverRecord,
                createdBy: (serverRecord as any)?.createdBy ?? (loginEmployeeId || ""),
                createdOn: (serverRecord as any)?.createdOn ?? new Date().toISOString(),
                traninings: updated,
                updatedBy: loginEmployeeId || "",
                updatedOn: new Date().toISOString(),
              },
            }

            await postUpsert(payload)
            setIsFormOpen(false)
          }}
        />
      )}

      {/* Delete confirmation popup (same style pattern as StepLeaveApprovers) */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Delete Training</h3>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Are you sure you want to delete this training?
                </p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-gray-700">
                Training Code: <span className="font-mono font-semibold">{deleteTarget}</span>
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteTarget(null)
                  }}
                  className="px-3 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (!recordId) {
                        toast.error("Record id not found.")
                        return
                      }
                      if (!serverRecord) {
                        toast.error("Record data not loaded yet. Please try again.")
                        return
                      }
                      const current = serverTrainings || []
                      const updated = current.filter((x) => (x.trainingCode || "") !== deleteTarget)
                      const payload = {
                        tenant: tenantCode,
                        action: "insert",
                        id: recordId,
                        collectionName: "employee_category_training_details",
                        data: {
                          ...serverRecord,
                          // createdBy: (serverRecord as any)?.createdBy ?? (loginEmployeeId || ""),
                          // createdOn: (serverRecord as any)?.createdOn ?? new Date().toISOString(),
                          traninings: updated,
                          updatedBy: loginEmployeeId || "",
                          updatedOn: new Date().toISOString(),
                        },
                      }
                      await postUpsert(payload)
                      setShowDeleteConfirm(false)
                      setDeleteTarget(null)
                    } catch (e) {
                      console.error(e)
                      toast.error("Failed to delete training.")
                    }
                  }}
                  className="px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


