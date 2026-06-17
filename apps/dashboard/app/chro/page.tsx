'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  ClipboardCheck,
  Shield,
  TrendingDown,
  AlertTriangle,
  UserPlus,
  Star,
  TrendingUp,
} from 'lucide-react';
import { MetricTile } from '@/components/MetricTile';
import { WorkforceComposition } from '@/components/WorkforceComposition';
import { AttendanceDeployment } from '@/components/AttendanceDeployment';
import { ComplianceGovernance } from '@/components/ComplianceGovernance';
import { VendorPerformance } from '@/components/VendorPerformance';
import { RiskAlerts } from '@/components/RiskAlerts';
import { PredictiveInsights } from '@/components/PredictiveInsights';
import { QuickActions } from '@/components/QuickActions';
import { FilterPanel, FilterState } from '@/components/FilterPanel';
import { DrillDownModal, DrillDownData, DrillDownLevel } from '@/components/DrillDownModal';
import { fetchWorkforceComposition, type WorkforceData } from '@/components/services/apiService';

const ZERO_DASHBOARD_DATA = {
  totalWorkforce: 0,
  onrollCount: 0,
  offrollCount: 0,
  contractWorkforce: 0,
  attendancePercentage: 0,
  presentCount: 0,
  totalCount: 0,
  onrollPresentCount: 0,
  offrollPresentCount: 0,
  complianceScore: 0,
  monthlyAttrition: 0,
  quarterlyAttrition: 0,
  safetyIncidents: 0,
  newJoinees: 0,
  onrollNewJoinees: 0,
  offrollNewJoinees: 0,
  exits: 0,
  onrollExits: 0,
  offrollExits: 0,
  vendorAvgScore: 0,
};

