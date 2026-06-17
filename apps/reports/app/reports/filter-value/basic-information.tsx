"use client"

import { useState } from "react"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Calendar, Info, FileText, ArrowRight } from "lucide-react"
import { useFormContext } from "react-hook-form"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

function BasicInformation({fromValue, setFormValue, setMessenger, messenger}: {fromValue: any, setFormValue: (value: any) => void, setMessenger: (value: any) => void, messenger: any}) {
    // Safely get form context with fallback
    const formContext = useFormContext();
    const watch = formContext?.watch || (() => ({}));
    const setValue = formContext?.setValue || (() => ({}));

    const tenantCode = useGetTenantCode()
    const contractor = watch("contractor");
    const [selectedDateRange, setSelectedDateRange] = useState("Custom");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [reportTitle, setReportTitle] = useState(`${tenantCode}_${fromValue?.reportName || ""}`);
    const [extension, setExtension] = useState("");
    const [reportDescription, setReportDescription] = useState("");
    
    // Error states for validation
    const [errors, setErrors] = useState({
        extension: "",
        fromDate: "",
        toDate: "",
        dateRange: ""
    });


    const dateRangeOptions = [
        "Today",
        "This Week", 
        "This Month",
        "This Quarter",
        "This Year",
        "Custom"
    ];

    // Format local date (avoid timezone shifting with toISOString)
    const formatLocalDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const extensionOptions = [
        "pdf",
        "excel"
    ];

    const handleDateRangeChange = (value: string) => {
        setSelectedDateRange(value);
        
        // Only call setValue if form context is available
        if (formContext) {
            setValue("dateRange", value);
        }
        
        // Auto-fill dates based on selection
        const rawToday = new Date();
        const today = new Date();
        today.setHours(0,0,0,0);
        let from = new Date(today);
        let to = new Date(today);
        
        switch(value) {
            case "Today":
                from = today;
                to = today;
                break;
            case "This Week":
                // Use previous logic for week selection (old behavior)
                const startOfWeekRaw = new Date(rawToday);
                startOfWeekRaw.setDate(rawToday.getDate() - rawToday.getDay());
                from = startOfWeekRaw;
                to = rawToday;
                break;
            case "This Month":
                from = new Date(today.getFullYear(), today.getMonth(), 1);
                to = today;
                break;
            case "This Quarter":
                const quarter = Math.floor(today.getMonth() / 3);
                from = new Date(today.getFullYear(), quarter * 3, 1);
                to = today;
                break;
            case "This Year":
                from = new Date(today.getFullYear(), 0, 1);
                to = today;
                break;
            case "Custom":
                // Keep existing dates or clear them
                break;
        }
        
        if (value !== "Custom") {
            // For week, keep old ISO-based behavior
            if (value === "This Week") {
                setFromDate(from.toISOString().split('T')[0]);
                setToDate(to.toISOString().split('T')[0]);
            } else {
                setFromDate(formatLocalDate(from));
                setToDate(formatLocalDate(to));
            }
            
            // Only call setValue if form context is available
            if (formContext) {
                if (value === "This Week") {
                    setValue("fromDate", from.toISOString().split('T')[0]);
                    setValue("toDate", to.toISOString().split('T')[0]);
                } else {
                    setValue("fromDate", formatLocalDate(from));
                    setValue("toDate", formatLocalDate(to));
                }
            }
        }
    };

    const handleSaveAndContinue = () => {
        // Clear previous errors
        setErrors({
            extension: "",
            fromDate: "",
            toDate: "",
            dateRange: ""
        });

        let hasErrors = false;
        const newErrors = {
            extension: "",
            fromDate: "",
            toDate: "",
            dateRange: ""
        };

        // Validate required fields (reportTitle is auto-populated, so no validation needed)
        
        if (!extension) {
            newErrors.extension = "File extension is required";
            hasErrors = true;
        }
        
        if (!fromDate) {
            newErrors.fromDate = "From date is required";
            hasErrors = true;
        }
        
        if (!toDate) {
            newErrors.toDate = "To date is required";
            hasErrors = true;
        }
        
        // Validate date range
        if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
            newErrors.dateRange = "From date cannot be later than to date";
            hasErrors = true;
        }

        if (hasErrors) {
            setErrors(newErrors);
            return;
        }

        setFormValue((prev: any) => ({
            ...prev,
            extension: extension,
            toDate: toDate,
            fromDate: fromDate,
            period: selectedDateRange,
            reportTitle: reportTitle,
            reportDescription: reportDescription
        }))
        setMessenger((prev: any) => ({
            ...prev,
            progressbar: "Preview"
        }))
    };

    const formatDateForDisplay = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB'); // dd-mm-yyyy format
    };

    return (
        <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl overflow-hidden">
            <CardContent className="p-8">
                <div className="space-y-8">
                    {/* Date Range Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                                <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Date Range</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Date Range Fields in One Line */}
                            <div className="grid grid-cols-3 gap-4">
                                {/* Select Date Dropdown */}
                                <div className="space-y-2">
                                    <Label htmlFor="dateRange" className="text-sm font-medium text-gray-700">
                                        Select Date <span className="text-red-500">*</span>
                                    </Label>
                                                                         <Select value={selectedDateRange} onValueChange={handleDateRangeChange}>
                                         <SelectTrigger className="h-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-300">
                                             <SelectValue placeholder="Select date range" />
                                         </SelectTrigger>
                                        <SelectContent>
                                            {dateRangeOptions.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* From Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="fromDate" className="text-sm font-medium text-gray-700">
                                        from Date <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                                                                 <Input
                                             id="fromDate"
                                             type="date"
                                             value={fromDate}
                                             onChange={(e) => {
                                                 setFromDate(e.target.value);
                                                 if (formContext) {
                                                     setValue("fromDate", e.target.value);
                                                 }
                                                 // Clear error when user starts typing
                                                 if (errors.fromDate) {
                                                     setErrors(prev => ({ ...prev, fromDate: "" }));
                                                 }
                                             }}
                                             className={`h-10 border-2 ${errors.fromDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'} rounded-xl transition-all duration-300 pr-10`}
                                             max={new Date().toISOString().split('T')[0]} // Prevent future dates
                                         />
                                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    </div>
                                    {errors.fromDate && (
                                        <p className="text-sm text-red-600 mt-1">{errors.fromDate}</p>
                                    )}
                                </div>

                                {/* To Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="toDate" className="text-sm font-medium text-gray-700">
                                        to Date <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                                                                 <Input
                                             id="toDate"
                                             type="date"
                                             value={toDate}
                                             onChange={(e) => {
                                                 setToDate(e.target.value);
                                                 if (formContext) {
                                                     setValue("toDate", e.target.value);
                                                 }
                                                 // Clear error when user starts typing
                                                 if (errors.toDate) {
                                                     setErrors(prev => ({ ...prev, toDate: "" }));
                                                 }
                                             }}
                                             className={`h-10 border-2 ${errors.toDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'} rounded-xl transition-all duration-300 pr-10`}
                                             max={new Date().toISOString().split('T')[0]} // Prevent future dates
                                         />
                                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-4 text-gray-400" />
                                    </div>
                                    {errors.toDate && (
                                        <p className="text-sm text-red-600 mt-1">{errors.toDate}</p>
                                    )}
                                </div>
                            </div>

                            {/* Date Range Error */}
                            {errors.dateRange && (
                                <div className="flex items-center gap-2 text-sm text-red-600">
                                    <Info className="h-4 w-4" />
                                    {errors.dateRange}
                                </div>
                            )}
                            
                            {/* Info Message for Date Fields */}
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                                <Info className="h-4 w-4" />
                                Future dates are not allowed for these fields.
                            </div>
                        </div>
                    </div>

                    {/* Report Information Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Report Information</h2>
                        </div>
                        
                        <div className="space-y-4">
                                                         {/* Report Fields in One Line */}
                             <div className="grid grid-cols-2 gap-4">
                                 {/* Report Title */}
                                 <div className="space-y-2">
                                     <Label htmlFor="reportTitle" className="text-sm font-medium text-gray-700">
                                         Report Title <span className="text-red-500">*</span>
                                     </Label>
                                     <Input
                                         id="reportTitle"
                                         type="text"
                                         value={reportTitle}
                                         readOnly
                                         className="h-10 border-2 border-gray-200 bg-gray-50 rounded-xl transition-all duration-300 cursor-not-allowed"
                                     />
                                     <p className="text-xs text-gray-500">Report title is automatically set based on selected report</p>
                                 </div>

                                 {/* Extension */}
                                 <div className="space-y-2">
                                     <Label htmlFor="extension" className="text-sm font-medium text-gray-700">
                                         Extension <span className="text-red-500">*</span>
                                     </Label>
                                                                           <Select value={extension} onValueChange={(value) => {
                                          setExtension(value);
                                          if (formContext) {
                                              setValue("extension", value);
                                          }
                                          // Clear error when user selects
                                          if (errors.extension) {
                                              setErrors(prev => ({ ...prev, extension: "" }));
                                          }
                                      }}>
                                          <SelectTrigger className={`h-10 border-2 ${errors.extension ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'} rounded-xl transition-all duration-300`}>
                                              <SelectValue placeholder="Select file extension" />
                                          </SelectTrigger>
                                         <SelectContent>
                                             {extensionOptions.map((option) => (
                                                 <SelectItem key={option} value={option}>
                                                     {option}
                                                 </SelectItem>
                                             ))}
                                         </SelectContent>
                                     </Select>
                                     {errors.extension && (
                                         <p className="text-sm text-red-600 mt-1">{errors.extension}</p>
                                     )}
                                 </div>
                             </div>

                                                           {/* Report Description Field - Full Width */}
                              <div className="space-y-2">
                                  <Label htmlFor="reportDescription" className="text-sm font-medium text-gray-700">
                                      Report Description
                                  </Label>
                                  <Textarea
                                      id="reportDescription"
                                      placeholder="Enter report description (optional)"
                                      value={reportDescription}
                                      onChange={(e) => {
                                          setReportDescription(e.target.value);
                                          if (formContext) {
                                              setValue("reportDescription", e.target.value);
                                          }
                                      }}
                                      className="min-h-24 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-300 resize-none"
                                      rows={4}
                                  />
                              </div>

                            {/* Description for Report Information */}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Info className="h-4 w-4" />
                                These fields are required for report generation.
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end pt-6 border-t border-gray-200">
                                                 <Button
                             onClick={handleSaveAndContinue}
                             className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-medium transition-all duration-300"
                         >
                            <FileText className="h-4 w-4 mr-2" />
                            Save and Continue
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default BasicInformation;