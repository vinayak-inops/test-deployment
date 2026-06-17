// store/workflowSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ClickedNodeData {
  nodeType: string;
  parentState?: any;
}

export interface WorkflowState {
  workFlowName: {
    title: string;
    description: string;
  };
  nodeData: any | null;
  selectParent: any;
  formTab: string;
  slectedValue: [];
  openWorkFlow: boolean;
}

const initialState: WorkflowState = {
  workFlowName: {
    title: "",
    description: "",
  },
  nodeData: null,
  selectParent: "",
  formTab: "",
  slectedValue: [],
  openWorkFlow: false,
};

const workflowSlice = createSlice({
  name: "workflow",
  initialState,
  reducers: {
    setWorkFlowName: (
      state,
      action: PayloadAction<{
        title: string;
        description: string;
      }>
    ) => {
      state.workFlowName = action.payload;
    },
    setNodeData: (state, action: PayloadAction<any>) => {
      state.nodeData = action.payload;
    },
    setSelectParent: (state, action: PayloadAction<any>) => {
      state.selectParent = action.payload;
    },
    setFormTab: (state, action: PayloadAction<string>) => {
      state.formTab = action.payload;
    },
    setSlectedValue: (state, action: PayloadAction<any>) => {
      state.slectedValue = action.payload;
    },
    setOpenWorkFlow: (state, action: PayloadAction<boolean>) => {
      state.openWorkFlow = action.payload;
    },
  },
});

export const {
  setNodeData,
  setFormTab,
  setSlectedValue,
  setOpenWorkFlow,
  setWorkFlowName,
  setSelectParent,
} = workflowSlice.actions;

export default workflowSlice.reducer;
