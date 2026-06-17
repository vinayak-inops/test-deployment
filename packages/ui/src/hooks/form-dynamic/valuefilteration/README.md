# Form Dynamic Value Filtration Hooks

This directory contains custom hooks for managing form field values, visibility, and initial value updates in React Hook Form applications.

## Hooks Overview

### 1. `useInitialValueUpdate`

A custom hook that handles initial value updates based on `fromValue` and `watch` from React Hook Form with priority logic.

#### Features:
- **Priority Logic**: First uses `watch` values, then falls back to `fromValue` if field is not initialized
- **Value Normalization**: Converts various data types to consistent array format
- **Field Validation**: Checks parent field dependencies and hidden field states
- **Automatic Child Updates**: Triggers child field updates when parent changes
- **Initialization Tracking**: Prevents multiple initializations of the same field

#### Usage:

```tsx
import { useInitialValueUpdate } from './hooks/form-dynamic/valuefilteration/useInitialValueUpdate';

const MyComponent = () => {
  const { setValue, watch, clearErrors } = useForm();
  
  const {
    currentValue,
    isFieldValid,
    initializeField,
    resetInitialization,
    normalizeValue,
    hasValidData
  } = useInitialValueUpdate({
    fieldName: 'divisions',
    fromValue: { forlocaluse: { divisions: ['div1', 'div2'] } },
    setValue,
    watch,
    clearErrors,
    onFieldUpdate: (fieldName, value) => {
    },
    messenger: { mode: [] }
  });

  // Initialize field when component mounts
  useEffect(() => {
    initializeField();
  }, [initializeField]);

  return (
    <div>
      <p>Current Value: {currentValue.join(', ')}</p>
      <p>Field Valid: {isFieldValid ? 'Yes' : 'No'}</p>
    </div>
  );
};
```

#### Props:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `fieldName` | `string` | Yes | Name of the form field |
| `fromValue` | `FromValue` | No | Initial values from external source |
| `setValue` | `UseFormSetValue<any>` | Yes | React Hook Form setValue function |
| `watch` | `UseFormWatch<any>` | Yes | React Hook Form watch function |
| `clearErrors` | `UseFormClearErrors<any>` | No | React Hook Form clearErrors function |
| `onFieldUpdate` | `(fieldName: string, value: any) => void` | No | Callback when field updates |
| `messenger` | `any` | No | Messenger object for field visibility |

#### Returns:

| Property | Type | Description |
|----------|------|-------------|
| `currentValue` | `string[]` | Current field value (normalized to array) |
| `isFieldValid` | `boolean` | Whether field is valid based on dependencies |
| `initializeField` | `() => void` | Function to initialize the field |
| `resetInitialization` | `() => void` | Function to reset initialization state |
| `normalizeValue` | `(value: any) => string[]` | Function to normalize values to array |
| `hasValidData` | `(value: any) => boolean` | Function to check if value has valid data |

### 2. `useFieldVisibility`

Manages field visibility and updates based on mode changes and parent-child relationships.

### 3. `useValueFiltration`

Handles value filtering based on parent field selections and organizational hierarchy.

## Field Hierarchy

The hooks support the following field hierarchy:

```
subsidiaries (root)
├── divisions
│   ├── departments
│   │   └── subDepartments
│   │       └── sections
│   └── designations
│       └── grades
└── location (independent)
```

## Priority Logic

1. **First Priority**: Use `watch` value if it has valid data
2. **Second Priority**: Use `fromValue` if field is not initialized and `watch` is empty
3. **Default**: Return empty array if no valid data available

## Value Normalization

The hook automatically normalizes values to array format:
- Arrays: Return as-is
- Strings: Convert to single-item array
- Other types: Convert to string and wrap in array
- Null/undefined: Return empty array

## Parent Field Validation

Fields are validated based on their parent dependencies:
- Root fields (subsidiaries, location): Always valid
- Child fields: Valid only if parent has values or field is hidden
- Hidden fields: Always valid regardless of parent state

## Usage in Components

The hooks are designed to work together in form components:

```tsx
// In a form component
const {
  currentValue,
  isFieldValid,
  initializeField
} = useInitialValueUpdate({
  fieldName: field.name,
  fromValue,
  setValue,
  watch,
  clearErrors,
  onFieldUpdate,
  messenger
});

// Use in component logic
const selectedItems = currentValue;
const fieldIsValid = isFieldValid;
```

This approach provides a clean, reusable solution for managing complex form field dependencies and initial values. 