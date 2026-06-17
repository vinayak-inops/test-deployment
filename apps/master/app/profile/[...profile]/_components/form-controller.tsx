"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import PageNotFound from "@/components/page-notfound";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { decryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info";
import SidebarFromHeader from "@/components/header/sidebar-from-header";
import EmployeeShiftHeader from "@/app/employee-management/employee-shift/_components/employee-shift-header";
import ContractorHeader from "@/app/contractor-management/contractor/_components/contractor-header";
import {
  EmployeeDeploymentFormContent,
  type Mode as CompanyMode,
} from "@/app/company_management/company-employee/_components/employee-deployment-form-content";
import {
  ContractorManagementFormContent,
  type Mode as ContractorMode,
} from "@/app/contractor-management/contractor/_components/contractor-management-form-content";
import {
  EmployeeManagementForm,
  type Mode as ContractMode,
} from "@/app/employee-management/contract-employee/_components/employee-management-form";
import useCurrentDomain from "@/hooks/api/useCurrentDomain";

type AppMode = "add" | "edit" | "view";

function normalizeProfileType(value: string | undefined) {
  if (!value) return null;

  if (value === "company-employee" || value === "company_employee") {
    return "company-employee";
  }

  if (value === "employee" || value === "contract-employee" || value === "contract_employee") {
    return "contract-employee";
  }

  if (value === "contractor") {
    return "contractor";
  }

  return null;
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
}

function CompanyEmployeeProfileView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { employeeId: currentUserEmployeeId } = useKeyclockRoleInfo();
  const encryptedId = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  const formParam = searchParams.get("form");
  const mode: CompanyMode = modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : "add";
  const isDraftForm = formParam === "temp";
  const employeeSearchUrl = isDraftForm ? "draft/company_employee/search" : "company_employee/search";
  const employeeCollectionUrl = "validate";const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()

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
  }, [fetchEmployee, id, mode]);

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
    return <LoadingState message={isDecrypting ? "Validating access..." : "Loading employee data..."} />;
  }

  return (
    <div>
      <SidebarFromHeader
        title={
          mode === "add"
            ? "Add New Employee Deployment"
            : mode === "edit"
              ? "Edit Employee Deployment"
              : mode === "view"
                ? "View Employee Deployment"
                : "Employee Deployment Management"
        }
        description={
          mode === "add"
            ? "Add new employee deployment and organizational structure"
            : mode === "edit"
              ? "Edit existing employee deployment and organizational structure"
              : mode === "view"
                ? "View employee deployment details (read-only)"
                : "Manage employee deployment and organizational structure"
        }
        employeeId={employeeResponse?.[0]?.employeeID || undefined}
        showBackButton
        onBack={() => router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/launchdesk`)}
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

function ContractEmployeeProfileView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const encryptedId = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  const formParam = searchParams.get("form");
  const mode: ContractMode = modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : "add";
  const isDraftForm = formParam === "temp";
  const employeeSearchUrl = isDraftForm ? "draft/contract_employee/search" : "contract_employee/search";

  const [id, setId] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()

  useEffect(() => {
    if (mode === "add") {
      setId(null);
      return;
    }

    if (!encryptedId) {
      setId(null);
      return;
    }

    setIsDecrypting(true);
    try {
      const decryptedData = decryptEmployeeData(encryptedId);
      setId(decryptedData?._id ?? null);
    } catch {
      setId(null);
    } finally {
      setIsDecrypting(false);
    }
  }, [encryptedId, mode]);

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
  }, [fetchEmployee, id, mode]);

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "user",
    screenName: "contractorEmployee",
  });

  const viewMode = rolePermissions?.view || false;
  const editMode = rolePermissions?.edit || false;
  const addMode = rolePermissions?.add || false;
  const isModeAllowed =
    (viewMode && mode === "view") || (editMode && mode === "edit") || (addMode && mode === "add");

  if (!isModeAllowed) return <PageNotFound />;
  if (!isDecrypting && mode !== "add" && !id) return <PageNotFound />;

  const shouldShowLoading = mode !== "add" && (isDecrypting || (!!id && isLoadingEmployee));

  if (shouldShowLoading) {
    return <LoadingState message={isDecrypting ? "Validating access..." : "Loading employee data..."} />;
  }

  const headerEmployeeId = employeeResponse?.[0]?.employeeID || "";
  const content = (
    <div className="w-full mx-auto">
      <EmployeeShiftHeader
        title="Contract Employee Details"
        description="View and manage contract employee information, including personal details, job assignments, and contract duration."
        employeeId={headerEmployeeId || undefined}
        showBackButton={true}
        onBack={() => router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/launchdesk`)}
        canAdd={false}
      />
      <EmployeeManagementForm
        duplicateData={undefined}
        employeeResponse={employeeResponse}
        mode={mode}
        employeeRecordId={id}
        employeeSearchUrl={employeeSearchUrl}
      />
    </div>
  );

  return content;
}

