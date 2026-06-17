"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchDynamicQuery } from "@repo/ui/hooks/api/dynamic-graphql";
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode";

// --------------------
// Types
// --------------------
interface LeaveType {
  id: string;
  label: string;
  category: string;
  leaveCode: string;
  leaveTitle: string;
  leaveCategory: string;
  leaveCodeWithTitle: string;
}

// --------------------
// Constants
// --------------------
const ALLOWED_CATEGORIES = ["Time Away", "Leave of Absence"];

// --------------------
// Hook
// --------------------
export const useLeaveCodesGraphQL = () => {
  const [leaveCodes, setLeaveCodes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  const tenantCode = useGetTenantCode();

  // --------------------
  // Fetch Function
  // --------------------
  const fetchLeaveCodes = useCallback(async () => {
    // ⛔ Prevent API call if tenant not ready
    if (!tenantCode) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setUsingFallbackData(false);

      // Fields required from backend
      const leavePolicyFields = {
        fields: ["leaveCode", "leaveTitle", "leaveCategory"],
      };

      // ✅ GraphQL call
      const result = await fetchDynamicQuery(
        leavePolicyFields,
        "leave_policy",
        "FetchAllLeavePolicy",
        "fetchAllLeavePolicy",
        {
          collection: "leave_policy",
          criteriaRequests: [
            {
              field: "tenantCode",
              operator: "eq",
              value: tenantCode,
            },
          ],
        }
      );

      if (result?.error) {
        throw new Error(result.error.message || "Failed to fetch leave codes");
      }

      const rawData = result?.data || [];

      // --------------------
      // Transform Data
      // --------------------
      const transformedData: LeaveType[] = rawData
        .filter((item: any) => item?.leavePolicy)
        .filter((item: any) =>
          ALLOWED_CATEGORIES.includes(item.leavePolicy.leaveCategory)
        )
        .map((item: any) => {
          const lp = item.leavePolicy;

          return {
            id: lp.leaveCode,
            label: `${lp.leaveCode}-${lp.leaveTitle}`,
            category: lp.leaveCategory,
            leaveCode: lp.leaveCode,
            leaveTitle: lp.leaveTitle,
            leaveCategory: lp.leaveCategory,
            leaveCodeWithTitle: `${lp.leaveCode}-${lp.leaveTitle}`,
          };
        })
        .filter((item:any) => item.leaveCode) // safety
        .sort((a:any, b:any) => a.leaveTitle.localeCompare(b.leaveTitle)); // better UX

      setLeaveCodes(transformedData);
    } catch (err) {
      console.error("Error fetching leave codes:", err);

      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch leave codes";

      setError(errorMessage);
      setUsingFallbackData(true);
      setLeaveCodes([]); // clear stale data
    } finally {
      setLoading(false);
    }
  }, [tenantCode]);

  // --------------------
  // Effect
  // --------------------
  useEffect(() => {
    fetchLeaveCodes();
  }, [fetchLeaveCodes]);

  // --------------------
  // Return
  // --------------------
  return {
    leaveCodes,
    loading,
    error,
    usingFallbackData,
    refetch: fetchLeaveCodes,
  };
};