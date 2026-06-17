import { useCallback, useEffect } from "react";
import { useFormContext } from "../../../context/FormContext";
import { getCurrentDateString } from "../../../utils/form-dynamic/functions/value-data-set";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format, isValid, parseISO, isAfter, isToday } from "date-fns";

export const useDateRangeValidation = () => {
  const { watch, setValue, setError, clearError } = useFormContext();

  // Add watchers for both dates and period
  const fromDate = watch("fromDate");
  const toDate = watch("toDate");
  const period = watch("period"); // Changed from selectdate to period

  // Add useEffect to validate whenever either date changes
  useEffect(() => {
    if (fromDate && toDate && period === 'custom') {
      validateDateRange();
    }
  }, [fromDate, toDate, period]);

  const getDateRange = (selectValue: string): { startDate: string; endDate: string } => {
    const today = new Date();
    let startDate = format(today, "yyyy-MM-dd");
    let endDate = format(today, "yyyy-MM-dd");

    switch (selectValue) {
      case "today": {
        startDate = format(today, "yyyy-MM-dd");
        endDate = format(today, "yyyy-MM-dd");
        break;
      }
      case "this_week": {
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        startDate = format(weekStart, "yyyy-MM-dd");
        endDate = format(weekEnd, "yyyy-MM-dd");
        break;
      }
      case "this_month": {
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        startDate = format(monthStart, "yyyy-MM-dd");
        endDate = format(monthEnd, "yyyy-MM-dd");
        break;
      }
      case "this_quarter": {
        const quarterStart = startOfQuarter(today);
        const quarterEnd = endOfQuarter(today);
        startDate = format(quarterStart, "yyyy-MM-dd");
        endDate = format(quarterEnd, "yyyy-MM-dd");
        break;
      }
      case "this_year": {
        const yearStart = startOfYear(today);
        const yearEnd = endOfYear(today);
        startDate = format(yearStart, "yyyy-MM-dd");
        endDate = format(yearEnd, "yyyy-MM-dd");
        break;
      }
    }

    return { startDate, endDate };
  };

  // Helper function to compare dates
  const compareDates = useCallback((date1: string, date2: string): number => {
    try {
      const d1 = new Date(parseISO(date1));
      const d2 = new Date(parseISO(date2));
      
      // Normalize to start of day
      d1.setHours(0, 0, 0, 0);
      d2.setHours(0, 0, 0, 0);
      
      if (d1 < d2) return -1;
      if (d1 > d2) return 1;
      return 0;
    } catch (error) {
      return 0; // If dates are invalid, treat as equal
    }
  }, []);

  // Helper function to validate if date is before current date
  const validateBeforeCurrentDate = useCallback((dateValue: string, fieldName: string, fieldFunctions?: any[]): boolean => {
    // Check if the field has "before-current-date" function
    const hasBeforeCurrentDateFunction = fieldFunctions?.some(
      (func: any) => func.function === "before-current-date"
    );

    if (!hasBeforeCurrentDateFunction) {
      return true; // No validation needed
    }

    if (!dateValue || !dateValue.trim()) {
      return true; // Empty values are allowed
    }

    try {
      const selectedDate = parseISO(dateValue);
      const currentDate = new Date();
      
      // Normalize both dates to start of day for accurate comparison
      selectedDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);

      // Check if selected date is after current date
      if (isAfter(selectedDate, currentDate)) {
        setError({
          field: fieldName,
          type: "custom",
          message: "Date cannot be in the future"
        });
        return false;
      }

      // If validation passes, clear any existing error
      clearError(fieldName);
      return true;
    } catch (error) {
      setError({
        field: fieldName,
        type: "custom",
        message: "Invalid date format"
      });
      return false;
    }
  }, [setError, clearError]);

  const validateDateRange = useCallback(() => {
    // Only validate if period is custom or undefined
    if (period && period !== 'custom') {
      // Clear errors when not in custom mode
      clearError("fromDate");
      clearError("toDate");
      return true;
    }

    // Clear any existing errors first
    clearError("fromDate");
    clearError("toDate");

    // If period is not custom, don't validate individual dates
    if (period && period !== 'custom') {
      return true;
    }

    // If either date is empty, don't validate range (but don't show errors)
    if (!fromDate || !toDate) {
      return true;
    }

    // Ensure dates are strings
    if (typeof fromDate !== 'string' || typeof toDate !== 'string') {
      if (typeof fromDate !== 'string') {
        setError({
          field: "fromDate",
          type: "custom",
          message: "Invalid from date format"
        });
      }
      if (typeof toDate !== 'string') {
        setError({
          field: "toDate",
          type: "custom",
          message: "Invalid to date format"
        });
      }
      return false;
    }

    // Validate date formats
    let fromDateObj: Date;
    let toDateObj: Date;

    try {
      fromDateObj = parseISO(fromDate);
      toDateObj = parseISO(toDate);
    } catch (error) {
      setError({
        field: "fromDate",
        type: "custom",
        message: "Invalid date format"
      });
      return false;
    }

    if (!isValid(fromDateObj)) {
      setError({
        field: "fromDate",
        type: "custom",
        message: "Invalid from date"
      });
      return false;
    }

    if (!isValid(toDateObj)) {
      setError({
        field: "toDate",
        type: "custom",
        message: "Invalid to date"
      });
      return false;
    }

    // Normalize dates to start of day for accurate comparison
    const normalizedFromDate = new Date(fromDateObj);
    const normalizedToDate = new Date(toDateObj);
    normalizedFromDate.setHours(0, 0, 0, 0);
    normalizedToDate.setHours(0, 0, 0, 0);

    // Enhanced validation for date range - fromDate must be less than or equal to toDate
    const comparison = compareDates(fromDate, toDate);
    const isFromDateAfterToDate = comparison > 0;

    if (isFromDateAfterToDate) {
      setError({
        field: "fromDate",
        type: "custom",
        message: "From date cannot be after to date"
      });
      setError({
        field: "toDate",
        type: "custom",
        message: "To date must be on or after from date"
      });
      return false;
    }

    // If validation passes, clear any existing errors
    clearError("fromDate");
    clearError("toDate");

    return true;
  }, [fromDate, toDate, period, setError, clearError, compareDates]);

  const updateDateRange = useCallback((selectValue: string) => {
    if (selectValue === "custom") {
      setValue("fromDate", "");
      setValue("toDate", "");
      clearError("fromDate");
      clearError("toDate");
    } else {
      const { startDate, endDate } = getDateRange(selectValue);
      setValue("fromDate", startDate);
      setValue("toDate", endDate);
      clearError("fromDate");
      clearError("toDate");
      // Validate immediately after setting values
      setTimeout(() => {
        validateDateRange();
      }, 0);
    }
  }, [setValue, clearError, validateDateRange]);

  const handleDateFieldChange = useCallback((fieldName: string, value: string, fieldFunctions?: any[]) => {
    // Only allow changes if period is custom or undefined
    if (period && period !== 'custom') {
      return;
    }

    // Clear errors for both date fields first
    clearError("fromDate");
    clearError("toDate");

    // Ensure value is a string
    if (typeof value !== 'string') {
      setError({
        field: fieldName,
        type: "custom",
        message: "Invalid date format"
      });
      return;
    }

    // If value is empty, just set it and clear errors
    if (!value.trim()) {
      setValue(fieldName, value, {
        shouldValidate: true,
        shouldDirty: true
      });
      clearError(fieldName);
      return;
    }

    // Validate the date format before setting
    try {
      const dateObj = parseISO(value);
      if (!isValid(dateObj)) {
        setError({
          field: fieldName,
          type: "custom",
          message: "Invalid date format"
        });
        return;
      }

      // Validate before-current-date if the field has that function
      if (!validateBeforeCurrentDate(value, fieldName, fieldFunctions)) {
        return; // Stop here if validation fails
      }

      // Set the value first
      setValue(fieldName, value, {
        shouldValidate: true,
        shouldDirty: true
      });

      // Get the other date value for comparison
      const otherFieldName = fieldName === "fromDate" ? "toDate" : "fromDate";
      const otherDateValue = watch(otherFieldName);
      
      // Only validate range if both dates are present
      if (otherDateValue && otherDateValue.trim()) {
        try {
          const comparison = compareDates(value, otherDateValue);
          
          if (fieldName === "fromDate" && comparison > 0) {
            setError({
              field: fieldName,
              type: "custom",
              message: "From date cannot be after to date"
            });
            return;
          } else if (fieldName === "toDate" && comparison < 0) {
            setError({
              field: fieldName,
              type: "custom",
              message: "To date must be on or after from date"
            });
            return;
          } else {
            // If the range is now valid, clear any existing errors
            clearError("fromDate");
            clearError("toDate");
          }
        } catch (error) {
          // If other date is invalid, don't validate against it
        }
      } else {
        // If only one date is set, clear errors as we can't validate range yet
        clearError("fromDate");
        clearError("toDate");
      }

      // Always run full validation after a short delay to ensure all values are set
      setTimeout(() => {
        validateDateRange();
      }, 100);

    } catch (error) {
      setError({
        field: fieldName,
        type: "custom",
        message: "Invalid date format"
      });
      return;
    }
  }, [watch, setValue, validateDateRange, setError, clearError, period, compareDates, validateBeforeCurrentDate]);

  // Function to check if date fields should be editable
  const isDateFieldEditable = useCallback(() => {
    return !period || period === 'custom';
  }, [period]);

  return {
    updateDateRange,
    validateDateRange,
    handleDateFieldChange,
    isDateFieldEditable,
    validateBeforeCurrentDate
  };
}; 