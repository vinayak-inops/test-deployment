import { AlertTriangle, XCircle, Clock, FileX, UserX, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchRiskAlertData, type RiskAlertData } from '@/components/services/apiService';
import { ScrollIndicator } from './ScrollIndicator';

export function RiskAlerts() {
  const [data, setData] = useState<RiskAlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchRiskAlertData();
        setData(result);
      } catch (err) {
        console.error('Failed to load risk alert data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Failed to load data'}</p>
        </div>
      </div>
    );
  }

  const { highRiskContractors, highAttritionDepts, highAbsenteeismHotspots, nonComplianceClusters, expiringContracts, expiringDocuments } = data;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-red-600 rounded-lg p-2.5">
          <AlertTriangle className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Risk & Alert Panel</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-slate-900">High-Risk Contractors</h3>
          </div>
          <div className="relative mt-6 mb-6">
            <div id="high-risk-contractors-scroll" className="space-y-3 overflow-y-auto overflow-x-hidden max-h-[400px] pr-2 hide-scrollbar">
            {highRiskContractors.map((contractor) => (
              <div
                key={contractor.vendor}
                className={`p-4 rounded-lg border-l-4 ${
                  contractor.risk === 'high'
                    ? 'bg-red-50 border-red-500'
                    : 'bg-orange-50 border-orange-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{contractor.vendor}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded mt-1 inline-block font-bold ${
                        contractor.risk === 'high'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-orange-200 text-orange-800'
                      }`}
                    >
                      {contractor.risk.toUpperCase()} RISK
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{contractor.score}</p>
                    <p className="text-xs text-slate-500">Risk Score</p>
                  </div>
                </div>
                <div className="space-y-1 mt-3">
                  {contractor.issues.map((issue, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      <span className="text-xs text-slate-700">{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            </div>
            <ScrollIndicator containerId="high-risk-contractors-scroll" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
          <div className="flex items-center gap-2 mb-4">
            <UserX className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-slate-900">High Attrition Departments</h3>
          </div>
          <div className="relative mt-6 mb-6">
            <div id="high-attrition-scroll" className="space-y-3 overflow-y-auto overflow-x-hidden max-h-[400px] pr-2 hide-scrollbar">
            {highAttritionDepts.map((dept) => (
              <div key={dept.department} className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{dept.department}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-600">{dept.exits} exits</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          dept.trend === 'increasing'
                            ? 'bg-red-200 text-red-800'
                            : dept.trend === 'stable'
                            ? 'bg-blue-200 text-blue-800'
                            : 'bg-emerald-200 text-emerald-800'
                        }`}
                      >
                        {dept.trend}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">{dept.rate}%</p>
                    <p className="text-xs text-slate-500">Attrition</p>
                  </div>
                </div>
              </div>
            ))}
            </div>
            <ScrollIndicator containerId="high-attrition-scroll" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-slate-900">High Absenteeism Hotspots</h3>
          </div>
          <div className="relative mt-6 mb-6">
            <div id="absenteeism-hotspots-scroll" className="space-y-3 overflow-y-auto overflow-x-hidden max-h-[400px] pr-2 hide-scrollbar">
            {highAbsenteeismHotspots.map((hotspot, idx) => (
              <div key={idx} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{hotspot.location}</p>
                    <p className="text-xs text-slate-600 mt-1">{hotspot.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-600">{hotspot.rate}%</p>
                    <p className="text-xs text-slate-500">Absenteeism</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-yellow-200">
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Peak Days:</span> {hotspot.days}
                  </p>
                </div>
              </div>
            ))}
            </div>
            <ScrollIndicator containerId="absenteeism-hotspots-scroll" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-slate-900">Non-Compliance Clusters</h3>
          </div>
          <div className="relative mt-6 mb-6">
            <div id="non-compliance-scroll" className="space-y-3 overflow-y-auto overflow-x-hidden max-h-[400px] pr-2 hide-scrollbar">
            {nonComplianceClusters.map((cluster) => (
              <div
                key={cluster.area}
                className={`p-4 rounded-lg border-l-4 ${
                  cluster.severity === 'high'
                    ? 'bg-red-50 border-red-500'
                    : 'bg-orange-50 border-orange-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{cluster.area}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Affected: {cluster.sites.join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{cluster.issues}</p>
                    <p className="text-xs text-slate-500">Issues</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-bold ${
                    cluster.severity === 'high'
                      ? 'bg-red-200 text-red-800'
                      : 'bg-orange-200 text-orange-800'
                  }`}
                >
                  {cluster.severity.toUpperCase()} SEVERITY
                </span>
              </div>
            ))}
            </div>
            <ScrollIndicator containerId="non-compliance-scroll" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-slate-900">Expiring Contracts & Licenses</h3>
          </div>
          <div className="relative mt-6 mb-6">
            <div id="expiring-contracts-scroll" className="space-y-3 overflow-y-auto overflow-x-hidden max-h-[400px] pr-2 hide-scrollbar">
            {expiringContracts.map((contract) => (
              <div
                key={contract.contract}
                className={`p-4 rounded-lg border-l-4 ${
                  contract.daysLeft < 60
                    ? 'bg-red-50 border-red-500'
                    : contract.daysLeft < 150
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{contract.vendor}</p>
                    <p className="text-xs text-slate-600 mt-1">{contract.contract}</p>
                    <p className="text-xs text-slate-600">{contract.workers} workers</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">{contract.daysLeft}</p>
                    <p className="text-xs text-slate-500">days left</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-bold ${
                    contract.impact === 'high'
                      ? 'bg-red-200 text-red-800'
                      : contract.impact === 'medium'
                      ? 'bg-orange-200 text-orange-800'
                      : 'bg-blue-200 text-blue-800'
                  }`}
                >
                  {contract.impact.toUpperCase()} IMPACT
                </span>
              </div>
            ))}
            </div>
            <ScrollIndicator containerId="expiring-contracts-scroll" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
          <div className="flex items-center gap-2 mb-4">
            <FileX className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-slate-900">Worker Documents Expiring Soon</h3>
          </div>
          <div className="relative mt-6 mb-6">
            <div id="expiring-documents-scroll" className="space-y-3 overflow-y-auto overflow-x-hidden max-h-[400px] pr-2 hide-scrollbar">
            {expiringDocuments.map((doc) => (
              <div key={doc.category} className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{doc.category}</p>
                    <p className="text-xs text-slate-600 mt-1">{doc.daysLeft}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{doc.count}</p>
                    <p className="text-xs text-slate-500">expiring</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-red-200 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Critical (overdue soon):</span>
                  <span className="text-sm font-bold text-red-700">{doc.critical}</span>
                </div>
              </div>
            ))}
            </div>
            <ScrollIndicator containerId="expiring-documents-scroll" />
          </div>
        </div>
      </div>
    </div>
  );
}
