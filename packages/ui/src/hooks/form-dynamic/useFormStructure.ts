import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormField, FormSection, FormStructure } from '../../type/dynamic-form/types';
import { useFieldUpdate } from './useFieldUpdate';
import { useTabForm } from './useTabForm';

interface UseFormStructureProps {
  department: any;
}

interface UseFormStructureReturn {
  formStructure: FormStructure;
  updateFormStructure: React.Dispatch<React.SetStateAction<FormStructure>>;
  handleFieldUpdate: (fieldName: string, value: any) => void;
  handleTabUpdate: (fieldName: string, selectedTab: string) => void;
}

export const useFormStructure = ({ department }: UseFormStructureProps): UseFormStructureReturn => {
  // Use the tab form hook for processing tab forms
  const { processTabForm } = useTabForm();

  // Memoize the initial form structure
  const initialFormStructure = useMemo(() => {
    if (!department?.subformstructure?.length) {
      return { subformstructure: [] };
    }

    return {
      subformstructure: department.subformstructure.map((section: FormSection) => {
        // Process each section to handle tab forms
        return processTabForm(section);
      })
    };
  }, [department, processTabForm]);

  // Set up form structure state
  const [formStructure, setFormStructure] = useState<FormStructure>(initialFormStructure);

  // Memoize the form structure update handler
  const updateFormStructure = useCallback<React.Dispatch<React.SetStateAction<FormStructure>>>(
    (value) => {
      setFormStructure(value);
    },
    []
  );

  // Use the field update hook for field and tab updates
  const { handleFieldUpdate, handleTabUpdate } = useFieldUpdate({
    updateFormStructure
  });

  // Process form sections on initial load
  useEffect(() => {
    if (department?.subformstructure?.length) {
      setFormStructure({
        subformstructure: department.subformstructure.map((section: FormSection) =>
          processTabForm(section)
        )
      });
    }
  }, [department, processTabForm]);

  return {
    formStructure,
    updateFormStructure,
    handleFieldUpdate,
    handleTabUpdate
  };
}; 