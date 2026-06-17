"use client";

import React, { useEffect } from "react";
import { useFormContext } from "../../../../context/FormContext";
import { Label } from "../../../ui/label";

interface CheckboxFieldProps {
  field: any;
  tag: string;
  fields: any;
}

interface FieldKey {
  name: string;
}

export default function CheckboxField({
  field,
  tag,
  fields,
}: CheckboxFieldProps) {
  const {
    register,
    errors,
    setValue,
    unregister,
    control,
    eventHandler,
    valueUpdate,
    watch,
    formStructure,
    validateRequiredFields,
    setError,
    functionToHandleEvent,
    tabController,
    fromValue,
    setFormValue,
    messenger,
    setMessenger,
    fieldUpdateControl,
    onFieldUpdate
  } = useFormContext();

  const { ref, ...rest } = register(field.name, {
    required: field.required,
  });

  // Effect to handle initial checkbox values from fromValue.forlocaluse or field.value
  useEffect(() => {
    const formFieldValue = fromValue?.forlocaluse?.[field.name];
    const currentValue = watch(field.name);
    
    // Priority 1: Use fromValue.forlocaluse if available
    if (formFieldValue !== undefined && currentValue !== formFieldValue) {
      setValue(field.name, formFieldValue, {
        shouldValidate: true,
        shouldDirty: true,
      });
      onFieldUpdate(field.name, formFieldValue);
      setMessenger?.((prev: any) => ({
        ...prev,
        formValue: {
          ...(prev?.formValue || {}),
          [field.name]: formFieldValue,
        },
      }));
    }
    // Priority 2: Fallback to field.value if no fromValue.forlocaluse
    else if (formFieldValue === undefined && field?.value !== undefined && currentValue !== field.value) {
      setValue(field.name, field.value, {
        shouldValidate: false,
        shouldDirty: false,
      });
      setMessenger?.((prev: any) => ({
        ...prev,
        formValue: {
          ...(prev?.formValue || {}),
          [field.name]: field.value,
        },
      }));
    }
  }, [field.name, field?.value, fromValue?.forlocaluse, setValue, onFieldUpdate, watch]);

  const value = watch(field.name);
  useEffect(() => {
    setMessenger?.((prev: any) => ({
      ...prev,
      formValue: {
        ...(prev?.formValue || {}),
        [field.name]: value,
      },
    }));
  }, [value]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    // valueUpdate(field.name, isChecked);
    setValue(field.name, isChecked, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setMessenger?.((prev: any) => ({
      ...prev,
      formValue: {
        ...(prev?.formValue || {}),
        [field.name]: isChecked,
      },
    }));

    if (field?.onChange?.length > 0) {
      field.onChange.forEach((event: any) => {
        if (event.event === "updatechild") {
          setTimeout(() => {
            eventHandler(field.children, setValue, isChecked, field);
          }, 0);
        }
        event.fieldsUpdate.forEach((field: any) => {
          (field.feildnkeys as FieldKey[]).forEach((key:any) => {
            setMessenger && setMessenger((prevState: any) => {
              const existingMode = prevState.mode || [];
              const newValue = key.switch.find((item: any) => item?.case === isChecked)?.value || "hidden";
              
              // Find if field already exists
              const existingIndex = existingMode.findIndex((item: any) => item.field === field.name);
              
              if (existingIndex !== -1) {
                // Update existing field
                existingMode[existingIndex].value = newValue;
                unregister(field.name);
              } else {
                // Add new field
                unregister(field.name);
                existingMode.push({
                  field: field.name,
                  value: newValue
                });
              }

              return {
                ...prevState,
                ...(key.name === "mode" ? { mode: existingMode } : {})
              };
            });
          });
        });
      });
    }
  };

  

  return (
    <div className={`flex h-full items-center justify-start ${field?.classvalue?.container}`}>
      <div className="flex items-center gap-1">
        <Label htmlFor={field.name} className={`text-sm font-medium text-gray-700 mr-2 ${field?.classvalue?.label}`}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={field.name}
          {...rest}
          ref={ref}
          onChange={handleCheckboxChange}
          checked={watch(field.name) || false}
          className={`h-3.5 w-3.5 rounded-[4px] border-gray-200 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 ${field?.classvalue?.field}`}
        />
        {field.placeholder && (
          <Label
            htmlFor={field.name}
            className="text-xs font-normal text-gray-600 select-none cursor-pointer"
          >
            {field.placeholder}
          </Label>
        )}
      </div>
      {errors[field.name] && (
        <p className="mt-1 text-xs text-red-500">
          {(errors[field.name]?.message as string) || `${field.label} is required`}
        </p>
      )}
    </div>
  );
}
