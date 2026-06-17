"use client";
import React, { useMemo } from "react";
import { usePathname } from 'next/navigation';

import { RootState } from "@inops/store/src/store";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {  conEmployee, contractor, navItemsExcel,hierarchy, navItemsForm, comEmployee, bgv, approver, policy,settings,management } from "@/json/menu/menu";
import Header from "@/components/header/header";
import { useFilteredNavigation } from "@/hooks/role-control/useRoleControl";
import { useFilteredNavigationByObjectKey } from "@/hooks/role-control/useRoleControlByObjectKey"

function DashboardWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sidebarSubMain = useSelector(
    (state: RootState) => state.sidebar.sidebarSubMain
  );
  const pathname = usePathname();
  const apiState = useSelector((state: RootState) => state.api);
  const adminRole = useSelector((state: RootState) => (state as any)?.adminRole?.adminRole);
  
  // Get role data with proper null checks - same pattern as DashboardCards
  const roleData = useMemo(() => {
    // First try to get from API state (fresh data from AdminWrapper)
    if (apiState?.data && Array.isArray(apiState.data) && apiState.data.length > 0) {
      const fromApi = apiState.data[0];
      return fromApi;
    }
    // Fallback to adminRole slice (existing data populated elsewhere)
    return adminRole;
  }, [apiState?.data, adminRole]);

  useFilteredNavigation(navItemsForm, roleData, ["master", "role"]);
  const filteredNavItemsExcel = useFilteredNavigationByObjectKey(navItemsExcel, roleData, ["excelUpload"]);
  const filtered: any = useFilteredNavigationByObjectKey(approver, roleData, ["hrapprover","roleControl"])
  const hira: any = useFilteredNavigationByObjectKey(hierarchy, roleData, ["roleControl","hrapprover"])
  const organization: any = useFilteredNavigationByObjectKey(navItemsForm, roleData, ["organization"])
  const policyies: any = useFilteredNavigationByObjectKey(policy, roleData, ["policy"])
  const conemp: any = useFilteredNavigationByObjectKey(conEmployee, roleData, ["user","employeeManagement","roleControl"])
  const comemp: any = useFilteredNavigationByObjectKey(comEmployee, roleData, ["user"])
  const contract: any = useFilteredNavigationByObjectKey(contractor, roleData, ["user","setting"])
  const setter: any = useFilteredNavigationByObjectKey(settings, roleData, ["setting"])
  const defaultNav = useMemo(() => ({
    label: "Management",
    link: "/management",
    page: "management",
  }), []);

  const navList = useMemo(() => {
    const withDefault = (items: any[]) => {
      const safeItems = Array.isArray(items) ? items : [];
      const hasDefault = safeItems.some(
        (item) => item?.link === defaultNav.link || item?.label === defaultNav.label
      );
      return hasDefault ? safeItems : [defaultNav, ...safeItems];
    };

    if (pathname.startsWith("/excel-file-manager")) return withDefault(filteredNavItemsExcel);
    if (pathname.startsWith("/bgv-application")) return withDefault(bgv);
    if (pathname.startsWith("/employee-management") || pathname.startsWith("/security-pass")) return withDefault(conemp);
    if (pathname.startsWith("/contractor-management")) return withDefault(contract);
    if (pathname.startsWith("/company_management")) return withDefault(comemp);
    if (pathname.startsWith("/hierarchy") || pathname.startsWith("/application-management")) return withDefault(hira);
    if (pathname.startsWith("/organization")) return withDefault(organization);
    if (pathname.startsWith("/policy") || pathname.startsWith("/compoff") || pathname.startsWith("/leave-policy") || pathname.startsWith("/shift")) return withDefault(policyies);
    if (pathname.startsWith("/notification") || pathname.startsWith("/settings")) return withDefault(setter);
    return management;
  }, [pathname, filteredNavItemsExcel, conemp, contract, comemp, hira, organization, policyies, setter, defaultNav]);

  return (
    <div className="bg-white overflow-y-hidden">
      <div className="w-20"></div>
      <div className="flex flex-wrap">
        {/* <div className="z-10 shadow-md">
          <SidebarCombine navigation={navigation} />
        </div> */}
       <motion.div
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className={` w-full pt-0 flex-wrap h-screen   ${sidebarSubMain ? "pl-[0px]" : "pl-[67px]"}`}
        >
          <div className="flex flex-col bg-[#f3f4f8] h-full relative  shadow-[0_48px_100px_0_rgba(17,12,46,0.15)]">
            <div className="z-[]">
              {navList.length > 0  && (
                // <MainHeader navItems={navList}/>
                <Header navItems={navList} serviceName="Master" />
              )}
              </div>
            <div className="overflow-y-auto h-full"> {children}</div>
            {/* <Footer /> */}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default DashboardWrapper;
