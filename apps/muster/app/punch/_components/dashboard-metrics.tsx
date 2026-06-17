"use client"

import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"

interface MetricCardProps {
  title: string
  value: string
  change: string
  delay?: number
}

function AnimatedBarChart({ delay = 0 }: { delay?: number }) {
  const [bars, setBars] = useState([40, 60, 30, 80, 50, 70, 45, 90])

  useEffect(() => {
    const interval = setInterval(() => {
      setBars((prev) => {
        // Remove first bar and add new bar at the end
        const newBars = [...prev.slice(1)]
        newBars.push(Math.floor(Math.random() * 60) + 30)
        return newBars
      })
    }, 1500 + delay)

    return () => clearInterval(interval)
  }, [delay])

  return (
    <div className="absolute right-0 top-0 bottom-0 w-[60%] flex items-end justify-end space-x-1 p-4 opacity-60">
      {bars.map((height, index) => (
        <div
          key={`${index}-${Date.now()}`}
          className={`w-5 rounded-t-sm transition-all duration-1000 ease-in-out transform`}
          style={{
            height: `${height}%`,
            animationDelay: `${index * 50}ms`,
            backgroundColor: index === bars.length - 1 ? "#2771d8" : "#e0e7ff",
            animation:
              index === bars.length - 1 ? "slideInRight 1s ease-out" : index === 0 ? "slideOutLeft 1s ease-in" : "none",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes slideInRight {
          0% {
            transform: translateX(100%) scaleY(0);
            opacity: 0;
          }
          50% {
            transform: translateX(0) scaleY(0.5);
            opacity: 0.7;
          }
          100% {
            transform: translateX(0) scaleY(1);
            opacity: 1;
          }
        }
        
        @keyframes slideOutLeft {
          0% {
            transform: translateX(0) scaleY(1);
            opacity: 1;
          }
          50% {
            transform: translateX(-50%) scaleY(0.5);
            opacity: 0.3;
          }
          100% {
            transform: translateX(-100%) scaleY(0);
            opacity: 0;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(1.05);
          }
        }
      `}</style>
    </div>
  )
}

function MetricCard({ title, value, change, delay = 0 }: MetricCardProps) {
  return (
    <Card className="bg-white hover:shadow-2xl transition-all duration-500 border-0 shadow-lg hover:shadow-blue-500/10 relative  min-h-[140px] group flex-shrink-0 w-full">
      <AnimatedBarChart delay={delay} />
      <CardContent className="p-6 relative z-10">
        <div className="space-y-2 max-w-[50%]">
          <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">{title}</p>
          <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
            {value}
          </p>
          <div className="flex items-center space-x-1">
            <svg
              className="w-3 h-3 text-emerald-500 group-hover:text-emerald-600 transition-colors"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-emerald-600 font-medium group-hover:text-emerald-700 transition-colors">
              {change} Deference
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface DashboardMetricsProps {
  itemsPerView?: number // Number of items to show before scrolling
}

export default function Component({ itemsPerView = 3 }: DashboardMetricsProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const  tenantCode  = useGetTenantCode();

  
  const {
    data: presentCount,
    loading: isLoading,
    error: attendanceError,
    refetch: fetchAttendance
  } = useRequest<any>({
    url: 'muster/liveAttendance/count',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
      {
        field: "present",
        operator: "eq",
        value: "true"
      },
    ],
    onSuccess: (data) => { },
    onError: (error) => {
      console.error("Error fetching attendance data:", error);
    },
    dependencies: []
  });


  
  const {
    data: absentCount,
    loading: isLoadingAbsent,
    error: absentError,
    refetch: fetchAbsentCount
  } = useRequest<any>({
    url: 'muster/liveAttendance/count',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
      {
        field: "absent",
        operator: "eq",
        value: "true"
      },
    ],
    onSuccess: (data) => { },
    onError: (error) => {
      console.error("Error fetching attendance data:", error);
    },
    dependencies: []
  });


  
  const {
    data: lateCount,
    loading: isLoadingLate,
    error: lateError,
    refetch: fetchLateCount
  } = useRequest<any>({
    url: 'muster/liveAttendance/count',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
      {
        field: "lateIn",
        operator: "eq",
        value: "true"
      },
    ],
    onSuccess: (data) => { },
    onError: (error) => {
      console.error("Error fetching attendance data:", error);
    },
    dependencies: []
  });

  
  const {
    data: earlyOutCount,
    loading: isLoadingEarlyOut,
    error: earlyOutError,
    refetch: fetchEarlyOutCount
  } = useRequest<any>({
    url: 'muster/liveAttendance/count',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
      {
        field: "earlyOut",
        operator: "eq",
        value: "true"
      },
    ],
    onSuccess: (data) => { },
    onError: (error) => {
      console.error("Error fetching attendance data:", error);
    },
    dependencies: []
  });

  const {
    data: contractEmployeeCount,
    loading: isLoadingContractEmployee,
    error: contractEmployeeError,
    refetch: fetchContractEmployeeCount
  } = useRequest<any>({
    url: 'contract_employee/count',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      }
    ],
    onSuccess: (data) => { },
    onError: (error) => {
      console.error("Error fetching attendance data:", error);
    },
    dependencies: []
  });

  const presentCountPerecentage = (presentCount / contractEmployeeCount) * 100;
  const absentCountPerecentage = (absentCount / contractEmployeeCount) * 100;
  const lateCountPerecentage = (lateCount / contractEmployeeCount) * 100;
  const earlyOutCountPerecentage = (earlyOutCount / contractEmployeeCount) * 100;
  const contractEmployeeCountPerecentage = (contractEmployeeCount / contractEmployeeCount) * 100;

  const metrics = [
    { title: "Present", value: presentCount, change: presentCountPerecentage + "%" },
    { title: "Absent", value: absentCount, change: absentCountPerecentage + "%" },
    { title: "Late In", value: lateCount, change: lateCountPerecentage + "%" },
    { title: "Early Out", value: earlyOutCount, change: earlyOutCountPerecentage + "%" },
  ]


  useEffect(() => {
    fetchAttendance()
  }, [])



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
  }, [])

  return (
    <div className=" bg-gradient-to-br from-gray-50 via-blue-50/30  p-6 pb-2 pt-0">
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
            className={`flex gap-6 overflow-x-scroll pt-6 scrollbar-hide pb-4 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
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
                <MetricCard title={metric.title} value={metric.value} change={metric.change} delay={index * 500} />
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
