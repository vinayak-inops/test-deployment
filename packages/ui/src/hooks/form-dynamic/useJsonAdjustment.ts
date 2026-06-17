import { Control } from 'react-hook-form';

// Define base types without circular references
type PrimitiveValue = string | number | boolean | null;

// Define a more specific type structure
type NestedObject = {
  [key: string]: PrimitiveValue | NestedObject | NestedArray;
};

type NestedArray = Array<PrimitiveValue | NestedObject | NestedArray>;

interface StorageConfig {
  storageValue: string[];
  postStructure: NestedObject;
}

type FormValues = Record<string, PrimitiveValue>;

export const useJsonAdjustment = <T extends FormValues>(
  inputData: T,
  config?: StorageConfig
) => {
  const transformToNestedStructure = (): NestedObject => {
    if (!inputData) return {};

    // If no config is provided, return the raw data
    if (!config) return inputData as NestedObject;

    const { storageValue, postStructure } = config;
    const result: NestedObject = { ...postStructure };

    // Helper function to set nested value
    const setNestedValue = (obj: NestedObject, path: string[], value: PrimitiveValue): void => {
      let current = obj;
      const lastIndex = path.length - 1;

      // Safely traverse the path
      for (let i = 0; i < lastIndex; i++) {
        const key = path[i];
        if (!key) continue; // Skip if key is undefined

        if (!(key in current)) {
          current[key] = {};
        }
        const next = current[key];
        if (typeof next === 'object' && next !== null) {
          current = next as NestedObject;
        } else {
          current[key] = {};
          current = current[key] as NestedObject;
        }
      }

      // Set the final value
      const lastKey = path[lastIndex];
      if (lastKey) {
        current[lastKey] = value;
      }
    };

    // Process each field in storageValue
    storageValue.forEach(field => {
      const value = inputData[field];
      if (value !== undefined) {
        // Check if the field contains a hyphen (indicating nested structure)
        if (field.includes('-')) {
          const parts = field.split('-');
          if (parts.length === 2) {
            const [parent, child] = parts;
            if (parent && child) {
              setNestedValue(result, [parent, child], value as PrimitiveValue);
            }
          }
        } else {
          // Direct field assignment
          result[field] = value as PrimitiveValue;
        }
      }
    });

    return result;
  };

  return {
    transformedData: transformToNestedStructure(),
    rawData: inputData,
  };
};