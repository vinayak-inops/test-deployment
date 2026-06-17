"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  useEdgesState,
  useNodesState,
  NodeTypes,
  Connection,
  useReactFlow,
} from "reactflow";
import type { Node, Edge } from "reactflow";
import Controls from "./controls";
import { useViewportControls } from "@/hooks/work-flow/create-work-flow/useViewportControls";
import { useEdgeManagement } from "@/hooks/work-flow/create-work-flow/useEdgeManagement";
import { useNodePositioning } from "@/hooks/work-flow/create-work-flow/useNodePositioning";
import { useNodeManagement } from "@/hooks/work-flow/create-work-flow/useNodeManagement";
import { useAddNode } from "@/hooks/work-flow/create-work-flow/useAddNode";
import { CustomNode } from "./custom-node";
import { Button } from "@repo/ui/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@inops/store/src/store";
import {
  setFormTab,
  setNodeData,
  setOpenWorkFlow,
} from "@inops/store/src/slices/features/work-flow/create-work-flow/workflow-slice";
import WorkflowTrigger from "./workflow-trigger";
import WorkFlowSubmit from "./common/work-flow-submit";
import { useUpdateConnectedHandles } from "@/hooks/work-flow/create-work-flow/useUpdateConnectedHandles";
import handleClickedNode from "@/utils/work-flow/create-work-flow/handle-clicked-node";
import {
  addNewState,
  deleteFunction,
  updateNodeValue,
} from "@/utils/work-flow/create-work-flow/cudtom-node";
import NewWorkFlow from "./new-workflow";

//Initial value for React Flow
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

function WorkflowEditor() {
  //react-flow hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  //redux hooks
  const dispatch = useDispatch();

  // react hooks
  const [tab, setTab] = useState<string>("");

  //custom hooks
  const { centerOnNode, handleZoomIn, handleZoomOut, handleReset } =
    useViewportControls();
  const { findNextVerticalPosition, NODE_SPACING } = useNodePositioning(nodes);
  const { updateNodeType } = useNodeManagement(setNodes);
  const [selectedNode, setSelectedNode] = useState<string | undefined>(
    undefined
  );
  const openWorkFlow = useSelector(
    (state: RootState) => state.workflow.openWorkFlow
  );
  const { createEdge } = useEdgeManagement(
    nodes,
    useUpdateConnectedHandles(setNodes).updateConnectedHandles
  );

  const deleteFunctionLocal = useCallback(
    (data: any, id: string) => {
      deleteFunction(data, id, setNodes);
    },
    [setNodes]
  );

  const updateNodeValueLocal = useCallback(
    (nodeId: string) => {
      dispatch(setFormTab("edit"));
      updateNodeValue(setNodes, nodeId);
    },
    [setNodes]
  );

  const addNewStateLocal = useCallback(
    (nodeId: string) => {
      dispatch(setFormTab("state"));
      addNewState(setNodes, nodeId);
    },
    [setNodes]
  );

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          deleteFunctionLocal: () => deleteFunctionLocal(node.data, node.id),
          updateNodeValueLocal: () => updateNodeValueLocal(node.id),
          addNewStateLocal: () => addNewStateLocal(node.id),
        },
      }))
    );
  }, [deleteFunctionLocal, updateNodeValueLocal, addNewStateLocal]);

  //Custom hook for node creation
  const onAddNode = useAddNode(
    setNodes,
    setEdges,
    selectedNode,
    nodes,
    screenToFlowPosition,
    createEdge,
    centerOnNode,
    findNextVerticalPosition,
    NODE_SPACING,
    updateNodeType,
    setSelectedNode,
    deleteFunctionLocal,
    updateNodeValueLocal,
    addNewStateLocal
  );

  //Calling a variable from hooks
  const formTab = useSelector((state: RootState) => state.workflow.formTab);
  const workFlowName = useSelector(
    (state: RootState) => state.workflow.workFlowName
  );

  //Function for node connection
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((currentEdges) => {
        const connectionExists = currentEdges.some(
          (edge) =>
            (edge.source === params.source && edge.target === params.target) ||
            (edge.target === params.source && edge.source === params.target)
        );

        if (!connectionExists && params.source && params.target) {
          return addEdge(params, currentEdges);
        }

        return currentEdges;
      });
    },
    [setEdges]
  );

  // unction call after node click
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      dispatch(setNodeData(node));
      handleClickedNode(node, setNodes, setEdges, formTab, setTab);
      setSelectedNode(node.id);
      // dispatch(setFormTab(tab));
      // if (node.data.action == "edit") {
      // dispatch(setFormTab("edit"));
      // };
      dispatch(setOpenWorkFlow(true));
    },
    [nodes]
  );

  useEffect(() => {
    if (nodes.length === 0) {
      // Use a ref to track if we've already added a node
      const timeoutId = setTimeout(() => {
        onAddNode({ node: "defalt" });
      }, 0);

      // Clean up function
      return () => clearTimeout(timeoutId);
    }
  }, [nodes]);

  return (
    <>
      {/* Button to create a new workflow */}
      {!openWorkFlow && workFlowName.title == "" && (
        <NewWorkFlow onAddNode={onAddNode} />
        // <Button
        //   onClick={() => {
        //     dispatch(setOpenWorkFlow(true));
        //   }}
        //   className="font-medium fixed bg-gradient-to-b top-[133px] from-[#3f3f46] to-[#1b1b1b] right-8 z-50 text-white px-3 py-1"
        //   size="lg"
        // >
        //   New Work Flow
        // </Button>
      )}
      {/* React flow */}
      <div className="h-full absolute top-0 left-0 right-0 bottom-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          panOnDrag
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          nodeDragThreshold={0}
          connectOnClick
          style={{ background: "#ffffff" }} 
          className="rounded-tl-3xl rounded-tr-3xl "
          proOptions={{ hideAttribution: true }}
        >
          <Controls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleReset}
          />
          {/* Remove or modify the Background component */}
          {/* Option 1: Remove the Background component entirely */}

          {/* Option 2: Set gap to 0 and size to 0 for a plain background */}
          {/* <Background color="#3d3d44" gap={0} size={0} /> */}
        </ReactFlow>
      </div>
      {/* Form to control React Flow values */}
      {openWorkFlow && <WorkflowTrigger nodes={nodes} onAddNode={onAddNode} />}
      {/* Submit the workflow value */}
      {nodes.length >= 4 && <WorkFlowSubmit nodes={nodes} edges={edges}/>}
    </>
  );
}

export default WorkflowEditor;
