"use client"

import { useState } from "react";
import PunchCalendar from "../_components/punch-calendar";
import FileManagerHeader from "../individual-punch/table/[...table]/_components/file-manager-header";
import PunchFormPopup from "../_components/punch-form-popup";
import PunchRequestsPopup from "../_components/punch-requests-popup";

export default function Home() {
  const [isPunchFormOpen, setIsPunchFormOpen] = useState(false);
  const [isPunchRequestsPopupOpen, setIsPunchRequestsPopupOpen] = useState(false);

  const handlePunchApplication = () => {
    setIsPunchFormOpen(true)
  }

  const handleRequestPunch = () => {
    setIsPunchRequestsPopupOpen(true)
  }

  const handleDownloadPDF = () => {
  }

  const handlePunchFormSubmit = (data: any) => {
    setIsPunchFormOpen(false)
  }

  // Mock punchRequests data (replace with real data as needed)
  const punchRequests: any[] = [
    {
      id: '1',
      type: "in" as "in",
      requestedTime: new Date('2024-01-14T09:15:00'),
      reason: 'Forgot to punch in due to urgent meeting',
      status: 'pending',
      submittedAt: new Date('2024-01-14T10:00:00'),
    },
    {
      id: '2',
      type: "out" as "out",
      requestedTime: new Date('2024-01-13T18:00:00'),
      reason: 'System was down during punch out',
      status: 'approved',
      submittedAt: new Date('2024-01-13T19:00:00'),
    },
    // ...add more mock requests as needed...
  ]

  return (
    <div className="flex flex-col w-full px-12 h-full py-4">
      

      {/* File Manager Header */}
      <FileManagerHeader 
        title="All Employees - Attendance Records"
        description="View and manage punch records for all employees in the organization"
        onPunchApplication={handlePunchApplication}
        onRequestPunch={handleRequestPunch}
        onDownloadPDF={handleDownloadPDF}
      />

      {/* Calendar Component */}
      <div className="flex-1">
        <PunchCalendar />
      </div>

      {/* Punch Form Popup */}
      <PunchFormPopup
        isOpen={isPunchFormOpen}
        onClose={() => setIsPunchFormOpen(false)}
        onSubmit={handlePunchFormSubmit}
        refetch={()=>{}}
      />

      {/* Punch Requests Popup */}
      <PunchRequestsPopup
        isOpen={isPunchRequestsPopupOpen}
        onClose={() => setIsPunchRequestsPopupOpen(false)}
      />
    </div>
  );
}
