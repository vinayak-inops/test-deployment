import { useCallback } from "react";
import { Node, useEdgesState, useNodesState, useReactFlow } from "reactflow";
import { useCreateActualNode } from "./useCreateActualNode";
import { useCalculateInfoNodeDimensions } from "./useCalculateInfoNodeDimensions";
import { useEdgeManagement } from "./useEdgeManagement";
import { useViewportControls } from "./useViewportControls";
import { useNodeManagement } from "./useNodeManagement";
import { useNodePositioning } from "./useNodePositioning";
import { useCreateNode } from "./useCreateNode";

/**
 * Custom hook to handle the logic for adding new nodes to the React Flow diagram.
 * It manages node creation, positioning, and connecting nodes with edges.
 */
export const useAddNode = (
  setNodes: ReturnType<typeof useNodesState>[1],
  setEdges: ReturnType<typeof useEdgesState>[1],
  selectedNode: string | undefined,
  nodes: Node[],
  screenToFlowPosition: ReturnType<typeof useReactFlow>["screenToFlowPosition"],
  createEdge: ReturnType<typeof useEdgeManagement>["createEdge"],
  centerOnNode: ReturnType<typeof useViewportControls>["centerOnNode"],
  findNextVerticalPosition: ReturnType<
    typeof useNodePositioning
  >["findNextVerticalPosition"],
  NODE_SPACING: number,
  updateNodeType: ReturnType<typeof useNodeManagement>["updateNodeType"],
  setSelectedNode: React.Dispatch<React.SetStateAction<string | undefined>>,
  deleteFunctionLocal: any,
  updateNodeValueLocal: any,
  addNewStateLocal: any
) => {
  // Define parentStateName variable
  const parentStateName = selectedNode
    ? nodes.find((n: Node) => n.id === selectedNode)?.data?.stateData
        ?.prasentState?.title
    : "";

  // Hook to create the actual node with positioning and connection logic
  const createActualNode = useCreateActualNode(
    setNodes,
    setEdges,
    screenToFlowPosition,
    createEdge,
    centerOnNode,
    findNextVerticalPosition,
    NODE_SPACING,
    updateNodeType,
    setSelectedNode,
    parentStateName,
    deleteFunctionLocal,
    updateNodeValueLocal,
    addNewStateLocal
  );

  // Hook to calculate the dimensions of the info node based on its content
  const calculateInfoNodeDimensions = useCalculateInfoNodeDimensions();

  /**
   * Callback function to add a new node to the diagram.
   * Handles the creation of regular nodes and info nodes, and connects them to their parent nodes.
   */
  return useCallback(
    (type: any) => {
      // Check if the node type is not "defalt", "start-flow", or "info-node"
      if (
        type.node !== "defalt" &&
        type.node !== "start-flow" &&
        type.node !== "info"
      ) {
        // Calculate the center of the viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;
        const position = screenToFlowPosition({
          x: centerX,
          y: centerY,
        });

        // Find the selected node's data
        const selectedNodeData = nodes.find((n: Node) => n.id === selectedNode);
        const selectedNodePosition = selectedNodeData?.position || position;
        const selectedNodeDimensions = selectedNodeData?.data.dimensions || {
          width: 150,
          height: 50,
        };

        // Check if the selected node is a "start-flow" node
        const isParentStartNode =
          selectedNodeData?.data.nodeType == "start-flow";

        // If the parent is a "start-flow" node, create a new node directly
        if (isParentStartNode) {
          const newNodeId = createActualNode(
            type,
            selectedNode,
            selectedNodePosition,
            selectedNodeDimensions
          );
          requestAnimationFrame(() => {
            centerOnNode(newNodeId); // Center the viewport on the new node
          });
          return;
        }

        // Create an info node to represent the transition or action
        const infoNodeId = `info-node-${selectedNode ?? "root"}-${Date.now()}`;
        const infoNodeDimensions = calculateInfoNodeDimensions(type.stateData);

        // Calculate the position for the info node
        const targetX = selectedNodePosition.x + NODE_SPACING;
        const nextY = findNextVerticalPosition(
          targetX,
          selectedNodePosition.y,
          type.stateData.pathDirection
        );

        const { createInfoNode } = useCreateNode();

        // Then when you need to create an new node:
        const infoNode = createInfoNode({
          infoNodeId: infoNodeId,
          position: {
            x: targetX,
            y: nextY,
          },
          nodeType: "info",
          type: { stateData: type.stateData },
          parentStateName: parentStateName ? parentStateName : "",
          selectedNodeData: { id: `${selectedNodeData?.id}` },
          updateNodeType: updateNodeType,
          nodeDimensions: infoNodeDimensions,
          deleteFunctionLocal:deleteFunctionLocal,
          updateNodeValueLocal:updateNodeValueLocal,
          addNewStateLocal:addNewStateLocal
        });

        // Add the info node to the nodes array
        setNodes((currentNodes) => {
          const nodesWithoutDefault = currentNodes.filter(
            (node) => !node.id.startsWith("defalt-")
          );
          return [...nodesWithoutDefault, infoNode];
        });

        // Connect the info node to its parent node with an edge
        if (selectedNode) {
          setEdges((currentEdges) => {
            const newEdge = createEdge(selectedNode, infoNodeId);
            return [...currentEdges, newEdge];
          });
        }

        // Update the parent node ID, last info node ID, and selected node ID
        setSelectedNode(infoNodeId);

        // Center the viewport on the info node
        requestAnimationFrame(() => {
          centerOnNode(infoNodeId);
        });

        // Create the actual node after the info node is added
        requestAnimationFrame(() => {
          createActualNode(
            type,
            infoNodeId,
            infoNode.position,
            infoNodeDimensions
          );
        });

        return;
      }

      // If the node type is "defalt", "start-flow", or "info-node", create the node directly
      const newNodeId = createActualNode(type);
      requestAnimationFrame(() => {
        centerOnNode(newNodeId); // Center the viewport on the new node
      });
    },
    [
      setNodes,
      screenToFlowPosition,
      selectedNode,
      setEdges,
      createEdge,
      nodes,
      centerOnNode,
      findNextVerticalPosition,
      NODE_SPACING,
      updateNodeType,
      createActualNode,
      calculateInfoNodeDimensions,
    ]
  );
};
