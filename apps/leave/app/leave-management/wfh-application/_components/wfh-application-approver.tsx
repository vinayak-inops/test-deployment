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

interface WfhApplicationApproverProps {
  isApprovalPermission?: boolean
}

export default function WfhApplicationApprover({ isApprovalPermission: _isApprovalPermission = false }: WfhApplicationApproverProps) {
  const [wfhApplications, setWfhApplications] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'cancelled' | 'all' | 'failed'>('pending')
  const [searchField, setSearchField] = useState<string>('employeeID')
  const [searchValue, setSearchValue] = useState<string>('')
  const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>('')
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tenantCode = useGetTenantCode()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()

  const getCookie = (name: string): string | undefined => {
    if (typeof window === 'undefined') return undefined
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.startsWith(name + '=')) {
        const value = cookie.substring(name.length + 1)
        try { return decodeURIComponent(value) } catch { return value }
      }
    }
    return undefined
  }

  const storedRoleInfo = useMemo(() => {
    try {
      const keyclockroleinfo = getCookie('keyclockroleinfo')
      if (keyclockroleinfo) return JSON.parse(keyclockroleinfo)
    } catch {
      // ignore
    }
    return null as any
  }, [])

  const employeeId = loginEmployeeId || storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || ''

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

  const collectionName = useMemo(() => {
    if (activeTab === 'pending' || activeTab === 'failed') return 'wfhApplication'
    if (activeTab === 'cancelled' || activeTab === 'rejected' || activeTab === 'approved') return 'wfhApplication'
    return 'wfhApplication'
  }, [activeTab])

  const buildRequestData = useMemo(() => {
    const trimmedSearch = debouncedSearchValue.trim()
    const requestData: any[] = [
      { field: 'tenantCode', value: tenantCode, operator: 'eq' },
      { field: 'createdOn', value: '', operator: 'desc' },
    ]

    if (activeTab === 'pending' && employeeId) requestData.push({ field: 'approverID', value: employeeId, operator: 'eq' })
    if (activeTab === 'failed' && employeeId) {
      requestData.push({ field: 'workflowState', value: 'FAILED', operator: 'like' })
      requestData.push({ field: 'approverID', value: employeeId, operator: 'eq' })
    }
    if (activeTab === 'approved' && employeeId) requestData.push({ field: 'approvedBy', value: employeeId, operator: 'eq' })
    if (activeTab === 'rejected' && employeeId) requestData.push({ field: 'rejectedBy', value: employeeId, operator: 'eq' })
    if (activeTab === 'cancelled' && employeeId) requestData.push({ field: 'cancelledBy', value: employeeId, operator: 'eq' })

    if (trimmedSearch) requestData.push({ field: searchField, operator: 'like', value: trimmedSearch })
    return requestData
  }, [activeTab, tenantCode, employeeId, debouncedSearchValue, searchField])

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
    onSuccess: (data: any) => {
      if (!data || !Array.isArray(data)) {
        setWfhApplications([])
        return
      }
      const updated = data
        .filter((item: any) => item && typeof item === 'object' && Object.keys(item).length > 0)
        .map((item: any) => ({
          _id: item._id || '',
          employeeID: item.employeeID || '',
          fromDate: item.fromDate || '',
          toDate: item.toDate || '',
          fromDuration: item.fromDuration || '',
          toDuration: item.toDuration || '',
          workflowState: item.workflowState || 'INITIATED',
          uploadedBy: item.uploadedBy || '',
          createdOn: item.createdOn || '',
          description: item.description || '',
        }))
      setWfhApplications(updated)
    },
    onError: () => setWfhApplications([]),
  })

  const refreshAll = useCallback(() => {
    const shouldFetch =
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
  }, [refreshAll, employeeId, debouncedSearchValue, searchField, currentPage])

  const handlePageChange = useCallback((page: number) => setCurrentPage(page), [])

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount)

  return (
    <div>
      <div className='px-0 py-3'>
        <div className='flex items-center gap-2'>
          <Clock className='h-5 w-5 text-green-600' />
          <h1 className='text-lg sm:text-xl font-semibold text-gray-900 tracking-tight'>WFH Approver Dashboard</h1>
        </div>
        <p className='text-xs text-gray-500 mt-0.5'>Review and manage WFH applications assigned to you for approval</p>
      </div>
      <WfhApplicationFilters
        activeTab={activeTab}
        onTabChange={setActiveTab as any}
        onApply={({ field, value }) => { setSearchField(field); setSearchValue(value) }}
        onRefresh={refreshAll}
        hideApplicationsTab={true}
        hideApplyButton={true}
      />
      <WfhApplicationTable
        data={wfhApplications}
        onOpenDetails={(row) => { setSelectedRequestId(row._id); setIsPopupOpen(true) }}
        externalPagination={{
          currentPage,
          totalPages,
          totalItems: totalCount,
          itemsPerPage,
          startIndex,
          endIndex,
          onPageChange: handlePageChange,
        }}
        loading={isLoading}
      />
      <WfhRequestsPopup
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false)
          setSelectedRequestId(null)
        }}
        row={wfhApplications.find((x: any) => x._id === selectedRequestId) || null}
        userMode='approver'
        onActionSuccess={() => refreshAll()}
        modeOfRequest="applicationApprover"
      />
    </div>
  )
}
