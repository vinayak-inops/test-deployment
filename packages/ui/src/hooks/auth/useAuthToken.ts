import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface AuthTokenResponse {
  accessToken?: string;
  expires_at?: number;
}

const TOKEN_CACHE_TTL_MS = 30_000;
let cachedToken: { token: string | null; expiresAt: number | null; fetchedAt: number } | null = null;

/**
 * Custom hook to get the authentication token using NextAuth
 * @returns Object containing the token, loading state, and error state
 */
export const useAuthToken = () => {
  const { status } = useSession();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadToken = async () => {
      if (status === 'loading') {
        if (isMounted) setLoading(true);
        return;
      }

      if (status === 'unauthenticated') {
        if (!isMounted) return;
        cachedToken = null;
        setToken(null);
        setLoading(false);
        setError(new Error('Not authenticated'));
        return;
      }

      const now = Date.now();
      if (cachedToken && now - cachedToken.fetchedAt < TOKEN_CACHE_TTL_MS) {
        if (cachedToken.expiresAt && cachedToken.expiresAt <= now) {
          cachedToken = null;
        } else {
          if (!isMounted) return;
          setToken(cachedToken.token);
          setLoading(false);
          setError(null);
          return;
        }
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        const response = await fetch('/api/auth/token', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        });

        if (!response.ok) {
          throw new Error(`Token fetch failed: ${response.status}`);
        }

        const data = (await response.json()) as AuthTokenResponse;
        const resolvedToken = data.accessToken || null;
        const expiresAt = data.expires_at ? data.expires_at * 1000 : null;

        if (expiresAt && expiresAt <= Date.now()) {
          throw new Error('Token has expired');
        }

        cachedToken = {
          token: resolvedToken,
          expiresAt,
          fetchedAt: Date.now(),
        };

        if (!isMounted) return;
        setToken(resolvedToken);
        setLoading(false);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setToken(null);
        setLoading(false);
        setError(err instanceof Error ? err : new Error('Failed to fetch token'));
      }
    };

    loadToken();

    return () => {
      isMounted = false;
    };
  }, [status]);

  return {
    token,
    loading,
    error,
  };
};