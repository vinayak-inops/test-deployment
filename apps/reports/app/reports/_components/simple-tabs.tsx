import { employeeFilterFormStructure, periodFilterFormStructure, progressform, reportFilterFormStructure, reportFormStructure } from "@/json/report/form-structure";
import DynamicForm from "@repo/ui/components/form-dynamic/dynamic-form";
import React, { useState, useEffect, Dispatch, SetStateAction } from "react";

import { useDynamicQuery } from "@repo/ui/hooks/api/dynamic-graphql";
import { useOrganizationData } from "@repo/ui/hooks/global-backend-value/useOrganizationData";
import { Button } from "@repo/ui/components/ui/button";
import { gql, useApolloClient, useQuery } from '@apollo/client';
import { fetchDynamicQuery } from '@repo/ui/hooks/api/dynamic-graphql';
import { ReportPreview } from "./ReportPreview";
import { useSession } from 'next-auth/react';
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken";
import { useWorkflowSSE } from "@repo/ui/hooks/workflow-management/useWorkflowSSE";
import SSEStatusTimeline from "./sse-status-timeline";
import { fetchReports } from "@repo/ui/api/api-connection";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import EmployeeValueFilter from "../filter-value/emplyee-value-filter";
import ContrctorFilter from "../filter-value/contrctor-filter";
import ContractEmployeeFilter from "../filter-value/contract-employee-filter";
import ReportSelector from "../filter-value/report-selector";
import BasicInformation from "../filter-value/basic-information";
import SaveEmployeeFilterButton from "../filter-value/save-employee-filter-button";
import { Separator } from "@repo/ui/components/ui/separator";
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode";
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info";
import { useSelector } from "react-redux";
import { RootState } from "@inops/store/src/store";
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy";


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
    contractor?: string[];
    reportTitle?: string;
    extension?: string;
    workflowName?: string;
    reportDescription?: string;
    [key: string]: any;
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
}

interface SimpleTabsProps {
    onTabChange?: (index: number) => void;
    initialTab?: number;
    setOpen?: (open: boolean) => void;
}


// Define the working GraphQL query for company employees
const FETCH_CONTRACTOR_QUERY = gql`
  query FetchContractors($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchContractors(criteriaRequests: $criteriaRequests, collection: $collection) {
        contractorCode
        contractorName
        workOrders {
            workOrderNumber
        }
    }
  }
`;


