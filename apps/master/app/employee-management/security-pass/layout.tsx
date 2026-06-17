import React from "react";

export default function SecurityPassLayout({
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
  