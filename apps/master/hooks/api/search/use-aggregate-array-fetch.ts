"use client"

import { useMemo, useState } from "react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useUserEntitlement, type UserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"

type HierarchyFilters = {
  area?: string[]
  areas?: string[]
  subsidiary?: string[]
  division?: string[]
  department?: string[]
  contractor?: string[]
  location?: string[]
  subsidiaries?: string[]
  divisions?: string[]
  departments?: string[]
  contractors?: string[]
  locations?: string[]
}

type CriteriaRequest = {
  field: string
  operator: string
  value: any
}

interface UseAggregateArrayFetchParams<TItem> {
  collection: string
  criteriaRequests: CriteriaRequest[]
  arrayField: string
  filterCriteria?: CriteriaRequest[]
  userEntitlement?: Partial<UserEntitlement> | null
  hierarchyFilters?: HierarchyFilters | null
  enabled?: boolean
  defaultValue?: TItem[]
  onError?: (error: any) => void
}

const ARRAY_FIELD_ENTITLEMENT_MAP: Record<
  string,
  {
    entitlementKey?: keyof UserEntitlement
    hierarchyKeys?: (keyof HierarchyFilters)[]
    field: string
  } | undefined
> = {
  subsidiaries: {
    entitlementKey: "subsidiary",
    hierarchyKeys: ["subsidiaries", "subsidiary"],
    field: "subsidiaryCode",
  },
  divisions: {
    entitlementKey: "division",
    hierarchyKeys: ["divisions", "division"],
    field: "divisionCode",
  },
  areas: {
    entitlementKey: "subsidiary",
    hierarchyKeys: ["subsidiaries", "subsidiary"],
    field: "subsidiaryCode",
  },
  centralServerDetails: {
    entitlementKey: "subsidiary",
    hierarchyKeys: ["subsidiaries", "subsidiary"],
    field: "subsidiaryCode",
  },
  maxEmployeesPerSubsidiary: {
    entitlementKey: "subsidiary",
    hierarchyKeys: ["subsidiaries", "subsidiary"],
    field: "subsidiaryCode",
  },
  departments: {
    entitlementKey: "department",
    hierarchyKeys: ["departments", "department"],
    field: "departmentCode",
  },
  subDepartments: {
    entitlementKey: "department",
    hierarchyKeys: ["departments", "department"],
    field: "departmentCode",
  },
  sections: {
    entitlementKey: "department",
    hierarchyKeys: ["departments", "department"],
    field: "departmentCode",
  },
  location: {
    entitlementKey: "location",
    hierarchyKeys: ["locations", "location"],
    field: "locationCode",
  },
}

export function useAggregateArrayFetch<TItem>({
  collection,
  criteriaRequests,
  arrayField,
  filterCriteria = [],
  userEntitlement,
  hierarchyFilters,
  enabled = true,
  defaultValue = [],
  onError,
}: UseAggregateArrayFetchParams<TItem>) {
  const [arrayData, setArrayData] = useState<TItem[]>(defaultValue)
  const { hierarchyFilters: empHierarchyFilters } = useEmpHierarchy()
  const fallbackUserEntitlement = useUserEntitlement(undefined, empHierarchyFilters)

  const effectiveUserEntitlement = useMemo(
    () => ({
      ...fallbackUserEntitlement,
      ...(userEntitlement ?? {}),
    }),
    [fallbackUserEntitlement, userEntitlement]
  )

  const effectiveHierarchyFilters = useMemo(
    () => ({
      ...(empHierarchyFilters ?? {}),
      ...(hierarchyFilters ?? {}),
    }),
    [empHierarchyFilters, hierarchyFilters]
  )

  const mergedFilterCriteria = useMemo(() => {
    const derivedCriteria: CriteriaRequest[] = []
    const entitlementConfig = ARRAY_FIELD_ENTITLEMENT_MAP[arrayField]

    if (entitlementConfig) {
      const entitlementValue = entitlementConfig.entitlementKey
        ? effectiveUserEntitlement?.[entitlementConfig.entitlementKey]
        : undefined
      const hierarchyKey = entitlementConfig.hierarchyKeys?.find((key) =>
        Array.isArray(effectiveHierarchyFilters?.[key])
      )
      const hierarchyValue = hierarchyKey ? effectiveHierarchyFilters?.[hierarchyKey] : undefined
      const filterValue = Array.isArray(entitlementValue)
        ? entitlementValue
        : Array.isArray(hierarchyValue)
          ? hierarchyValue
          : []

      derivedCriteria.push({
        field: entitlementConfig.field,
        operator: "in",
        value: filterValue,
      })
    }

    return [...filterCriteria, ...derivedCriteria]
  }, [arrayField, filterCriteria, effectiveUserEntitlement, effectiveHierarchyFilters])

  const requestData = useMemo(
    () => ({
      criteriaRequests,
      arrayFilter: {
        arrayField,
        filterCriteria: mergedFilterCriteria,
      },
    }),
    [criteriaRequests, arrayField, mergedFilterCriteria]
  )

  const hasActiveArrayFilter = useMemo(
    () =>
      mergedFilterCriteria.some((criteria) =>
        criteria.operator === "in" &&
        Array.isArray(criteria.value) &&
        criteria.value.length > 0
      ),
    [mergedFilterCriteria]
  )

  const { loading, error, refetch } = useRequest<any[]>({
    url: enabled ? `${collection}/aggregate` : "",
    method: "POST",
    data: requestData,
    dependencies: [],
    onSuccess: (data: any) => {
      if (!Array.isArray(data)) {
        setArrayData(defaultValue)
        return
      }
      if (hasActiveArrayFilter) {
        setArrayData(data.length > 0 ? data : defaultValue)
        return
      }
      const extracted = data.flatMap((item: any) => (Array.isArray(item?.[arrayField]) ? item[arrayField] : []))
      setArrayData(extracted.length > 0 ? extracted : defaultValue)
    },
    onError: (reqError: any) => {
      onError?.(reqError)
    },
  })

  return {
    arrayData,
    loading,
    error,
    refetch,
  }
}
