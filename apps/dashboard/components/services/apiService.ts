const DIRECT_API_URL = `${process.env.NEXT_PUBLIC_API_AI_URL}/webhook/clms-dashboard`;

export interface WorkforceData {
  totalWorkforce?: number;
  presentCount?: number;
  attendancePercentage?: number;
  onrollCount?: number;
  onrollPresentCount?: number;
  offrollCount?: number;
  offrollPresentCount?: number;
  overallCompliance?: number;
  attritionRate?: number;
  quarterlyAttrition?: number;
  safetyIncidents?: number;
  newJoinees?: number;
  onrollNewJoinees?: number;
  offrollNewJoinees?: number;
  exits?: number;
  onrollExits?: number;
  offrollExits?: number;
  vendorPerformance?: number;
}

export interface DepartmentData {
  name: string;
  onroll: number;
  offroll: number;
  total: number;
}

export interface SiteData {
  name: string;
  location: string;
  onroll: number;
  offroll: number;
  total: number;
}

export interface VendorData {
  name: string;
  count: number;
  category: string;
}

export interface GenderData {
  label: string;
  value: number;
  percentage: number;
}

export interface AgeData {
  label: string;
  value: number;
}

export interface TrendData {
  month: string;
  total: number;
  onroll: number;
  offroll: number;
}

export interface WorkforceCompositionData {
  departmentData: DepartmentData[];
  siteData: SiteData[];
  vendorData: VendorData[];
  diversityData: {
    gender: GenderData[];
    age: AgeData[];
  };
  trendData: TrendData[];
}

export async function fetchWorkforceComposition(): Promise<WorkforceData> {
  try {
    const response = await fetch(DIRECT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'cards'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    const data = result.data || result;

    return {
      totalWorkforce: Number(data.totalWorkforce || 0),
      presentCount: Number(data.presentCount || 0),
      attendancePercentage: Number(data.attendancePercentage || 0),
      onrollCount: Number(data.onrollCount || 0),
      onrollPresentCount: Number(data.onrollPresentCount || 0),
      offrollCount: Number(data.offrollCount || 0),
      offrollPresentCount: Number(data.offrollPresentCount || 0),
      overallCompliance: Number(data.overallCompliance || data.complianceScore || 0),
      attritionRate: Number(data.attritionRate || data.monthlyAttrition || 0),
      quarterlyAttrition: Number(data.quarterlyAttrition || 0),
      safetyIncidents: Number(data.safetyIncidents || 0),
      newJoinees: Number(data.newJoinees || 0),
      onrollNewJoinees: Number(data.onrollNewJoinees || 0),
      offrollNewJoinees: Number(data.offrollNewJoinees || 0),
      exits: Number(data.exits || 0),
      onrollExits: Number(data.onrollExits || 0),
      offrollExits: Number(data.offrollExits || 0),
      vendorPerformance: Number(data.vendorPerformance || data.vendorAvgScore || 0),
    };
  } catch (error) {
    console.error('Error fetching workforce composition:', error);
    throw error;
  }
}

export async function fetchWorkforceCompositionDetails(): Promise<WorkforceCompositionData> {
  try {
    const response = await fetch(DIRECT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'workforce_composition' })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Workforce Composition API Error:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return transformWorkforceData(data);
  } catch (error) {
    console.error('Error fetching workforce composition details:', error);
    throw error;
  }
}

