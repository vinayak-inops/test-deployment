import { Filter, UserPlus, MoreVertical, ArrowLeft } from "lucide-react";

interface SidebarFromHeaderProps {
    title?: string;
    description?: string;
    employeeId?: string;
    employeeIdLabel?: string;
    onRefilter?: () => void;
    onAddNew?: () => void;
    onOpenDraftList?: () => void;
    canAdd?: boolean;
    showBackButton?: boolean;
    onBack?: () => void;
    addButtonText?: string;
    draftButtonText?: string;
}

function SidebarFromHeader({ 
    title = "Contractors", 
    description = "Manage and review contractor records",
    employeeId,
    employeeIdLabel = "Contractor Code",
    onRefilter,
    onAddNew,
    onOpenDraftList,
    canAdd = true,
    showBackButton = false,
    onBack,
    addButtonText = "Add New Contractor",
    draftButtonText = "Draft Storage List",
}: SidebarFromHeaderProps) {
    return (
        <div className=" backdrop-blur border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {showBackButton && onBack && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onBack?.();
                  }}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                  aria-label="Go back"
                  title="Go back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
                <p className="text-sm text-slate-500">
                  {description}
                  {employeeId ? (
                    <span className="ml-3 text-slate-600">
                      {employeeIdLabel}: <span className="font-medium text-slate-800">{employeeId}</span>
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onOpenDraftList && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenDraftList?.();
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  {draftButtonText}
                </button>
              )}
              {canAdd && onAddNew && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddNew?.();
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  {addButtonText}
                </button>
              )}
              {/* <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRefilter?.();
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filter
              </button> */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="inline-flex items-center justify-center h-9 w-9 rounded-md text-slate-800 hover:bg-slate-50 transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
    )
}

export default SidebarFromHeader;

