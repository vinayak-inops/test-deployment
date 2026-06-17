import { useMemo } from 'react';

// Re-export the useCurrentPageInfo hook
export { useCurrentPageInfo } from './useCurrentPageInfo';
export type { CurrentPageInfo } from './useCurrentPageInfo';

// Re-export the route extraction hooks
export { useExtractRoutes, useExtractAllRoutes, useIsRouteAllowed } from './useExtractRoutes';

// Function to check if screen has any true permission values
const hasAnyTruePermission = (screen: any): boolean => {
  // If permissions not present, allow it directly
  if (!screen.permissions || typeof screen.permissions !== 'object') {
    return true;
  }
  
  // Check if any permission value is true
  const hasTruePermission = Object.values(screen.permissions).some((value: any) => value === true);
  
  return hasTruePermission;
};

// Helper: unique + sort without using Set (keeps compatibility with older TS targets)
const uniqSorted = (arr: string[]): string[] => {
  const seen: Record<string, true> = {};
  const out: string[] = [];
  for (let i = 0; i < arr.length; i += 1) {
    const v = arr[i];
    if (!seen[v]) {
      seen[v] = true;
      out.push(v);
    }
  }
  out.sort();
  return out;
};

// Function to extract allowed screen names from adminRole for a single service
const extractAllowedScreensForService = (adminRole: any, serviceName: string): string[] => {
  if (!adminRole?.screenPermissions) return [];
  
  // Find the specified service from screenPermissions
  const targetService = adminRole.screenPermissions.find((service: any) => service.serviceName === serviceName);
  
  if (!targetService || !targetService.screens) return [];

  // Only enforce service-level isActive/enabled if "permissions" structure exists.
  // If permissions key is not present, we allow screens directly (no isActive gating).
  const serviceHasPermissionsKey = Array.isArray(targetService.screens)
    ? targetService.screens.some(
        (s: any) => s?.permissions && typeof s.permissions === 'object'
      )
    : false;
  if (serviceHasPermissionsKey) {
    const serviceIsActive = (targetService as any)?.isActive ?? (targetService as any)?.enabled;
    if (serviceIsActive === false) return [];
  }
  
  // Extract screen names only if they have at least one true permission
  const allowedScreens = targetService.screens
    .filter((screen: any) => {
      // If permissions key is NOT present, allow directly (no isActive gating).
      if (!screen?.permissions || typeof screen.permissions !== 'object') {
        return true;
      }

      // If permissions key IS present, then enforce screen-level isActive/enabled
      const screenIsActive = (screen as any)?.isActive ?? (screen as any)?.enabled;
      if (screenIsActive === false) return false;
      return hasAnyTruePermission(screen);
    })
    .map((screen: any) => screen.screenName);
  
  return allowedScreens;
};

// Function to extract allowed screen names from adminRole for multiple services
const extractAllowedScreens = (adminRole: any, serviceNames: string | string[]): string[] => {
  // Normalize to array
  const services = Array.isArray(serviceNames) ? serviceNames : [serviceNames];
  
  // Extract screens from all specified services and combine them
  const seen: Record<string, true> = {};
  const allAllowedScreens: string[] = [];
  
  services.forEach((serviceName) => {
    const screens = extractAllowedScreensForService(adminRole, serviceName);
    screens.forEach((screen) => {
      if (!seen[screen]) {
        seen[screen] = true;
        allAllowedScreens.push(screen);
      }
    });
  });
  
  return allAllowedScreens;
};

// Recursive function to filter navigation items at any depth
function filterNavigationRecursively(items: any[], allowedScreens: string[]): any[] {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  return items
    .map((item: any) => {
      // Check if page matches any screenName in allowedScreens
      if (!item.page || !allowedScreens.includes(item.page)) {
        return null; // Remove this item
      }

      // If item has nested items, recursively filter them
      if (item.items && Array.isArray(item.items)) {
        const filteredNestedItems = filterNavigationRecursively(item.items, allowedScreens);
        
        // If no nested items are allowed, remove the parent item
        if (filteredNestedItems.length === 0) {
          return null;
        }
        
        // Return item with filtered nested items
        return {
          ...item,
          items: filteredNestedItems
        };
      }

      // Return item as is (it passed the page check above)
      return item;
    })
    .filter(Boolean); // Remove null items
}

// Hook to filter navigation items based on adminRole permissions
export const useFilteredNavigation = (navItems: any[], adminRole: any, serviceName: string | string[] = 'master') => {
  return useMemo(() => {

    // Safety check for navItems
    if (!navItems || !Array.isArray(navItems)) {
      return [];
    }
    
    if (!adminRole?.screenPermissions) {
      return [];
    }

    // Normalize service names (supports string or array); keep unique + stable order for memo deps
    const normalizedServices = Array.isArray(serviceName) ? serviceName : [serviceName];
    const serviceKey = uniqSorted(normalizedServices).join('|');
    
    // Extract allowed screen names from specified service(s)
    const allowedScreens = extractAllowedScreens(adminRole, serviceKey ? serviceKey.split('|') : normalizedServices);
    
    if (allowedScreens.length === 0) {
      return [];
    }
    
    // Use recursive filtering for the entire navigation structure
    const filteredNav = filterNavigationRecursively(navItems, allowedScreens);
    
    return filteredNav;
  }, [
    navItems,
    adminRole,
    // Important: allow callers to pass inline arrays without causing needless recalcs
    Array.isArray(serviceName) ? uniqSorted(serviceName).join('|') : serviceName,
  ]);
};