"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@inops/store/src/store';

interface RolePermissionsParams {
  serviceName?: string;
  screenName: string; // Required parameter
}

interface RolePermissionsResponse {
  [key: string]: boolean;
}

export const useRolePermissions = (params: RolePermissionsParams) => {
  const [responseData, setResponseData] = useState<RolePermissionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get data from Redux state instead of making API calls
  const apiState = useSelector((state: RootState) => state?.api);
  const adminRole = useSelector((state: RootState) => (state as any)?.adminRole?.adminRole);

  // Use the screenName parameter directly
  const actualScreenName = params.screenName;

  // Function to extract permissions from Redux state
  const extractPermissions = useCallback(() => {
    

    // First try to get from API state (fresh data from AdminWrapper)
    if (apiState.data && Array.isArray(apiState.data) && apiState.data.length > 0) {
      const roleData = apiState.data[0];
      if (roleData.screenPermissions && Array.isArray(roleData.screenPermissions)) {
        const targetService = roleData.screenPermissions.find((service: any) => 
          service.serviceName === (params.serviceName || "")
        );
        
        if (targetService && targetService.screens) {
          const targetScreen = targetService.screens.find((screen: any) => 
            screen.screenName === actualScreenName
          );
          
          if (targetScreen && targetScreen.permissions) {
            const permissions: any = {};
            Object.keys(targetScreen.permissions).forEach(key => {
              if (targetScreen.permissions[key] === true) {
                permissions[key] = true;
              }
            });
            return permissions;
          }
        }
      }
    }

    // Fallback to adminRole state (existing data) - check if it has permissions structure
    if (adminRole?.screenPermissions && Array.isArray(adminRole.screenPermissions)) {
      const targetService = adminRole.screenPermissions.find((service: any) => 
        service.serviceName === (params.serviceName || "")
      );
      
      if (targetService && targetService.screens) {
        const targetScreen = targetService.screens.find((screen: any) => 
          screen.screenName === actualScreenName
        );
        
        // Check if screen has permissions property (from API response)
        if (targetScreen && (targetScreen as any).permissions) {
          const permissions: any = {};
          Object.keys((targetScreen as any).permissions).forEach(key => {
            if ((targetScreen as any).permissions[key] === true) {
              permissions[key] = true;
            }
          });
          return permissions;
        }
      }
    }

    return null;
  }, [apiState.data, adminRole?.screenPermissions, actualScreenName, params.serviceName]);

  // Update permissions when Redux state changes
  useEffect(() => {
    const permissions = extractPermissions();
    if (permissions) {
      setResponseData(permissions);
      setError(null);
      } else {
      setError("No permissions found for the specified screen");
    }
  }, [extractPermissions]);

  // Set loading state based on Redux API state
  useEffect(() => {
    setLoading(apiState.loading);
    if (apiState.error) {
      setError(apiState.error);
    }
  }, [apiState.loading, apiState.error]);

  return {
    responseData,
    loading,
    error,
    actualScreenName, // Return the actual screen name being used
    serviceName: params.serviceName || "",
    refetch: extractPermissions // Return the extract function as refetch
  };
};
