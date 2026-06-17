'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { FormStructure } from '../type/dynamic-form/types';
import { UseFormRegister, UseFormSetValue, UseFormWatch, Control, FieldErrors, UseFormSetError, UseFormClearErrors, UseFormUnregister } from 'react-hook-form';
import { ErrorType, FormError } from '../hooks/form-dynamic/validation/useFormError';

interface FormContextType {
  formStructure: FormStructure;
  setFormStructure: React.Dispatch<React.SetStateAction<FormStructure>>;
  register: UseFormRegister<any>;
  unregister: UseFormUnregister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  control: Control<any>;
  eventHandler: any;
  valueUpdate: any;
  watch: UseFormWatch<any>;
  validateRequiredFields: any;
  setError: (error: FormError) => void;
  setFormError: UseFormSetError<any>;
  clearError: (field: string) => void;
  functionToHandleEvent: (field: any, setValue: any, selectedValue: any) => void;
  tabController: any;
  setFormValue?: (fn: (prev: any) => any) => void;
  fromValue?: any;
  messenger?: any;
  setMessenger?: (fn: (prev: any) => any) => void;
  fieldUpdateControl: (fieldName: string) => { startingValue: Record<string, any> };
  onFieldUpdate: (fieldName: string, value: any) => void;
  hasError: (field: string) => boolean;
  getErrorMessage: (field: string) => string | undefined;
  getErrorType: (field: string) => ErrorType | undefined;
  validateWithRules: (
    field: string,
    value: any,
    rules: {
      required?: boolean;
      min?: number;
      max?: number;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      validate?: (value: any) => boolean | string;
      custom?: (value: any) => boolean | string;
    },
    label?: string
  ) => boolean;
  setMultipleErrors: (errors: FormError[]) => void;
  clearMultipleErrors: (fields: string[]) => void;
  hiddenFields: string[];
  text?: any;
  setText?: (fn: (prev: any) => any) => void;
  clearErrors: UseFormClearErrors<any>;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

interface FormProviderProps {
  children: ReactNode;
  value: FormContextType;
}

export function FormProvider({ children, value }: FormProviderProps) {
  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
} 