"use client";

import React, { useRef } from "react";

/**
 * Props for the CheckboxInput component
 */
interface CheckboxInputProps {
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
 * CheckboxInput Component
 * Handles checkbox input fields for multiple choice toggles
 */
export default function CheckboxInput({
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
}: CheckboxInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle input change events for checkbox fields
   * Updates form value and triggers validation
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = e.target.checked;

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
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id={field.name}
          ref={(e) => {
            register.ref(e);
            inputRef.current = e;
          }}
          {...register}
          onChange={handleInputChange}
          disabled={isDisabled}
          readOnly={field.readOnly}
          className={cn(
            "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded",
            "focus:ring-blue-500 focus:ring-2",
            "disabled:bg-gray-200 disabled:cursor-not-allowed",
            errors[field.name] ? "border-red-500 focus:ring-red-500" : "",
            field?.classvalue?.field
          )}
        />
        <label
          htmlFor={field.name}
          className={cn(
            "text-sm font-medium text-gray-700 cursor-pointer",
            "disabled:text-gray-400 disabled:cursor-not-allowed",
            field?.classvalue?.label
          )}
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      {errors[field.name]?.message && (
        <p className="mt-1.5 text-sm text-red-600">
          {String(errors[field.name]?.message || '')}
        </p>
      )}
    </>
  );
} 