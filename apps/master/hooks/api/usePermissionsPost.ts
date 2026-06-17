import axios from "axios";
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken";

interface PostOptions {
  path: string; // e.g. "permissions/master"
  data: any;
}

/**
 * Lightweight POST helper for calling this app's Next.js API routes
 * while forwarding the bearer token to the backend.
 *
 * Usage:
 * const { post } = usePermissionsPost();
 * await post({ path: "permissions/master", data: {...} });
 */
export const usePermissionsPost = () => {
  const { token } = useAuthToken();

  const post = async <T = any>({ path, data }: PostOptions): Promise<T> => {
    if (!token) {
      throw new Error("No access token available");
    }

    const res = await axios.post<T>(`/master/api/${path}`, data, {
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


