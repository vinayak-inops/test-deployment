import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ApiState {
  loading: boolean;
  error: string | null;
  data: any;
}

const initialState: ApiState = {
  loading: false,
  error: null,
  data: null,
};

const apiSlice = createSlice({
  name: 'api',
  initialState,
  reducers: {
    apiRequest: (state, action: PayloadAction<{ url: string; method: string; data?: any; token?: string }>) => {
      state.loading = true;
      state.error = null;
    },
    apiSuccess: (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = null;
      state.data = action.payload;
    },
    apiFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearApiData: (state) => {
      state.data = null;
      state.error = null;
    },
  },
});

export const { apiRequest, apiSuccess, apiFailure, clearApiData } = apiSlice.actions;
export default apiSlice.reducer;