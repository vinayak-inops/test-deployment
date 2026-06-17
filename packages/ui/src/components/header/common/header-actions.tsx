"use client";

import { Bell, Settings, User } from "lucide-react";

export function HeaderActions() {
  return (
    <div className="flex items-center gap-3">
      <button className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow hover:bg-[#f1f5f9] transition-colors">
        <User className="h-6 w-6 text-[#2b3674] group-hover:text-[#2563eb]" />
      </button>
      {/* <button className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow hover:bg-[#f1f5f9] transition-colors">
        <Settings className="h-6 w-6 text-[#2b3674] group-hover:text-[#2563eb]" />
      </button> */}
      <button className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow hover:bg-[#f1f5f9] transition-colors">
        <Bell className="h-6 w-6 text-[#2b3674] group-hover:text-[#2563eb]" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white shadow-md">
          9
        </span>
      </button>
    </div>
  );
}
