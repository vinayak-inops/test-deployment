"use client";

import DynamicForm from "@repo/ui/components/form-dynamic/dynamic-form";
import { organization } from "@/json/organization/form-structure";
import SidebarMini from "@/components/sidebar-mini";
import { navContractorEmployee } from "@/json/contractor-employee/menu";

export default function PreferencesPage({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full">
      {/* <SidebarMini navigation={navContractorEmployee}/> */}
      <div className="flex-1 overflow-y-scroll px-12 py-0">{children}</div>
    </div>
  );
}
