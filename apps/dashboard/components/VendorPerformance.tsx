import { Award, TrendingUp, Shield, Users, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchVendorPerformanceData, type VendorPerformanceData } from '@/components/services/apiService';
import { ScrollIndicator } from './ScrollIndicator';

export function VendorPerformance() {
  const [data, setData] = useState<VendorPerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const maxScore = 100;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await fetchVendorPerformanceData();
        setData(result);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load data: ${errorMessage}`);
        console.error('Error fetching vendor performance:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-orange-600 rounded-lg p-2.5">
            <Award className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Vendor / Contractor Performance Scorecard</h2>
        </div>
        <div className="flex justify-center items-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
            <p className="text-slate-600">Loading vendor performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-orange-600 rounded-lg p-2.5">
            <Award className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Vendor / Contractor Performance Scorecard</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium">{error || 'No data available'}</p>
          <p className="text-red-600 text-sm mt-2">Make sure the API is accessible and CORS is properly configured.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-orange-600 rounded-lg p-2.5">
          <Award className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Vendor / Contractor Performance Scorecard</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-slate-900">Overall Vendor Performance</h3>
          </div>
          <div className="relative mt-6 mb-6">
            <div id="vendor-performance-scroll" className="space-y-4 overflow-y-auto max-h-[500px] pr-2 hide-scrollbar">
            {data.vendorScores.map((vendor) => (
              <div key={vendor.vendor}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-700">{vendor.vendor}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        Penalties: {vendor.penalties}
                      </span>
                      {vendor.penalties > 3 && (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{vendor.overall}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      vendor.overall >= 90
                        ? 'bg-emerald-500'
                        : vendor.overall >= 80
                        ? 'bg-blue-500'
                        : vendor.overall >= 70
                        ? 'bg-orange-400'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${vendor.overall}%` }}
                  />
                </div>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Attend</p>
                    <p className="text-xs font-bold text-slate-900">{vendor.attendance}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">SLA</p>
                    <p className="text-xs font-bold text-slate-900">{vendor.sla}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Stable</p>
                    <p className="text-xs font-bold text-slate-900">{vendor.stability}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Safety</p>
                    <p className="text-xs font-bold text-slate-900">{vendor.safety}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Penalty</p>
                    <p className="text-xs font-bold text-red-600">{vendor.penalties}</p>
                  </div>
                </div>
              </div>
            ))}
            </div>
            <ScrollIndicator containerId="vendor-performance-scroll" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Attendance Reliability</h3>
            </div>
            <div className="relative mt-6 mb-6">
              <div id="attendance-reliability-scroll" className="space-y-3 overflow-y-auto max-h-[220px] pr-2 hide-scrollbar">
              {data.attendanceReliability.map((item) => (
                <div key={item.vendor} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{item.vendor}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{item.rate}%</span>
                        {item.trend === 'up' && (
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                        )}
                        {item.trend === 'down' && (
                          <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                        )}
                        {item.trend === 'stable' && (
                          <div className="w-4 h-0.5 bg-slate-400"></div>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              </div>
              <ScrollIndicator containerId="attendance-reliability-scroll" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-slate-900">SLA Compliance</h3>
            </div>
            <div className="relative mt-6 mb-6">
              <div id="sla-compliance-scroll" className="space-y-3 overflow-y-auto max-h-[220px] pr-2 hide-scrollbar">
              {data.slaCompliance.map((item) => (
                <div key={item.metric}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-700">{item.metric}</span>
                    <span className="text-sm font-bold text-slate-900">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        item.value >= 90
                          ? 'bg-emerald-500'
                          : item.value >= 80
                          ? 'bg-blue-500'
                          : 'bg-orange-400'
                      }`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
              </div>
              <ScrollIndicator containerId="sla-compliance-scroll" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-slate-900">Workforce Stability Analysis</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {data.workforceStability.map((item) => (
            <div
              key={item.vendor}
              className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-white border border-gray-100"
            >
              <p className="text-sm font-semibold text-slate-900 mb-3">{item.vendor}</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500">Attrition Rate</p>
                  <p className="text-xl font-bold text-red-600">{item.attrition}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Rotation Rate</p>
                  <p className="text-xl font-bold text-orange-600">{item.rotation}%</p>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-slate-500">Stability Score</p>
                  <p className="text-2xl font-bold text-emerald-600">{item.score}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
