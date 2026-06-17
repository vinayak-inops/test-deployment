"use client";
import { Dispatch, SetStateAction, useState } from "react";
import { Position, NodeProps, useReactFlow } from "reactflow";
import CircleNode from "./common/circle-node";
import StartFlow from "./common/start-flow";
import DefaltNode from "./common/defalt-node";
import InfoNode from "./common/info-node";
import {
  addNewState,
  deleteFunction,
  formatText,
  updateNodeValue,
} from "@/utils/work-flow/create-work-flow/cudtom-node";
import { CustomNodeData } from "@/type/work-flow/create-work-flow/props";

function CustomNode({ data, selected, id }: NodeProps<CustomNodeData>) {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const handleStyle = {
    width: "10px",
    height: "10px",
    background: "#2563eb",
    border: "2px solid white",
    opacity: data?.selected ? 0 : 0,
  };
  const { setNodes } = useReactFlow();
  const deleteFunctionLocal = function(){
    data.deleteFunctionLocal(data, id);
  }
  const updateNodeValueLocal = data.updateNodeValueLocal;
  const addNewStateLocal = data.addNewStateLocal;
  // Delete nodes from the node list
  // function deleteFunctionLocal() {
  //   deleteFunction(data, id, setNodes);
  // }

  // Update the node values
  // function updateNodeValueLocal() {
  //   updateNodeValue(setNodes, selectedId);
  // }

  //Add new value to workflow
  // function addNewStateLocal() {
  //   addNewState(setNodes, selectedId);
  // }

  //Dividing a sentence into an array of strings
  const formattedLines = formatText(data?.stateData?.state?.title || "");

  // Handle control function
  const getHandleType = (position: string): "source" | "target" => {
    if (data.connectedHandles && data.connectedHandles[position]) {
      return data.connectedHandles[position];
    }
    switch (data.nodeType) {
      case "arrow":
        return position === "right" || position === "bottom"
          ? "source"
          : "target";
      case "diamond":
        return selected ? "source" : "target";
      case "circle":
        return selected ? "source" : "target";
      default:
        return selected ? "source" : "target";
    }
  };

  return (
    <>
      {/* Control the node design according to the workflow */}
      {(() => {
        switch (data.nodeType) {
          case "start-flow":
            return (
              <StartFlow
                data={data}
                Position={Position}
                handleStyle={handleStyle}
                selected={selected}
                formattedLines={formattedLines}
              />
            );
          case "circle":
            return (
              <CircleNode
                data={data}
                getHandleType={getHandleType}
                handleStyle={handleStyle}
                formattedLines={formattedLines}
                deleteFunction={deleteFunctionLocal}
                updateNodeValue={updateNodeValueLocal}
                addNewState={addNewStateLocal}
                setSelectedId={setSelectedId}
              />
            );
          case "info":
            return (
              <InfoNode
                data={data}
                getHandleType={getHandleType}
                handleStyle={handleStyle}
              />
            );
          case "defalt":
            return (
              <DefaltNode
                selected={selected}
                setOpenSelectBox={data.setOpenSelectBox}
              />
            );
          default:
            return null;
        }
      })()}
    </>
  );
}

export { CustomNode };
