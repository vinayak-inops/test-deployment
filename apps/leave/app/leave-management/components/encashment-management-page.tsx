"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Calendar, Wallet, FileText, TrendingUp, AlertCircle, Loader2, ChevronDown } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Input } from "@repo/ui/components/ui/input"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/components/ui/dialog"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useMessage } from "../../../hooks/useMessage";
import { useEncashment } from "../../../hooks/useEncashment";
import { useDynamicQuery } from '@repo/ui/hooks/api/dynamic-graphql';
import { usePostRequest } from '@repo/ui/hooks/api/usePostRequest';
import { useSession } from 'next-auth/react';
import { useRequest } from '@repo/ui/hooks/api/useGetRequest';
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

interface EncashmentManagementPageProps {
  onBack: () => void
}

// API Response Types
interface LeaveCodeData {
  leaveCode: string
  leaveTitle: string
  encashmentAllowed: boolean
  maxEncashmentPerYear: number
  minimumBalanceRequired: number
  maximumAllowedEncashment: number
  maximumEncashmentPerApplication: number

}

interface ApiResponse {
  leaveCodes: LeaveCodeData[]
}

// Transformed data type for component display
interface TransformedLeaveCodeData {
  code: string
  type: string
  leaveCodeWithTitle: string // Combined format like "CL-Casual Leave"
  encashmentAllowed: boolean
  maxEncashmentPerYear: number
  minimumBalanceRequired: number
  maximumAllowedEncashment: number
  maximumEncashmentPerApplication: number
  // Removed: active: boolean
}

// Custom Dropdown Component to avoid aria-hidden conflicts
interface CustomDropdownProps {
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  options: Array<{ code: string; leaveCodeWithTitle: string }>
  disabled?: boolean
}

