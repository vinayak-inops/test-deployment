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

interface StepContractorsProps {
  contractors: string[]
  contractorsData: any[]
  contractorsLoading: boolean
  onAdd: (code: string) => void
  onRemove: (code: string) => void
  onSave?: () => void
  loading?: boolean
  mode?: "add" | "edit" | "view"
  contextData?: any
}

export default function StepContractors({
  contractors,
  contractorsData,
  contractorsLoading,
  onAdd,
  onRemove,
  onSave,
  loading = false,
  mode = "add",
  contextData,
}: StepContractorsProps) {
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
  }, [contractors.length])

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
    post: postUserEntitlementCtr,
    loading: postLoading,
  } = usePostRequest<any>({
    url: 'userEntitlements',
    onSuccess: async () => {
      toast.success('Contractors updated successfully')
      await syncCurrentUserEntitlements()
      onSave?.()
    },
    onError: (error) => {
      console.error('❌ Error updating contractors:', error)
      toast.error('Failed to update contractors')
    },
  })

  // Filter for main table view (shows only selected contractors)
  const getFilteredContractors = () => {
    const query = searchTerm.toLowerCase().trim()
    if (!query) return contractors
    
    return contractors.filter((code) => {
      const contractor = contractorsData.find((c: any) => c.code === code)
      if (!contractor) return false
      
      if (selectedField === 'name') {
        return contractor.name?.toLowerCase().includes(query)
      }
      return contractor.code?.toLowerCase().includes(query)
    })
  }

  // Filter for popup (shows available contractors to add)
  const getFilteredAvailableContractors = () => {
    // Get contractors not already selected
    const availableContractors = contractorsData.filter(
      (ctr: any) => !contractors.includes(ctr.code)
    )
    
    const query = popupSearchTerm.toLowerCase().trim()
    if (!query) return availableContractors
    
    return availableContractors.filter((item: any) => {
      if (selectedField === 'name') {
        return item.name?.toLowerCase().includes(query)
      }
      return item.code?.toLowerCase().includes(query)
    })
  }

  const filteredContractors = getFilteredContractors()
  const filteredAvailableContractors = getFilteredAvailableContractors()

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <Shield className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Contractors</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Select contractors if applicable
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-4">
        {contractors.length === 0 ? (
          <div className="border rounded-lg bg-gray-50 px-6 py-10 flex flex-col items-center justify-center text-center space-y-3">
            <p className="text-sm text-gray-700 font-medium">
              No contractors selected.
            </p>
            <p className="text-xs text-gray-500 max-w-md">
              Use <span className="font-semibold">Add Contractor</span> to choose contractors for this assignment.
            </p>
            <Button
              type="button"
              onClick={() => {
                if (isReadOnly) return
                setAddSelectedCodes([])
                setPopupSearchTerm('') // Reset popup search when opening
                setIsAddPopupOpen(true)
              }}
              size="sm"
              className="mt-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={contractorsLoading || isReadOnly}
            >
              Add Contractor
            </Button>
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

              <Button
                type="button"
                onClick={() => {
                  if (isReadOnly) return
                  setAddSelectedCodes([])
                  setPopupSearchTerm('') // Reset popup search when opening
                  setIsAddPopupOpen(true)
                }}
                size="default"
                className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={contractorsLoading || isReadOnly}
              >
                Add Contractor
              </Button>
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
                    {!isReadOnly && (
                      <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContractors
                    .slice((page - 1) * pageSize, page * pageSize)
                    .map((code) => {
                    const ctr = contractorsData.find((c: any) => c.code === code)
                    return (
                      <TableRow
                        key={code}
                        className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                      >
                        <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                          {code}
                        </TableCell>
                        <TableCell className="py-1.5 text-sm text-gray-900">
                          {ctr?.name || code}
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
                  {filteredContractors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isReadOnly ? 2 : 3} className="text-center py-8 text-gray-500 text-sm">
                        No contractors found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {/* Pagination */}
              {filteredContractors.length > pageSize && (
                <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                  <p className="text-[11px] text-gray-500">
                    Showing{' '}
                    <span className="font-semibold">
                      {Math.min((page - 1) * pageSize + 1, filteredContractors.length)}-
                      {Math.min(page * pageSize, filteredContractors.length)}
                    </span>{' '}
                    of <span className="font-semibold">{filteredContractors.length}</span>
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
                      disabled={page * pageSize >= filteredContractors.length}
                      onClick={() =>
                        setPage((p) =>
                          p * pageSize >= filteredContractors.length ? p : p + 1
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

      {/* Add Contractor Popup */}
      {isAddPopupOpen && !isReadOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-lg">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <Shield className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Add Contractor</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Choose a contractor from the list below and click Save.
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
                {filteredAvailableContractors.length > 0 && (
                  <div className="flex items-center justify-between px-2 py-1.5 mt-2 mb-1 border border-dashed border-gray-200 rounded-md bg-gray-50">
                    <button
                      type="button"
                      onClick={() => {
                        const allCodes = filteredAvailableContractors.map((ctr: any) => ctr.code)
                        const allSelected = allCodes.every((code: string) => addSelectedCodes.includes(code))
                        if (allSelected) {
                          // Deselect all visible
                          setAddSelectedCodes(prev => prev.filter(code => !allCodes.includes(code)))
                        } else {
                          // Select all visible (merge, avoid duplicates)
                          setAddSelectedCodes(prev => Array.from(new Set([...prev, ...allCodes])))
                        }
                      }}
                      className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                    >
                      <Check
                        className={`h-4 w-4 rounded-sm border ${
                          filteredAvailableContractors.length > 0 &&
                          filteredAvailableContractors.every((ctr: any) => addSelectedCodes.includes(ctr.code))
                            ? 'opacity-100 text-green-600 border-green-500'
                            : 'opacity-70 text-transparent border-gray-300'
                        }`}
                      />
                      <span>Select all ({filteredAvailableContractors.length})</span>
                    </button>
                  </div>
                )}

                <CommandList className="max-h-[260px] mt-2">
                  <CommandEmpty>No contractors found.</CommandEmpty>
                  <CommandGroup>
                    {filteredAvailableContractors.map((ctr: any) => (
                      <CommandItem
                        key={ctr.code}
                        value={ctr.code}
                        onSelect={() => {
                          setAddSelectedCodes(prev =>
                            prev.includes(ctr.code)
                              ? prev.filter((c) => c !== ctr.code)
                              : [...prev, ctr.code]
                          )
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 rounded-sm border ${
                            addSelectedCodes.includes(ctr.code)
                              ? 'opacity-100 text-green-600 border-green-500'
                              : 'opacity-70 text-transparent border-gray-300'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{ctr.name}</div>
                          <div className="text-xs text-gray-500">Code: {ctr.code}</div>
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
                      if (!contractors.includes(code)) {
                        onAdd(code)
                      }
                    })

                    const base: any = contextData && typeof contextData === 'object' ? contextData : {}
                    const isUpdate = !!(base?._id)
                    const existingCtrs = Array.isArray(base.contractors) ? base.contractors : contractors
                    const finalCtrs = Array.from(new Set([...existingCtrs, ...addSelectedCodes]))

                    const backendPayload: any = {
                      ...base,
                      contractors: finalCtrs,
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

                    await postUserEntitlementCtr(json)

                    setIsAddPopupOpen(false)
                    setAddSelectedCodes([])
                    setPopupSearchTerm('')
                  }
                }}
              >
                Save Contractor
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
                <h3 className="text-sm font-semibold text-red-900">Remove Contractor</h3>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Are you sure you want to remove this contractor from the assignment?
                </p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-gray-700">
                Contractor code: <span className="font-mono font-semibold">{deleteTarget}</span>
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
                    const updatedCtrs = contractors.filter((c) => c !== deleteTarget)

                    const backendPayload: any = {
                      ...base,
                      contractors: updatedCtrs,
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

                    await postUserEntitlementCtr(json)

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