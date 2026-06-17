"use client";

import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Hash,
  MapPin,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

interface EmployeeKycValidationDetails {
  _id?: string;
  isDeleted?: boolean;
  employeeID?: string;
  tenantCode?: string;
  systemFirstName?: string;
  systemMiddleName?: string;
  systemLastName?: string;
  systemPanNumber?: string;
  systemUanNumber?: string;
  equalPanStatus?: string;
  equalUanStatus?: string;
  equalAadharStatus?: string;
  aadharNameVerificationResult?: string;
  panVerificationMessage?: string;
  uanVerificationMessage?: string;
  aadharVerificationMessage?: string;
  equalLegalCheckStatus?: string;
  equalRiskScore?: string;
  mobileNumber?: string;
  isPanMatched?: boolean;
  isAadharNameMatched?: boolean;
  panMatchStatus?: string;
  uanMatchStatus?: string;
  createdOn?: string;
  createdBy?: string;
  validationDecision?: string;
}

const getFullName = (data: EmployeeKycValidationDetails | null): string => {
  if (!data) return "N/A";
  return [data.systemFirstName, data.systemMiddleName, data.systemLastName]
    .filter(Boolean)
    .join(" ") || "N/A";
};

const formatDateTime = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const hasKycData = (record?: EmployeeKycValidationDetails | null) => {
  if (!record || record.isDeleted === true) return false;

  return Boolean(
    record.employeeID ||
    record.systemFirstName ||
    record.systemMiddleName ||
    record.systemLastName ||
    record.mobileNumber ||
    record.systemPanNumber ||
    record.systemUanNumber ||
    record.equalPanStatus ||
    record.equalUanStatus ||
    record.equalAadharStatus ||
    record.aadharNameVerificationResult ||
    record.equalLegalCheckStatus ||
    record.equalRiskScore,
  );
};

function StatusBadge({ status }: { status?: string }) {
  const upper = (status || "").toUpperCase();

  if (upper === "VERIFIED" || upper === "NAME VERIFIED" || upper === "CHECKED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
        <CheckCircle2 className="h-3 w-3" />
        {status || "Verified"}
      </span>
    );
  }

  if (upper === "FAILED" || upper === "REJECTED" || upper === "MISMATCH") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
        <XCircle className="h-3 w-3" />
        {status || "Failed"}
      </span>
    );
  }

  if (upper === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
        <Clock className="h-3 w-3" />
        {status || "Pending"}
      </span>
    );
  }

  if (upper === "NO RISK") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
        <Shield className="h-3 w-3" />
        {status || "No Risk"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
      {status || "N/A"}
    </span>
  );
}

