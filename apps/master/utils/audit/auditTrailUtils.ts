/**
 * Utility functions for audit trail comparison logic.
 * Handles deep comparison of nested JSON structures, arrays, and primitives.
 */

import type { AuditModification } from "../../hooks/api/useAuditTrailAlert";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** Deep clone for storing baseline (plain JSON / array of JSON). */
export function deepClone<T>(v: T): T {
  if (v === undefined || v === null || typeof v !== "object") return v;
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Normalize primitive for comparison (avoid false diffs from type coercion / case) */
export function normalizePrimitive(v: unknown): string | number | boolean | null | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string") return v.trim().toLowerCase();
  if (typeof v === "number" || typeof v === "boolean") return v;
  return undefined;
}

export function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}


function getTopLevelPath(path: string): string {
  if (!path || path === "(root)") return "(root)";
  // Normalize array indices first
  const noIndex = path.replace(/\[\d+\]/g, "[]");
  const segments = noIndex.split(".");
  return segments[0] || "(root)";
}

// ============================================================================
// PART 1: PRIMITIVE VALUE HANDLER (String, Number, Boolean)
// ============================================================================

/**
 * Handles comparison of primitive values (string, number, boolean).
 * Also handles null/undefined cases for add/delete operations.
 * 
 * @param oldVal - Old primitive value
 * @param newVal - New primitive value
 * @param path - Current field path (e.g., "deployment.subsidiary.subsidiaryCode")
 * @returns Array of modifications detected
 */
export function handlePrimitiveComparison(
  oldVal: unknown,
  newVal: unknown,
  path: string
): AuditModification[] {
  // Handle null/undefined - determine add/delete
  if (oldVal === null || oldVal === undefined) {
    if (newVal !== null && newVal !== undefined) {
      // Value was added
      const field = getTopLevelPath(path);
      return [{
        fieldName: field,
        index: null,
        operation: "add",
      }];
    }
    return [];
  }

  if (newVal === null || newVal === undefined) {
    // Value was deleted
    const field = getTopLevelPath(path);
    return [{
      fieldName: field,
      index: null,
      operation: "delete",
    }];
  }

  // Both values exist - compare primitives (string, number, boolean)
  // Normalize for comparison (trim strings, handle case)
  const oldNorm = normalizePrimitive(oldVal);
  const newNorm = normalizePrimitive(newVal);
  
  // If normalized values are different, it's an update
  if (oldNorm !== newNorm) {
    const field = getTopLevelPath(path);
    return [{
      fieldName: field,
      index: null,
      operation: "update",
    }];
  }

  // Values are the same after normalization
  return [];
}

// ============================================================================
// PART 2: OBJECT TYPE HANDLER (Nested JSON Objects)
// ============================================================================

/**
 * Handles comparison of nested object structures recursively.
 * Traverses all keys in both objects and recursively compares nested values.
 * 
 * @param oldVal - Old object value
 * @param newVal - New object value
 * @param path - Current field path (e.g., "deployment.subsidiary")
 * @param getModificationsDeep - Recursive function to handle nested comparisons
 * @returns Array of modifications detected
 */
export function handleObjectComparison(
  oldVal: Record<string, unknown>,
  newVal: Record<string, unknown>,
  path: string,
  getModificationsDeep: (oldVal: unknown, newVal: unknown, basePath: string) => AuditModification[]
): AuditModification[] {
  const out: AuditModification[] = [];
  
  // Get all keys from both objects
  const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
  
  for (const key of Array.from(allKeys)) {
    const oldKeyVal = oldVal[key];
    const newKeyVal = newVal[key];
    
    // Build nested path: e.g., "deployment.subsidiary.subsidiaryCode"
    const seg = path ? `${path}.${key}` : key;
    
    // Recurse into nested values (handles objects, arrays, and primitives)
    out.push(...getModificationsDeep(oldKeyVal, newKeyVal, seg));
  }
  
  return out;
}

// ============================================================================
// PART 3: ARRAY TYPE HANDLER
// ============================================================================

