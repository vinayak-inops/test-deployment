import { useMemo } from 'react';

// Re-export the useCurrentPageInfo hook
export { useCurrentPageInfo } from './useCurrentPageInfo';
export type { CurrentPageInfo } from './useCurrentPageInfo';

// Re-export the route extraction hooks
export { useExtractRoutes, useExtractAllRoutes, useIsRouteAllowed } from './useExtractRoutes';

// Function to extract allowed screen names from adminRole for specified service
const extractAllowedScreens = (adminRole: any, serviceName: string): string[] => {
  if (!adminRole?.screenPermissions) return [];
  
  // Find the specified service from screenPermissions
  const targetService = adminRole.screenPermissions.find((service: any) => service.serviceName === serviceName);
  
  if (!targetService || !targetService.screens) return [];
  
  // Extract screen names from the specified service screens array
  const allowedScreens = targetService.screens.map((screen: any) => screen.screenName);
  
  return allowedScreens;
};

// Recursive function to filter navigation items at any depth
const filterNavigationRecursively = (items: any[], allowedScreens: string[]): any[] => {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  return items
    .map((item: any) => {
      // STRICT RULE: If page is undefined or not in allowedScreens, remove item
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
};

// Hook to filter navigation items based on adminRole permissions
export const useFilteredNavigation = (navItems: any[], adminRole: any, serviceName: string = 'muster') => {
  return useMemo(() => {

    // Safety check for navItems
    if (!navItems || !Array.isArray(navItems)) {
      console.warn("useFilteredNavigation: navItems is not a valid array");
      return [];
    }
    
    if (!adminRole?.screenPermissions) {
      return navItems;
    }
    
    // Extract allowed screen names from specified service
    const allowedScreens = extractAllowedScreens(adminRole, serviceName);
    
    if (allowedScreens.length === 0) {
      return navItems;
    }
    
    
    // Use recursive filtering for the entire navigation structure
    const filteredNav = filterNavigationRecursively(navItems, allowedScreens);
    
    return filteredNav;
  }, [navItems, adminRole, serviceName]);
};