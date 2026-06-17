"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Filter, Download, Users, UserCheck, Clock, TrendingUp, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Input } from "@repo/ui/components/ui/input"
import ValueFilterSection from "./value-filter-section"
import MusterSearchPopup from "./muster-search-popup"
import { fetchDynamicQuery } from '@repo/ui/hooks/api/dynamic-graphql'
import { useRouter } from "next/navigation"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"
import useCurrentDomain from "@/hooks/api/useCurrentDomain";

// Interface for employee data from GraphQL
interface Employee {
  _id: string
  organizationCode: string
  contractorCode: string
  tenantCode: string
  employeeID: string
  firstName: string
  middleName?: string
  lastName: string
  aadharNumber?: string
  UANNumber?: string
  ESINumber?: string
  PFNumber?: string
}

// Interface for transformed employee data
interface TransformedEmployee {
  id: string
  name: string
  title: string
  status: string
  avatar: string
  aadhar: string
  uan: string
  esi: string
  pf: string
  _id: string
}

const stats = [
  { title: "Total Employees", value: "156", icon: Users, color: "blue" },
  { title: "Active Employees", value: "142", icon: UserCheck, color: "green" },
  { title: "On Leave", value: "8", icon: Clock, color: "yellow" },
  { title: "New Hires (30d)", value: "12", icon: TrendingUp, color: "purple" },
]

export default function Component() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMusterSearchPopup, setShowMusterSearchPopup] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const tenantCode = useGetTenantCode();
  const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()

  // Fetch employees using GraphQL
  const fetchEmployees = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const employeeFields = {
        fields: [
          '_id',
          'organizationCode',
          'contractorCode',
          'tenantCode',
          'employeeID',
          'firstName',
          'aadharNumber',
          'UANNumber',
          'ESINumber',
          'PFNumber'
        ]
      };

      const result = await fetchDynamicQuery(
        employeeFields,
        'contract_employee',
        'FetchAllEmployees',
        'fetchAllEmployees',
        {
          collection: 'contract_employee',
          tenantCode: tenantCode
        }
      )

      if (result?.data && Array.isArray(result.data)) {
        const fetchedEmployees = result.data
        setEmployees(fetchedEmployees)
      } else {
        console.error("No employee data found in response:", result)
        setError("No employee data found")
      }
    } catch (err) {
      setError("Failed to fetch employees")
    } finally {
      setLoading(false)
    }
  }

  // Fetch employees when component mounts or popup opens
  useEffect(() => {
    fetchEmployees()
  }, [ tenantCode])

  // Transform GraphQL data to match the component's expected format
  const transformedEmployees: TransformedEmployee[] = employees.map(emp => ({
    id: emp.employeeID || 'N/A',
    name: `${emp.firstName || ''} ${emp.middleName || ''} ${emp.lastName || ''}`.trim() || 'Unknown Name',
    title: `${emp.organizationCode || 'N/A'} - ${emp.contractorCode || 'N/A'}`,
    status: "Active",
    avatar: `${(emp.firstName || 'U').charAt(0)}${(emp.lastName || 'N').charAt(0)}`,
    aadhar: emp.aadharNumber || "N/A",
    uan: emp.UANNumber || "N/A",
    esi: emp.ESINumber || "N/A",
    pf: emp.PFNumber || "N/A",
    _id: emp._id || ""
  }))

  // Filter employees based on search term
  const filteredEmployees = transformedEmployees.filter(employee => 
    employee.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleMusterPunch = (employeeId: string) => {
    setSelectedEmployeeId(employeeId)
    setShowMusterSearchPopup(true)
  }

  const closeMusterSearchPopup = () => {
    setShowMusterSearchPopup(false)
    setSelectedEmployeeId("")
  }

  // Handle search from ValueFilterSection
  const handleSearch = (searchValue: string) => {
    setSearchTerm(searchValue)
  }

  // Handle muster punch from header button
  const handleHeaderMusterPunch = () => {
    setSelectedEmployeeId("") // No pre-selected employee for header button
    setShowMusterSearchPopup(true)
  }

  return (
    <div className="px-7">
      <div className="py-0">
        {/* Search and Filters */}
        <Card className="border-0 shadow-blue-50 mb-0">
          <div className="py-6 px-6">
            <ValueFilterSection onSearch={handleSearch} onMusterPunch={handleHeaderMusterPunch} />
          </div>
          
          <CardContent className="pt-0">
            {/* Loading and Error States */}
            {loading && (
              <div className="text-center py-4">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading employees...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">Error: {error}</p>
                <Button onClick={fetchEmployees} className="bg-blue-600 hover:bg-blue-700">
                  Retry
                </Button>
              </div>
            )}

            {/* Employee Grid */}
            {!loading && !error && filteredEmployees.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((employee) => (
                  <Card
                    key={employee.id}
                    className="group border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <CardContent className="p-6">
                      {/* Employee Header */}
                      <div className="flex items-center space-x-4 mb-5">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-xl transition-shadow">
                            {employee.avatar}
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">{employee.name}</h3>
                          <p className="text-blue-600 text-sm font-medium truncate">{employee.title}</p>
                          <p className="text-gray-500 text-xs mt-1 font-mono px-2 py-1 rounded">ID: {employee.id}</p>
                        </div>
                        <Badge className="bg-green-50 text-green-700 border-green-200 text-xs font-medium px-2 py-1">
                          {employee.status}
                        </Badge>
                      </div>

                      {/* Employee Details - Simplified */}
                      <div className="space-y-3 mb-6">
                        {employee.aadhar !== "N/A" && (
                          <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-600 font-medium">Aadhar</span>
                            <span className="font-mono text-gray-900 text-xs">{employee.aadhar}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 text-sm h-10 transition-colors"
                          onClick={() => router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/master/contractor-employee?mode=view&id=${employee._id}`)}
                        >
                          <Search className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm h-10 shadow-md hover:shadow-lg transition-all duration-200"
                          onClick={() => handleMusterPunch(employee.id)}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Records
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* No Data State */}
            {!loading && !error && filteredEmployees.length === 0 && searchTerm && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No employees found</p>
                <p className="text-gray-500 text-sm mb-4">Try adjusting your search terms</p>
                <Button onClick={() => setSearchTerm("")} className="bg-blue-600 hover:bg-blue-700">
                  Clear Search
                </Button>
              </div>
            )}

            {/* No Data State - No Search */}
            {!loading && !error && filteredEmployees.length === 0 && !searchTerm && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No employees found</p>
                <Button onClick={fetchEmployees} className="bg-blue-600 hover:bg-blue-700">
                  Refresh
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Muster Search Popup */}
      <MusterSearchPopup
        isOpen={showMusterSearchPopup}
        onClose={closeMusterSearchPopup}
        preSelectedEmployeeId={selectedEmployeeId}
      />
    </div>
  )
}
