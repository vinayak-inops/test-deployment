"use client";

import React from "react";
import { useFormContext } from "../../../../context/FormContext";

interface RadioButtonProps {
  field: any;
  tag: string;
  fields: any;
}

export default function RadioButton({
  field,
  tag,
  fields,
}: RadioButtonProps) {
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
    functionToHandleEvent,
    tabController,
    fromValue,
    setFormValue,
    messenger,
    setMessenger,
    fieldUpdateControl,
    onFieldUpdate
  } = useFormContext();

  return (
    <div className={`w-full ${field?.classvalue?.container}`}>
      <label className={`block text-sm font-medium text-gray-700 ${field?.classvalue?.label}`}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="mt-2 space-y-2">
        {field.options?.map((option: any) => (
          <div key={option.value} className="flex items-center">
            <input
              type="radio"
              id={`${field.name}-${option.value}`}
              value={option.value}
              {...register(field.name, {
                required: field.required,
              })}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              onChange={(e) => {
                if (field.onChange) {
                  field.onChange.forEach((event: any) => {
                    if (event.event === "updatechild") {
                      setTimeout(() => {
                        eventHandler(field.children, setValue, e.target.value, field);
                      }, 0);
                    }
                  });
                }
              }}
            />
            <label
              htmlFor={`${field.name}-${option.value}`}
              className="ml-3 block text-sm font-medium text-gray-700"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {errors[field.name] && (
        <p className="mt-1 text-sm text-red-600">
           {String(errors[field.name]?.message || '')}
        </p>
      )}
    </div>
  );
}
