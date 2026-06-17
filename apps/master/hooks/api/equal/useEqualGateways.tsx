import { useState, useCallback } from "react";

const API_URL =
  "https://api.equal.in/business/gateways?business_id=equal.business.56d07451-986e-4125-8116-08c8749ff8d1";

const AUTH_TOKEN =
  "Basic ZXF1YWwuYnVzaW5lc3MuNTZkMDc0NTEtOTg2ZS00MTI1LTgxMTYtMDhjODc0OWZmOGQxIzk2ZTQzMGU4LWY0MWItNDIxZi1hMTE2LWIwZGFmMzQ4N2YxNTpXRXVfTF9sQzJlUXA1ZGFkSktVWVZBbmRmSnRGS1YzckVPaldYOWpTdDQxZzVHMGJ4NHZzMXJBYmFrdUg3LWlJdzJlMnpybWxobXU0Z2RERm9oVnNsZz09";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface Gateway {
  [key: string]: unknown;
}

export interface EqualGatewaysResponse {
  data: Gateway[];
  [key: string]: unknown;
}

interface UseEqualGatewaysReturn {
  data: EqualGatewaysResponse | null;
  loading: boolean;
  error: string | null;
  fetchGateways: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

const useEqualGateways = (): UseEqualGatewaysReturn => {
  const [data, setData] =
    useState<EqualGatewaysResponse | null>(null);

  const [loading, setLoading] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string | null>(null);

  const fetchGateways = useCallback(async () => {

    setLoading(true);
    setError(null);

    try {

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: AUTH_TOKEN,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      // Handle non-200 responses
      if (!response.ok) {
        console.error("❌ API returned error response");

        const errorText = await response.text();

        console.error("📛 Backend Error Response:");
        console.error(errorText);

        throw new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result =
        (await response.json()) as EqualGatewaysResponse;

      if (!result) {
        throw new Error("Empty response received");
      }
      setData(result);
    } catch (err: unknown) {
      console.error("🔥 FETCH FAILED");

      if (err instanceof Error) {
        console.error("❌ Error Name:", err.name);
        console.error("❌ Error Message:", err.message);
        console.error("❌ Error Stack:", err.stack);
      }

      console.error("❌ Full Error Object:", err);

      // Detect possible CORS issue
      if (
        err instanceof TypeError &&
        err.message.includes("fetch")
      ) {
        console.error(
          "🚨 POSSIBLE CORS ERROR OR NETWORK FAILURE"
        );
      }

      const message =
        err instanceof Error
          ? err.message
          : "Unknown error occurred";

      setError(message);
    } finally {

      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchGateways,
  };
};

export default useEqualGateways;