"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "../../lib/utils";
import { Sidebar } from "../ui/sidebar";
import SidebarMain from "./sidebar-main";
import  {SidebarSubMain}  from "./sidebar-sub-main";
import { RootState } from "@inops/store/src/store";
import { useDispatch, useSelector } from "react-redux";



export default function SidebarCombine({navigation,createButton}:{navigation:any;createButton?:any}) {
  const sidebarSubMain = useSelector((state: RootState) => state.sidebar.sidebarSubMain);
  return (
    <div className={`flex h-screen fixed top-0 left-0 z-50 `}>
      {/* Icon-only sidebar */}
      {/* <SidebarMain/> */}

      {/* Expanded sidebar */}
      {
        sidebarSubMain && (<SidebarSubMain navigation={navigation} createButton={createButton}/>)
      }
    </div>
  );
}
