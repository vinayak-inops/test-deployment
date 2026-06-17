"use client";

import React, { useRef, useState } from "react";

/**
 * Props for the RangeInput component
 */
interface RangeInputProps {
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
 * RangeInput Component
 * Handles range slider input fields
 */
export default function RangeInput({
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
  isDisabled,
  cn
}: RangeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState(field.defaultValue || field.min || 0);

  // Extract range properties
  const min = field.min !== undefined ? field.min : 0;
  const max = field.max !== undefined ? field.max : 100;
  const step = field.step !== undefined ? field.step : 1;

  /**
   * Handle input change events for range fields
   * Updates form value and triggers validation
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = e.target.value;
    setDisplayValue(value);

    // Set the value
    setValue(field.name, value, {
      shouldValidate: true,
      shouldDirty: true,
    });
    onFieldUpdate(field.name, value);

    // Handle any onChange events
    if (field?.onChange?.length > 0) {
      field.onChange.forEach((event: any) => {
        if (event.event === "updatechild") {
          const children = field.children || [];
          setTimeout(() => {
            eventHandler(children, setValue, value, field);
          }, 0);
        }
      });
    }

    // Handle field functions
    handleFieldFunctions(field);
  };

  return (
    <>
      <div className="flex flex-col space-y-2">
        <input
          type="range"
          id={field.name}
          ref={(e) => {
            register.ref(e);
            inputRef.current = e;
          }}
          {...register}
          onChange={handleInputChange}
          disabled={isDisabled}
          readOnly={field.readOnly}
          min={min}
          max={max}
          step={step}
          defaultValue={field.defaultValue || min}
          className={cn(
            "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "disabled:bg-gray-100 disabled:cursor-not-allowed",
            errors[field.name] ? "ring-2 ring-red-500" : "",
            field?.classvalue?.field
          )}
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((displayValue - min) / (max - min)) * 100}%, #e5e7eb ${((displayValue - min) / (max - min)) * 100}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{min}</span>
          <span className="font-medium text-blue-600">{displayValue}</span>
          <span>{max}</span>
        </div>
      </div>
      {errors[field.name]?.message && (
        <p className="mt-1.5 text-sm text-red-600">
          {String(errors[field.name]?.message || '')}
        </p>
      )}
    </>
  );
} 