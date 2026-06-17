"use client"

import { Users, UserPlus, Target, Briefcase, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import StatsCard from "./stats-card"
import { Button } from "@repo/ui/components/ui/button"

interface InfoBoxsProps {
  itemsPerView?: number // Number of items to show before scrolling
}

export default function InfoBoxs({ itemsPerView = 3 }: InfoBoxsProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const metrics = [
    {
      title: "Punches This Month",
      value: "1,247",
      change: "+156 from last month",
      changeType: "positive" as const,
      icon: Users,
      iconColor: "text-white",
      bgColor: "bg-blue-500",
    },
    {
      title: "Punches Today",
      value: "89",
      change: "+12 from yesterday",
      changeType: "positive" as const,
      icon: UserPlus,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Punch In",
      value: "45",
      change: "On time: 42",
      changeType: "positive" as const,
      icon: Target,
      iconColor: "text-white",
      bgColor: "bg-blue-400",
    },
    {
      title: "Punch Out",
      value: "44",
      change: "Pending: 1",
      changeType: "positive" as const,
      icon: Briefcase,
      iconColor: "text-white",
      bgColor: "bg-blue-200",
    },
  ]

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.clientWidth / itemsPerView
      scrollContainerRef.current.scrollBy({ left: -cardWidth, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.clientWidth / itemsPerView
      scrollContainerRef.current.scrollBy({ left: cardWidth, behavior: "smooth" })
    }
  }

  useEffect(() => {
    setIsVisible(true)
    checkScrollButtons()

    const handleResize = () => checkScrollButtons()
    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [itemsPerView])

  return (
    <div className="p-0">
      <div className="w-full">
        <div className="relative">
          {/* Left Scroll Button */}
          {canScrollLeft && (
            <Button
              onClick={scrollLeft}
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-blue-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Right Scroll Button */}
          {canScrollRight && (
            <Button
              onClick={scrollRight}
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-blue-300"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollButtons}
            className={`flex gap-6 overflow-x-scroll scrollbar-hide transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {metrics.map((metric, index) => (
              <div
                key={metric.title}
                className="transform transition-all duration-500 hover:scale-105 hover:-translate-y-2 flex-shrink-0"
                style={{
                  width: `calc((100% - ${(itemsPerView - 1) * 24}px) / ${itemsPerView})`,
                  minWidth: `calc((100% - ${(itemsPerView - 1) * 24}px) / ${itemsPerView})`
                }}
              >
                <div
                  className="transform transition-all duration-500 hover:scale-105"
                  style={{
                    animationDelay: `${index * 200}ms`,
                  }}
                >
                  <StatsCard
                    title={metric.title}
                    value={metric.value}
                    change={metric.change}
                    changeType={metric.changeType}
                    icon={metric.icon}
                    iconColor={metric.iconColor}
                    bgColor={metric.bgColor}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide {
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
