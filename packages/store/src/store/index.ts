import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import workflowReducer from "../slices/features/work-flow/create-work-flow/workflow-slice";
import sidebarReducer from "../slices/sidebar/sidebar-slice";
import apiReducer from "../sagas/api-call/api-slice";
import rootSaga from "../sagas/rootSaga";
import excelStatusReducer from "../sagas/master/excel-upload/excelStatus/excel-status-slice";
import excelConfigReducer from "../sagas/master/excel-upload/templates/excel-templates-slice";
import hierarchyReducer from "../sagas/hierarchy/hierarchy-slice";

// Create the Redux Saga middleware
const sagaMiddleware = createSagaMiddleware();

// Configure the Redux store
export const store = configureStore({
  reducer: {
    sidebar: sidebarReducer,
    workflow: workflowReducer,
    api: apiReducer,
    excelStatus: excelStatusReducer,
    excelConfig: excelConfigReducer,
    hierarchy: hierarchyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false, // Disable thunk since we are using saga
      serializableCheck: false, // Prevents warnings for non-serializable values
    }).concat(sagaMiddleware),
  devTools: process.env.NODE_ENV !== "production", // Enable Redux DevTools in development mode
});

// Run the root saga
sagaMiddleware.run(rootSaga);

// Define TypeScript types for store state and dispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;