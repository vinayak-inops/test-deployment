"use client";

import { Button } from "../../../ui/button";
import { Plus } from "lucide-react";
import React, { JSX, useEffect, useMemo, useState } from "react";
import InputField from "./input-field";
import SelectField from "./select-field";
import TextAreaField from "./text-area-field";
import RadioGroupField from "./radio-group-field";
import CheckboxField from "./checkbox-field";
import LogoUploadForm from "./logo-upload-form";
import RadioButton from "./radio-button";
import SelectInputField from "./select-input-field";
import Table from "../../../table-dynamic/data-table";
import { cn } from "../../../../utils/shadcnui/cn";
import { extractAndGroupFieldss } from "../../../../utils/form-dynamic/filter-fields";
import { groupTableFormFields } from "../../../../utils/form-dynamic/fields-value";
import SelectForm from "./select-form";
import TestDisplay from "./test-display";
import RecursiveFormStructure from "../../form-structure";
import { useFormContext } from "../../../../context/FormContext";
import SmallTextValue from "../preview-text/small-text-value";

interface TableFormProps {
  field: any;
  tag: string;
  fields: any;
}

function TableForm({
  field,
  tag,
  fields,
}: TableFormProps) {
  const { setValue, watch, register, control,setFormValue,fromValue } = useFormContext();
  
  // Group fields for table structure
  const groupedFields = useMemo(
    () => extractAndGroupFieldss(fields) as any[][],
    [fields]
  );

  // Get table form fields structure
  const output = useMemo(
    () => groupTableFormFields(groupedFields),
    [groupedFields]
  );

  // State for rendered rows
  const [rows, setRows] = useState<any[]>([]);

  // Initialize table data from field.tabledata and set in form
  useEffect(() => {
    const initialData = (field.tabledata || []).map((row: any, index: number) => ({
      _id: `${field.name}-table${index + 1}`,
      ...fields.reduce((acc: any, fieldItem: any) => {
        if (fieldItem.formgrid === tag) {
          acc[fieldItem.name] = row[fieldItem.name] || '';
        }
        return acc;
      }, {})
    }));
    
    // Set initial data in form state
    setValue(field.name, initialData);
    // if(setFormValue){
    //   setFormValue((prev: any) => ({
    //     ...prev,
    //     [field.name]: initialData
    //   }));
    // }
  }, [field.tabledata, field.name, fields, tag, setValue]);

  // Watch the table data from form
  const formData = watch(field.name);

  // Register all fields with their values
  useEffect(() => {
    if (!fromValue) return;
    // const updatedData = fromValue[field.name]?.map((row: any, index: number) => {
    //   return Object.entries(row).map(([key, value]) => {
    //       return {
    //         ...row,
    //         [key]: watch(`${field.name}-${key}-table${index + 1}`)
    //       }
    //   })
    // })
    // if(setFormValue){
    //   setFormValue((prev: any) => ({
    //     ...prev,
    //     [field.name]: updatedData
    //   }));
    // }
    
    // setValue(field.name, tableData)

  }, [field.name, fields, tag, formData, register, setValue, watch]);

  // Transform data for table display
  useEffect(() => {
    if (!formData) return;

    const areAllItemsEmpty = output.every((item: any) => 
      Object.keys(item).length === 0 || 
      Object.values(item).every(val => 
        Array.isArray(val) && val.length === 0
      )
    );

    if (areAllItemsEmpty && formData.length > 0) {
      setRows(formData);
      return;
    }

    const transformedData = output.map((item: any, rowIndex: number) => {
      const row: any = {};
      const tableRow = formData[rowIndex];

      if (tableRow) {
        // Copy all values from tableRow
        Object.entries(tableRow).forEach(([key, value]) => {
          row[key] = value;
        });
      }

      // Add form components
      Object.entries(item).forEach(([columnName, components]) => {
        const typedComponents = components as any[];
        row[columnName] = (
          <div className="flex flex-col gap-2">
            {typedComponents?.map((fieldItem: any, index: number) => {
              if (fieldItem?.formgrid !== tag) return null;
              const fieldName = `${fieldItem.name}`;
              const fieldValue = watch(fieldName) || tableRow?.[fieldItem.name] || '';

              const updatedField = {
                ...fieldItem,
                name: fieldName
              };

              const commonProps = {
                field: updatedField,
                tag: updatedField.formname || tag,
                fields: [updatedField],
                control
              };

              return (
                <div
                  className={cn("px-2", fieldItem.classvalue?.container)}
                  key={`${updatedField.name}-${index}`}
                >
                  {(() => {
                    switch (fieldItem.tag) {
                      case "input": return <InputField {...commonProps} />;
                      case "select": return <SelectField {...commonProps} />;
                      case "textarea": return <TextAreaField {...commonProps} />;
                      case "radio": return <RadioGroupField {...commonProps} />;
                      case "checkbox": return <CheckboxField {...commonProps} />;
                      case "logoupload": return <LogoUploadForm {...commonProps} />;
                      case "radiobutton": return <RadioButton {...commonProps} />;
                      case "selectinput": return <SelectInputField {...commonProps} />;
                      case "select-form": return <SelectForm {...commonProps} />;
                      case "text-display": return <TestDisplay {...commonProps} />;
                      case "small-text-value": return <SmallTextValue {...commonProps} />;
                      default: return null;
                    }
                  })()}
                </div>
              );
            })}
          </div>
        );
      });

      return row;
    });

    setRows(transformedData);
  }, [output,field.name]);

  // Handle table structure and add new row functionality
  const [tableStructure, setTableStructure] = useState<any>(field.funtinality);

  // useEffect(() => {
  //   setTableStructure((prevState: any) => {
  //     let newState: any = { ...prevState };
      
  //     if (prevState?.buttons?.addnew?.status) {
  //       newState = {
  //         ...prevState,
  //         buttons: {
  //           ...prevState.buttons,
  //           addnew: {
  //             ...prevState.buttons.addnew,
  //             function: () => {
  //               // Create new empty row
  //               const newRow = {
  //                 _id: `${field.name}-table${(formData?.length || 0) + 1}`,
  //                 ...fields.reduce((acc: any, fieldItem: any) => {
  //                   if (fieldItem.formgrid === tag) {
  //                     acc[fieldItem.name] = '';
  //                   }
  //                   return acc;
  //                 }, {})
  //               };
                
  //               setValue(field.name, [...(formData || []), newRow]);
  //             }
  //           }
  //         }
  //       };
  //     }
      
  //     return newState;
  //   });
  // }, [field.functionality, field.name, fields, tag, formData, setValue]);

  return (
    <div className="">
      <Table 
        data={rows} 
        functionalityList={tableStructure} 
      />
    </div>
  );
}

export default TableForm;