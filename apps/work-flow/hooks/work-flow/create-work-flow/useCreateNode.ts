import { InfoNodeProps } from "@/type/work-flow/create-work-flow/hooks-props";

export function useCreateNode() {
  const createInfoNode = (props: InfoNodeProps) => {
    const {
      infoNodeId,
      type,
      position,
      nodeType,
      selectedNodeData,
      updateNodeType,
      nodeDimensions,
      parentStateName,
      deleteFunctionLocal,
      updateNodeValueLocal,
      addNewStateLocal,
    } = props;

    return {
      id: infoNodeId,
      type: "custom",
      position: position,
      data: {
        nodeType: nodeType,
        stateData: type.stateData,
        modeOfSelect: "select",
        connectedHandles: {
          left: "target",
          right: "source",
        },
        parentStateName: parentStateName,
        action: "create",
        parentInfoNodeId: selectedNodeData?.id,
        presentNodeId: infoNodeId,
        updateNodeType: updateNodeType,
        dimensions: nodeDimensions,
        deleteFunctionLocal: deleteFunctionLocal,
        updateNodeValueLocal: updateNodeValueLocal, 
        addNewStateLocal: addNewStateLocal,
      },
    };
  };

  return { createInfoNode };
}
