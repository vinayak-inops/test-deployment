"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ShiftManagementForm } from "./shift-management-form";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useRouteControl } from "@/hooks/route-control/useRouteControl";
import StepByStepFilter, {
  type FilterSelections,
} from "@/components/common/step-by-step-filter";
import { EmployeeShiftListView } from "./employee-shift-list-view";
import EmployeeShiftHeader from "./employee-shift-header";
import { EmployeeShiftPopup } from "./employee-shift-popup";
import PageNotFound from "@/components/page-notfound";
const EMPLOYEE_SHIFT_BASE = "/employee-management/employee-shift";

export default function EmployeeShiftPage() {
  const { mode, id, isFormMode, goToAdd, goToEdit, goToView, goToList, getId } =
    useRouteControl({
      basePath: EMPLOYEE_SHIFT_BASE,
    });
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<any>(false);
  const [editMode, setEditMode] = useState<any>(false);
  const [addMode, setAddMode] = useState<any>(false);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [filterSelections, setFilterSelections] = useState<FilterSelections>({
    subsidiaries: [],
    divisions: [],
    departments: [],
    locations: [],
    contractors: [],
    workOrderNumbers: [],
    employeeID: "",
  });
  const canAccessRequestedMode =
    (mode === "view" && viewMode) ||
    (mode === "edit" && editMode) ||
    (mode === "add" && addMode);

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "employeeManagement",
    screenName: "employeeShift",
  });

  useEffect(() => {
    setViewMode(rolePermissions?.view || false);
    setEditMode(rolePermissions?.edit || false);
    setAddMode(rolePermissions?.add || false);
  }, [rolePermissions]);

  const handleFilterApply = useCallback((filters: FilterSelections) => {
    setFilterSelections(filters);
    setFiltersApplied(true);
    setIsFilterOpen(false);
  }, []);

  const handleFilterChange = useCallback((filters: FilterSelections) => {
    setFilterSelections(filters);
  }, []);

  const handleAddNew = useCallback(() => {
    setIsAddPopupOpen(true);
  }, []);

  // URL-based add/edit/view: form is self-contained (route + own fetch)
  if (isFormMode) {
    if (!canAccessRequestedMode) return <PageNotFound />;
    return (
      <div className="px-12 py-0">
        <ShiftManagementForm />
      </div>
    );
  }

  return (
    <>
      {viewMode || editMode || addMode ? (
        <>
          <div>
            <div className="px-12">
              <EmployeeShiftHeader
                title="Employee Shift"
                description="Manage and review employee shift records"
                onRefilter={() => setIsFilterOpen(true)}
                onAddNew={handleAddNew}
                canAdd={addMode}
                addButtonText="Add New Employee Shift"
              />
            </div>

            <EmployeeShiftListView
              filterSelections={filterSelections}
              filtersApplied={filtersApplied}
              viewMode={viewMode}
              editMode={editMode}
              addMode={addMode}
              deleteMode={false}
              onFilterClick={() => setIsFilterOpen(true)}
              onAddNew={handleAddNew}
              onEdit={goToEdit}
              onDelete={() => {}}
              onView={goToView}
              onDataLoaded={setOriginalData}
            />

            <StepByStepFilter
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              onFilterChange={handleFilterChange}
              onApply={handleFilterApply}
              initialSelections={filterSelections}
            />

            <EmployeeShiftPopup
              isOpen={isAddPopupOpen}
              onClose={() => setIsAddPopupOpen(false)}
            />
          </div>
        </>
      ) : (
        <PageNotFound />
      )}
    </>
  );
}
