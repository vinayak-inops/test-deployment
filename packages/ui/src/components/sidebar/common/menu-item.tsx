import React, { ReactNode } from 'react';
import { ChevronRight } from "lucide-react";

interface MenuItemProps {
  icon: ReactNode;
  label: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label }) => {
  return (
    <div className="flex items-center justify-between px-3 py-2 menu-item-hover rounded-lg mb-1">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </div>
  );
};

export default MenuItem;