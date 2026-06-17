"use client";
import { RootState } from "@inops/store/src/store";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import WorkFlowForm from "./common/work-flow-form";
import {
  setFormTab,
  setOpenWorkFlow,
  setWorkFlowName,
} from "@inops/store/src/slices/features/work-flow/create-work-flow/workflow-slice";
import { NewWorkflowPanel } from "./common/new-workflow-panel";
import { useWorkflowTriggerState } from "@/hooks/work-flow/create-work-flow/form/useWorkflowTriggerState";
import { FormPanel } from "./common/form-panel";
import { WorkflowTriggerProps } from "@/type/work-flow/create-work-flow/props";
import { FormNavigationButton } from "./common/form-navigation-buttons";
import { useWorkflowNavigation } from "@/hooks/work-flow/create-work-flow/form/useWorkflowNavigation";
import { StatePanel } from "./common/state-panel";
import {
  fetchWorkflowActionsRequest,
  fetchWorkflowEventsRequest,
  fetchWorkflowGuardsRequest,
  fetchWorkflowStatesRequest,
} from "@inops/store/src/sagas/workflow/event-state-action-guard-slice";
// import { attendanceActions } from "@inops/store/src/sagas/api-call/api-configuration";

export default function WorkflowTrigger({
  onAddNode,
  nodes,
}: WorkflowTriggerProps) {
  //redux hooks
  const dispatch = useDispatch();
  const formTab = useSelector((state: RootState) => state.workflow.formTab);
  const nodeData = useSelector((state: RootState) => state.workflow.nodeData);
  const workFlowName = useSelector(
    (state: RootState) => state.workflow.workFlowName
  );

  //custome hooks
  const { tempNodeConnect, setTempNodeConnect } =
    useWorkflowTriggerState(nodeData);
  const { handleBackNavigation } = useWorkflowNavigation(formTab);

  // For fetching events
  // dispatch({
  //   type: "data/fetchRequest",
  //   payload: {
  //     endpoint: "workflowevent",
  //     successAction: fetchWorkflowEventsSuccess,
  //     failureAction: fetchWorkflowEventsFailure
  //   }
  // });

  // For fetching states with extra parameters
  // dispatch({
  //   type: "data/fetchRequest",
  //   payload: {
  //     endpoint: "workflowstate",
  //     successAction: fetchWorkflowStatesSuccess,
  //     failureAction: fetchWorkflowStatesFailure,
  //     extraParams: { value: "some-value" }
  //   }
  // });

  // const {
  //   workflowGuard,
  //   workflowAction,
  //   workflowEvent,
  //   workflowSubmit
  // } = useSelector((state:any) => state.attendance);
  
  // Fetch all attendance workflow data on component mount
  useEffect(() => {
    fetchWorkflowGuard();
    fetchWorkflowAction();
    fetchWorkflowEvent();
  }, []);
  
  // Function to fetch workflow guard data with optional parameters
  const fetchWorkflowGuard = (params = {}) => {
    // dispatch(attendanceActions.workflowGuard.request(params));
  };
  
  // Function to fetch workflow action data with optional parameters
  const fetchWorkflowAction = (params = {}) => {
    // dispatch(attendanceActions.workflowAction.request(params));
  };
  
  // Function to fetch workflow event data with optional parameters
  const fetchWorkflowEvent = (params = {}) => {
    // dispatch(attendanceActions.workflowEvent.request(params));
  };
 
  
  
  // Function to submit a new workflow
  // const submitWorkflow = (workflowData) => {
  //   dispatch(attendanceActions.submitWorkflow.request(workflowData));
  // };

  // Example workflow submission data
  const exampleWorkflowData = {
    workFlowName: { title: 'Sample Workflow' },
    initialState: 'Draft',
    backend: [
      { sourceState: 'Draft', targetState: 'Review', action: 'Submit' },
      { sourceState: 'Review', targetState: 'Approved', action: 'Approve' }
    ],
    uniqueSourceStates: ['Draft', 'Review'],
    nodes: [/* Your nodes data */],
    edges: [/* Your edges data */]
  };

  // Function to make a GET request with parameters



  // Initialize page based on conditions
  const effectRunRef = useRef(false);

  useEffect(() => {
    // In development with StrictMode, this will run twice
    // Use ref to skip the second execution in the same render cycle
    if (effectRunRef.current === true) {
      return;
    }

    // In StrictMode this will still run twice, but only once per render cycle
    // as the ref is reset between renders
    effectRunRef.current = true;

    if (workFlowName.title !== "" && nodes.length <= 1) {
      const firstNode = nodes[0];
      if (firstNode?.data.nodeType === "start-flow") {
        dispatch(setFormTab("first-state"));
      } else {
        dispatch(setFormTab("work-flow"));
        setTempNodeConnect({
          parentId: "",
          parentName: "",
          prasentState: "",
          state: "",
          event: "",
          action: "",
          guard: "",
        });
      }
    } else {
      if (formTab === "edit") {
        setTempNodeConnect(nodeData.data.stateData);
      }
    }
    if (formTab === "state") {
      setTempNodeConnect({
        parentId: "",
        parentName: "",
        prasentState: "",
        state: "",
        event: "",
        action: "",
        guard: "",
      });
    }

    // Reset the ref when component unmounts or dependencies change
    return () => {
      effectRunRef.current = false;
    };
  }, [workFlowName.title, nodes.length, nodeData, formTab]);

  // Handle new workflow creation
  const handleNewWorkflow = (title: string, description: string): void => {
    onAddNode({
      node: "start-flow",
      stateData: {
        state: { title: title, description: description },
      },
    });
    dispatch(setWorkFlowName({ title: title, description: description }));
    dispatch(setFormTab("first-state"));
    dispatch(setOpenWorkFlow(false));
  };

  return (
    <div
      className={`fixed right-0 top-0 ${formTab === "form" || formTab == "edit" || formTab === "edit-edit" ? "w-1/2" : "w-1/4"} h-screen pb-4`}
    >
      <div className="w-full relative pt-[117px] px-4 pb-0 h-full">
        <div className="text-[#344767] space-y-0 h-full relative">
          {/* Button to control from the flow */}
          <FormNavigationButton
            showBackButton={formTab === "form" || formTab === "edit"}
            onBackClick={handleBackNavigation}
          />

          {/* Render appropriate panel based on current page */}
          {workFlowName.title == "" && (
            <WorkFlowForm newWorkFlowFun={handleNewWorkflow} />
          )}

          {/* Form to create a new workflow */}
          {formTab === "work-flow" && workFlowName.title != "" && (
            <NewWorkflowPanel newWorkFlowFun={handleNewWorkflow} />
          )}

          {/* Form to create a new state */}
          {(formTab === "first-state" ||
            formTab === "state" ||
            formTab === "state-edit") && (
            <StatePanel
              onAddNode={onAddNode}
              setTempNodeConnect={setTempNodeConnect}
            />
          )}

          {/* Form to create a new info node */}
          {(formTab === "form" ||
            formTab === "edit" ||
            formTab === "edit-edit") && (
            <FormPanel
              onAddNode={onAddNode}
              setTempNodeConnect={setTempNodeConnect}
              tempNodeConnect={tempNodeConnect}
            />
          )}
        </div>
      </div>
    </div>
  );
}
