"use client"
import Navigation from "@repo/ui/components/sidebar/common/navigation"
import { usePathname } from "next/navigation";

export default function SidebarMini({navigation}:{navigation:any}) {
  const pathname = usePathname();
  return (
    <div className="w-[230px] border-r border-gray-200 bg-gray-50 pt-3 sticky top-0 overflow-y-scroll">
      <Navigation navigation={navigation} pathname={pathname} />
    </div>
  )
}