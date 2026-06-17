"use client";

import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  BarChart3,
  Grid2x2,
  MoreHorizontal,
  Settings,
} from "lucide-react";

const ShiftCategoryCard: FC<{
  data: any[];
  isLoading: boolean;
  error: any;
  onEditShift: (shift: any) => void;
  permission: any;
}> = ({ data, isLoading, error, onEditShift, permission }) => {
  const router = useRouter();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-10 text-center text-sm text-red-600">Error loading data</div>;
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 py-10 text-center">
        <p className="text-sm text-slate-500">No shift data found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto py-4 pt-0">

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {data.map((item: any, idx: number) => {
          const shiftId = item._id?.$oid || item._id;
          const isActive = item.isActive !== false;
          const categories = item.employeeCategory || [];
          const shifts = item.shift || [];
          const subsidiaryName = item.subsidiary?.subsidiaryName || "selected";
          const locationName = item.location?.locationName || "assigned";
          const categoryText = categories.length === 1 ? "employee category" : "employee categories";
          const shiftText = shifts.length === 1 ? "shift" : "shifts";
          const categoryCodes = categories.length > 0 ? categories.join(" and ") : "";
          const isExpanded = Boolean(expandedCategories[String(shiftId || idx)]);
          const handleOpenShiftGroup = () => {
            router.push(`/policy-management/shift?mode=all&id=${shiftId}`);
          };

          return (
            <motion.div
              key={shiftId || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="h-full"
            >
              <Card className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl">
                <CardContent className="relative z-20 flex h-full flex-col p-0">
                  <div className="relative border-b border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                          <Grid2x2 className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Shift Group</div>
                          <div className="mt-1 flex min-w-0 items-baseline gap-2">
                            <h3 className="truncate text-base font-semibold text-slate-800 transition-colors group-hover:text-blue-700">
                              {item.shiftGroupName || "-"}
                            </h3>
                            <p className="shrink-0 text-sm text-slate-500">
                              ({item.shiftGroupCode || "-"})
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={
                            isActive
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }
                        >
                          {isActive ? "Active" : "Inactive"}
                        </Badge>

                        {(permission?.editMode || permission?.viewModeShifts) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 rounded-full p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            {/* <DropdownMenuContent align="end" className="w-48 border-slate-200 bg-white">
                              
                              {permission?.viewModeShifts && (
                                <DropdownMenuItem
                                  onClick={handleOpenShiftGroup}
                                  className="flex cursor-pointer items-center gap-2 text-slate-700"
                                >
                                  <BarChart3 className="h-4 w-4" />
                                  View Shifts
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent> */}
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex min-h-[190px] flex-1 flex-col">
                    <div className="px-5 py-3">
                      <div className="flex items-center justify-between border-b border-gray-200 py-2">
                        <span className="text-sm font-medium text-gray-500">Subsidiary</span>
                        <span className="text-sm font-medium text-gray-900">{subsidiaryName}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-200 py-2">
                        <span className="text-sm font-medium text-gray-500">Location</span>
                        <span className="text-sm font-medium text-gray-900">{locationName}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-200 py-2">
                        <span className="text-sm font-medium text-gray-500">Employee Categories</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {categories.length} {categoryText}
                          </span>
                          {categoryCodes && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedCategories((prev) => ({
                                  ...prev,
                                  [String(shiftId || idx)]: !prev[String(shiftId || idx)],
                                }))
                              }
                              className="text-xs font-medium text-blue-700 hover:text-blue-800"
                            >
                              {isExpanded ? "Read less" : "Read more"}
                            </button>
                          )}
                        </div>
                      </div>
                      {categoryCodes && isExpanded && (
                        <div className="border-b border-gray-200 py-2 text-xs text-gray-600">
                          {categoryCodes}
                        </div>
                      )}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-500">Total Shifts</span>
                        <span className="text-sm font-medium text-gray-900">
                          {shifts.length} {shiftText}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto px-5 pb-4">
                      <button
                        type="button"
                        onClick={handleOpenShiftGroup}
                        className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-blue-700 transition-colors group-hover:bg-blue-50 group-hover:text-blue-700"
                      >
                        Open shift group
                      </button>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 transition-transform duration-300 group-hover:scale-x-100" />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ShiftCategoryCard;
