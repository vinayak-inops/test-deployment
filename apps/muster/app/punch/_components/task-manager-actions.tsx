"use client"

import { useState } from "react"
import { Clock, Users, History, User } from "lucide-react"
import { useRouter } from "next/navigation";

export default function TaskManagerActions() {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const router = useRouter();

  const actions = [
    // {
    //   id: "punch",
    //   title: "Today Punch",
    //   subtitle: "In/Out Records",
    //   icon: Clock,
    //   link: "/punch/today-punch",
    // },
    // {
    //   id: "guests",
    //   title: "Guest Section",
    //   subtitle: "Manage Visitors",
    //   icon: Users,
    //   link: "/punch/guest-section",
    // },
    // {
    //   id: "history",
    //   title: "History",
    //   subtitle: "Past Records",
    //   icon: History,
    //   link: "/punch/history",
    // },
    {
      id: "individualpunch",
      title: "Row Punch",
      subtitle: "View Row Entry",
      icon: User,
      link: "/punch/individual-punch",
    },
    {
      id: "musterpunch",
      title: "Muster Punch",
      subtitle: "View Muster Entry",
      icon: User,
      link: "/punch/muster-punch",
    },
  ]

  return (
    <div className="p-0">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Task Manager</h2>
        </div>

        {/* Main Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => {
            const IconComponent = action.icon
            const isHovered = hoveredButton === action.id

            return (
              <button
                key={action.id}
                onClick={() => router.push(action.link)}
                onMouseEnter={() => setHoveredButton(action.id)}
                onMouseLeave={() => setHoveredButton(null)}
                className={`group flex items-center space-x-4 p-4 rounded-2xl border-2 transition-all duration-200 shadow-xl text-left ${
                  isHovered
                    ? "bg-[#007AFF] border-[#007AFF] shadow-lg transform -translate-y-1"
                    : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    isHovered ? "bg-white/20" : "bg-gray-100"
                  }`}
                >
                  <IconComponent
                    className={`w-6 h-6 transition-colors duration-200 ${isHovered ? "text-white" : "text-gray-600"}`}
                  />
                </div>

                {/* Text Content */}
                <div className="flex-1">
                  <h3
                    className={`font-semibold text-base transition-colors duration-200 ${
                      isHovered ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {action.title}
                  </h3>
                  <p
                    className={`text-sm transition-colors duration-200 ${
                      isHovered ? "text-white/80" : "text-gray-500"
                    }`}
                  >
                    {action.subtitle}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
