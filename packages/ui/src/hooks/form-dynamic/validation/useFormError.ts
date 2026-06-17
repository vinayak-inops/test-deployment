'use client';

import { UseFormSetError, UseFormClearErrors, FieldValues, FieldErrors } from 'react-hook-form';
import { useCallback } from 'react';

export type ErrorType = 'required' | 'pattern' | 'min' | 'max' | 'minLength' | 'maxLength' | 'validate' | 'custom';

export interface FormError {
  type: ErrorType;
  message: string;
  field: string;
  details?: Record<string, any>;
}

export interface UseFormErrorProps {
  setError: UseFormSetError<FieldValues>;
  clearErrors: UseFormClearErrors<FieldValues>;
  errors: FieldErrors<FieldValues>;
}

export function useFormError({ setError, clearErrors, errors }: UseFormErrorProps) {
  /**
   * Set a single field error
   */
  const setFieldError = useCallback(({ field, type, message, details }: FormError) => {
    setError(field, {
      type,
      message,
      ...(details && { details })
    });
  }, [setError]);

  /**
   * Set multiple field errors at once
   */
  const setMultipleErrors = useCallback((errorList: FormError[]) => {
    errorList.forEach(error => setFieldError(error));
  }, [setFieldError]);

  /**
   * Clear a single field error
   */
  const clearFieldError = useCallback((field: string) => {
    clearErrors(field);
  }, [clearErrors]);

  /**
   * Clear multiple field errors
   */
  const clearMultipleErrors = useCallback((fields: string[]) => {
    fields.forEach(field => clearFieldError(field));
  }, [clearFieldError]);

  /**
   * Check if a field has an error
   */
  const hasError = useCallback((field: string) => {
    return !!errors[field];
  }, [errors]);

  /**
   * Get error message for a field
   */
  const getErrorMessage = useCallback((field: string) => {
    return errors[field]?.message as string | undefined;
  }, [errors]);

  /**
   * Get error type for a field
   */
  const getErrorType = useCallback((field: string) => {
    return errors[field]?.type as ErrorType | undefined;
  }, [errors]);

  /**
   * Validate required fields and set errors
   */
  const validateRequiredFields = useCallback((fields: Array<{ name: string; label: string }>) => {
    const formErrors: FormError[] = [];
    
    fields.forEach(({ name, label }) => {
      if (!errors[name]) {
        formErrors.push({
          field: name,
          type: 'required',
          message: `${label || name} is required`
        });
      }
    });

    if (formErrors.length > 0) {
      setMultipleErrors(formErrors);
      return false;
    }

    return true;
  }, [setMultipleErrors, errors]);

  /**
   * Handle validation with custom rules
   */
  const validateWithRules = useCallback((
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
  ) => {
    const errors: FormError[] = [];

    if (rules.required && (!value || (Array.isArray(value) && value.length === 0))) {
      errors.push({
        field,
        type: 'required',
        message: `${label || field} is required`
      });
    }

    if (rules.min !== undefined && value < rules.min) {
      errors.push({
        field,
        type: 'min',
        message: `${label || field} must be at least ${rules.min}`,
        details: { min: rules.min }
      });
    }

    if (rules.max !== undefined && value > rules.max) {
      errors.push({
        field,
        type: 'max',
        message: `${label || field} must be at most ${rules.max}`,
        details: { max: rules.max }
      });
    }

    if (rules.minLength !== undefined && value?.length < rules.minLength) {
      errors.push({
        field,
        type: 'minLength',
        message: `${label || field} must be at least ${rules.minLength} characters`,
        details: { minLength: rules.minLength }
      });
    }

    if (rules.maxLength !== undefined && value?.length > rules.maxLength) {
      errors.push({
        field,
        type: 'maxLength',
        message: `${label || field} must be at most ${rules.maxLength} characters`,
        details: { maxLength: rules.maxLength }
      });
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push({
        field,
        type: 'pattern',
        message: `${label || field} has invalid format`,
        details: { pattern: rules.pattern.toString() }
      });
    }

    if (rules.validate) {
      const result = rules.validate(value);
      if (typeof result === 'string' || result === false) {
        errors.push({
          field,
          type: 'validate',
          message: typeof result === 'string' ? result : `${label || field} is invalid`
        });
      }
    }

    if (rules.custom) {
      const result = rules.custom(value);
      if (typeof result === 'string' || result === false) {
        errors.push({
          field,
          type: 'custom',
          message: typeof result === 'string' ? result : `${label || field} is invalid`
        });
      }
    }

    if (errors.length > 0) {
      setMultipleErrors(errors);
      return false;
    }

    return true;
  }, [setMultipleErrors]);

  /**
   * Comprehensive field validation for messenger updates
   * Validates all field types and provides detailed error reporting
   */
  const validateFieldsForMessenger = useCallback((
    fields: string[],
    watch: () => Record<string, any>,
    hiddenFields: string[] = []
  ) => {
    const validationResults: Array<{
      fieldName: string;
      isValid: boolean;
      value: any;
      errorMessage: string;
      fieldType: string;
    }> = [];

    const invalidFields: string[] = [];
    const validFields: string[] = [];

    // Enhanced validation function
    const validateFieldValue = (fieldName: string, value: any): { isValid: boolean; fieldType: string; errorMessage: string } => {
      // Handle undefined/null values
      if (value === undefined || value === null) {
        return {
          isValid: false,
          fieldType: 'null/undefined',
          errorMessage: `${fieldName} is required and cannot be empty`
        };
      }

      // Handle string values
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return {
          isValid: trimmed !== '',
          fieldType: 'string',
          errorMessage: trimmed === '' ? `${fieldName} cannot be empty or contain only whitespace` : ''
        };
      }

      // Handle array values
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return {
            isValid: false,
            fieldType: 'array',
            errorMessage: `${fieldName} must contain at least one item`
          };
        }

        // Check if array has valid items
        const hasValidItems = value.some(item => {
          if (typeof item === 'string') return item.trim() !== '';
          if (typeof item === 'object' && item !== null) return Object.keys(item).length > 0;
          return item !== null && item !== undefined;
        });

        return {
          isValid: hasValidItems,
          fieldType: 'array',
          errorMessage: hasValidItems ? '' : `${fieldName} must contain at least one valid item`
        };
      }

      // Handle object values
      if (typeof value === 'object' && value !== null) {
        const keys = Object.keys(value);
        return {
          isValid: keys.length > 0,
          fieldType: 'object',
          errorMessage: keys.length === 0 ? `${fieldName} must contain at least one property` : ''
        };
      }

      // Handle number values
      if (typeof value === 'number') {
        return {
          isValid: !isNaN(value),
          fieldType: 'number',
          errorMessage: isNaN(value) ? `${fieldName} must be a valid number` : ''
        };
      }

      // Handle boolean values
      if (typeof value === 'boolean') {
        return {
          isValid: true, // Boolean values are always valid
          fieldType: 'boolean',
          errorMessage: ''
        };
      }

      return {
        isValid: false,
        fieldType: 'unknown',
        errorMessage: `${fieldName} has an invalid data type`
      };
    };

    // Filter out hidden fields
    const fieldsToValidate = fields.filter(fieldName => !hiddenFields.includes(fieldName));

    // Validate each field
    fieldsToValidate.forEach(fieldName => {
      const currentValue = watch()[fieldName];
      const validation = validateFieldValue(fieldName, currentValue);
      
      validationResults.push({
        fieldName,
        isValid: validation.isValid,
        value: currentValue,
        errorMessage: validation.errorMessage,
        fieldType: validation.fieldType
      });

      if (validation.isValid) {
        validFields.push(fieldName);
      } else {
        invalidFields.push(fieldName);
      }
    });

    // Set errors for invalid fields
    invalidFields.forEach(fieldName => {
      const fieldResult = validationResults.find(result => result.fieldName === fieldName);
      if (fieldResult) {
        setFieldError({
          field: fieldName,
          type: 'required',
          message: fieldResult.errorMessage
        });
      }
    });

    const isValid = validFields.length === fieldsToValidate.length && fieldsToValidate.length > 0;

    return {
      isValid,
      validFields,
      invalidFields,
      validationResults,
      totalFields: fieldsToValidate.length,
      hiddenFieldsExcluded: hiddenFields
    };
  }, [setFieldError]);

  return {
    setFieldError,
    setMultipleErrors,
    clearFieldError,
    clearMultipleErrors,
    hasError,
    getErrorMessage,
    getErrorType,
    validateRequiredFields,
    validateWithRules,
    validateFieldsForMessenger
  };
}

export default useFormError; 