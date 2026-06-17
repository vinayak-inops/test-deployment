"use client";

import React from "react";
import { useFormContext } from "../../../../context/FormContext";

interface SelectInputFieldProps {
  field: any;
  tag: string;
  fields: any;
}

export default function SelectInputField({
  field,
  tag,
  fields,
}: SelectInputFieldProps) {
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
      <div className="mt-1 flex rounded-md shadow-sm">
        <select
          id={`${field.name}-select`}
          {...register(`${field.name}-select`, {
            required: field.required,
          })}
          className="block w-full rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
        >
          <option value="">Select {field.label}</option>
          {field.options?.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          id={`${field.name}-input`}
          {...register(`${field.name}-input`, {
            required: field.required,
          })}
          className="block w-full rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder={field.placeholder}
        />
      </div>
      {errors[`${field.name}-select`] && (
        <p className="mt-1 text-sm text-red-600">
           {String(errors[field.name]?.message || '')}
        </p>
      )}
    </div>
  );
}
