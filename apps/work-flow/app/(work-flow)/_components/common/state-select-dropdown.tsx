import IconComponent from "@/components/icon/icon-component";
import { setFormTab } from "@inops/store/src/slices/features/work-flow/create-work-flow/workflow-slice";
import { Pencil, Plus, Trash2 } from "lucide-react";
import React from "react";
import { useDispatch } from "react-redux";

function StateSelectDropdown({
  deleteFunction,
  updateNodeValue,
  data,
  addNewState
}: {
  deleteFunction: any;
  updateNodeValue: any;
  data: any;
  addNewState:any
}) {
  const dispatch = useDispatch();
  return (
    <div className="w-full flex justify-center top-12">
      <div className="flex gap-2">
        <button
          onClick={() => {
            deleteFunction();
          }}
          className="flex items-center gap-1.5 px-1 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-full border-[1px] border-red-500 hover:bg-red-100 transition-colors"
        >
          <IconComponent icon={"Trash2"} size={10} className={"h-2 w-2"} />
        </button>
        {data.presentNodeId.slice(0, 17) != "circle-start-flow" && (
          <>
            <button
              onClick={() => {
                updateNodeValue();
              }}
              className="flex items-center gap-1.5 px-1 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-full border-[1px] border-blue-500 hover:bg-blue-100 transition-colors"
            >
              <IconComponent icon={"Pencil"} size={10} className={"h-2 w-2"} />
            </button>
          </>
        )}
        <button
          onClick={() => {
            dispatch(setFormTab("state"));
          }}
          className="flex items-center gap-1.5 px-1 py-1 text-sm font-medium text-[#344767] bg-[#f4f4f5] rounded-full border-[1px] border-[#344767] hover:bg-blue-100 transition-colors"
        >
          <IconComponent icon={"Plus"} size={10} className={"h-2 w-2"} />
        </button>
      </div>
    </div>
  );
}

export default StateSelectDropdown;
