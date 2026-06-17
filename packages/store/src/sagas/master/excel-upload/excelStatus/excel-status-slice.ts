import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface excelStatusState {  
  data: any[];
  loading: boolean;
  error: string | null;
}

const initialState: excelStatusState = {
  data: [],
  loading: false,
  error: null,
};

const excelStatusSlice = createSlice({
  name: "excelStatus",
  initialState,
  reducers: {
    fetchexcelStatusRequest(state, action: PayloadAction<string>) {  
      state.loading = true;
      state.error = null;
    },
    fetchexcelStatusSuccess(state, action: PayloadAction<any[]>) {
      state.loading = false;
      state.data = action.payload;
    },
    fetchexcelStatusFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchexcelStatusRequest,
  fetchexcelStatusSuccess,
  fetchexcelStatusFailure,
} = excelStatusSlice.actions;

export default excelStatusSlice.reducer;
