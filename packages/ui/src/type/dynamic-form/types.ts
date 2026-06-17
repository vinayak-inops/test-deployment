/**
 * Type definitions for the dynamic form system
 * These types define the structure of form data, fields, and actions
 */

/**
 * Props for the DynamicForm component
 */
export interface DynamicFormProps {
  /** The form structure containing sections, fields, and actions */
  department: any;
  /** Optional working mode */
  workingMode?: string;
  /** Optional ID for the form */
  id?: string;
  /** Optional storage name */
  storageName?: string;
  /** Optional function to set form values */
  setFormValue?: (fn: (prev: any) => any) => void;
  /** Optional initial form values */
  fromValue?: any;
  /** Optional messenger object */
  messenger?: any;
  /** Optional function to set messenger */
  setMessenger?: (fn: (prev: any) => any) => void;
  /** Optional test data */
  test?: any;
  /** Optional text */
  text?: any;
  /** Optional function to set text */
  setText?: (fn: (prev: any) => any) => void;
}

/**
 * Event handler function type for form field events
 */
export type FormEventHandler = (
  parentFieldNames: string[],
  setValue: any,
  selectedValue: any,
  eventDetails: any
) => void;

/**
 * Value update handler function type
 */
export type ValueUpdateHandler = (changedKey: string, newValue: any) => void;

/**
 * Represents a form action (e.g., save, cancel, custom actions)
 */
export interface FormAction {
  /** The action type (e.g., 'save', 'cancel') */
  action: string;
  /** Display label for the action */
  label: string;
  /** Function to execute when action is triggered */
  function: (department?: FormStructure, data?: any, id?: string) => void;
  /** Optional CSS class value */
  classvalue?: string;
}

/**
 * Represents a form field with its properties and nested structure
 */
export interface FormField {
  /** Field name */
  name: string;
  /** Field label */
  label?: string;
  /** Field type */
  type?: string;
  /** Field value */
  value?: any;
  /** Whether the field is required */
  required?: boolean;
  /** Field mode */
  mode?: string;
  /** Display order */
  displayOrder?: number;
  /** Child fields */
  children?: FormField[];
  /** Field tag */
  tag?: string;
  /** Form name */
  formname?: string;
  /** Form grid configuration */
  formgrid?: string;
  /** CSS class values */
  classvalue?: {
    container?: string;
  };
  /** Grid layout configuration */
  group?: string;
  /** Whether the field is required on the backend */
  backendrequired?: boolean;
  /** Tabs configuration for tabbed forms */
  tabs?: Array<{ value: string; label: string }>;
  /** Field functions */
  functions?: Array<{
    function: string;
    parameters?: Record<string, any>;
    fieldsUpdate?: Array<{
      name: string;
      feildnkeys?: Array<{
        name: string;
        value: any;
        checkcondition?: string;
        switch?: Array<{ case: string; value: any }>;
      }>;
    }>;
  }>;
  /** Field change handlers */
  onChange?: Array<{
    event: string;
    fieldsUpdate?: Array<{
      name: string;
      feildnkeys?: Array<{
        name: string;
        value: any;
        checkcondition?: string;
      }>;
    }>;
  }>;
}

/**
 * Represents a section of the form with its fields and configuration
 */
export interface FormSection {
  /** Type of the form section */
  formtype?: string;
  /** Array of form fields */
  fields: FormField[];
  /** CSS class value for styling */
  classvalue?: string;
  /** Title of the section */
  title?: string;
  /** Grid layout configuration */
  group?: string;
  /** Form grid configuration */
  formgrid?: string;
  /** Tabs configuration for tabbed sections */
  tabs?: string[];
}

/**
 * Represents the complete form structure with title, description, and sections
 */
export interface FormStructure {
  /** Form title */
  title?: string;
  /** Form description */
  description?: string;
  /** CSS class value */
  classvalue?: string;
  /** Array of form sections */
  subformstructure: FormSection[];
  /** Array of form actions */
  actions?: FormAction[];
} 