function transformWorkforceData(apiData: any): WorkforceCompositionData {
  // Extract data from nested structure if present
  const sourceData = apiData.data || apiData;

  // If data is already in correct format, return as is
  if (sourceData.departmentData && sourceData.siteData &&
      sourceData.diversityData && sourceData.trendData) {
    // Handle vendorData vs contractorData
    let vendorData = sourceData.vendorData || [];

    // If vendorData is not present but contractorData is, transform it
    if (!sourceData.vendorData && sourceData.contractorData && Array.isArray(sourceData.contractorData)) {
      vendorData = sourceData.contractorData.map((contractor: any) => ({
        name: contractor.name || '',
        count: Number(contractor.employeecount || contractor.count || 0),
        category: contractor.areaofwork || contractor.category || 'General'
      }));
    }

    return {
      departmentData: sourceData.departmentData,
      siteData: sourceData.siteData,
      vendorData: vendorData,
      diversityData: sourceData.diversityData,
      trendData: sourceData.trendData
    };
  }

  // Transform from your API format to required format
  const transformed: WorkforceCompositionData = {
    departmentData: [],
    siteData: [],
    vendorData: [],
    diversityData: {
      gender: [],
      age: []
    },
    trendData: []
  };

  // Transform departments
  const deptSource = sourceData.departments || apiData.departments;
  if (deptSource && Array.isArray(deptSource)) {
    transformed.departmentData = deptSource.map((dept: any) => ({
      name: dept.department_name || dept.name || '',
      onroll: Number(dept.onroll_count || dept.onroll || 0),
      offroll: Number(dept.offroll_count || dept.offroll || 0),
      total: Number(dept.total_count || dept.total || 0)
    }));
  }

  // Transform sites
  const siteSource = sourceData.sites || apiData.sites;
  if (siteSource && Array.isArray(siteSource)) {
    transformed.siteData = siteSource.map((site: any) => ({
      name: site.site_name || site.name || '',
      location: site.location || site.city || '',
      onroll: Number(site.onroll_count || site.onroll || 0),
      offroll: Number(site.offroll_count || site.offroll || 0),
      total: Number(site.total_count || site.total || 0)
    }));
  }

  // Transform vendors/contractors - check all possible locations
  const vendorSource = sourceData.contractorData ||
                       sourceData.contractors ||
                       sourceData.vendors ||
                       apiData.contractorData ||
                       apiData.contractors ||
                       apiData.vendors ||
                       (sourceData.data && sourceData.data.contractorData) ||
                       (sourceData.data && sourceData.data.contractors) ||
                       (apiData.data && apiData.data.contractorData) ||
                       (apiData.data && apiData.data.contractors);

  if (vendorSource && Array.isArray(vendorSource)) {
    transformed.vendorData = vendorSource.map((vendor: any) => {
      const count = Number(
        vendor.employeecount ||
        vendor.employee_count ||
        vendor.count ||
        vendor.totalemployees ||
        vendor.total_employees ||
        vendor.employeeCount ||
        vendor.totalEmployees ||
        0
      );
      
      return {
        name: vendor.vendor_name || vendor.name || vendor.contractorname || vendor.contractor_name || '',
        count: count,
        category: vendor.category || vendor.areaofwork || vendor.area_of_work || vendor.type || 'General'
      };
    });
  }

  // Transform gender diversity
  if (sourceData.gender_distribution && Array.isArray(sourceData.gender_distribution)) {
    transformed.diversityData.gender = sourceData.gender_distribution.map((item: any) => ({
      label: item.gender || item.label || '',
      value: Number(item.count || item.value || 0),
      percentage: Number(item.percentage || 0)
    }));
  } else if (sourceData.diversityData?.gender || apiData.diversity?.gender) {
    transformed.diversityData.gender = sourceData.diversityData?.gender || apiData.diversity.gender;
  }

  // Transform age diversity
  if (sourceData.age_distribution && Array.isArray(sourceData.age_distribution)) {
    transformed.diversityData.age = sourceData.age_distribution.map((item: any) => ({
      label: item.age_group || item.label || '',
      value: Number(item.count || item.value || 0)
    }));
  } else if (sourceData.diversityData?.age || apiData.diversity?.age) {
    transformed.diversityData.age = sourceData.diversityData?.age || apiData.diversity.age;
  }

  // Transform trend data
  if (sourceData.trends && Array.isArray(sourceData.trends)) {
    transformed.trendData = sourceData.trends.map((trend: any) => ({
      month: trend.month || trend.period || '',
      total: Number(trend.total_count || trend.total || 0),
      onroll: Number(trend.onroll_count || trend.onroll || 0),
      offroll: Number(trend.offroll_count || trend.offroll || 0)
    }));
  } else if (sourceData.trendData || apiData.trendData) {
    transformed.trendData = sourceData.trendData || apiData.trendData;
  }

  return transformed;
}

