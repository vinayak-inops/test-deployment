import { useState, useEffect } from 'react';
import { Calendar, AlertCircle, Clock } from 'lucide-react';
import { fetchAttendanceData, AttendanceData } from '@/components/services/apiService';
import { ScrollIndicator } from './ScrollIndicator';

function getHeatmapColor(value: number): string {
  if (value >= 95) return 'bg-emerald-500';
  if (value >= 90) return 'bg-emerald-400';
  if (value >= 85) return 'bg-yellow-400';
  if (value >= 80) return 'bg-orange-400';
  return 'bg-red-400';
}

export function AttendanceDeployment() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchAttendanceData();
        setAttendanceData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load attendance data');
        console.error('Error loading attendance data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-emerald-600 rounded-lg p-2.5">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Attendance & OT Utilization Summary</h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !attendanceData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-emerald-600 rounded-lg p-2.5">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Attendance & OT Utilization Summary</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-800 font-medium mb-1">Failed to load data</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const maxOT = attendanceData.otTrendData.length > 0
    ? Math.max(...attendanceData.otTrendData.map((d) => d.hours))
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-emerald-600 rounded-lg p-2.5">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Attendance & OT Utilization Summary</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Attendance Heatmap by Site
            </h3>
          </div>
          {attendanceData.attendanceHeatmap.length > 0 ? (
            <div className="flex flex-col flex-1 relative">
              <div id="attendance-heatmap-scroll" className="overflow-y-auto max-h-[500px] pr-2">
                <table className="w-full min-w-max">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr>
                      <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4 min-w-[120px]">Site</th>
                      <th className="text-center text-xs font-medium text-slate-500 pb-3 px-2">Mon</th>
                      <th className="text-center text-xs font-medium text-slate-500 pb-3 px-2">Tue</th>
                      <th className="text-center text-xs font-medium text-slate-500 pb-3 px-2">Wed</th>
                      <th className="text-center text-xs font-medium text-slate-500 pb-3 px-2">Thu</th>
                      <th className="text-center text-xs font-medium text-slate-500 pb-3 px-2">Fri</th>
                      <th className="text-center text-xs font-medium text-slate-500 pb-3 px-2">Sat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.attendanceHeatmap.map((row) => (
                      <tr key={row.site}>
                        <td className="py-2 text-sm font-medium text-slate-700 pr-4">{row.site}</td>
                        {['mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((day) => {
                          const value = row[day as keyof typeof row] as number;
                          return (
                            <td key={day} className="text-center px-2">
                              <div
                                className={`${getHeatmapColor(
                                  value
                                )} rounded-lg py-2 px-3 text-white text-sm font-bold transition-all duration-300 hover:scale-105 whitespace-nowrap`}
                              >
                                {value}%
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 flex-wrap">
                <span className="text-xs text-slate-600">Legend:</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                  <span className="text-xs text-slate-600">95%+</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-emerald-400 rounded"></div>
                  <span className="text-xs text-slate-600">90-94%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-xs text-slate-600">85-89%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-orange-400 rounded"></div>
                  <span className="text-xs text-slate-600">80-84%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-400 rounded"></div>
                  <span className="text-xs text-slate-600">&lt;80%</span>
                </div>
              </div>
              <ScrollIndicator containerId="attendance-heatmap-scroll" />
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No attendance heatmap data available
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-slate-900">High Absenteeism Sites</h3>
          </div>
          {attendanceData.highAbsenteeismSites.length > 0 ? (
            <div className="relative mt-6 mb-6">
              <div id="absenteeism-scroll" className="space-y-4 overflow-y-auto max-h-[500px] pr-2 hide-scrollbar">
              {attendanceData.highAbsenteeismSites.map((site) => (
                <div
                  key={site.site}
                  className={`p-4 rounded-lg border-l-4 ${
                    site.alert === 'high'
                      ? 'bg-red-50 border-red-500'
                      : site.alert === 'medium'
                      ? 'bg-orange-50 border-orange-500'
                      : 'bg-yellow-50 border-yellow-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold text-slate-900">{site.site}</span>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        site.alert === 'high'
                          ? 'bg-red-200 text-red-800'
                          : site.alert === 'medium'
                          ? 'bg-orange-200 text-orange-800'
                          : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      {site.alert.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{site.avgAbsenteeism}%</p>
                  <p className="text-xs text-slate-600 mt-1">Avg. Absenteeism (Weekly)</p>
                </div>
              ))}
              </div>
              <ScrollIndicator containerId="absenteeism-scroll" />
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No high absenteeism alerts
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-slate-900">OT Utilization Trend</h3>
          </div>
          {attendanceData.otTrendData.length > 0 ? (
            <div className="relative mt-6 mb-6">
              <div id="ot-trend-scroll" className="space-y-2 overflow-y-auto max-h-[400px] pr-2 hide-scrollbar">
                {attendanceData.otTrendData.map((data) => (
                  <div key={data.month} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-12 flex-shrink-0">{data.month}</span>
                    <div className="flex-1 relative">
                      <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500 flex items-center justify-end pr-3"
                          style={{ width: `${(data.hours / maxOT) * 100}%` }}
                        >
                          <span className="text-white text-xs font-bold">{data.hours}h</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900 w-12 text-right">
                      {data.percentage}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total OT Hours ({attendanceData.otTrendData[attendanceData.otTrendData.length - 1].month}):</span>
                  <span className="font-bold text-slate-900">
                    {attendanceData.otTrendData[attendanceData.otTrendData.length - 1].hours.toLocaleString()}h
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-slate-600">As % of Total Hours:</span>
                  <span className="font-bold text-purple-600">
                    {attendanceData.otTrendData[attendanceData.otTrendData.length - 1].percentage}%
                  </span>
                </div>
              </div>
              <ScrollIndicator containerId="ot-trend-scroll" />
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No OT trend data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
