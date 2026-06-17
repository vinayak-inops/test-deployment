"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Grid3x3, Search, BookOpen, AlertCircle, Zap, Plug, GitBranch, Settings, MessageSquare, Database, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  id: string
  label: string
  icon?: string
  badge?: string
  onClick?: () => void
}

interface NavSection {
  title?: string
  items: NavItem[]
}

interface VerticalSidebarProps {
  sections: NavSection[]
  activeId?: string
  onItemClick?: (id: string) => void
}

export function VerticalSidebar({ sections, activeId, onItemClick }: VerticalSidebarProps) {
  const [activeItem, setActiveItem] = useState(activeId || sections?.[0]?.items?.[0]?.id || "")

  // Keep internal active state in sync with external prop changes
  useEffect(() => {
    if (activeId && activeId !== activeItem) {
      setActiveItem(activeId)
    }
  }, [activeId])

  const IconFor = useMemo(() => ({
    grid: Grid3x3,
    search: Search,
    book: BookOpen,
    alert: AlertCircle,
    zap: Zap,
    plug: Plug,
    "git-branch": GitBranch,
    settings: Settings,
    "message-square": MessageSquare,
    database: Database,
  } as Record<string, LucideIcon>), [])

  return (
    <aside className="w-64 max-h-screen overflow-y-auto sticky top-0 self-start">
      <nav className="p-4 space-y-6">
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            {section.title && (
              <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveItem(item.id)
                    onItemClick?.(item.id)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    activeItem === item.id
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100",
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
