"use client"
import { useRef, useState } from "react"
import { Search, Users, Plus, Clock, Filter, ListChecks, ClipboardList, CheckCircle, X } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import ShiftZoneForm from "../../../_components/shift-zone-form"
import ShiftForm from "./shift-form"

// Component for shift list box filter with permission support
export default function ShiftListBoxFilter({
  shiftGroupCode = "",
  shiftGroupName = "",
  shiftData,
  existingShiftGroupCodes = [],
  existingShiftGroupNames = [],
  refetchShiftData,
  searchTerm,
  setSearchTerm,
  filteredShifts,
  permission,
}: {
  shiftGroupCode: string;
  shiftGroupName: string;
  shiftData: any;
  existingShiftGroupCodes: string[];
  existingShiftGroupNames: string[];
  refetchShiftData?: () => void;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  filteredShifts: any[];
  permission: any;
}) {
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false)
  const [isShiftZoneFormOpen, setIsShiftZoneFormOpen] = useState(false)
  const [isShiftFormOpen, setIsShiftFormOpen] = useState(false)
  const taskBtnRef = useRef<HTMLButtonElement>(null)
  // Remove subsidiary filter state and logic
  // const [selectedSubsidiaryName, setSelectedSubsidiaryName] = useState<string>("");
  // const subsidiaryNames: string[] = useMemo(() => { ... });

  // Add state for search
  // const [searchTerm, setSearchTerm] = useState("");

  // Filter shifts by search term (shiftName)
  // const filteredShifts = useMemo(() => {
  //   if (!shiftData?.shift) return [];
  //   if (!searchTerm) return shiftData.shift;
  //   return shiftData.shift.filter(
  //     (s: any) =>
  //       s.shiftName &&
  //       s.shiftName.toLowerCase().includes(searchTerm.toLowerCase())
  //   );
  // }, [shiftData, searchTerm]);

  // Dropdown positioning (absolute below button)
  // For simplicity, use fixed right/top for now, or you can use a popper library for better placement

  // Close dropdown on outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsTaskDropdownOpen(false)
    }
  }


  const handleAddNewShift = () => {
    setIsShiftFormOpen(true);
    setIsTaskDropdownOpen(false);
  };
  const handleShiftSubmit = () => {
    refetchShiftData?.();
    setIsShiftFormOpen(false);
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50/30 ">
      {/* Loading overlay for post request */}
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-lg rounded-xl">
        <div className=" px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Left Section - Title and Description */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {shiftGroupCode} - {shiftGroupName}
                </h1>
                <p className="text-gray-600 font-medium">Manage employee shifts and schedules efficiently</p>
              </div>
              {/* Remove subsidiary filter dropdown */}
            </div>

            {/* Right Section - Search and Actions */}
            <div className="flex items-center space-x-4">
              {/* Enhanced Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  type="text"
                  placeholder="Search shifts, employees, departments..."
                  className="pl-12 pr-4 py-3 w-80 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Active Shifts Button */}
              <Button
                variant="outline"
                className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md"
              >
                <Users className="w-4 h-4" />
                <span className="font-medium">Active Shifts</span>
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">{filteredShifts.length}</span>
              </Button>

              {/* Task Management Button */}
              <div className="relative">
                <Button
                  ref={taskBtnRef}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  onClick={() => setIsTaskDropdownOpen((v) => !v)}
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span className="font-semibold text-white">Task Management</span>
                </Button>
                {/* Dropdown */}
                {isTaskDropdownOpen && (
                  <div className="fixed inset-0 z-[150]" onClick={handleBackdropClick}>
                    <div
                      className="absolute z-[999] right-4 top-32 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"

                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Dropdown Header */}
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold">Manage Tasks</h2>
                        <button
                          onClick={() => setIsTaskDropdownOpen(false)}
                          className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      {/* Dropdown Content */}
                      <div className="p-4 ">
                        <div className="space-y-2">
                          {/* Example Task Management Menu Items */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                              <span>TASKS</span>
                              <ListChecks className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                              {/* Add New Shift */}
                              {
                                permission.addMode && (
                                  <div
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                                    onClick={handleAddNewShift}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <Plus className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                        Add New Shift
                                      </span>
                                    </div>
                                    <button className="w-5 h-5 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                )
                              }
                              {/* Update Shift Zone */}
                              {/* <div
                                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                                  onClick={() => {
                                    setIsShiftZoneFormOpen(true)
                                    setIsTaskDropdownOpen(false)
                                  }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <Filter className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                      Update Shift Zone
                                    </span>
                                  </div>
                                  <button className="w-5 h-5 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div> */}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Dropdown Footer */}
                      <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm">
                          Quick Actions
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ShiftZoneForm Popup for editing */}
      {isShiftZoneFormOpen && (

        <ShiftZoneForm
          isOpen={isShiftZoneFormOpen}
          onClose={() => setIsShiftZoneFormOpen(false)}
          onSubmit={() => setIsShiftZoneFormOpen(false)}
          initialData={shiftData}
          isEdit={true}
          existingShiftGroupCodes={existingShiftGroupCodes}
          existingShiftGroupNames={existingShiftGroupNames}
        />
      )}

      {/* ShiftForm Popup for adding new shifts */}
      <ShiftForm
        isOpen={isShiftFormOpen}
        onClose={() => setIsShiftFormOpen(false)}
        initialValues={{}}
        onSubmit={handleShiftSubmit}
        shiftData={shiftData}
      />
    </div>
  )
}
