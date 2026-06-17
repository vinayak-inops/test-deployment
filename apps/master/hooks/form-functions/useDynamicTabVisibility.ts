"use client"

import { useMemo } from "react"

type FormStructure = Record<string, unknown> | null | undefined
type TabStatus = { value: boolean; meta: number }

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const getMetaMinItems = (node: Record<string, unknown>) => {
  const meta = node.meta
  if (!isObjectRecord(meta)) return null
  return typeof meta.minItems === "number" ? meta.minItems : null
}

// Returns true when any required field is still pending.
const hasPendingRequired = (schemaNode: unknown): boolean => {
  if (!isObjectRecord(schemaNode)) return false

  // meta.minItems logic for array-like nodes.
  const minItems = getMetaMinItems(schemaNode)
  if (typeof minItems === "number") {
    return minItems > 0
  }

  // Required leaf in schema means pending by default.
  if (schemaNode.required === true) return true

  return hasPendingRequiredInObject(schemaNode)
}

const hasPendingRequiredInObject = (schemaObject: Record<string, unknown>): boolean =>
  Object.entries(schemaObject).some(([key, value]) => {
    // Ignore non-validation schema keys.
    if (key === "meta" || key === "tabRequired" || key === "label" || key === "visible") return false
    if (key === "required") return false
    if (key === "fields") return hasPendingRequired(value)

    return hasPendingRequired(value)
  })

export const isTabVisibleByConfig = (
  formStructure: FormStructure,
  configKey: string
) => {
  const sectionConfig = formStructure?.[configKey]
  if (!isObjectRecord(sectionConfig)) return false
  if (sectionConfig.tabRequired === false) return true
  return !hasPendingRequired(sectionConfig)
}

export function useDynamicTabVisibility(formStructure: FormStructure): Record<string, TabStatus> {
  return useMemo(() => {
    const result: Record<string, TabStatus> = {}
    if (!isObjectRecord(formStructure)) return result

    for (const key of Object.keys(formStructure)) {
      const sectionConfig = formStructure[key]
      if (!isObjectRecord(sectionConfig)) continue
      if (typeof sectionConfig.tabRequired !== "boolean") continue

      result[key] = {
        value: isTabVisibleByConfig(formStructure, key),
        meta: getMetaMinItems(sectionConfig) ?? 0,
      }
    }

    return result
  }, [formStructure])
}
