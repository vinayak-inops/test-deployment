"use client";
import { useCallback } from "react";
import { Node, useEdgesState, useNodesState, useReactFlow } from "reactflow";
import { useNodeManagement } from "./useNodeManagement";
import { useNodePositioning } from "./useNodePositioning";
import { useEdgeManagement } from "./useEdgeManagement";
import { useViewportControls } from "./useViewportControls";
import { useDispatch } from "react-redux";
import { useCreateNode } from "./useCreateNode";
// import { setNodeData } from "@/lib/store/features/workflowSlice";

export const useCreateActualNode = (
  setNodes: ReturnType<typeof useNodesState>[1],
  setEdges: ReturnType<typeof useEdgesState>[1],
  screenToFlowPosition: ReturnType<typeof useReactFlow>["screenToFlowPosition"],
  createEdge: ReturnType<typeof useEdgeManagement>["createEdge"],
  centerOnNode: ReturnType<typeof useViewportControls>["centerOnNode"],
  findNextVerticalPosition: ReturnType<
    typeof useNodePositioning
  >["findNextVerticalPosition"],
  NODE_SPACING: number,
  updateNodeType: ReturnType<typeof useNodeManagement>["updateNodeType"],
  setSelectedNode: React.Dispatch<React.SetStateAction<string | undefined>>,
  parentStateName:string,
  deleteFunctionLocal:any,
  updateNodeValueLocal:any,
  addNewStateLocal:any
) => {
  
  return useCallback(
    (
      type: any,
      parentNodeId?: string,
      parentPosition?: { x: number; y: number },
      parentDimensions?: { width: number; height: number },
    ) => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const centerX = viewportWidth / 2;
      const centerY = viewportHeight / 2;
      const basePosition = screenToFlowPosition({ x: centerX, y: centerY });

      let position;
      if (type.node === "defalt") {
        position = basePosition;
      } else if (parentPosition && parentDimensions) {
        const targetX = parentPosition.x + NODE_SPACING;
        const nextY = findNextVerticalPosition(
          targetX,
          parentPosition.y,
          type.stateData.pathDirection
        );

        position = {
          x: targetX,
          y: nextY,
        };
      } else {
        position = basePosition;
      }

      const timestamp = Date.now();
      const newNodeId =
        type.node === "defalt"
          ? "defalt-root"
          : `${type.node}-${parentNodeId || "root"}-${timestamp}`;

      const { createInfoNode } = useCreateNode();

      // Then when you need to create an new node:
      const newNode = createInfoNode({
        infoNodeId: newNodeId,
        position: position,
        nodeType: type.node,
        type: { stateData: type.stateData },
        selectedNodeData: { id: `${parentNodeId}` },
        updateNodeType: updateNodeType,
        nodeDimensions: { width: 200, height: 100 },
        parentStateName:parentStateName?parentStateName:"",
        deleteFunctionLocal:deleteFunctionLocal,
  updateNodeValueLocal:updateNodeValueLocal,
  addNewStateLocal:addNewStateLocal
      });

      //   dispatch(setNodeData(newNode));
      setSelectedNode(newNodeId);

      setNodes((nodes) => 
        nodes.map((node:any) => ({
          ...node,
          data: {
            ...node.data,
            modeOfSelect: "notselect",
            action: "create",
          }
        }))
      );

      setNodes((currentNodes) => {
        if (type.node !== "defalt") {
          const nodesWithoutDefault = currentNodes.filter(
            (node) => !node.id.startsWith("defalt-")
          );
          if (type.node === "start-flow") {
            return [newNode];
          }
          return [...nodesWithoutDefault, newNode];
        }
        return [...currentNodes, newNode];
      });

      if (parentNodeId) {
        setEdges((currentEdges) => {
          const newEdge = createEdge(parentNodeId, newNodeId);
          return [...currentEdges, newEdge];
        });
      }

      requestAnimationFrame(() => {
        centerOnNode(newNodeId);
      });

      return newNodeId;
    },
    [
      setNodes,
      screenToFlowPosition,
      setEdges,
      createEdge,
      centerOnNode,
      findNextVerticalPosition,
      NODE_SPACING,
      updateNodeType,
    ]
  );
};
