"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import PageNotFound from "@/components/page-notfound";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import CompanyEmployeeListView from "./company-employee-list-view";
import CompanyEmployeeFormController from "./company-employee-form-controller";

export default function CompanyEmployeePage() {
  const searchParams = useSearchParams();
  const [duplicateData, setDuplicateData] = useState<any[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  const companyEmployee = "companyEmployee";

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "user",
    screenName: companyEmployee,
  });

  const viewMode = rolePermissions?.view || false;
  const editMode = rolePermissions?.edit || false;
  const addMode = rolePermissions?.add || false;
  const deleteMode = rolePermissions?.delete || false;

  const mode = searchParams.get("mode");
  const isFormMode = mode === "edit" || mode === "add" || mode === "view";

  useEffect(() => {
    if (rolePermissions && !(rolePermissions.view || rolePermissions.edit || rolePermissions.add)) {
      // router.replace('/launchdesk');
    }
  }, [rolePermissions]);

  const handleRefetch = useCallback(() => {
    setRefreshTick((prev) => prev + 1);
  }, []);

  if (isFormMode) {
    return (
      <>
        <CompanyEmployeeFormController
          duplicateData={duplicateData}
          onRefetch={handleRefetch}
        />
      </>
    );
  }

  return (
    <>
      {viewMode || editMode || addMode ? (
        <CompanyEmployeeListView
          viewMode={viewMode}
          editMode={editMode}
          addMode={addMode}
          deleteMode={deleteMode}
          refreshTick={refreshTick}
          onDuplicateDataChange={setDuplicateData}
        />
      ) : (
        <PageNotFound />
      )}
    </>
  );
}