function MatchStatus({ isMatched, label }: { isMatched?: boolean; label: string }) {
  if (isMatched === undefined) return null;

  return (
    <div className="flex items-center gap-2" aria-label={label}>
      {isMatched ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
          <CheckCircle2 className="h-3 w-3" />
          Matched
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
          <XCircle className="h-3 w-3" />
          Mismatch
        </span>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  alignTop = false,
}: {
  label: string;
  value?: ReactNode;
  alignTop?: boolean;
}) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div className={`flex ${alignTop ? "items-start" : "items-center"} border-b border-gray-100 pb-2`}>
      <label className={`w-40 flex-shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500 ${alignTop ? "pt-1" : ""}`}>
        {label}
      </label>
      <span className="min-w-0 flex-1 text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-3">
        {icon}
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function KycDetails({ data }: { data: EmployeeKycValidationDetails }) {
  const fullName = getFullName(data);

  return (
    <div className="space-y-4">
      <DetailSection title="Personal Information" icon={<Users className="h-4 w-4 text-gray-500" />}>
        <DetailRow label="Full Name" value={fullName} />
        <DetailRow label="Employee ID" value={<span className="font-mono">{data.employeeID || "N/A"}</span>} />
        <DetailRow label="Mobile Number" value={data.mobileNumber} />
      </DetailSection>

      <DetailSection title="PAN Card" icon={<CreditCard className="h-4 w-4 text-gray-500" />}>
        <DetailRow label="Status" value={<StatusBadge status={data.equalPanStatus} />} />
        <DetailRow label="PAN Number" value={<span className="font-mono">{data.systemPanNumber || "N/A"}</span>} />
        <DetailRow label="PAN Match" value={<MatchStatus isMatched={data.isPanMatched} label="PAN Match Status" />} />
        <DetailRow label="Match Status" value={data.panMatchStatus} />
        <DetailRow label="Message" value={data.panVerificationMessage} alignTop />
      </DetailSection>

      <DetailSection title="UAN" icon={<Hash className="h-4 w-4 text-gray-500" />}>
        <DetailRow label="Status" value={<StatusBadge status={data.equalUanStatus} />} />
        <DetailRow label="UAN Number" value={<span className="font-mono">{data.systemUanNumber || "N/A"}</span>} />
        <DetailRow label="UAN Match" value={<MatchStatus isMatched={data.uanMatchStatus === "UAN_MATCHED"} label="UAN Match Status" />} />
        <DetailRow label="Message" value={data.uanVerificationMessage} alignTop />
      </DetailSection>

      <DetailSection title="Aadhaar" icon={<MapPin className="h-4 w-4 text-gray-500" />}>
        <DetailRow label="Status" value={<StatusBadge status={data.equalAadharStatus} />} />
        <DetailRow label="Name Match" value={<MatchStatus isMatched={data.isAadharNameMatched} label="Aadhaar Name Match" />} />
        <DetailRow label="Name Result" value={<StatusBadge status={data.aadharNameVerificationResult} />} />
        <DetailRow
          label="Message"
          alignTop
          value={
            data.aadharVerificationMessage ? (
              <span className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                {data.aadharVerificationMessage}
              </span>
            ) : null
          }
        />
      </DetailSection>

      <DetailSection title="Legal & Risk Assessment" icon={<Shield className="h-4 w-4 text-gray-500" />}>
        <DetailRow label="Legal Status" value={<StatusBadge status={data.equalLegalCheckStatus} />} />
        <DetailRow label="Risk Score" value={<StatusBadge status={data.equalRiskScore} />} />
      </DetailSection>

      {(data.createdOn || data.createdBy) && (
        <DetailSection title="Record Information" icon={<Clock className="h-4 w-4 text-gray-500" />}>
          <DetailRow label="Created On" value={formatDateTime(data.createdOn)} />
          <DetailRow label="Created By" value={data.createdBy} />
        </DetailSection>
      )}

      {(data.validationDecision) && (
        <DetailSection title="InOps Validation Decision" icon={<Clock className="h-4 w-4 text-gray-500" />}>
          <DetailRow label="Validation Decision" value={formatDateTime(data.validationDecision)} />
        </DetailSection>
      )}
    </div>
  );
}

export function BackgroundVerificationForm({ employeeRecordId, employeeResponse }: { employeeRecordId: string | null, employeeResponse: any }) {
  const employee = employeeResponse?.[0];
  const employeeID = employee?.employeeID || employee?.employeeId || "";
  const tenantCode = useGetTenantCode();
  
  // State to store KYC record
  const [kycRecord, setKycRecord] = useState<EmployeeKycValidationDetails | null>(null);
  const [isLoadingKyc, setIsLoadingKyc] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);
  
  const jsonEqual = useMemo(() => ({
    phoneNumber: employee?.contactNumber?.primaryContactNo ?? "",
    fullName: [employee?.firstName, employee?.middleName, employee?.lastName]
      .filter(Boolean)
      .join(" "),
    tenantCode:"InOps Solutions",
  }), [employee, tenantCode]);

  const canRegisterWithEqual = Boolean(
    jsonEqual.phoneNumber &&
    jsonEqual.fullName &&
    jsonEqual.tenantCode,
  );

  const { data: equalResponse, loading, error, post: postEqualRegister } = usePostRequest<any>({
    url: "equal/integration/register",
    onSuccess: (d) => {
    },
    attendance: false, // Disable attendance header for this request
    onError: (error) => {
      console.error("Error fetching employee data:", error);
    },
  });

  const lastCalledEqualRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${jsonEqual.phoneNumber}:${jsonEqual.fullName}:${jsonEqual.tenantCode}`;
    if (canRegisterWithEqual && !loading && lastCalledEqualRef.current !== key) {
      lastCalledEqualRef.current = key;
      postEqualRegister(jsonEqual);
    }
  }, [jsonEqual.phoneNumber, jsonEqual.fullName, jsonEqual.tenantCode, loading]);

  const kycSearchPayload = useMemo(() => ([
    { field: "employeeID", operator: "eq", value: employeeID },
    { field: "tenantCode", operator: "eq", value: tenantCode },
  ]), [employeeID, tenantCode]);

  // Use the useRequest hook to fetch KYC data
  const {
    data: kycResponse,
    loading: kycLoading,
    error: kycRequestError,
    refetch: refetchKycData,
  } = useRequest<EmployeeKycValidationDetails[]>({
    url: "employee_kyc_validation/search?offset=0&limit=1",
    method: "POST",
    data: kycSearchPayload,
    enabled: Boolean(employeeID && tenantCode),
    onSuccess: (data) => {
    },
    onError: (error) => {
      console.error("Error fetching employee KYC validation data:", error);
      setKycError("Unable to load KYC validation details.");
    },
    dependencies: [employeeID, tenantCode],
  });

  // Update state when kycResponse changes
  useEffect(() => {
    if (kycLoading) {
      setIsLoadingKyc(true);
      setKycError(null);
    } else if (kycRequestError) {
      setIsLoadingKyc(false);
      setKycError("Unable to load KYC validation details.");
      setKycRecord(null);
    } else if (kycResponse) {
      setIsLoadingKyc(false);
      const records = Array.isArray(kycResponse) ? kycResponse : [];
      const record = records.find(hasKycData) || null;
      setKycRecord(record);
      setKycError(null);
    }
  }, [kycResponse, kycLoading, kycRequestError]);

  useEffect(() => {
    if (employeeID && tenantCode) {
      refetchKycData();
    }
  }, [employeeID, tenantCode]);

  const handleOpenVerification = () => {
    if (equalResponse?.verificationLink) {
      window.open(equalResponse.verificationLink, "_blank", "noopener,noreferrer");
    } else if (error) {
      alert("Unable to create verification request. Please check Equal tenant configuration.");
    } else if (loading) {
      alert("Verification request is still loading. Please wait...");
    } else {
      alert("Verification link is not available yet.");
    }
  };

  return (
    <Card className="border border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold text-gray-800">
            Background Verification
          </CardTitle>
          <button
            type="button"
            onClick={handleOpenVerification}
            // disabled={!equalResponse?.verificationLink && !error}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Open BG Verification
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700">
          {isLoadingKyc && <p>Loading KYC validation details...</p>}
          {!isLoadingKyc && kycError && (
            <p className="text-red-600">{kycError}</p>
          )}
          {!isLoadingKyc && !kycError && kycRecord && <KycDetails data={kycRecord} />}
          {!isLoadingKyc && !kycError && !kycRecord && (
            <p>No KYC validation record found for this employee and tenant.</p>
          )}

          {loading && (
            <p className="mt-4 text-blue-600">
              Creating verification request...
            </p>
          )}
          {!loading && error && (
            <p className="mt-4 text-red-600">
              Unable to create verification request. Please check Equal tenant configuration.
            </p>
          )}
          {!loading && !error && !equalResponse?.verificationLink && !kycRecord && (
            <p>Verification request is ready for employee record {employeeRecordId}.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}