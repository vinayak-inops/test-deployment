"use client";

import React, { useEffect, useRef } from "react";
import { getCurrentDateString } from "../../../../../../utils/form-dynamic/functions/value-data-set";

/**
 * Props for the DateInput component
 */
interface DateInputProps {
  field: any;
  register: any;
  errors: any;
  setValue: any;
  control: any;
  eventHandler: any;
  valueUpdate: any;
  watch: any;
  formStructure: any;
  validateRequiredFields: any;
  setError: any;
  setFormError: any;
  functionToHandleEvent: any;
  tabController: any;
  fromValue: any;
  setFormValue: any;
  messenger: any;
  setMessenger: any;
  fieldUpdateControl: any;
  onFieldUpdate: any;
  handleFieldFunctions: any;
  handleDateFieldChange: any;
  validateDateRange: any;
  isDateFieldEditable: any;
  periodValue: any;
  fromDateValue: any;
  toDateValue: any;
  isDisabled: any;
  nameChanged: any;
  cn: any;
}

/**
 * DateInput Component
 * Handles date input fields with period-based validation
 */
export default function DateInput({
  field,
  register,
  errors,
  setValue,
  eventHandler,
  valueUpdate,
  watch,
  setError,
  onFieldUpdate,
  handleFieldFunctions,
  handleDateFieldChange,
  validateDateRange,
  isDateFieldEditable,
  periodValue,
  fromDateValue,
  toDateValue,
  fromValue,
  nameChanged,
  isDisabled,
  cn
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if field has before-current-date function
  const hasBeforeCurrentDateFunction = field.functions?.some(
    (func: any) => func.function === "before-current-date"
  );

  // Get current date for max attribute
  const getCurrentDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Effect to handle initial date values from fromValue.forlocaluse
  useEffect(() => {
    if (field.name === 'fromDate' || field.name === 'toDate') {
      const formFieldValue = fromValue?.forlocaluse?.[field.name];

      if (periodValue === 'custom' && formFieldValue !== undefined) {
        // Only set value if it's different from current value
        const currentValue = watch(field.name);
        if (currentValue !== formFieldValue) {
          setValue(field.name, formFieldValue, {
            shouldValidate: true,
            shouldDirty: true,
          });
          onFieldUpdate(field.name, formFieldValue);
        }
      }
    }
  }, [field.name, fromValue?.forlocaluse, periodValue, setValue, onFieldUpdate, watch]);

  // Effect to validate date range when either date changes
  useEffect(() => {
    if (field.name === 'fromDate' || field.name === 'toDate') {
      

      if (periodValue === 'custom') {
        // Add a small delay to ensure the value is properly set
        setTimeout(() => {
          validateDateRange();
        }, 100);
      }
    }
  }, [field.name, periodValue, fromDateValue, toDateValue, validateDateRange]);

  // Effect to handle today date function
  useEffect(() => {
    if (nameChanged) {
      field?.functions?.forEach((event: any) => {
        if (event.function === "toDayDate") {
          const today = getCurrentDateString();
          setValue(field.name, today, {
            shouldValidate: true,
            shouldDirty: true,
          });
          onFieldUpdate(field.name, today);
        }
      });
    }
  }, [nameChanged, field?.functions, field?.name, setValue, onFieldUpdate]);

  /**
   * Handle input change events for date fields
   * Updates form value and triggers date validation
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = e.target.value;


    // Only allow changes if period is custom or undefined
    if (periodValue === 'custom' || !periodValue) {
      // Clear errors for both date fields when user starts typing
      if (errors['fromDate']) {
        setError({ field: 'fromDate', type: 'custom', message: '' });
      }
      if (errors['toDate']) {
        setError({ field: 'toDate', type: 'custom', message: '' });
      }
      handleDateFieldChange(field.name, value, field.functions);
    } else {
      // If period is not custom, prevent changes
      return;
    }
  };

  return (
    <>
      <input
        type="date"
        id={field.name}
        ref={(e) => {
          register.ref(e);
          inputRef.current = e;
        }}
        {...register}
        onChange={handleInputChange}
        placeholder={field.placeholder}
        disabled={isDisabled}
        readOnly={field.readOnly}
        max={hasBeforeCurrentDateFunction ? getCurrentDateString() : undefined}
        className={cn(
          "w-full h-10 px-3 py-2 text-sm bg-white border rounded-lg",
          "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
          "disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500",
          "placeholder:text-xs placeholder:text-gray-500",
          errors[field.name] ? "border-red-500 focus:ring-red-500" : "border-gray-200",
          !isDateFieldEditable() 
            ? "bg-gray-50 border-gray-300 text-gray-400" 
            : "",
          field?.classvalue?.field
        )}
      />
      {isDateFieldEditable() && errors[field.name]?.message && (
        <p className="mt-1.5 text-sm text-red-600">
          {String(errors[field.name]?.message || '')}
        </p>
      )}
      {!isDateFieldEditable() && periodValue && (
        <p className="mt-1.5 text-sm text-gray-500">
          Date fields are disabled when a predefined period is selected. Select "Custom" to edit dates manually.
        </p>
      )}
      {hasBeforeCurrentDateFunction && isDateFieldEditable() && (
        <p className="mt-1.5 text-sm text-blue-600">
          ⓘ Future dates are not allowed for this field.
        </p>
      )}
    </>
  );
} 