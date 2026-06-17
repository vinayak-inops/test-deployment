import { TrendingUp, Target, BookOpen, AlertCircle, BarChart3 } from 'lucide-react';
import { ScrollIndicator } from './ScrollIndicator';

const outputManpowerData = [
  { month: 'Jan', output: 12500, manpower: 2512, ratio: 4.98 },
  { month: 'Feb', output: 13200, manpower: 2548, ratio: 5.18 },
  { month: 'Mar', output: 14100, manpower: 2598, ratio: 5.43 },
  { month: 'Apr', output: 13800, manpower: 2635, ratio: 5.24 },
  { month: 'May', output: 15200, manpower: 2678, ratio: 5.67 },
  { month: 'Jun', output: 14900, manpower: 2715, ratio: 5.49 },
  { month: 'Jul', output: 15600, manpower: 2742, ratio: 5.69 },
  { month: 'Aug', output: 16200, manpower: 2778, ratio: 5.83 },
  { month: 'Sep', output: 15800, manpower: 2805, ratio: 5.63 },
  { month: 'Oct', output: 16800, manpower: 2823, ratio: 5.95 },
  { month: 'Nov', output: 17200, manpower: 2847, ratio: 6.04 },
];

const skillReadiness = [
  { skill: 'Machine Operation', ready: 892, total: 1100, percentage: 81 },
  { skill: 'Quality Control', ready: 145, total: 162, percentage: 90 },
  { skill: 'Maintenance Tech', ready: 178, total: 210, percentage: 85 },
  { skill: 'Logistics Handling', ready: 267, total: 304, percentage: 88 },
  { skill: 'Safety Management', ready: 42, total: 50, percentage: 84 },
  { skill: 'Digital Tools', ready: 68, total: 90, percentage: 76 },
];

const trainingCoverage = [
  { department: 'Production', employees: 1281, trained: 1153, percentage: 90 },
  { department: 'Quality Assurance', employees: 162, trained: 156, percentage: 96 },
  { department: 'Maintenance', employees: 210, trained: 189, percentage: 90 },
  { department: 'Logistics', employees: 304, trained: 274, percentage: 90 },
  { department: 'HR', employees: 50, trained: 48, percentage: 96 },
  { department: 'Finance', employees: 60, trained: 57, percentage: 95 },
  { department: 'IT', employees: 90, trained: 86, percentage: 96 },
  { department: 'Sales & Marketing', employees: 247, adults: 235, percentage: 95 },
];

const reworkData = [
  { issue: 'Skill Gap', incidents: 23, cost: 145000, percentage: 32 },
  { issue: 'Training Insufficient', incidents: 18, cost: 112000, percentage: 25 },
  { issue: 'New Joinee Error', incidents: 15, cost: 98000, percentage: 21 },
  { issue: 'Communication Gap', incidents: 12, cost: 76000, percentage: 17 },
  { issue: 'Fatigue Related', incidents: 4, cost: 28000, percentage: 5 },
];

const siteProductivity = [
  { site: 'Plant 1 - Pune', productivity: 112, variance: 12, trend: 'up' },
  { site: 'Plant 2 - Chennai', productivity: 98, variance: -2, trend: 'down' },
  { site: 'Warehouse Delhi', productivity: 105, variance: 5, trend: 'up' },
  { site: 'Head Office', productivity: 108, variance: 8, trend: 'up' },
  { site: 'RO Bangalore', productivity: 102, variance: 2, trend: 'stable' },
];

const vendorProductivity = [
  { vendor: 'ManpowerPro Solutions', productivity: 108, efficiency: 92 },
  { vendor: 'TechStaff India', productivity: 112, efficiency: 94 },
  { vendor: 'Global Workforce Ltd', productivity: 94, efficiency: 82 },
  { vendor: 'Elite Contractors', productivity: 103, efficiency: 88 },
  { vendor: 'Prime Staffing', productivity: 99, efficiency: 85 },
];

