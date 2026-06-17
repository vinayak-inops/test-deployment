"use client";

import { MarkerType } from "reactflow";

export default function handleClickedNode(
  node: any | null,
  setNodes: React.Dispatch<React.SetStateAction<any[]>>,
  setEdges: React.Dispatch<React.SetStateAction<any[]>>,
  formTab: string,
  setTab: React.Dispatch<React.SetStateAction<string>>
) {
  if (!node) return;
  
  if (node.data.nodeType === "start-flow") {
    setTab("first-state");
  } else if (node.data.nodeType === "circle" || node.nodeType === "info") {
    setTab("state");

    let selectedId =
      node.data.parentInfoNodeId.startsWith("info-node") &&
      !node.id.startsWith("info-node")
        ? node.data.parentInfoNodeId
        : node.id;

    
    setNodes((nodes) =>
      nodes.map((nodelocal) => ({
        ...nodelocal,
        data: {
          ...nodelocal.data,
          modeOfSelect:
            node.id == nodelocal.id
              ? "select"
              : nodes.includes(node.id)
                ? "path"
                : "notselect",
        },
      }))
    );

    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: {
          ...e.style,
          stroke: selectedId.includes(e.target) ? "green" : "#7b809a",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: selectedId.includes(e.target) ? "green" : "#7b809a",
        },
      }))
    );
  }
}
