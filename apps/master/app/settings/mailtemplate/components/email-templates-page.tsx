"use client";

import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import TableHeader from "@/components/header/table-header";
import PageNotFound from "@/components/page-notfound";
import { toast } from "react-toastify";

import { useEmailTemplateLogic, FIELD_LABELS, type EmailTemplateSearchField } from "./hooks/Useemailtemplatelogic";
import EmailTemplateTable from "./email-template-table";
import { EmailTemplateForm } from "./email-template-form";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { useSession } from 'next-auth/react';
import { useGetTenantCode } from '@/hooks/api/search/useGetTenantCode';
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmailTemplatesPage() {
  const [popupMode, setPopupMode] = useState<"add" | "edit" | "view">("add");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: session } = useSession();
  const tenantCode = useGetTenantCode();
  const { employeeId } = useKeyclockRoleInfo();

  const {
    rows,
    totalCount,
    totalPages,
    safePage,
    startIndex,
    endIndex,
    searchField,
    setSearchField,
    searchTerm,
    setSearchTerm,
    setCurrentPage,
    loading,
    countLoading,
    viewMode,
    editMode,
    addMode,
    hasAnyPermission,
    effectivePermissions,
    permissionsLoading,
    isAddPopupOpen,
    setIsAddPopupOpen,
    setIsDraftPopupOpen,
    refreshData,
  } = useEmailTemplateLogic();

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) return undefined;
    return rows.find((row) => String(row._id) === selectedTemplateId)?.raw;
  }, [rows, selectedTemplateId]);

  // POST request hook
  const { post: postEmailTemplate } = usePostRequest<any>({
    url: "email_templates",
    onSuccess: (data) => {
      toast.success(`Email template ${popupMode === "edit" ? "updated" : "created"} successfully`);
      refreshData();
      handleClosePopup(); // Close popup on success
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast.error(`Failed to ${popupMode === "edit" ? "update" : "create"} email template`);
      console.error("POST error:", error);
      setIsSubmitting(false);
    },
  });

  const handleOpenAddPopup = () => {
    setPopupMode("add");
    setSelectedTemplateId(null);
    setIsAddPopupOpen(true);
  };

  const handleOpenEditPopup = (id: string) => {
    setPopupMode("edit");
    setSelectedTemplateId(id);
    setIsAddPopupOpen(true);
  };

  const handleOpenViewPopup = (id: string) => {
    setPopupMode("view");
    setSelectedTemplateId(id);
    setIsAddPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsAddPopupOpen(false);
    setSelectedTemplateId(null);
    setIsSubmitting(false);
  };

  const handleFormSubmit = async (formData: any) => {
    setIsSubmitting(true);
    
    // Prepare base payload
    const basePayload = {
      _id: popupMode === "edit" ? selectedTemplate?._id : undefined,
      templateName: formData.templateName,
      subject: formData.subject,
      body: formData.body,
      isActive: formData.isActive,
      tenantCode: tenantCode,
      organizationCode: tenantCode,
    };

    // Prepare data object based on mode
    let dataObject;
    
    if (popupMode === "add") {
      // Add mode: include createdBy and createdOn
      dataObject = {
        ...basePayload,
        createdBy: employeeId,
        createdOn: new Date().toISOString(),
      };
    } else {
      // Edit mode: only include basic fields (no createdBy/createdOn)
      dataObject = {
        ...basePayload,
        // Optionally, you can include updatedBy and updatedOn here if your backend supports it
        updatedBy: employeeId,
        updatedOn: new Date().toISOString(),
      };
    }

    const postData = {
      tenant: tenantCode,
      action: "insert",
      id: popupMode === "edit" ? selectedTemplate?._id || null : null,
      collectionName: "email_templates",
      data: dataObject,
    };
    await postEmailTemplate(postData);
  };

  // ── Permission guards ──────────────────────────────────────────────────────

  if (!effectivePermissions && permissionsLoading) {
    return <div className="h-[60vh]" />;
  }

  if (!hasAnyPermission) {
    return <PageNotFound />;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <TableHeader
        title="Email Templates"
        description={
          loading || countLoading
            ? "Email Template Management | Loading..."
            : `Email Template Management | ${totalCount} templates`
        }
        canAdd={addMode}
        onAddNew={handleOpenAddPopup}
        draftButtonText="Draft Storage List"
        addButtonText="Add New Template"
      />

      {/* Search bar */}
      <div className="w-full px-8 py-4 pb-0">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex bg-muted/50 rounded-lg border flex-1">
            {/* Field selector */}
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-52">
              <Select
                value={searchField}
                onValueChange={(v) => setSearchField(v as EmailTemplateSearchField)}
              >
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="templateName">Template Name</SelectItem>
                  <SelectItem value="subject">Subject</SelectItem>
                  <SelectItem value="createdBy">Created By</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search input */}
            <div className="flex-1 flex items-center bg-background rounded-r-lg min-w-0">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder={`Search by ${FIELD_LABELS[searchField].toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent w-full placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="px-8 py-4">
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <EmailTemplateTable
            rows={rows}
            loading={loading}
            countLoading={countLoading}
            totalCount={totalCount}
            totalPages={totalPages}
            safePage={safePage}
            startIndex={startIndex}
            endIndex={endIndex}
            setCurrentPage={setCurrentPage}
            viewMode={viewMode}
            editMode={editMode}
            onEdit={handleOpenEditPopup}
            onView={handleOpenViewPopup}
          />
        </div>
      </div>

      {/* Modals */}
      {isAddPopupOpen && (
        <EmailTemplateForm
          isOpen={isAddPopupOpen}
          onClose={handleClosePopup}
          mode={popupMode}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          initialData={
            popupMode === "edit" || popupMode === "view"
              ? {
                  _id: selectedTemplate?._id,
                  templateName: selectedTemplate?.templateName || "",
                  subject: selectedTemplate?.subject || "",
                  body: selectedTemplate?.body || selectedTemplate?.bodyHtml || "",
                  isActive: selectedTemplate?.isActive ?? true,
                }
              : undefined
          }
        />
      )}
      {/* {isDraftPopupOpen && <DraftListModal onClose={() => setIsDraftPopupOpen(false)} />} */}
    </div>
  );
}