export function ProductivityEfficiency() {
  const maxOutput = Math.max(...outputManpowerData.map((d) => d.output));
  const maxManpower = Math.max(...outputManpowerData.map((d) => d.manpower));
  const totalReworkCost = reworkData.reduce((sum, r) => sum + r.cost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-teal-600 rounded-lg p-2.5">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Productivity & Efficiency Metrics</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            Output vs Manpower Correlation
          </h3>
        </div>
        <div className="relative">
        <div id="output-manpower-scroll" className="space-y-2 overflow-y-auto max-h-[400px] pr-2">
          {outputManpowerData.map((data) => (
            <div key={data.month} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-10 flex-shrink-0">{data.month}</span>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="relative">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${(data.output / maxOutput) * 100}%` }}
                    >
                      <span className="text-white text-xs font-bold">{data.output}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Output (units)</p>
                </div>
                <div className="relative">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${(data.manpower / maxManpower) * 100}%` }}
                    >
                      <span className="text-white text-xs font-bold">{data.manpower}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Manpower</p>
                </div>
              </div>
              <div className="w-20 text-right">
                <p className="text-sm font-bold text-emerald-600">{data.ratio}</p>
                <p className="text-xs text-slate-500">Units/Head</p>
              </div>
            </div>
          ))}
        </div>
        <ScrollIndicator containerId="output-manpower-scroll" />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-slate-600">Avg Productivity Ratio:</span>
          <span className="text-xl font-bold text-teal-600">
            {(
              outputManpowerData.reduce((sum, d) => sum + d.ratio, 0) /
              outputManpowerData.length
            ).toFixed(2)}{' '}
            units/head
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Skill Readiness Level</h3>
          </div>
          <div className="relative">
          <div id="skill-readiness-scroll" className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
            {skillReadiness.map((skill) => (
              <div key={skill.skill}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-700">{skill.skill}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {skill.ready}/{skill.total}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{skill.percentage}%</span>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      skill.percentage >= 90
                        ? 'bg-emerald-500'
                        : skill.percentage >= 80
                        ? 'bg-blue-500'
                        : skill.percentage >= 70
                        ? 'bg-orange-400'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${skill.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="skill-readiness-scroll" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">Training Coverage</h3>
          </div>
          <div className="relative">
          <div id="training-coverage-scroll" className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
            {trainingCoverage.map((dept) => (
              <div key={dept.department}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-700">{dept.department}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {dept.trained}/{dept.employees}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{dept.percentage}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${dept.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="training-coverage-scroll" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-slate-900">Rework Due to Manpower</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total Cost</p>
              <p className="text-lg font-bold text-red-600">
                ₹{(totalReworkCost / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
          <div className="relative">
          <div id="rework-scroll" className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
            {reworkData.map((item) => (
              <div key={item.issue} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.issue}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {item.incidents} incidents • ₹{(item.cost / 1000).toFixed(0)}K cost
                    </p>
                  </div>
                  <span className="text-lg font-bold text-red-600">{item.percentage}%</span>
                </div>
                <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="rework-scroll" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                Productivity Variance by Site
              </h3>
            </div>
            <div className="relative">
            <div id="site-productivity-scroll" className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
              {siteProductivity.map((site) => (
                <div key={site.site} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{site.site}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            site.productivity >= 110
                              ? 'bg-emerald-500'
                              : site.productivity >= 100
                              ? 'bg-blue-500'
                              : site.productivity >= 95
                              ? 'bg-orange-400'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${site.productivity}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{site.productivity}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        site.variance > 0
                          ? 'text-emerald-600'
                          : site.variance < 0
                          ? 'text-red-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {site.variance > 0 ? '+' : ''}
                      {site.variance}%
                    </span>
                    {site.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-600" />}
                    {site.trend === 'down' && (
                      <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                    )}
                    {site.trend === 'stable' && <div className="w-4 h-0.5 bg-slate-400"></div>}
                  </div>
                </div>
              ))}
            </div>
            <ScrollIndicator containerId="site-productivity-scroll" />
          </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                Productivity by Vendor
              </h3>
            </div>
            <div className="relative">
            <div id="vendor-productivity-scroll" className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
              {vendorProductivity.map((vendor) => (
                <div key={vendor.vendor}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700">{vendor.vendor}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">
                        Prod: {vendor.productivity}%
                      </span>
                      <span className="text-xs text-slate-500">
                        Eff: {vendor.efficiency}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${vendor.productivity}%` }}
                      />
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${vendor.efficiency}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <ScrollIndicator containerId="vendor-productivity-scroll" />
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
