import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import * as Icons from "lucide-react";
import Navigation from "./common/navigation";

export function SidebarSubMain({
  navigation,
  createButton,
}: {
  navigation: any;
  createButton?: any;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen w-[256px] bg-white">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[#eef2f6]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold">I</span>
          </div>
          <span className="font-semibold text-gray-500">inops</span>
        </div>
        <Icons.Settings className="w-5 h-5 text-gray-500" />
      </div>

      {createButton && (
        <div className="p-3 mt-0 flex items-center justify-center">
          <Link
            href={createButton.link}
            className="bg-[#1488fc] hover:bg-[#1488fc] text-white flex justify-center px-4 py-2 rounded-lg items-center gap-2 font-medium shadow-sm transition-colors w-full"
            onClick={() => {}}
          >
            <Icons.Plus size={20} />
            {createButton.title}
          </Link>
        </div>
      )}

      {/* Navigation */}
      <Navigation navigation={navigation} pathname={pathname} />

      {/* Footer */}
      <div className=" p-4 bg-[#eef2f6]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">MH</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">
              Mushfiqul Islam Heidi
            </p>
            <p className="text-xs text-gray-700">Designer</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      {/* <div className="border-t p-2 bg-gray-50">
        <div className="flex items-center justify-around">
          <button className="p-2 text-gray-500 hover:text-gray-900">
            <Icons.Home className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-900">
            <Icons.MessageSquare className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-900 relative">
            <Icons.Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-900">
            <Icons.User className="w-5 h-5" />
          </button>
        </div>
      </div> */}
    </div>
  );
}
