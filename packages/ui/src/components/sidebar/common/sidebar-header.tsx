import React from 'react';
import Image from "next/image";

const SidebarHeader: React.FC = () => {
  return (
    <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2">
        <Image src="/image/inops-logo.png" width={130} height={80} alt="logo"/>
      </div>
    </div>
  );
};

export default SidebarHeader;