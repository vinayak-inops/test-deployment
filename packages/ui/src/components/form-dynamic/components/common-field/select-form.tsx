"use client";

import { Button } from "../../../ui/button";
import { Plus } from "lucide-react";
import React from "react";
import { cn } from "../../../../utils/shadcnui/cn";
import RecursiveFormStructure from "../../form-structure";
import { useFormContext } from "../../../../context/FormContext";

interface SelectFormProps {
  field: any;
  tag: string;
  fields: any;
}

function SelectForm({
  field,
  tag,
  fields,
}: SelectFormProps) {
  const {
    setFormStructure,
    register,
    errors,
    setValue,
    control,
    eventHandler,
    valueUpdate,
    watch,
    formStructure,
    validateRequiredFields,
    setError,
    functionToHandleEvent,
    tabController,
    fromValue,
    setFormValue,
    messenger,
    setMessenger,
    fieldUpdateControl,
    onFieldUpdate
  } = useFormContext();

  const [open, setOpen] = React.useState(false);
  return (
    <div
      className={`rounded-xl overflow-hidden border border-gray-200 shadow-md bg-white col-span-12 ${field.classvalue.container}`}
    >
      <div className="bg-[#2563eb] p-2 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className={` ${field.classvalue.label}`}>{field.label}</h2>
        </div>
        <Button
          onClick={() => {
            setOpen((prev) => !prev);
          }}
          variant="ghost"
          className="bg-white/20 hover:bg-white/30 text-white rounded-full h-6 w-6 p-0"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      {open && (
        <div className="px-4 pb-4">
          {field?.subformstructure?.length > 0 &&
          field?.subformstructure?.map((group: any, i: number) => (
            <React.Fragment key={i}>
              <RecursiveFormStructure
                fields={group.fields}
                subformstructure={{
                  formgrid: group.group,
                  classvalue: group.classvalue,
                  title: group.title,
                }}
              />
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export default SelectForm;
