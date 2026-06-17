"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gql, useApolloClient, useQuery } from "@apollo/client";
import { useSelector } from "react-redux";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { RootState } from "@inops/store/src/store";
import {
  approver,
  comEmployee,
  conEmployee,
  contractor,
  hierarchy,
  navItemsExcel,
  navItemsForm,
  policy,
} from "@/json/menu/menu";
import { useFilteredNavigationByObjectKey } from "@/hooks/role-control/useRoleControlByObjectKey";
import { useGetTenantCode } from "@/hooks/useGetTenantCode";
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
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const apiState = useSelector((state: RootState) => state.api);
  const adminRole = useSelector(
    (state: RootState) => (state as any)?.adminRole?.adminRole
  );

  const tenantCode = useGetTenantCode();
  const { token } = useAuthToken();

  const queryContext = useMemo(
    () => ({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
    [token]
  );

  const roleData = useMemo(() => {
    if (
      apiState?.data &&
      Array.isArray(apiState.data) &&
      apiState.data.length > 0
    ) {
      return apiState.data[0];
    }
    return adminRole ?? ({} as any);
  }, [apiState?.data, adminRole]);

  const organizationNav: any[] = useFilteredNavigationByObjectKey(
    navItemsForm,
    roleData,
    ["organization"]
  );

  const employeeNav: any[] = useFilteredNavigationByObjectKey(
    conEmployee,
    roleData,
    ["user", "employeeManagement", "roleControl"]
  );

  const companyEmployeeNav: any[] = useFilteredNavigationByObjectKey(
    comEmployee,
    roleData,
    ["user"]
  );

  const contractorNav: any[] = useFilteredNavigationByObjectKey(
    contractor,
    roleData,
    ["user", "setting"]
  );

  const permissionNav: any[] = useFilteredNavigationByObjectKey(
    hierarchy,
    roleData,
    ["roleControl"]
  );

  const policyNav: any[] = useFilteredNavigationByObjectKey(
    policy,
    roleData,
    ["policy"]
  );

  const settingsNav: any[] = useFilteredNavigationByObjectKey(
    approver,
    roleData,
    ["hrapprover"]
  );

  const excelUploadNav: any[] = useFilteredNavigationByObjectKey(
    navItemsExcel,
    roleData,
    ["excelUpload"]
  );

  const { data: organizationData } = useQuery(
    FETCH_ALL_ORGANIZATION_QUERY,
    {
      client,
      variables: {
        collection: "organization",
        tenantCode: tenantCode || "",
      },
      context: queryContext,
      skip: !tenantCode || !token,
    }
  );

  const organizationResult = organizationData?.fetchAllOrganization;

  const applicationType = Array.isArray(organizationResult)
    ? organizationResult[0]?.applicationType
    : organizationResult?.applicationType;

  const employeeHref =
    applicationType === "CLMS"
      ? "/master/employee-management"
      : "/master/employee-management";

  useEffect(() => {
    console.log(
      "fetchAllOrganization value:",
      organizationData?.fetchAllOrganization
    );
  }, [organizationData]);

  const updateScrollState = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, []);

  // ✅ Replace with your actual API/CDN URL
  const BASE_ICON_URL = "https://your-server.com/icons";

  const allServices = [
  {
    id: "organization",
    title: "Organization",
    iconImage: "https://img.icons8.com/fluency/48/organization.png",
    href: "/master/organization-management",
    visible: organizationNav.length > 0,
    bg: "#dff0ff",
  },
  {
    id: "employee",
    title: "Employee",
    iconImage: "https://img.icons8.com/fluency/48/user-group-man-man.png",
    href: employeeHref,
    visible: employeeNav.length > 0,
    bg: "#d6eaff",
  },
  {
    id: "companyEmployee",
    title: "Staff",
    iconImage: "https://img.icons8.com/fluency/48/conference.png",
    href: "/master/company_management",
    visible: companyEmployeeNav.length > 0,
    bg: "#dff6dd",
  },
  {
    id: "contractor",
    title: "Contractor",
    iconImage: "https://img.icons8.com/?size=48&id=44581&format=png&color=000000",
    href: "/master/contractor-management",
    visible: contractorNav.length > 0,
    bg: "#f0ebfa",
  },
  {
    id: "permission",
    title: "Permissions",
    iconImage: "https://img.icons8.com/fluency/48/lock.png",
    href: "/master/hierarchy",
    visible: permissionNav.length > 0,
    bg: "#fde7e9",
  },
  {
    id: "policy",
    title: "Policy",
    iconImage: "https://img.icons8.com/fluency/48/document.png",
    href: "/master/policy",
    visible: policyNav.length > 0,
    bg: "#fdf2ec",
  },
  {
    id: "settings",
    title: "Settings",
    iconImage: "https://img.icons8.com/fluency/48/settings.png",
    href: "/master/settings",
    visible: settingsNav.length > 0,
    bg: "#edf0fd",
  },
  {
    id: "excelUpload",
    title: "Excel Upload",
    iconImage: "https://img.icons8.com/fluency/48/microsoft-excel-2019.png",
    href: "/master/excel-file-manager",
    visible: excelUploadNav.length > 0,
    bg: "#e2f2e8",
  },
  ];
  const visibleServices = allServices.filter((service) => service.visible);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      updateScrollState();
    });
    return () => cancelAnimationFrame(raf);
  }, [visibleServices.length]);

  return (
    <div className="px-4 py-1 md:px-8">
      <div className="mx-auto w-full">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-slate-700">
            DATA MANAGER
          </h2>
        </div>

        <div className="rounded-lg px-3 py-3">
          <div className="relative">
            <button
              type="button"
              aria-label="Scroll left"
              disabled={!canScrollLeft}
              onClick={() => rowRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
              className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-md border border-slate-200 bg-white p-2 text-blue-600 shadow-sm transition-all hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              disabled={!canScrollRight}
              onClick={() => rowRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
              className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-md border border-slate-200 bg-white p-2 text-blue-600 shadow-sm transition-all hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowRight className="h-5 w-5" />
            </button>

            <div
              ref={rowRef}
              onScroll={updateScrollState}
              className="flex flex-nowrap gap-2 overflow-x-auto scroll-smooth px-9 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
            {visibleServices.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => router.push(service.href)}
                className="group relative flex w-[100px] min-w-[100px] flex-col items-center gap-2 px-2 py-3 text-center transition-all duration-200 hover:-translate-y-0.5 "
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm transition-transform duration-150 group-hover:scale-105"
                  
                >
                  {/* ✅ using img instead of next/image */}
                  <img
                    src={service.iconImage}
                    alt={service.title}
                    className="h-9 w-9 object-contain"
                  />
                </div>

                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  {service.title}
                </span>
                <span className="absolute inset-x-3 bottom-0 h-[2px] origin-left scale-x-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-transform duration-200 group-hover:scale-x-100" />
              </button>
            ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
