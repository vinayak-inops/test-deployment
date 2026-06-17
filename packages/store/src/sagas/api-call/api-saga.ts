import { call, put, takeLatest, all } from "redux-saga/effects";
import axios, { AxiosRequestConfig } from "axios";
import {
  apiRequest,
  apiSuccess,
  apiFailure,
} from "./api-slice";
import { PayloadAction } from "@reduxjs/toolkit";

// Get API URL from environment variables with fallbacks
const getApiBaseUrl = () => {
  // First try to get from window (client-side)
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  // Then try to get from process.env (server-side)
  return process.env.NEXT_PUBLIC_API_BASE_URL;
};

const API_BASE_URL = getApiBaseUrl();

// Generic API call function for multiple backend calls
function* apiCallWorker(action: PayloadAction<{ url: string; method: string; data?: any; token?: string }>): Generator<any, void, any> {
  try {
    const { url, method, data, token } = action.payload;
    
    // Build the full URL following the same pattern as useGetRequest
    const fullUrl = `${API_BASE_URL}/api/query/attendance/${url}`;
    
    // Prepare headers following the same format
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Add authorization header if token is provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Prepare axios config
    const axiosConfig: AxiosRequestConfig = {
      method: method.toLowerCase() as any,
      url: fullUrl,
      headers,
      withCredentials: true,
    };
    
    // Add data for POST/PUT requests
    if (data && ['post', 'put'].includes(method.toLowerCase())) {
      axiosConfig.data = data;
    }
    
    // Make the API call
    const response = yield call(axios.request, axiosConfig);
    
    yield put(apiSuccess(response.data));
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "API call failed";
    yield put(apiFailure(errorMessage));
  }
}

// Watcher Saga for API calls
export function* watchApiCall() {
  yield takeLatest(apiRequest.type, apiCallWorker);
}

// Export all API sagas
export function* apiSagas() {
  yield all([
    watchApiCall(),
  ]);
}