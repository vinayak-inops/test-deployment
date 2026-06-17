import { Users, PieChart, BarChart3, TrendingUp } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { fetchWorkforceCompositionDetails, type WorkforceCompositionData } from '@/components/services/apiService';
import { ScrollIndicator } from './ScrollIndicator';

export function WorkforceComposition() {
  const [data, setData] = useState<WorkforceCompositionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const diversityScrollRef = useRef<HTMLDivElement>(null);
  const deptScrollRef = useRef<HTMLDivElement>(null);
  const siteScrollRef = useRef<HTMLDivElement>(null);
  const vendorScrollRef = useRef<HTMLDivElement>(null);
  const trendScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await fetchWorkforceCompositionDetails();
        setData(result);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load data: ${errorMessage}`);
        console.error('Error fetching workforce composition:', err);
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
          <div className="bg-slate-600 rounded-lg p-2.5">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Workforce Composition</h2>
        </div>
        <div className="flex justify-center items-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-600">Loading workforce composition data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-slate-600 rounded-lg p-2.5">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Workforce Composition</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium">{error || 'No data available'}</p>
          <p className="text-red-600 text-sm mt-2">Make sure the API is accessible and CORS is properly configured.</p>
        </div>
      </div>
    );
  }

  if (!data.trendData || !data.departmentData || !data.siteData || !data.vendorData || !data.diversityData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-slate-600 rounded-lg p-2.5">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Workforce Composition</h2>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800 font-medium">Incomplete data received from API</p>
          <p className="text-yellow-600 text-sm mt-2">Some required fields are missing in the API response.</p>
        </div>
      </div>
    );
  }

  const maxTrend = data.trendData.length > 0 ? Math.max(...data.trendData.map((d) => d.total)) : 1;
  const maxDept = data.departmentData.length > 0 ? Math.max(...data.departmentData.map((d) => d.total)) : 1;
  const maxSite = data.siteData.length > 0 ? Math.max(...data.siteData.map((d) => d.total)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-slate-600 rounded-lg p-2.5">
          <Users className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Workforce Composition</h2>
      </div>

      <div className="flex justify-center items-stretch flex-wrap gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1 min-w-[280px] max-w-[550px] flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-slate-900">Diversity Metrics</h3>
          </div>

          <div className="relative flex-1 mt-6 mb-6">
          <div
            id="diversity-scroll"
            className="space-y-6 overflow-y-auto overflow-x-hidden max-h-[200px] pr-2 hide-scrollbar"
          >
              <div>
                <h4 className="text-sm font-semibold text-slate-600 mb-4">Gender Distribution</h4>
                <div className="flex h-12 rounded-lg overflow-hidden mb-4">
                  {data.diversityData.gender.map((item, idx) => {
                    const colors = ['bg-blue-500', 'bg-pink-500', 'bg-slate-400', 'bg-amber-500'];
                    return (
                      <div
                        key={item.label}
                        className={`${colors[idx]} transition-all duration-500 flex items-center justify-center`}
                        style={{ width: `${item.percentage}%` }}
                        title={`${item.label}: ${item.value}`}
                      >
                        {item.percentage > 10 && (
                          <span className="text-white text-xs font-medium">
                            {item.percentage}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {data.diversityData.gender.map((item, idx) => {
                    const colors = ['text-blue-600', 'text-pink-600', 'text-slate-600', 'text-amber-600'];
                    return (
                      <div key={item.label} className="text-center">
                        <p className={`text-2xl font-bold ${colors[idx]}`}>{item.value}</p>
                        <p className="text-xs text-slate-500">{item.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-slate-600 mb-4">Age Distribution</h4>
                <div className="space-y-3">
                  {data.diversityData.age.map((item) => {
                    const maxAge = Math.max(...data.diversityData.age.map((a) => a.value));
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-700">{item.label}</span>
                          <span className="text-sm font-bold text-slate-900">{item.value}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                            style={{ width: `${(item.value / maxAge) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <ScrollIndicator containerId="diversity-scroll" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1 min-w-[280px] max-w-[400px] flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">By Department</h3>
          </div>
          <div className="relative flex-1 mt-6 mb-6">
          <div
            id="dept-scroll"
            className="space-y-4 overflow-y-auto max-h-[200px] pr-2 hide-scrollbar"
          >
              {data.departmentData.map((dept) => (
                <div key={dept.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700">{dept.name}</span>
                    <span className="text-sm font-bold text-slate-900">{dept.total}</span>
                  </div>
                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                      style={{ width: `${(dept.total / maxDept) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <ScrollIndicator containerId="dept-scroll" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1 min-w-[280px] max-w-[400px] flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-slate-900">By Site/Location</h3>
          </div>
          <div className="relative flex-1 mt-6 mb-6">
          <div
            id="site-scroll"
            className="space-y-4 overflow-y-auto max-h-[200px] pr-2 hide-scrollbar"
          >
              {data.siteData.map((site) => (
                <div key={site.name}>
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span className="text-sm font-medium text-slate-700 block">{site.name}</span>
                      <span className="text-xs text-slate-500">{site.location}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{site.total}</span>
                  </div>
                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${(site.total / maxSite) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <ScrollIndicator containerId="site-scroll" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1 min-w-[280px] max-w-[400px] flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-slate-900">By Contractor/Vendor</h3>
          </div>
          <div className="relative flex-1 mt-6 mb-6">
          <div
            id="vendor-scroll"
            className="space-y-4 overflow-y-auto max-h-[200px] pr-2 hide-scrollbar"
          >
              {data.vendorData.map((vendor) => {
                const maxVendor = Math.max(...data.vendorData.map((v) => v.count));
                return (
                  <div key={vendor.name}>
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="text-sm font-medium text-slate-700 block">{vendor.name}</span>
                        {vendor.category && <span className="text-xs text-slate-500">{vendor.category}</span>}
                      </div>
                      <span className="text-sm font-bold text-slate-900">{vendor.count}</span>
                    </div>
                    <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="absolute h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                        style={{ width: `${(vendor.count / maxVendor) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <ScrollIndicator containerId="vendor-scroll" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1 min-w-[280px] max-w-[550px] flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">Workforce Trend (12 Months)</h3>
          </div>
          <div className="relative flex-1 mt-6 mb-6">
          <div
            id="trend-scroll"
            className="space-y-3 overflow-y-auto max-h-[200px] pr-2 hide-scrollbar"
          >
              {data.trendData.map((trend, idx) => (
                <div key={trend.month} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-20 flex-shrink-0">{trend.month}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="absolute h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${(trend.total / maxTrend) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-900 w-12 text-right">
                      {trend.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <ScrollIndicator containerId="trend-scroll" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-slate-600">Growth:</span>
            <span className="text-emerald-600 font-bold">
              +{data.trendData[data.trendData.length - 1].total - data.trendData[0].total} (
              {(
                ((data.trendData[data.trendData.length - 1].total - data.trendData[0].total) /
                  data.trendData[0].total) *
                100
              ).toFixed(1)}
              %)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