export interface AttendanceHeatmapData {
  site: string;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
}

export interface AbsenteeismAlert {
  site: string;
  avgAbsenteeism: number;
  alert: 'high' | 'medium' | 'low';
}

export interface OTTrendData {
  month: string;
  hours: number;
  percentage: number;
}

export interface AttendanceData {
  attendanceHeatmap: AttendanceHeatmapData[];
  highAbsenteeismSites: AbsenteeismAlert[];
  otTrendData: OTTrendData[];
}

export async function fetchAttendanceData(): Promise<AttendanceData> {
  try {
    const response = await fetch(DIRECT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'attendance' })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Attendance API Error:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return transformAttendanceData(data);
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    throw error;
  }
}

function transformAttendanceData(apiData: any): AttendanceData {
  const sourceData = apiData.data || apiData;

  const transformed: any = {
    attendanceHeatmap: [],
    highAbsenteeismSites: [],
    otTrendData: []
  };

  // Transform attendance heatmap
  if (sourceData.attendanceHeatmap && Array.isArray(sourceData.attendanceHeatmap)) {
    transformed.attendanceHeatmap = sourceData.attendanceHeatmap.map((item: any) => ({
      site: item.location || item.site || item.siteName || '',
      mon: Number(item.mon || item.monday || 0),
      tue: Number(item.tue || item.tuesday || 0),
      wed: Number(item.wed || item.wednesday || 0),
      thu: Number(item.thu || item.thursday || 0),
      fri: Number(item.fri || item.friday || 0),
      sat: Number(item.sat || item.saturday || 0)
    }));
  }

  // Transform high absenteeism sites
  if (sourceData.highAbsenteeismSites && Array.isArray(sourceData.highAbsenteeismSites)) {
    transformed.highAbsenteeismSites = sourceData.highAbsenteeismSites.map((item: any) => ({
      site: item.location || item.site || item.siteName || '',
      avgAbsenteeism: Number(item.avgAbsenteeism || item.absenteeism || 0),
      alert: item.alert || item.alertLevel || 'low'
    }));
  }

  // Transform OT trend data
  if (sourceData.otTrendData && Array.isArray(sourceData.otTrendData)) {
    transformed.otTrendData = sourceData.otTrendData.map((item: any) => ({
      month: item.month || item.period || '',
      hours: Number(item.hours || item.otHours || 0),
      percentage: Number(item.percentage || item.otPercentage || 0)
    }));
  }

  return transformed;
}

export interface ContractorLicense {
  vendor: string;
  license: string;
  status: 'valid' | 'expiring' | 'expired';
  expiry: string;
}

export interface PFESICompliance {
  metric: string;
  status: 'compliant' | 'pending' | 'non-compliant';
  value: string;
  lastUpdated: string;
}

export interface DocumentExpiry {
  category: string;
  total: number;
  expiring: number;
  expired: number;
}

export interface ContractExpiry {
  vendor: string;
  contract: string;
  expiry: string;
  daysLeft: number;
  alert: 'low' | 'medium' | 'high';
}

export interface NonComplianceIncident {
  date: string;
  incident: string;
  severity: 'low' | 'medium' | 'high';
  status: 'resolved' | 'in-progress' | 'pending';
}

export interface AuditCategory {
  name: string;
  score: number;
}

export interface AuditReadiness {
  overall: number;
  categories: AuditCategory[];
}

export interface ComplianceGovernanceData {
  contractorLicenses: ContractorLicense[];
  pfEsiCompliance: PFESICompliance[];
  documentExpiry: DocumentExpiry[];
  contractExpiry: ContractExpiry[];
  nonComplianceIncidents: NonComplianceIncident[];
  auditReadiness: AuditReadiness;
}

export async function fetchComplianceGovernanceData(): Promise<ComplianceGovernanceData> {
  try {
    const response = await fetch(DIRECT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'Compliance_Governance' })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Compliance Governance API Error:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return transformComplianceData(data);
  } catch (error) {
    console.error('Error fetching compliance governance data:', error);
    throw error;
  }
}

