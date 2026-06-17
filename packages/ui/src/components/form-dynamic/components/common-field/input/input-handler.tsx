"use client";

import React from "react";
import { useFormContext } from "../../../../../context/FormContext";
import { ModeEnum } from "../../../../../utils/form-dynamic/enum";
import { cn } from "../../../../../utils/shadcnui/cn";
import { useStateTracker } from "../../../../../hooks/form-dynamic/useStateTracker";
import { getCurrentDateString, validateWeeklyGap } from "../../../../../utils/form-dynamic/functions/value-data-set";
import { useFunctionHandle } from "../../../../../hooks/form-dynamic/useFunctionHandle";
import { useDateRangeValidation } from "../../../../../hooks/form-dynamic/validation/useDateRangeValidation";
import TextInput from "./text-based/text-input";
import DateInput from "./date-based/date-input";
import NumberInput from "./numeric-based/number-input";
    import RangeInput from "./numeric-based/range-input";

/**
 * Props for the InputHandler component
 */
interface InputHandlerProps {
  field: any;
  tag: string;
  fields: any;
}

/**
 * InputHandler Component
 * Routes to specific input handlers based on field type
 */
export default function InputHandler({
  field,
  tag,
  fields,
}: InputHandlerProps) {
  const {
    register,
    errors,
    setValue,
    control,
    eventHandler,
    valueUpdate,
    watch,
    formStructure,
    validateRequiredFields,
    setError,
    setFormError,
    functionToHandleEvent,
    tabController,
    fromValue,
    setFormValue,
    messenger,
    setMessenger,
    fieldUpdateControl,
    onFieldUpdate
  } = useFormContext();

  // Get the date range validation functions
  const { handleDateFieldChange, validateDateRange, isDateFieldEditable } = useDateRangeValidation();

  const { handleFieldFunctions } = useFunctionHandle(
    setValue,
    setFormError,
    watch,
    formStructure,
    functionToHandleEvent,
    validateRequiredFields,
    setFormValue,
    fromValue,
    setMessenger,
    messenger
  );

  // Watch period value to handle date fields
  const periodValue = watch("period");
  const fromDateValue = watch("fromDate");
  const toDateValue = watch("toDate");

  // Determine if the field is disabled based on mode and period
  const isDisabled = field.mode === ModeEnum.NONE ||
    (field.mode &&
      field.mode !== ModeEnum.SUPEREDIT &&
      (field.mode === ModeEnum.UPDATE || field.mode === ModeEnum.SAVE)) ||
    (field.type === 'date' && (field.name === 'fromDate' || field.name === 'toDate') && !isDateFieldEditable());

  // Register the field with react-hook-form
  const { ref, ...rest } = register(field.name, {
    required: field.required
      ? `${field.label || "This field"} is required`
      : false,
  });

  const nameChanged = useStateTracker(formStructure, 'formStructure');

  // Common props to pass to all input types
  const commonProps = {
    field,
    tag,
    fields,
    register: { ref, ...rest },
    errors,
    setValue,
    control,
    eventHandler,
    valueUpdate,
    watch,
    formStructure,
    validateRequiredFields,
    setError,
    setFormError,
    functionToHandleEvent,
    tabController,
    fromValue,
    setFormValue,
    messenger,
    setMessenger,
    fieldUpdateControl,
    onFieldUpdate,
    handleFieldFunctions,
    handleDateFieldChange: (fieldName: string, value: string) => handleDateFieldChange(fieldName, value, field.functions),
    validateDateRange,
    isDateFieldEditable,
    periodValue,
    fromDateValue,
    toDateValue,
    isDisabled,
    nameChanged,
    cn
  };

  // Route to specific input handler based on field type
  const renderInputByType = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'search':
      case 'tel':
      case 'url':
        return <TextInput {...commonProps} />;
      case 'number':
        return <NumberInput {...commonProps} />;
      case 'range':
        return <RangeInput {...commonProps} />;
      case 'date':
        return <DateInput {...commonProps} />;
      default:
        return <TextInput {...commonProps} />;
    }
  };

  return (
    <div className={`w-full ${field?.classvalue?.container}`}>
      <div className="relative">
        <label
          htmlFor={field.name}
          className={cn(
            "block text-sm font-medium text-[#09090b] mb-1.5",
            field?.classvalue?.label
          )}
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {renderInputByType()}
      </div>
    </div>
  );
}
