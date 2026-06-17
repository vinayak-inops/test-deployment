"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import { useFormContext } from "../../../../context/FormContext";
import { useWatch } from "react-hook-form";
import { cn } from "../../../../utils/shadcnui/cn";
import { ModeEnum } from "../../../../utils/form-dynamic/enum";
import { useDateRangeValidation } from "../../../../hooks/form-dynamic/validation/useDateRangeValidation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select";
import { useFunctionHandle } from "../../../../hooks/form-dynamic/useFunctionHandle";

interface SelectFieldProps {
  field: any;
  tag: string;
  fields: any;
}

// Memoized SelectItem component
const MemoizedSelectItem = memo(({
  option,
  isSelected,
  onSelect
}: {
  option: { value: string; label: string };
  isSelected: boolean;
  onSelect: (value: string) => void;
}) => (
  <SelectItem
    value={option.value}
    className={cn(
      "cursor-pointer",
      isSelected && "bg-blue-50"
    )}
  >
    {option.label}
  </SelectItem>
));

MemoizedSelectItem.displayName = 'MemoizedSelectItem';

// Memoized SelectLabel component
const MemoizedSelectLabel = memo(({
  label,
  required
}: {
  label: string;
  required?: boolean;
}) => (
  <label
    className={cn(
      "block text-sm font-medium text-gray-700 mb-1.5"
    )}
  >
    {label}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
));

MemoizedSelectLabel.displayName = 'MemoizedSelectLabel';

// Memoized ErrorMessage component
const MemoizedErrorMessage = memo(({
  error
}: {
  error?: string;
}) => {
  return error ? (
    <p className="mt-1.5 text-sm text-red-600">
      {String(error)}
    </p>
  ) : null;
});

MemoizedErrorMessage.displayName = 'MemoizedErrorMessage';

export default function SelectField({
  field,
  tag,
  fields,
}: SelectFieldProps) {
  const {
    errors,
    setValue,
    control,
    eventHandler,
    valueUpdate,
    watch,
    setError,
    formStructure,
    functionToHandleEvent,
    validateRequiredFields,
    setFormValue,
    setMessenger,
    messenger,
    fromValue,
    onFieldUpdate,
    clearErrors,
  } = useFormContext();

  const { updateDateRange, validateDateRange } = useDateRangeValidation();
  const { handleFieldFunctions } = useFunctionHandle(
    setValue,
    setError,
    watch,
    formStructure,
    functionToHandleEvent,
    validateRequiredFields,
    setFormValue,
    fromValue,
    setMessenger,
    messenger
  );

  // Memoize disabled state
  const isDisabled = useMemo(() =>
    field.mode &&
    field.mode !== ModeEnum.SUPEREDIT &&
    (field.mode === ModeEnum.UPDATE || field.mode === ModeEnum.SAVE),
    [field.mode]
  );

  const [localValue, setLocalValue] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Memoize watched value
  const watchedValue = useWatch({
    control,
    name: field.name,
    defaultValue: ""
  });

  // Memoize current error - Fixed to properly track error changes
  const currentError = useMemo(() => {
    const fieldError = errors?.[field.name];
    if (fieldError?.message) {
      return String(fieldError.message);
    }
    return undefined;
  }, [errors, field.name]);

  // Direct error check for debugging
  const directError = errors?.[field.name]?.message;
  
  // Debug effect to log error changes
  useEffect(() => {
    if (currentError) {
    }
    if (directError) {
    }
  }, [currentError, directError, field.name]);

  // Memoize options
  const options = useMemo(() =>
    field.options || [],
    [field.options]
  );

  // Memoize value update logic - Fixed to avoid multiple setValue calls
  const updateFieldValue = useCallback((valueToSet: string) => {
    // Set the form value once with validation
    setValue(field.name, valueToSet, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    
    // Clear error if value is valid
    if (valueToSet) {
      clearErrors(field.name);
    }
    
    // Update local state
    setLocalValue(valueToSet);
    
    // Update field in form structure
    onFieldUpdate(field.name, valueToSet);

    // Handle special case for period field
    if (field.name === "period") {
      updateDateRange(valueToSet);
      validateDateRange();
    }

    // Log the value update for debugging
  }, [field.name, setValue, onFieldUpdate, updateDateRange, validateDateRange, clearErrors]);

  // Single effect to handle value initialization and updates
  useEffect(() => {
    const currentValue = watch(field.name);
    const fieldValue = field.value;
    const formFieldValue = fromValue?.[field.name];

    if (currentValue === localValue) {
      return;
    }

    let valueToSet = "";

    if (formFieldValue && typeof formFieldValue === "string") {
      valueToSet = formFieldValue;
    } else if (fieldValue && typeof fieldValue === "string") {
      valueToSet = fieldValue;
    } else if (currentValue && typeof currentValue === "string") {
      valueToSet = currentValue;
    }

    if (valueToSet !== localValue) {
      updateFieldValue(valueToSet);
    }
  }, [field.name, field.value, fromValue, watchedValue, watch, localValue, updateFieldValue]);

  // Memoize select change handler - Fixed dependencies
  const handleSelectChange = useCallback((value: string) => {
    
    updateFieldValue(value);

    // Handle onChange events
    if (field?.onChange?.length > 0) {
      field.onChange.forEach((event: any) => {
        if (event.event === "updatechild") {
          setTimeout(() => {
            eventHandler(field.children, setValue, value, field);
          }, 0);
        }
      });
    }
    
    // Handle field functions after value update
    if (field?.functions?.length > 0) {
      handleFieldFunctions(field);
    }
  }, [field, updateFieldValue, eventHandler, setValue, handleFieldFunctions]);

  // Memoize select trigger
  const selectTrigger = useMemo(() => (
    <SelectTrigger
      id={field.name}
      className={cn(
        "w-full bg-white border rounded-lg",
        "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
        "disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500",
        (currentError || directError) ? "border-red-500 focus:ring-red-500" : "border-gray-200",
        field?.classvalue?.field
      )}
    >
      <SelectValue placeholder={field.placeholder || "Select an option"} />
    </SelectTrigger>
  ), [field.name, field.placeholder, field?.classvalue?.field, currentError, directError]);

  // Memoize select content
  const selectContent = useMemo(() => (
    <SelectContent className="bg-white">
      {options.map((option: any) => (
        <MemoizedSelectItem
          key={option.value}
          option={option}
          isSelected={localValue === option.value}
          onSelect={handleSelectChange}
        />
      ))}
    </SelectContent>
  ), [options, localValue, handleSelectChange]);

  return (
    <div className={`w-full ${field?.classvalue?.container}`}>
      <div className="relative">
        <MemoizedSelectLabel
          label={field.label}
          required={field.required}
        />
        <Select
          value={localValue || watchedValue || ''}
          onValueChange={handleSelectChange}
          disabled={isDisabled}
        >
          {selectTrigger}
          {selectContent}
        </Select>
        <MemoizedErrorMessage error={currentError || (directError ? String(directError) : undefined)} />
      </div>
    </div>
  );
}