"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@inops/store/src/store';

interface RolePermissionsParams {
  serviceName?: string;
  screenName: string;
}

interface RolePermissionsResponse {
  [key: string]: boolean;
}

const toTruePermissions = (raw: any): RolePermissionsResponse | null => {
  if (!raw || typeof raw !== 'object') return null;
  const permissions: RolePermissionsResponse = {};
  Object.keys(raw).forEach((key) => {
    if (raw[key] === true) permissions[key] = true;
  });
  return Object.keys(permissions).length > 0 ? permissions : null;
};

export const useRolePermissions = (params: RolePermissionsParams) => {
  const [responseData, setResponseData] = useState<RolePermissionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiState = useSelector((state: RootState) => state?.api);
  const adminRole = useSelector((state: RootState) => (state as any)?.adminRole?.adminRole);

  const actualScreenName = params.screenName;

  const extractPermissions = useCallback(() => {
    const roleData = Array.isArray(apiState.data) && apiState.data.length > 0 ? apiState.data[0] : adminRole;
    if (!roleData || typeof roleData !== 'object') return null;

    // 1) Direct lookup using top-level key parallel to screenPermissions
    // Example (object schema): roleData.hrapprover.contractEmployeeApprover = { permissions, isActive }
    // Example (array schema): roleData.hrapprover = [{ screenName, permissions, isActive }]
    if (params.serviceName) {
      const topLevelScreens = (roleData as any)[params.serviceName];

      if (topLevelScreens && typeof topLevelScreens === "object" && !Array.isArray(topLevelScreens)) {
        const objectMatch = (topLevelScreens as any)[actualScreenName];
        if (objectMatch && typeof objectMatch === "object") {
          const isActive = (objectMatch as any)?.isActive ?? (objectMatch as any)?.enabled;
          if (isActive !== false) {
            const objectPermissions = toTruePermissions((objectMatch as any)?.permissions);
            if (objectPermissions) return objectPermissions;
          }
        }
      }

      if (Array.isArray(topLevelScreens)) {
        const arrayMatch = topLevelScreens.find((screen: any) => {
          if (!screen || typeof screen !== 'object') return false;
          if (screen.screenName !== actualScreenName) return false;
          const isActive = screen?.isActive ?? screen?.enabled;
          if (isActive === false) return false;
          return true;
        });

        const arrayPermissions = toTruePermissions((arrayMatch as any)?.permissions);
        if (arrayPermissions) return arrayPermissions;
      }
    }

    // Direct lookup from arrays parallel to `screenPermissions`.
    // Supported keys: `screens`, `screenAccess`, `permissionsByScreen`.
    const directScreenArray =
      (Array.isArray((roleData as any).screens) && (roleData as any).screens) ||
      (Array.isArray((roleData as any).screenAccess) && (roleData as any).screenAccess) ||
      (Array.isArray((roleData as any).permissionsByScreen) && (roleData as any).permissionsByScreen) ||
      [];

    if (directScreenArray.length > 0) {
      const directMatch = directScreenArray.find((screen: any) => {
        if (!screen || typeof screen !== 'object') return false;
        if (screen.screenName !== actualScreenName) return false;
        if (params.serviceName && screen.serviceName && screen.serviceName !== params.serviceName) return false;
        return true;
      });

      const directPermissions = toTruePermissions((directMatch as any)?.permissions);
      if (directPermissions) return directPermissions;
    }

    // Fallback: existing service -> screens structure
    if (Array.isArray((roleData as any).screenPermissions)) {
      const targetService = (roleData as any).screenPermissions.find((service: any) =>
        service.serviceName === (params.serviceName || "")
      );

      if (targetService && Array.isArray(targetService.screens)) {
        const targetScreen = targetService.screens.find((screen: any) =>
          screen.screenName === actualScreenName
        );
        const permissions = toTruePermissions((targetScreen as any)?.permissions);
        if (permissions) return permissions;
      }
    }

    return null;
  }, [apiState.data, adminRole, actualScreenName, params.serviceName]);

  useEffect(() => {
    const permissions = extractPermissions();
    if (permissions) {
      setResponseData(permissions);
      setError(null);
    } else {
      setResponseData(null);
      setError("No permissions found for the specified screen");
    }
  }, [extractPermissions]);

  useEffect(() => {
    setLoading(apiState.loading);
    if (apiState.error) setError(apiState.error);
  }, [apiState.loading, apiState.error]);

  return {
    responseData,
    loading,
    error,
    actualScreenName,
    serviceName: params.serviceName || "",
    refetch: extractPermissions,
  };
};
