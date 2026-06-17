import {
  UseFormSetValue,
  UseFormWatch,
  UseFormSetError,
} from "react-hook-form";
import { useEffect, useState } from "react";
import { type Report } from "../../utils/api/api-connection";
import { useJsonAdjustment } from "./useJsonAdjustment";
import { useRequest } from "../api/useGetRequest";
import { FormError } from './validation/useFormError';
import { getSession } from 'next-auth/react';

// Type definitions
interface FunctionDetails {
  function: string;
  storageName?: string;
  storageValue?: string[];
  updateField?: string;
  validation?: any;
  fieldsUpdate?: Array<{
    name: string;
    feildnkeys?: Array<{
      api?: { url: string };
      tebleColumn?: string[];
      switch?: Array<{ value: any }>;
    }>;
  }>;
  postStructure?: any;
  defaultStruck?: {
    status: boolean;
    value: any;
  };
  storageKey?: string;
}

interface FormStructure {
  [key: string]: any;
}

interface MessengerState {
  value?: Record<string, any>;
  [key: string]: any;
}

interface ReportResult {
  data: {
    options?: any[];
    [key: string]: any;
  } | null;
  error?: string;
}

interface StorageConfig {
  storageValue: string[];
  postStructure: any;
}

// Update the type to accept either form of setError
type SetErrorFunction = UseFormSetError<any> | ((error: FormError) => void);

// Utility functions
const handleLocalStorage = (
  storageName: string,
  storageValue: string[] | undefined,
  watch: UseFormWatch<any>,
  postStructure?: any,
  defaultStruck?: { status: boolean; value: any },
  messenger?: MessengerState
) => {
  if (!storageValue) {
    return;
  }


  // const existingStorage = localStorage.getItem(storageName);
  // const existingData = existingStorage ? JSON.parse(existingStorage) : {};

  // if (defaultStruck?.status) {
  //   localStorage.setItem(storageName, JSON.stringify(defaultStruck.value));
  //   return;
  // }

  if (postStructure) {
    const inputData = storageValue.reduce(
      (acc: any, fieldName: string) => ({
        ...acc,
        [fieldName]: watch(fieldName),
      }),
      {}
    );
    const config: StorageConfig = { storageValue, postStructure };
    const { transformedData } = useJsonAdjustment(inputData, config);
    return transformedData;
  }

  const newValues = storageValue.reduce(
    (acc: any, fieldName: string) => ({
      ...acc,
      [fieldName]: watch(fieldName),
    }),
    {}
  );

  const updatedData = { ...newValues };
  // localStorage.setItem(storageName, JSON.stringify(updatedData));
  return updatedData;
};

