import React, { useEffect, useMemo, useState } from 'react';
import { MetricCard, AttendanceShiftChart, AttendanceShiftSelection } from './metricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { CheckCircle, XCircle, Clock, LogOut, Users, UserX, RefreshCw, Download, FileText } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import Table from '@repo/ui/components/table-dynamic/data-table';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import GoalCard from './GoalCard';
import { useRequest } from '@repo/ui/hooks/api/useGetRequest';
import { useGetTenantCode } from '@/hooks/useGetTenantCode';
import { useEmpHierarchy } from '@/hooks/hierarchy/emp-hierarchy';
import { useKeyclockRoleInfo } from '@/hooks/search/keyclock-role-info';
import { useUserEntitlement } from '@/hooks/hierarchy/useUserEntitlement';
import AddContractEmployeeInfoPopup from './AddContractEmployeeInfoPopup';


interface MetricItem {
    icon: any;
    title: string;
    value: number;
    change: number;
    chartColor: string;
    attendanceType?: 'present' | 'absent' | 'lateIn' | 'earlyOut';
}

export const Cards: React.FC = () => {

    const [organizationData, setOrganizationData] = useState<any>(null);
    let [orgempcount, setOrgempcount] = useState<number>(0);
    let [insidePremisesData, setInsidePremisesData] = useState<number>(0);
    let [presentData, setPresentData] = useState<number>(0);
    let [absentData, setAbsentData] = useState<number>(0);
    let [lateInData, setLateInData] = useState<number>(0);
    let [earlyOutData, setEarlyOutData] = useState<number>(0);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [employeeData, setEmployeeData] = useState<any[]>([]);
    const [insideMale, setInsideMale] = useState<number>(0);
    const [insideFemale, setInsideFemale] = useState<number>(0);
    const [refreshTick, setRefreshTick] = useState<number>(0);
    const [isEmployeeInfoOpen, setIsEmployeeInfoOpen] = useState(false);
    const [selectedAttendanceType, setSelectedAttendanceType] = useState<MetricItem['attendanceType']>();
    const [selectedShift, setSelectedShift] = useState<AttendanceShiftSelection>({});
    const tenantCode = useGetTenantCode();
    const uniqueShiftsInside = useMemo(() => {
        const setCodes = new Set((employeeData || []).map((e: any) => e.shiftCode).filter(Boolean));
        return setCodes.size;
    }, [employeeData]);
    const topShiftsInside = useMemo(() => {
        const counts: Record<string, number> = {};
        (employeeData || []).forEach((e: any) => {
            const code = e.shiftCode || 'NA';
            counts[code] = (counts[code] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([code, count]) => ({ code, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [employeeData]);
    const { employeeIds, employeesLite, loading: hLoading, error: hError, hierarchyFilters } = useEmpHierarchy()
    const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()

    // Centralized user entitlement using shared hook
    const userEntitlement = useUserEntitlement(loginEmployeeId, hierarchyFilters)

    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];


     const api:any={
        hierarchyFilters: {
            ...(hierarchyFilters?.subsidiaries && hierarchyFilters.subsidiaries.length > 0 && { subsidiary: hierarchyFilters.subsidiaries }),
            ...(hierarchyFilters?.divisions && hierarchyFilters.divisions.length > 0 && { division: hierarchyFilters.divisions }),
            ...(hierarchyFilters?.departments && hierarchyFilters.departments.length > 0 && { department: hierarchyFilters.departments }),
            ...(hierarchyFilters?.contractors && hierarchyFilters.contractors.length > 0 && { contractor: hierarchyFilters.contractors }),
            ...(hierarchyFilters?.locations && hierarchyFilters.locations.length > 0 && { location: hierarchyFilters.locations }),
        },
        criteriaRequests: [
            {
                "field": "tenantCode",
                "operator": "eq",
                "value": tenantCode
            }
        ],
        userEntitlement: userEntitlement,
    }


    const {
        data: organizationResponse,
        loading: organizationLoading,
        error: organizationError,
        refetch: fetchOrganization
    } = useRequest<any>({
        url: 'contract_employee/count/searchWithHierarchy',
        method: 'POST',
        data: api,
        onSuccess: (data) => {
            if (typeof data === 'number' && !Number.isNaN(data)) {
                setOrgempcount(data);
            }
        },
        onError: (error) => {
            console.error("Error fetching organization data:", error);
        },
        dependencies: [tenantCode, employeeIds, hierarchyFilters]
    });

    useEffect(() => {
        fetchOrganization();
    }, []);

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

    const {
        data: attendanceResponse,
        loading: attendanceLoading,
        error: attendanceError,
        refetch: fetchAttendance
    } = useRequest<any>({
        url: 'muster/liveAttendance/searchWithHierarchy',
        method: 'POST',
        data: attendanceApi,
        onSuccess: (data) => {
            if (!Array.isArray(data)) {
                // Ignore transient invalid responses to avoid resetting
                return;
            }
            setInsidePremisesData(data.filter((item: { insidePremises: boolean; }) => item.insidePremises === true).length);
            setPresentData(data.filter((item: { present: boolean; }) => item.present === true).length);
            setAbsentData(data.filter((item: { absent: boolean; }) => item.absent === true).length);
            setLateInData(data.filter((item: { lateIn: boolean; }) => item.lateIn === true).length);
            setEarlyOutData(data.filter((item: { earlyOut: boolean; }) => item.earlyOut === true).length);
            // Inside male/female counts
            const inside = data.filter((item: any) => item.insidePremises === true);
            setInsideMale(inside.filter((item: any) => item.gender === 'Male').length);
            setInsideFemale(inside.filter((item: any) => item.gender === 'Female').length);
            setLastUpdated(new Date());
        },

        onError: (error) => {
            console.error("Error fetching attendance data:", error);
        },

        dependencies: [formattedToday, tenantCode, employeeIds, hierarchyFilters]
    });

    // Kick off and poll attendance for live updates
    useEffect(() => {
        if (!employeeIds || (Array.isArray(employeeIds) && employeeIds.length === 0) || !tenantCode) {
            return;
        }
        fetchAttendance();
        fetchEmployeeList();
        const intervalId = setInterval(() => {
            fetchAttendance();
            fetchEmployeeList();
        }, 15000);
        return () => clearInterval(intervalId);
        // Intentionally depend on ids/code so polling starts only when ready
    }, [employeeIds, tenantCode]);

    // Table configuration similar to modal table
    const tableFunctionalityList = {
        tabletype: {
            type: 'data',
            classvalue: {
                container: 'col-span-12 mb-2',
                tableheder: { container: 'bg-[#f8fafc]' },
                label: 'text-gray-600',
                field: 'p-1',
            },
        },
        columnfunctionality: {
            draggable: { status: false },
            handleRenameColumn: { status: false },
            slNumber: { status: true },
            selectCheck: { status: false },
            activeColumn: { status: false },
        },
        textfunctionality: { expandedCells: { status: true } },
        filterfunctionality: {
            handleSortAsc: { status: true },
            handleSortDesc: { status: true },
            search: { status: true },
            columnSelect: { status: false },
        },
        outsidetablefunctionality: {
            paginationControls: { status: true, start: '', end: '' },
            entriesPerPageSelector: { status: false },
        },
    } as const;

    // Fetch employee list shown in Alerts card (same as first card modal)
    const employeeListApi: any = {
        hierarchyFilters: {
            ...(hierarchyFilters?.subsidiaries && hierarchyFilters.subsidiaries.length > 0 && { subsidiary: hierarchyFilters.subsidiaries }),
            ...(hierarchyFilters?.divisions && hierarchyFilters.divisions.length > 0 && { division: hierarchyFilters.divisions }),
            ...(hierarchyFilters?.departments && hierarchyFilters.departments.length > 0 && { department: hierarchyFilters.departments }),
            ...(hierarchyFilters?.contractors && hierarchyFilters.contractors.length > 0 && { contractor: hierarchyFilters.contractors }),
            ...(hierarchyFilters?.locations && hierarchyFilters.locations.length > 0 && { location: hierarchyFilters.locations }),
        },
        criteriaRequests: [
            { field: 'attendanceDate', operator: 'eq', value: formattedToday },
            { field: 'insidePremises', operator: 'eq', value: true },
            { field: 'tenantCode', operator: 'eq', value: tenantCode }
        ],
        userEntitlement: userEntitlement,
    }


    const { refetch: fetchEmployeeList } = useRequest<any[]>({
        url: 'muster/liveAttendance/searchWithHierarchy',
        method: 'POST',
        data: employeeListApi,
        onSuccess: (data) => {
            if (!Array.isArray(data)) return;
            const filteredData = data.map((employee: any) => ({
                employeeId: employee.employeeId || employee.employee_id || employee.id || employee.empId || employee.emp_id || employee.employeeID || '',
                firstName: employee.firstName || employee.first_name || employee.fname || employee.firstname || '',
                shiftCode: employee.shiftCode || employee.shift_code || employee.shift || employee.shiftcode || '',
            }));
            setEmployeeData(filteredData);
        },
        onError: () => {},
        dependencies: [formattedToday, tenantCode, employeeIds, hierarchyFilters],
    });

    // Export helpers for Employee List
    const downloadEmployeeListExcel = () => {
        if (!employeeData || employeeData.length === 0) return;
        const workbook = XLSX.utils.book_new();
        const header = ['Employee ID', 'First Name', 'Shift Code'];
        const rows = employeeData.map((e: any) => [e.employeeId || '', e.firstName || '', e.shiftCode || '']);
        const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
        XLSX.utils.book_append_sheet(workbook, ws, 'Employee List');
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `Employee_List_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const downloadEmployeeListPDF = () => {
        if (!employeeData || employeeData.length === 0) return;
        const tableHTML = `
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>Employee List</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background: #f4f6f8; }
                        h1 { font-size: 18px; margin: 0; }
                        .meta { color: #667085; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <h1>Employee List</h1>
                    <div class="meta">Generated on: ${new Date().toLocaleString()}</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>First Name</th>
                                <th>Shift Code</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${employeeData.map((e: any) => `
                                <tr>
                                    <td>${e.employeeId || ''}</td>
                                    <td>${e.firstName || ''}</td>
                                    <td>${e.shiftCode || ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>`;

        const blob = new Blob([tableHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Employee_List_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const metrics: MetricItem[] = [
        {
            icon: Users,
            title: 'Total Employees inside the premises',
            value: insidePremisesData,
            change: orgempcount,
            chartColor: 'bg-blue-500',
            attendanceType: undefined, // No attendance type for total employees
        },
        {
            icon: CheckCircle,
            title: 'Present',
            value: presentData,
            change: orgempcount,
            chartColor: 'bg-green-500',
            attendanceType: 'present',
        },
        {
            icon: UserX,
            title: 'Absent',
            value: Math.max(orgempcount - presentData, 0),
            change: orgempcount,
            chartColor: 'bg-red-500',
            attendanceType: 'absent',
        },
        {
            icon: Clock,
            title: 'Late In',
            value: lateInData,
            change: orgempcount,
            chartColor: 'bg-orange-500',
            attendanceType: 'lateIn',
        },
        {
            icon: LogOut,
            title: 'Early Out',
            value: earlyOutData,
            change: orgempcount,
            chartColor: 'bg-purple-500',
            attendanceType: 'earlyOut',
        },

    ];

    const openEmployeeInfo = (attendanceType: MetricItem['attendanceType'], shift?: AttendanceShiftSelection) => {
        setSelectedAttendanceType(attendanceType);
        setSelectedShift(shift || {});
        setIsEmployeeInfoOpen(true);
    };




    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Organisation Key Metrics</h2>
                        <p className="text-gray-600 text-lg">Monitor your key metrics</p>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3"
                        onClick={() => {
                            fetchAttendance();
                            fetchEmployeeList();
                            fetchOrganization();
                            setRefreshTick((t) => t + 1);
                            setLastUpdated(new Date());
                        }}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Main Metrics Grid */}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ">

                    {metrics.slice(1, 5).map((metric, index) => (
                        <MetricCard
                            key={index}
                            icon={metric.icon}
                            title={metric.title}
                            value={metric.value}
                            change={metric.change}
                            chartColor={metric.chartColor}
                            cardType={'chart-data'}
                            attendanceType={metric.attendanceType}
                            onOpenExternal={() => openEmployeeInfo(metric.attendanceType)}
                        />
                    ))}
                </div>

                {/* Inline graphs for Present, Absent, Late In, Early Out */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AttendanceShiftChart title="Present by Shift" attendanceType="present" refreshToken={refreshTick} onBarClick={(shift) => openEmployeeInfo('present', shift)} />
                    <AttendanceShiftChart title="Absent by Shift" attendanceType="absent" refreshToken={refreshTick} onBarClick={(shift) => openEmployeeInfo('absent', shift)} />
                    <AttendanceShiftChart title="Late In by Shift" attendanceType="lateIn" refreshToken={refreshTick} onBarClick={(shift) => openEmployeeInfo('lateIn', shift)} />
                    <AttendanceShiftChart title="Early Out by Shift" attendanceType="earlyOut" refreshToken={refreshTick} onBarClick={(shift) => openEmployeeInfo('earlyOut', shift)} />
                </div>

                {/* Additional cards below graphs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <Card className="bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-md bg-sky-100 text-sky-700">
                                    <Users className="h-4 w-4" />
                                </div>
                                <CardTitle>{metrics[0]?.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-xs text-sky-700">
                                    <span className="inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
                                    <span>Live</span>
                                    {lastUpdated && (
                                        <span className="text-gray-500">· updated {lastUpdated.toLocaleTimeString()}</span>
                                    )}
                                </div>
                                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => fetchAttendance()}>
                                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                    Refresh
                                </Button>
                            </div>
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div className="rounded-lg bg-white/70 border border-sky-100 p-3">
                                    <div className="text-xs text-gray-600">Inside</div>
                                    <div className="text-2xl font-semibold text-gray-900">{Number(insidePremisesData).toLocaleString()}</div>
                                </div>
                                <div className="rounded-lg bg-white/70 border border-sky-100 p-3">
                                    <div className="text-xs text-gray-600">Total Employees</div>
                                    <div className="text-xl font-semibold text-gray-900">{Number(orgempcount).toLocaleString()}</div>
                                </div>
                                <div className="rounded-lg bg-white/70 border border-sky-100 p-3">
                                    <div className="text-xs text-gray-600">Inside %</div>
                                    <div className="text-xl font-semibold text-gray-900">{orgempcount > 0 ? Math.round((insidePremisesData / orgempcount) * 100) : 0}%</div>
                                </div>
                                <div className="rounded-lg bg-white/70 border border-sky-100 p-3">
                                    <div className="text-xs text-gray-600">Unique Shifts</div>
                                    <div className="text-xl font-semibold text-gray-900">{uniqueShiftsInside}</div>
                                </div>
                                <div className="rounded-lg bg-white/70 border border-sky-100 p-3">
                                    <div className="text-xs text-gray-600">Inside (M/F)</div>
                                    <div className="text-xl font-semibold text-gray-900">{insideMale}/{insideFemale}</div>
                                </div>
                                <div className="rounded-lg bg-white/70 border border-sky-100 p-3">
                                    <div className="text-xs text-gray-600">Date</div>
                                    <div className="text-xl font-semibold text-gray-900">{new Date().toLocaleDateString()}</div>
                                </div>
                                <div className="rounded-lg bg-white/70 border border-sky-100 p-3">
                                    <div className="text-xs text-gray-600">Last Updated</div>
                                    <div className="text-xl font-semibold text-gray-900">{lastUpdated ? lastUpdated.toLocaleTimeString() : '-'}</div>
                                </div>
                            </div>
                            {topShiftsInside.length > 0 && (
                                <div className="mt-4">
                                    <div className="text-sm text-gray-600 font-medium mb-2">Top shifts inside</div>
                                    <div className="flex flex-wrap gap-2">
                                        {topShiftsInside.map((s) => (
                                            <span key={s.code} className="inline-flex items-center rounded-md border border-sky-200 bg-white px-3 py-1 text-sm text-gray-900">
                                                <span className="mr-2 text-gray-700">{s.code}</span>
                                                <span className="font-semibold">{s.count}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-md bg-sky-100 text-sky-700">
                                    <Users className="h-4 w-4" />
                                </div>
                                <CardTitle>Employee List</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-700 mb-2">
                                Employees currently inside the premises
                                <span className="ml-2 text-xs text-gray-500">({employeeData.length})</span>
                            </div>
                            <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 border border-gray-200 rounded-lg" style={{ maxHeight: 'calc(60vh)' }}>
                                <div className="min-w-full">
                                    <Table data={employeeData} functionalityList={tableFunctionalityList as any} />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <Button onClick={downloadEmployeeListExcel} disabled={!employeeData.length} className="bg-sky-500 text-white hover:bg-sky-600">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Excel
                                </Button>
                                <Button onClick={downloadEmployeeListPDF} disabled={!employeeData.length} className="bg-cyan-500 text-white hover:bg-cyan-600">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Download PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
            <AddContractEmployeeInfoPopup
                isOpen={isEmployeeInfoOpen}
                onClose={() => setIsEmployeeInfoOpen(false)}
                attendanceType={selectedAttendanceType}
                shiftCode={selectedShift.shiftCode}
                shiftGroupCode={selectedShift.shiftGroupCode}
            />
        </div>
    );
};
