
import { useState, useEffect } from "react";

export const useWorkflowTriggerState = (nodeData: any) => {
  const [stateValue, setStateValue] = useState({
    oldValue: "",
    value: "",
    title: "",
  });
  const [selectvalue, setSelectValue] = useState({
    event: "",
    guard: "",
    action: "",
  });
  const [stateData, setStateData] = useState();
  const [tempNodeConnect, setTempNodeConnect] = useState({
    parentId: "",
    parentName: "",
    prasentState:"",
    state: "",
    event: "",
    action: "",
    guard: "",
  });
  const [firstState, setFirstState] = useState<string>("");
  const [firstStateValue, setFirstStateValue] = useState<string>("");
  const [activeTab, setActiveTab] = useState("event");

  // Update tempNodeConnect when nodeData changes
  useEffect(() => {
    if (nodeData?.id) {
      setTempNodeConnect((prev) => ({
        ...prev,
        parentId: nodeData.id,
        parentName: nodeData.data?.title || "",
      }));
    }
  }, [nodeData]);

  return {
    stateValue,
    setStateValue,
    selectvalue,
    setSelectValue,
    stateData,
    setStateData,
    tempNodeConnect,
    setTempNodeConnect,
    firstState,
    setFirstState,
    firstStateValue,
    setFirstStateValue,
    activeTab,
    setActiveTab,
  };
};