export default function Page() {
  const [activeTab, setActiveTab] = useState('workforce');
  const [filters, setFilters] = useState<FilterState>({
    contractor: 'All Contractors',
    department: 'All Departments',
    site: 'All Sites',
    dateRange: { start: '', end: '' },
  });

  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [apiData, setApiData] = useState<WorkforceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchWorkforceComposition();
        setApiData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load workforce data');
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const dashboardData = {
    totalWorkforce: apiData?.totalWorkforce ?? 0,
    onrollCount: apiData?.onrollCount ?? 0,
    offrollCount: apiData?.offrollCount ?? 0,
    contractWorkforce: apiData?.offrollCount ?? 0,
    attendancePercentage: apiData?.attendancePercentage ?? 0,
    presentCount: apiData?.presentCount ?? 0,
    totalCount: apiData?.totalWorkforce ?? 0,
    onrollPresentCount: apiData?.onrollPresentCount ?? 0,
    offrollPresentCount: apiData?.offrollPresentCount ?? 0,
    complianceScore: apiData?.overallCompliance ?? 0,
    monthlyAttrition: apiData?.attritionRate ?? 0,
    quarterlyAttrition: apiData?.quarterlyAttrition ?? 0,
    safetyIncidents: apiData?.safetyIncidents ?? 0,
    newJoinees: apiData?.newJoinees ?? 0,
    onrollNewJoinees: apiData?.onrollNewJoinees ?? 0,
    offrollNewJoinees: apiData?.offrollNewJoinees ?? 0,
    exits: apiData?.exits ?? 0,
    onrollExits: apiData?.onrollExits ?? 0,
    offrollExits: apiData?.offrollExits ?? 0,
    vendorAvgScore: apiData?.vendorPerformance ?? 0,
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleDrillDown = (level: DrillDownLevel, title: string, data?: any) => {
    setDrillDownData({ level, title, data });
    setIsDrillDownOpen(true);
  };

  const handleDrillDeeper = (nextLevel: DrillDownLevel, data: any) => {
    let title = '';
    switch (nextLevel) {
      case 'department':
        title = `Department: ${data.name}`;
        break;
      case 'contractor':
        title = `Contractor: ${data.name}`;
        break;
      case 'employee':
        title = `Employee: ${data.name}`;
        break;
      default:
        title = 'Organization Overview';
    }
    setDrillDownData({ level: nextLevel, title, data });
  };

  const hasActiveFilters =
    filters.contractor !== 'All Contractors' ||
    filters.department !== 'All Departments' ||
    filters.site !== 'All Sites' ||
    filters.dateRange.start ||
    filters.dateRange.end;


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8 w-full">
            <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                CHRO Dashboard
              </h1>
              <p className="text-slate-600">
                Leadership overview of workforce metrics and compliance
              </p>
              {isLoading && (
                <div className="text-sm text-blue-600 mt-2">
                  Loading real-time data...
                </div>
              )}
              {error && (
                <div className="text-sm text-red-600 mt-2">
                  {error}
                </div>
              )}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                    Filtered View Active
                  </span>
                  {filters.contractor !== 'All Contractors' && (
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {filters.contractor}
                    </span>
                  )}
                  {filters.department !== 'All Departments' && (
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {filters.department}
                    </span>
                  )}
                  {filters.site !== 'All Sites' && (
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {filters.site}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <FilterPanel onFilterChange={handleFilterChange} currentFilters={filters} />
              <button
                onClick={() => handleDrillDown('org', 'Organization Overview')}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm"
              >
                Drill Down View
              </button>
              <div className="text-right">
                <p className="text-sm text-slate-500">Last updated</p>
                <p className="text-sm font-medium text-slate-700">
                  {new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-800 font-medium mb-1">Failed to load data</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricTile
              title="Total Workforce & Attendance"
              value={`${dashboardData.presentCount}/${dashboardData.totalWorkforce}`}
              subtitle={`Present Today: ${dashboardData.attendancePercentage}% | On-roll: ${dashboardData.onrollPresentCount}/${dashboardData.onrollCount} (${((dashboardData.onrollPresentCount / dashboardData.onrollCount) * 100).toFixed(1)}%) | Off-roll: ${dashboardData.offrollPresentCount}/${dashboardData.offrollCount} (${((dashboardData.offrollPresentCount / dashboardData.offrollCount) * 100).toFixed(1)}%)`}
              icon={Users}
              color="blue"
            />

            <MetricTile
              title="Overall Compliance"
              value={`${dashboardData.complianceScore}%`}
              subtitle="Statutory & policy compliance"
              formula="Compliance % = (Compliant Items / Total Required Items) × 100"
              icon={Shield}
              color="blue"
            />

            <MetricTile
              title="Attrition Rate"
              value={`${dashboardData.monthlyAttrition}%`}
              subtitle={`Month: ${dashboardData.monthlyAttrition}% | Quarter: ${dashboardData.quarterlyAttrition}%`}
              formula="Attrition % = (Exits in Period / Avg Workforce) × 100"
              icon={TrendingDown}
              color="orange"
            />

            <MetricTile
              title="Safety Incidents"
              value={dashboardData.safetyIncidents}
              subtitle="Month to date"
              icon={AlertTriangle}
              color="red"
            />

            <MetricTile
              title="New Joinees & Exits"
              value={`${dashboardData.newJoinees} / ${dashboardData.exits}`}
              subtitle={`On-roll: ${dashboardData.onrollNewJoinees} joinees, ${dashboardData.onrollExits} exits | Off-roll: ${dashboardData.offrollNewJoinees} joinees, ${dashboardData.offrollExits} exits`}
              icon={UserPlus}
              color="green"
            />

            <MetricTile
              title="Vendor Performance"
              value={`${dashboardData.vendorAvgScore}%`}
              subtitle="Average score (recent 10)"
              formula="Vendor Score % = Average of (Attendance × 0.3 + Quality × 0.3 + Safety × 0.25 + SLA × 0.15)"
              icon={Star}
              color="purple"
            />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap gap-2 p-2">
              {[
                { id: 'workforce', label: 'Workforce Composition', icon: Users },
                { id: 'attendance', label: 'Attendance & OT Utilization', icon: ClipboardCheck },
                { id: 'compliance', label: 'Compliance Governance', icon: Shield },
                { id: 'vendor', label: 'Vendor Performance', icon: Star },
                { id: 'risk', label: 'Risk & Alerts', icon: AlertTriangle },
                { id: 'insights', label: 'Predictive Insights', icon: TrendingUp },
                { id: 'actions', label: 'Quick Actions', icon: ClipboardCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'workforce' && <WorkforceComposition />}
            {activeTab === 'attendance' && <AttendanceDeployment />}
            {activeTab === 'compliance' && <ComplianceGovernance />}
            {activeTab === 'vendor' && <VendorPerformance />}
            {activeTab === 'risk' && <RiskAlerts />}
            {activeTab === 'insights' && <PredictiveInsights />}
            {activeTab === 'actions' && <QuickActions />}
          </div>
        </div>

        <DrillDownModal
          isOpen={isDrillDownOpen}
          onClose={() => setIsDrillDownOpen(false)}
          drillDownData={drillDownData}
          onDrillDeeper={handleDrillDeeper}
        />
      </div>
    </div>
  );
}
