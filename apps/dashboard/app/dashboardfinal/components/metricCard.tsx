import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowUpRight, ExternalLink, DivideIcon as LucideIcon, Download, FileText } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import PresentAbsent from './presentabsent';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { CheckCircle, XCircle, Clock, ArrowUpIcon as ClockArrowUp, LogOut, UserX } from "lucide-react"
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
        <div className="w-full min-h-[200px] p-4 flex justify-center">
            <ChartContainer config={config}>
                <BarChart 
                    accessibilityLayer 
                    data={data}
                    width={Math.max(360, data.length * 45)} // Smaller dynamic width
                    height={200} // Smaller height
                    margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
                >
                    <XAxis
                        dataKey="label"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tickFormatter={(value) => {
                            return value;
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


interface MetricCardProps {
    icon: typeof LucideIcon;
    title: string;
    value: number;
    change: number;
    chartColor: string;
    className?: string;
    cardType?: 'employee-table' | 'chart-data'; // New prop to determine modal content
    attendanceType?: 'present' | 'absent' | 'lateIn' | 'earlyOut'; // New prop for attendance type
    onOpenExternal?: () => void; // Optional callback to override modal open
}

export const MetricCard: React.FC<MetricCardProps> = ({
    icon: Icon,
    title,
    value,
    change,
    chartColor,
    className = '',
    cardType = 'chart-data', // Default to chart data
    attendanceType = 'present', // Default to present
    onOpenExternal
}) => {
    const formatValue = (num: number) => {
        return num.toLocaleString();
    };
    const { employeeIds, employeesLite, loading: hLoading, error: hError, hierarchyFilters } = useEmpHierarchy()
    const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
    // Centralized user entitlement for main metric cards
    const userEntitlement = useUserEntitlement(loginEmployeeId, hierarchyFilters)


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
    const tenantCode = useGetTenantCode();

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
                "field": "tenantCode",
                "operator": "eq",
                "value": tenantCode
            }
        ],
        userEntitlement: userEntitlement,
    }

    // Use useRequest hook for fetching attendance data
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
            if (!Array.isArray(data)) return;
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

            // Generate chart data from actual shift codes
            const newChartData = unique.map(shiftCode => ({
                label: shiftCode,
                m: shiftStats[shiftCode]?.male || 0,
                f: shiftStats[shiftCode]?.female || 0
            }));

            setChartData(newChartData);
        },  
        onError: (error) => {
            console.error("Error fetching attendance data:", error);
        },
        dependencies: [attendanceType, formattedToday, tenantCode, hierarchyFilters]
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

    // Use useRequest hook for fetching employee data
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
            if (!Array.isArray(data)) {
                console.warn("No employee data received or data is not an array");
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
            console.error("Error fetching employee data:", error);
            // Fallback to empty array if API fails
            // Keep previous data to avoid UI reset
        },
        dependencies: [formattedToday, tenantCode, hierarchyFilters]
    });

    const handleModalOpen = useCallback(() => {
        if (onOpenExternal) {
            onOpenExternal();
            return;
        }
        setShowModal(true);
        if (!employeeIds || (Array.isArray(employeeIds) && employeeIds.length === 0) || !tenantCode) {
            return;
        }
        if (cardType === 'employee-table' && employeeData.length === 0) {
            fetchEmployeeData();
        }
        if (cardType === 'chart-data') {
            fetchAttendanceData();
        }
    }, [cardType, employeeData.length, fetchAttendanceData, fetchEmployeeData, onOpenExternal, employeeIds, tenantCode]);

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
        // Match pastel accent colors used by the cards
        const baseConfig = {
            m: { label: "Male", color: "rgb(56, 189, 248)" }, // sky-400
            f: { label: "Female", color: "rgb(224, 242, 254)" }, // sky-100
        };

        if (attendanceType === 'present') {
            return {
                m: { label: "Male", color: "rgb(52, 211, 153)" }, // emerald-400
                f: { label: "Female", color: "rgb(209, 250, 229)" }, // emerald-100
            };
        }

        if (attendanceType === 'absent') {
            return {
                m: { label: "Male", color: "rgb(251, 113, 133)" }, // rose-400
                f: { label: "Female", color: "rgb(254, 226, 226)" }, // rose-100
            };
        }

        if (attendanceType === 'lateIn') {
            return {
                m: { label: "Male", color: "rgb(251, 191, 36)" }, // amber-400
                f: { label: "Female", color: "rgb(254, 243, 199)" }, // amber-100
            };
        }

        if (attendanceType === 'earlyOut') {
            return {
                m: { label: "Male", color: "rgb(167, 139, 250)" }, // violet-400
                f: { label: "Female", color: "rgb(237, 233, 254)" }, // violet-100
            };
        }

        return baseConfig;
    }, [attendanceType]);

    // Determine modal title based on card type
    const getModalTitle = () => {
        if (cardType === 'employee-table') {
            return 'Employee List';
        } else {
            const attendanceTypeLabel = attendanceType ? 
                attendanceType.charAt(0).toUpperCase() + attendanceType.slice(1).replace(/([A-Z])/g, ' $1') : 
                'Chart';
            return `${title} - ${attendanceTypeLabel} Data`;
        }
    };

    // Memoized modal content to prevent re-renders
    const modalContent = useMemo(() => {
        if (cardType === 'employee-table') {
            return (
                <div className="flex flex-col h-full">
                    {isLoadingEmployees ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-lg text-gray-600">Loading employee data...</div>
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
                                    {employeeData.length === 0 ? 'No employee data available' : `${employeeData.length} employee(s) found`}
                                </div>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => generateExcel(employeeData, 'Employee List')}
                                        disabled={employeeData.length === 0}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download Excel
                                    </button>
                                    <button
                                        onClick={() => generatePDF(employeeData, 'Employee List')}
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
                    <div className="min-w-[360px] flex justify-center">
                        <ChartModal 
                            data={chartData} 
                            config={chartConfig}
                            title={title}
                        />
                    </div>
                </div>
            );
        }
    }, [cardType, chartData, title, employeeData, isLoadingEmployees, tableFunctionalityList, chartConfig]);

    const getCardGradient = () => {
        // Softer, pastel gradients matching the reference design
        switch (chartColor) {
            case 'bg-blue-500':
                return 'bg-gradient-to-br from-sky-50 to-sky-100';
            case 'bg-green-500':
                return 'bg-gradient-to-br from-emerald-50 to-emerald-100';
            case 'bg-red-500':
                return 'bg-gradient-to-br from-rose-50 to-rose-100';
            case 'bg-orange-500':
                return 'bg-gradient-to-br from-amber-50 to-amber-100';
            case 'bg-purple-500':
                return 'bg-gradient-to-br from-violet-50 to-violet-100';
            default:
                return 'bg-gradient-to-br from-sky-50 to-sky-100';
        }
    };

    const getAccentTextColor = () => {
        switch (chartColor) {
            case 'bg-green-500':
                return 'text-emerald-600';
            case 'bg-red-500':
                return 'text-rose-600';
            case 'bg-orange-500':
                return 'text-amber-600';
            case 'bg-purple-500':
                return 'text-violet-600';
            case 'bg-blue-500':
            default:
                return 'text-sky-700';
        }
    };

    const getIconWrapper = () => {
        switch (chartColor) {
            case 'bg-green-500':
                return 'bg-emerald-100 text-emerald-600';
            case 'bg-red-500':
                return 'bg-rose-100 text-rose-600';
            case 'bg-orange-500':
                return 'bg-amber-100 text-amber-600';
            case 'bg-purple-500':
                return 'bg-violet-100 text-violet-600';
            case 'bg-blue-500':
            default:
                return 'bg-sky-100 text-sky-700';
        }
    };

    const getCardBorder = () => {
        switch (chartColor) {
            case 'bg-green-500':
                return 'border-emerald-200';
            case 'bg-red-500':
                return 'border-rose-200';
            case 'bg-orange-500':
                return 'border-amber-200';
            case 'bg-purple-500':
                return 'border-violet-200';
            case 'bg-blue-500':
            default:
                return 'border-sky-200';
        }
    };

    return (

        <div
            className={`${getCardGradient()} rounded-2xl p-6 border ${getCardBorder()} shadow-sm ${onOpenExternal ? 'cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500' : ''} ${className}`}
            onClick={onOpenExternal ? handleModalOpen : undefined}
            onKeyDown={(event) => {
                if (!onOpenExternal) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleModalOpen();
                }
            }}
            role={onOpenExternal ? 'button' : undefined}
            tabIndex={onOpenExternal ? 0 : undefined}
        >

            <div className="flex items-center justify-between mb-4">
                <div className={`${getIconWrapper()} p-3 rounded-lg`}>
                    <Icon size={20} />
                </div>

                <div className="text-right">
                    <div className={`text-3xl font-bold ${getAccentTextColor()}`}>{formatValue(value)}</div>
                </div>

                {/* <Button onClick={handleModalOpen} className="gap-2 bg-slate-800 text-white hover:bg-slate-900">
                    <ExternalLink size={12} className="opacity-80" />
                </Button> */}

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
                <h3 className="text-lg font-semibold text-slate-800">{title}</h3>


                <div className="flex items-center text-sm">
                    <span className="text-slate-600">
                        Among {formatValue(change)} Employees
                    </span>

                </div>
            </div>
        </div>
    );
};


