import { Button } from "@repo/ui/components/ui/button";
import { RootState } from "@inops/store/src/store";
import React from "react";
import { useSelector } from "react-redux";
import { useReactFlow } from "reactflow";

function WorkFlowSubmit({ nodes,edges }: { nodes: any;edges:any }) {
  const workFlowName = useSelector((state: RootState) => state.workflow.workFlowName);
  
  return (
    <>
      <div className="fixed bottom-4 right-[50%] left-[50%] w-[150px] z-40">
        <Button
          className="w-full font-medium"
          size="lg"
          onClick={async () => {
            try {
              let backend: any[] = [];
              let initialState;
          
              // Process nodes and build the 'backend' array
              nodes.forEach((node: any) => {
                if (node.data.presentNodeId?.slice(0, 6) === "circle") {
                  if (node.data.parentStateName === "") {
                    initialState = node.data?.stateData.prasentState.title;
                  } else {
                    let tempnode = {
                      sourceState: node.data.parentStateName,
                      targetState: node.data?.stateData.prasentState.title,
                      event: node.data?.stateData.event?.name,
                      action: node.data?.stateData.action?.name,
                      guard: node.data?.stateData.guard?.name,
                    };
                    backend.push(tempnode);
                  }
                }
              });
          
              // Synchronously get unique source states after processing nodes
              const uniqueSourceStates = [
                ...new Set(backend.map((item) => item?.targetState)),
              ];
              let backlength=backend.length
              
          
              const response = await fetch(
                "http://49.206.252.89:8080/api/command/attendance/workflows",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    tenant: "",
                    action: "insert",
                    id: null,
                    collectionName: "workflows",
                    data: {
                      name: workFlowName.title,
                      initialState: initialState,
                      states: [backend[0].sourceState,...uniqueSourceStates],
                      transitions: backend,
                      // workflowui: {
                      //   nodes: nodes,
                      //   edges: edges,
                      // },
                    },
                  })
                }
              )
          
              const data = await response.json();
          
              if (data.success) {
                let workflow = JSON.parse(localStorage.getItem("workflow") || "[]");
                workflow.push(data);
                localStorage.setItem("workflow", JSON.stringify(workflow));
              }
            } catch (error) {
              
            }
          }}
          
        >
          Work Flow Submit
        </Button>
      </div>
    </>
  );
}

export default WorkFlowSubmit;