/**
 * Handles comparison of array structures.
 * Compares elements at same indices, then handles additions/deletions.
 * For arrays of objects, new object additions use "create" operation instead of "add".
 * 
 * @param oldVal - Old array value
 * @param newVal - New array value
 * @param path - Current field path (e.g., "items")
 * @param getModificationsDeep - Recursive function to handle nested comparisons
 * @returns Array of modifications detected
 */
export function handleArrayComparison(
  oldVal: unknown[],
  newVal: unknown[],
  path: string,
  getModificationsDeep: (oldVal: unknown, newVal: unknown, basePath: string) => AuditModification[]
): AuditModification[] {
  const out: AuditModification[] = [];
  const minLen = Math.min(oldVal.length, newVal.length);

  // Check if this is an array of objects (not primitives)
  // Check first element of new array or old array to determine type
  const sampleElement = newVal.length > 0 ? newVal[0] : (oldVal.length > 0 ? oldVal[0] : null);
  const isArrayOfObjects = sampleElement !== null && 
                           sampleElement !== undefined && 
                           (isPlainObject(sampleElement) || isArray(sampleElement));

  // Clean path to remove any brackets and get base name
  let cleanPath = path
    .replace(/\[\d+\]/g, "") // Remove array indices like [0], [1]
    .replace(/\[\]/g, "") // Remove empty brackets []
    .split(".")[0]; // Get top-level field name
  cleanPath = cleanPath.replace(/\[\]$/, ""); // Remove any trailing brackets
  cleanPath = cleanPath || "(root)";

  // Compare elements at same indices
  for (let i = 0; i < minLen; i++) {
    const seg = path ? `${path}[${i}]` : `[${i}]`;
    out.push(...getModificationsDeep(oldVal[i], newVal[i], seg));
  }

  // Elements removed from old array
  for (let i = minLen; i < oldVal.length; i++) {
    // Use just the base path (e.g., "licenses") without index in fieldName
    // The index number is stored in the index field
    out.push({
      fieldName: cleanPath, // Just "licenses", not "licenses[0]" or "licenses[]"
      index: i,
      operation: "delete"
    });
  }
  
  // Elements added to new array
  for (let i = minLen; i < newVal.length; i++) {
    // Use just the base path (e.g., "licenses") without index in fieldName
    // The index number is stored in the index field
    // If array of objects, use "create" operation; otherwise use "add"
    const operation = isArrayOfObjects ? "create" : "add";
    out.push({
      fieldName: cleanPath, // Just "licenses", not "licenses[0]" or "licenses[]"
      index: i,
      operation: operation
    });
  }
  
  return out;
}

// ============================================================================
// MAIN DIFF FUNCTION (Orchestrator)
// ============================================================================

/**
 * Deep diff: collect modifications (path, index, operation) for any structure.
 * Handles deeply nested structures like { deployment: { subsidiary: { subsidiaryName: "..." } } }
 * 
 * This is the main orchestrator that routes to appropriate handlers based on value types.
 * 
 * Logic flow:
 * 1. Check if both values are strictly equal → no change
 * 2. Check if both are arrays → route to array handler
 * 3. Check if both are objects → route to object handler
 * 4. Otherwise → route to primitive handler
 */
export function getModificationsDeep(
  oldVal: unknown,
  newVal: unknown,
  basePath: string
): AuditModification[] {
  const path = basePath || "";

  // Step 1: If both strictly equal (same reference or same primitive value), no change
  if (oldVal === newVal) {
    return [];
  }

  // Step 2: Handle arrays - route to array handler
  const oldIsArr = isArray(oldVal);
  const newIsArr = isArray(newVal);
  if (oldIsArr && newIsArr) {
    return handleArrayComparison(
      oldVal as unknown[],
      newVal as unknown[],
      path,
      getModificationsDeep
    );
  }

  // Step 3: Handle objects - route to object handler
  const oldIsObj = isPlainObject(oldVal);
  const newIsObj = isPlainObject(newVal);
  if (oldIsObj && newIsObj) {
    return handleObjectComparison(
      oldVal as Record<string, unknown>,
      newVal as Record<string, unknown>,
      path,
      getModificationsDeep
    );
  }

  // Step 4: Handle primitives, null/undefined, and type mismatches - route to primitive handler
  const primitiveResult = handlePrimitiveComparison(oldVal, newVal, path);
  if (primitiveResult.length > 0) {
    return primitiveResult;
  }

  // Step 5: Type mismatch (e.g., object vs primitive) - treat as update
  if (oldIsObj !== newIsObj || oldIsArr !== newIsArr) {
    const field = getTopLevelPath(path);
    return [{
      fieldName: field,
      index: null,
      operation: "update",
    }];
  }

  // Fallback: no change detected
  return [];
}

