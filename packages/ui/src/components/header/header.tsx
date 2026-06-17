"use client";

import { Menu } from "lucide-react";
import { Breadcrumbs } from "./common/breadcrumbs";
import { HeaderTitle } from "./common/header-title";
import { SearchBar } from "./common/search-bar";
import { HeaderActions } from "./common/header-actions";

export default function Header() {
  return (
    <div className="backdrop-blur-md bg-white/30 border-white/30 mx-0 my-0 w-full">
      <div className="flex h-[72px] items-center justify-between px-4 ">
        {/* Left side */}
        <div>
          <Breadcrumbs />
          <HeaderTitle />
        </div>

        {/* Center */}
        <div className="lg:hidden">
          <Menu className="h-6 w-6 text-[#2b3674]" />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-6">
          <SearchBar />
          <HeaderActions />
        </div>
      </div>
    </div>
  );
}