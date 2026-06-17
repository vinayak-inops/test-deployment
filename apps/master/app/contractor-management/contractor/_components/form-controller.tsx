"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import PageNotFound from "@/components/page-notfound";
import { decryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import ContractorHierarchyAccessWrapper from "@/components/contractor-hierarchy-access-wrapper";
import ContractorHeader from "./contractor-header";
import { ContractorManagementFormContent, type Mode } from "./contractor-management-form-content";

export default function FormController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const encryptedId = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  const formParam = searchParams.get("form");
  const mode: Mode = modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : "add";
  const isDraftForm = formParam === "temp";
  const contractorSearchUrl = isDraftForm ? "draft/contractor/search" : "contractor/search";
  const contractorCollectionUrl = "validate";

  const [id, setId] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (mode === "add") {
      setId(null);
      return;
    }
    if (!encryptedId) {
      setId(null);
      return;
    }
    setIsDecrypting(true);
    try {
      const decryptedData = decryptEmployeeData(encryptedId);
      setId(decryptedData?._id ?? null);
    } catch {
      setId(null);
    } finally {
      setIsDecrypting(false);
    }
  }, [encryptedId, mode]);

  const { data: contractorResponse, loading: isLoadingContractor, refetch: fetchContractor } = useRequest<any>({
    url: contractorSearchUrl,
    method: "POST",
    data: [{ field: "_id", value: id, operator: "eq" }],
    dependencies: [id, contractorSearchUrl],
  });

  useEffect(() => {
    if ((mode === "view" || mode === "edit") && id) {
      fetchContractor();
    }
  }, [mode, id]);

  useEffect(() => {
    if (Array.isArray(contractorResponse) && contractorResponse.length > 0) {
      setHasLoadedOnce(true);
    }
  }, [contractorResponse]);

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "user",
    screenName: "contractor",
  });
  const viewMode = rolePermissions?.view || false;
  const editMode = rolePermissions?.edit || false;
  const addMode = rolePermissions?.add || false;
  const isModeAllowed =
    (viewMode && mode === "view") || (editMode && mode === "edit") || (addMode && mode === "add");

  if (!isModeAllowed) return <PageNotFound />;
  if (!isDecrypting && mode !== "add" && !id) return <PageNotFound />;

  const shouldShowLoading =
    mode !== "add" &&
    (isDecrypting || (!!id && isLoadingContractor && !hasLoadedOnce));
  if (shouldShowLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{isDecrypting ? "Validating access..." : "Loading contractor data..."}</p>
        </div>
      </div>
    );
  }

  const headerContractorCode = contractorResponse?.[0]?.contractorCode || undefined;
  const title =
    mode === "add"
      ? "Add New Contractor"
      : mode === "edit"
        ? "Edit Contractor"
        : mode === "view"
          ? "View Contractor"
          : "Contractor Management";
  const description =
    mode === "add"
      ? "Add new contractor and company information"
      : mode === "edit"
        ? "Edit existing contractor and company information"
        : mode === "view"
          ? "View contractor details (read-only)"
          : "Manage contractor and company information";

  const content = (
    <div>
      <ContractorHeader
        title={title}
        description={description}
        employeeId={headerContractorCode}
        showBackButton
        onBack={() => router.push("/contractor-management/contractor")}
      />
      <ContractorManagementFormContent
        contractorResponse={contractorResponse}
        mode={mode}
        contractorRecordId={id}
        contractorSearchUrl={contractorSearchUrl}
        contractorCollectionUrl={contractorCollectionUrl}
        onRefresh={fetchContractor}
      />
    </div>
  );

  if (mode === "add" || isDraftForm) {
    return content;
  }

  return (
    <ContractorHierarchyAccessWrapper
      _id={id}
      loadingFallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Validating access...</p>
          </div>
        </div>
      }
    >
      {content}
    </ContractorHierarchyAccessWrapper>
  );
}
