import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@inops/store/src/store";
import { WorkflowHeader } from "./workflow-header";
import { EventActionTabs } from "./event-action-tabs";
import { NodeItemsList } from "./node-items-list";
import { SelectionSummary } from "./selection-summary";
import { SubmitButton } from "./submit-button";
import {
  setFormTab,
  setOpenWorkFlow,
  setSlectedValue,
} from "@inops/store/src/slices/features/work-flow/create-work-flow/workflow-slice";
import { FormPanelProps } from "@/type/work-flow/create-work-flow/props";
import { useReactFlow } from "reactflow";

export const FormPanel = ({
  onAddNode,
  tempNodeConnect,
  setTempNodeConnect,
}: FormPanelProps) => {
  const formTab = useSelector((state: RootState) => state.workflow.formTab);
  const nodeData = useSelector((state: RootState) => state.workflow.nodeData);
  const slectedValue = useSelector((state: RootState) => state.workflow.slectedValue);

  const { setNodes } = useReactFlow();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("event");
  const [menu, setMenu] = useState([]);
  const [menuData, setMenuData] = useState<any>({
    event: [],
    action: [],
    guard: [],
  });

  // Fetch all menu data on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [eventRes, actionRes, guardRes] = await Promise.all([
          fetch("http://49.206.252.89:8080/api/query/attendance/workflowevent"),
          fetch("http://49.206.252.89:8080/api/query/attendance/workflowaction"),
          fetch("http://49.206.252.89:8080/api/query/attendance/workflowguard"),
        ]);

        const [eventData, actionData, guardData] = await Promise.all([
          eventRes.json(),
          actionRes.json(),
          guardRes.json(),
        ]);

        setMenuData({
          event: eventData,
          action: actionData,
          guard: guardData,
        });

        setMenu(eventData); // default tab is event
      } catch (error) {
      }
    };

    fetchAll();
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setMenu(menuData[tab] || []);
  };

  const handleItemSelect = (element: any) => {
    setTempNodeConnect((e: any) => ({
      ...e,
      [activeTab]: element,
    }));
  };

  const handleSubmit = () => {
    if (formTab !== "edit" && formTab !== "edit-edit") {
      onAddNode({
        node: "circle",
        stateData: tempNodeConnect,
      });
      setTempNodeConnect({
        parentId: "",
        parentName: "",
        prasentState: "",
        state: "",
        event: "",
        action: "",
        guard: "",
      });
    } else {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === nodeData.id || node.id === nodeData.data.parentInfoNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  action: "create",
                  stateData: tempNodeConnect,
                },
              }
            : node
        )
      );
    }

    dispatch(setFormTab(""));
    dispatch(setOpenWorkFlow(false));
  };

  return (
    <div className="flex flex-wrap h-full">
      <div className="flex flex-col h-full w-1/2 shadow-lg bg-white p-5 rounded-2xl relative z-50">
        <div className="pt-10">
          <WorkflowHeader
            title="Select the Event, Action, ActionBean"
            description="Select the Event, Action, ActionBean you want to choose and proceed with your selection efficiently and accurately."
          />
        </div>

        <EventActionTabs activeTab={activeTab} onTabChange={handleTabChange} />

        <NodeItemsList menu={menu} onItemSelect={handleItemSelect} />
      </div>

      <div className="flex flex-col h-full shadow-lg bg-white py-5 rounded-2xl w-1/2 pt-16">
        <SelectionSummary tempNodeConnect={tempNodeConnect} />

        <div className="bottom-0 px-5 relative z-50">
          <SubmitButton onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
};
