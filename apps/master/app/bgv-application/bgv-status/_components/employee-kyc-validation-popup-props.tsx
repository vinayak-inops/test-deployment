"use client";

import React, { type ReactNode } from "react";
import { X, CheckCircle2, XCircle, Clock, Shield, Users, MapPin, CreditCard, Hash, AlertCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

interface EmployeeKycValidationDetails {
  _id?: string;
  employeeID: string;
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

interface EmployeeKycValidationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: EmployeeKycValidationDetails | null;
  title?: string;
}

// Helper function to format full name
const getFullName = (data: EmployeeKycValidationDetails | null): string => {
  if (!data) return "N/A";
  const firstName = data.systemFirstName || "";
  const middleName = data.systemMiddleName || "";
  const lastName = data.systemLastName || "";
  return [firstName, middleName, lastName].filter(Boolean).join(" ") || "N/A";
};

// Helper function to format date
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

// Status Badge Component
function StatusBadge({ status }: { status?: string }) {
  const upper = (status || "").toUpperCase();

  if (upper === "VERIFIED" || upper === "NAME VERIFIED" || upper === "CHECKED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="h-3 w-3" />
        {status || "Verified"}
      </span>
    );
  }

  if (upper === "FAILED" || upper === "REJECTED" || upper === "MISMATCH" || upper === "NOT VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        <XCircle className="h-3 w-3" />
        {status || "Failed"}
      </span>
    );
  }

  if (upper === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
        <Clock className="h-3 w-3" />
        {status || "Pending"}
      </span>
    );
  }

  if (upper === "NO RISK") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <Shield className="h-3 w-3" />
        {status || "No Risk"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
      {status || "N/A"}
    </span>
  );
}

// Match Status Component
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

export default function EmployeeKycValidationPopup({
  isOpen,
  onClose,
  data,
  title = "Employee KYC Validation Details",
}: EmployeeKycValidationPopupProps) {
  if (!isOpen || !data) return null;

  const fullName = getFullName(data);
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <CardHeader className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-gray-700">{title}</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">Employee ID: {data.employeeID || "N/A"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { onClose(); }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>

        {/* Content Area */}
        <CardContent className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
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
                <DetailRow label="Validation Decision" value={data.validationDecision} />
              </DetailSection>
            )} 
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