function CustomDropdown({ value, onValueChange, placeholder, options, disabled = false }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { tenantCode } = useGetTenantCode()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(option => option.code === value)

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
          {selectedOption ? selectedOption.leaveCodeWithTitle : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => {
                onValueChange(option.code)
                setIsOpen(false)
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
            >
              {option.leaveCodeWithTitle}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function EncashmentManagementPage({ onBack }: EncashmentManagementPageProps) {
  const [selectedRuleLeaveType, setSelectedRuleLeaveType] = useState("")
  const [selectedEncashmentLeaveType, setSelectedEncashmentLeaveType] = useState("")
  const [isNewEncashmentOpen, setIsNewEncashmentOpen] = useState(false)
  const [newEncashmentForm, setNewEncashmentForm] = useState({
    leaveCode: "",
    numberOfDays: "",
    reason: ""
  })
  const  tenantCode  = useGetTenantCode()

  const { showMessage } = useMessage();

  // Define the GraphQL query fields for leave policies
  const leavePolicyFields = [
    'leavePolicy {',
    '  leaveCode',
    '  leaveTitle',
    '  encashment {',
    '    encashmentAllowed',
    '    minimumBalanceRequired',
    '    maximumAllowedEncashment',
    '    maximumApplicationAllowedYearly',
    '    maximumEncashmentPerApplication',
    '  }',
    '}'
  ];

  // Use the useDynamicQuery hook for fetching leave codes
  const {
    data: leaveCodesData,
    loading: leaveCodesLoading,
    error: leaveCodesError
  } = useDynamicQuery(
    { fields: leavePolicyFields },
    'leave_policy',
    'FetchAllLeavePolicy',
    'fetchAllLeavePolicy'
  );

  // Transform API data to component format
  const transformApiData = (apiData: any[]): TransformedLeaveCodeData[] => {
    if (!apiData || !Array.isArray(apiData)) return [];
    
    return apiData
      .filter((item: any) => item.leavePolicy) // Only include items with leavePolicy
      .map((item: any) => {
        const leavePolicy = item.leavePolicy;
        const encashment = leavePolicy.encashment || {};
        
        return {
          code: leavePolicy.leaveCode,
          type: leavePolicy.leaveTitle || leavePolicy.leaveCode,
          leaveCodeWithTitle: `${leavePolicy.leaveCode}-${leavePolicy.leaveTitle || leavePolicy.leaveCode}`,
          encashmentAllowed: encashment.encashmentAllowed ?? true,
          maxEncashmentPerYear: encashment.maximumApplicationAllowedYearly ?? 15,
          minimumBalanceRequired: encashment.minimumBalanceRequired ?? 0,
          maximumAllowedEncashment: encashment.maximumAllowedEncashment ?? 0,
          maximumEncashmentPerApplication: encashment.maximumEncashmentPerApplication ?? 0,
        };
      })
      .filter((leaveCode) => leaveCode.encashmentAllowed); // Only include if encashmentAllowed is true
  };

  // Transform the data from the hook
  const leaveCodes = transformApiData(leaveCodesData);

  // Available leave balances for encashment - derived from leave codes
  const availableBalances = leaveCodes.map((leaveCode) => ({
    type: leaveCode.type,
    code: leaveCode.code,
    available: leaveCode.encashmentAllowed ? 15.5 : 0, // Mock data - should come from actual balance API
    encashable: leaveCode.encashmentAllowed ? 10.5 : 0, // Mock data - should come from actual balance API
    minRetain: leaveCode.encashmentAllowed ? 5 : 0, // Mock data - should come from actual balance API
    color: leaveCode.encashmentAllowed ? "bg-blue-500" : "bg-gray-500",
    note: leaveCode.encashmentAllowed ? undefined : "Not eligible for encashment",
  }))

  const { data: session } = useSession();

  // Fetch encashment data using useRequest hook
  const {
    data: encashmentResponse,
    loading: encashmentLoading,
    error: encashmentError,
    refetch: refetchEncashment
  } = useRequest<any>({
    url: 'leaveEncashmentApplication/search',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
    ],
    onSuccess: (data: any) => {
    },
    onError: (error: Error) => {
      console.error("Error fetching encashment data:", error);
    },
    dependencies: []
  });

  // Use the encashment hook with the fetched data
  const {
    encashmentData,
    loading: encashmentProcessingLoading,
    error: encashmentProcessingError,
    lastUpdated,
    refetch: refetchEncashmentProcessing
  } = useEncashment(encashmentResponse);

  const encashmentRules = [
    { rule: "Total encashment allowed", value: "25 days" },
    { rule: "Max encashment per year via application", value: "15 days" },
    { rule: "Max per application", value: "4 days" },
    { rule: "Minimum balance to encash", value: "10 days" },
  ]

  // Get encashment rules for selected leave code
  const getEncashmentRulesForLeaveCode = (leaveCode: string) => {
    const selectedCode = leaveCodes.find(code => code.code === leaveCode)
    if (!selectedCode) return encashmentRules

    return [
      { rule: "Encashment Allowed", value: selectedCode.encashmentAllowed ? "Yes" : "No" },
      { rule: "Max Encashment Per Year", value: `${selectedCode.maxEncashmentPerYear} days` },
      { rule: "Max Encashment Per Application", value: `${selectedCode.maximumEncashmentPerApplication} days` },
      { rule: "Minimum Balance Required", value: `${selectedCode.minimumBalanceRequired} days` },
      { rule: "Maximum Allowed Encashment", value: `${selectedCode.maximumAllowedEncashment} days` },
    ]
  }

  const {
    post,
    loading: postLoading,
    error: postError,
    data: postData
  } = usePostRequest<any>({
    url: "leaveEncashmentApplication",
    onSuccess: (data) => {
      showMessage("Encashment request submitted successfully!", 'success');
      setIsNewEncashmentOpen(false);
      setNewEncashmentForm({
        leaveCode: "",
        numberOfDays: "",
        reason: ""
      });
    },
    onError: (error) => {
      console.error("Encashment request submission failed:", error);
      let errorMessage = "Failed to submit encashment request. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "Network error: Unable to connect to the server. Please check your internet connection.";
        } else if (error.message.includes('CORS')) {
          errorMessage = "CORS error: The server is not allowing requests from this origin.";
        } else if (error.message.includes('401')) {
          errorMessage = "Authentication error: Your session may have expired. Please log in again.";
        } else if (error.message.includes('403')) {
          errorMessage = "Authorization error: You don't have permission to perform this action.";
        } else if (error.message.includes('500')) {
          errorMessage = "Server error: The server encountered an internal error. Please try again later.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      showMessage(errorMessage, 'error');
    },
  });

  const handleNewEncashmentSubmit = async () => {
    // Validate form
    if (!newEncashmentForm.leaveCode || !newEncashmentForm.numberOfDays || !newEncashmentForm.reason) {
      showMessage("Please fill in all required fields", 'error');
      return;
    }

    // Validate number of days
    const days = parseFloat(newEncashmentForm.numberOfDays);
    if (isNaN(days) || days <= 0 || days > 15) {
      showMessage("Number of days must be between 0.5 and 15", 'error');
      return;
    }

    // Get the selected leave code details for additional validation
    const selectedLeaveCode = leaveCodes.find(code => code.code === newEncashmentForm.leaveCode);
    if (selectedLeaveCode && !selectedLeaveCode.encashmentAllowed) {
      showMessage("This leave type is not eligible for encashment", 'error');
      return;
    }

    // Construct the payload for encashment application
    const payload = {
      tenant: tenantCode, // TODO: Replace with actual tenant if available
      action: "insert",
      collectionName: "leaveEncashmentApplication",
      id: "",
      event: "application",
      data: {
        tenantCode: tenantCode, // TODO: Replace with actual tenant code
        workflowName: "leaveEncashment Application", // TODO: Replace with actual workflow name if needed
        stateEvent: "NEXT",
        uploadedBy: session?.user?.name || "user",
        createdOn: new Date().toISOString(),
        employeeID: "EMP001",
        leaveCode: newEncashmentForm.leaveCode,
        balance: parseFloat(newEncashmentForm.numberOfDays),
        uploadTime: new Date().toISOString().slice(0, 19).replace('T', 'T') + ".000+00:00", // Today's date in the same format
        organizationCode: tenantCode,
        appliedDate: new Date().toISOString().slice(0, 19).replace('T', 'T') + ".000+00:00", // Today's date in the same format
        workflowState: "INITIATED",
        remarks: newEncashmentForm.reason
      }
    };

    try {
      // Submit the request using the hook - success and error are handled by callbacks
      await post(payload);
    } catch (error) {
      console.error("Submission failed:", error);
      showMessage(`Failed to submit encashment request: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleNewEncashmentCancel = () => {
    setIsNewEncashmentOpen(false)
    // Reset form
    setNewEncashmentForm({
      leaveCode: "",
      numberOfDays: "",
      reason: ""
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6" style={{ width: '1200px', margin: '0 auto' }}>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Encashment Management
              </h1>
              <p className="text-gray-600 mt-1 text-base">Prajwal N</p>
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
            onClick={() => setIsNewEncashmentOpen(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            New Encashment
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium">Total Encashable</p>
                  <p className="text-2xl font-bold">10.5 Days</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs font-medium">This Year Encashed</p>
                  <p className="text-2xl font-bold">8 Days</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs font-medium">Pending Requests</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
                <FileText className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Balances */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-8">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">Available Leave Balances</CardTitle>
                <CardDescription className="text-sm text-gray-600">Current leave balances and encashment eligibility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="font-semibold text-gray-700 text-sm">Leave Type</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm">Available</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm">Encashable</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm">Min Retain</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableBalances.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500">No leave balances available.</TableCell>
                        </TableRow>
                      ) : (
                        availableBalances.map((balance) => (
                          <TableRow key={balance.code}>
                            <TableCell className="font-medium text-gray-900 text-sm">{balance.type}</TableCell>
                            <TableCell className="text-gray-700 text-sm">{balance.available}</TableCell>
                            <TableCell className="text-gray-700 text-sm">{balance.encashable}</TableCell>
                            <TableCell className="text-gray-700 text-sm">{balance.minRetain}</TableCell>
                            <TableCell className="text-gray-700 text-sm">
                              {balance.encashable > 0 ? (
                                <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs">Eligible</span>
                              ) : (
                                <span className="px-2 py-1 rounded bg-gray-100 text-gray-500 text-xs">Not eligible</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Encashment History */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">Encashment History</CardTitle>
                <CardDescription className="text-sm text-gray-600">Your previous encashment requests and payments</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="font-semibold text-gray-700 text-sm">Request Date</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm">Leave Type</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm">Days</TableHead>
                        {/* Removed Status column */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {encashmentLoading || encashmentProcessingLoading ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-gray-500">Loading encashment history...</TableCell>
                        </TableRow>
                      ) : encashmentError || encashmentProcessingError ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-red-500">Error loading encashment history</TableCell>
                        </TableRow>
                      ) : encashmentData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-gray-500">No encashment history found.</TableCell>
                        </TableRow>
                      ) : (
                        encashmentData.map((record) => (
                          <TableRow key={record._id} className="hover:bg-gray-50/50 transition-all duration-200">
                            <TableCell className="font-medium text-gray-900 text-sm">
                              {(() => {
                                const date = new Date(record.appliedDate);
                                const day = String(date.getDate()).padStart(2, '0');
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const year = date.getFullYear();
                                return `${day}-${month}-${year}`;
                              })()}
                            </TableCell>
                            <TableCell className="text-gray-700 text-sm">{record.leaveCode}</TableCell>
                            <TableCell className="text-gray-700 text-sm">{record.balance} days</TableCell>
                            {/* Removed Status cell */}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Encashment Rules */}
          <div>
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">Encashment Rules</CardTitle>
                <CardDescription className="text-sm text-gray-600">Important rules and guidelines</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Leave Code Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Leave Code</label>
                  {leaveCodesLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-gray-600">Loading leave codes...</span>
                    </div>
                  ) : leaveCodesError ? (
                    <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-md border border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700">Error loading leave codes</span>
                      <Button variant="outline" size="sm" onClick={() => {}} className="ml-auto">
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <CustomDropdown
                      value={selectedRuleLeaveType}
                      onValueChange={setSelectedRuleLeaveType}
                      placeholder="Choose leave code to view rules"
                      options={leaveCodes}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  {getEncashmentRulesForLeaveCode(selectedRuleLeaveType).map((rule, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-all duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">{rule.rule}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 bg-white px-3 py-1 rounded-md border border-gray-200">
                        {rule.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* New Encashment Dialog */}
      <Dialog open={isNewEncashmentOpen} onOpenChange={setIsNewEncashmentOpen}>
        <DialogContent className="sm:max-w-[500px]" >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">New Encashment Request</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Submit a new leave encashment request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Leave Code Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Leave Code *</label>
              {leaveCodesLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">Loading leave codes...</span>
                </div>
              ) : leaveCodesError ? (
                <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-md border border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">Error loading leave codes</span>
                  <Button variant="outline" size="sm" onClick={() => {}} className="ml-auto">
                    Retry
                  </Button>
                </div>
              ) : (
                <CustomDropdown
                  value={selectedEncashmentLeaveType}
                  onValueChange={(value) => {
                    setSelectedEncashmentLeaveType(value)
                    setNewEncashmentForm(prev => ({ ...prev, leaveCode: value }))
                  }}
                  placeholder="Choose leave code for encashment"
                  options={leaveCodes}
                />
              )}
            </div>

            {/* Number of Days */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Number of Days *</label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="15"
                placeholder="Enter number of days (e.g., 2.5)"
                value={newEncashmentForm.numberOfDays}
                onChange={(e) => setNewEncashmentForm(prev => ({ ...prev, numberOfDays: e.target.value }))}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Enter decimal values (e.g., 0.5, 1.5, 2.0)</p>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Reason *</label>
              <Textarea
                placeholder="Please provide a reason for encashment request..."
                value={newEncashmentForm.reason}
                onChange={(e) => setNewEncashmentForm(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full min-h-[100px] resize-none"
                rows={4}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleNewEncashmentCancel}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNewEncashmentSubmit}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              disabled={!newEncashmentForm.leaveCode || !newEncashmentForm.numberOfDays || !newEncashmentForm.reason || postLoading}
            >
              {postLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast Container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  )
}