const handleMessengerUpdate = (
  field: any,
  functionDetails: FunctionDetails,
  watch: UseFormWatch<any>,
  setMessenger: (fn: (prev: MessengerState) => MessengerState) => void,
  messenger?: MessengerState,
  setError?: SetErrorFunction
) => {
  const fieldsUpdate = functionDetails.fieldsUpdate?.[0];
  const validation = functionDetails?.validation;
  
  if (!fieldsUpdate?.name || !fieldsUpdate.feildnkeys?.[0]) {
    return;
  }

  // Collect all hidden field names from messenger mode
  const hiddenFields: string[] = [];
  if (messenger?.mode) {
    messenger.mode.forEach((modeField: { field: string; value: 'hidden' | 'all-allow' }) => {
      if (modeField.value === 'hidden') {
        hiddenFields.push(modeField.field);
      }
    });
  }

  // Use comprehensive validation if validation fields are specified
  let validationResult: {
    isValid: boolean;
    validFields: string[];
    invalidFields: string[];
    validationResults: Array<{ fieldName: string; isValid: boolean; value: any; errorMessage: string }>;
    totalFields?: number;
    hiddenFieldsExcluded?: string[];
  } = { isValid: true, validFields: [], invalidFields: [], validationResults: [] };
  
  if (validation && validation.length > 0) {
    // Create a comprehensive validation function
    const validateFieldValue = (fieldName: string, value: any): boolean => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string') return value.trim() !== '';
      if (Array.isArray(value)) return value.length > 0 && value.some(item => {
        if (typeof item === 'string') return item.trim() !== '';
        if (typeof item === 'object' && item !== null) return Object.keys(item).length > 0;
        return item !== null && item !== undefined;
      });
      if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
      if (typeof value === 'number') return !isNaN(value);
      if (typeof value === 'boolean') return true;
      return false;
    };

    // Filter out hidden fields from validation
    const filteredValidation = validation.filter((fieldName: string) => !hiddenFields.includes(fieldName));
    
    // Comprehensive validation of all fields
    const validationResults: Array<{ fieldName: string; isValid: boolean; value: any; errorMessage: string }> = [];
    const invalidFields: string[] = [];
    const validFields: string[] = [];

    // Validate each field and collect detailed results
    filteredValidation.forEach((fieldName: string) => {
      const currentValue = watch(fieldName);
      const isValid = validateFieldValue(fieldName, currentValue);
      
      const errorMessage = isValid ? '' : `${fieldName} is required and cannot be empty`;
      
      validationResults.push({
        fieldName,
        isValid,
        value: currentValue,
        errorMessage
      });

      if (isValid) {
        validFields.push(fieldName);
      } else {
        invalidFields.push(fieldName);
      }
    });

    validationResult = {
      isValid: validFields.length === filteredValidation.length && filteredValidation.length > 0,
      validFields,
      invalidFields,
      validationResults,
      totalFields: filteredValidation.length,
      hiddenFieldsExcluded: hiddenFields
    };


    // Set errors for all invalid fields
    if (setError && invalidFields.length > 0) {
      invalidFields.forEach((fieldName: string) => {
        const fieldResult = validationResults.find(result => result.fieldName === fieldName);
        const errorMessage = fieldResult?.errorMessage || `${fieldName} is required`;
        
        if ('name' in setError && typeof setError === 'function') {
          // Original react-hook-form setError
          (setError as UseFormSetError<any>)(fieldName, {
            type: 'required',
            message: errorMessage
          });
        } else {
          // Our custom setError
          (setError as (error: FormError) => void)({
            field: fieldName,
            type: 'required',
            message: errorMessage
          });
        }
      });

      
    }
  }

  // Handle button fields (next step progression)
  if (field.tag === "button") {
    const switchValue = fieldsUpdate.feildnkeys[0].switch?.[0]?.value;
    if (!switchValue) {
      return;
    }

    // If no validation is required, allow progression
    if (!validation || validation.length === 0) {
      setMessenger((prevState: MessengerState) => {
        const newState = {
          ...prevState,
          [fieldsUpdate.name]: switchValue
        };
        return newState;
      });
      return;
    }

    // Only allow progression if all validations pass
    if (validationResult.isValid && typeof setMessenger === 'function') {
      try {
        setMessenger((prevState: MessengerState) => {
          const newState = {
            ...prevState,
            [fieldsUpdate.name]: switchValue
          };
          return newState;
        });
      } catch (error) {
        
      }
    } else {
      
    }
    return;
  }

  // Handle input, select, and textarea fields
  if (["input", "select", "textarea"].includes(field.tag)) {
    if (validationResult.isValid && typeof setMessenger === 'function') {
      try {
        setMessenger((prevState: MessengerState) => ({
          ...prevState,
          value: {
            ...(prevState?.value || {}),
            [fieldsUpdate.name]: watch(fieldsUpdate.name)
          }
        }));
      } catch (error) {
      }
    } else {
    }
  }
};

const handleTableValueUpdate = (
  field: any,
  functionDetails: FunctionDetails,
  watch: UseFormWatch<any>,
  validationResult: string,
  functionToHandleEvent: any,
  setValue: UseFormSetValue<any>
) => {
  if (validationResult === "noerror") {
    const fieldsUpdate = functionDetails.fieldsUpdate?.[0];
    const feildnkeys = fieldsUpdate?.feildnkeys?.[0];
    const tebleColumn = feildnkeys?.tebleColumn;
    if (!tebleColumn) {
      return;
    }
    const tableData = tebleColumn.reduce(
      (acc: any, fieldName: string) => ({
        ...acc,
        [fieldName]: watch(fieldName),
      }),
      {}
    );
    functionToHandleEvent(field, setValue, tableData);
  }
};

