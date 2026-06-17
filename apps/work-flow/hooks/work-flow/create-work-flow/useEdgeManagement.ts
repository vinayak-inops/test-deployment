
import { useCallback } from "react";
import { Edge, MarkerType, Node as ReactFlowNode } from "reactflow";

interface Node extends ReactFlowNode {
  id: string;
}

export function useEdgeManagement(
  nodes: Node[],
  updateConnectedHandles: (edge: Edge) => void
) {
  const shouldShowArrow = useCallback(
    (sourceId: string, targetId: string) => {
      const sourceNode = nodes.find((node) => node.id === sourceId);
      const targetNode = nodes.find((node) => node.id === targetId);

      const isSourceInfoNode = sourceNode?.data.nodeType === "info";
      const isTargetInfoNode = targetNode?.data.nodeType === "info";

      return !isSourceInfoNode && !isTargetInfoNode;
    },
    [nodes]
  );

  const createEdge = useCallback(
    (sourceId: string, targetId: string) => {
      const uniqueEdgeId = `edge-${sourceId}-${targetId}-${Date.now()}`;

      const showArrow = shouldShowArrow(sourceId, targetId);

      let newEdge: Edge;

      if (targetId.slice(0, 9) !== "info-node") {
        newEdge = {
          id: uniqueEdgeId,
          source: sourceId,
          target: targetId,
          sourceHandle: "right",
          targetHandle: "left",
          type: "default",
          style: {
            stroke: "#7b809a",
            strokeWidth: 1,
          },
          ...(showArrow
            ? {
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: "#7b809a",
                },
              }
            : {}),
        };
      } else {
        newEdge = {
          id: uniqueEdgeId,
          source: sourceId,
          target: targetId,
          sourceHandle: "right",
          targetHandle: "left",
          type: "default",
          style: {
            stroke: "#7b809a",
            strokeWidth: 1,
          },
        };
      }

      updateConnectedHandles(newEdge);

      return newEdge;
    },
    [updateConnectedHandles, shouldShowArrow]
  );

  return {
    shouldShowArrow,
    createEdge,
  };
}