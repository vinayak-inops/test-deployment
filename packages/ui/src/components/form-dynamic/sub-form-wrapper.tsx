import React from "react";
import RecursiveFormStructure from "./form-structure";
import { useFormContext } from "../../context/FormContext";

function SubFormWrapper() {
  const { formStructure } = useFormContext();

  // Add validation to ensure formStructure is properly initialized
  if (!formStructure || !formStructure.subformstructure) {
    return null;
  }

  return (
    <>
      {formStructure.subformstructure.map((group: any, i: any) => (
        <React.Fragment key={i}>
          <RecursiveFormStructure
            fields={group.fields}
            subformstructure={{
              formgrid: group.group,
              classvalue: group.classvalue,
              title: group.title,
              component: group.component,
            }}
          />
        </React.Fragment>
      ))}
    </>
  );
}

export default SubFormWrapper;