function transformComplianceData(apiData: any): ComplianceGovernanceData {
  const sourceData = apiData.data || apiData;

  const transformed: ComplianceGovernanceData = {
    contractorLicenses: [],
    pfEsiCompliance: [],
    documentExpiry: [],
    contractExpiry: [],
    nonComplianceIncidents: [],
    auditReadiness: {
      overall: 0,
      categories: []
    }
  };

  // Transform contractor licenses
  if (sourceData.contractorLicenses && Array.isArray(sourceData.contractorLicenses)) {
    transformed.contractorLicenses = sourceData.contractorLicenses.map((item: any) => ({
      vendor: item.vendor || item.vendorName || '',
      license: item.license || item.licenseNumber || '',
      status: item.status || 'valid',
      expiry: item.expiry || item.expiryDate || ''
    }));
  }

  // Transform PF/ESI compliance
  if (sourceData.pfEsiCompliance && Array.isArray(sourceData.pfEsiCompliance)) {
    transformed.pfEsiCompliance = sourceData.pfEsiCompliance.map((item: any) => ({
      metric: item.metric || item.name || '',
      status: item.status || 'compliant',
      value: item.value || '',
      lastUpdated: item.lastUpdated || item.updatedDate || ''
    }));
  }

  // Transform document expiry
  if (sourceData.documentExpiry && Array.isArray(sourceData.documentExpiry)) {
    transformed.documentExpiry = sourceData.documentExpiry.map((item: any) => ({
      category: item.category || item.documentType || '',
      total: Number(item.total || 0),
      expiring: Number(item.expiring || 0),
      expired: Number(item.expired || 0)
    }));
  }

  // Transform contract expiry
  if (sourceData.contractExpiry && Array.isArray(sourceData.contractExpiry)) {
    transformed.contractExpiry = sourceData.contractExpiry.map((item: any) => ({
      vendor: item.vendor || item.vendorName || '',
      contract: item.contract || item.contractNumber || '',
      expiry: item.expiry || item.expiryDate || '',
      daysLeft: Number(item.daysLeft || item.remainingDays || 0),
      alert: item.alert || item.alertLevel || 'low'
    }));
  }

  // Transform non-compliance incidents
  if (sourceData.nonComplianceIncidents && Array.isArray(sourceData.nonComplianceIncidents)) {
    transformed.nonComplianceIncidents = sourceData.nonComplianceIncidents.map((item: any) => ({
      date: item.date || item.incidentDate || '',
      incident: item.incident || item.description || '',
      severity: item.severity || item.severityLevel || 'medium',
      status: item.status || 'pending'
    }));
  }

  // Transform audit readiness
  if (sourceData.auditReadiness) {
    transformed.auditReadiness = {
      overall: Number(sourceData.auditReadiness.overall || 0),
      categories: Array.isArray(sourceData.auditReadiness.categories)
        ? sourceData.auditReadiness.categories.map((cat: any) => ({
            name: cat.name || cat.categoryName || '',
            score: Number(cat.score || 0)
          }))
        : []
    };
  }

  return transformed;
}

export interface HighRiskContractor {
  vendor: string;
  risk: 'high' | 'medium' | 'low';
  issues: string[];
  score: number;
}

export interface HighAttritionDept {
  department: string;
  rate: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  exits: number;
}

export interface HighAbsenteeismHotspot {
  location: string;
  rate: number;
  department: string;
  days: string;
}

export interface NonComplianceCluster {
  area: string;
  issues: number;
  severity: 'high' | 'medium' | 'low';
  sites: string[];
}

export interface ExpiringContract {
  vendor: string;
  contract: string;
  daysLeft: number;
  impact: 'high' | 'medium' | 'low';
  workers: number;
}

export interface ExpiringDocument {
  category: string;
  count: number;
  critical: number;
  daysLeft: string;
}

export interface RiskAlertData {
  highRiskContractors: HighRiskContractor[];
  highAttritionDepts: HighAttritionDept[];
  highAbsenteeismHotspots: HighAbsenteeismHotspot[];
  nonComplianceClusters: NonComplianceCluster[];
  expiringContracts: ExpiringContract[];
  expiringDocuments: ExpiringDocument[];
}

