"use client";

import React, { useEffect, useState } from "react";
import ProgressSteps from "./progress-steps";
import RecursiveFormStructure from "../../form-structure";
import { useLocalStorageSync } from "../../../../hooks/form-dynamic/useLocalStorageSync";
import { useFormContext } from "../../../../context/FormContext";

interface ProgressStep {
  label: string;
  date: string;
  completed: boolean;
}

interface PayrollRun {
  id: string;
  country: string;
  countryCode: string;
  company: string;
  amount?: string;
  status?: string;
  steps: ProgressStep[];
  payDay: string;
  action: {
    label: string;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  };
}

interface ProgressFormProps {
  field: any;
  tag: string;
  fields: any;
}

export default function ProgressForm({
  field,
  tag,
  fields,
}: ProgressFormProps) {
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

  const [activeTab, setActiveTab] = React.useState(field?.activeTab);

  useEffect(() => {
    setActiveTab(field?.activeTab);
  }, [field?.activeTab]);

  return (
    <div className={`w-full ${field?.classvalue?.container} pr-2 pt-0 mx-auto`}>
      <div className="space-y-4">
        <PayrollCard key={field?.name} field={field} />
      </div>

      <div className={` grid grid-cols-12 gap-2 w-full mt-6`}>
        {field?.subformstructure?.length > 0 &&
          field?.subformstructure?.map(
            (group: any, i: number) =>
              group.tabs.includes(activeTab) && (
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
              )
          )}
      </div>
    </div>
  );
}

function PayrollCard({ field }: { field: any }) {
  const {
    setValue,
    eventHandler,
    setError,
    functionToHandleEvent,
    validateRequiredFields,
    formStructure,
    fromValue,
    setFormValue,
    setMessenger
  } = useFormContext();

  return (
    <div className=" p-0 ">
      <div className="">
        <ProgressSteps
          field={field}
          setValue={setValue}
          eventHandler={eventHandler}
          functionToHandleEvent={functionToHandleEvent}
          validateRequiredFields={validateRequiredFields}
          formStructure={formStructure}
          setError={setError}
          localStorageData={null}
          fromValue={fromValue}
          setFormValue={setFormValue}
          setMessenger={setMessenger}
        />
      </div>
    </div>
  );
}
