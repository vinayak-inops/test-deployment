"use client";

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
import { Clock3, Edit, Eye, MoreVertical, Trash2 } from "lucide-react";

function ShiftList({
  shiftData,
  onEditShift,
  onDeleteShift,
  onViewShift,
  permission,
}: {
  shiftData: any;
  onEditShift: (shift: any) => void;
  onDeleteShift: (shift: any) => void;
  onViewShift: (shift: any) => void;
  permission: any;
}) {
  const shifts = Array.isArray(shiftData?.shift) ? [...shiftData.shift].reverse() : [];

  const formatDuration = (minutes: number) => {
    const duration = Number(minutes || 0);
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return `${hours}h ${mins}m`;
  };

  if (shifts.length === 0) {
    return (
    <div className="mx-auto mt-6 max-w-7xl">
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 py-10 text-center">
        <p className="text-sm text-slate-500">No shifts found.</p>
      </div></div>
    );
  }

  return (
    <div className="mx-auto mt-6 max-w-7xl">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {shifts.map((shift: any, idx: number) => {
          const isActive = shift.status !== "inactive";

          return (
            <motion.div
              key={`${shift.shiftCode || "shift"}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: idx * 0.06 }}
              className="h-full"
            >
              <Card className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl">
                <CardContent className="relative z-20 flex h-full flex-col p-0">
                  <div className="border-b border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                          <Clock3 className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Shift</div>
                          <div className="mt-1 flex min-w-0 items-baseline gap-2">
                            <h3 className="truncate text-base font-semibold text-slate-800 transition-colors group-hover:text-blue-700">
                              {shift.shiftName || "-"}
                            </h3>
                            <p className="shrink-0 text-sm text-slate-500">({shift.shiftCode || "-"})</p>
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

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 rounded-full p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 border-slate-200 bg-white">
                            {permission?.viewMode && (
                              <DropdownMenuItem
                                onClick={() => onViewShift(shift)}
                                className="flex cursor-pointer items-center gap-2 text-slate-700"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            )}
                            {permission?.editMode && (
                              <DropdownMenuItem
                                onClick={() => onEditShift(shift)}
                                className="flex cursor-pointer items-center gap-2 text-slate-700"
                              >
                                <Edit className="h-4 w-4" />
                                Edit Shift
                              </DropdownMenuItem>
                            )}
                            {permission?.deleteMode && (
                              <DropdownMenuItem
                                onClick={() => onDeleteShift(shift)}
                                className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Shift
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  <div className="flex min-h-[220px] flex-1 flex-col">
                    <div className="px-5 py-3">
                      <div className="flex items-center justify-between border-b border-gray-200 py-2">
                        <span className="text-sm font-medium text-gray-500">Shift Start</span>
                        <span className="text-sm font-medium text-gray-900">{shift.shiftStart || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-200 py-2">
                        <span className="text-sm font-medium text-gray-500">Shift End</span>
                        <span className="text-sm font-medium text-gray-900">{shift.shiftEnd || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-200 py-2">
                        <span className="text-sm font-medium text-gray-500">Duration</span>
                        <span className="text-sm font-medium text-gray-900">{formatDuration(shift.duration)}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-200 py-2">
                        <span className="text-sm font-medium text-gray-500">Lunch Break</span>
                        <span className="text-sm font-medium text-gray-900">
                          {shift.lunchStart || "N/A"} - {shift.lunchEnd || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-200 py-2">
                        <span className="text-sm font-medium text-gray-500">Grace In</span>
                        <span className="text-sm font-medium text-gray-900">{shift.graceIn || 0}m</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-500">Grace Out</span>
                        <span className="text-sm font-medium text-gray-900">{shift.graceOut || 0}m</span>
                      </div>
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
}

export default ShiftList;
