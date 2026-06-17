import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'leave' | 'holiday' | 'weekend';
  inTime?: string;
  outTime?: string;
  hoursWorked?: string;
  leaveType?: string;
  isLate?: boolean;
  isEarlyOut?: boolean;
  shift?: string;
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const generateCalendarData = (year: number, month: number): AttendanceRecord[] => {
  const data: AttendanceRecord[] = [];
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
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      data.push({
        date: dateStr,
        status: 'weekend',
      });
    } else {
      const isPresent = isCurrentMonth ? patternForNovember2024[day - 1] === 1 : Math.random() < 0.85;
      const shift = shiftPattern[workingDayIndex % shiftPattern.length];

      if (isPresent) {
        const shouldBeLate = lateCount < targetLate && Math.random() < 0.15;
        const shouldBeEarly = earlyCount < targetEarly && !shouldBeLate && Math.random() < 0.08;

        let inHour, outHour, shiftLabel;
        if (shift === 'A') {
          inHour = shouldBeLate ? 6 : 6;
          outHour = shouldBeEarly ? 13 : 14 + Math.floor(Math.random() * 3);
          shiftLabel = 'A (6AM-2PM)';
        } else if (shift === 'B') {
          inHour = shouldBeLate ? 14 : 14;
          outHour = shouldBeEarly ? 21 : 22 + Math.floor(Math.random() * 2);
          shiftLabel = 'B (2PM-10PM)';
        } else {
          inHour = shouldBeLate ? 22 : 22;
          outHour = shouldBeEarly ? 5 : 6 + Math.floor(Math.random() * 2);
          shiftLabel = 'C (10PM-6AM)';
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
          date: dateStr,
          status: 'present',
          inTime: `${String(inHour).padStart(2, '0')}:${String(inMin).padStart(2, '0')}`,
          outTime: `${String(outHour >= 24 ? outHour - 24 : outHour).padStart(2, '0')}:${String(outMin).padStart(2, '0')}`,
          hoursWorked: `${Math.floor(actualHours)}:${String(Math.round((actualHours % 1) * 60)).padStart(2, '0')}`,
          isLate,
          isEarlyOut,
          shift: shiftLabel,
        });
      } else {
        data.push({
          date: dateStr,
          status: 'absent',
          shift: `${shift} (${shift === 'A' ? '6AM-2PM' : shift === 'B' ? '2PM-10PM' : '10PM-6AM'})`,
        });
      }

      workingDayIndex++;
    }
  }

  return data;
};

export function AttendanceCalendar() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());

  const calendarData = generateCalendarData(selectedYear, selectedMonth);
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getStatusColor = (status: AttendanceRecord['status'], isLate?: boolean, isEarlyOut?: boolean) => {
    if (status === 'present' && (isLate || isEarlyOut)) {
      return 'bg-yellow-50 border-yellow-400 text-slate-800';
    }

    switch (status) {
      case 'present':
        return 'bg-emerald-50 border-emerald-400 text-slate-800';
      case 'absent':
        return 'bg-red-50 border-red-400 text-slate-800';
      case 'leave':
        return 'bg-blue-50 border-blue-400 text-slate-800';
      case 'holiday':
        return 'bg-purple-50 border-purple-400 text-slate-800';
      case 'weekend':
        return 'bg-slate-50 border-slate-300 text-slate-600';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const summary = {
    present: calendarData.filter((d) => d.status === 'present').length,
    absent: calendarData.filter((d) => d.status === 'absent').length,
    leave: calendarData.filter((d) => d.status === 'leave').length,
    late: calendarData.filter((d) => d.isLate).length,
    earlyOut: calendarData.filter((d) => d.isEarlyOut).length,
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Attendance Calendar</h3>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {monthNames.map((month, idx) => (
              <option key={month} value={idx}>
                {month}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-bold text-slate-600 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {emptyCells.map((i) => (
          <div key={`empty-${i}`} className="h-24" />
        ))}
        {calendarData.map((record, idx) => {
          const day = idx + 1;
          return (
            <div
              key={record.date}
              className={`h-24 rounded-lg border-2 ${getStatusColor(
                record.status,
                record.isLate,
                record.isEarlyOut
              )}`}
            >
              <div className="h-full flex flex-col items-start justify-start p-1.5 text-left overflow-hidden">
                <span className="text-xs font-bold mb-1">{day}</span>
                {record.status === 'present' && (
                  <>
                    <div className="text-[8px] leading-tight font-bold text-slate-700 mb-0.5">
                      {record.shift}
                    </div>
                    <div className="text-[9px] leading-tight text-slate-600">
                      In: {record.inTime}
                    </div>
                    <div className="text-[9px] leading-tight text-slate-600">
                      Out: {record.outTime}
                    </div>
                    <div className="text-[9px] leading-tight font-semibold text-slate-700 mt-0.5">
                      {record.hoursWorked}h
                    </div>
                    {(record.isLate || record.isEarlyOut) && (
                      <div className="text-[8px] font-bold text-yellow-700 mt-0.5">
                        {record.isLate && 'Late'}
                        {record.isLate && record.isEarlyOut && '/'}
                        {record.isEarlyOut && 'Early'}
                      </div>
                    )}
                  </>
                )}
                {record.status === 'absent' && (
                  <>
                    <div className="text-[8px] leading-tight font-bold text-slate-700 mb-0.5">
                      {record.shift}
                    </div>
                    <div className="text-[10px] font-bold text-red-600">Absent</div>
                  </>
                )}
                {record.status === 'leave' && (
                  <div className="text-[10px] font-bold text-blue-600">Leave</div>
                )}
                {record.status === 'holiday' && (
                  <div className="text-[10px] font-bold text-purple-600">Holiday</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-emerald-400 bg-emerald-50" />
          <span className="text-slate-600">Present: {summary.present}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-red-400 bg-red-50" />
          <span className="text-slate-600">Absent: {summary.absent}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-yellow-400 bg-yellow-50" />
          <span className="text-slate-600">Late/Early: {summary.late + summary.earlyOut}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-slate-300 bg-slate-50" />
          <span className="text-slate-600">Weekend</span>
        </div>
      </div>
    </div>
  );
}
