import { Calendar, Clock, FileText, Users, Building2, GitBranch, Filter, Download, RefreshCw, DownloadCloud, Eye, X, Search as SearchIcon, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { Input } from "@repo/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useByteToBase64 } from '@/hooks/api/file-handle/useByteToBase64'
import { useState, useEffect, useMemo } from "react"
import DownloadProgressPopup from "../../_components/DownloadProgressPopup"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useQuery, gql } from '@apollo/client'
import { client } from '@repo/ui/hooks/api/dynamic-graphql'

interface AttendanceReportData {
  _id: string
  report: string
  reportName: string
  extension: string
  reportTitle: string
  tenantId: string
  workflowName: string
  subsidiaries: string[] | any[]
  divisions: string[] | any[]
  departments: string[] | any[]
  designations: string[] | any[]
  subDepartments: string[] | any[]
  sections: string[] | any[]
  grades: string[] | any[]
  contractor: string[] | any[]
  location: string[] | any[]
  fromDate: string
  toDate: string
  period: string
  employeeID: string[]
  employeeCategories: string[] | any[]
  workOrderNumber: string[]
  shifts: string[] | any[]
  shiftGroups: string[] | any[]
}

// Interface for ReportInfoSection component props
interface AttendanceReportProps {
  data?: AttendanceReportData
  fileId: string
  permission: any
  onDownloadClick?: () => void
}

// GraphQL queries
const FETCH_SUBSIDIARIES_QUERY = gql`
  query FetchSubsidiaries($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      organizationCode
      subsidiaries {
        subsidiaryName
        subsidiaryCode
        subsidiaryDescription
        locationCode
      }
    }
  }
`

const FETCH_DIVISIONS_QUERY = gql`
  query FetchDivisions($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      organizationCode
      divisions {
        divisionName
        divisionCode
        subsidiaryCode
        divisionDescription
        locationCode
      }
    }
  }
`

const FETCH_DEPARTMENTS_QUERY = gql`
  query FetchDepartments($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      organizationCode
      departments {
        departmentName
        departmentCode
        divisionCode
        subsidiaryCode
        departmentDescription
        locationCode
      }
    }
  }
`

const FETCH_DESIGNATIONS_QUERY = gql`
  query FetchDesignations($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      organizationCode
      designations {
        designationCode
        designationName
        designationDescription
        divisionCode
        subsidiaryCode
        locationCode
      }
    }
  }
`

const FETCH_SUBDEPARTMENTS_QUERY = gql`
  query FetchSubDepartments($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      organizationCode
      subDepartments {
        subDepartmentCode
        subDepartmentName
        subDeprtmentDescription
        departmentCode
        divisionCode
        subsidiaryCode
        locationCode
      }
    }
  }
`

const FETCH_SECTIONS_QUERY = gql`
  query FetchSections($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      organizationCode
      sections {
        sectionCode
        sectionName
        sectionDescription
        subDepartmentCode
        departmentCode
        divisionCode
        subsidiaryCode
        locationCode
      }
    }
  }
`

const FETCH_GRADES_QUERY = gql`
  query FetchGrades($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      organizationCode
      grades {
        gradeCode
        gradeName
        gradeDescription
        designationCode
        divisionCode
        subsidiaryCode
        locationCode
      }
    }
  }
`

const FETCH_CONTRACTORS_QUERY = gql`
  query FetchContractors($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchContractors(criteriaRequests: $criteriaRequests, collection: $collection) {
      contractorCode
      contractorName
    }
  }
`

const FETCH_LOCATIONS_QUERY = gql`
  query FetchLocations($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      organizationName
      organizationCode
      location {
        locationName
        locationCode
        regionCode
        countryCode
        stateCode
        city
        pinCode
        organizationCode
      }
    }
  }
`

const FETCH_EMPLOYEE_CATEGORIES_QUERY = gql`
  query FetchEmployeeCategories($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      organizationName
      organizationCode
      employeeCategories {
        employeeCategoryCode
        employeeCategoryName
        employeeCategoryDescription
      }
    }
  }
`

const FETCH_SHIFTS_QUERY = gql`
  query FetchShifts($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchShifts(criteriaRequests: $criteriaRequests, collection: $collection) {
      organizationCode
      tenantCode
      shiftGroupCode
      shiftGroupName
      subsidiary {
        subsidiaryCode
        subsidiaryName
      }
      location {
        locationCode
        locationName
      }
      employeeCategory
      shift {
        shiftCode
        shiftName
      }
    }
  }
`

