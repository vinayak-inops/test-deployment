import { useEffect, useMemo, useState } from "react"
import { gql, useQuery } from "@apollo/client"
import { useSearchParams } from "next/navigation"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import { decryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"

const FETCH_EMPLOYEE_CONTRACTOR_QUERY = gql`
  query FetchEmployees($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchEmployees(criteriaRequests: $criteriaRequests, collection: $collection) {
      deployment {
        contractor {
          contractorCode
          contractorName
        }
      }
    }
  }
`

interface UseWorkOrderContractorFromEmployeeParams {
  currentMode: "add" | "edit" | "view" | string
  employeeRecordId?: string | null
}

export function useWorkOrderContractorFromEmployee({
  currentMode,
  employeeRecordId: employeeRecordIdOverride = null,
}: UseWorkOrderContractorFromEmployeeParams) {
  const searchParams = useSearchParams()
  const encryptedId = searchParams.get("id")
  const formParam = searchParams.get("form")
  const isTempForm = formParam === "temp"
  const employeeSearchUrl = isTempForm ? "draft/contract_employee/search" : "contract_employee/search"
  const [tempEmployeeData, setTempEmployeeData] = useState<any>(null)
  const [tempError, setTempError] = useState<any>(null)

  const employeeRecordId = useMemo(() => {
    if (currentMode === "add") return null
    if (employeeRecordIdOverride) return employeeRecordIdOverride
    if (!encryptedId) return null
    try {
      const decrypted = decryptEmployeeData(encryptedId)
      return decrypted?._id || null
    } catch {
      // Backward compatibility where plain _id is passed in URL
      return encryptedId
    }
  }, [encryptedId, currentMode, employeeRecordIdOverride])

  const variables = useMemo(() => {
    if (!employeeRecordId) return null
    return {
      criteriaRequests: [
        {
          field: "_id",
          operator: "eq",
          value: employeeRecordId,
        },
      ],
      collection: "contract_employee",
    }
  }, [employeeRecordId])

  const { data, loading, error } = useQuery(FETCH_EMPLOYEE_CONTRACTOR_QUERY, {
    client,
    variables: variables ?? { criteriaRequests: [], collection: "contract_employee" },
    skip: !variables || isTempForm,
    fetchPolicy: "network-only",
  })

  const { loading: tempLoading, refetch: fetchEmployeeFromRequest } = useRequest<any>({
    url: employeeSearchUrl,
    method: "POST",
    data: [
      {
        field: "_id",
        value: employeeRecordId,
        operator: "eq",
      },
    ],
    onSuccess: (response) => {
      setTempError(null)
      if (Array.isArray(response) && response[0]) {
        setTempEmployeeData(response[0])
      } else {
        setTempEmployeeData(null)
      }
    },
    onError: (requestError) => {
      setTempEmployeeData(null)
      setTempError(requestError)
      console.error("Error fetching employee data:", requestError)
    },
    dependencies: [employeeRecordId, employeeSearchUrl],
  })

  useEffect(() => {
    if (!isTempForm || !employeeRecordId || currentMode === "add") return
    void fetchEmployeeFromRequest()
  }, [isTempForm, employeeRecordId, currentMode, fetchEmployeeFromRequest])

  const contractorCode = useMemo(() => {
    if (isTempForm) {
      return tempEmployeeData?.deployment?.contractor?.contractorCode || null
    }
    const employee = data?.fetchEmployees?.[0]
    return employee?.deployment?.contractor?.contractorCode || null
  }, [data, isTempForm, tempEmployeeData])

  const contractorName = useMemo(() => {
    if (isTempForm) {
      return tempEmployeeData?.deployment?.contractor?.contractorName || null
    }
    const employee = data?.fetchEmployees?.[0]
    return employee?.deployment?.contractor?.contractorName || null
  }, [data, isTempForm, tempEmployeeData])

  return {
    employeeRecordId,
    contractorCode,
    contractorName,
    loading: isTempForm ? tempLoading : loading,
    error: isTempForm ? tempError : error,
  }
}
