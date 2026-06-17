'use client';
/**
 * DynamicForm Component
 * A flexible form component that handles dynamic form structures with nested fields,
 * table forms, and custom actions. It uses react-hook-form for form state management
 * and validation.
 */

import { useMemo, useState } from "react";
import { useForm, FieldValues } from "react-hook-form";
import SubFormWrapper from "./sub-form-wrapper";
import TopTitleDescription from "../titleline/top-title-discription";
import { cn } from "../../utils/shadcnui/cn";
import useEventController from "../../hooks/form-dynamic/useEventController";
import { FormStructure, DynamicFormProps } from "../../type/dynamic-form/types";
import { getDefaultValuesFromStructure } from "../../utils/form-dynamic/form-utils";
import { ActionButton } from "./components/action-button";
import { FormProvider } from "../../context/FormContext";
import { useFormStructure } from '../../hooks/form-dynamic/useFormStructure';
import useFormControl from '../../hooks/form-dynamic/useFormControl';
import { useFormSubmission } from '../../hooks/form-dynamic/useFormSubmission';
import { useFormError } from '../../hooks/form-dynamic/validation/useFormError';

function DynamicForm({ department, id, setFormValue, fromValue, messenger, setMessenger, test, text , setText}: DynamicFormProps) {

  // Initialize form with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
    setError,
    clearErrors,
    unregister
  } = useForm<FieldValues>({
    defaultValues: getDefaultValuesFromStructure(department),
    mode: "onChange",
  });

  // Initialize the error handling hook
  const {
    setFieldError,
    setMultipleErrors,
    clearFieldError,
    clearMultipleErrors,
    hasError,
    getErrorMessage,
    getErrorType,
    validateRequiredFields,
    validateWithRules
  } = useFormError({
    setError,
    clearErrors,
    errors
  });

  // Use the custom hooks for form management
  const { formStructure, updateFormStructure, handleFieldUpdate, handleTabUpdate } = useFormStructure({ department });
  const { eventHandler, valueUpdate, validateRequiredFields: validateFields, functionToHandleEvent, tabController } = useEventController(
    formStructure,
    updateFormStructure,
    setFieldError
  );
  const { 
    fieldUpdateControl,
    isSetValueCalledRef,
    getFieldUpdateControlWrapper,
    updateFieldControl,
    getFieldUpdateValue,
    handleFormStructure 
  } = useFormControl({
    messenger,
    test,
    department,
    updateFormStructure
  });
  const { safeSetValue, onSubmit, handleFormSubmit } = useFormSubmission({
    department,
    setValue,
    id
  });
  const hiddenFields: string[] = [];
  if (messenger?.mode) {
    messenger.mode.forEach((modeField: { field: string; value: 'hidden' | 'all-allow' }) => {
      if (modeField.value === 'hidden') {
        hiddenFields.push(modeField.field);
      }
    });
  }

  // Memoize the form context value
  const formContextValue = useMemo(() => ({
    formStructure,
    setFormStructure: updateFormStructure,
    register,
    errors,
    setValue,
    control,
    eventHandler,
    valueUpdate,
    watch,
    validateRequiredFields: validateFields,
    setError: setFieldError,
    setFormError: setError,
    clearError: clearFieldError,
    functionToHandleEvent,
    tabController,
    setFormValue,
    fromValue,
    messenger,
    setMessenger,
    fieldUpdateControl: getFieldUpdateControlWrapper,
    onFieldUpdate: handleFieldUpdate,
    hasError,
    unregister,
    getErrorMessage,
    getErrorType,
    validateWithRules,
    setMultipleErrors,
    clearMultipleErrors,
    hiddenFields,
    text,
    setText,
    clearErrors
  }), [
    formStructure,
    updateFormStructure,
    register,
    unregister,
    errors,
    safeSetValue,
    control,
    eventHandler,
    valueUpdate,
    watch,
    validateFields,
    setFieldError,
    setError,
    clearFieldError,
    functionToHandleEvent,
    tabController,
    setFormValue,
    fromValue,
    messenger,
    setMessenger,
    getFieldUpdateControlWrapper,
    handleFieldUpdate,
    hasError,
    getErrorMessage,
    getErrorType,
    validateWithRules,
    setMultipleErrors,
    clearMultipleErrors,
    hiddenFields,
    text,
    setText,
    clearErrors
  ]);
  

  return (
    <div className="p-0">
      <div onSubmit={handleSubmit(onSubmit)} onSubmitCapture={handleFormSubmit}>
        <FormProvider value={formContextValue}>
          <div className={cn("grid grid-cols-12 gap-2 p-0", formStructure.classvalue || "")}>
            {/* Form Title and Description */}
            <TopTitleDescription
              titleValue={{
                title: formStructure?.title || "",
                description: formStructure?.description || "",
              }}
            />
            {/* Main Form Content */}
            <SubFormWrapper />
          </div>
          {/* Form Actions */}
          <div className="flex justify-end space-x-4 mt-2">
            {formStructure?.actions?.map((action: any, index: number) => (
              <ActionButton
                key={index}
                action={action}
                isSetValueCalled={isSetValueCalledRef.current}
              />
            ))}
          </div>
        </FormProvider>
      </div>
    </div>
  );
}

export default DynamicForm;