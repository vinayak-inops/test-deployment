import {
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  TrendingUp,
  Calendar,
  Shield,
  IndianRupee,
  Bell,
  Activity,
  Briefcase,
  ClipboardCheck,
  UserCheck,
  UserX,
  Filter,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchManagerDashboardData, type ManagerDashboardData } from '@/components/services/apiService';

interface ManagerDashboardProps {
  onDrillDown: (section: string, data: any) => void;
}

export function ManagerDashboard({ onDrillDown }: ManagerDashboardProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchManagerDashboardData('EMP025');
        setData(result);
      } catch (err) {
        console.error('Failed to load manager dashboard data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Failed to load data'}</p>
        </div>
      </div>
    );
  }

  const { snapshotData, deploymentData, attendanceData, workOrderData, complianceData, contractorPerformance, safetyData, costData, alerts, insights } = data;

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manager Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Real-time operational overview and workforce management</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap">
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Departments</option>
                <option>Production</option>
                <option>Warehouse</option>
                <option>Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Shift</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Shifts</option>
                <option>A Shift</option>
                <option>B Shift</option>
                <option>C Shift</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Contractor</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Contractors</option>
                <option>ABC Services</option>
                <option>XYZ Manpower</option>
                <option>PQR Solutions</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date Range</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>Today</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Custom</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          onClick={() => onDrillDown('totalWorkers', snapshotData)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-slate-500">Assigned</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{snapshotData.totalWorkers}</p>
          <p className="text-xs text-slate-600 mt-1">Total Workers</p>
        </div>

        <div
          onClick={() => onDrillDown('presentToday', snapshotData)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-xs text-emerald-600 font-medium" title="Formula: (Present / Total Workers) × 100">
              {Math.round((snapshotData.presentToday / snapshotData.totalWorkers) * 100)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{snapshotData.presentToday}</p>
          <p className="text-xs text-slate-600 mt-1">Present Today</p>
          <p className="text-[9px] text-slate-500 mt-0.5">({snapshotData.presentToday}/{snapshotData.totalWorkers}) × 100</p>
        </div>

        <div
          onClick={() => onDrillDown('absentToday', snapshotData)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <UserX className="w-5 h-5 text-red-600" />
            <span className="text-xs text-red-600 font-medium" title="Formula: (Absent / Total Workers) × 100">
              {Math.round((snapshotData.absentToday / snapshotData.totalWorkers) * 100)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-red-600">{snapshotData.absentToday}</p>
          <p className="text-xs text-slate-600 mt-1">Absent / No-show</p>
          <p className="text-[9px] text-slate-500 mt-0.5">({snapshotData.absentToday}/{snapshotData.totalWorkers}) × 100</p>
        </div>

        <div
          onClick={() => onDrillDown('contractors', snapshotData)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <Briefcase className="w-5 h-5 text-purple-600" />
            <span className="text-xs text-slate-500">Active</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{snapshotData.contractorsAssigned}</p>
          <p className="text-xs text-slate-600 mt-1">Contractors</p>
        </div>

        <div
          onClick={() => onDrillDown('activeWorkOrders', workOrderData)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Active</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{snapshotData.activeWorkOrders}</p>
          <p className="text-xs text-slate-600 mt-1">Work Orders</p>
        </div>

        <div
          onClick={() => onDrillDown('compliancePending', complianceData)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-5 h-5 text-orange-600" />
            <span className="text-xs text-orange-600 font-medium">Action Needed</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{snapshotData.compliancePending}</p>
          <p className="text-xs text-slate-600 mt-1">Compliance Issues</p>
        </div>

        <div
          onClick={() => onDrillDown('otHours', costData)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <IndianRupee className="w-5 h-5 text-green-600" />
            <span className="text-xs text-slate-500" title="Formula: (OT Hours Used / OT Limit) × 100">
              {Math.round((costData.otHours / costData.otLimit) * 100)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {Math.floor(costData.otHours)}:{String(Math.round((costData.otHours % 1) * 60)).padStart(2, '0')}
          </p>
          <p className="text-xs text-slate-600 mt-1">OT Hours Used (HH:MM)</p>
          <p className="text-[9px] text-slate-500 mt-0.5">({costData.otHours}/{costData.otLimit}) × 100</p>
        </div>

        <div
          onClick={() => onDrillDown('alerts', alerts)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <Bell className="w-5 h-5 text-red-600 animate-pulse" />
            <span className="text-xs text-red-600 font-medium">Critical: 2</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{alerts.length}</p>
          <p className="text-xs text-slate-600 mt-1">Active Alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          onClick={() => onDrillDown('deployment', deploymentData)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Workforce Deployment</h3>
          </div>
          <div className="space-y-3">
            {deploymentData.shifts?.map((shift:any) => (
              <div key={shift.shift} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{shift.shift}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          shift.gap < 0 ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${(shift.actual / shift.planned) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600">
                      {shift.actual}/{shift.planned}
                    </span>
                  </div>
                </div>
                <span
                  className={`ml-4 text-sm font-bold ${
                    shift.gap < 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {shift.gap}
                </span>
              </div>
            ))}
          </div>
          {deploymentData.shortageAreas.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-xs font-bold text-red-900 mb-2">Critical Shortage Areas:</p>
              {deploymentData.shortageAreas?.map((area:any ) => (
                <div key={area.area} className="flex items-center justify-between text-xs text-red-800">
                  <span>{area.area}</span>
                  <span className="font-bold">-{area.shortage} workers</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          onClick={() => onDrillDown('attendance', attendanceData)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">Attendance & Shift Monitoring</h3>
          </div>
          <div className="mb-4">
            <p className="text-xs text-slate-600 mb-2">Last 7 Days Trend</p>
            <div className="flex items-end justify-between gap-2 h-32 border-b border-gray-200 px-2">
              {attendanceData.trend?.map((value:any, idx:number) => (
                <div key={idx} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                  <span className="text-xs font-bold text-emerald-600">{value}%</span>
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t shadow-sm"
                    style={{ height: `${(value / 100) * 100}%`, minHeight: '20px' }}
                  />
                  <span className="text-[9px] text-slate-500 mt-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-orange-50 rounded-lg">
              <p className="text-lg font-bold text-orange-600">{attendanceData.lateWorkers}</p>
              <p className="text-[10px] text-slate-600">Late Today</p>
            </div>
            <div className="text-center p-2 bg-red-50 rounded-lg">
              <p className="text-lg font-bold text-red-600">{attendanceData.repeatedAbsent}</p>
              <p className="text-[10px] text-slate-600">Repeated Absent</p>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded-lg">
              <p className="text-lg font-bold text-purple-600">{attendanceData.excessiveOT}</p>
              <p className="text-[10px] text-slate-600">Excessive OT</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          onClick={() => onDrillDown('workOrders', workOrderData)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Work Orders / Tasks</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{workOrderData.assigned}</p>
              <p className="text-[10px] text-slate-600 mt-1">Assigned</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{workOrderData.inProgress}</p>
              <p className="text-[10px] text-slate-600 mt-1">In Progress</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <p className="text-2xl font-bold text-emerald-600">{workOrderData.completed}</p>
              <p className="text-[10px] text-slate-600 mt-1">Completed</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{workOrderData.overdue}</p>
              <p className="text-[10px] text-slate-600 mt-1">Overdue</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-xs text-slate-700">Pending Approval</span>
              <span className="text-sm font-bold text-blue-600">{workOrderData.pendingApproval}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-xs text-slate-700">SLA Breach</span>
              <span className="text-sm font-bold text-red-600">{workOrderData.slaBreaches}</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => onDrillDown('compliance', complianceData)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-slate-900">Worker Compliance</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-red-50 rounded">
              <span className="text-sm text-slate-700">Expired Documents</span>
              <span className="text-sm font-bold text-red-600">{complianceData.expiredDocs}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
              <span className="text-sm text-slate-700">Expiring Soon</span>
              <span className="text-sm font-bold text-orange-600">{complianceData.expiringDocs}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
              <span className="text-sm text-slate-700">Training Pending</span>
              <span className="text-sm font-bold text-yellow-700">{complianceData.trainingPending}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
              <span className="text-sm text-slate-700">Medical Test Due</span>
              <span className="text-sm font-bold text-blue-600">{complianceData.medicalPending}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm text-slate-700">Blocked Workers</span>
              <span className="text-sm font-bold text-slate-900">{complianceData.blockedWorkers}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        onClick={() => onDrillDown('contractors', contractorPerformance)}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-slate-900">Contractor / Vendor Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-bold text-slate-700 pb-2">Rank</th>
                <th className="text-left text-xs font-bold text-slate-700 pb-2">Contractor</th>
                <th className="text-center text-xs font-bold text-slate-700 pb-2">Attendance</th>
                <th className="text-center text-xs font-bold text-slate-700 pb-2">SLA</th>
                <th className="text-center text-xs font-bold text-slate-700 pb-2">Turnover</th>
                <th className="text-center text-xs font-bold text-slate-700 pb-2">Safety</th>
              </tr>
            </thead>
            <tbody>
              {contractorPerformance.map((contractor:any) => (
                <tr key={contractor.name} className="border-b border-gray-100">
                  <td className="py-3 text-sm">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full inline-flex items-center justify-center text-xs font-bold">
                      {contractor.rank}
                    </span>
                  </td>
                  <td className="py-3 text-sm font-medium text-slate-900">{contractor.name}</td>
                  <td className="py-3 text-center">
                    <span className={`text-sm font-bold ${contractor.attendance >= 95 ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {contractor.attendance}%
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`text-sm font-bold ${contractor.sla >= 90 ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {contractor.sla}%
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`text-sm font-bold ${contractor.turnover <= 10 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {contractor.turnover}%
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`text-sm font-bold ${contractor.safety >= 95 ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {contractor.safety}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          onClick={() => onDrillDown('safety', safetyData)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-slate-900">Safety & Incident Summary</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{safetyData.incidents}</p>
              <p className="text-[10px] text-slate-600 mt-1">Incidents</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{safetyData.nearMisses}</p>
              <p className="text-[10px] text-slate-600 mt-1">Near Misses</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-700">{safetyData.violations}</p>
              <p className="text-[10px] text-slate-600 mt-1">Violations</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">PPE Compliance</span>
              <span className="text-sm font-bold text-emerald-600">{safetyData.ppeCompliance}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Training Completion</span>
              <span className="text-sm font-bold text-blue-600">{safetyData.trainingCompletion}%</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => onDrillDown('cost', costData)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-4">
            <IndianRupee className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900">Overtime & Cost Monitoring</h3>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-700">OT Hours Utilization</span>
              <span className="text-sm font-bold text-slate-900">
                {costData.otHours} / {costData.otLimit}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  (costData.otHours / costData.otLimit) * 100 > 80 ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${(costData.otHours / costData.otLimit) * 100}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-slate-600">OT Cost</p>
              <p className="text-lg font-bold text-green-600">₹{(costData.otCost / 1000).toFixed(0)}K</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-slate-600">Total Dept Cost</p>
              <p className="text-lg font-bold text-blue-600">₹{(costData.departmentCost / 100000).toFixed(1)}L</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-slate-600">Excessive OT</p>
              <p className="text-lg font-bold text-orange-600">{costData.excessiveOTContractors}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600">Idle Workers</p>
              <p className="text-lg font-bold text-slate-900">{costData.idleManpower}</p>
            </div>
          </div>
        </div>
      </div>

      <div
        onClick={() => onDrillDown('alerts', alerts)}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-slate-900">Alerts & Action Center</h3>
        </div>
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border-l-4 ${
                alert.type === 'critical'
                  ? 'bg-red-50 border-red-500'
                  : alert.type === 'warning'
                  ? 'bg-orange-50 border-orange-500'
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{alert.message}</p>
                  <p className="text-xs text-slate-600 mt-1">{alert.time}</p>
                </div>
                <button className="ml-3 px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium hover:bg-slate-50">
                  Action
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-sm border border-blue-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Manager Insights (AI-Powered)</h3>
        </div>
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div key={idx} className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      insight.type === 'prediction'
                        ? 'bg-purple-100 text-purple-700'
                        : insight.type === 'suggestion'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {insight.type.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-600">Confidence: {insight.confidence}%</span>
                </div>
              </div>
              <p className="text-sm text-slate-900">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
