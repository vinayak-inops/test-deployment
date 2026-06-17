"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  GitBranch,
  ClipboardCheck,
  BarChart3,
  CalendarDays,
  Timer,
  AlarmClock,
  MapPin,
  Circle,
  Rocket
} from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"
import useCurrentDomain from "@/hooks/api/useCurrentDomain";
// Try to reuse launchdesk cards for menu
// Relative import from apps/main


export default function SideMenu() {
  const [allCards, setAllCards] = useState<any[]>([])
  const tenantCode  = useGetTenantCode()
  // Only take items that have a link

  const {
    data: launchdeskResponse,
    loading: isLoadingLaunchdesk,
    error: fetchLaunchdeskError,
    refetch: refetchLaunchdesk
  } = useRequest<any>({
    url: 'launchdesk/search',
    method: 'POST',
    data: [
      {
        operator: "eq",
        field: "tenantCode",
        value: tenantCode
      }
    ],
    onSuccess: (data: any) => {
      setAllCards(data[0]?.allCards || [])
    },
    onError: (error: any) => {
    },
    dependencies: [tenantCode]
  })

  useEffect(() => {
    refetchLaunchdesk()
  }, [tenantCode])


  const items = (allCards || []).filter((c: any) => !!c?.link)

  const IconFor = (serviceName?: string, title?: string) => {
    switch ((serviceName || title || "").toLowerCase()) {
      case "dashboard":
        return LayoutDashboard
      case "master":
        return FileText
      case "excel-upload":
        return UploadCloud
      case "work-flow":
        return GitBranch
      case "muster":
        return ClipboardCheck
      case "reports":
        return BarChart3
      case "leave":
      case "leave application":
        return CalendarDays
      case "ot":
      case "ot application":
        return Timer
      case "shiftapplication":
      case "shift application":
        return AlarmClock
      case "outduty":
      case "out duty":
        return MapPin
      default:
        return Circle
    }
  }

  const router = useRouter()
  const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()

  return (
    <div className="group fixed left-0 top-0 h-screen z-[60] w-2">
      {/* Invisible hover handle spanning the container width */}
      <div className="absolute left-0 top-0 h-full w-full cursor-pointer bg-transparent z-10" />

      {/* Panel (fully hidden until hover) */}
      <aside className="relative h-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-r border-gray-200 shadow-sm transition-transform duration-300 ease-out -translate-x-full group-hover:translate-x-0 w-12">
        <nav className="flex flex-col items-center h-full py-2">
          {/* Launchdesk shortcut */}
          <button
            onClick={() => router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/launchdesk`)}
            title="Launchdesk"
            className="flex items-center justify-center w-12 h-10 my-0.5 rounded-md text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
          >
            <Rocket className="h-5 w-5" />
          </button>

          {items.map((item: any, idx: number) => {
            const Icon = IconFor(item.serviceName, item.title)
            return (
              <button
                key={`${item.title}-${idx}`}
                onClick={() => router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}${item.link}`)}
                title={item.title}
                className="flex items-center justify-center w-12 h-10 my-0.5 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Icon className="h-5 w-5" />
              </button>
            )
          })}
        </nav>
      </aside>
    </div>
  )
}