export async function fetchRiskAlertData(): Promise<RiskAlertData> {
  try {
    const response = await fetch(DIRECT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'Risk_Alert' })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Risk Alert API Error:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return transformRiskAlertData(data);
  } catch (error) {
    console.error('Error fetching risk alert data:', error);
    throw error;
  }
}

function transformRiskAlertData(apiData: any): RiskAlertData {
  const sourceData = apiData.data || apiData;

  const transformed: RiskAlertData = {
    highRiskContractors: [],
    highAttritionDepts: [],
    highAbsenteeismHotspots: [],
    nonComplianceClusters: [],
    expiringContracts: [],
    expiringDocuments: []
  };

  // Transform high risk contractors
  if (sourceData.highRiskContractors && Array.isArray(sourceData.highRiskContractors)) {
    transformed.highRiskContractors = sourceData.highRiskContractors.map((item: any) => ({
      vendor: item.vendor || item.vendorName || '',
      risk: item.risk || item.riskLevel || 'medium',
      issues: Array.isArray(item.issues) ? item.issues : [],
      score: Number(item.score || item.riskScore || 0)
    }));
  }

  // Transform high attrition departments
  if (sourceData.highAttritionDepts && Array.isArray(sourceData.highAttritionDepts)) {
    transformed.highAttritionDepts = sourceData.highAttritionDepts.map((item: any) => ({
      department: item.department || item.deptName || '',
      rate: Number(item.rate || item.attritionRate || 0),
      trend: item.trend || 'stable',
      exits: Number(item.exits || item.exitCount || 0)
    }));
  }

  // Transform high absenteeism hotspots
  if (sourceData.highAbsenteeismHotspots && Array.isArray(sourceData.highAbsenteeismHotspots)) {
    transformed.highAbsenteeismHotspots = sourceData.highAbsenteeismHotspots.map((item: any) => ({
      location: item.location || item.site || '',
      rate: Number(item.rate || item.absenteeismRate || 0),
      department: item.department || item.dept || '',
      days: item.days || item.peakDays || ''
    }));
  }

  // Transform non-compliance clusters
  if (sourceData.nonComplianceClusters && Array.isArray(sourceData.nonComplianceClusters)) {
    transformed.nonComplianceClusters = sourceData.nonComplianceClusters.map((item: any) => ({
      area: item.area || item.complianceArea || '',
      issues: Number(item.issues || item.issueCount || 0),
      severity: item.severity || item.severityLevel || 'medium',
      sites: Array.isArray(item.sites) ? item.sites : []
    }));
  }

  // Transform expiring contracts
  if (sourceData.expiringContracts && Array.isArray(sourceData.expiringContracts)) {
    transformed.expiringContracts = sourceData.expiringContracts.map((item: any) => ({
      vendor: item.vendor || item.vendorName || '',
      contract: item.contract || item.contractNumber || '',
      daysLeft: Number(item.daysLeft || item.remainingDays || 0),
      impact: item.impact || item.impactLevel || 'medium',
      workers: Number(item.workers || item.workerCount || 0)
    }));
  }

  // Transform expiring documents
  if (sourceData.expiringDocuments && Array.isArray(sourceData.expiringDocuments)) {
    transformed.expiringDocuments = sourceData.expiringDocuments.map((item: any) => ({
      category: item.category || item.documentType || '',
      count: Number(item.count || item.expiringCount || 0),
      critical: Number(item.critical || item.criticalCount || 0),
      daysLeft: item.daysLeft || item.timeframe || '< 30 days'
    }));
  }

  return transformed;
}

export interface ManagerSnapshotData {
  totalWorkers: number;
  presentToday: number;
  absentToday: number;
  workersRequired: number;
  workersDeployed: number;
  gap: number;
  contractorsAssigned: number;
  activeWorkOrders: number;
  overdueWorkOrders: number;
  compliancePending: number;
}

export interface ShiftDeployment {
  shift: string;
  planned: number;
  actual: number;
  gap: number;
}

