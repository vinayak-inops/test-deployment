"use client";
import React, { useEffect, useState } from "react";

import SidebarCombine from "@repo/ui/components/sidebar/sidebar-combine";
import { RootState } from "@inops/store/src/store";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { navigation, navItems } from "@/json/menu/menu";
import MainHeader from "@repo/ui/components/header/main-header";
import { useFilteredNavigation } from "@/hooks/role-control/useRoleControl";
import { useAdminRole } from "@inops/store/src/hooks/useAdminRole";
import Header from "./header/header";
function DashboardWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sidebarSubMain = useSelector(
    (state: RootState) => state.sidebar.sidebarSubMain
  );
  const [navList, setNavList] = useState<any[]>([]);
  const { adminRole } = useAdminRole();
  const filteredNavItems = useFilteredNavigation(navItems, adminRole);
  useEffect(() => {
    setNavList(filteredNavItems)
  }, [ filteredNavItems, navItems]);

  return (
    <div className="bg-white h-screen overflow-hidden">
      <div className="w-20"></div>
      <div className="flex flex-wrap h-full">
        {/* <div className="z-10 shadow-md">
          <SidebarCombine navigation={navigation} />
        </div> */}
        <motion.div
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className={`w-full pt-0 flex-wrap h-screen flex flex-col ${sidebarSubMain ? "pl-[0px]" : "pl-[67px]"}`}
        >
          <div className="flex flex-col h-full relative">
            {navItems?.length > 0 && (
              // <MainHeader navItems={navList}/>
              <Header navItems={navList} serviceName="Reports"/>
            )}
            <div className="flex-1 overflow-hidden bg-[#f3f4f8] min-h-0">
              {children}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default DashboardWrapper;