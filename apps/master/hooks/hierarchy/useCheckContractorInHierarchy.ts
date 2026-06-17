"use client"

import { useCallback, useMemo, useState } from "react"
import { gql } from "@apollo/client"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"

export interface CheckContractorInHierarchyParams {
  _id?: string | null
  contractorCode?: string | null
}

interface ContractorHierarchyRow {
  contractorCode?: string | null
  contractorName?: string | null
}

const FETCH_CONTRACTORS_QUERY = gql`
  query FetchContractors(
    $criteriaRequests: [CriteriaRequest!]!
    $collection: String!
    $offset: Int
    $limit: Int
  ) {
    fetchContractors(
      criteriaRequests: $criteriaRequests
      collection: $collection
      offset: $offset
      limit: $limit
    ) {
      contractorCode
      contractorName
    }
  }
`

export function useCheckContractorInHierarchy() {
  const tenantCode = useGetTenantCode()
  const { hierarchyFilters } = useEmpHierarchy()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
  const userEntitlement = useUserEntitlement(loginEmployeeId, hierarchyFilters)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<boolean>(false)
  const [lastMatchedContractors, setLastMatchedContractors] = useState<ContractorHierarchyRow[]>([])

  const entitledContractorCodes = useMemo(
    () => (Array.isArray(userEntitlement.contractor) ? userEntitlement.contractor.map(String) : []),
    [userEntitlement.contractor]
  )

  const checkContractorInHierarchy = useCallback(
    async (params: CheckContractorInHierarchyParams | string) => {
      const normalizedParams: CheckContractorInHierarchyParams =
        typeof params === "string" ? { contractorCode: params } : params

      const targetId = String(normalizedParams._id || "").trim()
      const targetContractorCode = String(normalizedParams.contractorCode || "").trim()

      setError(null)

      if (targetContractorCode) {
        const isMatched = entitledContractorCodes.includes(targetContractorCode)
        setLastMatchedContractors(
          isMatched
            ? [{ contractorCode: targetContractorCode, contractorName: null }]
            : []
        )
        setLastResult(isMatched)
        return isMatched
      }

      if (!tenantCode || !targetId) {
        setLastMatchedContractors([])
        setLastResult(false)
        return false
      }

      setLoading(true)

      try {
        const criteriaRequests = [
          {
            field: "tenantCode",
            operator: "is",
            value: tenantCode,
          },
          {
            field: "_id",
            operator: "is",
            value: targetId,
          },
          ...(entitledContractorCodes.length > 0
            ? [
                {
                  field: "contractorCode",
                  operator: "in",
                  value: entitledContractorCodes,
                },
              ]
            : []),
        ]

        const { data } = await client.query({
          query: FETCH_CONTRACTORS_QUERY,
          variables: {
            criteriaRequests,
            collection: "contractor",
            offset: 0,
            limit: 10,
          },
          fetchPolicy: "network-only",
        })

        const contractors: ContractorHierarchyRow[] = Array.isArray(data?.fetchContractors)
          ? data.fetchContractors
          : []

        const isMatched = contractors.length > 0

        setLastMatchedContractors(contractors)
        setLastResult(isMatched)
        return isMatched
      } catch (queryError: any) {
        const message = queryError?.message || "Failed to check contractor hierarchy access"
        setError(message)
        setLastMatchedContractors([])
        setLastResult(false)
        return false
      } finally {
        setLoading(false)
      }
    },
    [entitledContractorCodes, tenantCode]
  )

  return {
    checkContractorInHierarchy,
    loading,
    error,
    lastResult,
    lastMatchedContractors,
  }
}
