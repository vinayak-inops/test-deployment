"use client"

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@inops/store/src/store';
import { useAdminRole } from "@inops/store/src/hooks/useAdminRole";
import { useExtractRoutes, useExtractAllRoutes, useCurrentPageInfo } from '@/hooks/role-control/useRoleControl';
import { useModeCheck } from '@/hooks/role-control/useModeCheck';
import { useAuthToken } from '@repo/ui/hooks/auth/useAuthToken';
import { apiRequest, clearApiData } from '@inops/store/src/sagas/api-call/api-slice';
import { hierarchyRequest } from '@inops/store/src/sagas/hierarchy/hierarchy-slice';
import { Loader2 } from 'lucide-react';
import { useGetTenantCode } from '@/hooks/api/serach/useGetTenantCode';
import { usePathname } from 'next/navigation';
import { useKeyclockRoleInfo } from '@/hooks/search/keyclock-role-info';

// Types for better type safety
interface RoleInfo {
  groups: string[];
}

interface RolePermission {
  entitlementCode: string;
  screenPermissions: any[];
  [key: string]: any;
}

export default function AdminWrapper({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch();
    const { adminRole, adminUser, setAdminRoleData, setAdminUserData } = useAdminRole();
    const { token, loading: tokenLoading } = useAuthToken();
    const [roleClaim, setRoleClaim] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isHierarchyInitialized, setIsHierarchyInitialized] = useState(false);
    const tenantCode = useGetTenantCode();
    const pathname = usePathname();
    const apiState = useSelector((state: RootState) => (state as any).api);
    const { employeeId } = useKeyclockRoleInfo();
    
    // Allow certain routes without role permission checks
    const allowedRoutes = ['/', '/login'];
    const isAllowedRoute = allowedRoutes.includes(pathname);

    // Memoized cookie parsing to avoid re-parsing on every render
    const getCookie = useCallback((name: string): string | undefined => {
        if (typeof window === 'undefined') return undefined;
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                const value = cookie.substring(name.length + 1);
                try {
                    return decodeURIComponent(value);
                } catch {
                    return value;
                }
            }
        }
        return undefined;
    }, []);

    // Get stored role information from cookies with proper error handling
    const storedRoleInfo = useMemo((): RoleInfo | null => {
        try {
            const keyclockroleinfo = getCookie("keyclockroleinfo");
            if (keyclockroleinfo) {
                const parsed = JSON.parse(keyclockroleinfo);
                // Validate the structure
                if (parsed && Array.isArray(parsed.groups)) {
                    return parsed as RoleInfo;
                }
            }
        } catch (error) {
            console.error("Error parsing role info cookie:", error);
        }
        return null;
    }, [getCookie]);

    // Extract role claim with proper validation
    useEffect(() => {
        if (!storedRoleInfo?.groups) {
            setRoleClaim(null);
            return;
        }

        const role = storedRoleInfo.groups
            .map(String)
            .find((group) => {
                const upperGroup = group.toUpperCase();
                return upperGroup.includes("ECT-CLMS") || upperGroup.includes("ECT-CHT");
            });
        
        setRoleClaim(role ?? null);
    }, [storedRoleInfo]);

    // Function to fetch role permissions using Redux Saga
    const fetchRolePermissions = useCallback(() => {
        if (!roleClaim || !token) return;
        
        dispatch(clearApiData());
        dispatch(apiRequest({
            url: 'role_permissions/search',
            method: 'POST',
            data: [
                {
                    field: "entitlementCode",
                    value: roleClaim,
                    operator: "eq",
                },
                {
                    field: "tenantCode",
                    value: tenantCode,
                    operator: "eq",
                }
            ],
            token: token
        }));
    }, [dispatch, roleClaim, token]);

    // Function to fetch attendance hierarchy
    const fetchHierarchy = useCallback((levelParam: number | undefined) => {
        if (!token || !tenantCode) return;

        const userId = (adminUser as any)?.userId || employeeId || '';

        dispatch(hierarchyRequest({
            userId,
            level: levelParam,
            tenantCode,
            token
        }));
    }, [dispatch, token, tenantCode, adminUser, employeeId]);

    // Trigger API call when roleClaim and token are available
    useEffect(() => {
        if (roleClaim && token && !isInitialized) {
            fetchRolePermissions();
            setIsInitialized(true);
        }
    }, [roleClaim, token, fetchRolePermissions, isInitialized]);

    // Trigger hierarchy call after role permissions are fetched, using "level" from response
    useEffect(() => {
        const levelFromRole = (apiState?.data && Array.isArray(apiState.data) && apiState.data.length > 0)
          ? Number((apiState.data[0] as any)?.level) || 1
          : undefined;
        if (token && !isHierarchyInitialized && typeof levelFromRole !== 'undefined') {
            fetchHierarchy(levelFromRole);
            setIsHierarchyInitialized(true);
        }
    }, [token, apiState?.data, fetchHierarchy, isHierarchyInitialized]);

    // Get current page information
    const allRoutes = useExtractAllRoutes(adminRole);
    const currentPageInfo = useCurrentPageInfo();
    
    // Use the custom hook for mode checking with proper typing
    const { handleModeCheck, isLoading } = useModeCheck({ 
        allRoutes, 
        adminRole, 
        currentPageInfo 
    });

    useEffect(() => {
        handleModeCheck();
    }, [currentPageInfo, adminRole?.screenPermissions, handleModeCheck]);

    // Skip role permission checks for allowed routes
    if (isAllowedRoute) {
        return <>{children}</>;
    }

    // Show loading spinner while token is loading or mode checking is in progress
    if (tokenLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">
                        {tokenLoading ? "Loading authentication..." : "Checking permissions..."}
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}