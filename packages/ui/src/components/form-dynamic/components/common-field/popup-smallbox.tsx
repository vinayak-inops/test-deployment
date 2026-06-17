"use client";
import BigPopupWrapper from "../../../popupwrapper/big-popup-wrapper";
import MiniPopupWrapper from "../../../popupwrapper/mini-popup-wrapper";
import React, { useEffect, useState } from "react";
import RecursiveFormStructure from "../../form-structure";
import { useStateTracker } from "../../../../hooks/form-dynamic/useStateTracker";
import { useFormContext } from "../../../../context/FormContext";

interface PopupSmallBoxProps {
  field: any;
  tag: string;
  fields: any;
}

function PopupSmallBox({
  field,
  tag,
  fields,
}: PopupSmallBoxProps) {
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

  const popupContent = {
    title: field?.title,
    description: field?.description,
  };
  const [open, setOpen] = useState(true);

  // Function to handle the popup state update logic
  const updatePopupState = () => {
    const storedValue = localStorage.getItem("callThePopupButtontesttwo");
    if (storedValue) {
      try {
        const parsedValue = JSON.parse(storedValue);
        if (parsedValue && Object.keys(parsedValue).length > 0) {
          
          parsedValue?.functions?.forEach((func: any) => {
            if (func.function === "updateElement") {
              func.fieldsUpdate.forEach((fieldUpdate: any) => {
                fieldUpdate.feildnkeys.forEach((keyUpdate: any) => {
                  
                  if (keyUpdate.templateValue === "mode") {
                    setOpen(keyUpdate.value);
                  }
                });
              });
            }
          });
        }
      } catch (error) {
        
      }
    }
  };

  useEffect(() => {
    // Initial check
    updatePopupState();

    // Listen for storage events (for cross-tab changes)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "callThePopupButtontesttwo") {
        updatePopupState();
      }
    };

    // Listen for custom events (for same-tab changes from other components)
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === "callThePopupButtontesttwo") {
        updatePopupState();
      }
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleCustomStorageChange as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange as EventListener);
    };
  }, []); // Remove setOpen from dependencies since it's stable

  useEffect(()=>{
    if (messenger?.message?.[field.name]) {
      messenger.message[field.name].forEach((item: any) => {
        item?.functions?.forEach((func: any) => {
          if (func.function === "updateElement") {
            func.fieldsUpdate.forEach((fieldUpdate: any) => {
              fieldUpdate.feildnkeys.forEach((keyUpdate: any) => {
                if (keyUpdate.templateValue === "mode") {
                  setOpen(keyUpdate.value);
                }
              });
            });
          }
        });
      });
    }
  },[messenger])

  const handleSetOpen: React.Dispatch<React.SetStateAction<boolean>> = (
    val
  ) => {
    const buttonState = {
      parent: "AddLeaveArea",
      label: "Create Leave Policy",
      status: true,
      classvalue: {
        container: "col-span-12 mb-2",
        label: "text-gray-600",
        field: "p-1",
      },
      children: ["AddLeaveArea"],
      functions: [
        {
          function: "updateElement",
          fieldsUpdate: [
            {
              name: "AddLeaveArea",
              feildnkeys: [
                {
                  templateValue: "mode",
                  value: false,
                },
              ],
            },
          ],
        },
      ],
    };
    
    localStorage.setItem(
      "callThePopupButtontesttwo",
      JSON.stringify(buttonState)
    );
    // Directly update state for same-tab changes
    updatePopupState();
  };

  // useEffect(() => {
  //   if(!open){
  //     handleSetOpen(false)
  //   }
  // }, [open]);

  return (
    <>
      <MiniPopupWrapper
        content={popupContent}
        setOpen={setOpen}
        functionToClose={handleSetOpen}
        open={open}
      >
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
      </MiniPopupWrapper>
    </>
  );
}

export default PopupSmallBox;
