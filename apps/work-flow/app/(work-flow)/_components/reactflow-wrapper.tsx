"use client";

import { ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import WorkflowEditor from "./workflow-editor";

export default function ReactflowWrapper() {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
}
