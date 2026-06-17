"use client";

import { Button } from "@repo/ui/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import { useDispatch } from "react-redux";
import {
  setFormTab,
  setOpenWorkFlow,
} from "@inops/store/src/slices/features/work-flow/create-work-flow/workflow-slice";
import { FormNavigationButtonProps } from "@/type/work-flow/create-work-flow/props";
import IconComponent from "@/components/icon/icon-component";

export const FormNavigationButton = ({
  showBackButton,
  onBackClick,
}: FormNavigationButtonProps) => {
  const dispatch = useDispatch();

  return (
    <div className="flex absolute z-40 top-4 right-4 space-x-2">
      <Button
        variant="outline"
        size="icon"
        className="bg-white border-0 shadow-lg"
        onClick={() =>
          dispatch(setOpenWorkFlow(false), dispatch(setFormTab("")))
        }
      >
        <IconComponent icon={"X"} size={15} className={"h-4 w-4"} />
      </Button>
      {showBackButton && (
        <Button
          variant="outline"
          size="icon"
          className=""
          onClick={onBackClick}
        >
          <IconComponent icon={"ArrowLeft"} size={15} className={"h-4 w-4"} />
        </Button>
      )}
    </div>
  );
};
