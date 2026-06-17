"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Users, Trash2, Filter, Search as SearchIcon, AlertTriangle } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table'
import { Input } from '@repo/ui/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select'
import { usePostRequest } from '@repo/ui/hooks/api/usePostRequest'
import { useGetTenantCode } from '@/hooks/api/search/useGetTenantCode'
import { toast } from 'react-toastify'
import { getCurrentTimeIST } from '@/utils/time/time-control'
import { useQuery, gql } from '@apollo/client'
import { client } from '@repo/ui/hooks/api/dynamic-graphql'
import AddApproverPopup, { Employee } from './add-approver-popup'

interface StepShiftApproversProps {
  approvers: string[]
  onAdd: (employeeID: string) => void
  onRemove: (employeeID: string) => void
  onSave?: () => void
  mode?: "add" | "edit" | "view"
  contextData?: any
}

export default function StepShiftApprovers({
  approvers,
  onAdd,
  onRemove,
  onSave,
  mode = "edit",
  contextData,
}: StepShiftApproversProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [approversDeployment, setApproversDeployment] = useState<Record<string, any>>({})

  const [employeeIdSearch, setEmployeeIdSearch] = useState('')
  const [debouncedEmployeeIdSearch, setDebouncedEmployeeIdSearch] = useState('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedEmployeeIdSearch(employeeIdSearch)
    }, 500)
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current) }
  }, [employeeIdSearch])

  useEffect(() => {
    setPage(1)
  }, [approvers.length])

  // Note: don't clear `approversDeployment` on page/search change.
  // It causes intermittent "-" flicker while the next query is in-flight.

  const tenantCode = useGetTenantCode()

  const isReadOnly = useMemo(() => mode === "view", [mode])

  // GraphQL query for fetching multiple contract employees deployment details
  const FETCH_MULTIPLE_CONTRACT_EMPLOYEES_QUERY = gql`
    query FetchMultipleContractEmployees(
      $criteriaRequests: [CriteriaRequest!]!
      $collection: String!
    ) {
      fetchEmployees(
        criteriaRequests: $criteriaRequests
        collection: $collection
      ) {
        _id
        employeeID
        firstName
        middleName
        lastName
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
        }
      }
    }
  `

  // GraphQL query for fetching employees (for table display)
  const FETCH_EMPLOYEES_QUERY = gql`
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
      }
    }
  `

  // Build GraphQL query variables for employee search
  const employeesQueryVariables = useMemo(() => {
    const criteriaRequests: any[] = [
      {
        field: "tenantCode",
        operator: "is",
        value: tenantCode,
      }
    ]

    if (debouncedEmployeeIdSearch.trim()) {
      criteriaRequests.push({
        field: "employeeID",
        operator: "like",
        value: debouncedEmployeeIdSearch.trim()
      })
    }

    return {
      criteriaRequests,
      collection: "contract_employee",
      offset: 0,
      limit: 50,
    }
  }, [tenantCode, debouncedEmployeeIdSearch])

  // Fetch employees using GraphQL
  const { data: employeesData, loading: employeesLoading } = useQuery(FETCH_EMPLOYEES_QUERY, {
    client,
    variables: employeesQueryVariables,
    skip: !tenantCode,
    fetchPolicy: 'network-only',
  })

  const employees = useMemo(() => {
    if (!employeesData?.fetchEmployees || !Array.isArray(employeesData.fetchEmployees)) return []
    return employeesData.fetchEmployees
      .filter((emp: any) => !emp.isDeleted)
      .map((emp: any) => ({
        employeeID: emp.employeeID || '',
        name: [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(' ') || emp.employeeID,
      }))
  }, [employeesData])

  const filteredEmployees = useMemo(() => {
    const query = debouncedEmployeeIdSearch.toLowerCase().trim()
    if (!query) return employees
    return employees.filter((emp: any) =>
      emp.employeeID?.toLowerCase().includes(query) ||
      emp.name?.toLowerCase().includes(query)
    )
  }, [employees, debouncedEmployeeIdSearch])

  // Get current page approvers
  const currentPageApprovers = useMemo(() => {
    // Show newly added approvers on top (reverse display order)
    const filtered = approvers.filter(
      (id) => !searchTerm || id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    return [...filtered]
      .reverse()
      .slice((page - 1) * pageSize, page * pageSize)
  }, [approvers, searchTerm, page, pageSize])

  // Build GraphQL query variables for fetching deployment details of current page approvers
  const approversDeploymentQueryVariables = useMemo(() => {
    if (currentPageApprovers.length === 0) return undefined

    return {
      criteriaRequests: [
        {
          field: "employeeID",
          operator: "in",
          value: currentPageApprovers,
        },
        {
          field: "tenantCode",
          operator: "is",
          value: tenantCode,
        }
      ],
      collection: "contract_employee",
    }
  }, [currentPageApprovers, tenantCode])

  // Fetch deployment details for current page approvers using GraphQL
  const { data: approversDeploymentData, loading: approversDeploymentLoading } = useQuery(FETCH_MULTIPLE_CONTRACT_EMPLOYEES_QUERY, {
    client,
    variables: approversDeploymentQueryVariables || {},
    skip: !tenantCode || !approversDeploymentQueryVariables || currentPageApprovers.length === 0,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.fetchEmployees && Array.isArray(data.fetchEmployees)) {
        const deploymentMap: Record<string, any> = {}
        data.fetchEmployees.forEach((emp: any) => {
          if (emp.employeeID && emp.deployment) {
            deploymentMap[emp.employeeID] = emp.deployment
          }
        })
        setApproversDeployment(deploymentMap)
      }
    },
    onError: (error) => {
      console.error('Error fetching approvers deployment details:', error)
    },
  })

  const { post: postApprovers, loading: postLoading } = usePostRequest<any>({
    url: 'contract_employee_approver',
    onSuccess: () => {
      toast.success('Shift approvers updated successfully')
      onSave?.()
    },
    onError: (error) => {
      console.error('❌ Error updating shift approvers:', error)
      toast.error('Failed to update shift approvers')
    },
  })

  const approversAsEmployees = useMemo<Employee[]>(
    () => approvers.map((id) => ({ _id: '', employeeID: id })),
    [approvers]
  )

  const handleApproverSelect = async (mergedApprovers: Employee[]) => {
    const newEmployees = mergedApprovers.filter((e) => !approvers.includes(e.employeeID))
    if (newEmployees.length === 0) return

    newEmployees.forEach((e) => onAdd(e.employeeID))

    const base: any = contextData && typeof contextData === 'object' ? contextData : {}
    const isUpdate = !!(base?._id)
    const existingApprovers = Array.isArray(base.shiftApprover) ? base.shiftApprover : approvers
    const finalApprovers = Array.from(new Set([...existingApprovers, ...newEmployees.map((e) => e.employeeID)]))

    const backendPayload: any = {
      ...base,
      shiftApprover: finalApprovers,
    }

    if (!isUpdate) {
      backendPayload.createdBy = getCurrentTimeIST()
    } else {
      backendPayload.createdBy = base.createdBy || getCurrentTimeIST()
      backendPayload.updatedBy = getCurrentTimeIST()
    }

    await postApprovers({
      tenant: tenantCode,
      action: 'update',
      id: base?._id || null,
      collectionName: 'contract_employee_approver',
      data: {
        shiftApprover: finalApprovers,
      },
    })
  }

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <Users className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Shift Applicant</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Select employees who can approve shift requests
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-4">
        {approvers.length === 0 ? (
          <div className="border rounded-lg bg-gray-50 px-6 py-10 flex flex-col items-center justify-center text-center space-y-3">
            <p className="text-sm text-gray-700 font-medium">
              No shift approvers selected.
            </p>
            <p className="text-xs text-gray-500 max-w-md">
              Use <span className="font-semibold">Add Approver</span> to choose employees who can approve shift requests.
            </p>
            <Button
              type="button"
              onClick={() => { if (!isReadOnly) setIsAddPopupOpen(true) }}
              size="sm"
              className="mt-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isReadOnly}
            >
              Add Approver
            </Button>
          </div>
        ) : (
          <>
            {/* Filter + Add row */}
            <div className="flex items-center gap-4">
              <div className="flex bg-muted/50 rounded-lg border flex-1">
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
                <div className="flex-1 flex items-center bg-background rounded-r-lg">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by employee id..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => { if (!isReadOnly) setIsAddPopupOpen(true) }}
                size="default"
                className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isReadOnly}
              >
                Add Approver
              </Button>
            </div>

            {approvers.length > 0 && (
              <div className="border rounded-lg bg-slate-50/40 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                        Employee ID
                      </TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                        Name
                      </TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap min-w-[150px]">
                        Subsidiary
                      </TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap min-w-[150px]">
                        Division
                      </TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap min-w-[150px]">
                        Department
                      </TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap min-w-[150px]">
                        Designation
                      </TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap min-w-[120px]">
                        Grade
                      </TableHead>
                      {!isReadOnly && (
                        <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right whitespace-nowrap sticky right-0 bg-slate-50 z-10">
                          Actions
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approversDeploymentLoading && currentPageApprovers.length > 0 ? (
                      <TableRow>
                        <TableCell colSpan={!isReadOnly ? 8 : 7} className="py-8 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-gray-500">Loading deployment details...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentPageApprovers.map((employeeID, index) => {
                        const emp = employees.find((e: any) => e.employeeID === employeeID)
                        const deploymentRaw = approversDeployment[employeeID]
                        const deployment = Array.isArray(deploymentRaw) ? deploymentRaw[0] : deploymentRaw
                        const isEven = index % 2 === 1
                        return (
                          <TableRow
                            key={employeeID}
                            className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                          >
                            <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900 whitespace-nowrap">
                              {employeeID}
                            </TableCell>
                            <TableCell className="py-1.5 text-sm text-gray-900 whitespace-nowrap">
                              {emp?.name || employeeID}
                            </TableCell>
                            <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                              {deployment?.subsidiary?.subsidiaryName
                                ? `${deployment.subsidiary.subsidiaryName}${deployment.subsidiary.subsidiaryCode ? ` (${deployment.subsidiary.subsidiaryCode})` : ''}`
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                              {deployment?.division?.divisionName
                                ? `${deployment.division.divisionName}${deployment.division.divisionCode ? ` (${deployment.division.divisionCode})` : ''}`
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                              {deployment?.department?.departmentName
                                ? `${deployment.department.departmentName}${deployment.department.departmentCode ? ` (${deployment.department.departmentCode})` : ''}`
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                              {deployment?.designation?.designationName
                                ? `${deployment.designation.designationName}${deployment.designation.designationCode ? ` (${deployment.designation.designationCode})` : ''}`
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="py-1.5 text-xs text-gray-700 whitespace-nowrap">
                              {deployment?.grade?.gradeTitle
                                ? `${deployment.grade.gradeTitle}${deployment.grade.gradeCode ? ` (${deployment.grade.gradeCode})` : ''}`
                                : '-'
                              }
                            </TableCell>
                            {!isReadOnly && (
                              <TableCell className={`py-1.5 pr-4 text-right sticky right-0 z-10 ${isEven ? 'bg-slate-50/60' : 'bg-white'}`}>
                                <div className="flex justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                                    onClick={() => {
                                      setDeleteTarget(employeeID)
                                      setShowDeleteConfirm(true)
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
                {/* Pagination */}
                {approvers.filter((id) => !searchTerm || id.toLowerCase().includes(searchTerm.toLowerCase())).length > pageSize && (
                  <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                    <p className="text-[11px] text-gray-500">
                      Showing{' '}
                      <span className="font-semibold">
                        {Math.min((page - 1) * pageSize + 1, approvers.length)}-
                        {Math.min(page * pageSize, approvers.length)}
                      </span>{' '}
                      of <span className="font-semibold">{approvers.length}</span>
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
                        disabled={page * pageSize >= approvers.length}
                        onClick={() =>
                          setPage((p) =>
                            p * pageSize >= approvers.length ? p : p + 1
                          )
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <AddApproverPopup
        isOpen={isAddPopupOpen && !isReadOnly}
        onClose={() => setIsAddPopupOpen(false)}
        approvers={approversAsEmployees}
        onSelect={handleApproverSelect}
      />

      {/* Delete confirmation popup */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove Approver</h3>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Are you sure you want to remove this approver?
                </p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-gray-700">
                Employee ID: <span className="font-mono font-semibold">{deleteTarget}</span>
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
                    const base: any = contextData && typeof contextData === 'object' ? contextData : {}
                    const updatedApprovers = approvers.filter((id) => id !== deleteTarget)

                    await postApprovers({
                      tenant: tenantCode,
                      action: 'update',
                      id: base?._id || null,
                      collectionName: 'contract_employee_approver',
                      data: { shiftApprover: updatedApprovers },
                    })

                    onRemove(deleteTarget)
                    setShowDeleteConfirm(false)
                    setDeleteTarget(null)
                  }}
                  className="px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700"
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
