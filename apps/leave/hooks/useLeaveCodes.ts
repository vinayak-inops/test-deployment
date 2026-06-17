"use client";

import { useMemo } from "react";
import { gql, useQuery } from "@apollo/client";
import { client } from "@repo/ui/hooks/api/dynamic-graphql";
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode";

// --------------------
// Types
// --------------------
interface LeavePolicy {
  leaveCode: string;
  leaveTitle: string;
  leaveType?: string;
  leaveCategory: string;
}

interface FetchLeavePolicyResponse {
  fetchLeavePolicy: {
    tenantCode: string;
    leavePolicy: LeavePolicy[];
  }[];
}

export interface TransformedLeaveCodeData {
  leaveCode: string;
  leaveTitle: string;
  leaveCategory: string;
  leaveCodeWithTitle: string;
}

// --------------------
// GraphQL Query
// --------------------
const FETCH_LEAVE_POLICY = gql`
  query FetchLeavePolicy($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchLeavePolicy(criteriaRequests: $criteriaRequests, collection: $collection) {
      tenantCode
      leavePolicy {
        leaveCode
        leaveTitle
        leaveType
        leaveCategory
      }
    }
  }
`;

// --------------------
// Hook
// --------------------
export const useLeaveCodes = (employee: any) => {
  const tenantCode = useGetTenantCode();

  // --------------------
  // STRICT VALIDATION
  // --------------------
  const isValidEmployee =
    !!tenantCode &&
    !!employee?.subsidiaryCode &&
    !!employee?.locationCode &&
    !!employee?.designationCode &&
    !!employee?.employeeCategoryCode;

  // --------------------
  // GraphQL Query
  // --------------------
  const { data, loading, error, refetch } = useQuery<FetchLeavePolicyResponse>(
    FETCH_LEAVE_POLICY,
    {
      client,
      variables: {
        collection: "leave_policy",
        criteriaRequests: [
          {
            field: "tenantCode",
            operator: "eq",
            value: tenantCode,
          },
          {
            field: "subsidiary.subsidiaryCode",
            operator: "eq",
            value: employee?.subsidiaryCode,
          },
          // {
          //   field: "location.locationCode",
          //   operator: "eq",
          //   value: employee?.locationCode,
          // },
          {
            field: "designation.designationCode",
            operator: "eq",
            value: employee?.designationCode,
          },
          {
            field: "employeeCategory",
            operator: "in",
            value: [employee?.employeeCategoryCode],
          },
        ],
      },
      skip: !isValidEmployee, // ❗ Prevent API call if any field missing
      errorPolicy: "all",
    }
  );

  // --------------------
  // Transform Data
  // --------------------
  const leaveCodes: TransformedLeaveCodeData[] = useMemo(() => {
    if (!data?.fetchLeavePolicy) return [];

    return data.fetchLeavePolicy
      .flatMap((item) => {
        const policies = Array.isArray(item.leavePolicy)
          ? item.leavePolicy
          : [item.leavePolicy];
        return policies;
      })
      .filter(
        (lp) =>
          lp?.leaveCategory === "Time Away" ||
          lp?.leaveCategory === "Leave of Absence"
      )
      .map((lp) => ({
        leaveCode: lp.leaveCode,
        leaveTitle: lp.leaveTitle,
        leaveCategory: lp.leaveCategory,
        leaveCodeWithTitle: `${lp.leaveCode}-${lp.leaveTitle}`,
      }))
      .filter((item) => item.leaveCode);
  }, [data]);

  // --------------------
  // Return
  // --------------------
  return {
    leaveCodes,
    loading,
    error: error?.message || null,
    refetch,
  };
};