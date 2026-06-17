import { X, ChevronRight, Users, Building2, User } from 'lucide-react';

export type DrillDownLevel = 'org' | 'department' | 'contractor' | 'employee';

export interface DrillDownData {
  level: DrillDownLevel;
  title: string;
  data: any;
}

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  drillDownData: DrillDownData | null;
  onDrillDeeper: (nextLevel: DrillDownLevel, data: any) => void;
}

export function DrillDownModal({
  isOpen,
  onClose,
  drillDownData,
  onDrillDeeper,
}: DrillDownModalProps) {
  if (!isOpen || !drillDownData) return null;

  const renderBreadcrumb = () => {
    const levels: { level: DrillDownLevel; label: string }[] = [
      { level: 'org', label: 'Organization' },
    ];

    if (drillDownData.level === 'department' || drillDownData.level === 'contractor' || drillDownData.level === 'employee') {
      levels.push({ level: 'department', label: 'Department' });
    }
    if (drillDownData.level === 'contractor' || drillDownData.level === 'employee') {
      levels.push({ level: 'contractor', label: 'Contractor' });
    }
    if (drillDownData.level === 'employee') {
      levels.push({ level: 'employee', label: 'Employee' });
    }

    return (
      <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
        {levels.map((item, idx) => (
          <div key={item.level} className="flex items-center gap-2">
            {idx > 0 && <ChevronRight className="w-4 h-4" />}
            <span
              className={
                item.level === drillDownData.level
                  ? 'font-bold text-blue-600'
                  : 'hover:text-slate-900 cursor-pointer'
              }
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (drillDownData.level) {
      case 'org':
        return renderOrgLevel();
      case 'department':
        return renderDepartmentLevel();
      case 'contractor':
        return renderContractorLevel();
      case 'employee':
        return renderEmployeeLevel();
      default:
        return null;
    }
  };

  const renderOrgLevel = () => {
    const departments = [
      { name: 'Production', headcount: 1281, attendance: 94, compliance: 92 },
      { name: 'Quality Assurance', headcount: 162, attendance: 96, compliance: 94 },
      { name: 'Maintenance', headcount: 210, attendance: 91, compliance: 89 },
      { name: 'Logistics', headcount: 304, attendance: 93, compliance: 91 },
      { name: 'HR', headcount: 50, attendance: 97, compliance: 98 },
      { name: 'Finance', headcount: 60, attendance: 96, compliance: 97 },
      { name: 'IT', headcount: 90, attendance: 95, compliance: 96 },
      { name: 'Sales & Marketing', headcount: 247, attendance: 95, compliance: 94 },
    ];

    return (
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 mb-4">All Departments</h3>
        {departments.map((dept) => (
          <div
            key={dept.name}
            onClick={() => onDrillDeeper('department', dept)}
            className="p-4 bg-slate-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors border border-slate-200 hover:border-blue-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 rounded-lg p-2">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{dept.name}</p>
                  <p className="text-sm text-slate-600">{dept.headcount} employees</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-600">Attendance</p>
                  <p className="font-bold text-slate-900">{dept.attendance}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Compliance</p>
                  <p className="font-bold text-slate-900">{dept.compliance}%</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDepartmentLevel = () => {
    const contractors = [
      { name: 'ManpowerPro Solutions', headcount: 245, attendance: 92, performance: 88 },
      { name: 'TechStaff India', headcount: 156, attendance: 94, performance: 92 },
      { name: 'Global Workforce Ltd', headcount: 128, attendance: 82, performance: 79 },
      { name: 'Elite Contractors', headcount: 98, attendance: 88, performance: 85 },
      { name: 'On-roll Employees', headcount: 654, attendance: 96, performance: 95 },
    ];

    return (
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 mb-1">{drillDownData.data.name}</h3>
        <p className="text-sm text-slate-600 mb-4">
          {drillDownData.data.headcount} total employees
        </p>
        {contractors.map((contractor) => (
          <div
            key={contractor.name}
            onClick={() => onDrillDeeper('contractor', contractor)}
            className="p-4 bg-slate-50 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors border border-slate-200 hover:border-orange-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 rounded-lg p-2">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{contractor.name}</p>
                  <p className="text-sm text-slate-600">{contractor.headcount} workers</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-600">Attendance</p>
                  <p className="font-bold text-slate-900">{contractor.attendance}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Performance</p>
                  <p className="font-bold text-slate-900">{contractor.performance}%</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderContractorLevel = () => {
    const employees = [
      {
        id: 'EMP-1001',
        name: 'Rajesh Kumar',
        role: 'Machine Operator',
        attendance: 96,
        performance: 92,
      },
      {
        id: 'EMP-1002',
        name: 'Priya Sharma',
        role: 'Quality Inspector',
        attendance: 98,
        performance: 95,
      },
      {
        id: 'EMP-1003',
        name: 'Amit Patel',
        role: 'Maintenance Tech',
        attendance: 94,
        performance: 89,
      },
      {
        id: 'EMP-1004',
        name: 'Sunita Reddy',
        role: 'Logistics Coordinator',
        attendance: 92,
        performance: 88,
      },
      {
        id: 'EMP-1005',
        name: 'Vikram Singh',
        role: 'Machine Operator',
        attendance: 97,
        performance: 93,
      },
      {
        id: 'EMP-1006',
        name: 'Kavita Desai',
        role: 'Quality Inspector',
        attendance: 95,
        performance: 91,
      },
      {
        id: 'EMP-1007',
        name: 'Rahul Mehta',
        role: 'Supervisor',
        attendance: 99,
        performance: 96,
      },
      {
        id: 'EMP-1008',
        name: 'Anjali Gupta',
        role: 'Machine Operator',
        attendance: 93,
        performance: 87,
      },
    ];

    return (
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 mb-1">{drillDownData.data.name}</h3>
        <p className="text-sm text-slate-600 mb-4">
          {drillDownData.data.headcount} total workers
        </p>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {employees.map((employee) => (
            <div
              key={employee.id}
              onClick={() => onDrillDeeper('employee', employee)}
              className="p-3 bg-slate-50 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors border border-slate-200 hover:border-emerald-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 rounded-lg p-2">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{employee.name}</p>
                    <p className="text-xs text-slate-600">
                      {employee.id} • {employee.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-600">Attend</p>
                    <p className="font-bold text-slate-900 text-sm">{employee.attendance}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">Perf</p>
                    <p className="font-bold text-slate-900 text-sm">{employee.performance}%</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEmployeeLevel = () => {
    const employee = drillDownData.data;

    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="bg-emerald-500 rounded-lg p-3">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900">{employee.name}</h3>
            <p className="text-sm text-slate-600">
              {employee.id} • {employee.role}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Attendance Rate</p>
            <p className="text-3xl font-bold text-blue-600">{employee.attendance}%</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Performance Score</p>
            <p className="text-3xl font-bold text-emerald-600">{employee.performance}%</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-slate-900">Recent Activity</h4>
          <div className="space-y-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-900">Present - Today</p>
              <p className="text-xs text-slate-600">Clocked in: 8:45 AM</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-900">Training Completed</p>
              <p className="text-xs text-slate-600">Safety Module - Nov 18</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-900">Performance Review</p>
              <p className="text-xs text-slate-600">Score: 92% - Nov 10</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-slate-900">Documents</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-center">
              <p className="text-xs font-medium text-emerald-800">ID Valid</p>
              <p className="text-xs text-slate-600">Exp: 2026</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-center">
              <p className="text-xs font-medium text-emerald-800">Medical Valid</p>
              <p className="text-xs text-slate-600">Exp: 2025</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-center">
              <p className="text-xs font-medium text-emerald-800">Training Valid</p>
              <p className="text-xs text-slate-600">Updated</p>
            </div>
            <div className="p-2 bg-orange-50 rounded border border-orange-200 text-center">
              <p className="text-xs font-medium text-orange-800">Police Verify</p>
              <p className="text-xs text-slate-600">Exp: 30d</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">{drillDownData.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {renderBreadcrumb()}
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
}
