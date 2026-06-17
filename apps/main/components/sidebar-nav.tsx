import Link from "next/link"
import { Menu, Home, Folder, LayoutGrid, Star, Grid, Ghost } from "lucide-react"

export default function SidebarNav() {
  return (
    <nav className="flex flex-col h-screen w-20 bg-[#4967b4] fixed left-0 top-0 border-r">
      <div className="flex flex-col items-center gap-8 p-4">
        <button className="p-2 hover:bg-purple-100 rounded-lg transition-colors">
          <Menu className="w-5 h-5 text-[#49c6f4]" />
        </button>

        <div className="flex flex-col items-center gap-6">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 p-2 hover:bg-purple-100 rounded-lg transition-colors group"
          >
            <Home className="w-5 h-5 text-[#49c6f4] group-hover:text-purple-800" />
            <span className="text-xs text-[#49c6f4] group-hover:text-purple-800">Home</span>
          </Link>

          <Link
            href="/projects"
            className="flex flex-col items-center gap-1 p-2 hover:bg-purple-100 rounded-lg transition-colors group"
          >
            <Folder className="w-5 h-5 text-[#49c6f4] group-hover:text-purple-800" />
            <span className="text-xs text-[#49c6f4] group-hover:text-purple-800">Projects</span>
          </Link>

          <Link
            href="/templates"
            className="flex flex-col items-center gap-1 p-2 hover:bg-purple-100 rounded-lg transition-colors group"
          >
            <LayoutGrid className="w-5 h-5 text-[#49c6f4] group-hover:text-purple-800" />
            <span className="text-xs text-[#49c6f4] group-hover:text-purple-800">Templates</span>
          </Link>

          <Link
            href="/brand"
            className="flex flex-col items-center gap-1 p-2 hover:bg-purple-100 rounded-lg transition-colors group relative"
          >
            <div className="relative">
              <Star className="w-5 h-5 text-[#49c6f4] group-hover:text-purple-800" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" />
            </div>
            <span className="text-xs text-[#49c6f4] group-hover:text-purple-800">Brand</span>
          </Link>

          <Link
            href="/apps"
            className="flex flex-col items-center gap-1 p-2 hover:bg-purple-100 rounded-lg transition-colors group"
          >
            <Grid className="w-5 h-5 text-[#49c6f4] group-hover:text-purple-800" />
            <span className="text-xs text-[#49c6f4] group-hover:text-purple-800">Apps</span>
          </Link>

          <Link
            href="/dream-lab"
            className="flex flex-col items-center gap-1 p-2 hover:bg-purple-100 rounded-lg transition-colors group"
          >
            <Ghost className="w-5 h-5 text-[#49c6f4] group-hover:text-purple-800" />
            <span className="text-xs text-[#49c6f4] group-hover:text-purple-800">Dream Lab</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