// ============================================================================
// STRUCTURE NORMALIZATION
// ============================================================================

/**
 * Normalize old values structure to match new values structure.
 * If new values have a nested structure (e.g., { deployment: { subsidiary: {...} } })
 * and old values are flat (e.g., { subsidiary: {...} }), wrap old values to match.
 */
export function normalizeStructures(
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): { normalizedOld: Record<string, unknown>; normalizedNew: Record<string, unknown> } {
  // If both are already objects, check if we need to normalize
  if (!isPlainObject(oldValues) || !isPlainObject(newValues)) {
    return { normalizedOld: oldValues, normalizedNew: newValues };
  }

  const oldKeys = Object.keys(oldValues);
  const newKeys = Object.keys(newValues);

  // Check if new values have a single top-level key that contains an object with keys matching old values
  // Example: oldValues = { subsidiary: {...}, division: {...} }
  //          newValues = { deployment: { subsidiary: {...}, division: {...} } }
  if (newKeys.length === 1 && oldKeys.length > 0) {
    const newTopKey = newKeys[0];
    const newTopValue = newValues[newTopKey];
    
    if (isPlainObject(newTopValue)) {
      const nestedKeys = Object.keys(newTopValue as Record<string, unknown>);
      
      // Check if all old keys exist in the nested structure
      const allOldKeysMatch = oldKeys.every(key => nestedKeys.includes(key));
      
      // Check if nested structure has the same keys as old values (or is a superset)
      if (allOldKeysMatch && nestedKeys.length >= oldKeys.length) {
        // Normalize: wrap old values in the same top-level key
        return {
          normalizedOld: { [newTopKey]: oldValues },
          normalizedNew: newValues,
        };
      }
    }
  }

  // No normalization needed
  return { normalizedOld: oldValues, normalizedNew: newValues };
}

/** Get modifications for root object/array; supports flat object, nested JSON, and array of JSON. */
export function getModifications(
  oldValues: Record<string, unknown> | unknown[],
  newValues: Record<string, unknown> | unknown[]
): AuditModification[] {
  if (Array.isArray(oldValues) && Array.isArray(newValues)) {
    return getModificationsDeep(oldValues, newValues, "");
  }
  if (!Array.isArray(oldValues) && !Array.isArray(newValues)) {
    // Normalize structures before comparison to handle flat vs nested mismatches
    const { normalizedOld, normalizedNew } = normalizeStructures(
      oldValues as Record<string, unknown>,
      newValues as Record<string, unknown>
    );
    return getModificationsDeep(normalizedOld, normalizedNew, "");
  }
  return [{ fieldName: "(root)", index: null, operation: "update" as const }];
}

/** 
 * Unique field names from modifications (for audit.fields).
 * For arrays: extracts array name without brackets (e.g., "licenses" from "licenses", "licenses[]", or "licenses[0]")
 * For objects: extracts top-level field name (e.g., "deployment" from "deployment.subsidiary.subsidiaryCode")
 */
