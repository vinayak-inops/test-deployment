// hooks/useEventController.ts
import { useCallback } from "react";

/**
 * A generic event controller hook for handling form field events and dependencies
 * @param formStructure - The form structure containing subformstructure and actions
 * @returns Object containing event handling functions
 */
export const useEventController = (formStructure: any) => {
  /**
   * Clears options and resets values recursively for descendants
   */
  const clearAllDescendantOptions = useCallback(
    (field: any, setValue: any, visited = new Set()) => {
      if (visited.has(field)) return;
      visited.add(field);

      field.options = [];

      if (field.name) {
        field.value = "";
        setTimeout(() => {
          setValue(field.name, "", { shouldValidate: true, shouldDirty: true });
        }, 0);
      }

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

  /**
   * Handles field property updates like mode with selectedValue condition
   */
  const applyFieldUpdates = useCallback(
    (fieldUpdates: any[], setValue: any, selectedValue?: any) => {
      fieldUpdates.forEach((update: any) => {
        const targetFieldName = update.name;

        formStructure.subformstructure?.forEach((subform: any) => {
          subform.fields?.forEach((field: any) => {
            if (field.name === targetFieldName) {
              if (update.feildnkeys && Array.isArray(update.feildnkeys)) {
                update.feildnkeys.forEach((keyUpdate: any) => {
                  if (
                    keyUpdate.checkcondition === selectedValue ||
                    keyUpdate.checkcondition === "directaddvalue"
                  ) {
                    field[keyUpdate.name] = keyUpdate.value;
                    if (keyUpdate.name === "value") {
                      setTimeout(() => {
                        setValue(field.name, keyUpdate.value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }, 0);
                    }
                  }
                });
              }
            }
          });
        });
      });
    },
    [formStructure]
  );

  /**
   * Main event handler function that processes field changes and updates related fields
   */
  const handleFieldEvent = useCallback(
    (
      parentFieldNames: string[],
      setValue: any,
      selectedValue?: any,
      eventDetails?: any
    ) => {
      let isUpdated = false;

      formStructure.subformstructure?.forEach((subform: any) => {
        subform.fields?.forEach((field: any) => {
          if (parentFieldNames.includes(field.name)) {
            // Process onChange events
            eventDetails?.onChange?.forEach((event: any) => {
              if (event.event === "updatechild") {
                formStructure.subformstructure?.forEach((innerSubform: any) => {
                  innerSubform.fields?.forEach((innerField: any) => {
                    event.fieldsUpdate?.forEach((update: any) => {
                      if (update.name === innerField.name) {
                        update.feildnkeys?.forEach((keyUpdate: any) => {
                          if (
                            keyUpdate.checkcondition === selectedValue ||
                            keyUpdate.checkcondition === "directaddvalue"
                          ) {
                            innerField[keyUpdate.name] = keyUpdate.value;
                            if (keyUpdate.name === "value") {
                              setTimeout(() => {
                                setValue(innerField.name, keyUpdate.value, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                              }, 0);
                            }
                          }
                        });
                      }
                    });
                  });
                });
              }
            });

            // Set field to edit mode
            field.mode = "super-edit";

            // Reset the field value
            setTimeout(() => {
              setValue(field.name, "", {
                shouldValidate: true,
                shouldDirty: true,
              });
            }, 0);

            // Clear child fields if needed
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

            // Handle fieldsUpdate from eventDetails if provided
            if (
              eventDetails?.fieldsUpdate &&
              Array.isArray(eventDetails.fieldsUpdate)
            ) {
              applyFieldUpdates(
                eventDetails.fieldsUpdate,
                setValue,
                selectedValue
              );
            }

            isUpdated = true;
          }
        });
      });

      return isUpdated;
    },
    [formStructure, clearAllDescendantOptions, applyFieldUpdates]
  );

  /**
   * Setup function to initialize event handlers for a form structure
   */
  const setupEventHandlers = useCallback(() => {
    formStructure.subformstructure?.forEach((subform: any) => {
      subform.fields?.forEach((field: any) => {
        field.onChange?.forEach((event: any) => {
          if (event.event === "updatechild") {
            event.function = handleFieldEvent;
          }
        });
      });
    });

    // Setup other form actions if needed
    formStructure.actions?.forEach((action: any) => {
      if (action.action === "close") {
        // action.function = cancelForm; // Implement if needed
      }
    });
  }, [formStructure, handleFieldEvent]);

  /**
   * Factory function to create an event controller for specific events
   * This preserves the original function signature from your code
   */
  const createEventController = useCallback(() => {
    return (
      parentFieldNames: string[],
      setValue: any,
      selectedValue?: any,
      eventDetails?: any
    ) =>
      handleFieldEvent(parentFieldNames, setValue, selectedValue, eventDetails);
  }, [handleFieldEvent]);

  return {
    handleFieldEvent,
    setupEventHandlers,
    clearAllDescendantOptions,
    applyFieldUpdates,
    createEventController,
  };
};
