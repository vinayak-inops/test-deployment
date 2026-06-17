"use client"

import { useMemo } from 'react'
import type { FilterSelections } from '@/components/common/step-by-step-filter'

export interface HierarchyFilters {
  subsidiary?: string[]
  division?: string[]
  department?: string[]
  location?: string[]
  contractor?: string[]
  workOrderNumber?: string[]
  employeeID?: string
}

/**
 * Custom hook to build hierarchyFilters object from filter selections or employeeID
 * 
 * @param filterSelections - Object containing filter selection arrays (subsidiaries, divisions, departments, locations, contractors, workOrderNumbers, employeeID)
 * @param employeeID - Optional employeeID string (alternative to passing it in filterSelections)
 * @returns HierarchyFilters object with only non-empty filter arrays
 * 
 * @example
 * // Using FilterSelections
 * const hierarchyFilters = useHierarchyFilters(filterSelections)
 * // Returns: { subsidiary: ["SUB1"], division: ["DIV1"], employeeID: "EMP001" }
 * 
 * @example
 * // Using just employeeID
 * const hierarchyFilters = useHierarchyFilters(null, "EMP001")
 * // Returns: { employeeID: "EMP001" }
 */
export function useHierarchyFilters(
  filterSelections?: FilterSelections | null,
  employeeID?: string | null
): HierarchyFilters {
  return useMemo(() => {
    const filters: HierarchyFilters = {}

    // Add hierarchy filters only if they exist and have values
    if (filterSelections?.subsidiaries && filterSelections.subsidiaries.length > 0) {
      filters.subsidiary = filterSelections.subsidiaries
    }

    if (filterSelections?.divisions && filterSelections.divisions.length > 0) {
      filters.division = filterSelections.divisions
    }

    if (filterSelections?.departments && filterSelections.departments.length > 0) {
      filters.department = filterSelections.departments
    }

    if (filterSelections?.locations && filterSelections.locations.length > 0) {
      filters.location = filterSelections.locations
    }

    if (filterSelections?.contractors && filterSelections.contractors.length > 0) {
      filters.contractor = filterSelections.contractors
    }

    if (filterSelections?.workOrderNumbers && filterSelections.workOrderNumbers.length > 0) {
      filters.workOrderNumber = filterSelections.workOrderNumbers
    }

    // Add employeeID from filterSelections if provided
    if (filterSelections?.employeeID && filterSelections.employeeID.trim()) {
      filters.employeeID = filterSelections.employeeID.trim()
    }
    // Or use employeeID parameter if provided (takes precedence)
    else if (employeeID && employeeID.trim()) {
      filters.employeeID = employeeID.trim()
    }

    return filters
  }, [filterSelections, employeeID])
}

