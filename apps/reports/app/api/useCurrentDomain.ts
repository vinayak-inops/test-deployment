import { useEffect, useState } from "react";

export default function useCurrentDomain(): string | null {
  const [domain, setDomain] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isReverseProxy: boolean =
      process.env.NEXT_PUBLIC_REVERSEPROXY === "TRUE";

    if (isReverseProxy) {
      setDomain(window.location.origin); // ✅ dynamic domain
    } else {
      // Use primary origin from comma-separated env variable
      const envOrigins = process.env.NEXT_PUBLIC_NEXTAUTH_URL || '';
      if (envOrigins) {
        const origins = envOrigins.split(',').map((o) => o.trim()).filter(Boolean);
        setDomain(origins.length > 0 ? origins[0] : null);
      } else {
        setDomain(null);
      }
    }
  }, []);

  return domain;
}