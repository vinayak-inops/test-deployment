"use client"
import Table from "@repo/ui/components/table-dynamic/data-table";
import { useRouter } from "next/navigation";
import FileManagerHeader from "../../individual-punch/table/[...table]/_components/file-manager-header";
import PunchFormPopup from "../../_components/punch-form-popup";
import PunchRequestsPopup from '../../_components/punch-requests-popup';
import { useState } from "react";

function FileManager() {
    const router = useRouter();
    const [isPunchFormOpen, setIsPunchFormOpen] = useState(false);
    const [isPunchRequestsPopupOpen, setIsPunchRequestsPopupOpen] = useState(false);
  const data = [
    {
      employeeId: "EMP1001",
      name: "Alice Johnson",
      date: "2025-07-03",
      type: "punch_in",
      timestamp: "2025-07-03T08:55:00",
      location: "Office - Bangalore",
      device: "Web Portal",
      notes: "On time",
      totalHoursWorked: "09:00",
      status: "Present",
    },
    {
      employeeId: "EMP1002",
      name: "Bob Smith",
      date: "2025-07-03",
      type: "punch_out",
      timestamp: "2025-07-03T17:45:00",
      location: "Remote",
      device: "Mobile App",
      notes: "Remote work day",
      totalHoursWorked: "08:15",
      status: "Present",
    },
    {
      employeeId: "EMP1003",
      name: "Catherine Lee",
      date: "2025-07-03",
      type: "punch_in",
      timestamp: "2025-07-03T09:30:00",
      location: "Office - Mumbai",
      device: "Biometric",
      notes: "Late arrival",
      totalHoursWorked: "07:45",
      status: "Late",
    },
    {
      employeeId: "EMP1004",
      name: "David Kim",
      date: "2025-07-03",
      type: "punch_out",
      timestamp: "2025-07-03T18:10:00",
      location: "Office - Bangalore",
      device: "Web Portal",
      notes: "Overtime",
      totalHoursWorked: "09:30",
      status: "Present",
    },
    {
      employeeId: "EMP1005",
      name: "Emily Davis",
      date: "2025-07-03",
      type: "punch_in",
      timestamp: "2025-07-03T08:40:00",
      location: "Remote",
      device: "Mobile App",
      notes: "Early start",
      totalHoursWorked: "08:50",
      status: "Present",
    },
    {
      employeeId: "EMP1006",
      name: "Frank Thomas",
      date: "2025-07-03",
      type: "punch_out",
      timestamp: "2025-07-03T18:00:00",
      location: "Office - Chennai",
      device: "Biometric",
      notes: "Regular shift",
      totalHoursWorked: "08:30",
      status: "Present",
    },
    {
      employeeId: "EMP1007",
      name: "Grace Miller",
      date: "2025-07-03",
      type: "punch_in",
      timestamp: "2025-07-03T09:10:00",
      location: "Office - Bangalore",
      device: "Web Portal",
      notes: "Traffic delay",
      totalHoursWorked: "08:10",
      status: "Late",
    },
    {
      employeeId: "EMP1008",
      name: "Henry Brown",
      date: "2025-07-03",
      type: "punch_out",
      timestamp: "2025-07-03T17:30:00",
      location: "Remote",
      device: "Mobile App",
      notes: "Half-day leave",
      totalHoursWorked: "04:00",
      status: "Half Day",
    },
    {
      employeeId: "EMP1009",
      name: "Isabella Wilson",
      date: "2025-07-03",
      type: "punch_in",
      timestamp: "2025-07-03T08:50:00",
      location: "Office - Hyderabad",
      device: "Biometric",
      notes: "Shift start",
      totalHoursWorked: "08:45",
      status: "Present",
    },
    {
      employeeId: "EMP1010",
      name: "Jake Martinez",
      date: "2025-07-03",
      type: "punch_out",
      timestamp: "2025-07-03T19:00:00",
      location: "Office - Bangalore",
      device: "Web Portal",
      notes: "Stayed late for meeting",
      totalHoursWorked: "09:45",
      status: "Present",
    },
  ];

  const functionalityList = {
    tabletype: {
      type: "data",
      classvalue: {
        container: "col-span-12 mb-2",
        tableheder: {
          container: "bg-[#f8fafc]",
        },
        label: "text-gray-600",
        field: "p-1",
      },
    },
    columnfunctionality: {
      draggable: {
        status: true,
      },
      handleRenameColumn: {
        status: true,
      },
      slNumber: {
        status: true,
      },
      selectCheck: {
        status: false,
      },
      activeColumn: {
        status: false,
      },
    },
    textfunctionality: {
      expandedCells: {
        status: true,
      },
    },
    filterfunctionality: {
      handleSortAsc: {
        status: true,
      },
      handleSortDesc: {
        status: true,
      },
      search: {
        status: true,
      },
    },
    outsidetablefunctionality: {
      paginationControls: {
        status: true,
        start: "",
        end: "",
      },
      entriesPerPageSelector: {
        status: false,
      },
    },
    buttons: {
      save: {
        label: "Save",
        status: false,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: () => {},
      },
      submit: {
        label: "Submit",
        status: false,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: () => {},
      },
      addnew: {
        label: "Add New",
        status: false,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: () => router.push("/leave-policy/create-leave-policy"),
      },
      cancel: {
        label: "Cancel",
        status: false,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: () => {},
      },
      actionDelete: {
        label: "Delete",
        status: false,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: (id: string) => {},
      },
      actionLink: {
        label: "link",
        status: true,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: (item: any) => {
          router.push(`/excel-file-manager/upload-statues/${item?.like}`);
        },
      },
      actionEdit: {
        label: "Edit",
        status: true,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: (id: string) => {},
      },
    },
  };

  const handleUpload = () => {
  }

  const handleDownloadPDF = () => {
  }

  const handlePunchApplication = () => {
    setIsPunchFormOpen(true)
  }

  const handleRequestPunch = () => {
    setIsPunchRequestsPopupOpen(true)
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
    <>
      <div className="bg-white border border-gray-200 shadow-xl rounded-xl">
        <div className="p-6 pb-0 border-b border-gray-200"> 
        <FileManagerHeader 
          title={`Today's Punch Records - ${new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}`}
          description="View and manage today's punch records for all employees"
          onPunchApplication={handlePunchApplication}
          onRequestPunch={handleRequestPunch}
          onDownloadPDF={handleDownloadPDF}
          showSimpleTasks={true}
        /> 
        </div>
        <Table functionalityList={functionalityList} data={data} />
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
    </>
  );
}

export default FileManager;