export interface SkillDistribution {
  skill: string;
  count: number;
  percentage: number;
}

export interface ContractorDeployment {
  name: string;
  deployed: number;
  required: number;
  gap: number;
}

export interface ShortageArea {
  area: string;
  shortage: number;
  critical: boolean;
}

export interface DeploymentData {
  shifts: ShiftDeployment[];
  bySkill: SkillDistribution[];
  byContractor: ContractorDeployment[];
  shortageAreas: ShortageArea[];
}

export interface ShiftAttendance {
  shift: string;
  attendance: number;
}

export interface AttendanceData {
  trend: number[];
  shiftWise: ShiftAttendance[];
  lateWorkers: number;
  earlyOutWorkers: number;
  repeatedAbsent: number;
  excessiveOT: number;
  poorAttendanceContractors: number;
}

export interface WorkOrderData {
  assigned: number;
  inProgress: number;
  completed: number;
  overdue: number;
  slaBreaches: number;
  requiresRework: number;
  pendingApproval: number;
  evidencePending: number;
}

export interface ComplianceData {
  expiredDocs: number;
  expiringDocs: number;
  medicalPending: number;
  policePending: number;
  trainingPending: number;
  esiPfMissing: number;
  blockedWorkers: number;
}

export interface ContractorPerformance {
  name: string;
  attendance: number;
  sla: number;
  turnover: number;
  safety: number;
  rank: number;
}

export interface SafetyData {
  incidents: number;
  nearMisses: number;
  ppeCompliance: number;
  trainingCompletion: number;
  violations: number;
  contractorBreaches: number;
}

export interface CostData {
  otHours: number;
  otLimit: number;
  otCost: number;
  excessiveOTContractors: number;
  idleManpower: number;
  departmentCost: number;
}

export interface Alert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  time: string;
}

export interface Insight {
  type: 'prediction' | 'suggestion' | 'optimization';
  text: string;
  confidence: number;
}

export interface ManagerDashboardData {
  snapshotData: ManagerSnapshotData;
  deploymentData: DeploymentData;
  attendanceData: any;
  workOrderData: WorkOrderData;
  complianceData: ComplianceData;
  contractorPerformance: ContractorPerformance[];
  safetyData: SafetyData;
  costData: CostData;
  alerts: Alert[];
  insights: Insight[];
}

