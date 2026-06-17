"use client";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from 'next/navigation';

import { RootState } from "@inops/store/src/store";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import Header from "@/components/header/header";
import MainHeader from "@repo/ui/components/header/main-header";
import { useFilteredNavigation } from "@/hooks/role-control/useRoleControl";
import Footer from "@/components/footer/footer";
import { useFilteredNavigationByObjectKey } from "@/hooks/role-control/useRoleControlByObjectKey"
import { navItems } from "@/json/menu/menu";

function DashboardWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sidebarSubMain = useSelector(
    (state: RootState) => state.sidebar.sidebarSubMain
  );
  const pathname = usePathname();
  const [navList, setNavList] = useState<any>([]);
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
    return {} as any;
  }, [apiState?.data, adminRole]);


  const nav: any = useFilteredNavigationByObjectKey(navItems, roleData, ["applicationApprover","applicationApplier","employeeManagement"])

useEffect(() => {
  const withDefault = (items: any[]) =>
    [...(Array.isArray(items) ? items : [])]

  if (pathname.startsWith("/")) {
    setNavList(withDefault(nav))
  }
}, [pathname, nav])

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
              {navList.length > 0 && (
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
