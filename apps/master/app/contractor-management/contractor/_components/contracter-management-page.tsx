"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PageNotFound from "@/components/page-notfound";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import ContractorListView from "./contractor-list-view";
import FormController from "./form-controller";

export default function ContractorManagementPage() {
  const searchParams = useSearchParams();

  const contractorEmployee = "contractor";

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "user",
    screenName: contractorEmployee,
  });

  const viewMode = rolePermissions?.view || false;
  const editMode = rolePermissions?.edit || false;
  const addMode = rolePermissions?.add || false;
  const deleteMode = rolePermissions?.delete || false;

  // Optional: redirect if no view/add/edit permissions
  useEffect(() => {
    if (rolePermissions && !(rolePermissions.view || rolePermissions.edit || rolePermissions.add)) {
      // router.replace('/launchdesk');
    }
  }, [rolePermissions]);

  const mode = searchParams.get("mode");
  const formMode   = searchParams.get("form");
  const isFormMode = mode === "edit" || mode === "add" || mode === "view";

  if (isFormMode) {
    return (
      <>
        {((viewMode && mode === "view") ||
          (editMode && mode === "edit") ||
          (addMode && mode === "edit"&& formMode === "temp")) ? (
          <div className="px-0 py-0">
            <FormController />
          </div>
        ) : (
          <PageNotFound />
        )}
      </>
    );
  }

  return (
    <>
      {(viewMode || editMode || addMode) ? (
        <ContractorListView
          viewMode={viewMode}
          editMode={editMode}
          addMode={addMode}
          deleteMode={deleteMode}
        />
      ) : (
        <PageNotFound />
      )}
    </>
  );
}
