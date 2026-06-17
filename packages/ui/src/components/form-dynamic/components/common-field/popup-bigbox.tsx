"use client";
import BigPopupWrapper from "../../../popupwrapper/big-popup-wrapper";
import MiniPopupWrapper from "../../../popupwrapper/mini-popup-wrapper";
import React, { useEffect } from "react";
import RecursiveFormStructure from "../../form-structure";
import { useFormContext } from "../../../../context/FormContext";

interface PopupBigBoxProps {
  field: any;
  tag: string;
  fields: any;
}

function PopupBigBox({
  field,
  tag,
  fields,
}: PopupBigBoxProps) {
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
  const popupContent = {
    title: "Generate New Report",
    description:
      "Generate new report showing trends, insights, and updated key data.",
  };

  useEffect(() => {
    if(field?.mode=="hidden") {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [field?.mode]);

  const handleSetOpen: React.Dispatch<React.SetStateAction<boolean>> = (val) => {
    if (field?.onChange?.length > 0) {
      field.onChange.forEach((event: any) => {
        if (event.event === "updatechild") {
          setTimeout(() => {
            eventHandler(field?.children, setValue, val, field);
          }, 0);
        }
      });
    }
  };

  return (
    <>
      <BigPopupWrapper content={popupContent} setOpen={handleSetOpen} open={open}>
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
      </BigPopupWrapper>
    </>
  );
}

export default PopupBigBox;
