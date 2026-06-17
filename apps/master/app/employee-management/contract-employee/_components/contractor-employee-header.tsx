import { Filter, UserPlus, MoreVertical } from "lucide-react";

interface ContractorEmployeeHeaderProps {
    title?: string;
    description?: string;
    onRefilter?: () => void;
    onAddNew?: () => void;
    onAddEmployeeShift?: () => void;
    canAdd?: boolean;
}

function ContractorEmployeeHeader({ 
    title = "Contractor Employees", 
    description = "Manage and review contractor employee records",
    onRefilter,
    onAddNew,
    onAddEmployeeShift,
    canAdd = true
}: ContractorEmployeeHeaderProps) {
    return (
        <div className=" backdrop-blur border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
              <p className="text-sm text-slate-500">{description}</p>
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
                  Add New Contract Employee
                </button>
              )}
              {onAddEmployeeShift && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddEmployeeShift?.();
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Open Employee Draft
                </button>
              )}
              <button
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
              </button>
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

export default ContractorEmployeeHeader;
