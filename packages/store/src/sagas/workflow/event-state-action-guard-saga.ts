import { call, put, takeLatest } from "redux-saga/effects";
import {
  fetchWorkflowEventsSuccess,
  fetchWorkflowEventsFailure,
  fetchWorkflowActionsSuccess,
  fetchWorkflowActionsFailure,
  fetchWorkflowGuardsSuccess, // Fixed spelling
  fetchWorkflowGuardsFailure, // Fixed spelling
  fetchWorkflowStatesSuccess,
  fetchWorkflowStatesFailure,
  fetchWorkflowEventsRequest,
  fetchWorkflowActionsRequest,
  fetchWorkflowGuardsRequest, // Fixed spelling
  fetchWorkflowStatesRequest
} from "./event-state-action-guard-slice";
import type { WorkflowEvent, WorkflowAction, WorkflowGuard } from "../../types"; 

const API_BASE_URL = "http://192.168.1.23:8080/api/query/attendance";

function* fetchWorkflowStates() {
  try {
    const response: Response = yield call(fetch, `${API_BASE_URL}/workflowstate`);
   
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
   
    const states: any[] = yield response.json(); // Changed type to match what you're returning
    yield put(fetchWorkflowStatesSuccess(states));
  } catch (error) {
    yield put(fetchWorkflowStatesFailure(error instanceof Error ? error.message : "Failed to fetch workflow states"));
  }
}

function* fetchWorkflowEvents() {
  try {
    const response: Response = yield call(fetch, `${API_BASE_URL}/workflowevent`);
   
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
   
    const events: WorkflowEvent[] = yield response.json();
    yield put(fetchWorkflowEventsSuccess(events));
  } catch (error) {
    yield put(fetchWorkflowEventsFailure(error instanceof Error ? error.message : "Failed to fetch workflow events"));
  }
}

function* fetchWorkflowActions() {
  try {
    const response: Response = yield call(fetch, `${API_BASE_URL}/workflowaction`);
   
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
   
    const actions: WorkflowAction[] = yield response.json();
    yield put(fetchWorkflowActionsSuccess(actions));
  } catch (error) {
    yield put(fetchWorkflowActionsFailure(error instanceof Error ? error.message : "Failed to fetch workflow actions"));
  }
}

function* fetchWorkflowGuards() { // Fixed function name
  try {
    const response: Response = yield call(fetch, `${API_BASE_URL}/workflowguard`);
   
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
   
    const guards: WorkflowGuard[] = yield response.json(); // Fixed variable name
    yield put(fetchWorkflowGuardsSuccess(guards)); // Fixed action name
  } catch (error) {
    yield put(fetchWorkflowGuardsFailure(error instanceof Error ? error.message : "Failed to fetch workflow guards")); // Fixed error message
  }
}

export function* attendanceSaga() {
  // Use the actual action creator functions rather than string literals
  yield takeLatest(fetchWorkflowEventsRequest.type, fetchWorkflowEvents);
  yield takeLatest(fetchWorkflowActionsRequest.type, fetchWorkflowActions);
  yield takeLatest(fetchWorkflowGuardsRequest.type, fetchWorkflowGuards); // Fixed action name
  yield takeLatest(fetchWorkflowStatesRequest.type, fetchWorkflowStates);
}