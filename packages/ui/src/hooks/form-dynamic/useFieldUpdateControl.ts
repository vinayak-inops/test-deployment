import { useState, useCallback, useMemo } from 'react';

interface FieldUpdateControl {
  startingValue: Record<string, any>;
}

interface UseFieldUpdateControlProps {
  initialValue?: Record<string, any>;
}

interface UseFieldUpdateControlReturn {
  fieldUpdateControl: FieldUpdateControl;
  updateFieldControl: (fieldName: string, value: any) => void;
  getFieldUpdateControlWrapper: (fieldName: string) => FieldUpdateControl;
  getFieldUpdateValue: (fieldName: string) => FieldUpdateControl;
}

export const useFieldUpdateControl = ({ initialValue = {} }: UseFieldUpdateControlProps = {}): UseFieldUpdateControlReturn => {
  // Initialize field update control state
  const [fieldUpdateControl, setFieldUpdateControl] = useState<FieldUpdateControl>(() => ({
    startingValue: initialValue
  }));

  // Memoize the field update handler
  const updateFieldControl = useCallback((fieldName: string, value: any) => {
    setFieldUpdateControl(prev => ({
      startingValue: {
        ...prev.startingValue,
        [fieldName]: value
      }
    }));
  }, []);

  // Memoize the field update control wrapper
  const getFieldUpdateControlWrapper = useCallback((fieldName: string) => {
    return {
      startingValue: fieldUpdateControl.startingValue
    };
  }, [fieldUpdateControl]);

  // Memoize the field update value for each field
  const getFieldUpdateValue = useCallback((fieldName: string) => {
    return useMemo(() => ({
      startingValue: fieldUpdateControl.startingValue[fieldName] || {}
    }), [fieldUpdateControl.startingValue[fieldName]]);
  }, [fieldUpdateControl]);

  return {
    fieldUpdateControl,
    updateFieldControl,
    getFieldUpdateControlWrapper,
    getFieldUpdateValue
  };
}; 