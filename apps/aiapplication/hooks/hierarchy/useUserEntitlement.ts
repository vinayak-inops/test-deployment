"use client"

import { useMemo } from 'react'

export interface UserEntitlement {
  employeeID?: string
  subsidiary?: string[]
  division?: string[]
  department?: string[]
  contractor?: string[]
  location?: string[]
}

export interface HierarchyFilters {
  subsidiaries?: string[]
  divisions?: string[]
  departments?: string[]
  contractors?: string[]
  locations?: string[]
}

/**
 * Custom hook to build userEntitlement object from employee ID and hierarchy filters
 * 
 * @param employeeId - The logged-in employee ID (optional)
 * @param hierarchyFilters - Object containing hierarchy filter arrays (subsidiaries, divisions, departments, contractors, locations)
 * @returns UserEntitlement object with only non-empty filter arrays
 * 
 * @example
 * const userEntitlement = useUserEntitlement(loginEmployeeId, empHierarchyFilters)
 * // Returns: { employeeID: "EMP001", subsidiary: ["SUB1"], division: ["DIV1"] }
 */
export function useUserEntitlement(
  employeeId?: string | null,
  hierarchyFilters?: HierarchyFilters | null
): UserEntitlement {
  return useMemo(() => {
    const entitlement: UserEntitlement = {}

    // Add employeeID if provided
    if (employeeId) {
      entitlement.employeeID = employeeId
    }

    // Add hierarchy filters only if they exist and have values
    if (hierarchyFilters?.subsidiaries && hierarchyFilters.subsidiaries.length > 0) {
      entitlement.subsidiary = hierarchyFilters.subsidiaries
    }

    if (hierarchyFilters?.divisions && hierarchyFilters.divisions.length > 0) {
      entitlement.division = hierarchyFilters.divisions
    }

    if (hierarchyFilters?.departments && hierarchyFilters.departments.length > 0) {
      entitlement.department = hierarchyFilters.departments
    }

    if (hierarchyFilters?.contractors && hierarchyFilters.contractors.length > 0) {
      entitlement.contractor = hierarchyFilters.contractors
    }

    if (hierarchyFilters?.locations && hierarchyFilters.locations.length > 0) {
      entitlement.location = hierarchyFilters.locations
    }

    return entitlement
  }, [employeeId, hierarchyFilters])
}