export default function SimpleTabs({ onTabChange, initialTab = 0, setOpen }: SimpleTabsProps) {
    const [active, setActive] = useState<number>(initialTab);
    const [activeFilterTab, setActiveFilterTab] = useState<'basic' | 'employee' | 'contractor'>('basic');
    const { data: session, status: sessionStatus } = useSession();
    const [reportName, setReportName] = useState<any>([]);
    const tenantCode = useGetTenantCode();
    const [fromValue, setFormValue] = useState<ReportData>({
        report: "",
        tenantCode: tenantCode,
        organization: tenantCode,
        uploadedBy: session?.user?.name || "user",
        createdOn: new Date().toISOString(),
    });
    const [messenger, setMessenger] = useState<Record<string, any>>({});
    const [tempOrganizationData, setTempOrganizationData] = useState<any>(null);
    const [currentReportId, setCurrentReportId] = useState<string | null>(null);
    const [showSSEPanel, setShowSSEPanel] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { token, loading: tokenLoading, error: tokenError } = useAuthToken();
    const { workflows, status: sseStatus, error: sseError, reconnect } = useWorkflowSSE();
    const { employeeId } = useKeyclockRoleInfo();
    const rolePermissions = useSelector((state: RootState) => (state as any).api?.data)
    const { hierarchyFilters } = useEmpHierarchy();

    const client = useApolloClient();
    const {
        data: attendanceResponse,
        loading: attendanceLoading,
        error: attendanceError,
        refetch: fetchAttendance
    } = useRequest<any>({
        url: 'tenantReportConfiguration/search',
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
        onError: (error: any) => {
            console.error("Error fetching attendance data:", error);
        },
        dependencies: []
    });



    // Fetch organization data
    const fetchOrganizationData = async () => {
        const organizationFields = {
            fields: [
                'organizationCode',
                'firstMonthOfFinancialYear',
                'subsidiaries { label:subsidiaryName, value:subsidiaryCode, locationCode }',
                'designations { divisionCode, value:designationCode, label:designationName, subsidiaryCode, locationCode }',
                'grades { label:gradeCode, value:gradeName, designationCode, divisionCode, subsidiaryCode, locationCode }',
                'divisions { subsidiaryCode, value:divisionCode, label:divisionName, locationCode }',
                'departments { label:departmentName, value:departmentCode, divisionCode, subsidiaryCode, locationCode }',
                'subDepartments { label:subDepartmentName, value:subDepartmentCode, departmentCode, organizationCode, subsidiaryCode, divisionCode, locationCode }',
                'sections { label:sectionName, value:sectionCode, subDepartmentCode, departmentCode, divisionCode, subsidiaryCode, locationCode }',
                'location { label:locationName, value:locationCode }',
                'employeeCategories { value:employeeCategoryCode, label:employeeCategoryName }'
            ]
        };

        try {
            const result = await fetchDynamicQuery(
                organizationFields,
                'organization',
                'FetchAllOrganization', // operationName
                'fetchAllOrganization', // operationType
                {
                    collection: 'organization',
                    tenantCode: tenantCode
                }
            );

            if (result.error) {
                throw new Error(result.error.message || 'Failed to fetch organization data');
            }

            return result.data;
        } catch (err) {
            console.error('Error fetching organization data:', err);
            return null;
        }
    };



    const {
        data,
        error,
        loading,
        refetch
    } = useQuery(FETCH_CONTRACTOR_QUERY, {
        client,
        variables: {
            criteriaRequests: [
                {
                    field: "tenantCode",
                    operator: "eq",
                    value: tenantCode,
                },
            ],
            collection: "contractor",
        },
        context: {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
        errorPolicy: 'all',
        onCompleted: (data) => {
        },
        onError: (error) => {
            console.error("Error loading contractors:", error);
        }
    });


    // Transform contractors data into the required format
    const transformContractorsData = (contractorsData: any) => {
        if (!contractorsData?.fetchContractors) return { contractor: [], workOrderNumber: [] };

        const contractorOptions = contractorsData?.fetchContractors?.map((contractor: any) => ({
            label: `${contractor.contractorCode} - ${contractor.contractorName}`,
            value: contractor.contractorCode
        }));

        const workOrderOptions = contractorsData.fetchContractors.flatMap((contractor: any) => 
            contractor?.workOrders?.map((workOrder: any) => ({
                label: workOrder.workOrderNumber,
                value: workOrder.workOrderNumber,
                contractorCode: contractor.contractorCode
            }))
        );

        return {
            contractor: contractorOptions,
            workOrderNumber: workOrderOptions
        };
    };

    // Filter organization data based on hierarchy filters
    const filterOrganizationData = (orgData: any, hierarchyFilters: any) => {
        if (!orgData || !hierarchyFilters) return orgData;

        const filtered = { ...orgData };

        // Filter subsidiaries
        if (hierarchyFilters.subsidiaries && hierarchyFilters.subsidiaries.length > 0 && Array.isArray(filtered.subsidiaries)) {
            filtered.subsidiaries = filtered.subsidiaries.filter((sub: any) => 
                hierarchyFilters.subsidiaries.includes(sub.value || sub.subsidiaryCode)
            );
        }

        // Filter divisions (filter by subsidiaries)
        if (Array.isArray(filtered.divisions)) {
            filtered.divisions = filtered.divisions.filter((div: any) => {
                if (hierarchyFilters.subsidiaries && hierarchyFilters.subsidiaries.length > 0) {
                    return hierarchyFilters.subsidiaries.includes(div.subsidiaryCode);
                }
                if (hierarchyFilters.divisions && hierarchyFilters.divisions.length > 0) {
                    return hierarchyFilters.divisions.includes(div.value || div.divisionCode);
                }
                return true;
            });
        }

        // Filter departments (filter by divisions)
        if (Array.isArray(filtered.departments)) {
            filtered.departments = filtered.departments.filter((dept: any) => {
                if (hierarchyFilters.divisions && hierarchyFilters.divisions.length > 0) {
                    return hierarchyFilters.divisions.includes(dept.divisionCode);
                }
                if (hierarchyFilters.departments && hierarchyFilters.departments.length > 0) {
                    return hierarchyFilters.departments.includes(dept.value || dept.departmentCode);
                }
                return true;
            });
        }

        // Filter subDepartments (filter by departments)
        if (Array.isArray(filtered.subDepartments)) {
            filtered.subDepartments = filtered.subDepartments.filter((subDept: any) => {
                if (hierarchyFilters.departments && hierarchyFilters.departments.length > 0) {
                    return hierarchyFilters.departments.includes(subDept.departmentCode);
                }
                return true;
            });
        }

        // Filter sections (filter by subDepartments)
        if (Array.isArray(filtered.sections)) {
            filtered.sections = filtered.sections.filter((section: any) => {
                if (hierarchyFilters.subDepartments && hierarchyFilters.subDepartments.length > 0) {
                    return hierarchyFilters.subDepartments.includes(section.subDepartmentCode);
                }
                return true;
            });
        }

        // Filter designations (filter by divisions)
        if (Array.isArray(filtered.designations)) {
            filtered.designations = filtered.designations.filter((desig: any) => {
                if (hierarchyFilters.divisions && hierarchyFilters.divisions.length > 0) {
                    return hierarchyFilters.divisions.includes(desig.divisionCode);
                }
                return true;
            });
        }

        // Filter grades (filter by designations)
        if (Array.isArray(filtered.grades)) {
            filtered.grades = filtered.grades.filter((grade: any) => {
                if (hierarchyFilters.designations && hierarchyFilters.designations.length > 0) {
                    return hierarchyFilters.designations.includes(grade.designationCode);
                }
                return true;
            });
        }

        // Filter location
        if (hierarchyFilters.locations && hierarchyFilters.locations.length > 0 && Array.isArray(filtered.location)) {
            filtered.location = filtered.location.filter((loc: any) => 
                hierarchyFilters.locations.includes(loc.value || loc.locationCode)
            );
        }

        return filtered;
    };

    
    useEffect(() => {
        // Avoid refetching during render; run once after mount
        refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update uploadedBy when session becomes available
    useEffect(() => {
        if (session?.user?.name) {
            setFormValue(prev => ({
                ...prev,
                uploadedBy: session.user!.name
            }));
        }
    }, [session]);

    // Load organization data on component mount
    useEffect(() => {
        const fetchAndSet = async () => {
            setIsLoading(true);
            try {
                const [organizationData, reportsResponse] = await Promise.all([
                    fetchOrganizationData(),
                    fetchReports({
                        endpoint: 'tenantReportConfiguration/search',
                        token: token || undefined,
                        method: 'POST',
                        body: [
                            {
                                field: "tenantCode",
                                operator: "eq",
                                value: tenantCode
                            },
                        ],
                    })
                ]);
                setTempOrganizationData(organizationData);
                if (organizationData) {
                    // Filter organization data based on hierarchy filters
                    const filteredOrgData = filterOrganizationData(organizationData[0], hierarchyFilters);
                    
                    setReportName(reportsResponse?.data?.[0] || []);
                    setMessenger((prev: Record<string, any>) => ({
                        ...prev,
                        organizationData: filteredOrgData,
                        reportName: reportsResponse?.data?.[0] || []
                    }));
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            fetchAndSet();
        }
    }, [token, hierarchyFilters]);

    
    // Re-filter organization data when hierarchy filters change
    useEffect(() => {
        if (tempOrganizationData && tempOrganizationData[0]) {
            const filteredOrgData = filterOrganizationData(tempOrganizationData[0], hierarchyFilters);
            setMessenger((prev: Record<string, any>) => ({
                ...prev,
                organizationData: filteredOrgData
            }));
        }
    }, [hierarchyFilters, tempOrganizationData]);

    // Update organizationData when contractor data becomes available
    useEffect(() => {
        if (data && tempOrganizationData) {
            const contractorsFormatted = transformContractorsData(data);
            
            // Filter contractors based on hierarchy filters
            let filteredContractors = contractorsFormatted.contractor;
            if (hierarchyFilters?.contractors && hierarchyFilters.contractors.length > 0) {
                filteredContractors = contractorsFormatted.contractor.filter((contractor: any) =>
                    hierarchyFilters.contractors.includes(contractor.value)
                );
            }
            
            setMessenger((prev: Record<string, any>) => ({
                ...prev,
                organizationData: {
                    ...prev.organizationData,
                    contractor: filteredContractors,
                    workOrderNumber: contractorsFormatted.workOrderNumber
                }
            }));
        }
    }, [data, tempOrganizationData, hierarchyFilters]);

    // Check SSE connection status and show connection info
    useEffect(() => {
        if (sseStatus === "error") {
            console.error("SSE Connection failed:", sseError);
        }
    }, [sseStatus, sseError, workflows]);

    useEffect(() => {
        if (messenger?.progressbar === "Report Status") {
            setOpen?.(false);
        }
    }, [messenger]);

    const handleGenerate = async (data: ReportData) => {
        try {

            if (!token) {
                throw new Error('No access token available');
            }

            const backendData = Object.keys(data).reduce((acc: any, key: string) => {
                if (key !== "forlocaluse") {
                    acc[key] = data[key];
                }
                return acc;
            }, {});

            // Remove subsidiaries when absent/empty or when first value is "unknown"
            if (!Array.isArray(backendData?.subsidiaries) || backendData.subsidiaries.length === 0) {
                delete (backendData as any).subsidiaries;
            } else {
                const firstSubsidiary = String(backendData.subsidiaries[0] ?? '').toLowerCase();
                if (firstSubsidiary === 'unknown') {
                    delete (backendData as any).subsidiaries;
                }
            }

            const workflowName = reportName?.options?.find((item: any) => item?.value == backendData?.reportName);



            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/command/attendance/reports`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        tenant: tenantCode,
                        action: "insert",
                        id: null,
                        collectionName: "reports",
                        event: "reportGeneration",
                        data: {
                            ...backendData,
                            workflowName: workflowName?.workflowName,
                            employeeId: employeeId,
                            level: rolePermissions?.length > 0 ? rolePermissions[0].level : undefined
                        }
                    })
                }
            );

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to generate report');
            }

            // Only proceed if we have a valid _id in the response
            if (!responseData._id) {
                throw new Error('No report ID received from server');
            }

            // Store the report ID and show SSE panel
            setCurrentReportId(responseData._id);
            setShowSSEPanel(true);

            // If we have a valid _id, continue with the process
            setFormValue((prev: any) => ({
                ...prev,
                generatereport: true,
                _id: responseData._id
            }));
            setMessenger(prev => ({
                ...prev,
                progressbar: "Report Status"
            }));

            // Call refetch to refresh the reports data after successful generation
            // This will update the reports list in the parent component
            if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('refreshReports'));
            }

        } catch (error) {
            console.error('Error generating report:', error);
            // Handle error appropriately
        }
    };

    // Show loader while data is being fetched
    if (isLoading || tokenLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600">Loading report configuration...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex relative">
            <div className="flex-1 overflow-y-scroll scroll-hidden">
                <div className="space-y-4">
                    {/* <div className="w-full flex justify-start">
                        <div className="inline-flex ">
                            {tabs.map((tab, idx) => (
                                <button
                                    key={tab.label}
                                    onClick={() => handleTabClick(idx)}
                                    className={`px-4 py-1.5 text-sm font-bold uppercase rounded-md focus:outline-none transition-all duration-200
                      ${active === idx
                                        ? "bg-[#2563eb] text-white border border-[#2563eb] shadow z-10 scale-105"
                                        : "bg-white text-gray-800 border border-gray-300"}
                      ${idx === 0 ? "ml-0" : "ml-0.5"}
                    `}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div> */}

                    {/* <PopupTable/> */}
                    <DynamicForm
                        department={reportFormStructure}
                        setFormValue={setFormValue}
                        fromValue={fromValue}
                        setMessenger={setMessenger}
                        messenger={messenger}
                    />
                    {(messenger?.progressbar === "Select Report" ||
                        messenger?.progressbar == undefined) && (
                            <DynamicForm
                                department={reportFilterFormStructure}
                                setFormValue={setFormValue}
                                fromValue={fromValue}
                                setMessenger={setMessenger}
                                messenger={messenger}
                            />
                            // <ReportSelector/>
                            // <ContrctorFilter/>
                        )}

                    {messenger?.progressbar === "Employee Filter" && (
                        <>
                            {(() => {
                                const reportCheck = reportName?.options?.find((item: any) => item?.value === fromValue?.reportName);

                                // If report category is "Contractor", show contractor filter directly
                                if (reportCheck?.category == "Contractor") {
                                    return (
                                        <ContrctorFilter fromValue={fromValue} setFormValue={setFormValue} setMessenger={setMessenger} messenger={messenger} />
                                    );
                                }

                                // For all other cases, show tab navigation with Basic and Employee tabs only
                                return (
                                    <>
                                        {/* Tab Navigation */}
                                        <div className="w-full flex justify-start mb-6">
                                            <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                                                <button
                                                    onClick={() => setActiveFilterTab('basic')}
                                                    className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeFilterTab === 'basic'
                                                            ? "bg-white text-blue-600 shadow-sm border border-blue-200"
                                                            : "text-gray-600 hover:text-gray-800"
                                                        }`}
                                                >
                                                    Basic Filter
                                                </button>
                                                <button
                                                    onClick={() => setActiveFilterTab('employee')}
                                                    className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeFilterTab === 'employee'
                                                            ? "bg-white text-blue-600 shadow-sm border border-blue-200"
                                                            : "text-gray-600 hover:text-gray-800"
                                                        }`}
                                                >
                                                    Employee Filter
                                                </button>
                                            </div>
                                        </div>

                                        {/* Tab Content */}
                                        {activeFilterTab === 'basic' && (
                                            <>
                                            <DynamicForm
                                                department={employeeFilterFormStructure}
                                                setFormValue={setFormValue}
                                                fromValue={fromValue}
                                                setMessenger={setMessenger}
                                                messenger={messenger}
                                            />
                                            <div className="mt-4">
                                                <Separator className="my-4" />
                                                <SaveEmployeeFilterButton fromValue={fromValue} setFormValue={setFormValue} setMessenger={setMessenger} messenger={messenger} />
                                            </div>
                                            </>
                                        )}

                                        {activeFilterTab === 'employee' && (
                                            <ContractEmployeeFilter 
                                                fromValue={fromValue} 
                                                setFormValue={setFormValue} 
                                                setMessenger={setMessenger} 
                                                messenger={messenger}
                                                subsidiaries={hierarchyFilters?.subsidiaries}
                                                divisions={hierarchyFilters?.divisions}
                                                departments={hierarchyFilters?.departments}
                                                locations={hierarchyFilters?.locations}
                                                contractors={hierarchyFilters?.contractors}
                                            />
                                        )}
                                    </>
                                );
                            })()}
                        </>
                    )}

                    {messenger?.progressbar === "Basic Information" && (
                        <>
                            <BasicInformation fromValue={fromValue} setFormValue={setFormValue} setMessenger={setMessenger} messenger={messenger} />
                        </>
                    )}

                    {messenger?.progressbar === "Preview" && (
                        <ReportPreview
                            onBack={() => setMessenger(prev => ({
                                ...prev,
                                progressbar: "Basic Information"
                            }))}
                            onNext={() => { }}
                            onGenerate={handleGenerate}
                            fromValue={fromValue as ReportFormData}
                            setMessenger={setMessenger}
                        />
                    )}
                    {/* {messenger?.progressbar === "Report Status" && (
                        <div className="p-4">
                            <TopTitleDescription
                                titleValue={{
                                    title: "Report Generation Status",
                                    description: `Report ID: ${currentReportId || 'Unknown'}`,
                                }}
                            />
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-medium">SSE Connection Status: <span className={`${sseStatus === 'connected' ? 'text-green-600' : sseStatus === 'error' ? 'text-red-600' : 'text-yellow-600'}`}>{sseStatus}</span></p>
                                        {sseError && <p className="text-sm text-red-600">Error: {sseError}</p>}
                                    </div>
                                    <Button 
                                        onClick={reconnect} 
                                        variant="outline" 
                                        size="sm"
                                        disabled={sseStatus === 'connecting'}
                                    >
                                        {sseStatus === 'connecting' ? 'Connecting...' : 'Reconnect'}
                                    </Button>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Waiting for real-time updates from the server...
                                </p>
                            </div>
                        </div>
                    )} */}
                </div>
            </div>

            {/* SSE Status Panel */}
            {showSSEPanel && currentReportId && (<></>
                // <div className="w-[360px] px-0 absolute right-0 top-0 h-full pl-4 border-gray-200 z-50">
                //     <SSEStatusTimeline
                //         fileId={currentReportId}
                //         setOpen={setShowSSEPanel}
                //         sseData={workflows}
                //     />
                // </div>
            )}
        </div>
    );
} 