import { useMemo } from 'react';

// Interface for route information
export interface RouteInfo {
    screenName: string;
    route: string;
    serviceName: string;
    tileName: string;
}

/**
 * Custom hook to extract routes from adminRole permissions for specified service
 * @param adminRole - The admin role object containing screen permissions
 * @param serviceName - The service name to filter routes (default: 'master')
 * @returns Array of route strings
 */
export const useExtractRoutes = (adminRole: any, serviceName: string = 'master'): string[] => {
    return useMemo(() => {
        if (!adminRole?.screenPermissions) {
            return [];
        }
        
        // Find the specified service from screenPermissions
        const targetService = adminRole.screenPermissions.find((service: any) => service.serviceName === serviceName);
        
        if (!targetService || !targetService.screens) {
            return [];
        }
        
        // Extract route strings from the specified service screens array
        const routes: string[] = targetService.screens
            .filter((screen: any) => screen.route) // Only include screens with routes
            .map((screen: any) => screen.route);
        
        return routes;
    }, [adminRole, serviceName]);
};

/**
 * Custom hook to extract all routes from all services in adminRole
 * @param adminRole - The admin role object containing screen permissions
 * @returns Array of route strings from all services
 */
export const useExtractAllRoutes = (adminRole: any): string[] => {
    return useMemo(() => {
        if (!adminRole?.screenPermissions) {
            return [];
        }
        
        // Extract routes from all services
        const allRoutes: string[] = [];
        
        adminRole.screenPermissions.forEach((service: any) => {
            if (service.screens && Array.isArray(service.screens)) {
                const serviceRoutes = service.screens
                    .filter((screen: any) => screen.route) // Only include screens with routes
                    .map((screen: any) => screen.route);
                
                allRoutes.push(...serviceRoutes);
            }
        });
        
        return allRoutes;
    }, [adminRole]);
};

/**
 * Custom hook to check if a specific route is allowed for the user
 * @param adminRole - The admin role object containing screen permissions
 * @param targetRoute - The route to check
 * @param serviceName - The service name to check in (optional, checks all if not specified)
 * @returns boolean indicating if the route is allowed
 */
export const useIsRouteAllowed = (adminRole: any, targetRoute: string, serviceName?: string): boolean => {
    return useMemo(() => {
        if (!adminRole?.screenPermissions) {
            return false;
        }
        
        if (serviceName) {
            // Check in specific service
            const targetService = adminRole.screenPermissions.find((service: any) => service.serviceName === serviceName);
            if (!targetService?.screens) return false;
            
            return targetService.screens.some((screen: any) => screen.route === targetRoute);
        } else {
            // Check in all services
            return adminRole.screenPermissions.some((service: any) => 
                service.screens?.some((screen: any) => screen.route === targetRoute)
            );
        }
    }, [adminRole, targetRoute, serviceName]);
};

export default useExtractRoutes;