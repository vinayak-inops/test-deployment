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
      setDomain(null);
    }
  }, []);

  return domain;
}