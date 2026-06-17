"use client";

import { useCallback, useRef, useState } from "react";
import {
  deepClone,
  getModifications,
  getFieldsFromModifications,
  compressModifications,
} from "../../utils/audit/auditTrailUtils";

/** Single modification record for one field */
export interface AuditModification {
  fieldName: string;
  index: number | null;
  operation: "update" | "add" | "delete" | "create";
}

/** Audit object matching your backend shape */
export interface AuditTrailPayload {
  organizationCode: string;
  tenantCode: string;
  performedBy: string;
  performedAt: string;
  entityName: string;
  entityID: string | null;
  fields: string[];
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  modifications: AuditModification[];
}

export interface AuditTrailEntry {
  audit: AuditTrailPayload;
  oldValues: Record<string, unknown> | unknown[];
  newValues: Record<string, unknown> | unknown[];
}

export interface UseAuditTrailAlertOptions {
  /** Show browser alert when recording (default: true) */
  showAlert?: boolean;
  /** Custom formatter for alert message */
  formatAlertMessage?: (entry: AuditTrailEntry) => string;
}

const defaultFormatMessage = (entry: AuditTrailEntry): string => {
  return JSON.stringify({ audit: entry.audit }, null, 2);
};

// ============================================================================
// MAIN HOOK (State Management & Orchestration)
// ============================================================================

export interface RecordAuditMetadata {
  entityName: string;
  entityID?: string | null;
  tenantCode?: string;
  organizationCode?: string;
  performedBy?: string;
}

/**
 * Custom hook for audit trail: stores old values (e.g. on page load), then on submit
 * accepts new values and builds an audit object with fields + modifications.
 * Returns { audit, oldValues, newValues } and optionally shows it in an alert.
 * 
 * Supports deeply nested JSON structures like:
 * { deployment: { subsidiary: { subsidiaryName: "..." }, division: { ... } } }
 * 
 * Generates field paths like: "deployment.subsidiary.subsidiaryName"
 * Works with flat objects, nested JSON, and arrays of JSON.
 */
export function useAuditTrailAlert(options: UseAuditTrailAlertOptions = {}) {
  const { showAlert = true, formatAlertMessage = defaultFormatMessage } = options;
  const [lastEntry, setLastEntry] = useState<AuditTrailEntry | null>(null);
  const lastEntryRef = useRef<AuditTrailEntry | null>(null);
  const oldValuesRef = useRef<Record<string, unknown> | unknown[]>({});

  /** 
   * Call when form initially loads (e.g. edit mode) to set baseline "old" values. 
   * Accepts plain object, nested JSON (e.g., { deployment: { subsidiary: {...} } }), or array of JSON.
   * The structure should match the structure passed to recordAndShowAudit for accurate diffing.
   */
  const setOldValues = useCallback((values: Record<string, unknown> | unknown[]) => {
    oldValuesRef.current = deepClone(values);
  }, []);

  /**
   * Record audit by passing new values and metadata. Old values are taken from
   * the last setOldValues() call. Works with flat object, nested JSON, or array of JSON.
   * Builds audit.fields and audit.modifications from deep diff.
   * 
   * Example: For nested structure { deployment: { subsidiary: { subsidiaryName: "A" } } },
   * generates field paths like "deployment.subsidiary.subsidiaryName" in audit.fields.
   */
  const recordAndShowAudit = useCallback(
    (
      newValues: Record<string, unknown> | unknown[],
      metadata: RecordAuditMetadata & { tenantCode?: string; organizationCode?: string }
    ) => {
      const oldSnapshot = deepClone(oldValuesRef.current);
      const newSnapshot = deepClone(newValues);
      const tenantCode = metadata.tenantCode ?? "";
      const organizationCode = metadata.organizationCode ?? metadata.tenantCode ?? "";
      const entityID = metadata.entityID ?? null;
      const entityName = metadata.entityName ?? "";
      const performedBy = metadata.performedBy ?? "user";

      const rawModifications = getModifications(
        oldValuesRef.current as Record<string, unknown> | unknown[],
        (newValues as Record<string, unknown> | unknown[])
      );
      const modifications = compressModifications(rawModifications);
      const fields = getFieldsFromModifications(modifications);

      const audit: AuditTrailPayload = {
        organizationCode,
        tenantCode,
        performedBy,
        performedAt: new Date().toISOString().slice(0, 19),
        entityName,
        entityID: entityID != null ? String(entityID) : null,
        fields,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        modifications,
      };

      const entry: AuditTrailEntry = {
        audit,
        oldValues: (oldSnapshot as Record<string, unknown> | unknown[]) ?? {},
        newValues: (newSnapshot as Record<string, unknown> | unknown[]) ?? {},
      };
      setLastEntry(entry);
      lastEntryRef.current = entry;

      if (showAlert) {
        alert(formatAlertMessage(entry));
      }

      return entry;
    },
    [showAlert, formatAlertMessage]
  );

  /**
   * Legacy: record with full payload (e.g. existing code that passes json with data, tenant, etc).
   * Extracts old values from ref, new values from payload.data, and metadata from payload.
   */
  const recordAndShowAuditFromPayload = useCallback(
    (payload: {
      tenant?: string;
      id?: string | null;
      collectionName?: string;
      data?: Record<string, unknown>;
      [key: string]: unknown;
    }) => {
      const data = (payload.data ?? payload) as Record<string, unknown>;
      const entityName = (payload.collectionName as string) ?? "company_employee";
      return recordAndShowAudit(data, {
        entityName,
        entityID: payload.id ?? null,
        tenantCode: (payload.tenant as string) ?? "",
        organizationCode: (payload.tenant as string) ?? "",
        performedBy: "user",
      });
    },
    [recordAndShowAudit]
  );

  const showLastAuditAlert = useCallback(() => {
    const entry = lastEntryRef.current ?? lastEntry;
    if (entry) {
      alert(formatAlertMessage(entry));
    } else {
      alert("No audit trail entry recorded yet.");
    }
  }, [lastEntry, formatAlertMessage]);

  return {
    lastEntry,
    setOldValues,
    recordAndShowAudit,
    recordAndShowAuditFromPayload,
    showLastAuditAlert,
  };
}
