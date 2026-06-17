"use client"

import { useState, useEffect } from "react"
import BigPopupWrapper from "@repo/ui/components/popupwrapper/big-popup-wrapper"
import Table from "@repo/ui/components/table-dynamic/data-table"
import { Calendar, Users, Clock, FileText } from "lucide-react"
import { cn } from "@repo/ui/utils/shadcnui/cn"

interface DayDetailsPopupProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  dayData: any[]
}

export default function DayDetailsPopup({
  isOpen,
  onClose,
  selectedDate,
  dayData
}: DayDetailsPopupProps) {
  const [open, setOpen] = useState(isOpen)
  const [activeTab, setActiveTab] = useState("all")

  // Tab configuration
  const tabs = [
    { id: "all", label: "All Records", value: "all" },
    { id: "punch-in", label: "Punch In", value: "punch-in" },
    { id: "punch-out", label: "Punch Out", value: "punch-out" },
    { id: "punch-miss", label: "Punch Miss", value: "punch-miss" },
  ]

  // Filter data based on active tab
  const filteredData = activeTab === "all" 
    ? dayData 
    : dayData.filter(item => item.type === activeTab)

  // Update local state when prop changes
  useEffect(() => {
    setOpen(isOpen)
  }, [isOpen])

  const handleClose = () => {
    setOpen(false)
    setActiveTab("all") // Reset to default tab
    onClose()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

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
        status: true,
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
        function: () => {},
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
        status: false,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: (item: any) => {},
      },
      actionEdit: {
        label: "Edit",
        status: false,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: (id: string) => {},
      },
    },
  }

  return (
    <BigPopupWrapper
      open={open}
      setOpen={handleClose}
      content={{
        title: selectedDate ? `Attendance Details - ${formatDate(selectedDate)}` : "Attendance Details",
        description: "View detailed punch records for the selected date"
      }}
    >
      <div className="flex flex-col w-full h-full">
        {/* Header Section */}
        <div className="px-6 pt-6 pb-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedDate ? `Attendance Details - ${formatDate(selectedDate)}` : "Attendance Details"}
          </h2>
        </div>

        {/* Tabs Section */}
        <div className="px-6 pt-4">
          <div className="mb-2 border-b border-[#eef2f6]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium transition-colors",
                  activeTab === tab.value
                    ? "border-b-2 border-[#0061ff] font-semibold"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Section */}
        <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
          <div className="bg-white border border-gray-200 rounded-lg">
            <Table functionalityList={functionalityList} data={filteredData} />
          </div>
        </div>
      </div>
    </BigPopupWrapper>
  )
} 