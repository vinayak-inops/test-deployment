"use client"

import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@inops/store/src/store'
import { formatDateTime } from '@/utils/time/time-control'

export interface CompanyEmployeeLite {
  _id: string
  employeeID: string
  firstName: string
  aadharNumber: string
  companyCode: string
  createdOn: string
  createdBy: string
}

export interface CompanyEmployeeCriteria {
  employeeID?: string
  firstName?: string
  middleName?: string
  lastName?: string
}

// Safely extract a list of company employees from various API response shapes
function normalizeCompanyEmployees(data: any): any[] {
  if (!data) return []

  // Common containers - prioritize companyEmployees
  const candidates = [
    data?.companyEmployees,
    data?.company_employees,
    data?.employees,
    data?.data,
    data?.items,
    Array.isArray(data) ? data : undefined,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }

  // Try nested payload
  if (data?.payload && Array.isArray(data.payload)) return data.payload

  return []
}

// Map to a stable lite model with tolerant key lookups
function toCompanyEmployeeLiteList(rows: any[]): CompanyEmployeeLite[] {
  return rows.map((row) => {
    const _id = row?._id ?? row?.id ?? row?.employeeID ?? ''
    const employeeID =
      row?.employeeID ?? row?.employeeId ?? row?.empId ?? row?.id ?? ''
    const firstName = row?.firstName ?? row?.name ?? ''
    // Preserve optional names for filter support through raw access below
    const middleNameRaw = row?.middleName ?? ''
    const lastNameRaw = row?.lastName ?? ''
    const aadharNumber =
      row?.aadharNumber ?? row?.aadhaarNumber ?? row?.aadhar ?? row?.aadhaar ?? ''
    const companyCode =
      row?.companyCode ??
      row?.company ??
      row?.deployment?.company?.companyCode ??
      ''
    const createdOn =
      row?.createdOn ??
      row?.created_at ??
      row?.createdAt ??
      row?.deployment?.effectiveFrom ??
      ''
    const createdBy = row?.createdBy ?? row?.created_by ?? row?.createdUser ?? ''

    return {
      _id: String(_id ?? ''),
      employeeID: String(employeeID ?? ''),
      firstName: String(firstName ?? ''),
      aadharNumber: String(aadharNumber ?? ''),
      companyCode: String(companyCode ?? ''),
      createdOn: formatDateTime(createdOn),
      createdBy: String(createdBy ?? ''),
    }
  })
}

function matchesCompanyEmployeeCriteria(row: any, criteria?: CompanyEmployeeCriteria): boolean {
  if (!criteria) return true
  const idOk = criteria.employeeID ? String(row?.employeeID ?? row?.employeeId ?? row?.empId ?? row?.id ?? '') === criteria.employeeID : true
  const firstOk = criteria.firstName ? String(row?.firstName ?? row?.name ?? '').toLowerCase() === criteria.firstName.toLowerCase() : true
  const middleOk = criteria.middleName ? String(row?.middleName ?? '').toLowerCase() === criteria.middleName.toLowerCase() : true
  const lastOk = criteria.lastName ? String(row?.lastName ?? '').toLowerCase() === criteria.lastName.toLowerCase() : true
  return idOk && firstOk && middleOk && lastOk
}

export function useComHierarchy(criteria?: CompanyEmployeeCriteria) {
  const hierarchyData = useSelector((state: RootState) => (state as any).hierarchy?.data)
  const loading = useSelector((state: RootState) => (state as any).hierarchy?.loading)
  const error = useSelector((state: RootState) => (state as any).hierarchy?.error)

  const { employeeIds, employeesLite, rawEmployees, filteredEmployeesLite } = useMemo(() => {
    const rows = normalizeCompanyEmployees(hierarchyData)
    const lite = toCompanyEmployeeLiteList(rows)
    const ids = lite.map((e) => e.employeeID).filter(Boolean)
    const filteredRaw = criteria ? rows.filter((r) => matchesCompanyEmployeeCriteria(r, criteria)) : rows
    const filteredLite = criteria ? toCompanyEmployeeLiteList(filteredRaw) : lite
    return { employeeIds: ids, employeesLite: lite, rawEmployees: rows, filteredEmployeesLite: filteredLite }
  }, [hierarchyData, criteria])

  return {
    loading: Boolean(loading),
    error: error as string | null,
    employeeIds,
    employeesLite,
    filteredEmployeesLite,
    raw: hierarchyData,
    rawEmployees,
  }
}
