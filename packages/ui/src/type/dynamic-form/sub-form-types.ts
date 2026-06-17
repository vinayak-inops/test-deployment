import { Dispatch, SetStateAction } from 'react';
import { Control, FieldError, FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FormField, FormSection, FormEventHandler, ValueUpdateHandler } from './types';

/**
 * Props for the SubFormWrapper component
 */
export interface SubFormWrapperProps {
  /** The form structure containing sections and fields */
  formStructure: {
    subformstructure: FormSection[];
  };
  /** React Hook Form register function */
  register: UseFormRegister<any>;
  /** Record of field errors */
  errors: FieldErrors<any>;
  /** React Hook Form setValue function */
  setValue: UseFormSetValue<any>;
  /** React Hook Form control object */
  control: Control<any>;
  /** Function to update the form structure */
  setFormStructure: Dispatch<SetStateAction<any>>;
  /** Handler for field events */
  eventHandler: FormEventHandler;
  /** Handler for value updates */
  valueUpdate: ValueUpdateHandler;
  /** React Hook Form watch function */
  watch: UseFormWatch<any>;
}

/**
 * Props for the subform structure configuration
 */
export interface SubFormStructureConfig {
  /** Grid layout configuration */
  group?: string;
  /** Form grid configuration */
  formgrid?: string;
  /** CSS class value */
  classvalue?: string;
  /** Section title */
  title?: string;
} 