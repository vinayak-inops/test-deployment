import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowUpRight, ExternalLink, DivideIcon as LucideIcon, Download, FileText } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import PresentAbsent from './presentabsent';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { CheckCircle, XCircle, Clock, ArrowUpIcon as ClockArrowUp, } from "lucide-react"
import { Bar, BarChart, XAxis } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import Table from "@repo/ui/components/table-dynamic/data-table";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useRequest } from '@repo/ui/hooks/api/useGetRequest';
import { useGetTenantCode } from '@/hooks/useGetTenantCode';
import { useEmpHierarchy } from '@/hooks/hierarchy/emp-hierarchy';
import { useKeyclockRoleInfo } from '@/hooks/search/keyclock-role-info';
import { useUserEntitlement } from '@/hooks/hierarchy/useUserEntitlement';

// PDF generation utility
const generatePDF = (data: any[], title: string) => {
    // Create a simple HTML table for PDF generation
    const tableHTML = `
        <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    h1 { color: #333; text-align: center; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .timestamp { font-size: 12px; color: #666; text-align: center; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${title}</h1>
                    <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>First Name</th>
                            <th>Middle Name</th>
                            <th>Last Name</th>
                            <th>Shift Code</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(employee => `
                            <tr>
                                <td>${employee.employeeId || ''}</td>
                                <td>${employee.firstName || ''}</td>
                                <td>${employee.middleName || ''}</td>
                                <td>${employee.lastName || ''}</td>
                                <td>${employee.shiftCode || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
        </html>
    `;

    // Create blob and download
    const blob = new Blob([tableHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Excel generation utility
const generateExcel = (data: any[], title: string) => {
    try {
        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        
        // Prepare data for Excel
        const excelData = [
            ['Employee ID', 'First Name', 'Middle Name', 'Last Name', 'Shift Code'], // Headers
            ...data.map(employee => [
                employee.employeeId || '',
                employee.firstName || '',
                employee.middleName || '',
                employee.lastName || '',
                employee.shiftCode || ''
            ])
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(excelData);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Data');
        
        // Generate file and trigger download
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        saveAs(blob, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
        console.error('Error generating Excel file:', error);
    }
};

// Memoized chart component to prevent re-renders
const ChartModal = React.memo(({ data, config, title }: { data: any[], config: ChartConfig, title: string }) => {
    return (
        <div className="w-full min-h-[250px] p-4 flex justify-center">
            <ChartContainer config={config}>
                <BarChart 
                    accessibilityLayer 
                    data={data}
                    width={Math.max(300, data.length * 100)} // Adjusted width for contractor display
                    height={250} // Smaller height
                    margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
                >
                    <XAxis
                        dataKey="label"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        angle={0}
                        textAnchor="middle"
                        height={60}
                        tickFormatter={(value) => {
                            return value; // Contractor name
                        }} />
                    <Bar
                        dataKey="m"
                        stackId="a"
                        fill="var(--color-m)"
                        radius={[0, 0, 4, 4]} />
                    <Bar
                        dataKey="f"
                        stackId="a"
                        fill="var(--color-f)"
                        radius={[4, 4, 0, 0]} />
                    <ChartTooltip
                        content={<ChartTooltipContent
                            hideLabel
                            className="w-[180px]"
                            formatter={(value, name, item, index) => (
                                <>
                                    <div
                                        className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                                        style={{
                                            "--color-bg": `var(--color-${name})`,
                                        } as React.CSSProperties} />
                                    {config[name as keyof typeof config]?.label ||
                                        name}
                                    <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                        {value}
                                    </div>
                                    {/* Add this after the last item */}
                                    {index === 1 && (
                                        <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium text-foreground">
                                            Total :
                                            <span className="font-normal text-muted-foreground">
                                                {item.payload.label}
                                            </span>
                                            <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                                {item.payload.m + item.payload.f}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )} />}
                        cursor={false}
                        defaultIndex={1} />
                </BarChart>
            </ChartContainer>
        </div>
    );
});

ChartModal.displayName = 'ChartModal';

// Separate Modal Component to prevent re-rendering issues
const ModalPortal = React.memo(({ 
    isOpen, 
    onClose, 
    title, 
    children
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    title: string; 
    children: React.ReactNode;
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-in fade-in duration-200"
            onClick={onClose}
        >
                    <div 
            className="modal-content bg-white p-4 rounded-lg shadow-lg w-[90%] max-w-4xl max-h-[80vh] animate-in slide-in-from-bottom-4 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
        >
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-md transition-colors"
                    >
                        ✕
                    </button>
                </div>
                <div className="flex-1 min-h-0">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
});

ModalPortal.displayName = 'ModalPortal';

const chartData1 = [
    { m: 450, f: 300 },
    { m: 380, f: 420 },
    { m: 520, f: 120 },
]

const chartConfig1 = {
    m: {
        label: "Male",
        color: "rgb(59, 130, 246)",
    },
    f: {
        label: "Female",
        color: "rgb(191, 219, 254)",
    },
} satisfies ChartConfig

interface ContractorMetricCardProps {
    icon: typeof LucideIcon;
    title: string;
    value: number;
    change: number;
    chartColor: string;
    className?: string;
    cardType?: 'employee-table' | 'chart-data'; // New prop to determine modal content
    attendanceType?: 'present' | 'absent' | 'lateIn' | 'earlyOut'; // New prop for attendance type
    selectedContractor: string; // New prop for contractor filtering
}

export const ContractorMetricCard: React.FC<ContractorMetricCardProps> = ({
    icon: Icon,
    title,
    value,
    change,
    chartColor,
    className = '',
    cardType = 'chart-data', // Default to chart data
    attendanceType = 'present', // Default to present
    selectedContractor
}) => {
    const formatValue = (num: number) => {
        return num.toLocaleString();
    };
    const tenantCode = useGetTenantCode();

    const generateChartBars = () => {
        const heights = [40, 25, 35, 60, 45];
        
        // Get color based on attendance type
        let barColor = chartColor;
        if (attendanceType === 'absent') {
            barColor = 'bg-red-400';
        } else if (attendanceType === 'lateIn') {
            barColor = 'bg-orange-400';
        } else if (attendanceType === 'earlyOut') {
            barColor = 'bg-purple-400';
        } else if (attendanceType === 'present') {
            barColor = 'bg-green-400';
        }
        
        return heights.map((height, index) => (
            <div
                key={index}
                className={`${barColor} rounded-sm transition-all duration-300 hover:opacity-80`}
                style={{ height: `${height}%`, width: '6px' }}
            />
        ));
    };

    const openPopup = (url: string) => {
        window.open(
            url,
            "popup",
            "width=800,height=500,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no",
        )
    }
    const [showModal, setShowModal] = useState(false);
    const [stats, setStats] = useState({ total: 0, present: 0 })
    const [shiftCodes, setShiftCodes] = useState<string[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [employeeData, setEmployeeData] = useState<any[]>([]);
    
    // Additional state for attendance data and chart
    const [presentData, setPresentData] = useState<number>(0);
    const [absentData, setAbsentData] = useState<number>(0);
    const [lateInData, setLateInData] = useState<number>(0);
    const [earlyOutData, setEarlyOutData] = useState<number>(0);
    const [maleData, setMaleData] = useState<number>(0);
    const [femaleData, setFemaleData] = useState<number>(0);
    const [uniqueShiftCodes, setUniqueShiftCodes] = useState<string[]>([]);
    const [uniqueShiftCodesCount, setUniqueShiftCodesCount] = useState<number>(0);
    const [shiftCodeStats, setShiftCodeStats] = useState<{[key: string]: {male: number, female: number}}>({});
    const [chartData, setChartData] = useState(chartData1);
    const { employeeIds, employeesLite, loading: hLoading, error: hError, hierarchyFilters } = useEmpHierarchy()
    const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()

    // Centralized user entitlement for contractor metrics
    const userEntitlement = useUserEntitlement(loginEmployeeId, hierarchyFilters)

    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];

    const attendanceApi: any = {
        hierarchyFilters: {
            ...(hierarchyFilters?.subsidiaries && hierarchyFilters.subsidiaries.length > 0 && { subsidiary: hierarchyFilters.subsidiaries }),
            ...(hierarchyFilters?.divisions && hierarchyFilters.divisions.length > 0 && { division: hierarchyFilters.divisions }),
            ...(hierarchyFilters?.departments && hierarchyFilters.departments.length > 0 && { department: hierarchyFilters.departments }),
            ...(hierarchyFilters?.contractors && hierarchyFilters.contractors.length > 0 && { contractor: hierarchyFilters.contractors }),
            ...(hierarchyFilters?.locations && hierarchyFilters.locations.length > 0 && { location: hierarchyFilters.locations }),
        },
        criteriaRequests: [
            {
                "field": "attendanceDate",
                "operator": "eq",
                "value": formattedToday
            },
            {
                "field": "deployment.contractor.contractorCode",
                "operator": "eq",
                "value": selectedContractor
            },
            {
                "field": "tenantCode",
                "operator": "eq",
                "value": tenantCode
            }
        ],
        userEntitlement: userEntitlement,
    }

    // Use useRequest hook for fetching attendance data with contractor filter
    const {
        data: attendanceResponse,
        loading: isLoadingAttendance,
        error: attendanceError,
        refetch: fetchAttendanceData
    } = useRequest<any[]>({
        url: 'muster/liveAttendance/searchWithHierarchy',
        method: 'POST',
        data: attendanceApi,
        onSuccess: (data) => {

            // Filter data based on attendance type
            let filteredResult = data;
            if (attendanceType === 'present') {
                filteredResult = data.filter((item: { present: boolean; }) => item.present === true);
            } else if (attendanceType === 'absent') {
                filteredResult = data.filter((item: { absent: boolean; }) => item.absent === true);
            } else if (attendanceType === 'lateIn') {
                filteredResult = data.filter((item: { lateIn: boolean; }) => item.lateIn === true);
            } else if (attendanceType === 'earlyOut') {
                filteredResult = data.filter((item: { earlyOut: boolean; }) => item.earlyOut === true);
            }


            setPresentData(data.filter((item: { present: boolean; }) => item.present === true).length);
            setAbsentData(data.filter((item: { absent: boolean; }) => item.absent === true).length);
            setLateInData(data.filter((item: { lateIn: boolean; }) => item.lateIn === true).length);
            setEarlyOutData(data.filter((item: { earlyOut: boolean; }) => item.earlyOut === true).length);
                         
            const shiftCodes = filteredResult.map((entry: { shiftCode: string; }) => entry.shiftCode);
            const unique = Array.from(new Set(shiftCodes)) as string[];
            setUniqueShiftCodes(unique);
            setUniqueShiftCodesCount(unique.length);

            // Calculate male and female count for each shift code based on filtered data
            const shiftStats: {[key: string]: {male: number, female: number}} = {};
            
            unique.forEach(shiftCode => {
                const shiftEmployees = filteredResult.filter((item: { shiftCode: string; }) => item.shiftCode === shiftCode);
                const maleCount = shiftEmployees.filter((item: { gender: string; }) => item.gender === "Male").length;
                const femaleCount = shiftEmployees.filter((item: { gender: string; }) => item.gender === "Female").length;
                
                shiftStats[shiftCode] = {
                    male: maleCount,
                    female: femaleCount
                };
            });
            
            setShiftCodeStats(shiftStats);

            // Generate chart data showing contractor name instead of shift codes
            const totalMale = filteredResult.filter((item: { gender: string; }) => item.gender === "Male").length;
            const totalFemale = filteredResult.filter((item: { gender: string; }) => item.gender === "Female").length;
            
            const newChartData = [{
                label: selectedContractor, // Show contractor name instead of shift codes
                m: totalMale,
                f: totalFemale
            }];

            setChartData(newChartData);
        },
        onError: (error) => {
            console.error("Error fetching contractor attendance data:", error);
        },
        dependencies: [attendanceType, selectedContractor, formattedToday, tenantCode, hierarchyFilters]
    });

    const employeeListApi: any = {
        hierarchyFilters: {
            ...(hierarchyFilters?.subsidiaries && hierarchyFilters.subsidiaries.length > 0 && { subsidiary: hierarchyFilters.subsidiaries }),
            ...(hierarchyFilters?.divisions && hierarchyFilters.divisions.length > 0 && { division: hierarchyFilters.divisions }),
            ...(hierarchyFilters?.departments && hierarchyFilters.departments.length > 0 && { department: hierarchyFilters.departments }),
            ...(hierarchyFilters?.contractors && hierarchyFilters.contractors.length > 0 && { contractor: hierarchyFilters.contractors }),
            ...(hierarchyFilters?.locations && hierarchyFilters.locations.length > 0 && { location: hierarchyFilters.locations }),
        },
        criteriaRequests: [
            {
                "field": "attendanceDate",
                "operator": "eq",
                "value": formattedToday
            },
            {
                "field": "deployment.contractor.contractorCode",
                "operator": "eq",
                "value": selectedContractor
            },
            {
                "field": "insidePremises",
                "operator": "eq",
                "value": true
            },
            {
                "field": "tenantCode",
                "operator": "eq",
                "value": tenantCode
            }
        ],
        userEntitlement: userEntitlement,
    }

    // Use useRequest hook for fetching employee data with contractor filter
    const {
        data: employeeResponse,
        loading: isLoadingEmployees,
        error: employeeError,
        refetch: fetchEmployeeData
    } = useRequest<any[]>({
        url: 'muster/liveAttendance/searchWithHierarchy',
        method: 'POST',
        data: employeeListApi,
        onSuccess: (data) => {
            
            // Check if data is an array and has items
            if (!Array.isArray(data) || data.length === 0) {
                console.warn("No contractor employee data received or data is not an array");
                setEmployeeData([]);
                return;
            }
            
            // Log the first employee object to see its structure
            
            // Filter data to show only required columns
            const filteredData = data.map((employee: any, index: number) => {
                
                // Try multiple possible field names for each property
                const employeeId = employee.employeeId || employee.employee_id || employee.id || employee.empId || employee.emp_id || employee.employeeID || '';
                const firstName = employee.firstName || employee.first_name || employee.fname || employee.firstname || '';
                const middleName = employee.middleName || employee.middle_name || employee.mname || employee.middlename || '';
                const lastName = employee.lastName || employee.last_name || employee.lname || employee.lastname || '';
                const shiftCode = employee.shiftCode || employee.shift_code || employee.shift || employee.shiftcode || '';
                
                const mappedEmployee = {
                    employeeId,
                    firstName,
                    middleName,
                    lastName,
                    shiftCode
                };
                
                return mappedEmployee;
            });
            
            setEmployeeData(filteredData);
        },
        onError: (error) => {
            console.error("Error fetching contractor employee data:", error);
            // Fallback to empty array if API fails
            setEmployeeData([]);
        },
        dependencies: [selectedContractor, formattedToday, tenantCode, hierarchyFilters]
    });

    const handleModalOpen = useCallback(() => {
        setShowModal(true);
        // Fetch employee data when modal opens if it's an employee table
        if (cardType === 'employee-table' && employeeData.length === 0) {
            fetchEmployeeData();
        }
        // Fetch attendance data when modal opens if it's chart data
        if (cardType === 'chart-data') {
            fetchAttendanceData();
        }
    }, [cardType, employeeData.length, fetchAttendanceData, fetchEmployeeData]);

    const handleModalClose = useCallback(() => {
        setShowModal(false);
    }, []);

    // Effect to set client-side rendering
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Effect to disable hover effects when modal is open
    useEffect(() => {
        if (showModal) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }

        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [showModal]);

    // Memoized functionality list to prevent re-renders
    const tableFunctionalityList = useMemo(() => ({
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
                status: false,
            },
            handleRenameColumn: {
                status: false,
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
                status: true,
            },
        },

    }), []);

    const chartData2 = shiftCodes.map((code, index) => ({
        label: code,//.replace(/^A0*/, 'A'), // Convert A001 → A1, A002 → A2, etc.
        ...chartData1[index]
    }));

    // Memoized chart configuration based on attendance type
    const chartConfig = useMemo(() => {
        const baseConfig = {
            m: {
                label: "Male",
                color: "rgb(59, 130, 246)",
            },
            f: {
                label: "Female",
                color: "rgb(191, 219, 254)",
            },
        };

        // Customize colors based on attendance type
        if (attendanceType === 'absent') {
            return {
                m: {
                    label: "Male",
                    color: "rgb(239, 68, 68)", // Red for absent
                },
                f: {
                    label: "Female",
                    color: "rgb(254, 202, 202)", // Light red for absent
                },
            };
        } else if (attendanceType === 'lateIn') {
            return {
                m: {
                    label: "Male",
                    color: "rgb(245, 158, 11)", // Orange for late in
                },
                f: {
                    label: "Female",
                    color: "rgb(254, 215, 170)", // Light orange for late in
                },
            };
        } else if (attendanceType === 'earlyOut') {
            return {
                m: {
                    label: "Male",
                    color: "rgb(168, 85, 247)", // Purple for early out
                },
                f: {
                    label: "Female",
                    color: "rgb(233, 213, 255)", // Light purple for early out
                },
            };
        }

        return baseConfig;
    }, [attendanceType]);

    // Determine modal title based on card type and contractor
    const getModalTitle = () => {
        if (cardType === 'employee-table') {
            return `Contractor ${selectedContractor} - Employee List`;
        } else {
            const attendanceTypeLabel = attendanceType ? 
                attendanceType.charAt(0).toUpperCase() + attendanceType.slice(1).replace(/([A-Z])/g, ' $1') : 
                'Chart';
            return `Contractor ${selectedContractor} - ${title} - ${attendanceTypeLabel} Data`;
        }
    };

    // Memoized modal content to prevent re-renders
    const modalContent = useMemo(() => {
        if (cardType === 'employee-table') {
            return (
                <div className="flex flex-col h-full">
                    {isLoadingEmployees ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-lg text-gray-600">Loading contractor employee data...</div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Table container with proper scrolling */}
                            <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 border border-gray-200 rounded-lg" style={{ maxHeight: 'calc(70vh - 120px)' }}>
                                <div className="min-w-full">
                                    <Table 
                                        data={employeeData} 
                                        functionalityList={tableFunctionalityList}
                                    />
                                </div>
                            </div>
                            {/* Download buttons - always visible at bottom */}
                            <div className="pt-4 border-t border-gray-200 flex justify-between items-center mt-4 flex-shrink-0 bg-white">
                                <div className="text-sm text-gray-600">
                                    {employeeData.length === 0 ? `No employee data available for contractor ${selectedContractor}` : `${employeeData.length} employee(s) found in contractor ${selectedContractor}`}
                                </div>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => generateExcel(employeeData, `Contractor ${selectedContractor} Employee List`)}
                                        disabled={employeeData.length === 0}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download Excel
                                    </button>
                                    <button
                                        onClick={() => generatePDF(employeeData, `Contractor ${selectedContractor} Employee List`)}
                                        disabled={employeeData.length === 0}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Download PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        } else {
            return (
                <div className="overflow-auto max-h-[70vh]">
                    <div className="min-w-[400px] flex justify-center">
                        <ChartModal 
                            data={chartData} 
                            config={chartConfig}
                            title={`Contractor ${selectedContractor} - ${title}`}
                        />
                    </div>
                </div>
            );
        }
    }, [cardType, chartData, title, employeeData, isLoadingEmployees, tableFunctionalityList, chartConfig, selectedContractor]);

    return (

        <div className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${className}`}>

            <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                    <Icon size={28} className="text-white" />
                </div>

                <div className="text-right">
                    <div className="text-3xl font-bold">{formatValue(value)}</div>
                </div>

                <Button onClick={handleModalOpen} className="gap-2 bg-blue-500">
                    <ExternalLink size={10} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                </Button>

                {/* Modal Portal */}
                {isClient && (
                    <ModalPortal
                        isOpen={showModal}
                        onClose={handleModalClose}
                        title={getModalTitle()}
                    >
                        {modalContent}
                    </ModalPortal>
                )}

            </div>

            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white/90">{title}</h3>

                <div className="flex items-center text-sm">
                    <span className="text-white/80">
                        Among {formatValue(change)} Employees in Contractor {selectedContractor}
                    </span>
                </div>
            </div>
        </div>
    );
};