//  {/* Mini Chart */}
//  <div className="flex items-end space-x-1 h-16 ml-4">
//         {generateChartBars()}
//     </div>

export interface AttendanceShiftSelection {
    shiftCode?: string;
    shiftGroupCode?: string;
}

interface AttendanceShiftChartRow {
    label: string;
    m: number;
    f: number;
    shiftCode?: string;
    shiftGroupCode?: string;
}

// Reusable inline attendance chart that mirrors the modal chart behavior
export const AttendanceShiftChart: React.FC<{
    title: string;
    attendanceType: 'present' | 'absent' | 'lateIn' | 'earlyOut';
    refreshToken?: number;
    selectedDepartment?: string;
    selectedContractor?: string;
    selectedWorkOrder?: string;
    groupByShift?: boolean;
    onCardClick?: () => void;
    onBarClick?: (selection: AttendanceShiftSelection) => void;
}> = React.memo(({ title, attendanceType, refreshToken = 0, selectedDepartment, selectedContractor, selectedWorkOrder, groupByShift = false, onCardClick, onBarClick }) => {
    const [chartData, setChartData] = useState<AttendanceShiftChartRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const totals = useMemo(() => {
        const male = chartData.reduce((s, r) => s + (r.m || 0), 0);
        const female = chartData.reduce((s, r) => s + (r.f || 0), 0);
        const total = male + female;
        const shifts = chartData.length;
        return { male, female, total, shifts };
    }, [chartData]);
    const topShift = useMemo(() => {
        if (!chartData.length) return null as null | { label: string; total: number };
        const sorted = [...chartData]
            .map((r) => ({ label: r.label, total: (r.m || 0) + (r.f || 0) }))
            .sort((a, b) => b.total - a.total);
        return sorted[0] || null;
    }, [chartData]);
    const avgPerShift = useMemo(() => {
        return totals.shifts > 0 ? Math.round(totals.total / totals.shifts) : 0;
    }, [totals.total, totals.shifts]);
    const { employeeIds, employeesLite, loading: hLoading, error: hError, hierarchyFilters } = useEmpHierarchy()
    const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
    const userEntitlement = useUserEntitlement(loginEmployeeId, hierarchyFilters)
    const tenantCode = useGetTenantCode();

    const chartConfig = useMemo(() => {
        // Mirror the modal chart colors exactly
        if (attendanceType === 'present') {
            return {
                m: { label: 'Male', color: 'rgb(52, 211, 153)' }, // emerald-400
                f: { label: 'Female', color: 'rgb(209, 250, 229)' }, // emerald-100
            } as ChartConfig;
        }
        if (attendanceType === 'absent') {
            return {
                m: { label: 'Male', color: 'rgb(251, 113, 133)' }, // rose-400
                f: { label: 'Female', color: 'rgb(254, 226, 226)' }, // rose-100
            } as ChartConfig;
        }
        if (attendanceType === 'lateIn') {
            return {
                m: { label: 'Male', color: 'rgb(251, 191, 36)' }, // amber-400
                f: { label: 'Female', color: 'rgb(254, 243, 199)' }, // amber-100
            } as ChartConfig;
        }
        if (attendanceType === 'earlyOut') {
            return {
                m: { label: 'Male', color: 'rgb(167, 139, 250)' }, // violet-400
                f: { label: 'Female', color: 'rgb(237, 233, 254)' }, // violet-100
            } as ChartConfig;
        }
        return {
            m: { label: 'Male', color: 'rgb(56, 189, 248)' }, // sky-400
            f: { label: 'Female', color: 'rgb(224, 242, 254)' }, // sky-100
        } as ChartConfig;
    }, [attendanceType]);
    const getBarSelection = useCallback((payload: AttendanceShiftChartRow | undefined): AttendanceShiftSelection => ({
        shiftCode: payload?.shiftCode || ((!selectedDepartment && !selectedContractor && !selectedWorkOrder) || groupByShift ? payload?.label : undefined),
        shiftGroupCode: payload?.shiftGroupCode,
    }), [groupByShift, selectedDepartment, selectedContractor, selectedWorkOrder]);

    const renderBarClickBackground = useCallback((props: any) => {
        const { x, y, width, height, payload } = props;
        return (
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="transparent"
                cursor="pointer"
                onClick={(event) => {
                    event.stopPropagation();
                    onBarClick?.(getBarSelection(payload));
                }}
            />
        );
    }, [getBarSelection, onBarClick]);

    const processData = useCallback((data: any[]) => {
        let filtered = data;
        if (attendanceType === 'present') filtered = data.filter((x: any) => x.present === true);
        else if (attendanceType === 'absent') filtered = data.filter((x: any) => x.absent === true);
        else if (attendanceType === 'lateIn') filtered = data.filter((x: any) => x.lateIn === true);
        else if (attendanceType === 'earlyOut') filtered = data.filter((x: any) => x.earlyOut === true);

        // If department is selected, show department name instead of shift codes
        if (selectedDepartment && !groupByShift) {
            const maleCount = filtered.filter((e: any) => e.gender === 'Male').length;
            const femaleCount = filtered.filter((e: any) => e.gender === 'Female').length;
            return [{
                label: selectedDepartment,
                m: maleCount,
                f: femaleCount,
            }];
        }

        // If contractor is selected, show contractor name instead of shift codes
        if (selectedContractor && !groupByShift) {
            const maleCount = filtered.filter((e: any) => e.gender === 'Male').length;
            const femaleCount = filtered.filter((e: any) => e.gender === 'Female').length;
            return [{
                label: selectedContractor,
                m: maleCount,
                f: femaleCount,
            }];
        }

        // If work order is selected, show work order name instead of shift codes
        if (selectedWorkOrder && !groupByShift) {
            const maleCount = filtered.filter((e: any) => e.gender === 'Male').length;
            const femaleCount = filtered.filter((e: any) => e.gender === 'Female').length;
            return [{
                label: selectedWorkOrder,
                m: maleCount,
                f: femaleCount,
            }];
        }

        const shiftGroups = Array.from(
            new Map(filtered.map((e: any) => {
                const shiftCode = e.shiftCode || 'NA';
                const shiftGroupCode = e.shiftGroupCode || '';
                return [`${shiftGroupCode}::${shiftCode}`, { shiftCode, shiftGroupCode }];
            })).values()
        ) as Array<{ shiftCode: string; shiftGroupCode: string }>;
        const shiftStats: { [key: string]: { male: number; female: number } } = {};
        shiftGroups.forEach(({ shiftCode, shiftGroupCode }) => {
            const key = `${shiftGroupCode}::${shiftCode}`;
            const employees = filtered.filter((e: any) => (e.shiftCode || 'NA') === shiftCode && (e.shiftGroupCode || '') === shiftGroupCode);
            shiftStats[key] = {
                male: employees.filter((e: any) => e.gender === 'Male').length,
                female: employees.filter((e: any) => e.gender === 'Female').length,
            };
        });
        return shiftGroups.map(({ shiftCode, shiftGroupCode }) => ({
            label: shiftCode,
            shiftCode: shiftCode === 'NA' ? undefined : shiftCode,
            shiftGroupCode: shiftGroupCode || undefined,
            m: shiftStats[`${shiftGroupCode}::${shiftCode}`]?.male || 0,
            f: shiftStats[`${shiftGroupCode}::${shiftCode}`]?.female || 0,
        }));
    }, [attendanceType, groupByShift, selectedDepartment, selectedContractor, selectedWorkOrder]);

    const todayDate = new Date().toISOString().split('T')[0];
    const attendanceChartApi: any = {
        hierarchyFilters: {
            ...(hierarchyFilters?.subsidiaries && hierarchyFilters.subsidiaries.length > 0 && { subsidiary: hierarchyFilters.subsidiaries }),
            ...(hierarchyFilters?.divisions && hierarchyFilters.divisions.length > 0 && { division: hierarchyFilters.divisions }),
            ...(hierarchyFilters?.departments && hierarchyFilters.departments.length > 0 && { department: hierarchyFilters.departments }),
            ...(hierarchyFilters?.contractors && hierarchyFilters.contractors.length > 0 && { contractor: hierarchyFilters.contractors }),
            ...(hierarchyFilters?.locations && hierarchyFilters.locations.length > 0 && { location: hierarchyFilters.locations }),
        },
        criteriaRequests: [
            {
                field: 'attendanceDate',
                operator: 'eq',
                value: todayDate,
            },
            ...(selectedDepartment ? [{
                field: 'deployment.department.departmentCode',
                operator: 'eq',
                value: selectedDepartment,
            }] as any[] : []),
            ...(selectedContractor ? [{
                field: 'deployment.contractor.contractorCode',
                operator: 'eq',
                value: selectedContractor,
            }] as any[] : []),
            ...(selectedWorkOrder ? [{
                field: 'workOrderNumber',
                operator: 'eq',
                value: selectedWorkOrder,
            }] as any[] : []),
            {
                "field": "tenantCode",
                "operator": "eq",
                "value": tenantCode
            }
        ],
        userEntitlement: userEntitlement,
    }

    const { refetch: fetchAttendanceData } = useRequest<any[]>({
        url: 'muster/liveAttendance/searchWithHierarchy',
        method: 'POST',
        data: attendanceChartApi,
        onSuccess: (data) => {
            const newChartData = processData(data);
            setChartData(newChartData);
            setIsLoading(false);
            setLastUpdated(new Date());
        },
        onError: (err) => {
            console.error('Attendance fetch failed', err);
            setChartData([]);
            setIsLoading(false);
        },
        dependencies: [attendanceType, selectedDepartment, selectedContractor, selectedWorkOrder, todayDate, tenantCode, hierarchyFilters],
    });

    useEffect(() => {
        setIsLoading(true);
        fetchAttendanceData();
    }, [attendanceType, refreshToken, selectedDepartment, selectedContractor, selectedWorkOrder]);

    return (
        <div
            className={`bg-white rounded-lg border p-4 ${onCardClick ? 'cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500' : ''}`}
            onClick={onCardClick}
            onKeyDown={(event) => {
                if (!onCardClick) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onCardClick();
                }
            }}
            role={onCardClick ? 'button' : undefined}
            tabIndex={onCardClick ? 0 : undefined}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={`${attendanceType === 'present' ? 'bg-emerald-100 text-emerald-600' : attendanceType === 'absent' ? 'bg-rose-100 text-rose-600' : attendanceType === 'lateIn' ? 'bg-amber-100 text-amber-600' : 'bg-violet-100 text-violet-600'} p-2 rounded-md`}>
                        {attendanceType === 'present' && <CheckCircle className="h-4 w-4" />}
                        {attendanceType === 'absent' && <UserX className="h-4 w-4" />}
                        {attendanceType === 'lateIn' && <Clock className="h-4 w-4" />}
                        {attendanceType === 'earlyOut' && <LogOut className="h-4 w-4" />}
                    </div>
                    <div className="text-sm font-medium">{title}</div>
                </div>
                <div className="hidden md:flex items-center gap-2 text-[11px] text-gray-600">
                    <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1">Total: <span className="font-semibold text-gray-900">{totals.total}</span></div>
                    {!selectedDepartment && !selectedContractor && !selectedWorkOrder && (
                        <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1">Shifts: <span className="font-semibold text-gray-900">{totals.shifts}</span></div>
                    )}
                    <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1">M: <span className="font-semibold text-gray-900">{totals.male}</span></div>
                    <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1">F: <span className="font-semibold text-gray-900">{totals.female}</span></div>
                    {!selectedDepartment && !selectedContractor && !selectedWorkOrder && topShift && (
                        <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1">Top: <span className="font-semibold text-gray-900">{topShift.label}</span> <span className="text-gray-500">({topShift.total})</span></div>
                    )}
                    {lastUpdated && (
                        <div className="text-gray-500">· {lastUpdated.toLocaleTimeString()}</div>
                    )}
                </div>
            </div>
            {isLoading ? (
                <div className="h-[180px] flex items-center justify-center">
                    <div className="text-gray-500">Loading chart data...</div>
                </div>
            ) : (
                <ChartContainer config={chartConfig}>
                    <BarChart
                        accessibilityLayer
                        data={chartData}
                        width={Math.max(360, chartData.length * 45)}
                        height={200}
                        margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
                    >
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <Bar
                            dataKey="m"
                            stackId="a"
                            fill="var(--color-m)"
                            radius={[0, 0, 4, 4]}
                            background={onBarClick ? renderBarClickBackground : undefined}
                            className={onBarClick ? 'cursor-pointer' : undefined}
                            onClick={onBarClick ? (data: any) => onBarClick(getBarSelection(data?.payload)) : undefined}
                        />
                        <Bar
                            dataKey="f"
                            stackId="a"
                            fill="var(--color-f)"
                            radius={[4, 4, 0, 0]}
                            background={onBarClick ? renderBarClickBackground : undefined}
                            className={onBarClick ? 'cursor-pointer' : undefined}
                            onClick={onBarClick ? (data: any) => onBarClick(getBarSelection(data?.payload)) : undefined}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    hideLabel
                                    className="w-[180px]"
                                    formatter={(value, name, item, index) => (
                                        <>
                                            <div
                                                className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                                                style={{
                                                    "--color-bg": `var(--color-${name})`,
                                                } as React.CSSProperties}
                                            />
                                            {chartConfig[name as keyof typeof chartConfig]?.label || name}
                                            <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                                {value as any}
                                            </div>
                                            {index === 1 && (
                                                <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium text-foreground">
                                                    Total :
                                                    <span className="font-normal text-muted-foreground">{item.payload.label}</span>
                                                    <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                                        {item.payload.m + item.payload.f}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                />
                            }
                            cursor={false}
                            defaultIndex={1}
                        />
                    </BarChart>
                </ChartContainer>
            )}
        </div>
    );
});
