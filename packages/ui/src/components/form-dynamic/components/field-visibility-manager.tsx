import React from 'react';
import { useFormContext } from '../../../context/FormContext';
import { useFieldVisibility } from '../../../hooks/form-dynamic/valuefilteration/useFieldVisibility';

interface FieldVisibilityManagerProps {
  organizationData: any;
}

export const FieldVisibilityManager: React.FC<FieldVisibilityManagerProps> = ({ organizationData }) => {
  const {
    setValue,
    watch,
    messenger,
    fieldUpdateControl,
    onFieldUpdate
  } = useFormContext();

  useFieldVisibility({
    messenger,
    setValue,
    watch,
    organizationData,
    fieldUpdateControl,
    onFieldUpdate
  });

  return null; // This is a utility component that doesn't render anything
}; 