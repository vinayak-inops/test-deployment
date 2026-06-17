import { call, put, takeLatest } from "redux-saga/effects";
import axios from "axios";
import {
  fetchExcelTemplatesRequest,
  fetchExcelTemplatesSuccess,
  fetchExcelTemplatesFailure,
} from "./excel-templates-slice";
import { PayloadAction } from "@reduxjs/toolkit";

// API Call Function
function fetchExcelTemplatesApi(url: string) {
  return axios.get(url);
}

// Worker Saga for Excel Upload Templatesuration
function* fetchExcelTemplatesWorker(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    const response = yield call(fetchExcelTemplatesApi, action.payload);
    yield put(fetchExcelTemplatesSuccess(response.data));
  } catch (error: any) {
    yield put(fetchExcelTemplatesFailure(error.message || "Failed to fetch Excel upload Templates"));
  }
}

// Watcher Saga
export function* watchFetchExcelTemplates() {
  yield takeLatest(fetchExcelTemplatesRequest.type, fetchExcelTemplatesWorker);
}
