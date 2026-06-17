# Input Field Architecture

This directory contains the refactored input field components that separate concerns and make the code more maintainable.

## Structure

```
input/
├── input-handler.tsx      # Main router component that delegates to specific input types
├── text-based/
│   └── text-input.tsx     # Handles text, email, password, number, tel, url inputs
├── date-based/
│   └── date-input.tsx     # Handles date inputs with period validation
└── index.ts              # Exports for clean imports
```

## How it works

1. **InputField** (the original component) now simply delegates to **InputHandler**
2. **InputHandler** determines the field type and routes to the appropriate specialized component
3. Each specialized component handles its own logic and validation

## Field Type Routing

- `date` → `DateInput` (handles date fields with period validation)
- `text`, `email`, `password`, `number`, `tel`, `url` → `TextInput` (handles all text-based inputs)
- Default → `TextInput` (fallback for unknown types)

## Date Field Features

### Period-based Validation
- Date fields can be disabled based on period selection
- Custom period allows manual date entry
- Predefined periods auto-fill date ranges

### Before-Current-Date Validation
When a field has the `"before-current-date"` function in its functions array:
- Users cannot select future dates
- The date picker is limited to current date and earlier
- Real-time validation with clear error messages
- Visual indicator shows the restriction

Example field configuration:
```json
{
  "name": "birthDate",
  "type": "date",
  "functions": [
    {
      "function": "before-current-date"
    }
  ]
}
```

## Benefits

- **Separation of Concerns**: Each input type has its own component with specific logic
- **Maintainability**: Easier to modify or extend specific input types
- **Reusability**: Components can be used independently
- **Testing**: Each component can be tested in isolation
- **Performance**: Only the necessary logic is loaded for each field type

## Usage

The existing `InputField` component continues to work exactly as before. The refactoring is transparent to the calling code.

```tsx
// This still works exactly the same
<InputField field={field} tag={tag} fields={fields} />
```

## Adding New Input Types

To add a new input type:

1. Create a new component in the appropriate directory (e.g., `number-based/number-input.tsx`)
2. Add the case to the `renderInputByType()` function in `input-handler.tsx`
3. Export the new component from `index.ts`

Example:
```tsx
// In input-handler.tsx
case 'number':
  return <NumberInput {...commonProps} />;

// In index.ts
export { default as NumberInput } from './number-based/number-input';
``` 