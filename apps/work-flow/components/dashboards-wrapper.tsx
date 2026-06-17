"use client";
import React from "react";

import SidebarCombine from "@repo/ui/components/sidebar/sidebar-combine";
import { RootState } from "@inops/store/src/store";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { createButton, navigation, navItems } from "@/json/menu/menu";
import Header from "@repo/ui/components/header/header";
import MainHeader from "@repo/ui/components/header/main-header";

function DashboardWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sidebarSubMain = useSelector(
    (state: RootState) => state.sidebar.sidebarSubMain
  );


  return (
    <div className=" bg-[#e5f1fc] overflow-y-hidden">
      <div className="w-20"></div>
      <div className="flex flex-wrap">
        {/* <div className="">
          <SidebarCombine navigation={navigation} createButton={createButton} />
        </div> */}
        <motion.div
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className={` w-full pt-0 flex-wrap h-screen  ${sidebarSubMain ? "pl-[0px]" : "pl-[0px]"}`}
        >
          <div className="flex flex-col bg-white h-full rounded-tl-3xl rounded-tr-3xl relative z-[0] shadow-[0_48px_100px_0_rgba(17,12,46,0.15)]">
            <div className="relative z-50 bg-white rounded-tl-3xl rounded-tr-3xl">
            <MainHeader navItems={navItems}/>
            </div>
            <div className="overflow-y-hidden h-full">{children}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default DashboardWrapper;
