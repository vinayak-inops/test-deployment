import { User, Clock, Calendar, FileText, Shield, IndianRupee, TrendingUp, Bell, Download, CreditCard as Edit, Phone, Mail, MapPin, CheckCircle, XCircle, AlertCircle, LogOut, LogIn, ArrowUp } from 'lucide-react';
import { AttendanceCalendar } from './AttendanceCalendar';
import { useState, useEffect } from 'react';

const generateMonthData = (year: number, month: number) => {
  const data: any[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDate = new Date();
  const isCurrentMonth = year === currentDate.getFullYear() && month === currentDate.getMonth();

  const patternForNovember2024 = [
    1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ];

  const shiftPattern = ['A', 'A', 'A', 'B', 'B', 'B', 'C', 'C', 'C'];

  let lateCount = 0;
  let earlyCount = 0;
  const targetLate = 3;
  const targetEarly = 1;
  let workingDayIndex = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      data.push({ type: 'weekend', shift: null });
    } else {
      const isPresent = isCurrentMonth ? patternForNovember2024[day - 1] === 1 : Math.random() < 0.85;
      const shift = shiftPattern[workingDayIndex % shiftPattern.length];

      if (isPresent) {
        const shouldBeLate = lateCount < targetLate && Math.random() < 0.15;
        const shouldBeEarly = earlyCount < targetEarly && !shouldBeLate && Math.random() < 0.08;

        let inHour, outHour;
        if (shift === 'A') {
          inHour = shouldBeLate ? 6 : 6;
          outHour = shouldBeEarly ? 13 : 14;
        } else if (shift === 'B') {
          inHour = shouldBeLate ? 14 : 14;
          outHour = shouldBeEarly ? 21 : 22;
        } else {
          inHour = shouldBeLate ? 22 : 22;
          outHour = shouldBeEarly ? 5 : 6;
        }

        const inMin = shouldBeLate ? 20 + Math.floor(Math.random() * 40) : Math.floor(Math.random() * 15);
        const outMin = Math.floor(Math.random() * 60);

        let actualHours = outHour - inHour + (outMin - inMin) / 60;
        if (shift === 'C' && outHour < 12) {
          actualHours = (24 - inHour) + outHour + (outMin - inMin) / 60;
        }

        const isLate = shouldBeLate;
        const isEarlyOut = shouldBeEarly;

        if (isLate) lateCount++;
        if (isEarlyOut) earlyCount++;

        data.push({
          type: 'present',
          hours: actualHours,
          isLate,
          isEarlyOut,
          shift,
        });
      } else {
        data.push({ type: 'absent', shift });
      }

      workingDayIndex++;
    }
  }

  return data;
};

