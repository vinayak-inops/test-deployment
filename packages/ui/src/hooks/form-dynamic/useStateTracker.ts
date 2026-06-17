import { useState, useEffect, useRef } from 'react';

type OnChangeCallback<T> = ((newValue: T, oldValue: T) => void) | null;

/**
 * Custom hook to track useState variable changes
 * @param {T} value - The useState value to track
 * @param {string} variableName - Name of the variable (for logging purposes)
 * @param {OnChangeCallback<T>} onChange - Optional callback when value changes
 * @returns {boolean} - Whether the value has changed since the last render
 */
export function useStateTracker<T>(
  value: T,
  variableName = 'state',
  onChange: OnChangeCallback<T> = null
) {
  const previousValue = useRef(value);
  const isFirstRender = useRef(true);
  const [hasChanged, setHasChanged] = useState(false);
  
  useEffect(() => {
    // Skip checking on the first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Use Object.is for proper comparison (handles NaN, -0, +0 correctly)
    const valueHasChanged = !Object.is(previousValue.current, value);
    
    if (valueHasChanged) {
      
      
      setHasChanged(true);
      
      // Call the onChange callback if provided
      if (typeof onChange === 'function') {
        onChange(value, previousValue.current);
      }
    } else {
      setHasChanged(false);
    }
    
    // Update ref for next comparison
    previousValue.current = value;
  }, [value, variableName, onChange]);
  
  return hasChanged;
}