import { call, put, takeLatest } from "redux-saga/effects";
import axios from "axios";
import {
  fetchexcelStatusRequest,
  fetchexcelStatusSuccess,
  fetchexcelStatusFailure,
} from "./excel-status-slice";
import { PayloadAction } from "@reduxjs/toolkit";

// Dynamic API call function
function fetchexcelStatusApi(url: string) {
  return axios.get(url);
}

// Worker Saga with dynamic URL
function* fetchexcelStatusWorker(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    const response = yield call(fetchexcelStatusApi, action.payload);  
    yield put(fetchexcelStatusSuccess(response.data));
  } catch (error: any) {
    yield put(fetchexcelStatusFailure(error.message || "Failed to fetch excelStatus"));
  }
}

// Watcher Saga
export function* watchFetchexcelStatus() {
  yield takeLatest(fetchexcelStatusRequest.type, fetchexcelStatusWorker);
}
