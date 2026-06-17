"use client"
import { VerticalSidebar } from "@/components/tab/vertica-sidebar-tab";
import InnerLeaveApplicationPage from "./leave-application/_components/leave-application-page";
import SpecialLeaveApplicationPage from "./special-leave-application/_components/special-leave-application-page";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import LeaveApplicationHeader from "./leave-application-header";

export default function LeaveApplicationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get active tab from URL, default to 'leaveApplication'
  const activeId = useMemo(() => {
    const tab = searchParams.get('tab')
    if (tab === 'specialLeaveApplication' || tab === 'leaveApplication') {
      return tab as 'leaveApplication' | 'specialLeaveApplication'
    }
    return 'leaveApplication' as const
  }, [searchParams])

  const sections = [
    // {
    //   title: "New Application",
    //   items: [
    //     { id: "newLeaveApplication", label: "New Leave Application", icon: "zap" },
    //   ],
    // },
    {
      title: "Leave",
      items: [
        { id: "leaveApplication", label: "Time Away", icon: "grid" },
        { id: "specialLeaveApplication", label: "Leave of Absence", icon: "book" },
      ],
    },
  ]

  const handleItemClick = (id: string) => {
    const newTab = id as 'leaveApplication' | 'specialLeaveApplication'
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', newTab)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className='flex justify-center min-h-screen'>
      <div className="w-full max-w-7xl ">
        {/* Global header spanning sidebar and content */}
        <LeaveApplicationHeader title="Leave Applications" description="Manage leave and special leave applications" />

        <div className="flex w-full ">
          <VerticalSidebar
          sections={sections}
          activeId={activeId}
          onItemClick={handleItemClick}
          />
          <div className="flex-1 overflow-auto p-8 pt-6">
            {activeId === 'leaveApplication' ? (
              <InnerLeaveApplicationPage/>
            ) : (
              <SpecialLeaveApplicationPage/>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}