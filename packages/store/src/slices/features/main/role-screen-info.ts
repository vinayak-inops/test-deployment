// store/workflowSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  roleScreenInfo: null as any,
};

const roleScreenInfoSlice = createSlice({
  name: "roleScreenInfo",
  initialState,
  reducers: {
    setRoleScreenInfo: (state, action: PayloadAction<any>) => {
      state.roleScreenInfo = action.payload;
    },
  },
});

export const {
  setRoleScreenInfo,
} = roleScreenInfoSlice.actions;

export default roleScreenInfoSlice.reducer;