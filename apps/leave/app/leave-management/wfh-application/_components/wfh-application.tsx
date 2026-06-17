"use client"
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { Clock } from 'lucide-react'
import WfhApplicationTable from './wfh-application-table'
import WfhApplicationFilters from './wfh-application-filters'
import WfhRequestsPopup from './wfh-requests-popup'
import { useGetTenantCode } from '@/hooks/api/serach/useGetTenantCode'
import { useKeyclockRoleInfo } from '../../../../hooks/search/keyclock-role-info'
import { useRolePermissions } from '@/hooks/role-control/useRolePermissionsByScreenArray'

interface WfhApplicationProps {
  isSelfPermission?: boolean
  isAllPermission?: boolean
  isApprovalPermission?: boolean
}

export default function WfhApplication({ isSelfPermission = false, isAllPermission = false, isApprovalPermission: _isApprovalPermission = false }: WfhApplicationProps) {
  const [wfhApplications, setWfhApplications] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'failed'>('all')
  const [searchField, setSearchField] = useState<string>('employeeID')
  const [searchValue, setSearchValue] = useState<string>('')
  const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>('')
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false)
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()

  const { responseData: rolePermissions } = useRolePermissions({ serviceName: 'applicationApplier', screenName: 'wfh' })
  const { responseData: roleApprover } = useRolePermissions({ serviceName: 'applicationApprover', screenName: 'wfh' })
  const canApprove = !!rolePermissions?.approve || !!roleApprover?.approve
  const canReject = !!rolePermissions?.reject || !!roleApprover?.reject
  const canCancel = !!rolePermissions?.cancel || !!roleApprover?.cancel

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchValue(searchValue)
      setCurrentPage(1)
    }, 300)
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [searchValue])

  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage])
  const limit = itemsPerPage

  const collectionName = 'wfhApplication'

  const buildRequestData = useMemo(() => {
    const trimmedSearch = debouncedSearchValue.trim()
    const requestData: any[] = [
      { field: 'tenantCode', value: tenantCode, operator: 'eq' },
      { field: 'createdOn', value: '', operator: 'desc' },
    ]

    const pushUserScope = () => {
      if (!employeeId) return
      if (isSelfPermission) requestData.push({ field: 'employeeID', value: employeeId, operator: 'eq' })
      else if (isAllPermission) requestData.push({ field: 'createdBy', value: employeeId, operator: 'eq' })
    }

    if (activeTab === 'all') pushUserScope()

    if (activeTab === 'pending') {
      requestData.push({ field: 'workflowState', value: ['APPROVED', 'REJECTED', 'CANCELLED', 'FAILED'], operator: 'nin' })
      pushUserScope()
    }

    if (activeTab === 'failed') {
      requestData.push({ field: 'workflowState', value: 'FAILED', operator: 'like' })
      pushUserScope()
    }

    if (activeTab === 'approved') {
      requestData.push({ field: 'workflowState', value: 'APPROVED', operator: 'eq' })
      pushUserScope()
    }

    if (activeTab === 'rejected') {
      requestData.push({ field: 'workflowState', value: 'REJECTED', operator: 'eq' })
      pushUserScope()
    }

    if (activeTab === 'cancelled') {
      requestData.push({ field: 'workflowState', value: ['CANCELLED', 'CANCEL'], operator: 'in' })
      pushUserScope()
    }

    if (trimmedSearch) requestData.push({ field: searchField, operator: 'like', value: trimmedSearch })

    return requestData
  }, [activeTab, tenantCode, employeeId, isSelfPermission, isAllPermission, debouncedSearchValue, searchField])

  const { refetch: refetchCount } = useRequest<any>({
    url: `${collectionName}/count`,
    method: 'POST',
    data: buildRequestData,
    onSuccess: (data: any) => setTotalCount(data || 0),
    onError: () => setTotalCount(0),
  })

  const { loading: isLoading, refetch: wfhRefetch } = useRequest<any[]>({
    url: `${collectionName}/search?offset=${offset}&limit=${limit}`,
    method: 'POST',
    data: buildRequestData,
    onSuccess: (data: any) => setWfhApplications(Array.isArray(data) ? data : []),
    onError: () => setWfhApplications([]),
  })

  const refreshAll = useCallback(() => {
    const shouldFetch =
      activeTab === 'all' ||
      activeTab === 'pending' ||
      activeTab === 'failed' ||
      (activeTab === 'approved' && canApprove) ||
      (activeTab === 'rejected' && canReject) ||
      (activeTab === 'cancelled' && canCancel)

    if (shouldFetch) {
      wfhRefetch()
      refetchCount()
    }
  }, [activeTab, canApprove, canReject, canCancel])

  useEffect(() => {
    refreshAll()
  }, [refreshAll, isSelfPermission, isAllPermission, employeeId, debouncedSearchValue, searchField, currentPage])

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount)

  return (
    <div className='pb-3'>
      <div className='px-0 pt-6 pb-3'>
        <div className='flex items-center gap-2'>
          <Clock className='h-5 w-5 text-blue-600' />
          <h1 className='text-lg sm:text-xl font-semibold text-gray-900 tracking-tight'>WFH Applications</h1>
        </div>
        <p className='text-xs text-gray-500 mt-0.5'>View and manage work-from-home requests</p>
      </div>

      <WfhApplicationFilters
        activeTab={activeTab}
        onTabChange={setActiveTab as any}
        onApply={({ field, value }) => { setSearchField(field); setSearchValue(value) }}
        onRefresh={refreshAll}
        isSelfPermission={isSelfPermission}
        isAllPermission={isAllPermission}
      />

      <WfhApplicationTable
        data={wfhApplications}
        onOpenDetails={(row) => { setSelectedRequest(row); setIsPopupOpen(true) }}
        externalPagination={{
          currentPage,
          totalPages,
          totalItems: totalCount,
          itemsPerPage,
          startIndex,
          endIndex,
          onPageChange: setCurrentPage,
        }}
        loading={isLoading}
      />

      <WfhRequestsPopup
        isOpen={isPopupOpen}
        onClose={() => { setIsPopupOpen(false); setSelectedRequest(null) }}
        row={selectedRequest}
        loading={isLoading}
        isSelfPermission={isSelfPermission}
        isAllPermission={isAllPermission}
        userMode='user'
        onActionSuccess={() => refreshAll()}
                modeOfRequest="applicationApplier"
      />
    </div>
  )
}
