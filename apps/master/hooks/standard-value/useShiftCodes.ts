import { useMemo } from 'react';

interface Shift {
  __typename: string;
  shiftCode: string;
}

interface ShiftGroupConfig {
  __typename: string;
  shift: Shift[];
}

interface FetchShiftsResponse {
  fetchShifts: ShiftGroupConfig[];
}

/**
 * Hook to extract unique shift codes from fetchShifts response
 * @param data - The response data from fetchShifts GraphQL query
 * @returns Array of unique shift codes
 */
export const useShiftCodes = (data: FetchShiftsResponse | undefined) => {
  const shiftCodes = useMemo(() => {
    if (!data?.fetchShifts) return [];

    // Extract all shift codes from all shift groups
    const allShiftCodes: string[] = [];
    
    data.fetchShifts.forEach((shiftGroup) => {
      if (shiftGroup.shift && Array.isArray(shiftGroup.shift)) {
        shiftGroup.shift.forEach((shift) => {
          if (shift.shiftCode) {
            allShiftCodes.push(shift.shiftCode);
          }
        });
      }
    });

    // Remove duplicates and return unique codes
    return Array.from(new Set(allShiftCodes));
  }, [data]);

  return shiftCodes;
};

/**
 * Hook to check if a shift code already exists
 * @param data - The response data from fetchShifts GraphQL query
 * @param currentShiftCode - The current shift code (for edit mode)
 * @returns Function to check if shift code exists
 */
export const useShiftCodeValidation = (data: FetchShiftsResponse | undefined, currentShiftCode?: string) => {
  const shiftCodes = useShiftCodes(data);

  const isShiftCodeDuplicate = (shiftCode: string): boolean => {
    if (!shiftCode) return false;
    
    // In edit mode, don't consider the current shift code as duplicate
    if (currentShiftCode && shiftCode === currentShiftCode) {
      return false;
    }
    
    return shiftCodes.includes(shiftCode);
  };

  return {
    shiftCodes,
    isShiftCodeDuplicate,
    totalShiftCodes: shiftCodes.length
  };
};

/**
 * Hook to get shift codes with additional metadata
 * @param data - The response data from fetchShifts GraphQL query
 * @returns Object with shift codes and metadata
 */
export const useShiftCodesWithMetadata = (data: FetchShiftsResponse | undefined) => {
  const shiftCodes = useShiftCodes(data);

  const metadata = useMemo(() => {
    if (!data?.fetchShifts) return {};

    const shiftCodeCounts: Record<string, number> = {};
    const shiftCodeGroups: Record<string, string[]> = {};

    data.fetchShifts.forEach((shiftGroup, groupIndex) => {
      if (shiftGroup.shift && Array.isArray(shiftGroup.shift)) {
        shiftGroup.shift.forEach((shift) => {
          if (shift.shiftCode) {
            // Count occurrences
            shiftCodeCounts[shift.shiftCode] = (shiftCodeCounts[shift.shiftCode] || 0) + 1;
            
            // Track which groups contain this shift code
            if (!shiftCodeGroups[shift.shiftCode]) {
              shiftCodeGroups[shift.shiftCode] = [];
            }
            shiftCodeGroups[shift.shiftCode].push(`Group ${groupIndex + 1}`);
          }
        });
      }
    });

    return {
      shiftCodeCounts,
      shiftCodeGroups,
      duplicateShiftCodes: Object.entries(shiftCodeCounts)
        .filter(([_, count]) => count > 1)
        .map(([code, count]) => ({ code, count, groups: shiftCodeGroups[code] }))
    };
  }, [data]);

  return {
    shiftCodes,
    metadata,
    totalShiftCodes: shiftCodes.length
  };
};
