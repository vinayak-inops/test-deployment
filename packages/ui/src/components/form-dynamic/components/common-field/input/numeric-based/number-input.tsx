"use client";

import React, { useRef } from "react";

/**
 * Props for the NumberInput component
 */
interface NumberInputProps {
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
 * NumberInput Component
 * Handles numeric input fields with step and limit validation
 */
export default function NumberInput({
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
}: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle input change events for number fields
   * Updates form value and triggers validation
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = e.target.value;

    // Handle field functions
    field?.functions?.forEach((event: any) => {
      if (event.function === "minValue" && value !== "") {
        const minValue = parseFloat(event.parameters.minValue);
        const currentValue = parseFloat(value);
        if (currentValue < minValue) {
          setError({
            field: field.name,
            type: 'custom',
            message: `Value must be at least ${minValue}`
          });
          return;
        }
      }

      if (event.function === "maxValue" && value !== "") {
        const maxValue = parseFloat(event.parameters.maxValue);
        const currentValue = parseFloat(value);
        if (currentValue > maxValue) {
          setError({
            field: field.name,
            type: 'custom',
            message: `Value must be at most ${maxValue}`
          });
          return;
        }
      }

      if (event.function === "positiveOnly" && value !== "") {
        const currentValue = parseFloat(value);
        if (currentValue < 0) {
          setError({
            field: field.name,
            type: 'custom',
            message: 'Value must be positive'
          });
          return;
        }
      }
    });

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

  // Extract min, max, step from field properties
  const min = field.min !== undefined ? field.min : undefined;
  const max = field.max !== undefined ? field.max : undefined;
  const step = field.step !== undefined ? field.step : undefined;

  return (
    <>
      <input
        type="number"
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
        min={min}
        max={max}
        step={step}
        className={cn(
          "w-full h-10 px-3 py-2 text-sm bg-white border rounded-lg",
          "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
          "disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500",
          "placeholder:text-xs placeholder:text-gray-500",
          errors[field.name] ? "border-red-500 focus:ring-red-500" : "border-gray-200",
          field?.classvalue?.field
        )}
      />
      {errors[field.name]?.message && (
        <p className="mt-1.5 text-sm text-red-600">
          {String(errors[field.name]?.message || '')}
        </p>
      )}
    </>
  );
} 