export async function fetchManagerDashboardData(managerId: string = 'EMP025'): Promise<ManagerDashboardData> {
  try {
    const response = await fetch(DIRECT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'manager', managerId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Manager Dashboard API Error:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return transformManagerDashboardData(data);
  } catch (error) {
    console.error('Error fetching manager dashboard data:', error);
    throw error;
  }
}

function transformManagerDashboardData(apiData: any): ManagerDashboardData {
  const sourceData = apiData.data || apiData;

  const transformed: ManagerDashboardData = {
    snapshotData: {
      totalWorkers: Number(sourceData.snapshotData?.totalWorkers || 0),
      presentToday: Number(sourceData.snapshotData?.presentToday || 0),
      absentToday: Number(sourceData.snapshotData?.absentToday || 0),
      workersRequired: Number(sourceData.snapshotData?.workersRequired || 0),
      workersDeployed: Number(sourceData.snapshotData?.workersDeployed || 0),
      gap: Number(sourceData.snapshotData?.gap || 0),
      contractorsAssigned: Number(sourceData.snapshotData?.contractorsAssigned || 0),
      activeWorkOrders: Number(sourceData.snapshotData?.activeWorkOrders || 0),
      overdueWorkOrders: Number(sourceData.snapshotData?.overdueWorkOrders || 0),
      compliancePending: Number(sourceData.snapshotData?.compliancePending || 0)
    },
    deploymentData: {
      shifts: Array.isArray(sourceData.deploymentData?.shifts)
        ? sourceData.deploymentData.shifts.map((s: any) => ({
            shift: s.shift || '',
            planned: Number(s.planned || 0),
            actual: Number(s.actual || 0),
            gap: Number(s.gap || 0)
          }))
        : [],
      bySkill: Array.isArray(sourceData.deploymentData?.bySkill)
        ? sourceData.deploymentData.bySkill.map((s: any) => ({
            skill: s.skill || '',
            count: Number(s.count || 0),
            percentage: Number(s.percentage || 0)
          }))
        : [],
      byContractor: Array.isArray(sourceData.deploymentData?.byContractor)
        ? sourceData.deploymentData.byContractor.map((c: any) => ({
            name: c.name || '',
            deployed: Number(c.deployed || 0),
            required: Number(c.required || 0),
            gap: Number(c.gap || 0)
          }))
        : [],
      shortageAreas: Array.isArray(sourceData.deploymentData?.shortageAreas)
        ? sourceData.deploymentData.shortageAreas.map((a: any) => ({
            area: a.area || '',
            shortage: Number(a.shortage || 0),
            critical: Boolean(a.critical)
          }))
        : []
    },
    attendanceData: {
      trend: Array.isArray(sourceData.attendanceData?.trend)
        ? sourceData.attendanceData.trend.map((v: any) => Number(v || 0))
        : [],
      shiftWise: Array.isArray(sourceData.attendanceData?.shiftWise)
        ? sourceData.attendanceData.shiftWise.map((s: any) => ({
            shift: s.shift || '',
            attendance: Number(s.attendance || 0)
          }))
        : [],
      lateWorkers: Number(sourceData.attendanceData?.lateWorkers || 0),
      earlyOutWorkers: Number(sourceData.attendanceData?.earlyOutWorkers || 0),
      repeatedAbsent: Number(sourceData.attendanceData?.repeatedAbsent || 0),
      excessiveOT: Number(sourceData.attendanceData?.excessiveOT || 0),
      poorAttendanceContractors: Number(sourceData.attendanceData?.poorAttendanceContractors || 0)
    },
    workOrderData: {
      assigned: Number(sourceData.workOrderData?.assigned || 0),
      inProgress: Number(sourceData.workOrderData?.inProgress || 0),
      completed: Number(sourceData.workOrderData?.completed || 0),
      overdue: Number(sourceData.workOrderData?.overdue || 0),
      slaBreaches: Number(sourceData.workOrderData?.slaBreaches || 0),
      requiresRework: Number(sourceData.workOrderData?.requiresRework || 0),
      pendingApproval: Number(sourceData.workOrderData?.pendingApproval || 0),
      evidencePending: Number(sourceData.workOrderData?.evidencePending || 0)
    },
    complianceData: {
      expiredDocs: Number(sourceData.complianceData?.expiredDocs || 0),
      expiringDocs: Number(sourceData.complianceData?.expiringDocs || 0),
      medicalPending: Number(sourceData.complianceData?.medicalPending || 0),
      policePending: Number(sourceData.complianceData?.policePending || 0),
      trainingPending: Number(sourceData.complianceData?.trainingPending || 0),
      esiPfMissing: Number(sourceData.complianceData?.esiPfMissing || 0),
      blockedWorkers: Number(sourceData.complianceData?.blockedWorkers || 0)
    },
    contractorPerformance: Array.isArray(sourceData.contractorPerformance)
      ? sourceData.contractorPerformance.map((c: any) => ({
          name: c.name || '',
          attendance: Number(c.attendance || 0),
          sla: Number(c.sla || 0),
          turnover: Number(c.turnover || 0),
          safety: Number(c.safety || 0),
          rank: Number(c.rank || 0)
        }))
      : [],
    safetyData: {
      incidents: Number(sourceData.safetyData?.incidents || 0),
      nearMisses: Number(sourceData.safetyData?.nearMisses || 0),
      ppeCompliance: Number(sourceData.safetyData?.ppeCompliance || 0),
      trainingCompletion: Number(sourceData.safetyData?.trainingCompletion || 0),
      violations: Number(sourceData.safetyData?.violations || 0),
      contractorBreaches: Number(sourceData.safetyData?.contractorBreaches || 0)
    },
    costData: {
      otHours: Number(sourceData.costData?.otHours || 0),
      otLimit: Number(sourceData.costData?.otLimit || 0),
      otCost: Number(sourceData.costData?.otCost || 0),
      excessiveOTContractors: Number(sourceData.costData?.excessiveOTContractors || 0),
      idleManpower: Number(sourceData.costData?.idleManpower || 0),
      departmentCost: Number(sourceData.costData?.departmentCost || 0)
    },
    alerts: Array.isArray(sourceData.alerts)
      ? sourceData.alerts.map((a: any) => ({
          type: a.type || 'info',
          message: a.message || '',
          time: a.time || ''
        }))
      : [],
    insights: Array.isArray(sourceData.insights)
      ? sourceData.insights.map((i: any) => ({
          type: i.type || 'suggestion',
          text: i.text || '',
          confidence: Number(i.confidence || 0)
        }))
      : []
  };

  return transformed;
}

export interface VendorScore {
  vendor: string;
  overall: number;
  attendance: number;
  sla: number;
  stability: number;
  safety: number;
  penalties: number;
}

export interface AttendanceReliability {
  vendor: string;
  rate: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SLACompliance {
  metric: string;
  value: number;
}

export interface WorkforceStability {
  vendor: string;
  attrition: number;
  rotation: number;
  score: number;
}

export interface VendorPerformanceData {
  vendorScores: VendorScore[];
  attendanceReliability: AttendanceReliability[];
  slaCompliance: SLACompliance[];
  workforceStability: WorkforceStability[];
}

export async function fetchVendorPerformanceData(): Promise<VendorPerformanceData> {
  try {
    const response = await fetch(DIRECT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'vendor_performance' })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vendor Performance API Error:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return transformVendorPerformanceData(data);
  } catch (error) {
    console.error('Error fetching vendor performance data:', error);
    throw error;
  }
}

function transformVendorPerformanceData(apiData: any): VendorPerformanceData {
  const sourceData = apiData.data || apiData;

  const transformed: VendorPerformanceData = {
    vendorScores: [],
    attendanceReliability: [],
    slaCompliance: [],
    workforceStability: []
  };

  if (sourceData.vendorScores && Array.isArray(sourceData.vendorScores)) {
    transformed.vendorScores = sourceData.vendorScores.map((item: any) => ({
      vendor: item.contractor || item.vendor || item.vendorName || item.vendor_name || item.contractorName || item.contractor_name || item.name || 'Unknown Vendor',
      overall: Number(item.overall || item.overallScore || 0),
      attendance: Number(item.attendance || item.attendanceScore || 0),
      sla: Number(item.sla || item.slaScore || 0),
      stability: Number(item.stability || item.stabilityScore || 0),
      safety: Number(item.safety || item.safetyScore || 0),
      penalties: Number(item.penalties || item.penaltyCount || 0)
    }));
  }

  if (sourceData.attendanceReliability && Array.isArray(sourceData.attendanceReliability)) {
    transformed.attendanceReliability = sourceData.attendanceReliability.map((item: any) => ({
      vendor: item.contractor || item.vendor || item.vendorName || item.vendor_name || item.contractorName || item.contractor_name || item.name || 'Unknown Vendor',
      rate: Number(item.rate || item.attendanceRate || 0),
      trend: item.trend || 'stable'
    }));
  }

  if (sourceData.slaCompliance && Array.isArray(sourceData.slaCompliance)) {
    transformed.slaCompliance = sourceData.slaCompliance.map((item: any) => ({
      metric: item.metric || item.name || '',
      value: Number(item.value || item.score || 0)
    }));
  }

  if (sourceData.workforceStability && Array.isArray(sourceData.workforceStability)) {
    transformed.workforceStability = sourceData.workforceStability.map((item: any) => ({
      vendor: item.contractor || item.vendor || item.vendorName || item.vendor_name || item.contractorName || item.contractor_name || item.name || 'Unknown Vendor',
      attrition: Number(item.attrition || item.attritionRate || 0),
      rotation: Number(item.rotation || item.rotationRate || 0),
      score: Number(item.score || item.stabilityScore || 0)
    }));
  }

  return transformed;
}
