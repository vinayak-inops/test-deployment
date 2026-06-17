"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import {
  Grid3x3,
  Search,
  BookOpen,
  AlertCircle,
  Zap,
  Plug,
  GitBranch,
  Clock,
  Calendar,
  MapPin,
  Timer,
  FileText,
  User,
  UserCircle,
  Users,
  Building2,
  ShieldCheck,
  CreditCard,
  ClipboardList,
  AlertTriangle,
  Briefcase,
  Settings,
  Calculator,
  Radio,
  Server,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  id: string
  label: string
  icon?: string
  badge?: string
  state?: "default" | "warning"
  onClick?: () => void
}

interface NavSection {
  title?: string
  items: NavItem[]
}

interface SidebarProps {
  sections: NavSection[]
  activeId?: string
  onItemClick?: (id: string) => void
  colorClasses?: {
    default?: string
    active?: string
    warning?: string
    activeWarning?: string
  }
}

export function Sidebar({ sections, activeId, onItemClick, colorClasses }: SidebarProps) {
  const [activeItem, setActiveItem] = useState(activeId || sections?.[0]?.items?.[0]?.id || "")

  // Keep internal active state in sync with external prop changes
  useEffect(() => {
    if (activeId && activeId !== activeItem) {
      setActiveItem(activeId)
    }
  }, [activeId])

  const palette = {
    default: colorClasses?.default ?? "text-gray-700 hover:bg-gray-100",
    active: colorClasses?.active ?? "bg-blue-100 text-blue-900",
    warning: colorClasses?.warning ?? "text-red-700 hover:bg-red-50",
    activeWarning: colorClasses?.activeWarning ?? "bg-red-100 text-red-800",
  }

  const IconFor = useMemo(() => ({
    grid: Grid3x3,
    "grid3x3": Grid3x3,
    search: Search,
    book: BookOpen,
    "book-open": BookOpen,
    alert: AlertCircle,
    "alert-circle": AlertCircle,
    zap: Zap,
    plug: Plug,
    "git-branch": GitBranch,
    clock: Clock,
    calendar: Calendar,
    "map-pin": MapPin,
    timer: Timer,
    "file-text": FileText,
    user: User,
    "user-circle": UserCircle,
    users: Users,
    building: Building2,
    "shield-check": ShieldCheck,
    settings: Settings,
    calculator: Calculator,
    radio: Radio,
    server: Server,
    "credit-card": CreditCard,
    "clipboard-list": ClipboardList,
    "alert-triangle": AlertTriangle,
    briefcase: Briefcase,
    rule: ShieldCheck, // For rules & restrictions
    balance: Calculator, // For balance management
    cash: CreditCard, // For encashment
  } as Record<string, LucideIcon>), [])

  return (
    <aside className="w-64 h-full overflow-y-auto overflow-x-hidden">
      <nav className="p-4 space-y-3">
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            {section.title && (
              <h3 className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setActiveItem(item.id)
                    onItemClick?.(item.id)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    activeItem === item.id
                      ? item.state === "warning"
                        ? palette.activeWarning
                        : palette.active
                      : item.state === "warning"
                        ? palette.warning
                        : palette.default,
                  )}
                >
                  <span className="flex-shrink-0">
                    {(() => {
                      const key = (item.icon || "").toLowerCase()
                      const Icon = IconFor[key]
                      return Icon ? <Icon className="w-5 h-5" /> : null
                    })()}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}