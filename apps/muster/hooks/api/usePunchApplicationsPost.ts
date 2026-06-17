import axios from "axios";
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken";

interface PunchApplicationsPostOptions {
  activeTab: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'applications';
  isSelfPermission?: boolean;
  isAllPermission?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  canCancel?: boolean;
  employeeId?: string;
  tenantCode?: string;
  searchField?: string;
  searchValue?: string;
  offset?: number;
  limit?: number;
  operation?: 'search' | 'count';
  workflowState?: string | string[]; // For status-specific counts
}

/**
 * Lightweight POST helper for calling punch applications Next.js API route
 * while forwarding the bearer token to the backend.
 *
 * Usage:
 * const { post } = usePunchApplicationsPost();
 * await post({ 
 *   activeTab: 'applications', 
 *   employeeId: '123',
 *   tenantCode: '',
 *   operation: 'search',
 *   offset: 0,
 *   limit: 10
 * });
 */
export const usePunchApplicationsPost = () => {
  const { token } = useAuthToken();

  const post = async <T = any>(options: PunchApplicationsPostOptions): Promise<T> => {
    if (!token) {
      throw new Error("No access token available");
    }

    const res = await axios.post<T>(`/muster/api/punch-applications`, options, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      withCredentials: true,
    });

    return res.data;
  };

  return { post };
};

