"use client"

import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@inops/store/src/store'
import { formatDateTime } from '@/utils/time/time-control'

export interface EmployeeLite {
  _id: string
  employeeID: string
  firstName: string
  aadharNumber: string
  contractorCode: string
  createdOn: string
  createdBy: string
}

export interface EmployeeCriteria {
  employeeID?: string
  firstName?: string
  middleName?: string
  lastName?: string
}

// Safely extract a list of employees from various API response shapes
function normalizeEmployees(data: any): any[] {
  if (!data) return []

  // Common containers
  const candidates = [
    data?.contractEmployees,
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
function toEmployeeLiteList(rows: any[]): EmployeeLite[] {
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
    const contractorCode =
      row?.contractorCode ??
      row?.contractor ??
      row?.deployment?.contractor?.contractorCode ??
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
      contractorCode: String(contractorCode ?? ''),
      createdOn: formatDateTime(createdOn),
      createdBy: String(createdBy ?? ''),
    }
  })
}

function matchesEmployeeCriteria(row: any, criteria?: EmployeeCriteria): boolean {
  if (!criteria) return true
  const idOk = criteria.employeeID ? String(row?.employeeID ?? row?.employeeId ?? row?.empId ?? row?.id ?? '') === criteria.employeeID : true
  const firstOk = criteria.firstName ? String(row?.firstName ?? row?.name ?? '').toLowerCase() === criteria.firstName.toLowerCase() : true
  const middleOk = criteria.middleName ? String(row?.middleName ?? '').toLowerCase() === criteria.middleName.toLowerCase() : true
  const lastOk = criteria.lastName ? String(row?.lastName ?? '').toLowerCase() === criteria.lastName.toLowerCase() : true
  return idOk && firstOk && middleOk && lastOk
}

// Transform hierarchy data array into a single object with merged filter properties
function transformHierarchyData(data: any[]): {
  subsidiaries: string[]
  divisions: string[]
  departments: string[]
  locations: string[]
  contractors: string[]
} {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      subsidiaries: [],
      divisions: [],
      departments: [],
      locations: [],
      contractors: []
    }
  }

  // Use Sets to automatically handle uniqueness
  const subsidiariesSet = new Set<string>()
  const divisionsSet = new Set<string>()
  const departmentsSet = new Set<string>()
  const locationsSet = new Set<string>()
  const contractorsSet = new Set<string>()

  // Merge all hierarchy data from all items in the array
  data.forEach((item: any) => {
    // Collect subsidiaries
    if (Array.isArray(item.subsidiaries)) {
      item.subsidiaries.forEach((sub: any) => {
        if (sub != null && sub !== '') {
          subsidiariesSet.add(String(sub))
        }
      })
    }

    // Collect divisions
    if (Array.isArray(item.divisions)) {
      item.divisions.forEach((div: any) => {
        if (div != null && div !== '') {
          divisionsSet.add(String(div))
        }
      })
    }

    // Collect departments
    if (Array.isArray(item.departments)) {
      item.departments.forEach((dept: any) => {
        if (dept != null && dept !== '') {
          departmentsSet.add(String(dept))
        }
      })
    }

    // Collect locations
    if (Array.isArray(item.locations)) {
      item.locations.forEach((loc: any) => {
        if (loc != null && loc !== '') {
          locationsSet.add(String(loc))
        }
      })
    }

    // Collect contractors
    if (Array.isArray(item.contractors)) {
      item.contractors.forEach((contractor: any) => {
        if (contractor != null && contractor !== '') {
          contractorsSet.add(String(contractor))
        }
      })
    }
  })

  return {
    subsidiaries: Array.from(subsidiariesSet),
    divisions: Array.from(divisionsSet),
    departments: Array.from(departmentsSet),
    locations: Array.from(locationsSet),
    contractors: Array.from(contractorsSet)
  }
}

export function useEmpHierarchy(criteria?: EmployeeCriteria) {
  const hierarchyData = useSelector((state: RootState) => (state as any).hierarchy?.data)
  const loading = useSelector((state: RootState) => (state as any).hierarchy?.loading)
  const error = useSelector((state: RootState) => (state as any).hierarchy?.error)

  const hierarchyFilters = useMemo(() => {
    // Transform hierarchy data into filter object format
    return transformHierarchyData(Array.isArray(hierarchyData) ? hierarchyData : [])
  }, [hierarchyData])

  // Extract employeeIds from hierarchy data
  const { employeeIds, employeesLite, rawEmployees } = useMemo(() => {
    const rows = normalizeEmployees(hierarchyData)
    const lite = toEmployeeLiteList(rows)
    const ids = lite.map((e) => e.employeeID).filter(Boolean)
    const filteredRaw = criteria ? rows.filter((r) => matchesEmployeeCriteria(r, criteria)) : rows
    return { employeeIds: ids, employeesLite: lite, rawEmployees: filteredRaw }
  }, [hierarchyData, criteria])

  return {
    loading: Boolean(loading),
    error: error as string | null,
    hierarchyFilters, // Return the transformed hierarchy filters object
    employeeIds, // Return employee IDs array
    employeesLite, // Return lite employee list
    rawEmployees, // Return raw employee data
  }
}


