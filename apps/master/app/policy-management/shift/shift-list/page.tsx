"use client"
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ShiftCategoryCard from "../_components/shift-category-card";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import ShiftsForm from "./[...shift-list]/_component/shifts-form";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import PageNotFound from "@/components/page-notfound";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import SidebarFromHeader from "@/components/header/sidebar-from-header";
import ShiftZoneForm from "../_components/shift-zone-form";
import ShiftListFilterBar from "../_components/shift-list-filter-bar";

export default function Home() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  return mode === 'all' ? <ShiftsForm /> : <ShiftListContent />;
}

function ShiftListContent() {
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isShiftZoneFormOpen, setIsShiftZoneFormOpen] = useState(false);
  const [editShiftData, setEditShiftData] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedField, setSelectedField] = useState("shiftGroupCode");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<any>(false);
  const [editMode, setEditMode] = useState<any>(false);
  const [addMode, setAddMode] = useState<any>(false);
  const [deleteMode, setDeleteMode] = useState<any>(false);
  const [viewModeShifts, setViewModeShifts] = useState<any>(false);
  const tenantCode = useGetTenantCode()
  const searchFields = [
    { value: "shiftGroupCode", label: "Shift Group Code" },
    { value: "shiftGroupName", label: "Shift Group Name" },
    { value: "subsidiaryName", label: "Subsidiary Name" },
    { value: "locationName", label: "Location Name" },
  ];


  const {
    data: attendanceResponse,
    loading: isLoading,
    error: attendanceError,
    refetch: fetchAttendance
  } = useRequest<any>({
    url: 'shift/search',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
    ],
    dependencies: []
  });

  useEffect(() => {
    fetchAttendance();
  }, []);


  const contractorEmployee = "shiftPolicy"
  const ShiftsLists = "shiftsLists"

  // Centralized role-permissions for both pages
  const { responseData: rolePolicy } = useRolePermissions({
    serviceName: 'policy',
    screenName: contractorEmployee,
  })
  const { responseData: roleShifts } = useRolePermissions({
    serviceName: 'policy',
    screenName: ShiftsLists,
  })

  useEffect(() => {
    setViewMode(!!rolePolicy?.view)
    setEditMode(!!rolePolicy?.edit)
    setAddMode(!!rolePolicy?.add)
    setDeleteMode(!!rolePolicy?.delete)
    const anyShiftsPermission = !!(roleShifts?.view || roleShifts?.add || roleShifts?.delete || roleShifts?.edit)
    setViewModeShifts(anyShiftsPermission)
  }, [rolePolicy, roleShifts])



  useEffect(() => {
    if (!attendanceResponse || !Array.isArray(attendanceResponse)) {
      setFilteredData([]);
      return;
    }
    let data = [...attendanceResponse].reverse();

    if (selectedFilter === "active") {
      data = data.filter((item: any) => item.isActive !== false);
    } else if (selectedFilter === "inactive") {
      data = data.filter((item: any) => item.isActive === false);
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (normalizedSearch) {
      data = data.filter((item: any) => {
        const fieldValueMap: Record<string, string> = {
          shiftGroupCode: item.shiftGroupCode || "",
          shiftGroupName: item.shiftGroupName || "",
          subsidiaryName: item.subsidiary?.subsidiaryName || "",
          locationName: item.location?.locationName || "",
        };

        return fieldValueMap[selectedField]?.toLowerCase().includes(normalizedSearch);
      });
    }

    setFilteredData(data);
  }, [attendanceResponse, searchTerm, selectedField, selectedFilter]);

  const existingShiftGroupCodes = attendanceResponse ? attendanceResponse.map((item: any) => item.shiftGroupCode?.toLowerCase()).filter(Boolean) : [];
  const existingShiftGroupNames = attendanceResponse ? attendanceResponse.map((item: any) => item.shiftGroupName?.toLowerCase()).filter(Boolean) : [];

  // Handler for editing a shift
  const handleEditShift = (shift: any) => {
    setEditShiftData(shift);
    setIsShiftZoneFormOpen(true);
  };

  return (
    <>
      {
        (viewMode || editMode || addMode || viewModeShifts || deleteMode) ? (
          <>
            <div className="h-full  px-12">
              <SidebarFromHeader
                title="Shift Management"
                description="Manage employee shifts and schedules"
                canAdd={addMode}
                onAddNew={() => {
                  setEditShiftData(null);
                  setIsShiftZoneFormOpen(true);
                }}
                addButtonText="Add New Shift"
              />
              <ShiftListFilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedField={selectedField}
                setSelectedField={setSelectedField}
                searchFields={searchFields}
                filtersApplied={true}
                onFilterClick={() => {
                  setSelectedFilter((current) => {
                    if (current === "all") return "active";
                    if (current === "active") return "inactive";
                    return "all";
                  });
                }}
                selectedFilterLabel={
                  selectedFilter === "all"
                    ? "All Shifts"
                    : selectedFilter === "active"
                      ? "Active Shifts"
                    : "Inactive Shifts"
                }
              />
              <ShiftZoneForm
                isOpen={isShiftZoneFormOpen}
                onClose={() => {
                  setIsShiftZoneFormOpen(false);
                  setEditShiftData(null);
                }}
                onSubmit={() => {
                  setIsShiftZoneFormOpen(false);
                  setEditShiftData(null);
                  fetchAttendance();
                }}
                initialData={editShiftData}
                isEdit={!!editShiftData}
                existingShiftGroupCodes={existingShiftGroupCodes}
                existingShiftGroupNames={existingShiftGroupNames}
              />
              <div className="mx-auto w-full max-w-7xl py-4">
                <ShiftCategoryCard
                  data={filteredData}
                  isLoading={isLoading}
                  error={attendanceError}
                  onEditShift={handleEditShift}
                  permission={
                    {
                      editMode: editMode,
                      viewModeShifts: viewModeShifts,
                    }
                  }
                />
              </div>
            </div>
          </>
        ) : (
          <PageNotFound />
        )
      }
    </>
  );
}
