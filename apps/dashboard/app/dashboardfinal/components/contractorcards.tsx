import React, { useEffect, useState } from 'react';
import { ContractorMetricCard } from './contractormetriccard';
import { MetricCard, AttendanceShiftChart, AttendanceShiftSelection } from './metricCard';
import { CheckCircle, XCircle, Clock, LogOut, Users, UserX } from 'lucide-react';
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

interface ContractorCardsProps {
    selectedContractor: string;
}

export const ContractorCards: React.FC<ContractorCardsProps> = ({ selectedContractor }) => {

    const [organizationData, setOrganizationData] = useState<any>(null);
    let [orgempcount, setOrgempcount] = useState<number>(0);
    let [insidePremisesData, setInsidePremisesData] = useState<number>(0);
    let [presentData, setPresentData] = useState<number>(0);
    let [absentData, setAbsentData] = useState<number>(0);
    let [lateInData, setLateInData] = useState<number>(0);
    let [earlyOutData, setEarlyOutData] = useState<number>(0);
    const [isEmployeeInfoOpen, setIsEmployeeInfoOpen] = useState(false);
    const [selectedAttendanceType, setSelectedAttendanceType] = useState<MetricItem['attendanceType']>();
    const [selectedShift, setSelectedShift] = useState<AttendanceShiftSelection>({});
    const tenantCode = useGetTenantCode();

    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    const { employeeIds, employeesLite, loading: hLoading, error: hError, hierarchyFilters } = useEmpHierarchy()
    const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()

    // Centralized user entitlement using shared hook (same as department cards)
    const userEntitlement = useUserEntitlement(loginEmployeeId, hierarchyFilters)

    const api: any = {
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
            },
            {
                "field": "deployment.contractor.contractorCode",
                "operator": "eq",
                "value": selectedContractor
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
            setOrgempcount(data);
        },
        onError: (error) => {
            console.error("Error fetching contractor organization data:", error);
        },
        dependencies: [selectedContractor, tenantCode, hierarchyFilters]
    });

    useEffect(() => {
        if (selectedContractor) {
            fetchOrganization();
        }
    }, [selectedContractor]);

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
            setInsidePremisesData(data.filter((item: { insidePremises: boolean; }) => item.insidePremises === true).length);
            setPresentData(data.filter((item: { present: boolean; }) => item.present === true).length);
            setAbsentData(data.filter((item: { absent: boolean; }) => item.absent === true).length);
            setLateInData(data.filter((item: { lateIn: boolean; }) => item.lateIn === true).length);
            setEarlyOutData(data.filter((item: { earlyOut: boolean; }) => item.earlyOut === true).length);
        },

        onError: (error) => {
            console.error("Error fetching contractor attendance data:", error);
        },

        dependencies: [selectedContractor, formattedToday, tenantCode, hierarchyFilters]
    });

    useEffect(() => {
        if (selectedContractor) {
            fetchAttendance();
        }
    }, [selectedContractor]);

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
        <div className="w-full">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Contractor Key Metrics</h3>
                <p className="text-gray-600">Monitor your contractor metrics for: <span className="font-semibold">{selectedContractor}</span></p>
            </div>

            {/* Main Metrics Grid - match Department cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

            {/* Contractor graphs matching Department */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AttendanceShiftChart title={`Present by ${selectedContractor}`} attendanceType="present" selectedContractor={selectedContractor} groupByShift onBarClick={(shift) => openEmployeeInfo('present', shift)} />
                <AttendanceShiftChart title={`Absent by ${selectedContractor}`} attendanceType="absent" selectedContractor={selectedContractor} groupByShift onBarClick={(shift) => openEmployeeInfo('absent', shift)} />
                <AttendanceShiftChart title={`Late In by ${selectedContractor}`} attendanceType="lateIn" selectedContractor={selectedContractor} groupByShift onBarClick={(shift) => openEmployeeInfo('lateIn', shift)} />
                <AttendanceShiftChart title={`Early Out by ${selectedContractor}`} attendanceType="earlyOut" selectedContractor={selectedContractor} groupByShift onBarClick={(shift) => openEmployeeInfo('earlyOut', shift)} />
            </div>
            <AddContractEmployeeInfoPopup
                isOpen={isEmployeeInfoOpen}
                onClose={() => setIsEmployeeInfoOpen(false)}
                attendanceType={selectedAttendanceType}
                shiftCode={selectedShift.shiftCode}
                shiftGroupCode={selectedShift.shiftGroupCode}
                contractorCode={selectedContractor}
            />
        </div>
    );
};
