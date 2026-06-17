import { Shield, AlertTriangle, Activity, HardHat, BookOpen } from 'lucide-react';
import { ScrollIndicator } from './ScrollIndicator';

const incidentData = {
  monthly: { total: 4, nearMiss: 12, major: 0, minor: 4 },
  quarterly: { total: 14, nearMiss: 38, major: 1, minor: 13 },
};

const incidentTrend = [
  { month: 'Jan', nearMiss: 10, major: 0, minor: 3 },
  { month: 'Feb', nearMiss: 8, major: 0, minor: 2 },
  { month: 'Mar', nearMiss: 12, major: 1, minor: 4 },
  { month: 'Apr', nearMiss: 9, major: 0, minor: 3 },
  { month: 'May', nearMiss: 11, major: 0, minor: 5 },
  { month: 'Jun', nearMiss: 14, major: 0, minor: 4 },
  { month: 'Jul', nearMiss: 10, major: 0, minor: 3 },
  { month: 'Aug', nearMiss: 13, major: 0, minor: 5 },
  { month: 'Sep', nearMiss: 15, major: 0, minor: 6 },
  { month: 'Oct', nearMiss: 11, major: 0, minor: 4 },
  { month: 'Nov', nearMiss: 12, major: 0, minor: 4 },
];

const severityIndex = [
  { category: 'Critical', count: 1, severity: 100 },
  { category: 'Major', count: 3, severity: 75 },
  { category: 'Minor', count: 32, severity: 25 },
  { category: 'Near Miss', count: 124, severity: 10 },
];

const ppeCompliance = [
  { site: 'Head Office', compliance: 98 },
  { site: 'Plant 1 - Pune', compliance: 94 },
  { site: 'Plant 2 - Chennai', compliance: 89 },
  { site: 'Warehouse Delhi', compliance: 96 },
  { site: 'RO Bangalore', compliance: 97 },
];

const trainingCompletion = [
  { category: 'Fire Safety', completed: 2645, total: 2847, percentage: 93 },
  { category: 'First Aid', completed: 2734, total: 2847, percentage: 96 },
  { category: 'PPE Usage', completed: 2801, total: 2847, percentage: 98 },
  { category: 'Emergency Response', completed: 2512, total: 2847, percentage: 88 },
  { category: 'Workplace Hazards', completed: 2678, total: 2847, percentage: 94 },
  { category: 'Equipment Safety', completed: 2589, total: 2847, percentage: 91 },
];

export function SafetyWelfare() {
  const maxIncident = Math.max(
    ...incidentTrend.map((d) => d.nearMiss + d.major + d.minor)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-red-600 rounded-lg p-2.5">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Health, Safety & Welfare Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-red-100 rounded-lg p-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Monthly Incidents</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{incidentData.monthly.total}</p>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Near Miss: {incidentData.monthly.nearMiss}</span>
            <span className="text-red-600">Major: {incidentData.monthly.major}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-orange-100 rounded-lg p-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Quarterly Incidents</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{incidentData.quarterly.total}</p>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Near Miss: {incidentData.quarterly.nearMiss}</span>
            <span className="text-red-600">Major: {incidentData.quarterly.major}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 rounded-lg p-2">
              <HardHat className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Avg PPE Compliance</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">
            {(ppeCompliance.reduce((sum, p) => sum + p.compliance, 0) / ppeCompliance.length).toFixed(1)}%
          </p>
          <p className="text-xs text-slate-600">Across all sites</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-emerald-100 rounded-lg p-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Avg Training Complete</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">
            {(
              trainingCompletion.reduce((sum, t) => sum + t.percentage, 0) /
              trainingCompletion.length
            ).toFixed(1)}%
          </p>
          <p className="text-xs text-slate-600">All safety modules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Incident Trend (11 Months)</h3>
          </div>
          <div className="relative">
          <div id="incident-trend-scroll" className="space-y-2 overflow-y-auto max-h-[400px] pr-2">
            {incidentTrend.map((data) => {
              const total = data.nearMiss + data.major + data.minor;
              return (
                <div key={data.month} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-10 flex-shrink-0">{data.month}</span>
                  <div className="flex-1 relative">
                    <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                      <div
                        className="bg-red-500 transition-all duration-500"
                        style={{ width: `${(data.major / maxIncident) * 100}%` }}
                        title={`Major: ${data.major}`}
                      />
                      <div
                        className="bg-orange-400 transition-all duration-500"
                        style={{ width: `${(data.minor / maxIncident) * 100}%` }}
                        title={`Minor: ${data.minor}`}
                      />
                      <div
                        className="bg-yellow-300 transition-all duration-500"
                        style={{ width: `${(data.nearMiss / maxIncident) * 100}%` }}
                        title={`Near Miss: ${data.nearMiss}`}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900 w-8 text-right">{total}</span>
                </div>
              );
            })}
          </div>
          <ScrollIndicator containerId="incident-trend-scroll" />
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-xs text-slate-600">Major</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-400 rounded"></div>
              <span className="text-xs text-slate-600">Minor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-300 rounded"></div>
              <span className="text-xs text-slate-600">Near Miss</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-slate-900">Incident Severity Index</h3>
          </div>
          <div className="relative">
          <div id="severity-index-scroll" className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
            {severityIndex.map((item) => {
              const colors = {
                Critical: 'from-red-600 to-red-500',
                Major: 'from-orange-500 to-orange-400',
                Minor: 'from-yellow-400 to-yellow-300',
                'Near Miss': 'from-blue-400 to-blue-300',
              };
              return (
                <div key={item.category}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">{item.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">Count: {item.count}</span>
                      <span className="text-sm font-bold text-slate-900">
                        Severity: {item.severity}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${
                        colors[item.category as keyof typeof colors]
                      } transition-all duration-500 flex items-center justify-end pr-3`}
                      style={{ width: `${item.severity}%` }}
                    >
                      <span className="text-white text-xs font-bold">{item.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollIndicator containerId="severity-index-scroll" />
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <HardHat className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">PPE Compliance by Site</h3>
          </div>
          <div className="relative">
          <div id="ppe-compliance-scroll" className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
            {ppeCompliance.map((item) => (
              <div key={item.site}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">{item.site}</span>
                  <span className="text-lg font-bold text-slate-900">{item.compliance}%</span>
                </div>
                <div className="relative h-6 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      item.compliance >= 95
                        ? 'bg-emerald-500'
                        : item.compliance >= 90
                        ? 'bg-blue-500'
                        : item.compliance >= 85
                        ? 'bg-orange-400'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${item.compliance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="ppe-compliance-scroll" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">Safety Training Completion</h3>
          </div>
          <div className="relative">
          <div id="training-completion-scroll" className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
            {trainingCompletion.map((item) => (
              <div key={item.category}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-700">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {item.completed}/{item.total}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{item.percentage}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      item.percentage >= 95
                        ? 'bg-emerald-500'
                        : item.percentage >= 90
                        ? 'bg-blue-500'
                        : item.percentage >= 85
                        ? 'bg-orange-400'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="training-completion-scroll" />
          </div>
        </div>
      </div>
    </div>
  );
}
