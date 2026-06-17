'use client';

import TopTitleDescription from "@repo/ui/components/titleline/top-title-discription";
import { Button } from "@repo/ui/components/ui/button";
import { useState } from "react";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { AxiosError } from "axios";
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

interface ReportData {
    report?: string;
    status?: string;
    tenantId?: string;
    reportName?: string;
    subsidiaries?: string[];
    divisions?: string[];
    departments?: string[];
    subDepartments?: string[];
    sections?: string[];
    designations?: string[];
    grades?: string[];
    toDate?: string;
    fromDate?: string;
    period?: string;
    reportTitle?: string;
    extension?: string;
    workflowName?: string;
    contractor?: string[];
    workOrderNumber?: string[];
    location?: string[];
}

interface MessengerState {
    type: 'success' | 'error' | 'info';
    message: string;
    progressbar?: string;
}

interface OrganizationData {
    subsidiaries?: Array<{ id: string; name: string }>;
    divisions?: Array<{ id: string; name: string }>;
    departments?: Array<{ id: string; name: string }>;
    subDepartments?: Array<{ id: string; name: string }>;
    sections?: Array<{ id: string; name: string }>;
    designations?: Array<{ id: string; name: string }>;
    grades?: Array<{ id: string; name: string }>;
}

interface ReportFormData {
    reportName: string;
    period: string;
    extension: string;
    fromDate: string;
    toDate: string;
    reportTitle: string;
    tenantId: string;
    subsidiaries: string[];
    divisions: string[];
    departments: string[];
    subDepartments: string[];
    sections: string[];
    designations: string[];
    grades: string[];
    contractor: string[];
    workOrderNumber: string[];
    location: string[];
}

interface ErrorResponse {
    message: string;
}

interface ReportResponse {
    success: boolean;
    message?: string;
    data?: {
        reportId?: string;
        timestamp?: string;
        reportUrl?: string;
    };
    error?: {
        message: string;
    };
}

interface WorkflowHistoryItem {
    reportId: string;
    timestamp: string;
    reportName: string;
    status: 'success' | 'error';
    message?: string;
}

interface ReportPreviewProps {
    onBack: () => void;
    onNext: () => void;
    onGenerate: (data: ReportFormData) => void;
    fromValue: any;
    setMessenger: (state: MessengerState) => void;
    messenger?: MessengerState;
}

