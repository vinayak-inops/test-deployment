"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageNotFound from "@/components/page-notfound";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { decryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info";
import SidebarFromHeader from "@/components/header/sidebar-from-header";
import { EmployeeDeploymentFormContent, type Mode } from "./employee-deployment-form-content";

export function EmployeeDeploymentForm({ duplicateData }: { duplicateData: any; refetch?: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { employeeId: currentUserEmployeeId } = useKeyclockRoleInfo();
  const encryptedId = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  const formParam = searchParams.get("form");
  const mode: Mode = modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : "add";
  const isDraftForm = formParam === "temp";
  const employeeSearchUrl = isDraftForm ? "draft/company_employee/search" : "company_employee/search";
  const employeeCollectionUrl = "validate";

  const [id, setId] = useState<string | null>(null);
  const [isEmployeeIdMatch, setIsEmployeeIdMatch] = useState(true);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (mode === "add") {
      setId(null);
      setIsEmployeeIdMatch(true);
      return;
    }
    if (!encryptedId) {
      setId(null);
      setIsEmployeeIdMatch(false);
      return;
    }
    setIsDecrypting(true);
    try {
      const decryptedData = decryptEmployeeData(encryptedId);
      setId(decryptedData?._id ?? null);
      setIsEmployeeIdMatch(decryptedData?.employeeId === currentUserEmployeeId);
    } catch {
      setId(null);
      setIsEmployeeIdMatch(false);
    } finally {
      setIsDecrypting(false);
    }
  }, [currentUserEmployeeId, encryptedId, mode]);

  const { data: employeeResponse, loading: isLoadingEmployee, refetch: fetchEmployee } = useRequest<any>({
    url: employeeSearchUrl,
    method: "POST",
    data: [{ field: "_id", value: id, operator: "eq" }],
    dependencies: [id, employeeSearchUrl],
  });

  useEffect(() => {
    if ((mode === "view" || mode === "edit") && id) {
      fetchEmployee();
    }
  }, [mode, id]);

  useEffect(() => {
    if (Array.isArray(employeeResponse) && employeeResponse.length > 0) {
      setHasLoadedOnce(true);
    }
  }, [employeeResponse]);

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "user",
    screenName: "companyEmployee",
  });
  const viewMode = rolePermissions?.view || false;
  const editMode = rolePermissions?.edit || false;
  const addMode = rolePermissions?.add || false;
  const isModeAllowed =
    (viewMode && mode === "view") || (editMode && mode === "edit") || (addMode && mode === "add");

  if (!isDecrypting && mode !== "add" && !isEmployeeIdMatch) return <PageNotFound />;
  if (!isModeAllowed) return <PageNotFound />;

  const shouldShowLoading =
    mode !== "add" && (isDecrypting || (isEmployeeIdMatch && !!id && isLoadingEmployee && !hasLoadedOnce));
  if (shouldShowLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{isDecrypting ? "Validating access..." : "Loading employee data..."}</p>
        </div>
      </div>
    );
  }

  const title =
    mode === "add"
      ? "Add New Employee Deployment"
      : mode === "edit"
        ? "Edit Employee Deployment"
        : mode === "view"
          ? "View Employee Deployment"
          : "Employee Deployment Management";
  const description =
    mode === "add"
      ? "Add new employee deployment and organizational structure"
      : mode === "edit"
        ? "Edit existing employee deployment and organizational structure"
        : mode === "view"
          ? "View employee deployment details (read-only)"
          : "Manage employee deployment and organizational structure";

  return (
    <div>
      <SidebarFromHeader
        title={title}
        description={description}
        employeeId={employeeResponse?.[0]?.employeeID || undefined}
        showBackButton
        onBack={() => router.push("/company_management/company-employee")}
        canAdd={false}
      />
      <EmployeeDeploymentFormContent
        employeeResponse={employeeResponse}
        mode={mode}
        employeeRecordId={id}
        employeeSearchUrl={employeeSearchUrl}
        employeeCollectionUrl={employeeCollectionUrl}
        onRefresh={fetchEmployee}
      />
    </div>
  );
}
