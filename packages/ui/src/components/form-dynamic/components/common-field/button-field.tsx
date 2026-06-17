"use client";

import React from "react";
import { Button } from "../../../ui/button";
import { useFormContext } from "../../../../context/FormContext";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";
import useEventController from "../../../../hooks/form-dynamic/useEventController";
import { useFunctionHandle } from "../../../../hooks/form-dynamic/useFunctionHandle";

interface ButtonFieldProps {
  field: any;
  tag: string;
  fields: any;
}

export default function ButtonField({
  field,
  tag,
  fields,
}: ButtonFieldProps) {
  const {
    register,
    errors,
    setValue,
    control,
    eventHandler,
    valueUpdate,
    watch,
    formStructure,
    setFormStructure,
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

  const IconComponent = field.icon ? (Icons[field.icon as keyof typeof Icons] as LucideIcon) : null;
  
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

  const handleClick = (e: React.MouseEvent) => {
    // Prevent default for non-submit buttons
    if (field.type !== "submit") {
      e.preventDefault();
    }
    
    // Handle field functions first
    handleFieldFunctions(field);

    // Handle onClick events
    if (field.onClick) {
      field.onClick.forEach((event: any) => {
        if (event.event === "updatechild") {
          setTimeout(() => {
            eventHandler(field.children, setValue, true, field, setError);
          }, 0);
        }
      });
    }

    // Handle onChange events
    if (field?.onChange?.length > 0) {
      field.onChange.forEach((event: any) => {
        if (event.event === "updatechild") {
          setTimeout(() => {
            eventHandler(field?.children, setValue, true, field, setError);
          }, 0);
        }
      });
    }
  };

  return (
    <div className={`w-full ${field?.classvalue?.container}`}>
      <Button
        type={field.type}
        variant={field.variant || "outline"}
        className={`w-full flex items-center gap-2 px-4 py-2 transition-all duration-200 shadow-md ${field?.classvalue?.button}`}
        onClick={handleClick}
        disabled={field.disabled}
      >
        {field.label}
        {IconComponent && <IconComponent className="h-4 w-4 ml-1" />}
      </Button>
    </div>
  );
}
