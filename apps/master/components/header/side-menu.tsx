"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { RootState } from "@inops/store/src/store"
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
  Rocket,
  ShieldCheck,
  Coins,
  BadgeCheck,
  Wallet,
  Receipt
} from "lucide-react"
import useCurrentDomain from "@/hooks/api/useCurrentDomain"

const allCards = [
  { title: "Dashboard", link: "/dashboard/dashboardfinal", serviceName: ["dashboard"] },
  { title: "CXO Dashboard", link: "/dashboard/chro", serviceName: ["csoDashboard"] },
  { title: "Manager Dashboard", link: "/dashboard/manager", serviceName: ["managerDashboard"] },
  { title: "Personal Dashboard", link: "/dashboard/personal", serviceName: ["personalDashboard"] },
  { title: "Data Manager", link: "/master/management", serviceName: ["roleControl", "user", "employeeManagement", "setting", "policy", "excelUpload", "organization"] },
  { title: "Workflow", link: "/workflow/create-work-flow", serviceName: ["work-flow"] },
  { title: "Muster Roll", link: "/muster/punch", serviceName: ["muster"] },
  { title: "Reports", link: "/reports/reports", serviceName: ["reports"] },
  { title: "Wages & Salary", link: "/wages/wage-management", serviceName: ["wage"] },
  { title: "BG Verification", link: "/master/bgv-application", serviceName: ["bgm"] },
  { title: "Earned Wage Access", link: "/wages/ewa", serviceName: ["ewa"] },
  { title: "Challan Reconciliation", link: "/aiapplication/challan-upload", serviceName: ["challan"] },
]

const IconFor = (title: string) => {
  switch (title.toLowerCase()) {
    case "dashboard":
    case "cxo dashboard":
    case "manager dashboard":
    case "personal dashboard":
      return LayoutDashboard
    case "data manager":
      return FileText
    case "workflow":
      return GitBranch
    case "muster roll":
      return ClipboardCheck
    case "reports":
      return BarChart3
    case "wages & salary":
      return Coins
    case "bg verification":
      return ShieldCheck
    case "earned wage access":
      return Wallet
    case "challan reconciliation":
      return Receipt
    default:
      return Circle
  }
}

export default function SideMenu() {
  const adminRole = useSelector((state: RootState) => (state as any).api?.data)
  const apiState = useSelector((state: RootState) => state.api)
  const [allowedServices, setAllowedServices] = useState<string[]>([])
  const router = useRouter()
  const NEXT_PUBLIC_NEXTAUTH_URL = useCurrentDomain()

  useEffect(() => {
    const apiPerms =
      (apiState?.data && Array.isArray(apiState.data) ? apiState.data[0] : apiState?.data) ?? null
    const rolePerms = apiPerms ?? adminRole ?? null

    if (!rolePerms || typeof rolePerms !== "object") {
      setAllowedServices([])
      return
    }

    const names = Object.entries(rolePerms)
      .filter(([_, val]) => {
        if (!val) return false
        if (typeof val === "object" && "isActive" in (val as any)) {
          return Boolean((val as any).isActive)
        }
        return val === true
      })
      .map(([key]) => key)

    setAllowedServices(Array.from(new Set(names)) as string[])
  }, [adminRole, apiState])

  const items = useMemo(() => {
    if (!allowedServices.length) return []
    return allCards.filter((card) =>
      card.serviceName.some((name) => allowedServices.includes(name))
    )
  }, [allowedServices])

  return (
    <div className="group fixed left-0 bottom-0 h-auto z-[5] w-2">
      <div className="absolute left-0 bottom-0 h-full w-full z-10" />

      <aside className="relative h-auto w-12">
        <nav className="flex flex-col items-center justify-end h-auto py-2 bg-blue-50">
          <button
            onClick={() => router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/launchdesk`)}
            title="Launchdesk"
            className="flex items-center justify-center w-12 h-10 my-0.5 rounded-md text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Rocket className="h-5 w-5" />
          </button>

          {items.map((item, idx) => {
            const Icon = IconFor(item.title)
            return (
              <button
                key={`${item.title}-${idx}`}
                onClick={() => router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}${item.link}`)}
                title={item.title}
                className="flex items-center justify-center w-12 h-10 my-0.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
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
