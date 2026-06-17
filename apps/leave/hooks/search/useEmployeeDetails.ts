"use client";

import { useMemo } from "react";
import { gql, useQuery } from "@apollo/client";
import { client } from "@repo/ui/hooks/api/dynamic-graphql";
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

// --------------------
// Types
// --------------------
interface EmployeeRaw {
  employeeID: string;
  deployment?: {
    employeeCategory?: {
      employeeCategoryCode: string;
      employeeCategoryName: string;
    };
    subsidiary?: {
      subsidiaryCode: string;
      subsidiaryName: string;
    };
    designation?: {
      designationCode: string;
      designationName: string;
    };
    location?: {
      locationCode: string;
      locationName: string;
    };
  };
}

interface EmployeeResponse {
  fetchEmployees: EmployeeRaw[];
}

// Final transformed type (what YOU will use in UI)
export interface EmployeeDetails {
  employeeID: string;

  employeeCategoryCode?: string;
  employeeCategoryName?: string;

  subsidiaryCode?: string;
  subsidiaryName?: string;

  designationCode?: string;
  designationName?: string;

  locationCode?: string;
  locationName?: string;
}

// --------------------
// GraphQL Query
// --------------------
const FETCH_EMPLOYEE = gql`
  query FetchEmployees($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchEmployees(criteriaRequests: $criteriaRequests, collection: $collection) {
      employeeID
      deployment {
        employeeCategory {
          employeeCategoryCode
          employeeCategoryName
        }
        subsidiary {
          subsidiaryCode
          subsidiaryName
        }
        designation {
          designationCode
          designationName
        }
        location {
          locationCode
          locationName
        }
      }
    }
  }
`;

// --------------------
// Hook
// --------------------
export const useEmployeeDetails = (employeeId: string) => {
  const tenantCode = useGetTenantCode()
  const { data, loading, error, refetch } = useQuery<EmployeeResponse>(
    FETCH_EMPLOYEE,
    {
      client,
      variables: {
        collection: "contract_employee",
        criteriaRequests: [
          {
            field: "employeeID",
            operator: "eq",
            value: employeeId,
          },
          {
            field: "tenantCode",
            operator: "eq",
            value: tenantCode,
          },
        ],
      },
      skip: !employeeId,
      errorPolicy: "all",
    }
  );

  // --------------------
  // Transform Data
  // --------------------
  const employee: EmployeeDetails | null = useMemo(() => {
    if (!data?.fetchEmployees?.length) return null;

    const emp = data.fetchEmployees[0];

    return {
      employeeID: emp.employeeID,

      employeeCategoryCode: emp.deployment?.employeeCategory?.employeeCategoryCode,
      employeeCategoryName: emp.deployment?.employeeCategory?.employeeCategoryName,

      subsidiaryCode: emp.deployment?.subsidiary?.subsidiaryCode,
      subsidiaryName: emp.deployment?.subsidiary?.subsidiaryName,

      designationCode: emp.deployment?.designation?.designationCode,
      designationName: emp.deployment?.designation?.designationName,

      locationCode: emp.deployment?.location?.locationCode,
      locationName: emp.deployment?.location?.locationName,
    };
  }, [data]);
  
  return {
    employee,        // ✅ clean object
    loading,
    error: error?.message || null,
    refetch,
  };
};