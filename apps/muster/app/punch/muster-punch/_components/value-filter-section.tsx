import { Search, Users, Plus, Clock, Filter } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { useState } from "react"

interface ValueFilterSectionProps {
  onSearch?: (searchValue: string) => void
  onMusterPunch?: () => void
}

export default function ValueFilterSection({ onSearch, onMusterPunch }: ValueFilterSectionProps) {
  const [searchValue, setSearchValue] = useState("")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    if (onSearch) {
      onSearch(value)
    }
  }

  const handleMusterPunch = () => {
    if (onMusterPunch) {
      onMusterPunch()
    }
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50/30 ">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-lg rounded-lg">
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
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Muster & Punch</h1>
                <p className="text-gray-600 font-medium">Manage attendance and time tracking efficiently</p>
              </div>
            </div>

            {/* Right Section - Search and Actions */}
            <div className="flex items-center space-x-4">
              {/* Enhanced Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  type="text"
                  placeholder="Search employees by ID or name..."
                  value={searchValue}
                  onChange={handleSearchChange}
                  className="pl-12 pr-4 py-3 w-80 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                />
              </div>

              {/* Filter Button */}
              <Button
                variant="outline"
                className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md"
              >
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filter</span>
              </Button>

              {/* Active Shifts Button */}
              {/* <Button
                variant="outline"
                className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md"
              >
                <Users className="w-4 h-4" />
                <span className="font-medium">Active Shifts</span>
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">8</span>
              </Button> */}

              {/* Create New Punch Button */}
              <Button 
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                onClick={handleMusterPunch}
              >
                <Plus className="w-4 h-4 text-white" />
                <span className="font-semibold text-white">Muster Punch</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
