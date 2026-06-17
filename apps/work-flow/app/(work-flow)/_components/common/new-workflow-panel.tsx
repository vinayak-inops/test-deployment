import { NewWorkflowPanelProps } from "@/type/work-flow/create-work-flow/props";
import WorkFlowForm from "./work-flow-form";


export const NewWorkflowPanel = ({ newWorkFlowFun }: NewWorkflowPanelProps) => {
  return (
    <div className="flex flex-wrap">
      <div className="flex flex-col w-full shadow-lg bg-white p-5 rounded-2xl pt-16">
        <WorkFlowForm newWorkFlowFun={newWorkFlowFun} />
      </div>
    </div>
  );
};
