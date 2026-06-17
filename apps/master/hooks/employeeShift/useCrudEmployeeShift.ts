import { useState, useCallback, useEffect } from "react";

export interface ShiftData {
  shiftCode: string;
  shiftName: string;
  shiftStart: string;
  shiftEnd: string;
  firstHalfStart: string;
  firstHalfEnd: string;
  secondHalfStart: string;
  secondHalfEnd: string;
  lunchStart: string;
  lunchEnd: string;
  duration: number;
  crossDay: boolean;
  flexible: boolean;
  flexiFullDayDuration: number;
  flexiHalfDayDuration: number;
  minimumDurationForFullDay: number;
  minimumDurationForHalfDay: number;
  grace?: Partial<GraceSettings>;
  inAheadMargin?: number;
  inAboveMargin?: number;
  outAheadMargin?: number;
  outAboveMargin?: number;
  lateInAllowedTime?: number;
  earlyOutAllowedTime?: number;
  graceIn?: number;
  graceOut?: number;
  minimumDurationForPresent?: number;
  allowNormalComputation?: boolean;
}

export interface GraceSettings {
  inAheadMargin: number;
  inAboveMargin: number;
  outAheadMargin: number;
  outAboveMargin: number;
  lateInAllowedTime: number;
  earlyOutAllowedTime: number;
  graceIn: number;
  graceOut: number;
  minimumDurationForPresent: number;
  allowNormalComputation: boolean;
}

export interface WeekOff {
  week: number;
  weekOff: number[];
}

export interface RotationItem {
  days: number;
  priority: number;
  shiftGroupCode: string;
  shiftCode: string;
}

export interface EmployeeShiftItem {
  _id?: string;
  organizationCode: string;
  tenantCode: string;
  shiftGroupCode: string;
  shift: ShiftData | {};
  grace: GraceSettings | {};
  isAutomatic: boolean;
  shiftGroupName: string;
  weekOffs: WeekOff[];
  isActive: boolean;
  employeeID: string;
  fromDate: string;
  toDate: string;
  isRotational: boolean;
  isFixedShift: boolean;
  rotation: RotationItem[];
  _class?: string;
  createdOn?: string;
  createdBy?: string;
}

interface EmployeeShiftCrudHook {
  employeeShifts: EmployeeShiftItem[];
  employeeShift: EmployeeShiftItem | null;
  addEmployeeShift: (shift: EmployeeShiftItem) => void;
  updateEmployeeShift: (id: string, updatedShift: EmployeeShiftItem) => void;
  deleteEmployeeShift: (id: string) => void;
  getEmployeeShiftById: (id: string) => EmployeeShiftItem | undefined;
  setEmployeeShift: (shift: EmployeeShiftItem | null) => void;
  resetEmployeeShift: () => void;
}

export function useEmployeeShiftCrud(initialShifts: EmployeeShiftItem[] = []): EmployeeShiftCrudHook {
  const [employeeShifts, setEmployeeShifts] = useState<EmployeeShiftItem[]>(initialShifts);
  const [employeeShift, setEmployeeShiftState] = useState<EmployeeShiftItem | null>(null);

  // Update shifts when initialShifts changes
  useEffect(() => {
    if (initialShifts && Array.isArray(initialShifts)) {
      setEmployeeShifts(initialShifts);
    }
  }, [initialShifts]);

  // Generate unique ID helper
  const generateId = useCallback(() => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    return id;
  }, []);

  const addEmployeeShift = useCallback(
    (shift: EmployeeShiftItem) => {
      try {
        const newShift = {
          ...shift,
          _id: shift._id || generateId(),
        };
        
        setEmployeeShifts((prev) => {
          const updated = [...prev, newShift];
          return updated;
        });
      } catch (error) {
        // Handle error silently
      }
    },
    [generateId]
  );

  const updateEmployeeShift = useCallback(
    (id: string, updatedShift: EmployeeShiftItem) => {
      try {
        setEmployeeShifts((prev) => {
          const updatedShifts = prev.map((item) => {
            if (item._id === id) {
              const updated = { ...item, ...updatedShift, _id: id };
              return updated;
            }
            return item;
          });
          
          return updatedShifts;
        });
        
        // Update current shift state if it matches
        setEmployeeShiftState((prev) => {
          if (prev && prev._id === id) {
            return { ...prev, ...updatedShift, _id: id };
          }
          return prev;
        });
      } catch (error) {
        // Handle error silently
      }
    },
    []
  );

  const deleteEmployeeShift = useCallback(
    (id: string) => {
      try {
        setEmployeeShifts((prev) => {
          const filtered = prev.filter((item) => item._id !== id);
          
          return filtered;
        });
        setEmployeeShiftState((prev) => {
          if (prev && prev._id === id) {
            return null;
          }
          return prev;
        });
      } catch (error) {
        // Handle error silently
      }
    },
    []
  );

  const getEmployeeShiftById = useCallback(
    (id: string) => {
      const found = employeeShifts.find((item) => item._id === id);
      return found;
    },
    [employeeShifts]
  );

  const setEmployeeShift = useCallback((shift: EmployeeShiftItem | null) => {
    setEmployeeShiftState(shift);
  }, []);

  const resetEmployeeShift = useCallback(() => {
    setEmployeeShiftState(null);
  }, []);

  return {
    employeeShifts,
    employeeShift,
    addEmployeeShift,
    updateEmployeeShift,
    deleteEmployeeShift,
    getEmployeeShiftById,
    setEmployeeShift,
    resetEmployeeShift,
  };
}
