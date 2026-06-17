import { IndianRupee, TrendingUp, PieChart, Calendar, DollarSign } from 'lucide-react';
import { ScrollIndicator } from './ScrollIndicator';

const laborCostBreakdown = {
  onroll: 8450000,
  contract: 2680000,
  total: 11130000,
};

const otCostTrend = [
  { month: 'Jan', cost: 245000 },
  { month: 'Feb', cost: 268000 },
  { month: 'Mar', cost: 291000 },
  { month: 'Apr', cost: 278000 },
  { month: 'May', cost: 312000 },
  { month: 'Jun', cost: 298000 },
  { month: 'Jul', cost: 285000 },
  { month: 'Aug', cost: 305000 },
  { month: 'Sep', cost: 292000 },
  { month: 'Oct', cost: 318000 },
  { month: 'Nov', cost: 335000 },
];

const vendorCostComparison = [
  { vendor: 'ManpowerPro Solutions', cost: 892000, workers: 245, perWorker: 3641 },
  { vendor: 'TechStaff India', cost: 712000, workers: 156, perWorker: 4564 },
  { vendor: 'Global Workforce Ltd', cost: 456000, workers: 128, perWorker: 3562 },
  { vendor: 'Elite Contractors', cost: 378000, workers: 98, perWorker: 3857 },
  { vendor: 'Prime Staffing', cost: 242000, workers: 75, perWorker: 3227 },
];

const siteCostPerWorker = [
  { site: 'Head Office', workers: 369, cost: 1890000, perWorker: 5122 },
  { site: 'Plant 1 - Pune', workers: 1276, cost: 4680000, perWorker: 3668 },
  { site: 'Plant 2 - Chennai', workers: 1101, cost: 3920000, perWorker: 3560 },
  { site: 'Warehouse Delhi', workers: 490, cost: 1780000, perWorker: 3633 },
  { site: 'RO Bangalore', workers: 313, cost: 1540000, perWorker: 4920 },
];

const costSavings = [
  { opportunity: 'OT Optimization', potential: 425000, implementation: 'medium' },
  { opportunity: 'Vendor Consolidation', potential: 280000, implementation: 'high' },
  { opportunity: 'Skill-based Deployment', potential: 315000, implementation: 'medium' },
  { opportunity: 'Automation Integration', potential: 680000, implementation: 'high' },
  { opportunity: 'Training Investment', potential: 190000, implementation: 'low' },
];

const forecastData = [
  { month: 'Dec 2024', forecast: 11450000, confidence: 95 },
  { month: 'Jan 2025', forecast: 11680000, confidence: 92 },
  { month: 'Feb 2025', forecast: 11890000, confidence: 88 },
  { month: 'Mar 2025', forecast: 12120000, confidence: 85 },
  { month: 'Apr 2025', forecast: 12350000, confidence: 82 },
  { month: 'May 2025', forecast: 12580000, confidence: 78 },
];

export function CostBudget() {
  const maxOTCost = Math.max(...otCostTrend.map((d) => d.cost));
  const totalSavings = costSavings.reduce((sum, s) => sum + s.potential, 0);
  const maxVendorCost = Math.max(...vendorCostComparison.map((v) => v.cost));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-green-600 rounded-lg p-2.5">
          <IndianRupee className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Cost & Budget Intelligence</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-3">
            <IndianRupee className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-700">Total Labor Cost</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-3">
            ₹{(laborCostBreakdown.total / 1000000).toFixed(2)}M
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">On-roll</span>
              <span className="font-bold text-slate-900">
                ₹{(laborCostBreakdown.onroll / 1000000).toFixed(2)}M
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Contract</span>
              <span className="font-bold text-slate-900">
                ₹{(laborCostBreakdown.contract / 1000000).toFixed(2)}M
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-semibold text-slate-700">OT Cost (Nov)</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-3">
            ₹{(otCostTrend[otCostTrend.length - 1].cost / 1000).toFixed(0)}K
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600">vs Previous Month:</span>
            <span className="font-bold text-red-600">
              +
              {(
                ((otCostTrend[otCostTrend.length - 1].cost -
                  otCostTrend[otCostTrend.length - 2].cost) /
                  otCostTrend[otCostTrend.length - 2].cost) *
                100
              ).toFixed(1)}
              %
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-700">Savings Potential</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-600 mb-3">
            ₹{(totalSavings / 1000000).toFixed(2)}M
          </p>
          <p className="text-sm text-slate-600">Annual savings identified</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-slate-900">OT Cost Trend (11 Months)</h3>
          </div>
          <div className="relative">
          <div id="ot-cost-scroll" className="space-y-2 overflow-y-auto max-h-[400px] pr-2">
            {otCostTrend.map((data) => (
              <div key={data.month} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-10 flex-shrink-0">{data.month}</span>
                <div className="flex-1 relative">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500 flex items-center justify-end pr-3"
                      style={{ width: `${(data.cost / maxOTCost) * 100}%` }}
                    >
                      <span className="text-white text-xs font-bold">
                        ₹{(data.cost / 1000).toFixed(0)}K
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="ot-cost-scroll" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-slate-900">Vendor-wise Cost Comparison</h3>
          </div>
          <div className="relative">
          <div id="vendor-cost-scroll" className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
            {vendorCostComparison.map((vendor) => (
              <div key={vendor.vendor}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700">{vendor.vendor}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      ₹{(vendor.cost / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-slate-500">₹{vendor.perWorker}/worker</p>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                    style={{ width: `${(vendor.cost / maxVendorCost) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="vendor-cost-scroll" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Cost per Worker by Site</h3>
          </div>
          <div className="relative">
          <div id="cost-per-worker-scroll" className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
            {siteCostPerWorker.map((site) => (
              <div
                key={site.site}
                className="p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{site.site}</p>
                    <p className="text-xs text-slate-600">{site.workers} workers</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">
                      ₹{site.perWorker}
                    </p>
                    <p className="text-xs text-slate-500">per worker</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Total: ₹{(site.cost / 1000).toFixed(0)}K</span>
                </div>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="cost-per-worker-scroll" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-slate-900">Cost Savings Opportunities</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total Potential</p>
              <p className="text-lg font-bold text-emerald-600">
                ₹{(totalSavings / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>
          <div className="relative">
          <div id="cost-savings-scroll" className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
            {costSavings.map((item) => (
              <div
                key={item.opportunity}
                className="p-3 rounded-lg border-l-4 border-emerald-500 bg-emerald-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.opportunity}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${
                        item.implementation === 'low'
                          ? 'bg-emerald-200 text-emerald-800'
                          : item.implementation === 'medium'
                          ? 'bg-orange-200 text-orange-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {item.implementation} effort
                    </span>
                  </div>
                  <p className="text-lg font-bold text-emerald-600">
                    ₹{(item.potential / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="cost-savings-scroll" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            Forecasted Manpower Cost (6 Months)
          </h3>
        </div>
        <div className="relative">
        <div id="forecast-scroll" className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
          {forecastData.map((data) => (
            <div key={data.month} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-24 flex-shrink-0">{data.month}</span>
              <div className="flex-1 relative">
                <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 flex items-center justify-between px-3"
                    style={{ width: `${(data.forecast / 13000000) * 100}%` }}
                  >
                    <span className="text-white text-sm font-bold">
                      ₹{(data.forecast / 1000000).toFixed(2)}M
                    </span>
                    <span className="text-white text-xs">{data.confidence}% confidence</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <ScrollIndicator containerId="forecast-scroll" />
        </div>
      </div>
    </div>
  );
}
