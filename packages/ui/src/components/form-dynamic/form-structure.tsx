import React from "react";
import { useFormContext } from "../../context/FormContext";
import InputHandler from "./components/common-field/input/input-handler";
import SelectField from "./components/common-field/select-field";
import TextAreaField from "./components/common-field/text-area-field";
import RadioGroupField from "./components/common-field/radio-group-field";
import CheckboxField from "./components/common-field/checkbox-field";
import { cn } from "../../utils/shadcnui/cn";
import LogoUploadForm from "./components/common-field/logo-upload-form";
import { extractAndGroupFieldss } from "../../utils/form-dynamic/filter-fields";
import RadioButton from "./components/common-field/radio-button";
import SelectInputField from "./components/common-field/select-input-field";
import SelectForm from "./components/common-field/select-form";
import TableForm from "./components/common-field/table-form";
import { TabsForm } from "./components/common-field/tads-form";
import { CardForm } from "./components/common-field/card-form";
import MultiSelectDropdown from "./components/common-field/multi-select-dropdown";
import PopupBigBox from "./components/common-field/popup-bigbox";
import ButtonField from "./components/common-field/button-field";
import PopupSmallBox from "./components/common-field/popup-smallbox";
import ProgressForm from "./components/common-field/progress-form";
import TestDisplay from "./components/common-field/test-display";
import SingleSelectDropdown from "./components/common-field/single-checkbox-selector";
import { PreviewSection } from "./components/common-field/preview-section";
import ValueArray from "./components/common-field/value-array";
import { ContainerSection } from "./components/common-field/container-section";
import DynamicForm from "./dynamic-form";
import SingleSelectFilterDropdown from "./components/common-field/single-select-dropdown";

interface RecursiveFormStructureProps {
  fields: any[];
  subformstructure: {
    formgrid: string;
    classvalue: string;
    title: string;
    component?: any;
  };
}

function RecursiveFormStructure({
  fields,
  subformstructure,
}: RecursiveFormStructureProps) {
  const {
    formStructure,
    fromValue,
    setFormValue,
    messenger,
    setMessenger,
    hiddenFields
  } = useFormContext();

    

  const groupedFields = extractAndGroupFieldss(fields);

  // Add validation to ensure formStructure is properly initialized
  if (!formStructure) {
    return null;
  }

  return (
    <div className={cn("gap-4", subformstructure.classvalue)}>
      <div className={`${subformstructure?.component?.title?.container} mb-4`}>
        <h2 className={`text-lg text-[#111827] font-semibold ${subformstructure?.component?.title?.heading}`}>
          {subformstructure?.title}
        </h2>
      </div>
      {groupedFields.map((group: any, i) => (
        <div className={`grid grid-cols-12 gap-3 ${group.classvalue}`} key={i}>
          {group.map((field: any, index: number) => {
            
            return (
              field.formgrid == "none" &&
              field.mode != "hidden" && !hiddenFields.includes(field.name) && (
                <div className={cn(field.classvalue.container)} key={index}>
                  {(() => {
                    const commonProps = {
                      field,
                      tag: field.formname,
                      fields
                    };

                    switch (field.tag) {
                      case "input":
                        return field.formgrid == "none" ? (
                          <InputHandler {...commonProps} />
                        ) : null;
                      case "value-array":
                        return field.formgrid == "none" ? (
                          <ValueArray {...commonProps} />
                        ) : null;
                      case "text-display":
                        return field.formgrid == "none" ? (
                          <TestDisplay {...commonProps} />
                        ) : null;
                      case "select":
                        return field.formgrid == "none" ? (
                          <SelectField {...commonProps} />
                        ) : null;
                      case "single-select":
                        return field.formgrid == "none" ? (
                          <SingleSelectDropdown {...commonProps} />
                        ) : null;
                      case "textarea":
                        return field.formgrid == "none" ? (
                          <TextAreaField {...commonProps} />
                        ) : null;
                      case "radio":
                        return field.formgrid == "none" ? (
                          <RadioGroupField {...commonProps} />
                        ) : null;
                      case "checkbox":
                        return field.formgrid == "none" ? (
                          <CheckboxField {...commonProps} />
                        ) : null;
                      case "logoupload":
                        return field.formgrid == "none" ? (
                          <LogoUploadForm {...commonProps} />
                        ) : null;
                      case "button":
                        return field.formgrid == "none" ? (
                          <ButtonField {...commonProps} />
                        ) : null;
                      case "radiobutton":
                        return field.formgrid == "none" ? (
                          <RadioButton {...commonProps} />
                        ) : null;
                      case "selectinput":
                        return field.formgrid == "none" ? (
                          <SelectInputField {...commonProps} />
                        ) : null;
                      case "multi-select":
                        return field.formgrid == "none" ? (
                          <MultiSelectDropdown {...commonProps} />
                        ) : null;
                      case "single-select-filter":
                        return field.formgrid == "none" ? (
                          <SingleSelectFilterDropdown {...commonProps} />
                        ) : null;
                      case "select-form":
                        return field.formgrid == "none" ? (
                          <SelectForm {...commonProps} />
                        ) : null;
                      case "table-form":
                        return field.formgrid == "none" ? (
                          <TableForm {...commonProps} />
                        ) : null;
                      case "tabs-form":
                        return field.formgrid == "none" ? (
                          <TabsForm {...commonProps} />
                        ) : null;
                      case "container-section":
                        return field.formgrid == "none" ? (
                          <ContainerSection {...commonProps} />
                        ) : null;
                      case "preview-section":
                        return field.formgrid == "none" ? (
                          <PreviewSection {...commonProps} />
                        ) : null;
                      case "popup-bigbox":
                        return field.formgrid == "none" ? (
                          <PopupBigBox {...commonProps} />
                        ) : null;
                      case "progress-form":
                        return field.formgrid == "none" ? (
                          <ProgressForm {...commonProps} />
                        ) : null;
                      case "popup-smallbox":
                        return field.formgrid == "none" ? (
                          <PopupSmallBox {...commonProps} />
                        ) : null;
                      case "sub-form":
                        return field.formgrid == "none" && field.FormStructure ? (
                          <DynamicForm 
                            department={field.FormStructure} 
                            setFormValue={setFormValue} 
                            fromValue={fromValue} 
                            messenger={messenger}
                            setMessenger={setMessenger} 
                          />
                        ) : null;
                      case "dummy":
                        return field.formgrid == "none" ? (
                          <div className="w-full"></div>
                        ) : null;
                      case "card-form":
                        return field.formgrid == "none" ? (
                          <CardForm {...commonProps} />
                        ) : null;
                      default:
                        return null;
                    }
                  })()}
                </div>
              )
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default RecursiveFormStructure;
