import { ChevronDown, ChevronRight, User, Users, Mail, Phone, MapPin, ArrowUp, ArrowDown } from 'lucide-react';
import { useState } from 'react';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  location: string;
  employeeType: 'Manager' | 'Supervisor' | 'Worker';
  attendance: number;
  status: 'present' | 'absent' | 'leave';
  reportingTo?: string;
  subordinates?: Employee[];
}

interface OrgTreeNodeProps {
  employee: Employee;
  level: number;
}

function OrgTreeNode({ employee, level }: OrgTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'leave':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Manager':
        return 'bg-purple-600 text-white';
      case 'Supervisor':
        return 'bg-blue-600 text-white';
      case 'Worker':
        return 'bg-slate-600 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="relative">
      <div
        className={`flex items-start gap-3 p-4 bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-all ${
          employee.employeeType === 'Manager'
            ? 'border-purple-300'
            : employee.employeeType === 'Supervisor'
            ? 'border-blue-300'
            : 'border-slate-300'
        }`}
        style={{ marginLeft: `${level * 40}px` }}
      >
        {hasSubordinates && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 p-1 hover:bg-slate-100 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-600" />
            )}
          </button>
        )}

        {!hasSubordinates && <div className="w-6" />}

        <div className="flex-shrink-0">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${getTypeColor(
              employee.employeeType
            )}`}
          >
            {employee.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900">{employee.name}</h4>
              <p className="text-xs text-slate-600">{employee.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                  employee.status
                )}`}
              >
                {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${getTypeColor(employee.employeeType)}`}>
                {employee.employeeType}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Users className="w-3 h-3" />
              <span>{employee.department}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <MapPin className="w-3 h-3" />
              <span>{employee.location}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Mail className="w-3 h-3" />
              <span className="truncate">{employee.email}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Phone className="w-3 h-3" />
              <span>{employee.phone}</span>
            </div>
          </div>

          {employee.employeeType !== 'Worker' && hasSubordinates && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-600">
                <span className="font-medium">{employee.subordinates?.length}</span> Direct Report
                {employee.subordinates && employee.subordinates.length !== 1 ? 's' : ''}
                {' • '}
                <span className="font-medium">{employee.attendance}%</span> Team Attendance
              </p>
            </div>
          )}
        </div>
      </div>

      {hasSubordinates && isExpanded && (
        <div className="mt-3 space-y-3">
          {employee.subordinates?.map((subordinate) => (
            <OrgTreeNode key={subordinate.id} employee={subordinate} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function OrgTreeView() {
  const [viewMode, setViewMode] = useState<'top-down' | 'bottom-up'>('top-down');

  const reportingHierarchy: Employee[] = [
    {
      id: 'CEO001',
      name: 'Rajesh Gupta',
      role: 'Chief Executive Officer',
      department: 'Executive',
      email: 'rajesh.gupta@company.com',
      phone: '+91 98765 00000',
      location: 'Head Office - Mumbai',
      employeeType: 'Manager',
      attendance: 100,
      status: 'present',
    },
    {
      id: 'COO001',
      name: 'Priya Sharma',
      role: 'Chief Operating Officer',
      department: 'Operations',
      email: 'priya.sharma@company.com',
      phone: '+91 98765 00002',
      location: 'Head Office - Mumbai',
      employeeType: 'Manager',
      attendance: 98,
      status: 'present',
      reportingTo: 'CEO001',
    },
    {
      id: 'VP001',
      name: 'Amit Verma',
      role: 'VP Manufacturing',
      department: 'Manufacturing',
      email: 'amit.verma@company.com',
      phone: '+91 98765 00003',
      location: 'Plant 1 - Pune',
      employeeType: 'Manager',
      attendance: 96,
      status: 'present',
      reportingTo: 'COO001',
    },
  ];

  const orgData: Employee = {
    id: 'M001',
    name: 'Suresh Patel',
    role: 'Production Manager',
    department: 'Production',
    email: 'suresh.patel@company.com',
    phone: '+91 98765 00001',
    location: 'Plant 1 - Pune',
    employeeType: 'Manager',
    attendance: 94,
    status: 'present',
    reportingTo: 'VP001',
    subordinates: [
      {
        id: 'S001',
        name: 'Ramesh Kumar',
        role: 'Production Supervisor',
        department: 'Production Floor 1',
        email: 'ramesh.kumar@company.com',
        phone: '+91 98765 00011',
        location: 'Plant 1 - Pune',
        employeeType: 'Supervisor',
        attendance: 96,
        status: 'present',
        reportingTo: 'M001',
        subordinates: [
          {
            id: 'W001',
            name: 'Rajesh Kumar',
            role: 'Senior Machine Operator',
            department: 'Production Floor 1',
            email: 'rajesh.kumar@company.com',
            phone: '+91 98765 43210',
            location: 'Plant 1 - Pune',
            employeeType: 'Worker',
            attendance: 98,
            status: 'present',
            reportingTo: 'S001',
          },
          {
            id: 'W002',
            name: 'Amit Sharma',
            role: 'Machine Operator',
            department: 'Production Floor 1',
            email: 'amit.sharma@company.com',
            phone: '+91 98765 43211',
            location: 'Plant 1 - Pune',
            employeeType: 'Worker',
            attendance: 95,
            status: 'present',
            reportingTo: 'S001',
          },
          {
            id: 'W003',
            name: 'Vijay Singh',
            role: 'Machine Operator',
            department: 'Production Floor 1',
            email: 'vijay.singh@company.com',
            phone: '+91 98765 43212',
            location: 'Plant 1 - Pune',
            employeeType: 'Worker',
            attendance: 92,
            status: 'absent',
            reportingTo: 'S001',
          },
          {
            id: 'W004',
            name: 'Prakash Yadav',
            role: 'Helper',
            department: 'Production Floor 1',
            email: 'prakash.yadav@company.com',
            phone: '+91 98765 43213',
            location: 'Plant 1 - Pune',
            employeeType: 'Worker',
            attendance: 97,
            status: 'present',
            reportingTo: 'S001',
          },
          {
            id: 'W005',
            name: 'Sandeep Verma',
            role: 'Quality Inspector',
            department: 'Production Floor 1',
            email: 'sandeep.verma@company.com',
            phone: '+91 98765 43214',
            location: 'Plant 1 - Pune',
            employeeType: 'Worker',
            attendance: 99,
            status: 'present',
            reportingTo: 'S001',
          },
        ],
      },
      {
        id: 'S002',
        name: 'Mahesh Desai',
        role: 'Production Supervisor',
        department: 'Production Floor 2',
        email: 'mahesh.desai@company.com',
        phone: '+91 98765 00012',
        location: 'Plant 1 - Pune',
        employeeType: 'Supervisor',
        attendance: 93,
        status: 'present',
        reportingTo: 'M001',
        subordinates: [
          {
            id: 'W006',
            name: 'Anil Gupta',
            role: 'Senior Welder',
            department: 'Production Floor 2',
            email: 'anil.gupta@company.com',
            phone: '+91 98765 43215',
            location: 'Plant 1 - Pune',
            employeeType: 'Worker',
            attendance: 94,
            status: 'present',
            reportingTo: 'S002',
          },
          {
            id: 'W007',
            name: 'Ravi Patel',
            role: 'Welder',
            department: 'Production Floor 2',
            email: 'ravi.patel@company.com',
            phone: '+91 98765 43216',
            location: 'Plant 1 - Pune',
            employeeType: 'Worker',
            attendance: 91,
            status: 'leave',
            reportingTo: 'S002',
          },
          {
            id: 'W008',
            name: 'Deepak Joshi',
            role: 'Fitter',
            department: 'Production Floor 2',
            email: 'deepak.joshi@company.com',
            phone: '+91 98765 43217',
            location: 'Plant 1 - Pune',
            employeeType: 'Worker',
            attendance: 96,
            status: 'present',
            reportingTo: 'S002',
          },
          {
            id: 'W009',
            name: 'Sunil Rao',
            role: 'Helper',
            department: 'Production Floor 2',
            email: 'sunil.rao@company.com',
            phone: '+91 98765 43218',
            location: 'Plant 1 - Pune',
            employeeType: 'Worker',
            attendance: 88,
            status: 'absent',
            reportingTo: 'S002',
          },
        ],
      },
      {
        id: 'S003',
        name: 'Dinesh Chopra',
        role: 'Maintenance Supervisor',
        department: 'Maintenance',
        email: 'dinesh.chopra@company.com',
        phone: '+91 98765 00013',
        location: 'Plant 1 - Pune',
        employeeType: 'Supervisor',
        attendance: 95,
        status: 'present',
        reportingTo: 'M001',
        subordinates: [
          {
            id: 'W010',
            name: 'Kiran Kumar',
            role: 'Senior Electrician',
            department: 'Maintenance',
            email: 'kiran.kumar@company.com',
            phone: '+91 98765 43219',
            location: 'Plant 1 - Pune',
            employeeType: 'Worker',
            attendance: 97,
            status: 'present',
            reportingTo: 'S003',
          },
          {
            id: 'W011',
            name: 'Mohan Reddy',
            role: 'Electrician',
            department: 'Maintenance',
            email: 'mohan.reddy@company.com',
            phone: '+91 98765 43220',
            location: 'Plant 1 - Pune',
            employeeType: 'Worker',
            attendance: 93,
            status: 'present',
            reportingTo: 'S003',
          },
          {
            id: 'W012',
            name: 'Gopal Mishra',
            role: 'Mechanic',
            department: 'Maintenance',
            email: 'gopal.mishra@company.com',
            phone: '+91 98765 43221',
            location: 'Plant 1 - Pune',
            employeeType: 'Worker',
            attendance: 95,
            status: 'present',
            reportingTo: 'S003',
          },
        ],
      },
      {
        id: 'S004',
        name: 'Ashok Mehta',
        role: 'Quality Supervisor',
        department: 'Quality Control',
        email: 'ashok.mehta@company.com',
        phone: '+91 98765 00014',
        location: 'Plant 1 - Pune',
        employeeType: 'Supervisor',
        attendance: 97,
        status: 'present',
        reportingTo: 'M001',
        subordinates: [
          {
            id: 'W013',
            name: 'Naveen Jain',
            role: 'Quality Inspector',
            department: 'Quality Control',
            email: 'naveen.jain@company.com',
            phone: '+91 98765 43222',
            location: 'Plant 1 - Pune',
            employeeType: 'Worker',
            attendance: 98,
            status: 'present',
            reportingTo: 'S004',
          },
          {
            id: 'W014',
            name: 'Pradeep Saxena',
            role: 'Quality Analyst',
            department: 'Quality Control',
            email: 'pradeep.saxena@company.com',
            phone: '+91 98765 43223',
            location: 'Plant 1 - Pune',
            employeeType: 'Worker',
            attendance: 96,
            status: 'present',
            reportingTo: 'S004',
          },
          {
            id: 'W015',
            name: 'Sanjay Tiwari',
            role: 'Quality Inspector',
            department: 'Quality Control',
            email: 'sanjay.tiwari@company.com',
            phone: '+91 98765 43224',
            location: 'Plant 1 - Pune',
            employeeType: 'Worker',
            attendance: 94,
            status: 'leave',
            reportingTo: 'S004',
          },
        ],
      },
    ],
  };

  const totalEmployees = () => {
    let count = 1;
    const countSubordinates = (emp: Employee) => {
      if (emp.subordinates) {
        emp.subordinates.forEach((sub) => {
          count++;
          countSubordinates(sub);
        });
      }
    };
    countSubordinates(orgData);
    return count;
  };

  const countByType = (type: string) => {
    let count = 0;
    const countInTree = (emp: Employee) => {
      if (emp.employeeType === type) count++;
      if (emp.subordinates) {
        emp.subordinates.forEach((sub) => countInTree(sub));
      }
    };
    countInTree(orgData);
    return count;
  };

  const countByStatus = (status: string) => {
    let count = 0;
    const countInTree = (emp: Employee) => {
      if (emp.status === status) count++;
      if (emp.subordinates) {
        emp.subordinates.forEach((sub) => countInTree(sub));
      }
    };
    countInTree(orgData);
    return count;
  };

  const countBottomUpStats = () => {
    const allEmployees = [...reportingHierarchy, orgData];
    const total = allEmployees.length;
    const managers = allEmployees.filter(e => e.employeeType === 'Manager').length;
    const supervisors = allEmployees.filter(e => e.employeeType === 'Supervisor').length;
    const workers = allEmployees.filter(e => e.employeeType === 'Worker').length;
    const present = allEmployees.filter(e => e.status === 'present').length;
    const absent = allEmployees.filter(e => e.status === 'absent').length;
    const leave = allEmployees.filter(e => e.status === 'leave').length;

    return { total, managers, supervisors, workers, present, absent, leave };
  };

  const stats = viewMode === 'bottom-up' ? countBottomUpStats() : {
    total: totalEmployees(),
    managers: countByType('Manager'),
    supervisors: countByType('Supervisor'),
    workers: countByType('Worker'),
    present: countByStatus('present'),
    absent: countByStatus('absent'),
    leave: countByStatus('leave'),
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Organization Hierarchy</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('top-down')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'top-down'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDown className="w-4 h-4" />
              <span>Top-Down</span>
            </button>
            <button
              onClick={() => setViewMode('bottom-up')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'bottom-up'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
              <span>Bottom-Up</span>
            </button>
          </div>
          <div className="text-center px-3 py-1 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">Total</p>
            <p className="text-lg font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="text-center px-3 py-1 bg-purple-50 rounded-lg">
            <p className="text-xs text-slate-600">Managers</p>
            <p className="text-lg font-bold text-purple-600">{stats.managers}</p>
          </div>
          <div className="text-center px-3 py-1 bg-blue-50 rounded-lg">
            <p className="text-xs text-slate-600">Supervisors</p>
            <p className="text-lg font-bold text-blue-600">{stats.supervisors}</p>
          </div>
          <div className="text-center px-3 py-1 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">Workers</p>
            <p className="text-lg font-bold text-slate-900">{stats.workers}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
          <span className="text-sm font-medium text-slate-700">Present Today</span>
          <span className="text-lg font-bold text-emerald-600">{stats.present}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
          <span className="text-sm font-medium text-slate-700">Absent Today</span>
          <span className="text-lg font-bold text-red-600">{stats.absent}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-slate-700">On Leave</span>
          <span className="text-lg font-bold text-blue-600">{stats.leave}</span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        {viewMode === 'top-down' ? (
          <div>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm font-medium text-blue-900">
                Showing hierarchical structure from Manager downwards to all subordinates
              </p>
            </div>
            <OrgTreeNode employee={orgData} level={0} />
          </div>
        ) : (
          <div>
            <div className="mb-4 p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-500">
              <p className="text-sm font-medium text-emerald-900">
                Showing reporting chain from Manager upwards to top leadership
              </p>
            </div>
            <div className="space-y-3">
              {reportingHierarchy.reverse().map((superior, idx) => (
                <div key={superior.id}>
                  <OrgTreeNode employee={superior} level={idx} />
                </div>
              ))}
              <OrgTreeNode employee={orgData} level={reportingHierarchy.length} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
