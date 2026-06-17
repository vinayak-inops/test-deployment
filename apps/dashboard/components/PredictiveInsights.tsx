import { Brain, TrendingUp, AlertCircle, Users, Shield, UserMinus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ScrollIndicator } from './ScrollIndicator';

interface PredictedAbsenteeism {
  date: string;
  prediction: number;
  confidence: number;
  factors: string[];
}

interface VendorDelayRisk {
  vendor: string;
  risk: number;
  deployment: string;
  dueDate: string;
  likelihood: string;
}

interface WorkforceShortage {
  department: string;
  shortage: number;
  timeframe: string;
  severity: string;
  skillGap: string;
}

interface SkillGapPrediction {
  skill: string;
  currentGap: number;
  predictedGap: number;
  change: string;
  urgency: string;
}

interface SafetyRiskPrediction {
  site: string;
  riskScore: number;
  prediction: string;
  factors: string[];
}

interface ResignationLikelihood {
  role: string;
  employee: string;
  likelihood: number;
  factors: string[];
  action: string;
}

interface PredictiveInsightsData {
  predictedAbsenteeism: PredictedAbsenteeism[];
  vendorDelayRisk: VendorDelayRisk[];
  workforceShortage: WorkforceShortage[];
  skillGapPrediction: SkillGapPrediction[];
  safetyRiskPrediction: SafetyRiskPrediction[];
  resignationLikelihood: ResignationLikelihood[];
}

