"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { BookOpen, Filter, Search as SearchIcon, X, AlertTriangle } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select'
import { usePostRequest } from '@repo/ui/hooks/api/usePostRequest'
import { useGetTenantCode } from '@/hooks/api/search/useGetTenantCode'
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { toast } from 'react-toastify'
import { getCurrentTimeIST } from '@/utils/time/time-control'
import { useQuery, gql } from '@apollo/client'
import { client } from '@repo/ui/hooks/api/dynamic-graphql'
import CompletedTrainingsTable from './completed-trainings-table'
import AvailableTrainingsTable from './available-trainings-table'

interface StepTrainingsProps {
  trainings: string[]
  onAdd: (trainingCode: string) => void
  onRemove: (trainingCode: string) => void
  onSave?: () => void
  mode?: "add" | "edit" | "view"
  contextData?: any
}

export default function StepTrainings({
  trainings,
  onAdd,
  onRemove,
  onSave,
  mode = "edit",
  contextData,
}: StepTrainingsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})

  const [trainingCodeSearch, setTrainingCodeSearch] = useState('')

  useEffect(() => {
    setPage(1)
  }, [trainings.length])

  const tenantCode = useGetTenantCode()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()

  // In view mode, the step should be read-only (Add/Remove disabled).
  const isReadOnly = useMemo(() => {
    return mode === "view"
  }, [mode])

  // Get employeeID from contextData to fetch employee category
  const employeeID = useMemo(() => {
    return contextData?.employeeID || ""
  }, [contextData])

  // GraphQL: Fetch contract employee to get category code
  const FETCH_CONTRACT_EMPLOYEE_CATEGORY = gql`
    query FetchContractEmployeeCategory(
      $criteriaRequests: [CriteriaRequest!]!
      $collection: String!
    ) {
      fetchEmployees(
        criteriaRequests: $criteriaRequests
        collection: $collection
      ) {
        employeeID
        deployment {
          employeeCategory {
            employeeCategoryCode
          }
        }
      }
    }
  `

  const employeeCategoryQueryVariables = useMemo(() => {
    if (!employeeID || !tenantCode) return undefined
    return {
      criteriaRequests: [
        { field: "employeeID", operator: "is", value: employeeID },
        { field: "tenantCode", operator: "is", value: tenantCode },
      ],
      collection: "contract_employee",
    }
  }, [employeeID, tenantCode])

  const { data: contractEmployeeData } = useQuery(FETCH_CONTRACT_EMPLOYEE_CATEGORY, {
    client,
    variables: employeeCategoryQueryVariables || {},
    skip: !employeeCategoryQueryVariables,
    fetchPolicy: 'network-only',
    onError: () => {},
  })

  // Extract employee category code
  const employeeCategoryCode = useMemo(() => {
    const rows = contractEmployeeData?.fetchEmployees
    if (!Array.isArray(rows) || rows.length === 0) return null
    return rows[0]?.deployment?.employeeCategory?.employeeCategoryCode || null
  }, [contractEmployeeData])

  // Get current page trainings
  const currentPageTrainings = useMemo(() => {
    const filtered = trainings.filter(
      (code) => !searchTerm || code.toLowerCase().includes(searchTerm.toLowerCase())
    )
    return [...filtered]
      .reverse()
      .slice((page - 1) * pageSize, page * pageSize)
      .map((code) => ({
        code,
      }))
  }, [trainings, searchTerm, page, pageSize])

  const {
    post: postTrainings,
    loading: postLoading,
  } = usePostRequest<any>({
    url: 'employee_training_completion',
    onSuccess: (data) => {
      
      toast.success('Trainings updated successfully')
      onSave?.()
    },
    onError: (error) => {
      console.error('❌ Error updating trainings:', error)
      toast.error('Failed to update trainings')
    },
  })

  const buildTrainingPayload = (nextTrainings: string[]) => {
    const base: any = contextData && typeof contextData === 'object' ? contextData : {}
    const isUpdate = !!base?._id
    const backendPayload: any = {
      ...base,
      trainingsCompleted: nextTrainings,
    }

    if (isUpdate) {
      backendPayload.createdBy = base.createdBy || loginEmployeeId
      backendPayload.createdOn = base.createdOn || getCurrentTimeIST()
      backendPayload.updatedBy = loginEmployeeId
      backendPayload.updatedOn = getCurrentTimeIST()
    } else {
      backendPayload.createdBy = loginEmployeeId
      backendPayload.createdOn = getCurrentTimeIST()
    }

    return {
      tenant: tenantCode,
      action: isUpdate ? 'update' : 'insert',
      ...(isUpdate ? { id: base._id } : {}),
      collectionName: 'employee_training_completion',
      data: backendPayload,
    }
  }

  const handleAddTraining = async (trainingCode: string) => {
    if (!trainings.includes(trainingCode)) {
      const base: any = contextData && typeof contextData === 'object' ? contextData : {}
      const existingTrainings = Array.isArray(base.trainingsCompleted)
        ? base.trainingsCompleted
        : trainings
      const finalTrainings = Array.from(new Set([...existingTrainings, trainingCode]))
      const payload = buildTrainingPayload(finalTrainings)
      await postTrainings(payload)
      onAdd(trainingCode)
      setIsAddPopupOpen(false)
      setTrainingCodeSearch('')
    }
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

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm w-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <BookOpen className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Trainings Completed</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Manage training codes completed by this employee
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {trainings.length === 0 ? (
          <div className="border rounded-lg bg-gray-50 px-5 py-10 flex flex-col items-center justify-center text-center space-y-3">
            <p className="text-sm text-gray-700 font-medium">
              No trainings completed.
            </p>
            <p className="text-xs text-gray-500 max-w-md">
              Use <span className="font-semibold">Add Training</span> to add training codes completed by this employee.
            </p>
            <Button
              type="button"
              onClick={() => {
                if (isReadOnly) return
                setTrainingCodeSearch('')
                setIsAddPopupOpen(true)
              }}
              size="sm"
              className="mt-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isReadOnly}
            >
              Add Training
            </Button>
          </div>
        ) : (
          <>
            {/* Filter + Add row */}
            <div className="flex items-center gap-4">
              <div className="flex bg-muted/50 rounded-lg border flex-1">
                <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                  <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                  <Select value="trainingCode">
                    <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trainingCode" className="text-sm">
                        Training Code
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 flex items-center bg-background rounded-r-lg">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by training code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => {
                  if (isReadOnly) return
                  setTrainingCodeSearch('')
                  setIsAddPopupOpen(true)
                }}
                size="default"
                className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isReadOnly}
              >
                Add Training
              </Button>
            </div>

            {trainings.length > 0 && (
              <>
                <CompletedTrainingsTable
                  rows={currentPageTrainings}
                  isReadOnly={isReadOnly}
                  expandedDescriptions={expandedDescriptions}
                  onToggleReadMore={(key, trainingCode, isExpanded) => {
                    setExpandedDescriptions((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }}
                  onDeleteClick={(trainingCode) => {
                    setDeleteTarget(trainingCode)
                    setShowDeleteConfirm(true)
                  }}
                  formatDate={formatDate}
                  tenantCode={tenantCode}
                  employeeCategoryCode={employeeCategoryCode}
                />
                {/* Pagination */}
                {trainings.filter((code) => !searchTerm || code.toLowerCase().includes(searchTerm.toLowerCase())).length > pageSize && (
                  <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                    <p className="text-[11px] text-gray-500">
                      Showing{' '}
                      <span className="font-semibold">
                        {Math.min((page - 1) * pageSize + 1, trainings.length)}-
                        {Math.min(page * pageSize, trainings.length)}
                      </span>{' '}
                      of <span className="font-semibold">{trainings.length}</span>
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
                        disabled={page * pageSize >= trainings.length}
                        onClick={() =>
                          setPage((p) =>
                            p * pageSize >= trainings.length ? p : p + 1
                          )
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Add Training Popup */}
      {isAddPopupOpen && !isReadOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-4xl">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <BookOpen className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Add Training Code</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Search and select a training code to add.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddPopupOpen(false)
                  setTrainingCodeSearch('')
                }}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="mb-4">
                <div className="flex bg-muted/50 rounded-lg border w-full">
                  <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                    <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                    <Select value="trainingCode">
                      <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trainingCode" className="text-sm">
                          Training Code
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 flex items-center bg-background rounded-r-lg">
                    <div className="relative flex-1">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search by training code..."
                        value={trainingCodeSearch}
                        onChange={(e) => setTrainingCodeSearch(e.target.value)}
                        className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Training List */}
              <AvailableTrainingsTable
                onAddTraining={handleAddTraining}
                formatDate={formatDate}
                tenantCode={tenantCode}
                employeeCategoryCode={employeeCategoryCode}
                searchTerm={trainingCodeSearch}
                selectedTrainingCodes={trainings}
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddPopupOpen(false)
                  setTrainingCodeSearch('')
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation popup */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove Training</h3>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Are you sure you want to remove this training?
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
                  disabled={postLoading}
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteTarget(null)
                  }}
                  className="px-3 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={postLoading}
                  onClick={async () => {
                    const updatedTrainings = trainings.filter((code) => code !== deleteTarget)
                    const payload = buildTrainingPayload(updatedTrainings)
                    await postTrainings(payload)

                    onRemove(deleteTarget)
                    setShowDeleteConfirm(false)
                    setDeleteTarget(null)
                  }}
                  className="px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