function ContractorProfileView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const encryptedId = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  const formParam = searchParams.get("form");
  const mode: ContractorMode = modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : "add";
  const isDraftForm = formParam === "temp";
  const contractorSearchUrl = isDraftForm ? "draft/contractor/search" : "contractor/search";
  const contractorCollectionUrl = "validate";
  const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()

  const [id, setId] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (mode === "add") {
      setId(null);
      return;
    }

    if (!encryptedId) {
      setId(null);
      return;
    }

    setIsDecrypting(true);
    try {
      const decryptedData = decryptEmployeeData(encryptedId);
      setId(decryptedData?._id ?? null);
    } catch {
      setId(null);
    } finally {
      setIsDecrypting(false);
    }
  }, [encryptedId, mode]);

  const { data: contractorResponse, loading: isLoadingContractor, refetch: fetchContractor } = useRequest<any>({
    url: contractorSearchUrl,
    method: "POST",
    data: [{ field: "_id", value: id, operator: "eq" }],
    dependencies: [id, contractorSearchUrl],
  });

  useEffect(() => {
    if ((mode === "view" || mode === "edit") && id) {
      fetchContractor();
    }
  }, [fetchContractor, id, mode]);

  useEffect(() => {
    if (Array.isArray(contractorResponse) && contractorResponse.length > 0) {
      setHasLoadedOnce(true);
    }
  }, [contractorResponse]);

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "user",
    screenName: "contractor",
  });

  const viewMode = rolePermissions?.view || false;
  const editMode = rolePermissions?.edit || false;
  const addMode = rolePermissions?.add || false;
  const isModeAllowed =
    (viewMode && mode === "view") || (editMode && mode === "edit") || (addMode && mode === "add");

  if (!isModeAllowed) return <PageNotFound />;
  if (!isDecrypting && mode !== "add" && !id) return <PageNotFound />;

  const shouldShowLoading = mode !== "add" && (isDecrypting || (!!id && isLoadingContractor && !hasLoadedOnce));

  if (shouldShowLoading) {
    return <LoadingState message={isDecrypting ? "Validating access..." : "Loading contractor data..."} />;
  }

  const headerContractorCode = contractorResponse?.[0]?.contractorCode || undefined;
  const content = (
    <div>
      <ContractorHeader
        title={
          mode === "add"
            ? "Add New Contractor"
            : mode === "edit"
              ? "Edit Contractor"
              : mode === "view"
                ? "View Contractor"
                : "Contractor Management"
        }
        description={
          mode === "add"
            ? "Add new contractor and company information"
            : mode === "edit"
              ? "Edit existing contractor and company information"
              : mode === "view"
                ? "View contractor details (read-only)"
                : "Manage contractor and company information"
        }
        employeeId={headerContractorCode}
        showBackButton
        onBack={() => router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/launchdesk`)}
      />
      <ContractorManagementFormContent
        contractorResponse={contractorResponse}
        mode={mode}
        contractorRecordId={id}
        contractorSearchUrl={contractorSearchUrl}
        contractorCollectionUrl={contractorCollectionUrl}
        onRefresh={fetchContractor}
      />
    </div>
  );

  return content;
}

export default function FormController() {
  const params = useParams<{ profile?: string[] }>();
  const profileSegments = Array.isArray(params?.profile) ? params.profile : [];
  const profileType = normalizeProfileType(profileSegments[0]);

  if (profileType === "company-employee") {
    return <CompanyEmployeeProfileView />;
  }

  if (profileType === "contract-employee") {
    return <ContractEmployeeProfileView />;
  }

  if (profileType === "contractor") {
    return <ContractorProfileView />;
  }

  return <PageNotFound />;
}
