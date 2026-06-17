
import { createSlice, PayloadAction } from "@reduxjs/toolkit";


export interface WorkflowState {
  sidebarSubMain:boolean
}

const initialState: WorkflowState = {
  sidebarSubMain:true
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    setSidebarSubMain: (state, action: PayloadAction<boolean>) => {
      state.sidebarSubMain = action.payload;
    },
  },
});

export const { setSidebarSubMain } = sidebarSlice.actions;

export default sidebarSlice.reducer;