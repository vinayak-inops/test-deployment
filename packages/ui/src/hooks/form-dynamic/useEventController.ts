import { useCallback, useRef } from "react";

/**
 * Custom hook for handling field update events and propagating changes
 * to dependent fields in a dynamic form structure with improved performance.
 */
const useEventController = (formStructure: any, setFormStructure: any, setError: any) => {
  // Use a ref to cache field lookup for better performance
  const fieldMapRef = useRef<Map<string, any[]>>(new Map());

  /**
   * Builds a map of all fields by name for efficient lookups
   */
  const buildFieldMap = useCallback((structure: any) => {
    const fieldMap = new Map<string, any[]>();

    const addToMap = (field: any) => {
      if (!field.name) return;

      if (!fieldMap.has(field.name)) {
        fieldMap.set(field.name, []);
      }
      fieldMap.get(field.name)?.push(field);
    };

    const traverseStructure = (section: any) => {
      section.fields?.forEach((field: any) => {
        addToMap(field);

        if (field.subformstructure?.length > 0) {
          field.subformstructure.forEach(traverseStructure);
        }
      });

      section.subformstructure?.forEach(traverseStructure);
    };

    structure.subformstructure?.forEach(traverseStructure);
    return fieldMap;
  }, []);

  /**
   * Updates a field value by name across the entire structure
   */
  const valueUpdate = useCallback(
    (changedKey: string, newValue: any) => {
      setFormStructure((prev: any) => {
        const updated = { ...prev };

        // Ensure field map is built
        if (fieldMapRef.current.size === 0) {
          fieldMapRef.current = buildFieldMap(updated);
        }

        // Direct field lookup instead of recursive traversal
        const targetFields = fieldMapRef.current.get(changedKey) || [];
        targetFields.forEach(field => {
          field.value = newValue;
        });

        return updated;
      });
    },
    [setFormStructure, buildFieldMap]
  );

  /**
   * Finds all child fields by name using the cached field map
   */
  const findChildFields = useCallback(
    (fieldNames: string[], structure: any): any[] => {
      // Ensure field map is built
      if (fieldMapRef.current.size === 0) {
        fieldMapRef.current = buildFieldMap(structure);
      }

      // Use the map for O(1) lookup instead of recursion
      return fieldNames.flatMap(name => fieldMapRef.current.get(name) || []);
    },
    [buildFieldMap]
  );

  /**
   * Clears options and values for a field and its descendants
   */
  const clearAllDescendantOptions = useCallback(
    (field: any, setValue: any, structure: any, visited = new Set<string>()) => {
      if (!field.name || visited.has(field.name)) return;
      visited.add(field.name);

      // Clear field options and value
      // field.options = [];
      field.value = "";

      if (field.name) {
        setTimeout(() => {
          setValue(field.name, "", { shouldValidate: true, shouldDirty: true });
        }, 0);
      }

      // Process children if any
      if (field.children?.length > 0) {
        const childFields = findChildFields(field.children, structure);
        childFields.forEach((childField: any) => {
          clearAllDescendantOptions(childField, setValue, structure, visited);
        });
      }
    },
    [findChildFields]
  );

  /**
   * Applies field updates based on event configuration
   */
  const applyFieldUpdates = useCallback(
    (updates: any[], setValue: any, selectedValue: any, structure: any) => {
      // Ensure field map is built
      if (fieldMapRef.current.size === 0) {
        fieldMapRef.current = buildFieldMap(structure);
      }


      // Process each update once, instead of recursively searching
      updates.forEach(update => {
        const fields = fieldMapRef.current.get(update.name) || [];

        fields.forEach(field => {
          update.feildnkeys?.forEach((keyUpdate: any) => {
            // Handle mode updates
            if ((keyUpdate.name === "mode" && keyUpdate.value === "hidden") || field.mode === "hidden") {
              // Clear field value when hidden

              field.value = "";
              setValue(field.name, "", {
                shouldValidate: true,
                shouldDirty: true,
              });

              // Handle children fields if they exist
              if (field.children?.length > 0) {
                // Recursively handle children fields
                const handleChildren = (children: string[], parentField: any) => {
                  const childFields = findChildFields(children, structure);
                  childFields.forEach((childField: any) => {
                    // Clear child field values
                    childField.value = "";
                    setValue(childField.name, "", {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    field?.onChange?.forEach((event: any) => {
                      if (event.event === "updatechild") {
                        setTimeout(() => {
                          // Then handle the event
                          eventHandler(field?.children, setValue, true, field);
                        }, 0);
                      }
                    });
                  });
                };

                handleChildren(field.children, field);
              }
            }

            if (keyUpdate.checkcondition == "switch") {
              keyUpdate.switch.forEach((switchCase: any) => {

                if (switchCase?.case == selectedValue) {
                  field[keyUpdate.name] = switchCase?.value;
                }
                if ((keyUpdate.name === "mode" && switchCase?.value === "hidden") || field.mode === "hidden") {
                  // Clear field value when hidden

                  field.value = "";
                  setValue(field.name, "", {
                    shouldValidate: true,
                    shouldDirty: true,
                  });

                  // Handle children fields if they exist
                  if (field.children?.length > 0) {
                    // Recursively handle children fields
                    const handleChildren = (children: string[], parentField: any) => {
                      const childFields = findChildFields(children, structure);
                      childFields.forEach((childField: any) => {
                        // Clear child field values
                        childField.value = "";
                        setValue(childField.name, "", {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        field?.onChange?.forEach((event: any) => {
                          if (event.event === "updatechild") {
                            setTimeout(() => {
                              // Then handle the event
                              eventHandler(field?.children, setValue, true, field);
                            }, 0);
                          }
                        });
                      });
                    };

                    handleChildren(field.children, field);
                  }
                }
              });
            } else {
              const shouldApply =
                keyUpdate.checkcondition === selectedValue ||
                keyUpdate.checkcondition === "directaddvalue"
              if (shouldApply) {
                field[keyUpdate.name] = keyUpdate.value;
              }

              if (keyUpdate.checkcondition == "selectedvalue") {
                field[keyUpdate.name] = selectedValue
              }
            }




            if (keyUpdate.name === "value") {
              setTimeout(() => {
                setValue(field.name, keyUpdate.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }, 0);
            }
          });
        });
      });
    },
    [buildFieldMap, findChildFields]
  );

  /**
   * Validates required fields and returns any validation errors
   */
  const validateRequiredFields = useCallback(
    (
      requiredFields: string[],
      structure: any,
      setError: any,
      formStructureupdate: any,
      throwFieldError?: (fieldName: string, errorMessage: string) => void,
      throwMultipleErrors?: (errorMap: { [key: string]: string }) => void,

    ) => {
      // Ensure field map is built
      if(requiredFields?.length==0){
        return "noerror"
      }
      if (fieldMapRef.current.size === 0) {
        fieldMapRef.current = buildFieldMap(structure);
      }
      let errors: { [key: string]: { type: string; message: string } } = {};
      let hasErrors = false;

      const convertToFlatArray = (structure: any): any[] => {
        let flatFields: any[] = [];
        // Handle if structure is an array
        const sections = Array.isArray(structure) ? structure : [structure];

        sections.forEach((section: any) => {
          // Handle fields at current level
          if (section.fields && Array.isArray(section.fields)) {
            section.fields.forEach((field: any) => {
              if (field.name && requiredFields?.find((requiredField: any) => requiredField === field.name)) {
                if (field.required && (!field.value || field.value.length === 0)) {
                  hasErrors = true;
                  const errorMessage = `${field.label || field.name} is required`;
                  errors[field.name] = {
                    type: "required",
                    message: errorMessage
                  };


                  // // Fallback to setError if throwFieldError is not provided
                  // setError(field.name, {
                  //   type: "required",
                  //   message: errorMessage
                  // });
                }
              }

              // Handle subformstructure within fields
              if (field.subformstructure && field.subformstructure.length > 0) {
                const subFields = convertToFlatArray(field.subformstructure);
                flatFields = flatFields.concat(subFields);
              }
            });
          }

          // Handle subformstructure at section level
          if (section.subformstructure && section.subformstructure.length > 0) {
            const subFields = convertToFlatArray(section.subformstructure);
            flatFields = flatFields.concat(subFields);
          }
        });

        return flatFields;
      };

      // Process the entire form structure
      convertToFlatArray(formStructureupdate);


      return hasErrors ? errors : "noerror";
    },
    [buildFieldMap]
  );



  /**
   * Main event handler to manage cascading field changes
   */


  const functionToHandleEvent = useCallback(
    (field: any, setValue: any, selectedValue: any) => {
      setFormStructure((prev: any) => {
        const updated = JSON.parse(JSON.stringify(prev));

        // Build/refresh the field map for this update
        fieldMapRef.current = buildFieldMap(updated);

        // Get parent fields directly instead of recursive search
        const parentFields = field.children.flatMap(
          (name: any) => fieldMapRef.current.get(name) || []
        );

        parentFields.forEach((childfield: any) => {
          field?.functions?.forEach((functionDetails: any) => {
            if (functionDetails.function === "validateRequiredFields") {
              applyFieldUpdates(
                functionDetails.fieldsUpdate,
                setValue,
                selectedValue,
                updated
              );
            }
            if (functionDetails.function === "getReports") {
              applyFieldUpdates(
                functionDetails.fieldsUpdate,
                setValue,
                selectedValue,
                updated
              );
            }
            if (functionDetails.function === "updateElement" || functionDetails.function=="messenger-current-starter-organizationData") {
              
              applyFieldUpdates(
                functionDetails.fieldsUpdate,
                setValue,
                selectedValue,
                updated
              );
            }
            if(functionDetails.function === "tableValueUpadte"){
              const selectedField=parentFields[0]["tabledata"]
              const newValue=[selectedValue,...selectedField]
              applyFieldUpdates(
                functionDetails.fieldsUpdate,
                setValue,
                newValue,
                updated
              );
            }
            if (functionDetails.function === "filterNonNestedOptions") {
              const selectedField=parentFields.filter((e:any)=>e.name==functionDetails.fromField)
              const newValue=selectedField[0]?.options?.filter((e:any,i:any)=>{
                return field.value==e.category
              })
              applyFieldUpdates(
                functionDetails.fieldsUpdate,
                setValue,
                newValue,
                updated
              );
            }
            if(functionDetails.function === "closepopup"){
              applyFieldUpdates(
                functionDetails.fieldsUpdate,
                setValue,
                selectedValue,
                updated
              );
            }
          });


          // Clear parent value
          setTimeout(() => {
            if (field?.name && typeof field.name === 'string' && field.name.trim() !== '') {
              setValue(field.name, "", {
                shouldValidate: true,
                shouldDirty: true,
              });
            }
          }, 0);

          // Process children if any
          if (childfield.children?.length > 0) {
            const childFields = findChildFields(field.children, updated);
            childFields.forEach(childField =>
              clearAllDescendantOptions(
                childField,
                setValue,
                updated,
                new Set()
              )
            );
          }

          // Apply field updates if any
          // if (eventDetails?.fieldsUpdate?.length > 0) {
          //   applyFieldUpdates(
          //     eventDetails.fieldsUpdate,
          //     setValue,
          //     selectedValue,
          //     updated
          //   );
          // }
        });

        return updated;
      });
    },
    [
      applyFieldUpdates,
      clearAllDescendantOptions,
      findChildFields,
      buildFieldMap,
      setFormStructure,
      validateRequiredFields,
    ]
  );
  const eventHandler = useCallback(
    (
      parentFieldNames: string[],
      setValue: any,
      selectedValue: any,
      eventDetails: any,
      setError?: any
    ) => {
      setFormStructure((prev: any) => {
        const updated = JSON.parse(JSON.stringify(prev));

        // Build/refresh the field map for this update
        fieldMapRef.current = buildFieldMap(updated);

        // Get parent fields directly instead of recursive search
        const parentFields = parentFieldNames.flatMap(
          name => fieldMapRef.current.get(name) || []
        );

        parentFields.forEach(field => {
          // Process onChange events
          eventDetails?.onChange?.forEach((event: any) => {
            if (event.event === "updatechild") {
              applyFieldUpdates(
                event.fieldsUpdate,
                setValue,
                selectedValue,
                updated
              );
            }
          });

          eventDetails?.onChange?.forEach((event: any) => {
            if (event.event === "messenger-current-starter-organizationData") {
              applyFieldUpdates(
                event.fieldsUpdate,
                setValue,
                selectedValue,
                updated
              );
            }
          });



          // Clear parent value
          setTimeout(() => {
            if (field?.name && typeof field.name === 'string' && field.name.trim() !== '') {
              setValue(field.name, "", {
                shouldValidate: true,
                shouldDirty: true,
              });
            }
          }, 0);

          // Process children if any
          if (field.children?.length > 0) {
            const childFields = findChildFields(field.children, updated);
            childFields.forEach(childField =>
              clearAllDescendantOptions(
                childField,
                setValue,
                updated,
                new Set()
              )
            );
          }

          // Apply field updates if any
          // if (eventDetails?.fieldsUpdate?.length > 0) {
          //   applyFieldUpdates(
          //     eventDetails.fieldsUpdate,
          //     setValue,
          //     selectedValue,
          //     updated
          //   );
          // }
        });

        return updated;
      });
    },
    [
      applyFieldUpdates,
      clearAllDescendantOptions,
      findChildFields,
      buildFieldMap,
      setFormStructure,
      validateRequiredFields,
      functionToHandleEvent
    ]
  );

  const tabController = useCallback(
    (fieldparam: any, selectedValue: any) => {
      setFormStructure((prev: any) => {
        const updated = JSON.parse(JSON.stringify(prev));

        if (fieldMapRef.current.size === 0) {
          fieldMapRef.current = buildFieldMap(updated);
        }

        const updateTabsChild = (section: any) => {
          if (Array.isArray(section.tabs) && section.tabs.includes(selectedValue)) {
            if (Array.isArray(section.fields)) {
              section.fields.forEach((field: any) => {
                if (field?.backendrequired) {
                  field.required = true;
                }
                field.required = true;
                if (field.subformstructure) {
                  field.subformstructure.forEach(updateTabsChild);
                }
              });
            }
          } else {
            if (Array.isArray(section.fields)) {
              section.fields.forEach((field: any) => {
                field.required = false;
                if (field.subformstructure) {
                  field.subformstructure.forEach(updateTabsChild);
                }
              });
            }
          }
        };

        const processSection = (section: any) => {
          if (Array.isArray(section.fields)) {
            section.fields.forEach((field: any) => {
              if (field.name === fieldparam.name && Array.isArray(field.subformstructure)) {
                field.subformstructure.forEach(updateTabsChild);
              }
              if (field.subformstructure) {
                field.subformstructure.forEach(processSection);
              }
            });
          }
          if (Array.isArray(section.subformstructure)) {
            section.subformstructure.forEach(processSection);
          }
        };

        if (Array.isArray(updated.subformstructure)) {
          updated.subformstructure.forEach(processSection);
        }

        return updated;
      });
    },
    [buildFieldMap, setFormStructure]
  );

  return {
    eventHandler,
    valueUpdate,
    validateRequiredFields,
    functionToHandleEvent,
    tabController,
  };
};

export default useEventController;