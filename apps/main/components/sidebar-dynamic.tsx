"use client"

import * as React from "react"
import {
  BarChart3,
  CheckSquare,
  ChevronDown,
  Cog,
  FileText,
  Grid,
  HelpCircle,
  LayoutGrid,
  LayoutTemplate,
  LogOut,
  Plus,
  Settings,
  Shield,
  Target,
  Users,
  Wallet,
} from "lucide-react"

import { cn } from "@repo/ui/lib/utils"

// We'll use these components directly since they're already installed via shadcn/ui
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  useSidebar,
} from "@repo/ui/components/ui/sidebar"

interface DesignLibSidebarProps {
  className?: string
}

export function SidebarDynamic({ className }: DesignLibSidebarProps) {
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <div className={cn("flex min-h-screen", isDarkMode ? "dark" : "", className)}>
      <SidebarProvider>
        <AppSidebar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        <div className="flex-1 p-4">
          <Button
            onClick={toggleDarkMode}
            className="fixed bottom-4 right-4 z-50"
            variant={isDarkMode ? "outline" : "default"}
          >
            {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </Button>
        </div>
      </SidebarProvider>
    </div>
  )
}

interface AppSidebarProps {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

function AppSidebar({ isDarkMode, toggleDarkMode }: AppSidebarProps) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar className={cn("border-r", isDarkMode ? "bg-[#0f1117]" : "bg-white")}>
      <SidebarHeader className="flex flex-col gap-2 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-600 text-white">
              <span className="font-bold">D</span>
            </div>
            {!isCollapsed && <span className="font-semibold">DesignLib</span>}
          </div>
          {!isCollapsed && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleDarkMode}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Input
            placeholder="Search"
            className={cn(
              "h-8 pl-8",
              isDarkMode ? "bg-[#1a1d27] text-white" : "bg-gray-100 text-gray-800",
              isCollapsed ? "w-8 rounded-full px-2" : "w-full",
            )}
          />
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isDarkMode ? "text-gray-400" : "text-gray-500"}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Ctrl+D</div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className={isDarkMode ? "text-white" : "text-gray-800"}>
        <SidebarGroup>
          <SidebarGroupLabel
            className={cn(isCollapsed ? "mx-0 px-0" : "", isDarkMode ? "text-gray-400" : "text-gray-500")}
          >
            {isCollapsed ? "GEN" : "GENERAL"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Dashboard"
                  className={isDarkMode ? "hover:bg-[#1a1d27]" : "hover:bg-gray-100"}
                >
                  <LayoutGrid className="h-5 w-5" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="To-do List"
                  className={isDarkMode ? "hover:bg-[#1a1d27]" : "hover:bg-gray-100"}
                >
                  <CheckSquare className="h-5 w-5" />
                  <span>To-do List</span>
                  <Badge variant="outline" className="ml-auto rounded-md bg-orange-500 text-white">
                    06
                  </Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Goals" className={isDarkMode ? "hover:bg-[#1a1d27]" : "hover:bg-gray-100"}>
                  <Target className="h-5 w-5" />
                  <span>Goals</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Projects"
                  className={isDarkMode ? "hover:bg-[#1a1d27]" : "hover:bg-gray-100"}
                >
                  <FileText className="h-5 w-5" />
                  <span>Projects</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Budgets"
                  className={isDarkMode ? "hover:bg-[#1a1d27]" : "hover:bg-gray-100"}
                >
                  <Wallet className="h-5 w-5" />
                  <span>Budgets</span>
                  <Badge variant="outline" className="ml-auto rounded-md bg-purple-500 text-white">
                    New
                  </Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Templates"
                  className={isDarkMode ? "hover:bg-[#1a1d27]" : "hover:bg-gray-100"}
                >
                  <LayoutTemplate className="h-5 w-5" />
                  <span>Templates</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Reports"
                  className={isDarkMode ? "hover:bg-[#1a1d27]" : "hover:bg-gray-100"}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Reports</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel
            className={cn(isCollapsed ? "mx-0 px-0" : "", isDarkMode ? "text-gray-400" : "text-gray-500")}
          >
            {isCollapsed ? "MY" : "MY SPACES"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="All" className={isDarkMode ? "hover:bg-[#1a1d27]" : "hover:bg-gray-100"}>
                  <Grid className="h-5 w-5" />
                  <span>All</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Assigned to me"
                  className={isDarkMode ? "hover:bg-[#1a1d27]" : "hover:bg-gray-100"}
                >
                  <Users className="h-5 w-5" />
                  <span>Assigned to me</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Shared" className={isDarkMode ? "hover:bg-[#1a1d27]" : "hover:bg-gray-100"}>
                  <Users className="h-5 w-5" />
                  <span>Shared</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Private"
                  className={isDarkMode ? "hover:bg-[#1a1d27]" : "hover:bg-gray-100"}
                >
                  <Shield className="h-5 w-5" />
                  <span>Private</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Add team member"
                  className={isDarkMode ? "hover:bg-[#1a1d27]" : "hover:bg-gray-100"}
                >
                  <Users className="h-5 w-5" />
                  <span>Add team member</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mt-auto">
        <div className="flex flex-col gap-2 p-2">
          <div className="flex justify-around">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                isDarkMode ? "text-white hover:bg-[#1a1d27]" : "text-gray-800 hover:bg-gray-100",
              )}
            >
              <LogOut className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                isDarkMode ? "text-white hover:bg-[#1a1d27]" : "text-gray-800 hover:bg-gray-100",
              )}
            >
              <Cog className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                isDarkMode ? "text-white hover:bg-[#1a1d27]" : "text-gray-800 hover:bg-gray-100",
              )}
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                isDarkMode ? "text-white hover:bg-[#1a1d27]" : "text-gray-800 hover:bg-gray-100",
              )}
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback>MN</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-1 items-center justify-between">
                <span className={cn("text-sm", isDarkMode ? "text-white" : "text-gray-800")}>Mahfuzul Islam Nabil</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-6 w-6", isDarkMode ? "text-white" : "text-gray-800")}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