const handleLocalStorageInsertValue = (
  functionDetails: FunctionDetails,
  watch: UseFormWatch<any>,
  setFormValue?: (fn: (prev: any) => any) => void
) => {
  if (!functionDetails.storageValue) {
    return;
  }

  if (functionDetails.postStructure) {
    const inputData = functionDetails.storageValue.reduce(
      (acc: any, fieldName: string) => ({
        ...acc,
        [fieldName]: watch(fieldName),
      }),
      {}
    );
    const config: StorageConfig = {
      storageValue: functionDetails.storageValue,
      postStructure: functionDetails.postStructure
    };
    const { transformedData } = useJsonAdjustment(inputData, config);

    const existingStorage = localStorage.getItem(functionDetails.storageName!);
    const existingData = existingStorage ? JSON.parse(existingStorage) : {};
    const updatedData = { ...existingData, ...transformedData };

    localStorage.setItem(
      functionDetails.storageName!,
      JSON.stringify(updatedData)
    );
  }

  if (functionDetails.storageValue) {
    const transformedObject = functionDetails.storageValue.reduce(
      (acc: any, element: string) => ({
        ...acc,
        [element]: watch(element)
      }),
      {}
    );

    if (functionDetails.storageName?.includes('table') && setFormValue && functionDetails.storageKey) {
      setFormValue((prev: any) => {
        const key = functionDetails.storageKey;
        if (!key) return prev;
        const prevArr = Array.isArray(prev[key]) ? prev[key] : [];
        return {
          ...prev,
          [key]: [
            ...prevArr,
            transformedObject
          ]
        };
      });
    }
  }

  window.dispatchEvent(
    new CustomEvent("localStorageChange", {
      detail: { key: functionDetails.storageName },
    })
  );
};

