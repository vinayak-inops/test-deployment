"use client";
import Link from "next/link";
import { cn } from "../../lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@inops/store/src/store";
import { setSidebarSubMain } from "@inops/store/src/slices/sidebar/sidebar-slice";
import { IoMenuSharp } from "react-icons/io5";
import { FaHome } from "react-icons/fa";
import { LuWorkflow } from "react-icons/lu";
import { MdAdminPanelSettings } from "react-icons/md";
import { useEffect, useState } from "react";
import { BiSolidReport } from "react-icons/bi";

export default function SidebarMain() {
  const dispatch = useDispatch();
  const sidebarSubMain = useSelector(
    (state: RootState) => state.sidebar.sidebarSubMain
  );
  const [selectHost, setSelectHost]=useState("http://localhost:3000")
  useEffect(() => {
    setSelectHost(window.location.origin)
  }, []);

  type NavItem = {
    title: string;
    host:string;
    icon?: any;
    isActive?: boolean;
    children?: NavItem[];
  };
  const navItems: NavItem[] = [
    {
      title: "Home",
      host:"http://localhost:3000",
      icon: (item: NavItem) => (
        <FaHome
          className={`h-6 w-6 ${selectHost === item?.host ? "text-white" : "text-[#1488fc]"}`}
        />
      ),
    },
    {
      title: "Master",
      host:"http://localhost:3001",
      icon: (item: NavItem) => (
        <MdAdminPanelSettings
          className={`h-6 w-6 ${selectHost === item?.host ? "text-white" : "text-[#1488fc]"}`}
        />
      ),
      isActive: true,
    },
    {
      title: "Workflow",
      host:"http://localhost:3002",
      icon: (item: NavItem) => (
        <LuWorkflow
          className={`h-6 w-6 ${selectHost === item?.host ? "text-white" : "text-[#1488fc]"}`}
        />
      ),
    },
    {
      title: "Reports",
      host:"http://localhost:3003",
      icon: (item: NavItem) => (
        <BiSolidReport
          className={`h-6 w-6 ${selectHost === item?.host ? "text-white" : "text-[#1488fc]"}`}
        />
      ),
    },
  ];
  return (
    <div
      className={`flex h-full w-16 flex-col items-center ${sidebarSubMain ? "border-r border-[#1A2A3C]" : ""}  py-4`}
    >
      <button
        onClick={() => {
          dispatch(setSidebarSubMain(!sidebarSubMain));
        }}
        className="mb-4 rounded-md p-1 hover:bg-gray-100"
      >
        <IoMenuSharp className="h-5 w-5 text-[#1488fc]" />
      </button>

      <nav className="flex flex-1 flex-col items-center space-y-4">
        {navItems.map((item) => (
          <Link href={item.host}>
            <div className="flex justify-center ">
              <div
                key={item.title}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-md ",
                  selectHost === item?.host
                    ? "bg-[#1488fc] text-white"
                    : "text-gray-500 hover:bg-gray-100"
                )}
                title={item.title}
              >
                <div>{item.icon && item.icon(item)}</div>
              </div>
            </div>
            <p
              className={cn(
                "text-center font-light text-[10px] mt-[1px text-[#1488fc]"
              )}
            >
              {item.title}
            </p>
          </Link>
        ))}
      </nav>
    </div>
  );
}
