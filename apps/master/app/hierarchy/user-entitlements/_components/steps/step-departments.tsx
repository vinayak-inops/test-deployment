"use client"

import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Shield, Trash2, Filter, Search as SearchIcon, X, AlertTriangle } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Label } from '@repo/ui/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/components/ui/command'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table'
import { Input } from '@repo/ui/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select'
import { usePostRequest } from '@repo/ui/hooks/api/usePostRequest'
import { useGetTenantCode } from '@/hooks/api/search/useGetTenantCode'
import { useKeyclockRoleInfo } from '@/hooks/api/search/keyclock-role-info'
import { useFetchUserEntitlements } from '@/hooks/hierarchy/useFetchUserEntitlements'
import { toast } from 'react-toastify'
import { getCurrentTimeIST } from '@/utils/time/time-control'

interface StepDepartmentsProps {
  departments: string[]
  departmentsData: any[]
  departmentsLoading: boolean
  divisions: string[]
  onAdd: (code: string) => void
  onRemove: (code: string) => void
  onSave?: () => void
  loading?: boolean
  mode?: "add" | "edit" | "view"
  contextData?: any
}

export default function StepDepartments({
  departments,
  departmentsData,
  departmentsLoading,
  divisions,
  onAdd,
  onRemove,
  onSave,
  loading = false,
  mode = "add",
  contextData,
}: StepDepartmentsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [popupSearchTerm, setPopupSearchTerm] = useState('') // Separate state for popup search
  const [selectedField, setSelectedField] = useState<'code' | 'name'>('code')
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false)
  const [addSelectedCodes, setAddSelectedCodes] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isReadOnly = mode === "view"
  const [page, setPage] = useState(1)
  const pageSize = 5

  useEffect(() => {
    setPage(1)
  }, [departments.length])

  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  const { fetchUserEntitlements } = useFetchUserEntitlements()

  const syncCurrentUserEntitlements = async () => {
    const updatedEmployeeId = String(contextData?.employeeID ?? '').trim()
    const loggedInEmployeeId = String(employeeId ?? '').trim()

    if (!updatedEmployeeId || !loggedInEmployeeId || updatedEmployeeId !== loggedInEmployeeId) {
      return
    }

    await fetchUserEntitlements({ userId: updatedEmployeeId })
  }

  const {
    post: postUserEntitlementDept,
    loading: postLoading,
  } = usePostRequest<any>({
    url: 'userEntitlements',
    onSuccess: async () => {
      toast.success('Departments updated successfully')
      await syncCurrentUserEntitlements()
      onSave?.()
    },
    onError: (error) => {
      console.error('❌ Error updating departments:', error)
      toast.error('Failed to update departments')
    },
  })

  // Filter for main table view (shows only selected departments)
  const getFilteredDepartments = () => {
    const query = searchTerm.toLowerCase().trim()
    if (!query) return departments
    
    return departments.filter((code) => {
      const department = departmentsData.find((d: any) => d.code === code)
      if (!department) return false
      
      if (selectedField === 'name') {
        return department.name?.toLowerCase().includes(query)
      }
      return department.code?.toLowerCase().includes(query)
    })
  }

  // Filter for popup (shows available departments to add)
  const getFilteredAvailableDepartments = () => {
    // Get departments not already selected
    const availableDepartments = departmentsData.filter(
      (dept: any) => !departments.includes(dept.code)
    )
    
    const query = popupSearchTerm.toLowerCase().trim()
    if (!query) return availableDepartments
    
    return availableDepartments.filter((item: any) => {
      if (selectedField === 'name') {
        return item.name?.toLowerCase().includes(query)
      }
      return item.code?.toLowerCase().includes(query)
    })
  }

  const filteredDepartments = getFilteredDepartments()
  const filteredAvailableDepartments = getFilteredAvailableDepartments()

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <Shield className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Departments</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Select departments under divisions
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-4">
        {divisions.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            Please select divisions first in Step 3
          </div>
        )}

        {departments.length === 0 ? (
          <div className="border rounded-lg bg-gray-50 px-6 py-10 flex flex-col items-center justify-center text-center space-y-3">
            <p className="text-sm text-gray-700 font-medium">
              No departments selected.
            </p>
            <p className="text-xs text-gray-500 max-w-md">
              Use <span className="font-semibold">Add Department</span> to choose departments under the selected divisions.
            </p>
            {!isReadOnly && (
              <Button
                type="button"
                onClick={() => {
                  setAddSelectedCodes([])
                  setPopupSearchTerm('') // Reset popup search when opening
                  setIsAddPopupOpen(true)
                }}
                size="sm"
                className="mt-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={departmentsLoading || divisions.length === 0}
              >
                Add Department
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Filter + Add row */}
            <div className="flex items-center gap-4">
              <div className="flex bg-muted/50 rounded-lg border flex-1">
                {/* Field Selection */}
                <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                  <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                  <Select
                    value={selectedField}
                    onValueChange={(val: 'code' | 'name') => {
                      setSelectedField(val)
                      setSearchTerm('') // Clear search when changing field
                    }}
                  >
                    <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code" className="text-sm">
                        Code
                      </SelectItem>
                      <SelectItem value="name" className="text-sm">
                        Name
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Field */}
                <div className="flex-1 flex items-center bg-background rounded-r-lg">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={`Search by ${selectedField === 'code' ? 'code' : 'name'}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {!isReadOnly && (
                <Button
                  type="button"
                  onClick={() => {
                    setAddSelectedCodes([])
                    setPopupSearchTerm('') // Reset popup search when opening
                    setIsAddPopupOpen(true)
                  }}
                  size="default"
                  className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                  disabled={departmentsLoading || divisions.length === 0}
                >
                  Add Department
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="border rounded-lg bg-slate-50/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Code
                    </TableHead>
                    <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Name
                    </TableHead>
                    <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Division
                    </TableHead>
                    <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Locations
                    </TableHead>
                    {!isReadOnly && (
                      <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartments
                    .slice((page - 1) * pageSize, page * pageSize)
                    .map((code) => {
                    const dept = departmentsData.find((d: any) => d.code === code)
                    return (
                      <TableRow
                        key={code}
                        className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                      >
                        <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                          {code}
                        </TableCell>
                        <TableCell className="py-1.5 text-sm text-gray-900">
                          {dept?.name || code}
                        </TableCell>
                        <TableCell className="py-1.5 font-mono text-[11px] text-gray-700">
                          {dept?.divisionCode || '-'}
                        </TableCell>
                        <TableCell className="py-1.5">
                          {dept?.locationCodes?.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {dept.locationCodes.map((loc: string) => (
                                <span
                                  key={loc}
                                  className="text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                                >
                                  {loc}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">No locations</span>
                          )}
                        </TableCell>
                        {!isReadOnly && (
                          <TableCell className="py-1.5 pr-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                              onClick={() => {
                                setDeleteTarget(code)
                                setShowDeleteConfirm(true)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                  {filteredDepartments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isReadOnly ? 4 : 5} className="text-center py-8 text-gray-500 text-sm">
                        No departments found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {/* Pagination */}
              {filteredDepartments.length > pageSize && (
                <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                  <p className="text-[11px] text-gray-500">
                    Showing{' '}
                    <span className="font-semibold">
                      {Math.min((page - 1) * pageSize + 1, filteredDepartments.length)}-
                      {Math.min(page * pageSize, filteredDepartments.length)}
                    </span>{' '}
                    of <span className="font-semibold">{filteredDepartments.length}</span>
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
                      disabled={page * pageSize >= filteredDepartments.length}
                      onClick={() =>
                        setPage((p) =>
                          p * pageSize >= filteredDepartments.length ? p : p + 1
                        )
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Department Popup */}
      {isAddPopupOpen && !isReadOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-lg">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <Shield className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Add Department</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Choose a department from the list below and click Save.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddPopupOpen(false)
                  setAddSelectedCodes([])
                  setPopupSearchTerm('')
                }}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 max-h-[320px] overflow-y-auto">
              <Command>
                <CommandInput
                  placeholder={`Search by ${selectedField === 'code' ? 'code' : 'name'}...`}
                  value={popupSearchTerm}
                  onValueChange={setPopupSearchTerm}
                />
                {/* Non-scrollable Select All bar */}
                {filteredAvailableDepartments.length > 0 && (
                  <div className="flex items-center justify-between px-2 py-1.5 mt-2 mb-1 border border-dashed border-gray-200 rounded-md bg-gray-50">
                    <button
                      type="button"
                      onClick={() => {
                        const allCodes = filteredAvailableDepartments.map((dept: any) => dept.code)
                        const allSelected = allCodes.every((code: string) => addSelectedCodes.includes(code))
                        if (allSelected) {
                          setAddSelectedCodes(prev => prev.filter(code => !allCodes.includes(code)))
                        } else {
                          setAddSelectedCodes(prev => Array.from(new Set([...prev, ...allCodes])))
                        }
                      }}
                      className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                    >
                      <Check
                        className={`h-4 w-4 rounded-sm border ${
                          filteredAvailableDepartments.length > 0 &&
                          filteredAvailableDepartments.every((dept: any) => addSelectedCodes.includes(dept.code))
                            ? 'opacity-100 text-green-600 border-green-500'
                            : 'opacity-70 text-transparent border-gray-300'
                        }`}
                      />
                      <span>Select all ({filteredAvailableDepartments.length})</span>
                    </button>
                  </div>
                )}

                <CommandList className="max-h-[260px] mt-2">
                  <CommandEmpty>No departments found.</CommandEmpty>
                  <CommandGroup>
                    {filteredAvailableDepartments.map((dept: any) => (
                      <CommandItem
                        key={dept.code}
                        value={dept.code}
                        onSelect={() => {
                          setAddSelectedCodes(prev =>
                            prev.includes(dept.code)
                              ? prev.filter((c) => c !== dept.code)
                              : [...prev, dept.code]
                          )
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 rounded-sm border ${
                            addSelectedCodes.includes(dept.code)
                              ? 'opacity-100 text-green-600 border-green-500'
                              : 'opacity-70 text-transparent border-gray-300'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{dept.name}</div>
                          <div className="text-xs text-gray-500">Code: {dept.code}</div>
                          {dept.locationCodes?.length > 0 && (
                            <div className="text-[11px] text-gray-400">
                              Locations: {dept.locationCodes.join(', ')}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="mr-2"
                onClick={() => {
                  setIsAddPopupOpen(false)
                  setAddSelectedCodes([])
                  setPopupSearchTerm('')
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={addSelectedCodes.length === 0 || postLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={async () => {
                  if (addSelectedCodes.length) {
                    // optimistic add
                    addSelectedCodes.forEach((code) => {
                      if (!departments.includes(code)) {
                        onAdd(code)
                      }
                    })

                    const base: any = contextData && typeof contextData === 'object' ? contextData : {}
                    const isUpdate = !!(base?._id)
                    const existingDepts = Array.isArray(base.departments) ? base.departments : departments
                    const finalDepts = Array.from(new Set([...existingDepts, ...addSelectedCodes]))

                    const backendPayload: any = {
                      ...base,
                      departments: finalDepts,
                    }

                    // Handle createdBy/updatedBy properly
                    if (!isUpdate) {
                      backendPayload.createdBy = getCurrentTimeIST()
                    } else {
                      // Preserve existing createdBy if it exists
                      if (base.createdBy) {
                        backendPayload.createdBy = base.createdBy
                      } else {
                        backendPayload.createdBy = getCurrentTimeIST()
                      }
                      // Always set updatedBy when updating
                      backendPayload.updatedBy = getCurrentTimeIST()
                    }

                    const action = isUpdate ? 'insert' : 'insert'

                    const json = {
                      tenant: tenantCode,
                      action,
                      _id: base?._id || null,
                      collectionName: 'userEntitlements',
                      data: backendPayload,
                    }

                    await postUserEntitlementDept(json)

                    setIsAddPopupOpen(false)
                    setAddSelectedCodes([])
                    setPopupSearchTerm('')
                  }
                }}
              >
                Save Department
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
                <h3 className="text-sm font-semibold text-red-900">Remove Department</h3>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Are you sure you want to remove this department from the assignment?
                </p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-gray-700">
                Department code: <span className="font-mono font-semibold">{deleteTarget}</span>
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
                    const isUpdate = !!(base?._id)
                    const updatedDepts = departments.filter((c) => c !== deleteTarget)

                    const backendPayload: any = {
                      ...base,
                      departments: updatedDepts,
                    }

                    // Handle createdBy/updatedBy properly
                    if (!isUpdate) {
                      backendPayload.createdBy = getCurrentTimeIST()
                    } else {
                      // Preserve existing createdBy if it exists
                      if (base.createdBy) {
                        backendPayload.createdBy = base.createdBy
                      } else {
                        backendPayload.createdBy = getCurrentTimeIST()
                      }
                      // Always set updatedBy when updating
                      backendPayload.updatedBy = getCurrentTimeIST()
                    }

                    const action = isUpdate ? 'insert' : 'insert'

                    const json = {
                      tenant: tenantCode,
                      action,
                      _id: base?._id || null,
                      collectionName: 'userEntitlements',
                      data: backendPayload,
                    }

                    await postUserEntitlementDept(json)

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