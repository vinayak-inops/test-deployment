"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Switch } from "@repo/ui/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { Badge } from "@repo/ui/components/ui/badge"
import { Separator } from "@repo/ui/components/ui/separator"
import { Building2, Settings, Shield, Wallet, Clock, Save, ArrowLeft, BarChart3 } from "lucide-react"


export function LeaveManagementForm() {
  const [formData, setFormData] = useState({
    organizationCode: "",
    tenantCode: "tenant1",
    subsidiaryCode: "sub1",
    subsidiaryName: "Subsidiary-1",
    locationCode: "LOC001",
    locationName: "Location A",
    designationCode: "D001",
    designationName: "Manager",
    employeeCategory: ["WKM", "Cat2", "Cat3"],
    leaveCode: "ML",
    leaveTitle: "Maternity Leave",
    effectiveFrom: "2024-03-21",
    genderAllowed: "Female",
    maritalStatus: ["married", "un-married", "divorced"],
    minimumServicePeriodRequired: 6,
    maximumLeaveAllowed: 90,
    maximumApplicationAllowed: 1,
    minimumDaysPerApplication: 1,
    maximumDaysPerApplication: 90,
    halfDayAllowed: false,
    sandwichHolidayAsLeave: false,
    sandwichWeekOffAsLeave: false,
    canStartOrEndOnHoliday: false,
    canStartOrEndOnWeekOff: false,
    preApplicationDays: 15,
    maximumBackDaysApplicationAllowed: 90,
    maximumFutureDaysApplicationAllowed: 120,
    requireDocsIfLeaveDaysExceeds: 10,
    allowedInNoticePeriod: false,
    alertManagerAfterApproval: true,
    alertManagerDaysBeforeLeaveStart: 10,
    delegateApplicable: true,
    reminderFrequencyToApprover: 3,
    autoApprovalAllowed: true,
    autoApproveIfDateCrossed: false,
    daysForAutoApproval: 7,
    balanceValidation: true,
    allowedNegativeBalance: 10,
    minServicePeriodRequired: 120,
    lapseLeaveBalanceAtYearEnd: "30%",
    maximumBalanceAllowed: 120,
    accrualType: "monthly",
    dayId: 5,
    accrualDays: 1.5,
    workingDays: 24,
    accrualInAdvance: true,
    maximumBalanceCarriedForward: 15,
    encashmentAllowed: true,
    minimumBalanceRequired: 10,
    maximumAllowedEncashment: 25,
    autoEncashment: false,
    applicationRequired: true,
    maximumApplicationAllowedYearly: 15,
    maximumEncashmentPerApplication: 4,
    leaveType: "paid",
    leaveCategory: "Time away",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>HR Management</span>
        <span>/</span>
        <span>Leave Policies</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">New Policy</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="p-2 hover:bg-blue-50">
            <ArrowLeft className="w-4 h-4 text-blue-600" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Leave Policy</h2>
            <p className="text-gray-600">Configure a new leave policy for your organization</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="border-gray-300 hover:bg-gray-50 bg-transparent">
            Cancel
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg">
            <Save className="w-4 h-4 mr-2" />
            Save Policy
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="organization" className="w-full">
          {/* Clean Horizontal Tab Navigation */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6 shadow-sm">
            <TabsList className="w-full justify-start bg-transparent border-b border-gray-100 rounded-none p-0 h-auto">
              {[
                { value: "organization", label: "Organization", icon: Building2 },
                { value: "policy", label: "Policy Details", icon: Settings },
                { value: "rules", label: "Rules & Restrictions", icon: Shield },
                { value: "balance", label: "Balance Management", icon: Wallet },
                { value: "accrual", label: "Accrual Settings", icon: Clock },
                { value: "encashment", label: "Encashment", icon: BarChart3 },
              ].map((tab) => {
                const IconComponent = tab.icon
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex bg-white items-center space-x-3 px-6 py-4 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 text-gray-500 hover:text-gray-700 rounded-none font-medium transition-colors duration-200"
                  >
                    <IconComponent className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          <TabsContent value="organization" className="space-y-6">
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-2xl">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span>Organization Configuration</span>
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Set up the organizational hierarchy and employee categorization for this leave policy.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Organization Details */}
                {/* <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Organization Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="organizationCode" className="text-sm font-medium text-gray-700">
                        Organization Code *
                      </Label>
                      <Input
                        id="organizationCode"
                        value={formData.organizationCode}
                        onChange={(e) => setFormData({ ...formData, organizationCode: e.target.value })}
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                        placeholder="Enter organization code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenantCode" className="text-sm font-medium text-gray-700">
                        Tenant Code *
                      </Label>
                      <Input
                        id="tenantCode"
                        value={formData.tenantCode}
                        onChange={(e) => setFormData({ ...formData, tenantCode: e.target.value })}
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                        placeholder="Enter tenant code"
                      />
                    </div>
                  </div>
                </div>

                <Separator /> */}

                {/* Subsidiary Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Subsidiary Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="subsidiaryCode" className="text-sm font-medium text-gray-700">
                        Subsidiary Code *
                      </Label>
                      <Input
                        id="subsidiaryCode"
                        value={formData.subsidiaryCode}
                        onChange={(e) => setFormData({ ...formData, subsidiaryCode: e.target.value })}
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                        placeholder="Enter subsidiary code"
                      />
                    </div>
                    {/* <div className="space-y-2">
                      <Label htmlFor="subsidiaryName" className="text-sm font-medium text-gray-700">
                        Subsidiary Name *
                      </Label>
                      <Input
                        id="subsidiaryName"
                        value={formData.subsidiaryName}
                        onChange={(e) => setFormData({ ...formData, subsidiaryName: e.target.value })}
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                        placeholder="Enter subsidiary name"
                      />
                    </div> */}
                  </div>
                </div>

                <Separator />

                {/* Location & Designation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      Location Details
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="locationCode" className="text-sm font-medium text-gray-700">
                          Location Code *
                        </Label>
                        <Input
                          id="locationCode"
                          value={formData.locationCode}
                          onChange={(e) => setFormData({ ...formData, locationCode: e.target.value })}
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                          placeholder="Enter location code"
                        />
                      </div>
                      {/* <div className="space-y-2">
                        <Label htmlFor="locationName" className="text-sm font-medium text-gray-700">
                          Location Name *
                        </Label>
                        <Input
                          id="locationName"
                          value={formData.locationName}
                          onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                          placeholder="Enter location name"
                        />
                      </div> */}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      Designation Details
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="designationCode" className="text-sm font-medium text-gray-700">
                          Designation Code *
                        </Label>
                        <Input
                          id="designationCode"
                          value={formData.designationCode}
                          onChange={(e) => setFormData({ ...formData, designationCode: e.target.value })}
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                          placeholder="Enter designation code"
                        />
                      </div>
                      {/* <div className="space-y-2">
                        <Label htmlFor="designationName" className="text-sm font-medium text-gray-700">
                          Designation Name *
                        </Label>
                        <Input
                          id="designationName"
                          value={formData.designationName}
                          onChange={(e) => setFormData({ ...formData, designationName: e.target.value })}
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                          placeholder="Enter designation name"
                        />
                      </div> */}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Employee Categories */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Employee Categories
                  </h3>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Applicable Categories</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.employeeCategory.map((category, index) => (
                        <Badge
                          key={index}
                          className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 px-4 py-2 rounded-full font-medium"
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Add new category and press Enter"
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const value = (e.target as HTMLInputElement).value.trim()
                          if (value && !formData.employeeCategory.includes(value)) {
                            setFormData({
                              ...formData,
                              employeeCategory: [...formData.employeeCategory, value],
                            })
                            ;(e.target as HTMLInputElement).value = ""
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policy" className="space-y-6">
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-t-2xl">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Settings className="w-6 h-6" />
                  </div>
                  <span>Leave Policy Details</span>
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Configure the basic leave policy information and eligibility criteria.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="leaveCode" className="text-sm font-medium text-gray-700">
                        Leave Code *
                      </Label>
                      <Input
                        id="leaveCode"
                        value={formData.leaveCode}
                        onChange={(e) => setFormData({ ...formData, leaveCode: e.target.value })}
                        className="h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                        placeholder="e.g., ML, CL, SL"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leaveTitle" className="text-sm font-medium text-gray-700">
                        Leave Title *
                      </Label>
                      <Input
                        id="leaveTitle"
                        value={formData.leaveTitle}
                        onChange={(e) => setFormData({ ...formData, leaveTitle: e.target.value })}
                        className="h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                        placeholder="Enter leave title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="effectiveFrom" className="text-sm font-medium text-gray-700">
                        Effective From *
                      </Label>
                      <Input
                        id="effectiveFrom"
                        type="date"
                        value={formData.effectiveFrom}
                        onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                        className="h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Eligibility Criteria */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Eligibility Criteria
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="genderAllowed" className="text-sm font-medium text-gray-700">
                        Gender Allowed
                      </Label>
                      <Select
                        value={formData.genderAllowed}
                        onValueChange={(value) => setFormData({ ...formData, genderAllowed: value })}
                      >
                        <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leaveType" className="text-sm font-medium text-gray-700">
                        Leave Type
                      </Label>
                      <Select
                        value={formData.leaveType}
                        onValueChange={(value) => setFormData({ ...formData, leaveType: value })}
                      >
                        <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leaveCategory" className="text-sm font-medium text-gray-700">
                        Leave Category
                      </Label>
                      <Input
                        id="leaveCategory"
                        value={formData.leaveCategory}
                        onChange={(e) => setFormData({ ...formData, leaveCategory: e.target.value })}
                        className="h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                        placeholder="Enter category"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Marital Status Allowed</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.maritalStatus.map((status, index) => (
                        <Badge
                          key={index}
                          className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 px-4 py-2 rounded-full font-medium"
                        >
                          {status}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Leave Limits */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Leave Limits & Applications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="minimumServicePeriodRequired" className="text-sm font-medium text-gray-700">
                        Min Service Period (months)
                      </Label>
                      <Input
                        id="minimumServicePeriodRequired"
                        type="number"
                        value={formData.minimumServicePeriodRequired}
                        onChange={(e) =>
                          setFormData({ ...formData, minimumServicePeriodRequired: Number.parseInt(e.target.value) })
                        }
                        className="h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maximumLeaveAllowed" className="text-sm font-medium text-gray-700">
                        Max Leave Allowed (days)
                      </Label>
                      <Input
                        id="maximumLeaveAllowed"
                        type="number"
                        value={formData.maximumLeaveAllowed}
                        onChange={(e) =>
                          setFormData({ ...formData, maximumLeaveAllowed: Number.parseInt(e.target.value) })
                        }
                        className="h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minimumDaysPerApplication" className="text-sm font-medium text-gray-700">
                        Min Days Per Application
                      </Label>
                      <Input
                        id="minimumDaysPerApplication"
                        type="number"
                        value={formData.minimumDaysPerApplication}
                        onChange={(e) =>
                          setFormData({ ...formData, minimumDaysPerApplication: Number.parseInt(e.target.value) })
                        }
                        className="h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maximumDaysPerApplication" className="text-sm font-medium text-gray-700">
                        Max Days Per Application
                      </Label>
                      <Input
                        id="maximumDaysPerApplication"
                        type="number"
                        value={formData.maximumDaysPerApplication}
                        onChange={(e) =>
                          setFormData({ ...formData, maximumDaysPerApplication: Number.parseInt(e.target.value) })
                        }
                        className="h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                    <div className="space-y-1">
                      <Label htmlFor="halfDayAllowed" className="text-sm font-semibold text-gray-900">
                        Allow Half Day Applications
                      </Label>
                      <p className="text-xs text-blue-700">Enable employees to apply for half-day leave</p>
                    </div>
                    <Switch
                      id="halfDayAllowed"
                      checked={formData.halfDayAllowed}
                      onCheckedChange={(checked) => setFormData({ ...formData, halfDayAllowed: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#2055de] to-[#1a4bc4] text-white rounded-t-2xl">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <span>Rules & Restrictions</span>
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Configure application rules, holiday handling, and approval workflows.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Holiday & Weekend Rules */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Holiday & Weekend Rules
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        id: "sandwichHolidayAsLeave",
                        label: "Count Sandwich Holiday as Leave",
                        description: "Include holidays between leave days as leave",
                        key: "sandwichHolidayAsLeave",
                      },
                      {
                        id: "sandwichWeekOffAsLeave",
                        label: "Count Sandwich Week-off as Leave",
                        description: "Include weekends between leave days as leave",
                        key: "sandwichWeekOffAsLeave",
                      },
                      {
                        id: "canStartOrEndOnHoliday",
                        label: "Can Start/End on Holiday",
                        description: "Allow leave to start or end on holidays",
                        key: "canStartOrEndOnHoliday",
                      },
                      {
                        id: "canStartOrEndOnWeekOff",
                        label: "Can Start/End on Week-off",
                        description: "Allow leave to start or end on weekends",
                        key: "canStartOrEndOnWeekOff",
                      },
                    ].map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200"
                      >
                        <div className="space-y-1">
                          <Label htmlFor={rule.id} className="text-sm font-semibold text-gray-900">
                            {rule.label}
                          </Label>
                          <p className="text-xs text-gray-600">{rule.description}</p>
                        </div>
                        <Switch
                          id={rule.id}
                          checked={formData[rule.key as keyof typeof formData] as boolean}
                          onCheckedChange={(checked) => setFormData({ ...formData, [rule.key]: checked })}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Application Timing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Application Timing Rules
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="preApplicationDays" className="text-sm font-medium text-gray-700">
                        Pre-application Days
                      </Label>
                      <Input
                        id="preApplicationDays"
                        type="number"
                        value={formData.preApplicationDays}
                        onChange={(e) =>
                          setFormData({ ...formData, preApplicationDays: Number.parseInt(e.target.value) })
                        }
                        className="h-12 border-2 border-gray-200 focus:border-[#2055de] focus:ring-[#2055de]/20 rounded-xl"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500">Days before leave start to apply</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maximumBackDaysApplicationAllowed" className="text-sm font-medium text-gray-700">
                        Max Back Days Application
                      </Label>
                      <Input
                        id="maximumBackDaysApplicationAllowed"
                        type="number"
                        value={formData.maximumBackDaysApplicationAllowed}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maximumBackDaysApplicationAllowed: Number.parseInt(e.target.value),
                          })
                        }
                        className="h-12 border-2 border-gray-200 focus:border-[#2055de] focus:ring-[#2055de]/20 rounded-xl"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500">Max days in past to apply</p>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="maximumFutureDaysApplicationAllowed"
                        className="text-sm font-medium text-gray-700"
                      >
                        Max Future Days Application
                      </Label>
                      <Input
                        id="maximumFutureDaysApplicationAllowed"
                        type="number"
                        value={formData.maximumFutureDaysApplicationAllowed}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maximumFutureDaysApplicationAllowed: Number.parseInt(e.target.value),
                          })
                        }
                        className="h-12 border-2 border-gray-200 focus:border-[#2055de] focus:ring-[#2055de]/20 rounded-xl"
                        placeholder="365"
                      />
                      <p className="text-xs text-gray-500">Max days in future to apply</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Approval Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Approval Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        id: "autoApprovalAllowed",
                        label: "Auto Approval Allowed",
                        description: "Enable automatic approval for this leave type",
                        key: "autoApprovalAllowed",
                      },
                      {
                        id: "allowedInNoticePeriod",
                        label: "Allowed in Notice Period",
                        description: "Allow leave during employee notice period",
                        key: "allowedInNoticePeriod",
                      },
                      {
                        id: "delegateApplicable",
                        label: "Delegate Applicable",
                        description: "Require work delegation for leave approval",
                        key: "delegateApplicable",
                      },
                      {
                        id: "alertManagerAfterApproval",
                        label: "Alert Manager After Approval",
                        description: "Send notification to manager after approval",
                        key: "alertManagerAfterApproval",
                      },
                    ].map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200"
                      >
                        <div className="space-y-1">
                          <Label htmlFor={rule.id} className="text-sm font-semibold text-gray-900">
                            {rule.label}
                          </Label>
                          <p className="text-xs text-gray-600">{rule.description}</p>
                        </div>
                        <Switch
                          id={rule.id}
                          checked={formData[rule.key as keyof typeof formData] as boolean}
                          onCheckedChange={(checked) => setFormData({ ...formData, [rule.key]: checked })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance" className="space-y-6">
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-2xl">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span>Balance Management</span>
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Configure leave balance validation and carry-forward policies.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                  <div className="space-y-1">
                    <Label htmlFor="balanceValidation" className="text-sm font-semibold text-gray-900">
                      Enable Balance Validation
                    </Label>
                    <p className="text-xs text-blue-700">Check available balance before approving leave</p>
                  </div>
                  <Switch
                    id="balanceValidation"
                    checked={formData.balanceValidation}
                    onCheckedChange={(checked) => setFormData({ ...formData, balanceValidation: checked })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="allowedNegativeBalance" className="text-sm font-medium text-gray-700">
                      Allowed Negative Balance
                    </Label>
                    <Input
                      id="allowedNegativeBalance"
                      type="number"
                      value={formData.allowedNegativeBalance}
                      onChange={(e) =>
                        setFormData({ ...formData, allowedNegativeBalance: Number.parseInt(e.target.value) })
                      }
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500">Maximum negative balance allowed</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maximumBalanceAllowed" className="text-sm font-medium text-gray-700">
                      Maximum Balance Allowed
                    </Label>
                    <Input
                      id="maximumBalanceAllowed"
                      type="number"
                      value={formData.maximumBalanceAllowed}
                      onChange={(e) =>
                        setFormData({ ...formData, maximumBalanceAllowed: Number.parseInt(e.target.value) })
                      }
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                      placeholder="365"
                    />
                    <p className="text-xs text-gray-500">Maximum leave balance that can be accumulated</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accrual" className="space-y-6">
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-t-2xl">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span>Accrual Settings</span>
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Configure how leave balances accumulate over time.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="accrualType" className="text-sm font-medium text-gray-700">
                      Accrual Type
                    </Label>
                    <Select
                      value={formData.accrualType}
                      onValueChange={(value) => setFormData({ ...formData, accrualType: value })}
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accrualDays" className="text-sm font-medium text-gray-700">
                      Accrual Days
                    </Label>
                    <Input
                      id="accrualDays"
                      type="number"
                      step="0.1"
                      value={formData.accrualDays}
                      onChange={(e) => setFormData({ ...formData, accrualDays: Number.parseFloat(e.target.value) })}
                      className="h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                      placeholder="1.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workingDays" className="text-sm font-medium text-gray-700">
                      Working Days
                    </Label>
                    <Input
                      id="workingDays"
                      type="number"
                      value={formData.workingDays}
                      onChange={(e) => setFormData({ ...formData, workingDays: Number.parseInt(e.target.value) })}
                      className="h-12 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                      placeholder="22"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="encashment" className="space-y-6">
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-2xl">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <span>Encashment Settings</span>
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Configure leave encashment rules and limitations.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                  <div className="space-y-1">
                    <Label htmlFor="encashmentAllowed" className="text-sm font-semibold text-gray-900">
                      Enable Leave Encashment
                    </Label>
                    <p className="text-xs text-blue-700">Allow employees to encash unused leave</p>
                  </div>
                  <Switch
                    id="encashmentAllowed"
                    checked={formData.encashmentAllowed}
                    onCheckedChange={(checked) => setFormData({ ...formData, encashmentAllowed: checked })}
                  />
                </div>

                {formData.encashmentAllowed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="minimumBalanceRequired" className="text-sm font-medium text-gray-700">
                        Minimum Balance Required
                      </Label>
                      <Input
                        id="minimumBalanceRequired"
                        type="number"
                        value={formData.minimumBalanceRequired}
                        onChange={(e) =>
                          setFormData({ ...formData, minimumBalanceRequired: Number.parseInt(e.target.value) })
                        }
                        className="h-12 border-2 border-gray-200 focus:border-blue-600 focus:ring-blue-600/20 rounded-xl"
                        placeholder="5"
                      />
                      <p className="text-xs text-gray-500">Minimum balance to maintain after encashment</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maximumAllowedEncashment" className="text-sm font-medium text-gray-700">
                        Maximum Allowed Encashment
                      </Label>
                      <Input
                        id="maximumAllowedEncashment"
                        type="number"
                        value={formData.maximumAllowedEncashment}
                        onChange={(e) =>
                          setFormData({ ...formData, maximumAllowedEncashment: Number.parseInt(e.target.value) })
                        }
                        className="h-12 border-2 border-gray-200 focus:border-blue-600 focus:ring-blue-600/20 rounded-xl"
                        placeholder="30"
                      />
                      <p className="text-xs text-gray-500">Maximum days that can be encashed</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Enhanced Action Buttons */}
        <div className="flex justify-end space-x-4 pt-8 border-t-2 border-gray-200">
          <Button
            type="button"
            variant="outline"
            className="px-8 py-3 h-12 rounded-xl border-2 border-gray-300 hover:bg-gray-50 bg-transparent"
          >
            Save as Draft
          </Button>
          <Button
            type="submit"
            className="px-8 py-3 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
          >
            <Save className="w-5 h-5 mr-2" />
            Save & Activate Policy
          </Button>
        </div>
      </form>
    </div>
  )
}