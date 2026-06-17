"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { gql, useApolloClient, useQuery } from "@apollo/client";
import { useSelector } from "react-redux";
import { RootState } from "@inops/store/src/store";
import {
  ArrowRight,
  Briefcase,
  Building2,
  FileSpreadsheet,
  GitBranch,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  approver,
  bgv,
  comEmployee,
  conEmployee,
  contractor,
  hierarchy,
  navItemsExcel,
  navItemsForm,
  policy,
} from "@/json/menu/menu";
import { useFilteredNavigationByObjectKey } from "@/hooks/role-control/useRoleControlByObjectKey";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken";

const FETCH_ALL_ORGANIZATION_QUERY = gql`
  query FetchAllOrganization($collection: String!, $tenantCode: String!) {
    fetchAllOrganization(collection: $collection, tenantCode: $tenantCode) {
      applicationType
    }
  }
`;

export default function ServiceName() {
  const router = useRouter();
  const client = useApolloClient();
  const apiState = useSelector((state: RootState) => state.api);
  const adminRole = useSelector((state: RootState) => (state as any)?.adminRole?.adminRole);
  const tenantCode = useGetTenantCode();
  const { token } = useAuthToken();

  const queryContext = useMemo(
    () => ({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
    [token]
  );

  const roleData = useMemo(() => {
    if (apiState?.data && Array.isArray(apiState.data) && apiState.data.length > 0) {
      const fromApi = apiState.data[0];
      return fromApi;
    }
    return adminRole;
    return {} as any;
  }, [apiState?.data, adminRole]);

  const organizationNav: any[] = useFilteredNavigationByObjectKey(navItemsForm, roleData, ["organization"]);
  const employeeNav: any[] = useFilteredNavigationByObjectKey(conEmployee, roleData, ["user", "employeeManagement", "roleControl"]);
  const companyEmployeeNav: any[] = useFilteredNavigationByObjectKey(comEmployee, roleData, ["user"]);
  const contractorNav: any[] = useFilteredNavigationByObjectKey(contractor, roleData, ["user", "setting"]);
  const permissionNav: any[] = useFilteredNavigationByObjectKey(hierarchy, roleData, ["roleControl"]);
  const policyNav: any[] = useFilteredNavigationByObjectKey(policy, roleData, ["policy"]);
  const settingsNav: any[] = useFilteredNavigationByObjectKey(approver, roleData, ["hrapprover"]);
  const excelUploadNav: any[] = useFilteredNavigationByObjectKey(navItemsExcel, roleData, ["excelUpload"]);
  const bgvNav: any[] = useFilteredNavigationByObjectKey(bgv, roleData, ["bgm"]);

  const { data: organizationData, error: organizationError, loading: organizationLoading } = useQuery(
    FETCH_ALL_ORGANIZATION_QUERY,
    {
      client,
      variables: {
        collection: "organization",
        tenantCode: tenantCode || "",
      },
      context: queryContext,
      errorPolicy: "all",
      fetchPolicy: "cache-first",
      notifyOnNetworkStatusChange: true,
      skip: !tenantCode || !token,
    }
  );

  const organizationResult = organizationData?.fetchAllOrganization;
  const applicationType = Array.isArray(organizationResult)
    ? organizationResult[0]?.applicationType
    : organizationResult?.applicationType;
  const employeeHref =
    applicationType === "CLMS"
      ? "/employee-management"
      : "/employee-management";

  const leftCards = [
    {
      id: "organization",
      title: "Organization",
      description: "Open organization setup screens.",
      icon: GitBranch,
      href: "/organization-management",
      visible: organizationNav.length > 0,
    },
    {
      id: "employee",
      title: "Employee",
      description: "Open contract employee management screen.",
      icon: Users,
      href: employeeHref,
      visible: employeeNav.length > 0,
    },
    {
      id: "companyEmployee",
      title: "Company Employee",
      description: "Open company employee management screen.",
      icon: Building2,
      href: "/company_management",
      visible: companyEmployeeNav.length > 0,
    },
    {
      id: "contractor",
      title: "Contractor",
      description: "Open contractor management screen.",
      icon: Briefcase,
      href: "/contractor-management",
      visible: contractorNav.length > 0,
    },
    {
      id: "bgv",
      title: "BG Verification",
      description: "Open background verification application.",
      icon: ShieldCheck,
      href: "https://v2.console.equal.in",
      visible: bgvNav.length > 0,
      openInNewTab: true,
    } 
  ];

  const rightCards = [
    {
      id: "permission",
      title: "Permission and Entitlements",
      description: "Manage permissions and user entitlements.",
      icon: ShieldCheck,
      href: "/hierarchy",
      visible: permissionNav.length > 0,
    },
    {
      id: "policy",
      title: "Policy",
      description: "Open policy configuration screens.",
      icon: ScrollText,
      href: "/policy-management",
      visible: policyNav.length > 0,
    },
    {
      id: "settings",
      title: "Settings",
      description: "Open approval and settings screens.",
      icon: Settings,
      href: "/settings",
      visible: settingsNav.length > 0,
    },
    {
      id: "excelUpload",
      title: "Excel Upload",
      description: "Open excel file upload manager.",
      icon: FileSpreadsheet,
      href: "/excel-file-manager",
      visible: excelUploadNav.length > 0,
    }
  ];


  return (
    <div className="px-4 py-6 md:px-8">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-100 p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-700">Core Management</h2>
            <span className="cursor-help text-sm text-blue-600">?</span>
          </div>
          <div className="space-y-3">
            {leftCards
              .filter((card) => card.visible)
              .map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      if ((card as any).openInNewTab) {
                        window.open(card.href, "_blank", "noopener,noreferrer");
                        return;
                      }
                      router.push(card.href);
                    }}
                    className="group w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <h3 className="font-semibold text-gray-900">{card.title}</h3>
                          <ArrowRight className="h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-600" />
                        </div>
                        <p className="text-sm text-gray-600">{card.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-100 p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-700">Governance and Setup</h2>
            <span className="cursor-help text-sm text-blue-600">?</span>
          </div>
          <div className="space-y-3">
            {rightCards
              .filter((card) => card.visible)
              .map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => router.push(card.href)}
                    className="group w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <h3 className="font-semibold text-gray-900">{card.title}</h3>
                          <ArrowRight className="h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-600" />
                        </div>
                        <p className="text-sm text-gray-600">{card.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
