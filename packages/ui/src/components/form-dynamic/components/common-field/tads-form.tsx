"use client";

import * as React from "react";
import { cn } from "../../../../utils/shadcnui/cn";
import RecursiveFormStructure from "../../form-structure";
import { useFunctionHandle } from "../../../../hooks/form-dynamic/useFunctionHandle";
import { useFormContext } from "../../../../context/FormContext";

interface FilterTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: {
    id: string;
    label: string;
  }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

interface TabsFormProps {
  field: any;
  tag: string;
  fields: any;
}

export function TabsForm({
  field,
  tag,
  fields,
}: TabsFormProps) {
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

  const [activeTab, setActiveTab] = React.useState(field?.tabs[0]?.value);
  const { handleFieldFunctions } = useFunctionHandle(setValue, setError, watch, formStructure, functionToHandleEvent, validateRequiredFields);

  React.useEffect(() => {
    handleFieldFunctions(field?.tabs[0])
    field?.tabs[0]?.onChange?.forEach((event: any) => {
      if (event.event === "updatechild" ) {
        setTimeout(() => {
          eventHandler(field?.tabs[0]?.children, setValue, field?.tabs[0]?.value, field?.tabs[0]);
        }, 0);
      }
    });
    
    // Initialize messenger value with first tab
    if (field?.tabs[0]?.value) {
      setMessenger?.(prev => ({
        ...prev,
        messengerValue: prev?.messengerValue ? 
          prev.messengerValue.map((item: any) => 
            item.name === field.name ? { 
              ...item, 
              value: field.tabs[0].value
            } : item
          ) : 
          [{
            name: field.name,
            value: field.tabs[0].value
          }]
      }));
    }
  }, []);

  function handleTabChange(tab: any) {
    handleFieldFunctions(tab)
  }

  return (
    <div className={cn("rounded-md bg-white")}>
      <div className="mb-2 border-b border-[#eef2f6]">
        {field?.tabs.map((tab: any) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.value);
              if(tab?.functions?.length > 0){
                handleTabChange(tab)
              }
              tab?.onChange?.forEach((event: any) => {
                if (event.event === "updatechild") {
                  setTimeout(() => {
                    eventHandler(tab.children, setValue, tab.value, tab);
                  }, 0);
                }
              });
              setMessenger?.(prev => ({
                ...prev,
                messengerValue: prev?.messengerValue ? 
                  prev.messengerValue.map((item: any) => 
                    item.name === field.name ? { 
                      ...item, 
                      value: tab.value,
                    } : item
                  ) : 
                  [{
                    name: field.name,
                    value: tab.value ,
                  }]
              }))
            }}
            className={cn(
              "px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-[#0061ff] font-semibold"
                : "bg-white text-gray-700 hover:bg-gray-100"
            )}
          >
            {tab.label}
          </button>
        ))}
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