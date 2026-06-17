import { useMemo } from "react"

export type RequiredFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type RequiredFieldConfigMap<TFieldKey extends string> = Partial<
  Record<TFieldKey, RequiredFieldConfig>
>
export type TabConfig<TFieldKey extends string> = {
  tabRequired?: boolean
  fields?: RequiredFieldConfigMap<TFieldKey>
}

const isTabConfig = <TFieldKey extends string>(
  value: unknown
): value is TabConfig<TFieldKey> => {
  return !!value && typeof value === "object" && "fields" in value
}

const isFieldConfigNode = (value: unknown): value is RequiredFieldConfig => {
  if (!value || typeof value !== "object") return false
  return "required" in value || "visible" in value || "label" in value
}

const normalizeAnyConfigToFieldMap = <TFieldKey extends string>(
  value: unknown
): RequiredFieldConfigMap<TFieldKey> => {
  if (!value || typeof value !== "object") return {}

  if (isTabConfig<TFieldKey>(value)) {
    return value.fields ?? {}
  }

  const obj = value as Record<string, unknown>

  // Supports nested section style like:
  // { local: { localAddressLine1: { required: true } }, corporate: { ... } }
  const mergedNested: Record<string, RequiredFieldConfig> = {}
  let hasNestedFieldNodes = false
  Object.values(obj).forEach((section) => {
    if (!section || typeof section !== "object" || Array.isArray(section)) return
    Object.entries(section as Record<string, unknown>).forEach(([k, v]) => {
      if (isFieldConfigNode(v)) {
        mergedNested[k] = v
        hasNestedFieldNodes = true
      }
    })
  })
  if (hasNestedFieldNodes) {
    return mergedNested as RequiredFieldConfigMap<TFieldKey>
  }

  // Flat map style: { fieldA: { required: true }, fieldB: { required: false } }
  const flat: Record<string, RequiredFieldConfig> = {}
  Object.entries(obj).forEach(([k, v]) => {
    if (isFieldConfigNode(v)) flat[k] = v
  })
  return flat as RequiredFieldConfigMap<TFieldKey>
}

interface UseDynamicSchemaConfigParams<
  TSchema,
  TEmptyValues,
  TFieldKey extends string,
  TFieldConfig,
> {
  schema: TSchema
  fieldConfig: TFieldConfig
  defaultRequired?: Partial<Record<TFieldKey, boolean>>
  emptyValues: TEmptyValues
}

export function useDynamicSchemaConfig<
  TSchema,
  TEmptyValues,
  TFieldKey extends string,
  TFieldConfig,
>({
  schema,
  fieldConfig,
  defaultRequired,
  emptyValues,
}: UseDynamicSchemaConfigParams<TSchema, TEmptyValues, TFieldKey, TFieldConfig>) {
  const memoEmptyValues = useMemo<TEmptyValues>(() => {
    if (Array.isArray(emptyValues)) {
      return [...emptyValues] as TEmptyValues
    }
    if (emptyValues && typeof emptyValues === "object") {
      return { ...(emptyValues as Record<string, unknown>) } as TEmptyValues
    }
    return emptyValues
  }, [emptyValues])

  const normalizedFieldConfig = useMemo<RequiredFieldConfigMap<TFieldKey>>(() => {
    return normalizeAnyConfigToFieldMap<TFieldKey>(fieldConfig)
  }, [fieldConfig])

  const tabRequired = useMemo(() => {
    if (fieldConfig && typeof fieldConfig === "object" && "tabRequired" in (fieldConfig as Record<string, unknown>)) {
      const value = (fieldConfig as { tabRequired?: boolean }).tabRequired
      return typeof value === "boolean" ? value : true
    }
    return true
  }, [fieldConfig])

  const isRequired = (fieldKey: TFieldKey) => {
    const configRequired = normalizedFieldConfig?.[fieldKey]?.required
    if (typeof configRequired === "boolean") return configRequired
    return defaultRequired?.[fieldKey] ?? false
  }

  const isVisible = (fieldKey: TFieldKey) => {
    const configVisible = normalizedFieldConfig?.[fieldKey]?.visible
    if (typeof configVisible === "boolean") return configVisible
    return true
  }

  const getLabel = (fieldKey: TFieldKey, fallback: string) => {
    const configLabel = normalizedFieldConfig?.[fieldKey]?.label
    if (typeof configLabel === "string" && configLabel.trim().length > 0) return configLabel
    return fallback
  }

  return {
    schema,
    fieldConfig: normalizedFieldConfig,
    emptyValues: memoEmptyValues,
    tabRequired,
    isRequired,
    isVisible,
    getLabel,
  }
}
