import { useMemo } from "react"

// Re-export the useCurrentPageInfo hook
export { useCurrentPageInfo } from "./useCurrentPageInfo"
export type { CurrentPageInfo } from "./useCurrentPageInfo"

// Re-export the route extraction hooks
export { useExtractRoutes, useExtractAllRoutes, useIsRouteAllowed } from "./useExtractRoutes"

const hasAnyTruePermission = (screen: any): boolean => {
  if (!screen?.permissions || typeof screen.permissions !== "object") {
    return true
  }
  return Object.values(screen.permissions).some((value: any) => value === true)
}

const uniqSorted = (arr: string[]): string[] => {
  const seen: Record<string, true> = {}
  const out: string[] = []
  for (let i = 0; i < arr.length; i += 1) {
    const v = arr[i]
    if (!seen[v]) {
      seen[v] = true
      out.push(v)
    }
  }
  out.sort()
  return out
}

const extractAllowedScreensForObjectService = (
  adminRole: any,
  serviceName: string
): string[] => {
  if (!adminRole || typeof adminRole !== "object") return []

  const serviceObject = (adminRole as any)[serviceName]
  if (!serviceObject || typeof serviceObject !== "object") return []

  // New schema: hrapprover: { contractEmployeeApprover: { permissions, isActive } }
  if (!Array.isArray(serviceObject)) {
    const keys = Object.keys(serviceObject)
    return keys.filter((screenName) => {
      const screen = serviceObject[screenName]
      if (!screen || typeof screen !== "object") return false

      const screenIsActive = (screen as any)?.isActive ?? (screen as any)?.enabled
      if (screenIsActive === false) return false
      return hasAnyTruePermission(screen)
    })
  }

  // Backward compatibility: hrapprover: [{ screenName, permissions, isActive }]
  return serviceObject
    .filter((screen: any) => {
      if (!screen || typeof screen !== "object") return false
      if (!screen.screenName) return false

      const screenIsActive = (screen as any)?.isActive ?? (screen as any)?.enabled
      if (screenIsActive === false) return false
      return hasAnyTruePermission(screen)
    })
    .map((screen: any) => screen.screenName)
}

const extractAllowedScreensByObjectKey = (
  adminRole: any,
  serviceNames: string | string[]
): string[] => {
  const services = Array.isArray(serviceNames) ? serviceNames : [serviceNames]
  const seen: Record<string, true> = {}
  const allAllowedScreens: string[] = []

  services.forEach((serviceName) => {
    const screens = extractAllowedScreensForObjectService(adminRole, serviceName)
    screens.forEach((screen) => {
      if (!seen[screen]) {
        seen[screen] = true
        allAllowedScreens.push(screen)
      }
    })
  })

  return allAllowedScreens
}

function filterNavigationRecursively(items: any[], allowedScreens: string[]): any[] {
  if (!items || !Array.isArray(items)) {
    return []
  }

  return items
    .map((item: any) => {
      if (!item.page || !allowedScreens.includes(item.page)) {
        return null
      }

      if (item.items && Array.isArray(item.items)) {
        const filteredNestedItems = filterNavigationRecursively(item.items, allowedScreens)
        if (filteredNestedItems.length === 0) {
          return null
        }
        return {
          ...item,
          items: filteredNestedItems,
        }
      }

      return item
    })
    .filter(Boolean)
}

// Hook to filter navigation using object-key permission schema (e.g. hrapprover)
export const useFilteredNavigationByObjectKey = (
  navItems: any[],
  adminRole: any,
  serviceName: string | string[] = "hrapprover"
) => {
  return useMemo(() => {
    if (!navItems || !Array.isArray(navItems)) {
      return []
    }
    if (!adminRole || typeof adminRole !== "object") {
      return []
    }

    const normalizedServices = Array.isArray(serviceName) ? serviceName : [serviceName]
    const serviceKey = uniqSorted(normalizedServices).join("|")
    const allowedScreens = extractAllowedScreensByObjectKey(
      adminRole,
      serviceKey ? serviceKey.split("|") : normalizedServices
    )

    if (allowedScreens.length === 0) {
      return []
    }

    return filterNavigationRecursively(navItems, allowedScreens)
  }, [
    navItems,
    adminRole,
    Array.isArray(serviceName) ? uniqSorted(serviceName).join("|") : serviceName,
  ])
}