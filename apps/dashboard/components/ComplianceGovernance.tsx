import { Shield, FileText, AlertTriangle, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { fetchComplianceGovernanceData, type ComplianceGovernanceData } from '@/components/services/apiService';
import { ScrollIndicator } from './ScrollIndicator';

export function ComplianceGovernance() {
  const [data, setData] = useState<ComplianceGovernanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const licenseScrollRef = useRef<HTMLDivElement>(null);
  const pfEsiScrollRef = useRef<HTMLDivElement>(null);
  const contractScrollRef = useRef<HTMLDivElement>(null);
  const incidentScrollRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchComplianceGovernanceData();
        setData(result);
      } catch (err) {
        console.error('Failed to load compliance governance data:', err);
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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

  const { contractorLicenses, pfEsiCompliance, documentExpiry, contractExpiry, nonComplianceIncidents, auditReadiness } = data;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-blue-600 rounded-lg p-2.5">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Compliance Governance Panel</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Contractor CLRA License Status</h3>
          </div>
          <div className="relative mt-6 mb-6">
          <div
            id="license-scroll"
            className="space-y-3 overflow-y-auto max-h-[400px] pr-2 hide-scrollbar"
          >
            {contractorLicenses.map((item) => (
              <div
                key={item.vendor}
                className={`p-3 rounded-lg border-l-4 ${
                  item.status === 'valid'
                    ? 'bg-emerald-50 border-emerald-500'
                    : item.status === 'expiring'
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{item.vendor}</p>
                    <p className="text-xs text-slate-600">{item.license}</p>
                  </div>
                  {item.status === 'valid' && (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  )}
                  {item.status === 'expiring' && (
                    <Clock className="w-5 h-5 text-orange-600" />
                  )}
                  {item.status === 'expired' && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Expiry: <span className="font-medium">{item.expiry}</span>
                </p>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="license-scroll" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">PF / ESI Compliance</h3>
          </div>
          <div className="relative mt-6 mb-6">
          <div
            id="pf-esi-scroll"
            className="space-y-3 overflow-y-auto max-h-[400px] pr-2 hide-scrollbar"
          >
            {pfEsiCompliance.map((item) => (
              <div key={item.metric} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-900">{item.metric}</span>
                  {item.status === 'compliant' && (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  )}
                  {item.status === 'pending' && (
                    <Clock className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{item.value}</span>
                  <span className="text-slate-500">Updated: {item.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="pf-esi-scroll" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-slate-900">Document Expiry Heatmap</h3>
          </div>
          <div className="space-y-4">
            {documentExpiry.map((doc) => {
              const expiringPercentage = (doc.expiring / doc.total) * 100;
              const expiredPercentage = (doc.expired / doc.total) * 100;
              const validPercentage = 100 - expiringPercentage - expiredPercentage;

              return (
                <div key={doc.category}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">{doc.category}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-emerald-600">
                        Valid: {doc.total - doc.expiring - doc.expired}
                      </span>
                      <span className="text-orange-600">Expiring: {doc.expiring}</span>
                      <span className="text-red-600">Expired: {doc.expired}</span>
                    </div>
                  </div>
                  <div className="flex h-8 rounded-lg overflow-hidden">
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{ width: `${validPercentage}%` }}
                    />
                    <div
                      className="bg-orange-400 transition-all duration-500"
                      style={{ width: `${expiringPercentage}%` }}
                    />
                    <div
                      className="bg-red-500 transition-all duration-500"
                      style={{ width: `${expiredPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Contract Expiry</h3>
          </div>
          <div className="relative mt-6 mb-6">
          <div
            id="contract-scroll"
            className="space-y-3 overflow-y-auto max-h-[400px] pr-2 hide-scrollbar"
          >
            {contractExpiry.map((contract) => (
              <div
                key={contract.contract}
                className={`p-3 rounded-lg border-l-4 ${
                  contract.alert === 'high'
                    ? 'bg-red-50 border-red-500'
                    : contract.alert === 'medium'
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{contract.vendor}</p>
                <p className="text-xs text-slate-600 mt-1">{contract.contract}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500">{contract.expiry}</span>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      contract.alert === 'high'
                        ? 'bg-red-200 text-red-800'
                        : contract.alert === 'medium'
                        ? 'bg-orange-200 text-orange-800'
                        : 'bg-blue-200 text-blue-800'
                    }`}
                  >
                    {contract.daysLeft}d left
                  </span>
                </div>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="contract-scroll" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-slate-900">Non-Compliance Incidents</h3>
          </div>
          <div className="relative mt-6 mb-6">
          <div
            id="incident-scroll"
            className="space-y-3 overflow-y-auto max-h-[400px] pr-2 hide-scrollbar"
          >
            {nonComplianceIncidents.map((incident, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border-l-4 ${
                  incident.severity === 'high'
                    ? 'bg-red-50 border-red-500'
                    : 'bg-orange-50 border-orange-500'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium text-slate-900">{incident.incident}</p>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      incident.status === 'resolved'
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-orange-200 text-orange-800'
                    }`}
                  >
                    {incident.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{incident.date}</span>
                  <span
                    className={`font-medium ${
                      incident.severity === 'high' ? 'text-red-600' : 'text-orange-600'
                    }`}
                  >
                    {incident.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="incident-scroll" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-slate-900">Audit Readiness Score</h3>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-600">{auditReadiness.overall}%</p>
              <p className="text-xs text-slate-500">Overall Score</p>
            </div>
          </div>

          <div className="space-y-4">
            {auditReadiness.categories.map((category) => (
              <div key={category.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-700">{category.name}</span>
                  <span className="text-sm font-bold text-slate-900">{category.score}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      category.score >= 90
                        ? 'bg-emerald-500'
                        : category.score >= 80
                        ? 'bg-blue-500'
                        : category.score >= 70
                        ? 'bg-orange-400'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${category.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">
                  {auditReadiness.categories.filter((c) => c.score >= 90).length}
                </p>
                <p className="text-xs text-slate-600">Excellent (90%+)</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {auditReadiness.categories.filter((c) => c.score >= 80 && c.score < 90).length}
                </p>
                <p className="text-xs text-slate-600">Good (80-89%)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
