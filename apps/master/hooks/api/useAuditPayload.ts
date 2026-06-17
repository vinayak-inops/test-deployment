"use client";

import { useMemo } from "react";
import { useGetTenantCode } from "./search/useGetTenantCode";
import { useKeyclockRoleInfo } from "./search/keyclock-role-info";

export type AuditPayload = {
  organizationCode: string;
  tenantCode: string;
  performedBy: string;
  performedAt: string;
  entityName: string;
  entityID: string;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
};

export type UseAuditPayloadParams = {
  entityName: string;
  entityID: string;
  performedBy?: string;
  ipAddress?: string;
  sessionId?: string;
};

const getOrCreateSessionId = (providedSessionId?: string): string => {
  if (providedSessionId) return providedSessionId;
  if (typeof window === "undefined") return "sess_server";

  const storageKey = "audit_session_id";
  const existing = window.sessionStorage.getItem(storageKey);
  if (existing) return existing;

  const generated = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem(storageKey, generated);
  return generated;
};

const getPerformedAt = (): string => new Date().toISOString().slice(0, 19);

export const useAuditPayload = ({
  entityName,
  entityID,
  performedBy,
  ipAddress,
  sessionId,
}: UseAuditPayloadParams): AuditPayload => {
  const tenantCode = useGetTenantCode();
  const { employeeId } = useKeyclockRoleInfo();

  return useMemo(
    () => ({
      organizationCode: tenantCode || "",
      tenantCode: tenantCode || "",
      performedBy: performedBy || employeeId || "user",
      performedAt: getPerformedAt(),
      entityName: entityName || "",
      entityID: entityID || "",
      ipAddress: ipAddress || "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      sessionId: getOrCreateSessionId(sessionId),
    }),
    [tenantCode, employeeId, performedBy, entityName, entityID, ipAddress, sessionId],
  );
};

