import { useDispatch } from "react-redux";
import { setFormTab } from "@inops/store/src/slices/features/work-flow/create-work-flow/workflow-slice";

export const useWorkflowNavigation = (currentFormTab: string) => {
  const dispatch = useDispatch();

  const handleBackNavigation = () => {
    switch (currentFormTab) {
      case "work-flow": {
        break;
      }
      case "first-state": {
        dispatch(setFormTab("work-flow"));
        break;
      }
      case "form": {
        dispatch(setFormTab("state"));
        break;
      }
      case "edit": {
        dispatch(setFormTab("state-edit"));
        break;
      }
      default:
        break;
    }
  };

  return { handleBackNavigation };
};