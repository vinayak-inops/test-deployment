import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export interface ExcelTemplatesState {
  data: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ExcelTemplatesState = {
  data: [],
  loading: false,
  error: null,
};

const excelTemplatesSlice = createSlice({
  name: "excelTemplates",
  initialState,
  reducers: {
    fetchExcelTemplatesRequest(state, action: PayloadAction<string>) {
      state.loading = true;
      state.error = null;
    },
    fetchExcelTemplatesSuccess(state, action: PayloadAction<any[]>) {
      state.loading = false;
      state.data = action.payload;
    },
    fetchExcelTemplatesFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchExcelTemplatesRequest,
  fetchExcelTemplatesSuccess,
  fetchExcelTemplatesFailure,
} = excelTemplatesSlice.actions;

export default excelTemplatesSlice.reducer;
