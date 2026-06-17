import { PayloadAction } from "@reduxjs/toolkit";
import { all, call, put, takeLatest } from "redux-saga/effects";
import axios, { AxiosRequestConfig } from "axios";
import {
  hierarchyRequest,
  hierarchySuccess,
  hierarchyFailure,
  HierarchyRequestPayload,
} from "./hierarchy-slice";

const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL;
};

const API_BASE_URL = getApiBaseUrl();

function* hierarchyWorker(action: PayloadAction<HierarchyRequestPayload>): Generator<any, void, any> {
  try {
    const { userId, level, tenantCode, token } = action.payload;

    const fullUrl = `${API_BASE_URL}/api/query/attendance/userEntitlements/search`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const axiosConfig: AxiosRequestConfig = {
      method: "post",
      url: fullUrl,
      headers,
      withCredentials: true,
      data: [
        {field: "employeeID", operator: "eq", value: userId},
        {field: "tenantCode", operator: "eq", value: tenantCode},
      ],
    };

    const response = yield call(axios.request, axiosConfig);
    yield put(hierarchySuccess(response.data));
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || "Hierarchy API call failed";
    yield put(hierarchyFailure(errorMessage));
  }
}

export function* watchHierarchy() {
  yield takeLatest(hierarchyRequest.type, hierarchyWorker);
}

export function* hierarchySagas() {
  yield all([watchHierarchy()]);
}