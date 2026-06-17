"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from 'next/navigation';
import SidebarCombine from "@repo/ui/components/sidebar/sidebar-combine";
import { RootState } from "@inops/store/src/store";
import { useSelector } from "react-redux";
  import { motion } from "framer-motion";
  import { navOutDutyApplication } from "@/json/menu/menu";
import MainHeader from "@repo/ui/components/header/main-header";
import { useAdminRole } from "@inops/store/src/hooks/useAdminRole";
import { useFilteredNavigation } from "@/hooks/role-control/useRoleControl";
import  Header  from "../../../components/header/header";
import Footer from "../../../components/footer/footer";

function DashboardWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sidebarSubMain = useSelector(
    (state: RootState) => state.sidebar.sidebarSubMain
  );
  const pathname = usePathname();

  const [navList, setNavList] = useState<any[]>([]);
  const { adminRole } = useAdminRole();
  const filteredNavItems = useFilteredNavigation(navOutDutyApplication, adminRole);
  useEffect(() => {
    setNavList(navOutDutyApplication)
  }, [ filteredNavItems, navOutDutyApplication]);
  

  return (
    <div className="bg-white">
      <div className="w-20"></div>
      <div className="flex flex-wrap">
        {/* <div className="z-10 shadow-md">
          <SidebarCombine navigation={navigation} />
        </div> */}
        <motion.div
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className={`w-full pt-0 flex-wrap min-h-screen flex flex-col ${sidebarSubMain ? "pl-[0px]" : "pl-[67px]"}`}
        >
          <div className="flex bg-[#f3f4f8] flex-col min-h-screen relative shadow-[0_48px_100px_0_rgba(17,12,46,0.15)]">
            {navOutDutyApplication?.length > 0 && (
              // <MainHeader navItems={navList}/>
              <Header navItems={navList} serviceName="Out Duty"/>
            )}
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default DashboardWrapper;
