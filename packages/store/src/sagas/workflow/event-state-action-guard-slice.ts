import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Export the interface so it can be used elsewhere
export interface AttendanceState {
  workflowEvents: any[];
  workflowActions: any[];
  workflowGuards: any[]; // Fixed spelling from "Gards" to "Guards"
  workflowStates: any[];
  loading: {
    events: boolean;
    actions: boolean;
    guards: boolean;
    states: boolean;
  };
  error: {
    events: string | null;
    actions: string | null;
    guards: string | null;
    states: string | null;
  };
}

const initialState: AttendanceState = {
  workflowEvents: [],
  workflowActions: [],
  workflowGuards: [],
  workflowStates: [],
  loading: {
    events: false,
    actions: false,
    guards: false,
    states: false,
  },
  error: {
    events: null,
    actions: null,
    guards: null,
    states: null,
  },
};

export const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    // Workflow States
    fetchWorkflowStatesRequest: (state) => {
      state.loading.states = true;
      state.error.states = null;
    },
    fetchWorkflowStatesSuccess: (state, action: PayloadAction<any[]>) => {
      state.loading.states = false;
      state.workflowStates = action.payload;
    },
    fetchWorkflowStatesFailure: (state, action: PayloadAction<string>) => {
      state.loading.states = false;
      state.error.states = action.payload;
    },

    // Workflow Events
    fetchWorkflowEventsRequest: (state) => {
      state.loading.events = true;
      state.error.events = null;
    },
    fetchWorkflowEventsSuccess: (state, action: PayloadAction<any[]>) => {
      state.loading.events = false;
      state.workflowEvents = action.payload;
    },
    fetchWorkflowEventsFailure: (state, action: PayloadAction<string>) => {
      state.loading.events = false;
      state.error.events = action.payload;
    },

    // Workflow Actions
    fetchWorkflowActionsRequest: (state) => {
      state.loading.actions = true;
      state.error.actions = null;
    },
    fetchWorkflowActionsSuccess: (state, action: PayloadAction<any[]>) => {
      state.loading.actions = false;
      state.workflowActions = action.payload;
    },
    fetchWorkflowActionsFailure: (state, action: PayloadAction<string>) => {
      state.loading.actions = false;
      state.error.actions = action.payload;
    },

    // Workflow Guards
    fetchWorkflowGuardsRequest: (state) => {
      state.loading.guards = true;
      state.error.guards = null;
    },
    fetchWorkflowGuardsSuccess: (state, action: PayloadAction<any[]>) => {
      state.loading.guards = false;
      state.workflowGuards = action.payload;
    },
    fetchWorkflowGuardsFailure: (state, action: PayloadAction<string>) => {
      state.loading.guards = false;
      state.error.guards = action.payload;
    },
  },
});

export const {
  fetchWorkflowEventsRequest,
  fetchWorkflowEventsSuccess,
  fetchWorkflowEventsFailure,
  fetchWorkflowActionsRequest,
  fetchWorkflowActionsSuccess,
  fetchWorkflowActionsFailure,
  fetchWorkflowGuardsRequest,
  fetchWorkflowGuardsSuccess,
  fetchWorkflowGuardsFailure,
  fetchWorkflowStatesRequest,
  fetchWorkflowStatesFailure,
  fetchWorkflowStatesSuccess,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;