import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { WorkflowHeader } from "./workflow-header";
import { TriggerItem } from "./trigger-item";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setFormTab,
  setOpenWorkFlow,
} from "@inops/store/src/slices/features/work-flow/create-work-flow/workflow-slice";
import { RootState } from "@inops/store/src/store";
import { StatePanelProps } from "@/type/work-flow/create-work-flow/props";

export const StatePanel = ({
  onAddNode,
  setTempNodeConnect,
}: StatePanelProps) => {
  const dispatch = useDispatch();
  const formTab = useSelector((state: RootState) => state.workflow.formTab);
  const [selectedValue, setSelectedValue] = useState<{
    state: string;
    value: string;
    complete: any;
  }>({
    state: "",
    value: "",
    complete: null,
  });
  const [state, setState]=useState([])

  const fetchWorkflowState = () => {
    fetch("http://49.206.252.89:8080/api/query/attendance/workflowstate")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setState(data);
      })
      .catch((error) => {
      });
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
    }, 5000); // Fetch every 5 seconds
    fetchWorkflowState();

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);
  return (
    <div className="flex flex-wrap h-full">
      <div className="flex flex-col h-full w-full shadow-lg bg-white p-5 rounded-2xl relative">
        <div className="pt-10">
          <WorkflowHeader
            title="Select the first state"
            description="Select the state you want to choose and proceed with your selection efficiently and accurately."
          />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
          <h2 className="pt-4 pb-2 font-bold text-base bg-white sticky top-0">
            Select First State
          </h2>
          <div>
            {state?.map((element:any,i) => (
              <div key={element.title} className="space-y-1">
                {(formTab !== "state-edit"||  element.title === "STATE") && (
                  <TriggerItem
                    title={element.title}
                    description={element.title}
                    selectedValue={selectedValue.state}
                    type="circle"
                    onClick={() => {
                      if (formTab != "edit") {
                        if (element.title == "STATE") {
                          setSelectedValue({
                            state: element.title,
                            value: "",
                            complete: element,
                          });
                        } else {
                          // setTempNodeConnect((e: any) => {
                          //   return {
                          //     ...e,
                          //     state: element,
                          //     prasentState: element,
                          //   };
                          // });
                          setSelectedValue({
                            state: element.title,
                            value: element.title,
                            complete: element,
                          });
                        }
                      }else{
                        setSelectedValue({
                          state: element.title,
                          value: "",
                          complete: element,
                        });
                      }
                    }}
                  />
                )}
                {(element.title === selectedValue.state &&
                  selectedValue.state === "STATE") && (
                    <Input
                      onChange={(e) =>
                        setSelectedValue((prev) => ({
                          ...prev,
                          value: e.target.value,
                        }))
                      }
                      placeholder="Search nodes..."
                      className="pl-2 bg-white border-[#7b809a] text-black placeholder:text-[#7b809a]"
                    />
                  )}
              </div>
            ))}
          </div>
        </div>
        {selectedValue.value !== "" && (
          <div className="bottom-0 relative">
            <Button
              className="w-full font-medium"
              size="lg"
              onClick={() => {
                if (formTab == "state") {
                  setTempNodeConnect((e: any) => {
                    return {
                      ...e,
                      prasentState: { title: selectedValue.value },
                      state: {
                        title: selectedValue.value,
                        statetype: selectedValue.state,
                      },
                    };
                  });
                  dispatch(setFormTab("form"));
                } else if (formTab == "first-state") {
                  onAddNode({
                    node: "circle",
                    state: selectedValue.value,
                    stateData: {
                      prasentState: {
                        title: selectedValue.value,
                      },
                      state: {
                        title: selectedValue.value,
                      },
                    },
                  });
                  dispatch(setOpenWorkFlow(false));
                  dispatch(setFormTab("state"));
                } else if(formTab=="state-edit") {
                  setTempNodeConnect((e: any) => {
                    return {
                      ...e,
                      prasentState: { title: selectedValue.value },
                      state: {
                        title: selectedValue.value,
                        statetype: selectedValue.state,
                      },
                    };
                  });
                  dispatch(setFormTab("edit-edit"));
                }
              }}
            >
              Submit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
