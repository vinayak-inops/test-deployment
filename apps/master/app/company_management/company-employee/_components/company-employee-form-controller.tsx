"use client";

import { EmployeeDeploymentForm } from "./employee-deployment-form";

interface CompanyEmployeeFormControllerProps {
  duplicateData: any[];
  onRefetch: () => void;
}

export default function CompanyEmployeeFormController({
  duplicateData,
  onRefetch,
}: CompanyEmployeeFormControllerProps) {
  return (
    <div className="px-0 py-0">
      <EmployeeDeploymentForm duplicateData={duplicateData} refetch={onRefetch} />
    </div>
  );
}
