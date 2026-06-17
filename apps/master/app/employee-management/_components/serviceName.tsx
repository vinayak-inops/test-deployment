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
  UserCheck,
  CalendarClock,
  Wallet,
  GraduationCap,
  BadgeCheck,
  Trophy,
  Calculator,
  KeyRound,
  RefreshCcw,
} from "lucide-react";
import {
  approver,
  hierarchy,
  navItemsExcel,
  navItemsForm,
  policy,
} from "@/json/menu/menu";
import { useFilteredNavigationByObjectKey } from "@/hooks/role-control/useRoleControlByObjectKey";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";

const FETCH_ALL_ORGANIZATION_QUERY = gql`
  query FetchAllOrganization($collection: String!, $tenantCode: String!) {
    fetchAllOrganization(collection: $collection, tenantCode: $tenantCode) {
      applicationType
    }
  }
`;

const canAccess = (p: any): boolean =>
  !!(p?.view || p?.edit || p?.add || p?.delete);

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
      return apiState.data[0];
    }
    return adminRole;
  }, [apiState?.data, adminRole]);

  const organizationNav: any[] = useFilteredNavigationByObjectKey(navItemsForm, roleData, ["organization"]);
  const permissionNav: any[]   = useFilteredNavigationByObjectKey(hierarchy,     roleData, ["roleControl"]);
  const policyNav: any[]       = useFilteredNavigationByObjectKey(policy,         roleData, ["policy"]);
  const settingsNav: any[]     = useFilteredNavigationByObjectKey(approver,       roleData, ["hrapprover"]);
  const excelUploadNav: any[]  = useFilteredNavigationByObjectKey(navItemsExcel,  roleData, ["excelUpload"]);

  const { data: organizationData } = useQuery(FETCH_ALL_ORGANIZATION_QUERY, {
    client,
    variables: { collection: "organization", tenantCode: tenantCode || "" },
    context: queryContext,
    errorPolicy: "all",
    fetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
    skip: !tenantCode || !token,
  });

  useEffect(() => {
    console.log("fetchAllOrganization value:", organizationData?.fetchAllOrganization);
  }, [organizationData]);

  // ─── Role permissions ─────────────────────────────────────────────────────

  const { responseData: p_contractorEmployee }             = useRolePermissions({ serviceName: "user", screenName: "contractorEmployee" });
  const { responseData: p_companyEmployeeHris }            = useRolePermissions({ serviceName: "user", screenName: "companyEmployeeHris" });
  const { responseData: p_contractEmployeeApprover }       = useRolePermissions({ serviceName: "hrapprover", screenName: "contractEmployeeApprover" });
  const { responseData: p_contractEmployeeApproverHris }   = useRolePermissions({ serviceName: "hrapprover", screenName: "contractEmployeeApproverHris" });
  const { responseData: p_employeeShift }                  = useRolePermissions({ serviceName: "employeeManagement", screenName: "employeeShift" });
  const { responseData: p_employeeBalance }                = useRolePermissions({ serviceName: "employeeManagement", screenName: "employeeBalance" });
  const { responseData: p_employeeCategoryTrainingDetails }= useRolePermissions({ serviceName: "employeeManagement", screenName: "employeeCategoryTrainingDetails" });
  const { responseData: employeeTrainingCompletion }        = useRolePermissions({ serviceName: "employeeManagement", screenName: "employeeTrainingCompletion" });
  const { responseData: p_bestEmployeeNomination }         = useRolePermissions({ serviceName: "employeeManagement", screenName: "bestEmployeeNomination" });
  const { responseData: p_manualComputation }              = useRolePermissions({ serviceName: "employeeManagement", screenName: "manualComputation" });
  const { responseData: p_securityPass }                   = useRolePermissions({ serviceName: "employeeManagement", screenName: "securityPass" });
  const { responseData: p_weekOffChanges }                 = useRolePermissions({ serviceName: "employeeManagement", screenName: "weekOffChanges" });

  // ─── Cards ────────────────────────────────────────────────────────────────

  const leftCards = [
    {
      id: "contractorEmployee",
      title: "Employee",
      description: "Manage contract employee records and details.",
      icon: Users,
      href: "/employee-management/contract-employee",
      visible: canAccess(p_contractorEmployee),
    },
    {
      id: "companyEmployeeHris",
      title: "Company Employee",
      description: "Manage company (HRIS) employee records and details.",
      icon: Briefcase,
      href: "/employee-management/company-employee",
      visible: canAccess(p_companyEmployeeHris),
    },
    {
      id: "contractEmployeeApprover",
      title: "Approver",
      description: "Configure approvers for contract employee workflows.",
      icon: UserCheck,
      href: "/employee-management/contract-employee-approver",
      visible: canAccess(p_contractEmployeeApprover),
    },
    {
      id: "contractEmployeeApproverHris",
      title: "Company Approver",
      description: "Configure approvers for company employee workflows.",
      icon: ShieldCheck,
      href: "/employee-management/company-employee-approver",
      visible: canAccess(p_contractEmployeeApproverHris),
    },
    {
      id: "employeeShift",
      title: "Employee Shift",
      description: "View and manage employee shift assignments.",
      icon: CalendarClock,
      href: "/employee-management/employee-shift",
      visible: canAccess(p_employeeShift),
    },
    {
      id: "employeeBalance",
      title: "Employee Balance",
      description: "Track and manage employee leave and credit balances.",
      icon: Wallet,
      href: "/employee-management/employee-balance",
      visible: canAccess(p_employeeBalance),
    },
  ];

  const rightCards = [
    {
      id: "employeeCategoryTrainingDetails",
      title: "Employee Training",
      description: "View employee category-wise training details.",
      icon: GraduationCap,
      href: "/employee-management/employee-category-training-details",
      visible: canAccess(p_employeeCategoryTrainingDetails),
    },
    {
      id: "employeeTrainingCompletion",
      title: "Training Completion",
      description: "Track and update employee training completion status.",
      icon: BadgeCheck,
      href: "/employee-management/employee-training-completion",
      visible: canAccess(employeeTrainingCompletion),
    },
    {
      id: "bestEmployeeNomination",
      title: "Employee Nomination",
      description: "Manage best employee nomination entries.",
      icon: Trophy,
      href: "/employee-management/best-employee-nomination",
      visible: canAccess(p_bestEmployeeNomination),
    },
    {
      id: "manualComputation",
      title: "Manual Computation",
      description: "Perform and review manual payroll computations.",
      icon: Calculator,
      href: "/employee-management/manual-computation",
      visible: canAccess(p_manualComputation),
    },
    {
      id: "securityPass",
      title: "Security Pass",
      description: "Issue and manage employee security passes.",
      icon: KeyRound,
      href: "/employee-management/security-pass",
      visible: canAccess(p_securityPass),
    },
    {
      id: "weekOffChanges",
      title: "Week Off Changes Application",
      description: "Handle employee week off change requests.",
      icon: RefreshCcw,
      href: "/employee-management/week-off-changes",
      visible: canAccess(p_weekOffChanges),
    },
  ];

  // ─── Card renderer ────────────────────────────────────────────────────────

  const renderCard = (card: (typeof leftCards)[number]) => {
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
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style jsx global>{`
        @keyframes slideInFromLeft {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in-from-left {
          animation: slideInFromLeft 0.5s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards;
        }

        .animate-slide-in-item {
          animation: slideInFromLeft 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards;
          opacity: 0;
          transform: translateX(-100%);
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      <div className="px-4 py-6 md:px-8">
        <div className="mx-auto flex w-full max-w-7xl gap-8">

          {/* ── Left sidebar heading with slide animation ── */}
          <aside className="hidden w-56 flex-shrink-0 lg:block animate-slide-in-from-left">
            <div className="sticky top-6">
              {/* Breadcrumb */}
              <nav className="mb-4 flex items-center gap-1 text-xs text-gray-400">
                <span>Management</span>
                <span>/</span>
                <span className="text-gray-600">Employee</span>
              </nav>

              {/* Title */}
              <h1 className="mb-2 text-xl font-semibold leading-snug text-gray-900">
                Employee Management
              </h1>

              {/* Description */}
              <p className="mb-5 text-sm leading-relaxed text-gray-500">
                Manage your workforce — contracts, shifts, training, approvals, and more.
              </p>

              {/* Divider */}
              <div className="mb-5 h-px bg-gray-200" />

              {/* Quick stats / tag pills */}
              <div className="space-y-2">
                {[
                  { label: "Employees", icon: Users },
                  { label: "Approvals", icon: ShieldCheck },
                  { label: "Scheduling", icon: CalendarClock },
                  { label: "Training", icon: GraduationCap },
                ].map(({ label, icon: Icon }, index) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 animate-slide-in-item"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <Icon className="h-3.5 w-3.5 text-blue-400" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="my-5 h-px bg-gray-200 animate-fade-in" style={{ animationDelay: "0.2s" }} />

              {/* Section legend */}
              <div className="space-y-3 text-xs text-gray-400">
                <div className="flex items-start gap-2 animate-fade-in" style={{ animationDelay: "0.25s" }}>
                  <span className="mt-0.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" />
                  <span>
                    <span className="font-medium text-gray-600">Core Management</span>
                    {" — "}employees, approvers &amp; shifts
                  </span>
                </div>
                <div className="flex items-start gap-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                  <span className="mt-0.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-indigo-400" />
                  <span>
                    <span className="font-medium text-gray-600">Governance &amp; Setup</span>
                    {" — "}training, nominations &amp; passes
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Card grid ── */}
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-8 lg:grid-cols-2">

            {/* Core Management */}
            <div className="rounded-lg border border-gray-200 bg-gray-100 p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <h2 className="text-base font-semibold text-gray-700">Core Management</h2>
              </div>
              <div className="space-y-3">
                {leftCards.filter((card) => card.visible).map(renderCard)}
              </div>
            </div>

            {/* Governance and Setup */}
            <div className="rounded-lg border border-gray-200 bg-gray-100 p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                <h2 className="text-base font-semibold text-gray-700">Governance and Setup</h2>
              </div>
              <div className="space-y-3">
                {rightCards.filter((card) => card.visible).map(renderCard)}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}