"use client";

import * as React from "react";
import { cn } from "../../../../utils/shadcnui/cn";
import RecursiveFormStructure from "../../form-structure";
import { useFunctionHandle } from "../../../../hooks/form-dynamic/useFunctionHandle";
import { useFormContext } from "../../../../context/FormContext";
import { Card, CardTitle, CardDescription, CardContent } from "../../../ui/card";
import { getIconComponent } from "../../../icon/icon-map";

interface CardFormProps {
  field: any;
  tag: string;
  fields: any;
}

export function CardForm({
  field,
  tag,
  fields,
}: CardFormProps) {
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
    setFormError,
    functionToHandleEvent,
    tabController,
    fromValue,
    setFormValue,
    messenger,
    setMessenger,
    fieldUpdateControl,
    onFieldUpdate
  } = useFormContext();

  const { handleFieldFunctions } = useFunctionHandle(setValue, setFormError, watch, formStructure, functionToHandleEvent, validateRequiredFields);

  React.useEffect(() => {
    if (field?.functions?.length > 0) {
      handleFieldFunctions(field);
    }
    field?.onChange?.forEach((event: any) => {
      if (event.event === "updatechild") {
        setTimeout(() => {
          eventHandler(field.children, setValue, field.value, field);
        }, 0);
      }
    });
  }, []);

  // Get the icon component from the icon map
  const IconComponent = getIconComponent(field.icon);

  return (
    <Card className="border-0 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
        <CardTitle className="text-2xl text-white flex items-center gap-3">
          <IconComponent className="w-6 h-6" />
          {field.title}
        </CardTitle>
        <CardDescription className="text-blue-100 mt-2">
          {field.description}
        </CardDescription>
      </div>
      <CardContent className="p-8 space-y-8">
        {field?.subformstructure?.length > 0 && (
          <div className="grid grid-cols-12 gap-4 w-full">
            {field.subformstructure.map((group: any, i: number) => (
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
      </CardContent>
    </Card>
  );
} 