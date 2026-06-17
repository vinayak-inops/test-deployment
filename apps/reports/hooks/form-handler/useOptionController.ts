import { useCallback } from "react";

interface FieldStructure {
  subformstructure: any[];
  actions?: any[];
}

interface OptionControllerParams {
  formStructure: FieldStructure;
  setFormData: (data: any) => void;
  optionsMap?: Record<string, () => any>; // For functions like emailfilter, namefilter, etc.
}

export const useOptionController = ({
  formStructure,
  setFormData,
  optionsMap,
}: OptionControllerParams) => {
  // Recursively clear all child options
  const clearAllDescendantOptions = useCallback(
    (field: any, setValue: any, visited = new Set()) => {
      if (visited.has(field)) return;
      visited.add(field);

      field.options = [];
      field.value = "";

      setTimeout(() => {
        setValue(field.name, "", { shouldValidate: true, shouldDirty: true });
      }, 0);

      if (field.children && field.children.length > 0) {
        const childFields: any[] = [];
        formStructure.subformstructure?.forEach((subform: any) => {
          subform.fields?.forEach((subformField: any) => {
            if (field.children.includes(subformField.name)) {
              childFields.push(subformField);
            }
          });
        });
        childFields.forEach((childField) => {
          clearAllDescendantOptions(childField, setValue, visited);
        });
      }
    },
    [formStructure]
  );

  // The main updateOptions function
  const updateOptions = useCallback(
    (
      parentFieldNames: string[],
      setValue: any,
      selectedValue?: any,
      selectedField?: any
    ) => {
      let isUpdated = false;

      formStructure.subformstructure?.forEach((subform: any) => {
        subform.fields?.forEach((field: any) => {
          if (parentFieldNames.includes(field.name)) {
            // If the field uses optionsrules
            if (field.optionsrules?.includes(selectedValue)) {
              if (optionsMap && optionsMap[selectedValue]) {
                field.options = optionsMap[selectedValue]();
              }
            }

            // If "updatevalue" rule is present, directly assign selectedField options
            if (field.optionsrules?.includes("updatevalue")) {
              field.options = selectedField.options;
            }

            setTimeout(() => {
              setValue(field.name, "", { shouldValidate: true, shouldDirty: true });
            }, 0);

            if (field.children && field.children.length > 0) {
              const childFields: any[] = [];
              formStructure.subformstructure?.forEach((innerSubform: any) => {
                innerSubform.fields?.forEach((innerField: any) => {
                  if (field.children.includes(innerField.name)) {
                    childFields.push(innerField);
                  }
                });
              });
              childFields.forEach((childField) => {
                clearAllDescendantOptions(childField, setValue, new Set());
              });
            }
            isUpdated = true;
          }
        });
      });

      if (isUpdated) {
        setTimeout(() => {
          setFormData({ ...formStructure });
        }, 0);
      }
    },
    [formStructure, setFormData, optionsMap, clearAllDescendantOptions]
  );

  return { updateOptions };
};
