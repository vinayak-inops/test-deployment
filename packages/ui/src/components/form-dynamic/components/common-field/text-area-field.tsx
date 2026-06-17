"use client";

import React from "react";
import { useFormContext } from "../../../../context/FormContext";

interface TextAreaFieldProps {
  field: any;
  tag: string;
  fields: any;
}

export default function TextAreaField({
  field,
  tag,
  fields,
}: TextAreaFieldProps) {
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
      <label
        htmlFor={field.name}
        className={`block text-sm font-medium text-gray-700 ${field?.classvalue?.label}`}
      >
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        id={field.name}
        {...register(field.name, {
          required: field.required,
          minLength: field.minLength,
          maxLength: field.maxLength,
        })}
        rows={field.rows || 3}
        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${field?.classvalue?.field}`}
        placeholder={field.placeholder}
        disabled={field.disabled}
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
      {errors[field.name] && (
        <p className="mt-1 text-sm text-red-600">
           {String(errors[field.name]?.message || '')}
        </p>
      )}
    </div>
  );
}
