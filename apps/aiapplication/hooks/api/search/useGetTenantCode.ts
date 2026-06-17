"use client"

import { useMemo } from 'react'

// Read cookie helper
const getCookie = (name: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      const value = cookie.substring(name.length + 1);
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return undefined;
};

export const useGetTenantCode = () => {
  const tenantCode = useMemo(() => {
    try {
      const cookieVal = getCookie("keyclockroleinfo");
      if (cookieVal) {
        const parsed = JSON.parse(cookieVal);
        return parsed.org || ''; // Default to  if not found
      }
    } catch (error) {
    }
    return ''; // Default fallback
  }, []);

  return tenantCode;
};