export const useFunctionHandle = (
  setValue: UseFormSetValue<any>,
  setError: SetErrorFunction,
  watch: UseFormWatch<any>,
  formStructure: FormStructure,
  functionToHandleEvent: any,
  validateRequiredFields: any,
  setFormValue?: (fn: (prev: any) => any) => void,
  fromValue?: any,
  setMessenger?: (fn: (prev: MessengerState) => MessengerState) => void,
  messenger?: MessengerState
) => {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
  const [currentField, setCurrentField] = useState<any>(null);

  // Use useRequest hook for fetching reports
  const { data: reportData, loading: reportLoading, error: reportError, refetch: refetchReports } = useRequest<Report[]>({
    url: currentEndpoint || '',
    method: 'GET',
    requireAuth: true,
    onSuccess: (data) => {
      setReports(data);
      if (data && 'options' in data && currentField) {
        functionToHandleEvent(currentField, setValue, data.options);
      }
    },
    onError: (error) => {
      setReportsError(error.message || 'Failed to fetch reports');
    },
    dependencies: [currentEndpoint]
  });

  // Update loading state based on useRequest
  useEffect(() => {
    setIsLoading(reportLoading);
  }, [reportLoading]);

  // Update error state based on useRequest
  useEffect(() => {
    if (reportError) {
      setReportsError(reportError.message || 'Failed to fetch reports');
    }
  }, [reportError]);

  const handleSetError = (fieldName: string, error: { type: string; message: string }) => {
    if ('name' in setError && typeof setError === 'function') {
      // Original react-hook-form setError
      (setError as UseFormSetError<any>)(fieldName, error);
    } else {
      // Our custom setError
      (setError as (error: FormError) => void)({
        field: fieldName,
        type: error.type as any,
        message: error.message
      });
    }
  };

  const handleFieldFunctions = async (field: any) => {
    if (!field?.functions?.length) return;

    // Set current field before processing functions
    setCurrentField(field);


    // Validate required fields first
    const validationResult = validateRequiredFields(
      field.requiredfields || [],
      formStructure,
      (fieldName: string, errorMessage: string) => handleSetError(fieldName, { type: 'required', message: errorMessage }),
      formStructure
    );

    // Process each function
    for (const functionDetails of field.functions) {
      try {
        

        // Handle required fields validation
        if (field?.requiredfields?.length > 0) {
          field.functions.forEach((func: FunctionDetails) => {
            if (func.function === "validateRequiredFields") {
              functionToHandleEvent(field, setValue, validationResult);
            }
          });
        }

        // Handle different function types
        switch (functionDetails.function) {
          case "messenger-tonext-component":
            if (setMessenger) {
              // Ensure we have validation details before proceeding
              if (!functionDetails.validation || functionDetails.validation.length === 0) {
                
              } else {
              }
              
              handleMessengerUpdate(field, functionDetails, watch, setMessenger, messenger, setError);
            } else {
            }
            break;

          case "table-value":
            if (setFormValue && fromValue && field.name.includes("table")) {
              const tableName = field.name.split("-")[0];
              const tableData = watch(tableName) as Record<string, any>[];
              const table= fromValue[tableName]?fromValue[tableName]:tableData
              const updatedData = table?.map((row: Record<string, any>, index: number) => {
                const updatedRow = { ...row };
                const targetKey = field.name.split("-")[1];
                const rowNumber = field.name.split("-")[2].split("table")[1];
                
                if(index == (Number(rowNumber)-1)){
                  Object.keys(row).forEach((key) => {
                    if (key === targetKey) {
                      updatedRow[key] = watch(field.name);
                    }
                  });
                }
                
                return updatedRow;
              });
              if (setFormValue) {
                setFormValue((prev: any) => ({
                  ...prev,
                  [tableName]: updatedData
                }));
              }
            }
            break;

          case "getReports":
            const fieldsUpdate = functionDetails.fieldsUpdate?.[0];
            const feildnkeys = fieldsUpdate?.feildnkeys?.[0];
            if (feildnkeys?.api?.url) {
              setCurrentEndpoint(feildnkeys.api.url);
              // The useRequest hook will automatically fetch when currentEndpoint changes
            } else {
              setReportsError('Invalid API URL configuration');
            }
            break;

          case "messenger-current-starter-organizationData":
            const checkDk = [
              { label: "Mumbai Office", value: "LOC001" },
              { label: "Chennai Office", value: "LOC004" }
            ];
            functionToHandleEvent(field, setValue, checkDk);
            break;

          case "storeValue-forlocaluse":
            if (setFormValue) {
              const allFormValues = { [field.name]: watch(field.name) };
              setFormValue((prev: any) => ({
                ...prev,
                ...allFormValues
              }));
              break;
            }
            break;

          case "filterNonNestedOptions":
            functionToHandleEvent(field, setValue);
            break;

          case "tableValueUpadte":
            handleTableValueUpdate(field, functionDetails, watch, validationResult, functionToHandleEvent, setValue);
            break;

          case "localStorage":
            if (!functionDetails.storageValue) {
              break;
            }
            const updatedData = handleLocalStorage(
              functionDetails.storageName!,
              functionDetails.storageValue,
              watch,
              functionDetails.postStructure,
              functionDetails.defaultStruck,
              messenger
            );

            if (functionDetails.postStructure && setFormValue && updatedData) {
              // Get all form values using watch
              const allFormValues = Object.keys(watch()).reduce(
                (acc: any, fieldName: string) => ({
                  ...acc,
                  [fieldName]: watch(fieldName)
                }),
                {}
              );

              setFormValue((prev: any) => ({
                ...prev,
                ...updatedData,
                forlocaluse: {
                  ...prev?.forlocaluse,
                  ...allFormValues
                }
              }));
            }

            window.dispatchEvent(
              new CustomEvent("localStorageChange", {
                detail: { key: functionDetails.storageName },
              })
            );
            break;

          case "localStorageInsertValue":
            handleLocalStorageInsertValue(
              functionDetails,
              watch,
              setFormValue
            );
            break;

          default:
            
            break;
        }
      } catch (error) {
        
      }
    }
  };

  return {
    handleFieldFunctions,
    reports: reportData || reports, // Use data from useRequest if available
    isLoading,
    reportsError,
    refetchReports // Expose refetch function if needed
  };
};