const generateDateRangeData = (fromDate: Date, toDate: Date) => {
  const data: any[] = [];
  const currentDate = new Date(fromDate);

  const shiftPattern = ['A', 'A', 'A', 'B', 'B', 'B', 'C', 'C', 'C'];
  let workingDayIndex = 0;

  while (currentDate <= toDate) {
    const dayOfWeek = currentDate.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      data.push({ type: 'weekend', shift: null, date: new Date(currentDate) });
    } else {
      const isPresent = Math.random() < 0.85;
      const shift = shiftPattern[workingDayIndex % shiftPattern.length];

      if (isPresent) {
        const shouldBeLate = Math.random() < 0.15;
        const shouldBeEarly = Math.random() < 0.08;

        let inHour, outHour;
        if (shift === 'A') {
          inHour = shouldBeLate ? 6 : 6;
          outHour = shouldBeEarly ? 13 : 14;
        } else if (shift === 'B') {
          inHour = shouldBeLate ? 14 : 14;
          outHour = shouldBeEarly ? 21 : 22;
        } else {
          inHour = shouldBeLate ? 22 : 22;
          outHour = shouldBeEarly ? 5 : 6;
        }

        const inMin = shouldBeLate ? 20 + Math.floor(Math.random() * 40) : Math.floor(Math.random() * 15);
        const outMin = Math.floor(Math.random() * 60);

        let actualHours = outHour - inHour + (outMin - inMin) / 60;
        if (shift === 'C' && outHour < 12) {
          actualHours = (24 - inHour) + outHour + (outMin - inMin) / 60;
        }

        data.push({
          type: 'present',
          hours: actualHours,
          isLate: shouldBeLate,
          isEarlyOut: shouldBeEarly,
          shift,
          date: new Date(currentDate),
        });
      } else {
        data.push({ type: 'absent', shift, date: new Date(currentDate) });
      }

      workingDayIndex++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return data;
};

interface DashboardData {
  employee: {
    employee_id: string;
    name: string;
    photo_url?: string;
    department: string;
    location: string;
    reporting_manager: string;
    role: string;
    grade: string;
    shift_type: string;
    email: string;
    phone: string;
  };
  reporting_hierarchy: Array<{
    name: string;
    role: string;
    department: string;
    level: number;
  }>;
  today_punch: {
    in_time: string | null;
    out_time: string | null;
    hours_worked: string;
    status: string;
  };
  shift_summary: {
    from_date: string;
    to_date: string;
    assigned_shifts: number;
    shifts_attended: number;
    shifts_absent: number;
    total_hours: number;
    regular_hours: number;
    overtime_hours: number;
    late_coming_count: number;
    early_exit_count: number;
    shift_adherence: number;
    shift_breakdown: {
      a_shift: number;
      b_shift: number;
      c_shift: number;
    };
  };
  leaves: Array<{
    leave_id: string;
    from_date: string;
    to_date: string;
    leave_type: string;
    days: number;
    status: string;
  }>;
  leave_balance: {
    casual_taken: number;
    casual_total: number;
    sick_taken: number;
    sick_total: number;
    privilege_taken: number;
    privilege_total: number;
  };
  holidays: Array<{
    date: string;
    occasion: string;
  }>;
  documents: Array<{
    document_id: string;
    document_name: string;
    status: string;
    expiry_date: string | null;
    days_left: number | null;
  }>;
  salary: {
    month: number;
    year: number;
    basic: number;
    hra: number;
    conveyance: number;
    special_allowance: number;
    ot_earnings: number;
    gross: number;
    pf: number;
    esi: number;
    tax: number;
    net_salary: number;
    payment_status: string;
  };
  performance: {
    kpi_score: number;
    trend: number[];
    month_labels: string[];
    attendance_score: number;
    productivity_score: number;
    quality_score: number;
    safety_score: number;
    feedback: string;
  };
  achievements: Array<{
    achievement_text: string;
    date: string;
    category: string;
  }>;
  notifications: Array<{
    notification_id: string;
    type: string;
    message: string;
    created_at: string;
    is_read: boolean;
  }>;
  tasks: Array<{
    task_id: string;
    task_description: string;
    due_date: string;
    status: string;
    priority: string;
  }>;
}

export function EmployeeDashboard() {
  const currentDate = new Date();
  const thirtyDaysAgo = new Date(currentDate);
  thirtyDaysAgo.setDate(currentDate.getDate() - 30);

  const [fromDate, setFromDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(currentDate.toISOString().split('T')[0]);
  const [dateRangeData, setDateRangeData] = useState(() =>
    generateDateRangeData(thirtyDaysAgo, currentDate)
  );
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_AI_URL}/webhook/clms-dashboard`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'personal_dashboard', employeeId: '10002' }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Personal Dashboard API Response:', result);

        const actualData = result.data || result;
        setDashboardData(actualData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
        console.error('Error fetching personal dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSubmit = () => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (from > to) {
      alert('From date must be before To date');
      return;
    }
    setDateRangeData(generateDateRangeData(from, to));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">Error Loading Dashboard</h3>
        </div>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const workingDays = dateRangeData.filter(d => d.type !== 'weekend');
  const assignedShifts = workingDays.length;
  const shiftsAttended = workingDays.filter(d => d.type === 'present').length;
  const shiftsAbsent = workingDays.filter(d => d.type === 'absent').length;
  const lateComingCount = workingDays.filter(d => d.isLate).length;
  const earlyExitCount = workingDays.filter(d => d.isEarlyOut).length;

  const totalHours = workingDays.reduce((sum, d) => sum + (d.hours || 0), 0);
  const regularHoursNum = shiftsAttended * 8;
  const overtimeHoursNum = Math.max(0, totalHours - regularHoursNum);
  const shiftAdherence = assignedShifts > 0 ? Math.round((shiftsAttended / assignedShifts) * 100 * 10) / 10 : 0;

  const formatHours = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  const shiftCounts = {
    A: workingDays.filter(d => d.shift === 'A' && d.type === 'present').length,
    B: workingDays.filter(d => d.shift === 'B' && d.type === 'present').length,
    C: workingDays.filter(d => d.shift === 'C' && d.type === 'present').length,
  };

  const trendData = dateRangeData.map(d => ({
    status: d.type === 'present' ? 1 : 0,
    shift: d.shift,
    type: d.type,
    date: d.date,
  }));

  const employeeData = dashboardData.employee ? {
    photo: dashboardData.employee.photo_url || null,
    name: dashboardData.employee.name || 'Unknown',
    employeeId: dashboardData.employee.employee_id || 'N/A',
    department: dashboardData.employee.department || 'N/A',
    location: dashboardData.employee.location || 'N/A',
    reportingManager: dashboardData.employee.reporting_manager || 'N/A',
    role: dashboardData.employee.role || 'N/A',
    grade: dashboardData.employee.grade || 'N/A',
    shiftType: dashboardData.employee.shift_type || 'N/A',
    email: dashboardData.employee.email || 'N/A',
    phone: dashboardData.employee.phone || 'N/A',
  } : {
    photo: null,
    name: 'Unknown',
    employeeId: 'N/A',
    department: 'N/A',
    location: 'N/A',
    reportingManager: 'N/A',
    role: 'N/A',
    grade: 'N/A',
    shiftType: 'N/A',
    email: 'N/A',
    phone: 'N/A',
  };

  const reportingHierarchy = dashboardData.reporting_hierarchy || [];

  const shiftData = {
    assignedShifts,
    shiftsAttended,
    shiftsAbsent,
    totalShiftHours: formatHours(totalHours),
    regularHours: formatHours(regularHoursNum),
    overtimeHours: formatHours(overtimeHoursNum),
    lateComingCount,
    earlyExitCount,
    shiftAdherence,
    shiftCounts,
    trendData,
  };

  const todayPunch = dashboardData.today_punch || null;

  const leaves = (dashboardData.leaves || []).map(leave => ({
    date: leave.from_date === leave.to_date
      ? new Date(leave.from_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : `${new Date(leave.from_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(leave.to_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    type: leave.leave_type,
    days: leave.days,
    status: leave.status
  }));

  const leaveBalance = dashboardData.leave_balance ? {
    casual: { taken: dashboardData.leave_balance.casual_taken, total: dashboardData.leave_balance.casual_total },
    sick: { taken: dashboardData.leave_balance.sick_taken, total: dashboardData.leave_balance.sick_total },
    privilege: { taken: dashboardData.leave_balance.privilege_taken, total: dashboardData.leave_balance.privilege_total },
  } : null;

  const holidays = (dashboardData.holidays || []).map(holiday => ({
    date: new Date(holiday.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    occasion: holiday.occasion
  }));

  const documents = (dashboardData.documents || []).map(doc => ({
    name: doc.document_name,
    status: doc.status,
    expiry: doc.expiry_date
      ? new Date(doc.expiry_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'Valid',
    daysLeft: doc.days_left
  }));

  const salary = dashboardData.salary || null;

  const performance = dashboardData.performance ? {
    kpiScore: dashboardData.performance.kpi_score,
    trend: dashboardData.performance.trend,
    monthLabels: dashboardData.performance.month_labels,
    attendance: dashboardData.performance.attendance_score,
    productivity: dashboardData.performance.productivity_score,
    quality: dashboardData.performance.quality_score,
    safety: dashboardData.performance.safety_score,
    achievements: (dashboardData.achievements || []).map(a => a.achievement_text),
    feedback: dashboardData.performance.feedback,
  } : {
    kpiScore: 0,
    trend: [],
    monthLabels: [],
    attendance: [],
    productivity: [],
    quality: [],
    safety: [],
    achievements: [],
    feedback: null,
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const notifications = (dashboardData.notifications || []).map(notif => ({
    type: notif.type,
    message: notif.message,
    date: formatTimeAgo(notif.created_at)
  }));

  const tasks = (dashboardData.tasks || []).map(task => ({
    task: task.task_description,
    due: new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-center items-stretch flex-wrap gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1 min-w-[280px] max-w-[400px]">
          <div className="text-center mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
              {employeeData.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{employeeData.name}</h2>
            <p className="text-sm text-slate-600">{employeeData.employeeId}</p>
          </div>

          <div className="space-y-3 mt-6">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-slate-600">Role</p>
                <p className="font-medium text-slate-900">{employeeData.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-slate-600">Department / Location</p>
                <p className="font-medium text-slate-900">
                  {employeeData.department} / {employeeData.location}
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUp className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-bold text-slate-700">Reporting Hierarchy</p>
              </div>
              <div className="space-y-2">
                {[...reportingHierarchy].reverse().map((superior, idx) => (
                  <div
                    key={idx}
                    className="relative pl-4 pb-2"
                  >
                    {idx < reportingHierarchy.length && (
                      <div className="absolute left-0 top-6 bottom-0 w-px bg-blue-300"></div>
                    )}
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{superior.name}</p>
                        <p className="text-[10px] text-slate-600">{superior.role}</p>
                        <p className="text-[9px] text-slate-500">{superior.department}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="relative pl-4 pb-2">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{employeeData.name}</p>
                      <p className="text-[10px] text-slate-600">{employeeData.role}</p>
                      <p className="text-[9px] text-slate-500">{employeeData.department}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-slate-600">Shift</p>
                <p className="font-medium text-slate-900">{employeeData.shiftType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-slate-600">Email</p>
                <p className="font-medium text-slate-900 text-xs">{employeeData.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-slate-600">Phone</p>
                <p className="font-medium text-slate-900">{employeeData.phone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 flex-1 min-w-[320px] max-w-[900px]">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Today's Punch Details</h3>
            </div>
            {todayPunch ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <LogIn className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs text-slate-600">IN Punch</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">{todayPunch.in_time || 'N/A'}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <LogOut className="w-4 h-4 text-orange-600" />
                    <p className="text-xs text-slate-600">OUT Punch</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {todayPunch.out_time || 'Pending'}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-slate-600">Hours Worked</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{todayPunch.hours_worked}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <p className="text-xs text-slate-600">Status</p>
                  </div>
                  <p className="text-sm font-bold text-purple-600">{todayPunch.status}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No punch data available
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-slate-900">Shift Summary</h3>
            </div>
            <div className="mb-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{shiftData.assignedShifts}</p>
                <p className="text-xs text-slate-600">Assigned Shifts</p>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">{shiftData.shiftsAttended}</p>
                <p className="text-xs text-slate-600">Shifts Attended</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{shiftData.shiftsAbsent}</p>
                <p className="text-xs text-slate-600">Shifts Absent</p>
              </div>
              <div className="text-center p-3 bg-teal-50 rounded-lg">
                <p className="text-2xl font-bold text-teal-600">
                  {shiftData.shiftAdherence}%
                </p>
                <p className="text-xs text-slate-600">Shift Adherence</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-700">{shiftData.totalShiftHours}</p>
                <p className="text-xs text-slate-600">Total Hours</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{shiftData.regularHours}</p>
                <p className="text-xs text-slate-600">Regular Hours</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{shiftData.overtimeHours}</p>
                <p className="text-xs text-slate-600">OT Hours</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">
                  {shiftData.lateComingCount + shiftData.earlyExitCount}
                </p>
                <p className="text-xs text-slate-600">Late/Early</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-700 mb-2">Shift Breakdown</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-cyan-50 rounded-lg">
                  <p className="text-lg font-bold text-cyan-600">{shiftData.shiftCounts.A}</p>
                  <p className="text-xs text-cyan-600">A Shift</p>
                  <p className="text-xs text-cyan-500">(6AM-2PM)</p>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded-lg">
                  <p className="text-lg font-bold text-orange-600">{shiftData.shiftCounts.B}</p>
                  <p className="text-xs text-orange-600">B Shift</p>
                  <p className="text-xs text-orange-500">(2PM-10PM)</p>
                </div>
                <div className="text-center p-2 bg-indigo-50 rounded-lg">
                  <p className="text-lg font-bold text-indigo-600">{shiftData.shiftCounts.C}</p>
                  <p className="text-xs text-indigo-600">C Shift</p>
                  <p className="text-xs text-indigo-500">(10PM-6AM)</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-2">
                Shift Attendance ({new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})
              </p>
              <div className="flex gap-0.5">
                {shiftData.trendData.map((day, idx) => {
                  let bgColor = 'bg-gray-200';
                  let titleText = 'Weekend';

                  if (day.type === 'weekend') {
                    bgColor = 'bg-gray-200';
                    titleText = 'Weekend';
                  } else if (day.status === 0) {
                    bgColor = 'bg-red-300';
                    titleText = 'Absent';
                  } else if (day.shift === 'A') {
                    bgColor = 'bg-cyan-400';
                    titleText = 'A Shift';
                  } else if (day.shift === 'B') {
                    bgColor = 'bg-orange-400';
                    titleText = 'B Shift';
                  } else if (day.shift === 'C') {
                    bgColor = 'bg-indigo-400';
                    titleText = 'C Shift';
                  }

                  const dateNum = day.date ? new Date(day.date).getDate() : idx + 1;

                  return (
                    <div
                      key={idx}
                      className={`flex-1 h-8 rounded ${bgColor} flex items-center justify-center`}
                      title={`${titleText} - ${dateNum}`}
                    >
                      <span className="text-[10px] font-medium text-slate-800">{dateNum}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <AttendanceCalendar />
      </div>

      <div className="flex justify-center items-stretch flex-wrap gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1 min-w-[320px] max-w-[600px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Leave & Holidays</h3>
            </div>
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              Apply Leave
            </button>
          </div>

          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-bold text-slate-700">Applied Leaves</h4>
            {leaves.map((leave, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-900">{leave.type}</p>
                  <p className="text-xs text-slate-600">{leave.date}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-medium ${
                    leave.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : leave.status === 'Pending'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {leave.status}
                </span>
              </div>
            ))}
          </div>

          {leaveBalance && (
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-bold text-slate-700">Leave Balance</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-lg font-bold text-blue-600">
                    {leaveBalance.casual.total - leaveBalance.casual.taken}
                  </p>
                  <p className="text-xs text-slate-600">Casual</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg text-center">
                  <p className="text-lg font-bold text-orange-600">
                    {leaveBalance.sick.total - leaveBalance.sick.taken}
                  </p>
                  <p className="text-xs text-slate-600">Sick</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg text-center">
                  <p className="text-lg font-bold text-purple-600">
                    {leaveBalance.privilege.total - leaveBalance.privilege.taken}
                  </p>
                  <p className="text-xs text-slate-600">Privilege</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-700">Upcoming Holidays</h4>
            {holidays.map((holiday, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <span className="text-sm text-slate-900">{holiday.occasion}</span>
                <span className="text-xs text-slate-600">{holiday.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1 min-w-[320px] max-w-[600px]">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">Compliance & Documents</h3>
          </div>
          <div className="space-y-3">
            {documents.map((doc, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border-l-4 ${
                  doc.status === 'valid'
                    ? 'bg-emerald-50 border-emerald-500'
                    : doc.status === 'expiring'
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                    <p className="text-xs text-slate-600">Expiry: {doc.expiry}</p>
                    {doc.daysLeft !== null && doc.daysLeft < 60 && (
                      <p className="text-xs text-orange-600 font-medium mt-1">
                        Expiring in {doc.daysLeft} days
                      </p>
                    )}
                  </div>
                  {doc.status === 'valid' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                  {doc.status === 'expiring' && <AlertCircle className="w-5 h-5 text-orange-600" />}
                  {doc.status === 'completed' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center items-stretch flex-wrap gap-6">
        {salary ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1 min-w-[320px] max-w-[600px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-slate-900">Payslip & Salary</h3>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm text-slate-600">Net Salary ({new Date(salary.year, salary.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})</p>
                <p className="text-3xl font-bold text-emerald-600">
                  ₹{salary.net_salary.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-700">Earnings</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Basic Salary</span>
                  <span className="font-medium text-slate-900">₹{salary.basic.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">HRA</span>
                  <span className="font-medium text-slate-900">₹{salary.hra.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Conveyance</span>
                  <span className="font-medium text-slate-900">
                    ₹{salary.conveyance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Special Allowance</span>
                  <span className="font-medium text-slate-900">
                    ₹{salary.special_allowance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">OT Earnings</span>
                  <span className="font-medium text-emerald-600">
                    ₹{salary.ot_earnings.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2">
                  <span className="text-slate-700">Gross Salary</span>
                  <span className="text-slate-900">₹{salary.gross.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <h4 className="text-sm font-bold text-slate-700">Deductions</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">PF</span>
                  <span className="font-medium text-red-600">₹{salary.pf.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">ESI</span>
                  <span className="font-medium text-red-600">₹{salary.esi.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax</span>
                  <span className="font-medium text-red-600">₹{salary.tax.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1 min-w-[320px] max-w-[600px]">
            <div className="flex items-center gap-2 mb-4">
              <IndianRupee className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-slate-900">Payslip & Salary</h3>
            </div>
            <div className="text-center py-8 text-slate-500">
              No salary data available
            </div>
          </div>
        )}

        <div className="space-y-6 flex-1 min-w-[320px] max-w-[600px]">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-slate-900">Performance</h3>
            </div>
            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-purple-600">{performance.kpiScore}</p>
              <p className="text-sm text-slate-600">KPI Score</p>
            </div>
            <div className="mb-4 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <p className="text-xs font-bold text-purple-900 mb-1">Formula:</p>
              <p className="text-xs text-purple-800">
                KPI = (Attendance × 0.25) + (Productivity × 0.35) + (Quality × 0.25) + (Safety × 0.15)
              </p>
              <p className="text-xs text-purple-700 mt-1">
                = ({performance.attendance} × 0.25) + ({performance.productivity} × 0.35) + ({performance.quality} × 0.25) + ({performance.safety} × 0.15) = {performance.kpiScore}
              </p>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-xs text-slate-600">Last 6 Months Trend</p>
              <div className="flex items-end justify-between gap-1 h-24 border-b border-gray-200">
                {performance?.trend?.map((score: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                    <span className="text-xs font-bold text-purple-600">{score}</span>
                    <div
                      className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t"
                      style={{ height: `${(score / 100) * 80}%`, minHeight: '10px' }}
                    />
                    <span className="text-[9px] text-slate-500 mt-1">
                      {performance.monthLabels[idx]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-700">Recent Achievements</p>
              {performance.achievements.map((achievement, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{achievement}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-slate-900">Tasks & Notifications</h3>
            </div>
            <div className="space-y-2">
              {notifications.map((notif, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-l-4 ${
                    notif.type === 'warning'
                      ? 'bg-orange-50 border-orange-500'
                      : notif.type === 'success'
                      ? 'bg-emerald-50 border-emerald-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900">{notif.message}</p>
                  <p className="text-xs text-slate-600 mt-1">{notif.date}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-bold text-slate-700 mb-2">Pending Tasks</p>
              {tasks.map((task, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded mb-2">
                  <span className="text-sm text-slate-900">{task.task}</span>
                  <span className="text-xs text-slate-600">{task.due}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Edit className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Self-Service Actions</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <button className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Calendar className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-slate-900">Apply Leave</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
            <Clock className="w-6 h-6 text-emerald-600" />
            <span className="text-sm font-medium text-slate-900">Regularize</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Edit className="w-6 h-6 text-purple-600" />
            <span className="text-sm font-medium text-slate-900">Update Profile</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <Download className="w-6 h-6 text-orange-600" />
            <span className="text-sm font-medium text-slate-900">Documents</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <span className="text-sm font-medium text-slate-900">Raise Query</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
            <Phone className="w-6 h-6 text-teal-600" />
            <span className="text-sm font-medium text-slate-900">Contact HR</span>
          </button>
        </div>
      </div>
    </div>
  );
}