export function getFieldsFromModifications(modifications: AuditModification[]): string[] {
  const seen = new Set<string>();
  
  for (const m of modifications) {
    if (!m.fieldName || m.fieldName === "(root)") continue;
    
    // Remove any brackets and array indices, get top-level field name
    // Examples: "licenses[0]" -> "licenses", "licenses[]" -> "licenses", "deployment.subsidiary" -> "deployment"
    let fieldName = m.fieldName
      .replace(/\[\d+\]/g, "") // Remove array indices like [0], [1]
      .replace(/\[\]/g, "") // Remove empty brackets []
      .split(".")[0]; // Get top-level field name
    
    // Remove any trailing brackets that might remain
    fieldName = fieldName.replace(/\[\]$/, "");
    
    if (fieldName && fieldName !== "(root)" && !seen.has(fieldName)) {
      seen.add(fieldName);
    }
  }
  
  // Return all unique field paths, excluding root
  return Array.from(seen).filter((f) => f && f !== "(root)");
}

/**
 * Compress modifications to avoid duplicates while preserving array indices and operation types.
 * - For arrays: uses base array name (e.g., "licenses") with index in index field (e.g., 0, 1)
 * - For non-arrays: removes duplicates, keeps one entry per fieldName
 * - Preserves correct operation types: "add", "update", "delete", or "create" based on what was detected
 * - Ensures fieldName never contains brackets (e.g., "licenses" not "licenses[]" or "licenses[0]")
 */
export function compressModifications(modifications: AuditModification[]): AuditModification[] {
  const byKey = new Map<string, AuditModification>();

  for (const m of modifications) {
    if (!m.fieldName || m.fieldName === "(root)") continue;
    
    // Clean fieldName: remove all brackets and get base name
    let cleanFieldName = m.fieldName
      .replace(/\[\d+\]/g, "") // Remove array indices like [0], [1]
      .replace(/\[\]/g, "") // Remove empty brackets []
      .split(".")[0]; // Get top-level field name
    cleanFieldName = cleanFieldName.replace(/\[\]$/, ""); // Remove any trailing brackets
    
    // Check if this is an array modification (has index in m.index or in original fieldName)
    const arrayMatch = m.fieldName.match(/^([^\[]+)\[(\d+)\]/);
    const isArray = arrayMatch || (m.index !== null && m.index !== undefined);
    
    if (isArray) {
      // For arrays: extract base name and use index from match or from m.index
      const baseName = arrayMatch ? arrayMatch[1] : cleanFieldName;
      const indexNum = m.index !== null ? m.index : (arrayMatch ? parseInt(arrayMatch[2], 10) : null);
      
      // Use baseName + index as key to preserve unique entries per array element
      const key = indexNum !== null ? `${baseName}[${indexNum}]` : baseName;
      
      if (!byKey.has(key)) {
        byKey.set(key, {
          fieldName: baseName, // Just "licenses", not "licenses[0]" or "licenses[]"
          index: indexNum, // Keep the index number
          operation: m.operation || "update", // Preserve original operation (add/update/delete/create)
        });
      } else {
        // If duplicate found, prioritize "delete" > "create" > "add" > "update" for same field+index
        const existing = byKey.get(key)!;
        const priority: Record<"delete" | "create" | "add" | "update", number> = { 
          delete: 4, 
          create: 3, 
          add: 2, 
          update: 1 
        };
        if (priority[m.operation as keyof typeof priority] > priority[existing.operation as keyof typeof priority]) {
          byKey.set(key, {
            ...existing,
            operation: m.operation,
          });
        }
      }
    } else {
      // For non-arrays: use cleaned fieldName as key, remove duplicates but preserve operation type
      const key = cleanFieldName;
      if (!byKey.has(key)) {
        byKey.set(key, {
          fieldName: cleanFieldName, // Clean field name without brackets
          index: null,
          operation: m.operation || "update", // Preserve original operation (add/update/delete/create)
        });
      } else {
        // If duplicate found, prioritize "delete" > "create" > "add" > "update" for same field
        const existing = byKey.get(key)!;
        const priority: Record<"delete" | "create" | "add" | "update", number> = { 
          delete: 4, 
          create: 3, 
          add: 2, 
          update: 1 
        };
        if (priority[m.operation as keyof typeof priority] > priority[existing.operation as keyof typeof priority]) {
          byKey.set(key, {
            ...existing,
            operation: m.operation,
          });
        }
      }
    }
  }

  return Array.from(byKey.values());
}
