import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface HierarchyState {
  loading: boolean;
  error: string | null;
  data: any;
}

const initialState: HierarchyState = {
  loading: false,
  error: null,
  data: null,
};

type HierarchyRequestPayload = {
  userId: string;
  level: number | undefined;
  tenantCode: string;
  token?: string;
};

const hierarchySlice = createSlice({
  name: "hierarchy",
  initialState,
  reducers: {
    hierarchyRequest: (state, _action: PayloadAction<HierarchyRequestPayload>) => {
      state.loading = true;
      state.error = null;
    },
    hierarchySuccess: (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = null;
      state.data = action.payload;
    },
    hierarchyFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearHierarchy: (state) => {
      state.data = null;
      state.error = null;
    },
  },
});

export const { hierarchyRequest, hierarchySuccess, hierarchyFailure, clearHierarchy } = hierarchySlice.actions;
export default hierarchySlice.reducer;
export type { HierarchyRequestPayload };