export default function ReportInfoSection({ data, fileId, permission, onDownloadClick }: AttendanceReportProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerType, setViewerType] = useState<string>('');
  const [downloadPopup, setDownloadPopup] = useState(false);
  
  // Search states for each table
  const [subsidiariesSearch, setSubsidiariesSearch] = useState('');
  const [divisionsSearch, setDivisionsSearch] = useState('');
  const [departmentsSearch, setDepartmentsSearch] = useState('');
  const [designationsSearch, setDesignationsSearch] = useState('');
  const [subDepartmentsSearch, setSubDepartmentsSearch] = useState('');
  const [gradesSearch, setGradesSearch] = useState('');
  const [sectionsSearch, setSectionsSearch] = useState('');
  const [employeeCategoriesSearch, setEmployeeCategoriesSearch] = useState('');
  const [employeeIDSearch, setEmployeeIDSearch] = useState('');
  const [contractorSearch, setContractorSearch] = useState('');
  const [locationsSearch, setLocationsSearch] = useState('');
  const [workOrderSearch, setWorkOrderSearch] = useState('');
  const [shiftsSearch, setShiftsSearch] = useState('');
  
  // Pagination states
  const [subsidiariesPage, setSubsidiariesPage] = useState(1);
  const [divisionsPage, setDivisionsPage] = useState(1);
  const [departmentsPage, setDepartmentsPage] = useState(1);
  const [designationsPage, setDesignationsPage] = useState(1);
  const [subDepartmentsPage, setSubDepartmentsPage] = useState(1);
  const [gradesPage, setGradesPage] = useState(1);
  const [sectionsPage, setSectionsPage] = useState(1);
  const [employeeCategoriesPage, setEmployeeCategoriesPage] = useState(1);
  const [employeeIDPage, setEmployeeIDPage] = useState(1);
  const [contractorPage, setContractorPage] = useState(1);
  const [locationsPage, setLocationsPage] = useState(1);
  const [workOrderPage, setWorkOrderPage] = useState(1);
  const [shiftsPage, setShiftsPage] = useState(1);
  
  const pageSize = 5;
  const tenantCode = useGetTenantCode()

  // Hook to fetch bytes/objectUrl from server path
  const { fetchByteArray, loading: fetchLoading, error: fetchError, result: fetchResult } = useByteToBase64()

  // Default data for demo purposes
  const defaultData: AttendanceReportData = {
    _id: "",
    report: "",
    reportName: "",
    extension: "",
    reportTitle: "report",
    tenantId: tenantCode,
    workflowName: "Report",
    subsidiaries: [""],
    location: [],
    employeeID: [],
    divisions: [],
    departments: [],
    designations: [],
    subDepartments: [],
    sections: [],
    grades: [],
    contractor: [],
    fromDate: "2025-03-01",
    toDate: "2025-03-16",
    period: "custom",
    employeeCategories:[],
    workOrderNumber:[],
    shifts: [],
    shiftGroups: []
  }

  const reportData = data || defaultData

  // Extract codes from reportData (handle both string arrays and object arrays)
  const extractCodes = (data: any[]): string[] => {
    if (!Array.isArray(data)) return []
    return data.map((item: any) => {
      if (typeof item === 'string') return item
      return item.subsidiaryCode || item.divisionCode || item.departmentCode || 
             item.designationCode || item.subDepartmentCode || item.sectionCode || 
             item.gradeCode || item.contractorCode || item.locationCode || 
             item.employeeCategoryCode || item.code || item.workOrderNumber || 
             item.shiftCode || item.shiftGroupCode || ''
    }).filter(Boolean)
  }

  // Get codes from reportData
  const subsidiaryCodes = useMemo(() => extractCodes(reportData?.subsidiaries || []), [reportData?.subsidiaries])
  const divisionCodes = useMemo(() => extractCodes(reportData?.divisions || []), [reportData?.divisions])
  const departmentCodes = useMemo(() => extractCodes(reportData?.departments || []), [reportData?.departments])
  const designationCodes = useMemo(() => extractCodes(reportData?.designations || []), [reportData?.designations])
  const subDepartmentCodes = useMemo(() => extractCodes(reportData?.subDepartments || []), [reportData?.subDepartments])
  const sectionCodes = useMemo(() => extractCodes(reportData?.sections || []), [reportData?.sections])
  const gradeCodes = useMemo(() => extractCodes(reportData?.grades || []), [reportData?.grades])
  const contractorCodes = useMemo(() => extractCodes(reportData?.contractor || []), [reportData?.contractor])
  const locationCodes = useMemo(() => extractCodes(reportData?.location || []), [reportData?.location])
  const employeeCategoryCodes = useMemo(() => extractCodes(reportData?.employeeCategories || []), [reportData?.employeeCategories])
  // Combine both shiftGroups and shifts for shift codes
  const shiftCodes = useMemo(() => {
    const shifts = extractCodes(reportData?.shifts || [])
    const shiftGroups = extractCodes(reportData?.shiftGroups || [])
    // Combine and remove duplicates
    return Array.from(new Set([...shifts, ...shiftGroups]))
  }, [reportData?.shifts, reportData?.shiftGroups])

  // GraphQL query variables
  const organizationVariables = useMemo(() => ({
    criteriaRequests: [
      {
        field: 'tenantCode',
        operator: 'eq',
        value: tenantCode,
      },
    ],
    collection: 'organization',
  }), [tenantCode])

  const contractorVariables = useMemo(() => ({
    criteriaRequests: [
      {
        field: 'tenantCode',
        operator: 'eq',
        value: tenantCode,
      },
    ],
    collection: 'contractor',
  }), [tenantCode])

  const employeeCategoryVariables = useMemo(() => ({
    criteriaRequests: [
      {
        field: 'tenantCode',
        operator: 'eq',
        value: tenantCode,
      },
    ],
    collection: 'organization',
  }), [tenantCode])

  const shiftVariables = useMemo(() => ({
    criteriaRequests: [
      {
        field: 'tenantCode',
        operator: 'eq',
        value: tenantCode,
      },
    ],
    collection: 'shift',
  }), [tenantCode])

  // Fetch data using GraphQL
  const { data: subsidiariesResponse, loading: subsidiariesLoading } = useQuery(FETCH_SUBSIDIARIES_QUERY, {
    client,
    variables: organizationVariables,
    fetchPolicy: 'cache-and-network',
    skip: !tenantCode || subsidiaryCodes.length === 0,
  })

  const { data: divisionsResponse, loading: divisionsLoading } = useQuery(FETCH_DIVISIONS_QUERY, {
    client,
    variables: organizationVariables,
    fetchPolicy: 'cache-and-network',
    skip: !tenantCode || divisionCodes.length === 0,
  })

  const { data: departmentsResponse, loading: departmentsLoading } = useQuery(FETCH_DEPARTMENTS_QUERY, {
    client,
    variables: organizationVariables,
    fetchPolicy: 'cache-and-network',
    skip: !tenantCode || departmentCodes.length === 0,
  })

  const { data: designationsResponse, loading: designationsLoading } = useQuery(FETCH_DESIGNATIONS_QUERY, {
    client,
    variables: organizationVariables,
    fetchPolicy: 'cache-and-network',
    skip: !tenantCode || designationCodes.length === 0,
  })

  const { data: subDepartmentsResponse, loading: subDepartmentsLoading } = useQuery(FETCH_SUBDEPARTMENTS_QUERY, {
    client,
    variables: organizationVariables,
    fetchPolicy: 'cache-and-network',
    skip: !tenantCode || subDepartmentCodes.length === 0,
  })

  const { data: sectionsResponse, loading: sectionsLoading } = useQuery(FETCH_SECTIONS_QUERY, {
    client,
    variables: organizationVariables,
    fetchPolicy: 'cache-and-network',
    skip: !tenantCode || sectionCodes.length === 0,
  })

  const { data: gradesResponse, loading: gradesLoading } = useQuery(FETCH_GRADES_QUERY, {
    client,
    variables: organizationVariables,
    fetchPolicy: 'cache-and-network',
    skip: !tenantCode || gradeCodes.length === 0,
  })

  const { data: contractorsResponse, loading: contractorsLoading } = useQuery(FETCH_CONTRACTORS_QUERY, {
    client,
    variables: contractorVariables,
    fetchPolicy: 'cache-and-network',
    skip: !tenantCode || contractorCodes.length === 0,
  })

  const { data: locationsResponse, loading: locationsLoading } = useQuery(FETCH_LOCATIONS_QUERY, {
    client,
    variables: organizationVariables,
    fetchPolicy: 'cache-and-network',
    skip: !tenantCode || locationCodes.length === 0,
  })

  const { data: employeeCategoriesResponse, loading: employeeCategoriesLoading } = useQuery(FETCH_EMPLOYEE_CATEGORIES_QUERY, {
    client,
    variables: employeeCategoryVariables,
    fetchPolicy: 'cache-and-network',
    skip: !tenantCode || employeeCategoryCodes.length === 0,
  })

  const { data: shiftsResponse, loading: shiftsLoading } = useQuery(FETCH_SHIFTS_QUERY, {
    client,
    variables: shiftVariables,
    fetchPolicy: 'cache-and-network',
    skip: !tenantCode || shiftCodes.length === 0,
  })

  // Function to get MIME type based on extension
  const getMimeType = (ext: string) => {
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'csv': 'text/csv',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'json': 'application/json',
      'xml': 'application/xml',
      'html': 'text/html',
      'htm': 'text/html',
      'rtf': 'application/rtf',
      'odt': 'application/vnd.oasis.opendocument.text',
      'ods': 'application/vnd.oasis.opendocument.spreadsheet',
      'odp': 'application/vnd.oasis.opendocument.presentation'
    };

    const normalizedExt = ext.toLowerCase().trim();
    const mimeType = mimeTypes[normalizedExt];

    return mimeType || 'application/octet-stream';
  };

  // Function to get proper file extension for download
  const getFileExtension = (ext: string) => {
    const normalizedExt = ext.toLowerCase().trim();

    // Map 'excel' to 'xlsx' for proper Excel format
    if (normalizedExt === 'excel') {
      return 'xlsx';
    }

    return normalizedExt;
  };

  // Sanitize and prepare a safe file name based on reportTitle
  const getSafeFileName = (name: string) => {
    const fallback = 'report';
    const base = (name || fallback).toString().trim();
    // Remove illegal characters and normalize spaces
    const sanitized = base
      .replace(/[\\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return sanitized || fallback;
  };

  // Function to handle report download
  const handleReportDownload = async () => {
    // If a server report is available prefer fetching bytes from backend for preview/download
    const serverPath = (reportData as any)?.report
    if (serverPath) {
      try {
        const fullPath = serverPath
        const mime = getMimeType(reportData.extension || 'pdf')
        const res:any = await fetchByteArray(fullPath, mime)
        if (res && res.success) {
          // Use blob URL from bytes so link.download is always respected
          // (cross-origin objectUrl causes browser to ignore download attribute)
          const blobUrl = res.bytes ? URL.createObjectURL(new Blob([res.bytes], { type: mime })) : undefined
          const url = blobUrl || res.objectUrl
          if (url) {
            const link = document.createElement('a')
            link.href = url
            link.download = `${getSafeFileName(`${tenantCode}_${reportData.reportName}`)}.${getFileExtension(reportData.extension || 'pdf')}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            if (blobUrl) URL.revokeObjectURL(blobUrl)
            return
          }
        }
      } catch (err) {
        console.error('Error fetching file from serverPath for download:', err)
        // fallthrough to base64 fallback
      }
    }

    if (reportData?.report && typeof reportData.report === 'string') {
      try {
        // Validate base64 string
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(reportData.report)) {
          throw new Error('Invalid base64 string format');
        }

        // Convert base64 to blob
        const byteCharacters = atob(reportData.report);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: getMimeType(reportData.extension || 'pdf')
        });

        // Validate blob size
        if (blob.size === 0) {
          throw new Error('Generated file is empty');
        }

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${getSafeFileName(`${tenantCode}_${reportData.reportName}` || 'report')}.${getFileExtension(reportData.extension || 'pdf')}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

      } catch (error) {
        console.error('Error downloading report from ReportInfoSection:', error);
        throw error;
      }
    } else {
      console.warn('No report data available for download in ReportInfoSection');
      throw new Error('No report data available for download.');
    }
  };

  // Function to handle loading state download (simulated)
  const handleLoadingDownload = async () => {
    // Simulate download process during loading
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  // Function to handle viewing file
  const handleViewFile = () => {
    
    // If server report exists, fetch bytes/objectUrl and preview
    const serverPath = (reportData as any)?.report 
    if (serverPath) {
      (async () => {
        try {
          const mime = getMimeType(reportData.extension || 'pdf')
          const res:any = await fetchByteArray(serverPath, mime)
          if (res && res.success) {
            const url = res.objectUrl || (res.bytes ? URL.createObjectURL(new Blob([res.bytes], { type: mime })) : undefined)
            if (url) {
              setViewerUrl(url)
              setViewerType(reportData.extension || 'pdf')
              setViewerOpen(true)
              return
            }
          }
        } catch (err) {
          console.error('Error fetching file from serverPath for preview:', err)
        }

        // Fallback to base64 preview
        if (reportData?.report && typeof reportData.report === 'string') {
          try {
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
            if (!base64Regex.test(reportData.report)) {
              throw new Error('Invalid base64 string format');
            }

            const byteCharacters = atob(reportData.report);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], {
              type: getMimeType(reportData.extension || 'pdf')
            });

            if (blob.size === 0) {
              throw new Error('Generated file is empty');
            }

            const url = window.URL.createObjectURL(blob);
            setViewerUrl(url);
            setViewerType(reportData.extension || 'pdf');
            setViewerOpen(true);
          } catch (error) {
            console.error('Error viewing file from ReportInfoSection fallback:', error);
            // alert(`Failed to view file: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          console.warn('No report data available for viewing in ReportInfoSection');
          // alert('No report data available for viewing.');
        }
      })()
    } else {
      // No server path; fallback to base64 preview
      if (reportData?.report && typeof reportData.report === 'string') {
        try {
          const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
          if (!base64Regex.test(reportData.report)) {
            throw new Error('Invalid base64 string format');
          }

          const byteCharacters = atob(reportData.report);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {
            type: getMimeType(reportData.extension || 'pdf')
          });

          if (blob.size === 0) {
            throw new Error('Generated file is empty');
          }

          const url = window.URL.createObjectURL(blob);
          setViewerUrl(url);
          setViewerType(reportData.extension || 'pdf');
          setViewerOpen(true);
        } catch (error) {
          console.error('Error viewing file from ReportInfoSection fallback:', error);
          // alert(`Failed to view file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        console.warn('No report data available for viewing in ReportInfoSection');
        // alert('No report data available for viewing.');
      }
    }
  };

  // Function to close viewer and cleanup
  const closeViewer = () => {
    if (viewerUrl) {
      window.URL.revokeObjectURL(viewerUrl);
    }
    setViewerOpen(false);
    setViewerUrl(null);
    setViewerType('');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Format date range
  const formatDateRange = (fromDate: string, toDate: string) => {
    const from = new Date(fromDate)
    const to = new Date(toDate)
    const fromFormatted = from.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    const toFormatted = to.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

    // Calculate days difference
    const diffTime = Math.abs(to.getTime() - from.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    return { range: `${fromFormatted} - ${toFormatted}`, days: diffDays }
  }

  const dateRange = formatDateRange(reportData?.fromDate || '', reportData?.toDate || '')

  const {
    data: report,
    error,
    loading,
    refetch
  } = useRequest<any[]>({
    url: `map/reports/search?_id=${fileId}`,
    method: 'GET',
    onSuccess: (data: any) => {
      // Close download popup when data is loaded
      setDownloadPopup(false);
    },
    onError: (error) => {
      console.error('Error loading report data:', error);
      // Close download popup on error
      setDownloadPopup(false);
    },
    dependencies: [fileId]
  });



  // Filter out empty arrays for display
  const getActiveFilters = () => {
    const filters = []

    if (reportData?.tenantId) {
      filters.push({
        name: "Organization",
        icon: Building2,
        values: [reportData.tenantId],
        count: 1,
      })
    }

    if (reportData?.location && reportData.location.length > 0) {
      filters.push({
        name: "Location",
        icon: Building2,
        values: reportData.location,
        count: reportData.location.length,
      })
    }
    
    
    if (reportData?.subsidiaries && reportData.subsidiaries.length > 0) {
      filters.push({
        name: "Subsidiaries",
        icon: GitBranch,
        values: reportData.subsidiaries,
        count: reportData.subsidiaries.length,
      })
    }

    if (reportData?.divisions && reportData.divisions.length > 0) {
      filters.push({
        name: "Divisions",
        icon: Users,
        values: reportData.divisions,
        count: reportData.divisions.length,
      })
    }

    if (reportData?.departments && reportData.departments.length > 0) {
      filters.push({
        name: "Departments",
        icon: Building2,
        values: reportData.departments,
        count: reportData.departments.length,
      })
    }

    if (reportData?.designations && reportData.designations.length > 0) {
      filters.push({
        name: "Designations",
        icon: Users,
        values: reportData.designations,
        count: reportData.designations.length,
      })
    }

    if (reportData?.subDepartments && reportData.subDepartments.length > 0) {
      filters.push({
        name: "Sub Departments",
        icon: Building2,
        values: reportData.subDepartments,
        count: reportData.subDepartments.length,
      })
    }

    if (reportData?.sections && reportData.sections.length > 0) {
      filters.push({
        name: "Sections",
        icon: Users,
        values: reportData.sections,
        count: reportData.sections.length,
      })
    }

    if (reportData?.grades && reportData.grades.length > 0) {
      filters.push({
        name: "Grades",
        icon: Users,
        values: reportData.grades,
        count: reportData.grades.length,
      })
    }

      if (reportData?.employeeID && reportData.employeeID.length > 0) {
        filters.push({
          name: "Employee ID",
          icon: Users,
          values: reportData.employeeID,
          count: reportData.employeeID.length,
        })
      }

      if (reportData?.employeeCategories && reportData.employeeCategories.length > 0) {
        filters.push({
          name: "Employee Categories",
          icon: Users,
          values: reportData.employeeCategories,
          count: reportData.employeeCategories.length,
        })
      }

      // Show contractors if available, otherwise show subsidiaries
    if (reportData?.contractor && reportData.contractor.length > 0) {
      filters.push({
        name: "Contractors",
        icon: GitBranch,
        values: reportData.contractor,
        count: reportData.contractor.length,
      })
    } 

      if (reportData?.workOrderNumber && reportData.workOrderNumber.length > 0) {
        filters.push({
          name: "Work Order Number",
          icon: Users,
          values: reportData.workOrderNumber,
          count: reportData.workOrderNumber.length,
        })
      }

      // Combine shiftGroups and shifts for filter display
      const allShifts = [
        ...(reportData?.shiftGroups || []),
        ...(reportData?.shifts || [])
      ]
      if (allShifts.length > 0) {
        filters.push({
          name: "Shifts",
          icon: Clock,
          values: allShifts,
          count: allShifts.length,
        })
      }

    return filters
  }

  const activeFilters = getActiveFilters()

  // Process GraphQL responses and filter by codes from reportData
  const normalizedSubsidiaries = useMemo(() => {
    const org = subsidiariesResponse?.fetchOrganization?.[0]
    if (!org?.subsidiaries || subsidiaryCodes.length === 0) {
      // Fallback to reportData if GraphQL data not available
      return (reportData?.subsidiaries || []).map((item: any) => {
        if (typeof item === 'string') return { code: item, name: item }
        return { code: item.subsidiaryCode || item.code || item, name: item.subsidiaryName || item.name || item.subsidiaryCode || item.code || item }
      })
    }
    return org.subsidiaries
      .filter((sub: any) => subsidiaryCodes.includes(sub.subsidiaryCode))
      .map((sub: any) => ({
        code: sub.subsidiaryCode,
        name: sub.subsidiaryName,
      }))
  }, [subsidiariesResponse, subsidiaryCodes, reportData?.subsidiaries])

  const normalizedDivisions = useMemo(() => {
    const org = divisionsResponse?.fetchOrganization?.[0]
    if (!org?.divisions || divisionCodes.length === 0) {
      return (reportData?.divisions || []).map((item: any) => {
        if (typeof item === 'string') return { code: item, name: item }
        return { code: item.divisionCode || item.code || item, name: item.divisionName || item.name || item.divisionCode || item.code || item }
      })
    }
    return org.divisions
      .filter((div: any) => divisionCodes.includes(div.divisionCode))
      .map((div: any) => ({
        code: div.divisionCode,
        name: div.divisionName,
      }))
  }, [divisionsResponse, divisionCodes, reportData?.divisions])

  const normalizedDepartments = useMemo(() => {
    const org = departmentsResponse?.fetchOrganization?.[0]
    if (!org?.departments || departmentCodes.length === 0) {
      return (reportData?.departments || []).map((item: any) => {
        if (typeof item === 'string') return { code: item, name: item }
        return { code: item.departmentCode || item.code || item, name: item.departmentName || item.name || item.departmentCode || item.code || item }
      })
    }
    return org.departments
      .filter((dept: any) => departmentCodes.includes(dept.departmentCode))
      .map((dept: any) => ({
        code: dept.departmentCode,
        name: dept.departmentName,
      }))
  }, [departmentsResponse, departmentCodes, reportData?.departments])

  const normalizedDesignations = useMemo(() => {
    const org = designationsResponse?.fetchOrganization?.[0]
    if (!org?.designations || designationCodes.length === 0) {
      return (reportData?.designations || []).map((item: any) => {
        if (typeof item === 'string') return { code: item, name: item }
        return { code: item.designationCode || item.code || item, name: item.designationName || item.name || item.designationCode || item.code || item }
      })
    }
    return org.designations
      .filter((des: any) => designationCodes.includes(des.designationCode))
      .map((des: any) => ({
        code: des.designationCode,
        name: des.designationName,
      }))
  }, [designationsResponse, designationCodes, reportData?.designations])

  const normalizedSubDepartments = useMemo(() => {
    const org = subDepartmentsResponse?.fetchOrganization?.[0]
    if (!org?.subDepartments || subDepartmentCodes.length === 0) {
      return (reportData?.subDepartments || []).map((item: any) => {
        if (typeof item === 'string') return { code: item, name: item }
        return { code: item.subDepartmentCode || item.code || item, name: item.subDepartmentName || item.name || item.subDepartmentCode || item.code || item }
      })
    }
    return org.subDepartments
      .filter((subDept: any) => subDepartmentCodes.includes(subDept.subDepartmentCode))
      .map((subDept: any) => ({
        code: subDept.subDepartmentCode,
        name: subDept.subDepartmentName,
      }))
  }, [subDepartmentsResponse, subDepartmentCodes, reportData?.subDepartments])

  const normalizedGrades = useMemo(() => {
    const org = gradesResponse?.fetchOrganization?.[0]
    if (!org?.grades || gradeCodes.length === 0) {
      return (reportData?.grades || []).map((item: any) => {
        if (typeof item === 'string') return { code: item, name: item }
        return { code: item.gradeCode || item.code || item, name: item.gradeName || item.name || item.gradeCode || item.code || item }
      })
    }
    return org.grades
      .filter((grade: any) => gradeCodes.includes(grade.gradeCode))
      .map((grade: any) => ({
        code: grade.gradeCode,
        name: grade.gradeName,
      }))
  }, [gradesResponse, gradeCodes, reportData?.grades])

  const normalizedSections = useMemo(() => {
    const org = sectionsResponse?.fetchOrganization?.[0]
    if (!org?.sections || sectionCodes.length === 0) {
      return (reportData?.sections || []).map((item: any) => {
        if (typeof item === 'string') return { code: item, name: item }
        return { code: item.sectionCode || item.code || item, name: item.sectionName || item.name || item.sectionCode || item.code || item }
      })
    }
    return org.sections
      .filter((sec: any) => sectionCodes.includes(sec.sectionCode))
      .map((sec: any) => ({
        code: sec.sectionCode,
        name: sec.sectionName,
      }))
  }, [sectionsResponse, sectionCodes, reportData?.sections])

  const normalizedEmployeeCategories = useMemo(() => {
    const orgs = employeeCategoriesResponse?.fetchOrganization
    if (!Array.isArray(orgs) || orgs.length === 0 || employeeCategoryCodes.length === 0) {
      return (reportData?.employeeCategories || []).map((item: any) => {
        if (typeof item === 'string') return { code: item, name: item }
        return { code: item.employeeCategoryCode || item.code || item, name: item.employeeCategoryName || item.name || item.employeeCategoryCode || item.code || item }
      })
    }
    
    // Extract all employee categories from organization objects
    const allCategories: any[] = []
    orgs.forEach((org: any) => {
      if (Array.isArray(org.employeeCategories)) {
        org.employeeCategories.forEach((cat: any) => {
          if (employeeCategoryCodes.includes(cat.employeeCategoryCode)) {
            allCategories.push({
              code: cat.employeeCategoryCode,
              name: cat.employeeCategoryName,
            })
          }
        })
      }
    })
    
    // Remove duplicates by code
    const byCode = new Map<string, any>()
    allCategories.forEach((cat: any) => {
      if (!byCode.has(cat.code)) {
        byCode.set(cat.code, cat)
      }
    })
    
    return Array.from(byCode.values())
  }, [employeeCategoriesResponse, employeeCategoryCodes, reportData?.employeeCategories])

  const normalizedContractors = useMemo(() => {
    const contractors = contractorsResponse?.fetchContractors
    if (!contractors || contractorCodes.length === 0) {
      return (reportData?.contractor || []).map((item: any) => {
        if (typeof item === 'string') return { code: item, name: item }
        return { code: item.contractorCode || item.code || item, name: item.contractorName || item.name || item.contractorCode || item.code || item }
      })
    }
    return contractors
      .filter((ctr: any) => contractorCodes.includes(ctr.contractorCode))
      .map((ctr: any) => ({
        code: ctr.contractorCode,
        name: ctr.contractorName,
      }))
  }, [contractorsResponse, contractorCodes, reportData?.contractor])

  const normalizedLocations = useMemo(() => {
    const orgs = locationsResponse?.fetchOrganization
    if (!Array.isArray(orgs) || orgs.length === 0 || locationCodes.length === 0) {
      return (reportData?.location || []).map((item: any) => {
        if (typeof item === 'string') return { code: item, name: item }
        return { code: item.locationCode || item.code || item, name: item.locationName || item.name || item.locationCode || item.code || item }
      })
    }
    const allLocations: any[] = []
    orgs.forEach((org: any) => {
      if (Array.isArray(org.location)) {
        org.location.forEach((loc: any) => {
          if (locationCodes.includes(loc.locationCode)) {
            allLocations.push({
              code: loc.locationCode,
              name: loc.locationName,
            })
          }
        })
      }
    })
    // Remove duplicates
    const byCode = new Map<string, any>()
    allLocations.forEach((loc: any) => {
      if (!byCode.has(loc.code)) {
        byCode.set(loc.code, loc)
      }
    })
    return Array.from(byCode.values())
  }, [locationsResponse, locationCodes, reportData?.location])

  const normalizedWorkOrders = useMemo(() => {
    if (!Array.isArray(reportData?.workOrderNumber)) return []
    return reportData.workOrderNumber.map((item: any) => {
      if (typeof item === 'string') {
        return { code: item, name: item }
      }
      return { code: item.workOrderNumber || item.code || item, name: item.workOrderNumber || item.name || item.code || item }
    })
  }, [reportData?.workOrderNumber])

  // Extract raw shift groups and shifts (similar to table-filter-section.tsx)
  const rawShiftGroups = useMemo(() => {
    const shifts = shiftsResponse?.fetchShifts
    if (!shifts || !Array.isArray(shifts)) return []
    
    const shiftGroupMap = new Map<string, any>()
    shifts.forEach((item: any) => {
      if (item.shiftGroupCode && !shiftGroupMap.has(item.shiftGroupCode)) {
        shiftGroupMap.set(item.shiftGroupCode, {
          shiftGroupCode: item.shiftGroupCode,
          shiftGroupName: item.shiftGroupName,
        })
      }
    })
    return Array.from(shiftGroupMap.values())
  }, [shiftsResponse])

  const rawShifts = useMemo(() => {
    const shifts = shiftsResponse?.fetchShifts
    if (!shifts || !Array.isArray(shifts)) return []
    
    const allShifts: any[] = []
    shifts.forEach((item: any) => {
      if (item.shift && Array.isArray(item.shift)) {
        item.shift.forEach((shift: any) => {
          allShifts.push({
            ...shift,
            shiftCode: shift.shiftCode,
            shiftName: shift.shiftName,
            shiftGroupCode: item.shiftGroupCode,
          })
        })
      }
    })
    return allShifts
  }, [shiftsResponse])

  const normalizedShifts = useMemo(() => {
    // Combine both shiftGroups and shifts from report data
    const allReportShifts = [
      ...(reportData?.shiftGroups || []),
      ...(reportData?.shifts || [])
    ]
    
    // If no codes in report data, return empty array
    if (allReportShifts.length === 0) {
      return []
    }
    
    // Always prepare report data mapping first (for fallback)
    const reportDataMap = new Map<string, any>()
    allReportShifts.forEach((item: any) => {
      if (typeof item === 'string') {
        reportDataMap.set(item, { code: item, name: item })
      } else {
        const code = item.shiftCode || item.shiftGroupCode || item.code || item
        const name = item.shiftName || item.shiftGroupName || item.name || code
        if (code) {
          reportDataMap.set(code, { code, name })
        }
      }
    })
    
    // If no GraphQL data available, return report data
    if (!shiftsResponse || (!rawShiftGroups.length && !rawShifts.length)) {
      return Array.from(reportDataMap.values())
    }
    
    // Process GraphQL data if available
    const codeSet = new Set(shiftCodes)
    const processedShifts: any[] = []
    
    // Extract shift groups from GraphQL that match codes
    rawShiftGroups.forEach((sg: any) => {
      if (sg.shiftGroupCode && codeSet.has(sg.shiftGroupCode)) {
        processedShifts.push({
          code: sg.shiftGroupCode,
          name: sg.shiftGroupName || sg.shiftGroupCode,
        })
      }
    })
    
    // Extract individual shifts from GraphQL that match codes
    rawShifts.forEach((shift: any) => {
      if (shift.shiftCode && codeSet.has(shift.shiftCode)) {
        processedShifts.push({
          code: shift.shiftCode,
          name: shift.shiftName || shift.shiftCode,
        })
      }
    })
    
    // If we got processed shifts from GraphQL, use them; otherwise fallback to report data
    if (processedShifts.length > 0) {
      // Merge GraphQL data with report data (GraphQL takes precedence, but include any report-only codes)
      const resultMap = new Map<string, any>()
      
      // Add processed shifts from GraphQL
      processedShifts.forEach(shift => {
        if (!resultMap.has(shift.code)) {
          resultMap.set(shift.code, shift)
        }
      })
      
      // Add any report data codes that weren't found in GraphQL
      shiftCodes.forEach(code => {
        if (!resultMap.has(code) && reportDataMap.has(code)) {
          resultMap.set(code, reportDataMap.get(code))
        }
      })
      
      return Array.from(resultMap.values())
    }
    
    // Fallback: return report data
    return Array.from(reportDataMap.values())
  }, [shiftsResponse, rawShiftGroups, rawShifts, shiftCodes, reportData?.shifts, reportData?.shiftGroups])

  // Filter functions
  const filterData = (data: any[], searchTerm: string, field: 'code' | 'name' = 'code') => {
    if (!searchTerm.trim()) return data
    const query = searchTerm.toLowerCase().trim()
    return data.filter((item: any) => {
      const value = field === 'code' ? item.code : item.name
      return value?.toLowerCase().includes(query)
    })
  }

  // Filtered data
  const filteredSubsidiaries = useMemo(() => filterData(normalizedSubsidiaries, subsidiariesSearch), [normalizedSubsidiaries, subsidiariesSearch])
  const filteredDivisions = useMemo(() => filterData(normalizedDivisions, divisionsSearch), [normalizedDivisions, divisionsSearch])
  const filteredDepartments = useMemo(() => filterData(normalizedDepartments, departmentsSearch), [normalizedDepartments, departmentsSearch])
  const filteredDesignations = useMemo(() => filterData(normalizedDesignations, designationsSearch), [normalizedDesignations, designationsSearch])
  const filteredSubDepartments = useMemo(() => filterData(normalizedSubDepartments, subDepartmentsSearch), [normalizedSubDepartments, subDepartmentsSearch])
  const filteredGrades = useMemo(() => filterData(normalizedGrades, gradesSearch), [normalizedGrades, gradesSearch])
  const filteredSections = useMemo(() => filterData(normalizedSections, sectionsSearch), [normalizedSections, sectionsSearch])
  const filteredEmployeeCategories = useMemo(() => filterData(normalizedEmployeeCategories, employeeCategoriesSearch), [normalizedEmployeeCategories, employeeCategoriesSearch])
  const filteredEmployeeIDs = useMemo(() => {
    if (!employeeIDSearch.trim()) return reportData?.employeeID || []
    const query = employeeIDSearch.toLowerCase().trim()
    return (reportData?.employeeID || []).filter((id: string) => id.toLowerCase().includes(query))
  }, [reportData?.employeeID, employeeIDSearch])
  const filteredContractors = useMemo(() => filterData(normalizedContractors, contractorSearch), [normalizedContractors, contractorSearch])
  const filteredLocations = useMemo(() => filterData(normalizedLocations, locationsSearch), [normalizedLocations, locationsSearch])
  const filteredWorkOrders = useMemo(() => filterData(normalizedWorkOrders, workOrderSearch), [normalizedWorkOrders, workOrderSearch])
  const filteredShifts = useMemo(() => filterData(normalizedShifts, shiftsSearch), [normalizedShifts, shiftsSearch])

  // Paginated data
  const paginatedSubsidiaries = useMemo(() => filteredSubsidiaries.slice((subsidiariesPage - 1) * pageSize, subsidiariesPage * pageSize), [filteredSubsidiaries, subsidiariesPage])
  const paginatedDivisions = useMemo(() => filteredDivisions.slice((divisionsPage - 1) * pageSize, divisionsPage * pageSize), [filteredDivisions, divisionsPage])
  const paginatedDepartments = useMemo(() => filteredDepartments.slice((departmentsPage - 1) * pageSize, departmentsPage * pageSize), [filteredDepartments, departmentsPage])
  const paginatedDesignations = useMemo(() => filteredDesignations.slice((designationsPage - 1) * pageSize, designationsPage * pageSize), [filteredDesignations, designationsPage])
  const paginatedSubDepartments = useMemo(() => filteredSubDepartments.slice((subDepartmentsPage - 1) * pageSize, subDepartmentsPage * pageSize), [filteredSubDepartments, subDepartmentsPage])
  const paginatedGrades = useMemo(() => filteredGrades.slice((gradesPage - 1) * pageSize, gradesPage * pageSize), [filteredGrades, gradesPage])
  const paginatedSections = useMemo(() => filteredSections.slice((sectionsPage - 1) * pageSize, sectionsPage * pageSize), [filteredSections, sectionsPage])
  const paginatedEmployeeCategories = useMemo(() => filteredEmployeeCategories.slice((employeeCategoriesPage - 1) * pageSize, employeeCategoriesPage * pageSize), [filteredEmployeeCategories, employeeCategoriesPage])
  const paginatedEmployeeIDs = useMemo(() => filteredEmployeeIDs.slice((employeeIDPage - 1) * pageSize, employeeIDPage * pageSize), [filteredEmployeeIDs, employeeIDPage])
  const paginatedContractors = useMemo(() => filteredContractors.slice((contractorPage - 1) * pageSize, contractorPage * pageSize), [filteredContractors, contractorPage])
  const paginatedLocations = useMemo(() => filteredLocations.slice((locationsPage - 1) * pageSize, locationsPage * pageSize), [filteredLocations, locationsPage])
  const paginatedWorkOrders = useMemo(() => filteredWorkOrders.slice((workOrderPage - 1) * pageSize, workOrderPage * pageSize), [filteredWorkOrders, workOrderPage])
  const paginatedShifts = useMemo(() => filteredShifts.slice((shiftsPage - 1) * pageSize, shiftsPage * pageSize), [filteredShifts, shiftsPage])

  // Reset pages when search changes
  useEffect(() => setSubsidiariesPage(1), [subsidiariesSearch])
  useEffect(() => setDivisionsPage(1), [divisionsSearch])
  useEffect(() => setDepartmentsPage(1), [departmentsSearch])
  useEffect(() => setDesignationsPage(1), [designationsSearch])
  useEffect(() => setSubDepartmentsPage(1), [subDepartmentsSearch])
  useEffect(() => setGradesPage(1), [gradesSearch])
  useEffect(() => setSectionsPage(1), [sectionsSearch])
  useEffect(() => setEmployeeCategoriesPage(1), [employeeCategoriesSearch])
  useEffect(() => setEmployeeIDPage(1), [employeeIDSearch])
  useEffect(() => setContractorPage(1), [contractorSearch])
  useEffect(() => setLocationsPage(1), [locationsSearch])
  useEffect(() => setWorkOrderPage(1), [workOrderSearch])
  useEffect(() => setShiftsPage(1), [shiftsSearch])

  // Reusable Table Component
  const FilterTable = ({ 
    title, 
    icon: Icon, 
    data, 
    filteredData, 
    paginatedData, 
    searchTerm, 
    onSearchChange, 
    page, 
    onPageChange,
    codeLabel = "Code",
    nameLabel = "Name"
  }: {
    title: string
    icon: any
    data: any[]
    filteredData: any[]
    paginatedData: any[]
    searchTerm: string
    onSearchChange: (value: string) => void
    page: number
    onPageChange: (page: number) => void
    codeLabel?: string
    nameLabel?: string
  }) => {
    if (data.length === 0) return null

    return (
      <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-gray-900 leading-none">{title}</h2>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              {data.length} {title.toLowerCase()} selected
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Search */}
          <div className="flex bg-muted/50 rounded-lg border">
            <div className="flex-1 flex items-center bg-background rounded-lg">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={`Search by ${codeLabel.toLowerCase()} or ${nameLabel.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg bg-slate-50/40">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                    {codeLabel}
                  </TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                    {nameLabel}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <TableRow
                      key={`${item.code}-${index}`}
                      className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                    >
                      <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                        {item.code}
                      </TableCell>
                      <TableCell className="py-1.5 text-sm text-gray-900">
                        {item.name}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-sm text-gray-500">
                      No items found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {filteredData.length > pageSize && (
              <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                <p className="text-[11px] text-gray-500">
                  Showing{' '}
                  <span className="font-semibold">
                    {Math.min((page - 1) * pageSize + 1, filteredData.length)}-
                    {Math.min(page * pageSize, filteredData.length)}
                  </span>{' '}
                  of <span className="font-semibold">{filteredData.length}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    disabled={page === 1}
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    disabled={page * pageSize >= filteredData.length}
                    onClick={() => onPageChange(page * pageSize >= filteredData.length ? page : page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Employee ID Table (similar to wage-popup-request.tsx)
  const EmployeeIDTable = () => {
    if (!reportData?.employeeID || reportData.employeeID.length === 0) return null

    return (
      <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Users className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Employee IDs</h2>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              {reportData.employeeID.length} employees selected
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Search */}
          <div className="flex bg-muted/50 rounded-lg border">
            <div className="flex-1 flex items-center bg-background rounded-lg">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by employee ID..."
                  value={employeeIDSearch}
                  onChange={(e) => setEmployeeIDSearch(e.target.value)}
                  className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg bg-slate-50/40">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                    SL No
                  </TableHead>
                  <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                    Employee ID
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployeeIDs.length > 0 ? (
                  paginatedEmployeeIDs.map((employeeID, index) => {
                    const actualIndex = filteredEmployeeIDs.indexOf(employeeID)
                    return (
                      <TableRow
                        key={`${employeeID}-${actualIndex}`}
                        className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                      >
                        <TableCell className="py-1.5 pl-4 text-sm text-gray-900">
                          {actualIndex + 1}
                        </TableCell>
                        <TableCell className="py-1.5 pr-4 font-mono text-[11px] text-gray-900">
                          {employeeID}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-sm text-gray-500">
                      No employees found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {filteredEmployeeIDs.length > pageSize && (
              <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                <p className="text-[11px] text-gray-500">
                  Showing{' '}
                  <span className="font-semibold">
                    {Math.min((employeeIDPage - 1) * pageSize + 1, filteredEmployeeIDs.length)}-
                    {Math.min(employeeIDPage * pageSize, filteredEmployeeIDs.length)}
                  </span>{' '}
                  of <span className="font-semibold">{filteredEmployeeIDs.length}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    disabled={employeeIDPage === 1}
                    onClick={() => setEmployeeIDPage(Math.max(1, employeeIDPage - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    disabled={employeeIDPage * pageSize >= filteredEmployeeIDs.length}
                    onClick={() => setEmployeeIDPage(employeeIDPage * pageSize >= filteredEmployeeIDs.length ? employeeIDPage : employeeIDPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-4 md:py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {reportData?.reportTitle || 'Report'}
              </h1>
              <p className="text-sm text-gray-600 font-medium">Generated report • {(reportData?.extension || 'pdf').toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleViewFile}
              size="sm"
              className={`${reportData?.report ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              disabled={!reportData?.report}
            >
              <Eye className="h-4 w-4 mr-2" />
              {reportData?.report ? 'View File' : 'No File Available'}
            </Button>
            <Button
              onClick={handleReportDownload}
              size="sm"
              className={`${reportData?.report ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              disabled={!reportData?.report}
            >
              <DownloadCloud className="h-4 w-4 mr-2" />
              {reportData?.report ? 'Download Report' : 'No Report Available'}
            </Button>
            {/* <Button size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button> */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-4 space-y-6">
            {/* Report Details & Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Report Details */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Report Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">Report Name</span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {reportData?.reportName || 'N/A'}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">Workflow</span>
                      <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                        {reportData?.workflowName || 'N/A'}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">Tenant ID</span>
                      <span className="text-sm font-mono text-gray-900">{reportData?.tenantId || tenantCode}</span>
                    </div>
                    {/* <Separator />
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">Report ID</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-900">{reportData?._id || 'N/A'}</span>
                        {reportData?.report && (
                          <div className="flex items-center gap-1">
                            <Download size={12} className="text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Ready</span>
                          </div>
                        )}
                      </div>
                    </div> */}
                  </div>
                </CardContent>
              </Card>

              {/* Report Period */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Report Period
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">Period</span>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{reportData?.period || 'N/A'}</Badge>
                    </div>
                    <Separator />
                    <div className="py-2">
                      <span className="text-sm font-medium text-gray-600 block mb-2">Date Range</span>
                      <div className="bg-gray-50 rounded-lg p-3 border">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">{dateRange.range}</div>
                          <div className="text-xs text-gray-500 mt-1">{dateRange.days} days period</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters Applied - Tables */}
            <div className="space-y-6">
              {/* Subsidiaries Table */}
              <FilterTable
                title="Subsidiaries"
                icon={GitBranch}
                data={normalizedSubsidiaries}
                filteredData={filteredSubsidiaries}
                paginatedData={paginatedSubsidiaries}
                searchTerm={subsidiariesSearch}
                onSearchChange={setSubsidiariesSearch}
                page={subsidiariesPage}
                onPageChange={setSubsidiariesPage}
                codeLabel="Subsidiary Code"
                nameLabel="Subsidiary Name"
              />

              {/* Divisions Table */}
              <FilterTable
                title="Divisions"
                icon={Users}
                data={normalizedDivisions}
                filteredData={filteredDivisions}
                paginatedData={paginatedDivisions}
                searchTerm={divisionsSearch}
                onSearchChange={setDivisionsSearch}
                page={divisionsPage}
                onPageChange={setDivisionsPage}
                codeLabel="Division Code"
                nameLabel="Division Name"
              />

              {/* Departments Table */}
              <FilterTable
                title="Departments"
                icon={Building2}
                data={normalizedDepartments}
                filteredData={filteredDepartments}
                paginatedData={paginatedDepartments}
                searchTerm={departmentsSearch}
                onSearchChange={setDepartmentsSearch}
                page={departmentsPage}
                onPageChange={setDepartmentsPage}
                codeLabel="Department Code"
                nameLabel="Department Name"
              />

              {/* Designations Table */}
              <FilterTable
                title="Designations"
                icon={Users}
                data={normalizedDesignations}
                filteredData={filteredDesignations}
                paginatedData={paginatedDesignations}
                searchTerm={designationsSearch}
                onSearchChange={setDesignationsSearch}
                page={designationsPage}
                onPageChange={setDesignationsPage}
                codeLabel="Designation Code"
                nameLabel="Designation Name"
              />

              {/* Sub Departments Table */}
              <FilterTable
                title="Sub Departments"
                icon={Building2}
                data={normalizedSubDepartments}
                filteredData={filteredSubDepartments}
                paginatedData={paginatedSubDepartments}
                searchTerm={subDepartmentsSearch}
                onSearchChange={setSubDepartmentsSearch}
                page={subDepartmentsPage}
                onPageChange={setSubDepartmentsPage}
                codeLabel="Sub Department Code"
                nameLabel="Sub Department Name"
              />

              {/* Grades Table */}
              <FilterTable
                title="Grades"
                icon={Users}
                data={normalizedGrades}
                filteredData={filteredGrades}
                paginatedData={paginatedGrades}
                searchTerm={gradesSearch}
                onSearchChange={setGradesSearch}
                page={gradesPage}
                onPageChange={setGradesPage}
                codeLabel="Grade Code"
                nameLabel="Grade Name"
              />

              {/* Sections Table */}
              <FilterTable
                title="Sections"
                icon={Users}
                data={normalizedSections}
                filteredData={filteredSections}
                paginatedData={paginatedSections}
                searchTerm={sectionsSearch}
                onSearchChange={setSectionsSearch}
                page={sectionsPage}
                onPageChange={setSectionsPage}
                codeLabel="Section Code"
                nameLabel="Section Name"
              />

              {/* Employee Categories Table */}
              <FilterTable
                title="Employee Categories"
                icon={Users}
                data={normalizedEmployeeCategories}
                filteredData={filteredEmployeeCategories}
                paginatedData={paginatedEmployeeCategories}
                searchTerm={employeeCategoriesSearch}
                onSearchChange={setEmployeeCategoriesSearch}
                page={employeeCategoriesPage}
                onPageChange={setEmployeeCategoriesPage}
                codeLabel="Category Code"
                nameLabel="Category Name"
              />

              {/* Locations Table */}
              <FilterTable
                title="Locations"
                icon={Building2}
                data={normalizedLocations}
                filteredData={filteredLocations}
                paginatedData={paginatedLocations}
                searchTerm={locationsSearch}
                onSearchChange={setLocationsSearch}
                page={locationsPage}
                onPageChange={setLocationsPage}
                codeLabel="Location Code"
                nameLabel="Location Name"
              />

              {/* Contractors Table */}
              <FilterTable
                title="Contractors"
                icon={Shield}
                data={normalizedContractors}
                filteredData={filteredContractors}
                paginatedData={paginatedContractors}
                searchTerm={contractorSearch}
                onSearchChange={setContractorSearch}
                page={contractorPage}
                onPageChange={setContractorPage}
                codeLabel="Contractor Code"
                nameLabel="Contractor Name"
              />

              {/* Work Order Numbers Table */}
              <FilterTable
                title="Work Order Numbers"
                icon={FileText}
                data={normalizedWorkOrders}
                filteredData={filteredWorkOrders}
                paginatedData={paginatedWorkOrders}
                searchTerm={workOrderSearch}
                onSearchChange={setWorkOrderSearch}
                page={workOrderPage}
                onPageChange={setWorkOrderPage}
                codeLabel="Work Order Number"
                nameLabel="Work Order Number"
              />

              {/* Shifts Table */}
              <FilterTable
                title="Shifts"
                icon={Clock}
                data={normalizedShifts}
                filteredData={filteredShifts}
                paginatedData={paginatedShifts}
                searchTerm={shiftsSearch}
                onSearchChange={setShiftsSearch}
                page={shiftsPage}
                onPageChange={setShiftsPage}
                codeLabel="Shift Code"
                nameLabel="Shift Name"
              />

              {/* Employee IDs Table */}
              <EmployeeIDTable />
            </div>
          </div>

        </div>
      </div>

      {/* File Viewer Modal */}
      {viewerOpen && viewerUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Viewing Report ({viewerType.toUpperCase()})</h3>
                    <p className="text-blue-100 text-sm">File preview and download options</p>
                  </div>
              </div>
              <Button
                onClick={closeViewer}
                variant="ghost"
                size="icon"
                  className="h-10 w-10 text-white hover:bg-white/20 rounded-xl transition-all duration-200"
              >
                  <X size={20} />
              </Button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50">
              {viewerType === 'pdf' ? (
                <iframe
                  src={viewerUrl}
                  className="w-full h-full border-0 rounded-xl shadow-lg"
                  title="PDF Viewer"
                />
              ) : viewerType === 'excel' || viewerType === 'xlsx' || viewerType === 'xls' ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="w-[400px]">
                    <div className="text-center space-y-6">
                      {/* Excel Icon with Animation */}
                      <div className="relative">
                        <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mx-auto w-24 h-24 flex items-center justify-center">
                          <FileText className="h-12 w-12 text-white" />
                        </div>
                        
                  </div>

                      {/* File Info */}
                      <div className="space-y-2">
                        <h4 className="text-2xl font-bold text-gray-800">
                          Excel File (.xlsx)
                        </h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          This is an Excel file that will be downloaded as .xlsx format with all your data intact.
                        </p>
                      </div>
                      
                      {/* File Details */}
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">File Type:</span>
                          <span className="font-semibold text-gray-800">Excel Spreadsheet</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-600">Extension:</span>
                          <span className="font-semibold text-gray-800">.xlsx</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-600">Size:</span>
                          <span className="font-semibold text-gray-800">
                            {reportData?.report ? `${Math.round(reportData.report.length / 1000)}KB` : 'Unknown'}
                          </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                      <Button
                          onClick={() => setDownloadPopup(true)}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 h-12"
                      >
                            <DownloadCloud className="h-5 w-5 mr-2" />
                          Download as .xlsx
                      </Button>
                      {/* <Button
                        onClick={() => {
                          // Force download with .xlsx extension
                          const link = document.createElement('a');
                          link.href = viewerUrl;
                          link.download = `${getSafeFileName(`${tenantCode}_${reportData?.reportName}` || 'report')}.xlsx`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        variant="outline"
                          className="border-gray-300 hover:bg-gray-50 h-12"
                      >
                            <Download className="h-5 w-5 mr-2" />
                        Force Download
                      </Button> */}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-gray-100">
                    <div className="text-center space-y-6">
                      {/* Generic File Icon */}
                      <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mx-auto w-24 h-24 flex items-center justify-center">
                        <FileText className="h-12 w-12 text-white" />
                      </div>
                      
                      {/* File Info */}
                      <div className="space-y-2">
                        <h4 className="text-2xl font-bold text-gray-800">
                      File Viewer
                    </h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          This file type cannot be previewed directly. You can download it or open in a new tab.
                        </p>
                      </div>

                      {/* File Details */}
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">File Type:</span>
                          <span className="font-semibold text-gray-800">{viewerType.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-600">Size:</span>
                          <span className="font-semibold text-gray-800">
                            {reportData?.report ? `${Math.round(reportData.report.length / 1000)}KB` : 'Unknown'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => window.open(viewerUrl, '_blank')}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 h-12"
                      >
                          <Download className="h-5 w-5 mr-2" />
                        Open in New Tab
                      </Button>
                        {permission?.downloadReports && (
                          <Button
                            onClick={handleReportDownload}
                            variant="outline"
                            className="border-gray-300 hover:bg-gray-50 h-12"
                          >
                            <DownloadCloud className="h-5 w-5 mr-2" />
                            Download File
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

       {/* Download Progress Popup */}
       <DownloadProgressPopup
         isOpen={downloadPopup}
         onClose={() => setDownloadPopup(false)}
         onDownload={handleReportDownload}
         fileName={getSafeFileName(`${tenantCode}_${reportData?.reportName}` || 'report')}
         fileExtension={getFileExtension(reportData?.extension || 'pdf')}
         fileSize={reportData?.report ? `${Math.round(reportData.report.length / 1000)}KB` : 'Unknown'}
         fileType={reportData?.extension?.toUpperCase() || 'PDF'}
       />
    </div>
  )
}