export function PredictiveInsights() {
  const [data, setData] = useState<PredictiveInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_AI_URL}/webhook/clms-dashboard`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'predictive_insights' }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Extract data from nested structure (API returns { type, data })
        const actualData = result.data || result;
        setData(actualData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error('Error fetching predictive insights:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-purple-600 rounded-lg p-2.5">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Predictive Insights (AI-Driven)</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading predictive insights...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-purple-600 rounded-lg p-2.5">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Predictive Insights (AI-Driven)</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">Error Loading Data</h3>
          </div>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const hasNoData = !data.predictedAbsenteeism?.length &&
                     !data.vendorDelayRisk?.length &&
                     !data.workforceShortage?.length &&
                     !data.skillGapPrediction?.length &&
                     !data.safetyRiskPrediction?.length &&
                     !data.resignationLikelihood?.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-purple-600 rounded-lg p-2.5">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Predictive Insights (AI-Driven)</h2>
      </div>

      {hasNoData ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">No Data Available</h3>
          </div>
          <p className="text-blue-700">The API returned empty data. Please check the API response format.</p>
        </div>
      ) : (
        <>
          {data.predictedAbsenteeism?.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.predictedAbsenteeism?.map((prediction) => (
          <div key={prediction.date} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-slate-900">Predicted Absenteeism</h3>
              </div>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                {prediction.date}
              </span>
            </div>
            <div className="flex items-end gap-4 mb-4">
              <div>
                <p className="text-4xl font-bold text-purple-600">{prediction.prediction}%</p>
                <p className="text-xs text-slate-500">Expected rate</p>
              </div>
              <div className="mb-2">
                <p className="text-2xl font-bold text-slate-900">{prediction.confidence}%</p>
                <p className="text-xs text-slate-500">Confidence</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">Contributing Factors:</p>
              {prediction.factors.map((factor, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-slate-700">{factor}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
          )}

      {(data.vendorDelayRisk?.length > 0 || data.workforceShortage?.length > 0) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.vendorDelayRisk?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-slate-900">Vendor Delay Likelihood</h3>
          </div>
          <div className="relative mt-6 mb-6">
          <div id="vendor-delay-scroll" className="space-y-3 overflow-y-auto max-h-[400px] pr-2 hide-scrollbar">
            {data.vendorDelayRisk?.map((vendor) => (
              <div
                key={vendor.vendor}
                className={`p-4 rounded-lg border-l-4 ${
                  vendor.risk >= 70
                    ? 'bg-red-50 border-red-500'
                    : vendor.risk >= 50
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{vendor.vendor}</p>
                    <p className="text-xs text-slate-600 mt-1">{vendor.deployment}</p>
                    <p className="text-xs text-slate-500">Due: {vendor.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">{vendor.risk}%</p>
                    <p className="text-xs text-slate-500">Risk Score</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-bold ${
                    vendor.likelihood === 'High'
                      ? 'bg-red-200 text-red-800'
                      : vendor.likelihood === 'Medium'
                      ? 'bg-orange-200 text-orange-800'
                      : 'bg-blue-200 text-blue-800'
                  }`}
                >
                  {vendor.likelihood.toUpperCase()} LIKELIHOOD
                </span>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="vendor-delay-scroll" />
          </div>
        </div>
        )}

        {data.workforceShortage?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-slate-900">Workforce Shortage Forecast</h3>
          </div>
          <div className="relative mt-6 mb-6">
          <div id="workforce-shortage-scroll" className="space-y-3 overflow-y-auto max-h-[400px] pr-2 hide-scrollbar">
            {data.workforceShortage?.map((shortage) => (
              <div
                key={shortage.department}
                className={`p-4 rounded-lg border-l-4 ${
                  shortage.severity === 'high'
                    ? 'bg-red-50 border-red-500'
                    : 'bg-orange-50 border-orange-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{shortage.department}</p>
                    <p className="text-xs text-slate-600 mt-1">Gap: {shortage.skillGap}</p>
                    <p className="text-xs text-slate-500">Timeline: {shortage.timeframe}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{shortage.shortage}</p>
                    <p className="text-xs text-slate-500">shortage</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-bold ${
                    shortage.severity === 'high'
                      ? 'bg-red-200 text-red-800'
                      : 'bg-orange-200 text-orange-800'
                  }`}
                >
                  {shortage.severity.toUpperCase()} SEVERITY
                </span>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="workforce-shortage-scroll" />
          </div>
        </div>
        )}
      </div>
      )}

      {(data.skillGapPrediction?.length > 0 || data.safetyRiskPrediction?.length > 0) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.skillGapPrediction?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Skill Gap Prediction (6 Months)</h3>
          </div>
          <div className="relative mt-6 mb-6">
          <div id="skill-gap-scroll" className="space-y-3 overflow-y-auto max-h-[400px] pr-2 hide-scrollbar">
            {data.skillGapPrediction?.map((skill) => (
              <div key={skill.skill}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">{skill.skill}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      {skill.currentGap} → {skill.predictedGap}
                    </span>
                    <span className="text-sm font-bold text-red-600">{skill.change}</span>
                  </div>
                </div>
                <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="absolute h-full bg-blue-200 transition-all duration-500"
                    style={{ width: `${(skill.currentGap / 50) * 100}%` }}
                  />
                  <div
                    className="absolute h-full bg-red-500 transition-all duration-500"
                    style={{ width: `${(skill.predictedGap / 50) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-200 rounded"></div>
                      <span className="text-slate-600">Current</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-slate-600">Predicted</span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      skill.urgency === 'high'
                        ? 'bg-red-200 text-red-800'
                        : skill.urgency === 'medium'
                        ? 'bg-orange-200 text-orange-800'
                        : 'bg-blue-200 text-blue-800'
                    }`}
                  >
                    {skill.urgency}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="skill-gap-scroll" />
          </div>
        </div>
        )}

        {data.safetyRiskPrediction?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-slate-900">Safety Risk Prediction</h3>
          </div>
          <div className="relative mt-6 mb-6">
          <div id="safety-risk-scroll" className="space-y-3 overflow-y-auto max-h-[400px] pr-2 hide-scrollbar">
            {data.safetyRiskPrediction?.map((site) => (
              <div
                key={site.site}
                className={`p-4 rounded-lg border-l-4 ${
                  site.riskScore >= 70
                    ? 'bg-red-50 border-red-500'
                    : site.riskScore >= 50
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-emerald-50 border-emerald-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{site.site}</p>
                    <p className="text-xs text-slate-600 mt-1">{site.prediction}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{site.riskScore}</p>
                    <p className="text-xs text-slate-500">Risk Score</p>
                  </div>
                </div>
                <div className="space-y-1 mt-3">
                  {site.factors.map((factor, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      <span className="text-xs text-slate-700">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <ScrollIndicator containerId="safety-risk-scroll" />
          </div>
        </div>
        )}
      </div>
      )}

      {data.resignationLikelihood?.length > 0 && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserMinus className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            Resignation Likelihood (On-roll Employees)
          </h3>
        </div>
        <div className="relative mt-6 mb-6">
        <div id="resignation-likelihood-scroll" className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto max-h-[400px] pr-2 hide-scrollbar">
          {data.resignationLikelihood?.map((emp) => (
            <div
              key={emp.employee}
              className={`p-4 rounded-lg border-l-4 ${
                emp.likelihood >= 75
                  ? 'bg-red-50 border-red-500'
                  : emp.likelihood >= 60
                  ? 'bg-orange-50 border-orange-500'
                  : 'bg-yellow-50 border-yellow-500'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{emp.role}</p>
                  <p className="text-xs text-slate-600 mt-1">{emp.employee}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">{emp.likelihood}%</p>
                  <p className="text-xs text-slate-500">Likelihood</p>
                </div>
              </div>
              <div className="space-y-1 mb-3">
                {emp.factors.map((factor, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-slate-700">{factor}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-slate-900">Action: {emp.action}</p>
              </div>
            </div>
          ))}
        </div>
        <ScrollIndicator containerId="resignation-likelihood-scroll" />
        </div>
      </div>
      )}
        </>
      )}
    </div>
  );
}