export function ReportPreview({
    onBack,
    onNext,
    onGenerate,
    fromValue,
    setMessenger,
    messenger
}: ReportPreviewProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const tenantCode = useGetTenantCode()

    // Type guard to check if form data is valid
    const isValidFormData = (data: ReportFormData): boolean => {
        return Boolean(
            data.reportName &&
            data.fromDate &&
            data.toDate &&
            new Date(data.fromDate) <= new Date(data.toDate)
        );
    };

    const { post, loading, error, data } = usePostRequest<ReportResponse>({
        url: 'reports',
        headers: {
            'Content-Type': 'application/json',
            'X-Tenant': tenantCode
        },
        requireAuth: true,
        onSuccess: (responseData: ReportResponse) => {
            if (responseData?.success) {
                const workflowItem = {
                    reportId: responseData.data?.reportId || Date.now().toString(),
                    timestamp: responseData.data?.timestamp || new Date().toISOString(),
                    reportName: fromValue.reportName,
                    status: 'success' as const,
                    message: responseData.message || 'Report generated successfully'
                };

                try {
                    const existingWorkflow = localStorage.getItem("workflow");
                    const workflow = existingWorkflow
                        ? JSON.parse(existingWorkflow)
                        : [];

                    workflow.push(workflowItem);
                    localStorage.setItem("workflow", JSON.stringify(workflow));

                    // setMessenger({
                    //     type: "success",
                    //     message: "Report generated successfully!",
                    //     progressbar: "Basic Information"
                    // });
                } catch (storageError) {
                    console.error('Failed to save workflow history:', storageError);
                    setValidationError('Failed to save report history');
                }
            } else {
                const errorMessage = responseData?.error?.message || 'Failed to generate report';
                setValidationError(errorMessage);
                // setMessenger({
                //     type: "error",
                //     message: errorMessage
                // });
            }
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error?.response?.data as ErrorResponse)?.message || error?.message || 'An unexpected error occurred';
            setValidationError(errorMessage);
            // setMessenger({
            //     type: "error",
            //     message: errorMessage
            // });
            console.error('Report generation error:', {
                error,
                message: errorMessage,
                status: error?.response?.status,
                data: error?.response?.data
            });
        }
    });


    const handleGenerateReport = async () => {
        // if (!isValidFormData(fromValue)) {
        //     setValidationError('Please fill in all required fields correctly');
        //     return;
        // }

        // setValidationError(null);
        // setIsGenerating(true);
        // setMessenger({
        //     type: "info",
        //     message: "Generating report...",
        //     progressbar: "Processing"
        // });
        onGenerate(fromValue);
        // try {
        //     const body = {
        //         tenant: "",
        //         action: "insert",
        //         id: null,
        //         collectionName: "reports",
        //         event: "reportGeneration",
        //         data: fromValue
        //     };
        //     await post(body);
        // } catch (err) {
        //     console.error('Error in handleGenerateReport:', err);
        //     setValidationError('Failed to generate report. Please try again.');
        //     setIsGenerating(false);

        // }
    };

    // Helper function to safely access array length
    const getArrayLength = (arr: string[] | undefined): number => {
        if (!arr || !Array.isArray(arr)) return 0;
        return arr.length;
    };

    return (
        <div className="p-4">
            {/* Report Header */}
            <div className="mb-2 flex items-center justify-between">
                <TopTitleDescription
                    titleValue={{
                        title: "Report Generation Preview",
                        description: "Review selected filters and report details"
                    }}
                />
                <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm">
                    Selected Filters: {
                        // If subsidiaries first value is "Unknown", count contractors instead
                        (fromValue?.subsidiaries && fromValue?.subsidiaries?.length > 0 && fromValue?.subsidiaries[0] === "Unknown"
                            ? fromValue?.subsidiaries?.length - 1  // Subtract 1 to exclude "Unknown"
                            : getArrayLength(fromValue?.subsidiaries)
                        ) +
                        getArrayLength(fromValue.location) +
                        getArrayLength(fromValue.divisions) +
                        getArrayLength(fromValue.departments) +
                        getArrayLength(fromValue.subDepartments) +
                        getArrayLength(fromValue.sections) +
                        getArrayLength(fromValue.designations) +
                        getArrayLength(fromValue.grades)
                    }
                </div>
            </div>

            {/* Report Details Section */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Report Information */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Report Information</h3>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <span className="text-sm text-gray-600 w-24">Report Type:</span>
                                    <span className="text-sm font-medium text-gray-900 capitalize">
                                        {fromValue.reportName || 'Not specified'}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-sm text-gray-600 w-24">Workflow:</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {fromValue.period || 'Custom'}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-sm text-gray-600 w-24">Extension:</span>
                                    <span className="text-sm font-medium text-gray-900 uppercase">
                                        {fromValue.extension || 'Not specified'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Date Range</h3>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <span className="text-sm text-gray-600 w-24">From Date:</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {fromValue.fromDate ? new Date(fromValue.fromDate).toLocaleDateString() : 'Not specified'}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-sm text-gray-600 w-24">To Date:</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {fromValue.toDate ? new Date(fromValue.toDate).toLocaleDateString() : 'Not specified'}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-sm text-gray-600 w-24">Generated:</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {new Date().toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Report Content Preview */}
                <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Report Content</h3>
                    <div className="bg-gray-50 rounded-md p-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-900">
                                {fromValue.reportName || 'Not specified'}
                            </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                            Report will be generated with the selected parameters and filters
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Report Title</p>
                            <p className="mt-1 text-base font-medium text-gray-900">
                                {fromValue.reportTitle || 'Not specified'}
                            </p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-md">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Tenant</p>
                            <p className="mt-1 text-base font-medium text-gray-900">
                                {fromValue.tenantId || 'Not specified'}
                            </p>
                        </div>
                        <div className="p-2 bg-green-50 rounded-md">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">File Format</p>
                            <p className="mt-1 text-base font-medium text-gray-900">
                                {(fromValue.extension || 'Not specified').toUpperCase()} Document
                            </p>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-md">
                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selected Filters Section */}
            <div className="mt-6 bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-900">Selected Filters</h3>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Subsidiaries Filter - Show only if first value is not "Unknown" */}
                        {fromValue?.subsidiaries && fromValue?.subsidiaries?.length > 0 && fromValue?.subsidiaries[0] != "unKnown"  && (
                            <div className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center mb-2">
                                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Subsidiaries</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {fromValue?.subsidiaries?.map((sub: any, idx: any) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            {sub}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}


                        {/* Location Filter */}
                        {fromValue.location && fromValue.location.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center mb-2">
                                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm0 0c-4 0-7 3-7 7 0 .552.448 1 1 1h12c.552 0 1-.448 1-1 0-4-3-7-7-7z" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Location</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {fromValue.location.map((loc: any, idx: any) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {loc}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}


                        {fromValue.employeeID && fromValue.employeeID.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center mb-2">
                                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">employeeID</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {fromValue.employeeID.map((employee: any, idx: any) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            {employee}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}



                        {/* Divisions Filter */}
                        {fromValue.divisions && fromValue.divisions.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center mb-2">
                                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Divisions</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {fromValue.divisions.map((div: any, idx: any) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                            {div}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Departments Filter */}
                        {fromValue.departments && fromValue.departments.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center mb-2">
                                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Departments</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {fromValue.departments.map((dept: any, idx: any) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                            {dept}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sub Departments Filter */}
                        {fromValue.subDepartments && fromValue.subDepartments.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center mb-2">
                                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Sub Departments</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {fromValue.subDepartments.map((subDept: any, idx: any) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
                                            {subDept}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sections Filter */}
                        {fromValue.sections && fromValue.sections.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center mb-2">
                                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Sections</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {fromValue.sections.map((section: any, idx: any) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            {section}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Designations Filter */}
                        {fromValue.designations && fromValue.designations.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center mb-2">
                                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Designations</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {fromValue.designations.map((des: any, idx: any) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                            {des}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Grades Filter */}
                        {fromValue.grades && fromValue.grades.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center mb-2">
                                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Grades</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {fromValue.grades.map((grade: any, idx: any) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                            {grade}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {fromValue.contractor && fromValue.contractor.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center mb-2">
                                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Contractors</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {fromValue.contractor.map((grade: any, idx: any) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                            {grade}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Divisions Filter */}
                        {fromValue.workOrderNumber && fromValue.workOrderNumber.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center mb-2">
                                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Work Order Number</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {fromValue.workOrderNumber.map((workOrderNumber: any, idx: any) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                            {workOrderNumber}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sub Departments Filter */}
                        {fromValue.employeeCategories && fromValue.employeeCategories.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center mb-2">
                                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Employee Categories</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {fromValue.employeeCategories.map((employeeCategorie: any, idx: any) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
                                            {employeeCategorie}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col space-y-4">
                {/* Status Messages */}
                {(error || validationError) && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">
                            {validationError || error?.message || 'Failed to generate report. Please try again.'}
                        </p>
                    </div>
                )}
                {data?.success && !validationError && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-600">
                            {data.message || 'Report generated successfully!'}
                        </p>
                        {data.data?.reportUrl && (
                            <p className="mt-2 text-sm text-green-700">
                                <a
                                    href={data.data.reportUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:text-green-800"
                                >
                                    View Report
                                </a>
                            </p>
                        )}
                    </div>
                )}

                <div className="flex justify-end space-x-3">
                    {/* <Button
                        variant="outline"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onBack}
                        disabled={isGenerating}
                    >
                        Back to Selection
                    </Button> */}
                    <Button
                        className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors duration-200 ${loading || isGenerating
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        onClick={handleGenerateReport}
                        disabled={loading || isGenerating || !!data?.success}
                    >
                        {loading || isGenerating
                            ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </span>
                            )
                            : data?.success
                                ? 'Generated'
                                : 'Generate Report'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ReportPreview; 