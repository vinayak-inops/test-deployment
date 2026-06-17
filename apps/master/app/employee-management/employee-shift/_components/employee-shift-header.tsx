import { MoreVertical, UserPlus, ArrowLeft } from "lucide-react";

interface EmployeeShiftHeaderProps {
    title?: string;
    description?: string;
    /** Employee ID (or display text) to show for the current record, e.g. when editing/viewing */
    employeeId?: string | null;
    onRefilter?: () => void;
    onAddNew?: () => void;
    canAdd?: boolean;
    showBackButton?: boolean;
    onBack?: () => void;
    addButtonText?: string;
}

function EmployeeShiftHeader({
    title = "Employee Shift",
    description = "Manage and review employee shift records",
    employeeId,
    onRefilter,
    onAddNew,
    canAdd = true,
    showBackButton = false,
    onBack,
    addButtonText = "Add New Employee Shift",
}: EmployeeShiftHeaderProps) {
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
                <div className="flex items-center gap-2"><p className="text-sm text-slate-500">{description}</p>
                {employeeId != null && employeeId !== "" && (
                  <p className="text-sm font-medium text-slate-700 mt-1">Employee ID: {employeeId}</p>
                )}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
              {!showBackButton && (
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
              )}
            </div>
          </div>
        </div>
    );
}

export default EmployeeShiftHeader;

