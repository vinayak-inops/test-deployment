"use client";

import { Input } from "../../ui/input";

export function SearchBar() {
  return (
    <div className="relative hidden lg:block">
      <Input
        type="search"
        placeholder="Search here"
        className="w-[280px] h-[40px] rounded-lg border-white/40 bg-white/20 backdrop-blur-sm px-4 py-4 text-sm focus:border-white/60 focus:ring-0 placeholder:text-gray-600 ring-1 ring-[#d2d6da]"
      />
    </div>
  );
}