"use client";

import React, { useEffect, useRef } from "react";
import { validateWeeklyGap } from "../../../../../../utils/form-dynamic/functions/value-data-set";

/**
 * Props for the TextInput component
 */
interface TextInputProps {
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
 * TextInput Component
 * Handles text-based input fields (text, email, password, number, tel, url)
 */
export default function TextInput({
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
}: TextInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle input change events for text-based fields
   * Updates form value and triggers any onChange handlers
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = e.target.value;

    // Handle field functions
    field?.functions?.forEach((event: any) => {
      if (event.function === "weeklyGap") {
        const startDate = watch(event.parameters.weekstartdate);

        if (startDate && value) {
          const isValid = validateWeeklyGap(
            startDate,
            value,
            event.parameters.maxWeeks
          );

          if (!isValid) {
            const start = new Date(startDate);
            const end = new Date(value);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

            if (diffWeeks > event.parameters.maxWeeks) {
              setValue(field.name, value, {
                shouldValidate: true,
                shouldDirty: true,
              });
              onFieldUpdate(field.name, value);
            } else {
              setError({
                field: field.name,
                type: 'custom',
                message: `Weekly gap validation failed: The gap between dates (${diffWeeks} weeks) exceeds the maximum allowed gap of ${event.parameters.maxWeeks} weeks.`
              });
            }
          }
        }
      } else {
        setValue(field.name, value, {
          shouldValidate: true,
          shouldDirty: true,
        });
        onFieldUpdate(field.name, value);
      }
    });

    if (!field?.functions) {
      valueUpdate(field.name, value);
      setValue(field.name, value, {
        shouldValidate: true,
        shouldDirty: true,
      });
      onFieldUpdate(field.name, value);
    }

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
      <input
        type={field.type || "text"}
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
