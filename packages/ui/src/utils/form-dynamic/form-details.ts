import { updateFieldOptions, updateFieldValue } from "./fields-value";

// Event handler: fetchFormDetails
export const fetchFormDetails = (
  eventData: any,
  department: any,
  setValue: any
) => {
  if (!Array.isArray(department)) {
    return;
  }

  const matchingDepartment =
    department.find((e) => e.name === eventData.newValue) || {};

  if (Object.keys(matchingDepartment).length === 0) {
    
    return;
  }

  // Updating state with all matching key-value pairs at once
  setValue(matchingDepartment);
};

export const updateChild = (
  args: { field: string; newValue: any },
  setFormStructure: (callback: (prevStructure: any) => any) => void,
  data: Array<{ subsidiaryName: string }>,
  setValue: any
) => {
  setFormStructure((prevStructure: any) => {
    const { field, newValue } = args;
    const updatedFields = updateFieldValue(
      prevStructure.fields,
      field,
      newValue // Update the field with the new value
    );

    const updateValue = data.map((e: any, i: number) => {
      return {
        label: e.subsidiaryName,
        value: e.subsidiaryName,
      };
    });

    // Check if the field has a `nextlink` and needs to update options
    const updatedFieldsWithOptions = updateFieldOptions(
      updatedFields,
      field,
      updateValue,
      setValue
    );

    return { ...prevStructure, fields: updatedFieldsWithOptions };
  });
};

// Helper function to check and trigger the event handler
export const triggerEvent = (
  object: any,
  eventName: string,
  args: any,
  department: any,
  setValue: any,
  setFormStructure: any,
  data: any
) => {
  // ✅ Handle onChange as an array (correct way)
  if (Array.isArray(object?.onChange)) {
    object.onChange.forEach((eventObj: any) => {
      if (eventObj.event === eventName && typeof eventObj.function === "function") {
        eventObj.function(
          [object.name],                // parentFieldNames
          setValue,                     // setValue function
          args.newValue,                // selectedValue
          {
            ...args,                    // existing args (field, newValue)
            fieldsUpdate: eventObj.fieldsUpdate || [] // ✅ Now fieldsUpdate passed properly
          }
        );
      }
    });
  }

  // ✅ Still support recursion into children (no change)
  if (object.children && object.children.length > 0) {
    object.children.forEach((child: any) =>
      triggerEvent(child, eventName, args, department, setValue, setFormStructure, data)
    );
  }
};


