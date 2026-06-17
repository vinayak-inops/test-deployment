import SidebarFromHeader from "@/components/header/sidebar-from-header";

interface CompanyEmployeeHeaderProps {
  title?: string;
  description?: string;
  onRefilter?: () => void;
  onAddNew?: () => void;
  canAdd?: boolean;
}

function CompanyEmployeeHeader({
  title = "Company Employees",
  description = "Manage and review company employee records",
  onRefilter,
  onAddNew,
  canAdd = true,
}: CompanyEmployeeHeaderProps) {
  return (
    <SidebarFromHeader
      title={title}
      description={description}
      canAdd={canAdd}
      onAddNew={onAddNew}
      addButtonText="Add New Company Employee"
      onOpenDraftList={onRefilter}
      draftButtonText="Filter"
    />
  );
}

export default CompanyEmployeeHeader;
