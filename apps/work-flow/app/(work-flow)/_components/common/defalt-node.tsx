import IconComponent from "@/components/icon/icon-component";
import { DefaltNodeProps } from "@/type/work-flow/create-work-flow/props";
import React, { Dispatch, SetStateAction } from "react";

function DefaltNode({
  selected,
  setOpenSelectBox,
}: DefaltNodeProps) {
  return (
    <div
      className={`flex flex-col items-center relative ${selected ? "pb-[0.1px]" : "pb-0"}`}
    >
      <div>
        <button
          onClick={() => setOpenSelectBox && setOpenSelectBox(true)}
          className={`px-2 py-2 shadow-md w-9 h-9 rounded-xl  bg-white border-2 border-dotted ${selected ? "border-[#343439]" : "border-[#344767]"}`}
        >
          <div className="flex items-center justify-center text-[#242424] h-full">
            <IconComponent
              icon={"Plus"}
              size={15}
              className={"h-4 w-4 text-[#242424]"}
            />
          </div>
        </button>
      </div>
    </div>
  );
}

export default DefaltNode;
