import { useState, useEffect } from 'react'
import { useAuthToken } from '@repo/ui/hooks/auth/useAuthToken'
import { useGetTenantCode } from './api/serach/useGetTenantCode'

// Interface for salary head data
interface SalaryHead {
  name: string
  code: string
}

// Response interface for the GraphQL query
interface WageSalaryHeadsResponse {
  salaryHeads: SalaryHead[]
}

// Interface for the fetchWageSalaryHeads item
interface FetchWageSalaryHeadsItem {
  salaryHeads: SalaryHead[]
}

export const useWageSalaryHeads = () => {
  const [salaryHeads, setSalaryHeads] = useState<SalaryHead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const  tenantCode  = useGetTenantCode()

  const { token, loading: tokenLoading, error: tokenError } = useAuthToken()

  // Helper function to validate token
  const validateToken = (token: string | null): boolean => {
    if (!token || token.trim() === '') {
      console.warn('Token is null, empty, or whitespace');
      return false;
    }
    return true;
  };

  // Helper function to create headers with token
  const createHeaders = (token: string) => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.trim()}`,
      'Accept': 'application/json',
    };
  };

  // Fetch wage salary heads using GraphQL
  const fetchWageSalaryHeads = async () => {
    // Don't make API call if token is loading or not available
    if (tokenLoading || !token) {
      return;
    }

    // Validate token before making API call
    if (!validateToken(token)) {
      setError('Invalid authentication token');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Define the GraphQL query
      const query = `
       query FetchWageSalaryHeads {
    fetchWageSalaryHeads(
        criteriaRequests: [{ field: "organizationCode", operator: "is", value: ${tenantCode} },
        { field: "tenantCode", operator: "is", value: ${tenantCode} }],
        collection: "wageSalaryHeads"
    ) {
        name
        code
    }
}
      `;

      // Send the request using fetch
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`, {
        method: 'POST',
        headers: createHeaders(token),
        mode: "cors",
        credentials: "include",
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      // Extract salary heads from the response
      if (data?.data?.fetchWageSalaryHeads && Array.isArray(data.data.fetchWageSalaryHeads)) {
        // Safely extract only valid salary heads
        const allHeads =
          data.data.fetchWageSalaryHeads
           // .flatMap((item: FetchWageSalaryHeadsItem) => item.salaryHeads || []) // handle missing salaryHeads
            .filter((head: any) => head && head.name && head.code) // filter out null or incomplete
            .map((head: any) => ({
              name: head.name,
              code: head.code,
            })) || [];

        setSalaryHeads(allHeads);
      } else {
        setError('No salary heads data found');
        setSalaryHeads([]);
      }
    } catch (err) {
      console.error("Error fetching wage salary heads:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch salary heads");
      setSalaryHeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWageSalaryHeads()
  }, [token, tokenLoading])

  return {
    salaryHeads,
    loading: loading || tokenLoading,
    error: error || tokenError?.message,
    refetch: fetchWageSalaryHeads
  }
}