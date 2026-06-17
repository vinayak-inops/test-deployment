"use client";

import React, { useState } from "react";
import { useFormContext } from "../../../../context/FormContext";
import { Upload } from "lucide-react";
import { cn } from "../../../../utils/shadcnui/cn";
import { Button } from "../../../ui/button";

interface LogoUploadFormProps {
  field: any;
  tag: string;
  fields: any;
}

export default function LogoUploadForm({
  field,
  tag,
  fields,
}: LogoUploadFormProps) {
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

  const [preview, setPreview] = useState<string | null>(null);
  const selectedFile = watch(field.name);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setValue(field.name, file, { shouldValidate: true });
        
        if (field.onChange) {
          field.onChange.forEach((event: any) => {
            if (event.event === "updatechild") {
              setTimeout(() => {
                eventHandler(field.children, setValue, file, field);
              }, 0);
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`w-full ${field?.classvalue?.container}`}>
      <label className={`block text-sm font-medium text-gray-700 ${field?.classvalue?.label}`}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="mt-1 flex items-center gap-4">
        <div className="relative">
          <input
            type="file"
            id={field.name}
            accept="image/*"
            className="hidden"
            {...register(field.name, {
              required: field.required ? "This field is required" : false,
              validate: (value: any) => {
                if (field.required && !value) {
                  return "Please upload an image";
                }
                return true;
              }
            })}
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            className={cn(
              "relative cursor-pointer",
              field?.classvalue?.field
            )}
            onClick={() => document.getElementById(field.name)?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Logo
          </Button>
        </div>
        {preview && (
          <div className="relative h-20 w-20">
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full rounded-md object-cover"
            />
            <button
              type="button"
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
              onClick={() => {
                setPreview(null);
                setValue(field.name, null, { shouldValidate: true });
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>
      {errors[field.name] && (
        <p className="mt-1 text-sm text-red-600">
           {String(errors[field.name]?.message || '')}
        </p>
      )}
    </div>
  );
}
