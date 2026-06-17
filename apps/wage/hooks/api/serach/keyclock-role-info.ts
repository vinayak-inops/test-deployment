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

export const useKeyclockRoleInfo = () => {
  const employeeId = useMemo(() => {
    try {
      const raw = getCookie('keyclockroleinfo');
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      return parsed?.employeeId || parsed?.employeeID || "";
    } catch {
      return "";
    }
  }, []);

  const entitlementCode = useMemo(() => {
    try {
      const raw = getCookie('keyclockroleinfo');
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      const groups: string[] = Array.isArray(parsed?.groups) ? parsed.groups.map(String) : [];
      const matched =
        groups.find((group) => {
          const upper = group.toUpperCase();
          return upper.includes("ECT-CLMS") || upper.includes("ECT-CHT");
        }) || "";
      return matched;
    } catch {
      return "";
    }
  }, []);

  return { employeeId, entitlementCode };
};
