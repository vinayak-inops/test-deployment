import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import useCurrentDomain from "@/hooks/api/useCurrentDomain";

interface UseModeCheckProps {
    allRoutes: any[];
    adminRole: any;
    currentPageInfo: any;
}

export const useModeCheck = ({ allRoutes, adminRole,currentPageInfo }: UseModeCheckProps) => {
    const router = useRouter();    
    const [isLoading, setIsLoading] = useState(true);
  const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()

    // Function to check which mode is present in searchParams
    const getCurrentMode = (searchParams: string | undefined): string | null => {
        if (!searchParams) return null;

        if (searchParams.includes('?mode=edit')) return 'edit';
        if (searchParams.includes('?mode=view')) return 'view';
        if (searchParams.includes('?mode=add')) return 'add';
        if (searchParams.includes('?mode=all')) return 'all';

        return null;
    };

    // Function to check if searchParams includes any of the specified modes
    const checkMode = (searchParams: string | undefined): boolean => {
        if (!searchParams) return false;
        return searchParams.includes('?mode=edit') ||
            searchParams.includes('?mode=view') ||
            searchParams.includes('?mode=add') ||
            searchParams.includes('?mode=all');
    };

    // Function to check if a route exists in allRoutes array
    const checkRouteExists = (routeString: string): boolean => {
        
        // Check if allRoutes contains the routeString directly (for string arrays)
        if (allRoutes.includes(routeString)) {
            return true;
        }
        
        // Check if allRoutes contains objects with route property
        for (const route of allRoutes) {
            if (route && typeof route === 'object' && route.route === routeString) {
                return true;
            }
        }
        
        return false;
    };

        // Function to handle mode checking and routing logic
    const handleModeCheck = useCallback(async () => {
        setIsLoading(true);

        try {
            // Check if all required data is available
            if (!currentPageInfo || !allRoutes || !adminRole?.screenPermissions?.length) {
                // Silently skip - data is still loading
                setIsLoading(false);
                return { exists: false, currentMode: null, newPageString: null };
            }

            const currentPage = currentPageInfo?.pathname;
            const searchParams = currentPageInfo?.searchParams;

            // First, check if the current page (without mode) exists in allRoutes
            const baseRouteExists = checkRouteExists(currentPage);

            // If no search params, just check if base route exists
            if (searchParams == "") {
                if (baseRouteExists) {
                    // alert("Base route found, no mode needed");
                    setIsLoading(false);
                    return { exists: true, currentMode: null, newPageString: currentPage };
                } else {
                    router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/launchdesk`);
                    setIsLoading(false);
                    return { exists: false, currentMode: null, newPageString: null };
                }
            }

            // Check if search params contain a mode
            const hasMode = checkMode(searchParams);
            
            if (!hasMode) {
                if (baseRouteExists) {
                    setIsLoading(false);
                    return { exists: true, currentMode: null, newPageString: currentPage };
                } else {
                    router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/launchdesk`);
                    setIsLoading(false);
                    return { exists: false, currentMode: null, newPageString: null };
                }
            }

            // Mode exists, get the current mode
            const currentMode = getCurrentMode(searchParams);

            // Create new string with current page + mode
            const newPageString = currentPage + "?mode=" + currentMode;

            // Check if this new string exists in allRoutes array
            const routeExists = checkRouteExists(newPageString);

            if (routeExists) {
                setIsLoading(false);
                return { exists: true, currentMode, newPageString };
            } else {
                router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/launchdesk`);
                setIsLoading(false);
                return { exists: false, currentMode, newPageString };
            }

        } catch (error) {
            setIsLoading(false);
            return { exists: false, currentMode: null, newPageString: null };
        }
    }, [currentPageInfo, allRoutes, adminRole, router]);

    return {
        getCurrentMode,
        checkMode,
        checkRouteExists,
        handleModeCheck,
        currentPageInfo,
        isLoading
    };
};