"use client";

import { useCallback } from "react";
import { Edge, Connection, Node } from "reactflow";

export function useUpdateConnectedHandles(
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>
) {
  const updateConnectedHandles = useCallback(
      (newEdge: Edge | Connection) => {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === newEdge.source) {
              return {
                ...node,
                data: {
                  ...node.data,
                  connectedHandles: {
                    ...node.data.connectedHandles,
                    [newEdge.sourceHandle || ""]: "source",
                  },
                },
              };
            }
            if (node.id === newEdge.target) {
              return {
                ...node,
                data: {
                  ...node.data,
                  connectedHandles: {
                    ...node.data.connectedHandles,
                    [newEdge.targetHandle || ""]: "target",
                  },
                },
              };
            }
            return node;
          })
        );
      },
      [setNodes]
    );

  return { updateConnectedHandles };
}
