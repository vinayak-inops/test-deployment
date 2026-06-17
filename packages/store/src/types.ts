export interface RootState {
  auth: AuthState;
  // Add more state slices as needed
}

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
}
export interface User {
  id: number
  name: string
  email: string
  website: string
}

export interface UsersState {
  users: User[]
  loading: boolean
  error: string | null
}


export interface User {
  id: number;
  name: string;
  email: string;
  // other user properties
}

export interface WorkflowEvent {
  id: number;
  name: string;
  // other workflow event properties
}

export interface WorkflowAction {
  id: number;
  name: string;
  // other workflow action properties
}

export interface WorkflowGuard {
  id: number;
  name: string;
  // other workflow gard properties
}

export interface UsersState {
  users: User[];
  loading: boolean;
  error: null | string;
}

export interface AttendanceState {
  workflowEvents: WorkflowEvent[];
  workflowActions: WorkflowAction[];
  workflowGards: WorkflowGuard[];
  workflowStates:any[]
  loading: {
    events: boolean;
    actions: boolean;
    gards: boolean;
  };
  error: {
    events: null | string;
    actions: null | string;
    gards: null | string;
  };
}

